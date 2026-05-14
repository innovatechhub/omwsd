import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  HeartHandshake,
  ShieldCheck,
  Users,
  Award,
  Target,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

const revealContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const revealItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
};

const pillars = [
  {
    title: "Resident-Centered Intake",
    description:
      "The portal is designed to make assistance intake clearer, more trackable, and easier to follow for residents of Pandan.",
    icon: HeartHandshake,
  },
  {
    title: "Structured Verification",
    description:
      "Applications move through a documented verification process so staff can validate residency and supporting records consistently.",
    icon: ShieldCheck,
  },
  {
    title: "Operational Visibility",
    description:
      "The system supports dashboards, reports, and an auditable application workflow for staff and management.",
    icon: Building2,
  },
];

const values = [
  {
    icon: Users,
    title: "Inclusive Service",
    description: "Serving all eligible residents of Pandan with fairness and compassion.",
  },
  {
    icon: Award,
    title: "Transparency",
    description: "Every assistance case is tracked, documented, and reviewable by authorized staff.",
  },
  {
    icon: Target,
    title: "Community Impact",
    description: "Programs are designed to deliver real, measurable help to families in need.",
  },
];

export function AboutPage() {
  return (
    <div className="landing-page text-[var(--landing-ink)]">

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-[rgba(21,91,145,0.1)] blur-3xl" />
          <div className="absolute right-0 top-10 h-64 w-64 rounded-full bg-[rgba(242,193,79,0.18)] blur-3xl" />
        </div>
        <div className="container relative py-[var(--landing-space-section)]">
          <motion.div
            initial="hidden"
            animate="show"
            variants={revealContainer}
            className="max-w-4xl"
          >
            <motion.span
              variants={revealItem}
              className="inline-block rounded-full border border-[var(--landing-outline)] bg-[var(--landing-surface)] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[var(--landing-muted)]"
            >
              About OMSWD
            </motion.span>
            <motion.h1 variants={revealItem} className="public-hero-title mt-5">
              A Better Digital Front Door for Social Welfare Services
            </motion.h1>
            <motion.p variants={revealItem} className="public-hero-lead mt-5 max-w-3xl">
              The OMSWD Pandan portal is a single system for public information, assistance request
              intake, verification, and resident tracking — reducing fragmented communication and
              giving both residents and staff a clearer process from submission to resolution.
            </motion.p>
            <motion.div variants={revealItem} className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="rounded-xl bg-[var(--landing-accent)] px-6 text-white hover:bg-[var(--landing-accent-strong)]"
                asChild
              >
                <Link to="/services">
                  View Services <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl border-[var(--landing-outline)] bg-[var(--landing-surface)] text-[var(--landing-ink)] hover:bg-[#f2ead7]"
                asChild
              >
                <Link to="/contact">Contact OMSWD</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Mission banner */}
      <section className="stats-section py-14">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center text-white"
          >
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--landing-highlight)] mb-3">Our Mission</p>
            <p className="font-serif text-2xl font-bold leading-relaxed md:text-3xl">
              "To provide compassionate and efficient social welfare services that empower Pandan residents and strengthen community resilience."
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pillars */}
      <section className="container py-[var(--landing-space-section)]">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={revealContainer}
        >
          <motion.div variants={revealItem} className="mb-10 text-center">
            <p className="public-kicker">What We Stand For</p>
            <h2 className="mt-2 font-serif text-3xl font-bold md:text-4xl">Our Core Pillars</h2>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-3">
            {pillars.map(({ title, description, icon: Icon }) => (
              <motion.article
                key={title}
                variants={revealItem}
                className="landing-card p-6 hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--landing-accent)] text-white shadow-lg">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--landing-muted)]">{description}</p>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </section>

      {/* What this platform is for */}
      <section className="bg-[#f7f3e9] py-[var(--landing-space-section)]">
        <div className="container">
          <motion.div
            className="grid gap-10 lg:grid-cols-2 lg:items-center"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={revealContainer}
          >
            <motion.div variants={revealItem}>
              <p className="public-kicker">What This Platform Is For</p>
              <h2 className="mt-3 font-serif text-3xl font-bold md:text-4xl">
                One System for Residents and Staff
              </h2>
              <p className="mt-4 text-[var(--landing-muted)] leading-7">
                Public website content, structured intake, protected staff workflows, and
                resident-side updates are brought into one modular application — so no case
                falls through the cracks.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Online assistance request intake for Pandan residents",
                  "Document upload and follow-up tracking per application",
                  "Staff dashboard for review, verification, and reporting",
                  "Role-based access for residents and OMSWD staff",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[var(--landing-muted)]">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--landing-accent)]" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button className="rounded-xl bg-[var(--landing-accent)] text-white hover:bg-[var(--landing-accent-strong)]" asChild>
                  <Link to="/request-assistance">Apply for Assistance <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            </motion.div>

            <motion.div variants={revealItem} className="grid gap-4">
              {values.map(({ icon: Icon, title, description }) => (
                <div key={title} className="landing-card flex gap-4 p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--landing-accent)]/10 text-[var(--landing-accent)]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--landing-muted)]">{description}</p>
                  </div>
                </div>
              ))}
            </motion.div>
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
          className="landing-card overflow-hidden p-8 md:p-10 text-center"
        >
          <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,var(--landing-accent),var(--landing-highlight))]" />
          <p className="public-kicker">Get Started</p>
          <h2 className="mt-3 font-serif text-3xl font-bold md:text-4xl">Ready to Request Assistance?</h2>
          <p className="mx-auto mt-4 max-w-lg text-[var(--landing-muted)]">
            Create a free resident account and submit your request. The OMSWD team will guide you through every step.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="rounded-xl bg-[var(--landing-accent)] px-8 text-white hover:bg-[var(--landing-accent-strong)]" asChild>
              <Link to="/register">Create Resident Account <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-xl border-[var(--landing-outline)] bg-[var(--landing-surface)] text-[var(--landing-ink)] hover:bg-[#f2ead7]" asChild>
              <Link to="/services">Browse Services</Link>
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
