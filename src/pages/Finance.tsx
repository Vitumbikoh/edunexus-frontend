
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, BarChart } from "@/components/ui/chart";
import { DollarSign } from 'lucide-react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Mock data
const feePayments = [
  { id: "1", student: "John Doe", grade: "10A", amount: "$1200", status: "Paid", date: "2023-03-05" },
  { id: "2", student: "Jane Smith", grade: "9B", amount: "$1200", status: "Paid", date: "2023-03-02" },
  { id: "3", student: "Michael Johnson", grade: "11C", amount: "$1500", status: "Pending", date: "2023-03-10" },
  { id: "4", student: "Emily Davis", grade: "10A", amount: "$1200", status: "Paid", date: "2023-03-01" },
  { id: "5", student: "Robert Wilson", grade: "9B", amount: "$1200", status: "Overdue", date: "2023-02-15" },
  { id: "6", student: "Sarah Brown", grade: "11C", amount: "$1500", status: "Paid", date: "2023-03-04" },
  { id: "7", student: "David Miller", grade: "10A", amount: "$1200", status: "Pending", date: "2023-03-12" },
];

// Revenue data for charts
const revenueData = [
  {
    name: "Jan",
    total: 15000,
  },
  {
    name: "Feb",
    total: 18500,
  },
  {
    name: "Mar",
    total: 24500,
  },
  {
    name: "Apr",
    total: 21000,
  },
  {
    name: "May",
    total: 22000,
  },
  {
    name: "Jun",
    total: 19000,
  },
];

// Expense Categories data
const expenseData = [
  {
    name: "Salaries",
    total: 45000,
  },
  {
    name: "Maintenance",
    total: 12000,
  },
  {
    name: "Utilities",
    total: 8000,
  },
  {
    name: "Supplies",
    total: 6500,
  },
  {
    name: "Transportation",
    total: 4500,
  },
  {
    name: "Others",
    total: 3000,
  },
];

export default function Finance() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Finance Management</h1>
          <p className="text-muted-foreground">Manage school financial records</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">Generate Report</Button>
          <Button>Record Payment</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <h3 className="text-2xl font-bold mt-1">$124,500</h3>
                <p className="text-sm text-muted-foreground mt-1">This academic year</p>
              </div>
              <div className="p-2 rounded-full bg-green-100 text-green-600">
                <DollarSign size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                <h3 className="text-2xl font-bold mt-1">$12,800</h3>
                <p className="text-sm text-muted-foreground mt-1">24 students</p>
              </div>
              <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
                <DollarSign size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                <h3 className="text-2xl font-bold mt-1">$79,000</h3>
                <p className="text-sm text-muted-foreground mt-1">This academic year</p>
              </div>
              <div className="p-2 rounded-full bg-red-100 text-red-600">
                <DollarSign size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Balance</p>
                <h3 className="text-2xl font-bold mt-1">$45,500</h3>
                <p className="text-sm text-muted-foreground mt-1">Current academic year</p>
              </div>
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <DollarSign size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="payments">
        <TabsList className="mb-4">
          <TabsTrigger value="payments">Fee Payments</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>
        
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Recent Fee Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feePayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.student}</TableCell>
                      <TableCell>{payment.grade}</TableCell>
                      <TableCell>{payment.amount}</TableCell>
                      <TableCell>
                        <Badge variant={
                          payment.status === "Paid" 
                            ? "default" 
                            : payment.status === "Pending" 
                              ? "secondary" 
                              : "destructive"
                        }>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{payment.date}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View</Button>
                        <Button variant="ghost" size="sm">Receipt</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <AreaChart 
                  data={revenueData}
                  index="name"
                  categories={["total"]}
                  colors={["green"]}
                  valueFormatter={(value: number) => `$${value.toLocaleString()}`}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Expense Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <BarChart 
                  data={expenseData}
                  index="name"
                  categories={["total"]}
                  colors={["red"]}
                  valueFormatter={(value: number) => `$${value.toLocaleString()}`}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
