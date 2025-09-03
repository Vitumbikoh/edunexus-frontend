import React, { useEffect, useState } from "react";
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
} from "recharts";
import {
  Users,
  BookOpen,
  DollarSign,
  GraduationCap,
  TrendingUp,
  FileText,
  Download,
  FileSpreadsheet,
  FileDown,
} from "lucide-react";
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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function Reports() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [reportData, setReportData] = useState<ReportDataAPI | null>(null);
  const [detailedReportData, setDetailedReportData] =
    useState<Partial<ReportData> | null>(null);
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
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch report data: ${response.statusText}`);
    }
    const data = await response.json();
    setReportData(data);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An error occurred';
    setError(errorMessage);
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};

  const fetchDetailedReportData = async (
    category:
      | "students"
      | "teachers"
      | "courses"
      | "enrollments"
      | "feePayments"
      | "comprehensive"
  ) => {
    try {
      setIsGenerating(true);

      const endpoints = {
        students: "http://localhost:5000/api/v1/student/students",
        teachers: "http://localhost:5000/api/v1/teacher/teachers",
        courses: "http://localhost:5000/api/v1/course",
        enrollments: "http://localhost:5000/api/v1/enrollments",
        feePayments: "http://localhost:5000/api/v1/finance/fee-payments",
      };

      // For comprehensive report, fetch all endpoints
      if (category === "comprehensive") {
        const [
          studentsRes,
          teachersRes,
          coursesRes,
          enrollmentsRes,
          feePaymentsRes,
        ] = await Promise.all([
          fetch(endpoints.students, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(endpoints.teachers, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(endpoints.courses, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(endpoints.enrollments, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(endpoints.feePayments, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
        ]);

        const responses = [
          studentsRes,
          teachersRes,
          coursesRes,
          enrollmentsRes,
          feePaymentsRes,
        ];
        for (const res of responses) {
          if (!res.ok) {
            throw new Error(
              `Failed to fetch data from ${res.url}: ${res.statusText}`
            );
          }
        }

        const [
          studentsData,
          teachersData,
          coursesData,
          enrollmentsData,
          feePaymentsData,
        ] = await Promise.all([
          studentsRes.json(),
          teachersRes.json(),
          coursesRes.json(),
          enrollmentsRes.json(),
          feePaymentsRes.json(),
        ]);

        setDetailedReportData({
          students: studentsData.students.map((s: any) => ({
            id: s.id,
            name: `${s.firstName} ${s.lastName}`,
            email: s.user?.email || s.email,
            grade: s.gradeLevel, // Adjusted to match backend field
            enrollmentDate: s.createdAt,
            status: s.status || "Active",
          })),
          teachers: teachersData.teachers.map((t: any) => ({
            id: t.id,
            name: `${t.firstName} ${t.lastName}`,
            email: t.user?.email || t.email,
            department: t.subjectSpecialization || "Unknown", // Adjusted to match backend field
            joinDate: t.hireDate || t.createdAt,
            status: t.status || "Active",
          })),
          courses: coursesData.courses.map((c: any) => ({
            id: c.id,
            name: c.name,
            code: c.code,
            department: c.department || "Unknown", // Fallback if department is not provided
            credits: c.credits || 0, // Fallback if credits is not provided
            enrollmentCount: c.enrollmentCount || 0,
          })),
          enrollments: enrollmentsData.enrollments.map((e: any) => ({
            id: e.id,
            studentName:
              e.studentName || `${e.student?.firstName} ${e.student?.lastName}`,
            courseName: e.courseName || e.course?.name,
            enrollmentDate: e.enrollmentDate || e.createdAt,
            status: e.status || "Active",
            grade: e.grade || "N/A",
          })),
          feePayments: feePaymentsData.payments.map((f: any) => ({
            id: f.id,
            studentName:
              f.studentName || `${f.student?.firstName} ${f.student?.lastName}`,
            amount: f.amount,
            paymentDate: f.processedAt || f.createdAt,
            paymentMethod: f.paymentMethod || "Unknown",
            status: f.status || "Pending",
          })),
        });
      } else {
        // Fetch only the data for the selected category
        const response = await fetch(endpoints[category], {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch ${category} data: ${response.statusText}`
          );
        }

        const data = await response.json();
        const newData = {
          [category]: data[
            category === "feePayments" ? "payments" : category
          ].map((item: any) => {
            if (category === "students") {
              return {
                id: item.id,
                name: `${item.firstName} ${item.lastName}`,
                email: item.user?.email || item.email,
                grade: item.gradeLevel, // Adjusted to match backend field
                enrollmentDate: item.createdAt,
                status: item.status || "Active",
              };
            } else if (category === "teachers") {
              return {
                id: item.id,
                name: `${item.firstName} ${item.lastName}`,
                email: item.user?.email || item.email,
                department: item.subjectSpecialization || "Unknown", // Adjusted to match backend field
                joinDate: item.hireDate || item.createdAt,
                status: item.status || "Active",
              };
            } else if (category === "courses") {
              return {
                id: item.id,
                name: item.name,
                code: item.code,
                department: item.department || "Unknown", // Fallback if department is not provided
                credits: item.credits || 0, // Fallback if credits is not provided
                enrollmentCount: item.enrollmentCount || 0,
              };
            } else if (category === "enrollments") {
              return {
                id: item.id,
                studentName:
                  item.studentName ||
                  `${item.student?.firstName} ${item.student?.lastName}`,
                courseName: item.courseName || item.course?.name,
                enrollmentDate: item.enrollmentDate || item.createdAt,
                status: item.status || "Active",
                grade: item.grade || "N/A",
              };
            } else if (category === "feePayments") {
              return {
                id: item.id,
                studentName:
                  item.studentName ||
                  `${item.student?.firstName} ${item.student?.lastName}`,
                amount: item.amount,
                paymentDate: item.processedAt || item.createdAt,
                paymentMethod: item.paymentMethod || "Unknown",
                status: item.status || "Pending",
              };
            }
          }),
        };

        setDetailedReportData((prev) => ({
          ...prev,
          ...newData,
        }));
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : `Failed to fetch ${category} report data`;
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateReport = async (
    type: "excel" | "pdf",
    category:
      | "students"
      | "teachers"
      | "courses"
      | "enrollments"
      | "feePayments"
      | "comprehensive"
  ) => {
    try {
      setIsGenerating(true); // Set loading state

      // Fetch data if not already loaded for the category or comprehensive report
      if (
        !detailedReportData ||
        !detailedReportData[category] ||
        category === "comprehensive"
      ) {
        await fetchDetailedReportData(category);
      }

      // Wait briefly to ensure state is updated (workaround for React state update timing)
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Re-check detailedReportData after awaiting fetch
      if (
        !detailedReportData ||
        (!detailedReportData[category] && category !== "comprehensive")
      ) {
        throw new Error(`No ${category} data available for report generation`);
      }

      if (type === "excel") {
        switch (category) {
          case "students":
            reportService.generateStudentsExcel(detailedReportData!.students!);
            break;
          case "teachers":
            reportService.generateTeachersExcel(detailedReportData!.teachers!);
            break;
          case "courses":
            reportService.generateCoursesExcel(detailedReportData!.courses!);
            break;
          case "enrollments":
            reportService.generateEnrollmentsExcel(
              detailedReportData!.enrollments!
            );
            break;
          case "feePayments":
            reportService.generateFeePaymentsExcel(
              detailedReportData!.feePayments!
            );
            break;
          case "comprehensive":
            if (
              !detailedReportData ||
              !detailedReportData.students ||
              !detailedReportData.teachers ||
              !detailedReportData.courses ||
              !detailedReportData.enrollments ||
              !detailedReportData.feePayments
            ) {
              throw new Error("Comprehensive report data is incomplete");
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
        switch (category) {
          case "students":
            reportService.generateStudentsExcel(detailedReportData!.students!); // Use generateStudentsExcel for PDF
            break;
          case "teachers":
            reportService.generateTeachersExcel(detailedReportData!.teachers!); // Use generateTeachersExcel for PDF
            break;
          case "courses":
            reportService.generateCoursesExcel(detailedReportData!.courses!); // Use generateCoursesExcel for PDF
            break;
          case "enrollments":
            reportService.generateEnrollmentsExcel(
              detailedReportData!.enrollments!
            ); // Use generateEnrollmentsExcel for PDF
            break;
          case "feePayments":
            reportService.generateFeePaymentsExcel(
              detailedReportData!.feePayments!
            ); // Use generateFeePaymentsExcel for PDF
            break;
          case "comprehensive":
            throw new Error("Comprehensive PDF report is not supported");
        }
      }

      toast({
        title: "Success",
        description: `${
          category.charAt(0).toUpperCase() + category.slice(1)
        } report generated successfully`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed to generate ${category} report`;
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (token && user?.role === "admin") {
      fetchReportData();
    }
  }, [token, user]);

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-border/50 backdrop-blur-sm">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="relative px-8 py-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  Analytics Dashboard
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  School Reports
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                  Comprehensive overview of institutional data with advanced analytics and insights
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => handleGenerateReport("excel", "comprehensive")}
                  disabled={isGenerating}
                  size="lg"
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <FileSpreadsheet className="h-5 w-5 mr-2" />
                  {isGenerating ? "Generating..." : "Generate Excel Report"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-muted/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Total Students
              </CardTitle>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-foreground mb-1">{reportData.totalStudents}</div>
              <div className="text-xs text-muted-foreground">Active enrollments</div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-muted/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Total Teachers
              </CardTitle>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                <GraduationCap className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-foreground mb-1">{reportData.totalTeachers}</div>
              <div className="text-xs text-muted-foreground">Faculty members</div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-muted/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Total Courses
              </CardTitle>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-foreground mb-1">{reportData.totalCourses}</div>
              <div className="text-xs text-muted-foreground">Available courses</div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-muted/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Total Enrollments
              </CardTitle>
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-foreground mb-1">{reportData.totalEnrollments}</div>
              <div className="text-xs text-muted-foreground">Course registrations</div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-muted/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Fee Payments
              </CardTitle>
              <div className="p-2 rounded-xl bg-pink-500/10 text-pink-600 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-foreground mb-1">{reportData.totalFeePayments}</div>
              <div className="text-xs text-muted-foreground">Payment transactions</div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-muted/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Total Revenue
              </CardTitle>
              <div className="p-2 rounded-xl bg-green-500/10 text-green-600 group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-foreground mb-1">
                ${reportData.totalRevenue?.toLocaleString() || "0"}
              </div>
              <div className="text-xs text-muted-foreground">Total earnings</div>
            </CardContent>
          </Card>
        </div>

        {/* Report Generation Section */}
        <Card className="border-0 bg-gradient-to-br from-card via-card to-muted/10 shadow-lg">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Download className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Generate Reports</CardTitle>
                <p className="text-muted-foreground mt-1">
                  Download detailed institutional reports in Excel or PDF format
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="group relative overflow-hidden p-6 border-0 rounded-xl bg-gradient-to-br from-blue-50/50 to-blue-100/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                      <Users className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-foreground">Students Report</h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    Comprehensive list of all enrolled students with detailed information and statistics
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleGenerateReport("excel", "students")}
                      disabled={isGenerating}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Excel
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateReport("pdf", "students")}
                      disabled={isGenerating}
                      className="border-blue-200 hover:bg-blue-50"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden p-6 border-0 rounded-xl bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-foreground">Teachers Report</h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    Complete faculty directory with qualifications, departments, and performance data
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleGenerateReport("excel", "teachers")}
                      disabled={isGenerating}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Excel
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateReport("pdf", "teachers")}
                      disabled={isGenerating}
                      className="border-emerald-200 hover:bg-emerald-50"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden p-6 border-0 rounded-xl bg-gradient-to-br from-purple-50/50 to-purple-100/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 group-hover:scale-110 transition-transform duration-300">
                      <BookOpen className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-foreground">Courses Report</h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    All available courses with enrollment statistics and academic performance
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleGenerateReport("excel", "courses")}
                      disabled={isGenerating}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Excel
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateReport("pdf", "courses")}
                      disabled={isGenerating}
                      className="border-purple-200 hover:bg-purple-50"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden p-6 border-0 rounded-xl bg-gradient-to-br from-orange-50/50 to-orange-100/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-orange-500/10 text-orange-600 group-hover:scale-110 transition-transform duration-300">
                      <FileText className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-foreground">Enrollments Report</h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    Student course registrations with grades and academic progress tracking
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleGenerateReport("excel", "enrollments")}
                      disabled={isGenerating}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Excel
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateReport("pdf", "enrollments")}
                      disabled={isGenerating}
                      className="border-orange-200 hover:bg-orange-50"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden p-6 border-0 rounded-xl bg-gradient-to-br from-pink-50/50 to-pink-100/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-pink-500/10 text-pink-600 group-hover:scale-110 transition-transform duration-300">
                      <DollarSign className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-foreground">Fee Payments Report</h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    Complete payment history with financial transactions and revenue analytics
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleGenerateReport("excel", "feePayments")}
                      disabled={isGenerating}
                      className="bg-pink-600 hover:bg-pink-700 text-white"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Excel
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateReport("pdf", "feePayments")}
                      disabled={isGenerating}
                      className="border-pink-200 hover:bg-pink-50"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden p-6 border-0 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 border-primary/20">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-primary/15 text-primary group-hover:scale-110 transition-transform duration-300">
                      <Download className="h-6 w-6" />
                    </div>
                    <div className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      Recommended
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-foreground">Comprehensive Report</h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    All institutional data in one comprehensive Excel file with multiple organized sheets
                  </p>
                  <Button
                    onClick={() => handleGenerateReport("excel", "comprehensive")}
                    disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Generate Full Excel Report
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Analytics Dashboard</h2>
              <p className="text-muted-foreground">Interactive charts and data visualizations</p>
            </div>
            <TabsList className="grid w-full max-w-md grid-cols-4 bg-muted/30 backdrop-blur-sm">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Overview</TabsTrigger>
              <TabsTrigger value="students" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Students</TabsTrigger>
              <TabsTrigger value="courses" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Courses</TabsTrigger>
              <TabsTrigger value="finance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Finance</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-0 bg-gradient-to-br from-card via-card to-muted/10 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500/5 to-blue-600/5 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">Enrollments by Month</CardTitle>
                      <p className="text-sm text-muted-foreground">Student registration trends over time</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportData.enrollmentsByMonth}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: '#e2e8f0' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: '#e2e8f0' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--primary))', r: 6 }}
                        activeDot={{ r: 8, fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-card via-card to-muted/10 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-500/5 to-purple-600/5 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">Students by Grade</CardTitle>
                      <p className="text-sm text-muted-foreground">Distribution across grade levels</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
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
                        outerRadius={100}
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
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-8">
            <Card className="border-0 bg-gradient-to-br from-card via-card to-muted/10 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-500/5 to-emerald-600/5 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Student Distribution by Grade</CardTitle>
                    <p className="text-sm text-muted-foreground">Academic level enrollment analysis</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={reportData.studentsByGrade} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="grade" 
                      tick={{ fontSize: 12 }}
                      tickLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={{ stroke: '#e2e8f0' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="url(#studentGradient)" 
                      radius={[4, 4, 0, 0]}
                    />
                    <defs>
                      <linearGradient id="studentGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.6}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses" className="space-y-8">
            <Card className="border-0 bg-gradient-to-br from-card via-card to-muted/10 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-500/5 to-orange-600/5 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Course Popularity (Top 10)</CardTitle>
                    <p className="text-sm text-muted-foreground">Most enrolled courses by student count</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart 
                    data={reportData.coursePopularity.slice(0, 10)} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                      dataKey="courseName"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{ fontSize: 11 }}
                      tickLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={{ stroke: '#e2e8f0' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="enrollments" 
                      fill="url(#courseGradient)" 
                      radius={[4, 4, 0, 0]}
                    />
                    <defs>
                      <linearGradient id="courseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.6}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finance" className="space-y-8">
            <Card className="border-0 bg-gradient-to-br from-card via-card to-muted/10 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-500/5 to-green-600/5 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-green-500/10 text-green-600">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Fee Payments by Month</CardTitle>
                    <p className="text-sm text-muted-foreground">Revenue trends and payment collection patterns</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={reportData.paymentsByMonth} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      tickLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={{ stroke: '#e2e8f0' }}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        `$${value.toLocaleString()}`,
                        "Amount",
                      ]}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="amount" 
                      fill="url(#financeGradient)" 
                      radius={[4, 4, 0, 0]}
                    />
                    <defs>
                      <linearGradient id="financeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.6}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
