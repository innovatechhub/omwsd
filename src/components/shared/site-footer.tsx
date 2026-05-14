import { Clock3, ExternalLink, MapPin, Phone, Shield } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { BrandMark } from "@/components/shared/brand-mark";
import { officeContacts } from "@/features/public";

const quickLinks = [
  { to: "/about", label: "About OMSWD" },
  { to: "/services", label: "Our Services" },
  { to: "/requirements", label: "Requirements" },
  { to: "/announcements", label: "Announcements" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact Us" },
];

const serviceLinks = [
  { to: "/services/medical-assistance", label: "Medical Assistance" },
  { to: "/services/burial-assistance", label: "Burial Assistance" },
  { to: "/services/food-relief", label: "Food Relief" },
  { to: "/services/educational-assistance", label: "Educational Assistance" },
];

const portalLinks = [
  { to: "/register", label: "Create Account" },
  { to: "/login", label: "Resident Sign In" },
  { to: "/request-assistance", label: "Apply for Assistance" },
  { to: "/privacy-policy", label: "Privacy Policy" },
];

export function SiteFooter() {
  return (
    <footer
      style={{
        background: "linear-gradient(160deg, var(--landing-accent-strong) 0%, #0a2a4a 60%, #07203a 100%)",
        color: "white",
      }}
    >
      {/* Top gold accent line */}
      <div className="h-1 bg-[linear-gradient(90deg,var(--landing-accent),var(--landing-highlight),var(--landing-accent))]" />

      {/* Main grid */}
      <div className="container grid gap-10 py-14 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">

        {/* Brand + contact */}
        <section className="space-y-5">
          <div className="flex items-center gap-4">
            <BrandMark size="lg" />
            <div>
              <p className="font-serif text-base font-bold text-white leading-tight">OMSWD Pandan</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                Assistance Request System
              </p>
            </div>
          </div>

          <p className="text-sm leading-7 max-w-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
            The Office of Municipal Social Welfare and Development in Pandan, Antique provides
            social protection programs and assistance services for residents.
          </p>

          <div className="space-y-3 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--landing-highlight)" }} />
              <span>{officeContacts.municipality}</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Clock3 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--landing-highlight)" }} />
              <span>{officeContacts.hours}</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Phone className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--landing-highlight)" }} />
              <span>Contact via municipal office</span>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section>
          <p
            className="text-xs font-bold uppercase tracking-[0.18em] mb-5"
            style={{ color: "var(--landing-highlight)" }}
          >
            Quick Links
          </p>
          <ul className="space-y-3">
            {quickLinks.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className="text-sm transition-colors hover:text-white"
                  style={{ color: "rgba(255,255,255,0.72)" }}
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </section>

        {/* Services */}
        <section>
          <p
            className="text-xs font-bold uppercase tracking-[0.18em] mb-5"
            style={{ color: "var(--landing-highlight)" }}
          >
            Services
          </p>
          <ul className="space-y-3">
            {serviceLinks.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="text-sm transition-colors hover:text-white"
                  style={{ color: "rgba(255,255,255,0.72)" }}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Resident Portal */}
        <section>
          <p
            className="text-xs font-bold uppercase tracking-[0.18em] mb-5"
            style={{ color: "var(--landing-highlight)" }}
          >
            Resident Portal
          </p>
          <ul className="space-y-3">
            {portalLinks.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="text-sm transition-colors hover:text-white"
                  style={{ color: "rgba(255,255,255,0.72)" }}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <div
            className="mt-6 rounded-2xl border p-4"
            style={{
              borderColor: "rgba(242,193,79,0.25)",
              background: "rgba(242,193,79,0.08)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4" style={{ color: "var(--landing-highlight)" }} />
              <p
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "var(--landing-highlight)" }}
              >
                Secure Portal
              </p>
            </div>
            <p className="text-xs leading-5" style={{ color: "rgba(255,255,255,0.6)" }}>
              All data is protected. Resident accounts use secure authentication and role-based access control.
            </p>
          </div>
        </section>
      </div>

      {/* Bottom bar */}
      <div
        style={{ borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)" }}
      >
        <div
          className="container flex flex-col gap-2 py-4 text-xs md:flex-row md:items-center md:justify-between"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          <p>
            &copy; {new Date().getFullYear()} Office of Municipal Social Welfare and Development, Pandan, Antique.
          </p>
          <div className="flex items-center gap-4">
            <Link
              to="/privacy-policy"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              Privacy Policy <ExternalLink className="h-3 w-3" />
            </Link>
            <span style={{ opacity: 0.3 }}>|</span>
            <span>Republic of the Philippines</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
