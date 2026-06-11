import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { resolveMutation } from "@/services/mutation-service";
import { resolveNullableQuery } from "@/services/query-service";
import type { UserProfile } from "@/types/auth";
import type {
  ResidentProfileSettings,
  UpdateResidentProfileInput,
} from "@/types/profile";

function mapUserToProfile(user: User): UserProfile {
  const metadata = user.user_metadata ?? {};

  return {
    id: user.id,
    email: user.email ?? null,
    full_name:
      typeof metadata.full_name === "string"
        ? metadata.full_name
        : typeof metadata.name === "string"
        ? metadata.name
          : null,
    avatar_url: typeof metadata.avatar_url === "string" ? metadata.avatar_url : null,
    phone_number: typeof metadata.phone_number === "string" ? metadata.phone_number : null,
    role: typeof metadata.role === "string" ? (metadata.role as UserProfile["role"]) : null,
    barangay: typeof metadata.barangay === "string" ? metadata.barangay : null,
    municipality: typeof metadata.municipality === "string" ? metadata.municipality : null,
    is_active:
      metadata.role === "resident"
        ? metadata.is_active === true
        : metadata.is_active !== false,
  };
}

function formatResidentFullName(
  resident: Record<string, unknown> | null,
  fallbackFullName: string | null,
) {
  const parts = [
    typeof resident?.first_name === "string" ? resident.first_name : null,
    typeof resident?.middle_name === "string" ? resident.middle_name : null,
    typeof resident?.last_name === "string" ? resident.last_name : null,
    typeof resident?.suffix === "string" ? resident.suffix : null,
  ].filter((value): value is string => Boolean(value && value.trim()));

  return parts.join(" ") || fallbackFullName || "";
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? "";
  const lastName = parts.length > 1 ? parts[parts.length - 1] : parts[0] ?? "";
  const middleName = parts.length > 2 ? parts.slice(1, -1).join(" ") : null;

  return {
    firstName,
    middleName,
    lastName,
  };
}

function stringifyNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string" && value.trim()) {
    return value;
  }

  return "";
}

function parseWholeNumber(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseDecimalNumber(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function shouldFallbackToMetadata(error: Error) {
  return /profiles/i.test(error.message) || /relation/i.test(error.message);
}

export async function getProfile(user: User | null) {
  if (!user || !isSupabaseConfigured) {
    return null;
  }

  const fallbackProfile = mapUserToProfile(user);

  try {
    const data = await resolveNullableQuery<Record<string, unknown>>(
      supabase
        .from("profiles")
        .select(
          "id, email, full_name, avatar_url, phone_number, role, barangay, municipality, is_active",
        )
        .eq("id", user.id)
        .maybeSingle(),
    );

    if (!data) {
      return fallbackProfile;
    }

    return {
      ...fallbackProfile,
      ...data,
      id: typeof data.id === "string" ? data.id : fallbackProfile.id,
      email: typeof data.email === "string" ? data.email : fallbackProfile.email,
      full_name:
        typeof data.full_name === "string" ? data.full_name : fallbackProfile.full_name,
      avatar_url:
        typeof data.avatar_url === "string"
          ? data.avatar_url
          : fallbackProfile.avatar_url,
      phone_number:
        typeof data.phone_number === "string"
          ? data.phone_number
          : fallbackProfile.phone_number,
      role:
        typeof data.role === "string" ? (data.role as UserProfile["role"]) : fallbackProfile.role,
      barangay:
        typeof data.barangay === "string" ? data.barangay : fallbackProfile.barangay,
      municipality:
        typeof data.municipality === "string"
          ? data.municipality
          : fallbackProfile.municipality,
      is_active:
        typeof data.is_active === "boolean" ? data.is_active : fallbackProfile.is_active,
    } satisfies UserProfile;
  } catch (error) {
    if (error instanceof Error && shouldFallbackToMetadata(error)) {
      return fallbackProfile;
    }

    throw error;
  }
}

export async function updateProfile(userId: string, updates: Partial<UserProfile>) {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }

  return resolveMutation(
    supabase.from("profiles").upsert({ id: userId, ...updates }).select().single(),
  );
}

export async function getResidentProfileSettings(user: User | null) {
  if (!user || !isSupabaseConfigured) {
    return null;
  }

  const fallbackProfile = mapUserToProfile(user);

  const [profile, resident] = await Promise.all([
    resolveNullableQuery<Record<string, unknown>>(
      supabase
        .from("profiles")
        .select(
          "id, email, full_name, phone_number, role, barangay, municipality, is_active",
        )
        .eq("id", user.id)
        .maybeSingle(),
    ),
    resolveNullableQuery<Record<string, unknown>>(
      supabase
        .from("residents")
        .select(
          "id, resident_code, first_name, middle_name, last_name, suffix, birth_date, sex, civil_status, contact_number, address_line, household_size, monthly_income, is_verified, verified_at",
        )
        .eq("profile_id", user.id)
        .maybeSingle(),
    ),
  ]);

  const fullName = formatResidentFullName(
    resident,
    typeof profile?.full_name === "string" ? profile.full_name : fallbackProfile.full_name,
  );

  return {
    profileId: user.id,
    residentId: typeof resident?.id === "string" ? resident.id : null,
    residentCode: typeof resident?.resident_code === "string" ? resident.resident_code : null,
    role:
      typeof profile?.role === "string"
        ? (profile.role as ResidentProfileSettings["role"])
        : fallbackProfile.role,
    email:
      typeof profile?.email === "string"
        ? profile.email
        : fallbackProfile.email ?? user.email ?? "",
    fullName,
    phoneNumber:
      typeof resident?.contact_number === "string"
        ? resident.contact_number
        : typeof profile?.phone_number === "string"
          ? profile.phone_number
          : fallbackProfile.phone_number ?? "",
    birthDate: typeof resident?.birth_date === "string" ? resident.birth_date : "",
    sex: typeof resident?.sex === "string" ? resident.sex : "",
    civilStatus: typeof resident?.civil_status === "string" ? resident.civil_status : "",
    municipality:
      typeof profile?.municipality === "string"
        ? profile.municipality
        : fallbackProfile.municipality ?? "Pandan",
    barangay:
      typeof profile?.barangay === "string" ? profile.barangay : fallbackProfile.barangay ?? "",
    addressLine: typeof resident?.address_line === "string" ? resident.address_line : "",
    householdSize: stringifyNumber(resident?.household_size),
    monthlyIncome: stringifyNumber(resident?.monthly_income),
    isActive: typeof profile?.is_active === "boolean" ? profile.is_active : fallbackProfile.is_active,
    isVerified: resident?.is_verified === true,
    verifiedAt: typeof resident?.verified_at === "string" ? resident.verified_at : null,
  } satisfies ResidentProfileSettings;
}

export async function updateResidentProfileSettings(
  userId: string,
  values: UpdateResidentProfileInput,
) {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }

  const { firstName, middleName, lastName } = splitFullName(values.fullName);

  await resolveMutation(
    supabase.from("profiles").upsert(
      {
        id: userId,
        email: values.email,
        full_name: values.fullName,
        phone_number: values.phoneNumber || null,
        barangay: values.barangay || null,
        municipality: values.municipality || null,
        role: "resident",
      },
      {
        onConflict: "id",
      },
    ),
  );

  await resolveMutation(
    supabase.from("residents").upsert(
      {
        profile_id: userId,
        resident_code: `RES-${userId.slice(0, 8).toUpperCase()}`,
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        birth_date: values.birthDate || null,
        sex: values.sex || null,
        civil_status: values.civilStatus || null,
        contact_number: values.phoneNumber || null,
        address_line: values.addressLine || null,
        household_size: parseWholeNumber(values.householdSize),
        monthly_income: parseDecimalNumber(values.monthlyIncome),
      },
      {
        onConflict: "profile_id",
      },
    ),
  );
}
