import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  FileText,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { DocumentDropzone } from "@/components/forms/document-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  urgency: z.string().min(1, "Select an urgency level."),
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
    "urgency",
    "requestedAmount",
    "householdSize",
    "monthlyIncome",
    "requestReason",
    "supportingDocuments",
  ],
  ["consentAccepted"],
];

type RequestFormValues = z.infer<typeof requestSchema>;

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
      urgency: "",
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
  const selectedService = publicServices.find(
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
                  {publicServices.map((service) => (
                    <option key={service.slug} value={service.slug}>
                      {service.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Urgency level" id="urgency">
                <Select id="urgency" {...form.register("urgency")}>
                  <option value="">Select urgency</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
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
    <div className="container space-y-10 py-14">
      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Request Assistance
          </p>
          <h1 className="font-serif text-4xl font-bold md:text-5xl">
            Submit a structured assistance request online.
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            This intake form collects personal details, request context, and supporting
            files before sending the case into OMSWD verification.
          </p>
        </div>

        <Card className="bg-[linear-gradient(165deg,rgba(255,255,255,0.96),rgba(235,245,255,0.88))]">
          <CardHeader>
            <CardTitle>Resident journey</CardTitle>
            <CardDescription>
              These are the main steps the portal is organized around.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            {processTimeline.map((item, index) => (
              <div key={item} className="flex gap-4 rounded-2xl bg-white/80 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {index + 1}
                </div>
                <p>{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {submissionResult ? (
        <Card className="border-accent/25 bg-[linear-gradient(165deg,rgba(255,255,255,0.98),rgba(232,250,239,0.94))]">
          <CardContent className="flex flex-col gap-4 p-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                  Submission complete
                </p>
                <h2 className="mt-2 font-serif text-3xl font-bold">
                  Reference {submissionResult.referenceNumber}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Your request is now marked as pending verification. Use the resident
                  portal to follow status updates and document follow-ups.
                </p>
              </div>
            </div>
            <Button asChild>
              <Link to="/resident">Open resident portal</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Form steps</CardTitle>
            <CardDescription>Complete each section before submitting.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.key}
                className={[
                  "rounded-2xl border px-4 py-3 text-sm transition-colors",
                  index === currentStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : index < currentStep
                      ? "border-accent/30 bg-accent/10"
                      : "bg-white/85",
                ].join(" ")}
              >
                <p className="font-semibold">{step.title}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep].title}</CardTitle>
            <CardDescription>
              Fill in this section before moving to the next part of the request.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {renderStep()}

              {!isConfigured ? (
                <div className="rounded-2xl border border-primary/15 bg-secondary/60 px-4 py-4 text-sm text-muted-foreground">
                  Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` before request
                  submission can be enabled.
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={currentStep === 0 || isSubmitting}
                  onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>

                {currentStep < steps.length - 1 ? (
                  <Button type="button" onClick={goToNextStep}>
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting || !isConfigured || !user}>
                    {isSubmitting ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Submit request
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
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
