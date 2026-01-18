import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Eye, Pencil, Upload } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import PaginationBar from "@/components/common/PaginationBar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as XLSX from 'xlsx';
import { API_CONFIG } from '@/config/api';
import { TablePreloader } from '@/components/ui/preloader';

interface Class {
  id: string;
  name: string;
}

interface Student {
  id: string;
  studentId?: string; // human readable student ID
  firstName: string;
  lastName: string;
  user: {
    email: string;
    username?: string;
  };
  class?: Class;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  parent?: {
    firstName: string;
    lastName: string;
    user: {
      email: string;
    };
  };
}

interface PaginatedData {
  students: Student[];
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface StudentStats {
  totalStudents: number;
  classBreakdown: Array<{
    className: string;
    count: number;
  }>;
  graduatedStudents: number;
}

export default function Students() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchPeriod, setSearchPeriod] = useState("");
  const [formFilter, setFormFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedData, setPaginatedData] = useState<PaginatedData>({
    students: [],
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<Array<{ line: number; error: string }>>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Permission checks
  const canAddStudent = user?.role === "admin" || user?.role === "teacher";
  const canEdit = user?.role === "admin" || user?.role === "teacher";
  const canView = user?.role !== "finance"; // All except finance
  const canViewStats = user?.role === "admin";

  const fetchStudents = async (page: number, limit: number, search: string = "") => {
    try {
      setIsLoading(true);
      setApiError(null);

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      const url = `${API_CONFIG.BASE_URL}/student/students?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}${formFilter ? `&form=${encodeURIComponent(formFilter)}` : ""}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate('/login');
        throw new Error("Session expired. Please log in again.");
      }

      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }

      const result = await response.json();
      setPaginatedData({
        students: result.students,
        totalPages: result.pagination.totalPages,
        totalItems: result.pagination.totalItems,
        itemsPerPage: result.pagination.itemsPerPage,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch students";
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

  const fetchClasses = async () => {
    try {
      if (!token) return;
      const response = await fetch(`${API_CONFIG.BASE_URL}/classes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const classesData = await response.json();
        setClasses(classesData);
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    }
  };

  const fetchStudentStats = async () => {
    if (!canViewStats || !token) return;

    try {
      setStatsLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/student/students/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStudentStats(result.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch student statistics:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      fetchStudents(currentPage, itemsPerPage, searchPeriod);
    }
  }, [currentPage, itemsPerPage, searchPeriod, formFilter, canView, token]);

  useEffect(() => {
    fetchClasses();
    if (canViewStats) {
      fetchStudentStats();
    }
  }, [token, canViewStats]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchPeriod(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= paginatedData.totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          You do not have permission to view students.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Students</h1>
          <p className="text-muted-foreground">
            View and manage your students
          </p>
        </div>
      </div>

      {/* Student Statistics - Admin Only */}
      {canViewStats && (
        <div className="space-y-6">
          {/* Statistics Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {/* Total Students Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-blue-700">Total Students</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {statsLoading ? "..." : studentStats?.totalStudents || 0}
                    </p>
                  </div>
                  <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Class Cards - Show all classes, even if no students */}
            {statsLoading ? (
              // Loading placeholders
              Array.from({ length: 4 }, (_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
                        <div className="h-6 bg-gray-200 rounded w-8"></div>
                      </div>
                      <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              [...classes]
                .sort((a, b) => {
                  // Extract form number from class name (e.g., "Form One" -> 1, "Form Two" -> 2)
                  const getFormNumber = (name: string) => {
                    const match = name.match(/Form\s+(\w+)/i);
                    if (!match) return 999; // Put non-form classes at the end
                    
                    const numWord = match[1].toLowerCase();
                    const numMap: { [key: string]: number } = {
                      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6
                    };
                    return numMap[numWord] || 999;
                  };
                  
                  return getFormNumber(a.name) - getFormNumber(b.name);
                })
                .map((classItem, index) => {
                // Find the count for this class from classBreakdown, default to 0
                const classStat = studentStats?.classBreakdown?.find(cb => cb.className === classItem.name);
                const count = classStat?.count || 0;

                return (
                  <Card key={classItem.id} className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-green-700">{classItem.name}</p>
                          <p className="text-2xl font-bold text-green-900">{count}</p>
                        </div>
                        <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}

            {/* Graduated Students Card - Last in the row */}
            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-purple-700">Graduated</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {statsLoading ? "..." : studentStats?.graduatedStudents || 0}
                    </p>
                  </div>
                  <div className="h-10 w-10 bg-purple-500 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {apiError && (
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {apiError}
        </div>
      )}
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <CardTitle>Students List</CardTitle>
            <div className="flex items-center gap-3">
              <Select value={formFilter} onValueChange={(v) => { setFormFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Forms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Forms</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.name}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search students..."
                  className="pl-8 w-[250px]"
                  value={searchPeriod}
                  onChange={handleSearchChange}
                />
              </div>
              <input id="bulk-upload" type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsUploading(true);
                setUploadErrors([]);
                try {
                  if (!token) throw new Error('Not authenticated');
                  const formData = new FormData();
                  formData.append('file', file);
                  const res = await fetch(`${API_CONFIG.BASE_URL}/student/students/bulk-upload`, {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                  });
                  if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || 'Bulk upload failed');
                  }
                  const result = await res.json();
                  const created = result?.summary?.created ?? 0;
                  const failed = result?.summary?.failed ?? 0;
                  const errs = (result?.errors || []) as Array<{ line: number; error: string }>;
                  setUploadErrors(errs);
                  toast({ title: 'Upload complete', description: `${created} added, ${failed} failed` });
                  // refresh list
                  fetchStudents(currentPage, itemsPerPage, searchPeriod);
                } catch (err: any) {
                  toast({ title: 'Upload failed', description: err?.message || 'Could not process the file', variant: 'destructive' });
                } finally {
                  setIsUploading(false);
                  (e.target as HTMLInputElement).value = '';
                }
              }} />
              <Button variant="outline" onClick={() => document.getElementById('bulk-upload')?.click()} disabled={isUploading}>
                <Upload className="h-4 w-4 mr-2" /> {isUploading ? 'Uploading...' : 'Bulk Upload'}
              </Button>
              <Button
                variant="secondary"
                disabled={isUploading}
                onClick={async () => {
                  try {
                    const url = `${API_CONFIG.BASE_URL}/student/students/template`;
                    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                    if (!resp.ok) throw new Error('Failed to download template');
                    const blob = await resp.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = blobUrl;
                    a.download = 'student-bulk-template.xlsx';
                    a.click();
                    URL.revokeObjectURL(blobUrl);
                  } catch (e: any) {
                    toast({ title: 'Download failed', description: e?.message || 'Could not download template', variant: 'destructive' });
                  }
                }}
              >
                Download Template
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-sm text-muted-foreground">
            Use the Excel template for bulk upload. The column "class" is required and must match the class name in the system (e.g., Form one, Form two, Form Three). Rows without a class will fail with "class not provided".
          </div>
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Guardian</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TablePreloader colSpan={6} text="Loading students..." />
              </TableBody>
            </Table>
          ) : (
            <>
              {uploadErrors.length > 0 && (
                <div className="mb-4 p-3 rounded border border-yellow-300 bg-yellow-50 text-yellow-900 text-sm max-h-48 overflow-auto">
                  <div className="font-semibold mb-1">Upload issues ({uploadErrors.length}):</div>
                  <ul className="list-disc pl-5 space-y-1">
                    {uploadErrors.map((e, idx) => (
                      <li key={idx}>Row {e.line}: {e.error}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.students.length > 0 ? (
                    paginatedData.students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell>
                          {student.class?.name || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {student.user?.email || '-'}
                        </TableCell>
                        <TableCell>
                          {student.user?.username || '-'}
                        </TableCell>
                        <TableCell>
                          {student.studentId || '-'}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/students/${student.id}`} state={{ student }}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                          {canEdit && (
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/students/${student.id}/edit`}>
                                <Pencil className="h-4 w-4 mr-1" />
                                Edit
                              </Link>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No students found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {paginatedData.totalPages > 1 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Show</span>
                      <Select 
                        value={itemsPerPage.toString()} 
                        onValueChange={(value) => {
                          setItemsPerPage(Number(value));
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">per page</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, paginatedData.totalItems)} of {paginatedData.totalItems} students
                      </span>
                    </div>
                  </div>
                  
                  <PaginationBar
                    className="mt-4"
                    currentPage={currentPage}
                    totalPages={paginatedData.totalPages}
                    onPageChange={handlePageChange}
                    isLoading={isLoading}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}