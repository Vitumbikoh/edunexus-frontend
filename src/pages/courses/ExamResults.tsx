import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PrinterIcon, Eye, GraduationCap, Calendar, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import ReportCard from "@/components/reports/ReportCard";
import { academicCalendarService, AcademicCalendar } from "@/services/academicCalendarService";
import { termService, Term } from "@/services/termService";
import { classService, Class } from "@/services/classService";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
}

interface ExamResult {
  id: string;
  examTitle: string;
  subject: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  date: string;
  examType: string;
}

interface StudentResult {
  student: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
  };
  results: ExamResult[];
  totalMarks: number;
  totalPossible: number;
  averageScore: number;
  overallGPA: number;
  totalExams: number;
  remarks: string;
}

interface AllStudentsResults {
  classInfo: Class;
  students: StudentResult[];
}

interface AllStudentsResults {
  classInfo: Class;
  students: StudentResult[];
}

const ExamResults = () => {
  const { token } = useAuth();
  const { toast } = useToast();

  const [classes, setClasses] = useState<Class[]>([]);
  const [academicCalendars, setAcademicCalendars] = useState<AcademicCalendar[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedAcademicCalendar, setSelectedAcademicCalendar] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [searchPeriod, setSearchPeriod] = useState<string>("");

  const [studentResults, setStudentResults] = useState<StudentResult | null>(
    null
  );
  const [allStudentsResults, setAllStudentsResults] =
    useState<AllStudentsResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [termActionLoading, setTermActionLoading] = useState({ enter:false, publish:false });
  const [termActionState, setTermActionState] = useState<{enteredExam?:boolean; resultsPublished?:boolean}>({});

  // Fetch all initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);

        // Fetch classes
        const classesResponse = await classService.getClasses(token!);
        setClasses(classesResponse);

        // Fetch academic calendars
        const calendarsResponse = await academicCalendarService.getAcademicCalendars(token!);
        setAcademicCalendars(calendarsResponse);

        // Fetch academic years
        const yearsResponse = await termService.getTerms(token!);
        setTerms(yearsResponse);

      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch initial data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchInitialData();
    }
  }, [token, toast]);

  // Filter academic years based on selected calendar
  const filteredTerms = selectedAcademicCalendar 
    ? terms.filter(year => {
        // If you have a relationship between calendar and years, filter here
        // For now, show all academic years when a calendar is selected
        return true;
      })
    : [];

  // Auto-select active/current academic year when calendar changes
  useEffect(() => {
    if (selectedAcademicCalendar && filteredTerms.length > 0) {
      const currentYear = filteredTerms.find(year => 
        year.isActive || year.isCurrent || year.current
      );
      if (currentYear && !selectedTerm) {
        setSelectedTerm(currentYear.id);
      }
    } else {
      setSelectedTerm("");
    }
  }, [selectedAcademicCalendar, filteredTerms]);

  // Reset dependent selections when parent selections change
  useEffect(() => {
    setSelectedAcademicCalendar("");
    setSelectedTerm("");
    setSelectedStudentId("");
    setSearchPeriod("");
  }, [selectedClass]);

  useEffect(() => {
    setSelectedTerm("");
    setSelectedStudentId("");
    setSearchPeriod("");
  }, [selectedAcademicCalendar]);

  useEffect(() => {
    setSelectedStudentId("");
    setSearchPeriod("");
  }, [selectedTerm]);

  const handleEnterExamPeriod = async () => {
    if (!selectedTerm) return;
    try {
      setTermActionLoading(p=>({...p, enter:true}));
      await termService.enterExamPeriod(selectedTerm, token!);
      setTermActionState(s=>({...s, enteredExam:true}));
      toast({ title:'Exam Period Started', description:'Term is now in exam period.' });
    } catch (e:any) {
      toast({ title:'Error', description:e.message || 'Failed to enter exam period', variant:'destructive' });
    } finally {
      setTermActionLoading(p=>({...p, enter:false}));
    }
  };

  const handlePublishResults = async () => {
    if (!selectedTerm) return;
    try {
      setTermActionLoading(p=>({...p, publish:true}));
      await termService.publishResults(selectedTerm, token!);
      setTermActionState(s=>({...s, resultsPublished:true}));
      toast({ title:'Results Published', description:'Exam results have been published.' });
    } catch (e:any) {
      toast({ title:'Error', description:e.message || 'Failed to publish results', variant:'destructive' });
    } finally {
      setTermActionLoading(p=>({...p, publish:false}));
    }
  };

  // Filter students based on search period
  useEffect(() => {
    if (!searchPeriod.trim()) {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => 
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchPeriod.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchPeriod.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [students, searchPeriod]);

  // Fetch students when class, academic calendar, and academic year are selected
  useEffect(() => {
    if (selectedClass && selectedAcademicCalendar && selectedTerm) {
      const fetchStudents = async () => {
        try {
          setIsLoading(true);
          // Fetch students for the selected class
          const response = await fetch(
            `http://localhost:5000/api/v1/grades/classes/${selectedClass}/students?academicCalendarId=${selectedAcademicCalendar}&termId=${selectedTerm}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!response.ok) throw new Error("Failed to fetch students");
          const data = await response.json();
          console.log("Fetched students:", data);
          setStudents(data);
          
          // Reset selected student when students change
          setSelectedStudentId("");
          
          if (data.length === 0) {
            toast({
              title: "No Students",
              description: "No students are enrolled in this class for the selected academic calendar and year.",
              variant: "default",
            });
          }
        } catch (error) {
          console.error('Error fetching students:', error);
          toast({
            title: "Error",
            description: "Failed to fetch students",
            variant: "destructive",
          });
          setStudents([]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchStudents();
    } else {
      // Clear students if any filter is not selected
      setStudents([]);
      setSelectedStudentId("");
    }
  }, [selectedClass, selectedAcademicCalendar, selectedTerm, token, toast]);

  const fetchAllStudentsResults = async () => {
    if (!selectedClass || !selectedAcademicCalendar || !selectedTerm) return;

    setIsLoading(true);
    try {
      // Fetch all students results with new filter parameters
      const response = await fetch(
        `http://localhost:5000/api/v1/grades/class/${selectedClass}?academicCalendarId=${selectedAcademicCalendar}&termId=${selectedTerm}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error("Failed to fetch students results");
      const data = await response.json();
      console.log("All students results:", data);
      setAllStudentsResults(data);
      if (data.students.length === 0) {
        toast({
          title: "No Results",
          description: "No grades recorded for this class and academic period.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error fetching all students results:', error);
      toast({
        title: "Error",
        description: "Failed to fetch students results",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass && selectedAcademicCalendar && selectedTerm && !selectedStudentId) {
      fetchAllStudentsResults();
    }
  }, [selectedClass, selectedAcademicCalendar, selectedTerm, students]);

  const fetchStudentResults = async () => {
    if (!selectedStudentId || !selectedClass || !selectedAcademicCalendar || !selectedTerm) return;

    setIsLoading(true);
    try {
      // First get the student details to ensure we have the correct studentId
      const student = students.find((s) => s.id === selectedStudentId);
      if (!student) {
        throw new Error("Student not found");
      }

      // Use the student ID with academic calendar and year parameters
      const response = await fetch(
        `http://localhost:5000/api/v1/grades/student/${selectedStudentId}?classId=${selectedClass}&academicCalendarId=${selectedAcademicCalendar}&termId=${selectedTerm}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error("Failed to fetch student results");
      const data = await response.json();
      setStudentResults(data);
      if (data.results.length === 0) {
        toast({
          title: "No Results",
          description:
            "No grades recorded for this student in the selected class and academic period.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error fetching student results:', error);
      toast({
        title: "Error",
        description:
          "Failed to fetch student results. Ensure the student is enrolled in the class and grades are recorded.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentResults();
    }
  }, [selectedStudentId]);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A+":
      case "A":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "B+":
      case "B":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "C+":
      case "C":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "D":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "F":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const generateReportCard = () => {
    if (!studentResults || !studentResults.results.length) {
      toast({
        title: "No Results",
        description: "No results available to generate a report card.",
        variant: "destructive",
      });
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Student Report Card</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Times New Roman', serif; 
              background: #f8f9fa;
              padding: 20px;
            }
            .report-card {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border: 3px solid #2c3e50;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #2c3e50, #34495e);
              color: white;
              padding: 30px;
              text-align: center;
              position: relative;
            }
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 5px;
              background: linear-gradient(90deg, #e74c3c, #f39c12, #f1c40f, #27ae60, #3498db, #9b59b6);
            }
            .school-name {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 5px;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .report-title {
              font-size: 18px;
              font-weight: normal;
              opacity: 0.9;
            }
            .student-info {
              padding: 25px;
              background: #ecf0f1;
              border-bottom: 2px solid #bdc3c7;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            .info-item {
              display: flex;
              align-items: center;
            }
            .info-label {
              font-weight: bold;
              color: #2c3e50;
              min-width: 120px;
            }
            .results-section {
              padding: 25px;
            }
            .section-title {
              font-size: 20px;
              font-weight: bold;
              color: #2c3e50;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 2px solid #3498db;
            }
            .results-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 25px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .results-table th {
              background: #3498db;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: bold;
            }
            .results-table td {
              padding: 12px;
              border-bottom: 1px solid #ecf0f1;
            }
            .results-table tr:hover {
              background: #f8f9fa;
            }
            .grade-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-weight: bold;
              font-size: 12px;
            }
            .grade-a { background: #27ae60; color: white; }
            .grade-b { background: #3498db; color: white; }
            .grade-c { background: #f39c12; color: white; }
            .grade-d { background: #e67e22; color: white; }
            .grade-f { background: #e74c3c; color: white; }
            .summary {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin-top: 20px;
              border-left: 5px solid #3498db;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
            }
            .summary-item {
              text-align: center;
              padding: 15px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .summary-value {
              font-size: 24px;
              font-weight: bold;
              color: #2c3e50;
            }
            .summary-label {
              font-size: 12px;
              color: #7f8c8d;
              text-transform: uppercase;
            }
            .footer {
              padding: 20px;
              text-align: center;
              background: #ecf0f1;
              color: #7f8c8d;
              font-size: 12px;
              border-top: 1px solid #bdc3c7;
            }
            @media print {
              body { background: white; padding: 0; }
              .report-card { box-shadow: none; border: 2px solid #2c3e50; }
            }
          </style>
        </head>
        <body>
          <div class="report-card">
            <div class="header">
              <div class="school-name">Schomas Academy</div>
              <div class="report-title">Student Academic Report Card</div>
            </div>
            
            <div class="student-info">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Student Name:</span>
                  <span>${studentResults?.student.firstName} ${
      studentResults?.student.lastName
    }</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Student ID:</span>
                  <span>${studentResults?.student.studentId}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Class:</span>
                  <span>${
                    classes.find((c) => c.id === selectedClass)?.name || "N/A"
                  }</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Academic Calendar:</span>
                  <span>${academicCalendars.find((c) => c.id === selectedAcademicCalendar)?.term || "N/A"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Academic Year:</span>
                  <span>${terms.find((y) => y.id === selectedTerm)?.name || "N/A"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Generated:</span>
                  <span>${new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div class="results-section">
              <div class="section-title">Examination Results</div>
              <table class="results-table">
                <thead>
                  <tr>
                    <th>Exam</th>
                    <th>Subject</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Marks</th>
                    <th>Percentage</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    studentResults?.results
                      .map(
                        (result) => `
                    <tr>
                      <td>${result.examTitle}</td>
                      <td>${result.subject}</td>
                      <td>${result.examType}</td>
                      <td>${new Date(result.date).toLocaleDateString()}</td>
                      <td>${result.marksObtained}/${result.totalMarks}</td>
                      <td>${result.percentage}%</td>
                      <td><span class="grade-badge grade-${result.grade
                        .toLowerCase()
                        .replace("+", "")}">${result.grade}</span></td>
                    </tr>
                  `
                      )
                      .join("") || ""
                  }
                </tbody>
              </table>
              
              <div class="summary">
                <div class="summary-grid">
                  <div class="summary-item">
                    <div class="summary-value">${
                      studentResults?.overallGPA.toFixed(1) || "0.0"
                    }</div>
                    <div class="summary-label">Overall GPA</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-value">${
                      studentResults?.totalExams || 0
                    }</div>
                    <div class="summary-label">Total Exams</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-value">${
                      studentResults?.results.length
                        ? Math.round(
                            studentResults.results.reduce(
                              (sum, r) => sum + r.percentage,
                              0
                            ) / studentResults.results.length
                          )
                        : 0
                    }%</div>
                    <div class="summary-label">Average Score</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="footer">
              This report card was generated electronically by Schomas Academy Management System.<br>
              For any inquiries, please contact the academic office.
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(reportHTML);
    printWindow.document.close();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <GraduationCap className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            View Exam Results
          </h1>
          <p className="text-muted-foreground">
            Select filters to view student examination results
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filter Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading data...</p>
              </div>
            </div>
          )}
          
          {!isLoading && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Academic Calendar</label>
              <Select 
                value={selectedAcademicCalendar} 
                onValueChange={setSelectedAcademicCalendar}
                disabled={!selectedClass}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select academic calendar" />
                </SelectTrigger>
                <SelectContent>
                  {academicCalendars.map((calendar) => (
                    <SelectItem key={calendar.id} value={calendar.id!}>
                      {calendar.term} {calendar.isActive && "(Current)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Academic Year</label>
              <Select 
                value={selectedTerm} 
                onValueChange={setSelectedTerm}
                disabled={!selectedAcademicCalendar}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTerms.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name} {(year.isActive || year.isCurrent || year.current) && "(Current)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Student</label>
              <Select
                value={selectedStudentId}
                onValueChange={setSelectedStudentId}
                disabled={
                  !selectedClass ||
                  !selectedAcademicCalendar ||
                  !selectedTerm ||
                  filteredStudents.length === 0
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      filteredStudents.length === 0
                        ? "No students available"
                        : "Select a student"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredStudents.map((student) => (
                    <SelectItem
                      key={student.id}
                      value={student.id}
                    >
                      {student.firstName} {student.lastName} (
                      {student.studentId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Field */}
          {students.length > 0 && (
            <div className="mt-6 space-y-2">
              <label className="text-sm font-medium">Search Students</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by student name or ID..."
                  value={searchPeriod}
                  onChange={(e) => setSearchPeriod(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchPeriod && (
                <p className="text-sm text-muted-foreground">
                  Showing {filteredStudents.length} of {students.length} students
                </p>
              )}
            </div>
          )}

          {/* Term Exam Actions */}
          {selectedClass && selectedAcademicCalendar && selectedTerm && (
            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEnterExamPeriod}
                disabled={termActionLoading.enter || termActionState.enteredExam}
              >
                {termActionLoading.enter ? 'Processing...' : termActionState.enteredExam ? 'Exam Period Active' : 'Enter Exam Period'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePublishResults}
                disabled={termActionLoading.publish || !termActionState.enteredExam || termActionState.resultsPublished}
              >
                {termActionLoading.publish ? 'Publishing...' : termActionState.resultsPublished ? 'Results Published' : 'Publish Results'}
              </Button>
            </div>
          )}

          {/* Reset Filters Button */}
          {(selectedClass || selectedAcademicCalendar || selectedTerm || selectedStudentId || searchPeriod) && (
            <div className="mt-6 flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedClass("");
                  setSelectedAcademicCalendar("");
                  setSelectedTerm("");
                  setSelectedStudentId("");
                  setSearchPeriod("");
                  setStudents([]);
                  setStudentResults(null);
                  setAllStudentsResults(null);
                }}
              >
                Reset All Filters
              </Button>
            </div>
          )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Status Messages */}
      {!selectedClass && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Get Started</h3>
              <p>Select a class to begin viewing exam results</p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedClass && !selectedAcademicCalendar && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Select Academic Calendar</h3>
              <p>Choose an academic calendar to continue</p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedClass && selectedAcademicCalendar && !selectedTerm && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Select Academic Year</h3>
              <p>Choose an academic year to continue</p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedClass && selectedAcademicCalendar && selectedTerm && students.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Students Found</h3>
              <p>No students are enrolled in this class for the selected academic period</p>
            </div>
          </CardContent>
        </Card>
      )}

      {studentResults && (
        <ReportCard
          title={`Exam Results for ${studentResults.student.firstName} ${studentResults.student.lastName}`}
          action={
            <Button onClick={generateReportCard} className="gap-2">
              <PrinterIcon className="h-4 w-4" />
              Print Report Card
            </Button>
          }
          summary={[
            { label: "Overall GPA", value: studentResults.overallGPA.toFixed(1) },
            { label: "Total Exams", value: studentResults.totalExams },
            {
              label: "Average Score",
              value: `${studentResults.results.length ? Math.round(studentResults.results.reduce((sum, r) => sum + r.percentage, 0) / studentResults.results.length) : 0}%`,
            },
          ]}
          columns={[
            "Exam Title",
            "Subject",
            "Type",
            "Date",
            "Marks",
            "Percentage",
            "Grade",
          ]}
          rows={
            studentResults.results.length
              ? studentResults.results.map((result) => ({
                  key: result.id,
                  cells: [
                    result.examTitle,
                    result.subject,
                    result.examType,
                    new Date(result.date).toLocaleDateString(),
                    `${result.marksObtained}/${result.totalMarks}`,
                    `${result.percentage}%`,
                    (
                      <Badge className={cn("text-xs", getGradeColor(result.grade))}>
                        {result.grade}
                      </Badge>
                    ),
                  ],
                }))
              : []
          }
          emptyMessage="No results available for this student."
        />
      )}

      {allStudentsResults && !selectedStudentId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              All Students' Exam Results - {allStudentsResults.classInfo.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-3 text-left">
                      Student ID
                    </th>
                    <th className="border border-border p-3 text-left">
                      Student Name
                    </th>
                    <th className="border border-border p-3 text-left">
                      Average Score
                    </th>
                    <th className="border border-border p-3 text-left">
                      Overall GPA
                    </th>
                    <th className="border border-border p-3 text-left">
                      Total Exams
                    </th>
                    <th className="border border-border p-3 text-left">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allStudentsResults.students.length ? (
                    allStudentsResults.students.map((studentResult) => (
                      <tr
                        key={studentResult.student.id}
                        className="hover:bg-muted/50"
                      >
                        <td className="border border-border p-3 font-medium">
                          {studentResult.student.studentId}
                        </td>
                        <td className="border border-border p-3">
                          {studentResult.student.firstName}{" "}
                          {studentResult.student.lastName}
                        </td>
                        <td className="border border-border p-3">
                          <Badge variant="secondary">
                            {Math.round(studentResult.averageScore)}%
                          </Badge>
                        </td>
                        <td className="border border-border p-3">
                          <Badge variant="outline">
                            {studentResult.overallGPA.toFixed(1)}
                          </Badge>
                        </td>
                        <td className="border border-border p-3">
                          {studentResult.results.length}
                        </td>
                        <td className="border border-border p-3 text-muted-foreground">
                          {studentResult.remarks}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="border border-border p-3 text-center text-muted-foreground"
                      >
                        No students enrolled or no grades recorded for this
                        class.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedClass &&
        selectedAcademicCalendar &&
        selectedTerm &&
        !selectedStudentId &&
        !allStudentsResults && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                {isLoading
                  ? "Loading students results..."
                  : "No results available for this class. Select a student to view individual results."}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
};

export default ExamResults;
