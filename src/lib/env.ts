const fallbackUrl = "https://placeholder.supabase.co";
const fallbackKey = "placeholder-anon-key";

export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? fallbackUrl,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? fallbackKey,
};

export const isSupabaseConfigured =
  env.supabaseUrl !== fallbackUrl && env.supabaseAnonKey !== fallbackKey;
