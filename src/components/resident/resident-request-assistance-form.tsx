import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
  FileText,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { DocumentDropzone } from "@/components/forms/document-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { publicServices } from "@/features/public";
import { useAuth } from "@/hooks/use-auth";
import { createResidentAssistanceRequest } from "@/services/application-service";
import type { AssistanceRequestSubmissionResult } from "@/types/application";

const fileArraySchema = z
  .array(z.custom<File>((file) => file instanceof File, "Invalid file"))
  .min(1, "Upload at least one supporting document.");

const requestSchema = z.object({
  assistanceTypeSlug: z.string().min(1, "Select an assistance type."),
  requestedAmount: z.string(),
  householdSize: z.string(),
  monthlyIncome: z.string(),
  requestReason: z.string().min(20, "Provide enough case details for review."),
  supportingDocuments: fileArraySchema,
  consentAccepted: z.boolean().refine((value) => value, {
    message: "You must agree before submitting.",
  }),
});

type RequestFormValues = z.infer<typeof requestSchema>;

const steps = [
  { key: "request", title: "Assistance Request", icon: ClipboardList },
  { key: "consent", title: "Review & Submit", icon: ShieldCheck },
] as const;

const stepFields: Array<Array<keyof RequestFormValues>> = [
  ["assistanceTypeSlug", "requestedAmount", "householdSize", "monthlyIncome", "requestReason", "supportingDocuments"],
  ["consentAccepted"],
];

const assistanceServices = publicServices.filter((service) =>
  ["medical-assistance", "burial-assistance"].includes(service.slug),
);

interface ResidentRequestAssistanceFormProps {
  onSuccess: (result: AssistanceRequestSubmissionResult) => void;
}

export function ResidentRequestAssistanceForm({ onSuccess }: ResidentRequestAssistanceFormProps) {
  const { user, isConfigured } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      assistanceTypeSlug: "",
      requestedAmount: "",
      householdSize: "",
      monthlyIncome: "",
      requestReason: "",
      supportingDocuments: [],
      consentAccepted: false,
    },
  });

  const supportingDocuments = form.watch("supportingDocuments");
  const selectedService = assistanceServices.find(
    (service) => service.slug === form.watch("assistanceTypeSlug"),
  );
  const isSubmitting = form.formState.isSubmitting;

  async function goToNextStep() {
    const isValid = await form.trigger(stepFields[currentStep]);
    if (isValid) {
      setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
    }
  }

  async function onSubmit(values: RequestFormValues) {
    try {
      const result = await createResidentAssistanceRequest(values);
      toast.success(`Application submitted. Reference: ${result.referenceNumber}`);
      form.reset();
      setCurrentStep(0);
      onSuccess(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit your request.");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-xl border border-[var(--portal-outline)] bg-[var(--portal-surface-soft)] px-4 py-3 text-sm text-[var(--portal-muted)]">
        Your personal profile and resident details on file will be attached automatically.
      </div>

      <div
        className="relative grid items-start"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        <div className="absolute left-0 right-0 top-5 h-0.5 -translate-y-1/2 bg-[var(--portal-outline)]" />
        <div
          className="absolute left-0 top-5 h-0.5 -translate-y-1/2 bg-[var(--portal-accent)] transition-all duration-500"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isDone = index < currentStep;
          const isActive = index === currentStep;
          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300"
                style={{
                  borderColor: isDone
                    ? "#10b981"
                    : isActive
                      ? "var(--portal-accent)"
                      : "var(--portal-outline)",
                  background: isDone ? "#10b981" : isActive ? "var(--portal-accent)" : "white",
                  color: isDone || isActive ? "white" : "var(--portal-muted)",
                }}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span
                className="text-center text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{
                  color: isDone
                    ? "#10b981"
                    : isActive
                      ? "var(--portal-ink)"
                      : "var(--portal-muted)",
                }}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      {currentStep === 0 ? (
        <div className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold" htmlFor="modal-assistanceTypeSlug">
                Assistance type
              </label>
              <Select id="modal-assistanceTypeSlug" {...form.register("assistanceTypeSlug")}>
                <option value="">Select assistance type</option>
                {assistanceServices.map((service) => (
                  <option key={service.slug} value={service.slug}>
                    {service.title}
                  </option>
                ))}
              </Select>
              {form.formState.errors.assistanceTypeSlug ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.assistanceTypeSlug.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="modal-requestedAmount">
                Requested amount <span className="font-normal text-[var(--portal-muted)]">(optional)</span>
              </label>
              <Input
                id="modal-requestedAmount"
                type="number"
                min="0"
                placeholder="0.00"
                {...form.register("requestedAmount")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="modal-householdSize">
                Household size <span className="font-normal text-[var(--portal-muted)]">(optional)</span>
              </label>
              <Input
                id="modal-householdSize"
                type="number"
                min="1"
                placeholder="e.g. 4"
                {...form.register("householdSize")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="modal-monthlyIncome">
                Monthly income <span className="font-normal text-[var(--portal-muted)]">(optional)</span>
              </label>
              <Input
                id="modal-monthlyIncome"
                type="number"
                min="0"
                placeholder="0.00"
                {...form.register("monthlyIncome")}
              />
            </div>
          </div>

          {selectedService ? (
            <div className="rounded-xl border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">{selectedService.title}</p>
              <p className="mt-1">{selectedService.summary}</p>
              <p className="mt-1 text-xs">{selectedService.turnaround}</p>
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="modal-requestReason">
              Describe your case and the assistance needed
            </label>
            <p className="text-xs text-[var(--portal-muted)]">
              Explain the situation, urgency, and what the assistance will be used for.
            </p>
            <Textarea
              id="modal-requestReason"
              rows={4}
              placeholder="Explain your situation and why you are requesting this assistance..."
              {...form.register("requestReason")}
            />
            {form.formState.errors.requestReason ? (
              <p className="text-sm text-destructive">{form.formState.errors.requestReason.message}</p>
            ) : null}
          </div>

          <DocumentDropzone
            label="Upload supporting documents"
            description="Medical records, certificates, quotations, or other files relevant to your request."
            files={supportingDocuments}
            onChange={(files) =>
              form.setValue("supportingDocuments", files, { shouldValidate: true })
            }
          />
          {form.formState.errors.supportingDocuments ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.supportingDocuments.message}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, text: "Valid ID or residency proof" },
              { icon: FileText, text: "Certificates or statements" },
              { icon: BadgeCheck, text: "Clear, readable files" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--portal-accent)] shadow-sm">
                  <Icon className="h-4 w-4" />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {currentStep === 1 ? (
        <div className="space-y-5">
          <div className="rounded-xl border bg-muted/25 p-5 text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--portal-muted)]">
              What you're submitting
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--portal-muted)]">Assistance type</span>
                <span className="font-semibold text-[var(--portal-ink)]">
                  {selectedService?.title ?? "-"}
                </span>
              </div>
              {form.getValues("requestedAmount") ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--portal-muted)]">Requested amount</span>
                  <span className="font-semibold text-[var(--portal-ink)]">
                    PHP {Number(form.getValues("requestedAmount")).toLocaleString()}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--portal-muted)]">Supporting documents</span>
                <span className="font-semibold text-[var(--portal-ink)]">
                  {supportingDocuments.length} file{supportingDocuments.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-white px-4 py-4 text-sm transition-colors hover:bg-muted/20">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-border"
              {...form.register("consentAccepted")}
            />
            <span className="text-[var(--portal-ink)]">
              I confirm that the information is accurate and I agree to OMSWD processing my
              details for assistance review and case handling.
            </span>
          </label>
          {form.formState.errors.consentAccepted ? (
            <p className="text-sm text-destructive">{form.formState.errors.consentAccepted.message}</p>
          ) : null}

          {!isConfigured ? (
            <div className="rounded-xl border border-[var(--portal-outline)] bg-[var(--portal-surface-soft)] px-4 py-3 text-sm text-[var(--portal-muted)]">
              Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to enable
              submission.
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--portal-outline)] pt-5">
        <Button
          type="button"
          variant="outline"
          className="border-[var(--portal-outline)]"
          disabled={currentStep === 0 || isSubmitting}
          onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button
            type="button"
            className="bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]"
            onClick={goToNextStep}
          >
            Review & Submit
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            className="bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]"
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
  );
}
