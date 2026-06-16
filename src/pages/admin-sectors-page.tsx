import {
  Calendar,
  CheckCircle2,
  Eye,
  FileImage,
  LoaderCircle,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  approveSectorRegistration,
  createAppointmentSlot,
  getAdminAppointmentSlots,
  getAdminAppointments,
  getAdminSectorRegistrations,
  getSectorDocumentUrl,
  reviewSectorRegistration,
  updateAppointmentSlotActive,
  updateAppointmentStatus,
} from "@/services/admin-service";
import { queryKeys } from "@/lib/query-keys";
import { SectorStatusBadge } from "@/components/sector/sector-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminAppointmentRecord, AdminSectorRegistrationRecord, AppointmentSlot, SectorType } from "@/types/sector";

// ─────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--portal-muted)]">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-[var(--portal-ink)]">{value || "—"}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────

export function AdminSectorsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"registrations" | "appointments" | "slots">("registrations");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [reviewTarget, setReviewTarget] = useState<AdminSectorRegistrationRecord | null>(null);
  const [addSlotOpen, setAddSlotOpen] = useState(false);

  const regQuery = useQuery({
    queryKey: queryKeys.admin.sectorRegistrations({ status: statusFilter || undefined, sectorType: (sectorFilter as SectorType) || undefined }),
    queryFn: () => getAdminSectorRegistrations({
      status: statusFilter || undefined,
      sectorType: (sectorFilter as SectorType) || undefined,
    }),
  });

  const slotsQuery = useQuery({
    queryKey: queryKeys.admin.appointmentSlots(),
    queryFn: getAdminAppointmentSlots,
  });

  const appointmentsQuery = useQuery({
    queryKey: queryKeys.admin.appointments(),
    queryFn: () => getAdminAppointments(),
  });

  const registrations = (regQuery.data ?? []).filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.residentName.toLowerCase().includes(q) ||
      r.residentCode.toLowerCase().includes(q) ||
      r.barangay.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--portal-ink)]">Sector Registrations</h1>
          <p className="text-sm text-[var(--portal-muted)]">Manage PWD, Senior Citizen, and Solo Parent verification requests.</p>
        </div>
        <Button
          onClick={() => setAddSlotOpen(true)}
          className="bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]"
        >
          <Plus className="h-4 w-4" />
          New appointment slot
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--portal-outline)]">
        {(["registrations", "appointments", "slots"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              "px-4 py-2 text-sm font-medium transition-colors",
              tab === t
                ? "border-b-2 border-[var(--portal-accent)] text-[var(--portal-accent)]"
                : "text-[var(--portal-muted)] hover:text-[var(--portal-ink)]",
            ].join(" ")}
          >
            {t === "registrations" ? "Registrations" : t === "appointments" ? "Appointments" : "Appointment Slots"}
          </button>
        ))}
      </div>

      {tab === "registrations" && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--portal-muted)]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, resident code..."
                className="pl-9"
              />
            </div>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="rounded-lg border border-[var(--portal-outline)] bg-white px-3 py-2 text-sm text-[var(--portal-ink)]"
            >
              <option value="">All sectors</option>
              <option value="pwd">PWD</option>
              <option value="senior_citizen">Senior Citizen</option>
              <option value="solo_parent">Solo Parent</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[var(--portal-outline)] bg-white px-3 py-2 text-sm text-[var(--portal-ink)]"
            >
              <option value="">All statuses</option>
              <option value="pending_review">Pending approval</option>
              <option value="pending_appointment">Pending appointment</option>
              <option value="appointment_booked">Appointment booked</option>
              <option value="document_uploaded">Document submitted</option>
              <option value="under_review">Under review</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Table */}
          {regQuery.isLoading ? (
            <div className="flex items-center gap-2 py-10 text-sm text-[var(--portal-muted)]">
              <LoaderCircle className="h-5 w-5 animate-spin" /> Loading...
            </div>
          ) : registrations.length === 0 ? (
            <div className="py-16 text-center text-sm text-[var(--portal-muted)]">No sector registrations found.</div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[var(--portal-outline)]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[var(--portal-surface-soft)]">
                    <TableHead>Resident</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Appointment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <p className="font-medium text-[var(--portal-ink)]">{reg.residentName}</p>
                        <p className="text-xs text-[var(--portal-muted)]">{reg.residentCode} · {reg.barangay}</p>
                      </TableCell>
                      <TableCell className="text-sm">{reg.sectorTypeLabel}</TableCell>
                      <TableCell className="text-sm text-[var(--portal-muted)]">
                        {reg.appointmentSlotLabel ?? "—"}
                      </TableCell>
                      <TableCell>
                        <SectorStatusBadge status={reg.status} label={reg.statusLabel} />
                      </TableCell>
                      <TableCell className="text-xs text-[var(--portal-muted)]">{reg.createdAtLabel}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReviewTarget(reg)}
                          className="border-[var(--portal-outline)]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      {tab === "appointments" && (
        <AppointmentManager
          appointments={appointmentsQuery.data ?? []}
          isLoading={appointmentsQuery.isLoading}
          qc={qc}
        />
      )}

      {tab === "slots" && (
        <SlotManager slots={slotsQuery.data ?? []} isLoading={slotsQuery.isLoading} qc={qc} />
      )}

      {/* Review modal */}
      {reviewTarget && (
        <ReviewModal
          reg={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onDone={() => {
            setReviewTarget(null);
            void qc.invalidateQueries({ queryKey: queryKeys.admin.sectorRegistrations() });
          }}
        />
      )}

      {/* Add slot modal */}
      {addSlotOpen && (
        <AddSlotModal
          onClose={() => setAddSlotOpen(false)}
          onDone={() => {
            setAddSlotOpen(false);
            void qc.invalidateQueries({ queryKey: queryKeys.admin.appointmentSlots() });
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Appointment manager
// ─────────────────────────────────────────────────────────────

const APPT_STATUS_COLORS: Record<string, string> = {
  booked: "bg-blue-100 text-blue-700",
  confirmed: "bg-green-100 text-green-700",
  completed: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-100 text-red-600",
  no_show: "bg-orange-100 text-orange-700",
};

function AppointmentManager({
  appointments,
  isLoading,
  qc,
}: {
  appointments: AdminAppointmentRecord[];
  isLoading: boolean;
  qc: ReturnType<typeof useQueryClient>;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const filtered = appointments.filter((a) => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.residentName.toLowerCase().includes(q) ||
        a.residentCode.toLowerCase().includes(q) ||
        a.slotLabel.toLowerCase().includes(q)
      );
    }
    return true;
  });

  async function handleStatusChange(
    appt: AdminAppointmentRecord,
    status: "confirmed" | "completed" | "cancelled" | "no_show",
  ) {
    setUpdating(appt.id);
    try {
      await updateAppointmentStatus(appt.id, status);
      void qc.invalidateQueries({ queryKey: queryKeys.admin.appointments() });
      toast.success(`Appointment marked as ${status}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update appointment.");
    } finally {
      setUpdating(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-[var(--portal-muted)]">
        <LoaderCircle className="h-5 w-5 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--portal-muted)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code, or slot..."
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-[var(--portal-outline)] bg-white px-3 py-2 text-sm text-[var(--portal-ink)]"
        >
          <option value="">All statuses</option>
          <option value="booked">Booked</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No show</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-[var(--portal-muted)]">No appointments found.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--portal-outline)]">
          <Table>
            <TableHeader>
              <TableRow className="bg-[var(--portal-surface-soft)]">
                <TableHead>Resident</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Appointment slot</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((appt) => (
                <TableRow key={appt.id}>
                  <TableCell>
                    <p className="font-medium text-[var(--portal-ink)]">{appt.residentName}</p>
                    <p className="text-xs text-[var(--portal-muted)]">{appt.residentCode} · {appt.barangay}</p>
                  </TableCell>
                  <TableCell className="text-sm">{appt.sectorTypeLabel}</TableCell>
                  <TableCell className="text-sm text-[var(--portal-muted)]">{appt.slotLabel}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${APPT_STATUS_COLORS[appt.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {appt.statusLabel}
                    </span>
                  </TableCell>
                  <TableCell>
                    {updating === appt.id ? (
                      <LoaderCircle className="h-4 w-4 animate-spin text-[var(--portal-muted)]" />
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {appt.status === "booked" && (
                          <Button
                            size="sm"
                            onClick={() => void handleStatusChange(appt, "confirmed")}
                            className="h-7 bg-green-600 px-2 text-xs text-white hover:bg-green-700"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Confirm
                          </Button>
                        )}
                        {(appt.status === "booked" || appt.status === "confirmed") && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void handleStatusChange(appt, "completed")}
                              className="h-7 border-[var(--portal-outline)] px-2 text-xs"
                            >
                              Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void handleStatusChange(appt, "no_show")}
                              className="h-7 border-orange-200 px-2 text-xs text-orange-600 hover:bg-orange-50"
                            >
                              No show
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void handleStatusChange(appt, "cancelled")}
                              className="h-7 border-red-200 px-2 text-xs text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="h-3 w-3" /> Cancel
                            </Button>
                          </>
                        )}
                        {(appt.status === "completed" || appt.status === "cancelled" || appt.status === "no_show") && (
                          <span className="text-xs text-[var(--portal-muted)]">—</span>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Slot manager
// ─────────────────────────────────────────────────────────────

function SlotManager({ slots, isLoading, qc }: { slots: AppointmentSlot[]; isLoading: boolean; qc: ReturnType<typeof useQueryClient> }) {
  const [toggling, setToggling] = useState<string | null>(null);

  async function handleToggle(slot: AppointmentSlot) {
    setToggling(slot.id);
    try {
      await updateAppointmentSlotActive(slot.id, !slot.isActive);
      void qc.invalidateQueries({ queryKey: queryKeys.admin.appointmentSlots() });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update slot.");
    } finally {
      setToggling(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-[var(--portal-muted)]">
        <LoaderCircle className="h-5 w-5 animate-spin" /> Loading...
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-[var(--portal-muted)]">
        No appointment slots created yet. Click "New appointment slot" to add one.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--portal-outline)]">
      <Table>
        <TableHeader>
          <TableRow className="bg-[var(--portal-surface-soft)]">
            <TableHead>Date / Time</TableHead>
            <TableHead>Sector</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {slots.map((slot) => (
            <TableRow key={slot.id} className={!slot.isActive ? "opacity-50" : undefined}>
              <TableCell>
                <p className="font-medium text-[var(--portal-ink)]">{slot.slotLabel}</p>
              </TableCell>
              <TableCell className="text-sm text-[var(--portal-muted)]">
                {slot.sectorType ?? "All sectors"}
              </TableCell>
              <TableCell className="text-sm">
                {slot.bookedCount} / {slot.maxCapacity}
                {slot.isFull && <span className="ml-1.5 text-xs text-red-500">Full</span>}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-xs text-[var(--portal-muted)]">
                {slot.notes ?? "—"}
              </TableCell>
              <TableCell>
                <span className={`text-xs font-semibold ${slot.isActive ? "text-green-600" : "text-slate-400"}`}>
                  {slot.isActive ? "Active" : "Inactive"}
                </span>
              </TableCell>
              <TableCell>
                <button
                  type="button"
                  onClick={() => void handleToggle(slot)}
                  disabled={toggling === slot.id}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--portal-muted)] hover:text-[var(--portal-ink)]"
                  title={slot.isActive ? "Deactivate slot" : "Activate slot"}
                >
                  {toggling === slot.id ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : slot.isActive ? (
                    <ToggleRight className="h-5 w-5 text-green-600" />
                  ) : (
                    <ToggleLeft className="h-5 w-5" />
                  )}
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Review modal
// ─────────────────────────────────────────────────────────────

function ReviewModal({ reg, onClose, onDone }: {
  reg: AdminSectorRegistrationRecord;
  onClose: () => void;
  onDone: () => void;
}) {
  const [remarks, setRemarks] = useState(reg.adminRemarks ?? "");
  const [saving, setSaving] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(false);

  const isLocked = reg.status === "verified";
  const isPendingReview = reg.status === "pending_review";

  async function handleApprove() {
    setSaving(true);
    try {
      await approveSectorRegistration(reg.id);
      toast.success("Registration approved. Resident can now book an appointment.");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to approve registration.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAction(action: "verify" | "reject") {
    setSaving(true);
    try {
      await reviewSectorRegistration(reg.id, action, remarks || undefined);
      toast.success(action === "verify" ? "Registration verified!" : "Registration rejected.");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save review.");
    } finally {
      setSaving(false);
    }
  }

  async function handleViewDocument() {
    if (!reg.documentFilePath) return;
    setViewingDoc(true);
    try {
      const url = await getSectorDocumentUrl(reg.documentFilePath);
      window.open(url, "_blank");
    } catch (err) {
      toast.error("Unable to load document.");
    } finally {
      setViewingDoc(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Review: ${reg.sectorTypeLabel}`}>
      <div className="space-y-5 text-sm">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--portal-outline)] pb-4">
          <div>
            <p className="text-base font-bold text-[var(--portal-ink)]">{reg.residentName}</p>
            <p className="text-xs text-[var(--portal-muted)]">{reg.residentCode} · {reg.barangay}</p>
          </div>
          <SectorStatusBadge status={reg.status} label={reg.statusLabel} />
        </div>

        {/* Fields */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Sector" value={reg.sectorTypeLabel} />
          <Field label="ID type" value={reg.sectorIdType} />
          <Field label="ID number" value={reg.sectorIdNumber} />
          <Field label="Registered on" value={reg.createdAtLabel} />
          <Field label="Appointment" value={reg.appointmentSlotLabel} />
          <Field label="Appointment status" value={reg.appointmentStatusLabel} />
        </div>

        {/* Document */}
        {reg.documentFilePath ? (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--portal-muted)]">Submitted document</p>
            <div className="flex items-center gap-3 rounded-lg border border-[var(--portal-outline)] bg-[var(--portal-surface-soft)] px-3 py-2.5">
              <FileImage className="h-5 w-5 shrink-0 text-[var(--portal-muted)]" />
              <span className="flex-1 truncate text-sm text-[var(--portal-ink)]">{reg.documentFileName ?? "Document"}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleViewDocument()}
                disabled={viewingDoc}
                className="border-[var(--portal-outline)]"
              >
                {viewingDoc ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                View
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[var(--portal-outline)] px-3 py-4 text-center text-xs text-[var(--portal-muted)]">
            No document uploaded yet.
          </div>
        )}

        {/* Remarks */}
        {!isLocked && (
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--portal-muted)]">
              Remarks / feedback (optional)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              placeholder="Add remarks for the resident (e.g. reason for rejection, instructions for resubmission)..."
              className="w-full rounded-lg border border-[var(--portal-outline)] bg-white px-3 py-2 text-sm text-[var(--portal-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--portal-accent)] resize-none"
            />
          </div>
        )}

        {reg.adminRemarks && isLocked && (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--portal-muted)]">Remarks on file</p>
            <p className="text-sm text-[var(--portal-ink)]">{reg.adminRemarks}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--portal-outline)] pt-4">
          <Button variant="outline" onClick={onClose} className="border-[var(--portal-outline)]">
            Close
          </Button>
          {isPendingReview && (
            <>
              <Button
                variant="outline"
                onClick={() => void handleAction("reject")}
                disabled={saving}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Reject
              </Button>
              <Button
                onClick={() => void handleApprove()}
                disabled={saving}
                className="bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]"
              >
                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Approve
              </Button>
            </>
          )}
          {!isLocked && !isPendingReview && reg.documentFilePath && (
            <>
              <Button
                variant="outline"
                onClick={() => void handleAction("reject")}
                disabled={saving}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Reject
              </Button>
              <Button
                onClick={() => void handleAction("verify")}
                disabled={saving}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Verify
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Add slot modal
// ─────────────────────────────────────────────────────────────

function AddSlotModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [slotDate, setSlotDate]       = useState("");
  const [slotTime, setSlotTime]       = useState("09:00");
  const [sectorType, setSectorType]   = useState<SectorType | "">("");
  const [maxCapacity, setMaxCapacity] = useState("10");
  const [notes, setNotes]             = useState("");
  const [saving, setSaving]           = useState(false);

  async function handleSave() {
    if (!slotDate || !slotTime) { toast.error("Date and time are required."); return; }
    const cap = parseInt(maxCapacity, 10);
    if (!cap || cap < 1) { toast.error("Capacity must be at least 1."); return; }

    const dateTime = new Date(`${slotDate}T${slotTime}`);
    const slotLabel = new Intl.DateTimeFormat("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    }).format(dateTime);

    setSaving(true);
    try {
      await createAppointmentSlot({
        slotDate,
        slotTime,
        slotLabel,
        sectorType: sectorType || null,
        maxCapacity: cap,
        notes: notes || undefined,
      });
      toast.success("Appointment slot created.");
      onDone();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Unable to create slot.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Modal open onClose={onClose} title="New appointment slot">
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--portal-muted)]">Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              min={today}
              value={slotDate}
              onChange={(e) => setSlotDate(e.target.value)}
              className="w-full rounded-lg border border-[var(--portal-outline)] bg-white px-3 py-2 text-sm text-[var(--portal-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--portal-accent)]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--portal-muted)]">Time <span className="text-red-500">*</span></label>
            <input
              type="time"
              value={slotTime}
              onChange={(e) => setSlotTime(e.target.value)}
              className="w-full rounded-lg border border-[var(--portal-outline)] bg-white px-3 py-2 text-sm text-[var(--portal-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--portal-accent)]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--portal-muted)]">Sector (leave blank for all)</label>
            <select
              value={sectorType}
              onChange={(e) => setSectorType(e.target.value as SectorType | "")}
              className="w-full rounded-lg border border-[var(--portal-outline)] bg-white px-3 py-2 text-sm text-[var(--portal-ink)]"
            >
              <option value="">All sectors</option>
              <option value="pwd">PWD</option>
              <option value="senior_citizen">Senior Citizen</option>
              <option value="solo_parent">Solo Parent</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--portal-muted)]">Max capacity <span className="text-red-500">*</span></label>
            <input
              type="number"
              min={1}
              max={100}
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
              className="w-full rounded-lg border border-[var(--portal-outline)] bg-white px-3 py-2 text-sm text-[var(--portal-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--portal-accent)]"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--portal-muted)]">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="e.g. Please bring two valid IDs"
            className="w-full rounded-lg border border-[var(--portal-outline)] bg-white px-3 py-2 text-sm text-[var(--portal-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--portal-accent)] resize-none"
          />
        </div>
        <div className="flex justify-end gap-3 border-t border-[var(--portal-outline)] pt-4">
          <Button variant="outline" onClick={onClose} className="border-[var(--portal-outline)]">Cancel</Button>
          <Button
            onClick={() => void handleSave()}
            disabled={saving}
            className="bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]"
          >
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
            Create slot
          </Button>
        </div>
      </div>
    </Modal>
  );
}
