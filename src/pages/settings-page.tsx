import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Save, ShieldCheck, SlidersHorizontal, Users } from "lucide-react";
import { toast } from "sonner";

import { getAdminSettings, saveAdminSetting } from "@/services/admin-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type SavingSection = "requirements" | "staff" | "policies" | null;

export function SettingsPage() {
  const settingsQuery = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: getAdminSettings,
  });

  const [serviceType, setServiceType] = useState("medical-assistance");
  const [requirementsText, setRequirementsText] = useState("");
  const [staffEmail, setStaffEmail] = useState("admin@gmail.com");
  const [staffRole, setStaffRole] = useState("admin");
  const [verificationSla, setVerificationSla] = useState("3");
  const [correctionWindow, setCorrectionWindow] = useState("5");
  const [defaultNotification, setDefaultNotification] = useState("email_and_portal");
  const [savingSection, setSavingSection] = useState<SavingSection>(null);

  const requirementTemplates =
    (settingsQuery.data?.requirementsTemplates as Record<string, unknown> | undefined) ?? {};
  const staffRoles = (settingsQuery.data?.staffRoles as Record<string, unknown> | undefined) ?? {};
  const systemPolicies =
    (settingsQuery.data?.systemPolicies as Record<string, unknown> | undefined) ?? {};
  const staffAssignments = useMemo(
    () =>
      Object.entries(staffRoles).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    [staffRoles],
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
      <section>
        <p className="text-sm uppercase tracking-[0.2em] text-primary/72">Settings</p>
        <h1 className="mt-2 font-serif text-4xl font-bold">Administrative configuration</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Update requirement templates, assign internal access, and control the default
          workflow rules used across the admin workspace.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Requirement templates"
          value={String(Object.keys(requirementTemplates).length)}
          detail="Service templates stored in Supabase"
          icon={<SlidersHorizontal className="h-5 w-5" />}
        />
        <SummaryCard
          title="Staff assignments"
          value={String(staffAssignments.length)}
          detail="Email-to-role mappings available"
          icon={<Users className="h-5 w-5" />}
        />
        <SummaryCard
          title="Verification SLA"
          value={`${verificationSla}d`}
          detail="Current review target window"
          icon={<ShieldCheck className="h-5 w-5" />}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-2xl">Requirements templates</CardTitle>
            <CardDescription>
              Update the document checklist residents see for each assistance type.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={serviceType} onChange={(event) => setServiceType(event.target.value)}>
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
            />
            <div className="rounded-2xl border border-primary/10 bg-muted/35 px-4 py-4 text-sm text-muted-foreground">
              {requirementsText.trim()
                ? `${requirementsText.split("\n").filter(Boolean).length} requirements ready to save`
                : "No requirements added for this service yet."}
            </div>
            <Button
              onClick={handleSaveRequirements}
              disabled={savingSection === "requirements" || settingsQuery.isLoading}
            >
              <Save className="h-4 w-4" />
              Save template
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-2xl">Staff roles</CardTitle>
            <CardDescription>
              Assign and review admin access or reviewer permissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={staffEmail}
              onChange={(event) => setStaffEmail(event.target.value)}
              placeholder="Staff email"
            />
            <Select value={staffRole} onChange={(event) => setStaffRole(event.target.value)}>
              <option value="admin">Administrator</option>
              <option value="social_worker">Social Worker</option>
              <option value="super_admin">Super Administrator</option>
            </Select>
            <div className="space-y-3 rounded-2xl border border-primary/10 bg-muted/35 px-4 py-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/72">
                  Selected account
                </p>
                <p className="text-right font-medium text-foreground">
                  {staffEmail || "No staff email entered"}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/72">
                  Role
                </p>
                <p className="text-right font-medium capitalize text-foreground">
                  {staffRole.replace("_", " ")}
                </p>
              </div>
            </div>
            <Button
              onClick={handleSaveStaffRole}
              disabled={savingSection === "staff" || settingsQuery.isLoading}
            >
              <Save className="h-4 w-4" />
              Save staff role
            </Button>

            <div className="space-y-2 border-t border-primary/10 pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/72">
                Current assignments
              </p>
              <div className="space-y-2">
                {staffAssignments.length > 0 ? (
                  staffAssignments.slice(0, 5).map(([email, role]) => (
                    <div
                      key={email}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-primary/10 bg-muted/35 px-3 py-3 text-sm"
                    >
                      <span className="min-w-0 truncate pr-4 text-foreground">{email}</span>
                      <span className="shrink-0 font-semibold capitalize text-primary">
                        {role.replace("_", " ")}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-primary/10 bg-muted/35 px-3 py-3 text-sm text-muted-foreground">
                    No staff roles saved yet.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-2xl">System policies</CardTitle>
            <CardDescription>
              Adjust the default lifecycle timing and notification behavior.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-primary" htmlFor="verification-sla">
                Verification SLA (days)
              </label>
              <Input
                id="verification-sla"
                type="number"
                min="1"
                value={verificationSla}
                onChange={(event) => setVerificationSla(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-primary" htmlFor="correction-window">
                Correction window (days)
              </label>
              <Input
                id="correction-window"
                type="number"
                min="1"
                value={correctionWindow}
                onChange={(event) => setCorrectionWindow(event.target.value)}
              />
            </div>
            <Select
              value={defaultNotification}
              onChange={(event) => setDefaultNotification(event.target.value)}
            >
              <option value="email_and_portal">Email and portal</option>
              <option value="portal_only">Portal only</option>
              <option value="email_only">Email only</option>
            </Select>
            <div className="space-y-3 rounded-2xl border border-primary/10 bg-muted/35 px-4 py-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/72">
                  Default notice
                </p>
                <p className="text-right font-medium capitalize text-foreground">
                  {defaultNotification.replace(/_/g, " ")}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/72">
                  Verification target
                </p>
                <p className="text-right font-medium text-foreground">{verificationSla} days</p>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/72">
                  Correction window
                </p>
                <p className="text-right font-medium text-foreground">{correctionWindow} days</p>
              </div>
            </div>
            <Button
              onClick={handleSavePolicies}
              disabled={savingSection === "policies" || settingsQuery.isLoading}
            >
              <Save className="h-4 w-4" />
              Save policies
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  detail,
  icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-secondary">
          {icon}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/72">
            {title}
          </p>
          <p className="mt-1 text-3xl font-bold">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}
