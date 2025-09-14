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
  name?: string;
  year?: string;
  term: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  isCompleted?: boolean;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

export default function Reports() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  // Existing state
  const [reportData, setReportData] = useState<ReportDataAPI | null>(null);
  const [detailedReportData, setDetailedReportData] = useState<Partial<ReportData> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
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
  }, [token, filters]);

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
        return { studentGender: filters.studentGender, studentClassId: filters.studentClassId };
      case 'teachers':
        return { teacherGender: filters.teacherGender, teacherClassId: filters.teacherClassId };
      case 'courses':
        return { courseClassId: filters.courseClassId, courseTeacherId: filters.courseTeacherId };
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
        return filters;
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
    const fresh = await fetchDetailedData();
    return fresh || detailedReportData;
  };

  const handleGenerateReport = async (format: 'excel' | 'pdf', category: 'students' | 'teachers' | 'courses' | 'enrollments' | 'feePayments' | 'comprehensive') => {
    try {
      setIsGenerating(true);
      
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

  useEffect(() => {
    if (token && user?.role === 'admin') {
      loadFilterOptions();
      fetchReportData();
    }
  }, [token, user, fetchReportData, loadFilterOptions]);

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-8">
          <CardContent className="text-center text-destructive">
            You do not have permission to access this page.
          </CardContent>
        </Card>
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
        <Card className="p-8">
          <CardContent className="text-center text-destructive">
            {error || "Failed to load report data"}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">School Reports</h1>
        <p className="text-muted-foreground">
          Comprehensive Data Analytics & Report Generation
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Total Students
                </p>
                <p className="text-2xl font-bold">
                  {reportData.totalStudents?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Total Teachers
                </p>
                <p className="text-2xl font-bold">
                  {reportData.totalTeachers?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Total Courses
                </p>
                <p className="text-2xl font-bold">
                  {reportData.totalCourses?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold">
                  ${reportData.totalRevenue?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Students by Grade Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Students by Grade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData?.studentsByGrade || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="grade" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Course Popularity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Course Popularity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData?.coursePopularity || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="enrollments"
                >
                  {(reportData?.coursePopularity || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Enrollment Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Enrollment Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData?.enrollmentsByMonth || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Revenue Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData?.paymentsByMonth || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="amount" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Report Generation Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Generate Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              category: 'students' as const,
              title: 'Students Report',
              description: 'Complete student enrollment data',
              icon: Users,
            },
            {
              category: 'teachers' as const,
              title: 'Teachers Report',
              description: 'Staff directory and assignments',
              icon: GraduationCap,
            },
            {
              category: 'courses' as const,
              title: 'Courses Report',
              description: 'Course catalog and statistics',
              icon: BookOpen,
            },
            {
              category: 'enrollments' as const,
              title: 'Enrollment Report',
              description: 'Student course registrations',
              icon: FileSpreadsheet,
            },
            {
              category: 'feePayments' as const,
              title: 'Fee Payments Report',
              description: 'Financial transactions and revenue',
              icon: DollarSign,
            },
            {
              category: 'comprehensive' as const,
              title: 'Comprehensive Report',
              description: 'Complete institutional overview',
              icon: FileText,
            }
          ].map((report) => {
            const activeFilters = getActiveFiltersCount(report.category);
            const IconComponent = report.icon;
            
            return (
              <div 
                key={report.category}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <IconComponent className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{report.title}</h3>
                      {activeFilters > 0 && (
                        <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-full">
                          {activeFilters} filter{activeFilters > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isGenerating}
                    onClick={() => handleGenerateReport('excel', report.category)}
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="h-4 w-4" />
                    )}
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isGenerating}
                    onClick={() => handleGenerateReport('pdf', report.category)}
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileDown className="h-4 w-4" />
                    )}
                    PDF
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Advanced Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Advanced Report Filters
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Customize your reports by applying specific filters
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="students" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="teachers">Teachers</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
            </TabsList>

            <TabsContent value="students" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="student-gender">Gender</Label>
                  <Select
                    value={filters.studentGender}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, studentGender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Genders" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Genders</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student-class">Class</Label>
                  <Select
                    value={filters.studentClassId}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, studentClassId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Classes</SelectItem>
                      {classes.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="teachers" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teacher-gender">Gender</Label>
                  <Select
                    value={filters.teacherGender}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, teacherGender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Genders" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Genders</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacher-class">Class</Label>
                  <Select
                    value={filters.teacherClassId}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, teacherClassId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Classes</SelectItem>
                      {classes.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="courses" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course-class">Class</Label>
                  <Select
                    value={filters.courseClassId}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, courseClassId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Classes</SelectItem>
                      {classes.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course-teacher">Teacher</Label>
                  <Select
                    value={filters.courseTeacherId}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, courseTeacherId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Teachers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Teachers</SelectItem>
                      {teachers.map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="enrollments" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="enrollment-class">Class</Label>
                  <Select
                    value={filters.enrollmentClassId}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, enrollmentClassId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Classes</SelectItem>
                      {classes.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="enrollment-course">Course</Label>
                  <Select
                    value={filters.enrollmentCourseId}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, enrollmentCourseId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Courses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Courses</SelectItem>
                      {courses.map(course => (
                        <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="enrollment-teacher">Teacher</Label>
                  <Select
                    value={filters.enrollmentTeacherId}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, enrollmentTeacherId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Teachers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Teachers</SelectItem>
                      {teachers.map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="enrollment-academic-calendar">Academic Calendar</Label>
                  <Select
                    value={filters.enrollmentAcademicCalendarId}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, enrollmentAcademicCalendarId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Academic Calendars" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Academic Calendars</SelectItem>
                      {academicCalendars.map(calendar => (
                        <SelectItem key={calendar.id} value={calendar.id}>
                          {calendar.name || calendar.term}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-academic-calendar">Academic Calendar</Label>
                  <Select
                    value={filters.paymentAcademicCalendarId}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, paymentAcademicCalendarId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Academic Calendars" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Academic Calendars</SelectItem>
                      {academicCalendars.map(calendar => (
                        <SelectItem key={calendar.id} value={calendar.id}>
                          {calendar.name || calendar.term}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-student">Student</Label>
                  <Select
                    value={filters.paymentStudentId}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, paymentStudentId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Students" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Students</SelectItem>
                      {students.map(student => (
                        <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-term">Term</Label>
                  <Select
                    value={filters.paymentTermId}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, paymentTermId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Terms</SelectItem>
                      {terms.map(term => (
                        <SelectItem key={term.id} value={term.id}>{term.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-class">Class</Label>
                  <Select
                    value={filters.paymentClassId}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, paymentClassId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Classes</SelectItem>
                      {classes.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between items-center pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setFilters({
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
              }}
            >
              Clear All Filters
            </Button>
            <Button onClick={fetchReportData}>
              Apply Filters & Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
