import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { uploadFile } from "@/services/storage-service";
import type {
  Appointment,
  AppointmentSlot,
  SectorRegistration,
  SectorRegistrationStatus,
  SectorType,
} from "@/types/sector";

function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

async function requireAuthenticatedUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("Sign in to access your sector registrations.");
  return user;
}

export function formatSectorTypeLabel(type: SectorType): string {
  switch (type) {
    case "pwd": return "Person with Disability (PWD)";
    case "senior_citizen": return "Senior Citizen";
    case "solo_parent": return "Solo Parent";
  }
}

export function formatSectorStatusLabel(status: SectorRegistrationStatus): string {
  switch (status) {
    case "pending_review":      return "Pending approval";
    case "pending_appointment": return "Pending appointment";
    case "appointment_booked":  return "Appointment booked";
    case "document_uploaded":   return "Document submitted";
    case "under_review":        return "Under review";
    case "verified":            return "Verified";
    case "rejected":            return "Rejected";
  }
}

export function formatAppointmentStatusLabel(status: string): string {
  switch (status) {
    case "booked":    return "Booked";
    case "confirmed": return "Confirmed";
    case "completed": return "Completed";
    case "cancelled": return "Cancelled";
    case "no_show":   return "No show";
    default:          return status;
  }
}

function formatSlotLabel(date: string, time: string): string {
  const d = new Date(`${date}T${time}`);
  return `${new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(d)} · ${new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(d)}`;
}

function mapRegistration(row: Record<string, unknown>): SectorRegistration {
  const sectorType = String(row.sector_type ?? "pwd") as SectorType;
  const status = String(row.status ?? "pending_appointment") as SectorRegistrationStatus;
  return {
    id: String(row.id ?? ""),
    residentId: String(row.resident_id ?? ""),
    profileId: String(row.profile_id ?? ""),
    sectorType,
    sectorTypeLabel: formatSectorTypeLabel(sectorType),
    status,
    statusLabel: formatSectorStatusLabel(status),
    sectorIdType: typeof row.sector_id_type === "string" ? row.sector_id_type : null,
    sectorIdNumber: typeof row.sector_id_number === "string" ? row.sector_id_number : null,
    documentFilePath: typeof row.document_file_path === "string" ? row.document_file_path : null,
    documentFileName: typeof row.document_file_name === "string" ? row.document_file_name : null,
    documentBucket: typeof row.document_bucket === "string" ? row.document_bucket : null,
    documentUploadedAt: typeof row.document_uploaded_at === "string" ? row.document_uploaded_at : null,
    appointmentId: typeof row.appointment_id === "string" ? row.appointment_id : null,
    adminRemarks: typeof row.admin_remarks === "string" ? row.admin_remarks : null,
    reviewedAt: typeof row.reviewed_at === "string" ? row.reviewed_at : null,
    verifiedAt: typeof row.verified_at === "string" ? row.verified_at : null,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

function mapSlot(row: Record<string, unknown>): AppointmentSlot {
  const maxCapacity = typeof row.max_capacity === "number" ? row.max_capacity : 5;
  const bookedCount = typeof row.booked_count === "number" ? row.booked_count : 0;
  const slotDate = String(row.slot_date ?? "");
  const slotTime = String(row.slot_time ?? "");
  return {
    id: String(row.id ?? ""),
    slotDate,
    slotTime,
    slotLabel: typeof row.slot_label === "string" ? row.slot_label : formatSlotLabel(slotDate, slotTime),
    sectorType: typeof row.sector_type === "string" ? (row.sector_type as SectorType) : null,
    maxCapacity,
    bookedCount,
    availableCount: Math.max(maxCapacity - bookedCount, 0),
    isFull: bookedCount >= maxCapacity,
    isActive: row.is_active !== false,
    notes: typeof row.notes === "string" ? row.notes : null,
  };
}

function mapAppointment(
  row: Record<string, unknown>,
  slot?: Record<string, unknown>,
  reg?: Record<string, unknown>,
): Appointment {
  const status = String(row.status ?? "booked") as Appointment["status"];
  const slotDate = typeof slot?.slot_date === "string" ? slot.slot_date : "";
  const slotTime = typeof slot?.slot_time === "string" ? slot.slot_time : "";
  const slotLabel = typeof slot?.slot_label === "string" ? slot.slot_label : formatSlotLabel(slotDate, slotTime);
  const sectorType = typeof reg?.sector_type === "string" ? (reg.sector_type as SectorType) : null;
  return {
    id: String(row.id ?? ""),
    sectorRegistrationId: String(row.sector_registration_id ?? ""),
    residentId: String(row.resident_id ?? ""),
    profileId: String(row.profile_id ?? ""),
    slotId: String(row.slot_id ?? ""),
    slotLabel,
    slotDate,
    sectorType,
    sectorTypeLabel: sectorType ? formatSectorTypeLabel(sectorType) : null,
    status,
    statusLabel: formatAppointmentStatusLabel(status),
    notes: typeof row.notes === "string" ? row.notes : null,
    createdAt: String(row.created_at ?? ""),
  };
}

// ─────────────────────────────────────────────────────────────
// Resident-side functions
// ─────────────────────────────────────────────────────────────

export async function getSectorRegistrations(): Promise<SectorRegistration[]> {
  assertSupabaseConfigured();
  const user = await requireAuthenticatedUser();

  const { data, error } = await supabase
    .from("sector_registrations")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as Array<Record<string, unknown>>).map(mapRegistration);
}

export async function getSectorRegistration(sectorType: SectorType): Promise<SectorRegistration | null> {
  assertSupabaseConfigured();
  const user = await requireAuthenticatedUser();

  const { data, error } = await supabase
    .from("sector_registrations")
    .select("*")
    .eq("profile_id", user.id)
    .eq("sector_type", sectorType)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapRegistration(data as Record<string, unknown>);
}

export async function createSectorRegistration(input: {
  residentId: string;
  sectorType: SectorType;
  sectorIdType: string;
  sectorIdNumber?: string;
}): Promise<string> {
  assertSupabaseConfigured();
  const user = await requireAuthenticatedUser();

  const { data, error } = await supabase
    .from("sector_registrations")
    .insert({
      resident_id: input.residentId,
      profile_id: user.id,
      sector_type: input.sectorType,
      sector_id_type: input.sectorIdType,
      sector_id_number: input.sectorIdNumber ?? null,
      status: "pending_review",
    })
    .select("id")
    .single();

  if (error) throw error;
  return String((data as Record<string, unknown>).id ?? "");
}

export async function resubmitSectorRegistration(input: {
  registrationId: string;
  sectorIdType: string;
  sectorIdNumber?: string;
}): Promise<void> {
  assertSupabaseConfigured();
  const user = await requireAuthenticatedUser();

  const { error } = await supabase
    .from("sector_registrations")
    .update({
      sector_id_type: input.sectorIdType,
      sector_id_number: input.sectorIdNumber ?? null,
      status: "pending_review",
      document_file_path: null,
      document_file_name: null,
      document_bucket: null,
      document_uploaded_at: null,
      appointment_id: null,
      admin_remarks: null,
      reviewed_at: null,
      verified_at: null,
    })
    .eq("id", input.registrationId)
    .eq("profile_id", user.id);

  if (error) throw error;
}

export async function getAvailableAppointmentSlots(sectorType: SectorType): Promise<AppointmentSlot[]> {
  assertSupabaseConfigured();

  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("appointment_slots")
    .select("*")
    .eq("is_active", true)
    .gte("slot_date", today)
    .or(`sector_type.eq.${sectorType},sector_type.is.null`)
    .order("slot_date", { ascending: true })
    .order("slot_time", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as Array<Record<string, unknown>>)
    .map(mapSlot)
    .filter((slot) => !slot.isFull);
}

export async function bookAppointment(input: {
  sectorRegistrationId: string;
  residentId: string;
  slotId: string;
}): Promise<void> {
  assertSupabaseConfigured();
  const user = await requireAuthenticatedUser();

  // Verify slot still has capacity
  const { data: slotData, error: slotError } = await supabase
    .from("appointment_slots")
    .select("booked_count, max_capacity")
    .eq("id", input.slotId)
    .single();

  if (slotError) throw slotError;
  const slot = slotData as Record<string, unknown>;
  if ((slot.booked_count as number) >= (slot.max_capacity as number)) {
    throw new Error("This slot is now full. Please choose another time.");
  }

  const { data: apptData, error: apptError } = await supabase
    .from("appointments")
    .insert({
      sector_registration_id: input.sectorRegistrationId,
      resident_id: input.residentId,
      profile_id: user.id,
      slot_id: input.slotId,
      status: "booked",
    })
    .select("id")
    .single();

  if (apptError) throw apptError;
  const appointmentId = String((apptData as Record<string, unknown>).id ?? "");

  const { error: regError } = await supabase
    .from("sector_registrations")
    .update({
      status: "appointment_booked",
      appointment_id: appointmentId,
    })
    .eq("id", input.sectorRegistrationId)
    .eq("profile_id", user.id);

  if (regError) throw regError;
}

export async function cancelAppointment(input: {
  appointmentId: string;
  sectorRegistrationId: string;
}): Promise<void> {
  assertSupabaseConfigured();
  const user = await requireAuthenticatedUser();

  const { error: apptError } = await supabase
    .from("appointments")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", input.appointmentId)
    .eq("profile_id", user.id);

  if (apptError) throw apptError;

  const { error: regError } = await supabase
    .from("sector_registrations")
    .update({ status: "pending_appointment", appointment_id: null })
    .eq("id", input.sectorRegistrationId)
    .eq("profile_id", user.id);

  if (regError) throw regError;
}

export async function uploadSectorDocument(input: {
  sectorRegistrationId: string;
  sectorType: SectorType;
  file: File;
}): Promise<void> {
  assertSupabaseConfigured();
  const user = await requireAuthenticatedUser();

  const filePath =
    `${user.id}/${input.sectorType}/` +
    `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${sanitizeFileName(input.file.name)}`;

  await uploadFile({
    bucket: "sector-documents",
    path: filePath,
    file: input.file,
    contentType: input.file.type,
  });

  const { error } = await supabase
    .from("sector_registrations")
    .update({
      document_bucket: "sector-documents",
      document_file_path: filePath,
      document_file_name: input.file.name,
      document_mime_type: input.file.type,
      document_size_bytes: input.file.size,
      document_uploaded_at: new Date().toISOString(),
      status: "document_uploaded",
    })
    .eq("id", input.sectorRegistrationId)
    .eq("profile_id", user.id);

  if (error) throw error;
}

export async function getAppointmentForRegistration(sectorRegistrationId: string): Promise<Appointment | null> {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("appointments")
    .select("*, appointment_slots(slot_date, slot_time, slot_label)")
    .eq("sector_registration_id", sectorRegistrationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as Record<string, unknown>;
  const slot = row.appointment_slots as Record<string, unknown> | null;
  return mapAppointment(row, slot ?? undefined);
}

export async function getResidentAppointments(): Promise<Appointment[]> {
  assertSupabaseConfigured();
  const user = await requireAuthenticatedUser();

  // Select only appointment fields + slot. Avoid joining sector_registrations
  // as the nested RLS may silently drop rows when read through a join.
  const { data, error } = await supabase
    .from("appointments")
    .select("*, appointment_slots(slot_date, slot_time, slot_label)")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  if (!data || data.length === 0) return [];

  // Fetch sector types for all registration ids in one query
  const rows = data as Array<Record<string, unknown>>;
  const regIds = [...new Set(rows.map((r) => String(r.sector_registration_id ?? "")).filter(Boolean))];

  const sectorByRegId = new Map<string, SectorType>();
  if (regIds.length > 0) {
    const { data: regs } = await supabase
      .from("sector_registrations")
      .select("id, sector_type")
      .in("id", regIds);
    for (const r of (regs ?? []) as Array<Record<string, unknown>>) {
      sectorByRegId.set(String(r.id ?? ""), String(r.sector_type ?? "") as SectorType);
    }
  }

  return rows.map((row) => {
    const slot = row.appointment_slots as Record<string, unknown> | null;
    const regId = String(row.sector_registration_id ?? "");
    const sectorType = sectorByRegId.get(regId) ?? null;
    return mapAppointment(row, slot ?? undefined, sectorType ? { sector_type: sectorType } : undefined);
  });
}

export async function bookStandaloneAppointment(input: {
  sectorRegistrationId: string;
  residentId: string;
  slotId: string;
}): Promise<void> {
  assertSupabaseConfigured();
  const user = await requireAuthenticatedUser();

  const { data: slotData, error: slotError } = await supabase
    .from("appointment_slots")
    .select("booked_count, max_capacity")
    .eq("id", input.slotId)
    .single();

  if (slotError) throw slotError;
  const slot = slotData as Record<string, unknown>;
  if ((slot.booked_count as number) >= (slot.max_capacity as number)) {
    throw new Error("This slot is now full. Please choose another time.");
  }

  // Cancel any existing active appointment for this registration before booking a new one.
  // This handles the unique constraint on sector_registration_id until the migration is applied.
  await supabase
    .from("appointments")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("sector_registration_id", input.sectorRegistrationId)
    .eq("profile_id", user.id)
    .in("status", ["booked", "confirmed"]);

  const { error: apptError } = await supabase
    .from("appointments")
    .insert({
      sector_registration_id: input.sectorRegistrationId,
      resident_id: input.residentId,
      profile_id: user.id,
      slot_id: input.slotId,
      status: "booked",
    });

  if (apptError) throw apptError;
}
