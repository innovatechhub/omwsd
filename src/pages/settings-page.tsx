import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, LoaderCircle, Pencil, PlusCircle, Power, PowerOff, Save, Search, SlidersHorizontal, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { createStaffUser, updateStaffUser } from "@/services/auth-service";
import {
  deleteAdminProgram,
  getAdminPrograms,
  getAdminStaffUsers,
  getAuditLogs,
  saveAdminProgram,
  saveAdminSetting,
  updateAdminProgramStatus,
} from "@/services/admin-service";
import type { AdminStaffUser } from "@/services/admin-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { AdminProgramRecord, SaveAdminProgramInput } from "@/types/admin";

type SavingSection = "requirements" | "program" | "staff" | null;
type SettingsTab = "requirements" | "program" | "users" | "audit";
type StaffRole = "admin" | "social_worker";

type SettingsPageMode = "admin" | "resident";

type RequirementDraft = SaveAdminProgramInput["requirements"][number];

interface ProgramFormState {
  code: string;
  name: string;
  supportType: string;
  description: string;
  estimatedProcessingDays: string;
  isActive: boolean;
  requirements: RequirementDraft[];
}

interface SettingsPageProps {
  mode?: SettingsPageMode;
}

function createRequirementDraft(): RequirementDraft {
  return {
    name: "",
    description: null,
    documentType: null,
    isRequired: true,
    sortOrder: 0,
  };
}

function createEmptyProgramForm(): ProgramFormState {
  return {
    code: "",
    name: "",
    supportType: "",
    description: "",
    estimatedProcessingDays: "",
    isActive: true,
    requirements: [createRequirementDraft()],
  };
}

function createProgramForm(program: AdminProgramRecord): ProgramFormState {
  return {
    code: program.code,
    name: program.name,
    supportType: program.supportType,
    description: program.description,
    estimatedProcessingDays:
      program.estimatedProcessingDays === null ? "" : String(program.estimatedProcessingDays),
    isActive: program.isActive,
    requirements:
      program.requirements.length > 0
        ? program.requirements.map((requirement) => ({
            id: requirement.id,
            name: requirement.name,
            description: requirement.description,
            documentType: requirement.documentType,
            isRequired: requirement.isRequired,
            sortOrder: requirement.sortOrder,
          }))
        : [createRequirementDraft()],
  };
}

function formatStaffRole(role: string) {
  return role === "admin" ? "Administrator" : "Staff";
}

export function SettingsPage({ mode = "admin" }: SettingsPageProps) {
  const isResidentView = mode === "resident";
  const portalCardClass = isResidentView ? "portal-card border-[var(--portal-outline)] shadow-none" : "";

  const programsQuery = useQuery({
    queryKey: ["admin", "programs"],
    queryFn: getAdminPrograms,
    enabled: !isResidentView,
  });

  const [savingSection, setSavingSection] = useState<SavingSection>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>("requirements");
  const [programSearch, setProgramSearch] = useState("");
  const [programEditorOpen, setProgramEditorOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<AdminProgramRecord | null>(null);
  const [programForm, setProgramForm] = useState<ProgramFormState>(createEmptyProgramForm);
  const [programFormError, setProgramFormError] = useState("");

  const auditQuery = useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: () => getAuditLogs(200),
    enabled: !isResidentView && activeTab === "audit",
  });

  const staffQuery = useQuery({
    queryKey: ["admin", "staff-users"],
    queryFn: getAdminStaffUsers,
    enabled: !isResidentView && activeTab === "users",
  });
  const [auditActionFilter, setAuditActionFilter] = useState("all");
  const [auditSearch, setAuditSearch] = useState("");
  const [auditDateFilter, setAuditDateFilter] = useState("all");
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserConfirmPassword, setNewUserConfirmPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<StaffRole>("social_worker");
  const [addUserError, setAddUserError] = useState("");
  const [editingUser, setEditingUser] = useState<AdminStaffUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<StaffRole>("social_worker");
  const [editPassword, setEditPassword] = useState("");
  const [editConfirmPassword, setEditConfirmPassword] = useState("");
  const [editUserError, setEditUserError] = useState("");

  const staffUsers: AdminStaffUser[] = staffQuery.data ?? [];
  const programs = programsQuery.data ?? [];
  const filteredPrograms = useMemo(() => {
    const needle = programSearch.trim().toLowerCase();

    if (!needle) {
      return programs;
    }

    return programs.filter((program) =>
      [program.code, program.name, program.supportType]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [programSearch, programs]);

  function openProgramEditor(program: AdminProgramRecord | null = null) {
    setEditingProgram(program);
    setProgramForm(program ? createProgramForm(program) : createEmptyProgramForm());
    setProgramFormError("");
    setProgramEditorOpen(true);
  }

  function updateProgramForm<K extends keyof ProgramFormState>(
    key: K,
    value: ProgramFormState[K],
  ) {
    setProgramForm((current) => ({ ...current, [key]: value }));
    setProgramFormError("");
  }

  function updateRequirementDraft(
    index: number,
    patch: Partial<RequirementDraft>,
  ) {
    setProgramForm((current) => ({
      ...current,
      requirements: current.requirements.map((requirement, requirementIndex) =>
        requirementIndex === index ? { ...requirement, ...patch } : requirement,
      ),
    }));
    setProgramFormError("");
  }

  function addRequirementDraft() {
    setProgramForm((current) => ({
      ...current,
      requirements: [...current.requirements, createRequirementDraft()],
    }));
  }

  function removeRequirementDraft(index: number) {
    setProgramForm((current) => ({
      ...current,
      requirements:
        current.requirements.length > 1
          ? current.requirements.filter((_, requirementIndex) => requirementIndex !== index)
          : current.requirements,
    }));
  }

  async function handleSaveProgramForm() {
    const programName = programForm.name.trim();
    const programCode = programForm.code.trim();
    const requirements = programForm.requirements.filter((requirement) =>
      requirement.name.trim(),
    );
    const estimatedProcessingDays = programForm.estimatedProcessingDays.trim()
      ? Number(programForm.estimatedProcessingDays)
      : null;

    if (!programCode) {
      setProgramFormError("Program code is required.");
      return;
    }

    if (!programName) {
      setProgramFormError("Program name is required.");
      return;
    }

    if (
      estimatedProcessingDays !== null &&
      (!Number.isInteger(estimatedProcessingDays) || estimatedProcessingDays < 0)
    ) {
      setProgramFormError("Processing days must be a whole number.");
      return;
    }

    if (requirements.length === 0) {
      setProgramFormError("Add at least one attachment requirement.");
      return;
    }

    try {
      setSavingSection("program");

      await saveAdminProgram({
        id: editingProgram?.id,
        code: programCode,
        name: programName,
        supportType: programForm.supportType,
        description: programForm.description,
        estimatedProcessingDays,
        isActive: programForm.isActive,
        requirements,
      });
      await programsQuery.refetch();
      setProgramEditorOpen(false);
      setEditingProgram(null);
      setProgramForm(createEmptyProgramForm());
      toast.success(editingProgram ? "Program updated." : "Program added.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save program.");
    } finally {
      setSavingSection(null);
    }
  }

  async function handleToggleProgram(program: AdminProgramRecord) {
    try {
      setSavingSection("program");
      await updateAdminProgramStatus(program.id, !program.isActive);
      await programsQuery.refetch();
      toast.success(`${program.name} ${program.isActive ? "disabled" : "enabled"}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update program status.");
    } finally {
      setSavingSection(null);
    }
  }

  async function handleDeleteProgram(program: AdminProgramRecord) {
    const confirmed = window.confirm(
      `Delete "${program.name}"? This is permanent and only works when no applications use this program.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setSavingSection("program");
      await deleteAdminProgram(program.id);
      await programsQuery.refetch();
      toast.success(`${program.name} deleted.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete program.");
    } finally {
      setSavingSection(null);
    }
  }

  async function handleAddUser() {
    setAddUserError("");
    const fullName = newUserName.trim();
    const email = newUserEmail.trim().toLowerCase();

    if (!fullName) {
      setAddUserError("Full name is required.");
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAddUserError("Enter a valid email address.");
      return;
    }

    if (newUserPassword.length < 8) {
      setAddUserError("Password must be at least 8 characters.");
      return;
    }

    if (newUserPassword !== newUserConfirmPassword) {
      setAddUserError("Passwords do not match.");
      return;
    }

    if (staffUsers.some((u) => u.email.toLowerCase() === email)) {
      setAddUserError("A user with this email already exists.");
      return;
    }

    try {
      setSavingSection("staff");

      await createStaffUser({
        email,
        password: newUserPassword,
        fullName,
        role: newUserRole,
      });

      await staffQuery.refetch();
      toast.success(`${fullName} added as ${formatStaffRole(newUserRole)}.`);
      setAddUserModalOpen(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserConfirmPassword("");
      setNewUserRole("social_worker");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add user.");
    } finally {
      setSavingSection(null);
    }
  }

  function openEditUser(user: AdminStaffUser) {
    setEditingUser(user);
    setEditName(user.fullName);
    setEditRole((user.role === "admin" || user.role === "super_admin") ? "admin" : "social_worker");
    setEditPassword("");
    setEditConfirmPassword("");
    setEditUserError("");
  }

  async function handleEditUser() {
    if (!editingUser) return;
    setEditUserError("");

    const name = editName.trim();
    if (!name) { setEditUserError("Full name is required."); return; }
    if (editPassword && editPassword.length < 8) {
      setEditUserError("Password must be at least 8 characters.");
      return;
    }
    if (editPassword && editPassword !== editConfirmPassword) {
      setEditUserError("Passwords do not match.");
      return;
    }

    try {
      setSavingSection("staff");
      await updateStaffUser({
        userId: editingUser.id,
        fullName: name,
        role: editRole,
        ...(editPassword ? { password: editPassword } : {}),
      });
      await staffQuery.refetch();
      toast.success(`${name} updated.`);
      setEditingUser(null);
    } catch (error) {
      setEditUserError(error instanceof Error ? error.message : "Unable to update user.");
    } finally {
      setSavingSection(null);
    }
  }

  async function handleRemoveUser(userId: string, email: string) {
    try {
      setSavingSection("staff");
      await saveAdminSetting("staff_roles", { _removed: userId });
      await staffQuery.refetch();
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
                label="Programs"
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
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle>Programs</CardTitle>
                  <CardDescription>
                    Manage assistance programs and the required attachments residents upload.
                  </CardDescription>
                </div>
                {!isResidentView ? (
                  <Button onClick={() => openProgramEditor(null)} disabled={programsQuery.isLoading}>
                    <PlusCircle className="h-4 w-4" />
                    Add program
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative ml-auto max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={programSearch}
                  onChange={(event) => setProgramSearch(event.target.value)}
                  placeholder="Search code, program, or support type"
                  className="pl-9"
                />
              </div>

              {programsQuery.isLoading ? (
                <div className="flex items-center gap-2 rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Loading programs...
                </div>
              ) : filteredPrograms.length > 0 ? (
                <div className="overflow-hidden rounded-xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead>Support type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Attachments</TableHead>
                        {!isResidentView ? <TableHead className="w-[210px]">Actions</TableHead> : null}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPrograms.map((program) => (
                        <TableRow key={program.id}>
                          <TableCell className="font-medium">{program.code}</TableCell>
                          <TableCell>
                            <p className="font-medium">{program.name}</p>
                            {program.description ? (
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                {program.description}
                              </p>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{program.supportType}</TableCell>
                          <TableCell>
                            <ProgramStatusBadge isActive={program.isActive} />
                          </TableCell>
                          <TableCell>{program.requirements.length}</TableCell>
                          {!isResidentView ? (
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openProgramEditor(program)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className={program.isActive ? "text-destructive" : "text-emerald-700"}
                                  disabled={savingSection === "program"}
                                  onClick={() => void handleToggleProgram(program)}
                                >
                                  {program.isActive ? (
                                    <PowerOff className="h-3.5 w-3.5" />
                                  ) : (
                                    <Power className="h-3.5 w-3.5" />
                                  )}
                                  {program.isActive ? "Disable" : "Enable"}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive"
                                  disabled={savingSection === "program"}
                                  onClick={() => void handleDeleteProgram(program)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          ) : null}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                  No programs match the current search.
                </div>
              )}
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
          <Card className={portalCardClass}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle>Staff users</CardTitle>
                  <CardDescription>
                    Manage staff accounts and their portal roles.
                  </CardDescription>
                </div>
                <Button onClick={() => setAddUserModalOpen(true)}>
                  <UserPlus className="h-4 w-4" />
                  Add user
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {staffQuery.isLoading ? (
                <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Loading users...
                </div>
              ) : staffUsers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--portal-outline)] bg-[var(--portal-surface-soft)] px-4 py-10 text-center text-sm text-muted-foreground">
                  No staff users found. Click "Add user" to create one.
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staffUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.fullName || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell>
                            <span className={[
                              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                              user.role === "admin" || user.role === "super_admin"
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : "border-slate-200 bg-slate-50 text-slate-700",
                            ].join(" ")}>
                              {user.roleLabel}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditUser(user)}
                                disabled={savingSection === "staff"}
                                className="rounded-lg border border-[var(--portal-outline)] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--portal-ink)] transition-colors hover:bg-[var(--portal-surface-soft)] disabled:opacity-50"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveUser(user.id, user.email)}
                                disabled={savingSection === "staff"}
                                className="rounded-lg border border-destructive/30 bg-destructive/8 px-2.5 py-1 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/15 disabled:opacity-50"
                              >
                                Remove
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {/* Add User Modal */}
        <Modal
          open={addUserModalOpen}
          onClose={() => {
            setAddUserModalOpen(false);
            setNewUserName("");
            setNewUserEmail("");
            setNewUserPassword("");
            setNewUserConfirmPassword("");
            setNewUserRole("social_worker");
            setAddUserError("");
          }}
          title="Add user"
          description="Create staff login credentials and assign their portal role."
          footer={
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                The user will be able to log in immediately after creation.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAddUserModalOpen(false);
                    setNewUserName("");
                    setNewUserEmail("");
                    setNewUserPassword("");
                    setNewUserConfirmPassword("");
                    setNewUserRole("social_worker");
                    setAddUserError("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleAddUser}
                  disabled={savingSection === "staff"}
                >
                  {savingSection === "staff" ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Add user
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="modal-user-name">
                  Full name
                </label>
                <Input
                  id="modal-user-name"
                  placeholder="e.g. Maria Santos"
                  value={newUserName}
                  onChange={(e) => { setNewUserName(e.target.value); setAddUserError(""); }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="modal-user-email">
                  Email address
                </label>
                <Input
                  id="modal-user-email"
                  type="email"
                  placeholder="e.g. maria@omswd.gov"
                  value={newUserEmail}
                  onChange={(e) => { setNewUserEmail(e.target.value); setAddUserError(""); }}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="modal-user-password">
                  Password
                </label>
                <Input
                  id="modal-user-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={newUserPassword}
                  onChange={(e) => { setNewUserPassword(e.target.value); setAddUserError(""); }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="modal-user-confirm-password">
                  Confirm password
                </label>
                <Input
                  id="modal-user-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  value={newUserConfirmPassword}
                  onChange={(e) => { setNewUserConfirmPassword(e.target.value); setAddUserError(""); }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="modal-user-role">
                Role
              </label>
              <Select
                id="modal-user-role"
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as StaffRole)}
              >
                <option value="admin">Administrator</option>
                <option value="social_worker">Staff</option>
              </Select>
            </div>
            {addUserError ? (
              <p className="text-sm font-medium text-destructive">{addUserError}</p>
            ) : null}
          </div>
        </Modal>

        {/* Edit User Modal */}
        <Modal
          open={editingUser !== null}
          onClose={() => setEditingUser(null)}
          title="Edit user"
          description={editingUser ? `Update details for ${editingUser.email}` : ""}
          footer={
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Leave password fields blank to keep the current password.
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button type="button" onClick={() => void handleEditUser()} disabled={savingSection === "staff"}>
                  {savingSection === "staff" ? (
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
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="edit-user-name">Full name</label>
              <Input
                id="edit-user-name"
                placeholder="e.g. Maria Santos"
                value={editName}
                onChange={(e) => { setEditName(e.target.value); setEditUserError(""); }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="edit-user-role">Role</label>
              <Select
                id="edit-user-role"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as StaffRole)}
              >
                <option value="admin">Administrator</option>
                <option value="social_worker">Staff</option>
              </Select>
            </div>
            <div className="rounded-xl border border-[var(--portal-outline)] bg-[var(--portal-surface-soft)] px-4 py-3 text-xs text-[var(--portal-muted)]">
              Fill in the fields below only if you want to change this user's password.
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="edit-user-password">New password</label>
                <Input
                  id="edit-user-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={editPassword}
                  onChange={(e) => { setEditPassword(e.target.value); setEditUserError(""); }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="edit-user-confirm-password">Confirm new password</label>
                <Input
                  id="edit-user-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-enter new password"
                  value={editConfirmPassword}
                  onChange={(e) => { setEditConfirmPassword(e.target.value); setEditUserError(""); }}
                />
              </div>
            </div>
            {editUserError ? (
              <p className="text-sm font-medium text-destructive">{editUserError}</p>
            ) : null}
          </div>
        </Modal>

        <Modal
          open={programEditorOpen}
          onClose={() => setProgramEditorOpen(false)}
          title={editingProgram ? "Edit program" : "Add program"}
          description="Program details and required attachments are shown to residents during application submission."
          size="xl"
          footer={
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Changes update the active resident application workflow.
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setProgramEditorOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveProgramForm}
                  disabled={savingSection === "program"}
                >
                  {savingSection === "program" ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save program
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-5">
            <ProgramEditorFields
              form={programForm}
              onChange={updateProgramForm}
              onRequirementChange={updateRequirementDraft}
              onAddRequirement={addRequirementDraft}
              onRemoveRequirement={removeRequirementDraft}
            />
            {programFormError ? (
              <p className="text-sm font-medium text-destructive">{programFormError}</p>
            ) : null}
          </div>
        </Modal>
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
  "staff.created": { label: "Staff created", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
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
  if (action === "staff.created" && metadata.email) {
    return String(metadata.email);
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

function ProgramStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em]",
        isActive
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-slate-200 bg-slate-50 text-slate-600",
      ].join(" ")}
    >
      {isActive ? "Enabled" : "Disabled"}
    </span>
  );
}

function ProgramEditorFields({
  form,
  onChange,
  onRequirementChange,
  onAddRequirement,
  onRemoveRequirement,
}: {
  form: ProgramFormState;
  onChange: <K extends keyof ProgramFormState>(key: K, value: ProgramFormState[K]) => void;
  onRequirementChange: (index: number, patch: Partial<RequirementDraft>) => void;
  onAddRequirement: () => void;
  onRemoveRequirement: (index: number) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <FieldGroup label="Program code" htmlFor="program-code">
          <Input
            id="program-code"
            value={form.code}
            onChange={(event) => onChange("code", event.target.value)}
            placeholder="e.g. AICS"
          />
        </FieldGroup>
        <FieldGroup label="Program name" htmlFor="program-name">
          <Input
            id="program-name"
            value={form.name}
            onChange={(event) => onChange("name", event.target.value)}
            placeholder="e.g. Assistance to Individuals in Crisis Situation"
          />
        </FieldGroup>
        <FieldGroup label="Support type" htmlFor="program-support-type">
          <Input
            id="program-support-type"
            value={form.supportType}
            onChange={(event) => onChange("supportType", event.target.value)}
            placeholder="e.g. Emergency Assistance"
          />
        </FieldGroup>
        <FieldGroup label="Processing days" htmlFor="program-processing-days">
          <Input
            id="program-processing-days"
            type="number"
            min="0"
            value={form.estimatedProcessingDays}
            onChange={(event) => onChange("estimatedProcessingDays", event.target.value)}
            placeholder="e.g. 7"
          />
        </FieldGroup>
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground" htmlFor="program-description">
            Description
          </label>
          <Textarea
            id="program-description"
            value={form.description}
            onChange={(event) => onChange("description", event.target.value)}
            placeholder="Short description residents and reviewers can recognize."
            className="min-h-[80px]"
          />
        </div>
      </div>

      <label className="flex items-center justify-between gap-4 rounded-xl border bg-muted/20 px-4 py-3">
        <span>
          <span className="block text-sm font-semibold">Program visibility</span>
          <span className="block text-xs text-muted-foreground">
            Enabled programs can be selected in resident applications.
          </span>
        </span>
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(event) => onChange("isActive", event.target.checked)}
          className="h-5 w-5"
        />
      </label>

      <div className="space-y-3 rounded-xl border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Requirements
            </p>
            <h3 className="mt-1 text-lg font-semibold">Required attachments</h3>
          </div>
          <Button type="button" onClick={onAddRequirement}>
            <PlusCircle className="h-4 w-4" />
            Add requirement
          </Button>
        </div>

        <div className="space-y-4">
          {form.requirements.map((requirement, index) => (
            <div key={index} className="rounded-xl border bg-background p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FieldGroup label="Document label" htmlFor={`requirement-${index}-name`}>
                  <Input
                    id={`requirement-${index}-name`}
                    value={requirement.name}
                    onChange={(event) =>
                      onRequirementChange(index, { name: event.target.value })
                    }
                    placeholder="e.g. Medical abstract"
                  />
                </FieldGroup>
                <FieldGroup label="Document type" htmlFor={`requirement-${index}-type`}>
                  <Input
                    id={`requirement-${index}-type`}
                    value={requirement.documentType ?? ""}
                    onChange={(event) =>
                      onRequirementChange(index, { documentType: event.target.value || null })
                    }
                    placeholder="e.g. medical_certificate"
                  />
                </FieldGroup>
                <div className="space-y-2 md:col-span-2">
                  <label
                    className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
                    htmlFor={`requirement-${index}-description`}
                  >
                    Description
                  </label>
                  <Textarea
                    id={`requirement-${index}-description`}
                    value={requirement.description ?? ""}
                    onChange={(event) =>
                      onRequirementChange(index, { description: event.target.value || null })
                    }
                    placeholder="Reviewer note or resident-facing detail."
                    className="min-h-[64px]"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={requirement.isRequired}
                    onChange={(event) =>
                      onRequirementChange(index, { isRequired: event.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  Required
                </label>
                <div className="flex items-center gap-3">
                  <span className="rounded-full border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Requirement {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={form.requirements.length === 1}
                    onClick={() => onRemoveRequirement(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FieldGroup({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label
        className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
        htmlFor={htmlFor}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
