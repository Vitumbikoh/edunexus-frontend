import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG } from '@/config/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

interface SchemeComponent { componentType:string; weight:number; required:boolean; }
interface Scheme { id:string; courseId:string; termId:string; totalWeight:number; passThreshold?:number; components: SchemeComponent[]; isLocked:boolean; version:number; }
interface ResultRow { id:string; studentId:string; finalPercentage?:string|null; finalGradeCode?:string|null; pass?:boolean|null; breakdown?: any[]; status:string; }
interface SchemeSummary { id:string; courseId:string; termId:string; version:number; totalWeight:number; components: SchemeComponent[]; updatedAt?:string; }
interface TermOption { id:string; termNumber:number; isCurrent?:boolean; name?:string; }
interface CourseOption { id:string; name:string; }

const COMPONENT_OPTIONS = [
  {value:'midterm', label:'Mid Term'},
  {value:'endterm', label:'End Term'},
  {value:'assignment', label:'Assignment'},
  {value:'quiz', label:'Quiz'},
  {value:'practical', label:'Practical'},
  {value:'project', label:'Project'},
];

export default function CourseTermScheme(){
  const { token } = useAuth();
  const [searchParams,setSearchParams] = useSearchParams();
  const initialCourseId = searchParams.get('courseId') || '';
  const [courseId,setCourseId] = useState<string>(initialCourseId);
  const [termId,setTermId] = useState<string>('');
  const [terms,setTerms] = useState<TermOption[]>([]);
  const [courses,setCourses] = useState<CourseOption[]>([]);
  const [loading,setLoading] = useState(false);
  const [saving,setSaving] = useState(false);
  const [scheme,setScheme] = useState<Scheme|null>(null);
  const [components,setComponents] = useState<SchemeComponent[]>([]);
  const [results,setResults] = useState<ResultRow[]>([]); // legacy (may remove later)
  const [resultsLoading,setResultsLoading] = useState(false);
  const [schemes,setSchemes] = useState<SchemeSummary[]>([]);
  const [schemesLoading,setSchemesLoading] = useState(false);
  const { toast } = useToast();

  useEffect(()=>{ fetchTerms(); fetchCourses(); },[token]);
  useEffect(()=>{ if(courseId && termId){ fetchScheme(); fetchResults(); fetchSchemes(); } },[courseId, termId]);

  const authHeaders = token? { Authorization:`Bearer ${token}` }: {};

  async function fetchTerms(){
    try { const res = await fetch(`${API_CONFIG.BASE_URL}/settings/terms`, { headers: authHeaders }); if(res.ok){ const data = await res.json(); setTerms(data||[]); const current = data?.find((t:TermOption)=>t.isCurrent); if(current) setTermId(current.id); }} catch{}
  }
  async function fetchCourses(){
    try { const res = await fetch(`${API_CONFIG.BASE_URL}/teacher/my-courses?limit=200`, { headers: authHeaders }); if(res.ok){ const data = await res.json(); if(data?.courses){ const list = data.courses.map((c:any)=> ({ id:c.id, name:c.name })); setCourses(list); if(!courseId && list.length===1){ setCourseId(list[0].id); searchParams.set('courseId', list[0].id); setSearchParams(searchParams, { replace:true }); } } } } catch{}
  }
  async function fetchScheme(){
    try { const res = await fetch(`${API_CONFIG.BASE_URL}/aggregation/scheme?courseId=${courseId}&termId=${termId}`, { headers: authHeaders }); if(res.ok){ const data = await res.json(); if(data){ setScheme(data); setComponents(data.components||[]); } else { setScheme(null); setComponents([]); } }} catch{}
  }
  async function fetchResults(){
    setResultsLoading(true); try { const res = await fetch(`${API_CONFIG.BASE_URL}/aggregation/results?courseId=${courseId}&termId=${termId}`, { headers: authHeaders }); if(res.ok){ const data = await res.json(); setResults(Array.isArray(data)? data : []); } } catch{} finally { setResultsLoading(false); }
  }
  async function fetchSchemes(){
    setSchemesLoading(true);
    try { const res = await fetch(`${API_CONFIG.BASE_URL}/aggregation/schemes?termId=${termId}`, { headers: authHeaders }); if(res.ok){ const data = await res.json(); setSchemes(Array.isArray(data)? data: []); } } catch{} finally { setSchemesLoading(false); }
  }

  function addComponent(){
    const used = new Set(components.map(c=> c.componentType));
    const available = COMPONENT_OPTIONS.map(o=>o.value).find(v=> !used.has(v));
    if(!available){
      toast({ title:'All components added', description:'No more component types available.', variant:'default' });
      return;
    }
    setComponents(prev=> [...prev, { componentType: available, weight:0, required:true }]);
  }
  function updateComponent(index:number, patch: Partial<SchemeComponent>){
    setComponents(prev=> prev.map((c,i)=> {
      if(i!==index) return c;
      const next = { ...c, ...patch };
      return next;
    }));
  }
  function removeComponent(index:number){ setComponents(prev=> prev.filter((_,i)=> i!== index)); }

  const totalWeight = useMemo(()=> components.reduce((s,c)=> s + (Number(c.weight)||0),0),[components]);
  const weightValid = totalWeight === 100 && components.length>0;
  const allTypesUsed = components.length === COMPONENT_OPTIONS.length;

  async function saveScheme(){
    if(!courseId || !termId){ toast({ title:'Missing info', description:'Course or Term not selected', variant:'destructive' }); return; }
    if(components.length===0){ toast({ title:'No components', description:'Add at least one component before saving.' }); return; }
    if(!weightValid){ toast({ title:'Invalid weights', description:'Weights must sum to 100%.' , variant:'destructive'}); return; }
    // Ensure unique types
    const types = components.map(c=> c.componentType);
    if(new Set(types).size !== types.length){ toast({ title:'Duplicate component', description:'Each component type can only appear once.', variant:'destructive' }); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/aggregation/scheme`, { method:'POST', headers:{ 'Content-Type':'application/json', ...authHeaders }, body: JSON.stringify({ courseId, termId, components }) });
      if(res.ok){
        toast({ title:'Scheme saved', description:'Weighting scheme updated successfully.' });
        await fetchScheme();
        await fetchResults();
      } else {
        toast({ title:'Save failed', description:'Server rejected the scheme.', variant:'destructive' });
      }
    } catch (e){
      toast({ title:'Error', description:'Network or server error.', variant:'destructive' });
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Course Weighting Scheme</h1>
          <p className="text-muted-foreground text-sm">Define how exams contribute to final grade (per term).</p>
        </div>
        <div className="flex gap-3 flex-wrap items-end">
          <div className="w-56">
            <Select value={courseId} onValueChange={v=> { setCourseId(v); searchParams.set('courseId', v); setSearchParams(searchParams, { replace:true }); }}>
              <SelectTrigger><SelectValue placeholder="Select Course" /></SelectTrigger>
              <SelectContent>
                {courses.map(c=> <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-48">
            <Select value={termId} onValueChange={v=> setTermId(v)}>
              <SelectTrigger><SelectValue placeholder="Select Term" /></SelectTrigger>
              <SelectContent>
                {terms.map(t=> <SelectItem key={t.id} value={t.id}>{t.name || `Term ${t.termNumber}`}{t.isCurrent && ' (Current)'}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={saveScheme} disabled={!weightValid || components.length===0 || saving || !courseId}>{saving? 'Saving...' : 'Save Scheme'}</Button>
          <Button variant="outline" onClick={()=> { fetchSchemes(); }} disabled={schemesLoading}>Refresh Schemes</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Components {weightValid? <Badge variant="secondary">{totalWeight}%</Badge> : <Badge variant="destructive">{totalWeight}% (Need 100%)</Badge>}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {components.map((c,i)=> {
              const remaining = 100 - (totalWeight - c.weight);
              const availableTypes = COMPONENT_OPTIONS.filter(opt => opt.value === c.componentType || !components.some(cc=> cc.componentType === opt.value));
              return (
              <div key={i} className="flex gap-3 items-end flex-wrap border p-3 rounded-md">
                <div className="w-40">
                  <Select value={c.componentType} onValueChange={v=> updateComponent(i,{ componentType:v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {availableTypes.map(opt=> <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    className="w-full border rounded-md px-2 py-1 text-sm"
                    value={c.weight}
                    min={0}
                    max={remaining}
                    onChange={e=> {
                      let val = Number(e.target.value);
                      if(val > remaining) val = remaining;
                      if(val < 0) val = 0;
                      updateComponent(i,{ weight: val });
                    }}
                  />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={c.required} onChange={e=> updateComponent(i,{ required:e.target.checked })} /> Required
                </div>
                <Button variant="ghost" onClick={()=> removeComponent(i)}>Remove</Button>
              </div>
              );
            })}
            <Button variant="outline" onClick={addComponent} disabled={totalWeight>=100 || allTypesUsed || !courseId}>Add Component</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Schemes (This Term)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Total Weight</TableHead>
                  <TableHead>Components</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schemesLoading ? <TableRow><TableCell colSpan={5} className="text-center py-6">Loading...</TableCell></TableRow> : (
                  schemes.length ===0 ? <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No schemes yet</TableCell></TableRow> : (
                    schemes.map(s=> {
                      const courseName = courses.find(c=> c.id===s.courseId)?.name || s.courseId;
                      return (
                        <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={()=> { setCourseId(s.courseId); searchParams.set('courseId', s.courseId); setSearchParams(searchParams,{ replace:true }); }}>
                          <TableCell>{courseName}</TableCell>
                          <TableCell>{s.version}</TableCell>
                          <TableCell>{s.totalWeight}%</TableCell>
                          <TableCell className="space-x-1">
                            {s.components?.map(c=> <Badge key={c.componentType} variant="secondary">{c.componentType}:{c.weight}%</Badge>)}
                          </TableCell>
                          <TableCell>{s.updatedAt? new Date(s.updatedAt).toLocaleDateString(): '-'}</TableCell>
                        </TableRow>
                      );
                    })
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
