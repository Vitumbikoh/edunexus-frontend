import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlusCircle,
  Download,
  Search,
  ArrowUpRight,
  DollarSign,
  CreditCard,
  Receipt,
  Building,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
  {
    id: "INV-001",
    date: "2025-04-01",
    description: "Tuition Fee - Term 1",
    amount: 1500,
    status: "paid",
    studentName: "Emma Thompson",
    paymentDate: "2025-03-28",
  },
  {
    id: "INV-002",
    date: "2025-04-01",
    description: "Examination Fee",
    amount: 350,
    status: "pending",
    studentName: "Emma Thompson",
    paymentDate: null,
  },
  {
    id: "INV-003",
    date: "2025-04-01",
    description: "Sports Activities",
    amount: 220,
    status: "overdue",
    studentName: "Emma Thompson",
    paymentDate: null,
  },
  {
    id: "INV-004",
    date: "2025-04-01",
    description: "Library Fee",
    amount: 100,
    status: "paid",
    studentName: "James Thompson",
    paymentDate: "2025-03-30",
  },
  {
    id: "INV-005",
    date: "2025-04-01",
    description: "Laboratory Fee",
    amount: 180,
    status: "pending",
    studentName: "James Thompson",
    paymentDate: null,
  },
];

// Transaction history
const transactions = [
  {
    id: "TRX-001",
    date: "2025-03-28",
    description: "Tuition Fee - Term 1",
    amount: 1500,
    method: "Credit Card",
    studentName: "Emma Thompson",
  },
  {
    id: "TRX-002",
    date: "2025-03-30",
    description: "Library Fee",
    amount: 100,
    method: "Bank Transfer",
    studentName: "James Thompson",
  },
  {
    id: "TRX-003",
    date: "2025-02-15",
    description: "Tuition Fee - Term 1 Installment",
    amount: 500,
    method: "Credit Card",
    studentName: "Emma Thompson",
  },
  {
    id: "TRX-004",
    date: "2025-01-30",
    description: "Tuition Fee - Term 1 Installment",
    amount: 500,
    method: "Cash",
    studentName: "Emma Thompson",
  },
  {
    id: "TRX-005",
    date: "2025-01-15",
    description: "Tuition Fee - Term 1 Installment",
    amount: 500,
    method: "Bank Transfer",
    studentName: "James Thompson",
  },
];

export default function Finance() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isParent = user?.role === 'parent';
  const isAdmin = user?.role === 'admin';
  
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredInvoices = isParent && user?.parentData 
    ? feePayments.filter(payment => 
        user.parentData.children.some(child => 
          payment.studentName.includes(child.name)
        )
      ) 
    : feePayments;
  
  const filteredTransactions = isParent && user?.parentData
    ? transactions.filter(transaction => 
        user.parentData.children.some(child => 
          transaction.studentName.includes(child.name)
        )
      )
    : transactions;
  
  const totalFeesAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paidAmount = filteredInvoices
    .filter(invoice => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const pendingAmount = filteredInvoices
    .filter(invoice => invoice.status === "pending")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const overdueAmount = filteredInvoices
    .filter(invoice => invoice.status === "overdue")
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  const paidPercentage = Math.round((paidAmount / totalFeesAmount) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance</h1>
          <p className="text-muted-foreground">
            {isParent ? "Manage your children's fee payments" : "Manage school finances and fee payments"}
          </p>
        </div>
        
        {isAdmin && (
          <div className="flex space-x-2 mt-4 sm:mt-0">
            <Button onClick={() => navigate("/finance/record")}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
            
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalFeesAmount}</div>
            <p className="text-xs text-muted-foreground">
              For {isParent ? "all children" : "all students"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${paidAmount}</div>
            <div className="mt-2">
              <Progress value={paidPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {paidPercentage}% of total fees
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${pendingAmount}</div>
            <p className="text-xs text-muted-foreground">
              Due in the next 30 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${overdueAmount}</div>
            <p className="text-xs text-muted-foreground">
              Past due payments
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Fee Invoices</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Fee Invoices</CardTitle>
                
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search invoices..."
                      className="pl-8 w-[200px] md:w-[300px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  {isAdmin && (
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>{isParent ? "Child" : "Student"}</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    {isParent && <TableHead className="text-right">Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>{invoice.date}</TableCell>
                      <TableCell>{invoice.studentName}</TableCell>
                      <TableCell>{invoice.description}</TableCell>
                      <TableCell className="text-right">${invoice.amount}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={
                          invoice.status === "paid" ? "default" :
                          invoice.status === "pending" ? "outline" : "destructive"
                        } className="capitalize">
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      {isParent && (
                        <TableCell className="text-right">
                          {invoice.status !== "paid" && (
                            <Button size="sm" variant="outline">
                              Pay Now
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Transaction History</CardTitle>
                
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search transactions..."
                      className="pl-8 w-[200px] md:w-[300px]"
                    />
                  </div>
                  
                  {isAdmin && (
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>{isParent ? "Child" : "Student"}</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.id}</TableCell>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>{transaction.studentName}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className="text-right">${transaction.amount}</TableCell>
                      <TableCell className="text-right">{transaction.method}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}