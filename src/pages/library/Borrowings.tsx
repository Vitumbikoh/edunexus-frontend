import PaginationBar from "@/components/common/PaginationBar";
import React, { useEffect, useMemo, useState } from 'react';
import { API_CONFIG } from '@/config/api';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { libraryApi, Borrowing, Book } from '@/services/libraryService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Borrowings() {
  const { token, user } = useAuth();
  const [allBorrowings, setAllBorrowings] = useState<Borrowing[]>([]);
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [allClasses, setAllClasses] = useState<Array<{ id: string; name: string; numericalName: number }>>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string; numericalName: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [returningIds, setReturningIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    classId: '',
    studentSearch: '',
    activeOnly: false
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<{ bookId?: string; bookName?: string; studentId: string; dueAt: string }>({ studentId: '', dueAt: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16) });
  const [studentQuery, setStudentQuery] = useState('');
  const [bookQuery, setBookQuery] = useState('');
  const [studentOptions, setStudentOptions] = useState<Array<{ id: string; studentId: string; firstName: string; lastName: string; class?: { id: string; name: string; numericalName: number } }>>([]);
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; studentId: string; firstName: string; lastName: string; class?: { id: string; name: string; numericalName: number } } | null>(null);
  const isStaff = useMemo(() => ['admin', 'super_admin', 'teacher', 'finance'].includes(user?.role || ''), [user]);
  const { toast } = useToast();
  const superAdminSchoolId = user?.role === 'super_admin' ? user.schoolId : undefined;

  const selectedStudentClass = useMemo(() => {
    if (!selectedStudent) return null;
    if (selectedStudent.class?.id) return selectedStudent.class;
    const fallbackClassId = (selectedStudent as any)?.classId;
    if (!fallbackClassId || !Array.isArray(allClasses)) return null;
    return allClasses.find((c) => c.id === fallbackClassId) || null;
  }, [selectedStudent, allClasses]);

  // Filter books based on selected student's class level
  const availableBooks = useMemo(() => {
    if (!Array.isArray(books)) return [];
    if (!selectedStudent) return books;
    
    return books.filter(book => {
      // If book has no class restriction (N/A), anyone can borrow
      if (!book.classId || !book.class) return true;
      
      // If student has no class, they can only borrow N/A books
      if (!selectedStudentClass) return false;
      
      // Student can borrow books for their class level and below
      return book.class.numericalName <= selectedStudentClass.numericalName;
    });
  }, [books, selectedStudent, selectedStudentClass]);

  const filteredBookOptions = useMemo(() => {
    const q = bookQuery.trim().toLowerCase();
    if (!q) return [];
    return availableBooks
      .filter((b) => {
        const title = (b.title || '').toLowerCase();
        const author = (b.author || '').toLowerCase();
        const isbn = (b.isbn || '').toLowerCase();
        const cls = (b.class?.name || '').toLowerCase();
        return title.includes(q) || author.includes(q) || isbn.includes(q) || cls.includes(q);
      })
      .slice(0, 25);
  }, [availableBooks, bookQuery]);

  // Client-side filtering and pagination
  const { paginatedBorrowings, totalFilteredCount, totalFilteredPages } = useMemo(() => {
    let filtered = [...allBorrowings];

    // Apply filters
    if (filters.studentSearch) {
      const searchTerm = filters.studentSearch.toLowerCase();
      filtered = filtered.filter(borrowing => {
        const student = borrowing.student;
        if (!student) return false;
        const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
        const studentId = student.studentId.toLowerCase();
        return fullName.includes(searchTerm) || studentId.includes(searchTerm);
      });
    }

    if (filters.classId) {
      filtered = filtered.filter(borrowing => {
        // Check multiple possible structures for class ID
        return borrowing.student?.class?.id === filters.classId ||
               borrowing.student?.classId === filters.classId;
      });
    }

    if (filters.activeOnly) {
      filtered = filtered.filter(borrowing => !borrowing.returnedAt);
    }

    // Calculate pagination
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);

    return {
      paginatedBorrowings: paginated,
      totalFilteredCount: totalCount,
      totalFilteredPages: totalPages
    };
  }, [allBorrowings, filters, currentPage, itemsPerPage]);

  // Get unique classes that have borrowings
  const classesWithBorrowings = useMemo(() => {
    console.log('Calculating classes with borrowings...');
    console.log('All borrowings:', allBorrowings);
    console.log('All classes:', allClasses);
    
    const classIds = new Set();
    const classesMap = new Map();
    const classesFromBorrowings = new Map();
    
    // First, create a map of all classes
    allClasses.forEach(cls => {
      classesMap.set(cls.id, cls);
    });
    
    // Then, find classes from borrowings data
    allBorrowings.forEach((borrowing, index) => {
      console.log(`Borrowing ${index}:`, {
        student: borrowing.student,
        studentClass: borrowing.student?.class
      });
      
      // Check different possible structures
      let classInfo = null;
      
      if (borrowing.student?.class?.id) {
        // Standard structure
        classInfo = borrowing.student.class;
        classIds.add(classInfo.id);
      } else if (borrowing.student?.classId) {
        // Alternative structure where classId is direct property
        classIds.add(borrowing.student.classId);
      }
      
      if (classInfo) {
        classesFromBorrowings.set(classInfo.id, classInfo);
      }
    });
    
    console.log('Found class IDs:', Array.from(classIds));
    
    // Return classes from borrowings first, then fallback to all classes
    const result = Array.from(classIds)
      .map(id => classesFromBorrowings.get(id) || classesMap.get(id))
      .filter(Boolean)
      .sort((a, b) => (a.numericalName || 0) - (b.numericalName || 0));
    
    console.log('Final classes with borrowings:', result);
    return result;
  }, [allBorrowings, allClasses]);

  const load = async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading borrowings...');
      const [borrowingsResponse, booksResponse, classesData] = await Promise.all([
        libraryApi.listBorrowings({ 
          token: token || undefined, 
          activeOnly: false, // Get all borrowings for client-side filtering
          schoolId: superAdminSchoolId
        }),
        libraryApi.listBooks({ token: token || undefined, schoolId: superAdminSchoolId }),
        libraryApi.listClasses({ token: token || undefined, schoolId: superAdminSchoolId })
      ]);
      
      // Handle both old array format and new paginated format
      let allBorrowingsData = [];
      if (Array.isArray(borrowingsResponse)) {
        // Old format - just an array
        allBorrowingsData = borrowingsResponse;
      } else {
        // New paginated format
        allBorrowingsData = Array.isArray(borrowingsResponse.borrowings) ? borrowingsResponse.borrowings : [];
      }
      
      console.log('Loaded borrowings data:', allBorrowingsData);
      console.log('Loaded classes data:', classesData);
      
      setAllBorrowings(allBorrowingsData);
      setBooks(Array.isArray(booksResponse.books) ? booksResponse.books : []);
      setAllClasses(Array.isArray(classesData) ? classesData : []);
    } catch (e: any) {
      console.error('Failed to load borrowings:', e);
      setError(e.message || 'Failed to load');
      setAllBorrowings([]);
      setBorrowings([]);
      setBooks([]);
      setAllClasses([]);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  // Update display data when filters or pagination change
  useEffect(() => {
    setBorrowings(paginatedBorrowings);
    setTotalCount(totalFilteredCount);
    setTotalPages(totalFilteredPages);
  }, [paginatedBorrowings, totalFilteredCount, totalFilteredPages]);

  useEffect(() => { 
    load(1); 
    /* eslint-disable-next-line */ 
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
    /* eslint-disable-next-line */
  }, [filters, itemsPerPage]);

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Live search students by human-readable studentId or name
  useEffect(() => {
    let active = true;
    const run = async () => {
      const q = studentQuery.trim();
      if (!q) { setStudentOptions([]); return; }
      try {
        const results = await libraryApi.searchStudents({ token: token || undefined, q, limit: 8, schoolId: superAdminSchoolId });
        if (active) setStudentOptions(Array.isArray(results) ? results : []);
      } catch (e) {
        if (active) setStudentOptions([]);
      }
    };
    const h = setTimeout(run, 200);
    return () => { active = false; clearTimeout(h); };
  }, [studentQuery, token, superAdminSchoolId]);

  const onBorrow = async () => {
    if (!(form.bookId || form.bookName) || !form.studentId || !form.dueAt) return;
    // Ensure selected student is active
    if (selectedStudent) {
      const inactive = selectedStudent?.isActive === false || (selectedStudent?.status && String(selectedStudent.status).toLowerCase() !== 'active');
      if (inactive) {
        toast({ title: 'Student Inactive', description: 'Cannot borrow: selected student is inactive.', variant: 'destructive' });
        return;
      }
    }
    try {
      setLoading(true);
      await libraryApi.borrow({ ...form, schoolId: superAdminSchoolId, dueAt: new Date(form.dueAt).toISOString() }, token || undefined);
      setDialogOpen(false);
      setForm({ studentId: '', dueAt: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16) });
      setSelectedStudent(null);
      setStudentQuery('');
      setBookQuery('');
      await load(currentPage);
    } catch (e: any) {
      setError(e.message || 'Failed to borrow');
    } finally {
      setLoading(false);
    }
  };

  const onReturn = async (id: string) => {
    const confirm = window.confirm('Are you sure you want to mark this as returned?');
    if (!confirm) return;
    if (returningIds.includes(id)) return; // already in progress
    try {
      setReturningIds(prev => [...prev, id]);
      await libraryApi.returnBook({ borrowingId: id }, token || undefined);
      await load(currentPage);
    } catch (e: any) {
      setError(e.message || 'Failed to return');
    } finally {
      setReturningIds(prev => prev.filter(x => x !== id));
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Borrowings</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Showing {borrowings.length} of {totalCount} records
            </p>
          </div>
          {isStaff && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>Borrow a Book</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Borrow a Book</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <Label>Student</Label>
                  <div className="space-y-2">
                    <Input
                      value={selectedStudent ? `${selectedStudent.studentId} - ${selectedStudent.firstName} ${selectedStudent.lastName}${selectedStudent.class ? ` (${selectedStudent.class.name})` : ''}` : studentQuery}
                      onChange={(e) => {
                        setSelectedStudent(null);
                        setStudentQuery(e.target.value);
                        setBookQuery('');
                        setForm({ ...form, studentId: '', bookId: undefined, bookName: undefined });
                      }}
                      placeholder="Type student number or name"
                    />
                    {Array.isArray(studentOptions) && studentOptions.length > 0 && !selectedStudent && (
                      <div className="border rounded max-h-48 overflow-auto bg-white dark:bg-slate-900">
                        {studentOptions.map(opt => {
                          const clsName = (opt.class?.name || '').toLowerCase();
                          const isGraduated = clsName.includes('gradu');
                          if (isGraduated) {
                            return (
                              <div key={opt.id} className="px-3 py-2 text-sm text-gray-500">
                                <span className="font-medium">{opt.studentId}</span>
                                <span className="ml-2">{opt.firstName} {opt.lastName}</span>
                                <span className="ml-2 text-xs text-red-600">(Graduated)</span>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={opt.id}
                              className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-sm"
                              onClick={async () => {
                                // Fetch full student details to check active/graduated status before selecting
                                try {
                                  if (!token) {
                                    setError('Authentication required');
                                    return;
                                  }
                                  const res = await fetch(`${API_CONFIG.BASE_URL}/student/students/${opt.id}`, {
                                    headers: { Authorization: `Bearer ${token}` }
                                  });
                                  if (!res.ok) {
                                    setError('Failed to fetch student details');
                                    return;
                                  }
                                  const studentDetail = await res.json();
                                  // backend may use isActive, status, graduated flags or class name
                                  const inactive = studentDetail?.isActive === false || (studentDetail?.status && String(studentDetail.status).toLowerCase() !== 'active');
                                  const classNameDetail = (studentDetail?.class?.name || '').toLowerCase();
                                  const graduated = studentDetail?.graduated === true || studentDetail?.isGraduated === true || String(studentDetail?.status).toLowerCase() === 'graduated' || classNameDetail.includes('gradu');
                                  if (inactive) {
                                    toast({ title: 'Student Inactive', description: 'Selected student is inactive and cannot borrow books.', variant: 'destructive' });
                                    return;
                                  }
                                  if (graduated) {
                                    toast({ title: 'Graduated Student', description: 'Graduated students cannot borrow books.', variant: 'destructive' });
                                    return;
                                  }
                                  const mergedClass = studentDetail?.class
                                    || opt.class
                                    || (studentDetail?.classId ? allClasses.find((c) => c.id === studentDetail.classId) : undefined);
                                  setSelectedStudent({
                                    ...studentDetail,
                                    class: mergedClass,
                                  });
                                  setStudentQuery('');
                                  setBookQuery('');
                                  setForm({ ...form, studentId: studentDetail.id, bookId: undefined, bookName: undefined }); // Clear book selection when student changes
                                } catch (err: any) {
                                  setError(err?.message || 'Failed to fetch student');
                                }
                              }}
                            >
                              <span className="font-medium">{opt.studentId}</span>
                              <span className="ml-2 text-slate-500">{opt.firstName} {opt.lastName}</span>
                              {opt.class && <span className="ml-2 text-xs text-blue-500">({opt.class.name})</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  <Label>Select Catalog Book (optional)</Label>
                  {selectedStudent && bookQuery.trim().length > 0 && (
                    <p className="text-xs text-slate-600 mb-2">
                      {selectedStudentClass
                        ? `Showing books for ${selectedStudentClass.name} and below, plus general books`
                        : 'Student has no class assigned - showing only general books'
                      }
                    </p>
                  )}
                  <div className="space-y-2">
                    <Input
                      disabled={!!form.bookName || !selectedStudent}
                      value={bookQuery}
                      onChange={(e) => {
                        setBookQuery(e.target.value);
                        setForm({ ...form, bookId: undefined, bookName: undefined });
                      }}
                      placeholder={!selectedStudent ? "Select student first" : "Type book title, author, or ISBN"}
                    />
                    {selectedStudent && !form.bookName && (
                      <div className="border rounded max-h-48 overflow-auto bg-white dark:bg-slate-900">
                        {filteredBookOptions.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-slate-500">No matching books</div>
                        ) : (
                          filteredBookOptions.map((b) => (
                            <div
                              key={b.id}
                              className={`px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 ${form.bookId === b.id ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
                              onClick={() => {
                                setBookQuery(b.title);
                                setForm({ ...form, bookId: b.id, bookName: undefined });
                              }}
                            >
                              <span className="font-medium">{b.title}</span>
                              <span className="ml-2 text-slate-500">({b.availableCopies}/{b.totalCopies})</span>
                              <span className="ml-2 text-xs text-blue-500">{b.class ? b.class.name : 'N/A'}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <Label>Or enter custom book name</Label>
                  <Input
                    disabled={!!form.bookId || !selectedStudent}
                    value={form.bookName || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value) setBookQuery('');
                      setForm({ ...form, bookName: value, bookId: undefined });
                    }}
                    placeholder={!selectedStudent ? "Select student first" : "Book name"}
                  />
                  
                  <Label>Due Date</Label>
                  <Input type="datetime-local" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} />
                </div>
                <DialogFooter>
                  <Button onClick={onBorrow} disabled={loading}>Confirm</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        
        {/* Filters Section */}
        <div className="px-6 pb-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Student Search</Label>
              <Input
                placeholder="Search by student name or ID"
                value={filters.studentSearch}
                onChange={(e) => handleFilterChange('studentSearch', e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Class</Label>
              <Select value={filters.classId} onValueChange={(value) => handleFilterChange('classId', value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All classes</SelectItem>
                  {console.log('Rendering classes in dropdown:', classesWithBorrowings)}
                  {Array.isArray(classesWithBorrowings) && classesWithBorrowings.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select 
                value={filters.activeOnly ? "active" : "all"} 
                onValueChange={(value) => handleFilterChange('activeOnly', value === 'active')}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All records" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All records</SelectItem>
                  <SelectItem value="active">Active only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Items per page</Label>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <CardContent>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">Loading...</span>
            </div>
          )}
          
          {!loading && Array.isArray(borrowings) && borrowings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No borrowings found. {Object.values(filters).some(v => v) ? 'Try adjusting your filters.' : 'Start by borrowing a book.'}
            </div>
          )}
          
          {!loading && Array.isArray(borrowings) && borrowings.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Borrowed</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                {isStaff && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(borrowings) && borrowings.map((br) => {
                const bookLabel = br.bookId ? (Array.isArray(books) ? books.find(b => b.id === br.bookId)?.title || br.bookId : br.bookId) : (br.bookName || 'Unknown');
        const returned = !!br.returnedAt;
        const studentLabel = br.student ? `${br.student.studentId} — ${br.student.firstName} ${br.student.lastName}` : br.studentId;
                return (
                  <TableRow key={br.id}>
                    <TableCell>{bookLabel}</TableCell>
          <TableCell>{studentLabel}</TableCell>
                    <TableCell>{new Date(br.borrowedAt).toLocaleString()}</TableCell>
                    <TableCell>{new Date(br.dueAt).toLocaleString()}</TableCell>
                    <TableCell>{returned ? 'Returned' : 'Borrowed'}</TableCell>
                    {isStaff && (
                      <TableCell>
                        {!returned && (
                          <Button size="sm" onClick={() => onReturn(br.id)} disabled={returningIds.includes(br.id)}>
                            {returningIds.includes(br.id) ? 'Returning...' : 'Mark Returned'}
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          )}
          
          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <PaginationBar
              className="px-2 py-4"
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              isLoading={loading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
