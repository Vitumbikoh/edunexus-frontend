import React from "react";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AppButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export function AppButton({
  children,
  loading = false,
  loadingText = "Loading...",
  disabled,
  startIcon,
  endIcon,
  asChild = false,
  className,
  ...props
}: AppButtonProps) {
  if (asChild) {
    return (
      <Button
        asChild
        className={cn("app-button-text", className)}
        disabled={disabled || loading}
        {...props}
      >
        {children}
      </Button>
    );
  }

  return (
    <Button
      className={cn("app-button-text", className)}
      disabled={disabled || loading}
      asChild={false}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : startIcon}
      <span>{loading ? loadingText : children}</span>
      {!loading ? endIcon : null}
    </Button>
  );
}
