import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookCheck,
  Clock,
  FileText,
  HandHelping,
  School,
  ShieldCheck,
  Siren,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { getServiceBySlug } from "@/features/public";

const revealContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const revealItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

const serviceIconBySlug: Record<string, LucideIcon> = {
  "medical-assistance": Stethoscope,
  "burial-assistance": Siren,
  "food-relief": HandHelping,
  "educational-assistance": School,
};

export function ServiceDetailsPage() {
  const { serviceSlug } = useParams();
  const service = getServiceBySlug(serviceSlug ?? "");

  if (!service) return <Navigate to="/services" replace />;

  const ServiceIcon = serviceIconBySlug[service.slug] ?? HandHelping;

  return (
    <div className="landing-page text-[var(--landing-ink)]">

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-[rgba(21,91,145,0.1)] blur-3xl" />
          <div className="absolute right-0 top-8 h-60 w-60 rounded-full bg-[rgba(242,193,79,0.18)] blur-3xl" />
        </div>
        <div className="container relative py-[var(--landing-space-section)]">
          <motion.div initial="hidden" animate="show" variants={revealContainer}>
            <motion.div variants={revealItem}>
              <Link
                to="/services"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--landing-muted)] hover:text-[var(--landing-ink)] transition-colors mb-6"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Services
              </Link>
            </motion.div>

            <motion.div variants={revealItem} className="flex items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--landing-accent)] text-white shadow-xl">
                <ServiceIcon className="h-8 w-8" />
              </div>
              <div>
                <span className="rounded-full border border-[var(--landing-outline)] bg-[var(--landing-surface)] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--landing-muted)]">
                  {service.category}
                </span>
                <h1 className="public-hero-title mt-2">{service.title}</h1>
              </div>
            </motion.div>

            <motion.p variants={revealItem} className="public-hero-lead mt-5 max-w-3xl">
              {service.description}
            </motion.p>

            <motion.div variants={revealItem} className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" className="rounded-xl bg-[var(--landing-accent)] px-7 text-white hover:bg-[var(--landing-accent-strong)]" asChild>
                <Link to="/request-assistance">
                  Request This Service <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl border-[var(--landing-outline)] bg-[var(--landing-surface)] text-[var(--landing-ink)] hover:bg-[#f2ead7]" asChild>
                <Link to="/requirements">View Requirements Guide</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Turnaround banner */}
      <div className="stats-section py-10">
        <div className="container flex flex-col items-center gap-2 text-center text-white md:flex-row md:justify-between md:text-left">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-[var(--landing-highlight)]" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Typical Processing Time</p>
              <p className="font-serif text-xl font-bold">{service.turnaround}</p>
            </div>
          </div>
          <p className="text-sm text-white/70 max-w-md">Turnaround varies depending on case completeness and verification findings.</p>
        </div>
      </div>

      {/* Requirements + Process */}
      <section className="container py-[var(--landing-space-section)]">
        <motion.div
          className="grid gap-6 lg:grid-cols-2"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={revealContainer}
        >
          <motion.article variants={revealItem} className="landing-card p-6 md:p-8">
            <p className="public-kicker">Common Requirements</p>
            <h2 className="mt-2 font-serif text-2xl font-bold md:text-3xl">Prepare Before Starting</h2>
            <p className="mt-2 text-sm text-[var(--landing-muted)]">Have these documents ready before you fill the form.</p>
            <div className="mt-6 space-y-3">
              {service.requirements.map((item, index) => {
                const icons = [FileText, BookCheck, BadgeCheck, ShieldCheck];
                const Icon = icons[index % icons.length];
                return (
                  <div key={item} className="landing-soft-card flex items-start gap-3 px-4 py-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--landing-accent)] text-white">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm leading-6 text-[var(--landing-muted)]">{item}</span>
                  </div>
                );
              })}
            </div>
          </motion.article>

          <motion.article variants={revealItem} className="landing-card p-6 md:p-8">
            <p className="public-kicker">Process Flow</p>
            <h2 className="mt-2 font-serif text-2xl font-bold md:text-3xl">How It Works</h2>
            <p className="mt-2 text-sm text-[var(--landing-muted)]">What usually happens after you submit this request.</p>
            <div className="mt-6 space-y-4">
              {service.process.map((item, index) => (
                <div key={item} className="landing-soft-card flex gap-4 px-4 py-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--landing-accent)] text-sm font-bold text-white shadow">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-7 text-[var(--landing-muted)]">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <Button className="w-full rounded-xl bg-[var(--landing-accent)] text-white hover:bg-[var(--landing-accent-strong)]" asChild>
                <Link to="/request-assistance">Apply for {service.title}</Link>
              </Button>
              <Button variant="outline" className="w-full rounded-xl border-[var(--landing-outline)] bg-[var(--landing-surface)] text-[var(--landing-ink)] hover:bg-[#f2ead7]" asChild>
                <Link to="/services"><ArrowLeft className="h-4 w-4" /> Back to All Services</Link>
              </Button>
            </div>
          </motion.article>
        </motion.div>
      </section>
    </div>
  );
}
