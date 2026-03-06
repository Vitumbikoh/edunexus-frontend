import React from "react";
import { Preloader } from "@/components/ui/preloader";
import { cn } from "@/lib/utils";

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  variant?: "spinner" | "skeleton" | "dots" | "text";
  rows?: number;
  compact?: boolean;
}

export function LoadingState({
  text = "Loading...",
  variant = "spinner",
  rows = 4,
  compact = false,
  className,
  ...props
}: LoadingStateProps) {
  return (
    <div className={cn(compact ? "min-h-24" : "min-h-52", className)} {...props}>
      <Preloader
        variant={variant}
        text={text}
        rows={rows}
        className={cn(variant === "skeleton" ? "space-y-4 p-4" : undefined)}
      />
    </div>
  );
}

