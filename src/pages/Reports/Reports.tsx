import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users, BookOpen, DollarSign, GraduationCap, TrendingUp, FileSpreadsheet, Download, FileDown, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { API_BASE_URL } from "@/config/api";
// Use local report service implementation co-located with this page to avoid alias resolution issues
import { reportService } from "./reportService";
import { classService } from "@/services/classService";
import { academicCalendarService } from "@/services/academicCalendarService";
import { termService } from "@/services/termService";
import { ReportCards } from "./ReportCards";
import { formatCurrency, getDefaultCurrency } from '@/lib/currency';
import LibraryReportCard from '@/components/reports/LibraryReportCard';

const isGraduatedClass = (cls?: { name?: string; numericalName?: number }) => {
  const className = (cls?.name || '').trim().toLowerCase();
  return cls?.numericalName === 999 || className === 'graduated' || className.includes('graduated');
};

interface ReportDataAPI {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalFeePayments: number;
  totalRevenue: number;
  studentsByGrade: Array<{ grade: string; count: number }>;
  enrollmentsByMonth: Array<{ month: string; count: number }>;
  paymentsByMonth: Array<{ month: string; amount: number }>;
  coursePopularity: Array<{ courseName: string; enrollments: number }>;
  schoolInfo?: {
    school?: {
      id: string;
      name: string;
      code: string;
      status: string;
    };
    settings?: {
      id: string;
      schoolId: string;
      schoolName?: string;
      schoolEmail?: string;
      schoolPhone?: string;
      schoolAddress?: string;
      schoolAbout?: string;
      schoolLogo?: string;
    };
  };
}

interface AcademicCalendar {
  id: string;
  name?: string;
  year?: string;
  term: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  isCompleted?: boolean;
}

/**
 * DetailedReportData represents the payload returned by the detailed report endpoints
 * (students, teachers, courses, enrollments, feePayments). Use any for item shapes
 * to stay flexible; tighten these types later if desired.
 */
interface DetailedReportData {
  students?: any[];
  teachers?: any[];
  courses?: any[];
  enrollments?: any[];
  feePayments?: any[];
  expenses?: any[];
  examResults?: any[];
  outstandingBalances?: any[];
  auditLogs?: any[];
}

type ReportCategory =
  | 'students'
  | 'teachers'
  | 'courses'
  | 'enrollments'
  | 'financial'
  | 'attendance'
  | 'comprehensive'
  | 'expenses'
  | 'exam-results'
  | 'audit-oversight';

const normalizeAuditAction = (value: any): 'CREATE' | 'UPDATE' | 'DELETE' | 'OTHER' => {
  const action = String(value || '').toUpperCase();
  if (action.includes('CREATE') || action.includes('ADD') || action.endsWith('_CREATED')) return 'CREATE';
  if (action.includes('UPDATE') || action.includes('EDIT') || action.includes('MODIFY') || action.endsWith('_UPDATED')) return 'UPDATE';
  if (action.includes('DELETE') || action.includes('REMOVE') || action.endsWith('_DELETED') || action.endsWith('_REMOVED')) return 'DELETE';
  return 'OTHER';
};

const toDateBoundary = (value: string, isEnd = false): number | null => {
  if (!value) return null;
  const suffix = isEnd ? 'T23:59:59.999' : 'T00:00:00.000';
  const parsed = new Date(`${value}${suffix}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
};

export default function Reports() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isPrincipal = user?.role === 'principal';

  const [reportData, setReportData] = useState<ReportDataAPI | null>(null);
  const [kpiOverrides, setKpiOverrides] = useState<{
    totalEnrollments?: number;
    totalFeePayments?: number;
    totalRevenue?: number;
  }>({});
  const [detailedReportData, setDetailedReportData] = useState<DetailedReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track which category & format is currently generating (so only one button shows spinner)
  const [generatingCategory, setGeneratingCategory] = useState<null | { category: string; format: 'excel' | 'pdf' }>(null);
  const initializedDefaultFiltersRef = useRef(false);

  const [filters, setFilters] = useState({
    classId: "",
    studentId: "",
    courseId: "",
    teacherId: "",
    termId: "",
    dateFrom: "",
    dateTo: "",
    attendanceClassId: "",
    attendanceStudentId: "",
    attendanceTermId: "",
    attendanceDateFrom: "",
    attendanceDateTo: "",
    studentGender: "",
    studentClassId: "",
    studentJoinedTermId: "",
    teacherGender: "",
    teacherClassId: "",
    courseClassId: "",
    courseTeacherId: "",
    enrollmentClassId: "",
    enrollmentCourseId: "",
    enrollmentTeacherId: "",
    enrollmentAcademicCalendarId: "",
    paymentAcademicCalendarId: "",
    paymentStudentId: "",
    paymentTermId: "",
    paymentClassId: "",
    comprehensiveTermId: "",
    comprehensiveAcademicCalendarId: "",
    expenseTermId: "",
    expenseAcademicCalendarId: "",
    expenseStatus: "",
    examClassId: "",
    examTermId: "",
    examAcademicCalendarId: "",
    auditAction: "",
    auditDateFrom: "",
    auditDateTo: "",
  });

  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string }>>([]);
  const [courses, setCourses] = useState<Array<{ id: string; name: string }>>([]);
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([]);
  const [academicCalendars, setAcademicCalendars] = useState<AcademicCalendar[]>([]);
  const [terms, setTerms] = useState<Array<{ id: string; name: string; academicCalendarId?: string; isCurrent?: boolean }>>([]);

  const buildQuery = (params: Record<string, string | undefined | null>) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v && String(v).trim() !== "") search.append(k, String(v));
    });
    const s = search.toString();
    return s ? `?${s}` : "";
  };

  const loadFilterOptions = useCallback(async () => {
    if (!token) return;
    try {
      const base = API_BASE_URL;
      const [cls, acads, trs, stds, crs] = await Promise.all([
        classService.getClasses(token).catch(() => []),
        academicCalendarService.getAcademicCalendars(token).catch(() => []),
        fetch(`${base}/admin/reports/teachers`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : [])
          .catch(() => []),
        fetch(`${base}/admin/reports/students`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : [])
          .catch(() => []),
        fetch(`${base}/admin/reports/courses`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : [])
          .catch(() => []),
      ]);

      const safeName = (p: any) => p?.name || [p?.firstName, p?.lastName].filter(Boolean).join(' ') || p?.email || p?.code || p?.id;
      setClasses(
        (cls || [])
          .filter((c: any) => !isGraduatedClass(c))
          .map((c: any) => ({ id: c.id, name: c.name || String(c.numericalName) || c.id }))
      );
      setAcademicCalendars(acads as AcademicCalendar[]);
      setTeachers((trs || []).map((t: any) => ({ id: t.id, name: safeName(t) })));
      setStudents((stds || []).map((s: any) => ({ id: s.id, name: safeName(s) })));
      setCourses((crs || []).map((c: any) => ({ id: c.id, name: safeName(c) })));

      const ts = await termService.getTerms(token).catch(() => []);
      const mappedTerms = (ts || []).map((t: any) => ({
        id: t.id,
        name: t.name || t.periodName || `Term ${t.termNumber ?? ''}`.trim(),
        academicCalendarId: t.academicCalendarId,
        isCurrent: t.isCurrent === true || t.current === true,
      }));
      setTerms(mappedTerms);

      if (!initializedDefaultFiltersRef.current) {
        const activeCalendar = (acads as AcademicCalendar[]).find(c => c.isActive) || (acads as AcademicCalendar[])[0];
        let currentTerm = mappedTerms.find(t => t.isCurrent);
        if (!currentTerm) {
          try {
            const currentTermRes = await fetch(`${API_BASE_URL}/analytics/current-term`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (currentTermRes.ok) {
              const currentTermData = await currentTermRes.json();
              const currentTermId = currentTermData?.id || currentTermData?.termId || currentTermData?.currentTerm?.id;
              if (currentTermId) {
                currentTerm = mappedTerms.find(t => t.id === currentTermId) || {
                  id: currentTermId,
                  name: currentTermData?.name || currentTermData?.term || 'Current Term',
                  academicCalendarId: currentTermData?.academicCalendarId,
                  isCurrent: true,
                };
                if (!mappedTerms.some(t => t.id === currentTermId)) {
                  setTerms(prev => [...prev, currentTerm!]);
                }
              }
            }
          } catch {
            // keep fallback defaults
          }
        }

        const defaultAcademicCalendarId = activeCalendar?.id || currentTerm?.academicCalendarId || '';
        const defaultTermId = currentTerm?.id || '';

        setFilters(prev => ({
          ...prev,
          termId: prev.termId || defaultTermId,
          attendanceTermId: prev.attendanceTermId || defaultTermId,
          paymentTermId: prev.paymentTermId || defaultTermId,
          examTermId: prev.examTermId || defaultTermId,
          expenseTermId: prev.expenseTermId || defaultTermId,
          comprehensiveTermId: prev.comprehensiveTermId || defaultTermId,
          enrollmentAcademicCalendarId: prev.enrollmentAcademicCalendarId || defaultAcademicCalendarId,
          paymentAcademicCalendarId: prev.paymentAcademicCalendarId || defaultAcademicCalendarId,
          examAcademicCalendarId: prev.examAcademicCalendarId || defaultAcademicCalendarId,
          expenseAcademicCalendarId: prev.expenseAcademicCalendarId || defaultAcademicCalendarId,
          comprehensiveAcademicCalendarId: prev.comprehensiveAcademicCalendarId || defaultAcademicCalendarId,
        }));
        initializedDefaultFiltersRef.current = true;
      }
    } catch (e) {
      console.warn('Failed to load filter options', e);
    }
  }, [token]);

  const fetchReportData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const query = buildQuery({
        studentGender: filters.studentGender || undefined,
        studentClassId: filters.studentClassId || undefined,
        studentJoinedTermId: filters.studentJoinedTermId || undefined,
        teacherGender: filters.teacherGender || undefined,
        teacherClassId: filters.teacherClassId || undefined,
        courseClassId: filters.courseClassId || undefined,
        courseTeacherId: filters.courseTeacherId || undefined,
        enrollmentClassId: filters.enrollmentClassId || undefined,
        enrollmentCourseId: filters.enrollmentCourseId || undefined,
        enrollmentTeacherId: filters.enrollmentTeacherId || undefined,
        enrollmentAcademicCalendarId: filters.enrollmentAcademicCalendarId || undefined,
        paymentAcademicCalendarId: filters.paymentAcademicCalendarId || undefined,
        paymentStudentId: filters.paymentStudentId || undefined,
        paymentTermId: filters.paymentTermId || undefined,
        paymentClassId: filters.paymentClassId || undefined,
      });
      const effectiveEnrollmentAcademicCalendarId = filters.enrollmentAcademicCalendarId || filters.comprehensiveAcademicCalendarId;
      const effectivePaymentAcademicCalendarId = filters.paymentAcademicCalendarId || filters.comprehensiveAcademicCalendarId;
      const effectivePaymentTermId = filters.paymentTermId || filters.comprehensiveTermId;

      const enrollmentsQuery = buildQuery({
        classId: filters.enrollmentClassId || undefined,
        courseId: filters.enrollmentCourseId || undefined,
        teacherId: filters.enrollmentTeacherId || undefined,
        academicCalendarId: effectiveEnrollmentAcademicCalendarId || undefined,
      });

      const paymentsQuery = buildQuery({
        page: '1',
        limit: '5000',
        termId: effectivePaymentTermId || undefined,
        academicCalendarId: effectivePaymentAcademicCalendarId || undefined,
        studentId: filters.paymentStudentId || undefined,
        classId: filters.paymentClassId || undefined,
      });

      const requests: Array<Promise<Response | null>> = [
        fetch(`${API_BASE_URL}/admin/reports${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/admin/reports/enrollments${enrollmentsQuery}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ];

      if (isPrincipal) {
        requests.push(
          fetch(`${API_BASE_URL}/admin/reports/fee-payments${paymentsQuery}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        );
        requests.push(Promise.resolve(null));
      } else {
        requests.push(
          fetch(`${API_BASE_URL}/finance/transactions${paymentsQuery ? `?${paymentsQuery.slice(1)}` : ''}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        );
        requests.push(
          effectivePaymentTermId
            ? fetch(`${API_BASE_URL}/finance/v2/term-totals?termId=${encodeURIComponent(effectivePaymentTermId)}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
            : Promise.resolve(null),
        );
      }

      const [summaryRes, enrollmentsRes, txRes, termTotalsRes] = await Promise.all(requests);

      if (!summaryRes.ok) throw new Error('Failed to fetch report data');

      const data = await summaryRes.json();
      setReportData(data);

      let totalEnrollments = data?.totalEnrollments;
      if (enrollmentsRes.ok) {
        const enrollmentsData = await enrollmentsRes.json().catch(() => []);
        const enrollments = Array.isArray(enrollmentsData)
          ? enrollmentsData
          : (enrollmentsData?.enrollments || enrollmentsData?.items || []);
        totalEnrollments = enrollments.length;
      }

      let totalFeePayments = data?.totalFeePayments;
      let txRevenue = 0;
      if (txRes?.ok) {
        const txData = await txRes.json().catch(() => ({}));
        const txItems = Array.isArray(txData)
          ? txData
          : (txData?.transactions || txData?.items || txData?.payments || txData?.feePayments || []);
        totalFeePayments = txItems.length;
        txRevenue = txItems.reduce((sum: number, item: any) => sum + Number(item?.amount || 0), 0);
      }

      let totalRevenue = data?.totalRevenue;
      if (termTotalsRes?.ok) {
        const totalsData = await termTotalsRes.json().catch(() => null);
        totalRevenue = Number(totalsData?.actualRevenue ?? totalsData?.totalCollected ?? txRevenue ?? 0);
      } else if (txRevenue > 0) {
        totalRevenue = txRevenue;
      }

      setKpiOverrides({
        totalEnrollments,
        totalFeePayments,
        totalRevenue,
      });
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  }, [token, filters, isPrincipal]);

  const fetchDetailedData = useCallback(async (category?: ReportCategory) => {
    if (!token) return;
    try {
      const base = API_BASE_URL;
      const studentsQuery = buildQuery({
        gender: filters.studentGender || undefined,
        classId: filters.studentClassId || undefined,
        joinedTermId: filters.studentJoinedTermId || undefined,
      });
      const teachersQuery = buildQuery({ gender: filters.teacherGender || undefined, classId: filters.teacherClassId || undefined });
      const coursesQuery = buildQuery({ classId: filters.courseClassId || undefined, teacherId: filters.courseTeacherId || undefined });
      const effectiveEnrollmentAcademicCalendarId = filters.enrollmentAcademicCalendarId || filters.comprehensiveAcademicCalendarId;
      const effectivePaymentAcademicCalendarId = filters.paymentAcademicCalendarId || filters.comprehensiveAcademicCalendarId;
      const effectivePaymentTermId = filters.paymentTermId || filters.comprehensiveTermId;
      const effectiveExpenseAcademicCalendarId = filters.expenseAcademicCalendarId || filters.comprehensiveAcademicCalendarId;
      const effectiveExpenseTermId = filters.expenseTermId || filters.comprehensiveTermId;
      const effectiveExamAcademicCalendarId = filters.examAcademicCalendarId || filters.comprehensiveAcademicCalendarId;
      const effectiveExamTermId = filters.examTermId || filters.comprehensiveTermId;

      const enrollmentsQuery = buildQuery({
        classId: filters.enrollmentClassId || undefined,
        courseId: filters.enrollmentCourseId || undefined,
        teacherId: filters.enrollmentTeacherId || undefined,
        academicCalendarId: effectiveEnrollmentAcademicCalendarId || undefined,
      });
      const paymentsQuery = buildQuery({
        academicCalendarId: effectivePaymentAcademicCalendarId || undefined,
        studentId: filters.paymentStudentId || undefined,
        termId: effectivePaymentTermId || undefined,
        classId: filters.paymentClassId || undefined,
      });

      const needsStudents = !category || category === 'students' || category === 'comprehensive';
      const needsTeachers = !category || category === 'teachers' || category === 'comprehensive';
      const needsCourses = !category || category === 'courses' || category === 'comprehensive';
      const needsEnrollments = !category || category === 'enrollments' || category === 'comprehensive';
      const needsFeePayments = !category || category === 'financial' || category === 'comprehensive';
      const needsExpenses = !category || category === 'expenses' || category === 'comprehensive';
      const needsExamResults = !category || category === 'exam-results' || category === 'comprehensive';
      const needsOutstandingBalances = !category || category === 'financial' || category === 'comprehensive';
      const needsAuditLogs = category === 'audit-oversight';

      const requests: Array<Promise<any>> = [
        needsStudents
          ? fetch(`${base}/admin/reports/students${studentsQuery}`, { headers: { Authorization: `Bearer ${token}` } })
          : Promise.resolve(null),
        needsTeachers
          ? fetch(`${base}/admin/reports/teachers${teachersQuery}`, { headers: { Authorization: `Bearer ${token}` } })
          : Promise.resolve(null),
        needsCourses
          ? fetch(`${base}/admin/reports/courses${coursesQuery}`, { headers: { Authorization: `Bearer ${token}` } })
          : Promise.resolve(null),
        needsEnrollments
          ? fetch(`${base}/admin/reports/enrollments${enrollmentsQuery}`, { headers: { Authorization: `Bearer ${token}` } })
          : Promise.resolve(null),
        needsFeePayments
          ? fetch(`${base}/admin/reports/fee-payments${paymentsQuery}`, { headers: { Authorization: `Bearer ${token}` } })
          : Promise.resolve(null),
        needsExpenses
          ? fetch(`${base}/expenses?limit=5000&page=0${filters.expenseStatus ? `&status=${encodeURIComponent(filters.expenseStatus)}` : ''}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          : Promise.resolve(null),
        needsOutstandingBalances
          ? fetch(`${base}/admin/reports/outstanding-balances${paymentsQuery}`, { headers: { Authorization: `Bearer ${token}` } })
          : Promise.resolve(null),
        needsAuditLogs
          ? fetch(`${base}/activities/recent?limit=100`, { headers: { Authorization: `Bearer ${token}` } })
          : Promise.resolve(null),
      ];

      const [studentsRes, teachersRes, coursesRes, enrollmentsRes, feePaymentsRes, expensesRes, outstandingBalancesRes, auditLogsRes] = await Promise.all(requests);

      // For outstanding balances, treat failures as warnings (return empty array) instead of blocking the entire report
      // This ensures fee payment reports can still be generated even if balance calculation fails
      let outstandingBalancesResOk = outstandingBalancesRes;
      if (outstandingBalancesRes && !outstandingBalancesRes.ok) {
        console.warn('Outstanding balances endpoint failed, continuing with empty balances array:', outstandingBalancesRes.status);
        toast({ 
          title: 'Warning', 
          description: 'Outstanding balances data unavailable, report will show payments only', 
          variant: 'default' 
        });
        outstandingBalancesResOk = null; // Treat as if not requested
      }

      const requiredResponses = [studentsRes, teachersRes, coursesRes, enrollmentsRes, feePaymentsRes, expensesRes, auditLogsRes].filter(Boolean) as Response[];
      if (!requiredResponses.every(r => r.ok)) {
        throw new Error('Failed to fetch detailed report data');
      }

      const [students, teachers, courses, enrollments, feePayments, expensesPaged, outstandingBalances, auditLogsPayload] = await Promise.all([
        studentsRes ? studentsRes.json() : Promise.resolve([]),
        teachersRes ? teachersRes.json() : Promise.resolve([]),
        coursesRes ? coursesRes.json() : Promise.resolve([]),
        enrollmentsRes ? enrollmentsRes.json() : Promise.resolve([]),
        feePaymentsRes ? feePaymentsRes.json() : Promise.resolve([]),
        expensesRes ? expensesRes.json() : Promise.resolve({ expenses: [] }),
        outstandingBalancesResOk ? outstandingBalancesResOk.json() : Promise.resolve([]),
        auditLogsRes ? auditLogsRes.json() : Promise.resolve([]),
      ]);

      const termCalendarMap = new Map(terms.map(t => [t.id, t.academicCalendarId]));
      const allExpenses = Array.isArray(expensesPaged?.expenses) ? expensesPaged.expenses : [];
      const expenses = allExpenses.filter((expense: any) => {
        const termMatch = effectiveExpenseTermId ? expense.termId === effectiveExpenseTermId : true;
        const expenseCalId = expense.term?.academicCalendarId || termCalendarMap.get(expense.termId);
        const calendarMatch = effectiveExpenseAcademicCalendarId ? expenseCalId === effectiveExpenseAcademicCalendarId : true;
        return termMatch && calendarMatch;
      });

      let examResults: any[] = [];
      if (needsExamResults) {
        const classIds = filters.examClassId ? [filters.examClassId] : classes.map(c => c.id);
        const examQuery = buildQuery({
          termId: effectiveExamTermId || undefined,
          academicCalendarId: effectiveExamAcademicCalendarId || undefined,
        });

        const classResultResponses = await Promise.all(
          classIds.map(classId =>
            fetch(`${base}/exam-results/class/${encodeURIComponent(classId)}${examQuery}`, {
              headers: { Authorization: `Bearer ${token}` },
            }).then(async r => (r.ok ? r.json() : null)).catch(() => null),
          ),
        );

        examResults = classResultResponses
          .filter(Boolean)
          .flatMap((classResult: any) => {
            return (classResult.students || []).flatMap((studentResult: any) =>
              (studentResult.results || []).map((result: any) => ({
                classId: classResult.classInfo?.id,
                className: classResult.classInfo?.name,
                studentId: studentResult.student?.id,
                studentHumanId: studentResult.student?.studentId,
                studentName: `${studentResult.student?.firstName || ''} ${studentResult.student?.lastName || ''}`.trim(),
                courseId: result.courseId,
                courseName: result.courseName,
                courseCode: result.courseCode,
                finalPercentage: result.finalPercentage,
                finalGradeCode: result.finalGradeCode,
                pass: result.pass,
                status: result.status,
                termId: effectiveExamTermId || null,
                academicCalendarId: effectiveExamAcademicCalendarId || null,
              }))
            );
          });
      }

      const rawAuditLogs = Array.isArray(auditLogsPayload)
        ? auditLogsPayload
        : (auditLogsPayload?.items || auditLogsPayload?.logs || []);

      const fromTs = toDateBoundary(filters.auditDateFrom, false);
      const toTs = toDateBoundary(filters.auditDateTo, true);
      const selectedActionRaw = String(filters.auditAction || '').toUpperCase();
      const selectedAction = selectedActionRaw === 'ALL' ? '' : selectedActionRaw;
      const auditLogs = rawAuditLogs.filter((item: any) => {
        const normalizedAction = normalizeAuditAction(item?.action);
        if (normalizedAction === 'OTHER') return false;
        if (selectedAction && normalizedAction !== selectedAction) return false;

        const rawTs = item?.timestamp || item?.createdAt || item?.updatedAt;
        if (!rawTs) return true;
        const ts = new Date(rawTs).getTime();
        if (!Number.isFinite(ts)) return true;
        if (fromTs !== null && ts < fromTs) return false;
        if (toTs !== null && ts > toTs) return false;
        return true;
      });

      const payload = { students, teachers, courses, enrollments, feePayments, expenses, examResults, outstandingBalances, auditLogs };
      setDetailedReportData(payload);
      return payload;
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to load detailed report data', variant: 'destructive' });
    }
  }, [token, toast, filters, terms, classes]);

  const handleGenerateReport = async (format: 'excel' | 'pdf', category: ReportCategory) => {
    try {
      setGeneratingCategory({ category, format });
      
      const data = await fetchDetailedData(category);
      if (!data) throw new Error('Detailed data unavailable');
      
      if (format === 'excel') {
        switch (category) {
          case 'students':
            reportService.generateStudentsExcel(data.students!, reportData?.schoolInfo);
            break;
          case 'teachers':
            reportService.generateTeachersExcel(data.teachers!, reportData?.schoolInfo);
            break;
          case 'courses':
            reportService.generateCoursesExcel(data.courses!, reportData?.schoolInfo);
            break;
          case 'enrollments':
            reportService.generateEnrollmentsExcel(data.enrollments!, reportData?.schoolInfo);
            break;
          case 'financial':
            reportService.generateFinancialExcel(data.feePayments!, data.outstandingBalances || [], reportData?.schoolInfo);
            break;
          case 'expenses':
            reportService.generateExpensesExcel(data.expenses || [], reportData?.schoolInfo);
            break;
          case 'exam-results':
            reportService.generateExamResultsExcel(data.examResults || [], reportData?.schoolInfo);
            break;
          case 'audit-oversight':
            reportService.generateAuditOversightExcel(data.auditLogs || [], reportData?.schoolInfo);
            break;
          case 'attendance':
            toast({ title: 'Attendance Report', description: 'Attendance reporting will be implemented soon', variant: 'default' });
            return;
          case 'comprehensive':
            if (!data.students || !data.teachers || !data.courses || !data.enrollments || !data.feePayments) {
              throw new Error('Comprehensive report data is incomplete');
            }
            reportService.generateComprehensiveExcel({
              students: data.students,
              teachers: data.teachers,
              courses: data.courses,
              enrollments: data.enrollments,
              feePayments: data.feePayments,
              schoolInfo: reportData?.schoolInfo,
            });
            break;
        }
      } else {
        switch (category) {
          case 'students':
            await reportService.generateStudentsPDF?.(data.students as any, reportData?.schoolInfo);
            break;
          case 'teachers':
            await reportService.generateTeachersPDF?.(data.teachers as any, reportData?.schoolInfo);
            break;
          case 'courses':
            await reportService.generateCoursesPDF?.(data.courses as any, reportData?.schoolInfo);
            break;
          case 'enrollments':
            await reportService.generateEnrollmentsPDF?.(data.enrollments as any, reportData?.schoolInfo);
            break;
          case 'financial':
            await reportService.generateFinancialPDF?.(data.feePayments as any, data.outstandingBalances as any, reportData?.schoolInfo);
            break;
          case 'expenses':
            await reportService.generateExpensesPDF?.(data.expenses as any, reportData?.schoolInfo);
            break;
          case 'exam-results':
            await reportService.generateExamResultsPDF?.(data.examResults as any, reportData?.schoolInfo);
            break;
          case 'audit-oversight':
            await reportService.generateAuditOversightPDF?.(data.auditLogs as any, reportData?.schoolInfo);
            break;
          case 'attendance':
            toast({ title: 'Attendance PDF', description: 'Attendance PDF reporting will be implemented soon', variant: 'default' });
            return;
          case 'comprehensive':
            if (!data.students || !data.teachers || !data.courses || !data.enrollments || !data.feePayments) {
              throw new Error('Comprehensive report data is incomplete');
            }
            await reportService.generateComprehensivePDF({
              students: data.students,
              teachers: data.teachers,
              courses: data.courses,
              enrollments: data.enrollments,
              feePayments: data.feePayments,
              schoolInfo: reportData?.schoolInfo, // Pass school info from comprehensive report
            });
        }
      }
      
      toast({ 
        title: 'Report Generated Successfully', 
        description: `${category.charAt(0).toUpperCase() + category.slice(1)} report (${format.toUpperCase()}) has been downloaded`,
        duration: 5000,
      });
    } catch (e) {
      toast({ 
        title: 'Report Generation Failed', 
        description: e instanceof Error ? e.message : 'Failed to generate report', 
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setGeneratingCategory(null);
    }
  };

  useEffect(() => {
    if (token && (user?.role === 'admin' || user?.role === 'principal')) {
      loadFilterOptions();
      fetchReportData();
    }
  }, [token, user, fetchReportData, loadFilterOptions]);

  if (!user || (user.role !== "admin" && user.role !== "principal")) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700">
          No report data available.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive Data Analytics & Report Generation
          </p>
        </div>
      </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{reportData.totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">Active students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Teachers</CardTitle>
            <GraduationCap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{reportData.totalTeachers}</div>
            <p className="text-xs text-muted-foreground mt-1">Faculty members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{reportData.totalCourses}</div>
            <p className="text-xs text-muted-foreground mt-1">Available courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Enrollments</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{kpiOverrides.totalEnrollments ?? reportData.totalEnrollments}</div>
            <p className="text-xs text-muted-foreground mt-1">Active enrollments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Fee Payments</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{kpiOverrides.totalFeePayments ?? reportData.totalFeePayments}</div>
            <p className="text-xs text-muted-foreground mt-1">Fee payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-2xl font-bold text-foreground break-words">
              {formatCurrency(kpiOverrides.totalRevenue ?? reportData.totalRevenue ?? 0, getDefaultCurrency())}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total collected</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportCards
          reportData={reportData}
          filters={filters}
          setFilters={setFilters}
          classes={classes}
          students={students}
            courses={courses}
          teachers={teachers}
          terms={terms}
          academicCalendars={academicCalendars}
          isGenerating={!!generatingCategory}
          generatingCategory={generatingCategory}
          onGenerateReport={handleGenerateReport}
          onViewLogs={() => navigate('/activities')}
        />

        {/* Library report requires library/finance permissions; hide for principal to avoid forbidden noise */}
        {!isPrincipal && (
          <LibraryReportCard
            onGenerateReport={handleGenerateReport}
            generatingCategory={generatingCategory}
          />
        )}

        {/* Comprehensive Report Card */}
        {!isPrincipal && (
        <Card className="flex flex-col h-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Comprehensive Report</CardTitle>
                <p className="text-muted-foreground text-sm">Complete school data export</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex flex-col h-full space-y-4">
            <p className="text-muted-foreground text-sm">
              Generate a comprehensive report containing all school data including students, teachers, courses, enrollments, and financial records.
            </p>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Report Contents
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Student enrollment and academic records</li>
                <li>• Teacher profiles and course assignments</li>
                <li>• Course catalog and enrollment statistics</li>
                <li>• Financial records and payment history</li>
                <li>• Attendance tracking and analytics</li>
              </ul>
            </div>

            <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Filter Options
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Term</label>
                  <select
                    value={filters.comprehensiveTermId}
                    onChange={(e) => setFilters((prev: any) => ({ ...prev, comprehensiveTermId: e.target.value }))}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    <option value="">All terms</option>
                    {terms.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Academic Calendar</label>
                  <select
                    value={filters.comprehensiveAcademicCalendarId}
                    onChange={(e) => setFilters((prev: any) => ({ ...prev, comprehensiveAcademicCalendarId: e.target.value }))}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    <option value="">All calendars</option>
                    {academicCalendars.map(a => (
                      <option key={a.id} value={a.id}>{a.name || a.term || a.id}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Spacer to push buttons to bottom */}
            <div className="flex-1" />

            {/* Action buttons positioned at bottom */}
            <div className="flex gap-2 pt-4 mt-auto">
              <Button
                onClick={() => handleGenerateReport("excel", "comprehensive")}
                disabled={!!generatingCategory}
                size="sm"
                className="flex-1"
              >
                <FileSpreadsheet className="h-4 w-4 mr-1" />
                {generatingCategory?.category === 'comprehensive' && generatingCategory.format === 'excel' ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excel"}
              </Button>
              <Button
                onClick={() => handleGenerateReport("pdf", "comprehensive")}
                disabled={!!generatingCategory}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <FileDown className="h-4 w-4 mr-1" />
                {generatingCategory?.category === 'comprehensive' && generatingCategory.format === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'PDF'}
              </Button>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
