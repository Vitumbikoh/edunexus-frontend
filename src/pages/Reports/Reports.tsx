import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
  AreaChart,
  Area,
  ComposedChart,
  Legend,
} from "recharts";
import { Loader2, FileSpreadsheet, FileDown, Users, BookOpen, DollarSign, GraduationCap, TrendingUp, FileText, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { reportService, ReportData } from "@/services/reportService";

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

// Professional color palette using design system
const CHART_COLORS = {
  primary: "hsl(222.2, 47.4%, 11.2%)",
  secondary: "hsl(210, 40%, 96.1%)",
  accent: "hsl(217.2, 91.2%, 59.8%)",
  success: "hsl(142, 76%, 36%)",
  warning: "hsl(38, 92%, 50%)",
  info: "hsl(199, 89%, 48%)",
  neutral: "hsl(215.4, 16.3%, 46.9%)",
  gradient: {
    primary: "url(#primaryGradient)",
    secondary: "url(#secondaryGradient)",
    accent: "url(#accentGradient)",
  }
};

const COLORS = [
  CHART_COLORS.accent,
  CHART_COLORS.success, 
  CHART_COLORS.warning,
  CHART_COLORS.info,
  CHART_COLORS.primary,
  CHART_COLORS.neutral
];

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

  // Fetch high-level report data
  const fetchReportData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/admin/reports`, {
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
      const [studentsRes, teachersRes, coursesRes, enrollmentsRes, feePaymentsRes] = await Promise.all([
        fetch(`${base}/admin/reports/students`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${base}/admin/reports/teachers`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${base}/admin/reports/courses`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${base}/admin/reports/enrollments`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${base}/admin/reports/fee-payments`, { headers: { Authorization: `Bearer ${token}` } }),
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
      setDetailedReportData({ students, teachers, courses, enrollments, feePayments });
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to load detailed report data', variant: 'destructive' });
    }
  }, [token, toast]);

  const ensureDetailedData = async () => {
    if (!detailedReportData || !detailedReportData.students) {
      await fetchDetailedData();
    }
  };

  const handleGenerateReport = async (format: 'excel' | 'pdf', category: 'students' | 'teachers' | 'courses' | 'enrollments' | 'feePayments' | 'comprehensive') => {
    try {
      setIsGenerating(true);
      await ensureDetailedData();
      if (!detailedReportData) throw new Error('Detailed data unavailable');
      if (format === 'excel') {
        switch (category) {
          case 'students':
            reportService.generateStudentsExcel(detailedReportData.students!);
            break;
          case 'teachers':
            reportService.generateTeachersExcel(detailedReportData.teachers!);
            break;
          case 'courses':
            reportService.generateCoursesExcel(detailedReportData.courses!);
            break;
          case 'enrollments':
            reportService.generateEnrollmentsExcel(detailedReportData.enrollments!);
            break;
          case 'feePayments':
            reportService.generateFeePaymentsExcel(detailedReportData.feePayments!);
            break;
          case 'comprehensive':
            if (!detailedReportData.students || !detailedReportData.teachers || !detailedReportData.courses || !detailedReportData.enrollments || !detailedReportData.feePayments) {
              throw new Error('Comprehensive report data is incomplete');
            }
            reportService.generateComprehensiveExcel({
              students: detailedReportData.students,
              teachers: detailedReportData.teachers,
              courses: detailedReportData.courses,
              enrollments: detailedReportData.enrollments,
              feePayments: detailedReportData.feePayments,
            });
            break;
        }
      } else {
        // PDF generation (reuse Excel for now or implement real PDF via service if available)
        switch (category) {
          case 'students':
            reportService.generateStudentsPDF?.(detailedReportData.students as any);
            break;
          case 'teachers':
            reportService.generateTeachersPDF?.(detailedReportData.teachers as any);
            break;
          case 'courses':
            reportService.generateCoursesPDF?.(detailedReportData.courses as any);
            break;
          case 'enrollments':
            reportService.generateEnrollmentsPDF?.(detailedReportData.enrollments as any);
            break;
          case 'feePayments':
            reportService.generateFeePaymentsPDF?.(detailedReportData.feePayments as any);
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
      fetchReportData();
    }
  }, [token, user, fetchReportData]);

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
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-foreground">Monthly Enrollment Trend</CardTitle>
                <p className="text-sm text-muted-foreground">Student enrollment patterns over time</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={reportData.enrollmentsByMonth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="enrollmentGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.accent} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={CHART_COLORS.accent} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.neutral} strokeOpacity={0.2} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: CHART_COLORS.neutral, fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: CHART_COLORS.neutral, fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke={CHART_COLORS.accent}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#enrollmentGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-foreground">Student Distribution by Grade</CardTitle>
                <p className="text-sm text-muted-foreground">Current grade-level breakdown</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={reportData.studentsByGrade}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ grade, percent }) =>
                        `${grade} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="count"
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
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
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      formatter={(value: number, name: string) => [value, 'Students']}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-foreground">Student Population Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">Detailed breakdown of students across all grade levels</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={420}>
                <BarChart 
                  data={reportData.studentsByGrade} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="studentBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.9}/>
                      <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.neutral} strokeOpacity={0.2} />
                  <XAxis 
                    dataKey="grade" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: CHART_COLORS.neutral, fontSize: 12, fontWeight: 500 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: CHART_COLORS.neutral, fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: number) => [value, 'Students']}
                    labelFormatter={(label) => `Grade: ${label}`}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="url(#studentBarGradient)"
                    radius={[4, 4, 0, 0]}
                    stroke={CHART_COLORS.success}
                    strokeWidth={1}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-foreground">Most Popular Courses</CardTitle>
              <p className="text-sm text-muted-foreground">Top 10 courses ranked by enrollment numbers</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={450}>
                <BarChart 
                  data={reportData.coursePopularity.slice(0, 10)}
                  layout="horizontal"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="courseBarGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="5%" stopColor={CHART_COLORS.info} stopOpacity={0.9}/>
                      <stop offset="95%" stopColor={CHART_COLORS.info} stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.neutral} strokeOpacity={0.2} />
                  <XAxis 
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: CHART_COLORS.neutral, fontSize: 12 }}
                  />
                  <YAxis 
                    type="category"
                    dataKey="courseName"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: CHART_COLORS.neutral, fontSize: 11 }}
                    width={150}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: number) => [value, 'Enrollments']}
                    labelFormatter={(label) => `Course: ${label}`}
                  />
                  <Bar 
                    dataKey="enrollments" 
                    fill="url(#courseBarGradient)"
                    radius={[0, 4, 4, 0]}
                    stroke={CHART_COLORS.info}
                    strokeWidth={1}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-foreground">Monthly Revenue Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">Fee payment trends and financial performance</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={420}>
                <ComposedChart 
                  data={reportData.paymentsByMonth}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.warning} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={CHART_COLORS.warning} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.neutral} strokeOpacity={0.2} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: CHART_COLORS.neutral, fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: CHART_COLORS.neutral, fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: number) => [
                      `$${value.toLocaleString()}`,
                      "Revenue",
                    ]}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    fill="url(#revenueGradient)" 
                    stroke={CHART_COLORS.warning}
                    strokeWidth={2}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill={CHART_COLORS.warning}
                    fillOpacity={0.6}
                    radius={[4, 4, 0, 0]}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}