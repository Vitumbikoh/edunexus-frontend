import React from 'react';
import StatCard from '@/components/dashboard/StatCard';
import RecentActivitiesCard from '@/components/dashboard/RecentActivitiesCard';
import { Users, BookOpen, Calendar, DollarSign, ChevronRight, Check, Upload, FileText, Award, Download, Receipt, Calculator, FileHeart, Wallet, PlusCircle, CreditCard } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

// Finance data
const financeActivities = [
  {
    id: "fact1",
    user: {
      name: "Sarah Wilson",
      avatar: "https://ui-avatars.com/api/?name=Sarah+Wilson&background=0D8ABC&color=fff"
    },
    action: "processed tuition fee payment from Student #1245",
    time: "1 hour ago"
  },
  {
    id: "fact2",
    user: {
      name: "System",
      avatar: "https://ui-avatars.com/api/?name=System&background=2563EB&color=fff"
    },
    action: "generated Q2 financial report",
    time: "3 hours ago"
  },
  {
    id: "fact3",
    user: {
      name: "Finance User",
      avatar: "https://ui-avatars.com/api/?name=Finance+User&background=10B981&color=fff"
    },
    action: "updated budget allocation for IT department",
    time: "Yesterday at 4:30 PM"
  },
  {
    id: "fact4",
    user: {
      name: "John Davis",
      avatar: "https://ui-avatars.com/api/?name=John+Davis&background=F59E0B&color=fff"
    },
    action: "submitted expense report for approval",
    time: "Yesterday at 2:15 PM"
  }
];

const recentTransactions = [
  { id: 'TRX-001', date: '2025-04-22', description: 'Term 2 Tuition Fee', type: 'Income', amount: 1500, status: 'Completed' },
  { id: 'TRX-002', date: '2025-04-21', description: 'Library Resources', type: 'Expense', amount: 2500, status: 'Completed' },
  { id: 'TRX-003', date: '2025-04-20', description: 'Staff Salary Payment', type: 'Expense', amount: 45000, status: 'Completed' },
  { id: 'TRX-004', date: '2025-04-19', description: 'Registration Fees', type: 'Income', amount: 3200, status: 'Completed' },
  { id: 'TRX-005', date: '2025-04-18', description: 'Transport Fees', type: 'Income', amount: 800, status: 'Pending' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';
  const isFinance = user?.role === 'finance';
  
  // Finance stats
  const financeStats = {
    totalRevenue: 1250000,
    collectedFees: 980000,
    pendingFees: 270000,
    expensesBudget: 750000,
    expensesUsed: 520000,
  };

  const collectionPercentage = Math.round((financeStats.collectedFees / financeStats.totalRevenue) * 100);
  const budgetUsagePercentage = Math.round((financeStats.expensesUsed / financeStats.expensesBudget) * 100);
  
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
  
  if (isFinance) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Finance Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.name} - {user?.role === 'finance' ? 'Finance' : ''} Department
            </p>
          </div>
          
          <div className="flex space-x-2 mt-4 sm:mt-0">
            <Button onClick={() => navigate("/finance/record")}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Record Transaction
            </Button>
            <Button variant="outline" onClick={() => navigate("/finance/reports")}>
              <FileHeart className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${financeStats.totalRevenue.toLocaleString()}</div>
              <div className="mt-2">
                <Progress value={collectionPercentage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {collectionPercentage}% collected
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collected Fees</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${financeStats.collectedFees.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                From {financeStats.totalRevenue.toLocaleString()} total expected
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${financeStats.expensesUsed.toLocaleString()}</div>
              <div className="mt-2">
                <Progress value={budgetUsagePercentage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {budgetUsagePercentage}% of budget used
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Collection</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${financeStats.pendingFees.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((financeStats.pendingFees / financeStats.totalRevenue) * 100)}% of total revenue
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.id}</TableCell>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={transaction.type === 'Income' ? 'text-green-500' : 'text-red-500'}>
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={transaction.type === 'Income' ? 'text-green-500' : 'text-red-500'}>
                          {transaction.type === 'Income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={transaction.status === 'Completed' ? 'default' : 'secondary'}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => navigate("/finance")}>
                  View All Transactions
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Finance operations</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button className="justify-start" variant="outline" onClick={() => navigate("/finance/record")}>
                <CreditCard className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
              <Button className="justify-start" variant="outline" onClick={() => navigate("/finance/reports")}>
                <FileHeart className="mr-2 h-4 w-4" />
                Financial Reports
              </Button>
              <Button className="justify-start" variant="outline" onClick={() => navigate("/finance/budgets")}>
                <Calculator className="mr-2 h-4 w-4" />
                Budget Management
              </Button>
              <Button className="justify-start" variant="outline" onClick={() => navigate("/finance")}>
                <Receipt className="mr-2 h-4 w-4" />
                View Transactions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
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
            {isAdmin && (
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
            
            {isTeacher && (
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
            
            {isStudent && (
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