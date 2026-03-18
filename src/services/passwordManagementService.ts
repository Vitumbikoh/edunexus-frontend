import { api } from "@/services/api";

export type ManagedUserRole =
  | "ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "PARENT"
  | "FINANCE"
  | "LIBRARIAN"
  | "SUPER_ADMIN";

export interface PasswordManagedUser {
  id: string;
  username: string;
  email?: string | null;
  role: ManagedUserRole;
  isActive: boolean;
  forcePasswordReset: boolean;
  schoolId?: string | null;
  firstName?: string;
  lastName?: string;
  displayName: string;
  lastLoginAt?: string | null;
}

export interface PasswordManagementListResponse {
  users: PasswordManagedUser[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface PasswordManagementListParams {
  token: string;
  page: number;
  limit: number;
  search?: string;
  role?: string;
  status?: string;
}

export const passwordManagementService = {
  async listUsers(params: PasswordManagementListParams): Promise<PasswordManagementListResponse> {
    const { token, page, limit, search = "", role = "all", status = "all" } = params;
    return api.get<PasswordManagementListResponse>("/users/password-management", {
      token,
      params: {
        page,
        limit,
        search,
        role,
        status,
      },
    });
  },

  async resetUserPassword(
    token: string,
    userId: string,
    payload: { newTemporaryPassword: string; forceResetOnNextLogin?: boolean; reason?: string },
  ): Promise<{ success: boolean; message: string }> {
    return api.patch<{ success: boolean; message: string }>(`/users/${userId}/admin-reset-password`, {
      token,
      body: payload,
    });
  },
};
