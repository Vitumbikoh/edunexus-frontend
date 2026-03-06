import React from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PaginationBar from "@/components/common/PaginationBar";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/app/EmptyState";
import { LoadingState } from "@/components/app/LoadingState";

export interface AppTableColumn<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T, index: number) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

export interface AppTablePagination {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  summary?: React.ReactNode;
  controls?: React.ReactNode;
}

export interface AppTableProps<T> {
  columns: AppTableColumn<T>[];
  data: T[];
  getRowKey: (row: T, index: number) => string;
  loading?: boolean;
  loadingText?: string;
  emptyTitle?: React.ReactNode;
  emptyDescription?: React.ReactNode;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
  renderActions?: (row: T, index: number) => React.ReactNode;
  actionsHeader?: React.ReactNode;
  rowClassName?: (row: T, index: number) => string | undefined;
  className?: string;
  cardClassName?: string;
  pagination?: AppTablePagination;
}

export function AppTable<T>({
  columns,
  data,
  getRowKey,
  loading = false,
  loadingText = "Loading data...",
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your filters or search.",
  emptyIcon,
  emptyAction,
  renderActions,
  actionsHeader = "Actions",
  rowClassName,
  className,
  cardClassName,
  pagination,
}: AppTableProps<T>) {
  const hasActions = Boolean(renderActions);
  const colSpan = columns.length + (hasActions ? 1 : 0);

  return (
    <Card className={cn("overflow-hidden", cardClassName)}>
      <div className={cn("overflow-x-auto", className)}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn("app-table-head", column.headerClassName)}
                >
                  {column.header}
                </TableHead>
              ))}
              {hasActions ? (
                <TableHead className="app-table-head text-right">{actionsHeader}</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="p-0">
                  <LoadingState text={loadingText} compact />
                </TableCell>
              </TableRow>
            ) : null}

            {!loading && data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="p-3">
                  <EmptyState
                    compact
                    icon={emptyIcon}
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                </TableCell>
              </TableRow>
            ) : null}

            {!loading &&
              data.map((row, index) => (
                <TableRow key={getRowKey(row, index)} className={rowClassName?.(row, index)}>
                  {columns.map((column) => (
                    <TableCell key={column.id} className={column.cellClassName}>
                      {column.cell(row, index)}
                    </TableCell>
                  ))}
                  {hasActions ? (
                    <TableCell className="text-right">{renderActions?.(row, index)}</TableCell>
                  ) : null}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="text-sm text-muted-foreground">{pagination.summary}</div>
          <div className="flex flex-wrap items-center gap-3">
            {pagination.controls}
            <PaginationBar
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.onPageChange}
              isLoading={pagination.isLoading}
            />
          </div>
        </div>
      ) : null}
    </Card>
  );
}

