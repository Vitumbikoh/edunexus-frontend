import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import payrollService, { SalaryRun, StaffWithSalary } from '@/services/payrollService';
import { getCurrencySymbol } from '@/lib/currency';
import { toast } from 'sonner';

interface CreateRunDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRunCreated: (run: SalaryRun) => void;
}

export default function CreateRunDialog({ open, onOpenChange, onRunCreated }: CreateRunDialogProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    period: (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })(),
    termId: '',
    staffIds: [] as string[],
  });
  const [staff, setStaff] = useState<StaffWithSalary[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Use MWK currency (Malawian Kwacha) as default
  const currencySymbol = getCurrencySymbol('MWK'); // Returns "MK"

  useEffect(() => {
    if (open && step === 2) {
      loadStaff();
    }
  }, [open, step]);

  const loadStaff = async () => {
    try {
      setLoadingStaff(true);
      const staffList = await payrollService.getStaffWithSalaries();
      setStaff(staffList.filter(s => s.hasAssignments)); // Only show staff with salary assignments
    } catch (error) {
      console.error('Error loading staff:', error);
      toast.error('Failed to load staff list');
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.period) {
        toast.error('Please select a period');
        return;
      }
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleStaffSelect = (staffId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      staffIds: checked 
        ? [...prev.staffIds, staffId]
        : prev.staffIds.filter(id => id !== staffId)
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      staffIds: checked ? staff.map(s => s.id) : []
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      if (formData.staffIds.length === 0) {
        toast.error('Please select at least one staff member');
        return;
      }

      const newRun = await payrollService.createRun({
        period: formData.period,
        termId: formData.termId || undefined,
        staffIds: formData.staffIds,
      });

      toast.success('Salary run created successfully');
      onRunCreated(newRun);
      
      // Reset form
      setStep(1);
      setFormData({
        period: (() => {
          const d = new Date();
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        })(),
        termId: '',
        staffIds: [],
      });
    } catch (error) {
      console.error('Error creating salary run:', error);
      toast.error('Failed to create salary run');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      period: (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      })(),
      termId: '',
      staffIds: [],
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Salary Run</DialogTitle>
          <DialogDescription>
            Step {step} of 2: {step === 1 ? 'Basic Information' : 'Staff Selection'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="period">Pay Period</Label>
              <Input
                id="period"
                type="month"
                value={formData.period}
                onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value }))}
                placeholder="YYYY-MM"
              />
              <p className="text-sm text-muted-foreground">
                Select the month and year for this salary run
              </p>
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="termId">Academic Term (Optional)</Label>
              <Input
                id="termId"
                value={formData.termId}
                onChange={(e) => setFormData(prev => ({ ...prev, termId: e.target.value }))}
                placeholder="Leave empty for monthly payroll"
              />
              <p className="text-sm text-muted-foreground">
                Link to a specific academic term if needed
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select Staff Members</CardTitle>
                <CardDescription>
                  Choose which staff members to include in this salary run
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="select-all"
                    checked={formData.staffIds.length === staff.length && staff.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all">Select All Staff</Label>
                  <span className="text-sm text-muted-foreground">
                    ({formData.staffIds.length} of {staff.length} selected)
                  </span>
                </div>

                {loadingStaff ? (
                  <div className="text-center py-4">Loading staff...</div>
                ) : (
                  <div className="max-h-60 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Select</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead className="text-right">Gross Pay</TableHead>
                          <TableHead className="text-right">Net Pay</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staff.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell>
                              <Checkbox
                                checked={formData.staffIds.includes(member.id)}
                                onCheckedChange={(checked) => 
                                  handleStaffSelect(member.id, checked as boolean)
                                }
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {member.name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {member.role}
                              </Badge>
                            </TableCell>
                            <TableCell>{member.department}</TableCell>
                            <TableCell>{member.email}</TableCell>
                            <TableCell className="text-right font-medium">
                              {currencySymbol} {member.grossPay.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-medium text-green-600">
                              {currencySymbol} {member.netPay.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {staff.length === 0 && !loadingStaff && (
                  <div className="text-center py-8 text-muted-foreground">
                    No staff members with salary assignments found
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selection Summary */}
            {formData.staffIds.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Selection Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{formData.staffIds.length}</div>
                      <div className="text-sm text-muted-foreground">Selected Staff</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {currencySymbol} {staff
                          .filter(s => formData.staffIds.includes(s.id))
                          .reduce((sum, s) => sum + s.grossPay, 0)
                          .toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Gross Pay</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {currencySymbol} {staff
                          .filter(s => formData.staffIds.includes(s.id))
                          .reduce((sum, s) => sum + s.netPay, 0)
                          .toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Net Pay</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <DialogFooter>
          <div className="flex justify-between w-full">
            <div>
              {step === 2 && (
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              {step === 1 ? (
                <Button onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Salary Run'}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}