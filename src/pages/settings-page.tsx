import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Save, ShieldCheck, SlidersHorizontal, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";

import { ResidentPageHeader } from "@/components/resident/resident-page-header";
import { getAdminSettings, saveAdminSetting } from "@/services/admin-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type SavingSection = "requirements" | "staff" | "policies" | null;
type SettingsTab = "requirements" | "staff" | "policies" | "readiness";

type SettingsPageMode = "admin" | "resident";

interface SettingsPageProps {
  mode?: SettingsPageMode;
}

const fallbackSettings = {
  requirementsTemplates: {
    "medical-assistance": ["Barangay certificate", "Medical abstract", "Valid ID"],
    "burial-assistance": ["Death certificate", "Funeral contract", "Valid ID"],
    "food-relief": ["Barangay certificate", "Household profile", "Valid ID"],
    "educational-assistance": ["School enrollment proof", "Report card", "Valid ID"],
  },
  staffRoles: {
    "admin@gmail.com": "admin",
    "social.worker@gmail.com": "social_worker",
  },
  systemPolicies: {
    verificationSla: 3,
    correctionWindow: 5,
    defaultNotification: "email_and_portal",
  },
} as const;

export function SettingsPage({ mode = "admin" }: SettingsPageProps) {
  const isResidentView = mode === "resident";
  const portalCardClass = isResidentView ? "portal-card border-[var(--portal-outline)] shadow-none" : "";

  const settingsQuery = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: getAdminSettings,
    enabled: !isResidentView,
  });

  const [serviceType, setServiceType] = useState("medical-assistance");
  const [requirementsText, setRequirementsText] = useState("");
  const [staffEmail, setStaffEmail] = useState("admin@gmail.com");
  const [staffRole, setStaffRole] = useState("admin");
  const [verificationSla, setVerificationSla] = useState(
    String(fallbackSettings.systemPolicies.verificationSla),
  );
  const [correctionWindow, setCorrectionWindow] = useState(
    String(fallbackSettings.systemPolicies.correctionWindow),
  );
  const [defaultNotification, setDefaultNotification] = useState<string>(
    fallbackSettings.systemPolicies.defaultNotification,
  );
  const [savingSection, setSavingSection] = useState<SavingSection>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>("requirements");

  const settingsData = settingsQuery.data ?? fallbackSettings;
  const requirementTemplates =
    (settingsData.requirementsTemplates as Record<string, unknown> | undefined) ?? {};
  const staffRoles = (settingsData.staffRoles as Record<string, unknown> | undefined) ?? {};
  const systemPolicies =
    (settingsData.systemPolicies as Record<string, unknown> | undefined) ?? {};
  const staffAssignments = useMemo(
    () =>
      Object.entries(staffRoles).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    [staffRoles],
  );
  const parsedRequirements = useMemo(
    () =>
      requirementsText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    [requirementsText],
  );
  const setupReadiness = useMemo(() => {
    const hasTemplates = Object.keys(requirementTemplates).length > 0;
    const hasStaffAssignments = staffAssignments.length > 0;
    const hasPolicyValues = Number(verificationSla) >= 1 && Number(correctionWindow) >= 1;

    return {
      hasTemplates,
      hasStaffAssignments,
      hasPolicyValues,
      score:
        Number(hasTemplates) + Number(hasStaffAssignments) + Number(hasPolicyValues),
    };
  }, [
    correctionWindow,
    requirementTemplates,
    staffAssignments.length,
    verificationSla,
  ]);

  useEffect(() => {
    const selectedRequirements = requirementTemplates[serviceType];

    setRequirementsText(
      Array.isArray(selectedRequirements) ? selectedRequirements.join("\n") : "",
    );
  }, [requirementTemplates, serviceType]);

  useEffect(() => {
    if (typeof systemPolicies.verificationSla === "number") {
      setVerificationSla(String(systemPolicies.verificationSla));
    }

    if (typeof systemPolicies.correctionWindow === "number") {
      setCorrectionWindow(String(systemPolicies.correctionWindow));
    }

    if (typeof systemPolicies.defaultNotification === "string") {
      setDefaultNotification(systemPolicies.defaultNotification);
    }
  }, [systemPolicies]);

  useEffect(() => {
    const matchedRole = staffRoles[staffEmail.trim().toLowerCase()];

    if (typeof matchedRole === "string") {
      setStaffRole(matchedRole);
    }
  }, [staffEmail, staffRoles]);

  async function handleSaveRequirements() {
    if (isResidentView) {
      toast.info("These settings are managed by administrators.");
      return;
    }

    try {
      setSavingSection("requirements");

      await saveAdminSetting("requirements_templates", {
        ...requirementTemplates,
        [serviceType]: requirementsText
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      await settingsQuery.refetch();
      toast.success("Requirements template saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save requirements template.");
    } finally {
      setSavingSection(null);
    }
  }

  async function handleSaveStaffRole() {
    if (isResidentView) {
      toast.info("These settings are managed by administrators.");
      return;
    }

    if (!staffEmail.trim()) {
      toast.error("Enter a staff email before saving.");
      return;
    }

    try {
      setSavingSection("staff");

      await saveAdminSetting("staff_roles", {
        ...staffRoles,
        [staffEmail.trim().toLowerCase()]: staffRole,
      });
      await settingsQuery.refetch();
      toast.success("Staff role assignment saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save staff role.");
    } finally {
      setSavingSection(null);
    }
  }

  async function handleSavePolicies() {
    if (isResidentView) {
      toast.info("These settings are managed by administrators.");
      return;
    }

    if (Number(verificationSla) < 1 || Number(correctionWindow) < 1) {
      toast.error("Policy values must be at least 1 day.");
      return;
    }

    try {
      setSavingSection("policies");

      await saveAdminSetting("system_policies", {
        verificationSla: Number(verificationSla),
        correctionWindow: Number(correctionWindow),
        defaultNotification,
      });
      await settingsQuery.refetch();
      toast.success("System defaults updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save system policies.");
    } finally {
      setSavingSection(null);
    }
  }

  return (
    <div className="space-y-6">
      {isResidentView ? (
        <ResidentPageHeader
          eyebrow="Settings"
          title="Portal settings overview"
          description="This resident view mirrors the admin settings interface and shows default workflow configurations managed by OMSWD administrators."
          chips={["Managed Defaults", "Resident Visibility"]}
        />
      ) : (
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Settings
          </p>
          <h1 className="text-3xl font-semibold">Administrative configuration</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Update requirement templates, assign internal access, and control the default workflow
            rules used across the admin workspace.
          </p>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Requirement templates"
          value={String(Object.keys(requirementTemplates).length)}
          detail="Service templates stored in Supabase"
          icon={<SlidersHorizontal className="h-5 w-5" />}
          residentMode={isResidentView}
        />
        <SummaryCard
          title="Staff assignments"
          value={String(staffAssignments.length)}
          detail="Email-to-role mappings available"
          icon={<Users className="h-5 w-5" />}
          residentMode={isResidentView}
        />
        <SummaryCard
          title="Verification SLA"
          value={`${verificationSla}d`}
          detail="Current review target window"
          icon={<ShieldCheck className="h-5 w-5" />}
          residentMode={isResidentView}
        />
      </section>

      <section className="space-y-4">
        <Card className={portalCardClass}>
          <CardContent className="p-2">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <TabButton
                isActive={activeTab === "requirements"}
                label="Requirements"
                icon={<SlidersHorizontal className="h-4 w-4" />}
                onClick={() => setActiveTab("requirements")}
                residentMode={isResidentView}
              />
              <TabButton
                isActive={activeTab === "staff"}
                label="Staff Roles"
                icon={<Users className="h-4 w-4" />}
                onClick={() => setActiveTab("staff")}
                residentMode={isResidentView}
              />
              <TabButton
                isActive={activeTab === "policies"}
                label="Policies"
                icon={<ShieldCheck className="h-4 w-4" />}
                onClick={() => setActiveTab("policies")}
                residentMode={isResidentView}
              />
              <TabButton
                isActive={activeTab === "readiness"}
                label="Readiness"
                icon={<Sparkles className="h-4 w-4" />}
                onClick={() => setActiveTab("readiness")}
                residentMode={isResidentView}
              />
            </div>
          </CardContent>
        </Card>

        {activeTab === "requirements" ? (
          <Card className={portalCardClass}>
            <CardHeader>
              <CardTitle>Requirements templates</CardTitle>
              <CardDescription>
                Update the document checklist residents see for each assistance type.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={serviceType}
                onChange={(event) => setServiceType(event.target.value)}
                disabled={isResidentView}
              >
                <option value="medical-assistance">Medical Assistance</option>
                <option value="burial-assistance">Burial Assistance</option>
                <option value="food-relief">Food Relief</option>
                <option value="educational-assistance">Educational Assistance</option>
              </Select>
              <Textarea
                value={requirementsText}
                onChange={(event) => setRequirementsText(event.target.value)}
                placeholder="Enter one requirement per line"
                className="min-h-[220px]"
                disabled={isResidentView}
              />
              <div
                className={[
                  "space-y-3 rounded-2xl px-4 py-4",
                  isResidentView
                    ? "border border-[var(--portal-outline)] bg-[var(--portal-surface-soft)]"
                    : "border border-primary/10 bg-muted/35",
                ].join(" ")}
              >
                <p
                  className={[
                    "text-xs font-semibold uppercase tracking-[0.14em]",
                    isResidentView ? "text-[var(--portal-muted)]" : "text-muted-foreground",
                  ].join(" ")}
                >
                  Template preview
                </p>
                {parsedRequirements.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {parsedRequirements.slice(0, 8).map((requirement, index) => (
                      <span
                        key={`${requirement}-${index}`}
                        className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium"
                      >
                        {requirement}
                      </span>
                    ))}
                    {parsedRequirements.length > 8 ? (
                      <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        +{parsedRequirements.length - 8} more
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <p className={isResidentView ? "text-sm text-[var(--portal-muted)]" : "text-sm text-muted-foreground"}>
                    No requirements added for this service yet.
                  </p>
                )}
                <p className={isResidentView ? "text-sm text-[var(--portal-muted)]" : "text-sm text-muted-foreground"}>
                  {parsedRequirements.length} requirement(s) ready to save.
                </p>
              </div>
              <Button
                onClick={handleSaveRequirements}
                disabled={
                  isResidentView ||
                  savingSection === "requirements" ||
                  settingsQuery.isLoading
                }
                className={
                  isResidentView
                    ? "border-[var(--portal-outline)] bg-white text-[var(--portal-muted)] hover:bg-[var(--portal-surface-soft)]"
                    : undefined
                }
              >
                <Save className="h-4 w-4" />
                {isResidentView ? "Managed by admin" : "Save template"}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {activeTab === "staff" ? (
          <Card className={portalCardClass}>
            <CardHeader>
              <CardTitle>Staff roles</CardTitle>
              <CardDescription>
                {isResidentView
                  ? "View current staff role mappings used by administrators."
                  : "Assign and review admin access or reviewer permissions."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={staffEmail}
                onChange={(event) => setStaffEmail(event.target.value)}
                placeholder="Staff email"
                disabled={isResidentView}
              />
              <Select
                value={staffRole}
                onChange={(event) => setStaffRole(event.target.value)}
                disabled={isResidentView}
              >
                <option value="admin">Administrator</option>
                <option value="social_worker">Social Worker</option>
                <option value="super_admin">Super Administrator</option>
              </Select>
              <div
                className={[
                  "space-y-3 rounded-2xl px-4 py-4",
                  isResidentView
                    ? "border border-[var(--portal-outline)] bg-[var(--portal-surface-soft)]"
                    : "border border-primary/10 bg-muted/35",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3 text-sm">
                  <p
                    className={[
                      "text-xs font-semibold uppercase tracking-[0.16em]",
                      isResidentView ? "text-[var(--portal-muted)]" : "text-primary/72",
                    ].join(" ")}
                  >
                    Selected account
                  </p>
                  <p className={isResidentView ? "max-w-[65%] truncate text-right font-medium text-[var(--portal-ink)]" : "max-w-[65%] truncate text-right font-medium text-foreground"}>
                    {staffEmail || "No staff email entered"}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <p
                    className={[
                      "text-xs font-semibold uppercase tracking-[0.16em]",
                      isResidentView ? "text-[var(--portal-muted)]" : "text-primary/72",
                    ].join(" ")}
                  >
                    Role
                  </p>
                  <p className={isResidentView ? "text-right font-medium capitalize text-[var(--portal-ink)]" : "text-right font-medium capitalize text-foreground"}>
                    {staffRole.replace("_", " ")}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSaveStaffRole}
                disabled={isResidentView || savingSection === "staff" || settingsQuery.isLoading}
                className={
                  isResidentView
                    ? "border-[var(--portal-outline)] bg-white text-[var(--portal-muted)] hover:bg-[var(--portal-surface-soft)]"
                    : undefined
                }
              >
                <Save className="h-4 w-4" />
                {isResidentView ? "Managed by admin" : "Save staff role"}
              </Button>

              <div className="space-y-2 border-t border-primary/10 pt-4">
                <p
                  className={[
                    "text-xs font-semibold uppercase tracking-[0.16em]",
                    isResidentView ? "text-[var(--portal-muted)]" : "text-primary/72",
                  ].join(" ")}
                >
                  Current assignments
                </p>
                {staffAssignments.length > 0 ? (
                  <div className="space-y-2">
                    {staffAssignments.slice(0, 10).map(([email, role]) => (
                      <div
                        key={email}
                        className={[
                          "flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5",
                          isResidentView
                            ? "border-[var(--portal-outline)] bg-white"
                            : "bg-background",
                        ].join(" ")}
                      >
                        <p className={isResidentView ? "min-w-0 truncate text-sm font-medium text-[var(--portal-ink)]" : "min-w-0 truncate text-sm font-medium"}>
                          {email}
                        </p>
                        <p className={isResidentView ? "shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--portal-accent)]" : "shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-primary"}>
                          {role.replace("_", " ")}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className={[
                      "rounded-2xl border px-3 py-3 text-sm",
                      isResidentView
                        ? "border-[var(--portal-outline)] bg-[var(--portal-surface-soft)] text-[var(--portal-muted)]"
                        : "border-primary/10 bg-muted/35 text-muted-foreground",
                    ].join(" ")}
                  >
                    No staff roles saved yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {activeTab === "policies" ? (
          <Card className={portalCardClass}>
            <CardHeader>
              <CardTitle>System policies</CardTitle>
              <CardDescription>
                Adjust default timing and notification behavior for all workflow actions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    className={isResidentView ? "text-sm font-semibold text-[var(--portal-ink)]" : "text-sm font-semibold text-primary"}
                    htmlFor="verification-sla"
                  >
                    Verification SLA (days)
                  </label>
                  <Input
                    id="verification-sla"
                    type="number"
                    min="1"
                    value={verificationSla}
                    onChange={(event) => setVerificationSla(event.target.value)}
                    disabled={isResidentView}
                  />
                </div>
                <div className="space-y-2">
                  <label
                    className={isResidentView ? "text-sm font-semibold text-[var(--portal-ink)]" : "text-sm font-semibold text-primary"}
                    htmlFor="correction-window"
                  >
                    Correction window (days)
                  </label>
                  <Input
                    id="correction-window"
                    type="number"
                    min="1"
                    value={correctionWindow}
                    onChange={(event) => setCorrectionWindow(event.target.value)}
                    disabled={isResidentView}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label
                  className={isResidentView ? "text-sm font-semibold text-[var(--portal-ink)]" : "text-sm font-semibold text-primary"}
                  htmlFor="default-notification"
                >
                  Default notification channel
                </label>
                <Select
                  id="default-notification"
                  value={defaultNotification}
                  onChange={(event) => setDefaultNotification(event.target.value)}
                  disabled={isResidentView}
                >
                  <option value="email_and_portal">Email and portal</option>
                  <option value="portal_only">Portal only</option>
                  <option value="email_only">Email only</option>
                </Select>
              </div>
              <div
                className={[
                  "space-y-3 rounded-2xl px-4 py-4",
                  isResidentView
                    ? "border border-[var(--portal-outline)] bg-[var(--portal-surface-soft)]"
                    : "border border-primary/10 bg-muted/35",
                ].join(" ")}
              >
                <p
                  className={[
                    "text-xs font-semibold uppercase tracking-[0.14em]",
                    isResidentView ? "text-[var(--portal-muted)]" : "text-muted-foreground",
                  ].join(" ")}
                >
                  Workflow defaults preview
                </p>
                <PreviewRow
                  label="Verification target"
                  value={`${verificationSla} days`}
                  residentMode={isResidentView}
                />
                <PreviewRow
                  label="Correction window"
                  value={`${correctionWindow} days`}
                  residentMode={isResidentView}
                />
                <PreviewRow
                  label="Default notice"
                  value={defaultNotification.replace(/_/g, " ")}
                  residentMode={isResidentView}
                />
              </div>
              <Button
                onClick={handleSavePolicies}
                disabled={isResidentView || savingSection === "policies" || settingsQuery.isLoading}
                className={
                  isResidentView
                    ? "border-[var(--portal-outline)] bg-white text-[var(--portal-muted)] hover:bg-[var(--portal-surface-soft)]"
                    : undefined
                }
              >
                <Save className="h-4 w-4" />
                {isResidentView ? "Managed by admin" : "Save policies"}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {activeTab === "readiness" ? (
          <Card className={portalCardClass}>
            <CardHeader>
              <CardTitle>Setup readiness</CardTitle>
              <CardDescription>
                Quick validation of core admin configuration before daily operations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ReadinessItem
                label="Requirement templates configured"
                ready={setupReadiness.hasTemplates}
                residentMode={isResidentView}
              />
              <ReadinessItem
                label="Staff assignments configured"
                ready={setupReadiness.hasStaffAssignments}
                residentMode={isResidentView}
              />
              <ReadinessItem
                label="Policy values configured"
                ready={setupReadiness.hasPolicyValues}
                residentMode={isResidentView}
              />
              <div
                className={[
                  "rounded-xl border border-dashed px-4 py-3",
                  isResidentView
                    ? "border-[var(--portal-outline)] bg-[var(--portal-surface-soft)]"
                    : "bg-muted/20",
                ].join(" ")}
              >
                <p
                  className={[
                    "text-xs font-semibold uppercase tracking-[0.14em]",
                    isResidentView ? "text-[var(--portal-muted)]" : "text-muted-foreground",
                  ].join(" ")}
                >
                  Readiness score
                </p>
                <p className={isResidentView ? "mt-1 text-2xl font-semibold text-[var(--portal-ink)]" : "mt-1 text-2xl font-semibold"}>
                  {setupReadiness.score}/3
                </p>
                <p className={isResidentView ? "text-sm text-[var(--portal-muted)]" : "text-sm text-muted-foreground"}>
                  Keep this at full score for stable daily operations.
                </p>
              </div>
              <div
                className={[
                  "rounded-xl border px-4 py-3 text-sm",
                  isResidentView
                    ? "border-[var(--portal-outline)] bg-white text-[var(--portal-muted)]"
                    : "border-primary/15 bg-primary/5 text-muted-foreground",
                ].join(" ")}
              >
                <p className={isResidentView ? "font-medium text-[var(--portal-ink)]" : "font-medium text-foreground"}>
                  Tip
                </p>
                <p className="mt-1">
                  Save templates first, then assign staff roles, and finally lock policy values.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  detail,
  icon,
  residentMode = false,
}: {
  title: string;
  value: string;
  detail: string;
  icon: ReactNode;
  residentMode?: boolean;
}) {
  return (
    <Card className={residentMode ? "portal-card border-[var(--portal-outline)] shadow-none" : undefined}>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={[
            "flex h-12 w-12 items-center justify-center rounded-2xl",
            residentMode ? "bg-[var(--portal-surface-soft)] text-[var(--portal-accent)]" : "bg-primary text-secondary",
          ].join(" ")}
        >
          {icon}
        </div>
        <div>
          <p
            className={[
              "text-xs font-semibold uppercase tracking-[0.16em]",
              residentMode ? "text-[var(--portal-muted)]" : "text-primary/72",
            ].join(" ")}
          >
            {title}
          </p>
          <p className={residentMode ? "mt-1 text-3xl font-bold text-[var(--portal-ink)]" : "mt-1 text-3xl font-bold"}>
            {value}
          </p>
          <p className={residentMode ? "mt-1 text-sm text-[var(--portal-muted)]" : "mt-1 text-sm text-muted-foreground"}>
            {detail}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function PreviewRow({
  label,
  value,
  residentMode = false,
}: {
  label: string;
  value: string;
  residentMode?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm",
        residentMode ? "border-[var(--portal-outline)] bg-white" : "bg-background",
      ].join(" ")}
    >
      <p className={residentMode ? "text-[var(--portal-muted)]" : "text-muted-foreground"}>{label}</p>
      <p className={residentMode ? "font-medium capitalize text-[var(--portal-ink)]" : "font-medium capitalize"}>
        {value}
      </p>
    </div>
  );
}

function ReadinessItem({
  label,
  ready,
  residentMode = false,
}: {
  label: string;
  ready: boolean;
  residentMode?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5",
        residentMode ? "border-[var(--portal-outline)] bg-white" : "bg-background",
      ].join(" ")}
    >
      <p className={residentMode ? "text-sm text-[var(--portal-ink)]" : "text-sm"}>{label}</p>
      <span
        className={[
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em]",
          ready
            ? "bg-emerald-500/15 text-emerald-700"
            : "bg-amber-500/15 text-amber-700",
        ].join(" ")}
      >
        {ready ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
        {ready ? "Ready" : "Needs setup"}
      </span>
    </div>
  );
}

function TabButton({
  isActive,
  label,
  icon,
  onClick,
  residentMode = false,
}: {
  isActive: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  residentMode?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
        isActive
          ? residentMode
            ? "portal-nav-link-active"
            : "border-primary/20 bg-primary text-primary-foreground"
          : residentMode
            ? "border-[var(--portal-outline)] bg-white text-[var(--portal-muted)] hover:bg-[var(--portal-surface-soft)] hover:text-[var(--portal-ink)]"
            : "border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground",
      ].join(" ")}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
