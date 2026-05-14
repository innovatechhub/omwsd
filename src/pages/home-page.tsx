import { AnimatePresence, motion, useInView } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookCheck,
  Calendar,
  ChevronRight,
  Clock,
  FileCheck2,
  HandHelping,
  HeartPulse,
  type LucideIcon,
  MapPin,
  MapPinHouse,
  NotebookPen,
  Phone,
  School,
  ShieldCheck,
  Siren,
  Stethoscope,
  Upload,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  faqItems,
  officeContacts,
  publicAnnouncements,
  publicServices,
  requirementsChecklist,
  siteStats,
  testimonials,
} from "@/features/public";

import beachfront from "@/assets/pandan/beachfront.jpg";
import municipalHall from "@/assets/pandan/municipal-hall.jpg";
import pandanSign from "@/assets/pandan/pandan-sign.jpg";

/* ─── animation variants ─── */
const revealContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.06 } },
};
const revealItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
};

/* ─── hero slides ─── */
const heroSlides = [
  {
    image: beachfront,
    headline: "Serving the People of Pandan",
    sub: "Your gateway to public assistance, social welfare programs, and community support.",
  },
  {
    image: municipalHall,
    headline: "Assistance Made Accessible",
    sub: "Apply online for medical, burial, food relief, and educational assistance from your home.",
  },
  {
    image: pandanSign,
    headline: "Building a Stronger Community",
    sub: "OMSWD Pandan is committed to transparent, fair, and compassionate public service.",
  },
];

/* ─── assistance icon map ─── */
const assistanceIconBySlug: Record<string, LucideIcon> = {
  "medical-assistance": Stethoscope,
  "burial-assistance": Siren,
  "food-relief": HandHelping,
  "educational-assistance": School,
};

const assistanceCards = ["medical-assistance", "burial-assistance"]
  .map((slug) => publicServices.find((s) => s.slug === slug))
  .filter((s): s is (typeof publicServices)[number] => Boolean(s))
  .map((s) => ({ ...s, icon: assistanceIconBySlug[s.slug] ?? HandHelping }));

const howItWorksSteps = [
  { title: "Submit Request Online", description: "Fill out the portal form with your personal details, address, and reason for assistance.", icon: NotebookPen },
  { title: "OMSWD Verifies & Reviews", description: "Staff checks eligibility, validates residency records, and requests clarifications when needed.", icon: ShieldCheck },
  { title: "Track Updates & Follow-ups", description: "Receive status updates in your account and submit any required supporting documents.", icon: Upload },
];

const faqPreview = faqItems.slice(0, 4);

/* ─── Animated counter ─── */
function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1800;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

/* ─── Hero Carousel ─── */
function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = heroSlides.length;

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setCurrent((c) => (c + 1) % total), 5000);
    return () => clearInterval(id);
  }, [paused, total]);

  const prev = () => setCurrent((c) => (c - 1 + total) % total);
  const next = () => setCurrent((c) => (c + 1) % total);

  return (
    <div
      className="hero-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={current}
          className="hero-carousel-slide"
          style={{ backgroundImage: `url(${heroSlides[current].image})` }}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
        >
          <div className="hero-carousel-overlay" />
          <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center text-white">
            <motion.div
              key={`text-${current}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="max-w-4xl"
            >
              <span className="mb-4 inline-block rounded-full border border-white/30 bg-white/15 px-5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] backdrop-blur-sm">
                Office of Municipal Social Welfare and Development
              </span>
              <h1 className="mt-4 font-serif text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
                {heroSlides[current].headline}
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/85 md:text-lg">
                {heroSlides[current].sub}
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button
                  size="lg"
                  className="rounded-xl bg-[var(--landing-highlight)] px-7 text-[var(--landing-ink)] hover:bg-yellow-300 font-semibold"
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
                  className="rounded-xl border-white/50 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                  asChild
                >
                  <Link to="/services">Browse Services</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Prev / Next */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/50"
        aria-label="Previous slide"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/50"
        aria-label="Next slide"
      >
        <ArrowRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2.5">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={[
              "h-2.5 rounded-full transition-all duration-300",
              i === current ? "w-7 bg-[var(--landing-highlight)]" : "w-2.5 bg-white/50 hover:bg-white/80",
            ].join(" ")}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Announcements Ticker ─── */
function AnnouncementsTicker() {
  const items = [...publicAnnouncements, ...publicAnnouncements];
  return (
    <div className="ticker-strip">
      <span className="ticker-label">Announcements</span>
      <div className="overflow-hidden flex-1">
        <div className="ticker-track">
          {items.map((item, i) => (
            <span key={i} className="px-8 text-sm font-medium opacity-90">
              {item.title}
              <span className="mx-6 opacity-40">|</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export function HomePage() {
  return (
    <div className="landing-page text-[var(--landing-ink)]">

      {/* ── Hero Carousel ── */}
      <HeroCarousel />

      {/* ── Ticker ── */}
      <AnnouncementsTicker />

      {/* ── Stats Section ── */}
      <section className="stats-section py-16">
        <div className="container">
          <motion.div
            className="grid grid-cols-2 gap-0 divide-x divide-white/15 md:grid-cols-4"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={revealContainer}
          >
            {siteStats.map(({ label, value, suffix }) => (
              <motion.div key={label} variants={revealItem} className="stat-card">
                <div className="stat-number">
                  <AnimatedCounter target={value} suffix={suffix} />
                </div>
                <div className="stat-label">{label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Services Section ── */}
      <section className="container py-[var(--landing-space-section)]">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={revealContainer}
        >
          <motion.div variants={revealItem} className="mb-10 text-center">
            <p className="public-kicker">Assistance Programs</p>
            <h2 className="mt-2 font-serif text-3xl font-bold md:text-4xl">Available Assistance Types</h2>
            <p className="mx-auto mt-3 max-w-xl text-[var(--landing-muted)]">
              OMSWD Pandan offers several assistance programs designed to support residents in times of need.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto w-full">
            {assistanceCards.map(({ title, summary, slug, icon: Icon }, i) => (
              <motion.article
                key={slug}
                variants={revealItem}
                transition={{ delay: i * 0.05 }}
                className="landing-card group flex h-full flex-col p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                whileHover={{ y: -4 }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--landing-accent)] text-white shadow-lg">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-xl font-bold">{title}</h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-[var(--landing-muted)]">{summary}</p>
                <Link
                  to={`/services/${slug}`}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--landing-accent)] hover:gap-2.5 transition-all"
                >
                  View details <ChevronRight className="h-4 w-4" />
                </Link>
              </motion.article>
            ))}
          </div>

          <motion.div variants={revealItem} className="mt-8 text-center">
            <Button
              variant="outline"
              className="rounded-xl border-[var(--landing-outline)] bg-[var(--landing-surface)] text-[var(--landing-ink)] hover:bg-[#f2ead7]"
              asChild
            >
              <Link to="/services">
                View All Services <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      <hr className="section-divider" />

      {/* ── How It Works — Timeline ── */}
      <section className="container py-[var(--landing-space-section)]">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={revealContainer}
        >
          <motion.div variants={revealItem} className="mb-12 text-center">
            <p className="public-kicker">How It Works</p>
            <h2 className="mt-2 font-serif text-3xl font-bold md:text-4xl">Three Simple Steps</h2>
            <p className="mx-auto mt-3 max-w-xl text-[var(--landing-muted)]">
              From submission to approval — here's how the assistance process works.
            </p>
          </motion.div>

          {/* Desktop timeline */}
          <div className="hidden md:block">
            {/* Icons row with connecting line */}
            <div className="relative flex items-center justify-between">
              {/* Full-width connecting line behind the circles */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-[var(--landing-accent)] via-[var(--landing-highlight)] to-[var(--landing-accent)] opacity-40" />

              {howItWorksSteps.map(({ title, icon: Icon }, i) => (
                <motion.div
                  key={title}
                  variants={revealItem}
                  className="relative z-10 flex flex-col items-center"
                  style={{ flex: 1 }}
                >
                  {/* Outer ring */}
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--landing-accent)]/15 ring-1 ring-[var(--landing-accent)]/30">
                    {/* Inner circle */}
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--landing-accent)] text-white shadow-lg">
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <span className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-[var(--landing-accent)]">
                    Step {i + 1}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Text row below */}
            <div className="mt-6 flex">
              {howItWorksSteps.map(({ title, description }) => (
                <motion.div
                  key={title}
                  variants={revealItem}
                  className="flex-1 px-6 text-center"
                >
                  <h3 className="font-bold text-lg text-[var(--landing-ink)]">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--landing-muted)]">{description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mobile steps */}
          <div className="flex flex-col gap-6 md:hidden">
            {howItWorksSteps.map(({ title, description, icon: Icon }, i) => (
              <motion.div key={title} variants={revealItem} className="landing-soft-card flex gap-4 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--landing-accent)] text-white font-bold text-lg shadow">
                  {i + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-[var(--landing-accent)]" />
                    <p className="font-semibold">{title}</p>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[var(--landing-muted)]">{description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div variants={revealItem} className="mt-10 text-center">
            <Button
              size="lg"
              className="rounded-xl bg-[var(--landing-accent)] px-8 text-white hover:bg-[var(--landing-accent-strong)]"
              asChild
            >
              <Link to="/request-assistance">
                Start Your Application <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-[#f7f3e9] py-[var(--landing-space-section)]">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            variants={revealContainer}
          >
            <motion.div variants={revealItem} className="mb-10 text-center">
              <p className="public-kicker">Community Voices</p>
              <h2 className="mt-2 font-serif text-3xl font-bold md:text-4xl">What Residents Say</h2>
            </motion.div>
            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map(({ quote, name, barangay, initials }) => (
                <motion.div key={name} variants={revealItem} className="testimonial-card">
                  <p className="mt-6 text-[0.95rem] leading-7 text-[var(--landing-muted)]">{quote}</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--landing-accent)] text-white text-sm font-bold">
                      {initials}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{name}</p>
                      <p className="text-xs text-[var(--landing-muted)]">{barangay}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Announcements ── */}
      <section className="container py-[var(--landing-space-section)]">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={revealContainer}
        >
          <motion.div variants={revealItem} className="mb-10 flex items-end justify-between">
            <div>
              <p className="public-kicker">Latest Updates</p>
              <h2 className="mt-2 font-serif text-3xl font-bold md:text-4xl">Announcements</h2>
            </div>
            <Link
              to="/announcements"
              className="hidden items-center gap-1 text-sm font-semibold text-[var(--landing-accent)] hover:gap-2 transition-all md:flex"
            >
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-3">
            {publicAnnouncements.map(({ slug, title, date, summary }) => (
              <motion.article key={slug} variants={revealItem} className="landing-card flex flex-col p-6 hover:-translate-y-1 transition-transform duration-300">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--landing-muted)] uppercase tracking-wider">
                  <Calendar className="h-3.5 w-3.5" />
                  {date}
                </div>
                <h3 className="mt-3 text-base font-bold leading-snug">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-7 text-[var(--landing-muted)]">{summary}</p>
                <Link
                  to="/announcements"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--landing-accent)] hover:gap-2 transition-all"
                >
                  Read more <ChevronRight className="h-4 w-4" />
                </Link>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </section>

      <hr className="section-divider" />

      {/* ── Requirements + FAQ ── */}
      <section className="container grid gap-6 py-[var(--landing-space-section)] lg:grid-cols-2">
        <motion.div
          className="landing-card p-6 md:p-8"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={revealContainer}
        >
          <motion.div variants={revealItem}>
            <p className="public-kicker">Requirements</p>
            <h2 className="mt-2 font-serif text-2xl font-bold md:text-3xl">Prepare Before You Submit</h2>
          </motion.div>
          <div className="mt-6 space-y-4">
            {requirementsChecklist.map((group) => (
              <motion.div key={group.title} variants={revealItem} className="landing-soft-card p-4">
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
              </motion.div>
            ))}
          </div>
          <motion.div variants={revealItem}>
            <Button variant="outline" className="mt-6 rounded-xl border-[var(--landing-outline)] bg-[var(--landing-surface)] text-[var(--landing-ink)] hover:bg-[#f2ead7]" asChild>
              <Link to="/requirements">Full Requirements Checklist <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          className="landing-card p-6 md:p-8"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={revealContainer}
        >
          <motion.div variants={revealItem}>
            <p className="public-kicker">FAQ</p>
            <h2 className="mt-2 font-serif text-2xl font-bold md:text-3xl">Common Questions</h2>
          </motion.div>
          <div className="mt-6 space-y-3">
            {faqPreview.map((item) => (
              <motion.article key={item.question} variants={revealItem} className="landing-soft-card p-4">
                <p className="flex items-start gap-2 font-semibold text-[var(--landing-ink)]">
                  <BookCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--landing-accent)]" />
                  {item.question}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--landing-muted)]">{item.answer}</p>
              </motion.article>
            ))}
          </div>
          <motion.div variants={revealItem}>
            <Button variant="outline" className="mt-6 rounded-xl border-[var(--landing-outline)] bg-[var(--landing-surface)] text-[var(--landing-ink)] hover:bg-[#f2ead7]" asChild>
              <Link to="/faq">Open Full FAQ <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Map + Contact ── */}
      <section className="bg-[#f7f3e9] py-[var(--landing-space-section)]">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            variants={revealContainer}
          >
            <motion.div variants={revealItem} className="mb-10 text-center">
              <p className="public-kicker">Find Us</p>
              <h2 className="mt-2 font-serif text-3xl font-bold md:text-4xl">Office Location & Contact</h2>
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
              <motion.div variants={revealItem} className="map-section-wrapper h-[360px] lg:h-auto">
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
              </motion.div>

              <motion.div variants={revealItem} className="landing-card p-6 md:p-8 flex flex-col gap-5">
                <div>
                  <p className="public-kicker mb-2">Contact OMSWD</p>
                  <h3 className="font-serif text-xl font-bold">Office of Municipal Social Welfare and Development</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 text-sm text-[var(--landing-muted)]">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--landing-accent)]" />
                    <span>{officeContacts.municipality}</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-[var(--landing-muted)]">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--landing-accent)]" />
                    <span>{officeContacts.hours}</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-[var(--landing-muted)]">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--landing-accent)]" />
                    <span>Contact via official channels at the office</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-[var(--landing-muted)]">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-[var(--landing-accent)]" />
                    <span>Walk-in assistance available during office hours</span>
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-3">
                  <Button className="rounded-xl bg-[var(--landing-accent)] text-white hover:bg-[var(--landing-accent-strong)] w-full" asChild>
                    <Link to="/contact">
                      <MapPinHouse className="h-4 w-4" />
                      Full Contact Details
                    </Link>
                  </Button>
                  <Button variant="outline" className="rounded-xl border-[var(--landing-outline)] bg-[var(--landing-surface)] text-[var(--landing-ink)] hover:bg-[#f2ead7] w-full" asChild>
                    <Link to="/register">
                      <HeartPulse className="h-4 w-4" />
                      Create Resident Account
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="stats-section py-16">
        <div className="container text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-serif text-3xl font-bold md:text-4xl">Ready to Request Assistance?</h2>
            <p className="mx-auto mt-4 max-w-lg text-white/80">
              Create a resident account and submit your request online. The OMSWD team will review and guide you through every step.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button
                size="lg"
                className="rounded-xl bg-[var(--landing-highlight)] px-8 text-[var(--landing-ink)] hover:bg-yellow-300 font-semibold"
                asChild
              >
                <Link to="/request-assistance">Apply Now <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl border-white/40 bg-white/10 text-white hover:bg-white/20"
                asChild
              >
                <Link to="/about">Learn About OMSWD</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
