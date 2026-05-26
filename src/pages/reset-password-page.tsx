import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/features/auth/auth-shell";
import { useAuth } from "@/hooks/use-auth";
import { updatePassword } from "@/services/auth-service";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { user, isConfigured } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: ResetPasswordValues) {
    setSubmitError(null);

    try {
      await updatePassword(values.password);
      toast.success("Your password has been updated.");
      navigate("/login", { replace: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update your password.";
      setSubmitError(message);
      toast.error(message);
    }
  }

  return (
    <AuthShell
      eyebrow="Password Reset"
      title="Set a new password"
      description="Use the recovery session from your email link to choose a new password for your account."
      footer={
        <p className="text-sm text-muted-foreground">
          Need a new link?{" "}
          <Link
            to="/forgot-password"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Request password recovery again
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="newPassword">
            New password
          </label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            {...form.register("password")}
          />
          {form.formState.errors.password ? (
            <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="newPasswordConfirm">
            Confirm new password
          </label>
          <Input
            id="newPasswordConfirm"
            type="password"
            autoComplete="new-password"
            {...form.register("confirmPassword")}
          />
          {form.formState.errors.confirmPassword ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.confirmPassword.message}
            </p>
          ) : null}
        </div>

        {!user ? (
          <div className="rounded-2xl border border-primary/15 bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
            Open this page from the password recovery email so Supabase can create a recovery session before you submit a new password.
          </div>
        ) : null}

        {submitError ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        ) : null}

        {!isConfigured ? (
          <div className="rounded-2xl border border-primary/15 bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
            Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to enable password resets.
          </div>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting || !isConfigured || !user}
        >
          {isSubmitting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="h-4 w-4" />
          )}
          Update password
        </Button>
      </form>
    </AuthShell>
  );
}
