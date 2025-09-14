import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Loader2, FileSpreadsheet, FileDown, Users, BookOpen, DollarSign, GraduationCap, TrendingUp, FileText, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { reportService, ReportData } from "@/services/reportService";
import { classService } from "@/services/classService";
import { academicCalendarService } from "@/services/academicCalendarService";
import { termService } from "@/services/termService";

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
}

interface AcademicCalendar {
  id: string;
  name?: string; // optional – backend uses 'term'
  year?: string; // legacy support
  term: string; // backend provided label (e.g. 2024-2025)
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  isCompleted?: boolean;
}

// (Grades reporting interfaces removed – feature moved to /courses/grades-report)

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function Reports() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  // Existing state
  const [reportData, setReportData] = useState<ReportDataAPI | null>(null);
  const [detailedReportData, setDetailedReportData] =
    useState<Partial<ReportData> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    // Students
    studentGender: "",
    studentClassId: "",
    // Teachers
    teacherGender: "",
    teacherClassId: "",
    // Courses
    courseClassId: "",
    courseTeacherId: "",
    // Enrollments
    enrollmentClassId: "",
    enrollmentCourseId: "",
    enrollmentTeacherId: "",
    enrollmentAcademicCalendarId: "",
    // Fee Payments
    paymentAcademicCalendarId: "",
    paymentStudentId: "",
    paymentTermId: "",
    paymentClassId: "",
  });

  // Options state
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
      // Load in parallel
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
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

      // Terms
      const ts = await termService.getTerms(token).catch(() => []);
      setTerms((ts || []).map((t: any) => ({ id: t.id, name: t.name || t.periodName || `Term ${t.termNumber ?? ''}`.trim() })));
    } catch (e) {
      console.warn('Failed to load filter options', e);
    }
  }, [token]);

  // Fetch high-level report data
  const fetchReportData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const query = buildQuery({
        // Students
        studentGender: filters.studentGender || undefined,
        studentClassId: filters.studentClassId || undefined,
        // Teachers
        teacherGender: filters.teacherGender || undefined,
        teacherClassId: filters.teacherClassId || undefined,
        // Courses
        courseClassId: filters.courseClassId || undefined,
        courseTeacherId: filters.courseTeacherId || undefined,
        // Enrollments
        enrollmentClassId: filters.enrollmentClassId || undefined,
        enrollmentCourseId: filters.enrollmentCourseId || undefined,
        enrollmentTeacherId: filters.enrollmentTeacherId || undefined,
        enrollmentAcademicCalendarId: filters.enrollmentAcademicCalendarId || undefined,
        // Payments
        paymentAcademicCalendarId: filters.paymentAcademicCalendarId || undefined,
        paymentStudentId: filters.paymentStudentId || undefined,
        paymentTermId: filters.paymentTermId || undefined,
        paymentClassId: filters.paymentClassId || undefined,
      });
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/admin/reports${query}`, {
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
  }, [token]);

  // Fetch detailed data for generating reports (one endpoint per category assumed)
  const fetchDetailedData = useCallback(async () => {
    if (!token) return;
    try {
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
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

  const getRelevantFilters = (category: 'students' | 'teachers' | 'courses' | 'enrollments' | 'feePayments' | 'comprehensive') => {
    switch (category) {
      case 'students':
        return {
          studentGender: filters.studentGender,
          studentClassId: filters.studentClassId,
        };
      case 'teachers':
        return {
          teacherGender: filters.teacherGender,
          teacherClassId: filters.teacherClassId,
        };
      case 'courses':
        return {
          courseClassId: filters.courseClassId,
          courseTeacherId: filters.courseTeacherId,
        };
      case 'enrollments':
        return {
          enrollmentClassId: filters.enrollmentClassId,
          enrollmentCourseId: filters.enrollmentCourseId,
          enrollmentTeacherId: filters.enrollmentTeacherId,
          enrollmentAcademicCalendarId: filters.enrollmentAcademicCalendarId,
        };
      case 'feePayments':
        return {
          paymentAcademicCalendarId: filters.paymentAcademicCalendarId,
          paymentStudentId: filters.paymentStudentId,
          paymentTermId: filters.paymentTermId,
          paymentClassId: filters.paymentClassId,
        };
      case 'comprehensive':
        return filters; // Use all filters for comprehensive report
      default:
        return {};
    }
  };

  const getActiveFiltersCount = (category: 'students' | 'teachers' | 'courses' | 'enrollments' | 'feePayments' | 'comprehensive') => {
    const relevantFilters = getRelevantFilters(category);
    return Object.values(relevantFilters).filter(value => value && value !== '').length;
  };

  const fetchDetailedDataWithFilters = async (category: 'students' | 'teachers' | 'courses' | 'enrollments' | 'feePayments' | 'comprehensive') => {
    const relevantFilters = getRelevantFilters(category);
    const query = buildQuery(relevantFilters);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/reports/detailed${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch detailed report data");
      return await response.json();
    } catch (error) {
      console.error('Error fetching filtered data:', error);
      throw error;
    }
  };

  const ensureDetailedData = async () => {
    // Always refresh to respect current filters
    const fresh = await fetchDetailedData();
    return fresh || detailedReportData;
  };

  const handleGenerateReport = async (format: 'excel' | 'pdf', category: 'students' | 'teachers' | 'courses' | 'enrollments' | 'feePayments' | 'comprehensive') => {
    try {
      setIsGenerating(true);
      
      // Fetch data with only relevant filters for this report type
      const data = await fetchDetailedDataWithFilters(category);
      if (!data) throw new Error('Detailed data unavailable');
      
      const activeFiltersCount = getActiveFiltersCount(category);
      const reportTypeLabel = category.charAt(0).toUpperCase() + category.slice(1);
      
      if (format === 'excel') {
        switch (category) {
          case 'students':
            reportService.generateStudentsExcel(data.students!);
            break;
          case 'teachers':
            reportService.generateTeachersExcel(data.teachers!);
            break;
          case 'courses':
            reportService.generateCoursesExcel(data.courses!);
            break;
          case 'enrollments':
            reportService.generateEnrollmentsExcel(data.enrollments!);
            break;
          case 'feePayments':
            reportService.generateFeePaymentsExcel(data.feePayments!);
            break;
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
            });
            break;
        }
      } else {
        // PDF generation (reuse Excel for now or implement real PDF via service if available)
        switch (category) {
          case 'students':
            reportService.generateStudentsPDF?.(data.students as any);
            break;
          case 'teachers':
            reportService.generateTeachersPDF?.(data.teachers as any);
            break;
          case 'courses':
            reportService.generateCoursesPDF?.(data.courses as any);
            break;
          case 'enrollments':
            reportService.generateEnrollmentsPDF?.(data.enrollments as any);
            break;
          case 'feePayments':
            reportService.generateFeePaymentsPDF?.(data.feePayments as any);
            break;
          case 'comprehensive':
            throw new Error('Comprehensive PDF report not supported');
        }
      }
      
      const filterMessage = activeFiltersCount > 0 
        ? ` with ${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} applied`
        : '';
      
      toast({ 
        title: 'Report Generated Successfully', 
        description: `${reportTypeLabel} report (${format.toUpperCase()})${filterMessage} has been downloaded`,
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
      setIsGenerating(false);
    }
  };

  // Effects
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
        <div className="text-center p-8">Loading reports...</div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700">
          {error || "Failed to load report data"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Professional Header Section */}
        <div className="bg-card rounded-xl shadow-sm border p-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-foreground tracking-tight">
                    School Reports
                  </h1>
                  <div className="h-1 w-24 bg-gradient-to-r from-primary to-primary/60 rounded-full mt-2"></div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Comprehensive Data Analytics & Report Generation
                </p>
                <p className="text-muted-foreground max-w-2xl">
                  Generate detailed reports in Excel or PDF format with advanced filtering options. 
                  Access comprehensive insights across students, teachers, courses, enrollments, and financial data.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => handleGenerateReport("excel", "comprehensive")}
                disabled={isGenerating}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
              >
                <FileSpreadsheet className="h-5 w-5 mr-2" />
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Quick Excel Export"
                )}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-input hover:bg-accent"
                onClick={async () => { await fetchReportData(); await fetchDetailedData(); }}
              >
                <TrendingUp className="h-5 w-5 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>

        {/* Professional Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Students</CardTitle>
              <div className="p-2 bg-blue-600 rounded-lg">
                <Users className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{reportData.totalStudents}</div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Active enrollments</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/30 border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Total Teachers</CardTitle>
              <div className="p-2 bg-green-600 rounded-lg">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">{reportData.totalTeachers}</div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">Faculty members</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">Total Courses</CardTitle>
              <div className="p-2 bg-purple-600 rounded-lg">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{reportData.totalCourses}</div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Available courses</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/30 border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">Total Enrollments</CardTitle>
              <div className="p-2 bg-orange-600 rounded-lg">
                <FileText className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{reportData.totalEnrollments}</div>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Course registrations</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950/50 dark:to-teal-900/30 border-teal-200 dark:border-teal-800 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-teal-800 dark:text-teal-200">Fee Payments</CardTitle>
              <div className="p-2 bg-teal-600 rounded-lg">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-900 dark:text-teal-100">{reportData.totalFeePayments}</div>
              <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">Payment records</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30 border-emerald-200 dark:border-emerald-800 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Total Revenue</CardTitle>
              <div className="p-2 bg-emerald-600 rounded-lg">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                ${reportData.totalRevenue?.toLocaleString() || "0"}
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Total collected</p>
            </CardContent>
          </Card>
        </div>

        {/* Report Generation Section with Integrated Filters */}
        <Card className="shadow-xl border-0 bg-card overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-foreground/20 rounded-lg backdrop-blur-sm">
                <Download className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">Generate Reports</CardTitle>
                <p className="opacity-90 mt-1">
                  Configure filters and download detailed reports in Excel or PDF format
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Students Report Card */}
              <Card className="border-2 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader className="bg-blue-50 dark:bg-blue-950/50 border-b border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg shadow-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-blue-900 dark:text-blue-100">Students Report</CardTitle>
                      <p className="text-blue-600 dark:text-blue-400 text-sm">Student demographics & data</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Complete student information including enrollment details, class assignments, and demographic data.
                  </p>
                  
                  {/* Student Filters */}
                  <div className="space-y-3 bg-blue-50/50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Filter Options
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-1">
                        <Label className="text-blue-800 dark:text-blue-200 font-medium">Gender</Label>
                        <Select value={filters.studentGender} onValueChange={(v) => setFilters(prev => ({ ...prev, studentGender: v }))}>
                          <SelectTrigger className="bg-background border-blue-200 dark:border-blue-700 focus:border-blue-400">
                            <SelectValue placeholder="Any gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Any gender</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-blue-800 dark:text-blue-200 font-medium">Class</Label>
                        <Select value={filters.studentClassId} onValueChange={(v) => setFilters(prev => ({ ...prev, studentClassId: v }))}>
                          <SelectTrigger className="bg-background border-blue-200 dark:border-blue-700 focus:border-blue-400">
                            <SelectValue placeholder="All classes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All classes</SelectItem>
                            {classes.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleGenerateReport("excel", "students")}
                      disabled={isGenerating}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excel"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleGenerateReport("pdf", "students")}
                      disabled={isGenerating}
                      className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Teachers Report Card */}
              <Card className="border-2 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader className="bg-green-50 dark:bg-green-950/50 border-b border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-600 rounded-lg shadow-lg">
                      <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-green-900 dark:text-green-100">Teachers Report</CardTitle>
                      <p className="text-green-600 dark:text-green-400 text-sm">Faculty information & stats</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Comprehensive teacher profiles, class assignments, and professional details.
                  </p>
                  
                  {/* Teacher Filters */}
                  <div className="space-y-3 bg-green-50/50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-medium text-green-900 dark:text-green-100 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Filter Options
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-1">
                        <Label className="text-green-800 dark:text-green-200 font-medium">Gender</Label>
                        <Select value={filters.teacherGender} onValueChange={(v) => setFilters(prev => ({ ...prev, teacherGender: v }))}>
                          <SelectTrigger className="bg-background border-green-200 dark:border-green-700 focus:border-green-400">
                            <SelectValue placeholder="Any gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Any gender</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-green-800 dark:text-green-200 font-medium">Class</Label>
                        <Select value={filters.teacherClassId} onValueChange={(v) => setFilters(prev => ({ ...prev, teacherClassId: v }))}>
                          <SelectTrigger className="bg-background border-green-200 dark:border-green-700 focus:border-green-400">
                            <SelectValue placeholder="All classes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All classes</SelectItem>
                            {classes.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleGenerateReport("excel", "teachers")}
                      disabled={isGenerating}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excel"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleGenerateReport("pdf", "teachers")}
                      disabled={isGenerating}
                      className="flex-1 border-green-300 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/50"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Courses Report Card */}
              <Card className="border-2 border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader className="bg-purple-50 dark:bg-purple-950/50 border-b border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600 rounded-lg shadow-lg">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-purple-900 dark:text-purple-100">Courses Report</CardTitle>
                      <p className="text-purple-600 dark:text-purple-400 text-sm">Course catalog & analytics</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Complete course listings with enrollment statistics and teacher assignments.
                  </p>
                  
                  {/* Course Filters */}
                  <div className="space-y-3 bg-purple-50/50 dark:bg-purple-950/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h4 className="font-medium text-purple-900 dark:text-purple-100 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Filter Options
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-1">
                        <Label className="text-purple-800 dark:text-purple-200 font-medium">Class</Label>
                        <Select value={filters.courseClassId} onValueChange={(v) => setFilters(prev => ({ ...prev, courseClassId: v }))}>
                          <SelectTrigger className="bg-background border-purple-200 dark:border-purple-700 focus:border-purple-400">
                            <SelectValue placeholder="All classes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All classes</SelectItem>
                            {classes.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-purple-800 dark:text-purple-200 font-medium">Teacher</Label>
                        <Select value={filters.courseTeacherId} onValueChange={(v) => setFilters(prev => ({ ...prev, courseTeacherId: v }))}>
                          <SelectTrigger className="bg-background border-purple-200 dark:border-purple-700 focus:border-purple-400">
                            <SelectValue placeholder="All teachers" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All teachers</SelectItem>
                            {teachers.map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleGenerateReport("excel", "courses")}
                      disabled={isGenerating}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excel"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleGenerateReport("pdf", "courses")}
                      disabled={isGenerating}
                      className="flex-1 border-purple-300 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Enrollments Report Card */}
              <Card className="border-2 border-orange-200 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader className="bg-orange-50 dark:bg-orange-950/50 border-b border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-600 rounded-lg shadow-lg">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-orange-900 dark:text-orange-100">Enrollments Report</CardTitle>
                      <p className="text-orange-600 dark:text-orange-400 text-sm">Registration & grade data</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Student course enrollments with grade information and academic progress.
                  </p>
                  
                  {/* Enrollment Filters */}
                  <div className="space-y-3 bg-orange-50/50 dark:bg-orange-950/30 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                    <h4 className="font-medium text-orange-900 dark:text-orange-100 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Filter Options
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-orange-800 dark:text-orange-200 font-medium">Class</Label>
                        <Select value={filters.enrollmentClassId} onValueChange={(v) => setFilters(prev => ({ ...prev, enrollmentClassId: v }))}>
                          <SelectTrigger className="bg-background border-orange-200 dark:border-orange-700 focus:border-orange-400">
                            <SelectValue placeholder="All classes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All classes</SelectItem>
                            {classes.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-orange-800 dark:text-orange-200 font-medium">Course</Label>
                        <Select value={filters.enrollmentCourseId} onValueChange={(v) => setFilters(prev => ({ ...prev, enrollmentCourseId: v }))}>
                          <SelectTrigger className="bg-background border-orange-200 dark:border-orange-700 focus:border-orange-400">
                            <SelectValue placeholder="All courses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All courses</SelectItem>
                            {courses.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-orange-800 dark:text-orange-200 font-medium">Teacher</Label>
                        <Select value={filters.enrollmentTeacherId} onValueChange={(v) => setFilters(prev => ({ ...prev, enrollmentTeacherId: v }))}>
                          <SelectTrigger className="bg-background border-orange-200 dark:border-orange-700 focus:border-orange-400">
                            <SelectValue placeholder="All teachers" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All teachers</SelectItem>
                            {teachers.map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-orange-800 dark:text-orange-200 font-medium">Academic Calendar</Label>
                        <Select value={filters.enrollmentAcademicCalendarId} onValueChange={(v) => setFilters(prev => ({ ...prev, enrollmentAcademicCalendarId: v }))}>
                          <SelectTrigger className="bg-background border-orange-200 dark:border-orange-700 focus:border-orange-400">
                            <SelectValue placeholder="All calendars" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All calendars</SelectItem>
                            {academicCalendars.map(a => (
                              <SelectItem key={a.id} value={a.id}>{a.term || a.name || a.id}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleGenerateReport("excel", "enrollments")}
                      disabled={isGenerating}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excel"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleGenerateReport("pdf", "enrollments")}
                      disabled={isGenerating}
                      className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/50"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Fee Payments Report Card */}
              <Card className="border-2 border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader className="bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-600 rounded-lg shadow-lg">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-emerald-900 dark:text-emerald-100">Fee Payments Report</CardTitle>
                      <p className="text-emerald-600 dark:text-emerald-400 text-sm">Financial transaction data</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Complete payment history with transaction details and financial analytics.
                  </p>
                  
                  {/* Fee Payment Filters */}
                  <div className="space-y-3 bg-emerald-50/50 dark:bg-emerald-950/30 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <h4 className="font-medium text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Filter Options
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-emerald-800 dark:text-emerald-200 font-medium">Academic Calendar</Label>
                        <Select value={filters.paymentAcademicCalendarId} onValueChange={(v) => setFilters(prev => ({ ...prev, paymentAcademicCalendarId: v }))}>
                          <SelectTrigger className="bg-background border-emerald-200 dark:border-emerald-700 focus:border-emerald-400">
                            <SelectValue placeholder="All calendars" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All calendars</SelectItem>
                            {academicCalendars.map(a => (
                              <SelectItem key={a.id} value={a.id}>{a.term || a.name || a.id}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-emerald-800 dark:text-emerald-200 font-medium">Student</Label>
                        <Select value={filters.paymentStudentId} onValueChange={(v) => setFilters(prev => ({ ...prev, paymentStudentId: v }))}>
                          <SelectTrigger className="bg-background border-emerald-200 dark:border-emerald-700 focus:border-emerald-400">
                            <SelectValue placeholder="All students" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All students</SelectItem>
                            {students.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-emerald-800 dark:text-emerald-200 font-medium">Term</Label>
                        <Select value={filters.paymentTermId} onValueChange={(v) => setFilters(prev => ({ ...prev, paymentTermId: v }))}>
                          <SelectTrigger className="bg-background border-emerald-200 dark:border-emerald-700 focus:border-emerald-400">
                            <SelectValue placeholder="All terms" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All terms</SelectItem>
                            {terms.map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-emerald-800 dark:text-emerald-200 font-medium">Class</Label>
                        <Select value={filters.paymentClassId} onValueChange={(v) => setFilters(prev => ({ ...prev, paymentClassId: v }))}>
                          <SelectTrigger className="bg-background border-emerald-200 dark:border-emerald-700 focus:border-emerald-400">
                            <SelectValue placeholder="All classes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All classes</SelectItem>
                            {classes.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleGenerateReport("excel", "feePayments")}
                      disabled={isGenerating}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excel"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleGenerateReport("pdf", "feePayments")}
                      disabled={isGenerating}
                      className="flex-1 border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Comprehensive Report Card - Full Width */}
              <Card className="lg:col-span-2 border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 border-b border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg">
                      <Download className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-indigo-900 dark:text-indigo-100">Comprehensive Report</CardTitle>
                      <p className="text-indigo-600 dark:text-indigo-400 text-sm">All school data in one Excel file</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Complete school data export with all entities in separate sheets - includes students, teachers, courses, enrollments, and fee payments with all applicable filters applied.
                  </p>
                  
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/30 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <p className="text-indigo-700 dark:text-indigo-300 text-sm">
                      <strong>Note:</strong> This report will include all data types with their respective filters applied automatically.
                    </p>
                  </div>

                  <Button
                    onClick={() => handleGenerateReport("excel", "comprehensive")}
                    disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
                    size="lg"
                  >
                    <FileSpreadsheet className="h-5 w-5 mr-2" />
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Generating Complete Report...
                      </>
                    ) : (
                      "Generate Complete Excel Report"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Data Visualization Section */}
        <Card className="shadow-lg border-0 bg-card">
          <Tabs defaultValue="overview" className="w-full">
            <CardHeader className="bg-gradient-to-r from-muted/50 to-muted border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-foreground">Data Analytics & Insights</CardTitle>
                  <p className="text-muted-foreground mt-1">Visualize your school data with interactive charts</p>
                </div>
                <TabsList className="bg-background border shadow-sm">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="students" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Students
                  </TabsTrigger>
                  <TabsTrigger value="courses" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Courses
                  </TabsTrigger>
                  <TabsTrigger value="finance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Finance
                  </TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <TabsContent value="overview" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-foreground">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Enrollments by Month
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={reportData.enrollmentsByMonth}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                          <YAxis stroke="hsl(var(--muted-foreground))" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))', 
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              color: 'hsl(var(--foreground))'
                            }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="count" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={3}
                            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-foreground">
                        <Users className="h-5 w-5 text-primary" />
                        Students by Grade
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={reportData.studentsByGrade}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ grade, percent }) =>
                              `${grade} (${(percent * 100).toFixed(0)}%)`
                            }
                            outerRadius={80}
                            fill="hsl(var(--primary))"
                            dataKey="count"
                          >
                            {reportData.studentsByGrade.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))', 
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              color: 'hsl(var(--foreground))'
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="students" className="space-y-6 mt-0">
                <Card className="border shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Users className="h-5 w-5 text-primary" />
                      Student Distribution by Grade
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={reportData.studentsByGrade}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                        <XAxis dataKey="grade" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            color: 'hsl(var(--foreground))'
                          }} 
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="courses" className="space-y-6 mt-0">
                <Card className="border shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Course Popularity (Top 10)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={reportData.coursePopularity.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                        <XAxis
                          dataKey="courseName"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            color: 'hsl(var(--foreground))'
                          }} 
                        />
                        <Bar dataKey="enrollments" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="finance" className="space-y-6 mt-0">
                <Card className="border shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <DollarSign className="h-5 w-5 text-primary" />
                      Fee Payments by Month
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={reportData.paymentsByMonth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          formatter={(value: number) => [
                            `$${value.toLocaleString()}`,
                            "Amount",
                          ]}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            color: 'hsl(var(--foreground))'
                          }} 
                        />
                        <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}