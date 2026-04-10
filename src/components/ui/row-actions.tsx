import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (
        !containerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
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

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    function updatePosition() {
      const triggerRect = triggerRef.current?.getBoundingClientRect();

      if (!triggerRect) {
        return;
      }

      const menuWidth = menuRef.current?.offsetWidth ?? 220;
      const menuHeight = menuRef.current?.offsetHeight ?? 0;
      const viewportPadding = 8;
      const maxLeft = window.innerWidth - menuWidth - viewportPadding;

      let left = Math.min(Math.max(triggerRect.right - menuWidth, viewportPadding), maxLeft);
      let top = triggerRect.bottom + 8;

      if (top + menuHeight > window.innerHeight - viewportPadding) {
        top = Math.max(viewportPadding, triggerRect.top - menuHeight - 8);
      }

      if (!Number.isFinite(left)) {
        left = viewportPadding;
      }

      setPosition({ top, left });
    }

    updatePosition();

    const rafId = window.requestAnimationFrame(updatePosition);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, actions.length]);

  return (
    <div
      ref={containerRef}
      className="relative flex justify-end"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open actions"
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        onClick={() => setOpen((current) => !current)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-[70] min-w-[13rem] rounded-lg border border-border bg-popover p-1.5 shadow-panel"
              style={{ top: `${position.top}px`, left: `${position.left}px` }}
              onClick={(event) => event.stopPropagation()}
            >
              {actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  disabled={action.disabled}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium transition-colors",
                    action.tone === "danger"
                      ? "text-destructive hover:bg-destructive/10"
                      : "text-foreground hover:bg-muted",
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
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
