import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, FileImage, LoaderCircle, Search, Send, UserMinus, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";

import {
  getAdminApplications,
  getAdminResidents,
  getResidentIdFiles,
  sendResidentFollowUpNotification,
  setResidentAccountState,
  verifyResident,
} from "@/services/admin-service";
import { createSignedFileUrl } from "@/services/storage-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { FileViewerModal } from "@/components/ui/file-viewer-modal";
import { RowActions } from "@/components/ui/row-actions";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { AdminResidentRecord } from "@/types/admin";

export function AdminResidentsPage() {
  const residentsQuery = useQuery({
    queryKey: ["admin", "residents"],
    queryFn: getAdminResidents,
  });

  const applicationsQuery = useQuery({
    queryKey: ["admin", "applications"],
    queryFn: getAdminApplications,
  });

  const residents = residentsQuery.data ?? [];
  const applications = applicationsQuery.data ?? [];
  const [searchTerm, setSearchTerm] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [activeResidentId, setActiveResidentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filteredResidents = useMemo(() => {
    return residents.filter((resident) => {
      const matchesSearch =
        resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resident.barangay.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resident.contact.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesVerification =
        verificationFilter === "all"
          ? true
          : verificationFilter === "pending approval"
          ? resident.account === "Suspended"
          : resident.status.toLowerCase() === verificationFilter;

      return matchesSearch && matchesVerification;
    });
  }, [residents, searchTerm, verificationFilter]);

  useEffect(() => {
    if (activeResidentId && !residents.some((resident) => resident.id === activeResidentId)) {
      setActiveResidentId(null);
    }
  }, [activeResidentId, residents]);

  const selectedResident = useMemo(
    () =>
      activeResidentId ? residents.find((resident) => resident.id === activeResidentId) ?? null : null,
    [activeResidentId, residents],
  );

  const [followUpResidentId, setFollowUpResidentId] = useState<string | null>(null);
  const [followUpMessage, setFollowUpMessage] = useState("");
  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);
  const [viewingIdFileId, setViewingIdFileId] = useState<string | null>(null);
  const [fileViewerUrl, setFileViewerUrl] = useState<string | null>(null);

  const idFilesQuery = useQuery({
    queryKey: ["admin", "residents", "id-files", selectedResident?.profileId ?? null],
    queryFn: () => getResidentIdFiles(selectedResident!.profileId),
    enabled: selectedResident !== null,
  });

  const followUpResident = useMemo(
    () => (followUpResidentId ? residents.find((r) => r.id === followUpResidentId) ?? null : null),
    [followUpResidentId, residents],
  );

  const verifiedCount = residents.filter((resident) => resident.status === "Verified").length;
  const activeAccounts = residents.filter((resident) => resident.account === "Active").length;
  const pendingApproval = residents.filter((resident) => resident.account === "Suspended").length;

  async function handleVerifyResident(resident: AdminResidentRecord) {
    try {
      setIsSaving(true);
      setActiveResidentId(resident.id);
      await verifyResident(resident.id);
      await residentsQuery.refetch();
      toast.success("Resident marked as verified.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to verify resident.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleApproveAccount(resident: AdminResidentRecord) {
    try {
      setIsSaving(true);
      await setResidentAccountState(resident.profileId, true);
      await residentsQuery.refetch();
      toast.success(`${resident.name}'s account approved and activated.`);
      closeResidentModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to approve account.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleAccount(resident: AdminResidentRecord) {
    try {
      setIsSaving(true);
      setActiveResidentId(resident.id);
      await setResidentAccountState(resident.profileId, resident.account !== "Active");
      await residentsQuery.refetch();
      toast.success(
        resident.account === "Active"
          ? "Resident account suspended."
          : "Resident account reactivated.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update account state.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSendFollowUp() {
    if (!followUpResident) {
      return;
    }

    const message = followUpMessage.trim() || "Please check your application status and complete any pending requirements.";
    const latestApp = applications.find((app) => app.resident === followUpResident.name);

    try {
      setIsSendingFollowUp(true);
      await sendResidentFollowUpNotification(
        followUpResident.profileId,
        "Follow-up from OMSWD",
        message,
        latestApp?.id,
      );
      toast.success("Follow-up notification sent to resident.");
      setFollowUpResidentId(null);
      setFollowUpMessage("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send follow-up.");
    } finally {
      setIsSendingFollowUp(false);
    }
  }

  async function handleViewIdFile(filePath: string, fileId: string) {
    try {
      setViewingIdFileId(fileId);
      const url = await createSignedFileUrl("ids", filePath);
      setFileViewerUrl(url);
    } catch {
      toast.error("Unable to open this file.");
    } finally {
      setViewingIdFileId((current) => (current === fileId ? null : current));
    }
  }

  function openResidentModal(residentId: string) {
    setActiveResidentId(residentId);
  }

  function closeResidentModal() {
    setActiveResidentId(null);
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total residents" value={String(residents.length)} />
        <SummaryCard label="Verified" value={String(verifiedCount)} />
        <SummaryCard label="Active accounts" value={String(activeAccounts)} />
        <SummaryCard label="Pending approval" value={String(pendingApproval)} highlight={pendingApproval > 0} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Registry filters</CardTitle>
          <CardDescription>Find resident records quickly by name, barangay, or contact.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search name, barangay, or contact"
              className="pl-9"
            />
          </div>
          <Select
            value={verificationFilter}
            onChange={(event) => setVerificationFilter(event.target.value)}
          >
            <option value="all">All residents</option>
            <option value="pending approval">Pending approval</option>
            <option value="verified">Verified</option>
            <option value="pending verification">Pending verification</option>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resident table</CardTitle>
          <CardDescription>
            Responsive list with modal-based account actions for a cleaner registry view.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>{filteredResidents.length} resident(s) shown</p>
            <p>Tap or click a row to open the resident modal</p>
          </div>

          {residentsQuery.isLoading ? (
            <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
              Loading resident records...
            </div>
          ) : filteredResidents.length > 0 ? (
            <>
              <div className="grid gap-3 md:hidden">
                {filteredResidents.map((resident) => (
                  <button
                    key={resident.id}
                    type="button"
                    className="rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/20"
                    onClick={() => openResidentModal(resident.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-foreground">{resident.name}</p>
                        <p className="mt-1 truncate text-sm text-muted-foreground">{resident.contact}</p>
                      </div>
                      <Badge variant={resident.status === "Verified" ? "secondary" : "outline"}>
                        {resident.status}
                      </Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <Field label="Barangay" value={resident.barangay} />
                      <Field label="Account" value={resident.account === "Suspended" ? "Pending approval" : resident.account} />
                      <Field label="Requests" value={String(resident.referenceCount)} />
                      <Field label="Status" value={resident.status} />
                    </div>
                  </button>
                ))}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <tr>
                      <TableHead>Resident</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Barangay</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Requests</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead className="w-[70px] text-right">Actions</TableHead>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {filteredResidents.map((resident) => (
                      <TableRow
                        key={resident.id}
                        data-selected={selectedResident?.id === resident.id}
                        className="cursor-pointer"
                        onClick={() => openResidentModal(resident.id)}
                      >
                        <TableCell className="font-medium">{resident.name}</TableCell>
                        <TableCell>
                          <Badge variant={resident.status === "Verified" ? "secondary" : "outline"}>
                            {resident.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{resident.barangay}</TableCell>
                        <TableCell>
                          <span className={resident.account === "Suspended" ? "text-amber-700 font-medium" : ""}>
                            {resident.account === "Suspended" ? "Pending approval" : resident.account}
                          </span>
                        </TableCell>
                        <TableCell>{resident.contact}</TableCell>
                        <TableCell className="font-medium text-primary">
                          {resident.referenceCount}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {resident.registeredAt}
                        </TableCell>
                        <TableCell className="text-right">
                          <RowActions
                            actions={[
                              {
                                label: "Manage resident",
                                icon: <Eye className="h-4 w-4" />,
                                onSelect: () => openResidentModal(resident.id),
                              },
                              {
                                label: "Quick verify",
                                icon: <UserRoundCheck className="h-4 w-4" />,
                                disabled: isSaving || resident.status === "Verified" || !resident.hasResidentRow,
                                onSelect: () => void handleVerifyResident(resident),
                              },
                            ]}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
              No residents matched the current filters.
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={followUpResident !== null}
        onClose={() => setFollowUpResidentId(null)}
        title="Send follow-up notification"
        description="This message will appear in the resident's notification inbox."
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setFollowUpResidentId(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleSendFollowUp()}
              disabled={isSendingFollowUp}
            >
              <Send className="h-4 w-4" />
              Send notification
            </Button>
          </div>
        }
      >
        {followUpResident ? (
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="text-sm font-semibold">{followUpResident.name}</p>
              <p className="text-xs text-muted-foreground">{followUpResident.barangay} · {followUpResident.contact}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="followup-message">
                Message (optional)
              </label>
              <Textarea
                id="followup-message"
                value={followUpMessage}
                onChange={(e) => setFollowUpMessage(e.target.value)}
                placeholder="Leave blank to send the default follow-up reminder."
                className="min-h-[100px]"
              />
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={selectedResident !== null}
        onClose={closeResidentModal}
        title="Resident management"
        description="Review profile status and run verification or account actions."
        size="xl"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeResidentModal}>
              Close
            </Button>
          </div>
        }
      >
        {selectedResident ? (
          <div className="space-y-6">
            {selectedResident.account === "Suspended" && (
              <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <span className="mt-0.5 shrink-0 font-bold">!</span>
                <div>
                  <p className="font-medium">Account pending approval</p>
                  <p className="text-amber-700">This resident registered but cannot sign in until their account is approved.</p>
                </div>
              </div>
            )}

            {!selectedResident.hasResidentRow && (
              <div className="flex items-start gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                <span className="mt-0.5 shrink-0 font-bold">i</span>
                <div>
                  <p className="font-medium">Profile not yet completed</p>
                  <p className="text-blue-700">This resident has registered but has not filled out their full profile yet. Verification will be available once they complete it.</p>
                </div>
              </div>
            )}

            {/* Identity header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
              <div>
                <p className="text-lg font-semibold text-foreground">{selectedResident.name}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{selectedResident.residentCode}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={selectedResident.account === "Active" ? "secondary" : "outline"}>
                  {selectedResident.account === "Suspended" ? "Pending approval" : "Active"}
                </Badge>
                <Badge variant={selectedResident.status === "Verified" ? "secondary" : "outline"}>
                  {selectedResident.status}
                </Badge>
              </div>
            </div>

            {/* Personal information */}
            <FieldGroup title="Personal information">
              <Field label="First name" value={selectedResident.firstName} />
              <Field label="Middle name" value={selectedResident.middleName} />
              <Field label="Last name" value={selectedResident.lastName} />
              <Field label="Suffix" value={selectedResident.suffix} />
              <Field label="Birth date" value={selectedResident.birthDateLabel} />
              <Field label="Sex" value={selectedResident.sexLabel} />
              <Field label="Civil status" value={selectedResident.civilStatusLabel} />
            </FieldGroup>

            {/* Contact and address */}
            <FieldGroup title="Contact and address">
              <Field label="Email" value={selectedResident.email} />
              <Field label="Phone" value={selectedResident.contact} />
              <Field label="Municipality" value={selectedResident.municipality} />
              <Field label="Barangay" value={selectedResident.barangay} />
              <Field label="Street address" value={selectedResident.addressLine} className="sm:col-span-2" />
            </FieldGroup>

            {/* Account review */}
            <FieldGroup title="Account review">
              <Field
                label="Account status"
                value={selectedResident.account === "Suspended" ? "Pending approval" : selectedResident.account}
              />
              <Field label="Verification" value={selectedResident.status} />
              <Field label="Government ID type" value={selectedResident.governmentIdTypeLabel} />
              <Field label="Government ID number" value={selectedResident.governmentIdNumber} />
              <Field label="Registered" value={selectedResident.registeredAt} />
              <Field label="Verified at" value={selectedResident.verifiedAt} />
              <Field label="Total requests" value={String(selectedResident.referenceCount)} />
            </FieldGroup>

            {/* Government ID uploads */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Government ID uploads
              </p>
              {idFilesQuery.isLoading ? (
                <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Loading uploaded IDs...
                </div>
              ) : idFilesQuery.data && idFilesQuery.data.length > 0 ? (
                <div className="divide-y rounded-xl border">
                  {idFilesQuery.data.map((file) => (
                    <div
                      key={file.filePath}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <FileImage className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm font-medium text-foreground">
                          {file.name}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 shrink-0 gap-1.5"
                        disabled={viewingIdFileId === file.filePath}
                        onClick={() => void handleViewIdFile(file.filePath, file.filePath)}
                      >
                        {viewingIdFileId === file.filePath
                          ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                          : <Eye className="h-3.5 w-3.5" />}
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
                  No government ID files uploaded yet.
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 border-t pt-4">
              {selectedResident.account === "Suspended" ? (
                <Button
                  type="button"
                  disabled={isSaving}
                  onClick={() => void handleApproveAccount(selectedResident)}
                >
                  <UserRoundCheck className="h-4 w-4" />
                  Approve &amp; activate account
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    disabled={isSaving || selectedResident.status === "Verified" || !selectedResident.hasResidentRow}
                    onClick={() => void handleVerifyResident(selectedResident)}
                  >
                    <UserRoundCheck className="h-4 w-4" />
                    Verify resident
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSaving}
                    onClick={() => void handleToggleAccount(selectedResident)}
                  >
                    <UserMinus className="h-4 w-4" />
                    Suspend account
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFollowUpResidentId(selectedResident.id);
                      setFollowUpMessage("");
                      closeResidentModal();
                    }}
                  >
                    <Send className="h-4 w-4" />
                    Send follow-up
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <FileViewerModal
        open={fileViewerUrl !== null}
        url={fileViewerUrl}
        title="Government ID"
        onClose={() => setFileViewerUrl(null)}
      />
    </div>
  );
}

function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-amber-300 bg-amber-50" : undefined}>
      <CardContent className="p-4">
        <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${highlight ? "text-amber-700" : "text-muted-foreground"}`}>
          {label}
        </p>
        <p className={`mt-1 text-2xl font-semibold ${highlight ? "text-amber-900" : ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{children}</div>
    </div>
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
