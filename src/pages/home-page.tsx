import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  HeartPulse,
  MapPin,
  MapPinHouse,
  Phone,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  officeContacts,
  publicAnnouncements,
} from "@/features/public";

import beachfront from "@/assets/pandan/beachfront.jpg";
import municipalHall from "@/assets/pandan/municipal-hall.jpg";
import pandanSign from "@/assets/pandan/pandan-sign.jpg";

/* Animation variants */
const revealContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.06 } },
};
const revealItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
};

/* Hero slides */
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

/* Hero carousel */
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

/* Announcements ticker */
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

/* Main page */
export function HomePage() {
  return (
    <div className="landing-page text-[var(--landing-ink)]">

      {/* Hero carousel */}
      <HeroCarousel />

      {/* Ticker */}
      <AnnouncementsTicker />

      {/* Map + contact */}
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

      {/* CTA banner */}
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
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
