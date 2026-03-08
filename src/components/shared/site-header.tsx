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
    <header className="sticky top-0 z-30 border-b border-white/20 bg-primary/95 text-primary-foreground backdrop-blur">
      <div className="container flex h-20 items-center justify-between gap-6">
        <NavLink to="/" className="flex items-center gap-3">
          <BrandMark size="sm" />
          <div>
            <p className="font-serif text-lg font-bold leading-none">OMSWD Pandan</p>
            <p className="text-sm text-primary-foreground/80">
              Assistance Request System
            </p>
          </div>
        </NavLink>

        <nav className="hidden items-center gap-6 md:flex">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "text-sm font-semibold transition-opacity hover:opacity-100",
                  isActive ? "opacity-100" : "opacity-75",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Button variant="secondary" asChild>
                <NavLink to={getDefaultRouteForAuthenticatedUser(role)}>Open dashboard</NavLink>
              </Button>
              <Button
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" asChild>
                <NavLink to="/request-assistance">Request assistance</NavLink>
              </Button>
              <Button
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
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
          className="text-white hover:bg-white/10 md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
