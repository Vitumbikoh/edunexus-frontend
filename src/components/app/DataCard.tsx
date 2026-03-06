import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type CardTone = "default" | "info" | "success" | "warning" | "danger";

const toneClassMap: Record<CardTone, string> = {
  default: "border-border bg-card",
  info: "border-blue-200 bg-blue-50/80 dark:border-blue-900 dark:bg-blue-950/30",
  success: "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/30",
  warning: "border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/30",
  danger: "border-rose-200 bg-rose-50/80 dark:border-rose-900 dark:bg-rose-950/30",
};

export interface DataCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: React.ReactNode;
  value: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: CardTone;
  loading?: boolean;
}

export function DataCard({
  title,
  value,
  description,
  icon,
  tone = "default",
  loading = false,
  className,
  ...props
}: DataCardProps) {
  return (
    <Card className={cn("rounded-lg", toneClassMap[tone], className)} {...props}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="app-card-label">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="app-card-value">{value}</p>
            )}
            {description ? <p className="app-card-description">{description}</p> : null}
          </div>
          {icon ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/70 text-foreground">
              {icon}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

