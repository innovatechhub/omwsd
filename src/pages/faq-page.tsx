import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown, HelpCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { faqItems } from "@/features/public";

const revealContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const revealItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

function FaqAccordion({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      variants={revealItem}
      className="landing-card overflow-hidden"
    >
      <button
        className="flex w-full items-start justify-between gap-4 p-5 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="flex items-start gap-3 font-semibold text-[var(--landing-ink)]">
          <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--landing-accent)]" />
          {question}
        </span>
        <ChevronDown
          className={[
            "mt-0.5 h-5 w-5 shrink-0 text-[var(--landing-muted)] transition-transform duration-300",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 pt-0 text-sm leading-7 text-[var(--landing-muted)] border-t border-[var(--landing-outline)]  pt-4">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FaqPage() {
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
              FAQ
            </motion.span>
            <motion.h1 variants={revealItem} className="public-hero-title mt-5">
              Frequently Asked Questions
            </motion.h1>
            <motion.p variants={revealItem} className="public-hero-lead mt-5 max-w-3xl">
              Common questions about the OMSWD Pandan request workflow — a quick guide before creating
              an account, preparing documents, and starting a request.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* FAQ accordion */}
      <section className="container pb-[var(--landing-space-section)]">
        <motion.div
          className="mx-auto max-w-3xl space-y-3"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={revealContainer}
        >
          {faqItems.map((item) => (
            <FaqAccordion key={item.question} question={item.question} answer={item.answer} />
          ))}
        </motion.div>
      </section>

      {/* Still have questions */}
      <section className="bg-[#f7f3e9] py-[var(--landing-space-section)]">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-[var(--landing-accent)] text-white shadow-xl mb-5">
              <HelpCircle className="h-8 w-8" />
            </div>
            <h2 className="font-serif text-3xl font-bold">Still Have Questions?</h2>
            <p className="mt-4 text-[var(--landing-muted)]">
              Visit the OMSWD office or check the contact page for direct communication channels.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" className="rounded-xl bg-[var(--landing-accent)] px-7 text-white hover:bg-[var(--landing-accent-strong)]" asChild>
                <Link to="/contact">Contact OMSWD <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl border-[var(--landing-outline)] bg-[var(--landing-surface)] text-[var(--landing-ink)] hover:bg-[#f2ead7]" asChild>
                <Link to="/request-assistance">Apply for Assistance</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
