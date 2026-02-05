import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Users, BookOpen, Calendar, User } from "lucide-react";
import { API_BASE_URL } from '@/config/api';

interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  status: string;
  classId?: string;
  className?: string;
  teacher?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  teacherName?: string;
  studentsCount?: number;
}

interface Enrollment {
  id: string;
  student: {
    firstName: string;
    lastName: string;
    email: string;
  };
  enrollmentDate: string; // backend returns createdAt as enrollmentDate
}

export default function CourseView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const canEdit = user?.role === "admin" || user?.role === "teacher";
  const canViewEnrollments = user?.role === "admin" || user?.role === "teacher";

  const fetchCourse = async () => {
    if (!id || !token) return;

    try {
      setIsLoading(true);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || 'import.meta.env.VITE_API_BASE_URL || API_BASE_URL'}`}/course/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch course details");
      }

      const result = await response.json();
      setCourse({
        ...result,
        teacherName: result.teacher
          ? `${result.teacher.firstName} ${result.teacher.lastName}`
          : "Not assigned",
        className: result.className || "Not assigned",
      });

      // Fetch enrollments if user has permission
      if (canViewEnrollments) {
        await fetchEnrollments();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch course details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    if (!id || !token) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || 'import.meta.env.VITE_API_BASE_URL || API_BASE_URL'}`}/course/${id}/enrollments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setEnrollments(result.enrollments || []);
      }
    } catch (error) {
      console.error("Error fetching enrollments:", error);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [id, token]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          Course not found
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/courses/view")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{course.name}</h1>
          <p className="text-muted-foreground">Course Code: {course.code}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Course Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Description
              </h4>
              <p className="text-sm">
                {course.description || "No description available"}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Status
              </h4>
              <Badge variant="secondary">{course.status}</Badge>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Class
              </h4>
              <Badge variant="outline">{course.className}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Teacher Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Assigned Teacher
              </h4>
              <Badge variant="outline">{course.teacherName}</Badge>
            </div>

            {course.teacher?.email && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Email
                </h4>
                <p className="text-sm">{course.teacher.email}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {canViewEnrollments && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Enrolled Students ({enrollments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {enrollments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {enrollments.map((enrollment) => (
                    <Card key={enrollment.id}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <h4 className="font-medium">
                            {enrollment.student.firstName} {enrollment.student.lastName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {enrollment.student.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Enrolled: {(() => {
                              const d = enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate) : null;
                              return d && !isNaN(d.getTime()) ? d.toLocaleDateString() : '-';
                            })()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No students enrolled yet.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex gap-4">
        {canEdit && (
          <Button
            variant="outline"
            onClick={() => navigate(`/courses/${course.id}/edit`)}
          >
            Edit Course
          </Button>
        )}
        {canViewEnrollments && (
          <Button
            variant="secondary"
            onClick={() => navigate(`/courses/${course.id}/enrollments`)}
          >
            Manage Enrollments
          </Button>
        )}
      </div>
    </div>
  );
}