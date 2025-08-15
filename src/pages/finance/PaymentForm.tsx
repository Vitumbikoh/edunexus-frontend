import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { API_CONFIG } from '@/config/api';

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

interface PaymentType {
  id: string;
  name: string;
}

const paymentTypes: PaymentType[] = [
  { id: "tuition", name: "Tuition Fee" },
  { id: "exam", name: "Examination Fee" },
  { id: "transport", name: "Transport Fee" },
  { id: "library", name: "Library Fee" },
  { id: "hostel", name: "Hostel Fee" },
  { id: "uniform", name: "Uniform Fee" },
  { id: "other", name: "Other Fee" },
];

export default function PaymentForm() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedPaymentType, setSelectedPaymentType] = useState("tuition");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptNumber, setReceiptNumber] = useState("");
  const [notes, setNotes] = useState("");

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

        const response = await fetch(`${API_CONFIG.BASE_URL}/student/students`, {
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
        setStudents(studentList);
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

  // Token refresh logic (if supported by backend)
  const refreshToken = async (): Promise<string | null> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const result = await response.json();
      const newToken = result.token;
      if (newToken) {
        localStorage.setItem("token", newToken);
        return newToken;
      }
      return null;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError(null);

    try {
      if (!token || !user?.id) {
        throw new Error("Authentication token or user ID not found. Please log in again.");
      }

      const requestBody = {
        studentId: selectedStudent,
        paymentType: selectedPaymentType,
        amount: Number(amount),
        paymentDate,
        paymentMethod,
        receiptNumber: paymentMethod === 'cash' ? null : receiptNumber,
        notes: notes || null,
        userId: user.id,
      };

      if (isNaN(requestBody.amount) || requestBody.amount <= 0) {
        throw new Error("Amount must be a valid positive number");
      }

      if (paymentMethod === 'bank_transfer' && !receiptNumber) {
        throw new Error("Receipt number is required for bank transfer");
      }

      let authToken = token;
      let response = await fetch(`${API_CONFIG.BASE_URL}/finance/payments`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      // Handle 401 by attempting token refresh
      if (response.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          authToken = newToken;
          response = await fetch(`${API_CONFIG.BASE_URL}/finance/payments`, {
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${authToken}`,
            },
            body: JSON.stringify(requestBody),
          });
        } else {
          throw new Error("Session expired. Please log in again.");
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Response:", errorData); // Debug log
        throw new Error(errorData.message || "Failed to record payment");
      }

      const result = await response.json();
      console.log("Payment Success Response:", result); // Debug log

      toast({
        title: "Payment Recorded",
        description: "The payment has been successfully recorded.",
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
              <Select 
                value={selectedStudent} 
                onValueChange={setSelectedStudent}
                required
                disabled={isLoadingStudents}
              >
                <SelectTrigger id="student">
                  <SelectValue placeholder={isLoadingStudents ? "Loading students..." : "Select student"} />
                </SelectTrigger>
                <SelectContent>
                  {students.length > 0 ? (
                    students.map(student => (
                      <SelectItem key={student.id} value={student.id}>
                        {`${student.firstName} ${student.lastName}`} ({student.class.numericalName})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No students found</SelectItem>
                  )}
                </SelectContent>
              </Select>
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
                    {paymentTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
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
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || isLoadingStudents}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Saving..." : "Record Payment"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}