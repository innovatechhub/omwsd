import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  FileWarning,
  ListChecks,
  Upload,
  UserCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";

import { ResidentStateCard } from "@/components/resident/resident-state-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useResidentPortal } from "@/hooks/use-resident-portal";

const progressSteps = [
  { label: "Request submitted", description: "Application received by OMSWD" },
  { label: "Initial verification", description: "Details are being validated" },
  { label: "Document review", description: "Submitted files are being checked" },
  { label: "Decision and release", description: "Final review and release of assistance" },
];

export function ResidentDashboardPage() {
  const portalQuery = useResidentPortal();
  const application = portalQuery.data?.application ?? null;
  const needsActionCount = portalQuery.data?.needsActionCount ?? 0;
  const profileIsComplete = portalQuery.data?.profileIsComplete ?? true;
  const notifications = portalQuery.data?.notifications ?? [];
  const unreadCount = portalQuery.data?.unreadNotifications ?? 0;

  if (portalQuery.isLoading) {
    return <ResidentStateCard message="Loading your resident portal data..." />;
  }

  if (portalQuery.error instanceof Error) {
    return <ResidentStateCard message={portalQuery.error.message} />;
  }

  const requirementsDone = application
    ? application.requirements.filter((r) => r.status === "approved").length
    : 0;
  const requirementsTotal = application?.requirements.length ?? 0;
  const documentCount = application?.documents.length ?? 0;
  const requirementsPercent =
    requirementsTotal > 0 ? Math.round((requirementsDone / requirementsTotal) * 100) : 0;

  return (
    <div className="space-y-6">

      {/* Profile incomplete banner */}
      {!profileIsComplete && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <UserCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">Complete your profile to get started</p>
              <p className="mt-0.5 text-sm text-amber-700">
                Your account is active but your resident profile is not yet filled out. You need to
                complete it before you can submit an assistance request.
              </p>
            </div>
          </div>
          <Link
            to="/resident/profile"
            className="shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
          >
            Complete profile →
          </Link>
        </div>
      )}

      {/* Action required banner */}
      {needsActionCount > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">
                {needsActionCount} item{needsActionCount === 1 ? "" : "s"} require your attention
              </p>
              <p className="mt-0.5 text-sm text-red-700">
                Please review staff remarks and upload the requested files.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="shrink-0 bg-red-600 text-white hover:bg-red-700"
            asChild
          >
            <Link to="/resident/uploads">
              <Upload className="h-4 w-4" />
              Go to uploads
            </Link>
          </Button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Clock3 className="h-5 w-5" />}
          label="Case status"
          value={application?.statusLabel ?? "No application"}
          accent={application?.requiresAction ? "warning" : "default"}
        />
        <StatCard
          icon={<FileCheck2 className="h-5 w-5" />}
          label="Reference number"
          value={application?.referenceNumber ?? "—"}
          accent="default"
        />
        <StatCard
          icon={<ListChecks className="h-5 w-5" />}
          label="Requirements"
          value={requirementsTotal > 0 ? `${requirementsDone} / ${requirementsTotal} approved` : "None linked"}
          accent={requirementsDone === requirementsTotal && requirementsTotal > 0 ? "success" : "default"}
        />
        <StatCard
          icon={<Bell className="h-5 w-5" />}
          label="Notifications"
          value={unreadCount > 0 ? `${unreadCount} unread` : "All read"}
          accent={unreadCount > 0 ? "warning" : "default"}
        />
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Left col — Application summary + progress */}
        <div className="space-y-6 lg:col-span-2">

          {/* Application summary */}
          <Card className="portal-card border-[var(--portal-outline)] shadow-none">
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
              <div>
                <CardTitle>Current application</CardTitle>
                <CardDescription>Latest assistance request linked to this account.</CardDescription>
              </div>
              {application && (
                <Badge
                  variant={application.requiresAction ? "secondary" : "outline"}
                  className="shrink-0 mt-0.5"
                >
                  {application.statusLabel}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-5">
              {application ? (
                <>
                  {/* Meta row */}
                  <div className="grid gap-3 rounded-xl border border-[var(--portal-outline)] bg-[var(--portal-surface-soft)] p-4 sm:grid-cols-3">
                    <ApplicationMetaItem label="Service" value={application.assistanceName} />
                    <ApplicationMetaItem label="Submitted" value={application.submittedAtLabel} />
                    <ApplicationMetaItem
                      label="Last reviewed"
                      value={application.reviewedAtLabel ?? "Pending"}
                    />
                  </div>

                  {/* Admin remarks */}
                  {application.adminRemarks && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
                      <p className="font-semibold text-amber-900">Staff remarks</p>
                      <p className="mt-1 text-amber-800">{application.adminRemarks}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]"
                      asChild
                    >
                      <Link to="/resident/application">
                        View full details
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="border-[var(--portal-outline)] bg-white hover:bg-[var(--portal-surface-soft)]"
                      asChild
                    >
                      <Link to="/resident/uploads">
                        <Upload className="h-4 w-4" />
                        Upload documents
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-[var(--portal-outline)] bg-[var(--portal-surface-soft)] px-6 py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                    <FileText className="h-6 w-6 text-[var(--portal-accent)]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--portal-ink)]">No application yet</p>
                    <p className="mt-1 text-sm text-[var(--portal-muted)]">
                      Submit a request to start tracking your case.
                    </p>
                  </div>
                  <Button
                    className="bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]"
                    asChild
                  >
                    <Link to="/resident/application">
                      Apply for assistance
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress tracker */}
          <Card className="portal-card border-[var(--portal-outline)] shadow-none">
            <CardHeader className="pb-3">
              <CardTitle>Progress tracker</CardTitle>
              <CardDescription>Where your request currently is in the process.</CardDescription>
            </CardHeader>
            <CardContent>
              {application ? (
                <div className="relative space-y-1">
                  {progressSteps.map((step, index) => {
                    const isComplete = index < application.progressStep;
                    const isCurrent = index === application.progressStep;
                    return (
                      <div key={step.label} className="flex gap-4">
                        {/* Connector column */}
                        <div className="flex flex-col items-center">
                          <div
                            className={[
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                              isComplete
                                ? "bg-[var(--portal-accent)] text-white"
                                : isCurrent
                                  ? "border-2 border-[var(--portal-accent)] bg-white text-[var(--portal-accent)]"
                                  : "border-2 border-[var(--portal-outline)] bg-white text-[var(--portal-muted)]",
                            ].join(" ")}
                          >
                            {isComplete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                          </div>
                          {index < progressSteps.length - 1 && (
                            <div
                              className={[
                                "my-1 w-0.5 flex-1",
                                isComplete
                                  ? "bg-[var(--portal-accent)]"
                                  : "bg-[var(--portal-outline)]",
                              ].join(" ")}
                              style={{ minHeight: "20px" }}
                            />
                          )}
                        </div>
                        {/* Step content */}
                        <div className="pb-4 pt-1">
                          <p
                            className={[
                              "font-semibold leading-tight",
                              isComplete || isCurrent
                                ? "text-[var(--portal-ink)]"
                                : "text-[var(--portal-muted)]",
                            ].join(" ")}
                          >
                            {step.label}
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--portal-muted)]">
                            {isComplete ? "Completed" : isCurrent ? "In progress" : step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                  Submit a request first so the portal can start tracking progress.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right col — Quick stats + requirements + recent notifications */}
        <div className="space-y-6">

          {/* Requirements checklist mini */}
          <Card className="portal-card border-[var(--portal-outline)] shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">Requirements</CardTitle>
                {requirementsTotal > 0 && (
                  <span className="text-xs font-semibold text-[var(--portal-muted)]">
                    {requirementsPercent}%
                  </span>
                )}
              </div>
              <CardDescription>Status of your linked requirements.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Progress bar */}
              {requirementsTotal > 0 && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--portal-outline)]">
                  <div
                    className="h-full rounded-full bg-[var(--portal-accent)] transition-all duration-500"
                    style={{ width: `${requirementsPercent}%` }}
                  />
                </div>
              )}

              {application && requirementsTotal > 0 ? (
                <div className="space-y-2">
                  {application.requirements.slice(0, 5).map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-[var(--portal-outline)] bg-[var(--portal-surface-soft)] px-3 py-2 text-sm"
                    >
                      <span className="truncate text-[var(--portal-ink)]">{req.name}</span>
                      <RequirementStatusDot status={req.status} />
                    </div>
                  ))}
                  {requirementsTotal > 5 && (
                    <p className="text-center text-xs text-[var(--portal-muted)]">
                      +{requirementsTotal - 5} more
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[var(--portal-muted)]">
                  {application ? "No requirements linked yet." : "No active application."}
                </p>
              )}

              <Link
                to="/resident/application"
                className="flex items-center gap-1 text-xs font-semibold text-[var(--portal-accent)] hover:underline"
              >
                View all requirements
                <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>

          {/* Documents summary */}
          <Card className="portal-card border-[var(--portal-outline)] shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Documents</CardTitle>
              <CardDescription>Files uploaded to your application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-[var(--portal-outline)] bg-[var(--portal-surface-soft)] px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                  <FileWarning className="h-5 w-5 text-[var(--portal-accent)]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--portal-ink)]">{documentCount}</p>
                  <p className="text-xs text-[var(--portal-muted)]">
                    {documentCount === 1 ? "file uploaded" : "files uploaded"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-[var(--portal-outline)] bg-white hover:bg-[var(--portal-surface-soft)]"
                asChild
              >
                <Link to="/resident/uploads">
                  <Upload className="h-4 w-4" />
                  Upload center
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent notifications */}
          <Card className="portal-card border-[var(--portal-outline)] shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">Recent notifications</CardTitle>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              <CardDescription>Latest updates from OMSWD.</CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length > 0 ? (
                <div className="space-y-2">
                  {notifications.slice(0, 4).map((n) => (
                    <div
                      key={n.id}
                      className={[
                        "rounded-lg border px-3 py-2.5 text-sm",
                        n.isRead
                          ? "border-[var(--portal-outline)] bg-[var(--portal-surface-soft)]"
                          : "border-[var(--portal-accent)]/20 bg-[var(--portal-accent)]/5",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold leading-snug text-[var(--portal-ink)]">
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--portal-accent)]" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--portal-muted)]">{n.createdAtLabel}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--portal-muted)]">No notifications yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: "default" | "warning" | "success";
}) {
  const iconBg =
    accent === "warning"
      ? "bg-amber-50 text-amber-600"
      : accent === "success"
        ? "bg-emerald-50 text-emerald-600"
        : "bg-[var(--portal-surface-soft)] text-[var(--portal-accent)]";

  return (
    <Card className="portal-card border-[var(--portal-outline)] shadow-none">
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-[var(--portal-muted)]">
            {label}
          </p>
          <p className="mt-0.5 truncate font-bold text-[var(--portal-ink)]">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ApplicationMetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--portal-muted)]">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-[var(--portal-ink)]">{value}</p>
    </div>
  );
}

function RequirementStatusDot({ status }: { status: string }) {
  if (status === "approved") {
    return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />;
  }
  if (status === "rejected" || status === "needs_resubmission") {
    return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />;
  }
  return <Clock3 className="h-4 w-4 shrink-0 text-[var(--portal-muted)]" />;
}
