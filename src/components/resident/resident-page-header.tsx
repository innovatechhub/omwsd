import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ResidentPageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  chips?: string[];
  actions?: ReactNode;
  className?: string;
}

export function ResidentPageHeader({
  eyebrow,
  title,
  description,
  chips,
  actions,
  className,
}: ResidentPageHeaderProps) {
  return (
    <section className={cn("portal-page-header p-6 md:p-7", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-muted)]">
        {eyebrow}
      </p>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-[var(--portal-ink)] md:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 max-w-3xl text-sm text-[var(--portal-muted)]">{description}</p>
      ) : null}
      {chips && chips.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="portal-pill px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]"
            >
              {chip}
            </span>
          ))}
        </div>
      ) : null}
      {actions ? <div className="mt-4">{actions}</div> : null}
    </section>
  );
}

