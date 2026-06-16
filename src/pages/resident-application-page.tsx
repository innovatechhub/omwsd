import {
  ArrowRight,
  Clock3,
  Eye,
  FilePlus2,
  FileText,
  ListChecks,
  ShieldCheck,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { ResidentPageHeader } from "@/components/resident/resident-page-header";
import { ResidentRequestAssistanceForm } from "@/components/resident/resident-request-assistance-form";
import { ResidentStateCard } from "@/components/resident/resident-state-card";
import { ResidentTableSkeleton } from "@/components/resident/resident-table-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { useResidentPortal } from "@/hooks/use-resident-portal";
import { queryKeys } from "@/lib/query-keys";
import { cancelResidentApplication, deleteResidentApplication } from "@/services/application-service";

type ConfirmAction = "cancel" | "delete";

type DetailsTab = "history" | "requirements" | "documents";

export function ResidentApplicationPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const portalQuery = useResidentPortal();
  const application = portalQuery.data?.application ?? null;

  const [activeTab, setActiveTab] = useState<DetailsTab>("history");
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [isActioning, setIsActioning] = useState(false);

  async function handleConfirmAction() {
    if (!application || !confirmAction) return;
    setIsActioning(true);
    try {
      if (confirmAction === "cancel") {
        await cancelResidentApplication(application.id);
        toast.success("Application cancelled successfully.");
      } else {
        await deleteResidentApplication(application.id);
        toast.success("Application deleted successfully.");
      }
      void queryClient.invalidateQueries({
        queryKey: user ? queryKeys.resident.portal(user.id) : ["resident", "portal"],
      });
      setConfirmAction(null);
    } catch (error) {
      console.error("Cancel/delete error:", error);
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error !== null && "message" in error
            ? String((error as Record<string, unknown>).message)
            : "Action failed. Please try again.";
      toast.error(message);
    } finally {
      setIsActioning(false);
    }
  }

  useEffect(() => {
    const openRequest = searchParams.get("request");
    if (openRequest === "1" || openRequest === "new") {
      setIsRequestModalOpen(true);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("request");
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  if (portalQuery.isLoading) {
    return <ResidentApplicationLoadingState />;
  }

  if (portalQuery.error instanceof Error) {
    return <ResidentStateCard message={portalQuery.error.message} />;
  }

  const requirementItemsNeedingAttention =
    application?.requirements.filter((requirement) =>
      ["pending", "rejected", "needs_resubmission"].includes(requirement.status),
    ).length ?? 0;

  return (
    <div className="space-y-6">
      <ResidentPageHeader
        eyebrow="My Application"
        title="Application records"
        description="View your submitted request in a table and open details when needed."
        chips={["Case Tracking", "Resident Actions"]}
      />

      <Card className="portal-card border-[var(--portal-outline)] shadow-none">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>My application table</CardTitle>
            <CardDescription>
              Use the action button to open complete case details.
            </CardDescription>
          </div>
          <Button
            type="button"
            className="bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]"
            onClick={() => setIsRequestModalOpen(true)}
          >
            <FilePlus2 className="h-4 w-4" />
            Apply for assistance
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Reviewed</TableHead>
                <TableHead className="w-[140px] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {application ? (
                <TableRow>
                  <TableCell className="font-medium text-[var(--portal-ink)]">
                    {application.referenceNumber}
                  </TableCell>
                  <TableCell>{application.assistanceName}</TableCell>
                  <TableCell>
                    <Badge variant={application.requiresAction ? "secondary" : "outline"}>
                      {application.statusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>{application.submittedAtLabel}</TableCell>
                  <TableCell>{application.reviewedAtLabel ?? "Pending review"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-[var(--portal-outline)] bg-white hover:bg-[var(--portal-surface-soft)]"
                        onClick={() => setIsDetailsModalOpen(true)}
                      >
                        <Eye className="h-4 w-4" />
                        View details
                      </Button>
                      {["pending_verification", "under_review", "for_correction"].includes(application.status) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-amber-200 bg-white text-amber-700 hover:bg-amber-50"
                          onClick={() => setConfirmAction("cancel")}
                        >
                          <XCircle className="h-4 w-4" />
                          Cancel
                        </Button>
                      )}
                      {application.status === "cancelled" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-red-200 bg-white text-red-600 hover:bg-red-50"
                          onClick={() => setConfirmAction("delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No application found yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal
        open={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={
          application
            ? `Application details - ${application.referenceNumber}`
            : "Application details"
        }
        description="Full case information, status history, requirements, and uploaded documents."
        size="xl"
      >
        {application ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{application.assistanceName}</Badge>
              <Badge variant={application.requiresAction ? "secondary" : "outline"}>
                {application.statusLabel}
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ApplicationMetaCard
                icon={ShieldCheck}
                label="Current status"
                value={application.statusLabel}
                detail={
                  application.adminRemarks
                    ? `Staff remarks: ${application.adminRemarks}`
                    : "No staff remarks have been added yet."
                }
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
            </div>

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
                <CardContent className="space-y-3">
                  {application.requirements.length > 0 ? (
                    application.requirements.map((requirement) => {
                      const needsResubmit =
                        requirement.status === "rejected" ||
                        requirement.status === "needs_resubmission";
                      const daysInfo = requirement.reviewedAt
                        ? Math.floor(
                            (Date.now() - new Date(requirement.reviewedAt).getTime()) / 86_400_000,
                          )
                        : null;

                      return (
                        <div
                          key={requirement.id}
                          className={[
                            "rounded-xl border p-4",
                            needsResubmit
                              ? "border-yellow-300 bg-yellow-50"
                              : "border-[var(--portal-outline)] bg-white",
                          ].join(" ")}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1">
                              <p className="font-medium text-[var(--portal-ink)]">{requirement.name}</p>
                              {requirement.description && (
                                <p className="text-xs text-[var(--portal-muted)]">{requirement.description}</p>
                              )}
                              {daysInfo !== null && (
                                <p className="text-xs text-[var(--portal-muted)]">
                                  Reviewed {daysInfo} day{daysInfo === 1 ? "" : "s"} ago
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
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
                              {needsResubmit && (
                                <Button
                                  size="sm"
                                  className="bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]"
                                  onClick={() => {
                                    setIsDetailsModalOpen(false);
                                    navigate(`/resident/uploads?requirement=${requirement.id}`);
                                  }}
                                >
                                  <Upload className="h-3 w-3" />
                                  Resubmit
                                </Button>
                              )}
                            </div>
                          </div>
                          {requirement.remarks && (
                            <p className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                              Staff note: {requirement.remarks}
                            </p>
                          )}
                          {requirement.documents.length > 0 && (
                            <div className="mt-3 space-y-1">
                              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--portal-muted)]">
                                Linked files ({requirement.documents.length})
                              </p>
                              {requirement.documents.map((doc) => (
                                <div
                                  key={doc.id}
                                  className="flex items-center justify-between gap-3 rounded-md border border-[var(--portal-outline)] bg-[var(--portal-surface-soft)] px-3 py-1.5 text-sm"
                                >
                                  <span className="truncate text-[var(--portal-ink)]">{doc.fileName}</span>
                                  <Badge variant="outline" className="shrink-0 text-xs">
                                    {doc.statusLabel}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                      No explicit requirement records are linked yet.
                    </div>
                  )}
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
                        Files already attached to this request.
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsDetailsModalOpen(false);
                        navigate("/resident/uploads");
                      }}
                    >
                      Open upload center
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File</TableHead>
                        <TableHead>Linked requirement</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {application.documents.length > 0 ? (
                        application.documents.map((document) => {
                          const linkedReq = application.requirements.find(
                            (r) => r.id === document.applicationRequirementId,
                          );

                          return (
                            <TableRow key={document.id}>
                              <TableCell className="font-medium">{document.fileName}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {linkedReq ? linkedReq.name : "General supporting document"}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{document.statusLabel}</Badge>
                              </TableCell>
                              <TableCell>{document.createdAtLabel}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {document.remarks ?? "No document remarks yet."}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                            No uploaded documents are linked yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : null}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            No application details available.
          </div>
        )}
      </Modal>

      <Modal
        open={confirmAction !== null}
        onClose={() => !isActioning && setConfirmAction(null)}
        title={confirmAction === "delete" ? "Delete application" : "Cancel application"}
        description={
          confirmAction === "delete"
            ? "This will permanently remove your application and all uploaded documents. This cannot be undone."
            : "This will cancel your application. You can delete it afterwards or submit a new one."
        }
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isActioning}
              onClick={() => setConfirmAction(null)}
            >
              Go back
            </Button>
            <Button
              type="button"
              disabled={isActioning}
              className={confirmAction === "delete" ? "bg-red-600 text-white hover:bg-red-700" : "bg-amber-600 text-white hover:bg-amber-700"}
              onClick={() => void handleConfirmAction()}
            >
              {isActioning
                ? "Please wait..."
                : confirmAction === "delete"
                  ? "Yes, delete"
                  : "Yes, cancel"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          {confirmAction === "delete"
            ? `You are about to permanently delete application ${application?.referenceNumber ?? ""}. This action cannot be reversed.`
            : `You are about to cancel application ${application?.referenceNumber ?? ""}. The OMSWD team will be notified.`}
        </p>
      </Modal>

      <Modal
        open={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Apply for assistance"
        description="Complete the form below to submit a new assistance request."
        size="xl"
      >
        <ResidentRequestAssistanceForm
          onSuccess={() => {
            void queryClient.invalidateQueries({
              queryKey: user ? queryKeys.resident.portal(user.id) : ["resident", "portal"],
            });
            setIsRequestModalOpen(false);
          }}
        />
      </Modal>

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
        title="Application records"
        description="Loading your application table..."
        chips={["Case Tracking", "Resident Actions"]}
      />
      <Card className="portal-card border-[var(--portal-outline)] shadow-none">
        <CardHeader>
          <CardTitle>My application table</CardTitle>
          <CardDescription>Preparing your case records and actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResidentTableSkeleton title="Loading application records" columns={6} rows={3} />
        </CardContent>
      </Card>
    </div>
  );
}
