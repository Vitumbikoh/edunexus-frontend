import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Play, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import {
  AppTable,
  DataCard,
  EmptyState,
  FilterBar,
  PageContainer,
  PageHeader,
  StatusBadge,
} from "@/components/app";
import type { AppTableColumn } from "@/components/app";
import {
  useAdministerTeacherExam,
  useTeacherCourseExams,
} from "@/hooks/useTeacherPortal";
import type { TeacherExamRecord } from "@/services/teacherService";

export default function TeacherExams() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const courseId = params.get("courseId") || "";
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const examsQuery = useTeacherCourseExams(token, courseId, Boolean(courseId));
  const administerExamMutation = useAdministerTeacherExam(token);

  const exams = examsQuery.data ?? [];
  const courseName = exams[0]?.course?.name || "";

  const filteredExams = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) {
      return exams;
    }

    return exams.filter((exam) =>
      [exam.title, exam.course?.name, exam.examType]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [exams, searchTerm]);

  const examStats = useMemo(
    () => ({
      total: exams.length,
      upcoming: exams.filter((exam) => exam.status === "upcoming").length,
      administered: exams.filter((exam) => exam.status === "administered").length,
      graded: exams.filter((exam) => exam.status === "graded").length,
    }),
    [exams]
  );

  const columns = useMemo<AppTableColumn<TeacherExamRecord>[]>(
    () => [
      {
        id: "title",
        header: "Title",
        cell: (exam) => <span className="font-medium">{exam.title}</span>,
      },
      {
        id: "course",
        header: "Course",
        cell: (exam) => exam.course?.name || "-",
      },
      {
        id: "date",
        header: "Date",
        cell: (exam) =>
          exam.date ? new Date(exam.date).toLocaleDateString() : "Not scheduled",
      },
      {
        id: "total-marks",
        header: "Total Marks",
        cell: (exam) => exam.totalMarks ?? "-",
      },
      {
        id: "status",
        header: "Status",
        cell: (exam) => <StatusBadge status={exam.status} />,
      },
    ],
    []
  );

  const handleAdministerExam = async (examId: string) => {
    try {
      await administerExamMutation.mutateAsync(examId);
      toast({
        title: "Exam administered",
        description: "The exam is now ready for grading.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to administer exam",
        variant: "destructive",
      });
    }
  };

  if (!courseId) {
    return (
      <PageContainer>
        <EmptyState
          title="No course selected"
          description="Open exams from a course context to view course-specific assessments."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Course Exams"
        description={`All exams for ${courseName || "the selected course"}. Manage delivery and jump into the grading workflow faster.`}
        actions={
          <Button
            variant="outline"
            onClick={() => void examsQuery.refetch()}
            className="gap-2"
            disabled={examsQuery.isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${examsQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DataCard title="Total Exams" value={examStats.total} loading={examsQuery.isPending} tone="info" />
        <DataCard title="Upcoming" value={examStats.upcoming} loading={examsQuery.isPending} tone="warning" />
        <DataCard title="Administered" value={examStats.administered} loading={examsQuery.isPending} tone="default" />
        <DataCard title="Graded" value={examStats.graded} loading={examsQuery.isPending} tone="success" />
      </div>

      {examsQuery.error instanceof Error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {examsQuery.error.message}
        </div>
      ) : null}

      <FilterBar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchDebouncedChange={setSearchTerm}
        searchPlaceholder="Search exams by title, course, or type..."
      />

      <AppTable<TeacherExamRecord>
        columns={columns}
        data={filteredExams}
        getRowKey={(exam) => exam.id}
        loading={examsQuery.isPending}
        loadingText="Loading exams..."
        emptyTitle="No exams found"
        emptyDescription={
          searchTerm
            ? "Try a different search term."
            : "This course does not have any exams yet."
        }
        renderActions={(exam) => (
          <div className="flex items-center justify-end gap-2">
            {exam.status === "upcoming" ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => void handleAdministerExam(exam.id)}
                disabled={administerExamMutation.isPending}
              >
                <Play className="h-4 w-4" />
                Administer
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => navigate(`/exams/${exam.id}`)}
            >
              <FileText className="h-4 w-4" />
              View
            </Button>
          </div>
        )}
      />
    </PageContainer>
  );
}
