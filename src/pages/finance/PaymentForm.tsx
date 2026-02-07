import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Save, AlertTriangle } from "lucide-react";
import { API_CONFIG } from '@/config/api';
import { apiFetch } from '@/lib/apiClient';
import { academicCalendarService } from '@/services/academicCalendarService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Class {
  id: string;
  name: string;
  numericalName: number | string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  class: Class;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  phoneNumber?: string;
  studentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface FeeTypeOption { value: string; label: string }

export default function PaymentForm() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedPaymentType, setSelectedPaymentType] = useState("Tuition");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptNumber, setReceiptNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [feeTypes, setFeeTypes] = useState<FeeTypeOption[]>([]);
  const [academicCalendars, setAcademicCalendars] = useState<any[]>([]);
  const [selectedAcademicCalendarId, setSelectedAcademicCalendarId] = useState<string | null>(null);
  const [terms, setTerms] = useState<any[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [currentTermId, setCurrentTermId] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [feeStructures, setFeeStructures] = useState<Array<{feeType: string; amount: number}>>([]);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [studentFinancialData, setStudentFinancialData] = useState<any>(null);
  const [paidByFeeType, setPaidByFeeType] = useState<Map<string, number>>(new Map());

  // Check permissions
  const canRecordPayment = user?.role === "admin" || user?.role === "finance";
  
  if (!canRecordPayment) {
    toast({
      title: "Access Denied",
      description: "You do not have permission to record payments.",
      variant: "destructive",
    });
    navigate('/finance');
    return null;
  }

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoadingStudents(true);
        setApiError(null);

        if (!token) {
          throw new Error("Authentication token not found. Please log in again.");
        }

        const response = await fetch(`${API_CONFIG.BASE_URL}/student/students?page=1&limit=1000`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.status === 401) {
          throw new Error("Session expired. Please log in again.");
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch students");
        }

        const result = await response.json();
        console.log('Students API Response:', result); // Debug log
        const studentList = Array.isArray(result.students)
          ? result.students.map((s: any) => ({
              id: s.id || 'unknown',
              firstName: s.firstName || 'Unknown',
              lastName: s.lastName || 'Student',
              class: {
                id: s.class?.id || 'unknown',
                name: s.class?.name || 'N/A',
                numericalName: s.class?.numericalName || 'N/A',
                description: s.class?.description,
                createdAt: s.class?.createdAt,
                updatedAt: s.class?.updatedAt,
              },
              address: s.address,
              dateOfBirth: s.dateOfBirth,
              gender: s.gender,
              phoneNumber: s.phoneNumber,
              studentId: s.studentId,
              createdAt: s.createdAt,
              updatedAt: s.updatedAt,
            }))
          : [];
        // If more students exist, fetch additional pages
        const totalItems = result?.pagination?.totalItems || studentList.length;
        const pageSize = result?.pagination?.itemsPerPage || studentList.length;
        let allStudents = studentList;
        if (pageSize && totalItems > pageSize) {
          const totalPages = Math.ceil(totalItems / pageSize);
          for (let page = 2; page <= totalPages; page++) {
            const res = await fetch(`${API_CONFIG.BASE_URL}/student/students?page=${page}&limit=${pageSize}`, {
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });
            if (res.ok) {
              const data = await res.json();
              const more = Array.isArray(data.students)
                ? data.students.map((s: any) => ({
                    id: s.id || 'unknown',
                    firstName: s.firstName || 'Unknown',
                    lastName: s.lastName || 'Student',
                    class: {
                      id: s.class?.id || 'unknown',
                      name: s.class?.name || 'N/A',
                      numericalName: s.class?.numericalName || 'N/A',
                      description: s.class?.description,
                      createdAt: s.class?.createdAt,
                      updatedAt: s.class?.updatedAt,
                    },
                    address: s.address,
                    dateOfBirth: s.dateOfBirth,
                    gender: s.gender,
                    phoneNumber: s.phoneNumber,
                    studentId: s.studentId,
                    createdAt: s.createdAt,
                    updatedAt: s.updatedAt,
                  }))
                : [];
              allStudents = allStudents.concat(more);
            }
          }
        }
        setStudents(allStudents);

        // Prefill selected student if navigated here with a prefill student id
        const prefill = (location.state as any)?.prefillStudentId;
        if (prefill) {
          // Defer setting until students are loaded
          setTimeout(() => {
            const exists = allStudents.find((s: any) => s.id === prefill);
            if (exists) setSelectedStudent(prefill);
          }, 50);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch students";
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
        setIsLoadingStudents(false);
      }
    };

    fetchStudents();
  }, [token, navigate, toast]);

  // Load academic calendars and default active calendar + terms
  useEffect(() => {
    const loadCalendarsAndTerms = async () => {
      if (!token) return;
      try {
        const cals = await academicCalendarService.getAcademicCalendars(token);
        setAcademicCalendars(cals || []);

        const active = await academicCalendarService.getActiveAcademicCalendar(token);
        const activeId = active?.id || (cals && cals[0]?.id) || null;
        setSelectedAcademicCalendarId(activeId);

        // load terms scoped to active calendar using backend query
        const url = activeId
          ? `/settings/terms?academicCalendarId=${encodeURIComponent(activeId)}`
          : `/settings/terms`;
        const termsData = await apiFetch<any>(url);
        const list = Array.isArray(termsData) ? termsData : (termsData?.terms || []);
        // choose current term from raw list using known flags
        const currentRaw = list.find((t: any) => t.isCurrent === true || t.current === true || t.is_current === true) || list[0];
        const termId = currentRaw?.id || currentRaw?.termId || currentRaw?.uuid || null;
        const mapped = (list || []).map((y: any) => ({ id: y.id || y.termId || y.uuid, name: y.name || y.periodName || y.term || y.displayName }));
        setTerms(mapped || []);
        setCurrentTermId(termId);
        setSelectedTermId(termId);
      } catch (error) {
        console.error('Failed to load calendars/terms:', error);
      }
    };
    loadCalendarsAndTerms();
  }, [token]);

  // When selected academic calendar changes, reload terms scoped to it
  useEffect(() => {
    const loadTermsForCalendar = async () => {
      if (!token) return;
      try {
        const url = selectedAcademicCalendarId
          ? `/settings/terms?academicCalendarId=${encodeURIComponent(selectedAcademicCalendarId)}`
          : `/settings/terms`;
        const termsData = await apiFetch<any>(url);
        const list = Array.isArray(termsData) ? termsData : (termsData?.terms || []);
        const currentRaw = list.find((t: any) => t.isCurrent === true || t.current === true || t.is_current === true) || list[0];
        const termId = currentRaw?.id || currentRaw?.termId || currentRaw?.uuid || null;
        const mapped = (list || []).map((y: any) => ({ id: y.id || y.termId || y.uuid, name: y.name || y.periodName || y.term || y.displayName }));
        setTerms(mapped || []);
        setSelectedTermId(termId);
      } catch (error) {
        console.error('Failed to load terms for calendar:', error);
      }
    };
    loadTermsForCalendar();
  }, [selectedAcademicCalendarId, token]);

  // Fetch fee types whenever selected term or calendar changes
  useEffect(() => {
    const fetchFeeTypes = async () => {
      if (!token || !selectedTermId) return;
      try {
        const calParam = selectedAcademicCalendarId ? `&academicCalendarId=${encodeURIComponent(selectedAcademicCalendarId)}` : '';
        const feeTypesRes = await apiFetch<any>(`/finance/fee-types?termId=${selectedTermId}${calParam}`);
        const types = Array.isArray(feeTypesRes?.feeTypes) ? feeTypesRes.feeTypes : [];
        const uniqueFees = Array.from(new Set(types.filter(Boolean))) as string[];
        setFeeTypes(uniqueFees.map((fee: string) => ({ value: fee, label: fee })));
        if (uniqueFees.length > 0 && !uniqueFees.includes(selectedPaymentType)) {
          setSelectedPaymentType(uniqueFees[0]);
        }
      } catch (error) {
        console.error('Failed to fetch fee types:', error);
        setFeeTypes([]);
      }
    };
    fetchFeeTypes();
  }, [token, selectedTermId, selectedAcademicCalendarId]);

  // Fetch fee structures for validation
  useEffect(() => {
    const fetchFeeStructures = async () => {
      if (!token || !selectedTermId) return;
      try {
        const calParam = selectedAcademicCalendarId ? `&academicCalendarId=${encodeURIComponent(selectedAcademicCalendarId)}` : '';
        const structures = await apiFetch<any>(`/finance/fee-structure?termId=${selectedTermId}${calParam}`);
        if (Array.isArray(structures)) {
          setFeeStructures(structures.map((s: any) => ({
            feeType: s.feeType,
            amount: Number(s.amount)
          })));
        }
      } catch (error) {
        console.error('Failed to fetch fee structures:', error);
        setFeeStructures([]);
      }
    };
    fetchFeeStructures();
  }, [token, selectedTermId, selectedAcademicCalendarId]);

  // Fetch student financial details to calculate already paid amounts per fee type
  useEffect(() => {
    const fetchStudentFinancialData = async () => {
      if (!token || !selectedStudent || !selectedTermId) {
        setStudentFinancialData(null);
        setPaidByFeeType(new Map());
        return;
      }
      
      try {
        const calParam = selectedAcademicCalendarId ? `?academicCalendarId=${encodeURIComponent(selectedAcademicCalendarId)}` : '';
        const financialData = await apiFetch<any>(`/finance/student-financial-details/${selectedStudent}${calParam}`);
        setStudentFinancialData(financialData);
        
        // Calculate how much has been paid for each fee type in the selected term
        const paidAmounts = new Map<string, number>();
        
        // Initialize with 0 for all defined fee types from fee structures
        if (feeStructures && feeStructures.length > 0) {
          feeStructures.forEach((fs: any) => {
            paidAmounts.set(fs.feeType.toLowerCase(), 0);
          });
        }
        
        // Sum up payments by fee type from transaction history for this term
        // The transaction history shows ALLOCATIONS (where money was allocated),
        // which is what we need for validation
        if (financialData?.transactionHistory) {
          financialData.transactionHistory.forEach((transaction: any) => {
            const isMatch = transaction.termId === selectedTermId;
            const isCredit = !!transaction.isCreditEntry;
            const hasPaymentType = !!transaction.paymentType;
            
            // Only count non-credit transactions for the selected term
            // Both allocation details and regular payments should be counted
            if (isMatch && hasPaymentType && !isCredit) {
              const feeType = transaction.paymentType.toLowerCase();
              const currentPaid = paidAmounts.get(feeType) || 0;
              paidAmounts.set(feeType, currentPaid + Number(transaction.amount || 0));
            }
          });
        }
        
        setPaidByFeeType(paidAmounts);
      } catch (error) {
        console.error('Failed to fetch student financial data:', error);
        setStudentFinancialData(null);
        setPaidByFeeType(new Map());
      }
    };
    
    fetchStudentFinancialData();
  }, [token, selectedStudent, selectedTermId, selectedAcademicCalendarId, feeStructures]);

  // Token refresh is now handled by apiClient

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setValidationWarning(null);

    // Basic validations
    if (!token || !user?.id) {
      setApiError("Authentication token or user ID not found. Please log in again.");
      return;
    }

    if (!selectedTermId) {
      setApiError('Please select an academic term for this payment');
      return;
    }

    const amountValue = Number(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setApiError("Amount must be a valid positive number");
      return;
    }

    if (paymentMethod === 'bank_transfer' && !receiptNumber) {
      setApiError("Receipt number is required for bank transfer");
      return;
    }

    // Validate amount against remaining balance for the fee type (except for "full" payment type)
    if (selectedPaymentType && selectedPaymentType !== 'full') {
      const expectedFee = feeStructures.find(
        f => f.feeType.toLowerCase() === selectedPaymentType.toLowerCase()
      );
      
      if (expectedFee) {
        const alreadyPaid = paidByFeeType.get(selectedPaymentType.toLowerCase()) || 0;
        const remainingBalance = expectedFee.amount - alreadyPaid;
        
        if (amountValue > remainingBalance) {
          setValidationWarning(
            `The amount entered (MK ${amountValue.toLocaleString()}) is more than the remaining balance for ${selectedPaymentType} fee. Expected: MK ${expectedFee.amount.toLocaleString()}, Already Paid: MK ${alreadyPaid.toLocaleString()}, Remaining: MK ${remainingBalance.toLocaleString()}. Please select "Full (allocate across fees)" to proceed with this amount.`
          );
          return;
        }
      }
    }

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  const confirmAndSubmit = async () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);
    setApiError(null);

    try {
      const requestBody: any = {
        studentId: selectedStudent,
        paymentType: selectedPaymentType,
        amount: Number(amount),
        paymentDate,
        paymentMethod,
        receiptNumber: paymentMethod === 'cash' ? null : receiptNumber,
        notes: notes || null,
        userId: user.id,
      };

      // attach selected academic calendar and term when present
      if (selectedAcademicCalendarId) requestBody.academicCalendarId = selectedAcademicCalendarId;
      if (selectedTermId) requestBody.termId = selectedTermId;

      const result = await apiFetch<any>(`/finance/payments`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });
      console.log("Payment Success Response:", result); // Debug log

      toast({
        title: "Payment Recorded",
        description: result?.credit?.created
          ? `Payment recorded. Surplus of ${result.credit.amount.toFixed(2)} credited to student.`
          : "The payment has been successfully recorded.",
        variant: "default",
      });

      navigate('/finance');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to record payment";
      console.error("Submission Error:", err); // Debug log
      setApiError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      if (errorMessage.includes("Unauthorized") || errorMessage.includes("token") || errorMessage.includes("Session expired")) {
        localStorage.removeItem("token");
        navigate('/login');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => navigate('/finance')} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Finance
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Record Payment</h1>
          <p className="text-muted-foreground">Record a new payment from a student</p>
        </div>
      </div>

      {apiError && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {apiError}
        </div>
      )}



      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
            <CardDescription>
              Enter the details for the new payment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="student">Student</Label>
              <div className="space-y-2">
                {!selectedStudent ? (
                  // Search and selection mode
                  <>
                    <Input
                      placeholder="Search student..."
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      disabled={isLoadingStudents}
                    />
                    <div className="max-h-48 overflow-y-auto border rounded-md p-2 bg-background">
                      {isLoadingStudents ? (
                        <div className="text-sm text-muted-foreground">Loading...</div>
                      ) : students.filter(s => (
                          `${s.firstName} ${s.lastName}`.toLowerCase().includes(studentSearch.toLowerCase()) ||
                          (s.studentId || '').toLowerCase().includes(studentSearch.toLowerCase())
                        )).map(s => (
                          <button
                            type="button"
                            key={s.id}
                            onClick={() => {
                              setSelectedStudent(s.id);
                              setStudentSearch(""); // Clear search after selection
                            }}
                            className="w-full text-left text-sm px-2 py-1 rounded-md hover:bg-muted transition-colors"
                          >
                            {s.firstName} {s.lastName} {s.studentId ? `(${s.studentId})` : ''}
                            <span className="text-xs text-muted-foreground ml-2">
                              - Class {s.class.numericalName || s.class.name}
                            </span>
                          </button>
                        ))}
                      {students.length === 0 && !isLoadingStudents && (
                        <div className="text-xs text-muted-foreground">No students found</div>
                      )}
                      {students.filter(s => (
                          `${s.firstName} ${s.lastName}`.toLowerCase().includes(studentSearch.toLowerCase()) ||
                          (s.studentId || '').toLowerCase().includes(studentSearch.toLowerCase())
                        )).length === 0 && studentSearch && !isLoadingStudents && (
                        <div className="text-xs text-muted-foreground">No students match your search</div>
                      )}
                    </div>
                  </>
                ) : (
                  // Selected student display mode
                  <div className="border rounded-md p-3 bg-muted/50 border-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {(() => {
                            const selected = students.find(s => s.id === selectedStudent);
                            return selected ? `${selected.firstName} ${selected.lastName}` : 'Unknown Student';
                          })()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {(() => {
                            const selected = students.find(s => s.id === selectedStudent);
                            if (!selected) return 'Student not found';
                            const parts = [];
                            if (selected.studentId) parts.push(`ID: ${selected.studentId}`);
                            if (selected.class) parts.push(`Class: ${selected.class.numericalName || selected.class.name}`);
                            return parts.join(' • ');
                          })()}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedStudent("");
                          setStudentSearch("");
                        }}
                      >
                        Change Student
                      </Button>
                    </div>
                  </div>
                )}
                <input type="hidden" required value={selectedStudent} onChange={()=>{}} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="academicCalendar">Academic Calendar</Label>
                <Select
                  value={selectedAcademicCalendarId || ''}
                  onValueChange={(v) => setSelectedAcademicCalendarId(v || null)}
                >
                  <SelectTrigger id="academicCalendar">
                    <SelectValue placeholder="Choose calendar" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicCalendars.length === 0 && (
                      <SelectItem value="">No calendars</SelectItem>
                    )}
                    {academicCalendars.map((cal) => (
                      <SelectItem key={cal.id} value={cal.id}>{cal.term || cal.name || cal.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="termSelect">Term</Label>
                <Select
                  value={selectedTermId || ''}
                  onValueChange={(v) => setSelectedTermId(v || null)}
                >
                  <SelectTrigger id="termSelect">
                    <SelectValue placeholder="Choose term" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.length === 0 && (
                      <SelectItem value="">No terms</SelectItem>
                    )}
                    {terms.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name || t.term || t.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="paymentType">Payment Type</Label>
                <Select 
                  value={selectedPaymentType} 
                  onValueChange={setSelectedPaymentType}
                  required
                >
                  <SelectTrigger id="paymentType">
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Special processing mode: Full allocation across configured fees */}
                    <SelectItem value="full">Full (allocate across fees)</SelectItem>
                    {feeTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g., 500.00" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input 
                id="paymentDate" 
                type="date" 
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required 
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <RadioGroup 
                value={paymentMethod} 
                onValueChange={setPaymentMethod}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="cursor-pointer">Cash</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                  <Label htmlFor="bank_transfer" className="cursor-pointer">Bank Transfer</Label>
                </div>
              </RadioGroup>
            </div>

            {paymentMethod === 'bank_transfer' && (
              <div className="space-y-2">
                <Label htmlFor="receiptNumber">Receipt Number</Label>
                <Input 
                  id="receiptNumber" 
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="e.g., RCPT-2023-001" 
                  required 
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input 
                id="notes" 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information about this payment" 
              />
            </div>

            {/* Validation warning placed immediately below Notes (Optional) as requested */}
            {validationWarning && (
              <div className="p-3 mt-2 text-sm text-yellow-700 bg-yellow-100 rounded-lg flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>{validationWarning}</div>
              </div>
            )}

          </CardContent>

          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || isLoadingStudents}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Saving..." : "Record Payment"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to record this payment?
              <div className="mt-4 space-y-2 text-sm">
                <div><strong>Student:</strong> {students.find(s => s.id === selectedStudent)?.firstName} {students.find(s => s.id === selectedStudent)?.lastName}</div>
                <div><strong>Amount:</strong> MK {Number(amount).toLocaleString()}</div>
                <div><strong>Payment Type:</strong> {selectedPaymentType === 'full' ? 'Full (allocate across fees)' : selectedPaymentType}</div>
                <div><strong>Payment Method:</strong> {paymentMethod}</div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAndSubmit}>Confirm & Record</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}