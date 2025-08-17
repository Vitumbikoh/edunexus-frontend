// src/finance/Finance.tsx
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

interface FeePayment {
  id: string;
  studentName: string;
  amount: number;
  paymentDate: string | null;
  paymentType: string;
  paymentMethod: string;
  receiptNumber: string | null;
  status: 'paid' | 'pending' | 'overdue';
  notes: string | null;
}

interface Transaction {
  id: string;
  studentName: string;
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
  status: string; // e.g., paid | pending | overdue | partial
}

export default function Finance() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const isParent = user?.role === 'parent';
  const isAdmin = user?.role === 'admin' || user?.role === 'finance';
  const [searchQuery, setSearchQuery] = useState("");
  const [feePayments, setFeePayments] = useState<FeePayment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [expectedFeesAmount, setExpectedFeesAmount] = useState<number>(0);
  const [academicYears, setAcademicYears] = useState<{ id: string; name: string }[]>([]);
  const [academicYearId, setAcademicYearId] = useState<string | undefined>(undefined);
  const [fetchingExpectation, setFetchingExpectation] = useState(false);
  const [showSetUniformDialog, setShowSetUniformDialog] = useState(false);
  const [uniformAmount, setUniformAmount] = useState<string>("");
  const [uniformAcademicYearId, setUniformAcademicYearId] = useState<string | undefined>(undefined);
  const [savingUniform, setSavingUniform] = useState(false);
  const [generatingExpectations, setGeneratingExpectations] = useState(false);
  const [feeStatuses, setFeeStatuses] = useState<FeeStatusItem[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [statusesError, setStatusesError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<any | null>(null);

  // Fetch current academic year (and optionally list) once
  useEffect(() => {
    const fetchAcademicYear = async () => {
      if (!token) return;
      try {
  const res = await fetch(`${API_CONFIG.BASE_URL}/analytics/current-academic-year`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const id = data?.id || data?.academicYearId || data?.currentAcademicYear?.id;
          const rawName = data?.name || data?.currentAcademicYear?.name;
          const hasRange = (data?.startYear || data?.endYear);
          const rangeName = hasRange ? `${data?.startYear || ''}${hasRange ? '-' : ''}${data?.endYear || ''}` : '';
          const computedName = (rawName && rawName.trim()) || (rangeName && rangeName !== '-' ? rangeName : '') || 'Current Academic Year';
          if (id) {
            setAcademicYearId(id);
            setAcademicYears([{ id, name: computedName }]);
            setUniformAcademicYearId(id);
          }
        }
      } catch (e) {
        // silent fail
      }
    };
    fetchAcademicYear();
  }, [token]);

  // Fetch all academic years list
  useEffect(() => {
    const fetchAllYears = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/settings/academic-years`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.academicYears || []);
          const mapped = list.map((y: any) => {
            const rawName = y.name && y.name.trim();
            const hasRange = (y.startYear || y.endYear);
            const rangeName = hasRange ? `${y.startYear || ''}${hasRange ? '-' : ''}${y.endYear || ''}` : '';
            let name = rawName || (rangeName && rangeName !== '-' ? rangeName : '') || 'Academic Year';
            // If backend accidentally gives just '-' treat as unknown
            if (name === '-') name = 'Academic Year';
            return {
              id: y.id || y.academicYearId || y.uuid,
              name,
              isCurrent: y.isCurrent || y.current || false
            };
          }).filter((y: any) => y.id);
          // Sort: current first, then by name descending (assuming newer years later)
          mapped.sort((a: any, b: any) => {
            if (a.isCurrent && !b.isCurrent) return -1;
            if (!a.isCurrent && b.isCurrent) return 1;
            return (b.name || '').localeCompare(a.name || '');
          });
          if (mapped.length) {
            setAcademicYears(mapped.map(({id, name}: any) => ({id, name})));
            if (!academicYearId) {
              setAcademicYearId(mapped[0].id);
              setUniformAcademicYearId(mapped[0].id);
            }
          }
        }
      } catch (e) {
        // ignore
      }
    };
    fetchAllYears();
  }, [token]);

  // Fetch expected fees summary when academic year changes
  useEffect(() => {
    const fetchExpectedFees = async () => {
      if (!token || !academicYearId) return;
      try {
        setFetchingExpectation(true);
        // Attempt summary endpoint (assumed). If it fails, ignore.
  const res = await fetch(`${API_CONFIG.BASE_URL}/finance/fee-expectations/summary?academicYearId=${academicYearId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSummaryData(data);
          const total = data?.totalExpectedFees || data?.expectedFeesAmount || data?.total || 0;
          setExpectedFeesAmount(Number(total));
          if (data?.totalPaidFees && !isNaN(Number(data.totalPaidFees))) {
            // Optionally could override paidAmount but we still compute from payments fetch; keep in summary.
          }
        }
      } catch (e) {
        // ignore errors (feature may not exist yet)
      } finally {
        setFetchingExpectation(false);
      }
    };
    fetchExpectedFees();
  }, [token, academicYearId]);

  // Fetch per-student fee statuses for the academic year
  useEffect(() => {
    const fetchStatuses = async () => {
      if (!token || !academicYearId) return;
      try {
        setLoadingStatuses(true);
        setStatusesError(null);
        const res = await fetch(`${API_CONFIG.BASE_URL}/finance/fee-expectations/statuses?academicYearId=${academicYearId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          throw new Error('Failed to fetch fee statuses');
        }
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.statuses || data.items || []);
        const mapped: FeeStatusItem[] = list.map((s: any) => ({
          studentId: s.studentId || s.id,
          studentName: s.studentName || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unknown',
          expectedAmount: Number(s.expectedAmount || s.expectedFee || s.expected || 0),
          paidAmount: Number(s.paidAmount || s.paid || 0),
          outstandingAmount: Number(s.outstandingAmount || s.outstanding || Math.max((s.expectedAmount || 0) - (s.paidAmount || 0), 0)),
          status: (s.status || (Number(s.outstandingAmount || 0) === 0 ? 'paid' : 'pending')).toLowerCase(),
        }));
        setFeeStatuses(mapped);
        // If summary endpoint not available, derive expected total
        if (!summaryData && mapped.length) {
          const derivedExpected = mapped.reduce((sum, i) => sum + i.expectedAmount, 0);
          setExpectedFeesAmount(derivedExpected);
        }
      } catch (e) {
        setStatusesError(e instanceof Error ? e.message : 'Failed to load statuses');
        setFeeStatuses([]);
      } finally {
        setLoadingStatuses(false);
      }
    };
    fetchStatuses();
  }, [token, academicYearId, summaryData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setApiError(null);

        if (!token) {
          throw new Error("Authentication token not found. Please log in again.");
        }

        const paymentsEndpoint = isParent
          ? `${API_CONFIG.BASE_URL}/finance/parent-payments`
          : `${API_CONFIG.BASE_URL}/finance/fee-payments`;

        const yearParam = academicYearId ? `&academicYearId=${academicYearId}` : '';
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
          const errorData = await paymentsResponse.json();
          throw new Error(errorData.message || "Failed to fetch fee payments");
        }

        if (!transactionsResponse.ok) {
          const errorData = await transactionsResponse.json();
          throw new Error(errorData.message || "Failed to fetch transactions");
        }

        const paymentsData = await paymentsResponse.json();
        const transactionsData = await transactionsResponse.json();

        const mappedPayments: FeePayment[] = paymentsData.payments.map((p: any) => ({
          id: p.id,
          studentName: p.studentName,
          amount: Number(p.amount),
          paymentDate: p.paymentDate,
          paymentType: p.paymentType,
          paymentMethod: p.paymentMethod,
          receiptNumber: p.receiptNumber,
          status: p.status,
          notes: p.notes,
        }));

        const mappedTransactions: Transaction[] = transactionsData.transactions.map((t: any) => ({
          id: t.id,
          studentName: t.studentName,
          amount: Number(t.amount),
          paymentDate: t.paymentDate,
          paymentType: t.paymentType,
          paymentMethod: t.paymentMethod,
          receiptNumber: t.receiptNumber,
          processedByName: t.processedByName,
        }));

        setFeePayments(mappedPayments);
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
  }, [token, navigate, toast, searchQuery, isParent, academicYearId]);

  const saveUniformFeeExpectation = async () => {
    if (!token || !uniformAmount) return;
    try {
      setSavingUniform(true);
      const body: any = { amount: Number(uniformAmount) };
  body.academicYearId = uniformAcademicYearId || academicYearId;
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
        throw new Error(err.message || 'Failed to set uniform fee expectation');
      }
      // Update expected fees amount (assume backend returns summary)
      const data = await res.json().catch(() => ({}));
      const newTotal = data?.totalExpectedFees || data?.expectedFeesAmount || body.amount;
      setExpectedFeesAmount(Number(newTotal));
      // Refresh statuses & summary after setting uniform fee
      setSummaryData(null); // trigger re-fetch cascade via effects
      toast({ title: 'Success', description: 'Uniform fee expectation saved.' });
      setShowSetUniformDialog(false);
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to save expectation', variant: 'destructive' });
    } finally {
      setSavingUniform(false);
    }
  };

  const generateExpectations = async () => {
    if (!token || !academicYearId) return;
    try {
      setGeneratingExpectations(true);
      const res = await fetch(`${API_CONFIG.BASE_URL}/finance/fee-expectations/generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ academicYearId, overwrite: true })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to generate expectations');
      }
      toast({ title: 'Success', description: 'Fee expectations generated.' });
      // Re-fetch summary & statuses
      setSummaryData(null);
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Generation failed', variant: 'destructive' });
    } finally {
      setGeneratingExpectations(false);
    }
  };

  const totalFeesAmount = feePayments.reduce((sum, invoice) => sum + invoice.amount, 0); // historical actual total
  const paidAmount = feePayments
    .filter(invoice => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  // Pending now represents remaining expected not yet paid
  // If we have feeStatuses use them to derive paid & expected & pending for higher accuracy
  const statusDerivedPaid = feeStatuses.reduce((sum, s) => sum + s.paidAmount, 0);
  const statusDerivedExpected = feeStatuses.reduce((sum, s) => sum + s.expectedAmount, 0);
  const effectivePaid = feeStatuses.length ? statusDerivedPaid : paidAmount;
  const effectiveExpected = feeStatuses.length ? statusDerivedExpected : expectedFeesAmount;
  const pendingRemaining = effectiveExpected > 0 ? Math.max(effectiveExpected - effectivePaid, 0) : expectedFeesAmount > 0 ? Math.max(expectedFeesAmount - paidAmount, 0) : feePayments
    .filter(invoice => invoice.status === "pending")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const overdueAmount = feePayments
    .filter(invoice => invoice.status === "overdue")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const paidPercentage = effectiveExpected > 0 ? Math.round((effectivePaid / effectiveExpected) * 100) : 0;

  const filteredInvoices = feePayments.filter(payment =>
    payment.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.paymentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.receiptNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTransactions = transactions.filter(transaction =>
    transaction.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.paymentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.receiptNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance</h1>
          <p className="text-muted-foreground">
            {isParent ? "Manage your children's fee payments" : "Manage school finances and fee payments"}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:mt-0">
          <div className="flex items-center gap-2">
            <Label htmlFor="academicYear" className="text-xs">Academic Year</Label>
            <select
              id="academicYear"
              className="border rounded-md h-9 px-2 bg-background text-sm"
              value={academicYearId || ''}
              onChange={(e) => setAcademicYearId(e.target.value || undefined)}
            >
              {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Dialog open={showSetUniformDialog} onOpenChange={setShowSetUniformDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">Set Uniform Fee</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Set Uniform Fee Expectation</DialogTitle>
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
                      <Label htmlFor="uniformYear">Academic Year</Label>
                      <select
                        id="uniformYear"
                        className="w-full border rounded-md h-9 px-2 bg-background"
                        value={uniformAcademicYearId || academicYearId || ''}
                        onChange={e => setUniformAcademicYearId(e.target.value || undefined)}
                      >
                        {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                      </select>
                    </div>
                    <p className="text-xs text-muted-foreground">Sets a uniform expected fee for all enrolled students in the selected academic year.</p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowSetUniformDialog(false)} disabled={savingUniform}>Cancel</Button>
                    <Button onClick={saveUniformFeeExpectation} disabled={!uniformAmount || savingUniform}>
                      {savingUniform ? 'Saving...' : 'Save'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Fees Paid</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${effectivePaid.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">For {isParent ? 'all children' : 'all students'}</p>
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
                  {fetchingExpectation && <p className="text-[10px] text-muted-foreground">Updating expectation...</p>}
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
                <p className="text-xs text-muted-foreground">For the remaining students</p>
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
                  Past due payments
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="invoices">
            <TabsList>
              <TabsTrigger value="invoices">Fee Invoices</TabsTrigger>
              <TabsTrigger value="transactions">Transaction History</TabsTrigger>
              <TabsTrigger value="statuses">Fee Statuses</TabsTrigger>
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
                          <TableCell>{invoice.paymentDate || 'N/A'}</TableCell>
                          <TableCell>{invoice.studentName}</TableCell>
                          <TableCell>{invoice.paymentType}</TableCell>
                          <TableCell className="text-right">${invoice.amount.toFixed(2)}</TableCell>
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
                                <Button size="sm" variant="outline" onClick={() => navigate('/finance/record')}>
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
                          <TableCell>{transaction.paymentDate}</TableCell>
                          <TableCell>{transaction.studentName}</TableCell>
                          <TableCell>{transaction.paymentType}</TableCell>
                          <TableCell className="text-right">${transaction.amount.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{transaction.paymentMethod}</TableCell>
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
                  <div className="flex gap-2 flex-wrap">
                    {isAdmin && (
                      <Button size="sm" variant="outline" onClick={generateExpectations} disabled={generatingExpectations || !academicYearId}>
                        {generatingExpectations ? 'Generating...' : 'Generate Expectations'}
                      </Button>
                    )}
                    {isAdmin && (
                      <Button size="sm" variant="outline" onClick={() => setShowSetUniformDialog(true)}>
                        Set Uniform Fee
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingStatuses ? (
                    <div className="py-6 text-sm text-muted-foreground">Loading statuses...</div>
                  ) : statusesError ? (
                    <div className="py-6 text-sm text-red-600">{statusesError}</div>
                  ) : feeStatuses.length === 0 ? (
                    <div className="py-6 text-sm text-muted-foreground">No fee statuses available.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead className="text-right">Expected</TableHead>
                            <TableHead className="text-right">Paid</TableHead>
                            <TableHead className="text-right">Outstanding</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {feeStatuses.map(s => (
                            <TableRow key={s.studentId}>
                              <TableCell className="font-medium">{s.studentName}</TableCell>
                              <TableCell className="text-right">${s.expectedAmount.toFixed(2)}</TableCell>
                              <TableCell className="text-right">${s.paidAmount.toFixed(2)}</TableCell>
                              <TableCell className="text-right">${s.outstandingAmount.toFixed(2)}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant={s.status === 'paid' ? 'default' : s.status === 'overdue' ? 'destructive' : 'outline'} className="capitalize">{s.status}</Badge>
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