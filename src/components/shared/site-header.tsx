import { LogOut, Menu } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import { getDefaultRouteForAuthenticatedUser } from "@/features/auth/route-guards";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "@/services/auth-service";

const navigation = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/requirements", label: "Requirements" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const navigate = useNavigate();
  const { user, role } = useAuth();

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
    <header className="sticky top-0 z-40 border-b border-[color:var(--landing-outline)] bg-[rgba(255,253,247,0.95)] text-[color:var(--landing-ink)] backdrop-blur">
      <div className="container flex h-[var(--public-header-height)] items-center justify-between gap-4 md:gap-6">
        <NavLink to="/" className="flex min-w-0 items-center gap-3">
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

        <nav className="hidden items-center gap-5 lg:flex">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
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

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-xl px-4 text-[color:var(--landing-ink)]"
                asChild
              >
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
              <Button
                variant="secondary"
                size="sm"
                className="rounded-xl px-4 text-[color:var(--landing-ink)]"
                asChild
              >
                <NavLink to="/request-assistance">Request assistance</NavLink>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-[color:var(--landing-outline)] bg-white/80 text-[color:var(--landing-ink)] hover:bg-white"
                asChild
              >
                <NavLink to="/login">Sign in</NavLink>
              </Button>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl text-[color:var(--landing-ink)] hover:bg-[color:var(--landing-outline)]/40 md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
