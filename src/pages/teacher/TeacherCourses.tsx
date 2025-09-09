import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  Upload,
  BookOpen,
  FileText,
  Search,
  Plus,
  Calendar,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/components/ui/use-toast";
import { API_CONFIG } from '@/config/api';

export default function TeacherCourses() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: limit,
  });

  if (!user || user.role !== "teacher") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  const fetchCourses = async (pageNum: number, searchPeriod: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/teacher/my-courses?page=${pageNum}&limit=${limit}${
          searchPeriod ? `&search=${encodeURIComponent(searchPeriod)}` : ""
        }&includeExams=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        throw new Error("Unauthorized - Please log in again");
      }

      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error("Failed to fetch courses");
      }

      setCourses(data.courses);
      setPagination(data.pagination);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load courses";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses(page, search);
  }, [page, search, token]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Courses</h1>
          <p className="text-muted-foreground">Manage your teaching courses</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="h-6 bg-gray-200 animate-pulse rounded"></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-4 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-4 bg-gray-200 animate-pulse rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Courses</h1>
        <p className="text-muted-foreground">Manage your teaching courses</p>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={handleSearch}
            className="pl-10"
          />
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="text-center p-8 rounded-lg bg-muted">
          <p className="text-muted-foreground">No courses found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course: any) => (
            <Card key={course.id}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="mr-2 h-5 w-5" />
                  {course.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Classes
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {course.class ? (
                        <Badge variant="secondary">
                          Class {course.class.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline">No class assigned</Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Description
                    </h4>
                    <p className="text-sm">
                      {course.description || "No description available"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="bg-muted rounded-md px-3 py-2 text-sm">
                      <span className="font-medium text-muted-foreground">
                        Materials:
                      </span>{" "}
                      {course.materials || 0}
                    </div>
                    <div className="bg-muted rounded-md px-3 py-2 text-sm">
                      <span className="font-medium text-muted-foreground">
                        Students:
                      </span>{" "}
                      {course.totalStudents}
                    </div>
                    <div className="bg-muted rounded-md px-3 py-2 text-sm">
                      <span className="font-medium text-muted-foreground">
                        Exams:
                      </span>{" "}
                      {course.examsCount || 0}
                    </div>
                  </div>

                  {/* Recent Exams removed; exams are visible on the View Exams page */}

                  <div className="pt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() =>
                        navigate(`/learning-materials?courseId=${course.id}`)
                      }
                    >
                      <Upload className="h-4 w-4" />
                      Upload Materials
                    </Button>
                    {/* Grade students only when there are exams */}
                    {course.examsCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() =>
                          navigate(`/submit-grades?courseId=${course.id}` , {
                            state: {
                              prefill: {
                                courseId: course.id,
                                classId: course.class?.id,
                                courseName: course.name,
                                className: course.class?.name,
                              }
                            }
                          })
                        }
                      >
                        <FileText className="h-4 w-4" />
                        Grade Students
                      </Button>
                    )}
                    {course.examsCount > 0 && (
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-2"
                        onClick={() => navigate(`/my-exams?courseId=${course.id}`)}
                      >
                        <FileText className="h-4 w-4" />
                        View Exams
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() =>
                        navigate(`/courses/${course.id}/create-exam`, {
                          state: {
                            course: {
                              id: course.id,
                              class: course.class,
                              teacher: {
                                name: user?.name || "Unknown Teacher",
                              },
                              name: course.name,
                            },
                          },
                        })
                      }
                    >
                      <Plus className="h-4 w-4" />
                      Create Exams
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => navigate(`/course-details/${course.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={() => handlePageChange(page - 1)}
                className={page === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {[...Array(pagination.totalPages)].map((_, index) => (
              <PaginationItem key={index}>
                <PaginationLink
                  href="#"
                  onClick={() => handlePageChange(index + 1)}
                  isActive={page === index + 1}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={() => handlePageChange(page + 1)}
                className={
                  page === pagination.totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
