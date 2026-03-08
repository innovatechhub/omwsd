import type { PropsWithChildren } from "react";
import { LockKeyhole, ShieldAlert } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { isSupabaseConfigured } from "@/lib/env";
import type { AppRole } from "@/types/auth";

const adminRoles: AppRole[] = ["admin", "super_admin", "social_worker"];

function getDefaultRouteForRole(role: AppRole | null) {
  if (role === "resident") {
    return "/resident";
  }

  if (role && adminRoles.includes(role)) {
    return "/admin";
  }

  return "/";
}

function buildRedirectPath(pathname: string, search: string, hash: string) {
  return `${pathname}${search}${hash}`;
}

function AuthStatusCard({
  icon,
  title,
  description,
}: {
  icon: typeof LockKeyhole;
  title: string;
  description: string;
}) {
  const Icon = icon;

  return (
    <div className="container flex min-h-[calc(100vh-14rem)] items-center justify-center py-12">
      <Card className="w-full max-w-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-secondary text-primary">
            <Icon className="h-7 w-7" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="text-base leading-7">{description}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function RoleGate({
  allowedRoles,
  children,
}: PropsWithChildren<{ allowedRoles: AppRole[] }>) {
  const location = useLocation();
  const { user, role, isLoading } = useAuth();

  if (!isSupabaseConfigured) {
    return (
      <AuthStatusCard
        icon={ShieldAlert}
        title="Supabase setup required"
        description="Protected routes are ready, but authentication is disabled until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured."
      />
    );
  }

  if (isLoading) {
    return (
      <AuthStatusCard
        icon={LockKeyhole}
        title="Checking your access"
        description="The system is loading your session and profile before entering the portal."
      />
    );
  }

  if (!user) {
    const redirect = buildRedirectPath(location.pathname, location.search, location.hash);

    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

export function RedirectIfAuthenticated() {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <AuthStatusCard
        icon={LockKeyhole}
        title="Loading your session"
        description="Please wait while the system checks whether you are already signed in."
      />
    );
  }

  if (user) {
    return <Navigate to={getDefaultRouteForRole(role)} replace />;
  }

  return <Outlet />;
}

export function RequireAuth() {
  return (
    <RoleGate allowedRoles={["resident", "admin", "super_admin", "social_worker"]}>
      <Outlet />
    </RoleGate>
  );
}

export function RequireResident() {
  return (
    <RoleGate allowedRoles={["resident"]}>
      <Outlet />
    </RoleGate>
  );
}

export function RequireAdmin() {
  return (
    <RoleGate allowedRoles={adminRoles}>
      <Outlet />
    </RoleGate>
  );
}

export function getDefaultRouteForAuthenticatedUser(role: AppRole | null) {
  return getDefaultRouteForRole(role);
}
