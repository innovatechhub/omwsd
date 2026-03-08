import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/features/auth/auth-shell";
import { useAuth } from "@/hooks/use-auth";
import { signUp } from "@/services/auth-service";

const registerSchema = z
  .object({
    fullName: z.string().min(3, "Enter your full name."),
    email: z.email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { isConfigured } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: RegisterFormValues) {
    setSubmitError(null);

    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const result = await signUp({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        redirectTo,
      });

      const requiresEmailConfirmation = !result.session;
      toast.success(
        requiresEmailConfirmation
          ? "Account created. Check your email to confirm your registration."
          : "Resident account created successfully.",
      );

      navigate("/login", { replace: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create your account right now.";
      setSubmitError(message);
      toast.error(message);
    }
  }

  return (
    <AuthShell
      eyebrow="Resident Registration"
      title="Create a resident account"
      description="New self-service registrations are assigned the resident role and can be routed into the resident portal after sign-in."
      asideTitle="Start your assistance request journey with a verified account."
      asideDescription="Residents can register here before the request intake and document submission modules are built out further."
      footer={
        <p className="text-sm text-muted-foreground">
          Already registered?{" "}
          <Link
            to="/login"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Sign in instead
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="fullName">
            Full name
          </label>
          <Input id="fullName" autoComplete="name" {...form.register("fullName")} />
          {form.formState.errors.fullName ? (
            <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="registerEmail">
            Email address
          </label>
          <Input
            id="registerEmail"
            type="email"
            autoComplete="email"
            {...form.register("email")}
          />
          {form.formState.errors.email ? (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          ) : null}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground" htmlFor="registerPassword">
              Password
            </label>
            <Input
              id="registerPassword"
              type="password"
              autoComplete="new-password"
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground" htmlFor="confirmPassword">
              Confirm password
            </label>
            <Input
              id="confirmPassword"
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
        </div>

        {submitError ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        ) : null}

        {!isConfigured ? (
          <div className="rounded-2xl border border-primary/15 bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
            Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to enable registration.
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
            <UserPlus className="h-4 w-4" />
          )}
          Create resident account
        </Button>
      </form>
    </AuthShell>
  );
}
