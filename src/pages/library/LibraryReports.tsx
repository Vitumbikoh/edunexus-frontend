import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { libraryApi, Borrowing } from '@/services/libraryService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function LibraryReports() {
  const { token, user } = useAuth();
  const [mostBorrowed, setMostBorrowed] = useState<Array<{ bookId: string; borrowCount: string }>>([]);
  const [overdue, setOverdue] = useState<Borrowing[]>([]);
  const [error, setError] = useState<string | null>(null);
  const superAdminSchoolId = user?.role === 'super_admin' ? user.schoolId : undefined;
  const canView = useMemo(() => ['admin', 'super_admin', 'finance'].includes(user?.role || ''), [user]);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const [mb, od] = await Promise.all([
          libraryApi.reportMostBorrowed({ token: token || undefined, schoolId: superAdminSchoolId }),
          libraryApi.reportOverdue({ token: token || undefined, schoolId: superAdminSchoolId }),
        ]);
        setMostBorrowed(mb);
        setOverdue(od);
      } catch (e: any) {
        setError(e.message || 'Failed to load reports');
      }
    };
    load();
  }, [token, superAdminSchoolId]);

  if (!canView) return <div>Not authorized</div>;

  return (
    <div className="space-y-6">
      {error && <div className="text-red-500">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Most Borrowed (Top 10)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book ID</TableHead>
                <TableHead>Times Borrowed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mostBorrowed.map((row) => (
                <TableRow key={row.bookId}>
                  <TableCell>{row.bookId}</TableCell>
                  <TableCell>{row.borrowCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overdue Borrowings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Borrowing ID</TableHead>
                <TableHead>Book</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overdue.map((br) => (
                <TableRow key={br.id}>
                  <TableCell>{br.id}</TableCell>
                  <TableCell>{br.bookId || br.bookName || '-'}</TableCell>
                  <TableCell>{br.studentId}</TableCell>
                  <TableCell>{new Date(br.dueAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
