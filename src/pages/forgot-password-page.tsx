import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, MailCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/features/auth/auth-shell";
import { useAuth } from "@/hooks/use-auth";
import { resetPasswordForEmail } from "@/services/auth-service";

const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address."),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const { isConfigured } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: ForgotPasswordValues) {
    setSubmitError(null);

    try {
      await resetPasswordForEmail(values.email, `${window.location.origin}/reset-password`);
      setIsSubmitted(true);
      toast.success("Password reset instructions were sent to your email.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to send reset instructions.";
      setSubmitError(message);
      toast.error(message);
    }
  }

  return (
    <AuthShell
      eyebrow="Password Recovery"
      title="Request a password reset"
      description="Enter the email address linked to your OMSWD account and the system will send a recovery link."
      asideTitle="Secure recovery for resident and staff accounts."
      asideDescription="Password reset uses Supabase recovery links and routes the user back into the reset screen in this Vite app."
      footer={
        <p className="text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link
            to="/login"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Return to sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="forgotEmail">
            Email address
          </label>
          <Input
            id="forgotEmail"
            type="email"
            autoComplete="email"
            {...form.register("email")}
          />
          {form.formState.errors.email ? (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          ) : null}
        </div>

        {isSubmitted ? (
          <div className="rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-foreground">
            Check your inbox for the recovery link, then continue on the reset password page.
          </div>
        ) : null}

        {submitError ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        ) : null}

        {!isConfigured ? (
          <div className="rounded-2xl border border-primary/15 bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
            Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to enable password recovery.
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
            <MailCheck className="h-4 w-4" />
          )}
          Send reset link
        </Button>
      </form>
    </AuthShell>
  );
}
