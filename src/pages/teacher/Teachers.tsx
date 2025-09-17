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
import { Search, Eye, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/use-toast";
import { API_CONFIG } from '@/config/api';
import { TablePreloader } from "@/components/ui/preloader";

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  address?: string;
  qualification?: string;
  subjectSpecialization?: string;
  dateOfBirth?: string;
  gender?: string;
  hireDate?: string;
  yearsOfExperience: number;
  status: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

interface PaginatedData {
  teachers: Teacher[];
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function Teachers() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchPeriod, setSearchPeriod] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [paginatedData, setPaginatedData] = useState<PaginatedData>({
    teachers: [],
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const canAdd = user?.role === "admin";
  const canEdit = user?.role === "admin";
  const canView = user?.role === "admin" || user?.role === "teacher";
  const canShow = canView;

  const fetchTeachers = async (page: number, limit: number, search: string = "") => {
    try {
      setIsLoading(true);
      setApiError(null);

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/teacher/teachers?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate('/login');
        throw new Error("Session expired. Please log in again.");
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch teachers");
      }

      const result = await response.json();
      setPaginatedData({
        teachers: result.teachers,
        totalPages: result.pagination.totalPages,
        totalItems: result.pagination.totalItems,
        itemsPerPage: result.pagination.itemsPerPage,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch teachers";
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
    if (canShow) {
      fetchTeachers(currentPage, itemsPerPage, searchPeriod);
    }
  }, [currentPage, searchPeriod, canShow, token]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchPeriod(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= paginatedData.totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (!canShow) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          You do not have permission to view teachers.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Teachers</h1>
          <p className="text-muted-foreground">
            Showing {paginatedData.teachers.length} of {paginatedData.totalItems} teachers
          </p>
        </div>
        {canAdd && (
          <Button asChild>
            <Link to="/teachers/add">Add New Teacher</Link>
          </Button>
        )}
      </div>

      {apiError && (
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {apiError}
        </div>
      )}
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Teaching Staff</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search teachers..."
                className="pl-8 w-[250px]"
                value={searchPeriod}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TablePreloader colSpan={6} text="Loading teachers..." />
              </TableBody>
            </Table>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.teachers.length > 0 ? (
                    paginatedData.teachers.map((teacher) => (
                      <TableRow key={teacher.id}>
                        <TableCell className="font-medium">
                          {teacher.firstName} {teacher.lastName}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">{teacher.user.email}</div>
                          {teacher.phoneNumber && (
                            <div className="text-sm">{teacher.phoneNumber}</div>
                          )}
                        </TableCell>
                        <TableCell>{teacher.subjectSpecialization || '-'}</TableCell>
                        <TableCell>
                          {teacher.yearsOfExperience} years
                          <div className="text-sm text-muted-foreground">
                            Hired: {new Date(teacher.hireDate || '').toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={teacher.status === 'active' ? 'default' : 
                                    teacher.status === 'on-leave' ? 'secondary' : 'destructive'}
                          >
                            {teacher.status.charAt(0).toUpperCase() + teacher.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/teachers/${teacher.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {canEdit && (
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/teachers/${teacher.id}/edit`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                          )} 
                          {canEdit && (
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No teachers found
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
                          onClick={() => {
                            if (currentPage !== 1) {
                              handlePageChange(currentPage - 1);
                            }
                          }}
                          aria-disabled={currentPage === 1}
                          tabIndex={currentPage === 1 ? -1 : 0}
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
                          onClick={() => {
                            if (currentPage !== paginatedData.totalPages) {
                              handlePageChange(currentPage + 1);
                            }
                          }}
                          aria-disabled={currentPage === paginatedData.totalPages}
                          tabIndex={currentPage === paginatedData.totalPages ? -1 : 0}
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