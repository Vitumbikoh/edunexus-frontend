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

  // Fetch students from the API
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!token || !user) {
          throw new Error("Authentication required");
        }

        const response = await fetch(
          `${API_CONFIG.BASE_URL}/teacher/my-students`,
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
  }, [token, user, toast]);

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
    new Set(students.map((student) => student.class?.name || "Unassigned"))
  ).filter(Boolean);

  // Filter students based on search and class selection
  let filteredStudents = students.filter((student) => {
    const matchesSearch = searchQuery
      ? `${student.firstName} ${student.lastName}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        student.user.email.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesClass = selectedClass
      ? student.class?.name === selectedClass ||
        (selectedClass === "Unassigned" && !student.class)
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
                  {teacherClasses.map((className) => (
                    <SelectItem key={className} value={className}>
                      {className}
                    </SelectItem>
                  ))}
                  <SelectItem value="Unassigned">Unassigned</SelectItem>
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
