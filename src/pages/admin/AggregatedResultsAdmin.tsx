import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG } from '@/config/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ResultRow { id:string; studentId:string; courseId:string; termId:string; finalPercentage?:string|null; finalGradeCode?:string|null; pass?:boolean|null; status:string; breakdown?: any; computedAt?:string; schemeVersion?:number; }
interface CourseOption { id:string; name:string; }
interface TermOption { id:string; termNumber:number; name?:string; isCurrent?:boolean; }

// Admin view: can load all courses (or filter) and optionally all results for a term
export default function AggregatedResultsAdmin(){
  const { token } = useAuth();
  const [courses,setCourses] = useState<CourseOption[]>([]);
  const [terms,setTerms] = useState<TermOption[]>([]);
  const [results,setResults] = useState<ResultRow[]>([]);
  const [courseId,setCourseId] = useState('');
  const [termId,setTermId] = useState('');
  const [search,setSearch] = useState('');
  const [loading,setLoading] = useState(false);
  const [showBreakdown,setShowBreakdown] = useState(false);

  const authHeaders = token? { Authorization:`Bearer ${token}` } : {};

  useEffect(()=>{ fetchTerms(); fetchCourses(); },[token]);
  useEffect(()=>{ if(courseId && termId) fetchResults(); },[courseId, termId]);

  async function fetchTerms(){ try { const r = await fetch(`${API_CONFIG.BASE_URL}/settings/terms`, { headers: authHeaders }); if(r.ok){ const data = await r.json(); setTerms(data||[]); const cur = data?.find((t:TermOption)=>t.isCurrent); if(cur) setTermId(cur.id); } } catch{} }
  async function fetchCourses(){ try { // admin endpoint for all courses
    const r = await fetch(`${API_CONFIG.BASE_URL}/courses/view?limit=500`, { headers: authHeaders }); if(r.ok){ const data = await r.json(); if(Array.isArray(data?.courses)){ setCourses(data.courses.map((c:any)=> ({ id:c.id, name:c.name })) ); } else if(Array.isArray(data)){ // fallback if API returns array directly
      setCourses(data.map((c:any)=> ({ id:c.id, name:c.name||c.title||c.code||c.id })) );
    } } } catch{} }
  async function fetchResults(){ setLoading(true); try { const r = await fetch(`${API_CONFIG.BASE_URL}/aggregation/results?courseId=${courseId}&termId=${termId}`, { headers: authHeaders }); if(r.ok){ const data = await r.json(); setResults(Array.isArray(data)? data: []); } } finally { setLoading(false); } }

  const filtered = useMemo(()=> results.filter(r=> !search || r.studentId.toLowerCase().includes(search.toLowerCase())),[results, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold">Aggregated Results</h1>
          <p className="text-sm text-muted-foreground">Final computed course results per student (per term).</p>
        </div>
        <div className="flex gap-3 flex-wrap items-end">
          <div className="w-56">
            <Select value={courseId} onValueChange={v=>setCourseId(v)}>
              <SelectTrigger><SelectValue placeholder="Course" /></SelectTrigger>
              <SelectContent>
                {courses.map(c=> <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-48">
            <Select value={termId} onValueChange={v=>setTermId(v)}>
              <SelectTrigger><SelectValue placeholder="Term" /></SelectTrigger>
              <SelectContent>
                {terms.map(t=> <SelectItem key={t.id} value={t.id}>{t.name || `Term ${t.termNumber}`}{t.isCurrent && ' (Current)'}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-52">
            <Input placeholder="Search student id..." value={search} onChange={e=> setSearch(e.target.value)} />
          </div>
          <Button variant="outline" onClick={fetchResults} disabled={!courseId || !termId || loading}>{loading? 'Loading...' : 'Refresh'}</Button>
          <Button variant={showBreakdown? 'secondary':'outline'} onClick={()=> setShowBreakdown(s=> !s)} disabled={filtered.length===0}> {showBreakdown? 'Hide Breakdown' : 'Show Breakdown'} </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Results {courseId && termId ? '' : '(select course & term)'} </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Final %</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Pass</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Version</TableHead>
                  {showBreakdown && <TableHead>Breakdown</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={showBreakdown?7:6} className="text-center py-6">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={showBreakdown?7:6} className="text-center py-6 text-muted-foreground">No results</TableCell></TableRow>
                ) : (
                  filtered.map(r=> (
                    <TableRow key={r.id}>
                      <TableCell>{r.studentId}</TableCell>
                      <TableCell>{r.finalPercentage ?? '-'}</TableCell>
                      <TableCell>{r.finalGradeCode ?? '-'}</TableCell>
                      <TableCell>{r.pass==null? '-' : (r.pass? <Badge variant="secondary">Yes</Badge>: <Badge variant="destructive">No</Badge>)}</TableCell>
                      <TableCell>{r.status}</TableCell>
                      <TableCell>{r.schemeVersion ?? '-'}</TableCell>
                      {showBreakdown && <TableCell className="max-w-md whitespace-pre-wrap text-xs">{Array.isArray(r.breakdown)? r.breakdown.map((b:any)=> `${b.componentType}:${b.earnedPercentage ?? 'NA'}(${b.weight}%)`).join(', ') : '-'}</TableCell>}
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
