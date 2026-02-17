import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, User, BookOpen } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { API_CONFIG } from '@/config/api';
import { Preloader } from "@/components/ui/preloader";

interface StudentDetails {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  user: {
    email: string;
    username: string;
  };
  class?: {
    name: string;
  };
  gradeLevel?: string;
  dateOfBirth?: string;
  gender?: string;
  phoneNumber?: string;
  address?: string;
  isActive?: boolean;
  parent?: {
    firstName: string;
    lastName: string;
    user?: {
      email?: string;
    };
    phoneNumber?: string;
  };
  attendance?: number;
  performance?: string;
}

export default function TeacherStudentDetails() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toast } = useToast();

  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Always fetch complete student details from API
  useEffect(() => {
    if (id) {
      fetchStudentDetails();
    } else {
      setError("Student ID not provided");
      setIsLoading(false);
    }
  }, [id]);

  // Optional: Use location state for immediate display while API loads
  useEffect(() => {
    const studentFromState = location.state?.student;
    if (studentFromState && !student) {
      // Use state data temporarily while API loads
      setStudent(studentFromState);
    }
  }, [location.state, student]);

  const fetchStudentDetails = async () => {
    if (!id || !token) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/teacher/students/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch student details: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.student) {
        setStudent(data.student);
      } else {
        throw new Error(data.message || "Failed to fetch student details");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch student details";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate('/my-students')} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Students
          </Button>
        </div>
        <Preloader variant="spinner" size="md" text="Loading student details..." height="16rem" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate('/my-students')} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Students
          </Button>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
            {error || "Student data not found"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => navigate('/my-students')} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Students
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Student Details</h1>
          <p className="text-muted-foreground">View detailed information about {student.firstName} {student.lastName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Student Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Student ID</label>
                <p className="text-lg font-semibold">{student.studentId || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <p className="text-lg font-semibold">{student.firstName} {student.lastName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p>
                  <Badge variant={student.isActive ? 'default' : 'destructive'} className={student.isActive ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}>
                    {student.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="flex items-center">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                  {student.user?.email || "Not provided"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Class</label>
                <p className="flex items-center">
                  <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                  {student.class?.name || "Unassigned"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                <p className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "Not provided"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Gender</label>
                <p className="capitalize">{student.gender || "Not specified"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                <p className="flex items-center">
                  <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                  {student.phoneNumber || "Not provided"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Address</label>
                <p className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                  {student.address || "Not provided"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Academic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Grade Level</label>
              <p className="text-lg font-semibold">{student.gradeLevel || "Not specified"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Attendance Rate</label>
              <p className="text-lg font-semibold">
                {student.attendance ? `${student.attendance}%` : "Not available"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Performance</label>
              <p className="text-lg font-semibold">{student.performance || "Not evaluated"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parent Information */}
      {student.parent && (
        <Card>
          <CardHeader>
            <CardTitle>Parent/Guardian Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="font-semibold">{student.parent.firstName} {student.parent.lastName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p>{student.parent.user?.email || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                <p>{student.parent.phoneNumber || "Not provided"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => navigate('/my-students')}>
          Back to Students
        </Button>
        <Button 
          variant="outline" 
          onClick={() => toast({
            title: "Coming Soon",
            description: "Student grades view will be available soon.",
            variant: "default",
          })}
        >
          View Grades
        </Button>
        <Button 
          variant="outline" 
          onClick={() => toast({
            title: "Coming Soon", 
            description: "Student attendance view will be available soon.",
            variant: "default",
          })}
        >
          View Attendance
        </Button>
      </div>
    </div>
  );
}