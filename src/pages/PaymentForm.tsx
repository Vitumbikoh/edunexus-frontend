
import React from 'react';
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

// Mock students data
const students = [
  { id: "1", name: "John Doe", class: "10A" },
  { id: "2", name: "Jane Smith", class: "9B" },
  { id: "3", name: "Michael Johnson", class: "11C" },
  { id: "4", name: "Emily Davis", class: "10A" },
  { id: "5", name: "Robert Wilson", class: "9B" },
  { id: "6", name: "Sarah Brown", class: "11C" },
];

// Payment types
const paymentTypes = [
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedStudent, setSelectedStudent] = React.useState("");
  const [selectedPaymentType, setSelectedPaymentType] = React.useState("tuition");
  const [paymentMethod, setPaymentMethod] = React.useState("cash");

  // Check permissions
  const canRecordPayment = user?.role === "admin" || user?.role === "finance";
  
  if (!canRecordPayment) {
    navigate('/finance');
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      
      toast({
        title: "Payment Recorded",
        description: "The payment has been successfully recorded.",
      });
      
      // Navigate back to finance page
      navigate('/finance');
    }, 1500);
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
              >
                <SelectTrigger id="student">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.class})
                    </SelectItem>
                  ))}
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
                  placeholder="e.g., 500.00" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input id="paymentDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
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
                  <RadioGroupItem value="credit_card" id="credit_card" />
                  <Label htmlFor="credit_card" className="cursor-pointer">Credit Card</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                  <Label htmlFor="bank_transfer" className="cursor-pointer">Bank Transfer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="check" id="check" />
                  <Label htmlFor="check" className="cursor-pointer">Check</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receiptNumber">Receipt Number</Label>
              <Input id="receiptNumber" placeholder="e.g., RCPT-2023-001" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input id="notes" placeholder="Any additional information about this payment" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Saving..." : "Record Payment"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
