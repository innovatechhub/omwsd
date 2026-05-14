import { motion } from "framer-motion";
import { ArrowRight, Calendar, Megaphone } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { publicAnnouncements } from "@/features/public";

const revealContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const revealItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
};

export function AnnouncementsPage() {
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
              Announcements
            </motion.span>
            <motion.h1 variants={revealItem} className="public-hero-title mt-5">
              Updates for Pandan Residents
            </motion.h1>
            <motion.p variants={revealItem} className="public-hero-lead mt-5 max-w-3xl">
              These notices set expectations for document readiness, account registration,
              and the verification steps that continue after digital submission.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Announcements list */}
      <section className="container pb-[var(--landing-space-section)]">
        <motion.div
          className="space-y-5"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={revealContainer}
        >
          {publicAnnouncements.map((item, i) => (
            <motion.article
              key={item.slug}
              variants={revealItem}
              className="landing-card overflow-hidden hover:-translate-y-0.5 transition-transform duration-300"
            >
              <div className="h-1.5 bg-[linear-gradient(90deg,var(--landing-accent),var(--landing-highlight))]" />
              <div className="grid gap-5 p-6 md:grid-cols-[auto_1fr_auto] md:items-center md:p-7">
                {/* Number badge */}
                <div className="hidden md:flex h-12 w-12 items-center justify-center rounded-full bg-[var(--landing-accent)] text-white font-bold text-lg shadow-lg">
                  {i + 1}
                </div>

                {/* Content */}
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--landing-muted)]">
                    <Calendar className="h-3.5 w-3.5" />
                    {item.date}
                  </div>
                  <h2 className="mt-2 text-xl font-bold">{item.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--landing-muted)]">{item.summary}</p>
                </div>

                {/* Icon */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--landing-accent)]/10 text-[var(--landing-accent)]">
                  <Megaphone className="h-6 w-6" />
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="stats-section py-14">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-6 text-center text-white md:flex-row md:text-left md:justify-between"
          >
            <div>
              <h2 className="font-serif text-2xl font-bold">Ready to Submit a Request?</h2>
              <p className="mt-2 text-white/78 max-w-lg">Create an account and start your application online.</p>
            </div>
            <Button size="lg" className="shrink-0 rounded-xl bg-[var(--landing-highlight)] px-7 text-[var(--landing-ink)] font-semibold hover:bg-yellow-300" asChild>
              <Link to="/request-assistance">Apply Now <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
