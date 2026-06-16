import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  LoaderCircle,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { DocumentDropzone } from "@/components/forms/document-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { publicServices } from "@/features/public";
import { useAuth } from "@/hooks/use-auth";
import {
  createResidentAssistanceRequest,
  getAssistanceRequirements,
  getResidentAssistanceTypes,
} from "@/services/application-service";
import type { AssistanceRequirementTemplate } from "@/services/application-service";
import type { AssistanceRequestSubmissionResult } from "@/types/application";

const requestSchema = z.object({
  assistanceTypeSlug: z.string().min(1, "Select an assistance type."),
  relationshipToBeneficiary: z.string(),
  educationalAttainment: z.string(),
  occupation: z.string(),
  familyComposition: z.array(
    z.object({
      name: z.string(),
      educationalAttainment: z.string(),
      age: z.string(),
      relationship: z.string(),
      occupation: z.string(),
      monthlyIncome: z.string(),
    }),
  ),
  householdSize: z.string(),
  monthlyIncome: z.string(),
  requestReason: z.string().min(20, "Provide enough case details for review."),
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
  ["assistanceTypeSlug", "relationshipToBeneficiary", "educationalAttainment", "occupation", "familyComposition", "householdSize", "monthlyIncome", "requestReason"],
  ["consentAccepted"],
];

const fallbackAssistanceServices = publicServices.filter((service) =>
  ["medical-assistance", "burial-assistance"].includes(service.slug),
);

const emptyFamilyMember = {
  name: "",
  educationalAttainment: "",
  age: "",
  relationship: "",
  occupation: "",
  monthlyIncome: "",
};

const defaultRequestValues: RequestFormValues = {
  assistanceTypeSlug: "",
  relationshipToBeneficiary: "",
  educationalAttainment: "",
  occupation: "",
  familyComposition: [{ ...emptyFamilyMember }],
  householdSize: "",
  monthlyIncome: "",
  requestReason: "",
  consentAccepted: false,
};

interface ResidentRequestAssistanceFormProps {
  onSuccess: (result: AssistanceRequestSubmissionResult) => void;
}

export function ResidentRequestAssistanceForm({ onSuccess }: ResidentRequestAssistanceFormProps) {
  const { user, isConfigured } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [requirements, setRequirements] = useState<AssistanceRequirementTemplate[]>([]);
  // Map of requirementTemplateId -> File[]
  const [requirementFiles, setRequirementFiles] = useState<Record<string, File[]>>({});
  // General documents not tied to any requirement
  const [generalFiles, setGeneralFiles] = useState<File[]>([]);
  const [docsError, setDocsError] = useState<string | null>(null);
  const assistanceServicesQuery = useQuery({
    queryKey: ["resident", "assistance-types"],
    queryFn: getResidentAssistanceTypes,
    enabled: isConfigured,
    staleTime: 60_000,
  });

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: defaultRequestValues,
  });

  const familyComposition = useFieldArray({
    control: form.control,
    name: "familyComposition",
  });

  const selectedSlug = form.watch("assistanceTypeSlug");
  const assistanceServices =
    assistanceServicesQuery.data && assistanceServicesQuery.data.length > 0
      ? assistanceServicesQuery.data
      : fallbackAssistanceServices;
  const selectedService = assistanceServices.find((service) => service.slug === selectedSlug);
  const isSubmitting = form.formState.isSubmitting;

  // Fetch requirements whenever the assistance type changes
  useEffect(() => {
    if (!selectedSlug) {
      setRequirements([]);
      setRequirementFiles({});
      return;
    }
    void getAssistanceRequirements(selectedSlug).then((reqs) => {
      setRequirements(reqs);
      setRequirementFiles((prev) => {
        const next: Record<string, File[]> = {};
        for (const req of reqs) {
          next[req.id] = prev[req.id] ?? [];
        }
        return next;
      });
    });
  }, [selectedSlug]);

  const totalDocCount =
    Object.values(requirementFiles).reduce((sum, files) => sum + files.length, 0) +
    generalFiles.length;

  function validateDocs(): boolean {
    if (totalDocCount === 0) {
      setDocsError("Upload at least one supporting document.");
      return false;
    }
    setDocsError(null);
    return true;
  }

  async function goToNextStep() {
    const isValid = await form.trigger(stepFields[currentStep]);
    if (!isValid) return;
    if (currentStep === 0 && !validateDocs()) return;
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  }

  async function onSubmit(values: RequestFormValues) {
    if (!validateDocs()) return;
    try {
      const result = await createResidentAssistanceRequest({
        assistanceTypeSlug: values.assistanceTypeSlug,
        requestedAmount: "",
        householdSize: values.householdSize,
        monthlyIncome: values.monthlyIncome,
        requestReason: values.requestReason,
        requirementFiles: Object.entries(requirementFiles).map(([requirementTemplateId, files]) => ({
          requirementTemplateId,
          files,
        })),
        supportingDocuments: generalFiles,
        consentAccepted: values.consentAccepted,
        relationshipToBeneficiary: values.relationshipToBeneficiary,
        educationalAttainment: values.educationalAttainment,
        occupation: values.occupation,
        familyComposition: values.familyComposition.filter((member) =>
          Object.values(member).some((value) => value.trim()),
        ),
      });
      toast.success(`Application submitted. Reference: ${result.referenceNumber}`);
      form.reset(defaultRequestValues);
      setRequirementFiles({});
      setGeneralFiles([]);
      setRequirements([]);
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
              <label className="text-sm font-semibold" htmlFor="modal-relationshipToBeneficiary">
                Relationship to beneficiary <span className="font-normal text-[var(--portal-muted)]">(optional)</span>
              </label>
              <Select id="modal-relationshipToBeneficiary" {...form.register("relationshipToBeneficiary")}>
                <option value="">Select relationship</option>
                <option value="Self">Self</option>
                <option value="Spouse">Spouse</option>
                <option value="Parent">Parent</option>
                <option value="Child">Child</option>
                <option value="Sibling">Sibling</option>
                <option value="Grandparent">Grandparent</option>
                <option value="Grandchild">Grandchild</option>
                <option value="Aunt / Uncle">Aunt / Uncle</option>
                <option value="Nephew / Niece">Nephew / Niece</option>
                <option value="In-law">In-law</option>
                <option value="Guardian">Guardian</option>
                <option value="Other relative">Other relative</option>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="modal-educationalAttainment">
                Educational attainment <span className="font-normal text-[var(--portal-muted)]">(optional)</span>
              </label>
              <Select id="modal-educationalAttainment" {...form.register("educationalAttainment")}>
                <option value="">Select educational attainment</option>
                <option value="No formal education">No formal education</option>
                <option value="Elementary Level">Elementary Level</option>
                <option value="Elementary Graduate">Elementary Graduate</option>
                <option value="High School Level">High School Level</option>
                <option value="High School Graduate">High School Graduate</option>
                <option value="Senior High School Level">Senior High School Level</option>
                <option value="Senior High School Graduate">Senior High School Graduate</option>
                <option value="Vocational / Tech-Voc">Vocational / Tech-Voc</option>
                <option value="College Level">College Level</option>
                <option value="College Graduate">College Graduate</option>
                <option value="Post Graduate">Post Graduate</option>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="modal-occupation">
                Occupation <span className="font-normal text-[var(--portal-muted)]">(optional)</span>
              </label>
              <Input
                id="modal-occupation"
                type="text"
                placeholder="e.g. Farmer, Housewife, Driver"
                {...form.register("occupation")}
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

          <div className="space-y-3 rounded-xl border border-[var(--portal-outline)] bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--portal-ink)]">Family composition</p>
                <p className="text-xs text-[var(--portal-muted)]">
                  Add household members to appear in the intake sheet.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={familyComposition.fields.length >= 7}
                onClick={() => familyComposition.append({ ...emptyFamilyMember })}
              >
                <Plus className="h-4 w-4" />
                Add member
              </Button>
            </div>

            <div className="space-y-3">
              {familyComposition.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-3 rounded-lg border border-[var(--portal-outline)] bg-[var(--portal-surface-soft)] p-3 md:grid-cols-12"
                >
                  <div className="space-y-1 md:col-span-4">
                    <label className="text-xs font-semibold" htmlFor={`family-${index}-name`}>
                      Name
                    </label>
                    <Input
                      id={`family-${index}-name`}
                      placeholder="Full name"
                      {...form.register(`familyComposition.${index}.name`)}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-4">
                    <label className="text-xs font-semibold" htmlFor={`family-${index}-education`}>
                      Educational attainment
                    </label>
                    <Select
                      id={`family-${index}-education`}
                      {...form.register(`familyComposition.${index}.educationalAttainment`)}
                    >
                      <option value="">Select</option>
                      <option value="No formal education">No formal education</option>
                      <option value="Elementary Level">Elementary Level</option>
                      <option value="Elementary Graduate">Elementary Graduate</option>
                      <option value="High School Level">High School Level</option>
                      <option value="High School Graduate">High School Graduate</option>
                      <option value="Senior High School Level">Senior High School Level</option>
                      <option value="Senior High School Graduate">Senior High School Graduate</option>
                      <option value="Vocational / Tech-Voc">Vocational / Tech-Voc</option>
                      <option value="College Level">College Level</option>
                      <option value="College Graduate">College Graduate</option>
                      <option value="Post Graduate">Post Graduate</option>
                    </Select>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold" htmlFor={`family-${index}-age`}>
                      Age
                    </label>
                    <Input
                      id={`family-${index}-age`}
                      type="number"
                      min="0"
                      placeholder="Age"
                      {...form.register(`familyComposition.${index}.age`)}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold" htmlFor={`family-${index}-relationship`}>
                      Relationship
                    </label>
                    <Select
                      id={`family-${index}-relationship`}
                      {...form.register(`familyComposition.${index}.relationship`)}
                    >
                      <option value="">Select</option>
                      <option value="Self">Self</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Parent">Parent</option>
                      <option value="Child">Child</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Grandparent">Grandparent</option>
                      <option value="Grandchild">Grandchild</option>
                      <option value="Aunt / Uncle">Aunt / Uncle</option>
                      <option value="Nephew / Niece">Nephew / Niece</option>
                      <option value="In-law">In-law</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Other relative">Other relative</option>
                    </Select>
                  </div>
                  <div className="space-y-1 md:col-span-5">
                    <label className="text-xs font-semibold" htmlFor={`family-${index}-occupation`}>
                      Occupation
                    </label>
                    <Input
                      id={`family-${index}-occupation`}
                      placeholder="e.g. Student"
                      {...form.register(`familyComposition.${index}.occupation`)}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-5">
                    <label className="text-xs font-semibold" htmlFor={`family-${index}-income`}>
                      Est. monthly salary
                    </label>
                    <Input
                      id={`family-${index}-income`}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      {...form.register(`familyComposition.${index}.monthlyIncome`)}
                    />
                  </div>
                  <div className="flex items-end md:col-span-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={familyComposition.fields.length === 1}
                      onClick={() => familyComposition.remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
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

          {/* Per-requirement document uploads */}
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold">Supporting documents</p>
              <p className="text-xs text-[var(--portal-muted)]">
                Upload the required files for each document below. PDF, JPG, and PNG are accepted.
              </p>
            </div>

            {requirements.length > 0 ? (
              <div className="space-y-4">
                {requirements.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-xl border border-[var(--portal-outline)] bg-white p-4 space-y-3"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--portal-ink)]">
                          {req.name}
                          {req.isRequired && (
                            <span className="ml-1.5 text-xs font-normal text-red-500">Required</span>
                          )}
                        </p>
                        {req.description ? (
                          <p className="mt-0.5 text-xs text-[var(--portal-muted)]">{req.description}</p>
                        ) : null}
                      </div>
                      {(requirementFiles[req.id]?.length ?? 0) > 0 && (
                        <span className="shrink-0 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          {requirementFiles[req.id].length} file{requirementFiles[req.id].length === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                    <DocumentDropzone
                      label=""
                      description=""
                      files={requirementFiles[req.id] ?? []}
                      onChange={(files) => {
                        setRequirementFiles((prev) => ({ ...prev, [req.id]: files }));
                        setDocsError(null);
                      }}
                    />
                  </div>
                ))}

                {/* General / other documents */}
                <div className="rounded-xl border border-dashed border-[var(--portal-outline)] bg-[var(--portal-surface-soft)] p-4 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--portal-ink)]">Other documents</p>
                    <p className="mt-0.5 text-xs text-[var(--portal-muted)]">
                      Any additional files that support your request.
                    </p>
                  </div>
                  <DocumentDropzone
                    label=""
                    description=""
                    files={generalFiles}
                    onChange={(files) => {
                      setGeneralFiles(files);
                      setDocsError(null);
                    }}
                  />
                </div>
              </div>
            ) : (
              /* No requirements configured — show the original single dropzone */
              <DocumentDropzone
                label="Upload supporting documents"
                description="Medical records, certificates, quotations, or other files relevant to your request."
                files={generalFiles}
                onChange={(files) => {
                  setGeneralFiles(files);
                  setDocsError(null);
                }}
              />
            )}

            {docsError ? (
              <p className="text-sm text-destructive">{docsError}</p>
            ) : null}
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
              {requirements.length > 0 ? (
                requirements.map((req) => (
                  <div key={req.id} className="flex items-center justify-between gap-3">
                    <span className="text-[var(--portal-muted)] truncate max-w-[60%]">{req.name}</span>
                    <span className="font-semibold text-[var(--portal-ink)]">
                      {(requirementFiles[req.id]?.length ?? 0)} file{(requirementFiles[req.id]?.length ?? 0) === 1 ? "" : "s"}
                    </span>
                  </div>
                ))
              ) : null}
              {(generalFiles.length > 0 || requirements.length === 0) && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--portal-muted)]">
                    {requirements.length > 0 ? "Other documents" : "Supporting documents"}
                  </span>
                  <span className="font-semibold text-[var(--portal-ink)]">
                    {generalFiles.length} file{generalFiles.length === 1 ? "" : "s"}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3 border-t pt-2">
                <span className="text-[var(--portal-muted)]">Total files</span>
                <span className="font-semibold text-[var(--portal-ink)]">
                  {totalDocCount} file{totalDocCount === 1 ? "" : "s"}
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
