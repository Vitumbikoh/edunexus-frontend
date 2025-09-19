// Updated to use new finance summary & statuses endpoints:
// - /finance/fee-summary
// - /finance/fee-statuses
// Utilizes fields: expectedFees, totalFeesPaid, remainingFees, overdueFees
// Derives fallbacks if summary not available.

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  PlusCircle,
  Download,
  Search,
  ArrowUpRight,
  DollarSign,
  CreditCard,
  Receipt,
  Printer,
  Settings as SettingsIcon
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
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { API_CONFIG } from '@/config/api';

interface Transaction {
  id: string;
  studentName: string;
  studentId?: string;
  amount: number;
  paymentDate: string;
  paymentType: string;
  paymentMethod: string;
  receiptNumber: string | null;
  processedByName: string;
}

interface FeeStatusItem {
  studentId: string;
  studentName: string;
  expectedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: string; // paid | pending | overdue | partial | unpaid
  isOverdue?: boolean;
  overdueAmount?: number;
  humanId?: string;
}

interface FeeSummaryResponse {
  expectedFees?: number;
  totalExpectedFees?: number;
  totalFeesPaid?: number;
  totalPaidFees?: number;
  remainingFees?: number;
  outstandingFees?: number;
  overdueFees?: number;
  overdueStudents?: number;
  termId?: string;
  isPastTerm?: boolean;
  termEndDate?: string;
}

export default function Finance() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const isParent = user?.role === 'parent';
  const isAdmin = user?.role === 'admin' || user?.role === 'finance';

  const [searchQuery, setSearchQuery] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [terms, setTerms] = useState<{ id: string; name: string }[]>([]);
  const [termId, setTermId] = useState<string | undefined>(undefined);

  // Uniform fee expectation dialog state (restored)
  const [showSetUniformDialog, setShowSetUniformDialog] = useState(false);
  const [uniformAmount, setUniformAmount] = useState<string>("");
  const [uniformTermId, setUniformTermId] = useState<string | undefined>(undefined);
  const [savingUniform, setSavingUniform] = useState(false);

  // Invoices (removed - no longer needed)
  
  const [feeStatuses, setFeeStatuses] = useState<FeeStatusItem[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [statusesError, setStatusesError] = useState<string | null>(null);

  const [summaryData, setSummaryData] = useState<FeeSummaryResponse | null>(null);
  const [fetchingSummary, setFetchingSummary] = useState(false);
  const [expectedFeesAmount, setExpectedFeesAmount] = useState<number>(0); // fallback / legacy
  const [statusSearch, setStatusSearch] = useState("");

  // Normalize any backend label like "Period 1" or arbitrary names to a uniform "Term X" display
  const normalizeTermLabel = (name?: string | null, order?: number | null) => {
    const raw = (name || '').toString().trim();
    const num = raw.match(/\d+/)?.[0];
    if (num) return `Term ${num}`;
    if (/period|term/i.test(raw)) {
      return raw.replace(/period/gi, 'Term').replace(/term/gi, 'Term');
    }
    if (typeof order === 'number' && !Number.isNaN(order)) {
      return `Term ${order}`;
    }
    return raw || 'Term';
  };

  // Fetch current term (single)
  useEffect(() => {
    const fetchTerm = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/analytics/current-term`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
            const id = data?.id || data?.termId || data?.currentTerm?.id;
            const rawName = data?.name || data?.currentTerm?.name;
            const computedName = normalizeTermLabel(rawName, data?.order || data?.termNumber || data?.currentTerm?.order);
            if (id) {
              setTermId(id);
              if (!uniformTermId) setUniformTermId(id);
              setTerms(prev => {
                if (prev.find(p => p.id === id)) return prev;
                return [{ id, name: computedName }];
              });
            }
        }
      } catch {
        // silent
      }
    };
    fetchTerm();
  }, [token]);

  // Fetch all terms
  useEffect(() => {
    const fetchAllYears = async () => {
      if (!token) return;
      try {
  const res = await fetch(`${API_CONFIG.BASE_URL}/settings/terms`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.terms || []);
          const mapped = list.map((y: any) => {
            const rawName = (y.name?.trim?.() || y.periodName?.trim?.() || '') as string;
            let name = normalizeTermLabel(rawName, y.order ?? y.termNumber);
            return {
              id: y.id || y.termId || y.uuid,
              name,
              isCurrent: y.isCurrent || y.current || false
            };
          }).filter((y: any) => y.id);
          mapped.sort((a: any, b: any) => {
            if (a.isCurrent && !b.isCurrent) return -1;
            if (!a.isCurrent && b.isCurrent) return 1;
            return (b.name || '').localeCompare(a.name || '');
          });
          if (mapped.length) {
            setTerms(mapped.map(({id, name}: any) => ({id, name})));
            if (!termId) {
              setTermId(mapped[0].id);
              if (!uniformTermId) setUniformTermId(mapped[0].id);
            }
          }
        }
      } catch {
        // ignore
      }
    };
    fetchAllYears();
  }, [token, termId]);

  // Fetch summary (new endpoint)
  useEffect(() => {
    const fetchSummary = async () => {
      if (!token || !termId) return;
      setFetchingSummary(true);
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/finance/fee-summary?termId=${termId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data: FeeSummaryResponse = await res.json();
          setSummaryData(data);
          const totalExpected = Number(
            data.expectedFees ??
            data.totalExpectedFees ??
            0
          );
          setExpectedFeesAmount(totalExpected);
        }
      } catch {
        // fallback via statuses/payments
      } finally {
        setFetchingSummary(false);
      }
    };
    fetchSummary();
  }, [token, termId]);

  // Fetch per-student statuses
  useEffect(() => {
    const fetchStatuses = async () => {
      if (!token || !termId) return;
      try {
        setLoadingStatuses(true);
        setStatusesError(null);
        const res = await fetch(`${API_CONFIG.BASE_URL}/finance/fee-statuses?termId=${termId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch fee statuses');
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.statuses || data.items || data.students || []);
    const mapped: FeeStatusItem[] = list.map((s: any) => {
          const expected = Number(
            s.totalExpected ??
            s.expectedFees ??
            s.expectedAmount ??
            s.expected ??
            0
          );
          const paid = Number(
            s.totalPaid ??
            s.paidAmount ??
            s.paid ??
            0
          );
            const outstanding = Number(
              s.outstanding ??
              s.outstandingAmount ??
              Math.max(expected - paid, 0)
            );
          const isOverdue = Boolean(s.isOverdue || (s.status?.toLowerCase?.() === 'overdue'));
          const computedStatus =
            isOverdue ? 'overdue' :
            (s.status?.toLowerCase?.()) ||
            (outstanding === 0 ? 'paid' : (paid === 0 ? 'unpaid' : 'partial'));
          return {
            studentId: s.studentId || s.id,
            studentName: s.studentName || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unknown',
            expectedAmount: expected,
            paidAmount: paid,
            outstandingAmount: outstanding,
            status: computedStatus,
            isOverdue,
            overdueAmount: isOverdue ? outstanding : 0,
      humanId: s.humanId || s.studentCode || s.student_id || s.studentID || s.student_id_number || undefined,
          };
        });
        setFeeStatuses(mapped);
        // Fallback expected total if summary not present
        if (!summaryData && mapped.length) {
          const derived = mapped.reduce((sum, i) => sum + i.expectedAmount, 0);
          setExpectedFeesAmount(derived);
        }
      } catch (e) {
        setStatusesError(e instanceof Error ? e.message : 'Failed to load statuses');
        setFeeStatuses([]);
      } finally {
        setLoadingStatuses(false);
      }
    };
    fetchStatuses();
  }, [token, termId, summaryData]);

  // Fetch payments & transactions (legacy detail lists)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setApiError(null);
        if (!token) throw new Error("Authentication token not found. Please log in again.");

        const paymentsEndpoint = isParent
          ? `${API_CONFIG.BASE_URL}/finance/parent-payments`
          : `${API_CONFIG.BASE_URL}/finance/fee-payments`;

        const yearParam = termId ? `&termId=${termId}` : '';
        const [paymentsResponse, transactionsResponse] = await Promise.all([
          fetch(`${paymentsEndpoint}?page=1&limit=100&search=${encodeURIComponent(searchQuery)}${yearParam}`, {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(`${API_CONFIG.BASE_URL}/finance/transactions?page=1&limit=100&search=${encodeURIComponent(searchQuery)}${yearParam}`, {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
        ]);

        if (paymentsResponse.status === 401 || transactionsResponse.status === 401) {
          throw new Error("Session expired. Please log in again.");
        }

        if (!paymentsResponse.ok) {
          const errorData = await paymentsResponse.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch fee payments");
        }

        if (!transactionsResponse.ok) {
          const errorData = await transactionsResponse.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch transactions");
        }

        const paymentsData = await paymentsResponse.json();
        const transactionsData = await transactionsResponse.json();

        // Remove fee payments mapping since invoices tab is removed

        const mappedTransactions: Transaction[] = (transactionsData.transactions || transactionsData.items || []).map((t: any) => ({
          id: t.id,
          studentName: t.studentName,
          studentId: t.studentId || t.student_id || t.student_id_number,
          amount: Number(t.amount),
          paymentDate: t.paymentDate,
          paymentType: t.paymentType,
          paymentMethod: t.paymentMethod,
          receiptNumber: t.receiptNumber,
          processedByName: t.processedByName,
        }));

        // Remove fee payments mapping since invoices tab is removed
        setTransactions(mappedTransactions);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch data";
        setApiError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        if (errorMessage.includes("Session expired")) {
          localStorage.removeItem("token");
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token, navigate, toast, searchQuery, isParent, termId]);

  // ---------------- Metrics calculation ----------------
  // Summary preferred, fallback to derived
  const summaryPaid = Number(summaryData?.totalFeesPaid ?? summaryData?.totalPaidFees ?? 0);
  const summaryExpected = Number(summaryData?.expectedFees ?? summaryData?.totalExpectedFees ?? expectedFeesAmount);
  const summaryRemaining = Number(
    summaryData?.remainingFees ??
    summaryData?.outstandingFees ??
    Math.max(summaryExpected - summaryPaid, 0)
  );
  const summaryOverdue = Number(summaryData?.overdueFees ?? 0);

  // Derive from statuses if available (gives precision)
  const statusDerivedPaid = feeStatuses.reduce((sum, s) => sum + s.paidAmount, 0);
  const statusDerivedExpected = feeStatuses.reduce((sum, s) => sum + s.expectedAmount, 0);

  const effectivePaid = feeStatuses.length ? statusDerivedPaid : summaryPaid;
  const effectiveExpected = feeStatuses.length ? statusDerivedExpected : summaryExpected;
  const pendingRemaining = feeStatuses.length
    ? Math.max(statusDerivedExpected - statusDerivedPaid, 0)
    : summaryRemaining;
  const overdueFromStatuses = feeStatuses
    .filter(s => s.status === 'overdue')
    .reduce((sum, s) => sum + (s.outstandingAmount || 0), 0);
  const overdueAmount = summaryOverdue || overdueFromStatuses;

  const paidPercentage = effectiveExpected > 0
    ? Math.round((effectivePaid / effectiveExpected) * 100)
    : 0;

  const filteredFeeStatuses = feeStatuses.filter(s => {
    const q = statusSearch.toLowerCase();
    return s.studentName.toLowerCase().includes(q) || (s.studentId || '').toLowerCase().includes(q);
  });

  // Transaction filtering
  const filteredTransactions = transactions.filter(transaction => {
    const q = searchQuery.toLowerCase();
    return transaction.studentName.toLowerCase().includes(q) || (transaction.studentId || '').toLowerCase().includes(q);
  });

  // Save uniform fee expectation (restored)
  const saveUniformFeeExpectation = async () => {
    if (!token || !uniformAmount) return;
    try {
      setSavingUniform(true);
      const body: any = { amount: Number(uniformAmount) };
      body.termId = uniformTermId || termId;
      const res = await fetch(`${API_CONFIG.BASE_URL}/finance/fee-structure`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to set tuition fee expectation');
      }
      await res.json().catch(() => ({}));
      // Trigger re-fetch summary
      setSummaryData(null);
      toast({ title: 'Success', description: 'Uniform fee expectation saved.' });
      setShowSetUniformDialog(false);
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to save expectation', variant: 'destructive' });
    } finally {
      setSavingUniform(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance</h1>
          <p className="text-muted-foreground">
            {isParent ? "Manage your children's fee payments" : "Manage school finances and fee payments"}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:mt-0">
          <div className="flex items-center gap-2">
            <Label htmlFor="term" className="text-xs">Term</Label>
            <select
              id="term"
              className="border rounded-md h-9 px-2 bg-background text-sm"
              value={termId || ''}
              onChange={(e) => setTermId(e.target.value || undefined)}
            >
              {terms.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Dialog open={showSetUniformDialog} onOpenChange={setShowSetUniformDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">Set Tuition Fee</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Set Tuition Fee Expectation</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="uniformAmount">Amount</Label>
                      <input
                        id="uniformAmount"
                        type="number"
                        className="w-full border rounded-md h-9 px-2 bg-background"
                        value={uniformAmount}
                        onChange={e => setUniformAmount(e.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="uniformYear">Term</Label>
                      <select
                        id="uniformYear"
                        className="w-full border rounded-md h-9 px-2 bg-background"
                        value={uniformTermId || termId || ''}
                        onChange={e => setUniformTermId(e.target.value || undefined)}
                      >
                        {terms.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                      </select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Sets a uniform expected fee for all enrolled students in the selected term.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowSetUniformDialog(false)} disabled={savingUniform}>Cancel</Button>
                    <Button onClick={saveUniformFeeExpectation} disabled={!uniformAmount || savingUniform}>
                      {savingUniform ? 'Saving...' : 'Save'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={() => navigate("/finance/fees")}> 
                <SettingsIcon className="mr-2 h-4 w-4" />
                Manage Fees
              </Button>
              <Button onClick={() => navigate("/finance/record")}> 
                <PlusCircle className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            </div>
          )}
        </div>
      </div>

      {apiError && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {apiError}
        </div>
      )}

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Fees Paid</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${effectivePaid.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {fetchingSummary ? 'Updating...' : `For students that have paid`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expected Fees Amount</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${effectiveExpected.toFixed(2)}</div>
                <div className="mt-2 space-y-1">
                  <Progress value={paidPercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">{paidPercentage}% of total fees</p>
                  {fetchingSummary && <p className="text-[10px] text-muted-foreground">Refreshing summary...</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${pendingRemaining.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Remaining balance</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${overdueAmount.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {summaryData?.overdueStudents
                    ? `${summaryData.overdueStudents} students overdue`
                    : 'Past due payments'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
            <Tabs defaultValue="statuses">
              <TabsList>
                <TabsTrigger value="statuses">Fee Statuses</TabsTrigger>
                <TabsTrigger value="transactions">Transaction History</TabsTrigger>
              </TabsList>

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
                            placeholder="Search student..."
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
                          <TableHead>Txn ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>{isParent ? "Child" : "Student"}</TableHead>
                          <TableHead>Student ID</TableHead>
                          <TableHead>Fee</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Method</TableHead>
                          <TableHead className="text-right">Receipt</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.map(transaction => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">{transaction.id}</TableCell>
                            <TableCell>{transaction.paymentDate}</TableCell>
                            <TableCell>{transaction.studentName}</TableCell>
                            <TableCell>{transaction.studentId || '-'}</TableCell>
                            <TableCell>{transaction.paymentType}</TableCell>
                            <TableCell className="text-right">${transaction.amount.toFixed(2)}</TableCell>
                            <TableCell className="text-right capitalize">{transaction.paymentMethod}</TableCell>
                            <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                      if (!token) return;
                                      try {
                                        const res = await fetch(`${API_CONFIG.BASE_URL}/receipts/${transaction.id}`, {
                                          headers: { Authorization: `Bearer ${token}` }
                                        });
                                        if (!res.ok) {
                                          const text = await res.text();
                                          console.error('Receipt fetch error', text);
                                          return;
                                        }
                                        const blob = await res.blob();
                                        const url = URL.createObjectURL(blob);
                                        window.open(url, '_blank');
                                        setTimeout(() => URL.revokeObjectURL(url), 60_000);
                                      } catch (e) {
                                        console.error('Receipt error', e);
                                      }
                                    }}
                                  >
                                    <Printer className="h-4 w-4" />
                                  </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="statuses" className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle>Fee Statuses</CardTitle>
                      <CardDescription>Per-student expected vs paid amounts</CardDescription>
                    </div>
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search student..."
                        className="pl-8"
                        value={statusSearch}
                        onChange={e => setStatusSearch(e.target.value)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingStatuses ? (
                      <div className="py-6 text-sm text-muted-foreground">Loading statuses...</div>
                    ) : statusesError ? (
                      <div className="py-6 text-sm text-red-600">{statusesError}</div>
                    ) : filteredFeeStatuses.length === 0 ? (
                      <div className="py-6 text-sm text-muted-foreground">No fee statuses available.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Student</TableHead>
                              <TableHead>Student ID</TableHead>
                              <TableHead className="text-right">Expected</TableHead>
                              <TableHead className="text-right">Paid</TableHead>
                              <TableHead className="text-right">Outstanding</TableHead>
                              <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
              {filteredFeeStatuses.map(s => (
                              <TableRow key={s.studentId}>
                                <TableCell className="font-medium">{s.studentName}</TableCell>
                                <TableCell>{s.humanId || s.studentId || '-'}</TableCell>
                                <TableCell className="text-right">${s.expectedAmount.toFixed(2)}</TableCell>
                                <TableCell className="text-right">${s.paidAmount.toFixed(2)}</TableCell>
                                <TableCell className="text-right">${s.outstandingAmount.toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                  <Badge
                                    variant={
                                      s.status === 'paid' ? 'default'
                                        : s.status === 'overdue' ? 'destructive'
                                        : s.status === 'partial' ? 'outline'
                                        : s.status === 'unpaid' ? 'outline'
                                        : 'outline'
                                    }
                                    className="capitalize"
                                  >
                                    {s.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
        </>
      )}
    </div>
  );
}