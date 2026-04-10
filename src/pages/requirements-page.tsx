import { ArrowRight, BadgeCheck, FileCheck2, FolderOpen, Landmark, UserSquare2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { requirementsChecklist } from "@/features/public";

export function RequirementsPage() {
  const groupIcons = [UserSquare2, FileCheck2, FolderOpen];
  const itemIcons = [BadgeCheck, Landmark, FileCheck2, FolderOpen];

  return (
    <div className="landing-page pb-14 text-[var(--landing-ink)]">
      <div className="container public-page-stack">
        <section className="landing-card relative overflow-hidden p-6 md:p-8">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,var(--landing-accent),var(--landing-highlight))]" />
          <p className="public-kicker">
            Requirements
          </p>
          <h1 className="public-hero-title mt-3 max-w-4xl">
            Prepare documents before you start the request form.
          </h1>
          <p className="public-hero-lead mt-4 max-w-3xl">
            The exact checklist depends on the assistance type, but these categories cover the
            core records commonly used during intake and follow-up.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          {requirementsChecklist.map((group) => {
            const Icon = groupIcons[requirementsChecklist.indexOf(group)] ?? FileCheck2;

            return (
              <article key={group.title} className="landing-card p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--landing-accent)] text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-xl font-semibold">{group.title}</h2>
                <p className="mt-1 text-sm text-[var(--landing-muted)]">Review this before uploading files.</p>

                <div className="mt-4 space-y-3">
                  {group.items.map((item, index) => {
                    const ItemIcon = itemIcons[index % itemIcons.length];

                    return (
                      <div
                        key={item}
                        className="landing-soft-card flex items-start gap-3 px-3 py-3 text-sm text-[var(--landing-muted)]"
                      >
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--landing-accent)] text-white">
                          <ItemIcon className="h-4 w-4" />
                        </div>
                        <span>{item}</span>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </section>

        <section className="landing-card grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-center">
          <p className="text-sm leading-7 text-[var(--landing-muted)]">
            After preparing the checklist, continue to the request form and submit clear,
            readable files to avoid delays in verification.
          </p>
          <Button
            className="rounded-xl bg-[var(--landing-accent)] text-white hover:bg-[var(--landing-accent-strong)]"
            asChild
          >
            <Link to="/request-assistance">
              Apply for Assistance
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
