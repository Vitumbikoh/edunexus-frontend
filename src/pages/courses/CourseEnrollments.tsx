import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE_URL } from '@/config/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import PaginationBar from "@/components/common/PaginationBar";

interface Enrollment {
  id: string;
  enrollmentDate: string; // Backend uses enrollmentDate, not enrolledAt
  status: string;
  student: {
    id: string;
    studentId?: string; // human readable student ID
    firstName: string;
    lastName: string;
    email?: string;
    user?: {
      email?: string;
    };
  };
}

export default function CourseEnrollments() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [course, setCourse] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setApiError(null);

      // Fetch course details
      const courseResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || 'import.meta.env.VITE_API_BASE_URL || API_BASE_URL'}`}/course/${courseId}`, // Removed extra "courses"
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!courseResponse.ok) {
        throw new Error("Failed to fetch course details");
      }

      const courseData = await courseResponse.json();
      setCourse(courseData);

      // Fetch enrollments
      const enrollmentsResponse = await fetch(
  `${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || 'import.meta.env.VITE_API_BASE_URL || API_BASE_URL'}`}/course/${courseId}/enrollments?page=${currentPage}`,  // Removed extra "courses"
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

      if (!enrollmentsResponse.ok) {
        throw new Error("Failed to fetch enrollments");
      }

      const enrollmentsData = await enrollmentsResponse.json();
      setEnrollments(enrollmentsData.enrollments);
      setTotalPages(enrollmentsData.pagination?.totalPages || 1);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch data";
      setApiError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnenroll = async (enrollmentId: string) => {
    try {
      const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || 'import.meta.env.VITE_API_BASE_URL || API_BASE_URL'}`}/course/${courseId}/enrollments/${enrollmentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to unenroll student");
      }

      toast({
        title: "Success",
        description: "Student unenrolled successfully",
        variant: "default",
      });

      fetchData(); // Refresh the list
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to unenroll student";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (courseId && token) {
      fetchData();
    }
  }, [courseId, currentPage, token]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back to Courses
          </Button>
          <h1 className="text-2xl font-bold mt-4">
            {course?.name || "Course"} Enrollments
          </h1>
          <p className="text-muted-foreground">
            {course?.code || ""} - {enrollments.length} students enrolled
          </p>
        </div>
        <Button onClick={() => navigate(`/courses/${courseId}/enroll`)}>
          Enroll New Students
        </Button>
      </div>

      {apiError && (
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {apiError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Enrolled Students</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Enrolled At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell>
                    {enrollment.student.firstName} {enrollment.student.lastName}
                  </TableCell>
                  <TableCell>{enrollment.student.studentId || '-'}</TableCell>
                  <TableCell>{enrollment.student.email || enrollment.student.user?.email || '-'}</TableCell>
                  <TableCell>
                    {enrollment.enrollmentDate ? 
                      new Date(enrollment.enrollmentDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : '-'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleUnenroll(enrollment.id)}
                    >
                      Unenroll
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <PaginationBar
          className="mt-6"
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
