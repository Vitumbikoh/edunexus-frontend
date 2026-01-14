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
import { TablePreloader } from '@/components/ui/preloader';
// import { Settings } from 'lucide-react';

interface SchemeComponent { componentType:string; weight:number; required:boolean; }
interface Scheme { id:string; courseId:string; termId:string; totalWeight:number; passThreshold?:number; components: SchemeComponent[]; isLocked:boolean; version:number; isDefault?: boolean; }
interface ResultRow { id:string; studentId:string; finalPercentage?:string|null; finalGradeCode?:string|null; pass?:boolean|null; breakdown?: unknown[]; status:string; }
interface SchemeSummary { id:string; courseId:string; termId:string; version:number; totalWeight:number; components: SchemeComponent[]; updatedAt?:string; isDefault?: boolean; }
interface TermOption { id:string; termNumber:number; isCurrent?:boolean; name?:string; }
interface CourseOption { id:string; name:string; }
interface TeacherCourseApi { id:string; name:string }

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
  useEffect(()=>{ if(termId && courses.length > 0){ fetchSchemes(); } },[termId, courses]);
  // When course changes, auto-refresh both the active scheme and the schemes table
  useEffect(()=>{ if(termId){ fetchSchemes(); } if(courseId && termId){ fetchScheme(); fetchResults(); } },[courseId, termId]);

  const authHeaders = token? { Authorization:`Bearer ${token}` }: {};

  async function fetchTerms(){
    try { const res = await fetch(`${API_CONFIG.BASE_URL}/settings/terms`, { headers: authHeaders }); if(res.ok){ const data = await res.json(); setTerms(data||[]); const current = data?.find((t:TermOption)=>t.isCurrent); if(current) setTermId(current.id); }} catch(e){ console.error('Failed to fetch terms', e); }
  }
  async function fetchCourses(){
    try { const res = await fetch(`${API_CONFIG.BASE_URL}/teacher/my-courses?limit=200`, { headers: authHeaders }); if(res.ok){ const data = await res.json(); if(data?.courses){ const list = data.courses.map((c:TeacherCourseApi)=> ({ id:c.id, name:c.name })); setCourses(list); if(!courseId && list.length===1){ setCourseId(list[0].id); searchParams.set('courseId', list[0].id); setSearchParams(searchParams, { replace:true }); } } } } catch(e){ console.error('Failed to fetch courses', e); }
  }
  async function fetchScheme(){
    try { 
      const res = await fetch(`${API_CONFIG.BASE_URL}/aggregation/scheme?courseId=${courseId}&termId=${termId}`, { headers: authHeaders }); 
      if(res.ok){ 
        const data = await res.json(); 
        if(data){ 
          setScheme(data); 
          setComponents(data.components||[]); 
        } else { 
          // No custom scheme, try to load default scheme
          const defaultRes = await fetch(`${API_CONFIG.BASE_URL}/aggregation/default-scheme?termId=${termId}`, { headers: authHeaders });
          if(defaultRes.ok) {
            const defaultData = await defaultRes.json();
            if(defaultData) {
              // Create a pseudo-scheme from the default
              const pseudoScheme = {
                ...defaultData,
                courseId: courseId,
                termId: termId,
                isDefault: true
              };
              setScheme(pseudoScheme);
              setComponents(defaultData.components || []);
            } else {
              setScheme(null); 
              setComponents([]);
            }
          } else {
            setScheme(null); 
            setComponents([]);
          }
        } 
      }
    } catch(e){ console.error('Failed to fetch scheme', e); }
  }
  async function fetchResults(){
    setResultsLoading(true); try { const res = await fetch(`${API_CONFIG.BASE_URL}/aggregation/results?courseId=${courseId}&termId=${termId}`, { headers: authHeaders }); if(res.ok){ const data = await res.json(); setResults(Array.isArray(data)? data : []); } } catch(e){ console.error('Failed to fetch results', e); } finally { setResultsLoading(false); }
  }
  async function fetchSchemes(){
    setSchemesLoading(true);
    try { 
      console.log('[DEBUG] fetchSchemes called with:', { courseId, termId, courses: courses.length });
      
      const url = courseId 
        ? `${API_CONFIG.BASE_URL}/aggregation/schemes?courseId=${courseId}&termId=${termId}`
        : `${API_CONFIG.BASE_URL}/aggregation/schemes?termId=${termId}`;
      
      console.log('[DEBUG] Fetching schemes from URL:', url);
      const res = await fetch(url, { headers: authHeaders }); 
      
      if(res.ok){ 
        const data = await res.json(); 
        console.log('[DEBUG] Raw schemes data from API:', data);
        
        let customSchemes: SchemeSummary[] = Array.isArray(data) ? data : [];
        console.log('[DEBUG] Custom schemes after array check:', customSchemes);
        
        // CRITICAL: If courseId is selected, ONLY return schemes for that course
        if(courseId) {
          // First, filter the API response to ensure we only have schemes for the selected course
          customSchemes = customSchemes.filter(s => s.courseId === courseId);
          console.log('[DEBUG] Schemes after courseId filtering:', customSchemes);
          // Keep only the latest version for this course (if multiple)
          if(customSchemes.length > 1){
            // Prefer higher version; fallback to latest updatedAt
            customSchemes.sort((a,b)=> {
              const v = (b.version ?? 0) - (a.version ?? 0);
              if(v !== 0) return v;
              const da = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
              const db = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
              return db - da;
            });
            customSchemes = [customSchemes[0]];
          }
          
          // If no custom scheme exists for this course, try to get default scheme
          if(customSchemes.length === 0 && termId) {
            console.log('[DEBUG] No custom scheme found, fetching default scheme');
            const defaultRes = await fetch(`${API_CONFIG.BASE_URL}/aggregation/school-default-scheme`, { headers: authHeaders });
            if(defaultRes.ok) {
              const defaultScheme = await defaultRes.json();
              console.log('[DEBUG] Default scheme:', defaultScheme);
              
              if(defaultScheme) {
                customSchemes = [{
                  id: `default-${courseId}`,
                  courseId: courseId,
                  termId: termId,
                  version: defaultScheme.version,
                  totalWeight: defaultScheme.totalWeight,
                  components: defaultScheme.components,
                  updatedAt: defaultScheme.updatedAt,
                  isDefault: true
                }];
                console.log('[DEBUG] Created default scheme entry:', customSchemes);
              }
            }
          }
        } else {
          // Viewing all courses: show custom schemes + default for courses without custom schemes
          if(termId) {
            // Fetch default scheme via teacher-accessible endpoint
            let defaultScheme: any = null;
            try {
              const defaultRes = await fetch(`${API_CONFIG.BASE_URL}/aggregation/school-default-scheme`, { headers: authHeaders });
              if(defaultRes.ok) {
                defaultScheme = await defaultRes.json();
              }
            } catch (e) {
              console.warn('[DEBUG] school-default-scheme fetch failed', e);
            }
            
            if(defaultScheme) {
              // Reduce to latest scheme per course first
              const latestByCourse = new Map<string, SchemeSummary>();
              for(const s of customSchemes){
                const existing = latestByCourse.get(s.courseId);
                if(!existing){ latestByCourse.set(s.courseId, s); continue; }
                const vDiff = (s.version ?? 0) - (existing.version ?? 0);
                if(vDiff > 0){ latestByCourse.set(s.courseId, s); continue; }
                if(vDiff === 0){
                  const ds = s.updatedAt ? new Date(s.updatedAt).getTime() : 0;
                  const de = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
                  if(ds > de) latestByCourse.set(s.courseId, s);
                }
              }
              customSchemes = Array.from(latestByCourse.values());

              const coursesWithSchemes = new Set(customSchemes.map(s => s.courseId));
              const coursesWithoutSchemes = courses.filter(c => !coursesWithSchemes.has(c.id));
              
              const defaultSchemeEntries = coursesWithoutSchemes.map(course => ({
                id: `default-${course.id}`,
                courseId: course.id,
                termId: termId,
                version: defaultScheme.version,
                totalWeight: defaultScheme.totalWeight,
                components: defaultScheme.components,
                updatedAt: defaultScheme.updatedAt,
                isDefault: true
              }));
              
              // Add a global default row at the very top (applies to all courses)
              const globalDefault: SchemeSummary = {
                id: 'default-global',
                courseId: 'all',
                termId: termId,
                version: defaultScheme.version,
                totalWeight: defaultScheme.totalWeight,
                components: defaultScheme.components,
                updatedAt: defaultScheme.updatedAt,
                isDefault: true
              };

              // Put global default first, then custom course latest, then default-backed courses
              const customSorted = [...customSchemes].sort((a,b)=>{
                const v = (b.version ?? 0) - (a.version ?? 0);
                if(v !== 0) return v;
                const da = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                const db = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                return db - da;
              });
              const defaultBackedSorted = [...defaultSchemeEntries].sort((a,b)=>{
                const na = courses.find(c=>c.id===a.courseId)?.name || a.courseId;
                const nb = courses.find(c=>c.id===b.courseId)?.name || b.courseId;
                return na.localeCompare(nb);
              });
              customSchemes = [globalDefault, ...customSorted, ...defaultBackedSorted];
            }
          }
        }
        
        console.log('[DEBUG] Final schemes to display:', customSchemes);
        setSchemes(customSchemes);
      } else {
        console.error('[DEBUG] Failed to fetch schemes:', res.status, res.statusText);
        setSchemes([]);
      }
    } catch(error) {
      console.error('[DEBUG] Error fetching schemes:', error);
      setSchemes([]);
    } finally { 
      setSchemesLoading(false); 
    }
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
            <Select 
              value={courseId || 'all'} 
              onValueChange={v=> { 
                if(v === 'all'){ 
                  setCourseId(''); 
                  searchParams.delete('courseId'); 
                  setSearchParams(searchParams, { replace:true }); 
                } else {
                  setCourseId(v); 
                  searchParams.set('courseId', v); 
                  setSearchParams(searchParams, { replace:true }); 
                }
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select Course" /></SelectTrigger>
              <SelectContent>
                <SelectItem key="all" value="all">All Courses</SelectItem>
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
          {courseId && !schemesLoading && schemes.some(s => s.courseId === courseId && !s.isDefault) && (
            <Button
              variant="destructive"
              onClick={async () => {
                if(!termId){ toast({ title:'Missing term', description:'Select a term first.', variant:'destructive' }); return; }
                if(!confirm('Delete this course scheme and revert to default?')) return;
                try {
                  const res = await fetch(`${API_CONFIG.BASE_URL}/aggregation/scheme?courseId=${courseId}&termId=${termId}` , { method:'DELETE', headers: authHeaders });
                  if(res.ok){
                    toast({ title:'Scheme removed', description:'Reverted to default weighting scheme.' });
                    await fetchScheme();
                    await fetchSchemes();
                  } else {
                    toast({ title:'Delete failed', description:'Could not delete scheme.', variant:'destructive' });
                  }
                } catch {
                  toast({ title:'Error', description:'Network or server error.', variant:'destructive' });
                }
              }}
            >
              Revert to Default
            </Button>
          )}
        </div>
      </div>

      {courseId && (
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
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            Available Schemes (This Term) 
            {!courseId ? (
              <span className="text-sm font-normal text-muted-foreground">- All Courses</span>
            ) : (
              <span className="text-sm font-normal text-muted-foreground">
                - {courses.find(c => c.id === courseId)?.name || 'Selected Course'}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            {/* Global default header for clarity in All Courses view */}
            {!courseId && schemes.length > 0 && schemes[0]?.id === 'default-global' && (
              <div className="px-4 py-2 text-sm bg-primary/10 text-primary border-b border-border flex items-center gap-2">
                <span className="font-medium">Default Weighting Scheme</span>
                <span className="text-muted-foreground">(applies to all courses unless overridden)</span>
              </div>
            )}
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
                {schemesLoading ? <TablePreloader colSpan={5} text="Loading schemes..." /> : (
                  schemes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        {courseId ? (
                          <div className="space-y-2">
                            <p>No weighting scheme found for this course.</p>
                            <p className="text-sm">Create a custom scheme above, or check if a default scheme is available.</p>
                          </div>
                        ) : (
                          "No schemes yet"
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    schemes.map(s=> {
                      const isGlobalDefault = s.id === 'default-global';
                      const courseName = isGlobalDefault 
                        ? 'All Courses (Default)'
                        : (courses.find(c=> c.id===s.courseId)?.name || s.courseId);
                      const isDefault = s.isDefault;
                      const onRowClick = () => {
                        if(isGlobalDefault){
                          // Stay in All Courses view
                          setCourseId('');
                          searchParams.delete('courseId');
                          setSearchParams(searchParams,{ replace:true });
                          return;
                        }
                        setCourseId(s.courseId);
                        searchParams.set('courseId', s.courseId);
                        setSearchParams(searchParams,{ replace:true });
                      };
                      return (
                        <TableRow key={s.id} className={`cursor-pointer hover:bg-muted/50 ${isDefault ? 'bg-muted/40' : ''}`} onClick={onRowClick}>
                          <TableCell className="flex items-center gap-2">
                            {courseName}
                            {isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                          </TableCell>
                          <TableCell>
                            {isDefault ? `Default v${s.version}` : `v${s.version}`}
                          </TableCell>
                          <TableCell>{s.totalWeight}%</TableCell>
                          <TableCell className="space-x-1">
                            {s.components?.map(c=> <Badge key={c.componentType} variant={isDefault ? "outline" : "secondary"}>{c.componentType}:{c.weight}%</Badge>)}
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
