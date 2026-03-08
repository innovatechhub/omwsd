import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ClipboardList,
  FileBadge2,
  FileCheck2,
  FileText,
  Landmark,
  MapPinned,
  ShieldAlert,
} from "lucide-react";
import { Link } from "react-router-dom";

import requestIntakeIllustration from "@/assets/hero/request-intake.svg";
import residentTrackingIllustration from "@/assets/hero/resident-tracking.svg";
import verificationReviewIllustration from "@/assets/hero/verification-review.svg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { publicAnnouncements, publicServices } from "@/features/public";

const services = publicServices.slice(0, 3).map((service, index) => ({
  title: service.title,
  description: service.summary,
  icon: [Landmark, ShieldAlert, FileCheck2][index] ?? Landmark,
  slug: service.slug,
}));

const steps = [
  "Submit a request through the public portal.",
  "OMSWD staff validate residency and initial eligibility.",
  "Approved residents upload documentary requirements.",
  "Residents track updates through the resident portal.",
];

const submissionChecklist = [
  {
    title: "Personal and contact details",
    description:
      "Prepare your full name, contact number, birth date, civil status, and complete Pandan address before starting the form.",
    icon: ClipboardList,
  },
  {
    title: "Government ID and residency proof",
    description:
      "Keep a readable government-issued ID and proof of residency or barangay certification ready for verification.",
    icon: FileBadge2,
  },
  {
    title: "Supporting case documents",
    description:
      "Prepare medical records, billing statements, quotations, certifications, or other files related to the type of assistance you are requesting.",
    icon: FileText,
  },
  {
    title: "Clear request explanation",
    description:
      "Provide a clear explanation of your situation so OMSWD staff can review the request and determine the next required action faster.",
    icon: MapPinned,
  },
];

const heroSlides = [
  {
    image: requestIntakeIllustration,
    eyebrow: "Digital intake",
    title: "Guided online assistance requests",
    description:
      "Residents can submit structured requests with personal information, case details, and supporting files in one guided process.",
  },
  {
    image: verificationReviewIllustration,
    eyebrow: "Case review",
    title: "Staff verification and application review",
    description:
      "OMSWD staff can review requests, validate residency, inspect documents, and manage next-step actions from a central workflow.",
  },
  {
    image: residentTrackingIllustration,
    eyebrow: "Resident tracking",
    title: "Status updates and document follow-up",
    description:
      "Residents can return to the portal to monitor progress, respond to corrections, and stay informed throughout the application lifecycle.",
  },
];

export function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="pb-16">
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-hero-grid bg-[size:28px_28px] opacity-25" />
        <div className="container relative grid gap-12 py-16 md:py-24 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <Badge variant="secondary" className="bg-white/12 text-white">
              Government Service Platform
            </Badge>
            <div className="space-y-4">
              <h1 className="max-w-3xl font-serif text-4xl font-bold leading-tight md:text-6xl">
                Assistance requests, verification, and resident tracking in one system.
              </h1>
              <p className="max-w-2xl text-lg text-primary-foreground/85 md:text-xl">
                A modular OMSWD portal for public information, application intake, and
                administrative review.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/request-assistance">
                  Start request
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/25 bg-white/10 text-white hover:bg-white/20"
                asChild
              >
                <Link to="/services">View services</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="mx-auto w-full max-w-[620px] overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 text-white shadow-panel backdrop-blur lg:-translate-y-5 lg:max-w-[470px]"
          >
            <div className="relative h-full min-h-[470px] md:min-h-[500px]">
              {heroSlides.map((slide, index) => (
                <div
                  key={slide.title}
                  className={[
                    "absolute inset-0 transition-opacity duration-700",
                    index === activeSlide ? "opacity-100" : "pointer-events-none opacity-0",
                  ].join(" ")}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
                  <div className="absolute inset-0 grid gap-4 p-5 md:grid-rows-[minmax(185px,1fr)_minmax(160px,auto)] md:p-5">
                    <div className="flex min-h-[185px] items-center justify-center rounded-[1.45rem] bg-white/94 p-3 shadow-xl">
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="h-full w-full rounded-[1.1rem] object-contain"
                      />
                    </div>
                    <div className="min-h-[160px] rounded-[1.45rem] bg-primary p-5 shadow-lg ring-1 ring-white/12">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-foreground/72 md:text-sm">
                        {slide.eyebrow}
                      </p>
                      <h2 className="mt-3 font-serif text-[1.45rem] font-bold leading-[1.02] text-white md:text-[1.58rem]">
                        {slide.title}
                      </h2>
                      <p className="mt-3 max-w-lg text-[0.95rem] leading-5 text-white/84">
                        {slide.description}
                      </p>
                      <div className="mt-3 flex gap-2">
                        {heroSlides.map((slideItem, dotIndex) => (
                          <button
                            key={slideItem.title}
                            type="button"
                            aria-label={`Show ${slideItem.title}`}
                            onClick={() => setActiveSlide(dotIndex)}
                            className={[
                              "h-3 rounded-full transition-all",
                              dotIndex === activeSlide ? "w-9 bg-secondary" : "w-3 bg-white/40",
                            ].join(" ")}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container mt-8 grid gap-6 md:mt-10 md:grid-cols-3">
        {services.map(({ title, description, icon: Icon, slug }, index) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 + index * 0.08 }}
          >
            <Card className="h-full border-white/80 bg-white/95">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="px-0 text-primary" asChild>
                  <Link to={`/services/${slug}`}>
                    View details
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      <section className="container grid gap-6 py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="bg-[linear-gradient(160deg,rgba(255,255,255,0.96),rgba(239,246,255,0.9))]">
          <CardHeader>
            <CardTitle>Before you submit a request</CardTitle>
            <CardDescription>
              Prepare the core details and documents that OMSWD usually needs during intake.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {submissionChecklist.map(({ title, description, icon: Icon }) => (
              <div key={title} className="flex gap-4 rounded-2xl bg-white/80 p-4 shadow-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="mt-2 leading-6">{description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-primary/15">
          <CardHeader>
            <CardTitle>Resident journey</CardTitle>
            <CardDescription>
              The public site and request flow are now aligned around the actual portal process.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.map((step, index) => (
              <div key={step} className="flex gap-4 rounded-2xl bg-muted/60 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  {index + 1}
                </div>
                <p className="pt-2 text-sm font-medium">{step}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="container grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Latest public notices</CardTitle>
            <CardDescription>
              Residents should prepare for verification and document follow-up after submission.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {publicAnnouncements.map((announcement) => (
              <div key={announcement.slug} className="rounded-2xl bg-muted/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  {announcement.date}
                </p>
                <p className="mt-2 font-semibold">{announcement.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{announcement.summary}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-[linear-gradient(165deg,rgba(255,255,255,0.96),rgba(243,248,255,0.92))]">
          <CardHeader>
            <CardTitle>Ready to apply?</CardTitle>
            <CardDescription>
              Create an account, prepare your files, then submit a request through the portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" asChild>
              <Link to="/register">Create resident account</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/requirements">Review requirements</Link>
            </Button>
            <Button variant="ghost" className="w-full" asChild>
              <Link to="/announcements">Read announcements</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
