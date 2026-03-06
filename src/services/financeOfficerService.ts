import { api } from "@/services/api";

export interface FinanceOfficerRecord {
  id: string;
  firstName: string;
  lastName: string;
  username?: string;
  email: string;
  phoneNumber?: string;
  department?: string;
  canApproveBudgets: boolean;
  canProcessPayments: boolean;
  status: string;
  hireDate: string;
}

export interface FinanceOfficerListResponse {
  financeOfficers: FinanceOfficerRecord[];
  pagination: {
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface FinanceOfficerListParams {
  token: string;
  page: number;
  limit: number;
  search?: string;
}

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

const normalizeFinanceOfficerList = (
  payload: unknown,
  fallbackLimit: number
): FinanceOfficerListResponse => {
  const data = asRecord(payload);
  const financeOfficers = Array.isArray(data.financeOfficers)
    ? (data.financeOfficers as FinanceOfficerRecord[])
    : Array.isArray(payload)
    ? (payload as FinanceOfficerRecord[])
    : [];

  const pagination = asRecord(data.pagination);
  return {
    financeOfficers,
    pagination: {
      totalPages: Number(pagination.totalPages ?? 1),
      totalItems: Number(pagination.totalItems ?? financeOfficers.length),
      itemsPerPage: Number(pagination.itemsPerPage ?? fallbackLimit),
    },
  };
};

export const financeOfficerService = {
  async getFinanceOfficers({
    token,
    page,
    limit,
    search = "",
  }: FinanceOfficerListParams): Promise<FinanceOfficerListResponse> {
    const payload = await api.get<unknown>("/finance/officers", {
      token,
      params: {
        page,
        limit,
        search,
      },
    });

    return normalizeFinanceOfficerList(payload, limit);
  },
};
