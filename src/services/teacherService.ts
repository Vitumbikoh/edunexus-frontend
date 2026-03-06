import { api } from "@/services/api";

export interface TeacherRecord {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  subjectSpecialization?: string;
  hireDate?: string;
  yearsOfExperience: number;
  status: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

export interface TeacherListResponse {
  teachers: TeacherRecord[];
  pagination: {
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface TeacherListParams {
  token: string;
  page: number;
  limit: number;
  search?: string;
}

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

const normalizeTeacherList = (
  payload: unknown,
  fallbackLimit: number
): TeacherListResponse => {
  const data = asRecord(payload);
  const teachers = Array.isArray(data.teachers)
    ? (data.teachers as TeacherRecord[])
    : Array.isArray(payload)
    ? (payload as TeacherRecord[])
    : [];

  const pagination = asRecord(data.pagination);
  return {
    teachers,
    pagination: {
      totalPages: Number(pagination.totalPages ?? 1),
      totalItems: Number(pagination.totalItems ?? teachers.length),
      itemsPerPage: Number(pagination.itemsPerPage ?? fallbackLimit),
    },
  };
};

export const teacherService = {
  async getTeachers({
    token,
    page,
    limit,
    search = "",
  }: TeacherListParams): Promise<TeacherListResponse> {
    const payload = await api.get<unknown>("/teacher/teachers", {
      token,
      params: {
        page,
        limit,
        search,
      },
    });

    return normalizeTeacherList(payload, limit);
  },

  async updateTeacherStatus(token: string, teacherId: string, status: string): Promise<void> {
    await api.patch(`/teacher/teachers/${teacherId}/status`, {
      token,
      body: { status },
      parseAs: "none",
    });
  },
};
