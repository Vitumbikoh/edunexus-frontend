
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calculator,
  Download,
  PlusCircle,
  DollarSign,
  ChartPie,
  FileText,
  ArrowUpRight
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
import { useNavigate } from "react-router-dom";

export default function FinanceBudgets() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isFinanceUser = user?.role === 'finance';
  
  // Redirect non-finance users
  if (!isFinanceUser) {
    navigate('/dashboard');
    return null;
  }

  // Sample budget data
  const budgets = [
    { id: 'BUD001', name: 'Academic Staff Salaries', category: 'Salary', allocated: 550000, used: 450000, remaining: 100000, status: 'active' },
    { id: 'BUD002', name: 'Administrative Staff', category: 'Salary', allocated: 320000, used: 280000, remaining: 40000, status: 'active' },
    { id: 'BUD003', name: 'Campus Maintenance', category: 'Maintenance', allocated: 180000, used: 120000, remaining: 60000, status: 'active' },
    { id: 'BUD004', name: 'IT Infrastructure', category: 'Capital', allocated: 250000, used: 200000, remaining: 50000, status: 'active' },
    { id: 'BUD005', name: 'Library Resources', category: 'Academic', allocated: 120000, used: 75000, remaining: 45000, status: 'active' },
    { id: 'BUD006', name: 'Sports Facilities', category: 'Extracurricular', allocated: 80000, used: 60000, remaining: 20000, status: 'active' },
  ];

  // Calculate totals
  const totalAllocated = budgets.reduce((sum, budget) => sum + budget.allocated, 0);
  const totalUsed = budgets.reduce((sum, budget) => sum + budget.used, 0);
  const totalRemaining = totalAllocated - totalUsed;
  const usagePercentage = Math.round((totalUsed / totalAllocated) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budget Management</h1>
          <p className="text-muted-foreground">
            Track and manage school budget allocations
          </p>
        </div>
        
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <Button onClick={() => {}}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Budget
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Budget Data
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAllocated.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              For current fiscal year
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Used</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalUsed.toLocaleString()}</div>
            <div className="mt-2">
              <Progress value={usagePercentage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {usagePercentage}% of total budget
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
            <ChartPie className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRemaining.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {100 - usagePercentage}% of total budget remaining
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Health</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Good</div>
            <p className="text-xs text-muted-foreground">
              On track with projected expenses
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget Allocations</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Categories</TabsTrigger>
              <TabsTrigger value="salary">Salary</TabsTrigger>
              <TabsTrigger value="academic">Academic</TabsTrigger>
              <TabsTrigger value="capital">Capital</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Budget ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Allocated</TableHead>
                    <TableHead className="text-right">Used</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Usage %</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgets.map((budget) => {
                    const usagePercent = Math.round((budget.used / budget.allocated) * 100);
                    
                    return (
                      <TableRow key={budget.id}>
                        <TableCell className="font-medium">{budget.id}</TableCell>
                        <TableCell>{budget.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{budget.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right">${budget.allocated.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${budget.used.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${budget.remaining.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <span className="mr-2">{usagePercent}%</span>
                            <Progress value={usagePercent} className="w-16 h-2" />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge>{budget.status}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="salary" className="mt-4">
              {/* Salary budgets content - similar structure */}
            </TabsContent>
            
            <TabsContent value="academic" className="mt-4">
              {/* Academic budgets content - similar structure */}
            </TabsContent>
            
            <TabsContent value="capital" className="mt-4">
              {/* Capital budgets content - similar structure */}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}