import { ArrowRight, HandHelping, School, Siren, Stethoscope, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { publicServices } from "@/features/public";

const assistanceIconBySlug: Record<string, LucideIcon> = {
  "medical-assistance": Stethoscope,
  "burial-assistance": Siren,
  "food-relief": HandHelping,
  "educational-assistance": School,
};

export function ServicesPage() {
  return (
    <div className="landing-page pb-14 text-[var(--landing-ink)]">
      <div className="container public-page-stack">
        <section className="landing-card relative overflow-hidden p-6 md:p-8">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,var(--landing-accent),var(--landing-highlight))]" />          
          <p className="public-kicker">
            Services
          </p>
          <h1 className="public-hero-title mt-3 max-w-5xl">
            Public-facing assistance programs and intake guidance.
          </h1>
          <p className="public-hero-lead mt-4 max-w-3xl">
            Each service page outlines the purpose of the assistance type, the usual document set,
            and the review flow residents can expect after submission.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          {publicServices.map((service) => {
            const Icon = assistanceIconBySlug[service.slug] ?? HandHelping;

            return (
              <article key={service.slug} className="landing-card flex h-full flex-col p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--landing-muted)]">
                  {service.category}
                </p>
                <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--landing-accent)] text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-3xl font-semibold leading-tight">{service.title}</h2>
                <p className="mt-3 text-lg text-[var(--landing-muted)]">{service.summary}</p>
                <p className="mt-5 flex-1 text-sm leading-7 text-[var(--landing-muted)]">
                  {service.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    className="rounded-xl bg-[var(--landing-accent)] text-white hover:bg-[var(--landing-accent-strong)]"
                    asChild
                  >
                    <Link to={`/services/${service.slug}`}>
                      View details
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl border-[var(--landing-outline)] bg-[var(--landing-surface)] text-[var(--landing-ink)] hover:bg-[#f2ead7]"
                    asChild
                  >
                    <Link to="/request-assistance">Start request</Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
