import { api } from '@/lib/api';

// Types for expense management - matching backend entities
export interface Expense {
  id: string;
  expenseNumber: string;
  title: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  department: string;
  requestedBy: string;
  requestedByUserId: string;
  requestDate: string;
  dueDate: string;
  status: ExpenseStatus;
  approvalLevel: number;
  budgetCode?: string;
  priority: ExpensePriority;
  attachments: string[];
  approvedAmount?: number;
  approvedDate?: string;
  approvedBy?: string;
  approvedByUserId?: string;
  paidDate?: string;
  paidBy?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  approvalHistory?: ExpenseApprovalHistory[];
}

export interface ExpenseApprovalHistory {
  id: string;
  expenseId: string;
  action: ApprovalAction;
  performedBy: string;
  performedByUserId: string;
  comments?: string;
  previousStatus?: string;
  newStatus?: string;
  amount?: number;
  approvalLevel?: number;
  createdAt: string;
}

export enum ExpenseCategory {
  PERSONNEL = 'Personnel',
  ACADEMIC_RESOURCES = 'Academic Resources',
  FACILITIES = 'Facilities',
  TRANSPORTATION = 'Transportation',
  FOOD_SERVICES = 'Food Services',
  ADMINISTRATIVE = 'Administrative',
  EMERGENCY = 'Emergency',
  OTHER = 'Other'
}

export enum ExpenseStatus {
  PENDING = 'Pending',
  DEPARTMENT_APPROVED = 'Department Approved',
  FINANCE_REVIEW = 'Finance Review',
  PRINCIPAL_APPROVED = 'Principal Approved',
  BOARD_REVIEW = 'Board Review',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  PAID = 'Paid'
}

export enum ExpensePriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export enum ApprovalAction {
  SUBMITTED = 'Submitted',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  PAID = 'Paid',
  COMMENTED = 'Commented'
}

export interface ExpenseComment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

export interface CreateExpenseRequest {
  title: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  department: string;
  budgetCode?: string;
  priority?: ExpensePriority;
  dueDate: string;
  attachments?: string[];
  notes?: string;
}

export interface UpdateExpenseRequest {
  title?: string;
  description?: string;
  amount?: number;
  category?: ExpenseCategory;
  department?: string;
  budgetCode?: string;
  priority?: ExpensePriority;
  dueDate?: string;
  attachments?: string[];
  notes?: string;
}

export interface ApproveExpenseRequest {
  comments?: string;
  approvedAmount?: number;
}

export interface RejectExpenseRequest {
  reason: string;
  comments?: string;
}

export interface ExpenseFilters {
  status?: ExpenseStatus;
  category?: ExpenseCategory;
  priority?: ExpensePriority;
  department?: string;
  requestedBy?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ExpenseAnalytics {
  totalExpenses: number;
  totalAmount: number;
  approvedAmount: number;
  pendingAmount: number;
  categoryBreakdown: Record<string, number>;
  monthlyTrend: Record<string, number>;
}

class ExpenseService {
  private baseUrl = '/expenses';

  // Get all expenses with optional filters
  async getExpenses(filters?: ExpenseFilters): Promise<{ expenses: Expense[]; total: number }> {
    try {
      const params = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await api.get(`${this.baseUrl}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  }

  // Get a single expense by ID
  async getExpenseById(id: string): Promise<Expense> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching expense:', error);
      throw error;
    }
  }

  // Create a new expense
  async createExpense(expenseData: CreateExpenseRequest): Promise<Expense> {
    try {
      const response = await api.post(this.baseUrl, expenseData);
      return response.data;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  // Update an expense
  async updateExpense(id: string, expenseData: UpdateExpenseRequest): Promise<Expense> {
    try {
      const response = await api.patch(`${this.baseUrl}/${id}`, expenseData);
      return response.data;
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  // Delete an expense
  async deleteExpense(id: string): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  // Approve an expense
  async approveExpense(id: string, approveData: ApproveExpenseRequest): Promise<Expense> {
    try {
      const response = await api.post(`${this.baseUrl}/${id}/approve`, approveData);
      return response.data;
    } catch (error) {
      console.error('Error approving expense:', error);
      throw error;
    }
  }

  // Reject an expense
  async rejectExpense(id: string, rejectData: RejectExpenseRequest): Promise<Expense> {
    try {
      const response = await api.post(`${this.baseUrl}/${id}/reject`, rejectData);
      return response.data;
    } catch (error) {
      console.error('Error rejecting expense:', error);
      throw error;
    }
  }

  // Add comment to expense
  async addComment(id: string, comment: string): Promise<ExpenseComment> {
    try {
      const response = await api.post(`${this.baseUrl}/${id}/comments`, {
        content: comment
      });
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  // Get expense analytics
  async getAnalytics(filters?: ExpenseFilters): Promise<ExpenseAnalytics> {
    try {
      const params = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await api.get(`${this.baseUrl}/analytics?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }

  // Download expense report
  async downloadReport(filters?: ExpenseFilters, format: 'pdf' | 'excel' = 'pdf'): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            params.append(key, value);
          }
        });
      }

      // For now, return mock blob data since the API utility doesn't support blob responses
      // In a real implementation, you'd extend the API utility to support different response types
      const response = await api.get(`${this.baseUrl}/report?${params.toString()}`);
      
      // Create a mock blob from the response
      const blob = new Blob([JSON.stringify(response)], { type: 'application/json' });
      return blob;
    } catch (error) {
      console.error('Error downloading report:', error);
      throw error;
    }
  }

  // Get expense categories
  async getCategories(): Promise<string[]> {
    try {
      const response = await api.get(`${this.baseUrl}/categories`);
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Return default categories as fallback
      return [
        'Personnel',
        'Academic Resources',
        'Facilities',
        'Transportation',
        'Food Services',
        'Administrative',
        'Emergency',
        'Other'
      ];
    }
  }

  // Get departments
  async getDepartments(): Promise<string[]> {
    try {
      const response = await api.get(`${this.baseUrl}/departments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching departments:', error);
      // Return default departments as fallback
      return [
        'Administration',
        'Science',
        'Mathematics',
        'English',
        'Social Studies',
        'Art',
        'Music',
        'Physical Education',
        'Transportation',
        'Food Services',
        'Maintenance'
      ];
    }
  }

  // Check budget availability
  async checkBudgetAvailability(budgetCode: string, amount: number): Promise<{
    available: boolean;
    allocated: number;
    spent: number;
    remaining: number;
  }> {
    try {
      const response = await api.post(`${this.baseUrl}/budget-check`, {
        budgetCode,
        amount
      });
      return response.data;
    } catch (error) {
      console.error('Error checking budget:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const expenseService = new ExpenseService();
export default expenseService;