import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Eye,
  FileSearch,
  MessageSquareText,
  Search,
  UserRoundCog,
} from "lucide-react";
import { toast } from "sonner";

import {
  getAdminApplications,
  saveAdminApplicationRemarks,
  updateAdminApplicationStatus,
} from "@/services/admin-service";
import type { AdminApplicationRecord } from "@/types/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RowActions } from "@/components/ui/row-actions";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

function getStatusBadgeVariant(status: AdminApplicationRecord["status"]) {
  if (status === "Approved" || status === "Completed") {
    return "secondary";
  }

  return "outline";
}

export function AdminApplicationsPage() {
  const applicationsQuery = useQuery({
    queryKey: ["admin", "applications"],
    queryFn: getAdminApplications,
  });

  const applications = applicationsQuery.data ?? [];
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReference, setSelectedReference] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const remarksRef = useRef<HTMLTextAreaElement>(null);

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const matchesSearch =
        application.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        application.resident.toLowerCase().includes(searchTerm.toLowerCase()) ||
        application.assistance.toLowerCase().includes(searchTerm.toLowerCase()) ||
        application.barangay.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || application.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  useEffect(() => {
    if (!selectedReference && filteredApplications[0]?.reference) {
      setSelectedReference(filteredApplications[0].reference);
    }
  }, [filteredApplications, selectedReference]);

  const selectedApplication =
    applications.find((application) => application.reference === selectedReference) ??
    filteredApplications[0] ??
    null;

  useEffect(() => {
    if (selectedApplication) {
      setNoteDraft(selectedApplication.remarks);
    }
  }, [selectedApplication]);

  async function handleStatusUpdate(
    application: AdminApplicationRecord,
    status: AdminApplicationRecord["status"],
  ) {
    try {
      setIsSaving(true);
      setSelectedReference(application.reference);
      await updateAdminApplicationStatus(
        application.id,
        status,
        selectedApplication?.id === application.id ? noteDraft : application.remarks,
      );
      await applicationsQuery.refetch();
      toast.success(`Application updated to ${status}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update application.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveRemarks() {
    if (!selectedApplication) {
      return;
    }

    try {
      setIsSaving(true);
      await saveAdminApplicationRemarks(selectedApplication.id, noteDraft);
      await applicationsQuery.refetch();
      toast.success("Case remarks saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save remarks.");
    } finally {
      setIsSaving(false);
    }
  }

  function focusRemarksEditor(reference: string) {
    setSelectedReference(reference);

    window.requestAnimationFrame(() => {
      remarksRef.current?.focus();
      remarksRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-primary/72">Applications</p>
          <h1 className="mt-2 font-serif text-4xl font-bold">Review queue and case management</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Monitor active cases, filter the review queue, update application status, and
            save case remarks from one page.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search reference, resident, service, or barangay"
              className="pl-11"
            />
          </div>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending verification">Pending verification</option>
            <option value="under review">Under review</option>
            <option value="for correction">For correction</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
          </Select>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-2xl">Current application queue</CardTitle>
            <CardDescription>
              Review cases in a denser table layout and use the action menu for status changes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Reference</TableHead>
                  <TableHead>Resident</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Barangay</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="w-[72px] text-right">Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {applicationsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      Loading application records...
                    </TableCell>
                  </TableRow>
                ) : filteredApplications.length > 0 ? (
                  filteredApplications.map((application) => (
                    <TableRow
                      key={application.reference}
                      data-selected={selectedApplication?.reference === application.reference}
                      className="cursor-pointer"
                      onClick={() => setSelectedReference(application.reference)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-semibold text-primary">{application.reference}</p>
                          <p className="mt-1 text-xs text-muted-foreground">Case reference</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{application.resident}</TableCell>
                      <TableCell className="text-muted-foreground">{application.assistance}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(application.status)}>
                          {application.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{application.barangay}</TableCell>
                      <TableCell className="text-muted-foreground">{application.submittedAt}</TableCell>
                      <TableCell>
                        <Badge variant={application.priority === "Urgent" ? "secondary" : "outline"}>
                          {application.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <RowActions
                          actions={[
                            {
                              label: "View details",
                              icon: <Eye className="h-4 w-4" />,
                              onSelect: () => setSelectedReference(application.reference),
                            },
                            {
                              label: "Remarks",
                              icon: <MessageSquareText className="h-4 w-4" />,
                              onSelect: () => focusRemarksEditor(application.reference),
                            },
                            {
                              label: "Mark under review",
                              icon: <FileSearch className="h-4 w-4" />,
                              disabled: isSaving,
                              onSelect: () => void handleStatusUpdate(application, "Under review"),
                            },
                            {
                              label: "Request correction",
                              icon: <UserRoundCog className="h-4 w-4" />,
                              disabled: isSaving,
                              onSelect: () => void handleStatusUpdate(application, "For correction"),
                            },
                            {
                              label: "Approve case",
                              icon: <CheckCircle2 className="h-4 w-4" />,
                              disabled: isSaving,
                              onSelect: () => void handleStatusUpdate(application, "Approved"),
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      No applications matched the current search and filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-2xl">Case details</CardTitle>
            <CardDescription>
              Review the selected record and save remarks. Status actions are available in the table menu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {selectedApplication ? (
              <>
                <div className="rounded-3xl border border-primary/10 bg-muted/25 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/72">
                        {selectedApplication.reference}
                      </p>
                      <p className="mt-2 text-xl font-semibold">{selectedApplication.resident}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedApplication.assistance} | {selectedApplication.barangay}
                      </p>
                    </div>
                    <Badge variant={selectedApplication.priority === "Urgent" ? "secondary" : "outline"}>
                      {selectedApplication.priority}
                    </Badge>
                  </div>
                  <div className="mt-4 space-y-3 rounded-2xl bg-white px-4 py-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/72">
                        Status
                      </p>
                      <Badge variant={getStatusBadgeVariant(selectedApplication.status)}>
                        {selectedApplication.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <p className="font-semibold text-primary/72">Submitted</p>
                      <p className="text-right font-medium text-muted-foreground">
                        {selectedApplication.submittedAt}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <p className="font-semibold text-primary/72">Barangay</p>
                      <p className="text-right font-medium text-muted-foreground">
                        {selectedApplication.barangay}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-primary" htmlFor="case-remarks">
                    Review remarks
                  </label>
                  <Textarea
                    id="case-remarks"
                    ref={remarksRef}
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    placeholder="Add the latest reviewer notes or follow-up remarks."
                    className="min-h-[170px]"
                  />
                  <Button onClick={handleSaveRemarks} disabled={isSaving}>
                    Save remarks
                  </Button>
                </div>
              </>
            ) : (
              <div className="rounded-3xl border border-primary/10 bg-muted/25 px-5 py-8 text-center text-muted-foreground">
                No application is currently selected.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
