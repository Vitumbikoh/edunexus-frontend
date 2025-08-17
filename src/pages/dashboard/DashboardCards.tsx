import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  AttendanceOverview, 
  ClassPerformanceChart, 
  FeeCollectionChart,
  FinanceOverviewChart,
  StudentPerformanceChart,
  AssignmentStatusChart,
  generateAssignmentStatusData,
  generateStudentPerformanceData
} from './DashboardCharts';
import { API_CONFIG } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import RecentActivitiesCard from '@/components/dashboard/RecentActivitiesCard';
import { Progress } from '@radix-ui/react-progress';


export const AdminDashboardCards = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [academicYearId, setAcademicYearId] = useState<string | undefined>(undefined);
  const [loadingAY, setLoadingAY] = useState<boolean>(false);

  useEffect(() => {
    const fetchCurrentAcademicYear = async () => {
      if (!token) return;
      try {
        setLoadingAY(true);
        const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CURRENT_ACADEMIC_YEAR}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Accept flexible key names
          const id = data?.id || data?.academicYearId || data?.currentAcademicYear?.id;
          if (id) setAcademicYearId(id);
        }
      } catch (e) {
        console.warn('Failed to load current academic year', e);
      } finally {
        setLoadingAY(false);
      }
    };
    fetchCurrentAcademicYear();
  }, [token]);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
        <CardHeader>
          <CardTitle>Class Performance</CardTitle>
          <CardDescription>Average scores by course {loadingAY && <span className="text-xs text-muted-foreground">(loading year...)</span>}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ClassPerformanceChart academicYearId={academicYearId} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
        <CardHeader>
          <CardTitle>Attendance Overview</CardTitle>
          <CardDescription>Current month attendance by class {loadingAY && <span className="text-xs text-muted-foreground">(loading year...)</span>}</CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceOverview academicYearId={academicYearId} />
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
        <CardHeader>
          <CardTitle>Fee Collection Status</CardTitle>
          <CardDescription>Current academic year {loadingAY && <span className="text-xs text-muted-foreground">(loading year...)</span>}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="h-64 w-64">
            <FeeCollectionChart academicYearId={academicYearId} />
          </div>
        </CardContent>
        <div className="px-6 pb-6">
          <Button className="w-full">
            View Detailed Report
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
      
      <RecentActivitiesCard />
    </div>
  );
};

export const FinanceDashboardCards = () => {
  const navigate = useNavigate();
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
        <CardHeader>
          <CardTitle>Revenue vs Expenses</CardTitle>
          <CardDescription>Monthly financial overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <FinanceOverviewChart />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
        <CardHeader>
          <CardTitle>Payment Status</CardTitle>
          <CardDescription>Current academic year collection</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="h-64 w-64">
            <FeeCollectionChart />
          </div>
        </CardContent>
        <div className="px-6 pb-6">
          <Button className="w-full" onClick={() => navigate("/finance/reports")}>
            View Financial Details
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest payment activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
              <div>
                <p className="font-medium">John Smith - Grade 10</p>
                <p className="text-sm text-muted-foreground">Tuition Fee Payment</p>
              </div>
              <span className="text-green-600 font-medium">+$1,200</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
              <div>
                <p className="font-medium">Sarah Johnson - Grade 8</p>
                <p className="text-sm text-muted-foreground">Book Fee Payment</p>
              </div>
              <span className="text-green-600 font-medium">+$150</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
              <div>
                <p className="font-medium">Office Supplies</p>
                <p className="text-sm text-muted-foreground">Administrative Expense</p>
              </div>
              <span className="text-red-600 font-medium">-$450</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
        <CardHeader>
          <CardTitle>Outstanding Payments</CardTitle>
          <CardDescription>Students with pending fees</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
              <div>
                <p className="font-medium">Michael Brown</p>
                <p className="text-sm text-muted-foreground">Grade 9 - Due: Dec 15</p>
              </div>
              <Badge variant="destructive">$800</Badge>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
              <div>
                <p className="font-medium">Emily Davis</p>
                <p className="text-sm text-muted-foreground">Grade 11 - Due: Dec 20</p>
              </div>
              <Badge variant="destructive">$650</Badge>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
              <div>
                <p className="font-medium">Alex Wilson</p>
                <p className="text-sm text-muted-foreground">Grade 7 - Due: Dec 25</p>
              </div>
              <Badge variant="destructive">$450</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const ParentDashboardCards = () => {
  const { user } = useAuth();
  
  if (!user?.parentData) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {user.parentData.children.map((child) => (
        <React.Fragment key={child.id}>
          <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
            <CardHeader>
              <CardTitle>{child.name}'s Performance</CardTitle>
              <CardDescription>Latest grades in all courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {child.grades.map((grade, index) => (
                  <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-background/50">
                    <span className="font-medium">{grade.course}</span>
                    <Badge variant={
                      grade.grade.startsWith('A') ? 'default' :
                      grade.grade.startsWith('B') ? 'secondary' :
                      'outline'
                    }>
                      {grade.grade}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
            <CardHeader>
              <CardTitle>{child.name}'s Attendance</CardTitle>
              <CardDescription>Current academic year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Present</span>
                  <span className="text-green-600">{child.attendance.present}%</span>
                </div>
                <Progress value={child.attendance.present} className="h-2" />
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{child.attendance.absent}</div>
                    <div className="text-sm text-muted-foreground">Absent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{child.attendance.late}</div>
                    <div className="text-sm text-muted-foreground">Late</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{child.attendance.total}</div>
                    <div className="text-sm text-muted-foreground">Total Days</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </React.Fragment>
      ))}
    </div>
  );
};

export const StudentDashboardCards = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const studentPerformanceData = generateStudentPerformanceData(user);
  const assignmentStatusData = generateAssignmentStatusData(user);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
        <CardHeader>
          <CardTitle>My Performance</CardTitle>
          <CardDescription>Course scores compared to class average</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <StudentPerformanceChart data={studentPerformanceData} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
        <CardHeader>
          <CardTitle>Assignment Status</CardTitle>
          <CardDescription>Overview of your assignments</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="h-64 w-64">
            <AssignmentStatusChart data={assignmentStatusData} />
          </div>
        </CardContent>
        <div className="px-6 pb-6">
          <Button className="w-full" onClick={() => navigate("/assignments")}>
            View All Assignments
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export const TeacherDashboardCards = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (url: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1${url}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        throw new Error("Unauthorized - Please log in again");
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch data from ${url}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!token) {
          throw new Error("Authentication token not found");
        }

        const [classesData, attendanceData] = await Promise.all([
          fetchData("/teacher/my-upcoming-classes"),
          fetchData("/teacher/my-attendance-today"),
        ]);

        setClasses(classesData.classes || []);
        setAttendance(attendanceData.attendance || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load teacher dashboard data";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "teacher") {
      fetchTeacherData();
    }
  }, [user, token, toast]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, index) => (
          <div
            key={index}
            className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
        <CardHeader>
          <CardTitle>Class Attendance</CardTitle>
          <CardDescription>Today's attendance overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attendance.map((record, index) => (
              <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-background/50">
                <div>
                  <p className="font-medium">{record.className} - {record.courseName}</p>
                  <p className="text-sm text-muted-foreground">{record.enrolledStudents} students enrolled</p>
                </div>
                <Badge variant={record.presentStudents >= record.enrolledStudents * 0.9 ? 'default' : 'secondary'}>
                  {record.presentStudents} present
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
        <CardHeader>
          <CardTitle>Upcoming Classes</CardTitle>
          <CardDescription>Your schedule for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {classes.map((cls) => (
              <div key={cls.id} className="flex justify-between items-center p-3 rounded-lg bg-background/50">
                <div>
                  <p className="font-medium">{cls.courseName}</p>
                  <p className="text-sm text-muted-foreground">{cls.className} • {cls.room}</p>
                </div>
                <span className="text-sm font-medium">{cls.startTime}</span>
              </div>
            ))}
          </div>
        </CardContent>
        <div className="px-6 pb-6">
          <Button className="w-full" onClick={() => navigate("/teacher/schedules")}>
            View Full Schedule
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};