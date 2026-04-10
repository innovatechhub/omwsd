import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BookCheck,
  FileCheck2,
  HandHelping,
  HeartPulse,
  type LucideIcon,
  MapPinHouse,
  NotebookPen,
  School,
  ShieldCheck,
  Siren,
  Stethoscope,
  Upload,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { faqItems, officeContacts, publicServices, requirementsChecklist } from "@/features/public";

const revealContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
};

const revealItem = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const assistanceIconBySlug: Record<string, LucideIcon> = {
  "medical-assistance": Stethoscope,
  "burial-assistance": Siren,
  "food-relief": HandHelping,
  "educational-assistance": School,
};

const assistanceCards = [
  "medical-assistance",
  "burial-assistance",
  "food-relief",
  "educational-assistance",
]
  .map((slug) => publicServices.find((service) => service.slug === slug))
  .filter((service): service is (typeof publicServices)[number] => Boolean(service))
  .map((service) => ({
    ...service,
    icon: assistanceIconBySlug[service.slug] ?? HandHelping,
  }));

const howItWorksSteps = [
  {
    title: "Submit your request online",
    description:
      "Fill out the portal form with your personal details, address, and reason for assistance.",
    icon: NotebookPen,
  },
  {
    title: "OMSWD verifies and reviews",
    description:
      "Staff checks eligibility, validates residency records, and requests clarifications when needed.",
    icon: ShieldCheck,
  },
  {
    title: "Track updates and upload follow-ups",
    description:
      "Receive status updates in your account and submit any required supporting documents.",
    icon: Upload,
  },
];

const faqPreview = faqItems.slice(0, 4);

export function HomePage() {
  return (
    <div className="landing-page pb-16 text-[var(--landing-ink)]">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-28 top-8 h-72 w-72 rounded-full bg-[rgba(14,63,102,0.12)] blur-3xl" />
          <div className="absolute right-6 top-16 h-64 w-64 rounded-full bg-[rgba(242,193,79,0.24)] blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(255,255,255,0.6),transparent)]" />
        </div>

        <motion.div
          className="container relative grid gap-8 pb-14 pt-[var(--landing-space-section)] lg:grid-cols-[1.15fr_0.85fr] lg:items-start"
          variants={revealContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={revealItem} className="space-y-6">
            <Badge className="landing-chip border-0 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em]">
              Office of Municipal Social Welfare and Development
            </Badge>
            <div className="space-y-4">
              <h1 className="public-hero-title max-w-3xl">
                Public Assistance Intake for Pandan Residents
              </h1>
              <p className="public-hero-lead max-w-2xl">
                Start your request online, submit required documents, and follow every review
                update through one secure municipal service portal.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="rounded-xl bg-[var(--landing-accent)] px-6 text-white hover:bg-[var(--landing-accent-strong)]"
                asChild
              >
                <Link to="/request-assistance">
                  Apply for Assistance
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl border-[var(--landing-outline)] bg-[var(--landing-surface)] text-[var(--landing-ink)] hover:bg-[#f2ead7]"
                asChild
              >
                <Link to="/services">Browse Services</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-3 pt-3">
              <span className="landing-chip px-4 py-2 text-sm font-medium">
                Digital request intake
              </span>
              <span className="landing-chip px-4 py-2 text-sm font-medium">
                Document-ready workflow
              </span>
              <span className="landing-chip px-4 py-2 text-sm font-medium">
                Resident status tracking
              </span>
            </div>
          </motion.div>

          <motion.div variants={revealItem} className="landing-card relative overflow-hidden p-6 md:p-7">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,var(--landing-accent),var(--landing-highlight))]" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--landing-muted)]">
              Quick Process Snapshot
            </p>
            <div className="mt-5 space-y-4">
              {howItWorksSteps.map(({ title, description, icon: Icon }, index) => (
                <div key={title} className="landing-soft-card flex gap-3 p-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--landing-accent)] text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--landing-ink)]">
                      {index + 1}. {title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--landing-muted)]">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl border border-[var(--landing-outline)] bg-[#efe7d4] p-4">
              <p className="text-sm font-semibold text-[var(--landing-ink)]">
                Need full requirements first?
              </p>
              <Button
                variant="ghost"
                className="mt-1 h-auto p-0 text-sm font-semibold text-[var(--landing-accent)] hover:bg-transparent"
                asChild
              >
                <Link to="/requirements">
                  Review requirement checklist
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <motion.section
        className="container pb-[var(--landing-space-section)]"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={revealContainer}
      >
        <motion.div variants={revealItem} className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--landing-muted)]">
            Assistance Programs
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold md:text-4xl">Available Assistance Types</h2>
        </motion.div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {assistanceCards.map(({ title, summary, slug, icon: Icon }, index) => (
            <motion.article
              key={slug}
              variants={revealItem}
              transition={{ delay: index * 0.05 }}
              className="landing-card flex h-full flex-col p-5"
              whileHover={{ y: -3 }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--landing-accent)] text-white">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">{title}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-[var(--landing-muted)]">{summary}</p>
              <Button
                variant="ghost"
                className="mt-4 h-auto justify-start p-0 text-sm font-semibold text-[var(--landing-accent)] hover:bg-transparent"
                asChild
              >
                <Link to={`/services/${slug}`}>
                  View details
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="container grid gap-5 pb-[var(--landing-space-section)] lg:grid-cols-[1.04fr_0.96fr]"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        variants={revealContainer}
      >
        <motion.div variants={revealItem} className="landing-card p-6 md:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--landing-muted)]">
            How It Works
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold md:text-4xl">Three-Step Assistance Flow</h2>
          <div className="mt-6 space-y-4">
            {howItWorksSteps.map(({ title, description, icon: Icon }, index) => (
              <div key={title} className="landing-soft-card flex gap-4 p-4">
                <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--landing-accent)] text-white">
                  {index + 1}
                </div>
                <div className="space-y-1">
                  <p className="flex items-center gap-2 font-semibold">
                    <Icon className="h-4 w-4 text-[var(--landing-accent)]" />
                    {title}
                  </p>
                  <p className="text-sm leading-6 text-[var(--landing-muted)]">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={revealItem} className="landing-card p-6 md:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--landing-muted)]">
            Requirements Checklist Preview
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold md:text-4xl">Prepare Before You Submit</h2>
          <div className="mt-6 space-y-4">
            {requirementsChecklist.map((group) => (
              <div key={group.title} className="landing-soft-card p-4">
                <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.1em] text-[var(--landing-accent)]">
                  <FileCheck2 className="h-4 w-4" />
                  {group.title}
                </p>
                <ul className="mt-3 space-y-2">
                  {group.items.slice(0, 2).map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm leading-6 text-[var(--landing-muted)]">
                      <BadgeCheck className="mt-1 h-4 w-4 shrink-0 text-[var(--landing-accent)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.section>

      <motion.section
        className="container grid gap-5 pb-8 lg:grid-cols-[1.08fr_0.92fr]"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.18 }}
        variants={revealContainer}
      >
        <motion.div variants={revealItem} className="landing-card p-6 md:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--landing-muted)]">
            FAQ Preview
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold md:text-4xl">
            Common Questions from Residents
          </h2>
          <div className="mt-6 space-y-3">
            {faqPreview.map((item) => (
              <article key={item.question} className="landing-soft-card p-4">
                <p className="flex items-start gap-2 font-semibold text-[var(--landing-ink)]">
                  <BookCheck className="mt-1 h-4 w-4 shrink-0 text-[var(--landing-accent)]" />
                  {item.question}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--landing-muted)]">{item.answer}</p>
              </article>
            ))}
          </div>
          <Button
            variant="outline"
            className="mt-5 rounded-xl border-[var(--landing-outline)] bg-[var(--landing-surface)] text-[var(--landing-ink)] hover:bg-[#f2ead7]"
            asChild
          >
            <Link to="/faq">
              Open full FAQ
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>

        <motion.aside variants={revealItem} className="landing-card p-6 md:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--landing-muted)]">
            Contact OMSWD
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold md:text-4xl">
            Support Channels and Office Details
          </h2>
          <div className="mt-6 space-y-3">
            <div className="landing-soft-card p-4">
              <p className="flex items-center gap-2 font-semibold">
                <MapPinHouse className="h-4 w-4 text-[var(--landing-accent)]" />
                {officeContacts.office}
              </p>
              <p className="mt-2 text-sm text-[var(--landing-muted)]">{officeContacts.municipality}</p>
            </div>
            <div className="landing-soft-card p-4">
              <p className="flex items-center gap-2 font-semibold">
                <HeartPulse className="h-4 w-4 text-[var(--landing-accent)]" />
                Office Hours
              </p>
              <p className="mt-2 text-sm text-[var(--landing-muted)]">{officeContacts.hours}</p>
            </div>
            <div className="landing-soft-card p-4">
              <p className="flex items-center gap-2 font-semibold">
                <ArrowRight className="h-4 w-4 text-[var(--landing-accent)]" />
                Follow-up Channels
              </p>
              <ul className="mt-3 space-y-2">
                {officeContacts.channels.slice(0, 3).map((channel) => (
                  <li key={channel} className="flex items-start gap-2 text-sm text-[var(--landing-muted)]">
                    <BadgeCheck className="mt-1 h-4 w-4 shrink-0 text-[var(--landing-accent)]" />
                    <span>{channel}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button className="rounded-xl bg-[var(--landing-accent)] text-white hover:bg-[var(--landing-accent-strong)]" asChild>
              <Link to="/contact">
                <MapPinHouse className="h-4 w-4" />
                Contact page
              </Link>
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-[var(--landing-outline)] bg-[var(--landing-surface)] text-[var(--landing-ink)] hover:bg-[#f2ead7]"
              asChild
            >
              <Link to="/register">
                <HeartPulse className="h-4 w-4" />
                Create resident account
              </Link>
            </Button>
          </div>
        </motion.aside>
      </motion.section>
    </div>
  );
}
