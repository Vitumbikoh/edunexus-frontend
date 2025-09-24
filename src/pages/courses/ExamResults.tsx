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
import { PrinterIcon, Eye, GraduationCap, Calendar, Search, FileText, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import ReportCard from "@/components/reports/ReportCard";
import { academicCalendarService, AcademicCalendar } from "@/services/academicCalendarService";
import { termService, Term } from "@/services/termService";
import { classService, Class } from "@/services/classService";
import { ExamResultService, StudentExamResult, ClassExamResults } from "@/services/examResultService";
import { schoolSettingsService, SchoolSettings } from "@/services/schoolSettingsService";
import { API_CONFIG } from "@/config/api";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
}

// Legacy interface for backward compatibility with individual exam grades
interface ExamResult {
  id?: string;
  gradeId?: string;
  examTitle: string;
  subject: string;
  courseName?: string;
  courseCode?: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  date: string;
  examType: string;
  termId?: string;
  examStatus?: string;
}

// Updated interface for aggregated exam results
interface CourseExamResult {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  termId: string;
  termName: string;
  finalPercentage: number;
  finalGradeCode: string;
  pass: boolean;
  breakdown?: any;
  computedAt: Date;
  schemeVersion: number;
}

interface StudentResult {
  student: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
  };
  summary?: {
    totalResults: number;
    averageScore: number;
    overallGPA: number;
    remarks: string;
    totalMarks: number;
    totalPossible: number;
  };
  results: CourseExamResult[];
  // Legacy fields for backward compatibility
  totalMarks?: number;
  totalPossible?: number;
  averageScore?: number;
  overallGPA?: number;
  totalExams?: number;
  remarks?: string;
  hiddenResults?: number;
}

interface AllStudentsResults {
  classInfo: {
    id: string;
    name: string;
  };
  students: StudentResult[];
  summary?: {
    totalStudents: number;
    studentsWithResults: number;
  };
}

const ExamResults = () => {
  const { token } = useAuth();
  const { toast } = useToast();

  // Data collections
  const [classes, setClasses] = useState<Class[]>([]);
  const [academicCalendars, setAcademicCalendars] = useState<AcademicCalendar[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

  // Filter selections
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedAcademicCalendar, setSelectedAcademicCalendar] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [searchPeriod, setSearchPeriod] = useState("");

  // Global publish selection (independent of filters)
  const [publishTermId, setPublishTermId] = useState("");
  const [publishedTerms, setPublishedTerms] = useState<Record<string, boolean>>({});
  const [publishLoading, setPublishLoading] = useState(false);

  // Results state
  const [studentResults, setStudentResults] = useState<StudentExamResult | null>(null);
  const [allStudentsResults, setAllStudentsResults] = useState<ClassExamResults | null>(null);

  // School settings state
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  // Helper function to load image as base64
  const loadImageAsBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      };
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = url;
    });
  };

  // Helper function to get school logo URL
  const getLogoUrl = (logoPath: string | null): string | null => {
    if (!logoPath) return null;
    return `${API_CONFIG.BASE_URL}/uploads/logos/${logoPath}`;
  };

  // Initial load
  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        setIsLoading(true);
        const [classesResp, calendarsResp, termsResp, settingsResp] = await Promise.all([
          classService.getClasses(token),
          academicCalendarService.getAcademicCalendars(token),
          termService.getTerms(token),
          schoolSettingsService.getSettings(token),
        ]);
        setClasses(classesResp);
        setAcademicCalendars(calendarsResp);
        setTerms(termsResp);
        setSchoolSettings(settingsResp);
      } catch (e) {
        console.error("Error loading initial exam results data", e);
        toast({
          title: "Error",
            description: "Failed to load initial data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [token, toast]);

  // Auto-select active academic calendar when calendars are loaded
  useEffect(() => {
    if (academicCalendars.length > 0 && !selectedAcademicCalendar) {
      const activeCalendar = academicCalendars.find(calendar => calendar.isActive);
      if (activeCalendar) {
        setSelectedAcademicCalendar(activeCalendar.id!);
      }
    }
  }, [academicCalendars, selectedAcademicCalendar]);

  // Terms filtered by chosen academic calendar (currently all if calendar selected)
  // Filter terms by selected academic calendar id if provided
  const filteredTerms = selectedAcademicCalendar
    ? terms.filter(t => !t.academicCalendarId || t.academicCalendarId === selectedAcademicCalendar)
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

  // Global publish (independent of filters)
  const handlePublishResults = async () => {
    if (!publishTermId || !token) return;
    try {
      setPublishLoading(true);
      await termService.publishResults(publishTermId, token);
      setPublishedTerms((prev) => ({ ...prev, [publishTermId]: true }));
      toast({
        title: "Results Published",
        description: "Exam results have been published for the selected academic year.",
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to publish results",
        variant: "destructive",
      });
    } finally {
      setPublishLoading(false);
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
      // Use new ExamResultService for aggregated exam results
      const data = await ExamResultService.getClassResults(
        selectedClass,
        token!,
        undefined, // schoolId - will be handled by backend based on user context
        selectedTerm,
        selectedAcademicCalendar
      );
      
      console.log("All students exam results:", data);
      setAllStudentsResults(data);
      
      if (data.students.length === 0) {
        toast({
          title: "No Results",
          description: "No exam results recorded for this class and academic period.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error fetching all students exam results:', error);
      toast({
        title: "Error",
        description: "Failed to fetch exam results",
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

      // Use new ExamResultService for aggregated exam results
      const data = await ExamResultService.getStudentResults(
        selectedStudentId,
        token!,
        selectedClass,
        selectedTerm,
        selectedAcademicCalendar
      );
      
      console.log("Student exam results:", data);
      setStudentResults(data);
      
      if (data.results.length === 0) {
        toast({
          title: "No Results",
          description:
            "No exam results recorded for this student in the selected class and academic period.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error fetching student exam results:', error);
      toast({
        title: "Error",
        description:
          "Failed to fetch student exam results. Ensure the student is enrolled in the class and results are published.",
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

  // Normalize term display (convert Period N -> Term N, prefer numeric termNumber)
  const formatTerm = (t: Term): string => {
    if (t.termNumber != null) return `Term ${t.termNumber}`;
    const pick = t.periodName || t.name || t.term || "";
    if (!pick) return "Unnamed Term";
    const periodMatch = pick.match(/period\s*(\d+)/i);
    if (periodMatch) return `Term ${periodMatch[1]}`;
    return pick; // Fallback if it already maybe says Term
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
                  <span class="info-label">Term:</span>
                  <span>${(() => { const termObj = terms.find((y) => y.id === selectedTerm); if(!termObj) return "N/A"; const num = (termObj as any).termNumber; if(num!=null) return `Term ${num}`; const pick = termObj.periodName || termObj.name || termObj.term || ''; const m = pick.match(/period\s*(\d+)/i); if(m) return `Term ${m[1]}`; return pick || 'N/A'; })()}</span>
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
                    <th>Course Name</th>
                    <th>Course Code</th>
                    <th>Term</th>
                    <th>Final Percentage</th>
                    <th>Grade</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    studentResults?.results
                      .map(
                        (result) => `
                    <tr>
                      <td>${result.courseName}</td>
                      <td>${result.courseCode}</td>
                      <td>${result.termName}</td>
                      <td>${Math.round(result.finalPercentage)}%</td>
                      <td><span class="grade-badge grade-${(result.finalGradeCode || 'na')
                        .toLowerCase()
                        .replace("+", "")}">${result.finalGradeCode || 'N/A'}</span></td>
                      <td>${result.pass ? 'Pass' : 'Fail'}</td>
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
                      studentResults?.summary?.overallGPA?.toFixed(1) || "0.0"
                    }</div>
                    <div class="summary-label">Overall GPA</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-value">${
                      studentResults?.summary?.totalResults || 0
                    }</div>
                    <div class="summary-label">Total Courses</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-value">${Math.round(studentResults?.summary?.averageScore || 0)}%</div>
                    <div class="summary-label">Average Score</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-value">${studentResults?.summary?.totalMarks || 0}/${studentResults?.summary?.totalPossible || 0}</div>
                    <div class="summary-label">Total Marks</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-value">${studentResults?.summary?.remarks || "No Assessment"}</div>
                    <div class="summary-label">Performance</div>
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

  // Calculate student positions based on average score
  const calculateStudentPositions = (students: any[]) => {
    if (!students || students.length === 0) return [];

    // Sort students by average score in descending order
    const sortedStudents = [...students].sort((a, b) => {
      const scoreA = a.averageScore || 0;
      const scoreB = b.averageScore || 0;
      return scoreB - scoreA;
    });

    // Assign positions, handling ties
    const studentsWithPositions = [];
    for (let i = 0; i < sortedStudents.length; i++) {
      const student = sortedStudents[i];
      let position = i + 1;
      
      // If this student has the same score as the previous one, give them the same position
      if (i > 0) {
        const prevStudent = sortedStudents[i - 1];
        if ((student.averageScore || 0) === (prevStudent.averageScore || 0)) {
          position = studentsWithPositions[i - 1].position;
        }
      }
      
      studentsWithPositions.push({
        ...student,
        position
      });
    }

    return studentsWithPositions;
  };

  const exportToPDF = async () => {
    if (!allStudentsResults || !allStudentsResults.students.length) {
      toast({
        title: "No Data",
        description: "No student results available to export.",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF();
    let yPos = 20;
    
    // Add school logo if available
    if (schoolSettings?.schoolLogo) {
      const logoUrl = getLogoUrl(schoolSettings.schoolLogo);
      console.log('Logo URL:', logoUrl);
      if (logoUrl) {
        try {
          const logoBase64 = await loadImageAsBase64(logoUrl);
          doc.addImage(logoBase64, 'PNG', 20, 10, 30, 30);
          
          // Add title next to logo
          doc.setFontSize(18);
          doc.text(`All Students' Exam Results - ${allStudentsResults.classInfo.name}`, 55, 20);
          yPos = 45;
        } catch (error) {
          console.error('Error loading logo:', error);
          // Fallback to regular title
          doc.setFontSize(18);
          doc.text(`All Students' Exam Results - ${allStudentsResults.classInfo.name}`, 20, 20);
          yPos = 35;
        }
      }
    } else {
      console.log('No school logo found');
      // No logo, use regular title
      doc.setFontSize(18);
      doc.text(`All Students' Exam Results - ${allStudentsResults.classInfo.name}`, 20, 20);
      yPos = 35;
    }
    
    // Add filters info
    doc.setFontSize(12);
    const selectedClassName = classes.find(c => c.id === selectedClass)?.name || '';
    const selectedCalendarName = academicCalendars.find(c => c.id === selectedAcademicCalendar)?.term || '';
    const selectedTermName = terms.find(t => t.id === selectedTerm)?.name || '';
    
    doc.text(`Class: ${selectedClassName}`, 20, yPos);
    yPos += 7;
    doc.text(`Academic Calendar: ${selectedCalendarName}`, 20, yPos);
    yPos += 7;
    doc.text(`Term: ${selectedTermName}`, 20, yPos);
    yPos += 15;

    // Prepare table data
    const studentsWithPositions = calculateStudentPositions(allStudentsResults.students);
    const tableData = studentsWithPositions.map(student => [
      student.position,
      student.student.studentId,
      `${student.student.firstName} ${student.student.lastName}`,
      `${Math.round(student.averageScore || 0)}%`,
      (student.overallGPA || 0).toFixed(1),
      student.totalResults || student.results?.length || 0,
      student.remarks || 'No Assessment'
    ]);

    // Add table
    autoTable(doc, {
      head: [['Position', 'Student ID', 'Student Name', 'Average Score', 'Overall GPA', 'Total Courses', 'Remarks']],
      body: tableData,
      startY: yPos,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    // Save the PDF
    doc.save(`exam_results_${allStudentsResults.classInfo.name}_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "PDF Exported",
      description: "Exam results have been exported to PDF successfully.",
    });
  };

  const exportToExcel = () => {
    if (!allStudentsResults || !allStudentsResults.students.length) {
      toast({
        title: "No Data",
        description: "No student results available to export.",
        variant: "destructive",
      });
      return;
    }

    // Prepare data for Excel
    const studentsWithPositions = calculateStudentPositions(allStudentsResults.students);
    const excelData = studentsWithPositions.map(student => ({
      'Position': student.position,
      'Student ID': student.student.studentId,
      'First Name': student.student.firstName,
      'Last Name': student.student.lastName,
      'Average Score (%)': Math.round(student.averageScore || 0),
      'Overall GPA': (student.overallGPA || 0).toFixed(1),
      'Total Courses': student.totalResults || student.results?.length || 0,
      'Remarks': student.remarks || 'No Assessment'
    }));

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Exam Results');

    // Add summary sheet
    const summaryData = [{
      'Class': allStudentsResults.classInfo.name,
      'Total Students': allStudentsResults.students.length,
      'Average Class Score': Math.round(allStudentsResults.students.reduce((sum, s) => sum + (s.averageScore || 0), 0) / allStudentsResults.students.length),
      'Export Date': new Date().toLocaleDateString()
    }];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Save the file
    XLSX.writeFile(wb, `exam_results_${allStudentsResults.classInfo.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Excel Exported",
      description: "Exam results have been exported to Excel successfully.",
    });
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

      {/* Global Publish Results (always visible, independent of class selection) */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="text-base">Global Exam Results Publishing</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 md:items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">Term</label>
            <Select value={publishTermId} onValueChange={setPublishTermId}>
              <SelectTrigger className="w-full md:w-[240px]">
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                {terms.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {formatTerm(t)} {(t.isActive || t.isCurrent || (t as any).current) && "(Current)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={handlePublishResults}
            disabled={!publishTermId || publishLoading || publishedTerms[publishTermId]}
          >
            {publishLoading
              ? "Publishing..."
              : publishedTerms[publishTermId]
              ? "Results Published"
              : "Publish Results"}
          </Button>
        </CardContent>
      </Card>

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
              <label className="text-sm font-medium">Term</label>
              <Select 
                value={selectedTerm} 
                onValueChange={setSelectedTerm}
                disabled={!selectedAcademicCalendar}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTerms.map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      {formatTerm(term)} {(term.isActive || term.isCurrent || term.current) && "(Current)"}
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

          {/* (Per-filter publish removed; global publish lives above) */}

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
              <h3 className="text-lg font-medium mb-2">Select Term</h3>
              <p>Choose a term to continue</p>
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
            { label: "Overall GPA", value: studentResults.summary?.overallGPA?.toFixed(1) || "0.0" },
            { label: "Total Exams", value: studentResults.summary?.totalResults || 0 },
            {
              label: "Average Score",
              value: `${Math.round(studentResults.summary?.averageScore || 0)}%`,
            },
            {
              label: "Total Marks",
              value: `${studentResults.summary?.totalMarks || 0}/${studentResults.summary?.totalPossible || 0}`,
            },
            {
              label: "Performance",
              value: studentResults.summary?.remarks || "No Assessment",
            },
          ]}
          columns={[
            "Course Name",
            "Course Code",
            "Term",
            "Final Percentage",
            "Grade",
            "Status",
            "Computed At",
          ]}
          rows={
            studentResults.results.length
              ? studentResults.results.map((result) => ({
                  key: result.id,
                  cells: [
                    result.courseName,
                    result.courseCode,
                    result.termName,
                    `${Math.round(result.finalPercentage)}%`,
                    (
                      <Badge className={cn("text-xs", getGradeColor(result.finalGradeCode || 'N/A'))}>
                        {result.finalGradeCode || 'N/A'}
                      </Badge>
                    ),
                    result.pass ? (
                      <Badge className="text-xs bg-green-100 text-green-800">
                        Pass
                      </Badge>
                    ) : (
                      <Badge className="text-xs bg-red-100 text-red-800">
                        Fail
                      </Badge>
                    ),
                    result.computedAt 
                      ? new Date(result.computedAt).toLocaleDateString()
                      : 'N/A',
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
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                All Students' Exam Results - {allStudentsResults.classInfo.name}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={exportToPDF}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Export PDF
                </Button>
                <Button
                  onClick={exportToExcel}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-3 text-left">
                      Position
                    </th>
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
                      Total Courses
                    </th>
                    <th className="border border-border p-3 text-left">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allStudentsResults.students.length ? (
                    (() => {
                      const studentsWithPositions = calculateStudentPositions(allStudentsResults.students);
                      return studentsWithPositions.map((studentResult) => (
                        <tr
                          key={studentResult.student.id}
                          className="hover:bg-muted/50"
                        >
                          <td className="border border-border p-3">
                            <Badge variant="default" className="font-bold">
                              #{studentResult.position}
                            </Badge>
                          </td>
                          <td className="border border-border p-3 font-medium">
                            {studentResult.student.studentId}
                          </td>
                          <td className="border border-border p-3">
                            {studentResult.student.firstName}{" "}
                            {studentResult.student.lastName}
                          </td>
                          <td className="border border-border p-3">
                            <Badge variant="secondary">
                              {Math.round(studentResult.averageScore || 0)}%
                            </Badge>
                          </td>
                          <td className="border border-border p-3">
                            <Badge variant="outline">
                              {(studentResult.overallGPA || 0).toFixed(1)}
                            </Badge>
                          </td>
                          <td className="border border-border p-3">
                            {studentResult.totalResults || studentResult.results?.length || 0}
                          </td>
                          <td className="border border-border p-3 text-muted-foreground">
                            {studentResult.remarks || 'No Assessment'}
                          </td>
                        </tr>
                      ));
                    })()
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
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