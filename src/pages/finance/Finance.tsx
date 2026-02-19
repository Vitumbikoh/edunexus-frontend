// Updated to use new finance summary & statuses endpoints:
// - /finance/fee-summary
// - /finance/fee-statuses
// Utilizes fields: expectedFees, totalFeesPaid, remainingFees, overdueFees
// Derives fallbacks if summary not available.

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  PlusCircle,
  Download,
  ArrowUpRight,
  DollarSign,
  CreditCard,
  Receipt,
  Printer,
  Settings as SettingsIcon,
  TrendingUp
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { SearchBar } from "@/components/ui/search-bar";
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
import { academicCalendarService } from '@/services/academicCalendarService';
import { formatCurrency, getDefaultCurrency } from '@/lib/currency';
import { Preloader } from "@/components/ui/preloader";
import { StudentFinancialDetailsModal } from "@/components/StudentFinancialDetailsModal";

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
  forTermId?: string | null;
  forTermNumber?: number | null;
  forAcademicYear?: string | null;
  // Added defensive fields
  processedBy?: string | null;
  notes?: string | null;
  termNumber?: number | null;
  academicYear?: string | null;
  isCreditEntry?: boolean;
}

interface FeeStatusItem {
  studentId: string;
  studentName: string;
  expectedAmount: number;
  paidAmount: number;
  credit?: number;
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

interface ConsolidatedSummaryResponse {
  success: boolean;
  filters: { termId: string; academicCalendarId: string | null };
  labels?: { currentTermFigures: string; outstandingFromPreviousTerms: string };
  summary: { totalFeesPaid: number; expectedFees: number; pending: number; overdue: number };
  statuses: Array<{
    studentId: string;
    humanId?: string;
    studentName: string;
    termId: string;
    totalExpected: number;
    totalPaid: number;
    outstanding: number;
    status: 'paid' | 'partial' | 'unpaid';
    hasHistoricalOverdue: boolean;
    historicalOverdueAmount: number;
  }>;
}

interface EnhancedSummaryResponse {
  termId: string;
  termName: string;
  academicCalendar: string;
  totalStudents: number;
  expectedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueAmount: number;
  paymentPercentage: number;
  totalCarryForwardAmount: number;
  termEndDate: string;
}

interface TermTotalsResponse {
  totalCollected: number;
  totalPaid: number;
  pending: number;
  overdue: number;
  overdueFromPreviousTerms: number;
  credits: number;
  /** Raw cash physically collected in the selected term (from payments table) */
  actualRevenue: number;
  /** Portion of collected cash applied to THIS term's expected fees (allocation-based) */
  termFeesApplied: number;
  allocatedToPreviousTerms: number;
  allocatedToFutureTerms: number;
}

export default function Finance() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const isParent = user?.role === 'parent';
  const isAdmin = user?.role === 'admin' || user?.role === 'finance';

  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [terms, setTerms] = useState<{ id: string; name: string }[]>([]);
  const [termId, setTermId] = useState<string | undefined>(undefined);
  const [academicCalendarId, setAcademicCalendarId] = useState<string | undefined>(undefined);
  const [academicCalendars, setAcademicCalendars] = useState<Array<{ id?: string; term?: string; name?: string }>>([]);

  // Uniform fee expectation dialog state (restored)
  const [showSetUniformDialog, setShowSetUniformDialog] = useState(false);
  const [uniformAmount, setUniformAmount] = useState<string>("");
  const [uniformTermId, setUniformTermId] = useState<string | undefined>(undefined);
  const [savingUniform, setSavingUniform] = useState(false);

  // Invoices (removed - no longer needed)
  
  const [feeStatuses, setFeeStatuses] = useState<FeeStatusItem[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [statusesError, setStatusesError] = useState<string | null>(null);

  // Student Financial Details Modal
  const [showFinancialDetailsModal, setShowFinancialDetailsModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string | null>(null);

  const [summaryData, setSummaryData] = useState<FeeSummaryResponse | null>(null);
  const [consolidatedSummary, setConsolidatedSummary] = useState<ConsolidatedSummaryResponse | null>(null);
  const [fetchingSummary, setFetchingSummary] = useState(false);
  const [expectedFeesAmount, setExpectedFeesAmount] = useState<number>(0); // fallback / legacy
  const [currentTermOverpayments, setCurrentTermOverpayments] = useState<number>(0); // overpayments from backend
  const [termTotals, setTermTotals] = useState<TermTotalsResponse | null>(null);
  const [statusSearch, setStatusSearch] = useState("");
  const [statusInput, setStatusInput] = useState("");
  const [activeTab, setActiveTab] = useState<'statuses' | 'transactions'>('statuses');
  const [isFetchingTransactions, setIsFetchingTransactions] = useState(false);
  const firstLoadRef = useRef(true);
  const prevTermIdRef = useRef<string | undefined>(undefined);

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
            // also try to set active academic calendar if present in response
            const calId = data?.academicCalendarId || data?.currentTerm?.academicCalendarId || data?.academicCalendar?.id;
            if (calId) setAcademicCalendarId(calId);
        }
      } catch {
        // silent
      }
    };
    fetchTerm();
  }, [token]);

  // Fetch active academic calendar (fallback if current-term did not include it)
  useEffect(() => {
    const fetchActiveCalendar = async () => {
      if (!token) return;
      try {
        const cal = await academicCalendarService.getActiveAcademicCalendar(token);
        if (cal && cal.id) setAcademicCalendarId(cal.id);
      } catch {}
    };
    fetchActiveCalendar();
  }, [token]);

  // Fetch all terms
  useEffect(() => {
    const fetchAllYears = async () => {
      if (!token) return;
      try {
  const termsUrl = academicCalendarId
            ? `${API_CONFIG.BASE_URL}/settings/terms?academicCalendarId=${encodeURIComponent(academicCalendarId)}`
            : `${API_CONFIG.BASE_URL}/settings/terms`;
  const res = await fetch(termsUrl, {
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
            if (!termId || !mapped.find(m => m.id === termId)) {
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
  }, [token, termId, academicCalendarId]);

  // Load academic calendars list
  useEffect(() => {
    const loadCalendars = async () => {
      if (!token) return;
      try {
        const cals = await academicCalendarService.getAcademicCalendars(token);
        setAcademicCalendars(cals || []);
      } catch {}
    };
    loadCalendars();
  }, [token]);

  // Fetch current term overpayments
  useEffect(() => {
    const fetchOverpayments = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/finance/total-finances`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentTermOverpayments(Number(data.currentTermOverpayments || 0));
        }
      } catch (error) {
        console.error('Failed to fetch overpayments:', error);
        setCurrentTermOverpayments(0);
      }
    };
    fetchOverpayments();
  }, [token, termId]);

  // Fetch term aggregated totals (collected, allocations, pending, credits, overdue)
  useEffect(() => {
    const fetchTermTotals = async () => {
      if (!token || !termId) return;
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/finance/v2/term-totals?termId=${termId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTermTotals({
            totalCollected: Number(data.totalCollected || 0),
            totalPaid: Number(data.totalPaid || 0),
            pending: Number(data.pending || 0),
            overdue: Number(data.overdue || 0),
            overdueFromPreviousTerms: Number(data.overdueFromPreviousTerms || 0),
            credits: Number(data.credits || 0),
            actualRevenue: Number(data.actualRevenue || 0),
            termFeesApplied: Number(data.termFeesApplied ?? data.actualRevenue ?? 0),
            allocatedToPreviousTerms: Number(data.allocatedToPreviousTerms || 0),
            allocatedToFutureTerms: Number(data.allocatedToFutureTerms || 0),
          });
        } else {
          setTermTotals(null);
        }
      } catch (e) {
        console.error('Failed to fetch term totals', e);
        setTermTotals(null);
      }
    };
    fetchTermTotals();
  }, [token, termId]);

  // Fetch summary (new endpoint) - prevent race conditions
  useEffect(() => {
    const fetchSummary = async () => {
      if (!token || !termId || fetchingSummary) return;
      setFetchingSummary(true);
      try {
        const calParam = academicCalendarId ? `&academicCalendarId=${academicCalendarId}` : '';
        // Consolidated summary strictly scoped by calendar + term
        // Clear previous data to prevent stale states
        setConsolidatedSummary(null);
        setSummaryData(null);
        setApiError(null);
        
        // Use enhanced API endpoints that provide consistent calculations
        const enhancedRes = await fetch(`${API_CONFIG.BASE_URL}/finance/v2/summary?termId=${termId}${calParam}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (enhancedRes.ok) {
          const enhancedData: EnhancedSummaryResponse = await enhancedRes.json();
          const cs: ConsolidatedSummaryResponse = {
            success: true,
            filters: { termId, academicCalendarId },
            labels: {
              currentTermFigures: enhancedData.termName || 'Current Term Figures',
              outstandingFromPreviousTerms: 'Outstanding From Previous Terms'
            },
            summary: {
              totalFeesPaid: Number(enhancedData.paidAmount || 0),
              expectedFees: Number(enhancedData.expectedAmount || 0),
              pending: Number(enhancedData.outstandingAmount || 0),
              overdue: Number(enhancedData.overdueAmount || 0),
            },
            statuses: []
          };

          setConsolidatedSummary(cs);
          setSummaryData({
            expectedFees: Number(enhancedData.expectedAmount || 0),
            totalFeesPaid: Number(enhancedData.paidAmount || 0),
            remainingFees: Number(enhancedData.outstandingAmount || 0),
            overdueFees: Number(enhancedData.overdueAmount || 0),
            termId: enhancedData.termId,
            termEndDate: enhancedData.termEndDate,
          });
          setExpectedFeesAmount(Number(enhancedData.expectedAmount || 0));
          console.log('Enhanced API summary loaded:', {
            expectedFees: enhancedData.expectedAmount,
            totalPaid: enhancedData.paidAmount,
            totalStudents: enhancedData.totalStudents,
          });
        } else {
          console.warn('⚠️ Enhanced API failed, trying legacy:', enhancedRes.status);
          
          // Fallback to original consolidated endpoint only if enhanced fails
          const consolidatedRes = await fetch(`${API_CONFIG.BASE_URL}/finance/summary?termId=${termId}${calParam}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (consolidatedRes.ok) {
            const cs: ConsolidatedSummaryResponse = await consolidatedRes.json();
            setConsolidatedSummary(cs);
            setExpectedFeesAmount(Number(cs?.summary?.expectedFees || 0));
            console.log('📊 Legacy consolidated summary loaded:', { expectedFees: cs?.summary?.expectedFees, totalStudents: cs?.statuses?.length });
          }
        }
      } catch (error) {
        console.error('❌ Error fetching finance summary:', error);
        setApiError(error instanceof Error ? error.message : 'Failed to fetch finance data');
        // Clear potentially inconsistent state
        setConsolidatedSummary(null);
        setSummaryData(null);
        setExpectedFeesAmount(0);
      } finally {
        setFetchingSummary(false);
      }
    };
    fetchSummary();
  }, [token, termId, academicCalendarId]);

  // Fetch per-student statuses
  useEffect(() => {
    const fetchStatuses = async () => {
      if (!token || !termId) return;
      try {
        setLoadingStatuses(true);
        setStatusesError(null);
        const calParam = academicCalendarId ? `&academicCalendarId=${academicCalendarId}` : '';
        // Prefer consolidated statuses if present
        let list: any[] = consolidatedSummary?.statuses || [];
        if (!list.length) {
          const res = await fetch(`${API_CONFIG.BASE_URL}/finance/fee-statuses?termId=${termId}${calParam}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!res.ok) throw new Error('Failed to fetch fee statuses');
          const data = await res.json();
          list = Array.isArray(data) ? data : (data.statuses || data.items || data.students || []);
        }
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
          const creditVal = Number(
            s.credit ?? s.credits ?? s.creditBalance ?? s.credit_balance ?? s.carryForward ?? s.totalCarryForwardAmount ?? 0
          );
            const outstanding = Number(
              s.outstanding ??
              s.outstandingAmount ??
              Math.max(expected - paid, 0)
            );
          const isOverdue = Boolean((s as any).hasHistoricalOverdue || s.isOverdue || Number((s as any).historicalOverdueAmount || 0) > 0);
          const overdueAmt = Number((s as any).historicalOverdueAmount ?? s.overdueAmount ?? s.pastDue ?? 0);
          const computedStatus =
            isOverdue ? 'overdue' :
            (s.status?.toLowerCase?.()) ||
            (outstanding === 0 ? 'paid' : (paid === 0 ? 'unpaid' : 'partial'));
          return {
            studentId: s.studentId || s.id,
            studentName: s.studentName || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unknown',
            expectedAmount: expected,
            paidAmount: paid,
            credit: creditVal,
            outstandingAmount: outstanding,
            status: computedStatus,
            isOverdue,
            overdueAmount: overdueAmt,
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
  }, [token, termId, summaryData, consolidatedSummary, academicCalendarId]);

  // Fetch transactions; avoid full page loading on search input to keep cursor focus
  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      // Require a selected term to prevent fetching wrong-term transactions
      if (!token || !termId) return;
      try {
        setApiError(null);

        const isTermChanged = prevTermIdRef.current !== termId;
        const isFirst = firstLoadRef.current;
        if (isFirst || isTermChanged) {
          setIsLoading(true);
        } else {
          setIsFetchingTransactions(true);
        }

        const yearParam = termId ? `&termId=${termId}` : '';
        const calParam = academicCalendarId ? `&academicCalendarId=${academicCalendarId}` : '';
        const res = await fetch(
          `${API_CONFIG.BASE_URL}/finance/transactions?page=1&limit=500${yearParam}${calParam}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          }
        );

        if (res.status === 401) {
          throw new Error("Session expired. Please log in again.");
        }
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch transactions");
        }
        const data = await res.json();

        const mappedTransactions: Transaction[] = (data.transactions || data.items || []).map((t: any) => ({
          id: t.id,
          studentName: t.studentName,
          studentId: t.studentId || t.student_id || t.student_id_number,
          amount: Number(t.amount),
          paymentDate: t.paymentDate,
          paymentType: t.paymentType,
          paymentMethod: t.paymentMethod,
          receiptNumber: t.receiptNumber,
          processedByName: t.processedByName || t.processedBy || t.processed_by_name || t.processedByName || null,
          forTermId: t.forTermId || t.for_term_id || null,
          forTermNumber: t.forTermNumber || t.for_term_number || null,
          forAcademicYear: t.forAcademicYear || t.for_academic_year || null,
          processedBy: t.processedBy || t.processedByName || t.processed_by || t.processed_by_name || null,
          notes: t.notes || t.notesText || t.description || t.details || null,
          termNumber: t.termNumber || t.term_number || t.term?.order || null,
          academicYear: t.academicYear || t.academic_year || t.term?.academicYear || t.term?.academic_year || null,
          isCreditEntry: Boolean(t.isCredit || (t.paymentType && String(t.paymentType).toLowerCase().includes('credit')) || t.isCreditEntry),
        }));
        setTransactions(mappedTransactions);
      } catch (error) {
        if ((error as any)?.name === 'AbortError') return;
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch data";
        setApiError(errorMessage);
        toast({ title: "Error", description: errorMessage, variant: "destructive" });
        if (errorMessage.includes("Session expired")) {
          localStorage.removeItem("token");
          navigate('/login');
        }
      } finally {
        const isTermChanged = prevTermIdRef.current !== termId;
        if (firstLoadRef.current || isTermChanged) {
          setIsLoading(false);
          firstLoadRef.current = false;
          prevTermIdRef.current = termId;
        } else {
          setIsFetchingTransactions(false);
        }
      }
    };

    run();
    return () => controller.abort();
  }, [token, navigate, toast, termId, academicCalendarId]);

  // ---------------- Metrics calculation ----------------
  // Summary preferred, fallback to derived
  const consolidatedPaid = Number(consolidatedSummary?.summary?.totalFeesPaid ?? 0);
  const consolidatedExpected = Number(consolidatedSummary?.summary?.expectedFees ?? expectedFeesAmount);
  const consolidatedPending = Number(consolidatedSummary?.summary?.pending ?? Math.max(consolidatedExpected - consolidatedPaid, 0));
  const consolidatedOverdue = Number(consolidatedSummary?.summary?.overdue ?? 0);
  const summaryPaid = Number(summaryData?.totalFeesPaid ?? summaryData?.totalPaidFees ?? consolidatedPaid);
  const summaryExpected = Number(summaryData?.expectedFees ?? summaryData?.totalExpectedFees ?? consolidatedExpected);
  const summaryRemaining = Number(
    summaryData?.remainingFees ?? summaryData?.outstandingFees ?? consolidatedPending
  );
  const summaryOverdue = Number(summaryData?.overdueTotal ?? summaryData?.overdueFees ?? consolidatedOverdue);

  // Derive from statuses if available (gives precision)
  const statusDerivedPaid = feeStatuses.reduce((sum, s) => sum + s.paidAmount, 0);
  const statusDerivedExpected = feeStatuses.reduce((sum, s) => sum + s.expectedAmount, 0);

  // termFeesApplied = allocations to current term's expected fees (what was paid toward this term)
  const termFeesApplied = Number(termTotals?.termFeesApplied ?? termTotals?.actualRevenue ?? (feeStatuses.length ? statusDerivedPaid : summaryPaid));
  const effectivePaid = termFeesApplied; // governs Pending calculation
  const effectiveExpected = feeStatuses.length ? statusDerivedExpected : summaryExpected;
  
  // Pending = Expected fees - what has been applied to current term fees
  const pendingRemaining = effectiveExpected - effectivePaid;
  const overdueFromStatuses = feeStatuses
    .filter(s => s.status === 'overdue')
    .reduce((sum, s) => sum + (s.outstandingAmount || 0), 0);
  const overdueAmount = Number((termTotals?.overdueFromPreviousTerms ?? summaryOverdue) || overdueFromStatuses);
  // actualRevenue = raw cash physically collected in the selected term (from payments table)
  const termActualRevenue = Number(termTotals?.actualRevenue ?? termTotals?.totalCollected ?? transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0));
  const totalCollected = termActualRevenue;
  const creditBalanceForTerm = Number(termTotals?.credits ?? currentTermOverpayments);
  const allocatedToPreviousTerms = Number(termTotals?.allocatedToPreviousTerms || 0);
  const allocatedToFutureTerms = Number(termTotals?.allocatedToFutureTerms || 0);

  const paidPercentage = effectiveExpected > 0
    ? Math.round((effectivePaid / effectiveExpected) * 100)
    : 0;

  const filteredFeeStatuses = feeStatuses.filter(s => {
    const q = statusSearch.toLowerCase();
    const idMatch = String(s.studentId || '').toLowerCase().includes(q);
    const humanIdMatch = String(s.humanId || '').toLowerCase().includes(q);
    return s.studentName.toLowerCase().includes(q) || idMatch || humanIdMatch;
  });

  // Transaction filtering
  const filteredTransactions = transactions.filter(transaction => {
    const q = searchQuery.toLowerCase();
    return transaction.studentName.toLowerCase().includes(q) || (transaction.studentId || '').toLowerCase().includes(q);
  });

  // Prefill uniform tuition amount from existing fee structure for selected term
  const prefillUniformFromExisting = async (forTermId?: string) => {
    if (!token) return;
    const targetTermId = forTermId || uniformTermId || termId;
    if (!targetTermId) return;
    try {
      let calParam = '';
      try {
        const cal = await academicCalendarService.getActiveAcademicCalendar(token!);
        if (cal?.id) calParam = `&academicCalendarId=${encodeURIComponent(cal.id)}`;
      } catch {}
      const res = await fetch(`${API_CONFIG.BASE_URL}/finance/fee-structure?termId=${encodeURIComponent(targetTermId)}${calParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const items = await res.json();
      if (Array.isArray(items)) {
        const tuition = items.find((i: any) => (i.feeType?.toLowerCase() === 'tuition') && (i.isActive !== false));
        if (tuition && typeof tuition.amount !== 'undefined') {
          setUniformAmount(String(tuition.amount));
        }
      }
    } catch {}
  };

  useEffect(() => {
    if (showSetUniformDialog) {
      prefillUniformFromExisting();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSetUniformDialog]);

  // Save uniform fee expectation (restored)
  const saveUniformFeeExpectation = async () => {
    if (!token || !uniformAmount) return;
    try {
      setSavingUniform(true);
      const body: any = { amount: Number(uniformAmount) };
      body.termId = uniformTermId || termId;
      // include active academicCalendarId
      try {
        const cal = await academicCalendarService.getActiveAcademicCalendar(token!);
        if (cal?.id) body.academicCalendarId = cal.id;
      } catch {}
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
            <Label htmlFor="academicCalendar" className="text-xs">Calendar</Label>
            <select
              id="academicCalendar"
              className="border rounded-md h-9 px-2 bg-background text-sm"
              value={academicCalendarId || ''}
              onChange={async (e) => {
                const v = e.target.value || undefined;
                setAcademicCalendarId(v);
                // Persist active calendar if possible
                if (v && token) {
                  try {
                    await academicCalendarService.setActiveAcademicCalendar(v, token);
                  } catch {}
                }
                // Clear selected term to allow terms for this calendar to load
                setTermId(undefined);
                setSummaryData(null);
                setFeeStatuses([]);
              }}
            >
              <option value="">All calendars</option>
              {academicCalendars.map(c => (
                <option key={c.id} value={c.id}>{c.term || c.name || c.id}</option>
              ))}
            </select>

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
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">MWK</span>
                        <input
                          id="uniformAmount"
                          type="number"
                          className="w-full border rounded-md h-9 px-2 bg-background"
                          value={uniformAmount}
                          onChange={e => setUniformAmount(e.target.value)}
                          placeholder="Enter amount"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="uniformYear">Term</Label>
                      <select
                        id="uniformYear"
                        className="w-full border rounded-md h-9 px-2 bg-background"
                        value={uniformTermId || termId || ''}
                        onChange={e => { const v = e.target.value || undefined; setUniformTermId(v); prefillUniformFromExisting(v); }}
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
        <div className="space-y-6">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
            <Preloader variant="skeleton" rows={1} className="h-24" />
            <Preloader variant="skeleton" rows={1} className="h-24" />
            <Preloader variant="skeleton" rows={1} className="h-24" />
            <Preloader variant="skeleton" rows={1} className="h-24" />
            <Preloader variant="skeleton" rows={1} className="h-24" />
          </div>
          <Preloader variant="skeleton" rows={4} className="space-y-6" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3 pb-1">
                <CardTitle className="text-sm font-medium">Total Fees Paid</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-1">
                <div className="text-xl font-bold">{formatCurrency(termFeesApplied, getDefaultCurrency())}</div>
                <p className="text-xs text-muted-foreground">
                  Applied to selected term fees
                </p>
                {termFeesApplied === 0 && (
                  <p className="text-xs text-muted-foreground">MK 0.00 — No payments applied this term</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3 pb-1">
                <CardTitle className="text-sm font-medium">Expected Fees Amount</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-1">
                <div className="text-xl font-bold">{formatCurrency(effectiveExpected, getDefaultCurrency())}</div>
                <div className="mt-2 space-y-1">
                  <Progress value={paidPercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">{paidPercentage}% of total fees</p>
                  {fetchingSummary && <p className="text-[10px] text-muted-foreground">Refreshing summary...</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3 pb-1">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-1">
                <div className="text-xl font-bold">{formatCurrency(pendingRemaining, getDefaultCurrency())}</div>
                <p className="text-xs text-muted-foreground">Remaining balance</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3 pb-1">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-1">
                <div className="text-xl font-bold">{formatCurrency(overdueAmount, getDefaultCurrency())}</div>
                <p className="text-xs text-muted-foreground">Outstanding Across All Terms</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3 pb-1">
                <CardTitle className="text-sm font-medium">Overpayments</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-1">
                <div className="text-xl font-bold">{formatCurrency(creditBalanceForTerm, getDefaultCurrency())}</div>
                <p className="text-xs text-muted-foreground">Credits / Unallocated from payments</p>
                {(allocatedToPreviousTerms > 0 || allocatedToFutureTerms > 0) && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Sorted: {formatCurrency(allocatedToPreviousTerms, getDefaultCurrency())} previous, {formatCurrency(allocatedToFutureTerms, getDefaultCurrency())} next terms
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Actual Revenue = raw cash collected in the selected term */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3 pb-1">
                <CardTitle className="text-sm font-medium">Actual Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-1">
                <div className="text-xl font-bold">{formatCurrency(termActualRevenue, getDefaultCurrency())}</div>
                <p className="text-xs text-muted-foreground">Cash collected in selected term</p>
                {termActualRevenue === 0 && (
                  <p className="text-xs text-muted-foreground">MK 0.00 — No payments recorded this term</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v)=>setActiveTab(v as 'statuses'|'transactions')}>
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
                        <SearchBar
                          value={searchInput}
                          onChange={setSearchInput}
                          onDebouncedChange={setSearchQuery}
                          delay={300}
                          placeholder="Search student..."
                          inputClassName="w-[200px] md:w-[300px]"
                        />
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
                          <TableHead>For Term</TableHead>
                          <TableHead>Term</TableHead>
                          <TableHead>Processed By</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.map(transaction => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">{transaction.id}</TableCell>
                            <TableCell>{transaction.paymentDate ? new Date(transaction.paymentDate).toISOString().slice(0,10).replace(/-/g,'/') : '-'}</TableCell>
                            <TableCell>{transaction.studentName}</TableCell>
                            <TableCell>{transaction.studentId || '-'}</TableCell>
                            <TableCell>{transaction.paymentType}</TableCell>
                            <TableCell className="text-right">{formatCurrency(transaction.amount, getDefaultCurrency())}</TableCell>
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
                            <TableCell>
                              {transaction.forTermNumber
                                ? `Term ${transaction.forTermNumber} - ${transaction.forAcademicYear || ''}`
                                : (transaction.isCreditEntry ? 'Credit' : ((transaction as any).forTerm || (transaction as any).for_term || '-'))}
                            </TableCell>
                            <TableCell>
                              {(transaction.termNumber && transaction.academicYear)
                                ? `Term ${transaction.termNumber} - ${transaction.academicYear}`
                                : (transaction as any).termLabel || (transaction as any).term || normalizeTermLabel(terms.find(t => t.id === termId)?.name, 1)}
                            </TableCell>
                            <TableCell>{transaction.processedBy || transaction.processedByName || '-'}</TableCell>
                            <TableCell>
                              {transaction.notes || '-'}
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
                    <SearchBar
                      value={statusInput}
                      onChange={setStatusInput}
                      onDebouncedChange={setStatusSearch}
                      delay={150}
                      placeholder="Search student..."
                      inputClassName="w-full md:w-64"
                    />
                  </CardHeader>
                  <CardContent>
                    {loadingStatuses ? (
                      <Preloader variant="skeleton" rows={4} className="space-y-6" />
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
                              <TableHead className="text-right">Credit</TableHead>
                              <TableHead className="text-right">Outstanding</TableHead>
                              <TableHead className="text-right">Status</TableHead>
                              <TableHead>Term</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
              {filteredFeeStatuses.map(s => (
                              <TableRow 
                                key={s.studentId} 
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => {
                                  setSelectedStudentId(s.studentId);
                                  setSelectedStudentName(s.studentName);
                                  setShowFinancialDetailsModal(true);
                                }}
                              >
                                <TableCell className="font-medium">{s.studentName}</TableCell>
                                <TableCell>{s.humanId || s.studentId || '-'}</TableCell>
                                <TableCell className="text-right">{formatCurrency(s.expectedAmount, getDefaultCurrency())}</TableCell>
                                <TableCell className="text-right">{formatCurrency(s.paidAmount, getDefaultCurrency())}</TableCell>
                                <TableCell className="text-right">{formatCurrency(Number(s.credit || 0), getDefaultCurrency())}</TableCell>
                                <TableCell className="text-right">{formatCurrency(s.outstandingAmount, getDefaultCurrency())}</TableCell>
                                <TableCell className="text-right">
                                  <Badge
                                    variant={
                                      s.status === 'paid' ? 'default'
                                        : s.status === 'overdue' ? 'destructive'
                                        : s.status === 'partial' ? 'outline'
                                        : s.status === 'unpaid' ? 'outline'
                                        : 'outline'
                                    }
                                    className={`capitalize ${
                                      s.status === 'paid'
                                        ? 'bg-green-100 text-green-800 border-green-200'
                                        : s.status === 'unpaid'
                                          ? 'text-red-600'
                                          : ''
                                    }`}
                                  >
                                    {s.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{normalizeTermLabel(terms.find(t => t.id === termId)?.name, 1)}</TableCell>
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

      {/* Student Financial Details Modal */}
      <StudentFinancialDetailsModal
        open={showFinancialDetailsModal}
        onClose={() => {
          setShowFinancialDetailsModal(false);
          setSelectedStudentId(null);
          setSelectedStudentName(null);
        }}
        studentId={selectedStudentId || ''}
        studentName={selectedStudentName || ''}
        academicCalendarId={academicCalendarId}
        termId={termId}
      />
    </div>
  );
}

