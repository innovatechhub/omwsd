import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileWarning,
  Upload,
} from "lucide-react";
import { Link } from "react-router-dom";

import { ResidentStateCard } from "@/components/resident/resident-state-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useResidentPortal } from "@/hooks/use-resident-portal";

const progressSteps = [
  "Request submitted",
  "Initial verification",
  "Document review",
  "Decision and release",
];

const quickActions = [
  {
    title: "Application details",
    description: "Review your latest request and case remarks.",
    to: "/resident/application",
    icon: FileCheck2,
  },
  {
    title: "Requirement uploads",
    description: "Submit requested or corrected documents.",
    to: "/resident/uploads",
    icon: Upload,
  },
  {
    title: "Notifications",
    description: "Check reminders and status updates from OMSWD.",
    to: "/resident/notifications",
    icon: BellRing,
  },
];

export function ResidentDashboardPage() {
  const portalQuery = useResidentPortal();
  const application = portalQuery.data?.application ?? null;
  const unreadNotifications = portalQuery.data?.unreadNotifications ?? 0;
  const needsActionCount = portalQuery.data?.needsActionCount ?? 0;

  if (portalQuery.isLoading) {
    return <ResidentStateCard message="Loading your resident portal data..." />;
  }

  if (portalQuery.error instanceof Error) {
    return <ResidentStateCard message={portalQuery.error.message} />;
  }

  const summaryCards = [
    {
      label: "Current status",
      value: application?.statusLabel ?? "No application yet",
      detail: application
        ? "This reflects the latest case status."
        : "Submit a request first to begin tracking.",
      icon: Clock3,
    },
    {
      label: "Reference number",
      value: application?.referenceNumber ?? "Not available",
      detail: application
        ? "Use this when contacting OMSWD."
        : "Assigned after application submission.",
      icon: FileCheck2,
    },
    {
      label: "Required action",
      value:
        needsActionCount > 0
          ? `${needsActionCount} item${needsActionCount === 1 ? "" : "s"}`
          : "No action needed",
      detail:
        needsActionCount > 0
          ? "Review notifications and upload requested files."
          : "No follow-up is currently required.",
      icon: needsActionCount > 0 ? FileWarning : CheckCircle2,
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="portal-card border-[var(--portal-outline)] shadow-none">
        <CardHeader>
          <CardTitle>Current application</CardTitle>
          <CardDescription>Latest request details linked to this account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {application ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{application.assistanceName}</Badge>
              <Badge variant="outline">{application.referenceNumber}</Badge>
              <Badge variant="outline">{application.submittedAtLabel}</Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No request is currently linked to this account.
            </p>
          )}
            <div className="flex flex-wrap gap-2">
            <Button className="bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]" asChild>
              <Link to="/resident/application">
                {application ? "View application" : "Open application page"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" className="border-[var(--portal-outline)] bg-white hover:bg-[var(--portal-surface-soft)]" asChild>
              <Link to={application ? "/resident/uploads" : "/request-assistance"}>
                {application ? "Upload documents" : "Submit a request"}
                <Upload className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        {summaryCards.map(({ label, value, detail, icon: Icon }) => (
          <Card key={label} className="portal-card border-[var(--portal-outline)] shadow-none">
            <CardContent className="flex gap-3 p-4">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--portal-surface-soft)]">
                <Icon className="h-4 w-4 text-[var(--portal-accent)]" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--portal-muted)]">
                  {label}
                </p>
                <p className="mt-1 text-lg font-semibold leading-tight text-[var(--portal-ink)]">{value}</p>
                <p className="mt-1 text-sm text-[var(--portal-muted)]">{detail}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="portal-card border-[var(--portal-outline)] shadow-none">
          <CardHeader>
            <CardTitle>Progress tracker</CardTitle>
            <CardDescription>Where your request currently is in the process.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {application ? (
              <>
                <div className="rounded-lg border border-[var(--portal-accent)]/20 bg-[var(--portal-accent)]/5 px-4 py-3 text-sm">
                  <p className="font-semibold text-[var(--portal-ink)]">What to do next</p>
                  <p className="mt-0.5 text-[var(--portal-muted)]">
                    {application.requiresAction
                      ? "Action required: review staff remarks and upload any requested files."
                      : application.status === "pending_verification"
                        ? "Your request is queued for initial validation — no action needed yet."
                        : application.status === "under_review"
                          ? "Your request is under review. Check back for status updates."
                          : application.status === "approved" || application.status === "completed"
                            ? "Your request has been processed. No further action is required."
                            : "Keep this page checked for new status updates."}
                  </p>
                  {application.requiresAction && (
                    <Link
                      to="/resident/uploads"
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--portal-accent)] hover:underline"
                    >
                      <Upload className="h-3 w-3" />
                      Go to upload center
                    </Link>
                  )}
                </div>
              </>
            ) : null}
            {application ? (
              progressSteps.map((step, index) => {
                const isComplete = index < application.progressStep;
                const isCurrent = index === application.progressStep;

                return (
                  <div
                    key={step}
                    className={[
                      "flex items-center gap-3 rounded-lg border px-3 py-3",
                      isCurrent
                        ? "border-[var(--portal-accent)] bg-[rgba(29,77,143,0.08)]"
                        : "border-[var(--portal-outline)] bg-[var(--portal-surface-soft)]",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                        isComplete
                          ? "bg-[var(--portal-accent)] text-white"
                          : isCurrent
                            ? "bg-[rgba(29,77,143,0.14)] text-[var(--portal-accent)]"
                            : "bg-white text-[var(--portal-muted)]",
                      ].join(" ")}
                    >
                      {isComplete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--portal-ink)]">{step}</p>
                      <p className="text-xs text-[var(--portal-muted)]">
                        {isComplete ? "Completed" : isCurrent ? "Current step" : "Upcoming"}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
                Submit a request first so the portal can start tracking progress.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="portal-card border-[var(--portal-outline)] shadow-none">
          <CardHeader>
            <CardTitle>Quick navigation</CardTitle>
            <CardDescription>Open commonly used resident pages faster.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map(({ title, description, to, icon: Icon }) => (
              <Link
                key={title}
                to={to}
                className="flex items-start justify-between gap-3 rounded-lg border border-[var(--portal-outline)] bg-white px-3 py-3 transition-colors hover:bg-[var(--portal-surface-soft)]"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-[var(--portal-surface-soft)]">
                    <Icon className="h-4 w-4 text-[var(--portal-accent)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--portal-ink)]">{title}</p>
                    <p className="mt-1 text-xs text-[var(--portal-muted)]">{description}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-[var(--portal-muted)]" />
              </Link>
            ))}

            <div className="rounded-lg border border-[var(--portal-outline)] bg-[var(--portal-surface-soft)] px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--portal-muted)]">
                Unread notifications
              </p>
              <p className="mt-1 text-2xl font-semibold text-[var(--portal-ink)]">{unreadNotifications}</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
