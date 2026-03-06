import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AppTable, FilterBar, PageContainer, PageHeader, StatusBadge } from "@/components/app";
import { useFinanceOfficers } from "@/hooks/useFinanceOfficers";
import type { AppTableColumn } from "@/components/app";
import type { FinanceOfficerRecord } from "@/services/financeOfficerService";

const PAGE_SIZE = 10;

export default function FinanceOfficers() {
  const { user, token } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const canAdd = user?.role === "admin";
  const canEdit = user?.role === "admin";
  const canView = user?.role === "admin" || user?.role === "finance";

  const financeOfficersQuery = useFinanceOfficers({
    token,
    page: currentPage,
    limit: PAGE_SIZE,
    search: searchTerm,
    enabled: canView,
  });

  const financeOfficers = financeOfficersQuery.data?.financeOfficers ?? [];
  const pagination = financeOfficersQuery.data?.pagination ?? {
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: PAGE_SIZE,
  };

  const apiError =
    financeOfficersQuery.error instanceof Error ? financeOfficersQuery.error.message : null;

  const totalItems = pagination.totalItems;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, totalItems);

  const columns = useMemo<AppTableColumn<FinanceOfficerRecord>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        cell: (officer) => (
          <span className="font-medium">
            {officer.firstName} {officer.lastName}
          </span>
        ),
      },
      {
        id: "username",
        header: "Username",
        cell: (officer) => (
          <span className="text-sm text-muted-foreground">@{officer.username || "N/A"}</span>
        ),
      },
      {
        id: "contact",
        header: "Contact",
        cell: (officer) => (
          <div>
            <div className="text-sm text-muted-foreground">{officer.email}</div>
            {officer.phoneNumber ? <div className="text-sm">{officer.phoneNumber}</div> : null}
          </div>
        ),
      },
      {
        id: "department",
        header: "Department",
        cell: (officer) => officer.department || "-",
      },
      {
        id: "status",
        header: "Status",
        cell: (officer) => (
          <div className="space-y-1">
            <StatusBadge status={officer.status} />
            <div className="text-xs text-muted-foreground">
              Hired: {new Date(officer.hireDate).toLocaleDateString()}
            </div>
          </div>
        ),
      },
    ],
    []
  );

  if (!canView) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center text-sm font-semibold text-destructive">
          You do not have permission to view finance officers.
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Finance Officers"
        description={`Showing ${financeOfficers.length} of ${pagination.totalItems} officers`}
        actions={
          canAdd ? (
            <Button asChild>
              <Link to="/finance/officers/add">Add New Officer</Link>
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
        searchPlaceholder="Search finance officers..."
      />

      <AppTable<FinanceOfficerRecord>
        columns={columns}
        data={financeOfficers}
        getRowKey={(officer) => officer.id}
        loading={financeOfficersQuery.isPending}
        loadingText="Loading finance officers..."
        emptyTitle="No finance officers found"
        renderActions={(officer) => (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/finance/officers/${officer.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>

            {canEdit ? (
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/finance/officers/${officer.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}
          </div>
        )}
        pagination={{
          currentPage,
          totalPages: pagination.totalPages,
          onPageChange: setCurrentPage,
          isLoading: financeOfficersQuery.isFetching,
          summary: `Showing ${startItem} to ${endItem} of ${totalItems} officers`,
        }}
      />
    </PageContainer>
  );
}

