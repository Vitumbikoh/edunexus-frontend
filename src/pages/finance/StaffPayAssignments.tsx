import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, User, Search } from 'lucide-react';
import payrollService, { StaffPayAssignment, PayComponent, Staff, CreateStaffAssignmentRequest, UpdateStaffAssignmentRequest } from '@/services/payrollService';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function StaffPayAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<StaffPayAssignment[]>([]);
  const [payComponents, setPayComponents] = useState<PayComponent[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [staffFilter, setStaffFilter] = useState<string>('ALL');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<StaffPayAssignment | null>(null);
  const [formData, setFormData] = useState<CreateStaffAssignmentRequest>({
    staffId: '',
    payComponentId: '',
    amount: 0,
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: '',
  });

  const isFinanceOfficer = user?.role === 'finance' || user?.role === 'admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsList, componentsList, staffList] = await Promise.all([
        payrollService.listStaffAssignments(),
        payrollService.listPayComponents(),
        payrollService.listStaff(),
      ]);
      
      setAssignments(assignmentsList);
      setPayComponents(componentsList);
      setStaff(staffList);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load staff assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingAssignment) {
        const updateData: UpdateStaffAssignmentRequest = {
          amount: formData.amount,
          effectiveTo: formData.effectiveTo || undefined,
        };
        const updated = await payrollService.updateStaffAssignment(editingAssignment.id, updateData);
        setAssignments(prev => prev.map(a => a.id === editingAssignment.id ? updated : a));
        toast.success('Staff assignment updated successfully');
      } else {
        const newAssignment = await payrollService.createStaffAssignment(formData);
        setAssignments(prev => [newAssignment, ...prev]);
        toast.success('Staff assignment created successfully');
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving staff assignment:', error);
      toast.error('Failed to save staff assignment');
    }
  };

  const handleEdit = (assignment: StaffPayAssignment) => {
    setEditingAssignment(assignment);
    setFormData({
      staffId: assignment.userId,
      payComponentId: assignment.componentId,
      amount: assignment.amount,
      effectiveFrom: assignment.effectiveFrom.split('T')[0],
      effectiveTo: assignment.effectiveTo ? assignment.effectiveTo.split('T')[0] : '',
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (assignment: StaffPayAssignment) => {
    if (!confirm(`Are you sure you want to delete this assignment for ${assignment.staffName}?`)) {
      return;
    }

    try {
      await payrollService.deleteStaffAssignment(assignment.id);
      setAssignments(prev => prev.filter(a => a.id !== assignment.id));
      toast.success('Staff assignment deleted successfully');
    } catch (error) {
      console.error('Error deleting staff assignment:', error);
      toast.error('Failed to delete staff assignment');
    }
  };

  const handleToggleActive = async (assignment: StaffPayAssignment) => {
    try {
      const updated = await payrollService.updateStaffAssignment(assignment.id, {
        isActive: !assignment.isActive,
      });
      setAssignments(prev => prev.map(a => a.id === assignment.id ? updated : a));
      toast.success(`Assignment ${updated.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error toggling assignment status:', error);
      toast.error('Failed to update assignment status');
    }
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setEditingAssignment(null);
    setFormData({
      staffId: '',
      payComponentId: '',
      amount: 0,
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '',
    })
  };

  const typeColors = {
    BASIC: 'bg-blue-100 text-blue-800',
    ALLOWANCE: 'bg-green-100 text-green-800',
    DEDUCTION: 'bg-red-100 text-red-800',
    EMPLOYER_CONTRIBUTION: 'bg-purple-100 text-purple-800',
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.component.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStaff = staffFilter === 'ALL' || assignment.userId === staffFilter;
    return matchesSearch && matchesStaff;
  });

  // Group assignments by staff
  const assignmentsByStaff = filteredAssignments.reduce((acc, assignment) => {
    if (!acc[assignment.userId]) {
      acc[assignment.userId] = {
        staffName: assignment.staffName,
        assignments: [],
      };
    }
    acc[assignment.userId].assignments.push(assignment);
    return acc;
  }, {} as Record<string, { staffName: string; assignments: StaffPayAssignment[] }>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading staff assignments...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Pay Assignments</h1>
          <p className="text-muted-foreground">
            Manage individual staff salary components and allowances
          </p>
        </div>
        {isFinanceOfficer && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Assignment
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
                placeholder="Search by staff name or component..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={staffFilter} onValueChange={setStaffFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Staff</SelectItem>
                {staff.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="grouped" className="w-full">
        <TabsList>
          <TabsTrigger value="grouped">Grouped by Staff</TabsTrigger>
          <TabsTrigger value="list">All Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="grouped" className="space-y-4">
          {Object.entries(assignmentsByStaff).map(([staffId, staffData]) => (
            <Card key={staffId}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {staffData.staffName}
                </CardTitle>
                <CardDescription>
                  {staffData.assignments.length} assignment{staffData.assignments.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Effective From</TableHead>
                      <TableHead>Effective To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffData.assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">{assignment.component.name}</TableCell>
                        <TableCell>
                          <Badge className={typeColors[assignment.component.type]}>
                            {assignment.component.type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>${assignment.amount.toLocaleString()}</TableCell>
                        <TableCell>{format(new Date(assignment.effectiveFrom), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          {assignment.effectiveTo 
                            ? format(new Date(assignment.effectiveTo), 'MMM dd, yyyy')
                            : 'Ongoing'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant={assignment.isActive ? 'default' : 'secondary'}>
                            {assignment.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isFinanceOfficer && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(assignment)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleActive(assignment)}
                                className={assignment.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                              >
                                {assignment.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(assignment)}
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
              </CardContent>
            </Card>
          ))}

          {Object.keys(assignmentsByStaff).length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                  <User className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Staff Assignments Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {payComponents.length === 0 
                    ? "You need to create pay components first before you can assign them to staff."
                    : "Assign pay components to your staff members to define their compensation structure."
                  }
                </p>
                
                {isFinanceOfficer && (
                  <div className="space-y-4">
                    {payComponents.length === 0 ? (
                      <Button onClick={() => window.location.href = '/finance/pay-components'}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Pay Components First
                      </Button>
                    ) : (
                      <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Assignment
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>All Assignments</CardTitle>
              <CardDescription>
                {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Component</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Effective From</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">{assignment.staffName}</TableCell>
                      <TableCell>{assignment.component.name}</TableCell>
                      <TableCell>
                        <Badge className={typeColors[assignment.component.type]}>
                          {assignment.component.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>${assignment.amount.toLocaleString()}</TableCell>
                      <TableCell>{format(new Date(assignment.effectiveFrom), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={assignment.isActive ? 'default' : 'secondary'}>
                          {assignment.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isFinanceOfficer && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(assignment)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(assignment)}
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

              {filteredAssignments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No assignments found matching your filters.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAssignment ? 'Edit Staff Assignment' : 'Create New Staff Assignment'}
            </DialogTitle>
            <DialogDescription>
              {editingAssignment 
                ? 'Update the staff pay assignment details below'
                : 'Assign a pay component to a staff member'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="staffId">Staff Member</Label>
              <Select 
                value={formData.staffId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, staffId: value }))}
                disabled={!!editingAssignment}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.firstName && member.lastName 
                        ? `${member.firstName} ${member.lastName} (${member.role})`
                        : member.email 
                          ? `${member.email} (${member.role})`
                          : `${member.role} - ${member.id.slice(-8)}`
                      }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="payComponentId">Pay Component</Label>
              <Select 
                value={formData.payComponentId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, payComponentId: value }))}
                disabled={!!editingAssignment}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pay component" />
                </SelectTrigger>
                <SelectContent>
                  {payComponents.map((component) => (
                    <SelectItem key={component.id} value={component.id}>
                      {component.name} ({component.type.replace('_', ' ')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="effectiveFrom">Effective From</Label>
                <Input
                  id="effectiveFrom"
                  type="date"
                  value={formData.effectiveFrom}
                  onChange={(e) => setFormData(prev => ({ ...prev, effectiveFrom: e.target.value }))}
                  disabled={!!editingAssignment}
                />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="effectiveTo">Effective To (Optional)</Label>
                <Input
                  id="effectiveTo"
                  type="date"
                  value={formData.effectiveTo}
                  onChange={(e) => setFormData(prev => ({ ...prev, effectiveTo: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.staffId || !formData.payComponentId || formData.amount <= 0}
            >
              {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}