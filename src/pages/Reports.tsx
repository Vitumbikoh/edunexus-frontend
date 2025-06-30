import React, { useEffect, useState } from 'react';
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
  Line
} from 'recharts';
import { 
  Users, 
  BookOpen, 
  DollarSign, 
  GraduationCap,
  TrendingUp,
  FileText,
  Download,
  FileSpreadsheet,
  FileDown
} from 'lucide-react';
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
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    date: string;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Reports() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [reportData, setReportData] = useState<ReportDataAPI | null>(null);
  const [detailedReportData, setDetailedReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('http://localhost:5000/api/v1/admin/reports', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      const data = await response.json();
      setReportData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDetailedReportData = async () => {
    try {
      setIsGenerating(true);
      
      // Fetch detailed data for report generation
      const [studentsRes, teachersRes, coursesRes, enrollmentsRes, feePaymentsRes] = await Promise.all([
        fetch('http://localhost:5000/api/v1/students', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/v1/teachers', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/v1/courses', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/v1/enrollments', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/v1/fee-payments', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const [students, teachers, courses, enrollments, feePayments] = await Promise.all([
        studentsRes.json(),
        teachersRes.json(),
        coursesRes.json(),
        enrollmentsRes.json(),
        feePaymentsRes.json()
      ]);

      setDetailedReportData({
        students: students.map((s: any) => ({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          email: s.email,
          grade: s.grade,
          enrollmentDate: s.createdAt,
          status: s.status || 'Active'
        })),
        teachers: teachers.map((t: any) => ({
          id: t.id,
          name: `${t.firstName} ${t.lastName}`,
          email: t.email,
          department: t.department,
          joinDate: t.createdAt,
          status: t.status || 'Active'
        })),
        courses: courses.map((c: any) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          department: c.department,
          credits: c.credits,
          enrollmentCount: c.enrollmentCount || 0
        })),
        enrollments: enrollments.map((e: any) => ({
          id: e.id,
          studentName: e.studentName,
          courseName: e.courseName,
          enrollmentDate: e.createdAt,
          status: e.status,
          grade: e.grade
        })),
        feePayments: feePayments.map((f: any) => ({
          id: f.id,
          studentName: f.studentName,
          amount: f.amount,
          paymentDate: f.paymentDate,
          paymentMethod: f.paymentMethod,
          status: f.status
        }))
      });

    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to fetch detailed report data",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateReport = async (type: 'excel' | 'pdf', category: 'students' | 'teachers' | 'courses' | 'enrollments' | 'feePayments' | 'comprehensive') => {
    if (!detailedReportData) {
      await fetchDetailedReportData();
      return;
    }

    try {
      if (type === 'excel') {
        switch (category) {
          case 'students':
            reportService.generateStudentsExcel(detailedReportData.students);
            break;
          case 'teachers':
            reportService.generateTeachersExcel(detailedReportData.teachers);
            break;
          case 'courses':
            reportService.generateCoursesExcel(detailedReportData.courses);
            break;
          case 'enrollments':
            reportService.generateEnrollmentsExcel(detailedReportData.enrollments);
            break;
          case 'feePayments':
            reportService.generateFeePaymentsExcel(detailedReportData.feePayments);
            break;
          case 'comprehensive':
            reportService.generateComprehensiveExcel(detailedReportData);
            break;
        }
      } else {
        switch (category) {
          case 'students':
            reportService.generateStudentsPDF(detailedReportData.students);
            break;
          case 'teachers':
            reportService.generateTeachersPDF(detailedReportData.teachers);
            break;
          case 'courses':
            reportService.generateCoursesPDF(detailedReportData.courses);
            break;
          case 'enrollments':
            reportService.generateEnrollmentsPDF(detailedReportData.enrollments);
            break;
          case 'feePayments':
            reportService.generateFeePaymentsPDF(detailedReportData.feePayments);
            break;
        }
      }

      toast({
        title: "Success",
        description: `${category} report generated successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (token && user?.role === 'admin') {
      fetchReportData();
    }
  }, [token, user]);

  if (!user || user.role !== 'admin') {
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
          {error || 'Failed to load report data'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">School Reports</h1>
          <p className="text-muted-foreground">Comprehensive overview of school data and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleGenerateReport('excel', 'comprehensive')}
            disabled={isGenerating}
            className="bg-green-600 hover:bg-green-700"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate Excel Report'}
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
              ${reportData.totalRevenue?.toLocaleString() || '0'}
            </div>
          </CardContent>
        </Card>
      </div>

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
            {/* Students Reports */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Students Report
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Detailed list of all students with their information
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleGenerateReport('excel', 'students')}
                  disabled={isGenerating}
                >
                  <FileSpreadsheet className="h-3 w-3 mr-1" />
                  Excel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerateReport('pdf', 'students')}
                  disabled={isGenerating}
                >
                  <FileDown className="h-3 w-3 mr-1" />
                  PDF
                </Button>
              </div>
            </div>

            {/* Teachers Reports */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center">
                <GraduationCap className="h-4 w-4 mr-2" />
                Teachers Report
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Complete list of teachers and their details
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleGenerateReport('excel', 'teachers')}
                  disabled={isGenerating}
                >
                  <FileSpreadsheet className="h-3 w-3 mr-1" />
                  Excel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerateReport('pdf', 'teachers')}
                  disabled={isGenerating}
                >
                  <FileDown className="h-3 w-3 mr-1" />
                  PDF
                </Button>
              </div>
            </div>

            {/* Courses Reports */}
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
                  onClick={() => handleGenerateReport('excel', 'courses')}
                  disabled={isGenerating}
                >
                  <FileSpreadsheet className="h-3 w-3 mr-1" />
                  Excel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerateReport('pdf', 'courses')}
                  disabled={isGenerating}
                >
                  <FileDown className="h-3 w-3 mr-1" />
                  PDF
                </Button>
              </div>
            </div>

            {/* Enrollments Reports */}
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
                  onClick={() => handleGenerateReport('excel', 'enrollments')}
                  disabled={isGenerating}
                >
                  <FileSpreadsheet className="h-3 w-3 mr-1" />
                  Excel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerateReport('pdf', 'enrollments')}
                  disabled={isGenerating}
                >
                  <FileDown className="h-3 w-3 mr-1" />
                  PDF
                </Button>
              </div>
            </div>

            {/* Fee Payments Reports */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Fee Payments Report
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Complete payment history and financial data
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleGenerateReport('excel', 'feePayments')}
                  disabled={isGenerating}
                >
                  <FileSpreadsheet className="h-3 w-3 mr-1" />
                  Excel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerateReport('pdf', 'feePayments')}
                  disabled={isGenerating}
                >
                  <FileDown className="h-3 w-3 mr-1" />
                  PDF
                </Button>
              </div>
            </div>

            {/* Comprehensive Report */}
            <div className="p-4 border rounded-lg bg-blue-50">
              <h3 className="font-semibold mb-2 flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Comprehensive Report
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                All data in one Excel file with multiple sheets
              </p>
              <Button
                onClick={() => handleGenerateReport('excel', 'comprehensive')}
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

      {/* Charts and Detailed Reports */}
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
                      label={({ grade, percent }) => `${grade} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {reportData.studentsByGrade.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                  <XAxis dataKey="courseName" angle={-45} textAnchor="end" height={100} />
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
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
                  <Bar dataKey="amount" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.recentActivities.length > 0 ? (
              reportData.recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{activity.type}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(activity.date).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No recent activities found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
