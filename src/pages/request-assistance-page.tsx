import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
  FileText,
  IdCard,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  User,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { DocumentDropzone } from "@/components/forms/document-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { processTimeline, publicServices } from "@/features/public";
import { useAuth } from "@/hooks/use-auth";
import { createAssistanceRequest } from "@/services/application-service";
import {
  getPandanAddressData,
  type PandanBarangay,
} from "@/services/pandan-address-api";
import type {
  AssistanceRequestFormValues,
  AssistanceRequestSubmissionResult,
} from "@/types/application";

const fileArraySchema = z
  .array(z.custom<File>((file) => file instanceof File, "Invalid file"))
  .min(1, "Upload at least one file.");

const requestSchema = z.object({
  fullName: z.string().min(3, "Enter your full name."),
  email: z.email("Enter a valid email address."),
  phoneNumber: z.string().min(7, "Enter a valid contact number."),
  birthDate: z.string().min(1, "Enter your birth date."),
  sex: z.string().min(1, "Select a sex value."),
  civilStatus: z.string().min(1, "Select a civil status."),
  addressLine: z.string().min(5, "Enter a complete address."),
  barangay: z.string().min(1, "Select your barangay."),
  municipality: z.string().min(2, "Select your municipality."),
  governmentIdType: z.string().min(1, "Select an ID type."),
  governmentIdNumber: z.string().min(3, "Enter the ID number."),
  governmentIdFiles: fileArraySchema,
  assistanceTypeSlug: z.string().min(1, "Select an assistance type."),
  requestedAmount: z.string(),
  householdSize: z.string(),
  monthlyIncome: z.string(),
  requestReason: z.string().min(20, "Provide enough case details for review."),
  supportingDocuments: fileArraySchema,
  consentAccepted: z.boolean().refine((value) => value, {
    message: "You must agree before submitting the request.",
  }),
});

const steps = [
  { key: "personal", title: "Personal Information" },
  { key: "address", title: "Address Information" },
  { key: "identity", title: "Identity Information" },
  { key: "request", title: "Assistance Request" },
  { key: "consent", title: "Consent" },
] as const;

const stepFields: Array<Array<keyof AssistanceRequestFormValues>> = [
  ["fullName", "email", "phoneNumber", "birthDate", "sex", "civilStatus"],
  ["municipality", "barangay", "addressLine"],
  ["governmentIdType", "governmentIdNumber", "governmentIdFiles"],
  [
    "assistanceTypeSlug",
    "requestedAmount",
    "householdSize",
    "monthlyIncome",
    "requestReason",
    "supportingDocuments",
  ],
  ["consentAccepted"],
];

type RequestFormValues = z.infer<typeof requestSchema>;

const requestAssistanceServices = publicServices.filter((service) =>
  ["medical-assistance", "burial-assistance"].includes(service.slug),
);

export function RequestAssistancePage() {
  const { user, isConfigured } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [barangays, setBarangays] = useState<PandanBarangay[]>([]);
  const [isLoadingBarangays, setIsLoadingBarangays] = useState(true);
  const [submissionResult, setSubmissionResult] =
    useState<AssistanceRequestSubmissionResult | null>(null);

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      birthDate: "",
      sex: "",
      civilStatus: "",
      addressLine: "",
      barangay: "",
      municipality: "Pandan",
      governmentIdType: "",
      governmentIdNumber: "",
      governmentIdFiles: [],
      assistanceTypeSlug: "",
      requestedAmount: "",
      householdSize: "",
      monthlyIncome: "",
      requestReason: "",
      supportingDocuments: [],
      consentAccepted: false,
    },
  });

  const governmentIdFiles = form.watch("governmentIdFiles");
  const supportingDocuments = form.watch("supportingDocuments");
  const selectedService = requestAssistanceServices.find(
    (service) => service.slug === form.watch("assistanceTypeSlug"),
  );
  const isSubmitting = form.formState.isSubmitting;

  useEffect(() => {
    let isMounted = true;

    async function loadPandanAddressData() {
      try {
        const data = await getPandanAddressData();

        if (!isMounted) {
          return;
        }

        setBarangays(data.barangays);
        form.setValue("municipality", data.municipality, { shouldValidate: true });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Unable to load Pandan barangays.";
        toast.error(message);
      } finally {
        if (isMounted) {
          setIsLoadingBarangays(false);
        }
      }
    }

    void loadPandanAddressData();

    return () => {
      isMounted = false;
    };
  }, [form]);

  async function goToNextStep() {
    const isValid = await form.trigger(stepFields[currentStep]);
    if (isValid) {
      setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
    }
  }

  async function onSubmit(values: RequestFormValues) {
    try {
      const result = await createAssistanceRequest(values);
      setSubmissionResult(result);
      toast.success(`Application submitted. Reference: ${result.referenceNumber}`);
      form.reset();
      setCurrentStep(0);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to submit your request.";
      toast.error(message);
    }
  }

  function renderStep() {
    switch (currentStep) {
      case 0:
        return (
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold" htmlFor="fullName">
                Full name
              </label>
              <Input id="fullName" autoComplete="name" {...form.register("fullName")} />
              <FieldError message={form.formState.errors.fullName?.message} />
            </div>
            <Field label="Email address" id="email">
              <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
            </Field>
            <Field label="Phone number" id="phoneNumber">
              <Input id="phoneNumber" autoComplete="tel" {...form.register("phoneNumber")} />
            </Field>
            <Field label="Birth date" id="birthDate">
              <Input id="birthDate" type="date" {...form.register("birthDate")} />
            </Field>
            <Field label="Sex" id="sex">
              <Select id="sex" {...form.register("sex")}>
                <option value="">Select sex</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </Select>
            </Field>
            <Field label="Civil status" id="civilStatus">
              <Select id="civilStatus" {...form.register("civilStatus")}>
                <option value="">Select civil status</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="widowed">Widowed</option>
                <option value="separated">Separated</option>
              </Select>
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
              <label className="text-sm font-semibold" htmlFor="addressLine">
                Street address
              </label>
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
              </Field>
              <Field label="Government ID number" id="governmentIdNumber">
                <Input id="governmentIdNumber" {...form.register("governmentIdNumber")} />
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
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Assistance type" id="assistanceTypeSlug">
                <Select id="assistanceTypeSlug" {...form.register("assistanceTypeSlug")}>
                  <option value="">Select assistance type</option>
                  {requestAssistanceServices.map((service) => (
                    <option key={service.slug} value={service.slug}>
                      {service.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Requested amount (optional)" id="requestedAmount">
                <Input id="requestedAmount" type="number" min="0" {...form.register("requestedAmount")} />
              </Field>
              <Field label="Household size (optional)" id="householdSize">
                <Input id="householdSize" type="number" min="1" {...form.register("householdSize")} />
              </Field>
              <Field label="Monthly income (optional)" id="monthlyIncome">
                <Input id="monthlyIncome" type="number" min="0" {...form.register("monthlyIncome")} />
              </Field>
            </div>

            {selectedService ? (
              <div className="rounded-3xl border bg-secondary/35 p-5 text-sm leading-6 text-muted-foreground">
                <p className="font-semibold text-foreground">{selectedService.title}</p>
                <p className="mt-2">{selectedService.summary}</p>
                <p className="mt-2">{selectedService.turnaround}</p>
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="requestReason">
                Describe the case and the assistance needed
              </label>
              <Textarea id="requestReason" {...form.register("requestReason")} />
              <FieldError message={form.formState.errors.requestReason?.message} />
            </div>

            <DocumentDropzone
              label="Upload supporting documents"
              description="Upload medical records, certifications, quotations, or other supporting files relevant to the request."
              files={supportingDocuments}
              onChange={(files) =>
                form.setValue("supportingDocuments", files, { shouldValidate: true })
              }
            />
            <FieldError message={form.formState.errors.supportingDocuments?.message} />
            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex items-center gap-3 rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span>Valid identification or residency file</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                  <FileText className="h-5 w-5" />
                </div>
                <span>Relevant supporting certificates or statements</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <span>Readable files ready for review</span>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <div className="rounded-3xl border bg-secondary/30 p-6 text-sm leading-7 text-muted-foreground">
              <p>
                I confirm that the information I am submitting is accurate to the best of
                my knowledge and that OMSWD may contact me for verification, document
                follow-up, and status updates.
              </p>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border bg-white/90 px-4 py-4 text-sm">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-border"
                {...form.register("consentAccepted")}
              />
              <span>
                I agree to the processing of my information and documents for assistance
                application review and related OMSWD case handling.
              </span>
            </label>
            <FieldError message={form.formState.errors.consentAccepted?.message} />

            {!user ? (
              <div className="rounded-2xl border border-primary/15 bg-secondary/60 px-4 py-4 text-sm text-muted-foreground">
                Sign in with a resident account before final submission so your request,
                uploaded files, and status history can be tied to the resident portal.
                <div className="mt-3 flex gap-3">
                  <Button size="sm" asChild>
                    <Link to="/login">Sign in</Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/register">Create account</Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        );
    }
  }

  return (
    <div className="landing-page text-[var(--landing-ink)]">

      {/* Page hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-[rgba(21,91,145,0.1)] blur-3xl" />
          <div className="absolute right-0 top-8 h-60 w-60 rounded-full bg-[rgba(242,193,79,0.18)] blur-3xl" />
        </div>
        <div className="container relative grid gap-8 py-[var(--landing-space-section)] lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <span className="inline-block rounded-full border border-[var(--landing-outline)] bg-[var(--landing-surface)] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[var(--landing-muted)]">
              Request Assistance
            </span>
            <h1 className="public-hero-title mt-5">
              Submit Your Assistance Request Online
            </h1>
            <p className="public-hero-lead mt-4 max-w-xl">
              This intake form collects your personal details, request context, and supporting
              files before sending your case into OMSWD verification.
            </p>
          </div>

          <div className="landing-card overflow-hidden">
            <div className="h-1.5 bg-[linear-gradient(90deg,var(--landing-accent),var(--landing-highlight))]" />
            <div className="p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--landing-muted)] mb-4">Resident Journey</p>
              <div className="space-y-2">
                {processTimeline.map((item, index) => (
                  <div key={item} className="landing-soft-card flex gap-3 px-4 py-3 text-sm">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--landing-accent)] text-xs font-bold text-white">
                      {index + 1}
                    </div>
                    <p className="text-[var(--landing-muted)] leading-6">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container pb-[var(--landing-space-section)]">

        {/* Success card */}
        {submissionResult ? (
          <div className="landing-card mb-8 overflow-hidden">
            <div className="h-1.5 bg-emerald-500" />
            <div className="flex flex-col gap-4 p-7 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-emerald-600">Submission Complete</p>
                  <h2 className="mt-1 font-serif text-2xl font-bold text-[var(--landing-ink)]">
                    Reference {submissionResult.referenceNumber}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--landing-muted)]">
                    Your request is pending verification. Use the resident portal to track updates and follow-ups.
                  </p>
                </div>
              </div>
              <Button className="shrink-0 rounded-xl bg-[var(--landing-accent)] text-white hover:bg-[var(--landing-accent-strong)]" asChild>
                <Link to="/resident">Open Resident Portal</Link>
              </Button>
            </div>
          </div>
        ) : null}

        {/* Form layout */}
        <div className="space-y-6">

          {/* Horizontal step timeline */}
          <div className="landing-card overflow-hidden">
            <div className="h-1.5 bg-[linear-gradient(90deg,var(--landing-accent),var(--landing-highlight))]" />
            <div className="px-6 py-6 md:px-10">
              {/* Icons row */}
              <div className="relative grid items-center" style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}>
                {/* Connecting line */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-[var(--landing-outline)]" />
                {/* Progress fill */}
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-[var(--landing-accent)] to-[var(--landing-highlight)] transition-all duration-500"
                  style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                />

                {[User, MapPin, IdCard, ClipboardList, ShieldCheck].map((Icon, i) => {
                  const isDone = i < currentStep;
                  const isActive = i === currentStep;
                  return (
                    <div key={i} className="relative z-10 flex flex-col items-center justify-center gap-2">
                      {/* Outer ring */}
                      <div
                        className="flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300"
                        style={{
                          background: isDone
                            ? "rgba(16,185,129,0.12)"
                            : isActive
                            ? "rgba(21,91,145,0.15)"
                            : "rgba(217,205,182,0.35)",
                          boxShadow: isActive
                            ? "0 0 0 3px rgba(21,91,145,0.2)"
                            : "none",
                        }}
                      >
                        {/* Inner circle */}
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300"
                          style={{
                            background: isDone
                              ? "#10b981"
                              : isActive
                              ? "var(--landing-accent)"
                              : "rgba(217,205,182,0.6)",
                            color: isDone || isActive ? "white" : "var(--landing-muted)",
                          }}
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </div>
                      </div>
                      {/* Step label */}
                      <span
                        className="hidden text-xs font-bold uppercase tracking-[0.14em] sm:block text-center max-w-[80px]"
                        style={{
                          color: isDone
                            ? "#10b981"
                            : isActive
                            ? "var(--landing-accent)"
                            : "var(--landing-muted)",
                        }}
                      >
                        Step {i + 1}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Step title row — must match the icons row grid exactly */}
              <div className="mt-1 hidden sm:grid" style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}>
                {steps.map((step, i) => (
                  <div key={step.key} className="flex flex-col items-center text-center px-1">
                    <p
                      className="text-xs font-semibold leading-snug"
                      style={{
                        color: i === currentStep ? "var(--landing-ink)" : "var(--landing-muted)",
                      }}
                    >
                      {step.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main form card */}
          <div className="landing-card overflow-hidden">
            <div className="h-1.5 bg-[linear-gradient(90deg,var(--landing-accent),var(--landing-highlight))]" />
            <div className="p-6 md:p-8">
              <div className="mb-6">
                <h2 className="font-serif text-2xl font-bold text-[var(--landing-ink)]">{steps[currentStep].title}</h2>
                <p className="mt-1 text-sm text-[var(--landing-muted)]">
                  Fill in this section before moving to the next part of the request.
                </p>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {renderStep()}

                {!isConfigured ? (
                  <div className="rounded-2xl border border-[var(--landing-outline)] bg-[var(--landing-surface)] px-4 py-4 text-sm text-[var(--landing-muted)]">
                    Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> before request submission can be enabled.
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--landing-outline)] pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border-[var(--landing-outline)]"
                    disabled={currentStep === 0 || isSubmitting}
                    onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  {currentStep < steps.length - 1 ? (
                    <Button
                      type="button"
                      className="rounded-xl bg-[var(--landing-accent)] text-white hover:bg-[var(--landing-accent-strong)]"
                      onClick={goToNextStep}
                    >
                      Next Step
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="rounded-xl bg-[var(--landing-accent)] text-white hover:bg-[var(--landing-accent-strong)]"
                      disabled={isSubmitting || !isConfigured || !user}
                    >
                      {isSubmitting ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Submit Request
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}
