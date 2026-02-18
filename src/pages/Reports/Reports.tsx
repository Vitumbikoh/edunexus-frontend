import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users, BookOpen, DollarSign, GraduationCap, TrendingUp, FileSpreadsheet, Download, FileDown, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { API_BASE_URL } from "@/config/api";
// Use local report service implementation co-located with this page to avoid alias resolution issues
import { reportService } from "./reportService";
import { classService } from "@/services/classService";
import { academicCalendarService } from "@/services/academicCalendarService";
import { termService } from "@/services/termService";
import { ReportCards } from "./ReportCards";
import { formatCurrency, getDefaultCurrency } from '@/lib/currency';
import LibraryReportCard from '@/components/reports/LibraryReportCard';

interface ReportDataAPI {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalFeePayments: number;
  totalRevenue: number;
  studentsByGrade: Array<{ grade: string; count: number }>;
  enrollmentsByMonth: Array<{ month: string; count: number }>;
  paymentsByMonth: Array<{ month: string; amount: number }>;
  coursePopularity: Array<{ courseName: string; enrollments: number }>;
  schoolInfo?: {
    school?: {
      id: string;
      name: string;
      code: string;
      status: string;
    };
    settings?: {
      id: string;
      schoolId: string;
      schoolName?: string;
      schoolEmail?: string;
      schoolPhone?: string;
      schoolAddress?: string;
      schoolAbout?: string;
      schoolLogo?: string;
    };
  };
}

interface AcademicCalendar {
  id: string;
  name?: string;
  year?: string;
  term: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  isCompleted?: boolean;
}

/**
 * DetailedReportData represents the payload returned by the detailed report endpoints
 * (students, teachers, courses, enrollments, feePayments). Use any for item shapes
 * to stay flexible; tighten these types later if desired.
 */
interface DetailedReportData {
  students?: any[];
  teachers?: any[];
  courses?: any[];
  enrollments?: any[];
  feePayments?: any[];
}

export default function Reports() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [reportData, setReportData] = useState<ReportDataAPI | null>(null);
  const [detailedReportData, setDetailedReportData] = useState<DetailedReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track which category & format is currently generating (so only one button shows spinner)
  const [generatingCategory, setGeneratingCategory] = useState<null | { category: string; format: 'excel' | 'pdf' }>(null);

  const [filters, setFilters] = useState({
    classId: "",
    studentId: "",
    courseId: "",
    teacherId: "",
    termId: "",
    dateFrom: "",
    dateTo: "",
    attendanceClassId: "",
    attendanceStudentId: "",
    attendanceTermId: "",
    attendanceDateFrom: "",
    attendanceDateTo: "",
    studentGender: "",
    studentClassId: "",
    teacherGender: "",
    teacherClassId: "",
    courseClassId: "",
    courseTeacherId: "",
    enrollmentClassId: "",
    enrollmentCourseId: "",
    enrollmentTeacherId: "",
    enrollmentAcademicCalendarId: "",
    paymentAcademicCalendarId: "",
    paymentStudentId: "",
    paymentTermId: "",
    paymentClassId: "",
  });

  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string }>>([]);
  const [courses, setCourses] = useState<Array<{ id: string; name: string }>>([]);
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([]);
  const [academicCalendars, setAcademicCalendars] = useState<AcademicCalendar[]>([]);
  const [terms, setTerms] = useState<Array<{ id: string; name: string }>>([]);

  const buildQuery = (params: Record<string, string | undefined | null>) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v && String(v).trim() !== "") search.append(k, String(v));
    });
    const s = search.toString();
    return s ? `?${s}` : "";
  };

  const loadFilterOptions = useCallback(async () => {
    if (!token) return;
    try {
      const base = API_BASE_URL;
      const [cls, acads, trs, stds, crs] = await Promise.all([
        classService.getClasses(token).catch(() => []),
        academicCalendarService.getAcademicCalendars(token).catch(() => []),
        fetch(`${base}/admin/reports/teachers`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : [])
          .catch(() => []),
        fetch(`${base}/admin/reports/students`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : [])
          .catch(() => []),
        fetch(`${base}/admin/reports/courses`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : [])
          .catch(() => []),
      ]);

      const safeName = (p: any) => p?.name || [p?.firstName, p?.lastName].filter(Boolean).join(' ') || p?.email || p?.code || p?.id;
      setClasses((cls || []).map((c: any) => ({ id: c.id, name: c.name || String(c.numericalName) || c.id })));
      setAcademicCalendars(acads as AcademicCalendar[]);
      setTeachers((trs || []).map((t: any) => ({ id: t.id, name: safeName(t) })));
      setStudents((stds || []).map((s: any) => ({ id: s.id, name: safeName(s) })));
      setCourses((crs || []).map((c: any) => ({ id: c.id, name: safeName(c) })));

      const ts = await termService.getTerms(token).catch(() => []);
      setTerms((ts || []).map((t: any) => ({ id: t.id, name: t.name || t.periodName || `Term ${t.termNumber ?? ''}`.trim() })));
    } catch (e) {
      console.warn('Failed to load filter options', e);
    }
  }, [token]);

  const fetchReportData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const query = buildQuery({
        studentGender: filters.studentGender || undefined,
        studentClassId: filters.studentClassId || undefined,
        teacherGender: filters.teacherGender || undefined,
        teacherClassId: filters.teacherClassId || undefined,
        courseClassId: filters.courseClassId || undefined,
        courseTeacherId: filters.courseTeacherId || undefined,
        enrollmentClassId: filters.enrollmentClassId || undefined,
        enrollmentCourseId: filters.enrollmentCourseId || undefined,
        enrollmentTeacherId: filters.enrollmentTeacherId || undefined,
        enrollmentAcademicCalendarId: filters.enrollmentAcademicCalendarId || undefined,
        paymentAcademicCalendarId: filters.paymentAcademicCalendarId || undefined,
        paymentStudentId: filters.paymentStudentId || undefined,
        paymentTermId: filters.paymentTermId || undefined,
        paymentClassId: filters.paymentClassId || undefined,
      });
      const res = await fetch(`${API_BASE_URL}/admin/reports${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch report data');
      const data = await res.json();
      setReportData(data);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  }, [token, filters]);

  const fetchDetailedData = useCallback(async () => {
    if (!token) return;
    try {
      const base = API_BASE_URL;
      const studentsQuery = buildQuery({ gender: filters.studentGender || undefined, classId: filters.studentClassId || undefined });
      const teachersQuery = buildQuery({ gender: filters.teacherGender || undefined, classId: filters.teacherClassId || undefined });
      const coursesQuery = buildQuery({ classId: filters.courseClassId || undefined, teacherId: filters.courseTeacherId || undefined });
      const enrollmentsQuery = buildQuery({ classId: filters.enrollmentClassId || undefined, courseId: filters.enrollmentCourseId || undefined, teacherId: filters.enrollmentTeacherId || undefined, academicCalendarId: filters.enrollmentAcademicCalendarId || undefined });
      const paymentsQuery = buildQuery({ academicCalendarId: filters.paymentAcademicCalendarId || undefined, studentId: filters.paymentStudentId || undefined, termId: filters.paymentTermId || undefined, classId: filters.paymentClassId || undefined });
      
      const [studentsRes, teachersRes, coursesRes, enrollmentsRes, feePaymentsRes] = await Promise.all([
        fetch(`${base}/admin/reports/students${studentsQuery}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${base}/admin/reports/teachers${teachersQuery}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${base}/admin/reports/courses${coursesQuery}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${base}/admin/reports/enrollments${enrollmentsQuery}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${base}/admin/reports/fee-payments${paymentsQuery}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      
      if (![studentsRes, teachersRes, coursesRes, enrollmentsRes, feePaymentsRes].every(r => r.ok)) {
        throw new Error('Failed to fetch detailed report data');
      }
      
      const [students, teachers, courses, enrollments, feePayments] = await Promise.all([
        studentsRes.json(),
        teachersRes.json(),
        coursesRes.json(),
        enrollmentsRes.json(),
        feePaymentsRes.json(),
      ]);
      
      const payload = { students, teachers, courses, enrollments, feePayments };
      setDetailedReportData(payload);
      return payload;
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to load detailed report data', variant: 'destructive' });
    }
  }, [token, toast, filters]);

  const handleGenerateReport = async (format: 'excel' | 'pdf', category: 'students' | 'teachers' | 'courses' | 'enrollments' | 'financial' | 'attendance' | 'comprehensive') => {
    try {
      setGeneratingCategory({ category, format });
      
      const data = await fetchDetailedData();
      if (!data) throw new Error('Detailed data unavailable');
      
      if (format === 'excel') {
        switch (category) {
          case 'students':
            reportService.generateStudentsExcel(data.students!, reportData?.schoolInfo);
            break;
          case 'teachers':
            reportService.generateTeachersExcel(data.teachers!, reportData?.schoolInfo);
            break;
          case 'courses':
            reportService.generateCoursesExcel(data.courses!, reportData?.schoolInfo);
            break;
          case 'enrollments':
            reportService.generateEnrollmentsExcel(data.enrollments!, reportData?.schoolInfo);
            break;
          case 'financial':
            reportService.generateFeePaymentsExcel(data.feePayments!, reportData?.schoolInfo);
            break;
          case 'attendance':
            toast({ title: 'Attendance Report', description: 'Attendance reporting will be implemented soon', variant: 'default' });
            return;
          case 'comprehensive':
            if (!data.students || !data.teachers || !data.courses || !data.enrollments || !data.feePayments) {
              throw new Error('Comprehensive report data is incomplete');
            }
            reportService.generateComprehensiveExcel({
              students: data.students,
              teachers: data.teachers,
              courses: data.courses,
              enrollments: data.enrollments,
              feePayments: data.feePayments,
              schoolInfo: reportData?.schoolInfo,
            });
            break;
        }
      } else {
        switch (category) {
          case 'students':
            await reportService.generateStudentsPDF?.(data.students as any, reportData?.schoolInfo);
            break;
          case 'teachers':
            await reportService.generateTeachersPDF?.(data.teachers as any, reportData?.schoolInfo);
            break;
          case 'courses':
            await reportService.generateCoursesPDF?.(data.courses as any, reportData?.schoolInfo);
            break;
          case 'enrollments':
            await reportService.generateEnrollmentsPDF?.(data.enrollments as any, reportData?.schoolInfo);
            break;
          case 'financial':
            await reportService.generateFeePaymentsPDF?.(data.feePayments as any, reportData?.schoolInfo);
            break;
          case 'attendance':
            toast({ title: 'Attendance PDF', description: 'Attendance PDF reporting will be implemented soon', variant: 'default' });
            return;
          case 'comprehensive':
            if (!data.students || !data.teachers || !data.courses || !data.enrollments || !data.feePayments) {
              throw new Error('Comprehensive report data is incomplete');
            }
            await reportService.generateComprehensivePDF({
              students: data.students,
              teachers: data.teachers,
              courses: data.courses,
              enrollments: data.enrollments,
              feePayments: data.feePayments,
              schoolInfo: reportData?.schoolInfo, // Pass school info from comprehensive report
            });
        }
      }
      
      toast({ 
        title: 'Report Generated Successfully', 
        description: `${category.charAt(0).toUpperCase() + category.slice(1)} report (${format.toUpperCase()}) has been downloaded`,
        duration: 5000,
      });
    } catch (e) {
      toast({ 
        title: 'Report Generation Failed', 
        description: e instanceof Error ? e.message : 'Failed to generate report', 
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setGeneratingCategory(null);
    }
  };

  useEffect(() => {
    if (token && user?.role === 'admin') {
      loadFilterOptions();
      fetchReportData();
    }
  }, [token, user, fetchReportData, loadFilterOptions]);

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700">
          No report data available.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive Data Analytics & Report Generation
          </p>
        </div>
      </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{reportData.totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">Active students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Teachers</CardTitle>
            <GraduationCap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{reportData.totalTeachers}</div>
            <p className="text-xs text-muted-foreground mt-1">Faculty members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{reportData.totalCourses}</div>
            <p className="text-xs text-muted-foreground mt-1">Available courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Enrollments</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{reportData.totalEnrollments}</div>
            <p className="text-xs text-muted-foreground mt-1">Active enrollments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Fee Payments</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{reportData.totalFeePayments}</div>
            <p className="text-xs text-muted-foreground mt-1">Fee payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-2xl font-bold text-foreground break-words">
              {formatCurrency(reportData.totalRevenue || 0, getDefaultCurrency())}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total collected</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportCards
          reportData={reportData}
          filters={filters}
          setFilters={setFilters}
          classes={classes}
          students={students}
            courses={courses}
          teachers={teachers}
          terms={terms}
          academicCalendars={academicCalendars}
          isGenerating={!!generatingCategory}
          generatingCategory={generatingCategory}
          onGenerateReport={handleGenerateReport}
        />

        {/* Library Report Card - Integrated with other reports */}
        <LibraryReportCard
          onGenerateReport={handleGenerateReport}
          generatingCategory={generatingCategory}
        />

        {/* Comprehensive Report Card */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Comprehensive Report</CardTitle>
                <p className="text-muted-foreground text-sm">Complete school data export</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex flex-col h-full space-y-4">
            <p className="text-muted-foreground text-sm">
              Generate a comprehensive report containing all school data including students, teachers, courses, enrollments, and financial records.
            </p>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Report Contents
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Student enrollment and academic records</li>
                <li>• Teacher profiles and course assignments</li>
                <li>• Course catalog and enrollment statistics</li>
                <li>• Financial records and payment history</li>
                <li>• Attendance tracking and analytics</li>
              </ul>
            </div>

            {/* Spacer to push buttons to bottom */}
            <div className="flex-1" />

            {/* Action buttons positioned at bottom */}
            <div className="flex gap-2 pt-4 mt-auto">
              <Button
                onClick={() => handleGenerateReport("excel", "comprehensive")}
                disabled={!!generatingCategory}
                size="sm"
                className="flex-1"
              >
                <FileSpreadsheet className="h-4 w-4 mr-1" />
                {generatingCategory?.category === 'comprehensive' && generatingCategory.format === 'excel' ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excel"}
              </Button>
              <Button
                onClick={() => handleGenerateReport("pdf", "comprehensive")}
                disabled={!!generatingCategory}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <FileDown className="h-4 w-4 mr-1" />
                {generatingCategory?.category === 'comprehensive' && generatingCategory.format === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'PDF'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
