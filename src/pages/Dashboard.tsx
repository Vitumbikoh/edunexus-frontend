import React from 'react';
import StatCard from '@/components/dashboard/StatCard';
import RecentActivitiesCard from '@/components/dashboard/RecentActivitiesCard';
import { Users, BookOpen, Calendar, DollarSign, ChevronRight, Check, Upload, FileText, Award, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip,
  ResponsiveContainer
} from 'recharts';

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

const attendanceData = [
  { name: 'Class 9A', value: 92 },
  { name: 'Class 9B', value: 88 },
  { name: 'Class 10A', value: 95 },
  { name: 'Class 10B', value: 85 },
  { name: 'Class 11A', value: 90 },
  { name: 'Class 11B', value: 93 },
];

const performanceData = [
  { name: 'Math', students: 95, average: 78 },
  { name: 'Science', students: 90, average: 82 },
  { name: 'English', students: 88, average: 85 },
  { name: 'History', students: 85, average: 75 },
  { name: 'Computer', students: 92, average: 88 },
];

const feeCollection = [
  { name: 'Collected', value: 75 },
  { name: 'Pending', value: 25 },
];

const COLORS = ['#0088FE', '#FFBB28', '#00C49F', '#FF8042', '#8884D8', '#82ca9d'];
const PIE_COLORS = ['#10B981', '#F97316'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';
  const isParent = user?.role === 'parent';
  
  const teacherStats = [
    { 
      title: "My Students", 
      value: isTeacher && user.teacherData ? `${user.teacherData.students.length}` : "0", 
      icon: <Users size={24} />, 
      className: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10" 
    },
    { 
      title: "My Subjects", 
      value: isTeacher && user.teacherData ? `${user.teacherData.subjects.length}` : "0", 
      icon: <BookOpen size={24} />, 
      className: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10" 
    },
    { 
      title: "My Classes", 
      value: isTeacher && user.teacherData ? `${user.teacherData.classes.length}` : "0", 
      icon: <Calendar size={24} />,
      className: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10" 
    },
    { 
      title: "Today's Classes", 
      value: "3", 
      icon: <Calendar size={24} />, 
      className: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10"
    },
  ];
  
  const studentStats = [
    { 
      title: "My Subjects", 
      value: isStudent && user.studentData ? `${user.studentData.subjects.length}` : "0", 
      icon: <BookOpen size={24} />, 
      className: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10" 
    },
    { 
      title: "Assignments", 
      value: isStudent && user.studentData ? `${user.studentData.assignments.length}` : "0", 
      icon: <FileText size={24} />, 
      className: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10" 
    },
    { 
      title: "Class Rank", 
      value: "3", 
      icon: <Award size={24} />,
      className: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10" 
    },
    { 
      title: "Today's Classes", 
      value: "4", 
      icon: <Calendar size={24} />, 
      className: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10"
    },
  ];
  
  const generateStudentPerformanceData = () => {
    if (!isStudent || !user?.studentData) return [];
    
    return user.studentData.subjects.map(subject => {
      const grade = user.studentData?.grades.find(g => g.subject === subject)?.grade || '';
      let score = 0;
      
      if (grade.startsWith('A')) score = 90 + Math.floor(Math.random() * 10);
      else if (grade.startsWith('B')) score = 80 + Math.floor(Math.random() * 10);
      else if (grade.startsWith('C')) score = 70 + Math.floor(Math.random() * 10);
      else if (grade.startsWith('D')) score = 60 + Math.floor(Math.random() * 10);
      else score = 50 + Math.floor(Math.random() * 10);
      
      return {
        name: subject,
        score: score,
        average: Math.min(Math.max(score - 5 - Math.floor(Math.random() * 10), 50), 95)
      };
    });
  };
  
  const studentPerformanceData = generateStudentPerformanceData();
  
  const generateAssignmentStatusData = () => {
    if (!isStudent || !user?.studentData) return [];
    
    const pending = user.studentData.assignments.filter(a => a.status === 'pending').length;
    const submitted = user.studentData.assignments.filter(a => a.status === 'submitted').length;
    const graded = user.studentData.assignments.filter(a => a.status === 'graded').length;
    
    return [
      { name: 'Pending', value: pending },
      { name: 'Submitted', value: submitted },
      { name: 'Graded', value: graded }
    ];
  };
  
  const assignmentStatusData = generateAssignmentStatusData();
  
  const ASSIGNMENT_COLORS = ['#f97316', '#3b82f6', '#10b981'];
  
  const parentStats = user?.parentData?.children.map((child) => [
    { 
      title: `${child.name}'s Attendance`, 
      value: `${child.attendance.present}%`, 
      icon: Users, 
      className: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10" 
    },
    { 
      title: `${child.name}'s Classes`, 
      value: `${child.subjects.length}`, 
      icon: BookOpen, 
      className: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10" 
    },
    { 
      title: `${child.name}'s Assignments`, 
      value: `${child.assignments.length}`, 
      icon: FileText,
      className: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10" 
    },
    { 
      title: `${child.name}'s Fees Due`, 
      value: `$${child.fees.pending}`, 
      icon: DollarSign, 
      className: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10"
    },
  ]).flat() || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isAdmin ? (
          <>
            <StatCard 
              title="Total Students" 
              value="1,235" 
              icon={<Users size={24} />} 
              trend={{ value: 12, isPositive: true }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10"
            />
            <StatCard 
              title="Total Courses" 
              value="42" 
              icon={<BookOpen size={24} />} 
              trend={{ value: 4, isPositive: true }}
              className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10"
            />
            <StatCard 
              title="Upcoming Events" 
              value="8" 
              icon={<Calendar size={24} />}
              className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10" 
            />
            <StatCard 
              title="Fee Collection" 
              value="$24,500" 
              icon={<DollarSign size={24} />} 
              trend={{ value: 8, isPositive: false }}
              className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10"
            />
          </>
        ) : isTeacher ? (
          teacherStats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              className={stat.className}
            />
          ))
        ) : isStudent ? (
          studentStats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              className={stat.className}
            />
          ))
        ) : isParent ? (
          parentStats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              className={stat.className}
            />
          ))
        ) : (
          <>
            <StatCard 
              title="Total Students" 
              value="1,235" 
              icon={<Users size={24} />} 
              className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10"
            />
            <StatCard 
              title="Total Courses" 
              value="42" 
              icon={<BookOpen size={24} />} 
              className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10"
            />
            <StatCard 
              title="Upcoming Events" 
              value="8" 
              icon={<Calendar size={24} />}
              className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10" 
            />
            <StatCard 
              title="Fee Collection" 
              value="$24,500" 
              icon={<DollarSign size={24} />} 
              className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10"
            />
          </>
        )}
      </div>
      
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
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
                    <Bar dataKey="students" fill="var(--color-students)" name="Students" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="average" fill="var(--color-average)" name="Class Average" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
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
                    <Progress 
                      value={item.value} 
                      className="h-2" 
                      indicatorClassName={`bg-gradient-to-r ${
                        item.value >= 90 ? 'from-green-400 to-green-500' :
                        item.value >= 80 ? 'from-blue-400 to-blue-500' :
                        'from-orange-400 to-orange-500'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
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
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#F97316'} />
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
      
      {isParent && user?.parentData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {user.parentData.children.map((child) => (
            <React.Fragment key={child.id}>
              <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
                <CardHeader>
                  <CardTitle>{child.name}'s Performance</CardTitle>
                  <CardDescription>Latest grades in all subjects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {child.grades.map((grade, index) => (
                      <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-background/50">
                        <span className="font-medium">{grade.subject}</span>
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
      )}
      
      {isStudent && user?.studentData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
            <CardHeader>
              <CardTitle>My Performance</CardTitle>
              <CardDescription>Subject scores compared to class average</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ChartContainer
                  config={{
                    score: { theme: { light: "#7c3aed", dark: "#7c3aed" } },
                    average: { theme: { light: "#94a3b8", dark: "#94a3b8" } },
                  }}
                >
                  <BarChart
                    data={studentPerformanceData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                    />
                    <Bar dataKey="score" fill="var(--color-score)" name="Your Score" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="average" fill="var(--color-average)" name="Class Average" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
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
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assignmentStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {assignmentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={ASSIGNMENT_COLORS[index % ASSIGNMENT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
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
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!isAdmin && <RecentActivitiesCard activities={mockActivities} />}
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.role === 'parent' && (
              <>
                <Button className="w-full" onClick={() => navigate("/children/performance")}>
                  <Chart className="mr-2 h-4 w-4" />
                  View Children's Performance
                </Button>
                <Button className="w-full" onClick={() => navigate("/finance")}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Pay Fees
                </Button>
                <Button className="w-full" onClick={() => navigate("/attendance")}>
                  <Users className="mr-2 h-4 w-4" />
                  View Attendance
                </Button>
                <Button className="w-full" onClick={() => navigate("/messages")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Contact Teachers
                </Button>
              </>
            )}
            
            {user?.role === 'teacher' && (
              <>
                <Button className="w-full" onClick={() => navigate("/take-attendance")}>
                  <Check className="mr-2 h-4 w-4" />
                  Take Attendance
                </Button>
                <Button className="w-full" onClick={() => navigate("/learning-materials")}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Learning Materials
                </Button>
                <Button className="w-full" onClick={() => navigate("/submit-grades")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Submit Grades
                </Button>
                <Button className="w-full" onClick={() => navigate("/my-schedule")}>
                  <Calendar className="mr-2 h-4 w-4" />
                  View Class Schedule
                </Button>
              </>
            )}
            
            {user?.role === 'student' && (
              <>
                <Button className="w-full" onClick={() => navigate("/assignments")}>
                  <FileText className="mr-2 h-4 w-4" />
                  View Assignments
                </Button>
                <Button className="w-full" onClick={() => navigate("/grades")}>
                  <Award className="mr-2 h-4 w-4" />
                  Check Grades
                </Button>
                <Button className="w-full" onClick={() => navigate("/schedule")}>
                  <Calendar className="mr-2 h-4 w-4" />
                  View Schedule
                </Button>
                <Button className="w-full" onClick={() => navigate("/materials")}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Learning Materials
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
