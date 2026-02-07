import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SearchBar } from '@/components/ui/search-bar';
import { apiFetch } from '@/lib/apiClient';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, getDefaultCurrency } from '@/lib/currency';

export default function GraduatedOutstanding() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [outstandingMap, setOutstandingMap] = useState<Record<string, number>>({});
  const [onlyOutstanding, setOnlyOutstanding] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadGraduatedStudents();
  }, []);

  const loadGraduatedStudents = async () => {
    try {
      setLoading(true);
      // Fetch students and filter graduated ones. The API doesn't have a special graduated endpoint,
      // so we fetch students and detect by class name (common convention in the app)
      const res = await apiFetch<any>(`/student/students?page=1&limit=1000`);
      const list = Array.isArray(res?.students) ? res.students : (res?.data || []);
      const grads = list.filter((s: any) => {
        const className = s.class?.name || '';
        return /graduated|alumni|leavers/i.test(className) || s.isGraduated === true;
      });
      setStudents(grads);
    } catch (error) {
      console.error('Failed to load graduated students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const checkOutstanding = async (studentId: string) => {
    try {
      const details = await apiFetch<any>(`/finance/student-financial-details/${studentId}`);
      const outstanding = Number(details?.summary?.totalOutstandingAllTerms || 0);
      setOutstandingMap(prev => ({ ...prev, [studentId]: outstanding }));
    } catch (error) {
      console.error('Failed to load student financial details:', error);
      setOutstandingMap(prev => ({ ...prev, [studentId]: 0 }));
    }
  };

  const filtered = students.filter(s => {
    const q = searchTerm.trim().toLowerCase();
    const name = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
    if (q && !name.includes(q) && !(s.studentId || '').toLowerCase().includes(q)) return false;
    if (onlyOutstanding) {
      const val = outstandingMap[s.id];
      return typeof val === 'number' ? val > 0 : true; // if not checked yet, keep it visible
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Graduated Outstanding</h1>
          <p className="text-muted-foreground">Accept payments from graduated students with outstanding fees.</p>
        </div>
        <div className="flex items-center space-x-2">
          <SearchBar value={searchInput} onChange={setSearchInput} onDebouncedChange={setSearchTerm} placeholder="Search graduated students..." />
          <Button variant="outline" onClick={() => setOnlyOutstanding(prev => !prev)}>
            {onlyOutstanding ? 'Show All' : 'Only Outstanding'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Graduated Students</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.firstName} {s.lastName}</TableCell>
                    <TableCell>{s.studentId || '—'}</TableCell>
                    <TableCell>{s.class?.name || 'Graduated'}</TableCell>
                    <TableCell>
                      {typeof outstandingMap[s.id] === 'number' ? (
                        formatCurrency(outstandingMap[s.id], getDefaultCurrency())
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => checkOutstanding(s.id)}>Check Outstanding</Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button onClick={() => { navigate('/finance/record', { state: { prefillStudentId: s.id } }); }}>
                          Record Payment
                        </Button>
                        <Button variant="ghost" onClick={() => checkOutstanding(s.id)}>Refresh</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
