import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, DollarSign, Users, TrendingUp } from 'lucide-react';
import { SalaryRun } from '@/services/payrollService';

interface ApprovalDialogProps {
  run: SalaryRun;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprovalAction: (action: 'approve' | 'reject', comments?: string) => void;
}

export default function ApprovalDialog({ run, open, onOpenChange, onApprovalAction }: ApprovalDialogProps) {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!action) return;
    
    if (action === 'reject' && !comments.trim()) {
      return; // Require comments for rejection
    }

    setLoading(true);
    try {
      await onApprovalAction(action, comments.trim() || undefined);
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAction(null);
    setComments('');
    onOpenChange(false);
  };

  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PREPARED: 'bg-transparent border border-blue-300 text-blue-700',
    SUBMITTED: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-transparent border border-green-300 text-green-700',
    REJECTED: 'bg-transparent border border-red-300 text-red-700',
    FINALIZED: 'bg-purple-100 text-purple-800',
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Review Salary Run - {run.period}
            <Badge className={statusColors[run.status]}>
              {run.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Review the salary run details and approve or reject the submission
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{run.staffCount || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gross Salary</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(run.totalGross || 0).toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Salary</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(run.totalNet || 0).toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Run Details */}
          <Card>
            <CardHeader>
              <CardTitle>Run Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Period</Label>
                  <p className="text-sm">{run.period}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Employer Contribution</Label>
                  <p className="text-sm">${(run.employerCost || 0).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Deductions</Label>
                  <p className="text-sm">${((run.totalGross || 0) - (run.totalNet || 0)).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Average per Staff</Label>
                  <p className="text-sm">${run.staffCount > 0 ? Math.round((run.totalNet || 0) / run.staffCount).toLocaleString() : '0'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Selection */}
          {!action && (
            <Card>
              <CardHeader>
                <CardTitle>Choose Action</CardTitle>
                <CardDescription>
                  Select whether to approve or reject this salary run
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className="flex-1 h-20 flex flex-col items-center gap-2 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                    onClick={() => setAction('approve')}
                  >
                    <CheckCircle className="h-6 w-6" />
                    <span>Approve</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-20 flex flex-col items-center gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    onClick={() => setAction('reject')}
                  >
                    <XCircle className="h-6 w-6" />
                    <span>Reject</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments Section */}
          {action && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {action === 'approve' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  {action === 'approve' ? 'Approve' : 'Reject'} Salary Run
                </CardTitle>
                <CardDescription>
                  {action === 'approve' 
                    ? 'Add any approval comments (optional)'
                    : 'Please provide reasons for rejection (required)'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="comments">Comments</Label>
                  <Textarea
                    id="comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder={
                      action === 'approve'
                        ? 'Add any additional notes or approval comments...'
                        : 'Please explain why this salary run is being rejected...'
                    }
                    rows={4}
                    className={action === 'reject' && !comments.trim() ? 'border-red-300' : ''}
                  />
                  {action === 'reject' && !comments.trim() && (
                    <p className="text-sm text-red-600">
                      Comments are required when rejecting a salary run
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <div>
              {action && (
                <Button variant="outline" onClick={() => setAction(null)}>
                  Back
                </Button>
              )}
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              {action && (
                <Button
                  onClick={handleSubmit}
                  variant="outline"
                  disabled={loading || (action === 'reject' && !comments.trim())}
                  className={action === 'approve' ? 'text-green-700 border-green-300 hover:text-green-800' : 'text-red-700 border-red-300 hover:text-red-800'}
                >
                  {loading ? 'Processing...' : (action === 'approve' ? 'Approve Run' : 'Reject Run')}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}