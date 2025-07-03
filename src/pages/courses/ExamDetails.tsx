import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';

interface Exam {
  id: string;
  title: string;
  subject: string;
  class: {
    id: string;
    name: string;
  };
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    userId: string;
  };
  date: string;
  duration: string;
  totalMarks: number;
  status: 'upcoming' | 'administered' | 'graded';
  studentsEnrolled: number;
  studentsCompleted: number;
  academicYear: string;
  description?: string;
  instructions?: string;
  examType: string;
  course: {
    id: string;
    name: string;
  };
}

export default function ExamDetails() {
  const { examId } = useParams<{ examId: string }>();
  const { token } = useAuth();
  const [exam, setExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchWithAuth = async (url: string) => {
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please log in again');
      }
      if (response.status === 403) {
        throw new Error('Access Denied - Insufficient permissions');
      }
      if (response.status === 404) {
        throw new Error('Exam not found');
      }
      throw new Error(`Request failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
  };

  useEffect(() => {
    const fetchExamDetails = async () => {
      if (!examId || !token) {
        toast({
          title: 'Error',
          description: 'Invalid exam ID or not authenticated',
          variant: 'destructive',
        });
        navigate('/exams');
        return;
      }

      try {
        setIsLoading(true);
        const examData = await fetchWithAuth(`http://localhost:5000/api/v1/exams/${examId}`);
        console.log('Exam details API response:', examData);
        setExam(examData);
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to fetch exam details';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        if (errorMessage.includes('Unauthorized')) {
          navigate('/login');
        } else {
          navigate('/exams');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchExamDetails();
  }, [examId, token, toast, navigate]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Upcoming</Badge>;
      case 'administered':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Administered</Badge>;
      case 'graded':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Graded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8">Loading exam details...</div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8 text-red-600">Exam not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/exams')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Exams
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{exam.title}</h1>
          <p className="text-muted-foreground">Detailed information for the exam</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exam Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold">ID</h3>
                <p className="text-sm text-muted-foreground">{exam.id}</p>
              </div>
              <div>
                <h3 className="font-semibold">Title</h3>
                <p className="text-sm">{exam.title}</p>
              </div>
              <div>
                <h3 className="font-semibold">Subject</h3>
                <p className="text-sm">{exam.subject}</p>
              </div>
              <div>
                <h3 className="font-semibold">Class</h3>
                <p className="text-sm">{exam.class?.name || 'Unknown Class'}</p>
              </div>
              <div>
                <h3 className="font-semibold">Teacher</h3>
                <p className="text-sm">{`${exam.teacher.firstName} ${exam.teacher.lastName}`}</p>
              </div>
              <div>
                <h3 className="font-semibold">Course</h3>
                <p className="text-sm">{exam.course?.name || 'Unknown Course'}</p>
              </div>
              <div>
                <h3 className="font-semibold">Date</h3>
                <p className="text-sm">{new Date(exam.date).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="font-semibold">Duration</h3>
                <p className="text-sm">{exam.duration}</p>
              </div>
              <div>
                <h3 className="font-semibold">Total Marks</h3>
                <p className="text-sm">{exam.totalMarks}</p>
              </div>
              <div>
                <h3 className="font-semibold">Status</h3>
                <p className="text-sm">{getStatusBadge(exam.status)}</p>
              </div>
              <div>
                <h3 className="font-semibold">Students Enrolled/Completed</h3>
                <p className="text-sm flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {exam.studentsCompleted}/{exam.studentsEnrolled}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Academic Year</h3>
                <p className="text-sm">{exam.academicYear}</p>
              </div>
              <div>
                <h3 className="font-semibold">Exam Type</h3>
                <p className="text-sm">{exam.examType || 'Not specified'}</p>
              </div>
            </div>
            {exam.description && (
              <div>
                <h3 className="font-semibold">Description</h3>
                <p className="text-sm whitespace-pre-wrap">{exam.description}</p>
              </div>
            )}
            {exam.instructions && (
              <div>
                <h3 className="font-semibold">Instructions</h3>
                <p className="text-sm whitespace-pre-wrap">{exam.instructions}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}