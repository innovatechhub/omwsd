import { ArrowRight, Clock3, FileText, ListChecks, ShieldCheck, Upload, Wallet } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { ResidentPageHeader } from "@/components/resident/resident-page-header";
import { ResidentStateCard } from "@/components/resident/resident-state-card";
import { ResidentTableSkeleton } from "@/components/resident/resident-table-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useResidentPortal } from "@/hooks/use-resident-portal";

type DetailsTab = "history" | "requirements" | "documents";

const progressSteps = [
  "Request submitted",
  "Initial verification",
  "Document review",
  "Decision and release",
];

export function ResidentApplicationPage() {
  const portalQuery = useResidentPortal();
  const application = portalQuery.data?.application ?? null;
  const [activeTab, setActiveTab] = useState<DetailsTab>("history");

  if (portalQuery.isLoading) {
    return <ResidentApplicationLoadingState />;
  }

  if (portalQuery.error instanceof Error) {
    return <ResidentStateCard message={portalQuery.error.message} />;
  }

  if (!application) {
    return (
      <div className="space-y-6">
        <ResidentPageHeader eyebrow="My Application" title="Case history and remarks" />
        <ResidentStateCard
          title="No resident application found"
          description="This portal account does not have a submitted assistance request yet."
          message="Submit a request first to start tracking status updates, remarks, requirements, and uploaded documents in this page."
          action={
            <Button className="bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]" asChild>
              <Link to="/request-assistance">
                Submit a request
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const requirementItemsNeedingAttention = application.requirements.filter((requirement) =>
    ["pending", "rejected", "needs_resubmission"].includes(requirement.status),
  ).length;

  const nextStepLabel = (() => {
    if (application.requiresAction) {
      return "Review staff remarks and upload any requested files.";
    }

    if (application.status === "pending_verification") {
      return "Your request is queued for initial validation.";
    }

    if (application.status === "under_review") {
      return "Your request is now in review. Monitor updates in this page.";
    }

    if (application.status === "approved" || application.status === "completed") {
      return "No additional resident action is currently required.";
    }

    return "Keep this page checked for new status updates.";
  })();

  return (
    <div className="space-y-6">
      <ResidentPageHeader
        eyebrow="My Application"
        title="Case history and remarks"
        chips={["Status History", "Requirement Tracker"]}
      />

      <Card className="portal-card border-[var(--portal-outline)] shadow-none">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>Reference {application.referenceNumber}</CardTitle>
              <CardDescription>{application.assistanceName}</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{application.assistanceName}</Badge>
              <Badge variant={application.requiresAction ? "secondary" : "outline"}>
                {application.statusLabel}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <ApplicationMetaCard
              icon={ShieldCheck}
              label="Current status"
              value={application.statusLabel}
              detail={application.adminRemarks ?? "No staff remarks have been added yet."}
            />
            <ApplicationMetaCard
              icon={FileText}
              label="Submitted"
              value={application.submittedAtLabel}
              detail={
                application.reviewedAtLabel
                  ? `Reviewed ${application.reviewedAtLabel}`
                  : "Review is still pending."
              }
            />
            <ApplicationMetaCard
              icon={Wallet}
              label="Requested amount"
              value={application.requestedAmountLabel}
              detail={application.urgencyLabel}
            />
          </div>

          <div className="rounded-xl border border-primary/10 bg-muted/20 px-4 py-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Progress tracker
              </p>
              <p className="text-sm text-muted-foreground">Next step: {nextStepLabel}</p>
            </div>
            <div className="grid gap-2 md:grid-cols-4">
              {progressSteps.map((step, index) => {
                const isComplete = index < application.progressStep;
                const isCurrent = index === application.progressStep;

                return (
                  <div
                    key={step}
                    className={[
                      "rounded-lg border px-3 py-3",
                      isCurrent ? "border-primary/30 bg-primary/5" : "bg-background",
                    ].join(" ")}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Step {index + 1}
                    </p>
                    <p className="mt-1 text-sm font-medium">{step}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {isComplete ? "Completed" : isCurrent ? "Current step" : "Upcoming"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button className="bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]" asChild>
              <Link to="/resident/uploads">
                Open upload center
                <Upload className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" className="border-[var(--portal-outline)] bg-white hover:bg-[var(--portal-surface-soft)]" asChild>
              <Link to="/resident/notifications">
                Open notifications
                <Clock3 className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <Card className="portal-card border-[var(--portal-outline)] shadow-none">
          <CardContent className="p-2">
            <div className="grid gap-2 sm:grid-cols-3">
              <DetailTabButton
                isActive={activeTab === "history"}
                label="Status History"
                icon={<Clock3 className="h-4 w-4" />}
                onClick={() => setActiveTab("history")}
              />
              <DetailTabButton
                isActive={activeTab === "requirements"}
                label="Requirements"
                icon={<ListChecks className="h-4 w-4" />}
                onClick={() => setActiveTab("requirements")}
              />
              <DetailTabButton
                isActive={activeTab === "documents"}
                label="Uploaded Documents"
                icon={<Upload className="h-4 w-4" />}
                onClick={() => setActiveTab("documents")}
              />
            </div>
          </CardContent>
        </Card>

        {activeTab === "history" ? (
          <Card className="portal-card border-[var(--portal-outline)] shadow-none">
            <CardHeader>
              <CardTitle>Status history</CardTitle>
              <CardDescription>All status updates posted to your case.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {application.statusHistory.length > 0 ? (
                    application.statusHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.createdAtLabel}</TableCell>
                        <TableCell className="font-medium">{item.statusLabel}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.remarks ?? "No remarks were recorded for this update."}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                        No status history has been posted yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : null}

        {activeTab === "requirements" ? (
          <Card className="portal-card border-[var(--portal-outline)] shadow-none">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>Requirement checklist</CardTitle>
                  <CardDescription>
                    Requirement records linked to this application.
                  </CardDescription>
                </div>
                <Badge variant={requirementItemsNeedingAttention > 0 ? "secondary" : "outline"}>
                  {requirementItemsNeedingAttention > 0
                    ? `${requirementItemsNeedingAttention} need attention`
                    : "No pending items"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requirement</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Files</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {application.requirements.length > 0 ? (
                    application.requirements.map((requirement) => (
                      <TableRow key={requirement.id}>
                        <TableCell className="font-medium">{requirement.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              requirement.status === "approved"
                                ? "secondary"
                                : requirement.status === "submitted"
                                  ? "default"
                                  : "outline"
                            }
                          >
                            {requirement.statusLabel}
                          </Badge>
                        </TableCell>
                        <TableCell>{requirement.documents.length}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {requirement.remarks ??
                            requirement.description ??
                            "No additional remarks attached."}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        No explicit requirement records are linked yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : null}

        {activeTab === "documents" ? (
          <Card className="portal-card border-[var(--portal-outline)] shadow-none">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>Uploaded documents</CardTitle>
                  <CardDescription>
                    Files already attached to this request in Supabase.
                  </CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/resident/uploads">
                    Open upload center
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {application.documents.length > 0 ? (
                    application.documents.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell className="font-medium">{document.fileName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{document.statusLabel}</Badge>
                        </TableCell>
                        <TableCell>{document.createdAtLabel}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {document.remarks ?? "No document remarks yet."}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        No uploaded documents are linked yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : null}
      </section>
    </div>
  );
}

function ApplicationMetaCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--portal-outline)] bg-[var(--portal-surface-soft)] p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white">
        <Icon className="h-4 w-4 text-[var(--portal-accent)]" />
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--portal-muted)]">
        {label}
      </p>
      <p className="mt-1 font-semibold text-[var(--portal-ink)]">{value}</p>
      <p className="mt-1 text-sm text-[var(--portal-muted)]">{detail}</p>
    </div>
  );
}

function DetailTabButton({
  isActive,
  label,
  icon,
  onClick,
}: {
  isActive: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
        isActive
          ? "portal-nav-link-active"
          : "border-transparent text-[var(--portal-muted)] hover:border-[var(--portal-outline)] hover:bg-[var(--portal-surface-soft)] hover:text-[var(--portal-ink)]",
      ].join(" ")}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ResidentApplicationLoadingState() {
  return (
    <div className="space-y-6">
      <ResidentPageHeader
        eyebrow="My Application"
        title="Case history and remarks"
        description="Loading your application history..."
        chips={["Status History", "Requirement Tracker"]}
      />
      <Card className="portal-card border-[var(--portal-outline)] shadow-none">
        <CardHeader>
          <CardTitle>Application summary</CardTitle>
          <CardDescription>Preparing your case details and status timeline.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="portal-metric-card space-y-3 p-4">
                <div className="h-3 w-1/2 animate-pulse rounded-full bg-[rgba(214,222,234,0.9)]" />
                <div className="h-4 w-3/4 animate-pulse rounded-full bg-[rgba(214,222,234,0.85)]" />
                <div className="h-3 w-full animate-pulse rounded-full bg-[rgba(214,222,234,0.7)]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <ResidentTableSkeleton title="Loading status history" columns={3} rows={5} />
    </div>
  );
}
