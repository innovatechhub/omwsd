import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { uploadFile } from "@/services/storage-service";
import type {
  ResidentApplicationSummary,
  ResidentNotification,
  ResidentPortalSnapshot,
  ResidentRequirement,
  ResidentStatusHistoryEntry,
  ResidentUploadedDocument,
} from "@/types/resident";

interface UploadResidentFollowUpInput {
  applicationId: string;
  residentId: string | null;
  referenceNumber: string;
  files: File[];
  applicationRequirementId?: string;
}

function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
}

function formatTokenLabel(value: string | null | undefined) {
  if (!value) {
    return "Not specified";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatStatusLabel(status: string | null | undefined) {
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

function formatLongDate(value: string | null | undefined) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatNotificationDate(value: string | null | undefined) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  if (sameDay) {
    return "Today";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatCurrency(value: number | null) {
  if (value === null) {
    return "Not specified";
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(value);
}

function parseNullableNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getProgressStep(status: string) {
  switch (status) {
    case "draft":
      return 0;
    case "pending_verification":
      return 1;
    case "under_review":
    case "for_requirements":
    case "for_correction":
      return 2;
    case "approved":
    case "rejected":
    case "completed":
      return 3;
    default:
      return 0;
  }
}

function hasResidentAction(
  status: string,
  requirements: ResidentRequirement[],
  notifications: ResidentNotification[],
) {
  if (["for_requirements", "for_correction", "rejected"].includes(status)) {
    return true;
  }

  if (
    requirements.some((requirement) =>
      ["pending", "rejected", "needs_resubmission"].includes(requirement.status),
    )
  ) {
    return true;
  }

  return notifications.some(
    (notification) =>
      !notification.isRead &&
      /(requirement|correction|follow-up|action)/i.test(
        `${notification.category} ${notification.title} ${notification.body}`,
      ),
  );
}

async function requireAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("Sign in with a resident account to access the portal.");
  }

  return user;
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function mapNotification(row: Record<string, unknown>) {
  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? "Notification"),
    body: String(row.message ?? ""),
    category: String(row.category ?? "system"),
    categoryLabel: formatTokenLabel(typeof row.category === "string" ? row.category : "system"),
    linkUrl: typeof row.link_url === "string" ? row.link_url : null,
    isRead: typeof row.read_at === "string",
    createdAt: String(row.created_at ?? ""),
    createdAtLabel: formatNotificationDate(
      typeof row.created_at === "string" ? row.created_at : null,
    ),
  } satisfies ResidentNotification;
}

function mapDocument(row: Record<string, unknown>) {
  return {
    id: String(row.id ?? ""),
    applicationRequirementId:
      typeof row.application_requirement_id === "string"
        ? row.application_requirement_id
        : null,
    bucket: String(row.bucket ?? ""),
    filePath: String(row.file_path ?? ""),
    fileName: String(row.file_name ?? "Uploaded file"),
    mimeType: typeof row.mime_type === "string" ? row.mime_type : null,
    sizeBytes:
      typeof row.size_bytes === "number"
        ? row.size_bytes
        : typeof row.size_bytes === "string"
          ? Number(row.size_bytes)
          : null,
    status: typeof row.status === "string" ? row.status : "uploaded",
    statusLabel: formatStatusLabel(typeof row.status === "string" ? row.status : "uploaded"),
    remarks: typeof row.remarks === "string" ? row.remarks : null,
    createdAt: String(row.created_at ?? ""),
    createdAtLabel: formatLongDate(typeof row.created_at === "string" ? row.created_at : null),
  } satisfies ResidentUploadedDocument;
}

function mapRequirement(
  row: Record<string, unknown>,
  documents: ResidentUploadedDocument[],
) {
  const requirement = row.assistance_requirements as Record<string, unknown> | null;

  return {
    id: String(row.id ?? ""),
    requirementId: String(row.requirement_id ?? ""),
    name: String(requirement?.name ?? "Requirement"),
    description: typeof requirement?.description === "string" ? requirement.description : null,
    documentType: typeof requirement?.document_type === "string" ? requirement.document_type : null,
    isRequired: requirement?.is_required !== false,
    sortOrder:
      typeof requirement?.sort_order === "number"
        ? requirement.sort_order
        : typeof requirement?.sort_order === "string"
          ? Number(requirement.sort_order)
          : 0,
    status: typeof row.status === "string" ? row.status : "pending",
    statusLabel: formatStatusLabel(typeof row.status === "string" ? row.status : "pending"),
    remarks: typeof row.remarks === "string" ? row.remarks : null,
    reviewedAt: typeof row.reviewed_at === "string" ? row.reviewed_at : null,
    reviewedAtLabel:
      typeof row.reviewed_at === "string" ? formatLongDate(row.reviewed_at) : null,
    documents: documents.filter((document) => document.applicationRequirementId === row.id),
  } satisfies ResidentRequirement;
}

function mapStatusHistory(row: Record<string, unknown>) {
  const status = typeof row.new_status === "string" ? row.new_status : "pending_verification";

  return {
    id: String(row.id ?? ""),
    createdAt: String(row.created_at ?? ""),
    createdAtLabel: formatLongDate(typeof row.created_at === "string" ? row.created_at : null),
    status,
    statusLabel: formatStatusLabel(status),
    remarks: typeof row.remarks === "string" ? row.remarks : null,
  } satisfies ResidentStatusHistoryEntry;
}

export async function getResidentPortalSnapshot(): Promise<ResidentPortalSnapshot> {
  assertSupabaseConfigured();

  const user = await requireAuthenticatedUser();
  const [
    { data: applicationRows, error: applicationError },
    { data: notificationRows, error: notificationError },
  ] = await Promise.all([
    supabase
      .from("applications")
      .select(
        "id, resident_id, reference_number, status, urgency, requested_amount, request_reason, submitted_at, reviewed_at, admin_remarks, assistance_types(name, slug)",
      )
      .eq("applicant_profile_id", user.id)
      .order("submitted_at", { ascending: false })
      .limit(1),
    supabase
      .from("notifications")
      .select("id, title, message, category, link_url, read_at, created_at")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (applicationError) {
    throw applicationError;
  }

  if (notificationError) {
    throw notificationError;
  }

  const notifications = ((notificationRows ?? []) as Array<Record<string, unknown>>).map(
    mapNotification,
  );
  const unreadNotifications = notifications.filter((notification) => !notification.isRead).length;
  const applicationRow = ((applicationRows ?? []) as Array<Record<string, unknown>>)[0];

  if (!applicationRow) {
    return {
      application: null,
      notifications,
      unreadNotifications,
      needsActionCount: notifications.filter(
        (notification) =>
          !notification.isRead &&
          /(requirement|correction|follow-up|action)/i.test(
            `${notification.category} ${notification.title} ${notification.body}`,
          ),
      ).length,
    };
  }

  const applicationId = String(applicationRow.id ?? "");
  const [
    { data: historyRows, error: historyError },
    { data: requirementRows, error: requirementError },
    { data: documentRows, error: documentError },
  ] = await Promise.all([
    supabase
      .from("status_histories")
      .select("id, new_status, remarks, created_at")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("application_requirements")
      .select(
        "id, requirement_id, status, remarks, reviewed_at, assistance_requirements(name, description, document_type, is_required, sort_order)",
      )
      .eq("application_id", applicationId),
    supabase
      .from("uploaded_documents")
      .select(
        "id, application_requirement_id, bucket, file_path, file_name, mime_type, size_bytes, status, remarks, created_at",
      )
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false }),
  ]);

  if (historyError) {
    throw historyError;
  }

  if (requirementError) {
    throw requirementError;
  }

  if (documentError) {
    throw documentError;
  }

  const documents = ((documentRows ?? []) as Array<Record<string, unknown>>).map(mapDocument);
  const requirements = ((requirementRows ?? []) as Array<Record<string, unknown>>)
    .map((row) => mapRequirement(row, documents))
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const statusHistory = ((historyRows ?? []) as Array<Record<string, unknown>>).map(
    mapStatusHistory,
  );
  const status = typeof applicationRow.status === "string" ? applicationRow.status : "draft";
  const assistanceType = applicationRow.assistance_types as Record<string, unknown> | null;
  const requestedAmount = parseNullableNumber(applicationRow.requested_amount);

  const application: ResidentApplicationSummary = {
    id: applicationId,
    residentId:
      typeof applicationRow.resident_id === "string" ? applicationRow.resident_id : null,
    referenceNumber: String(applicationRow.reference_number ?? ""),
    status,
    statusLabel: formatStatusLabel(status),
    urgency: typeof applicationRow.urgency === "string" ? applicationRow.urgency : null,
    urgencyLabel: formatTokenLabel(
      typeof applicationRow.urgency === "string" ? applicationRow.urgency : null,
    ),
    assistanceName: String(assistanceType?.name ?? "Assistance request"),
    assistanceSlug: typeof assistanceType?.slug === "string" ? assistanceType.slug : null,
    requestReason: String(applicationRow.request_reason ?? ""),
    requestedAmount,
    requestedAmountLabel: formatCurrency(requestedAmount),
    submittedAt: String(applicationRow.submitted_at ?? ""),
    submittedAtLabel: formatLongDate(
      typeof applicationRow.submitted_at === "string" ? applicationRow.submitted_at : null,
    ),
    reviewedAt: typeof applicationRow.reviewed_at === "string" ? applicationRow.reviewed_at : null,
    reviewedAtLabel:
      typeof applicationRow.reviewed_at === "string"
        ? formatLongDate(applicationRow.reviewed_at)
        : null,
    adminRemarks: typeof applicationRow.admin_remarks === "string" ? applicationRow.admin_remarks : null,
    requirements,
    documents,
    statusHistory,
    progressStep: getProgressStep(status),
    requiresAction: false,
  };

  application.requiresAction = hasResidentAction(status, requirements, notifications);

  return {
    application,
    notifications,
    unreadNotifications,
    needsActionCount:
      (application.requiresAction ? 1 : 0) +
      notifications.filter(
        (notification) =>
          !notification.isRead &&
          /(requirement|correction|follow-up|action)/i.test(
            `${notification.category} ${notification.title} ${notification.body}`,
          ),
      ).length,
  };
}

export async function uploadResidentFollowUpDocuments({
  applicationId,
  residentId,
  referenceNumber,
  files,
  applicationRequirementId,
}: UploadResidentFollowUpInput) {
  assertSupabaseConfigured();

  if (files.length === 0) {
    throw new Error("Choose at least one document to upload.");
  }

  const user = await requireAuthenticatedUser();
  const uploadedDocuments: Array<{
    application_id: string;
    application_requirement_id: string | null;
    resident_id: string | null;
    bucket: string;
    file_path: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
    uploaded_by: string;
  }> = [];

  for (const file of files) {
    const filePath =
      `${user.id}/${referenceNumber}/follow-up/` +
      `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${sanitizeFileName(file.name)}`;

    await uploadFile({
      bucket: "application-documents",
      path: filePath,
      file,
      contentType: file.type,
    });

    uploadedDocuments.push({
      application_id: applicationId,
      application_requirement_id: applicationRequirementId ?? null,
      resident_id: residentId,
      bucket: "application-documents",
      file_path: filePath,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: user.id,
    });
  }

  const { error } = await supabase.from("uploaded_documents").insert(uploadedDocuments);

  if (error) {
    throw error;
  }
}

export async function markResidentNotificationRead(notificationId: string) {
  assertSupabaseConfigured();

  const { error } = await supabase
    .from("notifications")
    .update({
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .is("read_at", null);

  if (error) {
    throw error;
  }
}

export async function markAllResidentNotificationsRead() {
  assertSupabaseConfigured();

  const user = await requireAuthenticatedUser();
  const { error } = await supabase
    .from("notifications")
    .update({
      read_at: new Date().toISOString(),
    })
    .eq("recipient_id", user.id)
    .is("read_at", null);

  if (error) {
    throw error;
  }
}
