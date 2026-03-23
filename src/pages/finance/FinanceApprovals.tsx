import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, AlertTriangle, Eye, Loader2, DollarSign, Filter, BarChart3 } from 'lucide-react';
import payrollService, { SalaryRun } from '@/services/payrollService';
import ApprovalDialog from '@/components/payroll/ApprovalDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { API_CONFIG } from '@/config/api';
import { Input } from '@/components/ui/input';
import { SearchBar } from '@/components/ui/search-bar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatCurrency, getDefaultCurrency } from '@/lib/currency';

interface Expense {
  id: string;
  expenseNumber: string;
  title: string;
  description: string;
  amount: number;
  category: string;
  department: string;
  requestedBy: string;
  requestDate: string;
  dueDate: string;
  status: string;
  approvalLevel: number;
  budgetCode?: string;
  priority: string;
  attachments?: string[];
  approvedAmount?: number;
  approvedDate?: string;
  approvedBy?: string;
  rejectionReason?: string;
  notes?: string;
}

export default function FinanceApprovals() {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const payrollOnlyMode = requestedTab === 'payroll';
  const [activeTab, setActiveTab] = useState<'expenses' | 'payroll'>(payrollOnlyMode ? 'payroll' : 'expenses');
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Payroll approvals state
  const [payrollRuns, setPayrollRuns] = useState<SalaryRun[]>([]);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [selectedPayrollRun, setSelectedPayrollRun] = useState<SalaryRun | null>(null);
  const [showPayrollApprovalDialog, setShowPayrollApprovalDialog] = useState(false);

  useEffect(() => {
    // Load submitted salary runs for approval review
    const loadPayrollRuns = async () => {
      try {
        setPayrollLoading(true);
        const res = await payrollService.listRuns(1, 100, 'SUBMITTED');
        setPayrollRuns(res.data || []);
      } catch (err) {
        console.error('Failed to load payroll runs for approval:', err);
      } finally {
        setPayrollLoading(false);
      }
    };

    loadPayrollRuns();
  }, []);

  const handlePayrollApprovalAction = async (action: 'approve' | 'reject', runId: string, comments?: string) => {
    try {
      if (action === 'approve') {
        await payrollService.approve(runId, comments);
        toast({ title: 'Payroll approved', description: 'Salary run approved successfully' });
      } else {
        await payrollService.reject(runId, comments || 'Rejected from Finance Approvals');
        toast({ title: 'Payroll rejected', description: 'Salary run was rejected' });
      }
      // Refresh runs
      const res = await payrollService.listRuns(1, 100, 'SUBMITTED');
      setPayrollRuns(res.data || []);
      setShowPayrollApprovalDialog(false);
    } catch (err) {
      console.error('Payroll approval action failed:', err);
      toast({ title: 'Action Failed', description: 'Failed to perform payroll approval action', variant: 'destructive' });
    }
  };

  // Fetch expenses data
  useEffect(() => {
    const fetchExpenses = async () => {
      if (!token) return;
      
      setLoading(true);
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/expenses?limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setExpenses(data.expenses || []);
        } else {
          console.error('Failed to fetch expenses');
        }
      } catch (error) {
        console.error('Error fetching expenses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [token]);

  const handleExpenseAction = async (id: string, action: 'approve' | 'reject', reason?: string) => {
    if (!token) return;

    try {
      const endpoint = action === 'approve' 
        ? `${API_CONFIG.BASE_URL}/expenses/${id}/approve`
        : `${API_CONFIG.BASE_URL}/expenses/${id}/reject`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          action === 'approve'
            ? { comments: 'Approved from Finance Approvals' }
            : {
                reason: reason || 'Rejected from Finance Approvals',
                comments: reason || 'Rejected from Finance Approvals',
              }
        ),
      });

      if (response.ok) {
        toast({
          title: `Expense ${action}d`,
          description: `The expense has been ${action}d successfully.`,
        });
        
        // Refresh expenses data
        const refreshResponse = await fetch(`${API_CONFIG.BASE_URL}/expenses?limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setExpenses(data.expenses || []);
        }
      } else {
        const errorData = await response.json();
        toast({
          title: 'Action Failed',
          description: errorData.message || `Failed to ${action} expense.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error(`Error ${action}ing expense:`, error);
      toast({
        title: 'Error',
        description: `An error occurred while ${action}ing the expense.`,
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-transparent border border-green-300 text-green-700';
      case 'Rejected': return 'bg-transparent border border-red-300 text-red-700';
      case 'Pending': return 'bg-transparent border border-yellow-300 text-yellow-700';
      case 'Department Approved': case 'Finance Review': case 'Principal Approved': return 'bg-transparent border border-blue-300 text-blue-700';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getApprovalSteps = (currentStatus: string, approvalLevel: number) => {
    const steps = [
      { label: 'Department Head', completed: approvalLevel >= 1, current: currentStatus === 'Pending' },
      { label: 'Finance Review', completed: approvalLevel >= 2, current: currentStatus === 'Department Approved' },
      { label: 'Principal', completed: approvalLevel >= 3, current: currentStatus === 'Finance Review' },
      { label: 'Board Review', completed: approvalLevel >= 4, current: currentStatus === 'Principal Approved' },
      { label: 'Final Approval', completed: approvalLevel >= 5, current: currentStatus === 'Board Review' }
    ];
    return steps;
  };

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.expenseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || expense.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const pendingExpenses = filteredExpenses.filter(expense => 
    expense && expense.status && ['Pending', 'Department Approved', 'Finance Review', 'Principal Approved', 'Board Review'].includes(expense.status)
  );

  const approvedExpenses = filteredExpenses.filter(expense => expense.status === 'Approved');
  const rejectedExpenses = filteredExpenses.filter(expense => expense.status === 'Rejected');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{payrollOnlyMode ? 'Payroll Approvals' : 'Finance Approvals'}</h1>
          <p className="text-muted-foreground">
            {payrollOnlyMode
              ? 'Review and approve submitted payroll salary runs'
              : 'Review and approve expense and payroll requests'}
          </p>
        </div>
        {!payrollOnlyMode && (
          <Button
            variant="outline"
            onClick={() => navigate('/expense-analytics')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            View Analytics
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'expenses' | 'payroll')} className="w-full">
        {!payrollOnlyMode && (
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expenses">Expense Approvals</TabsTrigger>
            <TabsTrigger value="payroll">Payroll Approvals</TabsTrigger>
          </TabsList>
        )}

        {!payrollOnlyMode && (
        <TabsContent value="expenses" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filter Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SearchBar
                  value={searchInput}
                  onChange={setSearchInput}
                  onDebouncedChange={setSearchTerm}
                  delay={200}
              placeholder="Search expenses..."
            />
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Department Approved">Department Approved</SelectItem>
                <SelectItem value="Finance Review">Finance Review</SelectItem>
                <SelectItem value="Principal Approved">Principal Approved</SelectItem>
                <SelectItem value="Board Review">Board Review</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="High">High Priority</SelectItem>
                <SelectItem value="Medium">Medium Priority</SelectItem>
                <SelectItem value="Low">Low Priority</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              {filteredExpenses.length} expenses found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold">{pendingExpenses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{approvedExpenses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{rejectedExpenses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(pendingExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0), getDefaultCurrency())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Approval List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Expenses Requiring Action
          </CardTitle>
          <CardDescription>Review and approve expense requests</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Loading expenses...</span>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>No expenses found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredExpenses.map((expense) => (
                <Card key={expense.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{expense.title || 'Untitled Expense'}</h3>
                        <p className="text-sm text-muted-foreground">{expense.expenseNumber || 'N/A'} • {expense.category || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">Requested by: {expense.requestedBy || 'Unknown'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{formatCurrency(expense.amount || 0, getDefaultCurrency())}</p>
                        <Badge className={`${getPriorityColor(expense.priority || 'Medium')} bg-opacity-10 border`}>
                          {expense.priority || 'Medium'} Priority
                        </Badge>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">Current Status:</p>
                      <Badge className={`${getStatusColor(expense.status || 'Pending')}`}>
                        {expense.status || 'Pending'}
                      </Badge>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">Approval Progress:</p>
                      <div className="flex items-center space-x-2">
                        {getApprovalSteps(expense.status || 'Pending', expense.approvalLevel || 0).map((step, index) => (
                          <React.Fragment key={step.label}>
                            <div className={`flex items-center space-x-1 ${
                              step.completed ? 'text-green-600' : 
                              step.current ? 'text-blue-600' : 'text-gray-400'
                            }`}>
                              {step.completed ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : step.current ? (
                                <Clock className="h-4 w-4" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border-2 border-current" />
                              )}
                              <span className="text-xs font-medium">{step.label}</span>
                            </div>
                            {index < getApprovalSteps(expense.status || 'Pending', expense.approvalLevel || 0).length - 1 && (
                              <div className={step.completed ? 'flex-1 border-t-2 border-green-600' : 'flex-1 border-t border-gray-300'} />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4 p-3 bg-gray-50 rounded">
                      <p className="text-sm"><strong>Description:</strong> {expense.description || 'No description'}</p>
                      <p className="text-sm mt-1"><strong>Department:</strong> {expense.department || 'N/A'}</p>
                      <p className="text-sm mt-1"><strong>Budget Code:</strong> {expense.budgetCode || 'N/A'}</p>
                      <p className="text-sm mt-1"><strong>Due Date:</strong> {expense.dueDate ? new Date(expense.dueDate).toLocaleDateString() : 'N/A'}</p>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      {String(user?.role).toUpperCase() === 'ADMIN' && 
                       ['Pending', 'Department Approved', 'Finance Review', 'Principal Approved', 'Board Review'].includes(expense.status || '') ? (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleExpenseAction(expense.id, 'reject')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleExpenseAction(expense.id, 'approve')}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                        </>
                      ) : String(user?.role).toUpperCase() === 'ADMIN' ? (
                        <div className="text-sm text-muted-foreground px-3 py-2 bg-transparent border border-green-300 rounded text-green-700">
                          ✓ Expense {expense.status?.toLowerCase() || 'processed'}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground px-3 py-2 bg-gray-50 rounded">
                          Only school admins can approve expenses
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>
        )}

        <TabsContent value="payroll" className="space-y-6">
          {/* Payroll Approvals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Payroll Approvals
              </CardTitle>
              <CardDescription>Review and approve submitted salary runs</CardDescription>
            </CardHeader>
            <CardContent>
              {payrollLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mr-2" />
                  <span>Loading payroll runs...</span>
                </div>
              ) : payrollRuns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No submitted salary runs awaiting approval.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payrollRuns.map((run) => (
                    <Card key={run.id} className="border-l-4 border-l-yellow-500">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{run.period || 'Period'}</h3>
                            <p className="text-sm text-muted-foreground">Staff: {run.staffCount || 0}</p>
                            <p className="text-sm text-muted-foreground">Status: {run.status}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">${(run.totalNet || 0).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => { setSelectedPayrollRun(run); setShowPayrollApprovalDialog(true); }}>
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ApprovalDialog
        run={selectedPayrollRun || ({} as any)}
        open={showPayrollApprovalDialog}
        onOpenChange={setShowPayrollApprovalDialog}
        onApprovalAction={(action, comments) => selectedPayrollRun && handlePayrollApprovalAction(action, selectedPayrollRun.id, comments)}
      />
    </div>
  );
}