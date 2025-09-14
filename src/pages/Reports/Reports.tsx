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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">School Reports</h1>
            <p className="text-muted-foreground">
              Comprehensive Data Analytics & Report Generation
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => handleGenerateReport("excel", "comprehensive")}
              disabled={isGenerating}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Quick Export"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={async () => { await fetchReportData(); await fetchDetailedData(); }}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{reportData.totalStudents}</div>
              <p className="text-xs text-muted-foreground mt-1">Active enrollments</p>
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
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{reportData.totalEnrollments}</div>
              <p className="text-xs text-muted-foreground mt-1">Course registrations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Fee Payments</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{reportData.totalFeePayments}</div>
              <p className="text-xs text-muted-foreground mt-1">Payment records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${reportData.totalRevenue?.toLocaleString() || "0"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total collected</p>
            </CardContent>
          </Card>
        </div>

        {/* Report Generation Section with Integrated Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Generate Reports</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Configure filters and download detailed reports in Excel or PDF format
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Students Report Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>Students Report</CardTitle>
                      <p className="text-muted-foreground text-sm">Student demographics & data</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <p className="text-muted-foreground text-sm">
                    Complete student information including enrollment details, class assignments, and demographic data.
                  </p>
                  
                  {/* Student Filters */}
                  <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Filter Options
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-1">
                        <Label className="text-foreground">Gender</Label>
                        <Select value={filters.studentGender} onValueChange={(v) => setFilters(prev => ({ ...prev, studentGender: v }))}>
                          <SelectTrigger>
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
                        <Label className="text-foreground">Class</Label>
                        <Select value={filters.studentClassId} onValueChange={(v) => setFilters(prev => ({ ...prev, studentClassId: v }))}>
                          <SelectTrigger>
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
                      className="flex-1"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excel"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleGenerateReport("pdf", "students")}
                      disabled={isGenerating}
                      className="flex-1"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Teachers Report Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>Teachers Report</CardTitle>
                      <p className="text-muted-foreground text-sm">Faculty information & stats</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <p className="text-muted-foreground text-sm">
                    Comprehensive teacher profiles, class assignments, and professional details.
                  </p>
                  
                  {/* Teacher Filters */}
                  <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Filter Options
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-1">
                        <Label className="text-foreground">Gender</Label>
                        <Select value={filters.teacherGender} onValueChange={(v) => setFilters(prev => ({ ...prev, teacherGender: v }))}>
                          <SelectTrigger>
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
                        <Label className="text-foreground">Class</Label>
                        <Select value={filters.teacherClassId} onValueChange={(v) => setFilters(prev => ({ ...prev, teacherClassId: v }))}>
                          <SelectTrigger>
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
                      className="flex-1"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excel"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleGenerateReport("pdf", "teachers")}
                      disabled={isGenerating}
                      className="flex-1"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Courses Report Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>Courses Report</CardTitle>
                      <p className="text-muted-foreground text-sm">Course catalog & analytics</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <p className="text-muted-foreground text-sm">
                    Complete course listings with enrollment statistics and teacher assignments.
                  </p>
                  
                  {/* Course Filters */}
                  <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <FileText className="h-4 w-4" />
                      Filter Options
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-1">
                        <Label className="text-foreground">Class</Label>
                        <Select value={filters.courseClassId} onValueChange={(v) => setFilters(prev => ({ ...prev, courseClassId: v }))}>
                          <SelectTrigger>
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
                        <Label className="text-foreground">Teacher</Label>
                        <Select value={filters.courseTeacherId} onValueChange={(v) => setFilters(prev => ({ ...prev, courseTeacherId: v }))}>
                          <SelectTrigger>
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
                      className="flex-1"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excel"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleGenerateReport("pdf", "courses")}
                      disabled={isGenerating}
                      className="flex-1"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Enrollments Report Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>Enrollments Report</CardTitle>
                      <p className="text-muted-foreground text-sm">Registration & grade data</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <p className="text-muted-foreground text-sm">
                    Student course enrollments with grade information and academic progress.
                  </p>
                  
                  {/* Enrollment Filters */}
                  <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Filter Options
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-foreground">Class</Label>
                        <Select value={filters.enrollmentClassId} onValueChange={(v) => setFilters(prev => ({ ...prev, enrollmentClassId: v }))}>
                          <SelectTrigger>
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
                        <Label className="text-foreground">Course</Label>
                        <Select value={filters.enrollmentCourseId} onValueChange={(v) => setFilters(prev => ({ ...prev, enrollmentCourseId: v }))}>
                          <SelectTrigger>
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
                        <Label className="text-foreground">Teacher</Label>
                        <Select value={filters.enrollmentTeacherId} onValueChange={(v) => setFilters(prev => ({ ...prev, enrollmentTeacherId: v }))}>
                          <SelectTrigger>
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
                        <Label className="text-foreground">Academic Calendar</Label>
                        <Select value={filters.enrollmentAcademicCalendarId} onValueChange={(v) => setFilters(prev => ({ ...prev, enrollmentAcademicCalendarId: v }))}>
                          <SelectTrigger>
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
                      className="flex-1"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excel"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleGenerateReport("pdf", "enrollments")}
                      disabled={isGenerating}
                      className="flex-1"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Fee Payments Report Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>Fee Payments Report</CardTitle>
                      <p className="text-muted-foreground text-sm">Financial transaction data</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <p className="text-muted-foreground text-sm">
                    Complete payment history with transaction details and financial analytics.
                  </p>
                  
                  {/* Fee Payment Filters */}
                  <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Filter Options
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-foreground">Academic Calendar</Label>
                        <Select value={filters.paymentAcademicCalendarId} onValueChange={(v) => setFilters(prev => ({ ...prev, paymentAcademicCalendarId: v }))}>
                          <SelectTrigger>
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
                        <Label className="text-foreground">Student</Label>
                        <Select value={filters.paymentStudentId} onValueChange={(v) => setFilters(prev => ({ ...prev, paymentStudentId: v }))}>
                          <SelectTrigger>
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
                        <Label className="text-foreground">Term</Label>
                        <Select value={filters.paymentTermId} onValueChange={(v) => setFilters(prev => ({ ...prev, paymentTermId: v }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="All terms" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All terms</SelectItem>
                            <SelectItem value="">All terms</SelectItem>
                            {terms.map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-foreground">Class</Label>
                        <Select value={filters.paymentClassId} onValueChange={(v) => setFilters(prev => ({ ...prev, paymentClassId: v }))}>
                          <SelectTrigger>
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
                      className="flex-1"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excel"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleGenerateReport("pdf", "feePayments")}
                      disabled={isGenerating}
                      className="flex-1"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Comprehensive Report Card - Full Width */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Download className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>Comprehensive Report</CardTitle>
                      <p className="text-muted-foreground text-sm">All school data in one Excel file</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <p className="text-muted-foreground text-sm">
                    Complete school data export with all entities in separate sheets - includes students, teachers, courses, enrollments, and fee payments with all applicable filters applied.
                  </p>
                  
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-foreground text-sm">
                      <strong>Note:</strong> This report will include all data types with their respective filters applied automatically.
                    </p>
                  </div>

                  <Button
                    onClick={() => handleGenerateReport("excel", "comprehensive")}
                    disabled={isGenerating}
                    className="w-full"
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
        <Card>
          <Tabs defaultValue="overview" className="w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Data Analytics & Insights</CardTitle>
                  <p className="text-muted-foreground text-sm">Visualize your school data with interactive charts</p>
                </div>
                <TabsList>
                  <TabsTrigger value="overview">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="students">
                    Students
                  </TabsTrigger>
                  <TabsTrigger value="courses">
                    Courses
                  </TabsTrigger>
                  <TabsTrigger value="finance">
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
  );
}