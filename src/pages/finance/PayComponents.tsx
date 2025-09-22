import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, DollarSign, Calculator, Search } from 'lucide-react';
import payrollService, { PayComponent, PayComponentType, CreatePayComponentRequest } from '@/services/payrollService';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function PayComponents() {
  const { user } = useAuth();
  const [components, setComponents] = useState<PayComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<PayComponentType | 'ALL'>('ALL');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingComponent, setEditingComponent] = useState<PayComponent | null>(null);
  const [formData, setFormData] = useState<CreatePayComponentRequest>({
    name: '',
    type: 'BASIC',
    isFixed: true,
    defaultAmount: 0,
    formula: '',
    department: '',
    autoAssign: false,
  });

  const isFinanceOfficer = user?.role === 'finance' || user?.role === 'admin';

  useEffect(() => {
    loadComponents();
  }, []);

  const loadComponents = async () => {
    try {
      setLoading(true);
      const componentsList = await payrollService.listPayComponents();
      setComponents(componentsList);
    } catch (error) {
      console.error('Error loading pay components:', error);
      toast.error('Failed to load pay components');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingComponent) {
        const updated = await payrollService.updatePayComponent(editingComponent.id, formData);
        setComponents(prev => prev.map(c => c.id === editingComponent.id ? updated : c));
        toast.success('Pay component updated successfully');
      } else {
        const newComponent = await payrollService.createPayComponent(formData);
        setComponents(prev => [newComponent, ...prev]);
        toast.success('Pay component created successfully');
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving pay component:', error);
      toast.error('Failed to save pay component');
    }
  };

  const handleEdit = (component: PayComponent) => {
    setEditingComponent(component);
    setFormData({
      name: component.name,
      type: component.type,
      isFixed: component.isFixed,
      defaultAmount: component.defaultAmount,
      formula: component.formula || '',
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (component: PayComponent) => {
    if (!confirm(`Are you sure you want to delete "${component.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await payrollService.deletePayComponent(component.id);
      setComponents(prev => prev.filter(c => c.id !== component.id));
      toast.success('Pay component deleted successfully');
    } catch (error) {
      console.error('Error deleting pay component:', error);
      toast.error('Failed to delete pay component');
    }
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setEditingComponent(null);
    setFormData({
      name: '',
      type: 'BASIC',
      isFixed: true,
      defaultAmount: 0,
      formula: '',
    });
  };

  const typeColors = {
    BASIC: 'bg-blue-100 text-blue-800',
    ALLOWANCE: 'bg-green-100 text-green-800',
    DEDUCTION: 'bg-red-100 text-red-800',
    EMPLOYER_CONTRIBUTION: 'bg-purple-100 text-purple-800',
  };

  const typeLabels = {
    BASIC: 'Basic Pay',
    ALLOWANCE: 'Allowance',
    DEDUCTION: 'Deduction',
    EMPLOYER_CONTRIBUTION: 'Employer Contribution',
  };

  const filteredComponents = components.filter(component => {
    const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || component.type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading pay components...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pay Components</h1>
          <p className="text-muted-foreground">
            Manage salary components including basic pay, allowances, and deductions
          </p>
        </div>
        {isFinanceOfficer && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Component
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search components..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as PayComponentType | 'ALL')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="BASIC">Basic Pay</SelectItem>
                <SelectItem value="ALLOWANCE">Allowance</SelectItem>
                <SelectItem value="DEDUCTION">Deduction</SelectItem>
                <SelectItem value="EMPLOYER_CONTRIBUTION">Employer Contribution</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Components Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pay Components</CardTitle>
          <CardDescription>
            {filteredComponents.length} component{filteredComponents.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Default Amount</TableHead>
                <TableHead>Calculation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComponents.map((component) => (
                <TableRow key={component.id}>
                  <TableCell className="font-medium">{component.name}</TableCell>
                  <TableCell>
                    <Badge className={typeColors[component.type]}>
                      {typeLabels[component.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>${component.defaultAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {component.isFixed ? (
                        <>
                          <DollarSign className="h-4 w-4" />
                          Fixed
                        </>
                      ) : (
                        <>
                          <Calculator className="h-4 w-4" />
                          Formula
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(component.createdAt), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    {isFinanceOfficer && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(component)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(component)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredComponents.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <DollarSign className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Pay Components Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Pay components define the different types of earnings and deductions for your staff.
                Create your first component to start building your payroll structure.
              </p>
              
              {isFinanceOfficer && (
                <div className="space-y-4">
                  <Button onClick={() => setShowCreateDialog(true)} className="mb-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Component
                  </Button>
                  
                  <div className="text-sm text-muted-foreground">
                    <p className="mb-2">Common pay components to get started:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Badge variant="outline">Basic Salary</Badge>
                      <Badge variant="outline">House Allowance</Badge>
                      <Badge variant="outline">Transport Allowance</Badge>
                      <Badge variant="outline">Medical Allowance</Badge>
                      <Badge variant="outline">Tax Deduction</Badge>
                      <Badge variant="outline">Pension Contribution</Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingComponent ? 'Edit Pay Component' : 'Create New Pay Component'}
            </DialogTitle>
            <DialogDescription>
              {editingComponent 
                ? 'Update the pay component details below'
                : 'Create a new salary component for staff payments'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="name">Component Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Basic Salary, Transport Allowance, PAYE Tax"
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="type">Component Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as PayComponentType }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select component type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BASIC">Basic Pay</SelectItem>
                  <SelectItem value="ALLOWANCE">Allowance</SelectItem>
                  <SelectItem value="DEDUCTION">Deduction</SelectItem>
                  <SelectItem value="EMPLOYER_CONTRIBUTION">Employer Contribution</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="defaultAmount">Default Amount ($)</Label>
              <Input
                id="defaultAmount"
                type="number"
                value={formData.defaultAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, defaultAmount: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="department">Apply to Department (Optional)</Label>
              <Select value={formData.department || 'ALL'} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value === 'ALL' ? '' : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department or all" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Departments</SelectItem>
                  <SelectItem value="Teaching">Teaching</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Administration">Administration</SelectItem>
                  <SelectItem value="Library">Library</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="autoAssign"
                checked={formData.autoAssign}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoAssign: checked }))}
              />
              <Label htmlFor="autoAssign">Auto-assign to staff</Label>
              <p className="text-sm text-muted-foreground">
                Automatically assign to all staff in selected department during payroll preparation
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isFixed"
                checked={formData.isFixed}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFixed: checked }))}
              />
              <Label htmlFor="isFixed">Fixed Amount</Label>
              <p className="text-sm text-muted-foreground">
                If unchecked, a formula will be used for calculation
              </p>
            </div>

            {!formData.isFixed && (
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="formula">Calculation Formula</Label>
                <Textarea
                  id="formula"
                  value={formData.formula}
                  onChange={(e) => setFormData(prev => ({ ...prev, formula: e.target.value }))}
                  placeholder="e.g., basicSalary * 0.1 (for 10% of basic salary)"
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Enter a formula for dynamic calculation. Use variables like 'basicSalary', 'grossSalary', etc.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
              {editingComponent ? 'Update Component' : 'Create Component'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}