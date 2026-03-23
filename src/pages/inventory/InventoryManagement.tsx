import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Asset,
  AssetAssignment,
  InventoryItem,
  InventorySummary,
  MaintenanceLog,
  StockTransaction,
  inventoryApi,
} from '@/services/inventoryService';
import { AlertTriangle, Boxes, ClipboardList, Hammer, Package, Wrench } from 'lucide-react';

type InventoryView = 'manage' | 'my-assets';

const money = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value || 0));

const dateLabel = (value?: string) => (value ? new Date(value).toLocaleDateString() : '-');

export default function InventoryManagement({ view = 'manage' }: { view?: InventoryView }) {
  const { token, user } = useAuth();
  const schoolId = user?.role === 'super_admin' ? user.schoolId : undefined;

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isFinance = user?.role === 'finance';
  const isTeacher = user?.role === 'teacher';

  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [myAssets, setMyAssets] = useState<Asset[]>([]);
  const [assignments, setAssignments] = useState<AssetAssignment[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [assetForm, setAssetForm] = useState({
    assetTag: '',
    name: '',
    category: 'ICT',
    description: '',
    purchaseDate: '',
    purchaseCost: 0,
    supplier: '',
    location: '',
    department: '',
  });

  const [assignmentForm, setAssignmentForm] = useState({
    assetId: '',
    assignedUserId: '',
    assignedLocation: '',
    assignedDepartment: '',
    notes: '',
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    assetId: '',
    issueDescription: '',
    maintenanceType: 'repair' as 'repair' | 'service' | 'inspection',
    repairCost: 0,
  });

  const [stockItemForm, setStockItemForm] = useState({
    itemCode: '',
    name: '',
    category: 'Stationery',
    unit: 'pcs',
    currentStock: 0,
    minimumThreshold: 0,
    unitCost: 0,
    supplier: '',
    description: '',
  });

  const [stockTxForm, setStockTxForm] = useState({
    itemId: '',
    transactionType: 'stock_in' as 'stock_in' | 'stock_out' | 'adjustment',
    quantity: 1,
    unitCost: 0,
    reference: '',
    notes: '',
  });

  const lowStockItems = useMemo(
    () => items.filter((item) => item.currentStock <= item.minimumThreshold),
    [items],
  );

  const teacherVisibleMaintenance = useMemo(() => {
    if (!isTeacher) return maintenanceLogs;
    const owned = new Set(myAssets.map((asset) => asset.id));
    return maintenanceLogs.filter((log) => owned.has(log.assetId));
  }, [maintenanceLogs, myAssets, isTeacher]);

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);

      const summaryPromise = !isTeacher
        ? inventoryApi.getSummary({ token: token || undefined, schoolId })
        : Promise.resolve(null as unknown as InventorySummary);

      const [summaryData, assetsData, assignmentsData, maintenanceData, itemsData, txData, myAssetsData] =
        await Promise.all([
          summaryPromise,
          inventoryApi.listAssets({ token: token || undefined, schoolId }),
          !isTeacher
            ? inventoryApi.listAssignments({ token: token || undefined, schoolId, activeOnly: false })
            : Promise.resolve([] as AssetAssignment[]),
          inventoryApi.listMaintenance({ token: token || undefined, schoolId }),
          !isTeacher
            ? inventoryApi.listItems({ token: token || undefined, schoolId })
            : Promise.resolve([] as InventoryItem[]),
          !isTeacher
            ? inventoryApi.listStockTransactions({ token: token || undefined, schoolId })
            : Promise.resolve([] as StockTransaction[]),
          inventoryApi.listMyAssets({ token: token || undefined, schoolId }),
        ]);

      setSummary(summaryData || null);
      setAssets(assetsData);
      setAssignments(assignmentsData);
      setMaintenanceLogs(maintenanceData);
      setItems(itemsData);
      setStockTransactions(txData);
      setMyAssets(myAssetsData);

      if (!maintenanceForm.assetId) {
        const firstForForm = (isTeacher ? myAssetsData : assetsData)[0]?.id || '';
        setMaintenanceForm((prev) => ({ ...prev, assetId: firstForForm }));
      }

      if (!assignmentForm.assetId) {
        setAssignmentForm((prev) => ({ ...prev, assetId: assetsData[0]?.id || '' }));
      }

      if (!stockTxForm.itemId) {
        setStockTxForm((prev) => ({ ...prev, itemId: itemsData[0]?.id || '' }));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load inventory data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitAsset = async () => {
    try {
      resetMessages();
      await inventoryApi.createAsset(
        {
          ...assetForm,
          schoolId,
          purchaseCost: Number(assetForm.purchaseCost || 0),
        },
        token || undefined,
      );
      setSuccess('Asset created successfully.');
      setAssetForm({
        assetTag: '',
        name: '',
        category: 'ICT',
        description: '',
        purchaseDate: '',
        purchaseCost: 0,
        supplier: '',
        location: '',
        department: '',
      });
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to create asset.');
    }
  };

  const submitAssignment = async () => {
    try {
      resetMessages();
      await inventoryApi.createAssignment(
        {
          ...assignmentForm,
          assignedUserId: assignmentForm.assignedUserId || undefined,
          schoolId,
        },
        token || undefined,
      );
      setSuccess('Asset assigned successfully.');
      setAssignmentForm((prev) => ({
        ...prev,
        assignedUserId: '',
        assignedLocation: '',
        assignedDepartment: '',
        notes: '',
      }));
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to assign asset.');
    }
  };

  const submitMaintenance = async () => {
    try {
      resetMessages();
      await inventoryApi.createMaintenance(
        {
          ...maintenanceForm,
          repairCost: Number(maintenanceForm.repairCost || 0),
          schoolId,
        },
        token || undefined,
      );
      setSuccess('Maintenance log submitted.');
      setMaintenanceForm((prev) => ({ ...prev, issueDescription: '', repairCost: 0 }));
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to log maintenance.');
    }
  };

  const markMaintenanceComplete = async (log: MaintenanceLog) => {
    try {
      resetMessages();
      await inventoryApi.updateMaintenance(
        log.id,
        {
          status: 'completed',
          schoolId,
        },
        token || undefined,
      );
      setSuccess('Maintenance marked as completed.');
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to update maintenance log.');
    }
  };

  const submitStockItem = async () => {
    try {
      resetMessages();
      await inventoryApi.createItem(
        {
          ...stockItemForm,
          currentStock: Number(stockItemForm.currentStock || 0),
          minimumThreshold: Number(stockItemForm.minimumThreshold || 0),
          unitCost: Number(stockItemForm.unitCost || 0),
          schoolId,
        },
        token || undefined,
      );
      setSuccess('Inventory item created.');
      setStockItemForm({
        itemCode: '',
        name: '',
        category: 'Stationery',
        unit: 'pcs',
        currentStock: 0,
        minimumThreshold: 0,
        unitCost: 0,
        supplier: '',
        description: '',
      });
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to create inventory item.');
    }
  };

  const submitStockTx = async () => {
    try {
      resetMessages();
      await inventoryApi.createStockTransaction(
        {
          ...stockTxForm,
          quantity: Number(stockTxForm.quantity || 0),
          unitCost: Number(stockTxForm.unitCost || 0),
          schoolId,
        },
        token || undefined,
      );
      setSuccess('Stock transaction recorded.');
      setStockTxForm((prev) => ({
        ...prev,
        quantity: 1,
        unitCost: 0,
        reference: '',
        notes: '',
      }));
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to record stock transaction.');
    }
  };

  const releaseAssignment = async (id: string) => {
    try {
      resetMessages();
      await inventoryApi.releaseAssignment(id, { releaseReason: 'Released by admin', schoolId }, token || undefined);
      setSuccess('Assignment released.');
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to release assignment.');
    }
  };

  const visibleAssets = isTeacher || view === 'my-assets' ? myAssets : assets;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory & Asset Management</h1>
          <p className="text-sm text-muted-foreground">
            Track assets, assignments, maintenance, and consumable stock with full school-level audit visibility.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Role: {user?.role || '-'}</Badge>
          {loading && <Badge>Refreshing...</Badge>}
        </div>
      </div>

      {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {success && <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}

      {!isTeacher && summary && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{summary.totalAssets}</div>
              <p className="text-xs text-muted-foreground">Active: {summary.activeAssets} | Under maintenance: {summary.underMaintenanceAssets}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Boxes className="h-4 w-4" />
                Stock Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{summary.totalInventoryItems}</div>
              <p className="text-xs text-muted-foreground">Low stock alerts: {summary.lowStockCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{summary.pendingMaintenance}</div>
              <p className="text-xs text-muted-foreground">Completed: {summary.completedMaintenance}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Financial View
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-semibold">{money(summary.totalAssetValue)}</div>
              <p className="text-xs text-muted-foreground">Maintenance cost: {money(summary.totalMaintenanceCost)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {(isAdmin || view === 'my-assets') && (
        <Card>
          <CardHeader>
            <CardTitle>Asset Register</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.assetTag}</TableCell>
                    <TableCell>{asset.name}</TableCell>
                    <TableCell>{asset.category}</TableCell>
                    <TableCell>
                      <Badge variant={asset.status === 'active' ? 'default' : 'secondary'}>{asset.status}</Badge>
                    </TableCell>
                    <TableCell>{asset.location || '-'}</TableCell>
                    <TableCell>{asset.assignedUser?.username || asset.assignedUser?.email || '-'}</TableCell>
                    <TableCell>{money(asset.purchaseCost)}</TableCell>
                  </TableRow>
                ))}
                {!visibleAssets.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No assets found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {isAdmin && view === 'manage' && (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Register Asset</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Asset ID</Label>
                  <Input value={assetForm.assetTag} onChange={(e) => setAssetForm((p) => ({ ...p, assetTag: e.target.value }))} />
                </div>
                <div>
                  <Label>Name</Label>
                  <Input value={assetForm.name} onChange={(e) => setAssetForm((p) => ({ ...p, name: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Category</Label>
                  <Input value={assetForm.category} onChange={(e) => setAssetForm((p) => ({ ...p, category: e.target.value }))} />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input value={assetForm.location} onChange={(e) => setAssetForm((p) => ({ ...p, location: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Purchase Date</Label>
                  <Input type="date" value={assetForm.purchaseDate} onChange={(e) => setAssetForm((p) => ({ ...p, purchaseDate: e.target.value }))} />
                </div>
                <div>
                  <Label>Purchase Cost</Label>
                  <Input type="number" value={assetForm.purchaseCost} onChange={(e) => setAssetForm((p) => ({ ...p, purchaseCost: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={assetForm.description} onChange={(e) => setAssetForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <Button onClick={submitAsset} disabled={loading || !assetForm.assetTag || !assetForm.name}>Create Asset</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assign Asset</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Asset</Label>
                <Select value={assignmentForm.assetId} onValueChange={(value) => setAssignmentForm((p) => ({ ...p, assetId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>{asset.assetTag} - {asset.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assigned User ID (optional)</Label>
                <Input value={assignmentForm.assignedUserId} onChange={(e) => setAssignmentForm((p) => ({ ...p, assignedUserId: e.target.value }))} placeholder="User UUID" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Location</Label>
                  <Input value={assignmentForm.assignedLocation} onChange={(e) => setAssignmentForm((p) => ({ ...p, assignedLocation: e.target.value }))} />
                </div>
                <div>
                  <Label>Department</Label>
                  <Input value={assignmentForm.assignedDepartment} onChange={(e) => setAssignmentForm((p) => ({ ...p, assignedDepartment: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={assignmentForm.notes} onChange={(e) => setAssignmentForm((p) => ({ ...p, notes: e.target.value }))} />
              </div>
              <Button onClick={submitAssignment} disabled={loading || !assignmentForm.assetId}>Assign</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {(isAdmin || isFinance) && view === 'manage' && (
        <Card>
          <CardHeader>
            <CardTitle>Assignment History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned On</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>{assignment.asset?.assetTag || '-'}</TableCell>
                    <TableCell>{assignment.assignedUser?.username || assignment.assignedUser?.email || '-'}</TableCell>
                    <TableCell>{assignment.assignedLocation || '-'}</TableCell>
                    <TableCell><Badge variant="outline">{assignment.status}</Badge></TableCell>
                    <TableCell>{dateLabel(assignment.assignedAt)}</TableCell>
                    <TableCell>
                      {assignment.status === 'active' && isAdmin ? (
                        <Button variant="outline" size="sm" onClick={() => releaseAssignment(assignment.id)}>Release</Button>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!assignments.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">No assignments found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Hammer className="h-4 w-4" />Maintenance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Asset</Label>
              <Select value={maintenanceForm.assetId} onValueChange={(value) => setMaintenanceForm((p) => ({ ...p, assetId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select asset" />
                </SelectTrigger>
                <SelectContent>
                  {(isTeacher ? myAssets : assets).map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>{asset.assetTag} - {asset.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Issue Description</Label>
              <Textarea value={maintenanceForm.issueDescription} onChange={(e) => setMaintenanceForm((p) => ({ ...p, issueDescription: e.target.value }))} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Type</Label>
                <Select value={maintenanceForm.maintenanceType} onValueChange={(value: 'repair' | 'service' | 'inspection') => setMaintenanceForm((p) => ({ ...p, maintenanceType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estimated Cost</Label>
                <Input type="number" value={maintenanceForm.repairCost} onChange={(e) => setMaintenanceForm((p) => ({ ...p, repairCost: Number(e.target.value) }))} />
              </div>
            </div>
            <Button onClick={submitMaintenance} disabled={loading || !maintenanceForm.assetId || !maintenanceForm.issueDescription}>Submit Request</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance Log History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
              {teacherVisibleMaintenance.map((log) => (
                <div key={log.id} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium">{log.asset?.assetTag || log.assetId}</div>
                    <Badge variant={log.status === 'completed' ? 'default' : 'secondary'}>{log.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{log.issueDescription}</p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {dateLabel(log.maintenanceDate)} | {log.maintenanceType} | {money(log.repairCost)}
                  </div>
                  {(isAdmin || isFinance) && log.status === 'pending' && (
                    <Button className="mt-2" size="sm" variant="outline" onClick={() => markMaintenanceComplete(log)}>Mark Completed</Button>
                  )}
                </div>
              ))}
              {!teacherVisibleMaintenance.length && (
                <div className="text-sm text-muted-foreground">No maintenance logs yet.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {(isAdmin || isFinance) && view === 'manage' && (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>Add Inventory Item</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>Item Code</Label>
                      <Input value={stockItemForm.itemCode} onChange={(e) => setStockItemForm((p) => ({ ...p, itemCode: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Name</Label>
                      <Input value={stockItemForm.name} onChange={(e) => setStockItemForm((p) => ({ ...p, name: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>Category</Label>
                      <Input value={stockItemForm.category} onChange={(e) => setStockItemForm((p) => ({ ...p, category: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Input value={stockItemForm.unit} onChange={(e) => setStockItemForm((p) => ({ ...p, unit: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <Label>Stock</Label>
                      <Input type="number" value={stockItemForm.currentStock} onChange={(e) => setStockItemForm((p) => ({ ...p, currentStock: Number(e.target.value) }))} />
                    </div>
                    <div>
                      <Label>Minimum</Label>
                      <Input type="number" value={stockItemForm.minimumThreshold} onChange={(e) => setStockItemForm((p) => ({ ...p, minimumThreshold: Number(e.target.value) }))} />
                    </div>
                    <div>
                      <Label>Unit Cost</Label>
                      <Input type="number" value={stockItemForm.unitCost} onChange={(e) => setStockItemForm((p) => ({ ...p, unitCost: Number(e.target.value) }))} />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={stockItemForm.description} onChange={(e) => setStockItemForm((p) => ({ ...p, description: e.target.value }))} />
                  </div>
                  <Button onClick={submitStockItem} disabled={loading || !stockItemForm.itemCode || !stockItemForm.name}>Create Item</Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Stock Transaction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Inventory Item</Label>
                  <Select value={stockTxForm.itemId} onValueChange={(value) => setStockTxForm((p) => ({ ...p, itemId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>{item.itemCode} - {item.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <Label>Type</Label>
                    <Select value={stockTxForm.transactionType} onValueChange={(value: 'stock_in' | 'stock_out' | 'adjustment') => setStockTxForm((p) => ({ ...p, transactionType: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stock_in">Stock In</SelectItem>
                        <SelectItem value="stock_out">Stock Out</SelectItem>
                        <SelectItem value="adjustment">Adjustment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input type="number" value={stockTxForm.quantity} onChange={(e) => setStockTxForm((p) => ({ ...p, quantity: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <Label>Unit Cost</Label>
                    <Input type="number" value={stockTxForm.unitCost} onChange={(e) => setStockTxForm((p) => ({ ...p, unitCost: Number(e.target.value) }))} />
                  </div>
                </div>
                <div>
                  <Label>Reference</Label>
                  <Input value={stockTxForm.reference} onChange={(e) => setStockTxForm((p) => ({ ...p, reference: e.target.value }))} />
                </div>
                <Button onClick={submitStockTx} disabled={loading || !stockTxForm.itemId || stockTxForm.quantity <= 0}>Record Transaction</Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Stock Levels & Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!!lowStockItems.length && (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {lowStockItems.length} item(s) are at or below minimum stock threshold.
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Min</TableHead>
                    <TableHead>Unit Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const isLow = item.currentStock <= item.minimumThreshold;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.itemCode} - {item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className={isLow ? 'text-amber-700 font-semibold' : ''}>{item.currentStock}</TableCell>
                        <TableCell>{item.minimumThreshold}</TableCell>
                        <TableCell>{money(item.unitCost)}</TableCell>
                      </TableRow>
                    );
                  })}
                  {!items.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">No stock items found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Stock Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockTransactions.slice(0, 12).map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{dateLabel(tx.transactionDate)}</TableCell>
                      <TableCell>{tx.item?.itemCode || '-'}</TableCell>
                      <TableCell><Badge variant="outline">{tx.transactionType}</Badge></TableCell>
                      <TableCell>{tx.quantity}</TableCell>
                      <TableCell>{money(tx.totalCost)}</TableCell>
                      <TableCell>{tx.reference || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {!stockTransactions.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">No stock transactions found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
