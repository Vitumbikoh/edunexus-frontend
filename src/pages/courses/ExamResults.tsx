import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PrinterIcon, Eye, GraduationCap, Calendar } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface Class {
  id: string;
  name: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
}

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

interface StudentResults {
  student: Student;
  results: ExamResult[];
  overallGPA: number;
  totalExams: number;
}

const ExamResults = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  
  const [studentResults, setStudentResults] = useState<StudentResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const academicYears = ['2023-2024', '2024-2025', '2025-2026'];
  const terms = ['First Term', 'Second Term', 'Third Term'];

  // Mock data - replace with actual API calls
  useEffect(() => {
    // Mock classes
    setClasses([
      { id: '1', name: 'Class 1A' },
      { id: '2', name: 'Class 2B' },
      { id: '3', name: 'Class 3C' },
    ]);
  }, []);

  useEffect(() => {
    if (selectedClass) {
      // Mock courses based on class
      setCourses([
        { id: '1', name: 'Mathematics', code: 'MATH101' },
        { id: '2', name: 'English Literature', code: 'ENG101' },
        { id: '3', name: 'Science', code: 'SCI101' },
      ]);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedCourse && selectedYear && selectedTerm) {
      // Mock students
      setStudents([
        { id: '1', firstName: 'John', lastName: 'Doe', studentId: 'STU001' },
        { id: '2', firstName: 'Jane', lastName: 'Smith', studentId: 'STU002' },
        { id: '3', firstName: 'Mike', lastName: 'Johnson', studentId: 'STU003' },
      ]);
    }
  }, [selectedClass, selectedCourse, selectedYear, selectedTerm]);

  const fetchStudentResults = async () => {
    if (!selectedStudent) return;

    setIsLoading(true);
    try {
      // Mock student results - replace with actual API call
      const mockResults: StudentResults = {
        student: students.find(s => s.id === selectedStudent)!,
        results: [
          {
            id: '1',
            examTitle: 'Midterm Examination',
            subject: 'Mathematics',
            marksObtained: 85,
            totalMarks: 100,
            percentage: 85,
            grade: 'A',
            date: '2024-03-15',
            examType: 'Midterm'
          },
          {
            id: '2',
            examTitle: 'Quiz 1',
            subject: 'Mathematics',
            marksObtained: 78,
            totalMarks: 100,
            percentage: 78,
            grade: 'B+',
            date: '2024-02-20',
            examType: 'Quiz'
          },
          {
            id: '3',
            examTitle: 'Final Examination',
            subject: 'Mathematics',
            marksObtained: 92,
            totalMarks: 100,
            percentage: 92,
            grade: 'A+',
            date: '2024-04-10',
            examType: 'Final'
          }
        ],
        overallGPA: 3.8,
        totalExams: 3
      };
      
      setStudentResults(mockResults);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch student results',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentResults();
    }
  }, [selectedStudent]);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'B+':
      case 'B':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'C+':
      case 'C':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'D':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'F':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const generateReportCard = () => {
    if (!studentResults) return;

    const printWindow = window.open('', '_blank');
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
              <div class="school-name">SchoolPortal Academy</div>
              <div class="report-title">Student Academic Report Card</div>
            </div>
            
            <div class="student-info">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Student Name:</span>
                  <span>${studentResults.student.firstName} ${studentResults.student.lastName}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Student ID:</span>
                  <span>${studentResults.student.studentId}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Class:</span>
                  <span>${classes.find(c => c.id === selectedClass)?.name || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Academic Year:</span>
                  <span>${selectedYear}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Term:</span>
                  <span>${selectedTerm}</span>
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
                  ${studentResults.results.map(result => `
                    <tr>
                      <td>${result.examTitle}</td>
                      <td>${result.subject}</td>
                      <td>${result.examType}</td>
                      <td>${new Date(result.date).toLocaleDateString()}</td>
                      <td>${result.marksObtained}/${result.totalMarks}</td>
                      <td>${result.percentage}%</td>
                      <td><span class="grade-badge grade-${result.grade.toLowerCase().replace('+', '')}">${result.grade}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div class="summary">
                <div class="summary-grid">
                  <div class="summary-item">
                    <div class="summary-value">${studentResults.overallGPA.toFixed(1)}</div>
                    <div class="summary-label">Overall GPA</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-value">${studentResults.totalExams}</div>
                    <div class="summary-label">Total Exams</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-value">${Math.round(studentResults.results.reduce((sum, r) => sum + r.percentage, 0) / studentResults.results.length)}%</div>
                    <div class="summary-label">Average Score</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="footer">
              This report card was generated electronically by SchoolPortal Academy Management System.<br>
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
          <h1 className="text-3xl font-bold tracking-tight">View Exam Results</h1>
          <p className="text-muted-foreground">Select filters to view student examination results</p>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              <label className="text-sm font-medium">Course</label>
              <Select 
                value={selectedCourse} 
                onValueChange={setSelectedCourse}
                disabled={!selectedClass}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name} ({course.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Academic Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Term</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={term} value={term}>
                      {term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Student</label>
              <Select 
                value={selectedStudent} 
                onValueChange={setSelectedStudent}
                disabled={!selectedClass || !selectedCourse || !selectedYear || !selectedTerm}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName} ({student.studentId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {studentResults && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Exam Results for {studentResults.student.firstName} {studentResults.student.lastName}
              </CardTitle>
              <Button onClick={generateReportCard} className="gap-2">
                <PrinterIcon className="h-4 w-4" />
                Print Report Card
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{studentResults.overallGPA.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Overall GPA</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{studentResults.totalExams}</div>
                  <div className="text-sm text-muted-foreground">Total Exams</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {Math.round(studentResults.results.reduce((sum, r) => sum + r.percentage, 0) / studentResults.results.length)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Average Score</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border p-3 text-left">Exam Title</th>
                      <th className="border border-border p-3 text-left">Subject</th>
                      <th className="border border-border p-3 text-left">Type</th>
                      <th className="border border-border p-3 text-left">Date</th>
                      <th className="border border-border p-3 text-left">Marks</th>
                      <th className="border border-border p-3 text-left">Percentage</th>
                      <th className="border border-border p-3 text-left">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentResults.results.map((result) => (
                      <tr key={result.id} className="hover:bg-muted/50">
                        <td className="border border-border p-3">{result.examTitle}</td>
                        <td className="border border-border p-3">{result.subject}</td>
                        <td className="border border-border p-3">{result.examType}</td>
                        <td className="border border-border p-3">
                          {new Date(result.date).toLocaleDateString()}
                        </td>
                        <td className="border border-border p-3">
                          {result.marksObtained}/{result.totalMarks}
                        </td>
                        <td className="border border-border p-3">{result.percentage}%</td>
                        <td className="border border-border p-3">
                          <Badge className={cn("text-xs", getGradeColor(result.grade))}>
                            {result.grade}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedClass && selectedCourse && selectedYear && selectedTerm && !selectedStudent && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Please select a student to view their exam results.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExamResults;