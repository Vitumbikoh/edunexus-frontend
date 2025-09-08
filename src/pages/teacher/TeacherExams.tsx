import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { API_CONFIG } from '@/config/api';

export default function TeacherExams() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const courseId = params.get('courseId') || '';

  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const courseName = exams?.[0]?.course?.name || '';

  const fetchExams = async () => {
    if (!courseId || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/teacher/my-exams?courseId=${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to fetch exams: ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.exams || []);
      setExams(list);
    } catch (e) {
      // noop simple error handling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, token]);

  const filtered = exams.filter(e => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (e.title || '').toLowerCase().includes(q) ||
      (e.course?.name || '').toLowerCase().includes(q) ||
      (e.examType || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Course Exams</h1>
          <p className="text-muted-foreground">All exams for this course{courseName ? `: ${courseName}` : ''} (you as the teacher)</p>
        </div>
        <Button variant="outline" onClick={fetchExams} className="gap-2" disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Input placeholder="Search exams..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exams</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total Marks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center">Loading...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No exams found</TableCell>
                  </TableRow>
                ) : (
                  filtered.map(exam => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.title}</TableCell>
                      <TableCell>{exam.course?.name || '-'}</TableCell>
                      <TableCell>{exam.date ? new Date(exam.date).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>{exam.totalMarks}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{exam.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(`/exams/${exam.id}`)}>
                          <FileText className="h-4 w-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
