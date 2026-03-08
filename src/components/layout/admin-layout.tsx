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
    <div className="min-h-screen bg-stone-100">
      <div className="mx-auto grid min-h-screen max-w-[1680px] lg:grid-cols-[300px_1fr]">
        <aside className="border-b border-primary/10 bg-[linear-gradient(180deg,rgba(20,17,94,1),rgba(17,15,78,1))] p-6 text-primary-foreground lg:border-b-0 lg:border-r">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <BrandMark size="sm" />
              <div>
                <p className="font-serif text-3xl font-bold">Admin Portal</p>
                <p className="text-sm text-primary-foreground/78">
                  Operations, verification, and request oversight
                </p>
              </div>
            </div>
            <nav className="space-y-2">
              {adminNav.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/admin"}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
                      isActive
                        ? "bg-secondary text-secondary-foreground shadow-sm"
                        : "text-primary-foreground/82 hover:bg-white/10 hover:text-white",
                    ].join(" ")
                  }
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="border-b border-primary/10 bg-white/90 px-6 py-5 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-primary/72">
                  OMSWD Pandan internal workspace
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Case intake, verification, approvals, and resident management
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <NavLink
                  to="/"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Public site
                </NavLink>
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 md:p-8 xl:p-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
