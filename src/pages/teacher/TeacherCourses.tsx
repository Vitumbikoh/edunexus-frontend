import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  Upload,
  BookOpen,
  FileText,
  Plus,
  Calendar,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import PaginationBar from "@/components/common/PaginationBar";
import { useToast } from "@/components/ui/use-toast";
import { API_CONFIG } from '@/config/api';
import { Preloader } from "@/components/ui/preloader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchBar } from "@/components/ui/search-bar";

export default function TeacherCourses() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [classes, setClasses] = useState([]);
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

  const fetchCourses = async (_pageNum: number, _searchTerm: string, classId: string, isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setIsFetching(true);
      }
      setError(null);

      const params = new URLSearchParams({
        // Fetch a large page once; paginate locally for instant search
        page: '1',
        limit: '500',
        includeExams: 'true',
      });

      // Do not pass search to server; we filter client-side for instant UX

      if (classId && classId !== 'all' && classId.trim() !== '') {
        params.append('classId', classId);
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/teacher/my-courses?${params}`,
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

      // Build class order map for sorting courses by Form/Grade
      const classOrderMap = new Map<string, number>();
      (classes || []).forEach((c: any) => {
        const num = typeof c.numericalName === 'number' ? c.numericalName : (parseInt(String(c.name).match(/\b(Form|Grade)\s*(\d+)/i)?.[2] || '999', 10));
        classOrderMap.set(c.id, num);
      });
      const sortedCourses = [...(data.courses || [])].sort((a: any, b: any) => {
        if (selectedClassId === 'all') {
          const na = a.class?.id ? (classOrderMap.get(a.class.id) ?? 999) : 999;
          const nb = b.class?.id ? (classOrderMap.get(b.class.id) ?? 999) : 999;
          if (na !== nb) return na - nb;
        }
        return String(a.name).localeCompare(String(b.name));
      });
      setCourses(sortedCourses);
      // Derive pagination client-side
      setPagination({
        currentPage: 1,
        totalPages: Math.max(1, Math.ceil(sortedCourses.length / limit)),
        totalItems: sortedCourses.length,
        itemsPerPage: limit,
      });
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
      if (isInitial) {
        setLoading(false);
        setInitialized(true);
      } else {
        setIsFetching(false);
      }
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/teacher/my-classes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const sorted = [...(data.classes || [])].sort((a: any, b: any) => {
            const na = typeof a.numericalName === 'number' ? a.numericalName : (parseInt(String(a.name).match(/\b(Form|Grade)\s*(\d+)/i)?.[2] || '999', 10));
            const nb = typeof b.numericalName === 'number' ? b.numericalName : (parseInt(String(b.name).match(/\b(Form|Grade)\s*(\d+)/i)?.[2] || '999', 10));
            if (na === nb) return String(a.name).localeCompare(String(b.name));
            return na - nb;
          });
          setClasses(sorted);
        }
      }
    } catch (err) {
      console.error("Failed to fetch classes:", err);
    }
  };

  // Initial load: fetch classes and initial courses without unmounting controls later
  useEffect(() => {
    if (token) {
      fetchClasses();
      fetchCourses(page, search, selectedClassId, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Subsequent updates: keep controls mounted; only fetch data on class changes
  useEffect(() => {
    if (!token || !initialized) return;
    fetchCourses(1, search, selectedClassId, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId]);

  const handleDebouncedSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleClassFilter = (classId: string) => {
    setSelectedClassId(classId);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1) {
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
        <Preloader variant="skeleton" rows={4} className="space-y-6" />
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

  // Compute filtered and paginated items for instant client-side search
  const q = (searchInput || '').trim().toLowerCase();
  const filteredCourses = q
    ? courses.filter((c: any) => {
        const name = String(c.name || '').toLowerCase();
        const desc = String(c.description || '').toLowerCase();
        const cls = String(c.class?.name || '').toLowerCase();
        return name.includes(q) || desc.includes(q) || cls.includes(q);
      })
    : courses;
  const totalPagesComputed = Math.max(1, Math.ceil(filteredCourses.length / limit));
  const safePage = Math.min(page, totalPagesComputed);
  const start = (safePage - 1) * limit;
  const pageItems = filteredCourses.slice(start, start + limit);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Courses</h1>
          <p className="text-muted-foreground">Manage your teaching courses</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative max-w-sm">
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              onDebouncedChange={handleDebouncedSearch}
              delay={300}
              placeholder="Search courses..."
              inputClassName="w-64"
            />
          </div>
          <div className="w-48">
            <Select value={selectedClassId} onValueChange={handleClassFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls: any) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isFetching ? (
        <Preloader variant="skeleton" rows={4} className="space-y-6" />
      ) : filteredCourses.length === 0 ? (
        <div className="text-center p-8 rounded-lg bg-muted">
          <p className="text-muted-foreground">No courses found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pageItems.map((course: any) => (
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

                  <div className="pt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() =>
                        navigate(`/learning-materials?courseId=${course.id}${course.class?.id ? `&classId=${course.class.id}` : ''}`)
                      }
                    >
                      <Upload className="h-4 w-4" />
                      Upload Materials
                    </Button>
                    {course.hasUngradedExams && (
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
                      onClick={() => navigate(`/courses/${course.id}`)}
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

      {totalPagesComputed > 1 && (
        <PaginationBar
          className="mt-6"
          currentPage={page}
          totalPages={totalPagesComputed}
          onPageChange={handlePageChange}
          isLoading={loading}
        />
      )}
    </div>
  );
}
