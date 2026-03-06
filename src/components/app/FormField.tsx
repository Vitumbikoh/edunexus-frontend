import React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  description?: React.ReactNode;
  error?: React.ReactNode;
  labelClassName?: string;
}

export function FormField({
  label,
  htmlFor,
  required = false,
  description,
  error,
  className,
  labelClassName,
  children,
  ...props
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      <Label htmlFor={htmlFor} className={cn("app-label", labelClassName)}>
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {children}
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}

