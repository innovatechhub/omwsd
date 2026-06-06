import type { AuthResponse, AuthTokenResponsePassword, Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { resolveMutation } from "@/services/mutation-service";
import { resolveNullableQuery } from "@/services/query-service";

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

function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
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

  return resolveMutation<AuthTokenResponsePassword["data"]>(
    supabase.auth.signInWithPassword(credentials),
  );
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

export async function signOut() {
  if (!isSupabaseConfigured) {
    return;
  }

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
