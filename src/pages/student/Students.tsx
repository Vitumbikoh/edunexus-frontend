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

interface Class {
  id: string;
  name: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  user: {
    email: string;
  };
  class?: Class;
  phoneNumber?: string;
  attendance?: number;
  performance?: string;
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
  const [searchTerm, setSearchTerm] = useState("");
  const [formFilter, setFormFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [paginatedData, setPaginatedData] = useState<PaginatedData>({
    students: [],
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

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

  useEffect(() => {
    if (canView) {
      fetchStudents(currentPage, itemsPerPage, searchTerm);
    }
  }, [currentPage, searchTerm, formFilter, canView, token]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
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
          <h1 className="text-2xl font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground">
            Showing {paginatedData.students.length} of {paginatedData.totalItems} students
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
                  <SelectItem value="Form 1">Form 1</SelectItem>
                  <SelectItem value="Form 2">Form 2</SelectItem>
                  <SelectItem value="Form 3">Form 3</SelectItem>
                  <SelectItem value="Form 4">Form 4</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search students..."
                  className="pl-8 w-[250px]"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <input id="bulk-upload" type="file" accept=".xlsx,.xls" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsUploading(true);
                try {
                  const data = await file.arrayBuffer();
                  const workbook = XLSX.read(data);
                  const sheetName = workbook.SheetNames[0];
                  const sheet = workbook.Sheets[sheetName];
                  const rows: any[] = XLSX.utils.sheet_to_json(sheet);

                  let success = 0; let failed = 0;
                  for (const row of rows) {
                    const payload: any = {
                      username: row.username,
                      email: row.email,
                      password: row.password,
                      firstName: row.firstName,
                      lastName: row.lastName,
                      phoneNumber: row.phoneNumber || undefined,
                      address: row.address || undefined,
                      dateOfBirth: row.dateOfBirth || undefined,
                      gender: row.gender || undefined,
                    };
                    const res = await fetch(`${API_CONFIG.BASE_URL}/student/students`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify(payload),
                    });
                    if (res.ok) success++; else failed++;
                  }

                  toast({ title: 'Upload complete', description: `${success} added, ${failed} failed` });
                  // refresh list
                  fetchStudents(currentPage, itemsPerPage, searchTerm);
                } catch (err) {
                  toast({ title: 'Upload failed', description: 'Could not process the file', variant: 'destructive' });
                } finally {
                  setIsUploading(false);
                  (e.target as HTMLInputElement).value = '';
                }
              }} />
              <Button variant="outline" onClick={() => document.getElementById('bulk-upload')?.click()} disabled={isUploading}>
                <Upload className="h-4 w-4 mr-2" /> {isUploading ? 'Uploading...' : 'Bulk Upload'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Performance</TableHead>
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
                          {student.attendance ? `${student.attendance}%` : '-'}
                        </TableCell>
                        <TableCell>
                          {student.performance || '-'}
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
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={currentPage === 1 ? undefined : () => handlePageChange(currentPage - 1)}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <span className="px-4">
                          Page {currentPage} of {paginatedData.totalPages}
                        </span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          onClick={currentPage === paginatedData.totalPages ? undefined : () => handlePageChange(currentPage + 1)}
                          className={currentPage === paginatedData.totalPages ? "pointer-events-none opacity-50" : ""}
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