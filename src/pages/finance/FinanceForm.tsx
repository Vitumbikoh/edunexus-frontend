import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { API_CONFIG } from '@/config/api';

interface FinanceData {
  id?: string;
  username?: string; // read-only on edit
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  department: string;
  canApproveBudgets: boolean;
  canProcessPayments: boolean;
}

export default function FinanceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { state } = useLocation();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [isLoadingFinance, setIsLoadingFinance] = React.useState(!!id);
  const [showPassword, setShowPassword] = React.useState(false);

  const [formData, setFormData] = React.useState<FinanceData>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    department: '',
    canApproveBudgets: false,
    canProcessPayments: true
  });

  // Check permissions - only admins should be able to add/edit finance staff
  const canManageFinance = user?.role === "admin";
  
  React.useEffect(() => {
    if (!canManageFinance) {
      navigate('/finance');
      return;
    }

    // If we have finance data in state (from the list view), use it
    if (state?.finance) {
      const { finance } = state;
      setFormData({
        username: finance.user?.username || '',
        email: finance.user?.email || finance.email || '',
        password: '',
        firstName: finance.firstName || '',
        lastName: finance.lastName || '',
        phoneNumber: finance.phoneNumber || '',
        address: finance.address || '',
        dateOfBirth: finance.dateOfBirth ? finance.dateOfBirth.split('T')[0] : '',
        gender: finance.gender || '',
        department: finance.department || '',
        canApproveBudgets: finance.canApproveBudgets || false,
        canProcessPayments: finance.canProcessPayments !== false
      });
      setIsLoadingFinance(false);
    } else if (id) {
      // If we have an ID but no state, fetch the finance data
      fetchFinance();
    }
  }, [token, canManageFinance, navigate, id, state]);

  const fetchFinance = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/finance/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch finance staff");
      }

      const finance = await response.json();
      setFormData({
        username: finance.user?.username || '',
        email: finance.user?.email || finance.email || '',
        password: '',
        firstName: finance.firstName || '',
        lastName: finance.lastName || '',
        phoneNumber: finance.phoneNumber || '',
        address: finance.address || '',
        dateOfBirth: finance.dateOfBirth ? finance.dateOfBirth.split('T')[0] : '',
        gender: finance.gender || '',
        department: finance.department || '',
        canApproveBudgets: finance.canApproveBudgets || false,
        canProcessPayments: finance.canProcessPayments !== false
      });
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Failed to fetch finance staff");
    } finally {
      setIsLoadingFinance(false);
    }
  };

  if (!canManageFinance) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [id]: checked
    }));
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError(null);

    // Validate required fields
  if (!formData.email || !formData.firstName || !formData.lastName) {
      setApiError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    // Only validate password for new finance staff
    if (!id && !formData.password) {
      setApiError("Password is required for new finance staff");
      setIsSubmitting(false);
      return;
    }

    try {
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      const requestBody: any = {
        email: formData.email,
        password: formData.password || undefined, // Only include password for new finance staff
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber || undefined,
        address: formData.address || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        department: formData.department || undefined,
        canApproveBudgets: formData.canApproveBudgets,
        canProcessPayments: formData.canProcessPayments
      };

      // Include username only on update if backend expects it (deriving from email local-part)
      if (id && formData.username) {
        requestBody.username = formData.username;
      }

      const url = id 
        ? `${API_CONFIG.BASE_URL}/finance/${id}`
        : `${API_CONFIG.BASE_URL}/finance`;
      
      const method = id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate('/login');
        throw new Error("Session expired. Please log in again.");
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${id ? 'update' : 'add'} finance staff`);
      }

      const result = await response.json();
      
      toast({
        title: id ? "Finance Staff Updated" : "Finance Staff Added",
        description: id 
          ? "Finance staff has been successfully updated." 
          : "New finance staff has been successfully added.",
        variant: "default",
      });
      
  navigate('/finance/officers/view');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${id ? 'update' : 'add'} finance staff`;
      setApiError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingFinance) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => navigate('/finance')} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Finance Staff
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {id ? 'Edit Finance Staff' : 'Add New Finance Staff'}
          </h1>
          <p className="text-muted-foreground">
            {id ? 'Update finance staff information' : 'Create a new finance staff account'}
          </p>
        </div>
      </div>

      {apiError && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {apiError}
        </div>
      )}

  <Card className="overflow-visible">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Finance Staff Information</CardTitle>
            <CardDescription>
              {id ? 'Update the finance staff information' : 'Enter the information for the new finance staff'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {id && (
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username || ''}
                    disabled
                    placeholder="auto-generated"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john.doe@example.com" 
                  required 
                />
              </div>
            </div>

            {!id && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      required={!id}
                    />
                    <button
                      type="button"
                      onClick={toggleShowPassword}
                      className="absolute right-2 top-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {/* Empty div to maintain grid layout */}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input 
                  id="firstName" 
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input 
                  id="lastName" 
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe" 
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input 
                  id="dateOfBirth" 
                  type="date" 
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select 
                  value={formData.gender}
                  onValueChange={(value) => handleSelectChange('gender', value)}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input 
                  id="department" 
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Finance Department" 
                />
              </div>
              <div className="space-y-2">
                {/* Empty div to maintain grid layout */}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input 
                  id="phoneNumber" 
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address" 
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main St, City, Country" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="canApproveBudgets"
                  checked={formData.canApproveBudgets}
                  onCheckedChange={(checked) => handleCheckboxChange('canApproveBudgets', checked as boolean)}
                />
                <Label htmlFor="canApproveBudgets">Can Approve Budgets</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="canProcessPayments"
                  checked={formData.canProcessPayments}
                  onCheckedChange={(checked) => handleCheckboxChange('canProcessPayments', checked as boolean)}
                />
                <Label htmlFor="canProcessPayments">Can Process Payments</Label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Saving..." : id ? "Update Finance Staff" : "Save Finance Staff"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}