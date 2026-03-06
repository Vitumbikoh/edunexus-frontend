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

