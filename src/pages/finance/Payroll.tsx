import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SearchBar } from '@/components/ui/search-bar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Download, Eye, Play, Send, CheckCircle, XCircle, Trash2, Edit } from 'lucide-react';
import payrollService, { SalaryRun, SalaryRunStatus } from '@/services/payrollService';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';
import CreateRunDialog from '@/components/payroll/CreateRunDialog';
import RunDetailsDialog from '@/components/payroll/RunDetailsDialog';
import ApprovalDialog from '@/components/payroll/ApprovalDialog';

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PREPARED: 'bg-blue-100 text-blue-800',
  SUBMITTED: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  FINALIZED: 'bg-purple-100 text-purple-800',
};

export default function Payroll() {
  const { user } = useAuth();
  const [runs, setRuns] = useState<SalaryRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<SalaryRunStatus | 'ALL'>('ALL');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedRun, setSelectedRun] = useState<SalaryRun | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);

  const isFinanceOfficer = user?.role === 'finance';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    loadRuns();
  }, [statusFilter]);

  const loadRuns = async () => {
    try {
      setLoading(true);
      const status = statusFilter === 'ALL' ? undefined : statusFilter;
      const response = await payrollService.listRuns(1, 50, status);
      setRuns(response.data);
    } catch (error) {
      console.error('Error loading salary runs:', error);
      toast.error('Failed to load salary runs');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, run: SalaryRun, comments?: string) => {
    try {
      let result: SalaryRun;
      
      switch (action) {
        case 'prepare':
          result = await payrollService.prepare(run.id);
          toast.success('Salary run prepared successfully');
          break;
        case 'submit':
          result = await payrollService.submit(run.id, comments);
          toast.success('Salary run submitted for approval');
          break;
        case 'approve':
          result = await payrollService.approve(run.id, comments);
          toast.success('Salary run approved');
          break;
        case 'reject':
          result = await payrollService.reject(run.id, comments!);
          toast.success('Salary run rejected');
          break;
        case 'finalize':
          result = await payrollService.finalize(run.id);
          toast.success('Salary run finalized and posted to expenses');
          break;
        default:
          return;
      }
      
      // Update the specific run in state
      setRuns(prev => prev.map(r => r.id === run.id ? result : r));
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      toast.error(`Failed to ${action} salary run`);
    }
  };

  const handleDelete = async (run: SalaryRun) => {
    if (!confirm('Are you sure you want to delete this salary run? This action cannot be undone.')) {
      return;
    }

    try {
      await payrollService.deleteRun(run.id);
      setRuns(prev => prev.filter(r => r.id !== run.id));
      toast.success('Salary run deleted successfully');
    } catch (error) {
      console.error('Error deleting salary run:', error);
      toast.error('Failed to delete salary run');
    }
  };

  const handleExport = async (run: SalaryRun, format: 'pdf' | 'excel') => {
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

  const getActionButtons = (run: SalaryRun) => {
    const buttons = [];

    // View Details
    buttons.push(
      <Button
        key="view"
        variant="outline"
        size="sm"
        onClick={() => {
          setSelectedRun(run);
          setShowDetailsDialog(true);
        }}
      >
        <Eye className="h-4 w-4 mr-1" />
        View
      </Button>
    );

    if (isFinanceOfficer) {
      // Finance Officer Actions
      if (run.status === 'DRAFT') {
        buttons.push(
          <Button
            key="prepare"
            variant="outline"
            size="sm"
            onClick={() => handleAction('prepare', run)}
          >
            <Play className="h-4 w-4 mr-1" />
            Prepare
          </Button>
        );
        buttons.push(
          <Button
            key="delete"
            variant="outline"
            size="sm"
            onClick={() => handleDelete(run)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        );
      }

      if (run.status === 'PREPARED') {
        buttons.push(
          <Button
            key="submit"
            variant="outline"
            size="sm"
            onClick={() => handleAction('submit', run)}
          >
            <Send className="h-4 w-4 mr-1" />
            Submit
          </Button>
        );
      }

      if (run.status === 'REJECTED') {
        buttons.push(
          <Button
            key="edit"
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedRun(run);
              setShowDetailsDialog(true);
            }}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        );
      }
    }

    if (isAdmin) {
      // Admin Actions
      if (run.status === 'SUBMITTED') {
        buttons.push(
          <Button
            key="approve"
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedRun(run);
              setShowApprovalDialog(true);
            }}
            className="text-green-600 hover:text-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Review
          </Button>
        );
      }

      if (run.status === 'APPROVED') {
        buttons.push(
          <Button
            key="finalize"
            variant="outline"
            size="sm"
            onClick={() => handleAction('finalize', run)}
            className="text-purple-600 hover:text-purple-700"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Finalize
          </Button>
        );
      }
    }

    // Export options for finalized runs
    if (run.status === 'FINALIZED') {
      buttons.push(
        <Button
          key="export-pdf"
          variant="outline"
          size="sm"
          onClick={() => handleExport(run, 'pdf')}
        >
          <Download className="h-4 w-4 mr-1" />
          PDF
        </Button>
      );
      buttons.push(
        <Button
          key="export-excel"
          variant="outline"
          size="sm"
          onClick={() => handleExport(run, 'excel')}
        >
          <Download className="h-4 w-4 mr-1" />
          Excel
        </Button>
      );
    }

    return buttons;
  };

  const filteredRuns = runs.filter(run => {
    const matchesSearch = run.period.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         run.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || run.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading payroll data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Management</h1>
          <p className="text-muted-foreground">
            Manage salary runs, process payroll, and generate reports
          </p>
        </div>
        {isFinanceOfficer && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Salary Run
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              onDebouncedChange={setSearchTerm}
              delay={200}
              placeholder="Search by period or ID..."
              inputClassName="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as SalaryRunStatus | 'ALL')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PREPARED">Prepared</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="FINALIZED">Finalized</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Salary Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Salary Runs</CardTitle>
          <CardDescription>
            {filteredRuns.length} salary run{filteredRuns.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Staff Count</TableHead>
                <TableHead>Total Gross</TableHead>
                <TableHead>Total Net</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRuns.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="font-medium">{run.period}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[run.status]}>
                      {run.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{run.staffCount}</TableCell>
                  <TableCell>${run.totalGross.toLocaleString()}</TableCell>
                  <TableCell>${run.totalNet.toLocaleString()}</TableCell>
                  <TableCell>{format(new Date(run.createdAt), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex gap-2 flex-wrap">
                      {getActionButtons(run)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredRuns.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No salary runs found. {isFinanceOfficer && "Create your first salary run to get started."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateRunDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onRunCreated={(newRun) => {
          setRuns(prev => [newRun, ...prev]);
          setShowCreateDialog(false);
        }}
      />

      {selectedRun && (
        <>
          <RunDetailsDialog
            run={selectedRun}
            open={showDetailsDialog}
            onOpenChange={setShowDetailsDialog}
            onRunUpdated={(updatedRun) => {
              setRuns(prev => prev.map(r => r.id === updatedRun.id ? updatedRun : r));
            }}
          />

          <ApprovalDialog
            run={selectedRun}
            open={showApprovalDialog}
            onOpenChange={setShowApprovalDialog}
            onApprovalAction={(action, comments) => {
              handleAction(action, selectedRun, comments);
              setShowApprovalDialog(false);
            }}
          />
        </>
      )}
    </div>
  );
}