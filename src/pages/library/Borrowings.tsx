import React, { useEffect, useMemo, useState } from 'react';
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
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<{ bookId?: string; bookName?: string; studentId: string; dueAt: string }>({ studentId: '', dueAt: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16) });
  const [studentQuery, setStudentQuery] = useState('');
  const [studentOptions, setStudentOptions] = useState<Array<{ id: string; studentId: string; firstName: string; lastName: string }>>([]);
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; studentId: string; firstName: string; lastName: string } | null>(null);
  const isStaff = useMemo(() => ['admin', 'super_admin', 'teacher', 'finance'].includes(user?.role || ''), [user]);
  const superAdminSchoolId = user?.role === 'super_admin' ? user.schoolId : undefined;

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [brs, bks] = await Promise.all([
        libraryApi.listBorrowings({ token: token || undefined, activeOnly: false, schoolId: superAdminSchoolId }),
        libraryApi.listBooks({ token: token || undefined, schoolId: superAdminSchoolId }),
      ]);
      setBorrowings(brs);
      setBooks(bks);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  // Live search students by human-readable studentId or name
  useEffect(() => {
    let active = true;
    const run = async () => {
      const q = studentQuery.trim();
      if (!q) { setStudentOptions([]); return; }
      try {
        const results = await libraryApi.searchStudents({ token: token || undefined, q, limit: 8, schoolId: superAdminSchoolId });
        if (active) setStudentOptions(results);
      } catch (e) {
        if (active) setStudentOptions([]);
      }
    };
    const h = setTimeout(run, 200);
    return () => { active = false; clearTimeout(h); };
  }, [studentQuery, token, superAdminSchoolId]);

  const onBorrow = async () => {
    if (!(form.bookId || form.bookName) || !form.studentId || !form.dueAt) return;
    try {
      setLoading(true);
      await libraryApi.borrow({ ...form, schoolId: superAdminSchoolId, dueAt: new Date(form.dueAt).toISOString() }, token || undefined);
      setDialogOpen(false);
      setForm({ studentId: '', dueAt: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16) });
      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to borrow');
    } finally {
      setLoading(false);
    }
  };

  const onReturn = async (id: string) => {
    const confirm = window.confirm('Are you sure you want to mark this as returned?');
    if (!confirm) return;
    try {
      await libraryApi.returnBook({ borrowingId: id }, token || undefined);
      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to return');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Borrowings</CardTitle>
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
                  <Label>Select Catalog Book (optional)</Label>
                  <Select disabled={!!form.bookName} onValueChange={(v) => setForm({ ...form, bookId: v, bookName: undefined })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a book" />
                    </SelectTrigger>
                    <SelectContent>
                      {books.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.title} ({b.availableCopies}/{b.totalCopies})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Label>Or enter custom book name</Label>
                  <Input disabled={!!form.bookId} value={form.bookName || ''} onChange={(e) => setForm({ ...form, bookName: e.target.value, bookId: undefined })} placeholder="Book name" />
                  <Label>Student</Label>
                  <div className="space-y-2">
                    <Input
                      value={selectedStudent ? `${selectedStudent.studentId} - ${selectedStudent.firstName} ${selectedStudent.lastName}` : studentQuery}
                      onChange={(e) => { setSelectedStudent(null); setStudentQuery(e.target.value); setForm({ ...form, studentId: '' }); }}
                      placeholder="Type student number or name"
                    />
                    {studentOptions.length > 0 && !selectedStudent && (
                      <div className="border rounded max-h-48 overflow-auto bg-white dark:bg-slate-900">
                        {studentOptions.map(opt => (
                          <div
                            key={opt.id}
                            className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-sm"
                            onClick={() => {
                              setSelectedStudent(opt);
                              setStudentQuery('');
                              setForm({ ...form, studentId: opt.id });
                            }}
                          >
                            <span className="font-medium">{opt.studentId}</span>
                            <span className="ml-2 text-slate-500">{opt.firstName} {opt.lastName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
        <CardContent>
          {error && <div className="text-red-500 mb-2">{error}</div>}
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
              {borrowings.map((br) => {
                const bookLabel = br.bookId ? (books.find(b => b.id === br.bookId)?.title || br.bookId) : (br.bookName || 'Unknown');
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
                        {!returned && <Button size="sm" onClick={() => onReturn(br.id)}>Mark Returned</Button>}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
