import React from "react";
import { SearchBar } from "@/components/ui/search-bar";
import { cn } from "@/lib/utils";

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchDebouncedChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchDelay?: number;
  searchInputClassName?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
}

export function FilterBar({
  searchValue = "",
  onSearchChange,
  onSearchDebouncedChange,
  searchPlaceholder = "Search...",
  searchDelay = 300,
  searchInputClassName,
  filters,
  actions,
  className,
  ...props
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
        className
      )}
      {...props}
    >
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        {(onSearchChange || onSearchDebouncedChange) && (
          <SearchBar
            value={searchValue}
            onChange={onSearchChange}
            onDebouncedChange={onSearchDebouncedChange}
            delay={searchDelay}
            placeholder={searchPlaceholder}
            inputClassName={cn("w-full sm:w-72", searchInputClassName)}
          />
        )}
        {filters ? <div className="flex flex-wrap items-center gap-2">{filters}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

