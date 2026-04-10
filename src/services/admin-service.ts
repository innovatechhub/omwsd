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

  const { data, error } = await supabase
    .from("residents")
    .select(
      "id, profile_id, contact_number, is_verified, barangays(name), profiles!inner(full_name, is_active)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const residentIds = ((data ?? []) as Array<Record<string, unknown>>)
    .map((item) => String(item.id ?? ""))
    .filter(Boolean);

  const { data: applicationRows, error: applicationError } = await supabase
    .from("applications")
    .select("resident_id");

  if (applicationError) {
    throw applicationError;
  }

  const applicationCounts = new Map<string, number>();

  for (const row of (applicationRows ?? []) as Array<Record<string, unknown>>) {
    const residentId = typeof row.resident_id === "string" ? row.resident_id : null;

    if (!residentId || !residentIds.includes(residentId)) {
      continue;
    }

    applicationCounts.set(residentId, (applicationCounts.get(residentId) ?? 0) + 1);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((item) => {
    const profile = item.profiles as Record<string, unknown> | null;
    const barangay = item.barangays as Record<string, unknown> | null;
    const residentId = String(item.id ?? "");

    return {
      id: residentId,
      profileId: String(item.profile_id ?? ""),
      name: String(profile?.full_name ?? "Unnamed resident"),
      status: item.is_verified ? "Verified" : "Pending verification",
      barangay: String(barangay?.name ?? "Not specified"),
      account: profile?.is_active === false ? "Suspended" : "Active",
      contact: String(item.contact_number ?? "No contact number"),
      referenceCount: applicationCounts.get(residentId) ?? 0,
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
