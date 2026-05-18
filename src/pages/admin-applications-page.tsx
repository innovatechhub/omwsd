import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  LoaderCircle,
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
import type { AdminApplicationRecord, AdminCaseDocumentRecord, AdminCaseRequirementRecord } from "@/types/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { RowActions } from "@/components/ui/row-actions";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

function getStatusBadgeVariant(status: AdminApplicationRecord["status"]) {
  if (status === "Approved" || status === "Completed") {
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeReference, setActiveReference] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] =
    useState<AdminApplicationRecord["status"]>("Pending verification");
  const [noteDraft, setNoteDraft] = useState("");
  const [correctionItems, setCorrectionItems] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [viewingDocumentId, setViewingDocumentId] = useState<string | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const matchesSearch =
        application.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        application.resident.toLowerCase().includes(searchTerm.toLowerCase()) ||
        application.assistance.toLowerCase().includes(searchTerm.toLowerCase()) ||
        application.barangay.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || application.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

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

  const totalPending = applications.filter(
    (application) => application.status === "Pending verification",
  ).length;
  const totalReview = applications.filter(
    (application) => application.status === "Under review",
  ).length;
  const totalCorrection = applications.filter(
    (application) => application.status === "For correction",
  ).length;

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
        (app) => selectedRows.has(app.reference) && app.status !== "Approved" && app.status !== "Completed",
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
    const viewer = window.open("about:blank", "_blank");
    if (viewer) {
      viewer.opener = null;
    }

    try {
      setViewingDocumentId(document.id);
      const signedUrl = await createSignedFileUrl(document.bucket, document.filePath);

      if (viewer && !viewer.closed) {
        viewer.location.replace(signedUrl);
        return;
      }

      window.location.assign(signedUrl);
    } catch (error) {
      if (viewer && !viewer.closed) {
        viewer.close();
      }
      toast.error(error instanceof Error ? error.message : "Unable to open this file.");
    } finally {
      setViewingDocumentId((current) => (current === document.id ? null : current));
    }
  }

  const requirementNameByRecordId = useMemo(() => {
    const map = new Map<string, string>();

    for (const requirement of caseDetailsQuery.data?.requirements ?? []) {
      map.set(requirement.id, requirement.name);
    }

    return map;
  }, [caseDetailsQuery.data?.requirements]);

  const allSelected =
    filteredApplications.length > 0 && selectedRows.size === filteredApplications.length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="All records" value={String(applications.length)} />
        <SummaryCard label="Pending verification" value={String(totalPending)} />
        <SummaryCard label="Under review" value={String(totalReview)} />
        <SummaryCard label="For correction" value={String(totalCorrection)} />
      </section>

      <Card className="portal-card border-[var(--portal-outline)] shadow-none">
        <CardHeader>
          <CardTitle>Queue filters</CardTitle>
          <CardDescription>Search by reference, resident, service, or barangay.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search reference, resident, service, or barangay"
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending verification">Pending verification</option>
            <option value="under review">Under review</option>
            <option value="for correction">For correction</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
          </Select>
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
          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>{filteredApplications.length} record(s) shown</p>
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
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <DetailRow label="Service" value={application.assistance} />
                        <DetailRow label="Barangay" value={application.barangay} />
                        <DetailRow label="Submitted" value={application.submittedAt} />
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
                                    application.status === "Approved" ||
                                    application.status === "Completed",
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
              No applications matched the current filters.
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={selectedApplication !== null}
        onClose={closeCaseModal}
        title="Case review form"
        description="Update status, verify requirements, and review case history."
        size="xl"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeCaseModal}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSaveRemarks()} disabled={isSaving}>
              Save changes
            </Button>
          </div>
        }
      >
        {selectedApplication ? (
          <div className="space-y-5">
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {selectedApplication.reference}
                  </p>
                  <p className="mt-1 text-lg font-semibold">{selectedApplication.resident}</p>
                  <p className="text-sm text-muted-foreground">{selectedApplication.assistance}</p>
                </div>
                <Badge variant={getStatusBadgeVariant(selectedApplication.status)}>
                  {selectedApplication.status}
                </Badge>
              </div>
              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                <DetailRow label="Submitted" value={selectedApplication.submittedAt} />
                <DetailRow label="Barangay" value={selectedApplication.barangay} />
                <DetailRow
                  label="Age"
                  value={(() => {
                    const sla = getSlaDaysClass(selectedApplication.submittedAtRaw);
                    return sla ? `${sla.label} old` : "—";
                  })()}
                />
              </div>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="case-status">
                  Case status
                </label>
                <Select
                  id="case-status"
                  value={statusDraft}
                  onChange={(event) =>
                    setStatusDraft(event.target.value as AdminApplicationRecord["status"])
                  }
                >
                  <option value="Pending verification">Pending verification</option>
                  <option value="Under review">Under review</option>
                  <option value="For correction">For correction</option>
                  <option value="Approved">Approved</option>
                  <option value="Completed">Completed</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="case-remarks">
                Reviewer remarks
              </label>
              <Textarea
                id="case-remarks"
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                placeholder="Add reviewer notes, correction requests, or release instructions."
                className="min-h-[100px]"
              />
            </div>

            {statusDraft === "For correction" && (
              <div className="space-y-2 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                <label className="text-sm font-semibold text-yellow-800" htmlFor="correction-items">
                  Items the resident needs to correct
                </label>
                <p className="text-xs text-yellow-700">These will be appended to remarks and sent as a notification.</p>
                <Textarea
                  id="correction-items"
                  value={correctionItems}
                  onChange={(event) => setCorrectionItems(event.target.value)}
                  placeholder="List what the resident needs to fix or resubmit (one per line)."
                  className="min-h-[80px] border-yellow-200 bg-white"
                />
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Requirement Checklist
              </h3>
              {caseDetailsQuery.isLoading ? (
                <div className="rounded-md border border-dashed bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                  Loading requirement records...
                </div>
              ) : caseDetailsQuery.error instanceof Error ? (
                <div className="rounded-md border border-dashed bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                  {caseDetailsQuery.error.message}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <tr>
                      <TableHead>Requirement</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Files</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {caseDetailsQuery.data?.requirements.length ? (
                      caseDetailsQuery.data.requirements.map((requirement) => (
                        <TableRow key={requirement.id}>
                          <TableCell className="font-medium">{requirement.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{requirement.statusLabel}</Badge>
                          </TableCell>
                          <TableCell>{requirement.documents.length}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {requirement.remarks ??
                              requirement.description ??
                              "No requirement remarks yet."}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                title="Verify"
                                className="h-7 w-7 p-0 text-green-600 hover:border-green-400 hover:bg-green-50"
                                onClick={() => void handleRequirementAction(requirement, "approved")}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                title="Reject"
                                className="h-7 w-7 p-0 text-red-600 hover:border-red-400 hover:bg-red-50"
                                onClick={() => void handleRequirementAction(requirement, "rejected")}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                title="Needs resubmission"
                                className="h-7 w-7 p-0 text-yellow-600 hover:border-yellow-400 hover:bg-yellow-50"
                                onClick={() => void handleRequirementAction(requirement, "needs_resubmission")}
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                          No requirement records are linked yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Submitted Documents
              </h3>
              {caseDetailsQuery.isLoading ? (
                <div className="rounded-md border border-dashed bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                  Loading submitted files...
                </div>
              ) : caseDetailsQuery.error instanceof Error ? (
                <div className="rounded-md border border-dashed bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                  {caseDetailsQuery.error.message}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <tr>
                      <TableHead>File</TableHead>
                      <TableHead>Linked requirement</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="w-[90px] text-right">Action</TableHead>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {caseDetailsQuery.data?.documents.length ? (
                      caseDetailsQuery.data.documents.map((document) => (
                        <TableRow key={document.id}>
                          <TableCell className="font-medium">{document.fileName}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {document.applicationRequirementId
                              ? requirementNameByRecordId.get(document.applicationRequirementId) ??
                                "Linked requirement"
                              : "General supporting document"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{document.statusLabel}</Badge>
                          </TableCell>
                          <TableCell>{document.createdAtLabel}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => void handleViewDocument(document)}
                              disabled={viewingDocumentId === document.id}
                            >
                              {viewingDocumentId === document.id ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                          No submitted documents are linked to this case.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setHistoryExpanded((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-xl border border-[var(--portal-outline)] bg-[var(--portal-surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--portal-ink)] hover:bg-white transition-colors"
              >
                <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Case History</span>
                {historyExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {historyExpanded && (
                <div className="rounded-xl border border-[var(--portal-outline)]">
                  {statusHistoryQuery.isLoading ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      Loading case history...
                    </div>
                  ) : statusHistoryQuery.data?.length ? (
                    <Table>
                      <TableHeader>
                        <tr>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Remarks</TableHead>
                        </tr>
                      </TableHeader>
                      <TableBody>
                        {statusHistoryQuery.data.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="whitespace-nowrap">{entry.createdAtLabel}</TableCell>
                            <TableCell className="font-medium">{entry.statusLabel}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {entry.remarks ?? "No remarks recorded."}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No status history recorded for this case yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--portal-outline)] bg-white px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--portal-muted)]">
        {label}
      </p>
      <p className="mt-1 font-medium text-[var(--portal-ink)]">{value}</p>
    </div>
  );
}
