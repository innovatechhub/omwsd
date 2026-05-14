import { motion } from "framer-motion";
import { ArrowRight, Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { officeContacts } from "@/features/public";

const revealContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const revealItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
};

const contactDetails = [
  { icon: MapPin, label: "Office Address", value: officeContacts.municipality },
  { icon: Clock, label: "Office Hours", value: officeContacts.hours },
  { icon: Phone, label: "Contact", value: "Contact via municipal office front desk" },
  { icon: Mail, label: "Portal Updates", value: "Resident portal notifications for follow-up" },
];

export function ContactPage() {
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
              Contact
            </motion.span>
            <motion.h1 variants={revealItem} className="public-hero-title mt-5">
              Reach the OMSWD Office
            </motion.h1>
            <motion.p variants={revealItem} className="public-hero-lead mt-5 max-w-3xl">
              The online portal reduces back-and-forth, but office staff still handle case review,
              verification, and release coordination. Reach out for any questions.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Contact cards + Map */}
      <section className="container pb-[var(--landing-space-section)]">
        <motion.div
          className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={revealContainer}
        >
          {/* Left: info */}
          <div className="space-y-5">
            <motion.div variants={revealItem} className="landing-card overflow-hidden">
              <div className="h-1.5 bg-[linear-gradient(90deg,var(--landing-accent),var(--landing-highlight))]" />
              <div className="p-6">
                <p className="public-kicker">Office Details</p>
                <h2 className="mt-2 font-serif text-2xl font-bold">{officeContacts.office}</h2>
                <div className="mt-5 space-y-3">
                  {contactDetails.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="landing-soft-card flex items-start gap-3 p-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--landing-accent)]/10 text-[var(--landing-accent)]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--landing-muted)]">{label}</p>
                        <p className="mt-0.5 text-sm text-[var(--landing-ink)]">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div variants={revealItem} className="landing-card overflow-hidden">
              <div className="h-1.5 bg-[linear-gradient(90deg,var(--landing-accent),var(--landing-highlight))]" />
              <div className="p-6">
                <p className="public-kicker">Communication Channels</p>
                <h2 className="mt-2 font-serif text-xl font-bold">How to Reach Us</h2>
                <div className="mt-4 space-y-3">
                  {officeContacts.channels.map((channel) => (
                    <div key={channel} className="landing-soft-card flex items-start gap-3 p-4">
                      <Send className="mt-0.5 h-4 w-4 shrink-0 text-[var(--landing-accent)]" />
                      <p className="text-sm text-[var(--landing-muted)]">{channel}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: map */}
          <motion.div variants={revealItem} className="flex flex-col gap-5">
            <div className="map-section-wrapper flex-1 min-h-[360px]">
              <iframe
                title="OMSWD Pandan Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3922.0!2d122.0965!3d11.7272!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a5c5c1a0000001%3A0x0!2sPandan%2C+Antique!5e0!3m2!1sen!2sph!4v1"
                width="100%"
                height="100%"
                style={{ border: 0, display: "block", minHeight: "360px" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="landing-card p-6">
              <p className="font-semibold text-[var(--landing-ink)]">Need assistance online?</p>
              <p className="mt-1 text-sm text-[var(--landing-muted)]">Use the resident portal to submit and track your request without visiting the office.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button className="rounded-xl bg-[var(--landing-accent)] text-white hover:bg-[var(--landing-accent-strong)]" asChild>
                  <Link to="/request-assistance">Apply Online <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button variant="outline" className="rounded-xl border-[var(--landing-outline)] bg-[var(--landing-surface)] text-[var(--landing-ink)] hover:bg-[#f2ead7]" asChild>
                  <Link to="/register">Create Account</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
