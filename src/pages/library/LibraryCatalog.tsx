import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { libraryApi, Book, PaginatedResponse } from '@/services/libraryService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Trash2, DownloadCloud, UploadCloud } from 'lucide-react';

export default function LibraryCatalog() {
  const { token, user } = useAuth();
  const [q, setQ] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string; numericalName: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [form, setForm] = useState<{ title: string; author?: string; isbn?: string; totalCopies: number; classId?: string }>({ title: '', author: '', isbn: '', totalCopies: 1, classId: undefined });
  const [editForm, setEditForm] = useState<{ title: string; author?: string; isbn?: string; totalCopies: number; classId?: string }>({ title: '', author: '', isbn: '', totalCopies: 1, classId: undefined });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });

  const isAdminLike = useMemo(() => ['admin', 'super_admin'].includes(user?.role || ''), [user]);
  const superAdminSchoolId = user?.role === 'super_admin' ? user.schoolId : undefined;

  const load = async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      const response = await libraryApi.listBooks({ 
        token: token || undefined, 
        q, 
        schoolId: superAdminSchoolId,
        page,
        limit: itemsPerPage
      });
      setBooks(response.books);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
      setCurrentPage(response.currentPage);
    } catch (e: any) {
      setError(e.message || 'Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const items = await libraryApi.listClasses({ token: token || undefined, schoolId: superAdminSchoolId });
      setClasses(items);
    } catch (e: any) {
      console.error('Failed to load classes:', e);
    }
  };

  useEffect(() => {
    load();
    loadClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset to page 1 when search query changes (with debouncing)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      load(1);
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const onCreate = async () => {
    if (!form.title || form.totalCopies < 0) return;
    try {
      setLoading(true);
      await libraryApi.createBook({ ...form, schoolId: superAdminSchoolId }, token || undefined);
      setDialogOpen(false);
      setForm({ title: '', author: '', isbn: '', totalCopies: 1, classId: undefined });
      await load(currentPage);
    } catch (e: any) {
      setError(e.message || 'Failed to create book');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async () => {
    const headers = ['Title', 'Author', 'ISBN', 'Class', 'TotalCopies'];
    const nonGraduatedClasses = classes.filter(
      (c) => c?.name?.trim().toLowerCase() !== 'graduated'
    );
    const classPool = nonGraduatedClasses.map((c) => c.name).filter(Boolean);
    const fallbackClass = classPool[0] || 'Form One';
    const csvEscape = (value: string) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const realisticBooks: Array<{ title: string; author: string; isbn: string }> = [
      { title: 'Things Fall Apart', author: 'Chinua Achebe', isbn: '9780385474542' },
      { title: 'The River and the Source', author: 'Margaret Ogola', isbn: '9789966465054' },
      { title: 'An Artist of the Floating World', author: 'Kazuo Ishiguro', isbn: '9780679731726' },
      { title: 'Blossoms of the Savannah', author: 'Henry R. ole Kulet', isbn: '9789966251800' },
      { title: 'A Dolls House', author: 'Henrik Ibsen', isbn: '9780141395203' },
      { title: 'The Pearl', author: 'John Steinbeck', isbn: '9780140177374' },
      { title: 'The River Between', author: 'Ngugi wa Thiongo', isbn: '9780435905484' },
      { title: 'Betrayal in the City', author: 'Francis Imbuga', isbn: '9789966467492' },
      { title: 'The Caucasian Chalk Circle', author: 'Bertolt Brecht', isbn: '9780413772633' },
      { title: 'The Concubine', author: 'Elechi Amadi', isbn: '9780435906818' },
      { title: 'Animal Farm', author: 'George Orwell', isbn: '9780451526342' },
      { title: 'The Old Man and the Sea', author: 'Ernest Hemingway', isbn: '9780684801223' },
      { title: 'A Grain of Wheat', author: 'Ngugi wa Thiongo', isbn: '9780435909901' },
      { title: 'Sons and Lovers', author: 'D. H. Lawrence', isbn: '9780140189575' },
      { title: 'The Tempest', author: 'William Shakespeare', isbn: '9780743482837' },
    ];
    // Try to fetch up to 30 real books from the system
    try {
      const resp = await libraryApi.listBooks({ token: token || undefined, schoolId: superAdminSchoolId, page: 1, limit: 30 });
      const booksForTemplate: Book[] = (resp && (resp as any).books) ? (resp as any).books : (resp as unknown as Book[]);
      const rows: string[][] = [];
      if (booksForTemplate && booksForTemplate.length > 0) {
        const filteredBooks = booksForTemplate.filter((b) => (b.class?.name || '').trim().toLowerCase() !== 'graduated');
        for (const [idx, b] of filteredBooks.slice(0, 30).entries()) {
          const title = b.title || '';
          const author = b.author || '';
          const isbn = b.isbn || '';
          const classValRaw = b.class?.name || (b.classId ? (classes.find(c => c.id === b.classId)?.name || '') : '');
          const classVal = classValRaw && classValRaw.trim().toLowerCase() !== 'graduated'
            ? classValRaw
            : (classPool[idx % Math.max(classPool.length, 1)] || fallbackClass);
          const totalCopies = String(b.totalCopies ?? 1);
          rows.push([title, author, isbn, classVal, totalCopies]);
        }

        // Top up with realistic examples when there are fewer than 30 real (non-graduated) books
        if (rows.length < 30) {
          for (let i = rows.length; i < 30; i++) {
            const sample = realisticBooks[i % realisticBooks.length];
            const classVal = classPool[i % Math.max(classPool.length, 1)] || fallbackClass;
            const totalCopies = String((i % 5) + 1);
            rows.push([sample.title, sample.author, sample.isbn, classVal, totalCopies]);
          }
        }
      } else {
        // Fallback: realistic template rows with actual classes (excluding Graduated)
        for (let i = 0; i < 30; i++) {
          const sample = realisticBooks[i % realisticBooks.length];
          const classVal = classPool[i % Math.max(classPool.length, 1)] || fallbackClass;
          const totalCopies = String((i % 5) + 1);
          rows.push([sample.title, sample.author, sample.isbn, classVal, totalCopies]);
        }
      }

      const csv = `${headers.map(csvEscape).join(',')}\n${rows.map(r => r.map(csvEscape).join(',')).join('\n')}\n`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'library-template.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      // fallback to simple template if fetch fails
      const rows: string[][] = [];
      for (let i = 0; i < 30; i++) {
        const sample = realisticBooks[i % realisticBooks.length];
        const classVal = classPool[i % Math.max(classPool.length, 1)] || fallbackClass;
        const totalCopies = String((i % 5) + 1);
        rows.push([sample.title, sample.author, sample.isbn, classVal, totalCopies]);
      }
      const csv = `${headers.map(csvEscape).join(',')}\n${rows.map(r => r.map(csvEscape).join(',')).join('\n')}\n`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'library-template.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  };

  const onBulkUploadClick = () => {
    fileInputRef.current?.click();
  };

  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) return [];

    const parseLine = (line: string) => {
      const cols: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++; // skip escaped quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === ',' && !inQuotes) {
          cols.push(cur);
          cur = '';
        } else {
          cur += ch;
        }
      }
      cols.push(cur);
      return cols.map(c => c.trim());
    };

    // handle BOM and quoted header names
    const rawHeader = lines[0].replace(/^\uFEFF/, '');
    const headerParts = parseLine(rawHeader).map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());

    const rows = lines.slice(1).map((line) => {
      const cols = parseLine(line);
      const obj: any = {};
      headerParts.forEach((h, i) => {
        let val = cols[i] ?? '';
        if (typeof val === 'string') {
          val = val.replace(/^"|"$/g, '').trim();
        }
        obj[h] = val;
      });
      return obj;
    });
    return rows;
  };

  const handleBulkUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress({ done: 0, total: 0 });
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      setUploadProgress({ done: 0, total: rows.length });
      let successes = 0;
      let failures: string[] = [];
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const title = r['title'] || r['book'] || r['name'] || r['book title'] || r['book_title'] || '';
        if (!title) {
          failures.push(`Row ${i + 2}: missing title`);
          setUploadProgress((p) => ({ ...p, done: p.done + 1 }));
          continue;
        }
        const author = r['author'] || '';
        const isbn = r['isbn'] || '';
        const totalCopies = Number(r['totalcopies'] || r['total_copies'] || r['total'] || 1) || 1;
        // Try to match class by name
        const classNameRaw = (r['class'] || r['class_name'] || r['grade'] || r['classname'] || '') as string;
        const className = String(classNameRaw).trim();
        const matched = classes.find((c) => {
          if (!className) return false;
          if ((c.name || '').toLowerCase() === className.toLowerCase()) return true;
          if (String(c.numericalName) === className) return true;
          if ((c.name || '').toLowerCase().includes(className.toLowerCase())) return true;
          return false;
        });
        const classId = matched ? matched.id : undefined;
        try {
          await libraryApi.createBook({ title, author, isbn, totalCopies, classId, schoolId: superAdminSchoolId }, token || undefined);
          successes++;
        } catch (err: any) {
          failures.push(`Row ${i + 2}: ${err?.message || 'failed to create'}`);
        }
        setUploadProgress((p) => ({ ...p, done: p.done + 1 }));
      }
      await load(1);
      const summary = `Uploaded ${successes}/${rows.length}.` + (failures.length ? ` Failures: ${failures.slice(0,5).join('; ')}` : '');
      setError(summary);
    } catch (err: any) {
      setError(err?.message || 'Failed to process file');
    } finally {
      setUploading(false);
      // reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onEdit = (book: Book) => {
    setEditingBook(book);
    setEditForm({
      title: book.title,
      author: book.author || '',
      isbn: book.isbn || '',
      totalCopies: book.totalCopies,
      classId: book.classId || undefined
    });
    setEditDialogOpen(true);
  };

  const onUpdate = async () => {
    if (!editingBook || !editForm.title || editForm.totalCopies < 0) return;
    try {
      setLoading(true);
      await libraryApi.updateBook(editingBook.id, editForm, token || undefined);
      setEditDialogOpen(false);
      setEditingBook(null);
      setEditForm({ title: '', author: '', isbn: '', totalCopies: 1, classId: undefined });
      await load(currentPage);
    } catch (e: any) {
      setError(e.message || 'Failed to update book');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this book?')) return;
    try {
      await libraryApi.deleteBook(id, token || undefined);
      await load(currentPage);
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
            <Button onClick={() => load(1)} disabled={loading}>Search</Button>
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
                    <Label>Class (optional - leave empty for N/A)</Label>
                    <Select value={form.classId || ''} onValueChange={(value) => setForm({ ...form, classId: value || undefined })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class or leave empty for N/A" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">N/A (Any Class)</SelectItem>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} (Grade {cls.numericalName})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Label>Total Copies</Label>
                    <Input type="number" value={form.totalCopies} onChange={(e) => setForm({ ...form, totalCopies: Number(e.target.value || 0) })} />
                  </div>
                  <DialogFooter>
                    <Button onClick={onCreate} disabled={loading}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {isAdminLike && (
              <>
                <Button variant="outline" onClick={downloadTemplate} title="Download CSV template">
                  <DownloadCloud className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
                <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleBulkUploadChange} className="hidden" />
                <Button variant="outline" onClick={onBulkUploadClick} disabled={uploading} title="Bulk upload from CSV">
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Bulk Upload
                </Button>
              </>
            )}

            {/* Edit Book Dialog */}
            {isAdminLike && (
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Book</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-3 py-2">
                    <Label>Title</Label>
                    <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                    <Label>Author</Label>
                    <Input value={editForm.author} onChange={(e) => setEditForm({ ...editForm, author: e.target.value })} />
                    <Label>ISBN</Label>
                    <Input value={editForm.isbn} onChange={(e) => setEditForm({ ...editForm, isbn: e.target.value })} />
                    <Label>Class (optional - leave empty for N/A)</Label>
                    <Select value={editForm.classId || ''} onValueChange={(value) => setEditForm({ ...editForm, classId: value || undefined })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class or leave empty for N/A" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">N/A (Any Class)</SelectItem>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} (Grade {cls.numericalName})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Label>Total Copies</Label>
                    <Input type="number" value={editForm.totalCopies} onChange={(e) => setEditForm({ ...editForm, totalCopies: Number(e.target.value || 0) })} />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button onClick={onUpdate} disabled={loading}>Update</Button>
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
                <TableHead>Class</TableHead>
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
                  <TableCell>{b.class ? b.class.name : 'N/A (Any Class)'}</TableCell>
                  <TableCell>{b.availableCopies}</TableCell>
                  <TableCell>{b.totalCopies}</TableCell>
                  {isAdminLike && (
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => onEdit(b)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => onDelete(b.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Pagination Controls */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {books.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} books
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => load(1)}
                disabled={currentPage <= 1 || loading}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => load(currentPage - 1)}
                disabled={currentPage <= 1 || loading}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                <span className="text-sm">Page</span>
                <span className="text-sm font-medium">{currentPage}</span>
                <span className="text-sm">of</span>
                <span className="text-sm font-medium">{totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => load(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => load(totalPages)}
                disabled={currentPage >= totalPages || loading}
              >
                Last
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
