import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Loader2, User, CreditCard, Receipt, Calendar, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { formatCurrency, getDefaultCurrency } from '@/lib/currency';
import { API_CONFIG } from '@/config/api';
import { useToast } from '@/components/ui/use-toast';

interface StudentFinancialDetailsModalProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  studentName?: string;
  academicCalendarId?: string;
  termId?: string;
}

interface StudentFinancialDetails {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    studentId: string;
    email?: string;
    className: string;
    admissionTermId?: string | null;
    admissionTermNumber?: number | null;
    admissionAcademicYear?: string | null;
  };
  summary: {
    totalExpectedAllTerms: number;
    totalPaidAllTerms: number;
    totalOutstandingAllTerms: number;
    creditBalance: number;
    paymentPercentage: number;
  };
  termBreakdown: Array<{
    termId: string;
    termNumber: number;
    academicYear: string;
    startDate: string;
    endDate: string;
    expectedMandatory: number;
    expectedOptional: number;
    totalExpected: number;
    totalPaid: number;
    outstanding: number;
    status: 'paid' | 'partial' | 'unpaid';
    isCurrentTerm: boolean;
    isPastTerm: boolean;
    paymentCount: number;
    lastPaymentDate?: string;
    feeStructures: Array<{
      feeType: string;
      amount: number;
      isOptional: boolean;
      frequency: string;
    }>;
  }>;
  transactionHistory: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    paymentType: string;
    paymentMethod: string;
    receiptNumber?: string;
    termId: string;
    termNumber?: number;
    academicYear?: string;
    forTermId?: string;
    forTermNumber?: number;
    forAcademicYear?: string;
    status: string;
    processedBy: string;
    notes?: string;
  }>;
  historicalData: Array<{
    termId: string;
    termNumber: number;
    academicYear: string;
    totalExpected: number;
    totalPaid: number;
    outstandingAmount: number;
    status: string;
  }>;
  metadata: {
    lastUpdated: string;
    academicCalendarId?: string;
    schoolId?: string;
  };
}

export function StudentFinancialDetailsModal({ 
  open, 
  onClose, 
  studentId, 
  studentName, 
  academicCalendarId,
  termId
}: StudentFinancialDetailsModalProps) {
  const [details, setDetails] = useState<StudentFinancialDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applyingCredit, setApplyingCredit] = useState(false);
  const { token, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const handleAutoApplyCredit = async () => {
    if (!studentId) return;

    setApplyingCredit(true);
    try {
      const storedToken = token || localStorage.getItem('access_token');
      if (!storedToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/finance/credits/auto-apply-all-terms/${studentId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${storedToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to apply credit');
      }

      const result = await response.json();

      if (result.success && result.termsProcessed > 0) {
        toast({
          title: 'Credit Applied Successfully',
          description: result.message,
          variant: 'default'
        });

        // Refresh the financial details
        await fetchStudentFinancialDetails();
      } else {
        toast({
          title: 'No Credits Applied',
          description: result.message || 'No outstanding fees found to apply credit to',
          variant: 'default'
        });
      }
    } catch (error: any) {
      console.error('Error applying credit:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to apply credit balance',
        variant: 'destructive'
      });
    } finally {
      setApplyingCredit(false);
    }
  };

  const fetchStudentFinancialDetails = async () => {
    if (!studentId || !open) return;

    setLoading(true);
    setError(null);

    try {
      const storedToken = token || localStorage.getItem('access_token');
      if (!storedToken) {
        throw new Error('No authentication token found');
      }

      const url = `${API_CONFIG.BASE_URL}/finance/student-financial-details/${studentId}`;

      let response = await fetch(url, {
        headers: { Authorization: `Bearer ${storedToken}` }
      });

      // Fallback: if route not found, build details from existing endpoints
      if (!response.ok && response.status === 404 && termId) {
        const calParam = academicCalendarId ? `&academicCalendarId=${encodeURIComponent(academicCalendarId)}` : '';
        // Fee status for current term
        const statusRes = await fetch(`${API_CONFIG.BASE_URL}/finance/fee-status/${studentId}?termId=${encodeURIComponent(termId)}${calParam}`, {
          headers: { Authorization: `Bearer ${storedToken}` }
        });
        // Transactions (filter client-side for the student)
        const paymentsRes = await fetch(`${API_CONFIG.BASE_URL}/finance/fee-payments?page=1&limit=500`, {
          headers: { Authorization: `Bearer ${storedToken}` }
        });
        if (!statusRes.ok || !paymentsRes.ok) {
          throw new Error('Failed to fetch fallback financial details');
        }
        const statusData = await statusRes.json();
        const paymentsData = await paymentsRes.json();
        const studentTx = (paymentsData?.payments || []).filter((p: any) => (p?.studentId === studentId) || (p?.student?.id === studentId));

        const totalExpected = Number(statusData?.totalExpected || statusData?.expectedFees || 0);
        const totalPaid = Number(statusData?.totalPaid || statusData?.totalFeesPaid || 0);
        const outstanding = Math.max(0, totalExpected - totalPaid);

        const fallbackDetails: StudentFinancialDetails = {
          student: {
            id: studentId,
            firstName: (statusData?.student?.firstName) || (studentName?.split(' ')[0] || ''),
            lastName: (statusData?.student?.lastName) || (studentName?.split(' ').slice(1).join(' ') || ''),
            studentId: statusData?.humanId || statusData?.studentId || '-',
            email: '',
            className: statusData?.className || '—'
          },
          summary: {
            totalExpectedAllTerms: totalExpected,
            totalPaidAllTerms: totalPaid,
            totalOutstandingAllTerms: outstanding,
            creditBalance: 0,
            paymentPercentage: totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0
          },
          termBreakdown: [
            {
              termId: termId,
              termNumber: 0,
              academicYear: statusData?.term || 'Current Term',
              startDate: new Date().toISOString(),
              endDate: new Date().toISOString(),
              expectedMandatory: totalExpected,
              expectedOptional: 0,
              totalExpected: totalExpected,
              totalPaid: totalPaid,
              outstanding: outstanding,
              status: outstanding === 0 ? 'paid' : (totalPaid > 0 ? 'partial' : 'unpaid'),
              isCurrentTerm: true,
              isPastTerm: false,
              paymentCount: studentTx.length,
              lastPaymentDate: studentTx[0]?.paymentDate,
              feeStructures: []
            }
          ],
          transactionHistory: studentTx.map((t: any) => ({
            id: t.id,
            amount: Number(t.amount),
            paymentDate: t.paymentDate,
            paymentType: t.paymentType,
            paymentMethod: t.paymentMethod,
            receiptNumber: t.receiptNumber,
            termId: termId,
            termNumber: undefined,
            academicYear: statusData?.term || 'Current Term',
            // fallback for-term: use allocation term if available
            forTermId: t.allocations && t.allocations[0] ? t.allocations[0].termId : undefined,
            forTermNumber: t.allocations && t.allocations[0] ? t.allocations[0].term?.termNumber : undefined,
            forAcademicYear: t.allocations && t.allocations[0] ? t.allocations[0].term?.academicCalendar?.term : undefined,
            status: t.status,
            processedBy: t.processedByName || 'System'
          })),
          historicalData: [],
          metadata: {
            lastUpdated: new Date().toISOString(),
            academicCalendarId,
            schoolId: undefined
          }
        };

        setDetails(fallbackDetails);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch student financial details: ${response.statusText}`);
      }

      const data = await response.json();
      setDetails(data);
    } catch (err) {
      console.error('Error fetching student financial details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load student financial details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentFinancialDetails();
  }, [studentId, open, academicCalendarId]);

  const getStatusBadge = (status: string, outstanding: number = 0) => {
    const variant = status === 'paid' 
      ? 'default' 
      : status === 'unpaid' && outstanding > 0
        ? 'destructive'
        : 'outline';
    
    const className = status === 'paid'
      ? 'bg-green-100 text-green-800 border-green-200'
      : status === 'unpaid' && outstanding > 0
        ? 'bg-red-100 text-red-800 border-red-200'
        : 'bg-yellow-100 text-yellow-800 border-yellow-200';

    return (
      <Badge variant={variant} className={`capitalize ${className}`}>
        {status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Financial Details - {studentName || details?.student?.firstName + ' ' + details?.student?.lastName || 'Student'}
          </DialogTitle>
        </DialogHeader>

        {!isAuthenticated ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Please login to view financial details.</span>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading financial details...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        ) : details ? (
          <ScrollArea className="max-h-[calc(90vh-100px)]">
            <div className="space-y-6">
              {/* Student Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Student Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Name</p>
                      <p className="text-lg font-semibold">
                        {details.student.firstName} {details.student.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Student ID</p>
                      <p className="text-lg font-semibold">{details.student.studentId}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Class</p>
                      <p className="text-lg font-semibold">{details.student.className}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Admission Term</p>
                      <p className="text-lg font-semibold">
                        {details.student.admissionTermNumber ? `Term ${details.student.admissionTermNumber}` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Admission Academic Calendar</p>
                      <p className="text-lg font-semibold">
                        {details.student.admissionAcademicYear || '—'}
                      </p>
                    </div>
                    {details.student.email && (
                      <div className="md:col-span-3">
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p className="text-lg">{details.student.email}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Expected</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(details.summary.totalExpectedAllTerms, getDefaultCurrency())}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Paid</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(details.summary.totalPaidAllTerms, getDefaultCurrency())}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Outstanding</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(details.summary.totalOutstandingAllTerms, getDefaultCurrency())}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Payment %
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-purple-600">
                      {details.summary.paymentPercentage}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {details.summary.creditBalance > 0 && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 justify-between text-green-800">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Credit Balance
                      </div>
                      <Button
                        onClick={handleAutoApplyCredit}
                        disabled={applyingCredit}
                        size="sm"
                        variant="outline"
                        className="bg-white hover:bg-green-100 text-green-700 border-green-300"
                      >
                        {applyingCredit ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Applying...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-3 w-3" />
                            Apply to Outstanding
                          </>
                        )}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-semibold text-green-700">
                      {formatCurrency(details.summary.creditBalance, getDefaultCurrency())}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Click "Apply to Outstanding" to automatically apply this credit to overdue fees
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Detailed Information Tabs */}
              <Tabs defaultValue="terms" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="terms">Term Breakdown</TabsTrigger>
                  <TabsTrigger value="transactions">Transaction History</TabsTrigger>
                  <TabsTrigger value="historical">Historical Data</TabsTrigger>
                  <TabsTrigger value="fees">Fee Structures</TabsTrigger>
                </TabsList>

                <TabsContent value="terms" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Term-by-Term Breakdown
                      </CardTitle>
                      <CardDescription>
                        Financial status across all terms
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {details.termBreakdown.map((term) => (
                          <div key={term.termId} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-semibold flex items-center gap-2">
                                  Term {term.termNumber} - {term.academicYear}
                                  {term.isCurrentTerm && (
                                    <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
                                      Current
                                    </Badge>
                                  )}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(term.startDate)} - {formatDate(term.endDate)}
                                </p>
                              </div>
                              {getStatusBadge(term.status, term.outstanding)}
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Expected</p>
                                <p className="font-semibold">
                                  {formatCurrency(term.totalExpected, getDefaultCurrency())}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Paid</p>
                                <p className="font-semibold text-green-600">
                                  {formatCurrency(term.totalPaid, getDefaultCurrency())}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
                                <p className="font-semibold text-red-600">
                                  {formatCurrency(term.outstanding, getDefaultCurrency())}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Payments</p>
                                <p className="font-semibold">{term.paymentCount}</p>
                                {term.lastPaymentDate && (
                                  <p className="text-xs text-muted-foreground">
                                    Last: {formatDate(term.lastPaymentDate)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Transaction History
                      </CardTitle>
                      <CardDescription>
                        All payment transactions across all terms
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {details.transactionHistory.length > 0 ? (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Receipt</TableHead>
                                <TableHead>For Term</TableHead>
                                <TableHead>Term</TableHead>
                                <TableHead>Processed By</TableHead>
                                <TableHead>Details</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {details.transactionHistory.map((transaction) => {
                                const isHistoricalCredit = transaction.paymentType === 'credit_application' && 
                                  transaction.notes && transaction.notes.includes('[HISTORICAL TERM');
                                
                                return (
                                  <TableRow key={transaction.id} className={isHistoricalCredit ? 'bg-blue-50 dark:bg-blue-950/20' : ''}>
                                    <TableCell>{formatDate(transaction.paymentDate)}</TableCell>
                                    <TableCell className="font-semibold">
                                      {formatCurrency(transaction.amount, getDefaultCurrency())}
                                    </TableCell>
                                    <TableCell>{transaction.paymentMethod}</TableCell>
                                    <TableCell>
                                      {transaction.receiptNumber || '-'}
                                    </TableCell>
                                    <TableCell>
                                      {transaction.forTermNumber
                                        ? `Term ${transaction.forTermNumber} - ${transaction.forAcademicYear || ''}`
                                        : ((transaction as any).isCreditEntry || String(transaction.paymentType || '').toLowerCase().includes('credit'))
                                          ? 'Credit'
                                          : ((transaction as any).forTerm || (transaction as any).for_term || '-')}
                                    </TableCell>
                                    <TableCell>
                                      {(transaction.termNumber && transaction.academicYear)
                                        ? `Term ${transaction.termNumber} - ${transaction.academicYear}`
                                        : (transaction.term || transaction.termLabel || '-')}
                                    </TableCell>
                                    <TableCell>{(transaction.processedBy && String(transaction.processedBy).trim()) || (transaction as any).processedByName || (transaction as any).processedByAdmin || '-'}</TableCell>
                                    <TableCell>
                                      {transaction.notes || (transaction as any).notesText || (transaction as any).description || '-'}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No transactions found
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="historical" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Historical Data</CardTitle>
                      <CardDescription>
                        Archived financial records from closed terms and credit applications to past terms
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {details.historicalData.length > 0 ? (
                        <>
                          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              <strong>Note:</strong> Historical records are created when terms are formally closed or when credit balances are applied to past term fees.
                              Check the Transaction History tab for detailed payment information.
                            </p>
                          </div>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Term</TableHead>
                                  <TableHead>Academic Year</TableHead>
                                  <TableHead className="text-right">Expected</TableHead>
                                  <TableHead className="text-right">Paid</TableHead>
                                  <TableHead className="text-right">Outstanding</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {details.historicalData.map((record, index) => (
                                  <TableRow key={index}>
                                    <TableCell>Term {record.termNumber}</TableCell>
                                    <TableCell>{record.academicYear}</TableCell>
                                    <TableCell className="text-right">
                                      {formatCurrency(record.totalExpected, getDefaultCurrency())}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {formatCurrency(record.totalPaid, getDefaultCurrency())}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {formatCurrency(record.outstandingAmount, getDefaultCurrency())}
                                    </TableCell>
                                    <TableCell>
                                      {getStatusBadge(record.status, record.outstandingAmount)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground mb-2">No historical data found</p>
                          <p className="text-sm text-muted-foreground">
                            Historical records appear here when terms are closed or when credit balances are applied to past terms.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="fees" className="space-y-4">
                  <div className="space-y-4">
                    {details.termBreakdown.map((term) => (
                      <Card key={term.termId}>
                        <CardHeader>
                          <CardTitle>
                            Term {term.termNumber} - {term.academicYear} Fee Structure
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {term.feeStructures.length > 0 ? (
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Fee Type</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Frequency</TableHead>
                                    <TableHead>Type</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {term.feeStructures.map((fee, index) => (
                                    <TableRow key={index}>
                                      <TableCell className="font-medium">{fee.feeType}</TableCell>
                                      <TableCell className="text-right">
                                        {formatCurrency(fee.amount, getDefaultCurrency())}
                                      </TableCell>
                                      <TableCell>{fee.frequency}</TableCell>
                                      <TableCell>
                                        <Badge variant={fee.isOptional ? 'outline' : 'default'}>
                                          {fee.isOptional ? 'Optional' : 'Mandatory'}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground">
                              No fee structures defined for this term
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}