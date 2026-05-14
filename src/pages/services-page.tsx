import { motion } from "framer-motion";
import { ArrowRight, HandHelping, School, Siren, Stethoscope, type LucideIcon, Clock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { publicServices } from "@/features/public";

const revealContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const revealItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
};

const assistanceIconBySlug: Record<string, LucideIcon> = {
  "medical-assistance": Stethoscope,
  "burial-assistance": Siren,
  "food-relief": HandHelping,
  "educational-assistance": School,
};

const categoryColors: Record<string, string> = {
  Health: "bg-blue-50 text-blue-700 border-blue-200",
  Emergency: "bg-red-50 text-red-700 border-red-200",
  "Basic Needs": "bg-green-50 text-green-700 border-green-200",
  Education: "bg-purple-50 text-purple-700 border-purple-200",
};

export function ServicesPage() {
  return (
    <div className="landing-page text-[var(--landing-ink)]">

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-[rgba(21,91,145,0.1)] blur-3xl" />
          <div className="absolute right-0 top-8 h-60 w-60 rounded-full bg-[rgba(242,193,79,0.18)] blur-3xl" />
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
              Services
            </motion.span>
            <motion.h1 variants={revealItem} className="public-hero-title mt-5">
              Assistance Programs for Pandan Residents
            </motion.h1>
            <motion.p variants={revealItem} className="public-hero-lead mt-5 max-w-3xl">
              Each program outlines the purpose of the assistance type, the usual document requirements,
              and the review flow residents can expect after submission.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Services grid */}
      <section className="container pb-[var(--landing-space-section)]">
        <motion.div
          className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={revealContainer}
        >
          {publicServices.filter(s => s.slug === "medical-assistance" || s.slug === "burial-assistance").map((service, i) => {
            const Icon = assistanceIconBySlug[service.slug] ?? HandHelping;
            const categoryClass = categoryColors[service.category] ?? "bg-gray-50 text-gray-700 border-gray-200";

            return (
              <motion.article
                key={service.slug}
                variants={revealItem}
                transition={{ delay: i * 0.05 }}
                className="landing-card flex h-full flex-col overflow-hidden hover:-translate-y-1 transition-transform duration-300"
              >
                {/* Card top accent */}
                <div className="h-1.5 bg-[linear-gradient(90deg,var(--landing-accent),var(--landing-highlight))]" />
                <div className="flex flex-col flex-1 p-6 md:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--landing-accent)] text-white shadow-lg">
                      <Icon className="h-7 w-7" />
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${categoryClass}`}>
                      {service.category}
                    </span>
                  </div>

                  <h2 className="mt-5 text-2xl font-bold">{service.title}</h2>
                  <p className="mt-2 text-base font-medium text-[var(--landing-accent)]">{service.summary}</p>
                  <p className="mt-3 flex-1 text-sm leading-7 text-[var(--landing-muted)]">
                    {service.description}
                  </p>

                  <div className="mt-5 flex items-center gap-2 text-sm text-[var(--landing-muted)]">
                    <Clock className="h-4 w-4 text-[var(--landing-accent)]" />
                    <span>{service.turnaround}</span>
                  </div>

                  <div className="mt-5 pt-5 border-t border-[var(--landing-outline)] flex flex-wrap gap-3">
                    <Button
                      className="rounded-xl bg-[var(--landing-accent)] text-white hover:bg-[var(--landing-accent-strong)]"
                      asChild
                    >
                      <Link to={`/services/${service.slug}`}>
                        View Details <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-xl border-[var(--landing-outline)] bg-[var(--landing-surface)] text-[var(--landing-ink)] hover:bg-[#f2ead7]"
                      asChild
                    >
                      <Link to="/request-assistance">Apply Now</Link>
                    </Button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </section>

      {/* CTA strip */}
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
              <h2 className="font-serif text-2xl font-bold md:text-3xl">Not sure which service to apply for?</h2>
              <p className="mt-2 text-white/78 max-w-lg">Check the requirements guide or contact the OMSWD office directly.</p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Button size="lg" className="rounded-xl bg-[var(--landing-highlight)] text-[var(--landing-ink)] hover:bg-yellow-300 font-semibold" asChild>
                <Link to="/requirements">View Requirements <CheckCircle className="h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl border-white/40 bg-white/10 text-white hover:bg-white/20" asChild>
                <Link to="/contact">Contact OMSWD</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
