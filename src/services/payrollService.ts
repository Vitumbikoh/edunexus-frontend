import { api } from '@/lib/api';

export type SalaryRunStatus = 'DRAFT' | 'PREPARED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'FINALIZED';
export type PayComponentType = 'BASIC' | 'ALLOWANCE' | 'DEDUCTION' | 'EMPLOYER_CONTRIBUTION';

export interface SalaryRun {
  id: string;
  period: string; // YYYY-MM
  termId?: string | null;
  status: SalaryRunStatus;
  totalGross: number;
  totalNet: number;
  employerCost: number;
  staffCount: number;
  postedExpenseId?: string | null;
  createdAt: string;
  updatedAt: string;
  salaryItems?: SalaryItem[];
  approvalHistory?: PayrollApprovalHistory[];
}

export interface SalaryItem {
  id: string;
  runId: string;
  userId: string;
  staffName: string;
  department: string | null;
  breakdown: Record<string, any>;
  grossPay: number;
  taxablePay: number;
  paye: number;
  nhif: number;
  nssf: number;
  otherDeductions: number;
  netPay: number;
  employerContrib: number;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayComponent {
  id: string;
  name: string;
  type: PayComponentType;
  isFixed: boolean;
  defaultAmount: number;
  formula: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaffPayAssignment {
  id: string;
  userId: string;
  staffName: string;
  componentId: string;
  amount: number;
  isActive: boolean;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  createdAt: string;
  updatedAt: string;
  component?: PayComponent;
  user?: any;
}

export interface StaffWithSalary {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  grossPay: number;
  taxablePay: number;
  deductions: number;
  netPay: number;
  breakdown: Record<string, any>;
  hasAssignments: boolean;
}

export interface PayrollApprovalHistory {
  id: string;
  salaryRunId: string;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'FINALIZED';
  performedBy: string;
  performedByName: string;
  comments: string | null;
  createdAt: string;
}

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  joinDate: string;
  status: string;
}

export interface CreateRunRequest {
  period: string;
  termId?: string;
  staffIds?: string[];
}

export interface CreatePayComponentRequest {
  name: string;
  type: PayComponentType;
  isFixed: boolean;
  defaultAmount: number;
  formula?: string;
  department?: string;
  autoAssign?: boolean;
}

export interface CreateStaffAssignmentRequest {
  staffId: string;
  payComponentId: string;
  amount: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface UpdateStaffAssignmentRequest {
  amount?: number;
  effectiveTo?: string;
  isActive?: boolean;
}

class PayrollService {
  private baseUrl = '/payroll';

  // Salary Runs
  async listRuns(page = 1, limit = 20, status?: SalaryRunStatus): Promise<{ data: SalaryRun[]; total: number; page: number; limit: number }> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.append('status', status);
    const res = await api.get(`${this.baseUrl}/runs?${params.toString()}`);
    return res as any;
  }

  async createRun(payload: CreateRunRequest): Promise<SalaryRun> {
    const res = await api.post(`${this.baseUrl}/runs`, payload);
    return res as any;
  }

  async getRun(id: string): Promise<SalaryRun> {
    const res = await api.get(`${this.baseUrl}/runs/${id}`);
    return res as any;
  }

  async updateRun(id: string, payload: Partial<CreateRunRequest>): Promise<SalaryRun> {
    const res = await api.put(`${this.baseUrl}/runs/${id}`, payload);
    return res as any;
  }

  async deleteRun(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/runs/${id}`);
  }

  // Workflow Actions
  async prepare(id: string): Promise<SalaryRun> {
    const res = await api.put(`${this.baseUrl}/runs/${id}/prepare`, {});
    return res as any;
  }

  async submit(id: string, comments?: string): Promise<SalaryRun> {
    const res = await api.put(`${this.baseUrl}/runs/${id}/submit`, { comments });
    return res as any;
  }

  async approve(id: string, comments?: string): Promise<SalaryRun> {
    const res = await api.put(`${this.baseUrl}/runs/${id}/approve`, { comments });
    return res as any;
  }

  async reject(id: string, comments: string): Promise<SalaryRun> {
    const res = await api.put(`${this.baseUrl}/runs/${id}/reject`, { comments });
    return res as any;
  }

  async finalize(id: string): Promise<SalaryRun> {
    const res = await api.put(`${this.baseUrl}/runs/${id}/finalize`, {});
    return res as any;
  }

  // Salary Items
  async getRunItems(runId: string): Promise<SalaryItem[]> {
    const res = await api.get(`${this.baseUrl}/runs/${runId}/items`);
    return res as any;
  }

  async getSalaryItem(runId: string, itemId: string): Promise<SalaryItem> {
    const res = await api.get(`${this.baseUrl}/runs/${runId}/items/${itemId}`);
    return res as any;
  }

  async updateSalaryItem(runId: string, itemId: string, payload: { salaryBreakdown: Record<string, number> }): Promise<SalaryItem> {
    const res = await api.put(`${this.baseUrl}/runs/${runId}/items/${itemId}`, payload);
    return res as any;
  }

  // Pay Components
  async listPayComponents(): Promise<PayComponent[]> {
    const res = await api.get(`${this.baseUrl}/components`);
    return res as any;
  }

  async createPayComponent(payload: CreatePayComponentRequest): Promise<PayComponent> {
    const res = await api.post(`${this.baseUrl}/components`, payload);
    return res as any;
  }

  async getPayComponent(id: string): Promise<PayComponent> {
    const res = await api.get(`${this.baseUrl}/components/${id}`);
    return res as any;
  }

  async updatePayComponent(id: string, payload: Partial<CreatePayComponentRequest>): Promise<PayComponent> {
    const res = await api.put(`${this.baseUrl}/components/${id}`, payload);
    return res as any;
  }

  async deletePayComponent(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/components/${id}`);
  }

  // Staff Pay Assignments
  async listStaffAssignments(staffId?: string): Promise<StaffPayAssignment[]> {
    const params = staffId ? `?staffId=${staffId}` : '';
    const res = await api.get(`${this.baseUrl}/assignments${params}`);
    return res as any;
  }

  async createStaffAssignment(payload: CreateStaffAssignmentRequest): Promise<StaffPayAssignment> {
    const res = await api.post(`${this.baseUrl}/assignments`, payload);
    return res as any;
  }

  async getStaffAssignment(id: string): Promise<StaffPayAssignment> {
    const res = await api.get(`${this.baseUrl}/assignments/${id}`);
    return res as any;
  }

  async updateStaffAssignment(id: string, payload: UpdateStaffAssignmentRequest): Promise<StaffPayAssignment> {
    const res = await api.put(`${this.baseUrl}/assignments/${id}`, payload);
    return res as any;
  }

  async deleteStaffAssignment(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/assignments/${id}`);
  }

  // Staff Management
  async listStaff(): Promise<Staff[]> {
    const res = await api.get('/staff'); // Using staff endpoint
    // Handle both direct array response and paginated response
    if (Array.isArray(res)) {
      return res as any;
    }
    return (res.staff || res.data || res) as any;
  }

  // Reports & Exports
  async generatePayslip(runId: string, staffId: string): Promise<Blob> {
    const res = await api.get(`${this.baseUrl}/runs/${runId}/payslip/${staffId}`);
    return res as any;
  }

  async exportPayroll(runId: string, format: 'pdf' | 'excel' = 'pdf'): Promise<Blob> {
    const res = await api.get(`${this.baseUrl}/runs/${runId}/export?format=${format}`);
    return res as any;
  }

  async getApprovalHistory(runId: string): Promise<PayrollApprovalHistory[]> {
    const res = await api.get(`${this.baseUrl}/runs/${runId}/history`);
    return res as any;
  }

  // Staff with calculated salaries
  async getStaffWithSalaries(): Promise<StaffWithSalary[]> {
    const res = await api.get(`${this.baseUrl}/staff-with-salaries`);
    return res as any;
  }
}

export const payrollService = new PayrollService();
export default payrollService;
