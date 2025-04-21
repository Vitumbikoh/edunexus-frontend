
import React from 'react';
import StatCard from '@/components/dashboard/StatCard';
import RecentActivitiesCard from '@/components/dashboard/RecentActivitiesCard';
import { Users, BookOpen, Calendar, DollarSign, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Mock data
const mockActivities = [
  {
    id: '1',
    user: {
      name: 'Jane Cooper',
      avatar: 'https://ui-avatars.com/api/?name=Jane+Cooper&background=0D8ABC&color=fff',
    },
    action: 'submitted the math assignment',
    time: '2 hours ago',
  },
  {
    id: '2',
    user: {
      name: 'Robert Fox',
      avatar: 'https://ui-avatars.com/api/?name=Robert+Fox&background=2563EB&color=fff',
    },
    action: 'created a new event: Parent-Teacher Meeting',
    time: '4 hours ago',
  },
  {
    id: '3',
    user: {
      name: 'Leslie Alexander',
      avatar: 'https://ui-avatars.com/api/?name=Leslie+Alexander&background=10B981&color=fff',
    },
    action: 'updated the science curriculum',
    time: 'Yesterday at 2:30 PM',
  },
  {
    id: '4',
    user: {
      name: 'Kristin Watson',
      avatar: 'https://ui-avatars.com/api/?name=Kristin+Watson&background=F59E0B&color=fff',
    },
    action: 'completed grade submission for Class 10B',
    time: 'Yesterday at 11:15 AM',
  },
];

// Mock attendance data
const attendanceData = [
  { name: 'Class 9A', value: 92 },
  { name: 'Class 9B', value: 88 },
  { name: 'Class 10A', value: 95 },
  { name: 'Class 10B', value: 85 },
  { name: 'Class 11A', value: 90 },
  { name: 'Class 11B', value: 93 },
];

// Mock performance data
const performanceData = [
  { name: 'Math', students: 95, average: 78 },
  { name: 'Science', students: 90, average: 82 },
  { name: 'English', students: 88, average: 85 },
  { name: 'History', students: 85, average: 75 },
  { name: 'Computer', students: 92, average: 88 },
];

// Mock fee collection data
const feeCollection = [
  { name: 'Collected', value: 75 },
  { name: 'Pending', value: 25 },
];

const COLORS = ['#0088FE', '#FFBB28', '#00C49F', '#FF8042', '#8884D8', '#82ca9d'];
const PIE_COLORS = ['#10B981', '#F97316'];

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Students" 
          value="1,235" 
          icon={<Users size={24} />} 
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard 
          title="Total Courses" 
          value="42" 
          icon={<BookOpen size={24} />} 
          trend={{ value: 4, isPositive: true }}
        />
        <StatCard 
          title="Upcoming Events" 
          value="8" 
          icon={<Calendar size={24} />} 
        />
        <StatCard 
          title="Fee Collection" 
          value="$24,500" 
          icon={<DollarSign size={24} />} 
          trend={{ value: 8, isPositive: false }}
        />
      </div>
      
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Class Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Class Performance</CardTitle>
              <CardDescription>Average scores by subject</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ChartContainer
                  config={{
                    students: { theme: { light: "#0ea5e9", dark: "#0ea5e9" } },
                    average: { theme: { light: "#f97316", dark: "#f97316" } },
                  }}
                >
                  <BarChart
                    data={performanceData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                    />
                    <Bar dataKey="students" fill="var(--color-students)" name="Students" />
                    <Bar dataKey="average" fill="var(--color-average)" name="Class Average" />
                  </BarChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Overview</CardTitle>
              <CardDescription>Current month attendance by class</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {attendanceData.map((item, index) => (
                  <div key={item.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-sm font-medium">{item.value}%</span>
                    </div>
                    <Progress value={item.value} className="h-2" 
                      style={{ 
                        backgroundColor: 'rgba(0,0,0,0.1)', 
                      }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Fee Collection Status */}
          <Card>
            <CardHeader>
              <CardTitle>Fee Collection Status</CardTitle>
              <CardDescription>Current academic year</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="h-64 w-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={feeCollection}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {feeCollection.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
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
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!isAdmin && <RecentActivitiesCard activities={mockActivities} />}
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.role === 'admin' && (
              <>
                <Button className="w-full" asChild>
                  <a href="/students/new">Add New Student</a>
                </Button>
                <Button className="w-full" asChild>
                  <a href="/teachers/new">Add New Teacher</a>
                </Button>
                <Button className="w-full" asChild>
                  <a href="/subjects/new">Create New Course</a>
                </Button>
                <Button className="w-full" asChild>
                  <a href="/finance/record">Record Payment</a>
                </Button>
              </>
            )}
            
            {user?.role === 'teacher' && (
              <>
                <Button className="w-full">Take Attendance</Button>
                <Button className="w-full">Upload Learning Materials</Button>
                <Button className="w-full">Submit Grades</Button>
                <Button className="w-full">View Class Schedule</Button>
              </>
            )}
            
            {user?.role === 'student' && (
              <>
                <Button className="w-full">View Assignments</Button>
                <Button className="w-full">Check Grades</Button>
                <Button className="w-full">View Schedule</Button>
                <Button className="w-full">Download Learning Materials</Button>
              </>
            )}
            
            {user?.role === 'parent' && (
              <>
                <Button className="w-full">View Child's Performance</Button>
                <Button className="w-full">Pay Fees</Button>
                <Button className="w-full">Contact Teachers</Button>
                <Button className="w-full">View Attendance</Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
