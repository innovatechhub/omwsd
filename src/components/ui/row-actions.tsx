import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

type RowAction = {
  label: string;
  onSelect: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  tone?: "default" | "danger";
};

interface RowActionsProps {
  actions: RowAction[];
}

export function RowActions({ actions }: RowActionsProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex justify-end"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        aria-label="Open actions"
        aria-expanded={open}
        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/10 bg-white text-primary transition-colors hover:bg-muted/45"
        onClick={() => setOpen((current) => !current)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-30 min-w-[12rem] rounded-2xl border border-primary/10 bg-white/98 p-2 shadow-panel backdrop-blur">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              disabled={action.disabled}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                action.tone === "danger"
                  ? "text-destructive hover:bg-destructive/10"
                  : "text-primary hover:bg-muted/45",
                action.disabled && "cursor-not-allowed opacity-50",
              )}
              onClick={() => {
                action.onSelect();
                setOpen(false);
              }}
            >
              {action.icon ? <span className="shrink-0">{action.icon}</span> : null}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
