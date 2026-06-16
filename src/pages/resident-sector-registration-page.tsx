import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  FileUp,
  LoaderCircle,
  Lock,
  RefreshCw,
  Upload,
  XCircle,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useResidentPortal } from "@/hooks/use-resident-portal";
import {
  useAppointmentForRegistration,
  useAvailableAppointmentSlots,
  useBookAppointment,
  useCancelAppointment,
  useCreateSectorRegistration,
  useResubmitSectorRegistration,
  useSectorRegistration,
  useSectorRegistrations,
  useUploadSectorDocument,
} from "@/hooks/use-sector-registrations";
import { AppointmentSlotPicker } from "@/components/sector/appointment-slot-picker";
import { SectorStatusBadge } from "@/components/sector/sector-status-badge";
import { Button } from "@/components/ui/button";
import type { SectorType } from "@/types/sector";

const SECTOR_META: Record<SectorType, {
  label: string;
  idTypes: string[];
  docInstructions: string;
}> = {
  pwd: {
    label: "Person with Disability (PWD)",
    idTypes: ["PWD ID", "Other"],
    docInstructions: "Upload a clear photo or scan of your PWD ID. File must be JPG, PNG, or PDF under 5 MB.",
  },
  senior_citizen: {
    label: "Senior Citizen",
    idTypes: ["Senior Citizen ID", "Other"],
    docInstructions: "Upload a clear photo or scan of your Senior Citizen ID. File must be JPG, PNG, or PDF under 5 MB.",
  },
  solo_parent: {
    label: "Solo Parent",
    idTypes: ["Solo Parent ID", "Other"],
    docInstructions: "Upload a clear photo or scan of your Solo Parent ID. File must be JPG, PNG, or PDF under 5 MB.",
  },
};

const STEPS = ["Registration info", "Admin approval", "Book appointment", "Upload document", "Verification"] as const;

function stepIndex(status: string): number {
  switch (status) {
    case "pending_review":      return 0;
    case "pending_appointment": return 1;
    case "appointment_booked":  return 2;
    case "document_uploaded":
    case "under_review":        return 3;
    case "verified":
    case "rejected":            return 4;
    default:                    return 0;
  }
}

export function ResidentSectorRegistrationPage() {
  const { sectorType } = useParams<{ sectorType: string }>();
  const { user } = useAuth();
  const portalQuery = useResidentPortal();
  const residentId = portalQuery.data?.residentId ?? "";
  const userId = user?.id ?? "";

  const sector = sectorType as SectorType;
  const meta = SECTOR_META[sector];

  const regQuery = useSectorRegistration(sector, userId);
  const reg = regQuery.data ?? null;
  const registrationsQuery = useSectorRegistrations(userId);
  const registrations = registrationsQuery.data ?? [];
  const verifiedRegistration = registrations.find((r) => r.status === "verified");

  const apptQuery = useAppointmentForRegistration(reg?.id ?? null);
  const appointment = apptQuery.data ?? null;

  const slotsQuery = useAvailableAppointmentSlots(sector);
  const slots = slotsQuery.data ?? [];

  const createMutation = useCreateSectorRegistration(userId);
  const resubmitMutation = useResubmitSectorRegistration(userId);
  const bookMutation = useBookAppointment(userId, sector);
  const cancelMutation = useCancelAppointment(userId, sector);
  const uploadMutation = useUploadSectorDocument(userId);

  const [selectedIdType, setSelectedIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const step1FileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [step1File, setStep1File] = useState<File | null>(null);
  const [step1Preview, setStep1Preview] = useState<string | null>(null);

  function handleStep1FileChange(file: File | null) {
    setStep1File(file);
    if (!file) { setStep1Preview(null); return; }
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setStep1Preview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setStep1Preview(null);
    }
  }

  if (!meta) {
    return (
      <div className="py-16 text-center text-[var(--portal-muted)]">
        Unknown sector type. <Link to="/resident/sectors" className="text-[var(--portal-accent)] hover:underline">Go back</Link>
      </div>
    );
  }

  const isLoading = regQuery.isLoading || portalQuery.isLoading || registrationsQuery.isLoading;
  const currentStep = reg ? stepIndex(reg.status) : -1;
  const isVerified = reg?.status === "verified";
  const isRejected = reg?.status === "rejected";
  const isBlockedByVerifiedSector = !!verifiedRegistration && verifiedRegistration.sectorType !== sector && !reg;

  // ── Step 1: Create registration ────────────────────────────
  async function handleCreate() {
    if (!selectedIdType) { toast.error("Please select an ID/document type."); return; }
    if (!residentId)      { toast.error("Resident record not found. Please complete your profile first."); return; }
    try {
      const registrationId = await createMutation.mutateAsync({
        residentId,
        sectorType: sector,
        sectorIdType: selectedIdType,
        sectorIdNumber: idNumber || undefined,
      });

      if (step1File) {
        await uploadMutation.mutateAsync({
          sectorRegistrationId: registrationId,
          sectorType: sector,
          file: step1File,
        });
        toast.success("Registration created and document uploaded. Next, book your appointment.");
      } else {
        toast.success("Registration created. Next, book your appointment.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to create registration.");
    }
  }

  // ── Step 2: Book appointment ───────────────────────────────
  async function handleBook() {
    if (!selectedSlotId) { toast.error("Please select an appointment slot."); return; }
    if (!reg) return;
    try {
      await bookMutation.mutateAsync({
        sectorRegistrationId: reg.id,
        residentId: reg.residentId,
        slotId: selectedSlotId,
      });
      toast.success("Appointment booked!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to book appointment.");
    }
  }

  async function handleCancelAppointment() {
    if (!reg?.appointmentId || !reg?.id) return;
    try {
      await cancelMutation.mutateAsync({ appointmentId: reg.appointmentId, sectorRegistrationId: reg.id });
      toast.success("Appointment cancelled. You can book a new slot.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to cancel appointment.");
    }
  }

  // ── Step 3: Upload document ────────────────────────────────
  async function handleUpload() {
    if (!selectedFile || !reg) { toast.error("Please select a file to upload."); return; }
    try {
      await uploadMutation.mutateAsync({ sectorRegistrationId: reg.id, sectorType: sector, file: selectedFile });
      toast.success("Document submitted!");
      setSelectedFile(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to upload document.");
    }
  }

  // ── Resubmit (rejected) ────────────────────────────────────
  async function handleResubmit() {
    if (!selectedIdType || !reg) { toast.error("Please select an ID/document type."); return; }
    try {
      await resubmitMutation.mutateAsync({ registrationId: reg.id, sectorIdType: selectedIdType, sectorIdNumber: idNumber || undefined });
      toast.success("Registration resubmitted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to resubmit.");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoaderCircle className="h-7 w-7 animate-spin text-[var(--portal-accent)]" />
      </div>
    );
  }

  if (isBlockedByVerifiedSector) {
    return (
      <div className="space-y-6">
        <div>
          <Link to="/resident/sectors" className="inline-flex items-center gap-1.5 text-sm text-[var(--portal-muted)] hover:text-[var(--portal-ink)]">
            <ArrowLeft className="h-4 w-4" />
            Sector Registration
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-[var(--portal-ink)]">{meta.label}</h1>
        </div>

        <div className="portal-card flex items-start gap-4 p-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
            <Lock className="h-5 w-5 text-slate-600" />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-[var(--portal-ink)]">Sector unavailable</p>
            <p className="mt-1 text-sm text-[var(--portal-muted)]">
              Your {verifiedRegistration.sectorTypeLabel} registration is already verified, so new registrations for other sectors are not available.
            </p>
            <Link
              to="/resident/sectors"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--portal-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--portal-accent-strong)]"
            >
              Back to sectors
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link to="/resident/sectors" className="inline-flex items-center gap-1.5 text-sm text-[var(--portal-muted)] hover:text-[var(--portal-ink)]">
          <ArrowLeft className="h-4 w-4" />
          Sector Registration
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-[var(--portal-ink)]">{meta.label}</h1>
        {reg && (
          <div className="mt-1 flex items-center gap-2">
            <SectorStatusBadge status={reg.status} label={reg.statusLabel} />
          </div>
        )}
      </div>

      {/* Progress bar */}
      {reg && (
        <div className="portal-soft-card rounded-xl p-4">
          <div className="flex items-center gap-1">
            {STEPS.map((stepLabel, idx) => {
              const done = idx < currentStep || isVerified;
              const active = idx === currentStep && !isVerified && !isRejected;
              return (
                <div key={stepLabel} className="flex flex-1 items-center gap-1">
                  <div className="flex flex-col items-center gap-1">
                    <div className={[
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                      done ? "bg-green-500 text-white"
                        : active ? "bg-[var(--portal-accent)] text-white"
                        : "bg-[var(--portal-outline)] text-[var(--portal-muted)]",
                    ].join(" ")}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                    </div>
                    <span className="hidden text-center text-[10px] leading-tight text-[var(--portal-muted)] sm:block">{stepLabel}</span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`h-px flex-1 ${idx < currentStep || (isVerified && idx < STEPS.length - 1) ? "bg-green-400" : "bg-[var(--portal-outline)]"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin remarks */}
      {reg?.adminRemarks && (
        <div className={`flex items-start gap-3 rounded-xl border p-4 ${isRejected ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
          <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${isRejected ? "text-red-500" : "text-amber-500"}`} />
          <div>
            <p className={`text-sm font-semibold ${isRejected ? "text-red-700" : "text-amber-700"}`}>
              {isRejected ? "Registration rejected" : "Note from OMSWD"}
            </p>
            <p className={`text-sm ${isRejected ? "text-red-600" : "text-amber-600"}`}>{reg.adminRemarks}</p>
          </div>
        </div>
      )}

      {/* Verified */}
      {isVerified && (
        <div className="flex items-start gap-4 rounded-xl border border-green-200 bg-green-50 p-5">
          <CheckCircle2 className="mt-0.5 h-6 w-6 text-green-600" />
          <div>
            <p className="text-base font-bold text-green-800">Registration verified!</p>
            <p className="text-sm text-green-700">
              OMSWD has confirmed your {meta.label} status. You are now entitled to the associated benefits and services.
            </p>
          </div>
        </div>
      )}

      {/* Step panels */}
      {!reg && (
        <div className="portal-card p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-[var(--portal-ink)]">Step 1 — Registration info</h2>
            <p className="mt-1 text-sm text-[var(--portal-muted)]">Fill in your document details and upload a photo or scan of your ID.</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
                Document / ID type <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedIdType}
                onChange={(e) => setSelectedIdType(e.target.value)}
                className="w-full rounded-lg border border-[var(--portal-outline)] bg-white px-3 py-2 text-sm text-[var(--portal-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--portal-accent)]"
              >
                <option value="">Select ID/document type...</option>
                {meta.idTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
                ID / Certificate number (optional)
              </label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="e.g. PWD-2024-00123"
                className="w-full rounded-lg border border-[var(--portal-outline)] bg-white px-3 py-2 text-sm text-[var(--portal-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--portal-accent)]"
              />
            </div>

            {/* Photo / document upload */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
                Upload photo / scan of ID <span className="text-[var(--portal-muted)] font-normal normal-case">(optional — you can also upload later)</span>
              </label>
              <input
                ref={step1FileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden"
                onChange={(e) => handleStep1FileChange(e.target.files?.[0] ?? null)}
              />

              {step1File ? (
                <div className="rounded-xl border border-[var(--portal-outline)] bg-[var(--portal-surface-soft)] p-3">
                  {step1Preview ? (
                    <div className="mb-3 overflow-hidden rounded-lg border border-[var(--portal-outline)] bg-white">
                      <img
                        src={step1Preview}
                        alt="ID preview"
                        className="max-h-48 w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="mb-3 flex items-center gap-2 rounded-lg border border-[var(--portal-outline)] bg-white px-3 py-2.5">
                      <FileUp className="h-5 w-5 shrink-0 text-[var(--portal-muted)]" />
                      <span className="truncate text-sm text-[var(--portal-ink)]">{step1File.name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-xs text-[var(--portal-muted)]">{step1File.name}</p>
                    <button
                      type="button"
                      onClick={() => { handleStep1FileChange(null); if (step1FileInputRef.current) step1FileInputRef.current.value = ""; }}
                      className="shrink-0 text-xs font-semibold text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => step1FileInputRef.current?.click()}
                  className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[var(--portal-outline)] p-6 text-center transition-colors hover:border-[var(--portal-accent)] hover:bg-blue-50/40"
                >
                  <Upload className="h-7 w-7 text-[var(--portal-muted)]" />
                  <span className="text-sm font-semibold text-[var(--portal-ink)]">Click to select photo or file</span>
                  <span className="text-xs text-[var(--portal-muted)]">JPG, PNG or PDF · Max 5 MB</span>
                </button>
              )}
            </div>
          </div>

          <Button
            onClick={() => void handleCreate()}
            disabled={createMutation.isPending || uploadMutation.isPending || !selectedIdType}
            className="bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]"
          >
            {(createMutation.isPending || uploadMutation.isPending) ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {step1File ? "Submit and continue" : "Continue to book appointment"}
          </Button>
        </div>
      )}

      {reg?.status === "pending_review" && (
        <div className="portal-card p-6 space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-bold text-amber-800">Waiting for admin approval</p>
              <p className="text-sm text-amber-700">
                Your registration has been submitted and is being reviewed by OMSWD staff. You will be notified once it is approved and you can proceed to book an appointment.
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--portal-muted)]">ID / Document type</p>
            <p className="mt-0.5 text-sm text-[var(--portal-ink)]">{reg.sectorIdType ?? "—"}</p>
          </div>
          {reg.sectorIdNumber && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--portal-muted)]">ID number</p>
              <p className="mt-0.5 text-sm text-[var(--portal-ink)]">{reg.sectorIdNumber}</p>
            </div>
          )}
        </div>
      )}

      {reg?.status === "pending_appointment" && (
        <div className="portal-card p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-[var(--portal-ink)]">Step 3 — Book your appointment</h2>
            <p className="mt-1 text-sm text-[var(--portal-muted)]">Select a date and time that works for you. Bring your {reg.sectorIdType} to the OMSWD office.</p>
          </div>

          {slotsQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-[var(--portal-muted)]">
              <LoaderCircle className="h-4 w-4 animate-spin" /> Loading available slots...
            </div>
          ) : (
            <AppointmentSlotPicker
              slots={slots}
              selectedSlotId={selectedSlotId}
              onSelect={setSelectedSlotId}
              disabled={bookMutation.isPending}
            />
          )}

          <Button
            onClick={() => void handleBook()}
            disabled={bookMutation.isPending || !selectedSlotId}
            className="bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]"
          >
            {bookMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
            Confirm appointment
          </Button>
        </div>
      )}

      {reg?.status === "appointment_booked" && (
        <div className="portal-card p-6 space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div>
              <p className="text-sm font-bold text-blue-800">Appointment confirmed</p>
              <p className="text-sm text-blue-700">{appointment?.slotLabel ?? "Appointment slot booked"}</p>
              <p className="mt-1 text-xs text-blue-600">
                Bring your original {reg.sectorIdType} on the day of your appointment.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-base font-bold text-[var(--portal-ink)]">Step 4 — Upload your document</h2>
            <p className="mt-1 text-sm text-[var(--portal-muted)]">{meta.docInstructions}</p>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[var(--portal-outline)] p-6 text-center transition-colors hover:border-[var(--portal-accent)] hover:bg-blue-50/40"
            >
              <Upload className="h-7 w-7 text-[var(--portal-muted)]" />
              <span className="text-sm font-semibold text-[var(--portal-ink)]">
                {selectedFile ? selectedFile.name : "Click to select file"}
              </span>
              <span className="text-xs text-[var(--portal-muted)]">JPG, PNG or PDF · Max 5 MB</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => void handleUpload()}
              disabled={uploadMutation.isPending || !selectedFile}
              className="bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]"
            >
              {uploadMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
              Submit document
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleCancelAppointment()}
              disabled={cancelMutation.isPending}
              className="border-[var(--portal-outline)]"
            >
              {cancelMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Cancel appointment
            </Button>
          </div>
        </div>
      )}

      {(reg?.status === "document_uploaded" || reg?.status === "under_review") && (
        <div className="portal-card p-6 space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-purple-200 bg-purple-50 p-4">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-purple-600" />
            <div>
              <p className="text-sm font-bold text-purple-800">Document under review</p>
              <p className="text-sm text-purple-700">
                Your document{reg.documentFileName ? ` (${reg.documentFileName})` : ""} has been submitted and is being reviewed by OMSWD staff. You will be notified once a decision is made.
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--portal-muted)]">Document submitted</p>
            <p className="mt-0.5 text-sm text-[var(--portal-ink)]">{reg.documentFileName ?? "—"}</p>
          </div>
          {reg.documentUploadedAt && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--portal-muted)]">Uploaded on</p>
              <p className="mt-0.5 text-sm text-[var(--portal-ink)]">
                {new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(reg.documentUploadedAt))}
              </p>
            </div>
          )}
        </div>
      )}

      {isRejected && (
        <div className="portal-card p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-[var(--portal-ink)]">Resubmit your registration</h2>
            <p className="mt-1 text-sm text-[var(--portal-muted)]">
              Update your ID type and number, then proceed to book a new appointment and upload a corrected document.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
                Document / ID type <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedIdType || reg.sectorIdType || ""}
                onChange={(e) => setSelectedIdType(e.target.value)}
                className="w-full rounded-lg border border-[var(--portal-outline)] bg-white px-3 py-2 text-sm text-[var(--portal-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--portal-accent)]"
              >
                <option value="">Select ID/document type...</option>
                {meta.idTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
                ID / Certificate number (optional)
              </label>
              <input
                type="text"
                value={idNumber || reg.sectorIdNumber || ""}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="e.g. PWD-2024-00123"
                className="w-full rounded-lg border border-[var(--portal-outline)] bg-white px-3 py-2 text-sm text-[var(--portal-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--portal-accent)]"
              />
            </div>
          </div>
          <Button
            onClick={() => void handleResubmit()}
            disabled={resubmitMutation.isPending}
            className="bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]"
          >
            {resubmitMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Resubmit registration
          </Button>
        </div>
      )}
    </div>
  );
}
