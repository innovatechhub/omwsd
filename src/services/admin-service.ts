import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import type {
  AdminApplicationCaseDetails,
  AdminCaseDocumentRecord,
  AdminCaseRequirementRecord,
  AdminApplicationRecord,
  AdminBarangayMetric,
  AdminDashboardMetrics,
  AdminQueueItem,
  AdminResidentIdFile,
  AdminResidentRecord,
} from "@/types/admin";

function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatTokenLabel(value: string | null | undefined) {
  if (!value) {
    return "Not specified";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatCaseStatusLabel(status: string | null | undefined) {
  if (!status) {
    return "Not specified";
  }

  switch (status) {
    case "for_requirements":
      return "Requirements needed";
    case "pending_verification":
      return "Pending verification";
    case "under_review":
      return "Under review";
    case "for_correction":
      return "For correction";
    case "needs_resubmission":
      return "Needs resubmission";
    default:
      return formatTokenLabel(status);
  }
}

function mapCaseDocument(row: Record<string, unknown>) {
  return {
    id: String(row.id ?? ""),
    applicationRequirementId:
      typeof row.application_requirement_id === "string" ? row.application_requirement_id : null,
    bucket: String(row.bucket ?? ""),
    filePath: String(row.file_path ?? ""),
    fileName: String(row.file_name ?? "Uploaded file"),
    status: typeof row.status === "string" ? row.status : "uploaded",
    statusLabel: formatCaseStatusLabel(typeof row.status === "string" ? row.status : "uploaded"),
    remarks: typeof row.remarks === "string" ? row.remarks : null,
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
    createdAtLabel: formatDate(typeof row.created_at === "string" ? row.created_at : null),
  } satisfies AdminCaseDocumentRecord;
}

function mapCaseRequirement(
  row: Record<string, unknown>,
  documents: AdminCaseDocumentRecord[],
) {
  const requirement = row.assistance_requirements as Record<string, unknown> | null;
  const requirementRecordId = String(row.id ?? "");

  return {
    id: requirementRecordId,
    requirementId: String(row.requirement_id ?? ""),
    name: String(requirement?.name ?? "Requirement"),
    description: typeof requirement?.description === "string" ? requirement.description : null,
    sortOrder:
      typeof requirement?.sort_order === "number"
        ? requirement.sort_order
        : typeof requirement?.sort_order === "string"
          ? Number(requirement.sort_order)
          : 0,
    status: typeof row.status === "string" ? row.status : "pending",
    statusLabel: formatCaseStatusLabel(typeof row.status === "string" ? row.status : "pending"),
    remarks: typeof row.remarks === "string" ? row.remarks : null,
    reviewedAt: typeof row.reviewed_at === "string" ? row.reviewed_at : null,
    reviewedAtLabel: formatDate(typeof row.reviewed_at === "string" ? row.reviewed_at : null),
    documents: documents.filter((document) => document.applicationRequirementId === requirementRecordId),
  } satisfies AdminCaseRequirementRecord;
}

async function seedMissingApplicationRequirements(applicationId: string) {
  const { data: applicationRow, error: applicationError } = await supabase
    .from("applications")
    .select("assistance_type_id")
    .eq("id", applicationId)
    .maybeSingle();

  if (applicationError) {
    throw applicationError;
  }

  const assistanceTypeId =
    applicationRow && typeof applicationRow.assistance_type_id === "string"
      ? applicationRow.assistance_type_id
      : null;

  if (!assistanceTypeId) {
    return;
  }

  const { data: requirementTemplates, error: requirementTemplateError } = await supabase
    .from("assistance_requirements")
    .select("id")
    .eq("assistance_type_id", assistanceTypeId);

  if (requirementTemplateError) {
    throw requirementTemplateError;
  }

  const requirementIds = ((requirementTemplates ?? []) as Array<Record<string, unknown>>)
    .map((item) => (typeof item.id === "string" ? item.id : ""))
    .filter(Boolean);

  if (requirementIds.length === 0) {
    return;
  }

  const { error } = await supabase.from("application_requirements").upsert(
    requirementIds.map((requirementId) => ({
      application_id: applicationId,
      requirement_id: requirementId,
      status: "pending",
    })),
    {
      onConflict: "application_id,requirement_id",
    },
  );

  if (error) {
    throw error;
  }
}

function mapStatus(status: string | null): AdminApplicationRecord["status"] {
  switch (status) {
    case "for_correction":
      return "For correction";
    case "under_review":
      return "Under review";
    case "approved":
      return "Approved";
    case "completed":
      return "Completed";
    default:
      return "Pending verification";
  }
}

function toDbStatus(status: AdminApplicationRecord["status"]) {
  switch (status) {
    case "For correction":
      return "for_correction";
    case "Under review":
      return "under_review";
    case "Approved":
      return "approved";
    case "Completed":
      return "completed";
    default:
      return "pending_verification";
  }
}

function derivePriority(urgency: string | null): AdminApplicationRecord["priority"] {
  if (urgency === "urgent") {
    return "Urgent";
  }

  if (urgency === "high") {
    return "High";
  }

  return "Normal";
}

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user?.id ?? null;
}

export async function getAdminApplications() {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("applications")
    .select(
      "id, reference_number, applicant_full_name, applicant_barangay, urgency, submitted_at, admin_remarks, status, assistance_types(name)",
    )
    .order("submitted_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((item) => {
    const assistanceType = item.assistance_types as Record<string, unknown> | null;

    return {
      id: String(item.id ?? ""),
      reference: String(item.reference_number ?? ""),
      resident: String(item.applicant_full_name ?? "Unnamed resident"),
      assistance: String(assistanceType?.name ?? "Unknown assistance"),
      status: mapStatus(typeof item.status === "string" ? item.status : null),
      barangay: String(item.applicant_barangay ?? "Not specified"),
      priority: derivePriority(typeof item.urgency === "string" ? item.urgency : null),
      submittedAt: formatDate(typeof item.submitted_at === "string" ? item.submitted_at : null),
      submittedAtRaw: typeof item.submitted_at === "string" ? item.submitted_at : null,
      remarks: String(item.admin_remarks ?? ""),
    } satisfies AdminApplicationRecord;
  });
}

export async function updateAdminApplicationStatus(
  applicationId: string,
  status: AdminApplicationRecord["status"],
  remarks?: string,
) {
  assertSupabaseConfigured();

  const actorId = await getCurrentUserId();

  const { error } = await supabase
    .from("applications")
    .update({
      status: toDbStatus(status),
      admin_remarks: remarks ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  if (error) {
    throw error;
  }

  const { error: historyError } = await supabase.from("status_histories").insert({
    application_id: applicationId,
    previous_status: null,
    new_status: toDbStatus(status),
    changed_by: actorId,
    remarks: remarks ?? `Application status updated to ${status}.`,
  });

  if (historyError) {
    throw historyError;
  }
}

export async function saveAdminApplicationRemarks(applicationId: string, remarks: string) {
  assertSupabaseConfigured();

  const { error } = await supabase
    .from("applications")
    .update({
      admin_remarks: remarks,
    })
    .eq("id", applicationId);

  if (error) {
    throw error;
  }
}

export async function getAdminApplicationCaseDetails(
  applicationId: string,
): Promise<AdminApplicationCaseDetails> {
  assertSupabaseConfigured();

  let requirementRows: Record<string, unknown>[] = [];
  const [{ data: initialRequirementRows, error: requirementError }, { data: documentRows, error: documentError }] =
    await Promise.all([
    supabase
      .from("application_requirements")
      .select(
        "id, requirement_id, status, remarks, reviewed_at, assistance_requirements(name, description, sort_order)",
      )
      .eq("application_id", applicationId),
    supabase
      .from("uploaded_documents")
      .select("id, application_requirement_id, bucket, file_path, file_name, status, remarks, created_at")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false }),
  ]);

  if (requirementError) {
    throw requirementError;
  }

  if (documentError) {
    throw documentError;
  }

  requirementRows = (initialRequirementRows ?? []) as Array<Record<string, unknown>>;

  if (requirementRows.length === 0) {
    await seedMissingApplicationRequirements(applicationId);

    const { data: refreshedRequirementRows, error: refreshRequirementError } = await supabase
      .from("application_requirements")
      .select(
        "id, requirement_id, status, remarks, reviewed_at, assistance_requirements(name, description, sort_order)",
      )
      .eq("application_id", applicationId);

    if (refreshRequirementError) {
      throw refreshRequirementError;
    }

    requirementRows = (refreshedRequirementRows ?? []) as Array<Record<string, unknown>>;
  }

  const documents = ((documentRows ?? []) as Array<Record<string, unknown>>).map(mapCaseDocument);
  let requirements = requirementRows
    .map((row) => mapCaseRequirement(row, documents))
    .sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }

      return left.name.localeCompare(right.name);
    });

  if (requirements.length === 0 && documents.length > 0) {
    requirements = [
      {
        id: "general-supporting-documents",
        requirementId: "",
        name: "General supporting documents",
        description:
          "No requirement template is configured for this service yet. Uploaded files are listed here.",
        sortOrder: 0,
        status: "submitted",
        statusLabel: "Submitted",
        remarks: null,
        reviewedAt: null,
        reviewedAtLabel: "Not recorded",
        documents,
      },
    ];
  }

  return {
    requirements,
    documents,
  };
}

export async function getAdminResidents() {
  assertSupabaseConfigured();

  // Query all resident profiles first (every registered resident has a profile row)
  const { data: profileRows, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone_number, barangay, municipality, is_active, created_at")
    .eq("role", "resident")
    .order("created_at", { ascending: false });

  if (profileError) {
    throw profileError;
  }

  const profileIds = ((profileRows ?? []) as Array<Record<string, unknown>>)
    .map((p) => String(p.id ?? ""))
    .filter(Boolean);

  if (profileIds.length === 0) {
    return [];
  }

  // LEFT join: get resident row details for profiles that have completed their profile
  const { data: residentRows, error: residentError } = await supabase
    .from("residents")
    .select(
      "id, profile_id, resident_code, first_name, middle_name, last_name, suffix, birth_date, sex, civil_status, contact_number, address_line, government_id_type, government_id_number, is_verified, verified_at, created_at, barangays(name), municipalities(name)",
    )
    .in("profile_id", profileIds);

  if (residentError) {
    throw residentError;
  }

  // Map resident rows by profile_id for O(1) lookup
  const residentByProfileId = new Map<string, Record<string, unknown>>();
  for (const row of (residentRows ?? []) as Array<Record<string, unknown>>) {
    residentByProfileId.set(String(row.profile_id ?? ""), row);
  }

  // Count applications per resident id
  const residentIds = Array.from(residentByProfileId.values())
    .map((r) => String(r.id ?? ""))
    .filter(Boolean);

  const applicationCounts = new Map<string, number>();

  if (residentIds.length > 0) {
    const { data: applicationRows, error: applicationError } = await supabase
      .from("applications")
      .select("resident_id")
      .in("resident_id", residentIds);

    if (applicationError) {
      throw applicationError;
    }

    for (const row of (applicationRows ?? []) as Array<Record<string, unknown>>) {
      const residentId = typeof row.resident_id === "string" ? row.resident_id : null;
      if (residentId) {
        applicationCounts.set(residentId, (applicationCounts.get(residentId) ?? 0) + 1);
      }
    }
  }

  return ((profileRows ?? []) as Array<Record<string, unknown>>).map((profile) => {
    const profileId = String(profile.id ?? "");
    const resident = residentByProfileId.get(profileId);
    const barangay = resident?.barangays as Record<string, unknown> | null;
    const municipality = resident?.municipalities as Record<string, unknown> | null;
    const residentId = resident ? String(resident.id ?? "") : "";
    const profileCreatedAt =
      typeof profile.created_at === "string" ? profile.created_at : null;
    const residentCreatedAt =
      typeof resident?.created_at === "string" ? resident.created_at : profileCreatedAt;
    const birthDate = typeof resident?.birth_date === "string" ? resident.birth_date : "";
    const verifiedAt = typeof resident?.verified_at === "string" ? resident.verified_at : null;
    const sex = typeof resident?.sex === "string" ? resident.sex : "";
    const civilStatus =
      typeof resident?.civil_status === "string" ? resident.civil_status : "";
    const governmentIdType =
      typeof resident?.government_id_type === "string" ? resident.government_id_type : "";
    const governmentIdNumber =
      typeof resident?.government_id_number === "string" &&
      resident.government_id_number.trim()
        ? resident.government_id_number
        : "-";

    return {
      id: residentId || profileId,
      profileId,
      residentCode:
        typeof resident?.resident_code === "string" && resident.resident_code.trim()
          ? resident.resident_code
          : "-",
      name: String(profile.full_name ?? profile.email ?? "Unnamed resident"),
      firstName:
        typeof resident?.first_name === "string" && resident.first_name.trim()
          ? resident.first_name
          : "-",
      middleName:
        typeof resident?.middle_name === "string" && resident.middle_name.trim()
          ? resident.middle_name
          : "-",
      lastName:
        typeof resident?.last_name === "string" && resident.last_name.trim()
          ? resident.last_name
          : "-",
      suffix:
        typeof resident?.suffix === "string" && resident.suffix.trim()
          ? resident.suffix
          : "-",
      email:
        typeof profile.email === "string" && profile.email.trim() ? profile.email : "-",
      status: resident?.is_verified ? "Verified" : "Pending verification",
      barangay: String(barangay?.name ?? "—"),
      municipality: String(municipality?.name ?? profile.municipality ?? "-"),
      addressLine:
        typeof resident?.address_line === "string" && resident.address_line.trim()
          ? resident.address_line
          : "-",
      account: profile.is_active === false ? "Suspended" : "Active",
      birthDate,
      birthDateLabel: birthDate ? formatDate(birthDate) : "Not recorded",
      sex,
      sexLabel: formatTokenLabel(sex),
      civilStatus,
      civilStatusLabel: formatTokenLabel(civilStatus),
      governmentIdType,
      governmentIdTypeLabel: formatTokenLabel(governmentIdType),
      governmentIdNumber,
      registeredAt: formatDate(residentCreatedAt),
      verifiedAt: verifiedAt ? formatDate(verifiedAt) : "Not verified",
      contact: resident ? String(resident.contact_number ?? "—") : "—",
      referenceCount: residentId ? (applicationCounts.get(residentId) ?? 0) : 0,
      hasResidentRow: !!resident,
    } satisfies AdminResidentRecord;
  });
}

export async function verifyResident(residentId: string) {
  assertSupabaseConfigured();

  const actorId = await getCurrentUserId();

  const { error } = await supabase
    .from("residents")
    .update({
      is_verified: true,
      verified_at: new Date().toISOString(),
      verified_by: actorId,
    })
    .eq("id", residentId);

  if (error) {
    throw error;
  }
}

export async function setResidentAccountState(profileId: string, isActive: boolean) {
  assertSupabaseConfigured();

  const { error } = await supabase
    .from("profiles")
    .update({
      is_active: isActive,
    })
    .eq("id", profileId);

  if (error) {
    throw error;
  }
}

export async function getAdminDashboardMetrics() {
  const applications = await getAdminApplications();

  const metrics: AdminDashboardMetrics = {
    totalApplications: applications.length,
    pendingVerification: applications.filter(
      (application) => application.status === "Pending verification",
    ).length,
    approved: applications.filter((application) => application.status === "Approved").length,
    forCorrection: applications.filter(
      (application) => application.status === "For correction",
    ).length,
  };

  return metrics;
}

export async function getApplicationsByBarangay() {
  const applications = await getAdminApplications();
  const counts = new Map<string, number>();

  for (const application of applications) {
    counts.set(application.barangay, (counts.get(application.barangay) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, total]) => ({ name, applications: total } satisfies AdminBarangayMetric))
    .sort((left, right) => right.applications - left.applications)
    .slice(0, 5);
}

export async function getVerificationQueue() {
  const applications = await getAdminApplications();

  return applications
    .filter((application) =>
      ["Pending verification", "For correction", "Under review"].includes(application.status),
    )
    .slice(0, 5)
    .map(
      (application) =>
        ({
          reference: application.reference,
          resident: application.resident,
          service: application.assistance,
          status: application.status,
          priority: application.priority,
          submittedAtRaw: application.submittedAtRaw,
        }) satisfies AdminQueueItem,
    );
}

export async function getMonthlyApplicationVolume() {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("applications")
    .select("submitted_at")
    .order("submitted_at", { ascending: true });

  if (error) {
    throw error;
  }

  const now = new Date();
  const months = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);

    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "numeric",
      }).format(date),
    };
  });
  const counts = new Map(months.map((month) => [month.key, 0]));

  for (const item of (data ?? []) as Array<Record<string, unknown>>) {
    const submittedAt = typeof item.submitted_at === "string" ? item.submitted_at : null;

    if (!submittedAt) {
      continue;
    }

    const date = new Date(submittedAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!counts.has(monthKey)) {
      continue;
    }

    counts.set(monthKey, (counts.get(monthKey) ?? 0) + 1);
  }

  return months.map((month) => ({
    month: month.label,
    applications: counts.get(month.key) ?? 0,
  }));
}

export async function getAdminSettings() {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("settings")
    .select("setting_key, setting_value")
    .in("setting_key", ["requirements_templates", "staff_roles", "system_policies"]);

  if (error) {
    throw error;
  }

  const settingsMap = new Map<string, unknown>();

  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    settingsMap.set(String(row.setting_key), row.setting_value);
  }

  return {
    requirementsTemplates:
      (settingsMap.get("requirements_templates") as Record<string, unknown> | undefined) ?? {},
    staffRoles: (settingsMap.get("staff_roles") as Record<string, unknown> | undefined) ?? {},
    systemPolicies:
      (settingsMap.get("system_policies") as Record<string, unknown> | undefined) ?? {},
  };
}

export async function saveAdminSetting(settingKey: string, settingValue: Record<string, unknown>) {
  assertSupabaseConfigured();

  const { error } = await supabase.from("settings").upsert(
    {
      setting_key: settingKey,
      setting_value: settingValue,
      description: settingKey,
    },
    {
      onConflict: "setting_key",
    },
  );

  if (error) {
    throw error;
  }
}

export async function updateRequirementVerificationStatus(
  requirementId: string,
  status: "approved" | "rejected" | "needs_resubmission",
  remarks?: string,
) {
  assertSupabaseConfigured();

  const { error } = await supabase
    .from("application_requirements")
    .update({
      status,
      remarks: remarks ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requirementId);

  if (error) {
    throw error;
  }
}

export async function getApplicationStatusHistory(applicationId: string) {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("status_histories")
    .select("id, new_status, remarks, created_at")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id ?? ""),
    status: typeof row.new_status === "string" ? row.new_status : "",
    statusLabel: formatCaseStatusLabel(typeof row.new_status === "string" ? row.new_status : null),
    remarks: typeof row.remarks === "string" ? row.remarks : null,
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
    createdAtLabel: formatDate(typeof row.created_at === "string" ? row.created_at : null),
  }));
}

export async function getResidentIdFiles(profileId: string): Promise<AdminResidentIdFile[]> {
  assertSupabaseConfigured();

  const { data, error } = await supabase.storage
    .from("ids")
    .list(profileId, { limit: 20, sortBy: { column: "updated_at", order: "desc" } });

  if (error) {
    return [];
  }

  return (data ?? [])
    .filter((item) => typeof item.name === "string" && item.id !== null)
    .map((item) => ({
      name: String(item.name ?? ""),
      filePath: `${profileId}/${String(item.name ?? "")}`,
      bucket: "ids",
      updatedAt: typeof item.updated_at === "string" ? item.updated_at : null,
    }));
}

export async function sendResidentFollowUpNotification(
  residentProfileId: string,
  title: string,
  body: string,
  applicationId?: string,
) {
  assertSupabaseConfigured();

  const { error } = await supabase.from("notifications").insert({
    profile_id: residentProfileId,
    ...(applicationId ? { application_id: applicationId } : {}),
    title,
    body,
    category: "follow_up",
    link_url: "/resident/application",
    is_read: false,
  });

  if (error) {
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// Admin sector registration functions
// ─────────────────────────────────────────────────────────────

function formatAdminDate(value: string | null | undefined): string {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-US", {
    month: "long", day: "numeric", year: "numeric",
  }).format(new Date(value));
}

export async function getAdminSectorRegistrations(filters?: {
  sectorType?: SectorType;
  status?: string;
}): Promise<AdminSectorRegistrationRecord[]> {
  assertSupabaseConfigured();

  let query = supabase
    .from("sector_registrations")
    .select(`
      id, resident_id, profile_id, sector_type, status,
      sector_id_type, sector_id_number,
      document_file_path, document_file_name, document_bucket,
      document_uploaded_at, appointment_id, admin_remarks, reviewed_at, created_at,
      residents(resident_code, barangays(name)),
      profiles(full_name)
    `)
    .order("created_at", { ascending: false });

  if (filters?.sectorType) {
    query = query.eq("sector_type", filters.sectorType);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as Array<Record<string, unknown>>;

  const appointmentIds = rows
    .map((r) => (typeof r.appointment_id === "string" ? r.appointment_id : null))
    .filter(Boolean) as string[];

  const appointmentMap = new Map<string, Record<string, unknown>>();
  if (appointmentIds.length > 0) {
    const { data: apptData } = await supabase
      .from("appointments")
      .select("id, status, appointment_slots(slot_label)")
      .in("id", appointmentIds);

    for (const appt of (apptData ?? []) as Array<Record<string, unknown>>) {
      appointmentMap.set(String(appt.id ?? ""), appt);
    }
  }

  return rows.map((row) => {
    const sectorType = String(row.sector_type ?? "pwd") as SectorType;
    const status = String(row.status ?? "pending_appointment") as SectorRegistrationStatus;
    const resident = row.residents as Record<string, unknown> | null;
    const barangay = resident?.barangays as Record<string, unknown> | null;
    const profile = row.profiles as Record<string, unknown> | null;
    const apptId = typeof row.appointment_id === "string" ? row.appointment_id : null;
    const appt = apptId ? appointmentMap.get(apptId) : null;
    const apptSlot = appt?.appointment_slots as Record<string, unknown> | null;

    return {
      id: String(row.id ?? ""),
      residentId: String(row.resident_id ?? ""),
      profileId: String(row.profile_id ?? ""),
      residentName: String(profile?.full_name ?? "Unknown resident"),
      residentCode: String(resident?.resident_code ?? "—"),
      barangay: String(barangay?.name ?? "—"),
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
      appointmentSlotLabel: typeof apptSlot?.slot_label === "string" ? apptSlot.slot_label : null,
      appointmentStatus: appt ? String(appt.status ?? "") : null,
      appointmentStatusLabel: appt ? formatAppointmentStatusLabel(String(appt.status ?? "")) : null,
      adminRemarks: typeof row.admin_remarks === "string" ? row.admin_remarks : null,
      reviewedAt: typeof row.reviewed_at === "string" ? row.reviewed_at : null,
      createdAt: String(row.created_at ?? ""),
      createdAtLabel: formatAdminDate(typeof row.created_at === "string" ? row.created_at : null),
    } satisfies AdminSectorRegistrationRecord;
  });
}

export async function reviewSectorRegistration(
  registrationId: string,
  action: "verify" | "reject",
  remarks?: string,
): Promise<void> {
  assertSupabaseConfigured();
  const actorId = await getCurrentUserId();

  const now = new Date().toISOString();

  const { data: regData, error: regFetchError } = await supabase
    .from("sector_registrations")
    .select("resident_id, profile_id, sector_type")
    .eq("id", registrationId)
    .single();

  if (regFetchError) throw regFetchError;

  const reg = regData as Record<string, unknown>;
  const residentId = String(reg.resident_id ?? "");
  const profileId = String(reg.profile_id ?? "");
  const sectorType = String(reg.sector_type ?? "") as SectorType;

  const { error: updateError } = await supabase
    .from("sector_registrations")
    .update({
      status: action === "verify" ? "verified" : "rejected",
      admin_remarks: remarks ?? null,
      reviewed_by: actorId,
      reviewed_at: now,
      verified_at: action === "verify" ? now : null,
    })
    .eq("id", registrationId);

  if (updateError) throw updateError;

  if (action === "verify") {
    await verifyResident(residentId);

    await supabase.from("notifications").insert({
      recipient_id: profileId,
      title: `Your ${formatSectorTypeLabel(sectorType)} registration is verified`,
      message: `OMSWD has verified your ${formatSectorTypeLabel(sectorType)} sector registration.`,
      category: "sector_verification",
      link_url: `/resident/sectors/${sectorType}`,
      is_read: false,
    });
  } else {
    await supabase.from("notifications").insert({
      recipient_id: profileId,
      title: `Your ${formatSectorTypeLabel(sectorType)} registration requires attention`,
      message: remarks
        ? `OMSWD reviewed your registration: ${remarks}`
        : "Your registration was not approved. Please check your document and resubmit.",
      category: "sector_verification",
      link_url: `/resident/sectors/${sectorType}`,
      is_read: false,
    });
  }
}

export async function getAdminAppointments(date?: string): Promise<AdminAppointmentRecord[]> {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("appointments")
    .select(`
      id, sector_registration_id, status, notes, created_at,
      sector_registrations(sector_type),
      residents(resident_code, barangays(name)),
      profiles(full_name),
      appointment_slots(slot_label, slot_date)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as Array<Record<string, unknown>>)
    .filter((row) => {
      if (!date) return true;
      const slot = row.appointment_slots as Record<string, unknown> | null;
      return slot?.slot_date === date;
    })
    .map((row) => {
      const reg = row.sector_registrations as Record<string, unknown> | null;
      const resident = row.residents as Record<string, unknown> | null;
      const profile = row.profiles as Record<string, unknown> | null;
      const barangay = resident?.barangays as Record<string, unknown> | null;
      const slot = row.appointment_slots as Record<string, unknown> | null;
      const sectorType = String(reg?.sector_type ?? "pwd") as SectorType;
      const status = String(row.status ?? "booked") as AdminAppointmentRecord["status"];

      return {
        id: String(row.id ?? ""),
        sectorRegistrationId: String(row.sector_registration_id ?? ""),
        residentName: String(profile?.full_name ?? "Unknown"),
        residentCode: String(resident?.resident_code ?? "—"),
        barangay: String(barangay?.name ?? "—"),
        sectorType,
        sectorTypeLabel: formatSectorTypeLabel(sectorType),
        slotLabel: String(slot?.slot_label ?? "—"),
        slotDate: String(slot?.slot_date ?? ""),
        status,
        statusLabel: formatAppointmentStatusLabel(status),
        notes: typeof row.notes === "string" ? row.notes : null,
        createdAt: String(row.created_at ?? ""),
      } satisfies AdminAppointmentRecord;
    });
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: "confirmed" | "completed" | "cancelled" | "no_show",
): Promise<void> {
  assertSupabaseConfigured();

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status };
  if (status === "confirmed") patch.confirmed_at = now;
  if (status === "completed") patch.completed_at = now;
  if (status === "cancelled") patch.cancelled_at = now;

  const { error } = await supabase
    .from("appointments")
    .update(patch)
    .eq("id", appointmentId);

  if (error) throw error;
}

export async function getAdminAppointmentSlots(): Promise<AppointmentSlot[]> {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("appointment_slots")
    .select("*")
    .order("slot_date", { ascending: true })
    .order("slot_time", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
    const maxCapacity = typeof row.max_capacity === "number" ? row.max_capacity : 5;
    const bookedCount = typeof row.booked_count === "number" ? row.booked_count : 0;
    return {
      id: String(row.id ?? ""),
      slotDate: String(row.slot_date ?? ""),
      slotTime: String(row.slot_time ?? ""),
      slotLabel: String(row.slot_label ?? ""),
      sectorType: typeof row.sector_type === "string" ? (row.sector_type as SectorType) : null,
      maxCapacity,
      bookedCount,
      availableCount: Math.max(maxCapacity - bookedCount, 0),
      isFull: bookedCount >= maxCapacity,
      isActive: row.is_active !== false,
      notes: typeof row.notes === "string" ? row.notes : null,
    } satisfies AppointmentSlot;
  });
}

export async function createAppointmentSlot(input: CreateAppointmentSlotInput): Promise<void> {
  assertSupabaseConfigured();
  const actorId = await getCurrentUserId();

  const { error } = await supabase.from("appointment_slots").insert({
    slot_date: input.slotDate,
    slot_time: input.slotTime,
    slot_label: input.slotLabel,
    sector_type: input.sectorType ?? null,
    max_capacity: input.maxCapacity,
    notes: input.notes ?? null,
    is_active: true,
    created_by: actorId,
  });

  if (error) throw error;
}

export async function updateAppointmentSlotActive(slotId: string, isActive: boolean): Promise<void> {
  assertSupabaseConfigured();

  const { error } = await supabase
    .from("appointment_slots")
    .update({ is_active: isActive })
    .eq("id", slotId);

  if (error) throw error;
}

export async function getSectorDocumentUrl(filePath: string): Promise<string> {
  const { createSignedFileUrl } = await import("@/services/storage-service");
  return createSignedFileUrl("sector-documents", filePath);
}
