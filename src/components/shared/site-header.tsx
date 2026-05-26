import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import { getDefaultRouteForAuthenticatedUser } from "@/features/auth/route-guards";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "@/services/auth-service";

const navigation = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/requirements", label: "Requirements" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    try {
      await signOut();
      toast.success("Signed out successfully.");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sign out.");
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[color:var(--landing-outline)] bg-[rgba(255,253,247,0.96)] text-[color:var(--landing-ink)] backdrop-blur">
        <div className="container flex h-[var(--public-header-height)] items-center justify-between gap-4 md:gap-6">
          {/* Brand */}
          <NavLink to="/" className="flex min-w-0 items-center gap-3" onClick={() => setMobileOpen(false)}>
            <BrandMark size="sm" />
            <div className="min-w-0">
              <p className="truncate font-serif text-lg font-bold leading-none md:text-[1.42rem]">
                OMSWD Pandan
              </p>
              <p className="truncate text-xs text-[color:var(--landing-muted)] md:text-sm">
                Assistance Request System
              </p>
            </div>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-5 lg:flex">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  [
                    "text-[0.95rem] font-semibold tracking-[0.01em] transition-colors",
                    isActive
                      ? "text-[color:var(--landing-ink)]"
                      : "text-[color:var(--landing-muted)] hover:text-[color:var(--landing-ink)]",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop auth buttons */}
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <Button variant="secondary" size="sm" className="rounded-xl px-4 text-[color:var(--landing-ink)]" asChild>
                  <NavLink to={getDefaultRouteForAuthenticatedUser(role)}>Open dashboard</NavLink>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-[color:var(--landing-outline)] bg-white/80 text-[color:var(--landing-ink)] hover:bg-white"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" size="sm" className="rounded-xl px-4 text-[color:var(--landing-ink)]" asChild>
                  <NavLink to="/request-assistance">Request assistance</NavLink>
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl border-[color:var(--landing-outline)] bg-white/80 text-[color:var(--landing-ink)] hover:bg-white" asChild>
                  <NavLink to="/login">Sign in</NavLink>
                </Button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl text-[color:var(--landing-ink)] hover:bg-[color:var(--landing-outline)]/40 lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              className="fixed inset-x-0 top-[var(--public-header-height)] z-40 border-b border-[var(--landing-outline)] bg-[var(--landing-surface)] p-5 shadow-2xl lg:hidden"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <nav className="flex flex-col gap-1">
                {navigation.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      [
                        "rounded-xl px-4 py-3 text-base font-semibold transition-colors",
                        isActive
                          ? "bg-[var(--landing-accent)] text-white"
                          : "text-[var(--landing-ink)] hover:bg-[var(--landing-outline)]/40",
                      ].join(" ")
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="mt-5 flex flex-col gap-2 border-t border-[var(--landing-outline)] pt-5">
                {user ? (
                  <>
                    <Button className="rounded-xl bg-[var(--landing-accent)] text-white hover:bg-[var(--landing-accent-strong)]" asChild>
                      <NavLink to={getDefaultRouteForAuthenticatedUser(role)} onClick={() => setMobileOpen(false)}>
                        Open dashboard
                      </NavLink>
                    </Button>
                    <Button variant="outline" className="rounded-xl border-[var(--landing-outline)]" onClick={() => { handleSignOut(); setMobileOpen(false); }}>
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="rounded-xl bg-[var(--landing-accent)] text-white hover:bg-[var(--landing-accent-strong)]" asChild>
                      <NavLink to="/request-assistance" onClick={() => setMobileOpen(false)}>
                        Request assistance
                      </NavLink>
                    </Button>
                    <Button variant="outline" className="rounded-xl border-[var(--landing-outline)]" asChild>
                      <NavLink to="/login" onClick={() => setMobileOpen(false)}>Sign in</NavLink>
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
