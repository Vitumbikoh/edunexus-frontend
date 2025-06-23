import React from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from "@/components/ui/badge";
import RecentActivitiesCard from '@/components/dashboard/RecentActivitiesCard';
import { Progress } from '@radix-ui/react-progress';
import { mockActivities } from './mockData';

export const AdminDashboardCards = () => {
  const navigate = useNavigate();
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
        <CardHeader>
          <CardTitle>Class Performance</CardTitle>
          <CardDescription>Average scores by course</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ClassPerformanceChart />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
        <CardHeader>
          <CardTitle>Attendance Overview</CardTitle>
          <CardDescription>Current month attendance by class</CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceOverview />
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
        <CardHeader>
          <CardTitle>Fee Collection Status</CardTitle>
          <CardDescription>Current academic year</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="h-64 w-64">
            <FeeCollectionChart />
          </div>
        </CardContent>
        <div className="px-6 pb-6">
          <Button className="w-full">
            View Detailed Report
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
      
      <RecentActivitiesCard activities={mockActivities} />
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
          <Button className="w-full" onClick={() => navigate("/finance")}>
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
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
        <CardHeader>
          <CardTitle>Class Attendance</CardTitle>
          <CardDescription>Today's attendance overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
              <div>
                <p className="font-medium">Class 9A - Mathematics</p>
                <p className="text-sm text-muted-foreground">24 students enrolled</p>
              </div>
              <Badge variant="default">22 present</Badge>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
              <div>
                <p className="font-medium">Class 10B - Physics</p>
                <p className="text-sm text-muted-foreground">26 students enrolled</p>
              </div>
              <Badge variant="default">25 present</Badge>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
              <div>
                <p className="font-medium">Class 11A - Chemistry</p>
                <p className="text-sm text-muted-foreground">20 students enrolled</p>
              </div>
              <Badge variant="secondary">18 present</Badge>
            </div>
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
            <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
              <div>
                <p className="font-medium">Mathematics</p>
                <p className="text-sm text-muted-foreground">Class 9A • Room 201</p>
              </div>
              <span className="text-sm font-medium">10:00 AM</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
              <div>
                <p className="font-medium">Physics</p>
                <p className="text-sm text-muted-foreground">Class 10B • Lab 1</p>
              </div>
              <span className="text-sm font-medium">1:00 PM</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
              <div>
                <p className="font-medium">Chemistry</p>
                <p className="text-sm text-muted-foreground">Class 11A • Lab 2</p>
              </div>
              <span className="text-sm font-medium">3:00 PM</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};