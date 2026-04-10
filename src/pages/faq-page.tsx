import { BookCheck, ChevronDown } from "lucide-react";

import { faqItems } from "@/features/public";

export function FaqPage() {
  return (
    <div className="landing-page pb-14 text-[var(--landing-ink)]">
      <div className="container public-page-stack">
        <section className="landing-card relative overflow-hidden p-6 md:p-8">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,var(--landing-accent),var(--landing-highlight))]" />
          <p className="public-kicker">FAQ</p>
          <h1 className="public-hero-title mt-3 max-w-5xl">
            Common questions about the OMSWD request workflow.
          </h1>
          <p className="public-hero-lead mt-4 max-w-3xl">
            Residents can use this as a quick guide before creating an account, preparing
            documents, and starting a request.
          </p>
        </section>

        <section className="space-y-3">
          {faqItems.map((item) => (
            <details key={item.question} className="landing-card group p-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-lg font-semibold text-[var(--landing-ink)]">
                <span className="flex items-start gap-3">
                  <BookCheck className="mt-1 h-5 w-5 shrink-0 text-[var(--landing-accent)]" />
                  {item.question}
                </span>
                <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-[var(--landing-muted)] transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <p className="mt-4 border-t border-[var(--landing-outline)] pt-4 text-sm leading-7 text-[var(--landing-muted)]">
                {item.answer}
              </p>
            </details>
          ))}
        </section>
      </div>
    </div>
  );
}
