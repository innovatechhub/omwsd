import type { Session, User } from "@supabase/supabase-js";

export type AppRole = "resident" | "admin" | "super_admin" | "social_worker";

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  role: AppRole | null;
  barangay: string | null;
  municipality: string | null;
  is_active: boolean;
}

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  role: AppRole | null;
  isConfigured: boolean;
  isLoading: boolean;
  error: string | null;
  refreshSession: () => Promise<void>;
}
