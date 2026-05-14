import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, FileCheck2, FolderOpen, UserSquare2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { requirementsChecklist } from "@/features/public";

const revealContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const revealItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
};

const groupIcons = [UserSquare2, FileCheck2, FolderOpen];

export function RequirementsPage() {
  return (
    <div className="landing-page text-[var(--landing-ink)]">

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-[rgba(21,91,145,0.1)] blur-3xl" />
          <div className="absolute right-0 top-8 h-60 w-60 rounded-full bg-[rgba(242,193,79,0.18)] blur-3xl" />
        </div>
        <div className="container relative py-[var(--landing-space-section)]">
          <motion.div initial="hidden" animate="show" variants={revealContainer} className="max-w-4xl">
            <motion.span
              variants={revealItem}
              className="inline-block rounded-full border border-[var(--landing-outline)] bg-[var(--landing-surface)] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[var(--landing-muted)]"
            >
              Requirements
            </motion.span>
            <motion.h1 variants={revealItem} className="public-hero-title mt-5">
              Prepare Your Documents Before Submitting
            </motion.h1>
            <motion.p variants={revealItem} className="public-hero-lead mt-5 max-w-3xl">
              The exact checklist depends on the assistance type, but these categories cover the
              core records commonly required during intake and verification.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Checklist groups */}
      <section className="container pb-[var(--landing-space-section)]">
        <motion.div
          className="grid gap-6 lg:grid-cols-3"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={revealContainer}
        >
          {requirementsChecklist.map((group, gi) => {
            const GroupIcon = groupIcons[gi] ?? FileCheck2;
            return (
              <motion.article key={group.title} variants={revealItem} className="landing-card flex flex-col overflow-hidden">
                <div className="h-1.5 bg-[linear-gradient(90deg,var(--landing-accent),var(--landing-highlight))]" />
                <div className="flex flex-col flex-1 p-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--landing-accent)] text-white shadow-lg">
                    <GroupIcon className="h-7 w-7" />
                  </div>
                  <h2 className="mt-5 text-xl font-bold capitalize">{group.title}</h2>
                  <p className="mt-1 text-sm text-[var(--landing-muted)]">Review this checklist before uploading files.</p>
                  <div className="mt-5 flex-1 space-y-3">
                    {group.items.map((item) => (
                      <div key={item} className="landing-soft-card flex items-start gap-3 px-4 py-3">
                        <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--landing-accent)]" />
                        <span className="text-sm leading-6 text-[var(--landing-muted)]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </section>

      {/* Tips section */}
      <section className="bg-[#f7f3e9] py-[var(--landing-space-section)]">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <p className="public-kicker text-center">Document Tips</p>
            <h2 className="mt-2 text-center font-serif text-3xl font-bold">Before You Upload</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                { tip: "Scan or photograph documents clearly — blurry files cause delays in verification." },
                { tip: "Make sure your government ID shows your full name and photo clearly." },
                { tip: "Barangay certifications should be recent — preferably issued within 3 months." },
                { tip: "Uploaded files must be in PDF, JPG, or PNG format with a maximum size per file." },
              ].map(({ tip }) => (
                <div key={tip} className="landing-card flex items-start gap-3 p-4">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--landing-accent)]" />
                  <p className="text-sm leading-6 text-[var(--landing-muted)]">{tip}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-[var(--landing-space-section)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="landing-card flex flex-col items-center gap-5 p-8 text-center md:flex-row md:text-left md:justify-between"
        >
          <div>
            <h3 className="font-serif text-2xl font-bold">Ready to submit your request?</h3>
            <p className="mt-2 text-sm text-[var(--landing-muted)]">
              Once your documents are prepared, continue to the online request form.
            </p>
          </div>
          <Button size="lg" className="shrink-0 rounded-xl bg-[var(--landing-accent)] px-7 text-white hover:bg-[var(--landing-accent-strong)]" asChild>
            <Link to="/request-assistance">
              Apply for Assistance <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
