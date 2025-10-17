import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { API_CONFIG } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Save, Trash2, AlertCircle, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface SchemeComponent { 
  componentType: string; 
  weight: number; 
  required: boolean; 
}

interface ComponentData { 
  componentType: string; 
  weight: number; 
  required: boolean; 
}

interface DefaultScheme { 
  id: string; 
  termId: string; 
  totalWeight: number; 
  passThreshold?: number; 
  components: SchemeComponent[]; 
  isLocked: boolean; 
  version: number; 
  createdAt: string;
  updatedAt: string;
  term?: { id: string; termNumber: number; name?: string; isCurrent?: boolean; };
}

interface TermOption { 
  id: string; 
  termNumber: number; 
  isCurrent?: boolean; 
  name?: string; 
}

const COMPONENT_OPTIONS = [
  {value:'midterm', label:'Mid Term'},
  {value:'endterm', label:'End Term'},
  {value:'assignment', label:'Assignment'},
  {value:'quiz', label:'Quiz'},
  {value:'practical', label:'Practical'},
  {value:'project', label:'Project'},
];

export default function WeightingScheme() {
  const { token } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [terms, setTerms] = useState<TermOption[]>([]);
  const [components, setComponents] = useState<SchemeComponent[]>([]);
  const [passThreshold, setPassThreshold] = useState<number>(50);
  const [defaultScheme, setDefaultScheme] = useState<DefaultScheme | null>(null);
  const [schemeLoading, setSchemeLoading] = useState(false);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => { 
    fetchDefaultScheme(); 
  }, []);

  async function fetchDefaultScheme() {
    setSchemeLoading(true);
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/aggregation/default-schemes`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        const schemes = Array.isArray(data) ? data : [];
        if (schemes.length > 0) {
          const scheme = schemes[0]; // There should only be one
          setDefaultScheme(scheme);
          setComponents(scheme.components || []);
          setPassThreshold(scheme.passThreshold || 50);
        } else {
          setDefaultScheme(null);
          setComponents([]);
          setPassThreshold(50);
        }
      }
    } catch (error) {
      console.error('Failed to fetch default scheme:', error);
      toast({ title: 'Error', description: 'Failed to load default scheme', variant: 'destructive' });
    } finally {
      setSchemeLoading(false);
    }
  }

  function addComponent() {
    const used = new Set(components.map(c => c.componentType));
    const available = COMPONENT_OPTIONS.map(o => o.value).find(v => !used.has(v));
    if (!available) {
      toast({ title: 'All components added', description: 'No more component types available.', variant: 'default' });
      return;
    }
    setComponents(prev => [...prev, { componentType: available, weight: 0, required: true }]);
  }

  function updateComponent(index: number, patch: Partial<SchemeComponent>) {
    setComponents(prev => prev.map((c, i) => {
      if (i !== index) return c;
      const next = { ...c, ...patch };
      return next;
    }));
  }

  function removeComponent(index: number) { 
    setComponents(prev => prev.filter((_, i) => i !== index)); 
  }

  const totalWeight = useMemo(() => components.reduce((s, c) => s + (Number(c.weight) || 0), 0), [components]);
  const weightValid = totalWeight === 100 && components.length > 0;
  const allTypesUsed = components.length === COMPONENT_OPTIONS.length;

  async function saveDefaultScheme() {
    if (components.length === 0) { 
      toast({ title: 'No components', description: 'Add at least one component before saving.', variant: 'destructive' }); 
      return; 
    }
    if (!weightValid) { 
      toast({ title: 'Invalid weights', description: 'Weights must sum to 100%.', variant: 'destructive' }); 
      return; 
    }
    
    // Ensure unique types
    const types = components.map(c => c.componentType);
    if (new Set(types).size !== types.length) { 
      toast({ title: 'Duplicate component', description: 'Each component type can only appear once.', variant: 'destructive' }); 
      return; 
    }
    
    setSaving(true);
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/aggregation/default-scheme`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', ...authHeaders }, 
        body: JSON.stringify({ components, passThreshold }) 
      });
      
      if (res.ok) {
        toast({ title: 'Default scheme saved', description: 'Default weighting scheme updated successfully.' });
        await fetchDefaultScheme();
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast({ title: 'Save failed', description: errorData.message || 'Server rejected the scheme.', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Network or server error.', variant: 'destructive' });
    } finally { 
      setSaving(false); 
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Default Weighting Scheme</h1>
          <p className="text-muted-foreground">Create a default scheme that applies to all courses in your school. Teachers can override this for specific courses.</p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          The default weighting scheme is automatically applied to all courses. Teachers can create course-specific schemes that will override this default.
        </AlertDescription>
      </Alert>

      {/* Default Scheme Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>School Default Scheme</CardTitle>
          <CardDescription>
            Create a default weighting scheme that will be applied to all courses in your school.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="pass-threshold">Pass Threshold (%)</Label>
              <Input
                id="pass-threshold"
                type="number"
                value={passThreshold}
                min={0}
                max={100}
                onChange={e => setPassThreshold(Number(e.target.value))}
                className="w-32"
              />
            </div>
            <Button 
              onClick={saveDefaultScheme} 
              disabled={!weightValid || components.length === 0 || saving}
              className="shrink-0"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save School Default'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Components Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Components 
            {schemeLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : weightValid ? (
              <Badge variant="secondary">{totalWeight}%</Badge>
            ) : (
              <Badge variant="destructive">{totalWeight}% (Need 100%)</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {components.map((c, i) => {
              const remaining = 100 - (totalWeight - c.weight);
              const availableTypes = COMPONENT_OPTIONS.filter(opt => 
                opt.value === c.componentType || !components.some(cc => cc.componentType === opt.value)
              );
              return (
                <div key={i} className="flex gap-3 items-center flex-wrap border p-4 rounded-lg">
                  <div className="w-40">
                    <Label className="text-xs text-muted-foreground">Component Type</Label>
                    <Select value={c.componentType} onValueChange={v => updateComponent(i, { componentType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {availableTypes.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Label className="text-xs text-muted-foreground">Weight (%)</Label>
                    <Input
                      type="number"
                      value={c.weight}
                      min={0}
                      max={remaining}
                      onChange={e => {
                        let val = Number(e.target.value);
                        if (val > remaining) val = remaining;
                        if (val < 0) val = 0;
                        updateComponent(i, { weight: val });
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={c.required} 
                      onChange={e => updateComponent(i, { required: e.target.checked })} 
                      className="rounded border-gray-300"
                    />
                    <Label className="text-sm">Required</Label>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeComponent(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
            
            {components.length === 0 && (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                No components added yet. Click "Add Component" to get started.
              </div>
            )}

            <Button 
              variant="outline" 
              onClick={addComponent} 
              disabled={totalWeight >= 100 || allTypesUsed}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Component
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Default Scheme Display */}
      {defaultScheme && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Current School Default Scheme
            </CardTitle>
            <CardDescription>
              This scheme applies to all courses school-wide. Teachers can override it with course-specific schemes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Header with version and status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">
                    Version {defaultScheme.version}
                  </Badge>
                  <Badge variant={defaultScheme.totalWeight === 100 ? 'default' : 'destructive'}>
                    {defaultScheme.totalWeight}% Total Weight
                  </Badge>
                  <Badge variant="outline">
                    Pass Threshold: {defaultScheme.passThreshold}%
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Last updated: {new Date(defaultScheme.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              {/* Components breakdown */}
              <div>
                <h4 className="text-sm font-medium mb-3">Assessment Components</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {defaultScheme.components?.map(c => (
                    <div key={c.componentType} className="bg-muted/50 rounded-lg p-3 border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {c.componentType.replace('_', ' ')}
                        </span>
                        <Badge variant="secondary">
                          {c.weight}%
                        </Badge>
                      </div>
                      <div className="mt-2 w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${c.weight}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Version explanation */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Version {defaultScheme.version}:</strong> Each time you update the default scheme, the version number increases.
                  This helps track changes and ensures teachers see the latest school-wide standards.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}