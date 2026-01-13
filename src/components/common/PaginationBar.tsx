import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

type Props = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  isLoading?: boolean;
};

export function PaginationBar({
  currentPage,
  totalPages,
  onPageChange,
  className,
  isLoading = false,
}: Props) {
  const canPrev = currentPage > 1 && !isLoading;
  const canNext = currentPage < totalPages && !isLoading;

  return (
    <div className={cn("flex items-center justify-end gap-2", className)}>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => {
                if (canPrev) onPageChange(currentPage - 1);
              }}
              aria-disabled={!canPrev}
              className={!canPrev ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          <PaginationItem>
            <span className="px-4 text-sm text-muted-foreground">
              Page {Math.max(1, Math.min(currentPage, totalPages || 1))} of {Math.max(totalPages, 1)}
            </span>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              onClick={() => {
                if (canNext) onPageChange(currentPage + 1);
              }}
              aria-disabled={!canNext}
              className={!canNext ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export default PaginationBar;
