import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, LogIn } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/features/auth/auth-shell";
import { getDefaultRouteForAuthenticatedUser } from "@/features/auth/route-guards";
import { useAuth } from "@/hooks/use-auth";
import { signInWithPassword } from "@/services/auth-service";
import { getProfile } from "@/services/profile-service";
import type { AppRole } from "@/types/auth";

const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type LoginFormValues = z.infer<typeof loginSchema>;
const adminRoles: AppRole[] = ["admin", "super_admin", "social_worker"];

function canRoleAccessRedirectPath(targetPath: string, role: AppRole | null) {
  if (targetPath.startsWith("/resident")) {
    return role === "resident";
  }

  if (targetPath.startsWith("/admin")) {
    return Boolean(role && adminRoles.includes(role));
  }

  if (targetPath.startsWith("/unauthorized")) {
    return false;
  }

  return true;
}

function resolveRoleFromMetadata(value: unknown): AppRole | null {
  if (typeof value !== "string") {
    return null;
  }

  if (value === "resident" || value === "admin" || value === "super_admin" || value === "social_worker") {
    return value;
  }

  return null;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshSession, isConfigured } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: LoginFormValues) {
    setSubmitError(null);

    try {
      const response = await signInWithPassword(values);
      await refreshSession();

      const profile = await getProfile(response.user ?? null);
      const nextRole =
        profile?.role ??
        resolveRoleFromMetadata(response.user?.user_metadata?.role);

      if (nextRole === "resident" && profile?.is_active === false) {
        await import("@/services/auth-service").then((m) => m.signOut());
        await refreshSession();
        setSubmitError("Your account is pending admin approval. Please wait for an administrator to activate your account.");
        return;
      }

      const redirect = searchParams.get("redirect");
      const fallbackPath = getDefaultRouteForAuthenticatedUser(nextRole);
      const targetPath =
        redirect && canRoleAccessRedirectPath(redirect, nextRole) ? redirect : fallbackPath;

      toast.success("Signed in successfully.");
      navigate(targetPath, { replace: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to sign in with those credentials.";
      setSubmitError(message);
      toast.error(message);
    }
  }

  return (
    <AuthShell
      eyebrow="Authentication"
      title="Sign in to your account"
      description="Use your resident or staff credentials to continue to the appropriate portal."
      footer={
        <p className="text-sm text-muted-foreground">
          No account yet?{" "}
          <Link
            to="/register"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Create a resident account
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="email">
            Email address
          </label>
          <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
          {form.formState.errors.email ? (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-semibold text-foreground" htmlFor="password">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...form.register("password")}
          />
          {form.formState.errors.password ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </div>

        {submitError ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        ) : null}

        {!isConfigured ? (
          <div className="rounded-2xl border border-primary/15 bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
            Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to enable authentication.
          </div>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting || !isConfigured}
        >
          {isSubmitting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
