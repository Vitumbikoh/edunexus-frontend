import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  };
  enrollments?: {
    student: {
      firstName: string;
      lastName: string;
    };
  }[];
  teacherName?: string;
  studentsCount?: number;
}

interface PaginatedData {
  courses: Course[];
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface ClassOption {
  id: string;
  name: string;
}

export default function Courses() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paginatedData, setPaginatedData] = useState<PaginatedData>({
    courses: [],
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [classes, setClasses] = useState<ClassOption[]>([
    { id: "all", name: "All Classes" },
  ]);

  const canAdd = user?.role === "admin" || user?.role === "teacher";
  const canEdit = user?.role === "admin" || user?.role === "teacher";
  const canView =
    user?.role === "admin" ||
    user?.role === "teacher" ||
    user?.role === "student";
  const canShow = canView;

  const fetchClasses = async () => {
    try {
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      const response = await fetch("http://localhost:5000/api/v1/classes", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to fetch classes:", errorData);
        throw new Error(errorData.message || "Failed to fetch classes");
      }

      const result = await response.json();

      console.log("Classes API response:", result); // Debugging log

      if (!Array.isArray(result)) {
        console.error("Unexpected response format - expected array:", result);
        throw new Error("Invalid data format received from server");
      }

      setClasses((prev) => [
        { id: "all", name: "All Classes" },
        ...result.map((cls) => ({
          id: cls.id,
          name: cls.name,
        })),
      ]);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to fetch classes",
        variant: "destructive",
      });
    }
  };

  const fetchCourses = async (
    page: number,
    limit: number,
    search: string = "",
    classFilter: string = "all"
  ) => {
    try {
      setIsLoading(true);
      setApiError(null);

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      let url = `http://localhost:5000/api/v1/course/courses?page=${page}&limit=${limit}&search=${encodeURIComponent(
        search
      )}`;

      if (classFilter !== "all") {
        url += `&classId=${classFilter}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        throw new Error("Session expired. Please log in again.");
      }

      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }

      const result = await response.json();

      const courses = Array.isArray(result?.courses) ? result.courses : [];

      // Fetch additional details for each course
      const enrichedCourses = await Promise.all(
        courses.map(async (course: Course) => {
          // Get teacher name if available
          const teacherName = course.teacher
            ? `${course.teacher.firstName} ${course.teacher.lastName}`
            : "Not assigned";

          // Get class name
          const className = course.classId
            ? classes.find((c) => c.id === course.classId)?.name ||
              course.classId
            : "Not assigned";

          // Get enrolled students count
          const enrollments = await fetchEnrollments(course.id);

          return {
            ...course,
            teacherName,
            className,
            studentsCount: enrollments?.length || 0,
          };
        })
      );

      setPaginatedData({
        courses: enrichedCourses,
        totalPages: result.pagination?.totalPages || 1,
        totalItems: result.pagination?.totalItems || courses.length,
        itemsPerPage: result.pagination?.itemsPerPage || limit,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch courses";
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

  const fetchEnrollments = async (courseId: string) => {
    try {
      if (!token) return [];

      const response = await fetch(
        `http://localhost:5000/api/v1/course/courses/${courseId}/enrollments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch enrollments");
      }

      const result = await response.json();
      return result.enrollments || [];
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      return [];
    }
  };

  useEffect(() => {
    if (canShow) {
      fetchClasses();
    }
  }, [canShow, token]);

  useEffect(() => {
    if (canShow) {
      fetchCourses(currentPage, itemsPerPage, searchTerm, selectedClass);
    }
  }, [currentPage, searchTerm, selectedClass, canShow, token]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= paginatedData.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleClassFilterChange = (value: string) => {
    setSelectedClass(value);
    setCurrentPage(1);
  };

  const handleEnrollClick = (courseId: string) => {
    navigate(`/courses/${courseId}/enrollments`);
  };

  if (!canShow) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          You do not have permission to view courses.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Courses</h1>
          <p className="text-muted-foreground">
            Showing {paginatedData.courses.length} of {paginatedData.totalItems}{" "}
            courses
          </p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedClass} onValueChange={handleClassFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((classOption) => (
                <SelectItem key={classOption.id} value={classOption.id}>
                  {classOption.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canAdd && (
            <Button onClick={() => navigate("/courses/new")}>
              Add New Course
            </Button>
          )}
        </div>
      </div>

      {apiError && (
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {apiError}
        </div>
      )}

      <div className="relative">
        <input
          type="search"
          placeholder="Search courses..."
          className="pl-8 w-full md:w-[300px] py-2 rounded-md border border-input"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedData.courses.map((course) => (
              <Card key={course.id}>
                <CardHeader>
                  <CardTitle>{course.name}</CardTitle>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      {course.code}
                    </span>
                    <Badge variant="outline">{course.className}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Teacher
                      </h4>
                      <Badge variant="outline">{course.teacherName}</Badge>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Details
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{course.status}</Badge>
                        <Badge variant="secondary">
                          {course.studentsCount} students
                        </Badge>
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

                    <div className="pt-2 flex justify-end gap-2">
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/courses/${course.id}/edit`)}
                        >
                          Edit
                        </Button>
                      )}
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => navigate(`/courses/${course.id}`)}
                      >
                        View
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEnrollClick(course.id)}
                      >
                        Enrollments
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {paginatedData.totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => {
                        if (currentPage > 1) handlePageChange(currentPage - 1);
                      }}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="px-4">
                      Page {currentPage} of {paginatedData.totalPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => {
                        if (currentPage < paginatedData.totalPages)
                          handlePageChange(currentPage + 1);
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
}
