import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
    numericalName?: number;
    description?: string;
  };
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    userId: string;
    phoneNumber?: string;
    address?: string;
  };
  date: string;
  duration: string;
  totalMarks: number;
  status: 'upcoming' | 'administered' | 'graded';
  studentsEnrolled: number;
  studentsCompleted: number;
  term: {
    id: string;
    name?: string;
    startDate: string;
    endDate: string;
    academicCalendar?: any;
    period?: any;
  };
  termId: string;
  description?: string;
  instructions?: string;
  examType: string;
  course: {
    id: string;
    name: string;
    code?: string;
    description?: string;
    status?: string;
    enrollmentCount?: number;
  };
  schoolId: string;
}

export default function ExamDetails() {
  const { examId } = useParams<{ examId: string }>();
  const { token, user } = useAuth();
  const location = useLocation();
  const [exam, setExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [gradedStudentsCount, setGradedStudentsCount] = useState<number>(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Function to get the correct back navigation path based on user role and context
  const getBackNavigationPath = () => {
    // Check if we came from a course-specific exam page
    const referrer = document.referrer;
    const currentOrigin = window.location.origin;
    
    if (referrer && referrer.startsWith(currentOrigin)) {
      const referrerPath = referrer.replace(currentOrigin, '');
      
      // If we came from course-specific exams (/my-exams?courseId=...), go back there
      if (referrerPath.includes('/my-exams?courseId=')) {
        const courseId = new URLSearchParams(referrerPath.split('?')[1]).get('courseId');
        if (courseId) {
          return `/my-exams?courseId=${courseId}`;
        }
      }
      
      // If we came from the main teacher exams page (/teacher/exams), go back there
      if (referrerPath === '/teacher/exams') {
        return '/teacher/exams';
      }
    }
    
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      return '/courses/exams';
    } else if (user?.role === 'teacher') {
      return '/teacher/exams';
    }
    // Default fallback
    return '/courses/exams';
  };

  // Function to get the correct back button text based on context
  const getBackButtonText = () => {
    const referrer = document.referrer;
    const currentOrigin = window.location.origin;
    
    if (referrer && referrer.startsWith(currentOrigin)) {
      const referrerPath = referrer.replace(currentOrigin, '');
      
      // If we came from course-specific exams, return "Back to Course Exams"
      if (referrerPath.includes('/my-exams?courseId=')) {
        return 'Back to Course Exams';
      }
      
      // If we came from the main teacher exams page, return "Back to My Exams"  
      if (referrerPath === '/teacher/exams') {
        return 'Back to My Exams';
      }
    }
    
    // Default text
    return 'Back to Exams';
  };

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

  const fetchGradedStudentsCount = async (examId: string, enrollmentCount?: number) => {
    try {
      const gradesResponse = await fetchWithAuth(`http://localhost:5000/api/v1/grades/filtered?examId=${examId}`);
      let count = 0;
      
      if (gradesResponse && typeof gradesResponse === 'object') {
        // New optimized response shape: { gradedCount }
        if (typeof gradesResponse.gradedCount === 'number') {
          count = gradesResponse.gradedCount;
        } else if (gradesResponse.student && gradesResponse.results) {
          count = gradesResponse.results.length;
        } else if (gradesResponse.students && Array.isArray(gradesResponse.students)) {
          count = gradesResponse.students.reduce((total: number, student: any) => {
            return total + (student.results ? student.results.length : 0);
          }, 0);
        } else {
          count = 0;
        }
      } else if (Array.isArray(gradesResponse)) {
        count = gradesResponse.length;
      } else {
        count = 0;
      }

      // Do NOT default to enrollment when count is zero; a zero means genuinely no published grades yet.
      // We'll only fallback in the catch block if the request itself fails.
      
      setGradedStudentsCount(count);
    } catch (error) {
      console.error('Failed to fetch graded students count:', error);
      // Only fallback to enrollment count if we explicitly want to display at least something.
      // This preserves transparency: network/API failure vs genuine zero grades.
      setGradedStudentsCount(0);
    }
  };

  useEffect(() => {
    const fetchExamDetails = async () => {
      if (!examId || !token) {
        toast({
          title: 'Error',
          description: 'Invalid exam ID or not authenticated',
          variant: 'destructive',
        });
        navigate(getBackNavigationPath());
        return;
      }

      try {
        setIsLoading(true);
  const examData = await fetchWithAuth(`http://localhost:5000/api/v1/exams/${examId}`);
        console.log('Exam details API response:', examData);
        
        // Validate the exam data structure
        if (!examData || typeof examData !== 'object') {
          throw new Error('Invalid exam data received from server');
        }
        
        // Ensure required fields exist
        if (!examData.id || !examData.title) {
          throw new Error('Incomplete exam data received from server');
        }
        
        // Normalize server response to ensure term is accessible and course present
        const normalized = {
          ...examData,
          term: examData.term || examData.Term || null,
        };
        setExam(normalized);
        
        // Fetch graded students count for graded exams
        if (normalized.status === 'graded') {
          await fetchGradedStudentsCount(examId, normalized.course?.enrollmentCount);
        }
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
          navigate(getBackNavigationPath());
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

  if (renderError) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">Error displaying exam details</div>
          <div className="text-sm text-muted-foreground mb-4">{renderError}</div>
          <Button onClick={() => navigate(getBackNavigationPath())}>{getBackButtonText()}</Button>
        </div>
      </div>
    );
  }

  try {

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(getBackNavigationPath())}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {getBackButtonText()}
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
                <h3 className="font-semibold">Course</h3>
                <p className="text-sm">{exam.course?.name || 'Unknown Course'}</p>
              </div>
              <div>
                <h3 className="font-semibold">Class</h3>
                <p className="text-sm">{exam.class?.name || 'Unknown Class'}</p>
              </div>
              <div>
                <h3 className="font-semibold">Teacher</h3>
                <p className="text-sm">{exam.teacher ? `${exam.teacher.firstName} ${exam.teacher.lastName}` : 'Unknown Teacher'}</p>
              </div>
              {/* Course already displayed above */}
              <div>
                <h3 className="font-semibold">Date</h3>
                <p className="text-sm">{exam.date ? new Date(exam.date).toLocaleDateString() : 'Not scheduled'}</p>
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
                <h3 className="font-semibold">
                  {exam.status === 'upcoming' || exam.status === 'administered'
                    ? 'Students enrolled in that course' 
                    : exam.status === 'graded'
                    ? 'Students Enrolled/graded'
                    : 'Students Enrolled/Completed'
                  }
                </h3>
                <p className="text-sm flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {exam.status === 'upcoming' || exam.status === 'administered'
                    ? (exam.course?.enrollmentCount || 0)
                    : exam.status === 'graded'
                    ? `${exam.course?.enrollmentCount || 0}/${gradedStudentsCount}`
                    : `${exam.studentsCompleted}/${exam.studentsEnrolled}`
                  }
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Term</h3>
                <p className="text-sm">
                  {exam.term?.name || (exam.term?.startDate && exam.term?.endDate
                    ? `${new Date(exam.term.startDate).toLocaleDateString()} - ${new Date(exam.term.endDate).toLocaleDateString()}`
                    : 'Unknown Term')}
                </p>
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
  } catch (error: any) {
    console.error('Error rendering exam details:', error);
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">Error displaying exam details</div>
          <div className="text-sm text-muted-foreground mb-4">{error.message || 'An unexpected error occurred'}</div>
          <Button onClick={() => navigate(getBackNavigationPath())}>{getBackButtonText()}</Button>
        </div>
      </div>
    );
  }
}