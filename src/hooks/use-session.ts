import { useAuth } from "@/hooks/use-auth";

export function useSession() {
  const { session, user, isConfigured, isLoading, refreshSession, error } = useAuth();

  return {
    session,
    user,
    isConfigured,
    isLoading,
    refreshSession,
    error,
  };
}
