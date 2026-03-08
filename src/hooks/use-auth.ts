import { useAuthContext } from "@/app/auth-provider";

export function useAuth() {
  return useAuthContext();
}
