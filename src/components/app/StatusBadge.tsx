import React from "react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLE_MAP: Record<
  string,
  { variant: BadgeProps["variant"]; className?: string }
> = {
  active: { variant: "default", className: "bg-emerald-600 text-white hover:bg-emerald-600/90" },
  inactive: { variant: "outline", className: "text-muted-foreground" },
  pending: { variant: "secondary" },
  approved: { variant: "default", className: "bg-emerald-600 text-white hover:bg-emerald-600/90" },
  rejected: { variant: "destructive" },
  suspended: { variant: "destructive" },
  completed: { variant: "default", className: "bg-blue-600 text-white hover:bg-blue-600/90" },
  draft: { variant: "secondary" },
  "on-leave": { variant: "secondary" },
  upcoming: { variant: "outline", className: "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300" },
  administered: { variant: "default", className: "bg-sky-600 text-white hover:bg-sky-600/90" },
  graded: { variant: "default", className: "bg-violet-600 text-white hover:bg-violet-600/90" },
  published: { variant: "default", className: "bg-emerald-600 text-white hover:bg-emerald-600/90" },
  archived: { variant: "outline", className: "text-muted-foreground" },
  overdue: { variant: "destructive" },
  paid: { variant: "default", className: "bg-emerald-600 text-white hover:bg-emerald-600/90" },
  unpaid: { variant: "secondary" },
  partial: { variant: "outline", className: "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300" },
  "finance review": { variant: "secondary" },
};

const toLabel = (value: string) =>
  value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: string;
  label?: string;
}

export function StatusBadge({ status, label, className, ...props }: StatusBadgeProps) {
  const normalized = status.trim().toLowerCase();
  const style = STATUS_STYLE_MAP[normalized] ?? { variant: "outline" as const };

  return (
    <Badge variant={style.variant} className={cn(style.className, className)} {...props}>
      {label ?? toLabel(status)}
    </Badge>
  );
}

