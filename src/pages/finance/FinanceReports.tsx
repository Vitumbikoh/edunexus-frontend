import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { CalendarIcon, Download, FileText, TrendingUp, TrendingDown, DollarSign, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG } from '@/config/api';
import { formatCurrency, getDefaultCurrency } from '@/lib/currency';
import { academicCalendarService } from '@/services/academicCalendarService';

type FinancialReportResponse = {
  success: boolean;
  totals: {
    totalFees: number;
    totalByType: Array<{ type: string; amount: number }>;
    totalApprovedExpenses: number;
    netBalance: number;
  };
  trends: Array<{ month: string; fees: number; expenses: number }>;
  filters?: any;
};

type TermBasedReportResponse = {
  success: boolean;
  currentTerm: {
    termId: string;
    termName: string;
    startDate: string;
    endDate: string;
    revenue: number;
    expenses: number;
    profit: number;
    profitMargin: number;
  } | null;
  previousTerms: Array<{
    termId: string;
    termName: string;
    startDate: string;
    endDate: string;
    revenue: number;
    expenses: number;
    profit: number;
    profitMargin: number;
  }>;
  cumulative: {
    totalRevenue: number;
    totalExpenses: number;
    totalProfit: number;
    totalProfitMargin: number;
    broughtForward: number;
  };
  carryForwardBalance: number;
};

export default function FinanceReports() {
  const { toast } = useToast();
  const { token } = useAuth();
  
  const [reportType, setReportType] = useState('overview');
  const [dateRange, setDateRange] = useState('6months');
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [currency, setCurrency] = useState(getDefaultCurrency());
  const [chartType, setChartType] = useState('bar');
  const [includeExpenses, setIncludeExpenses] = useState(true);
  const [includeRevenue, setIncludeRevenue] = useState(true);
  const [groupBy, setGroupBy] = useState('month');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FinancialReportResponse | null>(null);
  const [termBasedData, setTermBasedData] = useState<TermBasedReportResponse | null>(null);
  const [showCarryForward, setShowCarryForward] = useState(true);

  // Currency utilities (no FX conversion yet; formatting only)
  const currencySymbol = useMemo(() => {
    if (currency === 'MWK') return 'MK';
    const m: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', KES: 'KSh ' };
    return m[currency] ?? '';
  }, [currency]);

  // Compute default date range
  const computedRange = useMemo(() => {
    if (dateRange === 'custom') {
      return { start: fromDate, end: toDate };
    }
    const now = new Date();
    const end = now;
    let start = new Date(now);
    if (dateRange === '1month') start.setMonth(now.getMonth() - 1);
    else if (dateRange === '3months') start.setMonth(now.getMonth() - 3);
    else if (dateRange === '6months') start.setMonth(now.getMonth() - 6);
    else if (dateRange === '1year') start.setFullYear(now.getFullYear() - 1);
    return { start, end };
  }, [dateRange, fromDate, toDate]);

  useEffect(() => {
    const fetchReport = async () => {
      if (!token) return;
      // For custom range, wait until both dates are selected
      if (dateRange === 'custom' && (!computedRange.start || !computedRange.end)) return;
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (computedRange.start) params.set('startDate', computedRange.start.toISOString());
        if (computedRange.end) params.set('endDate', computedRange.end.toISOString());
        // include active academicCalendarId
        try {
          const cal = await academicCalendarService.getActiveAcademicCalendar(token!);
          if (cal?.id) params.set('academicCalendarId', cal.id);
        } catch {}
        const res = await fetch(`${API_CONFIG.BASE_URL}/finance/reports/financial?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const json = await res.json();
        setData(json as FinancialReportResponse);
      } catch (e: any) {
        setError(e?.message || 'Failed to load financial report');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [token, dateRange, computedRange.start?.toISOString(), computedRange.end?.toISOString()]);

  // Fetch term-based report with carry-forward balances
  const fetchTermBasedReport = async () => {
    if (!token) return;
    try {
      // include active academicCalendarId
      let calParam = '';
      try {
        const cal = await academicCalendarService.getActiveAcademicCalendar(token!);
        if (cal?.id) calParam = `&academicCalendarId=${encodeURIComponent(cal.id)}`;
      } catch {}
      const res = await fetch(`${API_CONFIG.BASE_URL}/finance/reports/term-based?includeCarryForward=${showCarryForward}${calParam}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const json = await res.json();
      setTermBasedData(json as TermBasedReportResponse);
    } catch (e: any) {
      console.error('Failed to load term-based report:', e);
      // Don't set main error state, just log it
    }
  };

  useEffect(() => {
    fetchTermBasedReport();
  }, [token, showCarryForward]);

  const handleExportReport = () => {
    if (!data) return;
    const csvRows: Array<Array<string | number>> = [];
    // Metadata header
    csvRows.push(['Report Type', reportType]);
    csvRows.push(['Date Range', dateRange === 'custom' ? `${fromDate ? format(fromDate, 'yyyy-MM-dd') : ''} to ${toDate ? format(toDate, 'yyyy-MM-dd') : ''}` : dateRange]);
    csvRows.push(['Currency', currency]);
    csvRows.push(['Group By', groupBy]);
    csvRows.push(['Include Revenue', includeRevenue ? 'Yes' : 'No']);
    csvRows.push(['Include Expenses', includeExpenses ? 'Yes' : 'No']);
    csvRows.push([]);
    // Totals (respect toggles for a quick-glance)
    const effRevenue = includeRevenue ? data.totals.totalFees : 0;
    const effExpenses = includeExpenses ? data.totals.totalApprovedExpenses : 0;
    const effNet = effRevenue - effExpenses;
    csvRows.push(['Totals']);
    csvRows.push(['Total Revenue', effRevenue]);
    csvRows.push(['Total Expenses', effExpenses]);
    csvRows.push(['Net Balance', effNet]);
    csvRows.push([]);
    csvRows.push(['Fees By Type']);
    csvRows.push(['Type', 'Amount']);
    for (const t of data.totals.totalByType) csvRows.push([t.type, t.amount]);
    csvRows.push([]);
    csvRows.push(['Trends']);
    csvRows.push(['Bucket', 'Revenue', 'Expenses', 'Profit']);
    const rows = groupedTrends.map((m) => [m.bucket, includeRevenue ? m.revenue : 0, includeExpenses ? m.expenses : 0, (includeRevenue ? m.revenue : 0) - (includeExpenses ? m.expenses : 0)]);
    rows.forEach(r => csvRows.push(r));

    const csvContent = csvRows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast({ title: 'Report Exported', description: 'Financial report has been downloaded as CSV.' });
  };

  const handleGeneratePDF = () => {
    // For now, show a toast indicating PDF generation
    // In a real implementation, you would use a library like jsPDF or call a backend service
    toast({
      title: 'PDF Generation',
      description: 'PDF report generation feature coming soon.',
    });
  };

  // Grouping logic for trends
  const groupedTrends = useMemo(() => {
    if (!data) return [] as Array<{ bucket: string; revenue: number; expenses: number; profit: number }>;
    const items = data.trends.map(t => ({ month: t.month, revenue: t.fees, expenses: t.expenses }));
    const acc = new Map<string, { revenue: number; expenses: number }>();

    const toQuarter = (m: string) => {
      // Expecting YYYY-MM or Mon/YYYY; support both
      // Try to parse YYYY-MM first
      const parts = m.match(/^(\d{4})[-/](\d{2})/);
      let year: string | null = null;
      let monthNum: number | null = null;
      if (parts) {
        year = parts[1];
        monthNum = Number(parts[2]);
      } else {
        // Fallback parse like 'Jan' or 'Jan-2025'
        const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
        const mMatch = m.toLowerCase().match(/([a-z]{3})/);
        const yMatch = m.match(/(\d{4})/);
        monthNum = mMatch ? months.indexOf(mMatch[1]) + 1 : null;
        year = yMatch ? yMatch[1] : null;
      }
      if (!year || !monthNum) return m;
      const q = Math.ceil(monthNum / 3);
      return `${year}-Q${q}`;
    };

    const toYear = (m: string) => {
      const y = m.match(/(\d{4})/);
      return y ? y[1] : m;
    };

    const bucketOf = (m: string) => {
      if (groupBy === 'quarter') return toQuarter(m);
      if (groupBy === 'year') return toYear(m);
      // month (default)
      return m;
    };

    for (const it of items) {
      const b = bucketOf(it.month);
      const prev = acc.get(b) || { revenue: 0, expenses: 0 };
      acc.set(b, { revenue: prev.revenue + it.revenue, expenses: prev.expenses + it.expenses });
    }

    // Sort buckets chronologically when possible (YYYY-MM, YYYY-Qx, YYYY)
    const keys = Array.from(acc.keys());
    const sorted = keys.sort((a, b) => a.localeCompare(b));
    return sorted.map(k => ({ bucket: k, revenue: acc.get(k)!.revenue, expenses: acc.get(k)!.expenses, profit: acc.get(k)!.revenue - acc.get(k)!.expenses }));
  }, [data, groupBy]);

  const monthlyRevenueData = useMemo(() => {
    // Adapt groupedTrends to chart consumption
    return groupedTrends.map(g => ({ month: g.bucket, revenue: includeRevenue ? g.revenue : 0, expenses: includeExpenses ? g.expenses : 0, profit: (includeRevenue ? g.revenue : 0) - (includeExpenses ? g.expenses : 0) }));
  }, [groupedTrends, includeRevenue, includeExpenses]);

  const totalRevenue = includeRevenue ? (data?.totals.totalFees || 0) : 0;
  const totalExpenses = includeExpenses ? (data?.totals.totalApprovedExpenses || 0) : 0;
  const totalProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  const categoryData = useMemo(() => {
    const palette = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
    const byType = data?.totals.totalByType || [];
    return byType.map((t, i) => ({ name: t.type?.toString()?.toUpperCase() || 'OTHER', value: t.amount, color: palette[i % palette.length] }));
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading financial report…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-orange-500" />
            <h3 className="text-lg font-semibold mb-1">Failed to load</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financial Reports</h1>
          <p className="text-muted-foreground">Comprehensive financial analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" onClick={handleGeneratePDF}>
            <FileText className="h-4 w-4 mr-2" />
            Generate PDF
          </Button>
        </div>
      </div>

      {/* Report Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Report Settings</CardTitle>
          <CardDescription>Configure your financial report parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Financial Overview</SelectItem>
                <SelectItem value="revenue">Revenue Analysis</SelectItem>
                <SelectItem value="expenses">Expense Report</SelectItem>
                <SelectItem value="student">Student Analysis</SelectItem>
                <SelectItem value="approvals">Approval Summary</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">1 Month</SelectItem>
                <SelectItem value="3months">3 Months</SelectItem>
                <SelectItem value="6months">6 Months</SelectItem>
                <SelectItem value="1year">1 Year</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            <Select value={currency} onValueChange={(value) => setCurrency(value as "MWK" | "USD")}>
              <SelectTrigger>
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MWK">MWK (MK)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger>
                <SelectValue placeholder="Chart Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="pie">Pie Chart</SelectItem>
                <SelectItem value="area">Area Chart</SelectItem>
              </SelectContent>
            </Select>

            {dateRange === 'custom' && (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !fromDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? format(fromDate, "PPP") : <span>From date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={fromDate}
                      onSelect={setFromDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !toDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {toDate ? format(toDate, "PPP") : <span>To date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={toDate}
                      onSelect={setToDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeRevenue"
                checked={includeRevenue}
                onChange={(e) => setIncludeRevenue(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="includeRevenue" className="text-sm">Include Revenue</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeExpenses"
                checked={includeExpenses}
                onChange={(e) => setIncludeExpenses(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="includeExpenses" className="text-sm">Include Expenses</label>
            </div>

            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Group By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
                <SelectItem value="year">Year</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-green-600" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{currencySymbol}{totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12.5% from last period
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingDown className="h-4 w-4 mr-2 text-red-600" />
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{currencySymbol}{totalExpenses.toLocaleString()}</div>
            <div className="flex items-center text-xs text-red-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +8.2% from last period
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{currencySymbol}{totalProfit.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +15.3% from last period
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profitMargin}%</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +2.1% from last period
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Carry-Forward Balance Section */}
      {termBasedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Term-Based Financial Analysis
              </span>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showCarryForward"
                  checked={showCarryForward}
                  onChange={(e) => setShowCarryForward(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="showCarryForward" className="text-sm">Include Brought Forward</label>
              </div>
            </CardTitle>
            <CardDescription>
              Financial performance by academic terms with cumulative tracking and brought-forward balances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Current Term */}
              {termBasedData.currentTerm && (
                <div>
                  <h4 className="text-lg font-semibold mb-3">Current Term Performance</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-blue-200">
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Term</div>
                        <div className="font-semibold">{termBasedData.currentTerm.termName}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(termBasedData.currentTerm.startDate).toLocaleDateString()} - {new Date(termBasedData.currentTerm.endDate).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-green-200">
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Revenue</div>
                        <div className="text-lg font-bold text-green-600">{currencySymbol}{termBasedData.currentTerm.revenue.toLocaleString()}</div>
                      </CardContent>
                    </Card>
                    <Card className="border-red-200">
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Expenses</div>
                        <div className="text-lg font-bold text-red-600">{currencySymbol}{termBasedData.currentTerm.expenses.toLocaleString()}</div>
                      </CardContent>
                    </Card>
                    <Card className="border-blue-200">
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Profit</div>
                        <div className={`text-lg font-bold ${termBasedData.currentTerm.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {currencySymbol}{termBasedData.currentTerm.profit.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {termBasedData.currentTerm.profitMargin.toFixed(1)}% margin
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Cumulative Performance */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Cumulative Performance</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="border-purple-200 bg-purple-50">
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Brought Forward</div>
                      <div className={`text-lg font-bold ${termBasedData.cumulative.broughtForward >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {currencySymbol}{termBasedData.cumulative.broughtForward.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">From previous terms</div>
                    </CardContent>
                  </Card>
                  <Card className="border-green-200">
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Total Revenue</div>
                      <div className="text-lg font-bold text-green-600">{currencySymbol}{termBasedData.cumulative.totalRevenue.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  <Card className="border-red-200">
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Total Expenses</div>
                      <div className="text-lg font-bold text-red-600">{currencySymbol}{termBasedData.cumulative.totalExpenses.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Cumulative Profit</div>
                      <div className={`text-lg font-bold ${termBasedData.cumulative.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {currencySymbol}{termBasedData.cumulative.totalProfit.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {termBasedData.cumulative.totalProfitMargin.toFixed(1)}% margin
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Carry-Forward Balance */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Brought Forward</h4>
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Brought Forward</div>
                        <div className={`text-2xl font-bold ${termBasedData.carryForwardBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {currencySymbol}{termBasedData.carryForwardBalance.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          This balance is brought forward to the next academic term
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Status</div>
                        <Badge variant={termBasedData.carryForwardBalance >= 0 ? "default" : "destructive"}>
                          {termBasedData.carryForwardBalance >= 0 ? "Surplus" : "Deficit"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Previous Terms Summary */}
              {termBasedData.previousTerms.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-3">Previous Terms Summary</h4>
                  <div className="space-y-2">
                    {termBasedData.previousTerms.map((term) => (
                      <Card key={term.termId} className="border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{term.termName}</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(term.startDate).toLocaleDateString()} - {new Date(term.endDate).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-semibold ${term.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {currencySymbol}{term.profit.toLocaleString()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {term.profitMargin.toFixed(1)}% margin
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
            <CardDescription>Monthly comparison over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {(() => {
                switch (chartType) {
                  case 'line':
                    return (
                      <LineChart data={monthlyRevenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => [`${currencySymbol}${Number(value || 0).toLocaleString()}`, '']} />
                        <Legend />
                        {includeRevenue && <Line type="monotone" dataKey="revenue" stroke="#22c55e" name="Revenue" />}
                        {includeExpenses && <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Expenses" />}
                      </LineChart>
                    );
                  case 'area':
                    return (
                      <BarChart data={monthlyRevenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => [`${currencySymbol}${Number(value || 0).toLocaleString()}`, '']} />
                        <Legend />
                        {includeRevenue && <Bar dataKey="revenue" fill="#86efac" name="Revenue" />}
                        {includeExpenses && <Bar dataKey="expenses" fill="#fecaca" name="Expenses" />}
                      </BarChart>
                    );
                  case 'pie':
                    return (
                      <PieChart>
                        <Tooltip formatter={(value: number) => [formatCurrency(Number(value || 0), currency), '']} />
                        <Legend />
                        <Pie
                          dataKey="value"
                          data={[
                            ...(includeRevenue ? [{ name: 'Revenue', value: totalRevenue }] : []),
                            ...(includeExpenses ? [{ name: 'Expenses', value: totalExpenses }] : []),
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        />
                      </PieChart>
                    );
                  case 'bar':
                  default:
                    return (
                      <BarChart data={monthlyRevenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => [formatCurrency(Number(value || 0), currency), '']} />
                        <Legend />
                        {includeRevenue && <Bar dataKey="revenue" fill="#22c55e" name="Revenue" />}
                        {includeExpenses && <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />}
                      </BarChart>
                    );
                }
              })()}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
            <CardDescription>Distribution of revenue sources</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [formatCurrency(Number(value || 0), currency), '']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Profit Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Profit Trend</CardTitle>
          <CardDescription>Monthly profit analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => [formatCurrency(Number(value || 0), currency), 'Profit']} />
              <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Transactions (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Financial Activity</CardTitle>
          <CardDescription>Latest transactions and activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Coming soon: a merged feed of recent payments and approved expenses.</div>
        </CardContent>
      </Card>
    </div>
  );
}