import { api } from "@/services/api";

export interface StudentClass {
  id: string;
  name: string;
}

export interface StudentRecord {
  id: string;
  studentId?: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
  class?: StudentClass;
  user: {
    email: string;
    username?: string;
  };
}

export interface StudentStats {
  totalStudents: number;
  classBreakdown: Array<{
    className: string;
    count: number;
  }>;
  graduatedStudents: number;
}

export interface StudentPagination {
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface StudentListResponse {
  students: StudentRecord[];
  pagination: StudentPagination;
}

export interface StudentListParams {
  token: string;
  page: number;
  limit: number;
  search?: string;
  form?: string;
}

interface StudentBulkUploadResponse {
  summary?: {
    created?: number;
    failed?: number;
  };
  errors?: Array<{ line: number; error: string }>;
}

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

const normalizeStudentList = (
  payload: unknown,
  fallbackPage: number,
  fallbackLimit: number
): StudentListResponse => {
  const data = asRecord(payload);
  const students = Array.isArray(data.students)
    ? (data.students as StudentRecord[])
    : Array.isArray(payload)
    ? (payload as StudentRecord[])
    : [];

  const pagination = asRecord(data.pagination);

  return {
    students,
    pagination: {
      totalPages: Number(pagination.totalPages ?? Math.max(1, fallbackPage)),
      totalItems: Number(pagination.totalItems ?? students.length),
      itemsPerPage: Number(pagination.itemsPerPage ?? fallbackLimit),
    },
  };
};

const normalizeStudentStats = (payload: unknown): StudentStats => {
  const payloadRecord = asRecord(payload);
  const data = payloadRecord.success ? asRecord(payloadRecord.data) : payloadRecord;
  return {
    totalStudents: Number(data.totalStudents ?? 0),
    classBreakdown: Array.isArray(data.classBreakdown)
      ? (data.classBreakdown as StudentStats["classBreakdown"])
      : [],
    graduatedStudents: Number(data.graduatedStudents ?? 0),
  };
};

export const studentService = {
  async getStudents({
    token,
    page,
    limit,
    search = "",
    form = "",
  }: StudentListParams): Promise<StudentListResponse> {
    const payload = await api.get<unknown>("/student/students", {
      token,
      params: {
        page,
        limit,
        search,
        form,
      },
    });

    return normalizeStudentList(payload, page, limit);
  },

  async getAllStudents(token: string): Promise<StudentRecord[]> {
    const payload = await api.get<unknown>("/student/students", {
      token,
      params: {
        page: 1,
        limit: 1000,
      },
    });

    return normalizeStudentList(payload, 1, 1000).students;
  },

  async getClasses(token: string): Promise<StudentClass[]> {
    const payload = await api.get<unknown>("/classes", { token });
    if (Array.isArray(payload)) {
      return payload as StudentClass[];
    }
    const data = asRecord(payload);
    return Array.isArray(data.classes) ? (data.classes as StudentClass[]) : [];
  },

  async getStats(token: string): Promise<StudentStats> {
    const payload = await api.get<unknown>("/student/students/stats", { token });
    return normalizeStudentStats(payload);
  },

  async bulkUploadStudents(token: string, file: File): Promise<StudentBulkUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    return api.post<StudentBulkUploadResponse>("/student/students/bulk-upload", {
      token,
      body: formData,
    });
  },

  async downloadTemplate(token: string): Promise<Blob> {
    return api.get<Blob>("/student/students/template", {
      token,
      parseAs: "blob",
    });
  },

  async activateStudent(token: string, studentId: string): Promise<void> {
    await api.post(`/student/students/${studentId}/activate`, {
      token,
      body: {},
      parseAs: "none",
    });
  },

  async deactivateStudent(token: string, studentId: string, reason = "manual"): Promise<void> {
    await api.post(`/student/students/${studentId}/deactivate`, {
      token,
      body: { reason },
      parseAs: "none",
    });
  },
};
