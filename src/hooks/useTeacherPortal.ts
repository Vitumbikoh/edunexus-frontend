import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { examService } from "@/services/examService";
import { teacherService } from "@/services/teacherService";

export interface UseTeacherStudentsParams {
  token: string | null;
  page: number;
  limit: number;
  search: string;
  className?: string;
  enabled?: boolean;
}

export const teacherPortalQueryKeys = {
  all: ["teacher-portal"] as const,
  students: (params: { page: number; limit: number; search: string; className: string }) =>
    [...teacherPortalQueryKeys.all, "students", params] as const,
  studentClasses: () => [...teacherPortalQueryKeys.all, "student-classes"] as const,
  terms: () => [...teacherPortalQueryKeys.all, "terms"] as const,
  courseExams: (courseId: string) =>
    [...teacherPortalQueryKeys.all, "course-exams", courseId] as const,
  allExams: () => [...teacherPortalQueryKeys.all, "all-exams"] as const,
};

const sortClassNames = (classNames: string[]) =>
  [...classNames].sort((first, second) =>
    first.localeCompare(second, undefined, { numeric: true, sensitivity: "base" })
  );

export function useTeacherStudents({
  token,
  page,
  limit,
  search,
  className = "",
  enabled = true,
}: UseTeacherStudentsParams) {
  return useQuery({
    queryKey: teacherPortalQueryKeys.students({ page, limit, search, className }),
    queryFn: async () => {
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      return teacherService.getMyStudents({
        token,
        page,
        limit,
        search,
        className,
      });
    },
    enabled: enabled && Boolean(token),
    placeholderData: (previousData) => previousData,
  });
}

export function useTeacherStudentClasses(token: string | null, enabled = true) {
  return useQuery({
    queryKey: teacherPortalQueryKeys.studentClasses(),
    queryFn: async () => {
      if (!token) {
        return [];
      }

      const response = await teacherService.getMyStudents({
        token,
        page: 1,
        limit: 5000,
      });

      const uniqueClasses = new Set(
        response.students
          .map((student) => student.class?.name)
          .filter((value): value is string => Boolean(value))
      );

      return sortClassNames([...uniqueClasses]);
    },
    enabled: enabled && Boolean(token),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTeacherTerms(token: string | null, enabled = true) {
  return useQuery({
    queryKey: teacherPortalQueryKeys.terms(),
    queryFn: async () => {
      if (!token) {
        return [];
      }

      return teacherService.getTeacherTerms(token);
    },
    enabled: enabled && Boolean(token),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTeacherCourseExams(
  token: string | null,
  courseId: string,
  enabled = true
) {
  return useQuery({
    queryKey: teacherPortalQueryKeys.courseExams(courseId),
    queryFn: async () => {
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      return teacherService.getTeacherCourseExams(token, courseId);
    },
    enabled: enabled && Boolean(token) && Boolean(courseId),
    placeholderData: (previousData) => previousData,
  });
}

export function useTeacherAllExams(token: string | null, enabled = true) {
  return useQuery({
    queryKey: teacherPortalQueryKeys.allExams(),
    queryFn: async () => {
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      return teacherService.getTeacherAllExams(token);
    },
    enabled: enabled && Boolean(token),
    placeholderData: (previousData) => previousData,
  });
}

export function useAdministerTeacherExam(token: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (examId: string) => {
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      return examService.administerExam(examId, token);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: teacherPortalQueryKeys.allExams() }),
        queryClient.invalidateQueries({ queryKey: [...teacherPortalQueryKeys.all, "course-exams"] }),
      ]);
    },
  });
}