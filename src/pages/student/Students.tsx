import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Download,
  Eye,
  GraduationCap,
  Pencil,
  Upload,
  UserCheck,
  UserPlus,
  UserX,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AppButton,
  AppTable,
  DataCard,
  FilterBar,
  PageContainer,
  PageHeader,
} from "@/components/app";
import {
  useActivateStudent,
  useBulkStudentUpload,
  useDeactivateStudent,
  useDownloadStudentTemplate,
  useStudentClasses,
  useStudentStats,
  useStudents,
} from "@/hooks/useStudents";
import type { AppTableColumn } from "@/components/app";
import type { StudentRecord } from "@/services/studentService";

const DEFAULT_PAGE_SIZE = 10;
const ALL_FORMS_VALUE = "all";

const sortClasses = (classNameA: string, classNameB: string) => {
  const getFormNumber = (name: string) => {
    const match = name.match(/form\s+(\w+)/i);
    if (!match) return 999;

    const numberWord = match[1].toLowerCase();
    const numberMap: Record<string, number> = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
    };

    return numberMap[numberWord] ?? 999;
  };

  return getFormNumber(classNameA) - getFormNumber(classNameB);
};

export default function Students() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [formFilter, setFormFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [uploadErrors, setUploadErrors] = useState<Array<{ line: number; error: string }>>([]);

  const canAddStudent = user?.role === "admin" || user?.role === "teacher";
  const canEdit = user?.role === "admin" || user?.role === "teacher";
  const canManageStudents = user?.role === "admin";
  const canView = user?.role !== "finance";
  const canViewStats = user?.role === "admin";

  const studentsQuery = useStudents({
    token,
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    formFilter,
    enabled: canView,
  });

  const classesQuery = useStudentClasses(token, canView);
  const statsQuery = useStudentStats(token, canViewStats);
  const uploadMutation = useBulkStudentUpload(token);
  const downloadTemplateMutation = useDownloadStudentTemplate(token);
  const activateStudentMutation = useActivateStudent(token);
  const deactivateStudentMutation = useDeactivateStudent(token);

  const students = studentsQuery.data?.students ?? [];
  const pagination = studentsQuery.data?.pagination ?? {
    totalPages: 1,
    totalItems: 0,
    itemsPerPage,
  };

  const apiError = studentsQuery.error instanceof Error ? studentsQuery.error.message : null;

  const sortedClasses = useMemo(
    () =>
      [...(classesQuery.data ?? [])]
        .filter((classItem) => classItem.name !== "Graduated")
        .sort((a, b) => sortClasses(a.name, b.name)),
    [classesQuery.data]
  );

  const classBreakdownMap = useMemo(() => {
    const breakdown = statsQuery.data?.classBreakdown ?? [];
    return new Map(breakdown.map((item) => [item.className, item.count]));
  }, [statsQuery.data?.classBreakdown]);

  const tableColumns = useMemo<AppTableColumn<StudentRecord>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        cell: (student) => (
          <div className="font-medium text-foreground">
            {student.firstName} {student.lastName}
            {student.isActive === false ? (
              <span className="ml-2 text-xs font-medium text-destructive">(Inactive)</span>
            ) : null}
          </div>
        ),
      },
      {
        id: "class",
        header: "Class",
        cell: (student) => student.class?.name || "-",
      },
      {
        id: "email",
        header: "Email",
        cell: (student) => <span className="text-sm text-muted-foreground">{student.user?.email || "-"}</span>,
      },
      {
        id: "username",
        header: "Username",
        cell: (student) => student.user?.username || "-",
      },
      {
        id: "student-id",
        header: "Student ID",
        cell: (student) => student.studentId || "-",
      },
    ],
    []
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadTemplateMutation.mutateAsync();
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = "student-bulk-template.xlsx";
      anchor.click();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Could not download template",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadErrors([]);

    try {
      const result = await uploadMutation.mutateAsync(file);
      const created = result?.summary?.created ?? 0;
      const failed = result?.summary?.failed ?? 0;
      const errors = result?.errors ?? [];

      setUploadErrors(errors);
      toast({
        title: "Upload complete",
        description: `${created} added, ${failed} failed`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Could not process file",
        variant: "destructive",
      });
    } finally {
      event.target.value = "";
    }
  };

  const totalItems = pagination.totalItems;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (!canView) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center text-sm font-semibold text-destructive">
          You do not have permission to view students.
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="My Students"
        description="View and manage students across classes."
        actions={
          canAddStudent ? (
            <Button asChild>
              <Link to="/students/add">Add Student</Link>
            </Button>
          ) : null
        }
      />

      {canViewStats ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
          <DataCard
            tone="info"
            title="Total Students"
            value={statsQuery.data?.totalStudents ?? 0}
            loading={statsQuery.isPending}
            icon={<UserCheck className="h-5 w-5" />}
          />

          {sortedClasses.map((classItem) => (
            <DataCard
              key={classItem.id}
              tone="success"
              title={classItem.name}
              value={classBreakdownMap.get(classItem.name) ?? 0}
              loading={statsQuery.isPending}
              icon={<BookOpen className="h-5 w-5" />}
            />
          ))}

          <DataCard
            tone="default"
            title="Graduated"
            value={statsQuery.data?.graduatedStudents ?? 0}
            loading={statsQuery.isPending}
            icon={<GraduationCap className="h-5 w-5" />}
          />
        </div>
      ) : null}

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
        searchPlaceholder="Search students..."
        filters={
          <Select
            value={formFilter || ALL_FORMS_VALUE}
            onValueChange={(value) => {
              setCurrentPage(1);
              setFormFilter(value === ALL_FORMS_VALUE ? "" : value);
            }}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="All Forms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FORMS_VALUE}>All Forms</SelectItem>
              {sortedClasses.map((classItem) => (
                <SelectItem key={classItem.id} value={classItem.name}>
                  {classItem.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        actions={
          <>
            <input
              id="bulk-upload"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleUpload}
            />

            <AppButton
              variant="outline"
              loading={uploadMutation.isPending}
              loadingText="Uploading..."
              startIcon={<Upload className="h-4 w-4" />}
              onClick={() => document.getElementById("bulk-upload")?.click()}
            >
              Bulk Upload
            </AppButton>

            <AppButton
              variant="secondary"
              loading={downloadTemplateMutation.isPending}
              loadingText="Preparing..."
              startIcon={<Download className="h-4 w-4" />}
              onClick={handleDownloadTemplate}
            >
              Download Template
            </AppButton>
          </>
        }
      />

      {uploadErrors.length > 0 ? (
        <div className="max-h-48 overflow-auto rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <div className="mb-1 font-semibold">Upload issues ({uploadErrors.length})</div>
          <ul className="list-disc space-y-1 pl-5">
            {uploadErrors.map((error, index) => (
              <li key={index}>
                Row {error.line}: {error.error}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <AppTable<StudentRecord>
        columns={tableColumns}
        data={students}
        getRowKey={(student) => student.id}
        loading={studentsQuery.isPending}
        loadingText="Loading students..."
        emptyTitle="No students found"
        rowClassName={(student) => (student.isActive === false ? "opacity-60" : undefined)}
        renderActions={(student) => (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/students/${student.id}`} state={{ student }}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>

            {canEdit ? (
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/students/${student.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}

            {canManageStudents && student.isActive === false ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const confirmed = window.confirm(
                    `Activate student ${student.firstName} ${student.lastName}?`
                  );
                  if (!confirmed) return;

                  try {
                    await activateStudentMutation.mutateAsync(student.id);
                    toast({
                      title: "Student activated",
                      description: `${student.firstName} ${student.lastName} is now active.`,
                    });
                  } catch (error) {
                    if ((error as { status?: number })?.status === 401) {
                      navigate("/login");
                      return;
                    }
                    toast({
                      title: "Activation failed",
                      description:
                        error instanceof Error ? error.message : "Could not activate student",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <UserPlus className="h-4 w-4 text-emerald-600" />
              </Button>
            ) : null}

            {canManageStudents && student.isActive !== false ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const confirmed = window.confirm(
                    `Deactivate student ${student.firstName} ${student.lastName}?`
                  );
                  if (!confirmed) return;

                  try {
                    await deactivateStudentMutation.mutateAsync({
                      studentId: student.id,
                      reason: "manual",
                    });
                    toast({
                      title: "Student deactivated",
                      description: `${student.firstName} ${student.lastName} has been deactivated.`,
                    });
                  } catch (error) {
                    if ((error as { status?: number })?.status === 401) {
                      navigate("/login");
                      return;
                    }
                    toast({
                      title: "Deactivation failed",
                      description:
                        error instanceof Error ? error.message : "Could not deactivate student",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <UserX className="h-4 w-4 text-destructive" />
              </Button>
            ) : null}
          </div>
        )}
        pagination={{
          currentPage,
          totalPages: pagination.totalPages,
          onPageChange: handlePageChange,
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
                  <SelectItem value="5">5</SelectItem>
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

