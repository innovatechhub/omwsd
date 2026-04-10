import { ArrowRight, Building2, HeartHandshake, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const pillars = [
  {
    title: "Resident-centered intake",
    description:
      "The portal is designed to make assistance intake clearer, more trackable, and easier to follow for residents.",
    icon: HeartHandshake,
  },
  {
    title: "Structured verification",
    description:
      "Applications move through a documented verification process so staff can validate residency and supporting records consistently.",
    icon: ShieldCheck,
  },
  {
    title: "Operational visibility",
    description:
      "The system is shaped to support dashboards, reports, and an auditable application workflow for the office.",
    icon: Building2,
  },
];

export function AboutPage() {
  return (
    <div className="landing-page pb-14 text-[var(--landing-ink)]">
      <div className="container public-page-stack">
        <section className="landing-card relative overflow-hidden p-6 md:p-8">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,var(--landing-accent),var(--landing-highlight))]" />
          <Badge className="landing-chip border-0 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em]">
            About OMSWD
          </Badge>
          <h1 className="public-hero-title mt-4 max-w-4xl">
            A more usable digital front door for social welfare services.
          </h1>
          <p className="public-hero-lead mt-4 max-w-3xl">
            The OMSWD Pandan portal is built as a single system for public information,
            assistance request intake, verification, and resident tracking. Its goal is to reduce
            fragmented communication and give both residents and staff a clearer process from
            submission to resolution.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {pillars.map(({ title, description, icon: Icon }) => (
            <article key={title} className="landing-card p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--landing-accent)] text-white">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-xl font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--landing-muted)]">{description}</p>
            </article>
          ))}
        </section>

        <section className="landing-card grid gap-5 p-6 md:grid-cols-[1.1fr_0.9fr] md:items-center md:p-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--landing-muted)]">
              What this platform is for
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--landing-muted)] md:text-base">
              Public website content, structured intake, protected staff workflows, and
              resident-side updates are brought into one modular application.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Button
              className="rounded-xl bg-[var(--landing-accent)] text-white hover:bg-[var(--landing-accent-strong)]"
              asChild
            >
              <Link to="/services">
                View services
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-[var(--landing-outline)] bg-[var(--landing-surface)] text-[var(--landing-ink)] hover:bg-[#f2ead7]"
              asChild
            >
              <Link to="/contact">Contact OMSWD</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
