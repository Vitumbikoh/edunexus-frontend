import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchBar } from '@/components/ui/search-bar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Eye, Download, Filter, FileText, CheckCircle, XCircle, Clock, AlertTriangle, DollarSign, TrendingUp, TrendingDown, Calendar, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { API_CONFIG } from '@/config/api';
import { formatCurrency, getDefaultCurrency } from '@/lib/currency';
import { expenseService } from '@/services/expenseService';
import { academicCalendarService } from '@/services/academicCalendarService';
import type { User } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';

// Expense categories matching backend enum
const EXPENSE_CATEGORIES = [
  'Personnel',
  'Academic Resources',
  'Facilities',
  'Transportation',
  'Food Services',
  'Administrative',
  'Emergency',
  'Other'
];

// Approval statuses matching backend enum
const APPROVAL_STATUSES = [
  'Pending',
  'Department Approved',
  'Finance Review',
  'Principal Approved',
  'Board Review',
  'Approved',
  'Rejected',
  'Paid'
];

// Priority levels matching backend enum
const EXPENSE_PRIORITIES = [
  'Low',
  'Medium',
  'High'
];

// Types for analytics data
interface MonthlyTrendData {
  amount: number;
  count: number;
  formattedAmount?: string;
  displayName?: string;
}

interface AnalyticsData {
  summary?: {
    budgetUtilization?: string;
    avgExpense?: string;
    approvalRate?: string;
    avgApprovalTime?: string;
  };
  totals?: {
    totalExpenses: number;
    totalAmount: number;
    approvedAmount: number;
    pendingAmount: number;
  };
  categoryBreakdown?: Record<string, number>;
  monthlyTrend?: Record<string, MonthlyTrendData>;
  performance?: {
    approvalRate: number;
    avgApprovalTime: number;
    budgetUtilization: number;
    avgExpense: number;
  };
}

// Types for the expense data structure
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
  /** True when this expense was auto-created from a edunexus billing invoice */
  isBillingInvoice?: boolean;
  /** The BillingInvoice id this expense was created from */
  billingInvoiceId?: string | null;
}

interface ExpenseFilters {
  status?: string;
  category?: string;
  priority?: string;
  department?: string;
  requestedBy?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

const parseAmountValue = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

export default function ExpenseManagement() {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [urlSearchParams] = useSearchParams();
  
  // State for filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  // Academic calendar / term filters
  const [academicCalendars, setAcademicCalendars] = useState<any[]>([]);
  const [selectedAcademicCalendarId, setSelectedAcademicCalendarId] = useState<string | null>(null);
  const [terms, setTerms] = useState<any[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // State for API data
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    const searchFromUrl = urlSearchParams.get('search');
    if (!searchFromUrl) return;

    setSearchInput(searchFromUrl);
    setSearchTerm(searchFromUrl);
    setCurrentPage(0);
  }, [urlSearchParams]);

  // Check user permissions - only ADMIN can manage certain actions (delete). Approvals moved to FinanceApprovals page.
  const isAdmin = user?.role === 'admin';

  // API functions
  const fetchExpenses = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (searchTerm) params.append('search', searchTerm);
      if (selectedAcademicCalendarId) params.append('academicCalendarId', selectedAcademicCalendarId);
      if (selectedTermId) params.append('termId', selectedTermId);
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());

      const response = await fetch(`${API_CONFIG.BASE_URL}/expenses?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }

      const data = await response.json();
      setExpenses(data.expenses || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load expenses. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, categoryFilter, priorityFilter, searchTerm, currentPage, pageSize, toast, selectedAcademicCalendarId, selectedTermId]);



  const deleteExpense = async (expenseId: string) => {
    if (!token) return;

    setActionLoading(expenseId);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete expense');
      }

      toast({
        title: 'Success',
        description: 'Expense deleted successfully.',
      });

      // Refresh the expenses list
      await fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete expense. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprovalAction = async (expenseId: string, action: 'approve' | 'reject') => {
    if (!token) return;

    setActionLoading(expenseId);
    try {
      const endpoint = action === 'approve'
        ? `${API_CONFIG.BASE_URL}/expenses/${expenseId}/approve`
        : `${API_CONFIG.BASE_URL}/expenses/${expenseId}/reject`;

      const payload = action === 'approve'
        ? { comments: 'Approved from expense management' }
        : {
            reason: 'Rejected from expense management',
            comments: 'Rejected from expense management',
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} expense`);
      }

      toast({
        title: 'Success',
        description: `Expense ${action}d successfully.`,
      });

      // Refresh the expenses list
      await fetchExpenses();
    } catch (error) {
      console.error(`Error ${action}ing expense:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} expense. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownload = async (expense: Expense) => {
    try {
      const blob = await expenseService.downloadReport({ expenseId: expense.id }, 'pdf');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${expense.expenseNumber || expense.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({
        title: 'Download started',
        description: `${expense.title} report is downloading.`,
      });
    } catch (error) {
      console.error('Error downloading expense report:', error);
      toast({
        title: 'Download failed',
        description: 'Could not download report. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Load expenses on component mount and when filters change
  useEffect(() => {
    fetchExpenses().catch(error => {
      console.error('Error loading expenses:', error);
      setExpenses([]);
      setTotal(0);
    });
  }, [fetchExpenses]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [statusFilter, categoryFilter, priorityFilter, searchTerm]);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    if (!token) return;
    
    setAnalyticsLoading(true);
    try {
      // Prefer api client with auto token refresh
      const analytics = await (async () => {
        try {
          const data = await (await import('@/lib/apiClient')).apiFetch(`/expenses/analytics`);
          return data as any;
        } catch {
          // Fallback to existing service if needed
          return await expenseService.getAnalytics();
        }
      })();
      setAnalyticsData(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data.',
        variant: 'destructive',
      });
    } finally {
      setAnalyticsLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Load academic calendars and set default selection
  useEffect(() => {
    const loadCalendars = async () => {
      if (!token) return;
      try {
        const cals = await academicCalendarService.getAcademicCalendars(token);
        setAcademicCalendars(cals || []);
        const active = await academicCalendarService.getActiveAcademicCalendar(token);
        setSelectedAcademicCalendarId(active?.id || (cals && cals[0]?.id) || null);
      } catch (e) {
        console.error('Failed to load academic calendars, attempting active-calendar fallback', e);
        // If user cannot fetch full list (non-admin), try to at least get the active calendar
        try {
          const activeOnly = await academicCalendarService.getActiveAcademicCalendar(token);
          if (activeOnly) {
            setAcademicCalendars([activeOnly]);
            setSelectedAcademicCalendarId(activeOnly.id || null);
          } else {
            setAcademicCalendars([]);
            setSelectedAcademicCalendarId(null);
          }
        } catch (err2) {
          console.error('Failed to fetch active academic calendar fallback', err2);
          setAcademicCalendars([]);
          setSelectedAcademicCalendarId(null);
        }
      }
    };
    loadCalendars();
  }, [token]);

  // Load terms whenever a calendar is selected
  useEffect(() => {
    const loadTerms = async () => {
      if (!token) return;
      try {
        const url = selectedAcademicCalendarId
          ? `${API_CONFIG.BASE_URL}/settings/terms?academicCalendarId=${encodeURIComponent(selectedAcademicCalendarId)}`
          : `${API_CONFIG.BASE_URL}/settings/terms`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return setTerms([]);
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.terms || []);
        const mapped = list.map((y: any) => ({ id: y.id || y.termId || y.uuid, name: y.name || y.periodName || y.term || y.displayName, raw: y }));
        setTerms(mapped || []);
        const current = mapped.find((m: any) => m.raw?.isCurrent === true || m.raw?.current === true || m.raw?.is_current === true) || mapped[0];
        setSelectedTermId(current?.id || null);
      } catch (e) {
        console.error('Failed to load terms', e);
        setTerms([]);
      }
    };
    loadTerms();
  }, [selectedAcademicCalendarId, token]);

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': case 'Paid': return 'bg-transparent text-green-700 border-green-300';
      case 'Pending': return 'bg-transparent text-yellow-700 border-yellow-300';
      case 'Department Approved': case 'Finance Review': case 'Principal Approved': return 'bg-transparent text-blue-700 border-blue-300';
      case 'Board Review': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Rejected': return 'bg-transparent text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved': case 'Paid': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'Pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-blue-600" />;
    }
  };

  // Filtered expenses are now handled by the backend through API params
  const filteredExpenses = useMemo(() => {
    if (!expenses || !Array.isArray(expenses)) {
      return [];
    }
    return expenses.filter(expense => expense && typeof expense === 'object');
  }, [expenses]);

  // Calculate summary statistics from current expense list
  const summaryStats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, expense) => sum + parseAmountValue(expense.amount), 0);
    const approved = filteredExpenses.filter(exp => exp.status === 'Approved' || exp.status === 'Paid').reduce((sum, expense) => sum + parseAmountValue(expense.amount), 0);
    const pending = filteredExpenses.filter(exp => ['Pending', 'Department Approved', 'Finance Review', 'Principal Approved', 'Board Review'].includes(exp.status)).reduce((sum, expense) => sum + parseAmountValue(expense.amount), 0);
    const rejected = filteredExpenses.filter(exp => exp.status === 'Rejected').reduce((sum, expense) => sum + parseAmountValue(expense.amount), 0);
    
    return { total, approved, pending, rejected };
  }, [filteredExpenses]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expense Management</h1>
          <p className="text-muted-foreground">Manage school expenses and approval workflows</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Submit Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
              <DialogHeader className="pb-4 flex-shrink-0">
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Submit New Expense
                </DialogTitle>
                <DialogDescription className="text-base">
                  Fill out the form below to submit a new expense request for approval.
                  All fields marked with <span className="text-red-500">*</span> are required.
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto">
                <ExpenseForm
                  onClose={() => setIsCreateDialogOpen(false)}
                  onSuccess={fetchExpenses}
                />
              </div>
            </DialogContent>
          </Dialog>


        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Total Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summaryStats.total, getDefaultCurrency())}</div>
                <p className="text-xs text-muted-foreground">{filteredExpenses.length} requests</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Approved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${summaryStats.approved.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {filteredExpenses.filter(exp => exp.status === 'Approved' || exp.status === 'Paid').length} expenses
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">${summaryStats.pending.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {filteredExpenses.filter(exp => ['Pending', 'Department Approved', 'Finance Review'].includes(exp.status)).length} expenses
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <XCircle className="h-4 w-4 mr-2 text-red-600" />
                  Rejected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">${summaryStats.rejected.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {filteredExpenses.filter(exp => exp.status === 'Rejected').length} expenses
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle>Expense Requests</CardTitle>
              <CardDescription>View and manage all expense requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 mb-6">
                <SearchBar
                  value={searchInput}
                  onChange={setSearchInput}
                  onDebouncedChange={setSearchTerm}
                  delay={300}
                  placeholder="Search expenses..."
                  className="w-full"
                  inputClassName=""
                />
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Calendar</Label>
                    <select
                      className="border rounded-md h-9 px-2 bg-background text-sm w-32"
                      value={selectedAcademicCalendarId || ''}
                      onChange={(e) => setSelectedAcademicCalendarId(e.target.value || null)}
                    >
                      <option value="">All calendars</option>
                      {academicCalendars.map((c, idx) => (
                        <option key={c.id} value={c.id}>{c.name || c.title || c.term || `Calendar ${idx + 1}`}</option>
                      ))}
                    </select>
                    {academicCalendars.length === 0 && (
                      <div className="text-xs text-muted-foreground ml-2">No academic calendars available for your account</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Term</Label>
                    <select
                      className="border rounded-md h-9 px-2 bg-background text-sm w-32"
                      value={selectedTermId || ''}
                      onChange={(e) => setSelectedTermId(e.target.value || null)}
                    >
                      <option value="">All terms</option>
                      {terms.map(t => <option key={t.id} value={t.id}>{t.name || t.id}</option>)}
                    </select>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {APPROVAL_STATUSES.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {EXPENSE_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      {EXPENSE_PRIORITIES.map(priority => (
                        <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Expenses Table */}
              {/* Mobile view: stacked cards */}
              <div className="md:hidden space-y-3">
                {filteredExpenses.map((expense) => (
                  <div key={expense.id} className="p-3 border rounded bg-card">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium text-foreground">{expense.expenseNumber}</div>
                        <div className="text-base font-semibold mt-0.5">{expense.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{expense.category}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">{new Date(expense.requestDate).toLocaleDateString()}</div>
                        <div className="text-lg font-semibold mt-0.5">{formatCurrency(Number(expense.amount), getDefaultCurrency())}</div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>Status</div>
                      <div className="text-right"><Badge className={getStatusColor(expense.status)}>{expense.status}</Badge></div>
                      <div>Priority</div>
                      <div className="text-right"><span className={getPriorityColor(expense.priority)}>{expense.priority}</span></div>
                    </div>
                    <div className="mt-3 flex items-center justify-end space-x-2">
                      <Button size="sm" variant="ghost" className="p-1" aria-label="View" onClick={() => setSelectedExpense(expense)} title="View details">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="p-1" aria-label="Download" onClick={() => handleDownload(expense)} title="Download report">
                        <Download className="h-4 w-4" />
                      </Button>
                      {isAdmin && expense.status === 'Pending' && (
                        <Button size="sm" variant="destructive" className="p-1" aria-label="Delete" onClick={() => deleteExpense(expense.id)} disabled={actionLoading === expense.id} title="Delete expense">
                          {actionLoading === expense.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop/Table view */}
              <div className="hidden md:block rounded-md border">
                <Table className="w-full table-fixed text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20 text-sm font-medium px-2 py-2">Expense #</TableHead>
                      <TableHead className="w-[20ch] text-sm font-medium truncate px-2 py-2">Title</TableHead>
                      <TableHead className="w-24 text-sm font-medium px-2 py-2">Date</TableHead>
                      <TableHead className="w-28 text-sm font-medium px-2 py-2">Status</TableHead>
                      <TableHead className="w-28 text-right text-sm font-medium px-2 py-2">Amount</TableHead>
                      <TableHead className="w-12 text-center text-sm font-medium px-1 py-2">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                          <div className="text-muted-foreground">Loading expenses...</div>
                        </TableCell>
                      </TableRow>
                    ) : filteredExpenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No expenses found matching your criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="font-medium px-2 py-2 text-xs">{expense.expenseNumber}</TableCell>
                          <TableCell className="truncate max-w-[20ch] px-2 py-2">
                            <div>
                              <div className="font-medium text-sm flex items-center gap-1 flex-wrap">
                                {expense.title}
                                {expense.isBillingInvoice && (
                                  <span className="text-xs bg-transparent text-amber-800 border border-amber-300 rounded px-1 py-0.5 font-semibold whitespace-nowrap">Invoice</span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">{expense.category}</div>
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-2 text-sm">{expense.requestDate ? new Date(expense.requestDate).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell className="px-2 py-2">
                            <div className="flex flex-col gap-1">
                              <Badge className={getStatusColor(expense.status)}>
                                <div className="flex items-center gap-1 text-xs">
                                  {getStatusIcon(expense.status)}
                                  <span className="align-middle">{expense.status}</span>
                                </div>
                              </Badge>
                              <div className="text-xs text-muted-foreground">Priority: <span className={getPriorityColor(expense.priority)}>{expense.priority}</span></div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium px-2 py-2 text-sm">
                            {formatCurrency(Number(expense.amount), getDefaultCurrency())}
                          </TableCell>
                          <TableCell className="text-center px-1 py-1">
                            <div className="flex items-center justify-center gap-2">
                              <Button size="sm" variant="ghost" className="p-1" aria-label="View" onClick={() => setSelectedExpense(expense)} title="View details">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="p-1" aria-label="Download" onClick={() => handleDownload(expense)} title="Download report">
                                <Download className="h-4 w-4" />
                              </Button>
                              {isAdmin && expense.status === 'Pending' && (
                                <Button size="sm" variant="destructive" className="p-1" aria-label="Delete" onClick={() => deleteExpense(expense.id)} disabled={actionLoading === expense.id} title="Delete expense">
                                  {actionLoading === expense.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {total > pageSize && (
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, total)} of {total} expenses
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0 || loading}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={(currentPage + 1) * pageSize >= total || loading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <TabErrorBoundary fallbackMessage="Unable to load analytics data. Please refresh the page.">
            {filteredExpenses.length >= 0 ? (
              <ExpenseAnalytics expenses={filteredExpenses} analyticsData={analyticsData} />
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading analytics...</p>
                </div>
              </div>
            )}
          </TabErrorBoundary>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6">
          <TabErrorBoundary fallbackMessage="Unable to load approvals data. Please refresh the page.">
            {filteredExpenses && filteredExpenses.length >= 0 ? (
              <ExpenseApprovals 
                expenses={filteredExpenses} 
                onAction={handleApprovalAction || (() => {})}
                getStatusColor={getStatusColor || (() => 'bg-gray-100 text-gray-800 border-gray-200')}
                getPriorityColor={getPriorityColor || (() => 'text-gray-600')}
                user={user}
              />
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading approvals...</p>
                </div>
              </div>
            )}
          </TabErrorBoundary>
        </TabsContent>
      </Tabs>

      {/* Expense Details Dialog */}
      {selectedExpense && (
        <ExpenseDetailsDialog 
          expense={selectedExpense} 
          onClose={() => setSelectedExpense(null)}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
        />
      )}
    </div>
  );
}

// Error boundary component for tab content
function TabErrorBoundary({ children, fallbackMessage }: { children: React.ReactNode, fallbackMessage: string }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Tab error:', error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
          <p className="text-muted-foreground mb-4">{fallbackMessage}</p>
          <Button onClick={() => setHasError(false)} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Expense form component for creating new expenses
function ExpenseForm({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: '',
    department: '',
    budgetCode: '',
    priority: 'Medium',
    dueDate: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Valid amount is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.department.trim()) newErrors.department = 'Department is required';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields correctly.',
        variant: 'destructive',
      });
      return;
    }

    if (!token) {
      toast({
        title: 'Error',
        description: 'Please log in to submit an expense.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const expenseData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        category: formData.category,
        department: formData.department.trim(),
        budgetCode: formData.budgetCode.trim() || undefined,
        priority: formData.priority,
        dueDate: formData.dueDate,
        notes: formData.notes.trim() || undefined,
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}/expenses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create expense');
      }

      toast({
        title: 'Success',
        description: 'Expense submitted successfully for approval.',
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        amount: '',
        category: '',
        department: '',
        budgetCode: '',
        priority: 'Medium',
        dueDate: '',
        notes: ''
      });
      setErrors({});

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating expense:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create expense. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto px-1">
        <form onSubmit={handleSubmit} className="space-y-6 pb-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
              <p className="text-sm text-muted-foreground">Enter the essential details for your expense request</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Expense Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Chemistry Lab Equipment Purchase"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">
                  Amount ($) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className={errors.amount ? 'border-red-500' : ''}
                />
                {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide a detailed description of the expense, including what it's for and why it's needed..."
                rows={4}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
            </div>
          </div>

          {/* Classification Section */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-lg font-semibold text-foreground">Classification</h3>
              <p className="text-sm text-muted-foreground">Categorize and prioritize your expense</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select expense category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-medium">
                  Priority Level
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority level" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_PRIORITIES.map(priority => (
                      <SelectItem key={priority} value={priority}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            priority === 'High' ? 'border border-red-500 bg-transparent' :
                            priority === 'Medium' ? 'border border-yellow-500 bg-transparent' : 'border border-green-500 bg-transparent'
                          }`} />
                          {priority}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Department & Budget Section */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-lg font-semibold text-foreground">Department & Budget</h3>
              <p className="text-sm text-muted-foreground">Specify department and budget allocation</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-medium">
                  Department <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g., Science Department"
                  className={errors.department ? 'border-red-500' : ''}
                />
                {errors.department && <p className="text-sm text-red-500">{errors.department}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="budgetCode" className="text-sm font-medium">
                  Budget Code
                </Label>
                <Input
                  id="budgetCode"
                  value={formData.budgetCode}
                  onChange={(e) => setFormData({ ...formData, budgetCode: e.target.value })}
                  placeholder="e.g., SCI-2024-LAB"
                />
              </div>
            </div>
          </div>

          {/* Timeline & Notes Section */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-lg font-semibold text-foreground">Timeline & Notes</h3>
              <p className="text-sm text-muted-foreground">Set deadline and add additional information</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-sm font-medium">
                  Due Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className={errors.dueDate ? 'border-red-500' : ''}
                />
                {errors.dueDate && <p className="text-sm text-red-500">{errors.dueDate}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Additional Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information, special requirements, or context..."
                rows={3}
              />
            </div>
          </div>
        </form>
      </div>

      {/* Fixed Footer with Action Buttons */}
      <div className="flex-shrink-0 border-t bg-background p-6 mt-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            <span className="text-red-500">*</span> Required fields
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              onClick={handleSubmit}
              className="min-w-[140px] bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Submit Expense
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Analytics component with charts and insights
function ExpenseAnalytics({ expenses, analyticsData }: { expenses: Expense[], analyticsData: AnalyticsData | null }) {
  // Calculate category breakdown
  const categoryBreakdown = useMemo(() => {
    try {
      const breakdown = EXPENSE_CATEGORIES.map(category => {
        const categoryExpenses = expenses.filter(exp => exp && exp.category === category);
        const total = categoryExpenses.reduce((sum, exp) => sum + parseAmountValue(exp.amount), 0);
        const count = categoryExpenses.length;
        return { category, total, count };
      }).filter(item => item.count > 0);
      return breakdown;
    } catch (error) {
      console.error('Error calculating category breakdown:', error);
      return [];
    }
  }, [expenses]);

  // Calculate monthly trends from analytics data
  const monthlyTrends = useMemo(() => {
    if (!analyticsData?.monthlyTrend) {
      return [];
    }

    return Object.entries(analyticsData.monthlyTrend)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-6) // Get last 6 months
      .map(([monthKey, data]: [string, MonthlyTrendData]) => ({
        month: monthKey.split(' ')[0], // Extract month name (e.g., "Jan" from "Jan 2024")
        amount: parseAmountValue(data.amount),
        count: Math.max(0, Math.trunc(parseAmountValue(data.count))),
      }));
  }, [analyticsData]);

  // Calculate status distribution
  const statusDistribution = useMemo(() => {
    try {
      const distribution = APPROVAL_STATUSES.map(status => {
        const statusExpenses = expenses.filter(exp => exp && exp.status === status);
        const total = statusExpenses.reduce((sum, exp) => sum + parseAmountValue(exp.amount), 0);
        const count = statusExpenses.length;
        return { status, total, count };
      }).filter(item => item.count > 0);
      return distribution;
    } catch (error) {
      console.error('Error calculating status distribution:', error);
      return [];
    }
  }, [expenses]);

  // Calculate department spending
  const departmentSpending = useMemo(() => {
    try {
      const departments = [...new Set(expenses.filter(exp => exp && exp.department).map(exp => exp.department))];
      return departments.map(dept => {
        const deptExpenses = expenses.filter(exp => exp && exp.department === dept);
        const total = deptExpenses.reduce((sum, exp) => sum + parseAmountValue(exp.amount), 0);
        const count = deptExpenses.length;
        return { department: dept, total, count };
      }).sort((a, b) => b.total - a.total);
    } catch (error) {
      console.error('Error calculating department spending:', error);
      return [];
    }
  }, [expenses]);

  // Add safety check for expenses data
  if (!expenses || !Array.isArray(expenses)) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  const totalBudget = 100000; // Mock annual budget
  const totalSpent = expenses.reduce((sum, exp) => sum + parseAmountValue(exp.amount), 0);
  const budgetUtilization = totalSpent > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Budget Utilization</p>
                <p className="text-2xl font-bold">{budgetUtilization.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full border border-blue-500 bg-transparent" 
                style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Expense</p>
                <p className="text-2xl font-bold">
                  {expenses.length > 0 ? formatCurrency(totalSpent / expenses.length, getDefaultCurrency()) : formatCurrency(0, getDefaultCurrency())}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approval Rate</p>
                <p className="text-2xl font-bold">
                  {expenses.length > 0 ? 
                    ((expenses.filter(e => e.status === 'Approved' || e.status === 'Paid').length / expenses.length) * 100).toFixed(0) : '0'
                  }%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Approval Time</p>
                <p className="text-2xl font-bold">3.2 days</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Breakdown of expenses by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryBreakdown.map((item, index) => (
                <div key={item.category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: `hsl(${index * 45}, 70%, 50%)` }}
                    />
                    <span className="text-sm font-medium">{item.category}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatCurrency(item.total, getDefaultCurrency())}</p>
                    <p className="text-xs text-muted-foreground">{item.count} items</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Approval Status</CardTitle>
            <CardDescription>Current status of all expense requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusDistribution.map((item, index) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      item.status === 'Approved' || item.status === 'Paid' ? 'border border-green-500 bg-transparent' :
                      item.status === 'Rejected' ? 'border border-red-500 bg-transparent' :
                      'border border-yellow-500 bg-transparent'
                    }`} />
                    <span className="text-sm font-medium">{item.status}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatCurrency(item.total, getDefaultCurrency())}</p>
                    <p className="text-xs text-muted-foreground">{item.count} items</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Spending and Monthly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Spending */}
        <Card>
          <CardHeader>
            <CardTitle>Department Spending</CardTitle>
            <CardDescription>Top spending departments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departmentSpending.slice(0, 6).map((dept, index) => (
                <div key={dept.department} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{dept.department}</span>
                    <span>{formatCurrency(dept.total, getDefaultCurrency())}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full border border-blue-500 bg-transparent" 
                      style={{ 
                        width: `${(dept.total / Math.max(...departmentSpending.map(d => d.total))) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending Trends</CardTitle>
            <CardDescription>Expense trends over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyTrends.map((month, index) => (
                <div key={month.month} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{month.month} 2024</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatCurrency(month.amount, getDefaultCurrency())}</p>
                    <p className="text-xs text-muted-foreground">{month.count} expenses</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
          <CardDescription>AI-powered insights and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/30 dark:border-blue-800">
              <TrendingUp className="h-6 w-6 text-blue-700 dark:text-blue-300 mb-2" />
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">Budget Alert</h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                You've used {budgetUtilization.toFixed(1)}% of your annual budget. Consider reviewing upcoming expenses.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/30 dark:border-green-800">
              <CheckCircle className="h-6 w-6 text-green-700 dark:text-green-300 mb-2" />
              <h4 className="font-semibold text-green-900 dark:text-green-100">Efficiency</h4>
              <p className="text-sm text-green-800 dark:text-green-200">
                {expenses.filter(e => e.status === 'Approved' || e.status === 'Paid').length} expenses approved this month. 
                Great approval efficiency!
              </p>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-950/25 dark:border-yellow-800">
              <AlertTriangle className="h-6 w-6 text-yellow-700 dark:text-yellow-300 mb-2" />
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">Attention Needed</h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {expenses.filter(e => e.priority === 'High' && e.status === 'Pending').length} high-priority 
                expenses await approval.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Approvals component with detailed workflow
function ExpenseApprovals({ 
  expenses, 
  onAction, 
  getStatusColor, 
  getPriorityColor,
  user 
}: { 
  expenses: Expense[], 
  onAction: (id: string, action: 'approve' | 'reject') => void,
  getStatusColor: (status: string) => string,
  getPriorityColor: (priority: string) => string,
  user?: User
}) {
  // Add safety check for expenses data
  if (!expenses || !Array.isArray(expenses)) {
    console.log('ExpenseApprovals: expenses is not an array or is null', expenses);
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading approvals data...</p>
        </div>
      </div>
    );
  }

  console.log('ExpenseApprovals: received expenses', expenses.length, expenses);

  const pendingExpenses = expenses.filter(expense => 
    expense && expense.status && ['Pending', 'Department Approved', 'Finance Review', 'Principal Approved', 'Board Review'].includes(expense.status)
  );

  console.log('ExpenseApprovals: pending expenses', pendingExpenses.length, pendingExpenses);

  try {

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Pending Approvals ({pendingExpenses.length})
          </CardTitle>
          <CardDescription>Review and approve expense requests in the workflow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingExpenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>No pending approvals at this time.</p>
            </div>
          ) : (
            pendingExpenses.map((expense) => (
              <Card key={expense.id} className={`border-l-4 ${expense.isBillingInvoice ? 'border-l-amber-500' : 'border-l-blue-500'}`}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{expense.title || 'Untitled Expense'}</h3>
                        {expense.isBillingInvoice && (
                          <Badge className="bg-transparent text-amber-800 border border-amber-300 text-xs font-semibold">
                            📄 edunexus Invoice
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{expense.expenseNumber || 'N/A'} • {expense.category || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">Requested by: {expense.requestedBy || 'Unknown'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{formatCurrency(expense.amount ? Number(expense.amount) : 0, getDefaultCurrency())}</p>
                      <Badge className={`${getPriorityColor(expense.priority || 'Medium')} bg-opacity-10 border`}>
                        {expense.priority || 'Medium'} Priority
                      </Badge>
                    </div>
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
                    {user?.role === 'admin' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onAction(expense.id, 'reject')}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onAction(expense.id, 'approve')}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground px-3 py-2 bg-gray-50 rounded">
                        This Item is pending approval by school admin
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Quick Stats for Approvers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Awaiting Your Review</p>
                <p className="text-2xl font-bold">{pendingExpenses.filter(e => e && e.status === 'Finance Review').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold">{pendingExpenses.filter(e => e && e.priority === 'High').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pending Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(pendingExpenses.reduce((sum, e) => sum + (e && e.amount ? Number(e.amount) : 0), 0), getDefaultCurrency())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
  } catch (error) {
    console.error('Error rendering ExpenseApprovals:', error);
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-lg font-semibold mb-2">Unable to load approvals</h3>
          <p className="text-muted-foreground mb-4">There was an error loading the approvals data.</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }
}

// Enhanced Details dialog with comprehensive information
function ExpenseDetailsDialog({ 
  expense, 
  onClose, 
  getStatusColor, 
  getPriorityColor 
}: { 
  expense: Expense, 
  onClose: () => void,
  getStatusColor: (status: string) => string,
  getPriorityColor: (priority: string) => string
}) {
  // Add safety check for expense data
  if (!expense || typeof expense !== 'object') {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Error Loading Expense Details</DialogTitle>
            <DialogDescription>
              Unable to load expense details. Please try again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const getApprovalSteps = (currentStatus: string, approvalLevel: number) => {
    const steps = [
      { 
        label: 'Department Head', 
        completed: approvalLevel >= 1, 
        current: currentStatus === 'Pending',
        date: approvalLevel >= 1 ? '2024-01-16' : null,
        approver: approvalLevel >= 1 ? 'Dr. Smith' : null
      },
      { 
        label: 'Finance Review', 
        completed: approvalLevel >= 2, 
        current: currentStatus === 'Department Approved',
        date: approvalLevel >= 2 ? '2024-01-17' : null,
        approver: approvalLevel >= 2 ? 'Jane Doe' : null
      },
      { 
        label: 'Principal', 
        completed: approvalLevel >= 3, 
        current: currentStatus === 'Finance Review',
        date: approvalLevel >= 3 ? '2024-01-18' : null,
        approver: approvalLevel >= 3 ? 'Mr. Johnson' : null
      },
      { 
        label: 'Board Review', 
        completed: approvalLevel >= 4, 
        current: currentStatus === 'Principal Approved',
        date: approvalLevel >= 4 ? '2024-01-20' : null,
        approver: approvalLevel >= 4 ? 'Board Committee' : null
      },
      { 
        label: 'Final Approval', 
        completed: approvalLevel >= 5, 
        current: currentStatus === 'Board Review',
        date: approvalLevel >= 5 ? '2024-01-22' : null,
        approver: approvalLevel >= 5 ? 'Finance Director' : null
      }
    ];
    return steps;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{expense.title}</span>
            <Badge className={getStatusColor(expense.status)}>
              {expense.status}
            </Badge>
          </DialogTitle>
          <DialogDescription className="flex items-center space-x-4">
            <span>{expense.expenseNumber}</span>
            <span>•</span>
            <span>{expense.category}</span>
            <span>•</span>
            <span className={getPriorityColor(expense.priority)}>{expense.priority} Priority</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Expense Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(expense.amount, getDefaultCurrency())}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                    <p className="font-medium">{expense.department}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Budget Code</Label>
                    <p className="font-medium">{expense.budgetCode}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Requested By</Label>
                    <p className="font-medium">{expense.requestedBy}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Request Date</Label>
                    <p className="font-medium">{new Date(expense.requestDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Due Date</Label>
                    <p className="font-medium">{new Date(expense.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded text-sm">{expense.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expense.attachments.map((attachment: string, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">{attachment}</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Comments/Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comments & Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-transparent border border-blue-300 rounded">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">Dr. Smith</span>
                      <span className="text-xs text-muted-foreground">2024-01-16</span>
                    </div>
                    <p className="text-sm">Equipment is urgently needed for upcoming chemistry practicals. Please expedite approval.</p>
                  </div>
                  <div className="p-3 bg-transparent border border-green-300 rounded">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">Jane Doe (Finance)</span>
                      <span className="text-xs text-muted-foreground">2024-01-17</span>
                    </div>
                    <p className="text-sm">Budget allocation verified. All documentation is in order. Recommending approval.</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Textarea placeholder="Add a comment..." className="resize-none" rows={3} />
                  <div className="flex justify-end mt-2">
                    <Button size="sm">Add Comment</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Approval Workflow */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Approval Workflow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getApprovalSteps(expense.status, expense.approvalLevel).map((step, index) => (
                    <div key={step.label} className="flex items-start space-x-3">
                      <div className={`mt-1 ${
                        step.completed ? 'text-green-600' : 
                        step.current ? 'text-blue-600' : 'text-gray-400'
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : step.current ? (
                          <Clock className="h-5 w-5" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-current" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          step.completed ? 'text-green-600' : 
                          step.current ? 'text-blue-600' : 'text-gray-400'
                        }`}>
                          {step.label}
                        </p>
                        {step.completed && (
                          <div className="text-xs text-muted-foreground">
                            <p>Approved by {step.approver}</p>
                            <p>{step.date}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {expense.status !== 'Approved' && expense.status !== 'Rejected' && expense.status !== 'Paid' && (
                  <>
                    <Button className="w-full" size="sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button variant="outline" className="w-full" size="sm">
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
                <Button variant="outline" className="w-full" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </CardContent>
            </Card>

            {/* Budget Impact */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Budget Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Budget Allocated:</span>
                    <span className="font-medium">{formatCurrency(50000, getDefaultCurrency())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Already Spent:</span>
                    <span className="font-medium">{formatCurrency(32500, getDefaultCurrency())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>This Expense:</span>
                    <span className="font-medium">{formatCurrency(expense.amount, getDefaultCurrency())}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-sm font-bold">
                    <span>Remaining After:</span>
                    <span>{formatCurrency(50000 - 32500 - expense.amount, getDefaultCurrency())}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full border border-blue-500 bg-transparent" 
                      style={{ width: `${((32500 + expense.amount) / 50000) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}