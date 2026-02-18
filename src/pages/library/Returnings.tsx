import PaginationBar from "@/components/common/PaginationBar";
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { libraryApi, Borrowing, Book } from '@/services/libraryService';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type BorrowingWithStudent = Borrowing & {
  student?: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    class?: { id: string; name: string; numericalName: number };
    classId?: string;
  };
};

export default function Returnings() {
  const { token, user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeBorrowings, setActiveBorrowings] = useState<BorrowingWithStudent[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string; numericalName: number }>>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [filters, setFilters] = useState({
    classId: '',
    studentSearch: '',
    status: 'all',
  });

  const superAdminSchoolId = user?.role === 'super_admin' ? user.schoolId : undefined;

  const getBookLabel = (br: BorrowingWithStudent) => {
    if (br.bookId) {
      const found = books.find((b) => b.id === br.bookId);
      return found?.title || br.bookId;
    }
    return br.bookName || 'Unknown';
  };

  const classById = useMemo(() => {
    const map = new Map<string, { id: string; name: string; numericalName: number }>();
    classes.forEach((c) => map.set(c.id, c));
    return map;
  }, [classes]);

  const classNameForBorrowing = (br: BorrowingWithStudent) => {
    if (br.student?.class?.name) return br.student.class.name;
    if (br.student?.classId && classById.has(br.student.classId)) return classById.get(br.student.classId)!.name;
    return 'N/A';
  };

  const now = Date.now();
  const isOverdue = (dueAt: string) => new Date(dueAt).getTime() < now;

  const filteredBorrowings = useMemo(() => {
    let data = [...activeBorrowings];

    if (filters.studentSearch.trim()) {
      const q = filters.studentSearch.toLowerCase();
      data = data.filter((br) => {
        const studentName = `${br.student?.firstName || ''} ${br.student?.lastName || ''}`.toLowerCase();
        const studentId = (br.student?.studentId || br.studentId || '').toLowerCase();
        const bookLabel = getBookLabel(br).toLowerCase();
        return studentName.includes(q) || studentId.includes(q) || bookLabel.includes(q);
      });
    }

    if (filters.classId) {
      data = data.filter((br) => {
        const clsId = br.student?.class?.id || br.student?.classId;
        return clsId === filters.classId;
      });
    }

    if (filters.status === 'overdue') {
      data = data.filter((br) => isOverdue(br.dueAt));
    }

    if (filters.status === 'due-soon') {
      const in48h = now + 48 * 60 * 60 * 1000;
      data = data.filter((br) => {
        const dueTs = new Date(br.dueAt).getTime();
        return dueTs >= now && dueTs <= in48h;
      });
    }

    return data;
  }, [activeBorrowings, filters, now]);

  const paginatedBorrowings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredBorrowings.slice(start, end);
  }, [filteredBorrowings, currentPage, itemsPerPage]);

  const circulationStats = useMemo(() => {
    const totalInCirculation = activeBorrowings.length;
    const overdueCount = activeBorrowings.filter((br) => isOverdue(br.dueAt)).length;
    const dueSoonCount = activeBorrowings.filter((br) => {
      const dueTs = new Date(br.dueAt).getTime();
      return dueTs >= now && dueTs <= now + 48 * 60 * 60 * 1000;
    }).length;
    return { totalInCirculation, overdueCount, dueSoonCount };
  }, [activeBorrowings, now]);

  const classesWithBorrowings = useMemo(() => {
    const ids = new Set<string>();
    activeBorrowings.forEach((br) => {
      const id = br.student?.class?.id || br.student?.classId;
      if (id) ids.add(id);
    });

    return Array.from(ids)
      .map((id) => classes.find((c) => c.id === id) || activeBorrowings.find((br) => (br.student?.class?.id || br.student?.classId) === id)?.student?.class)
      .filter(Boolean)
      .sort((a: any, b: any) => (a.numericalName || 0) - (b.numericalName || 0));
  }, [activeBorrowings, classes]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [borrowingsResp, booksResp, classesResp] = await Promise.all([
        libraryApi.listBorrowings({ token: token || undefined, activeOnly: true, schoolId: superAdminSchoolId }),
        libraryApi.listBooks({ token: token || undefined, schoolId: superAdminSchoolId, page: 1, limit: 500 }),
        libraryApi.listClasses({ token: token || undefined, schoolId: superAdminSchoolId }),
      ]);

      const borrowingsData = Array.isArray(borrowingsResp)
        ? borrowingsResp
        : (Array.isArray((borrowingsResp as any).borrowings) ? (borrowingsResp as any).borrowings : []);

      setActiveBorrowings(borrowingsData as BorrowingWithStudent[]);
      setBooks(Array.isArray((booksResp as any).books) ? (booksResp as any).books : []);
      setClasses(Array.isArray(classesResp) ? classesResp : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load returnings data');
      setActiveBorrowings([]);
      setBooks([]);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, itemsPerPage]);

  useEffect(() => {
    const total = filteredBorrowings.length;
    setTotalCount(total);
    setTotalPages(Math.max(1, Math.ceil(total / itemsPerPage)));
  }, [filteredBorrowings, itemsPerPage]);

  const markReturned = async (borrowingId: string) => {
    const ok = window.confirm('Mark this borrowing as returned?');
    if (!ok) return;

    try {
      await libraryApi.returnBook({ borrowingId }, token || undefined);
      toast({ title: 'Returned', description: 'Book marked as returned successfully.' });
      await load();
    } catch (e: any) {
      toast({ title: 'Return failed', description: e?.message || 'Could not mark as returned.', variant: 'destructive' });
    }
  };

  const formatDue = (dueAt: string) => {
    const dt = new Date(dueAt);
    const overdue = isOverdue(dueAt);
    return { label: dt.toLocaleString(), overdue };
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Returnings</CardTitle>
          <p className="text-sm text-muted-foreground">Books in circulation (active borrowings) and return management.</p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">In Circulation</p>
              <p className="text-2xl font-bold">{circulationStats.totalInCirculation}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{circulationStats.overdueCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Due in 48 Hours</p>
              <p className="text-2xl font-bold text-amber-600">{circulationStats.dueSoonCount}</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Active Borrowings</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Showing {paginatedBorrowings.length} of {totalCount} records</p>
          </div>
        </CardHeader>

        <div className="px-6 pb-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Search</Label>
              <Input
                placeholder="Student ID, name, or book title"
                value={filters.studentSearch}
                onChange={(e) => setFilters((p) => ({ ...p, studentSearch: e.target.value }))}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Class</Label>
              <Select value={filters.classId} onValueChange={(value) => setFilters((p) => ({ ...p, classId: value }))}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All classes</SelectItem>
                  {classesWithBorrowings.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters((p) => ({ ...p, status: value }))}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All active</SelectItem>
                  <SelectItem value="overdue">Overdue only</SelectItem>
                  <SelectItem value="due-soon">Due in 48 hours</SelectItem>
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

          {!loading && paginatedBorrowings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No active borrowings found.</div>
          )}

          {!loading && paginatedBorrowings.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Borrowed At</TableHead>
                  <TableHead>Due At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBorrowings.map((br) => {
                  const due = formatDue(br.dueAt);
                  return (
                    <TableRow key={br.id}>
                      <TableCell>{getBookLabel(br)}</TableCell>
                      <TableCell>{br.student ? `${br.student.studentId} - ${br.student.firstName} ${br.student.lastName}` : br.studentId}</TableCell>
                      <TableCell>{classNameForBorrowing(br)}</TableCell>
                      <TableCell>{new Date(br.borrowedAt).toLocaleString()}</TableCell>
                      <TableCell className={due.overdue ? 'text-red-600 font-medium' : ''}>{due.label}</TableCell>
                      <TableCell>{due.overdue ? 'Overdue' : 'In circulation'}</TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => markReturned(br.id)}>Mark Returned</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {!loading && totalPages > 1 && (
            <PaginationBar
              className="px-2 py-4"
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              isLoading={loading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
