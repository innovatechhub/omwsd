import {
  ArrowLeft,
  Bell,
  CircleHelp,
  FileCheck2,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Upload,
  UserCircle2,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useResidentPortal } from "@/hooks/use-resident-portal";
import { signOut } from "@/services/auth-service";

const residentNav = [
  { to: "/resident", label: "Dashboard", icon: LayoutDashboard },
  { to: "/resident/application", label: "My Application", icon: FileCheck2 },
  { to: "/resident/uploads", label: "Upload Requirements", icon: Upload },
  { to: "/resident/notifications", label: "Notifications", icon: Bell },
  { to: "/resident/profile", label: "Profile", icon: UserCircle2 },
  { to: "/resident/settings", label: "Settings", icon: Settings },
];

export function ResidentLayout() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const portalQuery = useResidentPortal();

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
      <div className="mx-auto grid min-h-screen w-full max-w-[1700px] lg:grid-cols-[300px_1fr]">
        <aside className="border-b border-[var(--portal-outline)] bg-[rgba(255,255,255,0.8)] p-4 backdrop-blur lg:border-b-0 lg:border-r lg:p-6">
          <div className="flex h-full flex-col gap-6 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
            <div className="portal-card space-y-3 p-4">
              <div className="flex items-center gap-3">
                <BrandMark size="sm" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--portal-muted)]">
                    OMSWD Pandan
                  </p>
                  <p className="text-xl font-semibold text-[var(--portal-ink)]">Resident Portal</p>
                </div>
              </div>
              <div className="portal-soft-card p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-muted)]">
                  Resident Access
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm font-medium text-[var(--portal-ink)]">
                  <ShieldCheck className="h-4 w-4 text-[var(--portal-accent)]" />
                  {profile?.full_name ?? "Resident account"}
                </p>
                {portalQuery.data?.application?.referenceNumber && (
                  <p className="mt-1 text-xs text-[var(--portal-muted)]">
                    Ref: <span className="font-semibold text-[var(--portal-accent)]">{portalQuery.data.application.referenceNumber}</span>
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="portal-pill px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]">
                  Track Status
                </span>
                <span className="portal-pill px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]">
                  Upload Docs
                </span>
              </div>
            </div>

            <nav className="grid gap-1.5" aria-label="Resident portal navigation">
              {residentNav.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/resident"}
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

            <div className="mt-auto space-y-3">
              <div className="portal-soft-card p-3 text-sm text-[var(--portal-muted)]">
                <p className="mb-1 flex items-center gap-2 font-medium text-[var(--portal-ink)]">
                  <CircleHelp className="h-4 w-4 text-[var(--portal-accent)]" />
                  Portal tip
                </p>
                Check notifications for follow-up requests before your next upload.
              </div>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-[var(--portal-outline)] bg-white/70 text-[var(--portal-ink)] hover:bg-white"
              >
                <NavLink to="/">
                  <ArrowLeft className="h-4 w-4" />
                  Back to public site
                </NavLink>
              </Button>
              <Button
                onClick={handleSignOut}
                className="w-full justify-start bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-col">
          <main className="flex-1 p-5 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
