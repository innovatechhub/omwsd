import { Clock3, MapPin, ShieldCheck } from "lucide-react";

import { BrandMark } from "@/components/shared/brand-mark";
import { officeContacts } from "@/features/public";

const governmentNotes = [
  "Public-facing information and request intake for Pandan residents",
  "Protected resident and staff workflows with role-based access",
  "Document handling designed around verification and audit readiness",
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-primary text-primary-foreground">
      <div className="container grid gap-10 py-10 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-5">
          <div className="flex items-center gap-5">
            <BrandMark size="lg" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">{officeContacts.office}</p>
              <div className="space-y-2 pt-1 text-sm text-primary-foreground/78">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-accent" />
                  <span>{officeContacts.municipality}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 shrink-0 text-accent" />
                  <span>{officeContacts.hours}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 shadow-panel backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-foreground/72">
              Government service notice
            </p>
            <p className="mt-3 text-sm leading-7 text-primary-foreground/82">
              This platform is intended to guide residents through assistance intake,
              verification, document follow-up, and resident portal tracking in a more
              structured and transparent way.
            </p>
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-foreground/72">
              Service Standards
            </p>
            <p className="mt-2 text-sm text-primary-foreground/78">
              Core platform commitments reflected across the public site and protected
              modules.
            </p>
          </div>
          <div className="space-y-3">
            {governmentNotes.map((note) => (
              <div
                key={note}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-primary-foreground/82"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span>{note}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="border-t border-white/10 bg-primary/95">
        <div className="container flex flex-col gap-3 py-4 text-sm text-primary-foreground/74 md:flex-row md:items-center md:justify-between">
          <p>Copyright 2026 Office of Municipal Social Welfare and Development, Pandan, Antique.</p>
          <p>
            Public portal, resident portal, and administrative workspace for municipal
            social welfare operations.
          </p>
        </div>
      </div>
    </footer>
  );
}
