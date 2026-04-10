import {
  ArrowLeft,
  BarChart3,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import { signOut } from "@/services/auth-service";

const adminNav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/applications", label: "Applications", icon: FileText },
  { to: "/admin/residents", label: "Residents", icon: Users },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout() {
  const navigate = useNavigate();

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
    <div className="portal-shell min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-[var(--portal-outline)] bg-[rgba(255,255,255,0.75)] p-4 backdrop-blur lg:border-b-0 lg:border-r lg:p-6">
          <div className="flex h-full flex-col gap-6 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
            <div className="portal-card space-y-3 p-4">
              <div className="flex items-center gap-3">
                <BrandMark size="sm" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--portal-muted)]">
                    OMSWD Pandan
                  </p>
                  <p className="text-xl font-semibold text-[var(--portal-ink)]">Admin Portal</p>
                </div>
              </div>
              <p className="text-sm text-[var(--portal-muted)]">
                Manage application review, resident accounts, and operational settings.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="portal-pill px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]">
                  Case Review
                </span>
                <span className="portal-pill px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]">
                  Verification
                </span>
              </div>
            </div>

            <nav className="grid gap-1.5">
              {adminNav.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/admin"}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "portal-nav-link-active"
                        : "border-transparent text-[var(--portal-muted)] hover:border-[var(--portal-outline)] hover:bg-[var(--portal-surface-soft)] hover:text-[var(--portal-ink)]",
                    ].join(" ")
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="mt-auto grid gap-2">
              <Button
                asChild
                variant="outline"
                className="justify-start border-[var(--portal-outline)] bg-white/70 text-[var(--portal-ink)] hover:bg-white"
              >
                <NavLink to="/">
                  <ArrowLeft className="h-4 w-4" />
                  Public site
                </NavLink>
              </Button>
              <Button
                onClick={handleSignOut}
                className="justify-start bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="border-b border-[var(--portal-outline)] bg-[rgba(255,255,255,0.76)] px-5 py-4 backdrop-blur md:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--portal-muted)]">
              Internal Workspace
            </p>
            <p className="mt-1 text-sm text-[var(--portal-muted)]">
              Intake, verification, approvals, and resident support
            </p>
          </header>

          <main className="flex-1 p-5 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
