import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { API_CONFIG } from '@/config/api';
import { PlusCircle, Loader2, Trash2 } from 'lucide-react';
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
                <Input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="100" />
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <select value={frequency} onChange={e=>setFrequency(e.target.value)} className="border rounded-md h-9 px-2 bg-background">
                  <option value="per_period">Per Term</option>
                  <option value="per_year">Per Year</option>
                  <option value="one_time">One Time</option>
                </select>
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
                  {items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.feeType}</TableCell>
                      <TableCell>${Number(item.amount).toFixed(2)}</TableCell>
                      <TableCell className="capitalize">{item.frequency.replace('_',' ')}</TableCell>
                      <TableCell>{item.isActive ? 'Active' : 'Inactive'}</TableCell>
                      <TableCell>{item.description || '-'}</TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={()=>deleteItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
