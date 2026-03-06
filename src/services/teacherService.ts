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

export interface TeacherStudentRecord {
  id: string;
  studentId?: string;
  firstName: string;
  lastName: string;
  user: {
    email: string;
  };
  class?: {
    id?: string;
    name: string;
  };
  attendance?: number;
  performance?: string;
}

export interface TeacherStudentsResponse {
  students: TeacherStudentRecord[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface TeacherStudentsParams {
  token: string;
  page: number;
  limit: number;
  search?: string;
  className?: string;
}

export interface TeacherTermOption {
  id: string;
  name?: string;
  termNumber?: number;
  isCurrent?: boolean;
}

export interface TeacherExamRecord {
  id: string;
  title: string;
  examType?: string;
  date?: string;
  totalMarks?: number;
  status: string;
  course?: {
    id: string;
    name: string;
  };
  class?: {
    id: string;
    name: string;
  };
  Term?: TeacherTermOption;
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

const normalizeTeacherStudents = (
  payload: unknown,
  fallbackPage: number,
  fallbackLimit: number
): TeacherStudentsResponse => {
  const data = asRecord(payload);
  const students = Array.isArray(data.students)
    ? (data.students as TeacherStudentRecord[])
    : Array.isArray(payload)
    ? (payload as TeacherStudentRecord[])
    : [];

  const pagination = asRecord(data.pagination);

  return {
    students,
    pagination: {
      currentPage: Number(pagination.currentPage ?? fallbackPage),
      totalPages: Number(pagination.totalPages ?? 1),
      totalItems: Number(pagination.totalItems ?? students.length),
      itemsPerPage: Number(pagination.itemsPerPage ?? fallbackLimit),
    },
  };
};

const normalizeTeacherExamList = (payload: unknown): TeacherExamRecord[] => {
  if (Array.isArray(payload)) {
    return payload as TeacherExamRecord[];
  }

  const data = asRecord(payload);
  return Array.isArray(data.exams) ? (data.exams as TeacherExamRecord[]) : [];
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

  async getMyStudents({
    token,
    page,
    limit,
    search = "",
    className = "",
  }: TeacherStudentsParams): Promise<TeacherStudentsResponse> {
    const payload = await api.get<unknown>("/teacher/my-students", {
      token,
      params: {
        page,
        limit,
        search,
        class: className,
      },
    });

    return normalizeTeacherStudents(payload, page, limit);
  },

  async getTeacherTerms(token: string): Promise<TeacherTermOption[]> {
    const payload = await api.get<unknown>("/settings/terms", { token });
    return Array.isArray(payload) ? (payload as TeacherTermOption[]) : [];
  },

  async getTeacherCourseExams(token: string, courseId: string): Promise<TeacherExamRecord[]> {
    const payload = await api.get<unknown>("/teacher/my-exams", {
      token,
      params: { courseId },
    });

    return normalizeTeacherExamList(payload);
  },

  async getTeacherAllExams(token: string): Promise<TeacherExamRecord[]> {
    const payload = await api.get<unknown>("/teacher/my-exams/all", { token });
    return normalizeTeacherExamList(payload);
  },
};
