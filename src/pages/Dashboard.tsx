
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import StatCard from '@/components/dashboard/StatCard';
import RecentActivitiesCard from '@/components/dashboard/RecentActivitiesCard';
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
  Award
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

export default function Dashboard() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  // Sample recent activities data for admin dashboard
  const adminActivities = [
    {
      id: "act1",
      user: {
        name: "Sarah Wilson",
        avatar: "/assets/sarah-wilson.jpg"
      },
      action: "registered a new student",
      time: "2 hours ago"
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
      id: "act3",
      user: {
        name: "System",
        avatar: "/assets/system.jpg"
      },
      action: "generated attendance report",
      time: "1 day ago"
    }
  ];
  
  // Render finance dashboard if user is finance
  if (user.role === 'finance') {
    return <FinanceDashboard user={user} />;
  }
  
  // For admin role, render admin dashboard
  if (user.role === 'admin') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Students"
            value="1,235"
            icon={<Users className="h-4 w-4" />}
            trend={{ value: 3.2, isPositive: true }}
          />
          
          <StatCard
            title="Total Courses"
            value="42"
            icon={<BookOpen className="h-4 w-4" />}
          />
          
          <StatCard
            title="Upcoming Events"
            value="8"
            icon={<Calendar className="h-4 w-4" />}
          />
          
          <StatCard
            title="Fee Collection"
            value="$24,500"
            icon={<DollarSign className="h-4 w-4" />}
            trend={{ value: 10.5, isPositive: true }}
          />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="md:col-span-4">
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
          <CardContent className="flex flex-col gap-2">
            <Button className="justify-start" variant="outline" asChild>
              <Link to="/finance/record">
                <CreditCard className="mr-2 h-4 w-4" />
                Record Payment
              </Link>
            </Button>
            <Button className="justify-start" variant="outline" asChild>
              <Link to="/finance/reports">
                <FileHeart className="mr-2 h-4 w-4" />
                Financial Reports
              </Link>
            </Button>
            <Button className="justify-start" variant="outline" asChild>
              <Link to="/finance/budgets">
                <Calculator className="mr-2 h-4 w-4" />
                Budget Management
              </Link>
            </Button>
            <Button className="justify-start" variant="outline" asChild>
              <Link to="/finance">
                <Receipt className="mr-2 h-4 w-4" />
                View Transactions
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
