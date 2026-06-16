import {
  ArrowLeft,
  Bell,
  CalendarDays,
  CheckCheck,
  ExternalLink,
  FileCheck2,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useResidentPortal } from "@/hooks/use-resident-portal";
import { queryKeys } from "@/lib/query-keys";
import { signOut } from "@/services/auth-service";
import {
  markAllResidentNotificationsRead,
  markResidentNotificationRead,
} from "@/services/resident-service";

const baseNav = [
  { to: "/resident", label: "Dashboard", icon: LayoutDashboard },
  { to: "/resident/application", label: "My Application", icon: FileCheck2 },
];

export function ResidentLayout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const portalQuery = useResidentPortal();
  const residentNav = baseNav;
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [pendingNotificationId, setPendingNotificationId] = useState<string | null>(null);
  const profileIsComplete = portalQuery.data?.profileIsComplete ?? true;
  const notifications = portalQuery.data?.notifications ?? [];
  const unreadNotifications = portalQuery.data?.unreadNotifications ?? 0;
  const latestNotifications = notifications.slice(0, 6);

  async function refreshPortalData() {
    await queryClient.invalidateQueries({
      queryKey: user ? queryKeys.resident.portal(user.id) : ["resident", "portal"],
    });
  }

  async function handleMarkNotificationRead(notificationId: string) {
    try {
      setPendingNotificationId(notificationId);
      await markResidentNotificationRead(notificationId);
      await refreshPortalData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update notification.");
    } finally {
      setPendingNotificationId((current) => (current === notificationId ? null : current));
    }
  }

  async function handleMarkAllNotificationsRead() {
    try {
      setIsMarkingAllRead(true);
      await markAllResidentNotificationsRead();
      await refreshPortalData();
      toast.success("All notifications marked as read.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to mark all notifications as read.");
    } finally {
      setIsMarkingAllRead(false);
    }
  }

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
                  <span className="flex-1">{label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="mt-auto space-y-3">
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
          <header className="border-b border-[var(--portal-outline)] bg-white/70 px-5 py-3 backdrop-blur md:px-8">
            <div className="flex items-center justify-end gap-2">
              <Button
                asChild
                type="button"
                variant="outline"
                className="relative border-[var(--portal-outline)] bg-white hover:bg-[var(--portal-surface-soft)]"
                aria-label="Open profile"
              >
                <Link to="/resident/profile">
                  <UserCircle2 className="h-4 w-4" />
                  {!profileIsComplete && (
                    <span
                      className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-500"
                      title="Profile incomplete"
                    />
                  )}
                </Link>
              </Button>

              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  className="border-[var(--portal-outline)] bg-white hover:bg-[var(--portal-surface-soft)]"
                  onClick={() => setNotificationsOpen((current) => !current)}
                  aria-label="Open notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadNotifications > 0 && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-semibold text-white">
                      {unreadNotifications > 9 ? "9+" : unreadNotifications}
                    </span>
                  )}
                </Button>

                {notificationsOpen && (
                  <div className="absolute right-0 z-20 mt-2 w-[min(94vw,24rem)] rounded-xl border border-[var(--portal-outline)] bg-white p-3 shadow-xl">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[var(--portal-ink)]">Notifications</p>
                        <p className="text-xs text-[var(--portal-muted)]">
                          {unreadNotifications > 0 ? `${unreadNotifications} unread` : "All caught up"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-[var(--portal-outline)]"
                        onClick={() => void handleMarkAllNotificationsRead()}
                        disabled={isMarkingAllRead || unreadNotifications === 0}
                      >
                        {isMarkingAllRead ? (
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCheck className="h-3.5 w-3.5" />
                        )}
                        Mark all read
                      </Button>
                    </div>

                    {latestNotifications.length > 0 ? (
                      <div className="max-h-[24rem] space-y-2 overflow-y-auto pr-1">
                        {latestNotifications.map((notification) => {
                          const target = resolveNotificationTarget(notification.linkUrl);
                          return (
                            <div
                              key={notification.id}
                              className="rounded-lg border border-[var(--portal-outline)] bg-[var(--portal-surface-soft)] p-2.5"
                            >
                              <div className="mb-1 flex items-start justify-between gap-3">
                                <p className="text-sm font-semibold text-[var(--portal-ink)]">{notification.title}</p>
                                {!notification.isRead && (
                                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                                )}
                              </div>
                              <p className="line-clamp-2 text-xs text-[var(--portal-muted)]">{notification.body}</p>
                              <p className="mt-1 text-[11px] text-[var(--portal-muted)]">{notification.createdAtLabel}</p>
                              <div className="mt-2 flex items-center gap-2">
                                {target.external ? (
                                  <a
                                    href={target.to}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--portal-accent)] hover:underline"
                                  >
                                    Open
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                ) : (
                                  <Link
                                    to={target.to}
                                    onClick={() => setNotificationsOpen(false)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--portal-accent)] hover:underline"
                                  >
                                    Open
                                  </Link>
                                )}
                                {!notification.isRead && (
                                  <button
                                    type="button"
                                    onClick={() => void handleMarkNotificationRead(notification.id)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--portal-muted)] hover:text-[var(--portal-ink)]"
                                    disabled={pendingNotificationId === notification.id}
                                  >
                                    {pendingNotificationId === notification.id ? (
                                      <LoaderCircle className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <CheckCheck className="h-3 w-3" />
                                    )}
                                    Mark read
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-[var(--portal-outline)] px-3 py-6 text-center text-sm text-[var(--portal-muted)]">
                        No notifications yet.
                      </div>
                    )}
                  </div>
                )}
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

function resolveNotificationTarget(linkUrl: string | null) {
  if (linkUrl) {
    return {
      to: linkUrl,
      external: /^https?:\/\//i.test(linkUrl),
    };
  }

  return {
    to: "/resident/application",
    external: false,
  };
}
