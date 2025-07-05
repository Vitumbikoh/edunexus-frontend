import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from '@/components/ui/progress';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, CreditCard, Calendar, AlertTriangle } from "lucide-react";

export default function ParentFinance() {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Please log in to view financial data.</p>
      </div>
    );
  }

  // Calculate total finances across all children
  const totalFees = user.parentData?.children?.reduce((sum, child) => sum + child.fees.total, 0) || 0;
  const totalPaid = user.parentData?.children?.reduce((sum, child) => sum + child.fees.paid, 0) || 0;
  const totalPending = user.parentData?.children?.reduce((sum, child) => sum + child.fees.pending, 0) || 0;

  // Mock payment history
  const paymentHistory = [
    { id: '1', child: 'Emma Johnson', amount: 800, date: '2024-01-15', type: 'Tuition Fee', status: 'Paid' },
    { id: '2', child: 'Alex Johnson', amount: 600, date: '2024-01-15', type: 'Tuition Fee', status: 'Paid' },
    { id: '3', child: 'Emma Johnson', amount: 200, date: '2024-01-10', type: 'Activity Fee', status: 'Paid' },
    { id: '4', child: 'Alex Johnson', amount: 150, date: '2024-01-10', type: 'Lab Fee', status: 'Paid' },
    { id: '5', child: 'Emma Johnson', amount: 300, date: '2023-12-20', type: 'Book Fee', status: 'Paid' },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Overview</h1>
          <p className="text-muted-foreground mt-2">Manage your children's fees and payment history</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={totalPending > 0 ? "destructive" : "default"} className="text-sm">
            {totalPending > 0 ? `$${totalPending} pending` : 'All paid'}
          </Badge>
        </div>
      </div>

      {/* Overall Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalFees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Academic year 2023-2024
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((totalPaid / totalFees) * 100)}% of total fees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalPending > 0 ? 'text-red-500' : 'text-green-600'}`}>
              ${totalPending.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Due by January 30, 2024
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Individual Child Finances */}
      <div className="grid grid-cols-1 gap-6">
        {user.parentData?.children?.map((child) => (
          <Card key={child.id}>
            <CardHeader>
              <CardTitle>{child.name} - Financial Details</CardTitle>
              <CardDescription>Grade: {child.grade}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Fee Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-background p-4 rounded-lg border">
                  <div className="text-sm text-muted-foreground">Total Fees</div>
                  <div className="text-2xl font-bold">${child.fees.total}</div>
                  <div className="text-sm text-muted-foreground mt-2">Academic year</div>
                </div>
                
                <div className="bg-background p-4 rounded-lg border">
                  <div className="text-sm text-muted-foreground">Amount Paid</div>
                  <div className="text-2xl font-bold text-green-600">${child.fees.paid}</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {Math.round((child.fees.paid / child.fees.total) * 100)}% completed
                  </div>
                </div>
                
                <div className="bg-background p-4 rounded-lg border">
                  <div className="text-sm text-muted-foreground">Pending</div>
                  <div className={`text-2xl font-bold ${child.fees.pending > 0 ? 'text-red-500' : 'text-green-600'}`}>
                    ${child.fees.pending}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">Due: {child.fees.dueDate}</div>
                </div>
              </div>

              {/* Payment Progress */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Payment Progress</span>
                  <span className="text-sm text-muted-foreground">
                    ${child.fees.paid} / ${child.fees.total}
                  </span>
                </div>
                <Progress value={Math.round((child.fees.paid / child.fees.total) * 100)} className="h-2" />
              </div>

              {/* Action Buttons */}
              {child.fees.pending > 0 && (
                <div className="flex space-x-2">
                  <Button>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay Now (${child.fees.pending})
                  </Button>
                  <Button variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    Set up Payment Plan
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payment History</CardTitle>
          <CardDescription>Your recent fee payments and transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>Recent payment transactions</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Child</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentHistory.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.date}</TableCell>
                  <TableCell className="font-medium">{payment.child}</TableCell>
                  <TableCell>{payment.type}</TableCell>
                  <TableCell className="text-right">${payment.amount}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="default" className="text-green-700 bg-green-100">
                      {payment.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}