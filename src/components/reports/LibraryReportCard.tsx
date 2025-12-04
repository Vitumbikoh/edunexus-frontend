import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Download, FileSpreadsheet, Loader2, BookOpen, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { classService } from '@/services/classService';
import { libraryApi } from '@/services/libraryService';
import { apiClient } from '@/services/apiClient';



interface LibraryReportCardProps {
  onGenerateReport: (format: "excel" | "pdf", type: string) => void;
  generatingCategory?: { category: string; format: 'excel' | 'pdf' } | null;
}

export default function LibraryReportCard({ 
  onGenerateReport, 
  generatingCategory 
}: LibraryReportCardProps) {
  const { token, user } = useAuth();
  const [filters, setFilters] = useState({
    reportMode: 'all',
    classId: '',
    studentId: '',
    bookId: '',
    activeOnly: true,
    dateFrom: '',
    dateTo: '',
    limit: '',
  });
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [students, setStudents] = useState<Array<{ id: string; firstName: string; lastName: string; studentId: string }>>([]);
  const [books, setBooks] = useState<Array<{ id: string; title: string; author?: string }>>([]);

  const superAdminSchoolId = user?.role === 'super_admin' ? user.schoolId : undefined;

  // Load filter options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        if (!token) return;
        
        const [classesData, booksResponse] = await Promise.all([
          classService.getClasses(token),
          libraryApi.listBooks({ token: token, schoolId: superAdminSchoolId }),
        ]);
        setClasses(Array.isArray(classesData) ? classesData : []);
        setBooks(Array.isArray(booksResponse.books) ? booksResponse.books : []);
      } catch (err) {
        console.error('Failed to load filter options:', err);
        setClasses([]);
        setBooks([]);
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
      setFilters(prev => ({ ...prev, studentId: '' }));
    }
  }, [filters.classId, token, superAdminSchoolId]);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Library Report</CardTitle>
            <p className="text-muted-foreground text-sm">Book borrowings and library analytics</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex flex-col h-full space-y-4">
        <p className="text-muted-foreground text-sm">
          Comprehensive library reports including borrowings, overdue books, and popular books analytics.
        </p>
        
        {/* Library Filters */}
        <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Filter Options
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-foreground">Report Type</Label>
              <Select value={filters.reportMode || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, reportMode: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Borrowings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Borrowings</SelectItem>
                  <SelectItem value="most-borrowed">Most Borrowed Books</SelectItem>
                  <SelectItem value="overdue">Overdue Books</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-foreground">Class</Label>
              <Select value={filters.classId} onValueChange={(value) => setFilters(prev => ({ ...prev, classId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All classes</SelectItem>
                  {Array.isArray(classes) && classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-foreground">Book</Label>
              <Select value={filters.bookId} onValueChange={(value) => setFilters(prev => ({ ...prev, bookId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All books" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All books</SelectItem>
                  {Array.isArray(books) && books.map(book => (
                    <SelectItem key={book.id} value={book.id}>
                      {book.title} {book.author ? `by ${book.author}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-foreground">Status</Label>
              <Select value={String(filters.activeOnly)} onValueChange={(value) => setFilters(prev => ({ ...prev, activeOnly: value === "true" }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Active only" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active only</SelectItem>
                  <SelectItem value="false">Returned only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Spacer to push buttons to bottom */}
        <div className="flex-1" />

        {/* Action buttons positioned at bottom */}
        <div className="flex gap-2 pt-4 mt-auto">
          <Button
            onClick={() => onGenerateReport("excel", "library")}
            disabled={!!generatingCategory}
            size="sm"
            className="flex-1"
          >
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            {generatingCategory?.category === 'library' && generatingCategory.format === 'excel' ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excel"}
          </Button>
          <Button
            onClick={() => onGenerateReport("pdf", "library")}
            disabled={!!generatingCategory}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-1" />
            {generatingCategory?.category === 'library' && generatingCategory.format === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'PDF'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}