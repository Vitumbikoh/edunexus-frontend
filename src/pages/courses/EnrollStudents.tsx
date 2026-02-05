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
import { Check } from "lucide-react";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  className: string; // Use className instead of classId
}

interface Course {
  id: string;
  name: string;
  code: string;
  class: { id: string; name: string } | null; // Update to reflect class object
}

export default function EnrollStudents() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setApiError(null);

      // Fetch course details
      const courseResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || 'import.meta.env.VITE_API_BASE_URL || API_BASE_URL'}`}/course/${courseId}`,
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

      // Fetch students in the same class but not enrolled
      const studentsResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || 'import.meta.env.VITE_API_BASE_URL || API_BASE_URL'}`}/course/${courseId}/enrollable-students`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!studentsResponse.ok) {
        throw new Error("Failed to fetch students");
      }

      const studentsData = await studentsResponse.json();
      setStudents(studentsData.students || []);
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

  const handleEnroll = async (studentId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || 'import.meta.env.VITE_API_BASE_URL || API_BASE_URL'}`}/enrollments/${courseId}/enroll/${studentId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to enroll student");
      }

      toast({
        title: "Success",
        description: "Student enrolled successfully",
        variant: "default",
      });

      fetchData(); // Refresh the list
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to enroll student";
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
  }, [courseId, token]);

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
            Back to Enrollments
          </Button>
          <h1 className="text-2xl font-bold mt-4">
            Enroll Students - {course?.name || "Course"}
          </h1>
          <p className="text-muted-foreground">
            {course?.code || ""} - Class: {course?.class?.name || "Not assigned"}
          </p>
        </div>
      </div>

      {apiError && (
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {apiError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Available Students</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    {student.firstName} {student.lastName}
                  </TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.className || "Not assigned"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleEnroll(student.id)}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Enroll
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}