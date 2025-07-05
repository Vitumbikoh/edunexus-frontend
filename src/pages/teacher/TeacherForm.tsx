import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Save } from "lucide-react";

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  address?: string;
  qualification?: string;
  subjectSpecialization?: string;
  dateOfBirth?: string;
  gender?: string;
  hireDate?: string;
  yearsOfExperience: number;
  status: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

export default function TeacherForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
    qualification: '',
    subjectSpecialization: '',
    dateOfBirth: '',
    gender: '',
    hireDate: '',
    yearsOfExperience: 0,
    status: 'active',
    username: '',
    email: '',
    password: '',
    role: 'TEACHER',
  });
  const isEditMode = !!id;

  // Check permissions
  const canAddOrEdit = user?.role === "admin";
  
  if (!canAddOrEdit) {
    navigate('/teachers');
    return null;
  }

  // Fetch teacher data in edit mode
  useEffect(() => {
    if (isEditMode && id && token) {
      const fetchTeacher = async () => {
        try {
          setIsSubmitting(true);
          setApiError(null);

          const response = await fetch(`http://localhost:5000/api/v1/teacher/teachers/${id}`, {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });

          if (response.status === 401) {
            localStorage.removeItem("token");
            navigate('/login');
            return;
          }

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch teacher details");
          }

          const result: Teacher = await response.json();
          setFormData({
            firstName: result.firstName || '',
            lastName: result.lastName || '',
            phoneNumber: result.phoneNumber || '',
            address: result.address || '',
            qualification: result.qualification || '',
            subjectSpecialization: result.subjectSpecialization || '',
            dateOfBirth: result.dateOfBirth ? result.dateOfBirth.split('T')[0] : '',
            gender: result.gender || '',
            hireDate: result.hireDate ? result.hireDate.split('T')[0] : '',
            yearsOfExperience: result.yearsOfExperience || 0,
            status: result.status || 'active',
            username: result.user?.username || '',
            email: result.user?.email || '',
            password: '', // Do not pre-fill password
            role: result.user?.role || 'TEACHER',
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to fetch teacher details";
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

      fetchTeacher();
    }
  }, [id, token, navigate, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: id === 'yearsOfExperience' ? Number(value) : value,
    }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError(null);

    try {
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      const requestBody = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password || undefined, // Only include password if provided
        username: formData.username,
        phoneNumber: formData.phoneNumber || null,
        address: formData.address || null,
        qualification: formData.qualification || null,
        subjectSpecialization: formData.subjectSpecialization || null,
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        hireDate: formData.hireDate || null,
        yearsOfExperience: Number(formData.yearsOfExperience) || 0,
        status: formData.status,
        role: formData.role,
      };

      if (isNaN(requestBody.yearsOfExperience)) {
        throw new Error("Years of experience must be a valid number");
      }

      const url = isEditMode
        ? `http://localhost:5000/api/v1/teacher/teachers/${id}`
        : `http://localhost:5000/api/v1/teacher/teachers`;
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isEditMode ? 'update' : 'add'} teacher`);
      }

      toast({
        title: isEditMode ? "Teacher Updated" : "Teacher Added",
        description: `Teacher has been successfully ${isEditMode ? 'updated' : 'added'}.`,
        variant: "default",
      });

      navigate('/teachers');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${isEditMode ? 'update' : 'add'} teacher`;
      setApiError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      if (errorMessage.includes("Unauthorized") || errorMessage.includes("token")) {
        navigate('/login');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => navigate('/teachers/view')} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Teachers
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isEditMode ? 'Edit Teacher' : 'Add New Teacher'}</h1>
          <p className="text-muted-foreground">
            {isEditMode ? 'Update teacher information' : 'Create a new teacher account'}
          </p>
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
            <CardTitle>Teacher Information</CardTitle>
            <CardDescription>
              {isEditMode ? 'Update the information for the teacher.' : 'Enter the information for the new teacher.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                  placeholder="Smith" 
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input 
                  id="username" 
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="john.smith" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john.smith@example.com" 
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="password">{isEditMode ? 'New Password (optional)' : 'Password *'}</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••" 
                  required={!isEditMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input 
                  id="phoneNumber" 
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className=" clutch grid-cols-1 md:grid-cols-2 gap-6">
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
                <Label htmlFor="hireDate">Hire Date</Label>
                <Input 
                  id="hireDate" 
                  type="date" 
                  value={formData.hireDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                <Input 
                  id="yearsOfExperience" 
                  type="number" 
                  min="0" 
                  step="1"
                  value={formData.yearsOfExperience}
                  onChange={handleChange}
                  placeholder="e.g., 5" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subjectSpecialization">Subject Specialization</Label>
                <Input 
                  id="subjectSpecialization" 
                  value={formData.subjectSpecialization}
                  onChange={handleChange}
                  placeholder="e.g., Mathematics, Physics" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qualification">Qualifications</Label>
              <Input 
                id="qualification" 
                value={formData.qualification}
                onChange={handleChange}
                placeholder="e.g., PhD in Mathematics, MSc in Physics" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea 
                id="address" 
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Main St, City, Country" 
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update Teacher' : 'Save Teacher')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}