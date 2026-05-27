import { PropsWithChildren, createContext, useContext, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getSession } from "@/services/auth-service";
import { getProfile } from "@/services/profile-service";
import { queryKeys } from "@/lib/query-keys";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import type { AuthContextValue } from "@/types/auth";
import type { AppRole } from "@/types/auth";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const appRoles: AppRole[] = ["resident", "admin", "super_admin", "social_worker"];

function getRoleFromSessionMetadata(session: AuthContextValue["session"]): AppRole | null {
  const metadataRole = session?.user?.user_metadata?.role;

  if (typeof metadataRole !== "string") {
    return null;
  }

  return appRoles.includes(metadataRole as AppRole) ? (metadataRole as AppRole) : null;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AuthContextValue["session"]>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsBootstrapping(false);
      return;
    }

    let isActive = true;

    void getSession()
      .then((nextSession) => {
        if (!isActive) {
          return;
        }

        setSession(nextSession);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setAuthError(error instanceof Error ? error.message : "Failed to load session.");
      })
      .finally(() => {
        if (isActive) {
          setIsBootstrapping(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthError(null);

      if (nextSession?.user.id) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.auth.profile(nextSession.user.id),
        });
      } else {
        void queryClient.removeQueries({
          queryKey: ["auth", "profile"],
        });
      }
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const profileQuery = useQuery({
    queryKey: session?.user.id ? queryKeys.auth.profile(session.user.id) : queryKeys.auth.session,
    queryFn: () => getProfile(session?.user ?? null),
    enabled: isSupabaseConfigured && !!session?.user,
    staleTime: 60_000,
  });

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile: profileQuery.data ?? null,
    role: profileQuery.data?.role ?? getRoleFromSessionMetadata(session),
    isConfigured: isSupabaseConfigured,
    isLoading: isBootstrapping || profileQuery.isLoading,
    error:
      authError ??
      (profileQuery.error instanceof Error ? profileQuery.error.message : null),
    refreshSession: async () => {
      const nextSession = await getSession();
      setSession(nextSession);

      if (nextSession?.user.id) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.auth.profile(nextSession.user.id),
        });
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used within AppProviders.");
  }

  return context;
}
