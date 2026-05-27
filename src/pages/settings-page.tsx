import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Save, ShieldCheck, SlidersHorizontal, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

import { getAdminSettings, saveAdminSetting } from "@/services/admin-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type SavingSection = "requirements" | null;
type SettingsTab = "requirements" | "users";

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
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("social_worker");
  const [addUserError, setAddUserError] = useState("");

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

  async function handleAddUser() {
    setAddUserError("");
    const email = newUserEmail.trim().toLowerCase();

    if (!newUserName.trim()) {
      setAddUserError("Full name is required.");
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAddUserError("Enter a valid email address.");
      return;
    }

    if (staffRoles[email]) {
      setAddUserError("This email already has a role assigned.");
      return;
    }

    try {
      setSavingSection("staff");

      await saveAdminSetting("staff_roles", {
        ...staffRoles,
        [email]: newUserRole,
      });
      await settingsQuery.refetch();
      toast.success(`${newUserName.trim()} added as ${newUserRole.replace("_", " ")}.`);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserRole("social_worker");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add user.");
    } finally {
      setSavingSection(null);
    }
  }

  async function handleRemoveUser(email: string) {
    try {
      setSavingSection("staff");

      const updated = Object.fromEntries(
        Object.entries(staffRoles).filter(([key]) => key !== email),
      );
      await saveAdminSetting("staff_roles", updated as Record<string, unknown>);
      await settingsQuery.refetch();
      toast.success(`${email} removed.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove user.");
    } finally {
      setSavingSection(null);
    }
  }

  return (
    <div className="space-y-6">
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
              {!isResidentView && (
                <TabButton
                  isActive={activeTab === "users"}
                  label="Add Users"
                  icon={<UserPlus className="h-4 w-4" />}
                  onClick={() => setActiveTab("users")}
                  residentMode={false}
                />
              )}
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



        {activeTab === "users" ? (
          <Card>
            <CardHeader>
              <CardTitle>Add users</CardTitle>
              <CardDescription>
                Add new staff members and assign their portal role.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-primary" htmlFor="new-user-name">
                    Full name
                  </label>
                  <Input
                    id="new-user-name"
                    placeholder="e.g. Maria Santos"
                    value={newUserName}
                    onChange={(e) => { setNewUserName(e.target.value); setAddUserError(""); }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-primary" htmlFor="new-user-email">
                    Email address
                  </label>
                  <Input
                    id="new-user-email"
                    type="email"
                    placeholder="e.g. maria@omswd.gov"
                    value={newUserEmail}
                    onChange={(e) => { setNewUserEmail(e.target.value); setAddUserError(""); }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-primary" htmlFor="new-user-role">
                  Role
                </label>
                <Select
                  id="new-user-role"
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                >
                  <option value="social_worker">Social Worker</option>
                  <option value="admin">Administrator</option>
                  <option value="super_admin">Super Administrator</option>
                </Select>
              </div>
              {addUserError ? (
                <p className="text-sm font-medium text-destructive">{addUserError}</p>
              ) : null}
              <Button
                onClick={handleAddUser}
                disabled={savingSection === "staff" || settingsQuery.isLoading}
              >
                <UserPlus className="h-4 w-4" />
                Add user
              </Button>

              {staffAssignments.length > 0 ? (
                <div className="space-y-2 border-t border-primary/10 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/72">
                    Current users
                  </p>
                  <div className="space-y-2">
                    {staffAssignments.map(([email, role]) => (
                      <div
                        key={email}
                        className="flex items-center justify-between gap-3 rounded-xl border bg-background px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{email}</p>
                          <p className="text-xs capitalize text-muted-foreground">
                            {role.replace("_", " ")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(email)}
                          disabled={savingSection === "staff"}
                          className="shrink-0 rounded-lg border border-destructive/30 bg-destructive/8 px-2.5 py-1 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/15 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
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
