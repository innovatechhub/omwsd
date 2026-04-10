import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookCheck,
  FileText,
  HandHelping,
  School,
  ShieldCheck,
  Siren,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { getServiceBySlug } from "@/features/public";

const serviceIconBySlug: Record<string, LucideIcon> = {
  "medical-assistance": Stethoscope,
  "burial-assistance": Siren,
  "food-relief": HandHelping,
  "educational-assistance": School,
};

export function ServiceDetailsPage() {
  const { serviceSlug } = useParams();
  const service = getServiceBySlug(serviceSlug ?? "");

  if (!service) {
    return <Navigate to="/services" replace />;
  }

  const ServiceIcon = serviceIconBySlug[service.slug] ?? HandHelping;

  return (
    <div className="landing-page pb-14 text-[var(--landing-ink)]">
      <div className="container public-page-stack">
        <section className="landing-card relative overflow-hidden p-6 md:p-8">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,var(--landing-accent),var(--landing-highlight))]" />

          <div className="flex flex-wrap gap-2">
            <span className="landing-chip px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
              {service.category}
            </span>
            <span className="landing-chip px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
              Service Details
            </span>
          </div>

          <div className="mt-4 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--landing-accent)] text-white">
              <ServiceIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="public-hero-title">
                {service.title}
              </h1>
              <p className="public-hero-lead mt-4 max-w-3xl">
                {service.description}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              className="rounded-xl bg-[var(--landing-accent)] text-white hover:bg-[var(--landing-accent-strong)]"
              asChild
            >
              <Link to="/request-assistance">
                Request this service
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-[var(--landing-outline)] bg-[var(--landing-surface)] text-[var(--landing-ink)] hover:bg-[#f2ead7]"
              asChild
            >
              <Link to="/services">
                <ArrowLeft className="h-4 w-4" />
                Back to services
              </Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="landing-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--landing-muted)]">
              Common Requirements
            </p>
            <h2 className="mt-2 text-3xl font-semibold">Prepare these before starting</h2>

            <div className="mt-5 space-y-3">
              {service.requirements.map((item, index) => {
                const icons = [FileText, BookCheck, BadgeCheck, ShieldCheck];
                const Icon = icons[index % icons.length];

                return (
                  <div
                    key={item}
                    className="landing-soft-card flex items-start gap-3 px-3 py-3 text-sm text-[var(--landing-muted)]"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--landing-accent)] text-white">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span>{item}</span>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="landing-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--landing-muted)]">
              Typical Review Pace
            </p>
            <h2 className="mt-2 text-3xl font-semibold">{service.turnaround}</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--landing-muted)]">
              Turnaround time varies depending on case completeness and verification findings.
            </p>

            <div className="mt-6 space-y-3">
              <Button
                className="w-full rounded-xl bg-[var(--landing-accent)] text-white hover:bg-[var(--landing-accent-strong)]"
                asChild
              >
                <Link to="/request-assistance">Request this service</Link>
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-xl border-[var(--landing-outline)] bg-[var(--landing-surface)] text-[var(--landing-ink)] hover:bg-[#f2ead7]"
                asChild
              >
                <Link to="/requirements">View requirements guide</Link>
              </Button>
            </div>
          </article>
        </section>

        <section className="landing-card p-6 md:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--landing-muted)]">
            Process Flow
          </p>
          <h2 className="mt-2 text-3xl font-semibold">How the process works</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--landing-muted)]">
            What usually happens after you submit this assistance request.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {service.process.map((item, index) => (
              <div key={item} className="landing-soft-card flex gap-3 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--landing-accent)] text-xs font-semibold text-white">
                  {index + 1}
                </div>
                <p className="text-sm leading-7 text-[var(--landing-muted)]">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
