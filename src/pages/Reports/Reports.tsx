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

  const ensureDetailedData = async () => {
    // Always refresh to respect current filters
    const fresh = await fetchDetailedData();
    return fresh || detailedReportData;
  };

  const handleGenerateReport = async (format: 'excel' | 'pdf', category: 'students' | 'teachers' | 'courses' | 'enrollments' | 'feePayments' | 'comprehensive') => {
    try {
      setIsGenerating(true);
      const data = await ensureDetailedData();
      if (!data) throw new Error('Detailed data unavailable');
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
      toast({ title: 'Success', description: `${category.charAt(0).toUpperCase() + category.slice(1)} report generated` });
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to generate report', variant: 'destructive' });
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">School Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive overview of school data and analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleGenerateReport("excel", "comprehensive")}
            disabled={isGenerating}
            variant="outline"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Generate Excel Report"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <p className="text-sm text-muted-foreground">Apply filters to refine the report data below and in exports.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Students */}
            <div className="p-3 border rounded-md">
              <h3 className="font-semibold mb-2">Students</h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Gender</Label>
                  <Select value={filters.studentGender} onValueChange={(v) => setFilters(prev => ({ ...prev, studentGender: v }))}>
                    <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Class</Label>
                  <Select value={filters.studentClassId} onValueChange={(v) => setFilters(prev => ({ ...prev, studentClassId: v }))}>
                    <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Teachers */}
            <div className="p-3 border rounded-md">
              <h3 className="font-semibold mb-2">Teachers</h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Gender</Label>
                  <Select value={filters.teacherGender} onValueChange={(v) => setFilters(prev => ({ ...prev, teacherGender: v }))}>
                    <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Class</Label>
                  <Select value={filters.teacherClassId} onValueChange={(v) => setFilters(prev => ({ ...prev, teacherClassId: v }))}>
                    <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Courses */}
            <div className="p-3 border rounded-md">
              <h3 className="font-semibold mb-2">Courses</h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Class</Label>
                  <Select value={filters.courseClassId} onValueChange={(v) => setFilters(prev => ({ ...prev, courseClassId: v }))}>
                    <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Teacher</Label>
                  <Select value={filters.courseTeacherId} onValueChange={(v) => setFilters(prev => ({ ...prev, courseTeacherId: v }))}>
                    <SelectTrigger><SelectValue placeholder="All teachers" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      {teachers.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Enrollments */}
            <div className="p-3 border rounded-md">
              <h3 className="font-semibold mb-2">Enrollments</h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Class</Label>
                  <Select value={filters.enrollmentClassId} onValueChange={(v) => setFilters(prev => ({ ...prev, enrollmentClassId: v }))}>
                    <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Course</Label>
                  <Select value={filters.enrollmentCourseId} onValueChange={(v) => setFilters(prev => ({ ...prev, enrollmentCourseId: v }))}>
                    <SelectTrigger><SelectValue placeholder="All courses" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      {courses.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Teacher</Label>
                  <Select value={filters.enrollmentTeacherId} onValueChange={(v) => setFilters(prev => ({ ...prev, enrollmentTeacherId: v }))}>
                    <SelectTrigger><SelectValue placeholder="All teachers" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      {teachers.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Academic Calendar</Label>
                  <Select value={filters.enrollmentAcademicCalendarId} onValueChange={(v) => setFilters(prev => ({ ...prev, enrollmentAcademicCalendarId: v }))}>
                    <SelectTrigger><SelectValue placeholder="All calendars" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      {academicCalendars.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.term || a.name || a.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Fee Payments */}
            <div className="p-3 border rounded-md">
              <h3 className="font-semibold mb-2">Fee Payments</h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Academic Calendar</Label>
                  <Select value={filters.paymentAcademicCalendarId} onValueChange={(v) => setFilters(prev => ({ ...prev, paymentAcademicCalendarId: v }))}>
                    <SelectTrigger><SelectValue placeholder="All calendars" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      {academicCalendars.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.term || a.name || a.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Student</Label>
                  <Select value={filters.paymentStudentId} onValueChange={(v) => setFilters(prev => ({ ...prev, paymentStudentId: v }))}>
                    <SelectTrigger><SelectValue placeholder="All students" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      {students.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Term</Label>
                  <Select value={filters.paymentTermId} onValueChange={(v) => setFilters(prev => ({ ...prev, paymentTermId: v }))}>
                    <SelectTrigger><SelectValue placeholder="All terms" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      {terms.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Class</Label>
                  <Select value={filters.paymentClassId} onValueChange={(v) => setFilters(prev => ({ ...prev, paymentClassId: v }))}>
                    <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setFilters({
              studentGender: "", studentClassId: "", teacherGender: "", teacherClassId: "", courseClassId: "", courseTeacherId: "",
              enrollmentClassId: "", enrollmentCourseId: "", enrollmentTeacherId: "", enrollmentAcademicCalendarId: "",
              paymentAcademicCalendarId: "", paymentStudentId: "", paymentTermId: "", paymentClassId: "",
            }); }}>
              Reset
            </Button>
            <Button onClick={async () => { await fetchReportData(); await fetchDetailedData(); }}>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalTeachers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalCourses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalEnrollments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fee Payments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalFeePayments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${reportData.totalRevenue?.toLocaleString() || "0"}
            </div>
          </CardContent>
        </Card>
      </div>

  {/* (Grades Report section removed – moved to dedicated page) */}

      {/* Report Generation Section */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Reports</CardTitle>
          <p className="text-sm text-muted-foreground">
            Download detailed reports in Excel or PDF format
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Students Report
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Detailed list of all students
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleGenerateReport("excel", "students")}
                  disabled={isGenerating}
                >
                  <FileSpreadsheet className="h-3 w-3 mr-1" />
                  Excel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerateReport("pdf", "students")}
                  disabled={isGenerating}
                >
                  <FileDown className="h-3 w-3 mr-1" />
                  PDF
                </Button>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center">
                <GraduationCap className="h-4 w-4 mr-2" />
                Teachers Report
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Complete list of teachers
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleGenerateReport("excel", "teachers")}
                  disabled={isGenerating}
                >
                  <FileSpreadsheet className="h-3 w-3 mr-1" />
                  Excel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerateReport("pdf", "teachers")}
                  disabled={isGenerating}
                >
                  <FileDown className="h-3 w-3 mr-1" />
                  PDF
                </Button>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center">
                <BookOpen className="h-4 w-4 mr-2" />
                Courses Report
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                All courses with enrollment statistics
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleGenerateReport("excel", "courses")}
                  disabled={isGenerating}
                >
                  <FileSpreadsheet className="h-3 w-3 mr-1" />
                  Excel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerateReport("pdf", "courses")}
                  disabled={isGenerating}
                >
                  <FileDown className="h-3 w-3 mr-1" />
                  PDF
                </Button>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Enrollments Report
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Student course enrollments and grades
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleGenerateReport("excel", "enrollments")}
                  disabled={isGenerating}
                >
                  <FileSpreadsheet className="h-3 w-3 mr-1" />
                  Excel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerateReport("pdf", "enrollments")}
                  disabled={isGenerating}
                >
                  <FileDown className="h-3 w-3 mr-1" />
                  PDF
                </Button>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Fee Payments Report
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Complete payment history
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleGenerateReport("excel", "feePayments")}
                  disabled={isGenerating}
                >
                  <FileSpreadsheet className="h-3 w-3 mr-1" />
                  Excel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerateReport("pdf", "feePayments")}
                  disabled={isGenerating}
                >
                  <FileDown className="h-3 w-3 mr-1" />
                  PDF
                </Button>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-blue-50">
              <h3 className="font-semibold mb-2 flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Comprehensive Report
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                All data in one Excel file
              </p>
              <Button
                onClick={() => handleGenerateReport("excel", "comprehensive")}
                disabled={isGenerating}
                className="w-full"
              >
                <FileSpreadsheet className="h-3 w-3 mr-1" />
                Generate Full Excel Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Enrollments by Month</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.enrollmentsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Students by Grade</CardTitle>
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
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {reportData.studentsByGrade.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Distribution by Grade</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={reportData.studentsByGrade}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grade" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Popularity (Top 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={reportData.coursePopularity.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="courseName"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="enrollments" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fee Payments by Month</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={reportData.paymentsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [
                      `$${value.toLocaleString()}`,
                      "Amount",
                    ]}
                  />
                  <Bar dataKey="amount" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}