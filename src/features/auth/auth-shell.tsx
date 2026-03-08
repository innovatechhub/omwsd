import type { PropsWithChildren, ReactNode } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { BrandMark } from "@/components/shared/brand-mark";
import { Card, CardContent } from "@/components/ui/card";

interface AuthShellProps extends PropsWithChildren {
  eyebrow: string;
  title: string;
  description: string;
  asideTitle: string;
  asideDescription: string;
  footer?: ReactNode;
}

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
    <div className="container grid min-h-[calc(100vh-10rem)] gap-8 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-16">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-[2rem] bg-primary p-8 text-primary-foreground shadow-panel lg:p-10"
      >
        <div className="absolute inset-0 bg-hero-grid bg-[size:28px_28px] opacity-20" />
        <div className="relative space-y-8">
          <div className="flex items-center gap-4">
            <BrandMark size="md" />
            <div>
              <p className="font-serif text-2xl font-bold">OMSWD Pandan</p>
              <p className="text-sm text-primary-foreground/75">Assistance Request System</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-foreground/72">
              {eyebrow}
            </p>
            <h1 className="max-w-xl font-serif text-4xl font-bold leading-tight lg:text-5xl">
              {asideTitle}
            </h1>
            <p className="max-w-xl text-base leading-7 text-primary-foreground/82">
              {asideDescription}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">
                Resident access
              </p>
              <p className="mt-3 text-sm leading-6 text-white/85">
                Submit requests, track application status, and manage document uploads.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">
                Staff access
              </p>
              <p className="mt-3 text-sm leading-6 text-white/85">
                Review requests, verify residency, and monitor operational dashboards.
              </p>
            </div>
          </div>

          <Link
            to="/"
            className="inline-flex text-sm font-semibold text-primary-foreground/82 underline-offset-4 hover:text-white hover:underline"
          >
            Return to the public website
          </Link>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
      >
        <Card className="border-white/60 bg-white/90">
          <CardContent className="space-y-6 p-8 lg:p-10">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                {eyebrow}
              </p>
              <h2 className="font-serif text-3xl font-bold">{title}</h2>
              <p className="text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
            {children}
            {footer ? <div className="border-t border-border/70 pt-5">{footer}</div> : null}
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}
