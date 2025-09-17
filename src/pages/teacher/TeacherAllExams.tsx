import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '@/config/api';
import { TablePreloader } from '@/components/ui/preloader';

interface TermOption { id: string; name?: string; termNumber?: number; isCurrent?: boolean; }
interface ExamRow { id:string; title:string; examType:string; date:string; totalMarks:number; status:string; course?:{id:string; name:string}; class?:{id:string; name:string}; Term?:{id:string; name?:string; termNumber?:number}; }

export default function TeacherAllExams(){
  const { token } = useAuth();
  const navigate = useNavigate();
  const [terms,setTerms]=useState<TermOption[]>([]);
  const [currentTermId,setCurrentTermId]=useState<string|undefined>();
  const [selectedTerm,setSelectedTerm]=useState<string|undefined>();
  const [exams,setExams]=useState<ExamRow[]>([]);
  const [loading,setLoading]=useState(false);
  const [search,setSearch]=useState('');
  const [termLoadError,setTermLoadError]=useState(false);

  const fetchCurrentTerm = async () => {
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/analytics/current-term`, { headers: token? { Authorization: `Bearer ${token}`}:{} });
      if(res.ok){
        const data = await res.json();
        if(data?.term?.id){
          setCurrentTermId(data.term.id);
          setSelectedTerm(data.term.id);
        }
      }
    }catch{}
  };

  const fetchTerms = async () => {
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/settings/terms`, { headers: token? { Authorization: `Bearer ${token}`}:{} });
      if(res.ok){
        const data = await res.json();
        if(Array.isArray(data)){
          setTerms(data);
          setTermLoadError(data.length === 0);
        } else {
          setTermLoadError(true);
        }
      } else {
        setTermLoadError(true);
      }
    }catch{ setTermLoadError(true); }
  };

  const fetchExams = async (termId?:string) => {
    if(!token) return;
    setLoading(true);
    try{
      const url = new URL(`${API_CONFIG.BASE_URL}/teacher/my-exams/all`);
      if(termId) url.searchParams.set('termId', termId);
      const res = await fetch(url.toString(), { headers:{ Authorization:`Bearer ${token}` }});
      if(res.ok){
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.exams || [];
        setExams(list);
      } else {
        setExams([]);
      }
    }catch{ setExams([]);} finally { setLoading(false);} }

  useEffect(()=>{ fetchCurrentTerm(); fetchTerms(); },[token]);
  useEffect(()=>{ fetchExams(selectedTerm); },[selectedTerm, token]);

  const filtered = exams.filter(e=>{
    if(!search.trim()) return true;
    const q=search.toLowerCase();
    return (e.title||'').toLowerCase().includes(q) || (e.course?.name||'').toLowerCase().includes(q) || (e.examType||'').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Exams</h1>
          <p className="text-muted-foreground">All exams for your courses {selectedTerm ? '(Term Filter Applied)' : ''}</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="w-40">
            <Select value={selectedTerm} onValueChange={(v)=>setSelectedTerm(v === 'ALL' ? undefined : v)} disabled={terms.length===0 && !termLoadError}>
              <SelectTrigger>
                <SelectValue placeholder={terms.length===0 ? (termLoadError ? 'No terms' : 'Loading terms...') : 'Select Term'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Terms</SelectItem>
                {terms.map(t=> (
                  <SelectItem key={t.id} value={t.id}>{t.name || `Term ${t.termNumber}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-56">
            <Input placeholder="Search exams..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <Button variant="outline" onClick={()=>fetchExams(selectedTerm)} disabled={loading}>Refresh</Button>
        </div>
      </div>
      {termLoadError && (
        <p className="text-xs text-amber-600">Could not load terms. Showing all exams (unfiltered).</p>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Exams {selectedTerm && terms.length>0 && (() => {
            const tm = terms.find(t=>t.id===selectedTerm);
            return tm ? `- ${tm.name || `Term ${tm.termNumber}`}` : '';
          })()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TablePreloader colSpan={7} text="Loading exams..." />
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No exams found</TableCell></TableRow>
                ) : filtered.map(exam => (
                  <TableRow key={exam.id}>
                    <TableCell className="font-medium">{exam.title}</TableCell>
                    <TableCell>{exam.course?.name || '-'}</TableCell>
                    <TableCell>{exam.class?.name || '-'}</TableCell>
                    <TableCell>{exam.date ? new Date(exam.date).toLocaleDateString(): 'N/A'}</TableCell>
                    <TableCell>{exam.examType}</TableCell>
                    <TableCell><Badge variant="secondary">{exam.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={()=>navigate(`/exams/${exam.id}`)}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}