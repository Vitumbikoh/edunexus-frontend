import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Download, DollarSign, Users, TrendingUp, History } from 'lucide-react';
import payrollService, { SalaryRun, SalaryItem, PayrollApprovalHistory } from '@/services/payrollService';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface RunDetailsDialogProps {
  run: SalaryRun;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRunUpdated: (run: SalaryRun) => void;
}

export default function RunDetailsDialog({ run, open, onOpenChange, onRunUpdated }: RunDetailsDialogProps) {
  const { user } = useAuth();
  const [salaryItems, setSalaryItems] = useState<SalaryItem[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<PayrollApprovalHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const isFinanceOfficer = user?.role === 'finance';
  const canEdit = isFinanceOfficer && (run.status === 'DRAFT' || run.status === 'REJECTED');

  useEffect(() => {
    if (open) {
      loadSalaryItems();
      loadApprovalHistory();
    }
  }, [open, run.id]);

  const loadSalaryItems = async () => {
    try {
      setLoadingItems(true);
      const items = await payrollService.getRunItems(run.id);
      setSalaryItems(items || []);
    } catch (error) {
      console.error('Error loading salary items:', error);
      toast.error('Failed to load salary details');
      setSalaryItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  const loadApprovalHistory = async () => {
    try {
      setLoadingHistory(true);
      const history = await payrollService.getApprovalHistory(run.id);
      setApprovalHistory(history || []);
    } catch (error) {
      console.error('Error loading approval history:', error);
      toast.error('Failed to load approval history');
      setApprovalHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleGeneratePayslip = async (staffId: string, staffName: string) => {
    try {
      const blob = await payrollService.generatePayslip(run.id, staffId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${staffName}-${run.period}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Payslip generated successfully');
    } catch (error) {
      console.error('Error generating payslip:', error);
      toast.error('Failed to generate payslip');
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      const blob = await payrollService.exportPayroll(run.id, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll-${run.period}-${format === 'pdf' ? 'report.pdf' : 'data.xlsx'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(`Payroll ${format.toUpperCase()} exported successfully`);
    } catch (error) {
      console.error('Error exporting payroll:', error);
      toast.error(`Failed to export payroll ${format.toUpperCase()}`);
    }
  };

  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PREPARED: 'bg-blue-100 text-blue-800',
    SUBMITTED: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    FINALIZED: 'bg-purple-100 text-purple-800',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Salary Run Details - {run.period}
            <Badge className={statusColors[run.status]}>
              {run.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            View and manage salary run details, staff allocations, and approval history
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="staff">Staff Details</TabsTrigger>
            <TabsTrigger value="history">Approval History</TabsTrigger>
            <TabsTrigger value="export">Export & Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{run.staffCount}</div>
                  <p className="text-xs text-muted-foreground">
                    Staff members in this run
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gross Salary</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${run.totalGross.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Total before deductions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Salary</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${run.totalNet.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Total after deductions
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Run Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Period</Label>
                    <p className="text-lg font-medium">{run.period}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <p>
                      <Badge className={statusColors[run.status]}>
                        {run.status}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label>Created</Label>
                    <p>{format(new Date(run.createdAt), 'PPP')}</p>
                  </div>
                  <div>
                    <Label>Last Updated</Label>
                    <p>{format(new Date(run.updatedAt), 'PPP')}</p>
                  </div>
                  <div>
                    <Label>Employer Cost</Label>
                    <p className="text-lg font-medium">${run.employerCost.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>Posted to Expenses</Label>
                    <p>{run.postedExpenseId ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Staff Salary Details</CardTitle>
                <CardDescription>
                  Individual salary calculations for each staff member
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingItems ? (
                  <div className="text-center py-4">Loading staff details...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff Name</TableHead>
                        <TableHead>Gross Pay</TableHead>
                        <TableHead>Deductions</TableHead>
                        <TableHead>Net Pay</TableHead>
                        <TableHead>Employer Contribution</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salaryItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.staffName || 'Unknown Staff'}</TableCell>
                          <TableCell>${(item.grossPay || 0).toLocaleString()}</TableCell>
                          <TableCell>${(item.otherDeductions || 0).toLocaleString()}</TableCell>
                          <TableCell>${(item.netPay || 0).toLocaleString()}</TableCell>
                          <TableCell>${(item.employerContrib || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {run.status === 'FINALIZED' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleGeneratePayslip(item.userId, item.staffName)}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Payslip
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {salaryItems.length === 0 && !loadingItems && (
                  <div className="text-center py-8 text-muted-foreground">
                    No salary items found for this run
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Approval History
                </CardTitle>
                <CardDescription>
                  Track all actions performed on this salary run
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <div className="text-center py-4">Loading history...</div>
                ) : (
                  <div className="space-y-4">
                    {approvalHistory.map((entry) => (
                      <div key={entry.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{entry.action}</p>
                            <p className="text-sm text-muted-foreground">
                              by {entry.performedByName}
                            </p>
                            {entry.comments && (
                              <p className="text-sm mt-2 p-2 bg-muted rounded">
                                {entry.comments}
                              </p>
                            )}
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            {format(new Date(entry.createdAt), 'PPp')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {approvalHistory.length === 0 && !loadingHistory && (
                  <div className="text-center py-8 text-muted-foreground">
                    No approval history found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export & Reports</CardTitle>
                <CardDescription>
                  Generate reports and export payroll data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center gap-2"
                    disabled={run.status !== 'FINALIZED'}
                    onClick={() => handleExport('pdf')}
                  >
                    <Download className="h-6 w-6" />
                    <div className="text-center">
                      <p className="font-medium">Export PDF</p>
                      <p className="text-sm text-muted-foreground">Full payroll report</p>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center gap-2"
                    disabled={run.status !== 'FINALIZED'}
                    onClick={() => handleExport('excel')}
                  >
                    <Download className="h-6 w-6" />
                    <div className="text-center">
                      <p className="font-medium">Export Excel</p>
                      <p className="text-sm text-muted-foreground">Detailed data</p>
                    </div>
                  </Button>
                </div>

                {run.status !== 'FINALIZED' && (
                  <p className="text-sm text-muted-foreground text-center">
                    Export options are available after the salary run is finalized
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}