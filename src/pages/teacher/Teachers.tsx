import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Pencil, UserX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { AppTable, FilterBar, PageContainer, PageHeader, StatusBadge } from "@/components/app";
import { useTeacherStatusMutation, useTeachers } from "@/hooks/useTeachers";
import type { AppTableColumn } from "@/components/app";
import type { TeacherRecord } from "@/services/teacherService";

const PAGE_SIZE = 10;

export default function Teachers() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const canAdd = user?.role === "admin";
  const canEdit = user?.role === "admin";
  const canView = user?.role === "admin" || user?.role === "teacher";

  const teachersQuery = useTeachers({
    token,
    page: currentPage,
    limit: PAGE_SIZE,
    search: searchTerm,
    enabled: canView,
  });

  const teacherStatusMutation = useTeacherStatusMutation(token);

  const teachers = teachersQuery.data?.teachers ?? [];
  const pagination = teachersQuery.data?.pagination ?? {
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: PAGE_SIZE,
  };

  const apiError = teachersQuery.error instanceof Error ? teachersQuery.error.message : null;
  const totalItems = pagination.totalItems;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, totalItems);

  const columns = useMemo<AppTableColumn<TeacherRecord>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        cell: (teacher) => (
          <span className="font-medium">
            {teacher.firstName} {teacher.lastName}
          </span>
        ),
      },
      {
        id: "contact",
        header: "Contact",
        cell: (teacher) => (
          <div>
            <div className="text-sm text-muted-foreground">{teacher.user.email}</div>
            {teacher.phoneNumber ? <div className="text-sm">{teacher.phoneNumber}</div> : null}
          </div>
        ),
      },
      {
        id: "specialization",
        header: "Specialization",
        cell: (teacher) => teacher.subjectSpecialization || "-",
      },
      {
        id: "experience",
        header: "Experience",
        cell: (teacher) => (
          <div>
            {teacher.yearsOfExperience} years
            <div className="text-sm text-muted-foreground">
              Hired: {teacher.hireDate ? new Date(teacher.hireDate).toLocaleDateString() : "-"}
            </div>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (teacher) => <StatusBadge status={teacher.status} />,
      },
    ],
    []
  );

  if (!canView) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center text-sm font-semibold text-destructive">
          You do not have permission to view teachers.
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Teachers"
        description={`Showing ${teachers.length} of ${pagination.totalItems} teachers`}
        actions={
          canAdd ? (
            <Button asChild>
              <Link to="/teachers/add">Add New Teacher</Link>
            </Button>
          ) : null
        }
      />

      {apiError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {apiError}
        </div>
      ) : null}

      <FilterBar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchDebouncedChange={(value) => {
          setCurrentPage(1);
          setSearchTerm(value);
        }}
        searchPlaceholder="Search teachers..."
      />

      <AppTable<TeacherRecord>
        columns={columns}
        data={teachers}
        getRowKey={(teacher) => teacher.id}
        loading={teachersQuery.isPending}
        loadingText="Loading teachers..."
        emptyTitle="No teachers found"
        renderActions={(teacher) => (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/teachers/${teacher.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>

            {canEdit ? (
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/teachers/${teacher.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}

            {canEdit ? (
              <Button
                variant="ghost"
                size="sm"
                title={teacher.status === "active" ? "Deactivate Teacher" : "Activate Teacher"}
                onClick={async () => {
                  const isActive = teacher.status === "active";
                  const targetStatus = isActive ? "inactive" : "active";
                  const action = isActive ? "deactivate" : "activate";

                  const confirmed = window.confirm(
                    `${action.charAt(0).toUpperCase() + action.slice(1)} ${teacher.firstName} ${teacher.lastName}?`
                  );
                  if (!confirmed) return;

                  try {
                    await teacherStatusMutation.mutateAsync({
                      teacherId: teacher.id,
                      status: targetStatus,
                    });
                    toast({
                      title: "Success",
                      description: `Teacher ${action}d successfully.`,
                    });
                  } catch (error) {
                    toast({
                      title: "Error",
                      description:
                        error instanceof Error
                          ? error.message
                          : "Failed to update teacher status.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <UserX
                  className={`h-4 w-4 ${
                    teacher.status === "active" ? "text-orange-600" : "text-emerald-600"
                  }`}
                />
              </Button>
            ) : null}
          </div>
        )}
        pagination={{
          currentPage,
          totalPages: pagination.totalPages,
          onPageChange: setCurrentPage,
          isLoading: teachersQuery.isFetching,
          summary: `Showing ${startItem} to ${endItem} of ${totalItems} teachers`,
        }}
      />
    </PageContainer>
  );
}

