import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { PENDING_RESIDENT_APPROVAL_MESSAGE } from "@/services/auth-service";
import { uploadFile } from "@/services/storage-service";
import type {
  AssistanceRequestFormValues,
  AssistanceRequestSubmissionResult,
  ResidentAssistanceRequestInput,
} from "@/types/application";

function parseNumber(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] ?? "";
  const lastName = parts.length > 1 ? parts[parts.length - 1] : parts[0] ?? "";
  const middleName = parts.length > 2 ? parts.slice(1, -1).join(" ") : null;

  return {
    firstName,
    middleName,
    lastName,
  };
}

export function generateReferenceNumber() {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  const randomPart = crypto.randomUUID().slice(0, 8).toUpperCase();

  return `OMSWD-${datePart}-${randomPart}`;
}

async function requireAuthenticatedUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("Sign in with a resident account before submitting a request.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (profile?.role !== "resident") {
    throw new Error("Sign in with a resident account before submitting a request.");
  }

  if (profile.is_active === false) {
    throw new Error(PENDING_RESIDENT_APPROVAL_MESSAGE);
  }

  return data.user;
}

async function ensureResidentRecord(userId: string, values: AssistanceRequestFormValues) {
  const { firstName, middleName, lastName } = splitFullName(values.fullName);

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    email: values.email,
    full_name: values.fullName,
    phone_number: values.phoneNumber,
    barangay: values.barangay,
    municipality: values.municipality,
    role: "resident",
  });

  if (profileError) {
    throw profileError;
  }

  const { data: resident, error: residentError } = await supabase
    .from("residents")
    .upsert(
      {
        profile_id: userId,
        resident_code: `RES-${userId.slice(0, 8).toUpperCase()}`,
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        birth_date: values.birthDate || null,
        sex: values.sex || null,
        civil_status: values.civilStatus || null,
        contact_number: values.phoneNumber,
        address_line: values.addressLine,
        household_size: parseNumber(values.householdSize),
        monthly_income: parseNumber(values.monthlyIncome),
      },
      {
        onConflict: "profile_id",
      },
    )
    .select("id")
    .single();

  if (residentError) {
    throw residentError;
  }

  return resident.id as string;
}

async function uploadDocuments(
  userId: string,
  referenceNumber: string,
  applicationId: string,
  files: File[],
  bucket: string,
) {
  const uploaded: Array<{
    bucket: string;
    file_path: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
  }> = [];

  for (const file of files) {
    const filePath = `${userId}/${referenceNumber}/${Date.now()}-${file.name}`;
    await uploadFile({
      bucket,
      path: filePath,
      file,
      contentType: file.type,
    });

    uploaded.push({
      bucket,
      file_path: filePath,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    });
  }

  if (uploaded.length === 0) {
    return;
  }

  const { error } = await supabase.from("uploaded_documents").insert(
    uploaded.map((document) => ({
      application_id: applicationId,
      ...document,
      uploaded_by: userId,
    })),
  );

  if (error) {
    throw error;
  }
}

async function seedApplicationRequirements(applicationId: string, assistanceTypeId: string) {
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

export async function createAssistanceRequest(
  values: AssistanceRequestFormValues,
): Promise<AssistanceRequestSubmissionResult> {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.",
    );
  }

  const user = await requireAuthenticatedUser();
  const residentId = await ensureResidentRecord(user.id, values);
  const referenceNumber = generateReferenceNumber();

  const { data: assistanceType, error: assistanceTypeError } = await supabase
    .from("assistance_types")
    .select("id")
    .eq("slug", values.assistanceTypeSlug)
    .maybeSingle();

  if (assistanceTypeError) {
    throw assistanceTypeError;
  }

  if (!assistanceType) {
    throw new Error("Selected assistance type could not be found.");
  }

  const { data: application, error: applicationError } = await supabase
    .from("applications")
    .insert({
      reference_number: referenceNumber,
      applicant_profile_id: user.id,
      resident_id: residentId,
      assistance_type_id: assistanceType.id,
      status: "pending_verification",
      urgency: "medium",
      requested_amount: parseNumber(values.requestedAmount),
      request_reason: values.requestReason,
      applicant_full_name: values.fullName,
      applicant_email: values.email,
      contact_number: values.phoneNumber,
      birth_date: values.birthDate || null,
      sex: values.sex || null,
      civil_status: values.civilStatus || null,
      address_line: values.addressLine,
      applicant_barangay: values.barangay,
      applicant_municipality: values.municipality,
      household_size: parseNumber(values.householdSize),
      monthly_income: parseNumber(values.monthlyIncome),
      government_id_type: values.governmentIdType,
      government_id_number: values.governmentIdNumber,
      consent_accepted: values.consentAccepted,
    })
    .select("id")
    .single();

  if (applicationError) {
    throw applicationError;
  }

  const applicationId = application.id as string;
  await seedApplicationRequirements(applicationId, assistanceType.id);

  await uploadDocuments(user.id, referenceNumber, applicationId, values.governmentIdFiles, "ids");
  await uploadDocuments(
    user.id,
    referenceNumber,
    applicationId,
    values.supportingDocuments,
    "application-documents",
  );

  const { error: statusError } = await supabase.from("status_histories").insert({
    application_id: applicationId,
    previous_status: null,
    new_status: "pending_verification",
    changed_by: user.id,
    remarks: "Application submitted through the resident intake portal.",
  });

  if (statusError) {
    throw statusError;
  }

  return {
    applicationId,
    referenceNumber,
  };
}

export async function createResidentAssistanceRequest(
  input: ResidentAssistanceRequestInput,
): Promise<AssistanceRequestSubmissionResult> {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.",
    );
  }

  const user = await requireAuthenticatedUser();

  // Fetch existing profile + resident data so the resident doesn't re-enter it
  const [{ data: profileRow }, { data: residentRow }] = await Promise.all([
    supabase
      .from("profiles")
      .select("email, full_name, phone_number, barangay, municipality")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("residents")
      .select("id, birth_date, sex, civil_status, address_line, household_size, monthly_income")
      .eq("profile_id", user.id)
      .maybeSingle(),
  ]);

  const profile = (profileRow ?? {}) as Record<string, unknown>;
  const resident = (residentRow ?? {}) as Record<string, unknown>;

  const residentId = typeof resident.id === "string" ? resident.id : null;
  if (!residentId) {
    throw new Error("Resident profile not found. Please complete your profile before submitting.");
  }

  const referenceNumber = generateReferenceNumber();

  const { data: assistanceType, error: assistanceTypeError } = await supabase
    .from("assistance_types")
    .select("id")
    .eq("slug", input.assistanceTypeSlug)
    .maybeSingle();

  if (assistanceTypeError) throw assistanceTypeError;
  if (!assistanceType) throw new Error("Selected assistance type could not be found.");

  const householdSize = input.householdSize
    ? parseNumber(input.householdSize) ?? parseNullableNumber(resident.household_size)
    : parseNullableNumber(resident.household_size);

  const monthlyIncome = input.monthlyIncome
    ? parseNumber(input.monthlyIncome) ?? parseNullableNumber(resident.monthly_income)
    : parseNullableNumber(resident.monthly_income);

  const { data: application, error: applicationError } = await supabase
    .from("applications")
    .insert({
      reference_number: referenceNumber,
      applicant_profile_id: user.id,
      resident_id: residentId,
      assistance_type_id: (assistanceType as Record<string, unknown>).id,
      status: "pending_verification",
      urgency: "medium",
      requested_amount: parseNumber(input.requestedAmount),
      request_reason: input.requestReason,
      applicant_full_name: typeof profile.full_name === "string" ? profile.full_name : "",
      applicant_email: typeof profile.email === "string" ? profile.email : user.email ?? "",
      contact_number: typeof profile.phone_number === "string" ? profile.phone_number : "",
      birth_date: typeof resident.birth_date === "string" ? resident.birth_date : null,
      sex: typeof resident.sex === "string" ? resident.sex : null,
      civil_status: typeof resident.civil_status === "string" ? resident.civil_status : null,
      address_line: typeof resident.address_line === "string" ? resident.address_line : "",
      applicant_barangay: typeof profile.barangay === "string" ? profile.barangay : "",
      applicant_municipality: typeof profile.municipality === "string" ? profile.municipality : "Pandan",
      household_size: householdSize,
      monthly_income: monthlyIncome,
      consent_accepted: input.consentAccepted,
    })
    .select("id")
    .single();

  if (applicationError) throw applicationError;

  const applicationId = (application as Record<string, unknown>).id as string;
  await seedApplicationRequirements(applicationId, (assistanceType as Record<string, unknown>).id as string);

  await uploadDocuments(user.id, referenceNumber, applicationId, input.supportingDocuments, "application-documents");

  const { error: statusError } = await supabase.from("status_histories").insert({
    application_id: applicationId,
    previous_status: null,
    new_status: "pending_verification",
    changed_by: user.id,
    remarks: "Application submitted through the resident portal.",
  });

  if (statusError) throw statusError;

  return { applicationId, referenceNumber };
}

function parseNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
