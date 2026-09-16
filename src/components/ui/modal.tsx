import type { ReactNode } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg" | "xl" | "2xl";
}

const sizeClassMap: Record<NonNullable<ModalProps["size"]>, string> = {
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  "2xl": "max-w-6xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "lg",
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        hideClose
        className={cn(
          "flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100vh-3rem)] sm:w-full",
          sizeClassMap[size],
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border bg-card px-4 py-4 sm:px-6">
          <div>
            <DialogTitle className="text-lg font-semibold text-foreground">{title}</DialogTitle>
            {description ? (
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                {description}
              </DialogDescription>
            ) : null}
          </div>
          <DialogClose
            aria-label="Close modal"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </DialogClose>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">{children}</div>
        {footer ? <footer className="shrink-0 border-t border-border bg-muted/20 px-4 py-3 sm:px-6">{footer}</footer> : null}
      </DialogContent>
    </Dialog>
  );
}
