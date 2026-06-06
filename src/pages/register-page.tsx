import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  IdCard,
  LoaderCircle,
  MapPin,
  User,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { DocumentDropzone } from "@/components/forms/document-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AuthShell } from "@/features/auth/auth-shell";
import { useAuth } from "@/hooks/use-auth";
import { signUp } from "@/services/auth-service";
import {
  getPandanAddressData,
  type PandanBarangay,
} from "@/services/pandan-address-api";

const fileArraySchema = z
  .array(z.custom<File>((file) => file instanceof File, "Invalid file"))
  .min(1, "Upload at least one file.");

const registerSchema = z
  .object({
    lastName: z.string().min(1, "Enter your last name."),
    firstName: z.string().min(1, "Enter your first name."),
    middleName: z.string().optional(),
    suffix: z.string().optional(),
    email: z.email("Enter a valid email address."),
    phoneNumber: z.string().min(7, "Enter a valid contact number."),
    birthDate: z.string().min(1, "Enter your birth date."),
    sex: z.string().min(1, "Select a sex value."),
    civilStatus: z.string().min(1, "Select a civil status."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password."),
    municipality: z.string().min(2, "Select your municipality."),
    barangay: z.string().min(1, "Select your barangay."),
    addressLine: z.string().min(5, "Enter a complete address."),
    governmentIdType: z.string().min(1, "Select an ID type."),
    governmentIdNumber: z.string().min(3, "Enter the ID number."),
    governmentIdFiles: fileArraySchema,
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

type StepKey = "personal" | "address" | "identity";

const steps: { key: StepKey; title: string }[] = [
  { key: "personal", title: "Personal Information" },
  { key: "address", title: "Address Information" },
  { key: "identity", title: "Identity Information" },
];

const stepFields: Array<Array<keyof RegisterFormValues>> = [
  [
    "lastName",
    "firstName",
    "middleName",
    "suffix",
    "email",
    "phoneNumber",
    "birthDate",
    "sex",
    "civilStatus",
    "password",
    "confirmPassword",
  ],
  ["municipality", "barangay", "addressLine"],
  ["governmentIdType", "governmentIdNumber", "governmentIdFiles"],
];

export function RegisterPage() {
  const navigate = useNavigate();
  const { isConfigured } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [barangays, setBarangays] = useState<PandanBarangay[]>([]);
  const [isLoadingBarangays, setIsLoadingBarangays] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      lastName: "",
      firstName: "",
      middleName: "",
      suffix: "",
      email: "",
      phoneNumber: "",
      birthDate: "",
      sex: "",
      civilStatus: "",
      municipality: "Pandan",
      barangay: "",
      addressLine: "",
      governmentIdType: "",
      governmentIdNumber: "",
      governmentIdFiles: [],
      password: "",
      confirmPassword: "",
    },
  });

  const governmentIdFiles = form.watch("governmentIdFiles");
  const isSubmitting = form.formState.isSubmitting;

  useEffect(() => {
    let isMounted = true;

    async function loadPandanAddressData() {
      try {
        const data = await getPandanAddressData();
        if (!isMounted) return;
        setBarangays(data.barangays);
        form.setValue("municipality", data.municipality, { shouldValidate: true });
      } catch (error) {
        if (!isMounted) return;
        const message =
          error instanceof Error ? error.message : "Unable to load Pandan barangays.";
        toast.error(message);
      } finally {
        if (isMounted) setIsLoadingBarangays(false);
      }
    }

    void loadPandanAddressData();
    return () => { isMounted = false; };
  }, [form]);

  async function goToNextStep() {
    const isValid = await form.trigger(stepFields[currentStep] as (keyof RegisterFormValues)[]);
    if (isValid) {
      setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
    }
  }

  async function onSubmit(values: RegisterFormValues) {
    setSubmitError(null);

    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const fullName = [values.firstName, values.middleName, values.lastName, values.suffix]
        .filter((part) => part?.trim())
        .join(" ");
      await signUp({
        email: values.email,
        password: values.password,
        fullName,
        firstName: values.firstName,
        middleName: values.middleName,
        lastName: values.lastName,
        suffix: values.suffix,
        redirectTo,
        phoneNumber: values.phoneNumber,
        birthDate: values.birthDate,
        sex: values.sex,
        civilStatus: values.civilStatus,
        municipality: values.municipality,
        barangay: values.barangay,
        addressLine: values.addressLine,
        governmentIdType: values.governmentIdType,
        governmentIdNumber: values.governmentIdNumber,
      });

      toast.success("Registration submitted. Your account is pending admin approval before you can sign in.");
      navigate("/login", { replace: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create your account right now.";
      setSubmitError(message);
      toast.error(message);
    }
  }

  function renderStep() {
    switch (currentStep) {
      case 0:
        return (
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Last name" id="lastName">
              <Input id="lastName" autoComplete="family-name" {...form.register("lastName")} />
              <FieldError message={form.formState.errors.lastName?.message} />
            </Field>
            <Field label="First name" id="firstName">
              <Input id="firstName" autoComplete="given-name" {...form.register("firstName")} />
              <FieldError message={form.formState.errors.firstName?.message} />
            </Field>
            <Field label="Middle name" id="middleName">
              <Input
                id="middleName"
                autoComplete="additional-name"
                {...form.register("middleName")}
              />
            </Field>
            <Field label="Suffix" id="suffix">
              <Select id="suffix" {...form.register("suffix")}>
                <option value="">None</option>
                <option value="Jr.">Jr.</option>
                <option value="Sr.">Sr.</option>
                <option value="II">II</option>
                <option value="III">III</option>
                <option value="IV">IV</option>
              </Select>
            </Field>
            <Field label="Email address" id="email">
              <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
              <FieldError message={form.formState.errors.email?.message} />
            </Field>
            <Field label="Phone number" id="phoneNumber">
              <Input id="phoneNumber" autoComplete="tel" {...form.register("phoneNumber")} />
              <FieldError message={form.formState.errors.phoneNumber?.message} />
            </Field>
            <Field label="Birth date" id="birthDate">
              <Input id="birthDate" type="date" {...form.register("birthDate")} />
              <FieldError message={form.formState.errors.birthDate?.message} />
            </Field>
            <Field label="Sex" id="sex">
              <Select id="sex" {...form.register("sex")}>
                <option value="">Select sex</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </Select>
              <FieldError message={form.formState.errors.sex?.message} />
            </Field>
            <Field label="Civil status" id="civilStatus">
              <Select id="civilStatus" {...form.register("civilStatus")}>
                <option value="">Select civil status</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="widowed">Widowed</option>
                <option value="separated">Separated</option>
              </Select>
              <FieldError message={form.formState.errors.civilStatus?.message} />
            </Field>
            <div className="border-t border-[var(--landing-outline)] pt-5 md:col-span-2">
              <p className="text-sm font-semibold text-foreground">Account credentials</p>
              <p className="mt-1 text-xs text-muted-foreground">
                These credentials will be used after admin approval.
              </p>
            </div>
            <Field label="Password" id="registerPassword">
              <Input
                id="registerPassword"
                type="password"
                autoComplete="new-password"
                {...form.register("password")}
              />
              <FieldError message={form.formState.errors.password?.message} />
            </Field>
            <Field label="Confirm password" id="confirmPassword">
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...form.register("confirmPassword")}
              />
              <FieldError message={form.formState.errors.confirmPassword?.message} />
            </Field>
          </div>
        );

      case 1:
        return (
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Municipality" id="municipality">
              <Select
                id="municipality"
                className="disabled:cursor-default disabled:opacity-100 disabled:text-foreground"
                {...form.register("municipality")}
                disabled
              >
                <option value="Pandan">Pandan</option>
              </Select>
              <FieldError message={form.formState.errors.municipality?.message} />
            </Field>
            <Field label="Barangay" id="barangay">
              <Select
                id="barangay"
                {...form.register("barangay")}
                disabled={isLoadingBarangays || barangays.length === 0}
              >
                <option value="">
                  {isLoadingBarangays ? "Loading barangays..." : "Select barangay"}
                </option>
                {barangays.map((barangay) => (
                  <option key={barangay.code} value={barangay.name}>
                    {barangay.name}
                  </option>
                ))}
              </Select>
              <FieldError message={form.formState.errors.barangay?.message} />
            </Field>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold" htmlFor="addressLine">Street address</label>
              <Textarea
                id="addressLine"
                placeholder="House number, purok, sitio, or landmark"
                {...form.register("addressLine")}
              />
              <FieldError message={form.formState.errors.addressLine?.message} />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Government ID type" id="governmentIdType">
                <Select id="governmentIdType" {...form.register("governmentIdType")}>
                  <option value="">Select ID type</option>
                  <option value="national_id">National ID</option>
                  <option value="voters_id">Voter's ID</option>
                  <option value="drivers_license">Driver's License</option>
                  <option value="philhealth">PhilHealth ID</option>
                  <option value="other">Other government ID</option>
                </Select>
                <FieldError message={form.formState.errors.governmentIdType?.message} />
              </Field>
              <Field label="Government ID number" id="governmentIdNumber">
                <Input id="governmentIdNumber" {...form.register("governmentIdNumber")} />
                <FieldError message={form.formState.errors.governmentIdNumber?.message} />
              </Field>
            </div>

            <DocumentDropzone
              label="Upload ID image or PDF"
              description="Upload at least one readable ID file for residency and identity checking."
              files={governmentIdFiles}
              onChange={(files) =>
                form.setValue("governmentIdFiles", files, { shouldValidate: true })
              }
              maxFiles={3}
            />
            <FieldError message={form.formState.errors.governmentIdFiles?.message} />

            {submitError ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {submitError}
              </div>
            ) : null}

            {!isConfigured ? (
              <div className="rounded-2xl border border-primary/15 bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
                Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to enable registration.
              </div>
            ) : null}
          </div>
        );

      default:
        return null;
    }
  }

  const stepIcons = [User, MapPin, IdCard];

  return (
    <AuthShell
      eyebrow="Resident Registration"
      title="Create a resident account"
      description="Submit your personal, address, and identity information for admin review. Your account will be activated once an administrator approves it."
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
      {/* Step indicators */}
      <div className="mb-6 grid max-w-full grid-cols-3 gap-2 overflow-hidden">
        {steps.map((step, i) => {
          const isDone = i < currentStep;
          const isActive = i === currentStep;
          const Icon = stepIcons[i];
          return (
            <div key={step.key} className="min-w-0 flex flex-col items-center gap-1">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300"
                style={{
                  background: isDone
                    ? "#10b981"
                    : isActive
                    ? "var(--color-primary, #155b91)"
                    : "var(--color-muted, #e5e5e5)",
                  color: isDone || isActive ? "white" : "var(--color-muted-foreground, #888)",
                }}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span
                className="hidden max-w-full text-center text-[10px] font-semibold uppercase tracking-wider sm:block"
                style={{
                  color: isDone ? "#10b981" : isActive ? "var(--color-primary, #155b91)" : "var(--color-muted-foreground, #888)",
                }}
              >
                Step {i + 1}
                <span className="block normal-case tracking-normal">{step.title}</span>
              </span>
            </div>
          );
        })}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <h3 className="text-base font-semibold text-foreground">{steps[currentStep].title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">Fill in this section before moving to the next step.</p>
        </div>

        {renderStep()}

        <div className="flex items-center justify-between gap-3 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={currentStep === 0 || isSubmitting}
            onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              type="button"
              className="rounded-xl"
              onClick={goToNextStep}
            >
              Next Step
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              className="rounded-xl"
              disabled={isSubmitting || !isConfigured}
            >
              {isSubmitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Create account
            </Button>
          )}
        </div>
      </form>
    </AuthShell>
  );
}

function Field({
  label,
  id,
  children,
  className,
}: {
  label: string;
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <label className="text-sm font-semibold" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}
