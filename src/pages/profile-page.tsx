import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, LoaderCircle, Mail, MapPinHouse, Pencil, Save, ShieldCheck } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ResidentPageHeader } from "@/components/resident/resident-page-header";
import { ResidentStateCard } from "@/components/resident/resident-state-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { queryKeys } from "@/lib/query-keys";
import {
  getPandanAddressData,
  type PandanBarangay,
} from "@/services/pandan-address-api";
import {
  getResidentProfileSettings,
  updateResidentProfileSettings,
} from "@/services/profile-service";
import type { ResidentProfileSettings } from "@/types/profile";

const profileSettingsSchema = z.object({
  email: z.email("Enter a valid email address."),
  fullName: z.string().min(3, "Enter your full name."),
  phoneNumber: z.string().min(7, "Enter a valid contact number."),
  birthDate: z.string(),
  sex: z.string(),
  civilStatus: z.string(),
  municipality: z.string().min(2, "Municipality is required."),
  barangay: z.string().min(1, "Select your barangay."),
  addressLine: z.string().min(5, "Enter a complete address."),
  householdSize: z.string().refine(
    (value) => !value.trim() || (Number.isInteger(Number(value)) && Number(value) > 0),
    "Household size must be a whole number.",
  ),
  monthlyIncome: z.string().refine(
    (value) => !value.trim() || (Number.isFinite(Number(value)) && Number(value) >= 0),
    "Monthly income must be zero or greater.",
  ),
});

type ProfileFormValues = z.infer<typeof profileSettingsSchema>;

const defaultValues: ProfileFormValues = {
  email: "",
  fullName: "",
  phoneNumber: "",
  birthDate: "",
  sex: "",
  civilStatus: "",
  municipality: "Pandan",
  barangay: "",
  addressLine: "",
  householdSize: "",
  monthlyIncome: "",
};

export function ProfilePage() {
  const { user, isConfigured } = useAuth();
  const queryClient = useQueryClient();
  const [barangays, setBarangays] = useState<PandanBarangay[]>([]);
  const [isLoadingBarangays, setIsLoadingBarangays] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues,
  });

  const profileQuery = useQuery({
    queryKey: user?.id ? queryKeys.resident.profile(user.id) : ["resident", "profile", "guest"],
    queryFn: () => getResidentProfileSettings(user),
    enabled: isConfigured && !!user,
    staleTime: 60_000,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadBarangays() {
      try {
        const data = await getPandanAddressData();

        if (!isMounted) {
          return;
        }

        setBarangays(data.barangays);

        if (!form.getValues("municipality")) {
          form.setValue("municipality", data.municipality, { shouldValidate: true });
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        toast.error(
          error instanceof Error ? error.message : "Unable to load Pandan barangays.",
        );
      } finally {
        if (isMounted) {
          setIsLoadingBarangays(false);
        }
      }
    }

    void loadBarangays();

    return () => {
      isMounted = false;
    };
  }, [form]);

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }

    form.reset(toFormValues(profileQuery.data));
  }, [form, profileQuery.data]);

  async function onSubmit(values: ProfileFormValues) {
    if (!user) {
      toast.error("Sign in with a resident account to update your profile.");
      return;
    }

    try {
      await updateResidentProfileSettings(user.id, values);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.resident.profile(user.id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.auth.profile(user.id),
        }),
      ]);

      const refreshed = await profileQuery.refetch();
      form.reset(refreshed.data ? toFormValues(refreshed.data) : values);
      toast.success("Resident profile updated.");
      setEditOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save profile changes.");
    }
  }

  const currentBarangay = form.watch("barangay");
  const barangayOptions =
    currentBarangay && !barangays.some((barangay) => barangay.name === currentBarangay)
      ? [{ code: currentBarangay, name: currentBarangay }, ...barangays]
      : barangays;

  if (!isConfigured) {
    return (
      <ResidentStateCard message="Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before resident profile settings can be loaded." />
    );
  }

  if (!user) {
    return <ResidentStateCard message="Sign in with a resident account to manage profile settings." />;
  }

  if (profileQuery.isLoading) {
    return <ResidentStateCard message="Loading your resident profile..." />;
  }

  if (profileQuery.error instanceof Error) {
    return <ResidentStateCard message={profileQuery.error.message} />;
  }

  const profile = profileQuery.data;

  if (!profile) {
    return <ResidentStateCard message="Resident profile data is not available yet." />;
  }

  const isSaving = form.formState.isSubmitting;

  return (
    <div className="space-y-6">
      <ResidentPageHeader
        eyebrow="Profile"
        title="Resident profile settings"
        description="Keep your resident account details current so OMSWD can match your contact and residency data during review."
        chips={["Contact Accuracy", "Residency Validation"]}
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <ProfileMetricCard
          icon={ShieldCheck}
          label="Resident code"
          value={profile.residentCode ?? "Pending"}
          detail={profile.role === "resident" ? "Resident access enabled" : "Access role pending"}
        />
        <ProfileMetricCard
          icon={BadgeCheck}
          label="Verification"
          value={profile.isVerified ? "Verified" : "Awaiting verification"}
          detail={
            profile.verifiedAt
              ? `Updated ${formatLongDate(profile.verifiedAt)}`
              : "OMSWD has not marked this record as verified yet."
          }
        />
        <ProfileMetricCard
          icon={Mail}
          label="Login email"
          value={profile.email || "No email on file"}
          detail="Email sign-in changes are not self-service on this page."
        />
        <ProfileMetricCard
          icon={MapPinHouse}
          label="Residency"
          value={profile.barangay || "Barangay not set"}
          detail={profile.municipality || "Municipality not set"}
        />
      </div>

      {/* Profile summary card with Edit button */}
      <div className="portal-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-muted)]">
              Resident details
            </p>
            <p className="mt-1 text-lg font-bold text-[var(--portal-ink)]">
              {profile.fullName || "Name not set"}
            </p>
            <p className="mt-0.5 text-sm text-[var(--portal-muted)]">
              {[profile.barangay, profile.municipality].filter(Boolean).join(", ") || "Address not set"}
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setEditOpen(true)}
            className="bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]"
          >
            <Pencil className="h-4 w-4" />
            Edit profile
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Phone number", value: profile.phoneNumber || "Not set" },
            { label: "Birth date", value: profile.birthDate ? formatLongDate(profile.birthDate) : "Not set" },
            { label: "Sex", value: profile.sex ? profile.sex.replace(/_/g, " ") : "Not set" },
            { label: "Civil status", value: profile.civilStatus || "Not set" },
            { label: "Street address", value: profile.addressLine || "Not set" },
            { label: "Household size", value: profile.householdSize || "Not set" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-[var(--portal-outline)] bg-[var(--portal-surface-soft)] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--portal-muted)]">
                {label}
              </p>
              <p className="mt-1 text-sm font-medium capitalize text-[var(--portal-ink)]">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Edit profile modal */}
      <Modal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          form.reset(profileQuery.data ? toFormValues(profileQuery.data) : defaultValues);
        }}
        title="Edit resident details"
        description="These details are stored with your resident portal record and used during case validation."
        size="xl"
        footer={
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Changes are saved to your resident record.</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditOpen(false);
                  form.reset(profileQuery.data ? toFormValues(profileQuery.data) : defaultValues);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSaving || !form.formState.isDirty}
                className="bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]"
              >
                {isSaving ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save changes
              </Button>
            </div>
          </div>
        }
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-[var(--portal-ink)]" htmlFor="email">
                Login email
              </label>
              <Input id="email" type="email" {...form.register("email")} disabled />
              <p className="text-xs text-[var(--portal-muted)]">
                Contact OMSWD or an administrator if your sign-in email needs to change.
              </p>
            </div>

            <Field label="Full name" id="fullName">
              <Input id="fullName" autoComplete="name" {...form.register("fullName")} />
              <FieldError message={form.formState.errors.fullName?.message} />
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

            <Field label="Municipality" id="municipality">
              <Select
                id="municipality"
                className="disabled:cursor-default disabled:opacity-100 disabled:text-foreground"
                {...form.register("municipality")}
                disabled
              >
                <option value={form.getValues("municipality") || "Pandan"}>
                  {form.getValues("municipality") || "Pandan"}
                </option>
              </Select>
            </Field>

            <Field label="Barangay" id="barangay">
              <Select
                id="barangay"
                {...form.register("barangay")}
                disabled={isLoadingBarangays || barangayOptions.length === 0}
              >
                <option value="">
                  {isLoadingBarangays ? "Loading barangays..." : "Select barangay"}
                </option>
                {barangayOptions.map((barangay) => (
                  <option key={barangay.code} value={barangay.name}>
                    {barangay.name}
                  </option>
                ))}
              </Select>
              <FieldError message={form.formState.errors.barangay?.message} />
            </Field>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-[var(--portal-ink)]" htmlFor="addressLine">
                Street address
              </label>
              <Textarea
                id="addressLine"
                placeholder="House number, purok, sitio, or landmark"
                {...form.register("addressLine")}
              />
              <FieldError message={form.formState.errors.addressLine?.message} />
            </div>

            <Field label="Household size" id="householdSize">
              <Input id="householdSize" type="number" min="1" {...form.register("householdSize")} />
              <FieldError message={form.formState.errors.householdSize?.message} />
            </Field>

            <Field label="Monthly income" id="monthlyIncome">
              <Input id="monthlyIncome" type="number" min="0" step="0.01" {...form.register("monthlyIncome")} />
              <FieldError message={form.formState.errors.monthlyIncome?.message} />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function toFormValues(profile: ResidentProfileSettings): ProfileFormValues {
  return {
    email: profile.email,
    fullName: profile.fullName,
    phoneNumber: profile.phoneNumber,
    birthDate: profile.birthDate,
    sex: profile.sex,
    civilStatus: profile.civilStatus,
    municipality: profile.municipality || "Pandan",
    barangay: profile.barangay,
    addressLine: profile.addressLine,
    householdSize: profile.householdSize,
    monthlyIncome: profile.monthlyIncome,
  };
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
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
      <label className="text-sm font-semibold text-[var(--portal-ink)]" htmlFor={id}>
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

function ProfileMetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="portal-metric-card p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[var(--portal-accent)]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--portal-muted)]">
        {label}
      </p>
      <p className="mt-2 font-semibold text-[var(--portal-ink)]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--portal-muted)]">{detail}</p>
    </div>
  );
}
