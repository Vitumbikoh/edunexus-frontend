
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import StatCard from '@/components/dashboard/StatCard';
import RecentActivitiesCard from '@/components/dashboard/RecentActivitiesCard';
import { Users, BookOpen, Calendar, DollarSign, ChevronRight, Check, Upload, FileText, Award, Download, Receipt, Calculator, FileHeart, Wallet, PlusCircle, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  Calendar,
  DollarSign,
  Users,
  BookOpen,
  Receipt,
  Calculator,
  FileHeart,
  Wallet,
  ArrowUpRight,
  PlusCircle,
  CreditCard,
  Download,
  Search,
  BarChart,
  FileText,
  Award,
  ChartPie,
  MessageSquare
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
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
      id: "act2",
      user: {
        name: "John Smith",
        avatar: "/assets/john-smith.jpg"
      },
      action: "updated class schedule",
      time: "5 hours ago"
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
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentActivitiesCard activities={adminActivities} />
            </CardContent>
          </Card>
          
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button className="justify-start" variant="outline" asChild>
                <Link to="/students">
                  <Users className="mr-2 h-4 w-4" />
                  View Students
                </Link>
              </Button>
              <Button className="justify-start" variant="outline" asChild>
                <Link to="/schedule">
                  <Calendar className="mr-2 h-4 w-4" />
                  View Schedule
                </Link>
              </Button>
              <Button className="justify-start" variant="outline" asChild>
                <Link to="/subjects">
                  <BookOpen className="mr-2 h-4 w-4" />
                  View Subjects
                </Link>
              </Button>
              <Button className="justify-start" variant="outline" asChild>
                <Link to="/finance">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Finance Management
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Admin Summary Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Student Enrollment Trends</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[200px] w-full bg-gray-100 rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">Student enrollment visualization</p>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-sm text-muted-foreground">New enrollments: 45 (last 30 days)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm text-muted-foreground">Total growth: +12% (year to date)</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fee Collection Overview</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[200px] w-full bg-gray-100 rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">Fee collection visualization</p>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-green-500">78%</p>
                  <p className="text-xs text-muted-foreground">Collected</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-yellow-500">17%</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-red-500">5%</p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Department Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
            <CardDescription>Academic performance by department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">Science Department</p>
                  <p className="text-sm text-muted-foreground">85%</p>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">Mathematics Department</p>
                  <p className="text-sm text-muted-foreground">92%</p>
                </div>
                <Progress value={92} className="h-2" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">Humanities Department</p>
                  <p className="text-sm text-muted-foreground">78%</p>
                </div>
                <Progress value={78} className="h-2" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">Arts Department</p>
                  <p className="text-sm text-muted-foreground">81%</p>
                </div>
                <Progress value={81} className="h-2" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">Physical Education</p>
                  <p className="text-sm text-muted-foreground">89%</p>
                </div>
                <Progress value={89} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // For teacher role
  if (user.role === 'teacher') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Teacher Dashboard</h1>
        <p className="text-muted-foreground">Welcome, {user.name}!</p>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="My Students"
            value={user.teacherData?.students?.length.toString() || "0"}
            icon={<Users className="h-4 w-4" />}
          />
          
          <StatCard
            title="My Classes"
            value={user.teacherData?.classes?.length.toString() || "0"}
            icon={<Calendar className="h-4 w-4" />}
          />
          
          <StatCard
            title="My Subjects"
            value={user.teacherData?.subjects?.length.toString() || "0"}
            icon={<BookOpen className="h-4 w-4" />}
          />
          
          <StatCard
            title="Pending Assignments"
            value="12"
            icon={<FileText className="h-4 w-4" />}
            trend={{ value: 2.5, isPositive: false }}
          />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="md:col-span-4">
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="bg-blue-100 p-2 rounded-md mr-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Mathematics - Class 10A</h3>
                    <p className="text-sm text-muted-foreground">9:00 AM - 10:30 AM • Room 101</p>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-100">
                  <div className="bg-green-100 p-2 rounded-md mr-3">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Physics - Class 11B</h3>
                    <p className="text-sm text-muted-foreground">11:00 AM - 12:30 PM • Room 204</p>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="bg-purple-100 p-2 rounded-md mr-3">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Staff Meeting</h3>
                    <p className="text-sm text-muted-foreground">2:00 PM - 3:00 PM • Conference Room</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button className="justify-start" variant="outline" asChild>
                <Link to="/my-students">
                  <Users className="mr-2 h-4 w-4" />
                  View My Students
                </Link>
              </Button>
              <Button className="justify-start" variant="outline" asChild>
                <Link to="/my-schedule">
                  <Calendar className="mr-2 h-4 w-4" />
                  View My Schedule
                </Link>
              </Button>
              <Button className="justify-start" variant="outline" asChild>
                <Link to="/take-attendance">
                  <Users className="mr-2 h-4 w-4" />
                  Take Attendance
                </Link>
              </Button>
              <Button className="justify-start" variant="outline" asChild>
                <Link to="/learning-materials">
                  <FileText className="mr-2 h-4 w-4" />
                  Upload Materials
                </Link>
              </Button>
              <Button className="justify-start" variant="outline" asChild>
                <Link to="/submit-grades">
                  <Award className="mr-2 h-4 w-4" />
                  Submit Grades
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // For student role
  if (user.role === 'student' && user.studentData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Student Dashboard</h1>
        <p className="text-muted-foreground">Welcome, {user.name}!</p>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Classes Today"
            value="4"
            icon={<Calendar className="h-4 w-4" />}
          />
          
          <StatCard
            title="Subjects"
            value={user.studentData.subjects.length.toString()}
            icon={<BookOpen className="h-4 w-4" />}
          />
          
          <StatCard
            title="Pending Assignments"
            value={user.studentData.assignments.filter(a => a.status === 'pending').length.toString()}
            icon={<FileText className="h-4 w-4" />}
            trend={{ value: user.studentData.assignments.filter(a => a.status === 'pending').length > 2 ? 1.5 : 0, isPositive: false }}
          />
          
          <StatCard
            title="Overall Grade"
            value="A-"
            icon={<Award className="h-4 w-4" />}
          />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="md:col-span-4">
            <CardHeader>
              <CardTitle>Recent Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.studentData.assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">{assignment.subject}</TableCell>
                      <TableCell>{assignment.title}</TableCell>
                      <TableCell>{assignment.dueDate}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          assignment.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          assignment.status === 'submitted' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                          'bg-green-50 text-green-700 border-green-200'
                        }>
                          {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button className="justify-start" variant="outline" asChild>
                <Link to="/assignments">
                  <FileText className="mr-2 h-4 w-4" />
                  View Assignments
                </Link>
              </Button>
              <Button className="justify-start" variant="outline" asChild>
                <Link to="/schedule">
                  <Calendar className="mr-2 h-4 w-4" />
                  View Schedule
                </Link>
              </Button>
              <Button className="justify-start" variant="outline" asChild>
                <Link to="/grades">
                  <Award className="mr-2 h-4 w-4" />
                  View Grades
                </Link>
              </Button>
              <Button className="justify-start" variant="outline" asChild>
                <Link to="/materials">
                  <Download className="mr-2 h-4 w-4" />
                  Download Materials
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // For parent role
  if (user.role === 'parent' && user.parentData) {
    const children = user.parentData.children || [];
    
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Parent Dashboard</h1>
        <p className="text-muted-foreground">Welcome, {user.name}!</p>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Children"
            value={children.length.toString()}
            icon={<Users className="h-4 w-4" />}
          />
          
          <StatCard
            title="Pending Assignments"
            value={children.reduce((total, child) => 
              total + child.assignments.filter(a => a.status === 'pending').length, 0).toString()}
            icon={<FileText className="h-4 w-4" />}
          />
          
          <StatCard
            title="Total Fees"
            value={`$${children.reduce((total, child) => total + child.fees.total, 0).toLocaleString()}`}
            icon={<DollarSign className="h-4 w-4" />}
          />
          
          <StatCard
            title="Pending Fees"
            value={`$${children.reduce((total, child) => total + child.fees.pending, 0).toLocaleString()}`}
            icon={<Wallet className="h-4 w-4" />}
            trend={{ 
              value: children.reduce((total, child) => total + child.fees.pending, 0) > 1000 ? 5 : 0, 
              isPositive: false 
            }}
          />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="md:col-span-4">
            <CardHeader>
              <CardTitle>Children Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {children.map((child) => (
                  <div key={child.id} className="bg-card p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">{child.name}</h3>
                      <Badge variant="outline">Grade {child.grade}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Attendance</p>
                        <div className="flex items-end gap-2 mt-1">
                          <span className="text-xl font-bold">{Math.round((child.attendance.present / child.attendance.total) * 100)}%</span>
                          <span className="text-xs text-muted-foreground">
                            ({child.attendance.present}/{child.attendance.total} days)
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground">Fee Status</p>
                        <div className="flex items-end gap-2 mt-1">
                          <span className="text-xl font-bold">{Math.round((child.fees.paid / child.fees.total) * 100)}%</span>
                          <span className="text-xs text-muted-foreground">
                            Paid (Due: {child.fees.dueDate})
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <Progress value={Math.round((child.fees.paid / child.fees.total) * 100)} className="h-2 mb-1" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button className="justify-start" variant="outline" asChild>
                <Link to="/children/performance">
                  <ChartPie className="mr-2 h-4 w-4" />
                  Children's Performance
                </Link>
              </Button>
              <Button className="justify-start" variant="outline" asChild>
                <Link to="/attendance">
                  <Users className="mr-2 h-4 w-4" />
                  View Attendance
                </Link>
              </Button>
              <Button className="justify-start" variant="outline" asChild>
                <Link to="/finance">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Fee Payments
                </Link>
              </Button>
              <Button className="justify-start" variant="outline" asChild>
                <Link to="/messages">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Contact Teachers
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Default dashboard for any other user roles (fallback)
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard</h1>
      <p className="text-muted-foreground">Welcome, {user.name}! Your personalized dashboard is being set up.</p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <h3 className="font-medium mb-2">Quick Navigation</h3>
          <p className="text-sm text-muted-foreground">Use the sidebar menu to navigate to different sections.</p>
        </Card>
      </div>
    </div>
  );
}

// Finance-specific dashboard
function FinanceDashboard({ user }: { user: any }) {
  // Finance activities data
  const financeActivities = [
    {
      id: "fact1",
      user: {
        name: "Sarah Wilson",
        avatar: "/assets/sarah-wilson.jpg"
      },
      action: "processed tuition fee payment from Student #1245",
      time: "1 hour ago"
    },
    {
      id: "fact2",
      user: {
        name: "System",
        avatar: "/assets/system.jpg"
      },
      action: "generated Q2 financial report",
      time: "3 hours ago"
    },
    {
      id: "fact3",
      user: {
        name: user.name,
        avatar: user.avatar
      },
      action: "updated budget allocation for IT department",
      time: "Yesterday at 4:30 PM"
    },
    {
      id: "fact4",
      user: {
        name: "John Davis",
        avatar: "/assets/john-davis.jpg"
      },
      action: "submitted expense report for approval",
      time: "Yesterday at 2:15 PM"
    }
  ];

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

  // Recent transactions data
  const recentTransactions = [
    { id: 'TRX-001', date: '2025-04-22', description: 'Term 2 Tuition Fee', type: 'Income', amount: 1500, status: 'Completed' },
    { id: 'TRX-002', date: '2025-04-21', description: 'Library Resources', type: 'Expense', amount: 2500, status: 'Completed' },
    { id: 'TRX-003', date: '2025-04-20', description: 'Staff Salary Payment', type: 'Expense', amount: 45000, status: 'Completed' },
    { id: 'TRX-004', date: '2025-04-19', description: 'Registration Fees', type: 'Income', amount: 3200, status: 'Completed' },
    { id: 'TRX-005', date: '2025-04-18', description: 'Transport Fees', type: 'Income', amount: 800, status: 'Pending' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.name} - {user.financeData?.department || 'Finance'} Department
          </p>
        </div>
        
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <Button asChild>
            <Link to="/finance/record">
              <PlusCircle className="mr-2 h-4 w-4" />
              Record Transaction
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/finance/reports">
              <FileHeart className="mr-2 h-4 w-4" />
              Generate Report
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4">
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
              <Button variant="outline" size="sm" asChild>
                <Link to="/finance">View All Transactions</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Finance operations</CardDescription>
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