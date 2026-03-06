import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teacherService } from "@/services/teacherService";

export interface UseTeachersParams {
  token: string | null;
  page: number;
  limit: number;
  search: string;
  enabled?: boolean;
}

export const teacherQueryKeys = {
  all: ["teachers"] as const,
  list: (params: { page: number; limit: number; search: string }) =>
    [...teacherQueryKeys.all, "list", params] as const,
};

export function useTeachers({
  token,
  page,
  limit,
  search,
  enabled = true,
}: UseTeachersParams) {
  return useQuery({
    queryKey: teacherQueryKeys.list({ page, limit, search }),
    queryFn: async () => {
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }
      return teacherService.getTeachers({
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

export function useTeacherStatusMutation(token: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { teacherId: string; status: string }) => {
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }
      return teacherService.updateTeacherStatus(token, payload.teacherId, payload.status);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: teacherQueryKeys.all });
    },
  });
}

