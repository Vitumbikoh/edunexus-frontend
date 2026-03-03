import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG } from '@/config/api';

type Student = {
  id?: string;
  firstName: string;
  lastName: string;
  studentId?: string; // human readable student ID
  user?: {
    email?: string;
    username?: string;
  };
  class?: {
    name?: string;
  };
  enrollmentTerm?: {
    termNumber?: number;
    academicCalendar?: {
      term?: string;
    };
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
  };
};

export default function StudentDetails() {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [student, setStudent] = useState<Student | null>(state?.student || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStudent = async () => {
      if (!id || !token) return;
      setLoading(true);
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/student/students/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch student details');
        }
        const data = await response.json();
        setStudent(data);
      } catch {
        // Keep state fallback if request fails
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id, token]);

  if (!student && !loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          Student data not found
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => navigate('/students/view')} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Students
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Student Details</h1>
          <p className="text-muted-foreground">
            Detailed information for {student.firstName} {student.lastName}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Full Name</p>
            <p>{student.firstName} {student.lastName}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Student ID</p>
            <p>{student.studentId || '-'}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <p>
              <Badge variant={student.isActive ? 'default' : 'destructive'} className={student.isActive ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}>
                {student.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p>{student.user?.email || '-'}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Username</p>
            <p>{student.user?.username || '-'}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Class</p>
            <p>{student.class?.name || '-'}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Admission Term</p>
            <p>{student.enrollmentTerm?.termNumber ? `Term ${student.enrollmentTerm.termNumber}` : '-'}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Admission Academic Calendar</p>
            <p>{student.enrollmentTerm?.academicCalendar?.term || '-'}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Grade Level</p>
            <p>{student.gradeLevel || '-'}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
            <p>{student.dateOfBirth || '-'}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Gender</p>
            <p>{student.gender || '-'}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
            <p>{student.phoneNumber || '-'}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Address</p>
            <p>{student.address || '-'}</p>
          </div>
          {student.parent && (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Parent Name</p>
                <p>{student.parent.firstName} {student.parent.lastName}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Parent Email</p>
                <p>{student.parent.user?.email || '-'}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}