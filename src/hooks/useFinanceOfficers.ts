import { useQuery } from "@tanstack/react-query";
import { financeOfficerService } from "@/services/financeOfficerService";

export interface UseFinanceOfficersParams {
  token: string | null;
  page: number;
  limit: number;
  search: string;
  enabled?: boolean;
}

export const financeOfficerQueryKeys = {
  all: ["finance-officers"] as const,
  list: (params: { page: number; limit: number; search: string }) =>
    [...financeOfficerQueryKeys.all, "list", params] as const,
};

export function useFinanceOfficers({
  token,
  page,
  limit,
  search,
  enabled = true,
}: UseFinanceOfficersParams) {
  return useQuery({
    queryKey: financeOfficerQueryKeys.list({ page, limit, search }),
    queryFn: async () => {
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }
      return financeOfficerService.getFinanceOfficers({
        token,
        page,
        limit,
        search,
      });
    },
    enabled: enabled && Boolean(token),
    placeholderData: (previousData) => previousData,
  });
}

