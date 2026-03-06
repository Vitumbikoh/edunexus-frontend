import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { studentService, type StudentListResponse, type StudentRecord } from "@/services/studentService";

export interface UseStudentsParams {
  token: string | null;
  page: number;
  limit: number;
  search: string;
  formFilter?: string;
  enabled?: boolean;
}

export const studentQueryKeys = {
  all: ["students"] as const,
  list: (params: { page: number; limit: number; search: string; formFilter: string }) =>
    [...studentQueryKeys.all, "list", params] as const,
  classes: () => [...studentQueryKeys.all, "classes"] as const,
  stats: () => [...studentQueryKeys.all, "stats"] as const,
};

const filterStudentsLocally = (
  students: StudentRecord[],
  search: string,
  limit: number,
  page: number
): StudentListResponse => {
  const needle = search.trim().toLowerCase();
  const filtered = students.filter((student) => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const email = (student.user?.email || "").toLowerCase();
    const username = (student.user?.username || "").toLowerCase();
    const studentId = (student.studentId || "").toLowerCase();
    return (
      fullName.includes(needle) ||
      email.includes(needle) ||
      username.includes(needle) ||
      studentId.includes(needle)
    );
  });

  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    students: filtered.slice(start, end),
    pagination: {
      totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      totalItems: filtered.length,
      itemsPerPage: limit,
    },
  };
};

export function useStudents({
  token,
  page,
  limit,
  search,
  formFilter = "",
  enabled = true,
}: UseStudentsParams) {
  return useQuery({
    queryKey: studentQueryKeys.list({ page, limit, search, formFilter }),
    queryFn: async () => {
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      const response = await studentService.getStudents({
        token,
        page,
        limit,
        search,
        form: formFilter,
      });

      if (search && response.students.length === 0) {
        const allStudents = await studentService.getAllStudents(token);
        return filterStudentsLocally(allStudents, search, limit, page);
      }

      return response;
    },
    enabled: enabled && Boolean(token),
    placeholderData: (previousData) => previousData,
  });
}

export function useStudentClasses(token: string | null, enabled = true) {
  return useQuery({
    queryKey: studentQueryKeys.classes(),
    queryFn: async () => {
      if (!token) {
        return [];
      }
      return studentService.getClasses(token);
    },
    enabled: enabled && Boolean(token),
    staleTime: 5 * 60 * 1000,
  });
}

export function useStudentStats(token: string | null, enabled = true) {
  return useQuery({
    queryKey: studentQueryKeys.stats(),
    queryFn: async () => {
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }
      return studentService.getStats(token);
    },
    enabled: enabled && Boolean(token),
    staleTime: 60 * 1000,
  });
}

export function useBulkStudentUpload(token: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }
      return studentService.bulkUploadStudents(token, file);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: studentQueryKeys.all }),
      ]);
    },
  });
}

export function useDownloadStudentTemplate(token: string | null) {
  return useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }
      return studentService.downloadTemplate(token);
    },
  });
}

export function useActivateStudent(token: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (studentId: string) => {
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }
      return studentService.activateStudent(token, studentId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: studentQueryKeys.all });
    },
  });
}

export function useDeactivateStudent(token: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { studentId: string; reason?: string }) => {
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }
      return studentService.deactivateStudent(token, payload.studentId, payload.reason);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: studentQueryKeys.all });
    },
  });
}

