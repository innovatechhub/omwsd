import type { PropsWithChildren, ReactNode } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { BrandMark } from "@/components/shared/brand-mark";

interface AuthShellProps extends PropsWithChildren {
  eyebrow: string;
  title: string;
  description: string;
  footer?: ReactNode;
}

export function AuthShell({
  eyebrow,
  title,
  description,
  footer,
  children,
}: AuthShellProps) {
  return (
    <div className="grid min-h-[calc(100vh-var(--public-header-height))] min-w-0 overflow-hidden lg:grid-cols-[minmax(360px,0.8fr)_minmax(560px,1.2fr)]">
      {/* Left panel */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="relative hidden overflow-hidden bg-[var(--landing-accent-strong)] p-10 text-white lg:flex lg:flex-col lg:justify-center xl:p-14"
      >
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(14,63,102,0.94),rgba(16,75,119,0.88)_48%,rgba(242,193,79,0.16))]" />
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/[0.06]" />
          <div className="absolute bottom-10 right-8 h-80 w-80 rounded-full bg-[var(--landing-highlight)]/[0.12] blur-3xl" />
          <div className="absolute left-1/2 top-[46%] h-[540px] w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.07]" />
          <div className="absolute left-1/2 top-[46%] h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.07]" />
        </div>

        <div className="relative max-w-[33rem] space-y-10">
          <Link to="/" className="inline-flex items-center gap-5">
            <BrandMark size="lg" />
            <div className="min-w-0">
              <p className="font-serif text-[1.7rem] font-bold leading-tight xl:text-3xl">
                OMSWD Pandan
              </p>
              <p className="mt-1 text-sm font-medium leading-tight text-white/[0.72] xl:text-base">
                Assistance Request System
              </p>
            </div>
          </Link>

          <div className="max-w-[31rem] space-y-3">
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--landing-highlight)]">
                Resident portal
              </p>
              <h1 className="font-serif text-4xl font-bold leading-tight xl:text-[3rem]">
                A clearer way to request and track social welfare assistance.
              </h1>
              <p className="max-w-md text-base leading-7 text-white/[0.72]">
                Create or access your resident account, submit assistance details, and follow updates from the OMSWD Pandan team.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right panel - form */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="landing-page flex min-w-0 max-w-full items-center justify-center overflow-hidden p-5 md:p-8 lg:px-[clamp(2.5rem,6vw,6rem)]"
      >
        <div className="min-w-0 w-full max-w-full md:max-w-[35rem]">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <BrandMark size="sm" />
            <div>
              <p className="font-serif font-bold">OMSWD Pandan</p>
              <p className="text-xs text-[var(--landing-muted)]">Assistance Request System</p>
            </div>
          </div>

          <div className="landing-card w-full min-w-0 max-w-full overflow-hidden">
            <div className="h-1.5 bg-[linear-gradient(90deg,var(--landing-accent),var(--landing-highlight))]" />
            <div className="min-w-0 space-y-6 p-6 md:p-8 lg:p-9">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--landing-muted)]">{eyebrow}</span>
                <h2 className="break-words font-serif text-2xl font-bold leading-tight text-[var(--landing-ink)] md:text-[1.9rem]">{title}</h2>
                <p className="break-words text-sm leading-6 text-[var(--landing-muted)]">{description}</p>
              </div>

              {children}

              {footer && (
                <div className="border-t border-[var(--landing-outline)] pt-5">
                  {footer}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
