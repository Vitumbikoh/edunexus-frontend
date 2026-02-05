import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { PagePreloader } from "@/components/ui/preloader";
import { API_BASE_URL } from '@/config/api';

interface Class {
  id: string;
  name: string;
  numericalName: number;
}

interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  user: {
    email: string;
  };
}

interface StudentData {
  id?: string;
  email: string; // now optional in validation (can be blank)
  password?: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  classId: string;
  parentId: string;
}

export default function StudentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { state } = useLocation();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [parents, setParents] = React.useState<Parent[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = React.useState(true);
  const [isLoadingParents, setIsLoadingParents] = React.useState(true);
  const [isLoadingStudent, setIsLoadingStudent] = React.useState(!!id);
  const [showPassword, setShowPassword] = React.useState(false);

  const [formData, setFormData] = React.useState<StudentData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    classId: '',
    parentId: ''
  });

  // Check permissions
  const canAddStudent = user?.role === "admin" || user?.role === "teacher";
  
  React.useEffect(() => {
    if (!canAddStudent) {
      navigate('/students/view');
      return;
    }

    // If we have student data in state (from the list view), use it
    if (state?.student) {
      const { student } = state;
      setFormData({
        email: student.user?.email || '',
        password: '',
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        phoneNumber: student.phoneNumber || '',
        address: student.address || '',
        dateOfBirth: student.dateOfBirth || '',
        gender: student.gender || '',
        classId: student.class?.id || '',
        parentId: student.parent?.id || ''
      });
      setIsLoadingStudent(false);
    } else if (id) {
      // If we have an ID but no state, fetch the student data
      fetchStudent();
    }

    fetchClasses();
    fetchParents();
  }, [token, canAddStudent, navigate, id, state]);

  const fetchStudent = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || 'import.meta.env.VITE_API_BASE_URL || API_BASE_URL'}`}/student/students/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch student");
      }

      const student = await response.json();
      setFormData({
        email: student.user?.email || '',
        password: '',
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        phoneNumber: student.phoneNumber || '',
        address: student.address || '',
        dateOfBirth: student.dateOfBirth || '',
        gender: student.gender || '',
        classId: student.class?.id || '',
        parentId: student.parent?.id || ''
      });
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Failed to fetch student");
    } finally {
      setIsLoadingStudent(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || 'import.meta.env.VITE_API_BASE_URL || API_BASE_URL'}`}/classes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch classes");
      }

      const data = await response.json();
      setClasses(data);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Failed to fetch classes");
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const fetchParents = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || 'import.meta.env.VITE_API_BASE_URL || API_BASE_URL'}`}/parents`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch parents");
      }

      const data = await response.json();
      setParents(data);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Failed to fetch parents");
    } finally {
      setIsLoadingParents(false);
    }
  };

  if (!canAddStudent) {
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

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError(null);

    // Validate required fields (username removed, email optional)
    if (!formData.firstName || !formData.lastName) {
      setApiError("First name and last name are required");
      setIsSubmitting(false);
      return;
    }

    // Only validate password for new students
    if (!id && !formData.password) {
      setApiError("Password is required for new students");
      setIsSubmitting(false);
      return;
    }

    try {
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      const requestBody = {
        // username removed (server should auto-generate if needed)
        email: formData.email || undefined, // omit if blank
        password: formData.password || undefined, // Only include password for new students
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber || undefined,
        address: formData.address || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        classId: formData.classId || undefined,
        parentId: formData.parentId || undefined
      };

      const url = id 
        ? `${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || 'import.meta.env.VITE_API_BASE_URL || API_BASE_URL'}`}/student/students/${id}`
        : `${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || 'import.meta.env.VITE_API_BASE_URL || API_BASE_URL'}`}/student/students`;
      
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
        throw new Error(errorData.message || `Failed to ${id ? 'update' : 'add'} student`);
      }

      const result = await response.json();
      
      toast({
        title: id ? "Student Updated" : "Student Added",
        description: id 
          ? "Student has been successfully updated." 
          : "New student has been successfully added.",
        variant: "default",
      });
      
      navigate('/students/view');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${id ? 'update' : 'add'} student`;
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

  if (isLoadingStudent) {
    return <PagePreloader text="Loading student details..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => navigate('/students/view')} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Students
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {id ? 'Edit Student' : 'Add New Student'}
          </h1>
          <p className="text-muted-foreground">
            {id ? 'Update student information' : 'Create a new student account'}
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
            <CardTitle>Student Information</CardTitle>
            <CardDescription>
              {id ? 'Update the student information' : 'Enter the information for the new student'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john.doe@example.com" 
                />
              </div>
              <div className="space-y-2">
                {/* Empty to keep grid symmetry */}
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
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="classId">Class</Label>
                <Select 
                  value={formData.classId}
                  onValueChange={(value) => handleSelectChange('classId', value)}
                  disabled={isLoadingClasses}
                >
                  <SelectTrigger id="classId">
                    <SelectValue 
                      placeholder={isLoadingClasses ? "Loading classes..." : "Select class"} 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} (Grade {cls.numericalName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentId">Parent</Label>
                <Select 
                  value={formData.parentId}
                  onValueChange={(value) => handleSelectChange('parentId', value)}
                  disabled={isLoadingParents}
                >
                  <SelectTrigger id="parentId">
                    <SelectValue 
                      placeholder={isLoadingParents ? "Loading parents..." : "Select parent"} 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {parents.map((parent) => (
                      <SelectItem key={parent.id} value={parent.id}>
                        {parent.firstName} {parent.lastName} ({parent.user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Saving..." : id ? "Update Student" : "Save Student"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}