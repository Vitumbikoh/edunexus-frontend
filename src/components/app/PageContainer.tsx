import React from "react";
import { cn } from "@/lib/utils";

type MaxWidth = "default" | "wide" | "full";

const maxWidthClassMap: Record<MaxWidth, string> = {
  default: "mx-auto w-full max-w-7xl",
  wide: "mx-auto w-full max-w-[96rem]",
  full: "w-full",
};

export interface PageContainerProps extends React.HTMLAttributes<HTMLElement> {
  as?: "main" | "section" | "article" | "div";
  maxWidth?: MaxWidth;
}

export function PageContainer({
  as: Component = "section",
  maxWidth = "default",
  className,
  children,
  ...props
}: PageContainerProps) {
  return (
    <Component
      className={cn(
        "app-page px-4 py-1 sm:px-6 lg:px-8",
        maxWidthClassMap[maxWidth],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

