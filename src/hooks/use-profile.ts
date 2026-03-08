import { useAuth } from "@/hooks/use-auth";

export function useProfile() {
  const { profile, role, isLoading, error } = useAuth();

  return {
    profile,
    role,
    isLoading,
    error,
  };
}
