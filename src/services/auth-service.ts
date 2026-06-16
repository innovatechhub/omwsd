import type { AuthResponse, AuthTokenResponsePassword, Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { env, isSupabaseConfigured } from "@/lib/env";
import { resolveMutation } from "@/services/mutation-service";
import { resolveNullableQuery } from "@/services/query-service";
import { uploadFile } from "@/services/storage-service";
import { getProfile } from "@/services/profile-service";

export const PENDING_RESIDENT_APPROVAL_MESSAGE =
  "Your account is pending admin approval. Please wait for an administrator to activate your account.";

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpPayload extends SignInCredentials {
  fullName?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  suffix?: string;
  redirectTo?: string;
  phoneNumber?: string;
  birthDate?: string;
  sex?: string;
  civilStatus?: string;
  municipality?: string;
  barangay?: string;
  addressLine?: string;
  governmentIdType?: string;
  governmentIdNumber?: string;
}

export interface CreateStaffUserPayload extends SignInCredentials {
  fullName: string;
  role: "admin" | "social_worker";
}

function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
}

async function writeAuthAuditLog(
  action: string,
  actorId: string | null,
  metadata: Record<string, unknown> = {},
) {
  await supabase.from("audit_logs").insert({
    actor_id: actorId,
    action,
    entity_type: "auth",
    entity_id: actorId,
    metadata,
  });
}

function getSupabaseProjectRef() {
  try {
    return new URL(env.supabaseUrl).hostname.split(".")[0] || "<project-ref>";
  } catch {
    return "<project-ref>";
  }
}

async function throwEdgeFunctionError(error: unknown, functionName: string): Promise<never> {
  const context = (error as { context?: unknown }).context;

  if (context instanceof Response) {
    const payload = await context
      .clone()
      .json()
      .catch(() => null);

    if (payload && typeof payload.error === "string") {
      throw new Error(payload.error);
    }

    if (
      context.status === 404 &&
      payload &&
      typeof payload === "object" &&
      "code" in payload &&
      payload.code === "NOT_FOUND"
    ) {
      throw new Error(
        `Supabase Edge Function "${functionName}" is not deployed to project ${getSupabaseProjectRef()}. Run: npx supabase functions deploy ${functionName} --project-ref ${getSupabaseProjectRef()}`,
      );
    }
  }

  const message = error instanceof Error ? error.message : "Unable to call Supabase Edge Function.";

  if (message === "Failed to send a request to the Edge Function") {
    throw new Error(
      `Unable to reach Supabase Edge Function "${functionName}" in project ${getSupabaseProjectRef()}. Confirm it is deployed and the app is using the correct VITE_SUPABASE_URL.`,
    );
  }

  throw new Error(message);
}

export async function getSession() {
  if (!isSupabaseConfigured) {
    return null;
  }

  return resolveNullableQuery<Session>(supabase.auth.getSession().then(({ data, error }) => ({
    data: data.session,
    error,
  })));
}

export async function signInWithPassword(credentials: SignInCredentials) {
  assertSupabaseConfigured();

  const data = await resolveMutation<AuthTokenResponsePassword["data"]>(
    supabase.auth.signInWithPassword(credentials),
  );

  const profile = await getProfile(data.user ?? null);

  if (profile?.role === "resident" && profile.is_active === false) {
    await supabase.auth.signOut();
    throw new Error(PENDING_RESIDENT_APPROVAL_MESSAGE);
  }

  void writeAuthAuditLog("auth.sign_in", data.user?.id ?? null, { role: profile?.role ?? "unknown" });

  return data;
}

export async function signUp({
  email,
  password,
  fullName,
  firstName,
  middleName,
  lastName,
  suffix,
  redirectTo,
  phoneNumber,
  birthDate,
  sex,
  civilStatus,
  municipality,
  barangay,
  addressLine,
  governmentIdType,
  governmentIdNumber,
}: SignUpPayload) {
  assertSupabaseConfigured();

  return resolveMutation<AuthResponse["data"]>(
    supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          ...(fullName ? { full_name: fullName } : {}),
          ...(firstName ? { first_name: firstName } : {}),
          ...(middleName ? { middle_name: middleName } : {}),
          ...(lastName ? { last_name: lastName } : {}),
          ...(suffix ? { suffix } : {}),
          ...(phoneNumber ? { phone_number: phoneNumber } : {}),
          ...(birthDate ? { birth_date: birthDate } : {}),
          ...(sex ? { sex } : {}),
          ...(civilStatus ? { civil_status: civilStatus } : {}),
          ...(municipality ? { municipality } : {}),
          ...(barangay ? { barangay } : {}),
          ...(addressLine ? { address_line: addressLine } : {}),
          ...(governmentIdType ? { government_id_type: governmentIdType } : {}),
          ...(governmentIdNumber ? { government_id_number: governmentIdNumber } : {}),
          role: "resident",
          is_active: false,
        },
      },
    }),
  );
}

export async function createStaffUser({
  email,
  password,
  fullName,
  role,
}: CreateStaffUserPayload) {
  assertSupabaseConfigured();

  const { data, error } = await supabase.functions.invoke<{ userId: string }>(
    "create-staff-user",
    {
      body: {
        email,
        password,
        fullName,
        role,
      },
    },
  );

  if (error) {
    await throwEdgeFunctionError(error, "create-staff-user");
  }

  return data;
}

export interface UpdateStaffUserPayload {
  userId: string;
  fullName?: string;
  role?: string;
  password?: string;
}

export async function updateStaffUser(payload: UpdateStaffUserPayload) {
  assertSupabaseConfigured();

  const { data, error } = await supabase.functions.invoke<{ success: boolean }>(
    "update-staff-user",
    { body: payload },
  );

  if (error) {
    await throwEdgeFunctionError(error, "update-staff-user");
  }

  return data;
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function uploadRegistrationGovernmentIds(userId: string, files: File[]) {
  assertSupabaseConfigured();

  if (files.length === 0) {
    return;
  }

  const uploaded: Array<{
    bucket: string;
    file_path: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
    uploaded_by: string;
  }> = [];

  for (const file of files) {
    const filePath =
      `${userId}/registration/` +
      `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${sanitizeFileName(file.name)}`;

    await uploadFile({
      bucket: "ids",
      path: filePath,
      file,
      contentType: file.type,
    });

    uploaded.push({
      bucket: "ids",
      file_path: filePath,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: userId,
    });
  }

  const { error } = await supabase.from("uploaded_documents").insert(uploaded);

  if (error) {
    throw error;
  }
}

export async function signOut() {
  if (!isSupabaseConfigured) {
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  void writeAuthAuditLog("auth.sign_out", user?.id ?? null, {});

  await resolveMutation(
    supabase.auth.signOut().then(({ error }) => ({
      data: undefined,
      error,
    })),
  );
}

export async function resetPasswordForEmail(email: string, redirectTo?: string) {
  assertSupabaseConfigured();

  return resolveMutation(
    supabase.auth
      .resetPasswordForEmail(email, {
        redirectTo,
      })
      .then(({ error }) => ({
        data: undefined,
        error,
      })),
  );
}

export async function updatePassword(password: string) {
  assertSupabaseConfigured();

  const { data, error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}
