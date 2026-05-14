import type { PropsWithChildren, ReactNode } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { BrandMark } from "@/components/shared/brand-mark";

interface AuthShellProps extends PropsWithChildren {
  eyebrow: string;
  title: string;
  description: string;
  asideTitle: string;
  asideDescription: string;
  footer?: ReactNode;
}

const features = [
  { icon: Users, label: "Resident Access", desc: "Submit requests, track applications, upload documents." },
  { icon: ShieldCheck, label: "Staff Access", desc: "Review, verify, and manage welfare cases." },
  { icon: BadgeCheck, label: "Secure & Role-Based", desc: "Protected access based on your account role." },
];

export function AuthShell({
  eyebrow,
  title,
  description,
  asideTitle,
  asideDescription,
  footer,
  children,
}: AuthShellProps) {
  return (
    <div className="min-h-[calc(100vh-var(--public-header-height))] grid lg:grid-cols-[1fr_1fr]">

      {/* Left panel */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="relative hidden overflow-hidden bg-[var(--landing-accent-strong)] text-white lg:flex lg:flex-col lg:justify-between p-10 xl:p-14"
      >
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 -top-16 h-80 w-80 rounded-full bg-white/5" />
          <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-[var(--landing-highlight)]/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full border border-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full border border-white/5" />
        </div>

        <div className="relative">
          <Link to="/" className="flex items-center gap-3">
            <BrandMark size="md" />
            <div>
              <p className="font-serif text-xl font-bold">OMSWD Pandan</p>
              <p className="text-xs text-white/60">Assistance Request System</p>
            </div>
          </Link>
        </div>

        <div className="relative space-y-8">
          <div>
            <span className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white/70">
              {eyebrow}
            </span>
            <h1 className="mt-4 font-serif text-3xl font-bold leading-tight xl:text-4xl">
              {asideTitle}
            </h1>
            <p className="mt-3 text-sm leading-7 text-white/75">
              {asideDescription}
            </p>
          </div>

          <div className="space-y-3">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/8 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--landing-highlight)] text-[var(--landing-ink)]">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs leading-5 text-white/65">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <Link
            to="/"
            className="text-sm font-semibold text-white/65 underline-offset-4 hover:text-white hover:underline transition-colors"
          >
            ← Return to public website
          </Link>
        </div>
      </motion.div>

      {/* Right panel — form */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-center justify-center p-6 md:p-10 landing-page"
      >
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <BrandMark size="sm" />
            <div>
              <p className="font-serif font-bold">OMSWD Pandan</p>
              <p className="text-xs text-[var(--landing-muted)]">Assistance Request System</p>
            </div>
          </div>

          <div className="landing-card overflow-hidden">
            <div className="h-1.5 bg-[linear-gradient(90deg,var(--landing-accent),var(--landing-highlight))]" />
            <div className="p-7 md:p-8 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--landing-muted)]">{eyebrow}</span>
                <h2 className="font-serif text-2xl font-bold text-[var(--landing-ink)]">{title}</h2>
                <p className="text-sm leading-6 text-[var(--landing-muted)]">{description}</p>
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
