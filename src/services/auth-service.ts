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
  redirectTo?: string;
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

export async function signUp({ email, password, fullName, redirectTo }: SignUpPayload) {
  assertSupabaseConfigured();

  return resolveMutation<AuthResponse["data"]>(
    supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          ...(fullName ? { full_name: fullName } : {}),
          role: "resident",
          is_active: true,
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
