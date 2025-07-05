import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { DollarSign, CreditCard, AlertCircle, Download, Eye } from 'lucide-react';

// Mock finance data for parent view
const mockFinanceData = {
  overview: {
    totalFees: 5000,
    totalPaid: 3500,
    totalOutstanding: 1500,
    nextPaymentDue: '2024-02-15'
  },
  transactions: [
    {
      id: '1',
      studentName: 'John Doe',
      description: 'Tuition Fee - Fall Semester',
      amount: 2500,
      dueDate: '2024-01-31',
      paidDate: '2024-01-15',
      status: 'Paid',
      type: 'Tuition'
    },
    {
      id: '2',
      studentName: 'Jane Doe',
      description: 'Library Fee',
      amount: 150,
      dueDate: '2024-02-15',
      paidDate: null,
      status: 'Pending',
      type: 'Fee'
    },
    {
      id: '3',
      studentName: 'John Doe',
      description: 'Laboratory Fee',
      amount: 300,
      dueDate: '2024-02-20',
      paidDate: null,
      status: 'Overdue',
      type: 'Fee'
    },
    {
      id: '4',
      studentName: 'Jane Doe',
      description: 'Sports Activity Fee',
      amount: 200,
      dueDate: '2024-03-01',
      paidDate: null,
      status: 'Upcoming',
      type: 'Activity'
    }
  ]
};

export default function ParentFinance() {
  const { user } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  if (!user?.parentData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>No finance data available.</p>
      </div>
    );
  }

  const filteredTransactions = mockFinanceData.transactions.filter(transaction => {
    const matchesStudent = selectedStudent === 'all' || transaction.studentName.toLowerCase().includes(selectedStudent.toLowerCase());
    const matchesStatus = statusFilter === 'all' || transaction.status.toLowerCase() === statusFilter;
    return matchesStudent && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'Upcoming': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const paymentProgress = (mockFinanceData.overview.totalPaid / mockFinanceData.overview.totalFees) * 100;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance Overview</h1>
          <p className="text-muted-foreground mt-2">Track fees, payments, and financial obligations for your children</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Statement
          </Button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-primary" />
              Total Fees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mockFinanceData.overview.totalFees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Academic year 2024</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CreditCard className="h-4 w-4 mr-2 text-green-600" />
              Amount Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${mockFinanceData.overview.totalPaid.toLocaleString()}</div>
            <Progress value={paymentProgress} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">{paymentProgress.toFixed(0)}% of total fees</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
              Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${mockFinanceData.overview.totalOutstanding.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Due by {mockFinanceData.overview.nextPaymentDue}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {filteredTransactions.filter(t => t.status === 'Paid').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of {filteredTransactions.length} payments completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Student-wise Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {user.parentData.children.map((child) => (
          <Card key={child.id} className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{child.name}'s Finances</span>
                <Badge variant="outline">{child.grade}</Badge>
              </CardTitle>
              <CardDescription>Financial summary for current academic year</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background p-3 rounded-lg border">
                  <div className="text-sm text-muted-foreground">Total Paid</div>
                  <div className="text-xl font-bold text-green-600">
                    ${filteredTransactions
                      .filter(t => t.studentName === child.name && t.status === 'Paid')
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toLocaleString()}
                  </div>
                </div>
                <div className="bg-background p-3 rounded-lg border">
                  <div className="text-sm text-muted-foreground">Outstanding</div>
                  <div className="text-xl font-bold text-red-600">
                    ${filteredTransactions
                      .filter(t => t.studentName === child.name && t.status !== 'Paid')
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History & Upcoming Fees</CardTitle>
          <CardDescription>Detailed view of all fees and payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {user.parentData.children.map((child) => (
                  <SelectItem key={child.id} value={child.name.toLowerCase()}>
                    {child.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.studentName}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{transaction.type}</Badge>
                    </TableCell>
                    <TableCell>{new Date(transaction.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${transaction.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No financial records found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}