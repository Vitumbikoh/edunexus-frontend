import React from "react";
import { ShieldAlert } from "lucide-react";
import { EmptyState, type EmptyStateProps } from "@/components/app/EmptyState";

export interface AccessDeniedStateProps
  extends Omit<EmptyStateProps, "icon" | "title" | "description"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
}

export function AccessDeniedState({
  title = "Access restricted",
  description = "You do not have permission to access this page.",
  ...props
}: AccessDeniedStateProps) {
  return (
    <EmptyState
      icon={<ShieldAlert className="h-5 w-5" />}
      title={title}
      description={description}
      {...props}
    />
  );
}