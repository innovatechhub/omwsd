import {
  ArrowLeft,
  Bell,
  CircleHelp,
  FileCheck2,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Upload,
  UserCircle2,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "@/services/auth-service";

const residentNav = [
  { to: "/resident", label: "Dashboard", icon: LayoutDashboard },
  { to: "/resident/application", label: "My Application", icon: FileCheck2 },
  { to: "/resident/uploads", label: "Upload Requirements", icon: Upload },
  { to: "/resident/notifications", label: "Notifications", icon: Bell },
  { to: "/resident/profile", label: "Profile", icon: UserCircle2 },
];

export function ResidentLayout() {
  const navigate = useNavigate();
  const { profile } = useAuth();

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
      <header className="border-b border-primary/10 bg-white/90 backdrop-blur">
        <div className="container flex flex-col gap-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <BrandMark size="sm" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/75">
                OMSWD Pandan
              </p>
              <p className="font-serif text-2xl font-bold text-primary">Resident Portal</p>
              <p className="text-sm text-muted-foreground">
                {profile?.full_name ?? "Authenticated resident account"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <NavLink
              to="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to public site
            </NavLink>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <div className="container grid gap-6 py-8 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4">
          <div className="panel overflow-hidden bg-[linear-gradient(145deg,rgba(20,17,94,1),rgba(39,36,126,0.94))] p-5 text-primary-foreground">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12">
                <ShieldCheck className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/72">
                  Resident Access
                </p>
                <p className="mt-1 font-semibold">
                  {profile?.full_name ?? "Resident account"}
                </p>
              </div>
            </div>
          </div>

          <div className="panel h-fit p-4">
            <nav className="space-y-2">
              {residentNav.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/resident"}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground hover:bg-muted hover:text-primary",
                    ].join(" ")
                  }
                >
                  <div
                    className={[
                      "flex h-9 w-9 items-center justify-center rounded-2xl",
                      "bg-white/10",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="panel p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
                <CircleHelp className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Portal tip</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Check notifications regularly. Any request for corrected or additional
                  files will appear there first.
                </p>
              </div>
            </div>
          </div>
        </aside>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
