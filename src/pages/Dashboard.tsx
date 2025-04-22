
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
  BarChart
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
  
  // Default dashboard for other user roles (teacher, student, parent)
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard</h1>
      <p>Welcome, {user.name}! Your personalized dashboard is loading...</p>
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
