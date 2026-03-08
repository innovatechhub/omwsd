import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileWarning,
  Info,
  LoaderCircle,
  MailCheck,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useResidentPortal } from "@/hooks/use-resident-portal";
import { queryKeys } from "@/lib/query-keys";
import {
  markAllResidentNotificationsRead,
  markResidentNotificationRead,
} from "@/services/resident-service";
import type { ResidentNotification } from "@/types/resident";

type NotificationFilter = "all" | "unread" | "action" | "read";

const filterOptions: Array<{
  key: NotificationFilter;
  label: string;
}> = [
  { key: "all", label: "All updates" },
  { key: "unread", label: "Unread" },
  { key: "action", label: "Needs action" },
  { key: "read", label: "Reviewed" },
];

export function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const portalQuery = useResidentPortal();
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");
  const [pendingNotificationId, setPendingNotificationId] = useState<string | null>(null);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const application = portalQuery.data?.application ?? null;
  const notifications = portalQuery.data?.notifications ?? [];
  const unreadNotifications = portalQuery.data?.unreadNotifications ?? 0;
  const needsActionCount = portalQuery.data?.needsActionCount ?? 0;

  const displayedNotifications = notifications.filter((notification) => {
    const needsAction = notificationNeedsAction(notification);

    switch (activeFilter) {
      case "unread":
        return !notification.isRead;
      case "action":
        return needsAction;
      case "read":
        return notification.isRead;
      default:
        return true;
    }
  });

  const summaryItems = [
    {
      label: "Unread updates",
      value: String(unreadNotifications),
      detail: unreadNotifications > 0 ? "New alerts waiting for review." : "You are caught up.",
      icon: BellRing,
    },
    {
      label: "Needs action",
      value: String(needsActionCount),
      detail:
        needsActionCount > 0
          ? "Review remarks or upload requested files."
          : "No follow-up items are currently flagged.",
      icon: CircleAlert,
    },
    {
      label: "Latest status",
      value: application?.statusLabel ?? "No application",
      detail: application?.referenceNumber ?? "Submit a request to start tracking updates.",
      icon: Info,
    },
  ];

  async function refreshPortalData() {
    await queryClient.invalidateQueries({
      queryKey: user ? queryKeys.resident.portal(user.id) : ["resident", "portal"],
    });
  }

  async function handleMarkAsRead(notificationId: string) {
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

  async function handleMarkAllRead() {
    try {
      setIsMarkingAllRead(true);
      await markAllResidentNotificationsRead();
      await refreshPortalData();
      toast.success("All resident notifications marked as read.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to mark all notifications as read.",
      );
    } finally {
      setIsMarkingAllRead(false);
    }
  }

  if (portalQuery.isLoading) {
    return <NotificationState message="Loading your resident notifications..." />;
  }

  if (portalQuery.error instanceof Error) {
    return <NotificationState message={portalQuery.error.message} />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-primary/10 bg-[linear-gradient(135deg,rgba(20,17,94,1),rgba(35,33,120,0.94))] p-8 text-primary-foreground shadow-panel">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-foreground/72">
                Notifications
              </p>
              <h1 className="font-serif text-4xl font-bold leading-tight md:text-5xl">
                Resident alerts and updates
              </h1>
              <p className="max-w-2xl text-base leading-7 text-white/82 md:text-lg">
                Review verification updates, requirement reminders, and case notices from
                OMSWD in one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" asChild>
                <Link to={needsActionCount > 0 ? "/resident/uploads" : "/resident/application"}>
                  {needsActionCount > 0 ? "Open upload center" : "Open application"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                onClick={() => void handleMarkAllRead()}
                disabled={isMarkingAllRead || unreadNotifications === 0}
              >
                {isMarkingAllRead ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <MailCheck className="h-4 w-4" />
                )}
                Mark all as read
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {summaryItems.map(({ label, value, detail, icon: Icon }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/12 text-secondary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                      {label}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-white">{value}</p>
                    <p className="mt-1 text-sm leading-6 text-white/72">{detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <Card className="border-primary/10 bg-white/95">
          <CardHeader>
            <CardTitle>Inbox controls</CardTitle>
            <CardDescription>Filter alerts and open the next page you likely need.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <Button
                  key={option.key}
                  type="button"
                  size="sm"
                  variant={activeFilter === option.key ? "default" : "outline"}
                  onClick={() => setActiveFilter(option.key)}
                >
                  {option.label}
                </Button>
              ))}
            </div>

            <div className="rounded-3xl bg-muted/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Current request
              </p>
              <p className="mt-2 text-xl font-semibold text-foreground">
                {application?.referenceNumber ?? "No active reference"}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {application
                  ? application.adminRemarks ??
                    "Use your notifications and application page to monitor OMSWD review updates."
                  : "Submit an assistance request first so OMSWD updates can appear in this inbox."}
              </p>
            </div>

            <div className="grid gap-3">
              <QuickLinkCard
                to="/resident/application"
                title="Application details"
                description="Review status history, remarks, and uploaded document summaries."
              />
              <QuickLinkCard
                to="/resident/uploads"
                title="Requirement uploads"
                description="Send corrected or requested files when OMSWD asks for follow-up."
              />
              <QuickLinkCard
                to="/resident/profile"
                title="Profile settings"
                description="Keep contact and residency details updated for verification."
              />
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-4">
          {displayedNotifications.length > 0 ? (
            displayedNotifications.map((notification) => {
              const tone = getNotificationTone(notification.category);
              const Icon =
                tone === "warning" ? FileWarning : tone === "success" ? CheckCircle2 : Clock3;
              const action = getNotificationAction(notification);
              const needsAction = notificationNeedsAction(notification);

              return (
                <Card key={notification.id} className="border-primary/10 bg-white/95">
                  <CardContent className="p-0">
                    <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex gap-4">
                        <div
                          className={[
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                            tone === "warning"
                              ? "bg-secondary text-primary"
                              : tone === "success"
                                ? "bg-accent text-accent-foreground"
                                : "bg-primary text-primary-foreground",
                          ].join(" ")}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={notification.isRead ? "outline" : "default"}>
                              {notification.categoryLabel}
                            </Badge>
                            <Badge variant={needsAction ? "secondary" : "outline"}>
                              {needsAction ? "Needs action" : notification.isRead ? "Reviewed" : "Unread"}
                            </Badge>
                            <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                              {notification.createdAtLabel}
                            </span>
                          </div>
                          <div>
                            <h2 className="font-serif text-2xl font-bold leading-tight text-primary">
                              {notification.title}
                            </h2>
                            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
                              {notification.body}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="w-full rounded-2xl bg-muted/55 px-4 py-4 text-sm text-muted-foreground lg:max-w-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                          Recommended step
                        </p>
                        <p className="mt-2 leading-6">{action.description}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {action.external ? (
                            <Button asChild size="sm">
                              <a href={action.to} target="_blank" rel="noreferrer">
                                {action.label}
                                <ArrowRight className="h-4 w-4" />
                              </a>
                            </Button>
                          ) : (
                            <Button asChild size="sm">
                              <Link to={action.to}>
                                {action.label}
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}

                          {!notification.isRead ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => void handleMarkAsRead(notification.id)}
                              disabled={pendingNotificationId === notification.id}
                            >
                              {pendingNotificationId === notification.id ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                              ) : null}
                              Mark as read
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="border-primary/10 bg-white/95">
              <CardContent className="p-8">
                <div className="max-w-2xl space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                    {notifications.length === 0 ? "Inbox empty" : "No alerts in this filter"}
                  </p>
                  <h2 className="font-serif text-3xl font-bold text-primary">
                    {notifications.length === 0
                      ? "No notifications are stored for this resident account yet."
                      : "No notifications match the current view."}
                  </h2>
                  <p className="text-sm leading-7 text-muted-foreground">
                    {notifications.length === 0
                      ? "Once OMSWD posts a status update, correction request, or reminder, it will appear here."
                      : "Switch filters or return to the full inbox to review the rest of your updates."}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button asChild>
                      <Link to={application ? "/resident/application" : "/request-assistance"}>
                        {application ? "Open application" : "Submit a request"}
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveFilter("all")}
                    >
                      View all updates
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </section>
    </div>
  );
}

function notificationNeedsAction(notification: ResidentNotification) {
  return /(requirement|correction|follow-up|action|upload|document)/i.test(
    `${notification.category} ${notification.title} ${notification.body}`,
  );
}

function getNotificationAction(notification: ResidentNotification) {
  const text = `${notification.category} ${notification.title} ${notification.body}`;

  if (notification.linkUrl) {
    return {
      label: "Open linked page",
      to: notification.linkUrl,
      external: /^https?:\/\//i.test(notification.linkUrl),
      description: "Open the page attached to this OMSWD notice for more context.",
    };
  }

  if (/(requirement|correction|follow-up|upload|document)/i.test(text)) {
    return {
      label: "Open upload center",
      to: "/resident/uploads",
      external: false,
      description: "Review remarks and upload any corrected or requested documents.",
    };
  }

  if (/(profile|contact|residency|account)/i.test(text)) {
    return {
      label: "Open profile",
      to: "/resident/profile",
      external: false,
      description: "Check the resident profile record linked to your portal account.",
    };
  }

  return {
    label: "Open application",
    to: "/resident/application",
    external: false,
    description: "Review your case history, remarks, and latest application status.",
  };
}

function getNotificationTone(category: string) {
  if (/(requirement|correction|warning)/i.test(category)) {
    return "warning";
  }

  if (/(approved|success|completed)/i.test(category)) {
    return "success";
  }

  return "info";
}

function QuickLinkCard({
  to,
  title,
  description,
}: {
  to: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-start justify-between gap-4 rounded-2xl border border-primary/10 bg-white/90 px-4 py-4 transition-colors hover:bg-muted/35"
    >
      <div className="min-w-0">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
    </Link>
  );
}

function NotificationState({ message }: { message: string }) {
  return (
    <Card className="border-primary/10 bg-white/95">
      <CardContent className="p-8 text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  );
}
