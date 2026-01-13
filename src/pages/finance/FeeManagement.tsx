import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { API_CONFIG } from '@/config/api';
import { PlusCircle, Loader2, Trash2, Pencil, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FeeStructureItem {
  id: string;
  feeType: string;
  amount: number;
  description?: string;
  isActive: boolean;
  isOptional: boolean;
  frequency: string;
  createdAt?: string;
}

export default function FeeManagement() {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [termId, setTermId] = useState<string | undefined>(undefined);
  const [items, setItems] = useState<FeeStructureItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feeType, setFeeType] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('per_period');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<FeeStructureItem>>({});

  const isAdmin = user?.role === 'admin' || user?.role === 'finance';

  useEffect(() => {
    const fetchCurrentTerm = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/analytics/current-term`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const tid = data?.id || data?.termId || data?.currentTerm?.id;
        if (tid) setTermId(tid);
      } catch {/* ignore */}
    };
    fetchCurrentTerm();
  }, [token]);

  const loadItems = async () => {
    if (!token || !termId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/finance/fee-structure?termId=${termId}`, { headers: { Authorization: `Bearer ${token}` }});
      if (!res.ok) throw new Error('Failed to load fee structure');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e:any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => { loadItems(); }, [token, termId]);

  const addItem = async () => {
    if (!token || !feeType || !amount) return;
    setSaving(true);
    try {
      const body = { feeType, amount: Number(amount), description: description || undefined, frequency, termId };
      const res = await fetch(`${API_CONFIG.BASE_URL}/finance/fee-structure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const err = await res.json().catch(()=>({}));
        throw new Error(err.message || 'Failed to create fee');
      }
      toast({ title: 'Created', description: 'Fee item created.' });
      setFeeType(''); setAmount(''); setDescription('');
      loadItems();
    } catch (e:any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const deleteItem = async (id: string) => {
    if (!token) return;
    if (!confirm('Delete this fee item?')) return;
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/finance/fee-structure/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }});
      if (!res.ok) throw new Error('Failed to delete fee');
      toast({ title: 'Deleted', description: 'Fee item removed.' });
      setItems(items.filter(i => i.id !== id));
    } catch (e:any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fee Management</h1>
          <p className="text-muted-foreground">Define other fees beyond the default Tuition.</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/finance')}>Back</Button>
      </div>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Add Fee Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Fee Name</Label>
                <Input value={feeType} onChange={e=>setFeeType(e.target.value)} placeholder="e.g. Examination" />
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">MWK</span>
                  <Input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="100" className="pl-14" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_period">Per Term</SelectItem>
                    <SelectItem value="per_year">Per Year</SelectItem>
                    <SelectItem value="one_time">One Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Optional" />
              </div>
            </div>
            <Button onClick={addItem} disabled={saving || !feeType || !amount}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
              <PlusCircle className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Add Fee'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Defined Fees</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No fees defined yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fee</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(item => {
                    const isEditing = editingId === item.id;
                    const freqLabel = (item.frequency === 'per_period') ? 'per term' : item.frequency.replace('_',' ');
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {isEditing ? (
                            <Input value={editValues.feeType ?? item.feeType} onChange={e=>setEditValues(v=>({ ...v, feeType: e.target.value }))} />
                          ) : (
                            item.feeType
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">MWK</span>
                              <Input type="number" value={String(editValues.amount ?? item.amount)} onChange={e=>setEditValues(v=>({ ...v, amount: Number(e.target.value) }))} />
                            </div>
                          ) : (
                            <>MWK {Number(item.amount).toFixed(2)}</>
                          )}
                        </TableCell>
                        <TableCell className="capitalize">
                          {isEditing ? (
                            <Select
                              value={String(editValues.frequency ?? item.frequency)}
                              onValueChange={(val)=>setEditValues(v=>({ ...v, frequency: val }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="per_period">Per Term</SelectItem>
                                <SelectItem value="per_year">Per Year</SelectItem>
                                <SelectItem value="one_time">One Time</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            freqLabel
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <select
                              value={String(editValues.isActive ?? item.isActive)}
                              onChange={e=>setEditValues(v=>({ ...v, isActive: e.target.value === 'true' }))}
                              className="border rounded-md h-9 px-2 bg-background"
                            >
                              <option value="true">Active</option>
                              <option value="false">Inactive</option>
                            </select>
                          ) : (
                            item.isActive ? 'Active' : 'Inactive'
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input value={editValues.description ?? item.description ?? ''} onChange={e=>setEditValues(v=>({ ...v, description: e.target.value }))} />
                          ) : (
                            item.description || '-'
                          )}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={()=>setEditingId(null)}>
                                  <X className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={async ()=>{
                                  if (!token) return;
                                  try {
                                    const res = await fetch(`${API_CONFIG.BASE_URL}/finance/fee-structure/${item.id}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                      body: JSON.stringify({
                                        feeType: editValues.feeType ?? item.feeType,
                                        amount: editValues.amount ?? item.amount,
                                        frequency: editValues.frequency ?? item.frequency,
                                        description: editValues.description ?? item.description,
                                        isActive: editValues.isActive ?? item.isActive,
                                      })
                                    });
                                    if (!res.ok) throw new Error('Failed to update fee');
                                    toast({ title: 'Updated', description: 'Fee item updated.' });
                                    setEditingId(null);
                                    setEditValues({});
                                    loadItems();
                                  } catch (e:any) {
                                    toast({ title: 'Error', description: e.message, variant: 'destructive' });
                                  }
                                }}>
                                  <Check className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={()=>{ setEditingId(item.id); setEditValues(item); }}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={()=>deleteItem(item.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
