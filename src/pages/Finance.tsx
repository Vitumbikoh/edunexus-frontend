import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileChart,
  Receipt,
  FileText,
  Calculator,
  DollarSign,
  CreditCard,
  Download,
  Search,
  Wallet,
  ArrowUpRight,
  PlusCircle,
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

export default function Finance() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isFinanceUser = user?.role === 'finance';
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect non-finance users
  if (!isFinanceUser) {
    navigate('/dashboard');
    return null;
  }

  const financeStats = {
    totalRevenue: 1250000,
    collectedFees: 980000,
    pendingFees: 270000,
    overdueAmount: 85000,
    expensesBudget: 750000,
    expensesUsed: 520000,
  };

  const collectionPercentage = Math.round((financeStats.collectedFees / financeStats.totalRevenue) * 100);
  const budgetUsagePercentage = Math.round((financeStats.expensesUsed / financeStats.expensesBudget) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.name} - {user.financeData?.department} Department
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={() => navigate("/finance/record")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Record Transaction
          </Button>
          <Button variant="outline">
            <FileChart className="mr-2 h-4 w-4" />
            Generate Report
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
            <div className="text-2xl font-bold">${(financeStats.totalRevenue).toLocaleString()}</div>
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

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="invoices">Outstanding Invoices</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search transactions..."
                      className="pl-8 w-[200px] md:w-[300px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Example transaction data */}
                  <TableRow>
                    <TableCell className="font-medium">TRX-001</TableCell>
                    <TableCell>2025-04-22</TableCell>
                    <TableCell>Term 2 Tuition Fee</TableCell>
                    <TableCell>
                      <Badge variant="outline">Income</Badge>
                    </TableCell>
                    <TableCell className="text-right">$1,500.00</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="default">Completed</Badge>
                    </TableCell>
                  </TableRow>
                  {/* Add more rows as needed */}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Similar structure for other tabs */}
        <TabsContent value="invoices">
          {/* Outstanding invoices content */}
        </TabsContent>
        
        <TabsContent value="expenses">
          {/* Expenses content */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
