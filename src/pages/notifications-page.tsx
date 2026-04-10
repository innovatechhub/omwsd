import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BellRing, CircleAlert, Info, LoaderCircle, MailCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { ResidentPageHeader } from "@/components/resident/resident-page-header";
import { ResidentStateCard } from "@/components/resident/resident-state-card";
import { ResidentTableSkeleton } from "@/components/resident/resident-table-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const [selectedNotificationId, setSelectedNotificationId] = useState<string>("");
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

  useEffect(() => {
    if (!selectedNotificationId && displayedNotifications[0]) {
      setSelectedNotificationId(displayedNotifications[0].id);
      return;
    }

    if (
      selectedNotificationId &&
      displayedNotifications.every((notification) => notification.id !== selectedNotificationId)
    ) {
      setSelectedNotificationId(displayedNotifications[0]?.id ?? "");
    }
  }, [displayedNotifications, selectedNotificationId]);

  const selectedNotification =
    displayedNotifications.find((notification) => notification.id === selectedNotificationId) ??
    displayedNotifications[0] ??
    null;

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
    return <NotificationsLoadingState />;
  }

  if (portalQuery.error instanceof Error) {
    return <ResidentStateCard message={portalQuery.error.message} />;
  }

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

  const action = selectedNotification ? getNotificationAction(selectedNotification) : null;

  return (
    <div className="space-y-6">
      <ResidentPageHeader
        eyebrow="Notifications"
        title="Resident alerts and updates"
        description="Review verification notices, requirement reminders, and case updates in one inbox."
        chips={["Inbox Tracking", "Action Follow-up"]}
      />

      <section className="grid gap-4 md:grid-cols-3">
        {summaryItems.map(({ label, value, detail, icon: Icon }) => (
          <Card key={label} className="portal-card border-[var(--portal-outline)] shadow-none">
            <CardContent className="flex gap-3 p-4">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--portal-surface-soft)]">
                <Icon className="h-4 w-4 text-[var(--portal-accent)]" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--portal-muted)]">
                  {label}
                </p>
                <p className="mt-1 text-lg font-semibold text-[var(--portal-ink)]">{value}</p>
                <p className="mt-1 text-sm text-[var(--portal-muted)]">{detail}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="portal-card border-[var(--portal-outline)] shadow-none">
        <CardHeader>
          <CardTitle>Inbox controls</CardTitle>
          <CardDescription>Filter your notifications and mark updates as reviewed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setActiveFilter(option.key)}
                className={[
                  "rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
                  activeFilter === option.key
                    ? "portal-nav-link-active"
                    : "border-[var(--portal-outline)] bg-white text-[var(--portal-muted)] hover:bg-[var(--portal-surface-soft)] hover:text-[var(--portal-ink)]",
                ].join(" ")}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-[var(--portal-outline)] bg-white hover:bg-[var(--portal-surface-soft)]"
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
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="portal-card border-[var(--portal-outline)] shadow-none">
          <CardHeader>
            <CardTitle>Notification table</CardTitle>
            <CardDescription>Select an item to read details and next action.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[110px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedNotifications.length > 0 ? (
                  displayedNotifications.map((notification) => {
                    const needsAction = notificationNeedsAction(notification);
                    return (
                      <TableRow
                        key={notification.id}
                        data-selected={selectedNotification?.id === notification.id}
                        className="cursor-pointer data-[selected=true]:bg-[rgba(29,77,143,0.12)]"
                        onClick={() => setSelectedNotificationId(notification.id)}
                      >
                        <TableCell className="font-medium">{notification.title}</TableCell>
                        <TableCell>{notification.categoryLabel}</TableCell>
                        <TableCell>{notification.createdAtLabel}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              needsAction ? "secondary" : notification.isRead ? "outline" : "default"
                            }
                            className={needsAction ? "bg-[rgba(242,193,79,0.22)] text-[var(--portal-ink)]" : undefined}
                          >
                            {needsAction ? "Needs action" : notification.isRead ? "Reviewed" : "Unread"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {!notification.isRead ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-[var(--portal-outline)] bg-white hover:bg-[var(--portal-surface-soft)]"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleMarkAsRead(notification.id);
                              }}
                              disabled={pendingNotificationId === notification.id}
                            >
                              {pendingNotificationId === notification.id ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                              ) : null}
                              Mark read
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Reviewed</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-[var(--portal-muted)]">
                      {notifications.length === 0
                        ? "No notifications are stored for this account yet."
                        : "No notifications match the current filter."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="portal-card border-[var(--portal-outline)] shadow-none">
          <CardHeader>
            <CardTitle>Notification details</CardTitle>
            <CardDescription>Read the selected notice and follow the recommended step.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedNotification && action ? (
              <>
                <div className="space-y-2 rounded-lg border border-[var(--portal-outline)] bg-[var(--portal-surface-soft)] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={selectedNotification.isRead ? "outline" : "default"}>
                      {selectedNotification.categoryLabel}
                    </Badge>
                    <span className="text-xs text-[var(--portal-muted)]">
                      {selectedNotification.createdAtLabel}
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-[var(--portal-ink)]">{selectedNotification.title}</p>
                  <p className="text-sm text-[var(--portal-muted)]">{selectedNotification.body}</p>
                </div>

                <div className="rounded-lg border border-[var(--portal-outline)] bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--portal-muted)]">
                    Recommended step
                  </p>
                  <p className="mt-2 text-sm text-[var(--portal-muted)]">{action.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {action.external ? (
                      <Button
                        asChild
                        size="sm"
                        className="bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]"
                      >
                        <a href={action.to} target="_blank" rel="noreferrer">
                          {action.label}
                          <ArrowRight className="h-4 w-4" />
                        </a>
                      </Button>
                    ) : (
                      <Button
                        asChild
                        size="sm"
                        className="bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]"
                      >
                        <Link to={action.to}>
                          {action.label}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="portal-empty-state px-4 py-6 text-sm text-[var(--portal-muted)]">
                Select a notification to review details.
              </div>
            )}
          </CardContent>
        </Card>
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
      description: "Review remarks and upload requested documents.",
    };
  }

  if (/(profile|contact|residency|account)/i.test(text)) {
    return {
      label: "Open profile",
      to: "/resident/profile",
      external: false,
      description: "Check the resident profile linked to your account.",
    };
  }

  return {
    label: "Open application",
    to: "/resident/application",
    external: false,
    description: "Review your case history, remarks, and current status.",
  };
}

function NotificationsLoadingState() {
  return (
    <div className="space-y-6">
      <ResidentPageHeader
        eyebrow="Notifications"
        title="Resident alerts and updates"
        description="Loading your resident notifications..."
        chips={["Inbox Tracking", "Action Follow-up"]}
      />
      <Card className="portal-card border-[var(--portal-outline)] shadow-none">
        <CardHeader>
          <CardTitle>Inbox controls</CardTitle>
          <CardDescription>Preparing filters and update actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-9 w-28 animate-pulse rounded-xl border border-[var(--portal-outline)] bg-[var(--portal-surface-soft)]"
              />
            ))}
          </div>
          <div className="h-10 w-40 animate-pulse rounded-lg bg-[rgba(214,222,234,0.8)]" />
        </CardContent>
      </Card>
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ResidentTableSkeleton title="Loading notification table" columns={5} rows={6} />
        <Card className="portal-card border-[var(--portal-outline)] shadow-none">
          <CardHeader>
            <CardTitle>Notification details</CardTitle>
            <CardDescription>Preparing selected notice details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-[rgba(214,222,234,0.9)]" />
            <div className="h-3 w-full animate-pulse rounded-full bg-[rgba(214,222,234,0.75)]" />
            <div className="h-3 w-5/6 animate-pulse rounded-full bg-[rgba(214,222,234,0.75)]" />
            <div className="h-9 w-36 animate-pulse rounded-lg bg-[rgba(214,222,234,0.85)]" />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
