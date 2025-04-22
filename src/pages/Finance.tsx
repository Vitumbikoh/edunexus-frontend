import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { 
  AreaChart as RechartsAreaChart,
  BarChart as RechartsBarChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer 
} from "recharts";
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
import { useAuth } from "@/contexts/AuthContext";

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

// Custom AreaChart component using recharts
const AreaChartComponent = ({ data, index, categories, colors, valueFormatter }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsAreaChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey={index} className="text-sm text-muted-foreground" />
        <YAxis
          width={80}
          tickFormatter={(value) => valueFormatter(value)}
          className="text-sm text-muted-foreground"
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-md">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">
                        {payload[0].payload[index]}
                      </span>
                      <span className="font-bold text-green-600">
                        {valueFormatter(payload[0].value)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Area
          type="monotone"
          dataKey={categories[0]}
          stroke="#10B981"
          fill="#10B981"
          fillOpacity={0.2}
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
};

// Custom BarChart component using recharts
const BarChartComponent = ({ data, index, categories, colors, valueFormatter }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey={index} className="text-sm text-muted-foreground" />
        <YAxis
          width={80}
          tickFormatter={(value) => valueFormatter(value)}
          className="text-sm text-muted-foreground"
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-md">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">
                        {payload[0].payload[index]}
                      </span>
                      <span className="font-bold text-red-600">
                        {valueFormatter(payload[0].value)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar
          dataKey={categories[0]}
          fill="#EF4444"
          radius={[4, 4, 0, 0]}
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default function Finance() {
  const { user } = useAuth();
  const isParent = user?.role === 'parent';
  
  // Parent-specific payment data
  const parentPayments = user?.parentData?.children.flatMap(child => ({
    id: `${child.id}-payment`,
    student: child.name,
    grade: child.grade,
    amount: `$${child.fees.pending}`,
    status: child.fees.pending > 0 ? 'Pending' : 'Paid',
    dueDate: child.fees.dueDate,
    totalFee: child.fees.total,
    paidAmount: child.fees.paid,
    pendingAmount: child.fees.pending,
  })) || [];

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
      
      {isParent ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {user?.parentData?.children.map(child => (
            <React.Fragment key={child.id}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{child.name}'s Total Fees</p>
                      <h3 className="text-2xl font-bold mt-1">${child.fees.total}</h3>
                      <p className="text-sm text-muted-foreground mt-1">Academic year 2025</p>
                    </div>
                    <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                      <DollarSign size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Paid Amount</p>
                      <h3 className="text-2xl font-bold mt-1">${child.fees.paid}</h3>
                      <p className="text-sm text-green-600 mt-1">Paid</p>
                    </div>
                    <div className="p-2 rounded-full bg-green-100 text-green-600">
                      <DollarSign size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </React.Fragment>
          ))}
        </div>
      ) : (
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
      )}
      
      <Tabs defaultValue="payments">
        <TabsList className="mb-4">
          <TabsTrigger value="payments">Fee Payments</TabsTrigger>
          {!isParent && (
            <>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
            </>
          )}
        </TabsList>
        
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>{isParent ? "My Children's Fee Details" : "Recent Fee Payments"}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Amount Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(isParent ? parentPayments : feePayments).map((payment) => (
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
                      <TableCell>{payment.dueDate}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Pay Now</Button>
                        {payment.status === "Paid" && (
                          <Button variant="ghost" size="sm">Receipt</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {!isParent && (
          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <AreaChartComponent 
                    data={revenueData}
                    index="name"
                    categories={["total"]}
                    colors={["green"]}
                    valueFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        {!isParent && (
          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <CardTitle>Expense Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <BarChartComponent 
                    data={expenseData}
                    index="name"
                    categories={["total"]}
                    colors={["red"]}
                    valueFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
