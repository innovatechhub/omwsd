import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { resolveMutation } from "@/services/mutation-service";

export interface UploadFileInput {
  bucket: string;
  path: string;
  file: File | Blob;
  cacheControl?: string;
  contentType?: string;
  upsert?: boolean;
}

function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
}

export async function uploadFile({
  bucket,
  path,
  file,
  cacheControl,
  contentType,
  upsert = false,
}: UploadFileInput) {
  assertSupabaseConfigured();

  await resolveMutation(
    supabase.storage.from(bucket).upload(path, file, {
      cacheControl,
      contentType,
      upsert,
    }),
  );

  return path;
}

export async function removeFiles(bucket: string, paths: string[]) {
  assertSupabaseConfigured();

  await resolveMutation(supabase.storage.from(bucket).remove(paths));
}

export async function createSignedFileUrl(bucket: string, path: string, expiresIn = 120) {
  assertSupabaseConfigured();

  const data = await resolveMutation(supabase.storage.from(bucket).createSignedUrl(path, expiresIn));

  if (!data?.signedUrl) {
    throw new Error("Unable to generate a temporary file link.");
  }

  return data.signedUrl;
}

export function getPublicFileUrl(bucket: string, path: string) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
