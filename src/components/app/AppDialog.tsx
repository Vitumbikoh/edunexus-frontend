import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AppDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  closeLabel?: string;
  contentClassName?: string;
}

export function AppDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  showCloseButton = false,
  closeLabel = "Close",
  contentClassName,
}: AppDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className={cn("sm:max-w-xl", contentClassName)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="py-1">{children}</div>
        {footer || showCloseButton ? (
          <DialogFooter>
            {footer}
            {showCloseButton ? (
              <DialogClose asChild>
                <Button variant="outline">{closeLabel}</Button>
              </DialogClose>
            ) : null}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
