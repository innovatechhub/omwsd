import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, LoaderCircle, PlusCircle, Save, Search, SlidersHorizontal, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { getAdminSettings, getAuditLogs, saveAdminSetting } from "@/services/admin-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type SavingSection = "requirements" | "program" | "staff" | null;
type SettingsTab = "requirements" | "program" | "users" | "audit";

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

const serviceLabels: Record<string, string> = {
  "medical-assistance": "Medical Assistance",
  "burial-assistance": "Burial Assistance",
  "food-relief": "Food Relief",
  "educational-assistance": "Educational Assistance",
};

function createProgramSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatProgramLabel(slug: string) {
  return serviceLabels[slug] ?? slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function parseRequirementsText(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatStaffRole(role: string) {
  return role === "admin" ? "Administrator" : "Staff";
}

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
  const [savingSection, setSavingSection] = useState<SavingSection>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>("requirements");

  const auditQuery = useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: () => getAuditLogs(200),
    enabled: !isResidentView && activeTab === "audit",
  });
  const [auditActionFilter, setAuditActionFilter] = useState("all");
  const [auditSearch, setAuditSearch] = useState("");
  const [auditDateFilter, setAuditDateFilter] = useState("all");
  const [newProgramName, setNewProgramName] = useState("");
  const [newProgramRequirements, setNewProgramRequirements] = useState("");
  const [newProgramError, setNewProgramError] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("social_worker");
  const [addUserError, setAddUserError] = useState("");

  const settingsData = settingsQuery.data ?? fallbackSettings;
  const requirementTemplates = useMemo<Record<string, unknown>>(
    () => ({
      ...fallbackSettings.requirementsTemplates,
      ...((settingsData.requirementsTemplates as Record<string, unknown> | undefined) ?? {}),
    }),
    [settingsData.requirementsTemplates],
  );
  const staffRoles = (settingsData.staffRoles as Record<string, unknown> | undefined) ?? {};
  const serviceOptions = useMemo(
    () =>
      Object.keys(requirementTemplates)
        .sort((left, right) => formatProgramLabel(left).localeCompare(formatProgramLabel(right)))
        .map((slug) => ({
          slug,
          label: formatProgramLabel(slug),
        })),
    [requirementTemplates],
  );
  const staffAssignments = useMemo(
    () =>
      Object.entries(staffRoles).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    [staffRoles],
  );
  const parsedRequirements = useMemo(
    () => parseRequirementsText(requirementsText),
    [requirementsText],
  );
  const parsedNewProgramRequirements = useMemo(
    () => parseRequirementsText(newProgramRequirements),
    [newProgramRequirements],
  );
  useEffect(() => {
    const selectedRequirements = requirementTemplates[serviceType];

    setRequirementsText(
      Array.isArray(selectedRequirements) ? selectedRequirements.join("\n") : "",
    );
  }, [requirementTemplates, serviceType]);

  async function handleSaveRequirements() {
    if (isResidentView) {
      toast.info("These settings are managed by administrators.");
      return;
    }

    try {
      setSavingSection("requirements");

      await saveAdminSetting("requirements_templates", {
        ...requirementTemplates,
        [serviceType]: parsedRequirements,
      });
      await settingsQuery.refetch();
      toast.success("Requirements template saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save requirements template.");
    } finally {
      setSavingSection(null);
    }
  }

  async function handleAddProgram() {
    if (isResidentView) {
      toast.info("These settings are managed by administrators.");
      return;
    }

    setNewProgramError("");
    const programName = newProgramName.trim();
    const programSlug = createProgramSlug(programName);

    if (!programName) {
      setNewProgramError("Program name is required.");
      return;
    }

    if (!programSlug) {
      setNewProgramError("Use letters or numbers in the program name.");
      return;
    }

    if (requirementTemplates[programSlug]) {
      setNewProgramError("A program with this name already exists.");
      return;
    }

    if (parsedNewProgramRequirements.length === 0) {
      setNewProgramError("Add at least one requirement.");
      return;
    }

    try {
      setSavingSection("program");

      await saveAdminSetting("requirements_templates", {
        ...requirementTemplates,
        [programSlug]: parsedNewProgramRequirements,
      });
      await settingsQuery.refetch();
      setServiceType(programSlug);
      setRequirementsText(parsedNewProgramRequirements.join("\n"));
      setNewProgramName("");
      setNewProgramRequirements("");
      setActiveTab("requirements");
      toast.success(`${programName} added.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add program.");
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
      toast.success(`${newUserName.trim()} added as ${formatStaffRole(newUserRole)}.`);
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
                  isActive={activeTab === "program"}
                  label="Additional Program"
                  icon={<PlusCircle className="h-4 w-4" />}
                  onClick={() => setActiveTab("program")}
                  residentMode={false}
                />
              )}
              {!isResidentView && (
                <TabButton
                  isActive={activeTab === "users"}
                  label="Add Users"
                  icon={<UserPlus className="h-4 w-4" />}
                  onClick={() => setActiveTab("users")}
                  residentMode={false}
                />
              )}
              {!isResidentView && (
                <TabButton
                  isActive={activeTab === "audit"}
                  label="Audit Trail"
                  icon={<ClipboardList className="h-4 w-4" />}
                  onClick={() => setActiveTab("audit")}
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
                {serviceOptions.map((service) => (
                  <option key={service.slug} value={service.slug}>
                    {service.label}
                  </option>
                ))}
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

        {activeTab === "program" ? (
          <Card>
            <CardHeader>
              <CardTitle>Additional program</CardTitle>
              <CardDescription>
                Add a program and the requirements residents need to prepare for it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-primary" htmlFor="new-program-name">
                  Program name
                </label>
                <Input
                  id="new-program-name"
                  placeholder="e.g. Livelihood Assistance"
                  value={newProgramName}
                  onChange={(e) => {
                    setNewProgramName(e.target.value);
                    setNewProgramError("");
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-primary" htmlFor="new-program-requirements">
                  Requirements
                </label>
                <Textarea
                  id="new-program-requirements"
                  value={newProgramRequirements}
                  onChange={(e) => {
                    setNewProgramRequirements(e.target.value);
                    setNewProgramError("");
                  }}
                  placeholder="Enter one requirement per line"
                  className="min-h-[180px]"
                />
              </div>
              <div className="space-y-3 rounded-2xl border border-primary/10 bg-muted/35 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  New program preview
                </p>
                <p className="text-sm font-semibold text-primary">
                  {newProgramName.trim() || "Program name"}
                </p>
                {parsedNewProgramRequirements.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {parsedNewProgramRequirements.slice(0, 8).map((requirement, index) => (
                      <span
                        key={`${requirement}-${index}`}
                        className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium"
                      >
                        {requirement}
                      </span>
                    ))}
                    {parsedNewProgramRequirements.length > 8 ? (
                      <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        +{parsedNewProgramRequirements.length - 8} more
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No requirements added for this program yet.
                  </p>
                )}
              </div>
              {newProgramError ? (
                <p className="text-sm font-medium text-destructive">{newProgramError}</p>
              ) : null}
              <Button
                onClick={handleAddProgram}
                disabled={savingSection === "program" || settingsQuery.isLoading}
              >
                <PlusCircle className="h-4 w-4" />
                Add program
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {activeTab === "audit" ? (() => {
          const allLogs = auditQuery.data ?? [];
          const now = Date.now();
          const filteredLogs = allLogs.filter((log) => {
            const matchesAction = auditActionFilter === "all" || log.action === auditActionFilter;
            const matchesSearch =
              auditSearch.trim() === "" ||
              log.actorName.toLowerCase().includes(auditSearch.toLowerCase()) ||
              log.actorEmail.toLowerCase().includes(auditSearch.toLowerCase());
            const matchesDate = (() => {
              if (auditDateFilter === "all") return true;
              const logTime = new Date(log.createdAt).getTime();
              if (auditDateFilter === "today") return now - logTime < 86_400_000;
              if (auditDateFilter === "week") return now - logTime < 7 * 86_400_000;
              if (auditDateFilter === "month") return now - logTime < 30 * 86_400_000;
              return true;
            })();
            return matchesAction && matchesSearch && matchesDate;
          });

          return (
            <Card>
              <CardHeader>
                <CardTitle>Audit trail</CardTitle>
                <CardDescription>
                  All system events — status changes, verifications, settings updates, and account actions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      placeholder="Search by name or email"
                      className="pl-9"
                    />
                  </div>
                  <Select value={auditActionFilter} onChange={(e) => setAuditActionFilter(e.target.value)}>
                    <option value="all">All actions</option>
                    <option value="auth.sign_in">Signed in</option>
                    <option value="auth.sign_out">Signed out</option>
                    <option value="application.status_updated">Status updated</option>
                    <option value="application.remarks_saved">Remarks saved</option>
                    <option value="resident.verified">Resident verified</option>
                    <option value="resident.account_activated">Account activated</option>
                    <option value="resident.account_suspended">Account suspended</option>
                    <option value="settings.updated">Settings updated</option>
                  </Select>
                  <Select value={auditDateFilter} onChange={(e) => setAuditDateFilter(e.target.value)}>
                    <option value="all">All time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 days</option>
                    <option value="month">Last 30 days</option>
                  </Select>
                </div>

                {auditQuery.isLoading ? (
                  <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Loading audit logs...
                  </div>
                ) : auditQuery.error ? (
                  <p className="py-8 text-sm text-destructive">Failed to load audit logs.</p>
                ) : !filteredLogs.length ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {allLogs.length === 0 ? "No events recorded yet." : "No events match the current filters."}
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">{filteredLogs.length} event(s) shown</p>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date & time</TableHead>
                            <TableHead>Actor</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Entity</TableHead>
                            <TableHead>Details</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                {log.createdAtLabel}
                              </TableCell>
                              <TableCell className="text-sm">
                                <p className="font-medium">{log.actorName}</p>
                                {log.actorEmail && (
                                  <p className="text-xs text-muted-foreground">{log.actorEmail}</p>
                                )}
                              </TableCell>
                              <TableCell>
                                <AuditActionBadge action={log.action} />
                              </TableCell>
                              <TableCell className="text-xs capitalize text-muted-foreground">
                                {log.entityType.replace(/_/g, " ")}
                              </TableCell>
                              <TableCell className="max-w-[200px] text-xs text-muted-foreground">
                                {formatAuditMetadata(log.action, log.metadata)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })() : null}

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
                  <option value="admin">Administrator</option>
                  <option value="social_worker">Staff</option>
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
                            {formatStaffRole(role)}
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

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  "auth.sign_in": { label: "Signed in", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  "auth.sign_out": { label: "Signed out", color: "bg-slate-50 text-slate-600 border-slate-200" },
  "application.status_updated": { label: "Status updated", color: "bg-blue-50 text-blue-700 border-blue-200" },
  "application.remarks_saved": { label: "Remarks saved", color: "bg-slate-50 text-slate-600 border-slate-200" },
  "resident.verified": { label: "Resident verified", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "resident.account_activated": { label: "Account activated", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "resident.account_suspended": { label: "Account suspended", color: "bg-red-50 text-red-700 border-red-200" },
  "settings.updated": { label: "Settings updated", color: "bg-amber-50 text-amber-700 border-amber-200" },
};

function AuditActionBadge({ action }: { action: string }) {
  const def = ACTION_LABELS[action] ?? { label: action, color: "bg-slate-50 text-slate-600 border-slate-200" };
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${def.color}`}>
      {def.label}
    </span>
  );
}

function formatAuditMetadata(action: string, metadata: Record<string, unknown>): string {
  if (action === "auth.sign_in" && metadata.role) {
    return `Role: ${String(metadata.role).replace(/_/g, " ")}`;
  }
  if (action === "application.status_updated" && metadata.status) {
    return `→ ${String(metadata.status).replace(/_/g, " ")}`;
  }
  if (action === "settings.updated" && metadata.setting_key) {
    return String(metadata.setting_key).replace(/_/g, " ");
  }
  return "—";
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
