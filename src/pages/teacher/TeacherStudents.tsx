import React, { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AccessDeniedState,
  AppTable,
  DataCard,
  FilterBar,
  PageContainer,
  PageHeader,
  StatusBadge,
} from "@/components/app";
import type { AppTableColumn } from "@/components/app";
import {
  useTeacherStudentClasses,
  useTeacherStudents,
} from "@/hooks/useTeacherPortal";
import type { TeacherStudentRecord } from "@/services/teacherService";

const ALL_CLASSES_VALUE = "__all_classes__";
const DEFAULT_PAGE_SIZE = 10;

export default function TeacherStudents() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE);

  const canView = user?.role === "teacher";

  const studentsQuery = useTeacherStudents({
    token,
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    className: selectedClass,
    enabled: canView,
  });

  const classesQuery = useTeacherStudentClasses(token, canView);

  const students = studentsQuery.data?.students ?? [];
  const pagination = studentsQuery.data?.pagination ?? {
    currentPage,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage,
  };

  const totalItems = pagination.totalItems;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const averageAttendance = useMemo(() => {
    const attendanceValues = students
      .map((student) => student.attendance)
      .filter((value): value is number => typeof value === "number");

    if (attendanceValues.length === 0) {
      return null;
    }

    const totalAttendance = attendanceValues.reduce((sum, value) => sum + value, 0);
    return Math.round(totalAttendance / attendanceValues.length);
  }, [students]);

  const columns = useMemo<AppTableColumn<TeacherStudentRecord>[]>(
    () => [
      {
        id: "student-id",
        header: "Student ID",
        cell: (student) => <span className="font-medium">{student.studentId || "N/A"}</span>,
      },
      {
        id: "name",
        header: "Name",
        cell: (student) => (
          <div>
            <div className="font-medium text-foreground">
              {student.firstName} {student.lastName}
            </div>
            <div className="text-sm text-muted-foreground">{student.user?.email || "-"}</div>
          </div>
        ),
      },
      {
        id: "class",
        header: "Class",
        cell: (student) => student.class?.name || "Unassigned",
      },
      {
        id: "attendance",
        header: "Attendance",
        cell: (student) =>
          typeof student.attendance === "number" ? (
            <StatusBadge
              status={student.attendance >= 75 ? "active" : "pending"}
              label={`${student.attendance}%`}
            />
          ) : (
            <span className="text-sm text-muted-foreground">Not recorded</span>
          ),
      },
      {
        id: "performance",
        header: "Performance",
        cell: (student) => student.performance || "-",
      },
    ],
    []
  );

  if (!canView) {
    return (
      <PageContainer>
        <AccessDeniedState compact />
      </PageContainer>
    );
  }

  const handleViewDetails = (student: TeacherStudentRecord) => {
    navigate(`/teacher/students/${student.id}`, { state: { student } });
  };

  return (
    <PageContainer>
      <PageHeader
        title="My Students"
        description="Track attendance, class distribution, and performance for students assigned to you."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DataCard
          title="Students"
          value={pagination.totalItems}
          loading={studentsQuery.isPending}
          icon={<Users className="h-5 w-5" />}
          tone="info"
        />
        <DataCard
          title="Classes"
          value={classesQuery.data?.length ?? 0}
          loading={classesQuery.isPending}
          tone="default"
        />
        <DataCard
          title="Avg. Attendance"
          value={averageAttendance !== null ? `${averageAttendance}%` : "—"}
          description="Based on the current page"
          loading={studentsQuery.isPending}
          tone="success"
        />
        <DataCard
          title="Visible Records"
          value={students.length}
          description="Current filtered result set"
          loading={studentsQuery.isPending}
          tone="warning"
        />
      </div>

      {studentsQuery.error instanceof Error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {studentsQuery.error.message}
        </div>
      ) : null}

      <FilterBar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchDebouncedChange={(value) => {
          setCurrentPage(1);
          setSearchTerm(value);
        }}
        searchPlaceholder="Search students by name or email..."
        filters={
          <Select
            value={selectedClass || ALL_CLASSES_VALUE}
            onValueChange={(value) => {
              setCurrentPage(1);
              setSelectedClass(value === ALL_CLASSES_VALUE ? "" : value);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CLASSES_VALUE}>All Classes</SelectItem>
              {(classesQuery.data ?? []).map((className) => (
                <SelectItem key={className} value={className}>
                  {className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <AppTable<TeacherStudentRecord>
        columns={columns}
        data={students}
        getRowKey={(student) => student.id}
        loading={studentsQuery.isPending}
        loadingText="Loading students..."
        emptyTitle="No students found"
        emptyDescription={
          searchTerm || selectedClass
            ? "Try a different search term or class filter."
            : "No students are currently assigned to you."
        }
        renderActions={(student) => (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleViewDetails(student)}>
              <Eye className="h-4 w-4" />
              <span className="sr-only">View student details</span>
            </Button>
          </div>
        )}
        pagination={{
          currentPage,
          totalPages: pagination.totalPages,
          onPageChange: setCurrentPage,
          isLoading: studentsQuery.isFetching,
          summary: `Showing ${startItem} to ${endItem} of ${totalItems} students`,
          controls: (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show</span>
              <Select
                value={String(itemsPerPage)}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[78px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">per page</span>
            </div>
          ),
        }}
      />
    </PageContainer>
  );
}
