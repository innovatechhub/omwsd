import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { queryKeys } from "@/lib/query-keys";
import { getResidentPortalSnapshot } from "@/services/resident-service";

export function useResidentPortal() {
  const { user, isConfigured } = useAuth();

  return useQuery({
    queryKey: user?.id ? queryKeys.resident.portal(user.id) : ["resident", "portal", "guest"],
    queryFn: getResidentPortalSnapshot,
    enabled: isConfigured && !!user,
    staleTime: 30_000,
  });
}
