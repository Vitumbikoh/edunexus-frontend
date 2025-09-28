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
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
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

  // Permission checks
  const canAddStudent = user?.role === "admin" || user?.role === "teacher";
  const canEdit = user?.role === "admin" || user?.role === "teacher";
  const canView = user?.role !== "finance"; // All except finance

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

  useEffect(() => {
    if (canView) {
      fetchStudents(currentPage, itemsPerPage, searchPeriod);
    }
  }, [currentPage, itemsPerPage, searchPeriod, formFilter, canView, token]);

  useEffect(() => {
    fetchClasses();
  }, [token]);

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
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">
            {paginatedData.totalItems}
          </div>
          <p className="text-sm text-muted-foreground">
            Total Students
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
                  
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={currentPage === 1 ? undefined : () => handlePageChange(currentPage - 1)}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, paginatedData.totalPages) }, (_, i) => {
                        let pageNum;
                        if (paginatedData.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= paginatedData.totalPages - 2) {
                          pageNum = paginatedData.totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <PaginationItem key={pageNum}>
                            <Button
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className="w-10"
                            >
                              {pageNum}
                            </Button>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext
                          onClick={currentPage === paginatedData.totalPages ? undefined : () => handlePageChange(currentPage + 1)}
                          className={currentPage === paginatedData.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}