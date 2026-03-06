import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { FileText, GraduationCap, Play, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  AppTable,
  DataCard,
  FilterBar,
  PageContainer,
  PageHeader,
  StatusBadge,
} from "@/components/app";
import type { AppTableColumn } from "@/components/app";
import {
  useAdministerTeacherExam,
  useTeacherAllExams,
  useTeacherTerms,
} from "@/hooks/useTeacherPortal";
import type { TeacherExamRecord } from "@/services/teacherService";

const ALL_TERMS_VALUE = "__all_terms__";

export default function TeacherAllExams() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedTerm, setSelectedTerm] = useState<string>(ALL_TERMS_VALUE);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const termsQuery = useTeacherTerms(token, true);
  const allExamsQuery = useTeacherAllExams(token, true);
  const administerExamMutation = useAdministerTeacherExam(token);

  const terms = termsQuery.data ?? [];
  const exams = allExamsQuery.data ?? [];

  useEffect(() => {
    const currentTerm = terms.find((term) => term.isCurrent);
    if (currentTerm?.id) {
      setSelectedTerm((previousValue) =>
        previousValue === ALL_TERMS_VALUE ? currentTerm.id : previousValue
      );
    }
  }, [terms]);

  const filteredExams = useMemo(() => {
    const termScopedExams = exams.filter((exam) => {
      if (selectedTerm === ALL_TERMS_VALUE) {
        return true;
      }

      const selected = terms.find((term) => term.id === selectedTerm);
      const examTermId = exam.Term?.id;
      const examTermNumber = exam.Term?.termNumber;

      if (examTermId && examTermId === selectedTerm) {
        return true;
      }

      return (
        selected?.termNumber != null &&
        examTermNumber != null &&
        Number(selected.termNumber) === Number(examTermNumber)
      );
    });

    const needle = searchTerm.trim().toLowerCase();
    if (!needle) {
      return termScopedExams;
    }

    return termScopedExams.filter((exam) =>
      [exam.title, exam.course?.name, exam.class?.name, exam.examType]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [exams, searchTerm, selectedTerm, terms]);

  const examStats = useMemo(
    () => ({
      total: filteredExams.length,
      upcoming: filteredExams.filter((exam) => exam.status === "upcoming").length,
      administered: filteredExams.filter((exam) => exam.status === "administered").length,
      graded: filteredExams.filter((exam) => exam.status === "graded").length,
    }),
    [filteredExams]
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
        id: "class",
        header: "Class",
        cell: (exam) => exam.class?.name || "-",
      },
      {
        id: "date",
        header: "Date",
        cell: (exam) =>
          exam.date ? new Date(exam.date).toLocaleDateString() : "Not scheduled",
      },
      {
        id: "type",
        header: "Type",
        cell: (exam) => exam.examType || "-",
      },
      {
        id: "status",
        header: "Status",
        cell: (exam) => <StatusBadge status={exam.status} />,
      },
    ],
    []
  );

  const selectedTermLabel =
    selectedTerm === ALL_TERMS_VALUE
      ? "All terms"
      : terms.find((term) => term.id === selectedTerm)?.name ||
        `Term ${terms.find((term) => term.id === selectedTerm)?.termNumber ?? ""}`;

  const handleAdministerExam = async (examId: string) => {
    try {
      await administerExamMutation.mutateAsync(examId);
      toast({
        title: "Success",
        description: "Exam administered successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to administer exam",
        variant: "destructive",
      });
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="My Exams"
        description={`Monitor all assessments across your courses. ${selectedTermLabel ? `Currently viewing ${selectedTermLabel.toLowerCase()}.` : ""}`}
        actions={
          <Button
            variant="outline"
            onClick={() => void allExamsQuery.refetch()}
            disabled={allExamsQuery.isFetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${allExamsQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DataCard title="Visible Exams" value={examStats.total} loading={allExamsQuery.isPending} tone="info" />
        <DataCard title="Upcoming" value={examStats.upcoming} loading={allExamsQuery.isPending} tone="warning" />
        <DataCard title="Ready to Grade" value={examStats.administered} loading={allExamsQuery.isPending} tone="default" />
        <DataCard title="Graded" value={examStats.graded} loading={allExamsQuery.isPending} tone="success" />
      </div>

      {termsQuery.error instanceof Error ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {termsQuery.error.message}
        </div>
      ) : null}

      {allExamsQuery.error instanceof Error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {allExamsQuery.error.message}
        </div>
      ) : null}

      <FilterBar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchDebouncedChange={setSearchTerm}
        searchPlaceholder="Search exams, classes, courses, or types..."
        filters={
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_TERMS_VALUE}>All Terms</SelectItem>
              {terms.map((term) => (
                <SelectItem key={term.id} value={term.id}>
                  {term.name || `Term ${term.termNumber}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <AppTable<TeacherExamRecord>
        columns={columns}
        data={filteredExams}
        getRowKey={(exam) => exam.id}
        loading={allExamsQuery.isPending}
        loadingText="Loading exams..."
        emptyTitle="No exams found"
        emptyDescription={
          searchTerm || selectedTerm !== ALL_TERMS_VALUE
            ? "Try broadening your filters."
            : "You do not have exams assigned yet."
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
            {exam.status === "administered" ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() =>
                  navigate(
                    `/submit-grades?examId=${exam.id}&courseId=${exam.course?.id}&classId=${exam.class?.id}`
                  )
                }
              >
                <GraduationCap className="h-4 w-4" />
                Grade
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
