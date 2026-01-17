import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import ProfessionalReportCard from "@/components/reports/ProfessionalReportCard";
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
  breakdown?: Record<string, unknown>;
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

// Helper function to calculate grade points
const calculateGradePoints = (grade: string): number => {
  const gradePoints: Record<string, number> = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'F': 0.0
  };
  return gradePoints[grade] || 0.0;
};

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
    if (logoPath.startsWith('http')) return logoPath;
    
    // If the logoPath already contains the full path from the backend
    if (logoPath.startsWith('/uploads/logos/')) {
      return `${API_CONFIG.BASE_URL}${logoPath}`;
    }
    
    // Otherwise, construct the full path
    return `${API_CONFIG.BASE_URL}/uploads/logos/${logoPath}`;
  };

  // Helper function to get performance level based on average score
  const getPerformanceLevel = (averageScore: number): string => {
    if (averageScore >= 90) return "Excellent";
    if (averageScore >= 80) return "Very Good";
    if (averageScore >= 70) return "Good";
    if (averageScore >= 60) return "Satisfactory";
    if (averageScore >= 50) return "Needs Improvement";
    if (averageScore >= 40) return "Below Average";
    return "Needs Improvement";
  };

  // Calculate correct summary from student results using the same logic as student side
  const transformedStudentResults = useMemo(() => {
    if (!studentResults?.results || studentResults.results.length === 0) {
      return null;
    }

    console.log('🔧 ADMIN CALCULATION DEBUG - Input results:', studentResults.results);

    // Transform results to match the student side format
    const courseResults = studentResults.results.map((result, index) => {
      const gradePoints = calculateGradePoints(result.finalGradeCode || 'F');

      const courseResult = {
        courseId: result.courseId,
        courseCode: result.courseCode,
        courseName: result.courseName,
        finalPercentage: result.finalPercentage,
        finalGradeCode: result.finalGradeCode || 'F',
        points: gradePoints,
        pass: result.pass,
        computedAt: result.computedAt,
        breakdown: result.breakdown,
      };

      console.log(`🔧 ADMIN - Course result ${index}:`, courseResult);
      return courseResult;
    });

    // Calculate performance summary using the same logic as student side
    const totalMarks = courseResults.reduce((sum, course) => sum + (Number(course.finalPercentage) || 0), 0);
    const totalPossible = courseResults.length * 100;
    const averageScore = courseResults.length > 0 ? totalMarks / courseResults.length : 0;
    const totalPoints = courseResults.reduce((sum, course) => sum + (Number(course.points) || 0), 0);
    const overallGPA = courseResults.length > 0 ? totalPoints / courseResults.length : 0;
    
    console.log('🔧 ADMIN SUMMARY CALCULATION DEBUG:', {
      courseResultsCount: courseResults.length,
      totalMarks: totalMarks,
      totalPossible: totalPossible,
      averageScore: averageScore,
      totalPoints: totalPoints,
      overallGPA: overallGPA,
      courseResults: courseResults.map(c => ({
        courseCode: c.courseCode,
        finalPercentage: c.finalPercentage,
        points: c.points
      }))
    });
    
    const performanceLevel = getPerformanceLevel(averageScore);
    
    const summary = {
      overallGPA: Number.isFinite(overallGPA) ? overallGPA : 0,
      averageScore: Number.isFinite(averageScore) ? averageScore : 0,
      totalResults: courseResults.length,
      totalMarks: Math.round(totalMarks),
      totalPossible,
      remarks: performanceLevel,
    };

    console.log('🔧 ADMIN FINAL SUMMARY:', summary);

    return {
      ...studentResults,
      summary: summary,
      results: courseResults
    };
  }, [studentResults]);

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
  const filteredTerms = useMemo(() => selectedAcademicCalendar
    ? terms.filter(t => !t.academicCalendarId || t.academicCalendarId === selectedAcademicCalendar)
    : [], [selectedAcademicCalendar, terms]);

  // Auto-select a term when calendar changes or selection becomes invalid
  useEffect(() => {
    if (!selectedAcademicCalendar) {
      setSelectedTerm("");
      return;
    }

    if (filteredTerms.length === 0) {
      setSelectedTerm("");
      return;
    }

    const isSelectedValid = filteredTerms.some(t => t.id === selectedTerm);
    if (!isSelectedValid) {
      const current = filteredTerms.find(t => t.isActive || t.isCurrent || (t as any).current);
      setSelectedTerm((current?.id) || filteredTerms[0].id);
    }
  }, [selectedAcademicCalendar, filteredTerms, selectedTerm]);

  // Reset dependent selections when parent selections change
  useEffect(() => {
    // Preserve academic calendar selection; only reset student and search
    setSelectedStudentId("");
    setSearchPeriod("");
  }, [selectedClass]);

  useEffect(() => {
    // Do not clear term here; allow the auto-select effect to set current term
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
      
      // Update the term in the terms array to reflect the published status
      setTerms(prevTerms => 
        prevTerms.map(term => 
          term.id === publishTermId 
            ? { ...term, resultsPublished: true, resultsPublishedAt: new Date().toISOString() }
            : term
        )
      );
      
      toast({
        title: "Results Published",
        description: "Exam results have been published for the selected term.",
      });
    } catch (e: unknown) {
      const error = e as { message?: string };
      toast({
        title: "Error",
        description: error.message || "Failed to publish results",
        variant: "destructive",
      });
    } finally {
      setPublishLoading(false);
    }
  };

  // Global unpublish (independent of filters)
  const handleUnpublishResults = async () => {
    if (!publishTermId || !token) return;
    try {
      setPublishLoading(true);
      await termService.unpublishResults(publishTermId, token);
      setPublishedTerms((prev) => ({ ...prev, [publishTermId]: false }));
      
      // Update the term in the terms array to reflect the unpublished status
      setTerms(prevTerms => 
        prevTerms.map(term => 
          term.id === publishTermId 
            ? { ...term, resultsPublished: false, resultsPublishedAt: null }
            : term
        )
      );
      
      toast({
        title: "Results Unpublished",
        description: "Exam results have been unpublished for the selected term.",
      });
    } catch (e: unknown) {
      const error = e as { message?: string };
      toast({
        title: "Error",
        description: error.message || "Failed to unpublish results",
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
            `${API_CONFIG.BASE_URL}/grades/classes/${selectedClass}/students?academicCalendarId=${selectedAcademicCalendar}&termId=${selectedTerm}`,
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

  const fetchAllStudentsResults = useCallback(async () => {
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
  }, [selectedClass, selectedAcademicCalendar, selectedTerm, token, toast]);

  useEffect(() => {
    if (selectedClass && selectedAcademicCalendar && selectedTerm && !selectedStudentId) {
      fetchAllStudentsResults();
    }
  }, [selectedClass, selectedAcademicCalendar, selectedTerm, selectedStudentId, fetchAllStudentsResults]);

  const fetchStudentResults = useCallback(async () => {
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
  }, [selectedStudentId, selectedClass, selectedAcademicCalendar, selectedTerm, students, token, toast]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentResults();
    }
  }, [selectedStudentId, fetchStudentResults]);

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

  const generateReportCard = async () => {
    if (!transformedStudentResults || !transformedStudentResults.results.length) {
      toast({
        title: "No Results",
        description: "No results available to generate a report card.",
        variant: "destructive",
      });
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Get school information
    const schoolName = schoolSettings?.schoolName || "School Name";
    let logoBase64 = '';
    
    // Load logo as base64 if available
    if (schoolSettings?.schoolLogo) {
      const logoUrl = getLogoUrl(schoolSettings.schoolLogo);
      console.log('🖼️ ADMIN LOGO DEBUG:', {
        schoolSettings: schoolSettings,
        schoolLogo: schoolSettings.schoolLogo,
        logoUrl: logoUrl,
        baseUrl: API_CONFIG.BASE_URL
      });
      if (logoUrl) {
        try {
          logoBase64 = await loadImageAsBase64(logoUrl);
          console.log('🖼️ ADMIN LOGO - Base64 conversion successful, length:', logoBase64.length);
        } catch (error) {
          console.error('🖼️ ADMIN LOGO - Error loading logo for print:', error);
        }
      }
    }
    const academicCalendar = academicCalendars.find(ac => ac.id === selectedAcademicCalendar);
    const academicYear = academicCalendar?.term || "Unknown Year";

    // Debug term lookup
    const selectedTermObj = terms.find(t => t.id === selectedTerm);
    console.log('Term lookup debug:', {
      selectedTerm,
      termsCount: terms.length,
      foundTerm: selectedTermObj,
      filteredTermsCount: filteredTerms.length
    });

    const termName = selectedTermObj ? formatTerm(selectedTermObj) : "Unknown Term";

    const className = classes.find(c => c.id === selectedClass)?.name || "Unknown Class";

    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Academic Report Card - ${transformedStudentResults.student.firstName} ${transformedStudentResults.student.lastName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Times New Roman', Georgia, serif; 
              background: white;
              padding: 20px;
              color: #2c3e50;
              line-height: 1.5;
            }
            .report-card {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border: 2px solid #2c3e50;
            }
            
            /* Header Section */
            .header {
              text-align: center;
              padding: 30px;
              border-bottom: 2px solid #2c3e50;
            }
            .school-header {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 20px;
              margin-bottom: 20px;
            }
            .school-logo {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid #ccc;
            }
            .school-logo img {
              width: 70px;
              height: 70px;
              object-fit: contain;
              border-radius: 50%;
            }
            .school-info {
              text-align: left;
            }
            .school-name {
              font-size: 28px;
              font-weight: bold;
              color: #2c3e50;
              margin-bottom: 5px;
            }
            .school-motto {
              font-size: 16px;
              font-style: italic;
              color: #666;
            }
            .report-title {
              font-size: 24px;
              font-weight: bold;
              color: #2c3e50;
              margin-bottom: 20px;
            }
            
            /* Academic Period - Horizontal Layout */
            .academic-period {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
              background: #f8f9fa;
              padding: 20px;
              border: 1px solid #ddd;
              margin-bottom: 20px;
            }
            .period-item {
              text-align: center;
            }
            .period-label {
              font-size: 12px;
              font-weight: bold;
              color: #666;
              margin-bottom: 5px;
            }
            .period-value {
              font-size: 14px;
              font-weight: bold;
              color: #2c3e50;
            }
            
            /* Student Details Section */
            .student-section {
              padding: 20px 30px;
              border-bottom: 1px solid #eee;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #2c3e50;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .student-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              background: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              border: 1px solid #ddd;
            }
            .student-item {
              display: flex;
              gap: 10px;
            }
            .student-label {
              font-weight: bold;
              color: #666;
              min-width: 100px;
            }
            .student-value {
              color: #2c3e50;
              font-weight: 500;
            }
            
            /* Performance Summary */
            .performance-section {
              padding: 20px 30px;
              border-bottom: 1px solid #eee;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 15px;
            }
            .summary-card {
              text-align: center;
              padding: 15px;
              border-radius: 8px;
              border: 2px solid #ddd;
            }
            .gpa-card { border-color: #3498db; background: #f0f8ff; }
            .score-card { border-color: #27ae60; background: #f0fff0; }
            .courses-card { border-color: #9b59b6; background: #f8f0ff; }
            .marks-card { border-color: #f39c12; background: #fff8f0; }
            .performance-card { border-color: #e74c3c; background: #fff0f0; }
            
            .summary-value {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .summary-label {
              font-size: 11px;
              color: #666;
              font-weight: 600;
            }
            
            /* Course Results Table */
            .results-section {
              padding: 20px 30px;
            }
            .results-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              border: 1px solid #ddd;
            }
            .results-table th {
              background: #f5f5f5;
              padding: 12px 8px;
              text-align: center;
              font-weight: bold;
              font-size: 12px;
              color: #333;
              border: 1px solid #ddd;
            }
            .results-table td {
              padding: 10px 8px;
              border: 1px solid #ddd;
              text-align: center;
              font-size: 14px;
            }
            .results-table tr:nth-child(even) {
              background: #f9f9f9;
            }
            .course-name { text-align: left; font-weight: 500; }
            .course-code { font-family: monospace; color: #666; }
            .percentage { font-weight: bold; }
            
            .grade-badge {
              padding: 4px 8px;
              border-radius: 4px;
              font-weight: bold;
              font-size: 12px;
              color: white;
            }
            .grade-a { background: #27ae60; }
            .grade-b { background: #3498db; }
            .grade-c { background: #f39c12; }
            .grade-d { background: #e67e22; }
            .grade-f { background: #e74c3c; }
            
            .status-badge {
              padding: 3px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: bold;
              color: white;
            }
            .status-pass { background: #27ae60; }
            .status-fail { background: #e74c3c; }
            
            /* Footer */
            .footer {
              padding: 25px 30px;
              text-align: center;
              background: #f8f9fa;
              border-top: 2px solid #2c3e50;
              font-size: 12px;
              color: #666;
              line-height: 1.6;
            }
            .footer-content {
              margin-bottom: 15px;
            }
            .school-about {
              font-weight: bold;
              margin: 10px 0;
              color: #2c3e50;
            }
            .school-contact {
              display: flex;
              justify-content: center;
              gap: 20px;
              font-size: 11px;
              color: #666;
            }
            
            @media print {
              body { padding: 0; }
              .report-card { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="report-card">
            <!-- Professional Header -->
            <div class="header">
              <div class="school-header">
                <div class="school-logo">
                  ${logoBase64 ? `<img src="${logoBase64}" alt="${schoolName} Logo">` : '<div style="color: #666; font-size: 24px;">🎓</div>'}
                </div>
                <div class="school-info">
                  <div class="school-name">${schoolName}</div>
                  <div class="school-motto">"${schoolSettings?.schoolAbout || 'Excellence in Education'}"</div>
                </div>
              </div>
              <div class="report-title">Academic Performance Report</div>
              
              <!-- Academic Period - Horizontal Layout -->
              <div class="academic-period">
                <div class="period-item">
                  <div class="period-label">Academic Year</div>
                  <div class="period-value">${academicYear}</div>
                </div>
                <div class="period-item">
                  <div class="period-label">Academic Term</div>
                  <div class="period-value">${termName}</div>
                </div>
                <div class="period-item">
                  <div class="period-label">Class</div>
                  <div class="period-value">${className}</div>
                </div>
                <div class="period-item">
                  <div class="period-label">Report Date</div>
                  <div class="period-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
              </div>
            </div>

            <!-- Student Details Section -->
            <div class="student-section">
              <div class="section-title">👤 Student Details</div>
              <div class="student-grid">
                <div class="student-item">
                  <span class="student-label">Full Name:</span>
                  <span class="student-value">${transformedStudentResults.student.firstName} ${transformedStudentResults.student.lastName}</span>
                </div>
                <div class="student-item">
                  <span class="student-label">Student ID:</span>
                  <span class="student-value">${transformedStudentResults.student.studentId}</span>
                </div>
              </div>
            </div>

            <!-- Academic Performance Summary -->
            <div class="performance-section">
              <div class="section-title">📊 Academic Performance Summary</div>
              <div class="summary-grid">
                <div class="summary-card gpa-card">
                  <div class="summary-value" style="color: #3498db;">${(transformedStudentResults.summary?.overallGPA || 0).toFixed(2)}</div>
                  <div class="summary-label">Overall GPA</div>
                </div>
                <div class="summary-card score-card">
                  <div class="summary-value" style="color: #27ae60;">${Math.round(transformedStudentResults.summary?.averageScore || 0)}%</div>
                  <div class="summary-label">Average Score</div>
                </div>
                <div class="summary-card courses-card">
                  <div class="summary-value" style="color: #9b59b6;">${transformedStudentResults.summary?.totalResults || 0}</div>
                  <div class="summary-label">Total Courses</div>
                </div>
                <div class="summary-card marks-card">
                  <div class="summary-value" style="color: #f39c12;">${transformedStudentResults.summary?.totalMarks || 0}/${transformedStudentResults.summary?.totalPossible || 0}</div>
                  <div class="summary-label">Marks Obtained</div>
                </div>
                <div class="summary-card performance-card">
                  <div class="summary-value" style="color: #e74c3c; font-size: 16px;">${transformedStudentResults.summary?.remarks || "No Assessment"}</div>
                  <div class="summary-label">Performance Level</div>
                </div>
              </div>
            </div>

            <!-- Course Results Table -->
            <div class="results-section">
              <div class="section-title">📚 Detailed Course Results</div>
              <table class="results-table">
                <thead>
                  <tr>
                    <th style="width: 35%;">Course Name</th>
                    <th style="width: 15%;">Code</th>
                    <th style="width: 15%;">Percentage</th>
                    <th style="width: 10%;">Grade</th>
                    <th style="width: 10%;">Points</th>
                    <th style="width: 15%;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${transformedStudentResults.results.map(result => `
                    <tr>
                      <td class="course-name">${result.courseName}</td>
                      <td class="course-code">${result.courseCode}</td>
                      <td class="percentage">${Math.round(result.finalPercentage)}%</td>
                      <td><span class="grade-badge grade-${(result.finalGradeCode || 'f').toLowerCase().replace('+', '')}">${result.finalGradeCode || 'N/A'}</span></td>
                      <td style="font-weight: 600;">${calculateGradePoints(result.finalGradeCode || 'F').toFixed(1)}</td>
                      <td><span class="status-badge status-${result.pass ? 'pass' : 'fail'}">${result.pass ? 'Pass' : 'Fail'}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Professional Footer -->
            <div class="footer">
              <div class="footer-content">
                <p><strong>This official academic report card has been generated electronically by the ${schoolName} Management System.</strong></p>
                <p>For verification or any academic inquiries, please contact the school administration office.</p>
                ${schoolSettings?.schoolAbout ? `<div class="school-about">About ${schoolName}: ${schoolSettings.schoolAbout}</div>` : ''}
              </div>
              ${(schoolSettings?.schoolAddress || schoolSettings?.schoolPhone || schoolSettings?.schoolEmail) ? `
              <div class="school-contact">
                ${schoolSettings.schoolAddress ? `<span>📍 ${schoolSettings.schoolAddress}</span>` : ''}
                ${schoolSettings.schoolPhone ? `<span>📞 ${schoolSettings.schoolPhone}</span>` : ''}
                ${schoolSettings.schoolEmail ? `<span>📧 ${schoolSettings.schoolEmail}</span>` : ''}
              </div>` : ''}
            </div>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(() => window.print(), 1000);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(reportHTML);
    printWindow.document.close();
  };

  // Calculate student positions based on average score
  const calculateStudentPositions = (students: Array<{
    student: { id: string; studentId: string; firstName: string; lastName: string };
    averageScore?: number;
    overallGPA?: number;
    totalResults?: number;
    results?: unknown[];
    remarks?: string;
  }>) => {
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
      console.log('🖼️ ADMIN PDF LOGO DEBUG:', {
        schoolSettings: schoolSettings,
        schoolLogo: schoolSettings.schoolLogo,
        logoUrl: logoUrl
      });
      if (logoUrl) {
        try {
          const logoBase64 = await loadImageAsBase64(logoUrl);
          doc.addImage(logoBase64, 'PNG', 20, 10, 30, 30);
          
          // Add school name next to logo
          doc.setFontSize(16);
          doc.setFont("helvetica", "bold");
          doc.text(schoolSettings.schoolName || "School Name", 55, 20);
          
          // Add school motto/tagline if available
          if (schoolSettings.schoolMotto) {
            doc.setFontSize(10);
            doc.setFont("helvetica", "italic");
            doc.text(`"${schoolSettings.schoolMotto}"`, 55, 28);
          }
          
          yPos = 50;
        } catch (error) {
          console.error('🖼️ ADMIN PDF LOGO - Error loading logo:', error);
          // Fallback to text-only header
          doc.setFontSize(16);
          doc.setFont("helvetica", "bold");
          doc.text(schoolSettings.schoolName || "School Name", 20, 20);
          
          if (schoolSettings.schoolMotto) {
            doc.setFontSize(10);
            doc.setFont("helvetica", "italic");
            doc.text(`"${schoolSettings.schoolMotto}"`, 20, 28);
          }
          
          yPos = 45;
        }
      }
    } else {
      console.log('🖼️ ADMIN PDF LOGO - No school logo found');
      // No logo, use text-only header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(schoolSettings?.schoolName || "School Name", 20, 20);
      
      if (schoolSettings?.schoolMotto) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text(`"${schoolSettings.schoolMotto}"`, 20, 28);
      }
      
      yPos = 45;
    }
    
    // Add report title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`All Students' Exam Results - ${allStudentsResults.classInfo.name}`, 20, yPos);
    yPos += 10;
    
    // Add school contact information
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    let contactY = yPos;
    
    if (schoolSettings?.schoolAddress) {
      doc.text(`Address: ${schoolSettings.schoolAddress}`, 20, contactY);
      contactY += 4;
    }
    
    if (schoolSettings?.schoolPhone) {
      doc.text(`Phone: ${schoolSettings.schoolPhone}`, 20, contactY);
      contactY += 4;
    }
    
    if (schoolSettings?.schoolEmail) {
      doc.text(`Email: ${schoolSettings.schoolEmail}`, 20, contactY);
      contactY += 4;
    }
    
    yPos = Math.max(contactY + 5, yPos + 15);
    
    // Add filters info
    doc.setFontSize(10);
    const selectedClassName = classes.find(c => c.id === selectedClass)?.name || '';
    const selectedCalendarName = academicCalendars.find(c => c.id === selectedAcademicCalendar)?.term || '';
    const selectedTermName = terms.find(t => t.id === selectedTerm)?.name || '';
    
    doc.text(`Class: ${selectedClassName}`, 20, yPos);
    yPos += 5;
    doc.text(`Academic Calendar: ${selectedCalendarName}`, 20, yPos);
    yPos += 5;
    doc.text(`Term: ${selectedTermName}`, 20, yPos);
    yPos += 5;
    doc.text(`Export Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 20, yPos);
    yPos += 10;

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

    // Add footer with generation info
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(6);
    doc.setFont("helvetica", "italic");
    doc.text(`Generated by ${schoolSettings?.schoolName || 'School'} Management System on ${new Date().toLocaleString()}`, 20, pageHeight - 10);

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

    // Create workbook and main worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    
    // Add school information as the first sheet
    const schoolInfoData = [
      { 'Field': 'School Name', 'Value': schoolSettings?.schoolName || 'School Name' },
      { 'Field': 'School Motto', 'Value': schoolSettings?.schoolMotto || '' },
      { 'Field': 'School Address', 'Value': schoolSettings?.schoolAddress || '' },
      { 'Field': 'School Phone', 'Value': schoolSettings?.schoolPhone || '' },
      { 'Field': 'School Email', 'Value': schoolSettings?.schoolEmail || '' },
      { 'Field': '', 'Value': '' },
      { 'Field': 'Report Title', 'Value': `All Students' Exam Results - ${allStudentsResults.classInfo.name}` },
      { 'Field': 'Class', 'Value': classes.find(c => c.id === selectedClass)?.name || '' },
      { 'Field': 'Academic Calendar', 'Value': academicCalendars.find(c => c.id === selectedAcademicCalendar)?.term || '' },
      { 'Field': 'Term', 'Value': terms.find(t => t.id === selectedTerm)?.name || '' },
      { 'Field': 'Export Date', 'Value': new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
      { 'Field': 'Total Students', 'Value': allStudentsResults.students.length },
      { 'Field': 'Average Class Score', 'Value': `${Math.round(allStudentsResults.students.reduce((sum, s) => sum + (s.averageScore || 0), 0) / allStudentsResults.students.length)}%` },
    ];
    
    const wsSchoolInfo = XLSX.utils.json_to_sheet(schoolInfoData);
    XLSX.utils.book_append_sheet(wb, wsSchoolInfo, 'School Information');

    // Add the main data sheet
    XLSX.utils.book_append_sheet(wb, ws, 'Exam Results');

    // Add summary sheet
    const summaryData = [
      { 'Metric': 'Total Students', 'Value': allStudentsResults.students.length },
      { 'Metric': 'Average Class Score', 'Value': `${Math.round(allStudentsResults.students.reduce((sum, s) => sum + (s.averageScore || 0), 0) / allStudentsResults.students.length)}%` },
      { 'Metric': 'Highest Score', 'Value': `${Math.max(...allStudentsResults.students.map(s => s.averageScore || 0))}%` },
      { 'Metric': 'Lowest Score', 'Value': `${Math.min(...allStudentsResults.students.map(s => s.averageScore || 0))}%` },
      { 'Metric': 'Export Date', 'Value': new Date().toLocaleDateString() },
      { 'Metric': 'Generated By', 'Value': schoolSettings?.schoolName ? `${schoolSettings.schoolName} Management System` : 'School Management System' },
    ];
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
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Term</label>
              <Select value={publishTermId} onValueChange={setPublishTermId}>
                <SelectTrigger className="w-full md:w-[240px]">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>
                          {formatTerm(t)} {(t.isActive || t.isCurrent || (t as { current?: boolean }).current) && "(Current)"}
                        </span>
                        {t.resultsPublished && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Published
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Current status display */}
            {publishTermId && (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Current Status:</span>
                {(() => {
                  const selectedTerm = terms.find(t => t.id === publishTermId);
                  const isPublished = selectedTerm?.resultsPublished || publishedTerms[publishTermId];
                  return (
                    <Badge variant={isPublished ? "default" : "secondary"} className="w-fit">
                      {isPublished ? "Published" : "Not Published"}
                    </Badge>
                  );
                })()}
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          {publishTermId && (
            <div className="flex gap-3">
              {(() => {
                const selectedTerm = terms.find(t => t.id === publishTermId);
                const isPublished = selectedTerm?.resultsPublished || publishedTerms[publishTermId];
                
                return isPublished ? (
                  <Button
                    variant="destructive"
                    onClick={handleUnpublishResults}
                    disabled={publishLoading}
                  >
                    {publishLoading ? "Unpublishing..." : "Unpublish Results"}
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    onClick={handlePublishResults}
                    disabled={publishLoading}
                  >
                    {publishLoading ? "Publishing..." : "Publish Results"}
                  </Button>
                );
              })()}
              
              {publishTermId && (() => {
                const selectedTerm = terms.find(t => t.id === publishTermId);
                if (selectedTerm?.resultsPublishedAt) {
                  return (
                    <div className="text-sm text-muted-foreground self-center">
                      Published on: {new Date(selectedTerm.resultsPublishedAt).toLocaleDateString()}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}
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

      {transformedStudentResults && (
        <ProfessionalReportCard
          school={{
            name: schoolSettings?.schoolName || "School Name",
            logoUrl: schoolSettings?.schoolLogo,
            address: schoolSettings?.schoolAddress,
            phone: schoolSettings?.schoolPhone,
            email: schoolSettings?.schoolEmail,
            website: "",
            motto: schoolSettings?.schoolMotto,
            about: schoolSettings?.schoolAbout
          }}
          student={{
            id: transformedStudentResults.student.id,
            studentId: transformedStudentResults.student.studentId,
            firstName: transformedStudentResults.student.firstName,
            lastName: transformedStudentResults.student.lastName,
            className: classes.find(c => c.id === selectedClass)?.name || "Unknown Class",
            academicYear: academicCalendars.find(ac => ac.id === selectedAcademicCalendar)?.term || "Unknown Year",
            term: terms.find(t => t.id === selectedTerm) ? formatTerm(terms.find(t => t.id === selectedTerm)!) : "Unknown Term"
          }}
          summary={{
            overallGPA: transformedStudentResults.summary?.overallGPA || 0,
            averageScore: transformedStudentResults.summary?.averageScore || 0,
            totalCourses: transformedStudentResults.summary?.totalResults || 0,
            totalMarks: transformedStudentResults.summary?.totalMarks || 0,
            totalPossible: transformedStudentResults.summary?.totalPossible || 0,
            performance: transformedStudentResults.summary?.remarks || "No Assessment",
            position: undefined,
            totalStudents: undefined
          }}
          courses={
            transformedStudentResults.results.map((result) => ({
              courseCode: result.courseCode,
              courseName: result.courseName,
              finalPercentage: result.finalPercentage,
              grade: result.finalGradeCode || 'N/A',
              points: calculateGradePoints(result.finalGradeCode || 'F'),
              status: result.pass ? 'Pass' : 'Fail',
              computedAt: new Date(result.computedAt),
              breakdown: result.breakdown
            }))
          }
          onPrint={generateReportCard}
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
                              {studentResult.averageScore != null && studentResult.averageScore > 0 ? Math.round(studentResult.averageScore) : 0}%
                            </Badge>
                          </td>
                          <td className="border border-border p-3">
                            <Badge variant="outline">
                              {studentResult.overallGPA != null && studentResult.overallGPA > 0 ? studentResult.overallGPA.toFixed(1) : '0.0'}
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