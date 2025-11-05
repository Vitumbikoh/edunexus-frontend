import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { reportsApi } from '@/services/reportsService';
import { classService } from '@/services/classService';
import { libraryApi } from '@/services/libraryService';
import { apiClient } from '@/services/apiClient';

type LibraryReportType = 'most-borrowed' | 'overdue' | 'borrowings';

interface LibraryReportFilters {
  reportType: LibraryReportType;
  classId?: string;
  studentId?: string;
  bookId?: string;
  activeOnly?: boolean;
  dateFrom?: string;
  dateTo?: string;
  limit?: string;
  reportMode?: 'all' | 'most-borrowed' | 'overdue';
}

interface LibraryReportCardProps {
  title: string;
  description: string;
  reportType: LibraryReportType;
}

export default function LibraryReportCard({ title, description, reportType }: LibraryReportCardProps) {
  const { token, user } = useAuth();
  const [filters, setFilters] = useState<LibraryReportFilters>({
    reportType,
    activeOnly: reportType === 'borrowings' ? true : undefined,
    reportMode: 'all',
  });
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [students, setStudents] = useState<Array<{ id: string; firstName: string; lastName: string; studentId: string }>>([]);
  const [books, setBooks] = useState<Array<{ id: string; title: string; author?: string }>>([]);

  const superAdminSchoolId = user?.role === 'super_admin' ? user.schoolId : undefined;

  // Load filter options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        if (!token) return;
        
        const [classesData, booksData] = await Promise.all([
          classService.getClasses(token),
          libraryApi.listBooks({ token: token, schoolId: superAdminSchoolId }),
        ]);
        setClasses(classesData);
        setBooks(booksData);
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    };
    loadOptions();
  }, [token, superAdminSchoolId]);

  // Load students when class is selected
  useEffect(() => {
    if (filters.classId && token) {
      const loadStudents = async () => {
        try {
          // Use the admin reports students endpoint to get students for a specific class
          const params = new URLSearchParams({ classId: filters.classId });
          if (superAdminSchoolId) params.set('schoolId', superAdminSchoolId);
          
          const studentsData = await apiClient.get(
            `/admin/reports/students?${params.toString()}`,
            token
          );
          
          // Ensure studentsData is an array
          const students = Array.isArray(studentsData) ? studentsData : [];
          
          // Map the response to the expected format
          const mappedStudents = students.map((student: any) => ({
            id: student.id,
            firstName: student.firstName || student.name?.split(' ')[0] || '',
            lastName: student.lastName || student.name?.split(' ').slice(1).join(' ') || '',
            studentId: student.studentId || student.admissionNumber || student.id,
          }));
          
          setStudents(mappedStudents);
        } catch (err) {
          console.error('Failed to load students:', err);
          setStudents([]);
        }
      };
      loadStudents();
    } else {
      setStudents([]);
      setFilters(prev => ({ ...prev, studentId: undefined }));
    }
  }, [filters.classId, token, superAdminSchoolId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      let endpoint = '';
      const params = new URLSearchParams();
      
      if (superAdminSchoolId) params.set('schoolId', superAdminSchoolId);
      if (filters.classId) params.set('classId', filters.classId);
      if (filters.studentId) params.set('studentId', filters.studentId);
      if (filters.bookId) params.set('bookId', filters.bookId);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      if (filters.limit) params.set('limit', filters.limit);
      if (filters.activeOnly !== undefined) params.set('activeOnly', String(filters.activeOnly));

      // Use reportMode to determine the endpoint for borrowings report
      if (reportType === 'borrowings') {
        if (filters.reportMode === 'most-borrowed') {
          endpoint = '/admin/reports/library/most-borrowed';
        } else if (filters.reportMode === 'overdue') {
          endpoint = '/admin/reports/library/overdue';
        } else {
          endpoint = '/admin/reports/library/borrowings';
        }
      } else {
        // Fallback for other report types
        if (reportType === 'most-borrowed') {
          endpoint = '/admin/reports/library/most-borrowed';
        } else if (reportType === 'overdue') {
          endpoint = '/admin/reports/library/overdue';
        } else {
          endpoint = '/admin/reports/library/borrowings';
        }
      }

      const response = await reportsApi.fetchReportData(endpoint, params.toString(), token || undefined);
      setData(response);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (superAdminSchoolId) params.set('schoolId', superAdminSchoolId);
      if (filters.classId) params.set('classId', filters.classId);
      if (filters.studentId) params.set('studentId', filters.studentId);
      if (filters.bookId) params.set('bookId', filters.bookId);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      if (filters.limit) params.set('limit', filters.limit);
      if (filters.activeOnly !== undefined) params.set('activeOnly', String(filters.activeOnly));

      let endpoint = '';
      // Use reportMode to determine the export endpoint for borrowings report
      if (reportType === 'borrowings') {
        if (filters.reportMode === 'most-borrowed') {
          endpoint = `/admin/reports/library/most-borrowed/export/${format}`;
        } else if (filters.reportMode === 'overdue') {
          endpoint = `/admin/reports/library/overdue/export/${format}`;
        } else {
          endpoint = `/admin/reports/library/borrowings/export/${format}`;
        }
      } else {
        // Fallback for other report types
        if (reportType === 'most-borrowed') {
          endpoint = `/admin/reports/library/most-borrowed/export/${format}`;
        } else if (reportType === 'overdue') {
          endpoint = `/admin/reports/library/overdue/export/${format}`;
        } else {
          endpoint = `/admin/reports/library/borrowings/export/${format}`;
        }
      }

      await reportsApi.exportReport(endpoint, params.toString(), token || undefined);
    } catch (err: any) {
      setError(err.message || 'Failed to export');
    } finally {
      setLoading(false);
    }
  };

  const getResultSummary = () => {
    if (!data.length) return 'No records found';
    
    // Use reportMode for borrowings report type
    if (reportType === 'borrowings') {
      if (filters.reportMode === 'most-borrowed') {
        return `${data.length} most borrowed books`;
      } else if (filters.reportMode === 'overdue') {
        return `${data.length} overdue borrowings`;
      } else {
        return `${data.length} borrowing records`;
      }
    }
    
    // Fallback for other report types
    if (reportType === 'most-borrowed') {
      return `${data.length} most borrowed books`;
    } else if (reportType === 'overdue') {
      return `${data.length} overdue borrowings`;
    } else {
      return `${data.length} borrowing records`;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleExport('excel')}
              variant="outline"
              size="sm"
              disabled={loading || !data.length}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button
              onClick={() => handleExport('pdf')}
              variant="outline"
              size="sm"
              disabled={loading || !data.length}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Report Mode - First filter */}
          <div className="space-y-2">
            <Label htmlFor="reportMode">Report Type</Label>
            <Select value={filters.reportMode || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, reportMode: value as 'all' | 'most-borrowed' | 'overdue' }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Records" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Borrowings</SelectItem>
                <SelectItem value="most-borrowed">Most Borrowed Books</SelectItem>
                <SelectItem value="overdue">Overdue Books</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="class">Class</Label>
            <Select value={filters.classId || ""} onValueChange={(value) => setFilters(prev => ({ ...prev, classId: value || undefined }))}>
              <SelectTrigger>
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All classes</SelectItem>
                {classes.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filters.classId && (
            <div className="space-y-2">
              <Label htmlFor="student">Student</Label>
              <Select value={filters.studentId || ""} onValueChange={(value) => setFilters(prev => ({ ...prev, studentId: value || undefined }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All students" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All students</SelectItem>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.studentId} - {student.firstName} {student.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="book">Book</Label>
            <Select value={filters.bookId || ""} onValueChange={(value) => setFilters(prev => ({ ...prev, bookId: value || undefined }))}>
              <SelectTrigger>
                <SelectValue placeholder="All books" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All books</SelectItem>
                {books.map(book => (
                  <SelectItem key={book.id} value={book.id}>
                    {book.title} {book.author ? `by ${book.author}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status filter - always show for all modes */}
          <div className="space-y-2">
            <Label htmlFor="activeOnly">Status</Label>
            <Select 
              value={filters.activeOnly === undefined ? "" : String(filters.activeOnly)} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, activeOnly: value === "" ? undefined : value === "true" }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All borrowings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All borrowings</SelectItem>
                <SelectItem value="true">Active only</SelectItem>
                <SelectItem value="false">Returned only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date filters - always show */}
          <div className="space-y-2">
            <Label htmlFor="dateFrom">Date From</Label>
            <Input
              type="date"
              value={filters.dateFrom || ""}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value || undefined }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateTo">Date To</Label>
            <Input
              type="date"
              value={filters.dateTo || ""}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value || undefined }))}
            />
          </div>

          {/* Limit filter - show for most-borrowed mode */}
          {filters.reportMode === 'most-borrowed' && (
            <div className="space-y-2">
              <Label htmlFor="limit">Limit</Label>
              <Select value={filters.limit || ""} onValueChange={(value) => setFilters(prev => ({ ...prev, limit: value || undefined }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Top 10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="5">Top 5</SelectItem>
                  <SelectItem value="10">Top 10</SelectItem>
                  <SelectItem value="20">Top 20</SelectItem>
                  <SelectItem value="50">Top 50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Button onClick={fetchData} disabled={loading}>
            {loading ? 'Loading...' : 'Generate Report'}
          </Button>
          {data.length > 0 && (
            <Badge variant="secondary">
              {getResultSummary()}
            </Badge>
          )}
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
            {error}
          </div>
        )}

        <Separator />

        {/* Results preview */}
        {data.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Report Preview</h4>
            <div className="max-h-60 overflow-y-auto">
              <div className="grid gap-2 text-xs">
                {data.slice(0, 10).map((item, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded border">
                    {/* Use reportMode for borrowings report type */}
                    {reportType === 'borrowings' && filters.reportMode === 'most-borrowed' && (
                      <div>
                        <strong>Book ID:</strong> {item.bookId} | <strong>Borrow Count:</strong> {item.borrowCount}
                      </div>
                    )}
                    {reportType === 'borrowings' && filters.reportMode === 'overdue' && (
                      <div>
                        <strong>Student:</strong> {item.studentId} | <strong>Book:</strong> {item.bookId || item.bookName} | 
                        <strong> Due:</strong> {new Date(item.dueAt).toLocaleDateString()}
                      </div>
                    )}
                    {(reportType === 'borrowings' && (filters.reportMode === 'all' || !filters.reportMode)) && (
                      <div>
                        <strong>Student:</strong> {item.studentId} | <strong>Book:</strong> {item.bookId || item.bookName} | 
                        <strong> Status:</strong> {item.returnedAt ? 'Returned' : 'Active'} | 
                        <strong> Borrowed:</strong> {new Date(item.borrowedAt).toLocaleDateString()}
                      </div>
                    )}
                    {/* Fallback for other report types */}
                    {reportType === 'most-borrowed' && (
                      <div>
                        <strong>Book ID:</strong> {item.bookId} | <strong>Borrow Count:</strong> {item.borrowCount}
                      </div>
                    )}
                    {reportType === 'overdue' && (
                      <div>
                        <strong>Student:</strong> {item.studentId} | <strong>Book:</strong> {item.bookId || item.bookName} | 
                        <strong> Due:</strong> {new Date(item.dueAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
                {data.length > 10 && (
                  <div className="text-center text-muted-foreground">
                    ... and {data.length - 10} more records
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}