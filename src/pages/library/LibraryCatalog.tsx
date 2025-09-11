import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { libraryApi, Book } from '@/services/libraryService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function LibraryCatalog() {
  const { token, user } = useAuth();
  const [q, setQ] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<{ title: string; author?: string; isbn?: string; totalCopies: number }>({ title: '', author: '', isbn: '', totalCopies: 1 });

  const isAdminLike = useMemo(() => ['admin', 'super_admin'].includes(user?.role || ''), [user]);
  const superAdminSchoolId = user?.role === 'super_admin' ? user.schoolId : undefined;

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await libraryApi.listBooks({ token: token || undefined, q, schoolId: superAdminSchoolId });
      setBooks(items);
    } catch (e: any) {
      setError(e.message || 'Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreate = async () => {
    if (!form.title || form.totalCopies < 0) return;
    try {
      setLoading(true);
      await libraryApi.createBook({ ...form, schoolId: superAdminSchoolId }, token || undefined);
      setDialogOpen(false);
      setForm({ title: '', author: '', isbn: '', totalCopies: 1 });
      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to create book');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this book?')) return;
    try {
      await libraryApi.deleteBook(id, token || undefined);
      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Library Catalog</CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder="Search title/author/isbn" value={q} onChange={(e) => setQ(e.target.value)} />
            <Button onClick={load} disabled={loading}>Search</Button>
            {isAdminLike && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Add Book</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Book</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-3 py-2">
                    <Label>Title</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                    <Label>Author</Label>
                    <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
                    <Label>ISBN</Label>
                    <Input value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
                    <Label>Total Copies</Label>
                    <Input type="number" value={form.totalCopies} onChange={(e) => setForm({ ...form, totalCopies: Number(e.target.value || 0) })} />
                  </div>
                  <DialogFooter>
                    <Button onClick={onCreate} disabled={loading}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>ISBN</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Total</TableHead>
                {isAdminLike && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {books.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{b.title}</TableCell>
                  <TableCell>{b.author || '-'}</TableCell>
                  <TableCell>{b.isbn || '-'}</TableCell>
                  <TableCell>{b.availableCopies}</TableCell>
                  <TableCell>{b.totalCopies}</TableCell>
                  {isAdminLike && (
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => onDelete(b.id)}>Delete</Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
