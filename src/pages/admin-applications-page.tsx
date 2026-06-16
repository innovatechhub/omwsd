import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  FileText,
  LoaderCircle,
  Lock,
  Printer,
  Search,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import {
  getAdminApplicationCaseDetails,
  getAdminApplications,
  getApplicationStatusHistory,
  saveAdminApplicationRemarks,
  updateAdminApplicationStatus,
  updateRequirementVerificationStatus,
} from "@/services/admin-service";
import { createSignedFileUrl } from "@/services/storage-service";
import { printIntakeSheet } from "@/lib/print-intake-sheet";
import type { AdminApplicationRecord, AdminCaseDocumentRecord, AdminCaseRequirementRecord } from "@/types/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { FileViewerModal } from "@/components/ui/file-viewer-modal";
import { RowActions } from "@/components/ui/row-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

const applicationStatusTabs: Array<{
  label: string;
  status: AdminApplicationRecord["status"];
}> = [
  { label: "Pending", status: "Pending" },
  { label: "Correction", status: "For correction" },
  { label: "For interview", status: "For interview" },
  { label: "Approved", status: "Approved" },
];

function getStatusBadgeVariant(status: AdminApplicationRecord["status"]) {
  if (status === "Approved") {
    return "secondary";
  }

  return "outline";
}

function getSlaDaysClass(rawDate: string | null): { label: string; className: string } | null {
  if (!rawDate) {
    return null;
  }

  const days = Math.floor((Date.now() - new Date(rawDate).getTime()) / 86_400_000);

  if (days < 3) {
    return { label: `${days}d`, className: "bg-green-50 text-green-700 border-green-200" };
  }

  if (days <= 7) {
    return { label: `${days}d`, className: "bg-yellow-50 text-yellow-700 border-yellow-200" };
  }

  return { label: `${days}d`, className: "bg-red-50 text-red-700 border-red-200" };
}

export function AdminApplicationsPage() {
  const queryClient = useQueryClient();
  const applicationsQuery = useQuery({
    queryKey: ["admin", "applications"],
    queryFn: getAdminApplications,
  });

  const applications = applicationsQuery.data ?? [];
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatus, setActiveStatus] =
    useState<AdminApplicationRecord["status"]>("Pending");
  const [activeReference, setActiveReference] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] =
    useState<AdminApplicationRecord["status"]>("Pending");
  const [noteDraft, setNoteDraft] = useState("");
  const [correctionItems, setCorrectionItems] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [viewingDocumentId, setViewingDocumentId] = useState<string | null>(null);
  const [fileViewerUrl, setFileViewerUrl] = useState<string | null>(null);
  const [fileViewerTitle, setFileViewerTitle] = useState<string>("File viewer");
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const matchesSearch =
        application.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        application.resident.toLowerCase().includes(searchTerm.toLowerCase()) ||
        application.assistance.toLowerCase().includes(searchTerm.toLowerCase()) ||
        application.barangay.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = application.status === activeStatus;

      return matchesSearch && matchesStatus;
    });
  }, [activeStatus, applications, searchTerm]);

  const selectedApplication = useMemo(
    () =>
      activeReference
        ? applications.find((application) => application.reference === activeReference) ?? null
        : null,
    [activeReference, applications],
  );

  const caseDetailsQuery = useQuery({
    queryKey: ["admin", "applications", "details", selectedApplication?.id ?? null],
    queryFn: async () => {
      if (!selectedApplication) {
        return { requirements: [], documents: [] };
      }

      return getAdminApplicationCaseDetails(selectedApplication.id);
    },
    enabled: selectedApplication !== null,
  });

  const statusHistoryQuery = useQuery({
    queryKey: ["admin", "applications", "history", selectedApplication?.id ?? null],
    queryFn: async () => {
      if (!selectedApplication) {
        return [];
      }

      return getApplicationStatusHistory(selectedApplication.id);
    },
    enabled: selectedApplication !== null && historyExpanded,
  });

  useEffect(() => {
    if (selectedApplication) {
      setStatusDraft(selectedApplication.status);
      setNoteDraft(selectedApplication.remarks);
      setCorrectionItems("");
      setHistoryExpanded(false);
    }
  }, [selectedApplication]);

  useEffect(() => {
    setSelectedRows(new Set());
  }, [activeStatus, searchTerm]);

  const totalPending = applications.filter(
    (application) => application.status === "Pending",
  ).length;
  const totalInterview = applications.filter(
    (application) => application.status === "For interview",
  ).length;
  const totalCorrection = applications.filter(
    (application) => application.status === "For correction",
  ).length;
  const totalApproved = applications.filter(
    (application) => application.status === "Approved",
  ).length;
  const activeStatusLabel =
    applicationStatusTabs.find((tab) => tab.status === activeStatus)?.label ?? activeStatus;

  async function handleStatusUpdate(
    application: AdminApplicationRecord,
    status: AdminApplicationRecord["status"],
    remarks?: string,
  ) {
    try {
      setIsSaving(true);
      setActiveReference(application.reference);
      await updateAdminApplicationStatus(
        application.id,
        status,
        remarks ?? application.remarks,
      );
      await applicationsQuery.refetch();
      toast.success(`Application updated to ${status}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update application.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveRemarks() {
    if (!selectedApplication) {
      return;
    }

    try {
      setIsSaving(true);

      const isCorrectionStatus = statusDraft === "For correction";
      const combinedRemarks = isCorrectionStatus && correctionItems.trim()
        ? `${noteDraft.trim()}\n\nItems to correct:\n${correctionItems.trim()}`
        : noteDraft;

      if (selectedApplication.status !== statusDraft) {
        await updateAdminApplicationStatus(selectedApplication.id, statusDraft, combinedRemarks);
      } else {
        await saveAdminApplicationRemarks(selectedApplication.id, combinedRemarks);
      }
      await applicationsQuery.refetch();
      toast.success("Case review changes saved.");
      setActiveReference(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save case review.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRequirementAction(
    requirement: AdminCaseRequirementRecord,
    action: "approved" | "rejected" | "needs_resubmission",
  ) {
    if (!selectedApplication) {
      return;
    }

    try {
      await updateRequirementVerificationStatus(requirement.id, action);
      await queryClient.invalidateQueries({
        queryKey: ["admin", "applications", "details", selectedApplication.id],
      });
      const labels = { approved: "verified", rejected: "rejected", needs_resubmission: "marked for resubmission" };
      toast.success(`Requirement "${requirement.name}" ${labels[action]}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update requirement.");
    }
  }

  async function handleBulkApprove() {
    if (selectedRows.size === 0) {
      return;
    }

    try {
      setIsSaving(true);
      const toApprove = applications.filter(
        (app) => selectedRows.has(app.reference) && app.status !== "Approved",
      );

      await Promise.all(
        toApprove.map((app) => updateAdminApplicationStatus(app.id, "Approved", app.remarks)),
      );
      await applicationsQuery.refetch();
      setSelectedRows(new Set());
      toast.success(`${toApprove.length} application(s) approved.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to bulk approve.");
    } finally {
      setIsSaving(false);
    }
  }

  function openCaseModal(reference: string) {
    setActiveReference(reference);
  }

  function closeCaseModal() {
    setActiveReference(null);
  }

  function toggleRow(reference: string) {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(reference)) {
        next.delete(reference);
      } else {
        next.add(reference);
      }
      return next;
    });
  }

  function toggleAllRows() {
    if (selectedRows.size === filteredApplications.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredApplications.map((app) => app.reference)));
    }
  }

  async function handleViewDocument(document: AdminCaseDocumentRecord) {
    try {
      setViewingDocumentId(document.id);
      const signedUrl = await createSignedFileUrl(document.bucket, document.filePath);
      setFileViewerTitle(document.fileName ?? "Document");
      setFileViewerUrl(signedUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to open this file.");
    } finally {
      setViewingDocumentId((current) => (current === document.id ? null : current));
    }
  }


  const allSelected =
    filteredApplications.length > 0 && selectedRows.size === filteredApplications.length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Pending" value={String(totalPending)} />
        <SummaryCard label="For correction" value={String(totalCorrection)} />
        <SummaryCard label="For interview" value={String(totalInterview)} />
        <SummaryCard label="Approved" value={String(totalApproved)} />
      </section>

      <Card className="portal-card border-[var(--portal-outline)] shadow-none">
        <CardHeader>
          <CardTitle>Queue filters</CardTitle>
          <CardDescription>Search by reference, resident, service, or barangay.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search reference, resident, service, or barangay"
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="portal-card border-[var(--portal-outline)] shadow-none">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Application table</CardTitle>
              <CardDescription>
                SLA badge shows days since submission. Select rows for bulk actions.
              </CardDescription>
            </div>
            {selectedRows.size > 0 && (
              <Button
                size="sm"
                onClick={() => void handleBulkApprove()}
                disabled={isSaving}
                className="bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve {selectedRows.size} selected
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-4" role="tablist" aria-label="Application status">
            {applicationStatusTabs.map((tab) => {
              const isActive = tab.status === activeStatus;
              const count = applications.filter((application) => application.status === tab.status).length;

              return (
                <button
                  key={tab.status}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveStatus(tab.status)}
                  className={[
                    "flex min-h-11 items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition-colors",
                    isActive
                      ? "border-primary/20 bg-primary text-primary-foreground"
                      : "border-[var(--portal-outline)] bg-white text-[var(--portal-muted)] hover:bg-[var(--portal-surface-soft)] hover:text-[var(--portal-ink)]",
                  ].join(" ")}
                >
                  <span>{tab.label}</span>
                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-xs",
                      isActive ? "bg-white/15 text-white" : "bg-[var(--portal-surface-soft)] text-[var(--portal-ink)]",
                    ].join(" ")}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>{filteredApplications.length} {activeStatusLabel.toLowerCase()} record(s) shown</p>
            <p>Tap or click a row to open review modal</p>
          </div>

          {applicationsQuery.isLoading ? (
            <div className="rounded-xl border border-dashed border-[var(--portal-outline)] bg-[var(--portal-surface-soft)] px-4 py-10 text-center text-sm text-[var(--portal-muted)]">
              Loading application records...
            </div>
          ) : filteredApplications.length > 0 ? (
            <>
              <div className="grid gap-3 md:hidden">
                {filteredApplications.map((application) => {
                  const sla = getSlaDaysClass(application.submittedAtRaw);

                  return (
                    <button
                      key={application.reference}
                      type="button"
                      className="rounded-xl border border-[var(--portal-outline)] bg-white p-4 text-left transition-colors hover:bg-[var(--portal-surface-soft)]"
                      onClick={() => openCaseModal(application.reference)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--portal-accent)]">
                            {application.reference}
                          </p>
                          <p className="mt-1 truncate text-base font-semibold text-[var(--portal-ink)]">
                            {application.resident}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <Badge variant={getStatusBadgeVariant(application.status)}>
                            {application.status}
                          </Badge>
                          {sla && (
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${sla.className}`}>
                              <Clock className="h-3 w-3" />
                              {sla.label}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                        <Field label="Service" value={application.assistance} />
                        <Field label="Barangay" value={application.barangay} />
                        <Field label="Submitted" value={application.submittedAt} />
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <tr>
                      <TableHead className="w-[40px]">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleAllRows}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Resident</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Barangay</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="w-[70px] text-right">Actions</TableHead>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((application) => {
                      const sla = getSlaDaysClass(application.submittedAtRaw);

                      return (
                        <TableRow
                          key={application.reference}
                          data-selected={activeReference === application.reference}
                          className="cursor-pointer"
                          onClick={() => openCaseModal(application.reference)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedRows.has(application.reference)}
                              onChange={() => toggleRow(application.reference)}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-[var(--portal-accent)]">{application.reference}</p>
                          </TableCell>
                          <TableCell>{application.resident}</TableCell>
                          <TableCell className="text-muted-foreground">{application.assistance}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(application.status)}>
                              {application.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {sla ? (
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${sla.className}`}>
                                <Clock className="h-3 w-3" />
                                {sla.label}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>{application.barangay}</TableCell>
                          <TableCell>{application.submittedAt}</TableCell>
                          <TableCell className="text-right">
                            <RowActions
                              actions={[
                                {
                                  label: "Open review form",
                                  icon: <Eye className="h-4 w-4" />,
                                  onSelect: () => openCaseModal(application.reference),
                                },
                                {
                                  label: "Quick approve",
                                  icon: <CheckCircle2 className="h-4 w-4" />,
                                  disabled:
                                    isSaving ||
                                    application.status === "Approved",
                                  onSelect: () =>
                                    void handleStatusUpdate(
                                      application,
                                      "Approved",
                                      application.remarks,
                                    ),
                                },
                              ]}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-[var(--portal-outline)] bg-[var(--portal-surface-soft)] px-4 py-10 text-center text-sm text-[var(--portal-muted)]">
              No {activeStatusLabel.toLowerCase()} applications matched the current search.
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={selectedApplication !== null}
        onClose={closeCaseModal}
        title="Case review"
        description={selectedApplication ? `${selectedApplication.reference} · ${selectedApplication.resident}` : ""}
        size="xl"
        footer={
          (() => {
            const isLocked = selectedApplication?.status === "Approved";
            return (
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {isLocked ? "This case is closed and cannot be edited." : "Changes are saved to the application record."}
                </p>
                <div className="flex gap-2">
                  {selectedApplication && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => printIntakeSheet(selectedApplication)}
                    >
                      <Printer className="h-4 w-4" />
                      Print Intake Sheet
                    </Button>
                  )}
                  <Button type="button" variant="outline" onClick={closeCaseModal}>
                    {isLocked ? "Close" : "Cancel"}
                  </Button>
                  {!isLocked && (
                    <Button type="button" onClick={() => void handleSaveRemarks()} disabled={isSaving}>
                      {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Save changes
                    </Button>
                  )}
                </div>
              </div>
            );
          })()
        }
      >
        {selectedApplication ? (() => {
          const isLocked = selectedApplication.status === "Approved";

          const workflowSteps: Array<{ label: string; key: AdminApplicationRecord["status"] }> = [
            { label: "Pending", key: "Pending" },
            { label: "For correction", key: "For correction" },
            { label: "For interview", key: "For interview" },
            { label: "Approved", key: "Approved" },
          ];

          const currentStepIndex = workflowSteps.findIndex((s) => s.key === selectedApplication.status);

          return (
            <div className="space-y-6">

              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                <div>
                  <p className="text-lg font-semibold text-foreground">{selectedApplication.resident}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{selectedApplication.reference}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isLocked && (
                    <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <Lock className="h-3 w-3" />
                      Case closed — read only
                    </span>
                  )}
                  <Badge variant={getStatusBadgeVariant(selectedApplication.status)}>
                    {selectedApplication.status}
                  </Badge>
                </div>
              </div>

              {/* Case details */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                <Field label="Service" value={selectedApplication.assistance} />
                <Field label="Barangay" value={selectedApplication.barangay} />
                <Field label="Submitted" value={selectedApplication.submittedAt} />
                <Field label="Remarks" value={selectedApplication.remarks || "—"} />
              </div>

              {/* Workflow pipeline */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Workflow pipeline
                </p>
                <div className="flex items-center gap-1">
                  {workflowSteps.map((step, index) => {
                    const isDone = index < currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    const isCorrection = step.key === "For correction";
                    return (
                      <div key={step.key} className="flex min-w-0 flex-1 items-center gap-1">
                        <div
                          className={[
                            "flex min-w-0 flex-1 flex-col items-center rounded-lg border px-2 py-2 text-center transition-colors",
                            isCurrent && isCorrection
                              ? "border-amber-300 bg-amber-50"
                              : isCurrent
                                ? "border-blue-300 bg-blue-50"
                                : isDone
                                  ? "border-emerald-200 bg-emerald-50"
                                  : "border-muted bg-muted/20",
                          ].join(" ")}
                        >
                          <span className={[
                            "text-[10px] font-semibold leading-tight",
                            isCurrent && isCorrection ? "text-amber-700"
                              : isCurrent ? "text-blue-700"
                              : isDone ? "text-emerald-700"
                              : "text-muted-foreground",
                          ].join(" ")}>
                            {isDone ? <CheckCircle2 className="mx-auto mb-0.5 h-3.5 w-3.5" /> : null}
                            {step.label}
                          </span>
                        </div>
                        {index < workflowSteps.length - 1 && (
                          <ArrowRight className={[
                            "h-3 w-3 shrink-0",
                            isDone ? "text-emerald-400" : "text-muted-foreground/30",
                          ].join(" ")} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Locked banner for approved/completed */}
              {isLocked && (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-emerald-900">Case is approved</p>
                    <p className="mt-0.5 text-emerald-700">
                      This application has been finalized. Status changes and remarks editing are disabled. You can still view all submitted documents and the full case history below.
                    </p>
                  </div>
                </div>
              )}

              {/* Status selector — only shown when not locked */}
              {!isLocked && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Update case status</p>
                    <p className="text-xs text-muted-foreground">Select a status then save</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(
                      [
                        { value: "Pending", color: "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100", active: "border-slate-500 bg-slate-100 ring-2 ring-slate-400 ring-offset-1" },
                        { value: "For correction", color: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100", active: "border-amber-500 bg-amber-100 ring-2 ring-amber-400 ring-offset-1" },
                        { value: "For interview", color: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100", active: "border-blue-500 bg-blue-100 ring-2 ring-blue-400 ring-offset-1" },
                        { value: "Approved", color: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100", active: "border-emerald-500 bg-emerald-100 ring-2 ring-emerald-400 ring-offset-1" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStatusDraft(opt.value as AdminApplicationRecord["status"])}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                          statusDraft === opt.value ? opt.active : opt.color
                        }`}
                      >
                        {opt.value}
                      </button>
                    ))}
                  </div>
                  {statusDraft !== selectedApplication.status && (
                    <p className="flex items-center gap-1.5 text-xs text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Status will change from <strong>{selectedApplication.status}</strong> to <strong>{statusDraft}</strong> on save.
                    </p>
                  )}
                </div>
              )}

              {/* Correction items — only when For correction is selected */}
              {!isLocked && statusDraft === "For correction" && (
                <div className="space-y-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <label className="text-sm font-semibold text-amber-900" htmlFor="correction-items">
                    Items to correct
                  </label>
                  <p className="text-xs text-amber-700">List each item the resident must fix. This will be appended to the remarks sent to the resident.</p>
                  <Textarea
                    id="correction-items"
                    value={correctionItems}
                    onChange={(e) => setCorrectionItems(e.target.value)}
                    placeholder="One item per line, e.g. Missing medical certificate"
                    className="min-h-[72px] resize-none border-amber-200 bg-white"
                  />
                </div>
              )}

              {/* Resident's notes */}
              {selectedApplication.requestReason && (
                <div className="space-y-1.5 rounded-xl border border-[var(--portal-outline)] bg-[var(--portal-surface-soft)] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Resident's notes</p>
                  <p className="whitespace-pre-wrap text-sm text-foreground">{selectedApplication.requestReason}</p>
                </div>
              )}

              {/* Reviewer remarks */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold" htmlFor="case-remarks">Reviewer remarks</label>
                  {isLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isLocked ? "Remarks recorded on this case." : "Internal notes, instructions for the resident, or release details."}
                </p>
                <Textarea
                  id="case-remarks"
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder={isLocked ? "No remarks recorded." : "Add notes, correction requests, or release instructions here."}
                  className="min-h-[80px] resize-none"
                  readOnly={isLocked}
                  disabled={isLocked}
                />
              </div>

              {/* Requirements */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Requirements</p>
                  {!isLocked && <p className="text-xs text-muted-foreground">Approve, flag, or reject configured requirements</p>}
                </div>
                {caseDetailsQuery.isLoading ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                    <LoaderCircle className="h-4 w-4 animate-spin" /> Loading requirements...
                  </div>
                ) : caseDetailsQuery.data?.requirements.length ? (
                  <div className="space-y-2">
                    {caseDetailsQuery.data.requirements.map((req) => (
                      <div
                        key={req.id}
                        className={[
                          "rounded-xl border p-4",
                          req.status === "approved" ? "border-emerald-200 bg-emerald-50/50"
                            : req.status === "rejected" || req.status === "needs_resubmission" ? "border-amber-200 bg-amber-50/50"
                            : "border-[var(--portal-outline)] bg-card",
                        ].join(" ")}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{req.name}</p>
                              <Badge variant="outline">{req.statusLabel}</Badge>
                            </div>
                            {(req.remarks ?? req.description) && (
                              <p className="mt-0.5 text-xs text-muted-foreground">{req.remarks ?? req.description}</p>
                            )}
                            <p className="mt-1 text-xs text-muted-foreground">
                              <FileText className="mr-1 inline h-3 w-3" />
                              {req.documents.length} file{req.documents.length !== 1 ? "s" : ""} submitted
                            </p>
                          </div>
                          {!isLocked && req.isActionable && (
                            <div className="flex shrink-0 flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5 border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                onClick={() => void handleRequirementAction(req, "approved")}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Approve
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5 border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                onClick={() => void handleRequirementAction(req, "needs_resubmission")}
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Request resubmission
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5 border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                                onClick={() => void handleRequirementAction(req, "rejected")}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                        {!req.isActionable && (
                          <p className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                            This is a document-only fallback because no requirement template is configured for this service. Add a requirement template before using requirement approval actions.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                    No requirements linked to this application yet.
                  </div>
                )}
              </div>

              {/* Documents */}
              <div className="space-y-2">
                <p className="text-sm font-semibold">Submitted documents</p>
                {caseDetailsQuery.isLoading ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                    <LoaderCircle className="h-4 w-4 animate-spin" /> Loading documents...
                  </div>
                ) : caseDetailsQuery.data?.documents.length ? (
                  <div className="rounded-xl border">
                    <Table>
                      <TableHeader>
                        <tr>
                          <TableHead>File</TableHead>
                          <TableHead className="hidden sm:table-cell">Requirement</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden sm:table-cell">Uploaded</TableHead>
                          <TableHead className="w-[100px] text-right">Action</TableHead>
                        </tr>
                      </TableHeader>
                      <TableBody>
                        {caseDetailsQuery.data.documents.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="max-w-[160px] truncate font-medium">{doc.fileName}</TableCell>
                            <TableCell className="hidden text-muted-foreground sm:table-cell">
                              {doc.requirementName}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{doc.statusLabel}</Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{doc.createdAtLabel}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5"
                                onClick={() => void handleViewDocument(doc)}
                                disabled={viewingDocumentId === doc.id}
                              >
                                {viewingDocumentId === doc.id
                                  ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                                  : <Eye className="h-3.5 w-3.5" />}
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                    No documents submitted yet.
                  </div>
                )}
              </div>

              {/* Case history */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setHistoryExpanded((p) => !p)}
                  className="flex w-full items-center justify-between rounded-xl border bg-muted/30 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted/50"
                >
                  <span>Case history</span>
                  {historyExpanded
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {historyExpanded && (
                  <div className="rounded-xl border">
                    {statusHistoryQuery.isLoading ? (
                      <div className="flex items-center gap-2 px-4 py-4 text-sm text-muted-foreground">
                        <LoaderCircle className="h-4 w-4 animate-spin" /> Loading history...
                      </div>
                    ) : statusHistoryQuery.data?.length ? (
                      <Table>
                        <TableHeader>
                          <tr>
                            <TableHead className="w-[130px]">Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Remarks</TableHead>
                          </tr>
                        </TableHeader>
                        <TableBody>
                          {statusHistoryQuery.data.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell className="whitespace-nowrap text-muted-foreground">{entry.createdAtLabel}</TableCell>
                              <TableCell className="font-medium">{entry.statusLabel}</TableCell>
                              <TableCell className="text-muted-foreground">{entry.remarks ?? "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="px-4 py-4 text-sm text-muted-foreground">No history recorded yet.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })() : null}
      </Modal>

      <FileViewerModal
        open={fileViewerUrl !== null}
        url={fileViewerUrl}
        title={fileViewerTitle}
        onClose={() => setFileViewerUrl(null)}
      />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="portal-card border-[var(--portal-outline)] shadow-none">
      <CardContent className="p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--portal-muted)]">
          {label}
        </p>
        <p className="mt-1 text-2xl font-semibold text-[var(--portal-ink)]">{value}</p>
      </CardContent>
    </Card>
  );
}

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
