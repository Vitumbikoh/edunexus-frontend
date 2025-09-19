import React, { useEffect, useState } from "react";
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
import { Search, Eye, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/components/ui/use-toast";

interface FinanceOfficer {
  id: string;
  firstName: string;
  lastName: string;
  username?: string;
  email: string;
  phoneNumber?: string;
  department?: string;
  canApproveBudgets: boolean;
  canProcessPayments: boolean;
  status: string;
  hireDate: string;
}

interface PaginatedData {
  financeOfficers: FinanceOfficer[];
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function FinanceOfficers() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchPeriod, setSearchPeriod] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [paginatedData, setPaginatedData] = useState<PaginatedData>({
    financeOfficers: [],
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const canAdd = user?.role === "admin";
  const canEdit = user?.role === "admin";
  const canView = user?.role === "admin" || user?.role === "finance";
  const canShow = canView;

  // In your frontend component
  const fetchFinanceOfficers = async (
    page: number,
    limit: number,
    search: string = ""
  ) => {
    try {
      setIsLoading(true);
      setApiError(null);

      const response = await fetch(
        `http://localhost:5000/api/v1/finance/officers?page=${page}&limit=${limit}&search=${encodeURIComponent(
          search
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch finance officers"
        );
      }

      const result = await response.json();

      setPaginatedData({
        financeOfficers: result.financeOfficers,
        totalPages: result.pagination.totalPages,
        totalItems: result.pagination.totalItems,
        itemsPerPage: result.pagination.itemsPerPage,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch finance officers";
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
      fetchFinanceOfficers(currentPage, itemsPerPage, searchPeriod);
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
          You do not have permission to view finance officers.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Finance Officers</h1>
          <p className="text-muted-foreground">
            Showing {paginatedData.financeOfficers.length} of{" "}
            {paginatedData.totalItems} officers
          </p>
        </div>
        {canAdd && (
          <Button asChild>
            <Link to="/finance/new">Add New Officer</Link>
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
            <CardTitle>Finance Department</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search finance officers..."
                className="pl-8 w-[250px]"
                value={searchPeriod}
                onChange={handleSearchChange}
              />
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
                    <TableHead>Username</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Department</TableHead>
                    {/* <TableHead>Permissions</TableHead> */}
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.financeOfficers.length > 0 ? (
                    paginatedData.financeOfficers.map((officer) => (
                      <TableRow key={officer.id}>
                        <TableCell className="font-medium">
                          {officer.firstName} {officer.lastName}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            @{officer.username || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {officer.email}
                          </div>
                          {officer.phoneNumber && (
                            <div className="text-sm">{officer.phoneNumber}</div>
                          )}
                        </TableCell>
                        <TableCell>{officer.department || "-"}</TableCell>
                        {/* <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {officer.canApproveBudgets && (
                              <Badge variant="secondary">Budget Approval</Badge>
                            )}
                            {officer.canProcessPayments && (
                              <Badge variant="secondary">
                                Payment Processing
                              </Badge>
                            )}
                            {!officer.canApproveBudgets &&
                              !officer.canProcessPayments && (
                                <span className="text-sm text-muted-foreground">
                                  No special permissions
                                </span>
                              )}
                          </div>
                        </TableCell> */}
                        <TableCell>
                          <Badge
                            variant={
                              officer.status === "active"
                                ? "default"
                                : officer.status === "on-leave"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {officer.status.charAt(0).toUpperCase() +
                              officer.status.slice(1)}
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            Hired:{" "}
                            {new Date(officer.hireDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/finance/officers/${officer.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                          {canEdit && (
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/finance/officers/${officer.id}/edit`}>
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
                        No finance officers found
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
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
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
                          aria-disabled={
                            currentPage === paginatedData.totalPages
                          }
                          tabIndex={
                            currentPage === paginatedData.totalPages ? -1 : 0
                          }
                          className={
                            currentPage === paginatedData.totalPages
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
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
