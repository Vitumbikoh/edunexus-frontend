import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3, PieChart as PieChartIcon } from "lucide-react";

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

interface ReportChartsProps {
  reportData: ReportDataAPI;
  isLoading: boolean;
  error: string | null;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

export const ReportCharts: React.FC<ReportChartsProps> = ({
  reportData,
  isLoading,
  error,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-destructive">Error loading charts: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="students" className="w-full space-y-4">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
        <TabsTrigger value="students">Demographics</TabsTrigger>
        <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
        <TabsTrigger value="revenue">Payments</TabsTrigger>
        <TabsTrigger value="courses">Courses</TabsTrigger>
      </TabsList>

      {/* Students / Demographics Tab */}
      <TabsContent value="students">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-primary" />
                <CardTitle>Students by Class</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {reportData.studentsByGrade && reportData.studentsByGrade.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.studentsByGrade.map(item => ({
                        ...item,
                        displayName: item.grade || 'Unassigned',
                        grade: item.grade || 'Unassigned'
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ displayName, percent }) =>
                        `${displayName} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {reportData.studentsByGrade.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [value, "Students"]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-center">
                  <div className="space-y-2">
                    <p className="text-muted-foreground">No student data available</p>
                    <p className="text-xs text-muted-foreground">
                      Students will appear here once enrollment data is available
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Enrollment Tab */}
      <TabsContent value="enrollment">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle>Enrollment Trends</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {reportData.enrollmentsByMonth && reportData.enrollmentsByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.enrollmentsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-center">
                  <div className="space-y-2">
                    <p className="text-muted-foreground">No enrollment trends available</p>
                    <p className="text-xs text-muted-foreground">
                      Trends will appear here as enrollment data accumulates
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Payments / Revenue Tab */}
      <TabsContent value="revenue">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle>Revenue Trends</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {reportData.paymentsByMonth && reportData.paymentsByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.paymentsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`, "Revenue"]} />
                    <Bar dataKey="amount" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-center">
                  <div className="space-y-2">
                    <p className="text-muted-foreground">No revenue data available</p>
                    <p className="text-xs text-muted-foreground">
                      Revenue trends will appear here as payment data is collected
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Courses Tab */}
      <TabsContent value="courses">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle>Popular Courses</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {reportData.coursePopularity && reportData.coursePopularity.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.coursePopularity} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="courseName" type="category" width={100} />
                    <Tooltip formatter={(value: any) => [value, "Enrollments"]} />
                    <Bar dataKey="enrollments" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-center">
                  <div className="space-y-2">
                    <p className="text-muted-foreground">No course data available</p>
                    <p className="text-xs text-muted-foreground">
                      Course popularity will appear here once courses have enrollments
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
};