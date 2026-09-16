import {
  ArrowLeft,
  BarChart3,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "@/services/auth-service";
import type { AppRole } from "@/types/auth";

type AdminNavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: AppRole[];
};

const operationalRoles: AppRole[] = ["admin", "super_admin", "social_worker"];
const administratorRoles: AppRole[] = ["admin", "super_admin"];

const adminNav: AdminNavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: administratorRoles },
  { to: "/admin/applications", label: "Applications", icon: FileText, roles: operationalRoles },
  { to: "/admin/residents", label: "Residents", icon: Users, roles: operationalRoles },
  { to: "/admin/sectors", label: "Appointments", icon: UserCheck, roles: operationalRoles },
  { to: "/admin/reports", label: "Reports", icon: BarChart3, roles: operationalRoles },
  { to: "/admin/settings", label: "Settings", icon: Settings, roles: administratorRoles },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const { user, profile, role } = useAuth();
  const isStaff = role === "social_worker";
  const portalTitle = isStaff ? "Staff Portal" : "Admin Portal";
  const accessLabel = isStaff ? "Staff Access" : "Admin Access";
  const fallbackAccountLabel = isStaff ? "Staff account" : "Admin account";
  const visibleNav = role ? adminNav.filter((item) => item.roles.includes(role)) : [];

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
      <div className="grid min-h-screen lg:grid-cols-[252px_1fr]">
        <aside className="border-b border-[var(--portal-outline)] bg-white p-4 lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col gap-6 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <BrandMark size="sm" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--portal-muted)]">
                    OMSWD Pandan
                  </p>
                  <p className="text-xl font-semibold text-[var(--portal-ink)]">{portalTitle}</p>
                </div>
              </div>
              <div className="border-t border-[var(--portal-outline)] pt-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-muted)]">
                  {accessLabel}
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm font-medium text-[var(--portal-ink)]">
                  <ShieldCheck className="h-4 w-4 text-[var(--portal-accent)]" />
                  {profile?.full_name ?? user?.email ?? fallbackAccountLabel}
                </p>
                {user?.email && profile?.full_name && (
                  <p className="mt-0.5 truncate text-xs text-[var(--portal-muted)]">{user.email}</p>
                )}
              </div>
            </div>

            <nav className="grid gap-1.5">
              {visibleNav.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/admin"}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
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
          <header className="border-b border-[var(--portal-outline)] bg-white px-5 py-3 md:px-8">
            <div className="flex min-h-10 items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[var(--portal-ink)]">{portalTitle}</p>
                <p className="text-xs text-[var(--portal-muted)]">OMSWD Pandan operations</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-[var(--portal-ink)]">
                  {profile?.full_name ?? fallbackAccountLabel}
                </p>
                <p className="text-xs text-[var(--portal-muted)]">{accessLabel}</p>
              </div>
            </div>
          </header>
          <main className="flex-1 p-5 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
