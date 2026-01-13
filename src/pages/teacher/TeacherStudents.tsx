import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import PaginationBar from "@/components/common/PaginationBar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { API_CONFIG } from '@/config/api';
import { Preloader } from "@/components/ui/preloader";
import { useNavigate } from "react-router-dom";

interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  user: {
    email: string;
  };
  class?: {
    name: string;
  };
  attendance?: number;
  performance?: string;
}

export default function TeacherStudents() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [allClasses, setAllClasses] = useState<string[]>([]);

  // Fetch students from the API
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!token || !user) {
          throw new Error("Authentication required");
        }

        // Fetch 10 students per page with server-side pagination
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(itemsPerPage),
          ...(searchQuery ? { search: searchQuery } : {}),
          ...(selectedClass ? { class: selectedClass } : {}),
        });
        const response = await fetch(
          `${API_CONFIG.BASE_URL}/teacher/my-students?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.status === 403) {
          const errorData = await response.json();
          throw new Error(
            errorData.message ||
              "You don't have permission to view these students"
          );
        }

        if (!response.ok) {
          throw new Error(
            `Failed to fetch students (${response.status}): ${response.statusText}`
          );
        }

        const data = await response.json();
        if (data.success && data.students) {
          setStudents(data.students);
          if (data.pagination) {
            setCurrentPage(data.pagination.currentPage || 1);
            setTotalPages(data.pagination.totalPages || 1);
            setTotalItems(data.pagination.totalItems || data.students.length || 0);
            setItemsPerPage(data.pagination.itemsPerPage || 10);
          }
        } else {
          throw new Error(data.message || "Invalid response format");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch students";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === "teacher") {
      fetchStudents();
    }
  }, [token, user, toast, currentPage, searchQuery, selectedClass]);

  // Fetch all classes available to the teacher (independent of pagination)
  useEffect(() => {
    const fetchAllClasses = async () => {
      try {
        if (!token || !user) return;
        const params = new URLSearchParams({ page: "1", limit: "5000" });
        const response = await fetch(
          `${API_CONFIG.BASE_URL}/teacher/my-students?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) return;
        const data = await response.json();
        if (data?.students) {
          const classes = Array.from(
            new Set(
              data.students
                .map((s: Student) => s.class?.name)
                .filter((n: string | undefined): n is string => Boolean(n))
            )
          );
          setAllClasses(classes);
        }
      } catch {}
    };
    if (user?.role === "teacher") {
      fetchAllClasses();
    }
  }, [token, user]);

  // Reset to first page when class filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClass]);

  if (!user || user.role !== "teacher") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  // Get unique classes from the students
  const teacherClasses = Array.from(
    new Set(students.map((student) => student.class?.name).filter(Boolean))
  );

  // Filter students based on search and class selection
  let filteredStudents = students.filter((student) => {
    const matchesSearch = searchQuery
      ? `${student.firstName} ${student.lastName}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        student.user.email.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesClass = selectedClass
      ? student.class?.name === selectedClass
      : true;

    return matchesSearch && matchesClass;
  });

  // Handle view details button click
  const handleViewDetails = (student: Student) => {
    // Navigate to student details page with student data
    navigate(`/teacher/students/${student.id}`, { state: { student } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Students</h1>
        <p className="text-muted-foreground">View and manage your students</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Student List
            </CardTitle>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search students..."
                  className="pl-8 w-full md:w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
                  {(allClasses.length ? allClasses : teacherClasses).map((className) => (
                    <SelectItem key={className} value={className}>
                      {className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Preloader variant="skeleton" rows={4} className="space-y-6" />
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : filteredStudents.length > 0 ? (
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {student.studentId || "N/A"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {student.firstName} {student.lastName}
                    </TableCell>
                    <TableCell>{student.class?.name || "Unassigned"}</TableCell>
                    <TableCell>{student.user?.email || "-"}</TableCell>
                    <TableCell>
                      {student.attendance ? `${student.attendance}%` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewDetails(student)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              isLoading={isLoading}
              className="mt-4"
            />
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? "No students found matching your search."
                : "You don't have any students assigned."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
