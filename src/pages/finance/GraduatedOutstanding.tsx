import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SearchBar } from '@/components/ui/search-bar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/apiClient';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, getDefaultCurrency } from '@/lib/currency';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, DollarSign, Users, TrendingUp } from 'lucide-react';

export default function GraduatedOutstanding() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [outstandingMap, setOutstandingMap] = useState<Record<string, number>>({});
  const [loadingOutstanding, setLoadingOutstanding] = useState<Record<string, boolean>>({});
  const [onlyOutstanding, setOnlyOutstanding] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentStudent, setPaymentStudent] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadGraduatedStudents();
  }, []);

  // Auto-load outstanding balances for all graduated students
  useEffect(() => {
    if (students.length > 0) {
      students.forEach(student => {
        if (typeof outstandingMap[student.id] === 'undefined' && !loadingOutstanding[student.id]) {
          checkOutstanding(student.id);
        }
      });
    }
  }, [students]);

  const loadGraduatedStudents = async () => {
    try {
      setLoading(true);
      // Fetch students and filter graduated ones. The API doesn't have a special graduated endpoint,
      // so we fetch students and detect by class name (common convention in the app)
      const res = await apiFetch<any>(`/student/students?page=1&limit=1000`);
      const list = Array.isArray(res?.students) ? res.students : (res?.data || []);
      const grads = list.filter((s: any) => {
        const className = s.class?.name || '';
        return /graduated|alumni|leavers/i.test(className) || s.isGraduated === true;
      });
      setStudents(grads);
    } catch (error) {
      console.error('Failed to load graduated students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const checkOutstanding = async (studentId: string) => {
    try {
      setLoadingOutstanding(prev => ({ ...prev, [studentId]: true }));
      const details = await apiFetch<any>(`/finance/student-financial-details/${studentId}`);
      const outstanding = Number(details?.summary?.totalOutstandingAllTerms || 0);
      setOutstandingMap(prev => ({ ...prev, [studentId]: outstanding }));
    } catch (error) {
      console.error('Failed to load student financial details:', error);
      setOutstandingMap(prev => ({ ...prev, [studentId]: 0 }));
    } finally {
      setLoadingOutstanding(prev => ({ ...prev, [studentId]: false }));
    }
  };

  const viewStudentDetails = async (student: any) => {
    setSelectedStudent(student);
    setLoadingDetails(true);
    try {
      const details = await apiFetch<any>(`/finance/student-financial-details/${student.id}`);
      setStudentDetails(details);
    } catch (error) {
      console.error('Failed to load detailed student financial information:', error);
      setStudentDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeDetailsDialog = () => {
    setSelectedStudent(null);
    setStudentDetails(null);
  };

  const openPaymentDialog = (student: any) => {
    setPaymentStudent(student);
    setPaymentAmount('');
    setPaymentMethod('cash');
    setReceiptNumber('');
    setPaymentNotes(`Payment for graduated student ${student.firstName} ${student.lastName} - historical outstanding fees`);
    setPaymentDialogOpen(true);
  };

  const closePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setPaymentStudent(null);
    setPaymentAmount('');
    setReceiptNumber('');
    setPaymentNotes('');
  };

  const handleRecordPayment = async () => {
    if (!paymentStudent || !paymentAmount || Number(paymentAmount) <= 0) {
      toast({ title: 'Invalid Input', description: 'Please enter a valid payment amount', variant: 'destructive' });
      return;
    }

    if (!user?.id) {
      toast({ title: 'Error', description: 'User not authenticated', variant: 'destructive' });
      return;
    }

    try {
      setProcessingPayment(true);
      await apiFetch('/finance/payments', {
        method: 'POST',
        body: JSON.stringify({
          studentId: paymentStudent.id,
          amount: Number(paymentAmount),
          paymentMethod,
          receiptNumber: receiptNumber || null,
          notes: paymentNotes || 'Graduated student payment - historical outstanding fees only',
          paymentDate: new Date().toISOString(),
          paymentType: 'full',
          userId: user.id,
        }),
      });

      toast({ title: 'Success', description: 'Payment recorded successfully' });
      closePaymentDialog();
      // Refresh outstanding for this student
      await checkOutstanding(paymentStudent.id);
      await loadGraduatedStudents();
    } catch (error: any) {
      console.error('Payment failed:', error);
      toast({ title: 'Payment Failed', description: error.message || 'Failed to record payment', variant: 'destructive' });
    } finally {
      setProcessingPayment(false);
    }
  };

  const totalGraduated = students.length;
  const totalOutstanding = Object.values(outstandingMap).reduce((sum, val) => sum + (val || 0), 0);
  const studentsWithOutstanding = Object.values(outstandingMap).filter(val => val && val > 0).length;

  const filtered = students.filter(s => {
    const q = searchTerm.trim().toLowerCase();
    const name = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
    if (q && !name.includes(q) && !(s.studentId || '').toLowerCase().includes(q)) return false;
    if (onlyOutstanding) {
      const val = outstandingMap[s.id];
      return typeof val === 'number' ? val > 0 : true; // if not checked yet, keep it visible
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Graduated Outstanding</h1>
          <p className="text-muted-foreground">Accept payments from graduated students with outstanding fees.</p>
        </div>
        <div className="flex items-center space-x-2">
          <SearchBar value={searchInput} onChange={setSearchInput} onDebouncedChange={setSearchTerm} placeholder="Search graduated students..." />
          <Button variant="outline" onClick={() => setOnlyOutstanding(prev => !prev)}>
            {onlyOutstanding ? 'Show All' : 'Only Outstanding'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Graduated Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGraduated}</div>
            <p className="text-xs text-muted-foreground">With outstanding balances</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalOutstanding, getDefaultCurrency())}</div>
            <p className="text-xs text-muted-foreground">Across all graduated students</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students With Outstanding</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{studentsWithOutstanding}</div>
            <p className="text-xs text-muted-foreground">Out of {totalGraduated} graduated students</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Graduated Students</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <button 
                        onClick={() => viewStudentDetails(s)}
                        className="text-left hover:text-primary hover:underline focus:outline-none"
                      >
                        {s.firstName} {s.lastName}
                      </button>
                    </TableCell>
                    <TableCell>{s.studentId || '—'}</TableCell>
                    <TableCell>{s.class?.name || 'Graduated'}</TableCell>
                    <TableCell>
                      {loadingOutstanding[s.id] ? (
                        <span className="text-sm text-muted-foreground">Loading...</span>
                      ) : typeof outstandingMap[s.id] === 'number' ? (
                        <span className={outstandingMap[s.id] > 0 ? 'font-semibold text-red-600' : 'text-green-600'}>
                          {formatCurrency(outstandingMap[s.id], getDefaultCurrency())}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => viewStudentDetails(s)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <Button onClick={() => openPaymentDialog(s)}>
                          Record Payment
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => checkOutstanding(s.id)}
                          disabled={loadingOutstanding[s.id]}
                        >
                          Refresh
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Student Details Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={(open) => { if (!open) closeDetailsDialog(); }}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedStudent && `Financial Details: ${selectedStudent.firstName} ${selectedStudent.lastName}`}
            </DialogTitle>
          </DialogHeader>

          {loadingDetails ? (
            <div className="py-8 text-center text-muted-foreground">Loading details...</div>
          ) : studentDetails ? (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">Student ID</div>
                  <div className="font-medium">{studentDetails.student?.studentId || '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Class</div>
                  <div className="font-medium">{studentDetails.student?.className || '—'}</div>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Expected</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(studentDetails.summary?.totalExpectedAllTerms || 0, getDefaultCurrency())}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Since enrollment</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(studentDetails.summary?.totalPaidAllTerms || 0, getDefaultCurrency())}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">All payments received</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(studentDetails.summary?.totalOutstandingAllTerms || 0, getDefaultCurrency())}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Total balance due</p>
                  </CardContent>
                </Card>
              </div>

              {/* Term Breakdown */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Term-by-Term Breakdown</h3>
                <p className="text-sm text-muted-foreground mb-3">Showing all terms from enrollment {studentDetails.student?.firstName}'s first enrolled term onwards.</p>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Academic Year</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead className="text-right">Expected</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Outstanding</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentDetails.termBreakdown?.map((term: any) => (
                        <TableRow key={term.termId}>
                          <TableCell className="font-medium">{term.academicYear}</TableCell>
                          <TableCell>Term {term.termNumber}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(term.totalExpected || 0, getDefaultCurrency())}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(term.totalPaid || 0, getDefaultCurrency())}
                          </TableCell>
                          <TableCell className="text-right text-red-600 font-semibold">
                            {formatCurrency(term.outstanding || 0, getDefaultCurrency())}
                          </TableCell>
                          <TableCell>
                            {term.outstanding === 0 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Paid
                              </span>
                            ) : term.totalPaid > 0 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Partial
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Unpaid
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={closeDetailsDialog}>
                  Close
                </Button>
                <Button onClick={() => {
                  closeDetailsDialog();
                  openPaymentDialog(selectedStudent);
                }}>
                  Record Payment
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Failed to load student details. Please try again.
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Recording Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={(open) => { if (!open) closePaymentDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment for {paymentStudent?.firstName} {paymentStudent?.lastName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                disabled={processingPayment}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Payment Method *</Label>
              <select
                id="method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
                disabled={processingPayment}
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="mobile_money">Mobile Money</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="receipt">Receipt Number</Label>
              <Input
                id="receipt"
                placeholder="Optional"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                disabled={processingPayment}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Payment notes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                disabled={processingPayment}
              />
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This payment will only be applied to historical outstanding balances. Graduated students are not charged current term fees.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closePaymentDialog} disabled={processingPayment}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={processingPayment}>
              {processingPayment ? 'Processing...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
