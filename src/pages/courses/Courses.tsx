// src/pages/Courses.tsx
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Download } from "lucide-react";
import { courseService } from "@/services/courseService";
import PaginationBar from "@/components/common/PaginationBar";
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
  className?: string; // Ensure className is part of the response
  teacher?: {
    firstName: string;
    lastName: string;
  };
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
  numericalName?: number;
}

export default function Courses() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paginatedData, setPaginatedData] = useState<PaginatedData>({
    courses: [],
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 9,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  const [searchPeriod, setSearchPeriod] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [classes, setClasses] = useState<ClassOption[]>([
    { id: "all", name: "All Classes" },
  ]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<Array<{ line: number; error: string }>>([]);

  const canAdd = user?.role === "admin" || user?.role === "teacher";
  const canEdit = user?.role === "admin" || user?.role === "teacher";
  const canView =
    user?.role === "admin" ||
    user?.role === "teacher" ||
    user?.role === "student";
  const canShow = canView;

  const parseClassOrder = (name?: string, numericalName?: number) => {
    if (typeof numericalName === 'number') return numericalName;
    const m = String(name || '').match(/\b(Form|Grade)\s*(\d+)/i);
    return m ? parseInt(m[2], 10) : 999;
  };

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
        throw new Error(errorData.message || "Failed to fetch classes");
      }

      const result = await response.json();
      const mapped: ClassOption[] = result.map((cls: any) => ({
        id: cls.id,
        name: cls.name,
        numericalName: typeof cls.numericalName === 'number' ? cls.numericalName : undefined,
      }));
      const sorted = mapped.sort((a, b) => {
        const na = parseClassOrder(a.name, a.numericalName);
        const nb = parseClassOrder(b.name, b.numericalName);
        if (na === nb) return String(a.name).localeCompare(String(b.name));
        return na - nb;
      });
      setClasses([{ id: 'all', name: 'All Classes' }, ...sorted]);
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

      // Fetch enrollments for student count
      const enrichedCourses = await Promise.all(
        courses.map(async (course: Course) => {
          const enrollments = await fetchEnrollments(course.id);
          return {
            ...course,
            teacherName: course.teacher
              ? `${course.teacher.firstName} ${course.teacher.lastName}`
              : "Not assigned",
            className: course.className || "Not assigned", // Use className from backend
            studentsCount: enrollments?.length || 0,
          };
        })
      );

      // Sort courses so that Form 1 (lowest class order) appears first when viewing All Classes
      const classOrderMap = new Map<string, number>();
      classes.filter(c => c.id !== 'all').forEach(c => {
        classOrderMap.set(c.id, parseClassOrder(c.name, c.numericalName));
      });
      const sortedCourses = [...enrichedCourses].sort((a: Course, b: Course) => {
        if (selectedClass === 'all') {
          const na = a.classId ? (classOrderMap.get(a.classId) ?? parseClassOrder(a.className)) : parseClassOrder(a.className);
          const nb = b.classId ? (classOrderMap.get(b.classId) ?? parseClassOrder(b.className)) : parseClassOrder(b.className);
          if (na !== nb) return na - nb;
        }
        return String(a.name).localeCompare(String(b.name));
      });

      setPaginatedData({
        courses: sortedCourses,
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
        `http://localhost:5000/api/v1/course/${courseId}/enrollments`,
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
      fetchCourses(currentPage, itemsPerPage, searchPeriod, selectedClass);
    }
  }, [currentPage, searchPeriod, selectedClass, canShow, token]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= paginatedData.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchPeriod(e.target.value);
    setCurrentPage(1);
  };

  const handleClassFilterChange = (value: string) => {
    setSelectedClass(value);
    setCurrentPage(1);
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadErrors([]);

    try {
      if (!token) throw new Error('Not authenticated');

      const result = await courseService.bulkUploadCourses(token, file);

      const created = result.summary.created;
      const failed = result.summary.failed;
      const errors = result.errors || [];

      setUploadErrors(errors);

      toast({
        title: 'Upload complete',
        description: `${created} courses added, ${failed} failed`,
        variant: failed > 0 ? 'destructive' : 'default',
      });

      // Refresh the courses list
      fetchCourses(currentPage, itemsPerPage, searchPeriod, selectedClass);
    } catch (err: any) {
      toast({
        title: 'Upload failed',
        description: err?.message || 'Could not upload courses',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      if (!token) throw new Error('Not authenticated');

      await courseService.downloadTemplate(token);

      toast({
        title: 'Template downloaded',
        description: 'Course bulk upload template has been downloaded',
      });
    } catch (err: any) {
      toast({
        title: 'Download failed',
        description: err?.message || 'Could not download template',
        variant: 'destructive',
      });
    }
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
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, paginatedData.totalItems)}-
            {Math.min(currentPage * itemsPerPage, paginatedData.totalItems)} of {paginatedData.totalItems}{" "}
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
            <>
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Template
              </Button>
              <div className="relative">
                <input
                  id="bulk-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleBulkUpload}
                  disabled={isUploading}
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('bulk-upload')?.click()}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Bulk Upload'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {apiError && (
        <div className="p-4 text-sm text-red-700adzie bg-red-100 rounded-lg">
          {apiError}
        </div>
      )}

      <div className="relative">
        <input
          type="search"
          placeholder="Search courses..."
          className="pl-8 w-full md:w-[300px] py-2 rounded-md border border-input"
          value={searchPeriod}
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

      <div className="mb-4 text-sm text-muted-foreground">
        Use the Excel template for bulk upload. The column "className" is optional but recommended for proper class assignment. Use "teacherUsername" column with usernames like "matthewsgondwe2@teacher" - leave empty for courses without assigned teachers.
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
                  <div className="space兵器space-y-4">
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

          {/* Show pagination controls if there are more items than page size or multiple pages */}
          {(paginatedData.totalPages > 1 || paginatedData.totalItems > itemsPerPage) && (
            <PaginationBar
              className="mt-6 justify-center"
              currentPage={currentPage}
              totalPages={paginatedData.totalPages}
              onPageChange={handlePageChange}
              isLoading={isLoading}
            />
          )}

          {/* Show pagination info */}
          {paginatedData.totalItems > 0 && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Page {currentPage} of {paginatedData.totalPages} • {paginatedData.totalItems} total courses
            </div>
          )}
        </>
      )}
    </div>
  );
}