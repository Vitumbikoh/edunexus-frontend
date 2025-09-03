import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Download } from 'lucide-react';

// Reuse GradeRecord shape from Reports (duplicated lightweight)
interface GradeRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId?: string;
  className?: string;
  courseId?: string;
  courseName?: string;
  academicCalendarId: string;
  academicCalendarName?: string;
  termId: string;
  termName: string;
  score: number | null;
  grade?: string | null;
  aggregated?: boolean;
}

interface AcademicCalendar { id: string; term?: string; name?: string; year?: string; isActive?: boolean; isCompleted?: boolean; }
interface TermOption { id: string; name: string; sequence?: number; periodName?: string; termNumber?: number; }
interface ClassOption { id: string; name: string; }
interface StudentOption { id: string; firstName: string; lastName: string; }

const API_BASE = 'http://localhost:5000/api/v1';
const ENDPOINTS = {
  academicCalendars: `${API_BASE}/settings/academic-calendars`,
  terms: `${API_BASE}/settings/terms`,
  classes: `${API_BASE}/classes`,
  students: `${API_BASE}/student/students`,
  gradesReport: `${API_BASE}/grades/report`,
};

const GradesReport: React.FC = () => {
  const { token } = useAuth();
  const { toast } = useToast();

  const [academicCalendars, setAcademicCalendars] = useState<AcademicCalendar[]>([]);
  const [terms, setTerms] = useState<TermOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);

  const [selectedAcademicCalendarId, setSelectedAcademicCalendarId] = useState('');
  const [selectedTermIds, setSelectedTermIds] = useState<string[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const [gradesData, setGradesData] = useState<GradeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const formatAcademicCalendar = (ac: AcademicCalendar) => {
    const base = ac.name || ac.term || ac.year || ac.id;
    const status = ac.isActive ? 'Active' : ac.isCompleted ? 'Completed' : '';
    return status ? `${base} (${status})` : base;
  };

  const fetchAcademicCalendars = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(ENDPOINTS.academicCalendars, { headers: authHeaders });
      if (!res.ok) throw new Error('Failed to load academic calendars');
      const data = await res.json();
      setAcademicCalendars(data.academicCalendars || data || []);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  }, [token]);

  const fetchTerms = useCallback(async (calendarId: string) => {
    if (!calendarId) { setTerms([]); return; }
    try {
      const res = await fetch(`${ENDPOINTS.terms}?academicCalendarId=${encodeURIComponent(calendarId)}`, { headers: authHeaders });
      if (!res.ok) throw new Error('Failed to load terms');
      const data = await res.json();
      const raw = data.terms || data || [];
      const mapped: TermOption[] = raw.map((t: any) => {
        const num = typeof t.termNumber === 'number' ? t.termNumber : parseInt((t.periodName || '').match(/\d+/)?.[0] || '0', 10);
        return { id: t.id, name: `Term ${num || 0}`, sequence: num || 0, periodName: t.periodName, termNumber: t.termNumber };
      }).sort((a,b)=> (a.sequence||0)-(b.sequence||0));
      setTerms(mapped);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  }, [token]);

  const fetchClasses = useCallback(async () => {
    try { const res = await fetch(ENDPOINTS.classes, { headers: authHeaders }); if (!res.ok) throw new Error('Failed to load classes'); const data = await res.json(); setClasses(data.classes || data || []);} catch(e:any){ toast({ title:'Error', description:e.message, variant:'destructive'});} }, [token]);
  const fetchStudents = useCallback(async () => {
    try { const res = await fetch(ENDPOINTS.students, { headers: authHeaders }); if (!res.ok) throw new Error('Failed to load students'); const data = await res.json(); setStudents(data.students || data || []);} catch(e:any){ toast({ title:'Error', description:e.message, variant:'destructive'});} }, [token]);

  const fetchGrades = async () => {
    if (!selectedAcademicCalendarId) { toast({ title: 'Validation', description: 'Academic Calendar is required.', variant: 'destructive' }); return; }
    setIsLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      params.append('academicCalendarId', selectedAcademicCalendarId);
      if (selectedTermIds.length) { selectedTermIds.forEach(t=>params.append('termIds', t)); if (selectedTermIds.length>1) params.append('aggregateTerms','true'); }
      if (selectedClassId) params.append('classId', selectedClassId);
      selectedStudentIds.forEach(s=>params.append('studentIds', s));
      const res = await fetch(`${ENDPOINTS.gradesReport}?${params.toString()}`, { headers: authHeaders });
      if (!res.ok) throw new Error(`Failed to fetch grades: ${res.statusText}`);
      const data = await res.json();
      if (Array.isArray(data.students)) {
        const flattened: GradeRecord[] = [];
        data.students.forEach((sObj:any)=>{
          const stu = sObj.student||{}; const studentName = [stu.firstName, stu.lastName].filter(Boolean).join(' ')||'Unknown';
          (sObj.terms||[]).forEach((term:any)=>{
            (term.assessments||[]).forEach((a:any)=>{
              flattened.push({
                id: a.gradeId || a.id,
                studentId: stu.id,
                studentName,
                classId: stu.classId,
                className: stu.className,
                courseName: a.subject || a.examTitle,
                academicCalendarId: data.metadata?.academicCalendarId || '',
                termId: term.termId,
                termName: `Term ${term.termNumber}`,
                score: a.marksObtained ?? a.percentage ?? null,
                grade: a.grade ?? null,
                aggregated: false,
              });
            });
          });
          if (sObj.combined && sObj.combined.averagePercentage != null) {
            flattened.push({
              id: `combined-${stu.id}`,
              studentId: stu.id,
              studentName,
              classId: stu.classId,
              className: stu.className,
              courseName: 'All Subjects',
              academicCalendarId: data.metadata?.academicCalendarId || '',
              termId: (sObj.combined.termIds||[]).join(','),
              termName: 'All Selected Terms',
              score: sObj.combined.averagePercentage,
              grade: sObj.combined.remarks || null,
              aggregated: true,
            });
          }
        });
        setGradesData(flattened);
        if (!flattened.length) toast({ title:'Info', description:'No grade records found.' });
        return;
      }
      const raw = Array.isArray(data.grades)? data.grades : Array.isArray(data)? data : [];
      setGradesData(raw);
      if (!raw.length) toast({ title:'Info', description:'No grade records found.' });
    } catch (e:any) { setError(e.message||'Failed to load grades'); toast({ title:'Error', description:e.message, variant:'destructive'});} finally { setIsLoading(false); }
  };

  useEffect(()=>{ fetchAcademicCalendars(); fetchClasses(); fetchStudents(); }, [fetchAcademicCalendars, fetchClasses, fetchStudents]);
  useEffect(()=>{ if (selectedAcademicCalendarId) { fetchTerms(selectedAcademicCalendarId); setSelectedTermIds([]); } }, [selectedAcademicCalendarId, fetchTerms]);

  const exportGrades = () => {
    if (!gradesData.length) { toast({ title:'Info', description:'No grades to export.'}); return; }
    // Simple CSV
    const headers = ['Student','Class','Course','Term','Score','Grade','Aggregated'];
    const rows = gradesData.map(g=> [g.studentName, g.className||'', g.courseName||'', g.termName, g.score ?? '', g.grade ?? '', g.aggregated? 'Yes':'No']);
    const csv = [headers.join(','), ...rows.map(r=> r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'grades-report.csv'; a.click(); URL.revokeObjectURL(url);
    toast({ title:'Success', description:'Grades exported.' });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Grades Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-semibold mb-3">Filter Options</h4>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Academic Calendar *</label>
                <select className="border rounded px-2 py-1 text-sm" value={selectedAcademicCalendarId} onChange={e=>{ setSelectedAcademicCalendarId(e.target.value); setGradesData([]); }}>
                  <option value="">Select...</option>
                  {academicCalendars.map(ac=> <option key={ac.id} value={ac.id}>{formatAcademicCalendar(ac)}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Terms (optional)</label>
                  {terms.length>0 && (
                    <div className="flex gap-1">
                      <button type="button" className="text-xs text-blue-600 hover:text-blue-800" onClick={()=>{ setSelectedTermIds(terms.map(t=>t.id)); setGradesData([]); }}>Select All</button>
                      <span className="text-xs text-gray-400">|</span>
                      <button type="button" className="text-xs text-blue-600 hover:text-blue-800" onClick={()=>{ setSelectedTermIds([]); setGradesData([]); }}>Clear All</button>
                    </div>
                  )}
                </div>
                <div className="border rounded px-3 py-2 max-h-32 overflow-y-auto bg-gray-50">
                  {terms.length===0 ? <p className="text-sm text-gray-500">Select an Academic Calendar first</p> : (
                    <div className="space-y-2">
                      {terms.map(term=> (
                        <div key={term.id} className="flex items-center space-x-2">
                          <Checkbox id={term.id} checked={selectedTermIds.includes(term.id)} onCheckedChange={checked=>{ if (checked) setSelectedTermIds([...selectedTermIds, term.id]); else setSelectedTermIds(selectedTermIds.filter(id=> id!==term.id)); setGradesData([]); }} />
                          <label htmlFor={term.id} className="text-sm font-medium leading-none cursor-pointer">{term.name}</label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Class (optional)</label>
                <select className="border rounded px-2 py-1 text-sm" value={selectedClassId} onChange={e=>{ setSelectedClassId(e.target.value); setGradesData([]); }}>
                  <option value="">All</option>
                  {classes.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Students (optional)</label>
                <select multiple className="border rounded px-2 py-1 text-sm h-32" value={selectedStudentIds} onChange={e=>{ const opts = Array.from(e.target.selectedOptions).map(o=>o.value); setSelectedStudentIds(opts); setGradesData([]); }} title="Hold Ctrl/Cmd and click to select multiple students">
                  {students.map(s=> <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                </select>
                <p className="text-xs text-gray-500">Hold Ctrl/Cmd to multi-select</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button onClick={fetchGrades} variant="default" disabled={isLoading}>{isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Run Query</Button>
              <Button onClick={exportGrades} variant="outline" disabled={isLoading || !gradesData.length}><Download className="h-4 w-4 mr-2" />Export</Button>
            </div>
          </div>

          {selectedAcademicCalendarId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Current Selection</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p><span className="font-medium">Academic Calendar:</span> {formatAcademicCalendar(academicCalendars.find(a=>a.id===selectedAcademicCalendarId)! )}</p>
                {selectedTermIds.length>0 && <p><span className="font-medium">Terms:</span> {selectedTermIds.map(id=> terms.find(t=>t.id===id)?.name).filter(Boolean).join(', ')}</p>}
                {selectedClassId && <p><span className="font-medium">Class:</span> {classes.find(c=>c.id===selectedClassId)?.name}</p>}
                {selectedStudentIds.length>0 && <p><span className="font-medium">Students:</span> {selectedStudentIds.length} selected</p>}
              </div>
            </div>
          )}

          <div className="border rounded">
            <div className="p-2 flex items-center justify-between bg-muted/40">
              <span className="text-sm font-medium">Results {gradesData.length? `(${gradesData.length})`:''}</span>
              {selectedTermIds.length>1 && <span className="text-xs text-muted-foreground">Aggregated across {selectedTermIds.length} terms</span>}
            </div>
            {isLoading ? (
              <div className="p-6 flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin"/> Loading grades...</div>
            ) : error ? (
              <div className="p-6 text-sm text-red-500">{error}</div>
            ) : gradesData.length===0 ? (
              <div className="p-6 text-sm text-muted-foreground">No data. Adjust filters and run query.</div>
            ) : (
              <div className="overflow-auto max-h-[400px]">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2">Student</th>
                      <th className="text-left px-3 py-2">Class</th>
                      <th className="text-left px-3 py-2">Course</th>
                      <th className="text-left px-3 py-2">Term</th>
                      <th className="text-left px-3 py-2">Score</th>
                      <th className="text-left px-3 py-2">Grade</th>
                      <th className="text-left px-3 py-2">Agg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradesData.map(g=> (
                      <tr key={g.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-3 py-2 whitespace-nowrap">{g.studentName}</td>
                        <td className="px-3 py-2">{g.className||'-'}</td>
                        <td className="px-3 py-2">{g.courseName|| (g.aggregated? 'All Subjects':'-')}</td>
                        <td className="px-3 py-2">{g.termName}</td>
                        <td className="px-3 py-2">{g.score ?? '-'}</td>
                        <td className="px-3 py-2">{g.grade ?? '-'}</td>
                        <td className="px-3 py-2">{g.aggregated ? <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Yes</span>: ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GradesReport;
