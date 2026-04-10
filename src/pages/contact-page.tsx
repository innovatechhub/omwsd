import { HeartPulse, MapPinHouse, PhoneCall, Send } from "lucide-react";

import { officeContacts } from "@/features/public";

export function ContactPage() {
  return (
    <div className="landing-page pb-14 text-[var(--landing-ink)]">
      <div className="container public-page-stack">
        <section className="landing-card relative overflow-hidden p-6 md:p-8">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,var(--landing-accent),var(--landing-highlight))]" />
          <p className="public-kicker">
            Contact
          </p>
          <h1 className="public-hero-title mt-3 max-w-4xl">
            Reach the OMSWD office for assistance follow-up.
          </h1>
          <p className="public-hero-lead mt-4 max-w-3xl">
            The public website and resident portal are designed to reduce back-and-forth, but
            office staff still handle case review, verification, and release coordination.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="landing-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--landing-muted)]">
              Office Details
            </p>
            <h2 className="mt-3 text-2xl font-semibold">{officeContacts.office}</h2>
            <div className="mt-5 space-y-3">
              <div className="landing-soft-card flex items-start gap-3 p-4">
                <MapPinHouse className="mt-0.5 h-5 w-5 shrink-0 text-[var(--landing-accent)]" />
                <p className="text-sm text-[var(--landing-muted)]">{officeContacts.municipality}</p>
              </div>
              <div className="landing-soft-card flex items-start gap-3 p-4">
                <HeartPulse className="mt-0.5 h-5 w-5 shrink-0 text-[var(--landing-accent)]" />
                <p className="text-sm text-[var(--landing-muted)]">{officeContacts.hours}</p>
              </div>
            </div>
          </article>

          <article className="landing-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--landing-muted)]">
              Communication Channels
            </p>
            <h2 className="mt-3 text-2xl font-semibold">Current communication channels</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--landing-muted)]">
              These are the main contact points while the platform continues expanding.
            </p>
            <div className="mt-5 space-y-3">
              {officeContacts.channels.map((channel, index) => {
                const Icon = index % 2 === 0 ? Send : PhoneCall;

                return (
                  <div key={channel} className="landing-soft-card flex items-start gap-3 p-4">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--landing-accent)]" />
                    <p className="text-sm text-[var(--landing-muted)]">{channel}</p>
                  </div>
                );
              })}
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
