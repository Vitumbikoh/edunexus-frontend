import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchBar } from '@/components/ui/search-bar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Filter, Download, Plus, Loader2 } from 'lucide-react';
import { API_CONFIG } from '@/config/api';
import { academicCalendarService } from '@/services/academicCalendarService';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, getDefaultCurrency } from '@/lib/currency';

const mockTransactions = [
  {
    id: '1',
    type: 'Payment',
    description: 'Tuition Fee - John Doe',
    amount: 2500.00,
    date: '2024-01-15',
    status: 'Completed',
    reference: 'TXN-001',
    category: 'Tuition'
  },
  {
    id: '2',
    type: 'Refund',
    description: 'Course Cancellation - Jane Smith',
    amount: -150.00,
    date: '2024-01-14',
    status: 'Processed',
    reference: 'TXN-002',
    category: 'Refund'
  },
  {
    id: '3',
    type: 'Payment',
    description: 'Library Fee - Mike Johnson',
    amount: 75.00,
    date: '2024-01-13',
    status: 'Pending',
    reference: 'TXN-003',
    category: 'Fees'
  },
  {
    id: '4',
    type: 'Payment',
    description: 'Lab Fee - Sarah Wilson',
    amount: 200.00,
    date: '2024-01-12',
    status: 'Completed',
    reference: 'TXN-004',
    category: 'Fees'
  }
];

export default function Transactions() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [academicCalendars, setAcademicCalendars] = useState<any[]>([]);
  const [selectedAcademicCalendarId, setSelectedAcademicCalendarId] = useState<string | null>(null);
  const [terms, setTerms] = useState<any[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [searchPeriod, setSearchPeriod] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  // Removed type filter per request
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pendingStudents, setPendingStudents] = useState(0);
  const [calendarWarning, setCalendarWarning] = useState<string | null>(null);

  const fetchTransactions = async (page = 1, search = '', status = 'all', type = 'all', start = '', end = '') => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (search) params.append('search', search);
      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);

      // include selected academicCalendarId and termId if available (fall back to active calendar)
      try {
        const activeCal = await academicCalendarService.getActiveAcademicCalendar(token!);
        const calId = selectedAcademicCalendarId || activeCal?.id || null;
        if (calId) params.append('academicCalendarId', calId);
      } catch {}
      if (selectedTermId) params.append('termId', selectedTermId);

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TRANSACTIONS}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.status}`);
      }

      const data = await response.json();
      setTransactions(data.transactions || []);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
      // Fallback to mock data if API fails
      setTransactions(mockTransactions);
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialStats = async () => {
    try {
      // include selected academicCalendarId if available (fall back to active)
      let calParam = '';
      try {
        const activeCal = await academicCalendarService.getActiveAcademicCalendar(token!);
        const calId = selectedAcademicCalendarId || activeCal?.id || null;
        if (calId) calParam = `?academicCalendarId=${encodeURIComponent(calId)}`;
      } catch {}
      const response = await fetch(`${API_CONFIG.BASE_URL}/finance/total-finances${calParam}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingStudents(data.pendingStudents || 0);
      }
    } catch (err) {
      console.error('Error fetching financial stats:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTransactions(currentPage, searchPeriod, statusFilter, 'all', startDate, endDate);
      fetchFinancialStats();
    }
  }, [token, currentPage, searchPeriod, statusFilter, startDate, endDate, selectedAcademicCalendarId, selectedTermId]);

  // Load academic calendars and default selection
  useEffect(() => {
    const loadCalendars = async () => {
      if (!token) return;
      try {
        // First try the settings academic calendars endpoint (preferred)
        const cals = await academicCalendarService.getAcademicCalendars(token);
        const mapped = (cals || []).map((c: any, idx: number) => ({
          id: c.id || c.uuid || c.calendarId,
          name: c.term || c.name || c.title || `Calendar ${idx + 1}`,
          group: (c.isIndependent || c.independent || c.type === 'independent' || c.source === 'independent') ? 'independent' : 'school',
          raw: c,
        }));

        // If no calendars found, or to be safe, try billing calendars as a fallback
        if (!mapped.length) {
          try {
            let res = await fetch(`${API_CONFIG.BASE_URL}/billing/calendars`, {
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            // If unauthorized, attempt unauthenticated access
            if (!res.ok && res.status === 401) {
              try {
                res = await fetch(`${API_CONFIG.BASE_URL}/billing/calendars`);
              } catch (_) {
                // ignore
              }
            }

            if (res.ok) {
              const fallback = await res.json();
              const fbMapped = (fallback || []).map((c: any, idx: number) => ({
                id: c.id || c.uuid || c.calendarId || c.academicCalendarId,
                name: c.name || c.term || c.title || `Calendar ${idx + 1}`,
                group: (c.isIndependent || c.independent || c.type === 'independent' || c.source === 'independent') ? 'independent' : 'school',
                raw: c,
              }));
              setAcademicCalendars(fbMapped);              setCalendarWarning('Loaded calendars from billing endpoint as a fallback (permissions may be restricted).');              const active = await academicCalendarService.getActiveAcademicCalendar(token).catch(() => null);
              setSelectedAcademicCalendarId(active?.id || (fbMapped && fbMapped[0]?.id) || null);
              return;
            }
          } catch (fallbackErr) {
            console.warn('Fallback billing/calendars failed', fallbackErr);
          }
        }

        setAcademicCalendars(mapped);
        setCalendarWarning(null);
        // Prefer the active calendar if available, otherwise the first calendar
        try {
          const active = await academicCalendarService.getActiveAcademicCalendar(token);
          setSelectedAcademicCalendarId(active?.id || (mapped && mapped[0]?.id) || null);
        } catch (_) {
          setSelectedAcademicCalendarId((mapped && mapped[0]?.id) || null);
        }
      } catch (e: any) {
        console.error('Failed to load academic calendars', e);

        // If unauthorized or forbidden, try billing endpoint as a fallback which may have public/alternate access
        if (e.message && e.message.toLowerCase().includes('failed to fetch academic calendars')) {
          try {
            let res = await fetch(`${API_CONFIG.BASE_URL}/billing/calendars`, {
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            if (!res.ok && res.status === 401) {
              try {
                res = await fetch(`${API_CONFIG.BASE_URL}/billing/calendars`);
              } catch (_) {
                // ignore
              }
            }
            if (res.ok) {
              const fallback = await res.json();
              const fbMapped = (fallback || []).map((c: any, idx: number) => ({
                id: c.id || c.uuid || c.calendarId || c.academicCalendarId,
                name: c.name || c.term || c.title || `Calendar ${idx + 1}`,
                group: (c.isIndependent || c.independent || c.type === 'independent' || c.source === 'independent') ? 'independent' : 'school',
                raw: c,
              }));
              setAcademicCalendars(fbMapped);
              const active = await academicCalendarService.getActiveAcademicCalendar(token).catch(() => null);
              setSelectedAcademicCalendarId(active?.id || (fbMapped && fbMapped[0]?.id) || null);
              return;
            }
          } catch (fallbackErr) {
            console.warn('Fallback billing/calendars failed', fallbackErr);
          }
        }

        // As a last resort, derive calendars (ids/names) from recent transactions available to the user
        try {
          const txRes = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TRANSACTIONS}?page=1&limit=500`, { headers: { Authorization: `Bearer ${token}` } });
          if (txRes.ok) {
            const txData = await txRes.json();
            const list = Array.isArray(txData.transactions) ? txData.transactions : (txData.items || []);
            const byCal: Record<string, any> = {};
            list.forEach((t: any) => {
              const id = t.academicCalendarId || t.academic_calendar_id || t.calendarId || t.academicCalendar || t.academicCalendarUuid || t.academic_calendar_uuid || 'unknown';
              const name = t.academicCalendarName || t.academic_calendar_name || t.academicCalendar || t.academicCalendarTitle || (t.academicCalendarId ? `Calendar ${t.academicCalendarId}` : 'Unknown');
              if (!id || id === 'unknown') return;
              if (!byCal[id]) byCal[id] = { id, name, group: 'school', raw: null };
            });
            const derived = Object.values(byCal);
            if (derived.length) {
              setAcademicCalendars(derived);
              setSelectedAcademicCalendarId(derived[0]?.id || null);
              setCalendarWarning('Derived available calendars from your transactions because the calendars API was unavailable or forbidden.');
            }
          }
        } catch (deriveErr) {
          console.warn('Failed to derive calendars from transactions', deriveErr);
        }

        setAcademicCalendars([]);
      }
    };
    loadCalendars();
  }, [token]);

  // Load terms when calendar selection changes
  useEffect(() => {
    const deriveTermsFromTransactions = (txs: any[]) => {
      const byTerm: Record<string, any> = {};
      txs.forEach(t => {
        const id = t.termId || t.term_id || t.term || (`${t.termNumber || ''}-${t.periodName || ''}`) || t.term || t.period || 'unknown';
        const name = t.termName || t.term || t.periodName || (typeof t.termNumber === 'number' ? `Term ${t.termNumber}` : id);
        if (id && !byTerm[id]) {
          byTerm[id] = { id, name, raw: t };
        }
      });
      return Object.values(byTerm).map((v:any) => ({ id: v.id, name: v.name, raw: v.raw }));
    };

    const loadTerms = async () => {
      if (!token) return;
      try {
        const url = selectedAcademicCalendarId
          ? `${API_CONFIG.BASE_URL}/settings/terms?academicCalendarId=${encodeURIComponent(selectedAcademicCalendarId)}`
          : `${API_CONFIG.BASE_URL}/settings/terms`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
          // Fallback: derive terms from transactions
          try {
            const txRes = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TRANSACTIONS}?page=1&limit=500&academicCalendarId=${encodeURIComponent(selectedAcademicCalendarId || '')}`, { headers: { Authorization: `Bearer ${token}` } });
            if (txRes.ok) {
              const txData = await txRes.json();
              const list = Array.isArray(txData.transactions) ? txData.transactions : (txData.items || []);
              const mapped = deriveTermsFromTransactions(list);
              setTerms(mapped || []);
              const current = mapped[0];
              setSelectedTermId(current?.id || null);
              return;
            }
          } catch (e) {
            console.warn('Failed to derive terms from transactions', e);
          }
          return setTerms([]);
        }
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

  // Filter transactions client-side for additional filtering
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !searchInput ||
      transaction.receiptNumber?.toLowerCase().includes(searchInput.toLowerCase()) ||
      transaction.studentName?.toLowerCase().includes(searchInput.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchInput.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      transaction.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-transparent text-green-700 border-green-300';
      case 'Pending': return 'bg-transparent text-yellow-700 border-yellow-300';
      case 'Processed': return 'bg-transparent text-blue-700 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAmountColor = (amount: number) => {
    return amount < 0 ? 'text-red-600' : 'text-green-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transaction History</h1>
          <p className="text-muted-foreground">View and manage all financial transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Transaction
          </Button>
        </div>
      </div>

      {/* Summary Cards remain above filters; search moved into filter card per request */}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination?.total || transactions.length}</div>
            <p className="text-xs text-muted-foreground">Total records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${transactions.reduce((sum, t) => {
                const amount = parseFloat(t.amount) || 0;
                return sum + (amount > 0 ? amount : 0);
              }, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Income from payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingStudents}
            </div>
            <p className="text-xs text-muted-foreground">
              Students with outstanding fees
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Refunds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(Math.abs(transactions.filter(t => (parseFloat(t.amount) || 0) < 0).reduce((sum, t) => {
                const amount = parseFloat(t.amount) || 0;
                return sum + amount;
              }, 0)), getDefaultCurrency())}
            </div>
            <p className="text-xs text-muted-foreground">
              {transactions.filter(t => t.amount < 0).length} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>View and manage all financial transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search bar should be directly under the title/description and above filters */}
          <div className="mb-4">
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              onDebouncedChange={setSearchPeriod}
              delay={300}
              placeholder="Search by receipt number or student name..."
              className="w-full max-w-2xl"
            />
          </div>

          {calendarWarning && (
            <div className="mb-3 p-2 rounded bg-transparent border border-yellow-300 text-yellow-700 text-sm">
              {calendarWarning}
            </div>
          )}

          <div className="flex flex-wrap gap-4 mb-6 items-center">
            <div className="flex gap-2 items-center">
              <Input
                type="date"
                placeholder="mm/dd/yyyy"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-36"
                aria-label="Start date"
              />
              <Input
                type="date"
                placeholder="mm/dd/yyyy"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-36"
                aria-label="End date"
              />
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-xs">Calendar</Label>
              <select
                className="border rounded-md h-9 px-2 bg-background text-sm w-36 max-w-full"
                value={selectedAcademicCalendarId || ''}
                onChange={(e) => setSelectedAcademicCalendarId(e.target.value || null)}
              >
                <option value="">All calendars</option>
                {academicCalendars.filter((c: any) => c.group !== 'independent').length > 0 && (
                  <optgroup label="School calendars">
                    {academicCalendars.filter((c: any) => c.group !== 'independent').map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </optgroup>
                )}
                {academicCalendars.filter((c: any) => c.group === 'independent').length > 0 && (
                  <optgroup label="Independent calendars">
                    {academicCalendars.filter((c: any) => c.group === 'independent').map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-xs">Term</Label>
              <select
                className="border rounded-md h-9 px-2 bg-background text-sm w-40 max-w-full"
                value={selectedTermId || ''}
                onChange={(e) => setSelectedTermId(e.target.value || null)}
              >
                <option value="">All terms</option>
                {terms.map(t => <option key={t.id} value={t.id}>{t.name || t.id}</option>)}
              </select>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="mb-4 p-4 border border-red-300 rounded-md bg-transparent text-red-700">
              <p className="font-medium">Error loading transactions</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Transactions Table */}

          {/* Mobile stacked list */}
          <div className="md:hidden space-y-3">
            {filteredTransactions.map(tx => (
              <div key={tx.id} className="p-3 border rounded bg-card">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">{tx.receiptNumber || tx.id}</div>
                    <div className="text-base font-semibold mt-1">{tx.studentName ? `${tx.studentName} - ${tx.description || 'Payment'}` : tx.description || 'Payment'}</div>
                    <div className="text-xs text-muted-foreground mt-1">{tx.type} • {tx.term || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground mt-1">For: {tx.forTermNumber ? `Term ${tx.forTermNumber} - ${tx.forAcademicYear}` : (tx.paymentType === 'Credit Balance' ? 'Credit' : '—')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">{tx.paymentDate ? new Date(tx.paymentDate).toISOString().slice(0,10).replace(/-/g,'/') : 'N/A'}</div>
                    <div className={`text-lg font-semibold mt-1 ${getAmountColor(parseFloat(tx.amount) || 0)}`}>{formatCurrency(Math.abs(parseFloat(tx.amount) || 0), getDefaultCurrency())}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop/Table */}
          <div className="hidden md:block rounded-md border overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Loading transactions...</span>
              </div>
            ) : (
              <Table className="w-full table-fixed text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28 text-sm font-medium px-2 py-2">Receipt #</TableHead>
                    <TableHead className="w-[32ch] text-sm font-medium px-2 py-2">Description</TableHead>
                    <TableHead className="w-20 text-sm font-medium px-2 py-2">Type</TableHead>
                    <TableHead className="hidden lg:table-cell w-28 text-sm font-medium px-2 py-2">For Term</TableHead>
                    <TableHead className="hidden lg:table-cell w-24 text-sm font-medium px-2 py-2">Term</TableHead>
                    <TableHead className="w-20 text-sm font-medium px-2 py-2">Date</TableHead>
                    <TableHead className="w-28 text-right text-sm font-medium px-2 py-2">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium px-2 py-2">{transaction.receiptNumber || transaction.id}</TableCell>
                      <TableCell className="whitespace-normal truncate max-w-[32ch] px-2 py-2">{transaction.studentName ? `${transaction.studentName} - ${transaction.description || 'Payment'}` : transaction.description || 'Payment'}</TableCell>
                      <TableCell className="px-2 py-2"><Badge variant="outline">{(parseFloat(transaction.amount) || 0) > 0 ? 'Payment' : 'Refund'}</Badge></TableCell>
                      <TableCell className="hidden lg:table-cell px-2 py-2">{transaction.forTermNumber ? `Term ${transaction.forTermNumber} - ${transaction.forAcademicYear}` : (transaction.paymentType === 'Credit Balance' ? 'Credit' : '—')}</TableCell>
                      <TableCell className="hidden lg:table-cell px-2 py-2">{transaction.term || 'N/A'}</TableCell>
                      <TableCell className="px-2 py-2">{transaction.paymentDate ? new Date(transaction.paymentDate).toISOString().slice(0,10).replace(/-/g,'/') : 'N/A'}</TableCell>
                      <TableCell className={`text-right font-medium px-2 py-2 ${getAmountColor(parseFloat(transaction.amount) || 0)}`}>{formatCurrency(Math.abs(parseFloat(transaction.amount) || 0), getDefaultCurrency())}{(parseFloat(transaction.amount) || 0) < 0 && ' (Refund)'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {filteredTransactions.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found matching your criteria.
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} transactions
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={currentPage === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}