import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Search, Send, UserMinus, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";

import {
  getAdminResidents,
  setResidentAccountState,
  verifyResident,
} from "@/services/admin-service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RowActions } from "@/components/ui/row-actions";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminResidentRecord } from "@/types/admin";

export function AdminResidentsPage() {
  const residentsQuery = useQuery({
    queryKey: ["admin", "residents"],
    queryFn: getAdminResidents,
  });

  const residents = residentsQuery.data ?? [];
  const [searchTerm, setSearchTerm] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [selectedResidentId, setSelectedResidentId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const filteredResidents = useMemo(() => {
    return residents.filter((resident) => {
      const matchesSearch =
        resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resident.barangay.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resident.contact.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesVerification =
        verificationFilter === "all" || resident.status.toLowerCase() === verificationFilter;

      return matchesSearch && matchesVerification;
    });
  }, [residents, searchTerm, verificationFilter]);

  useEffect(() => {
    if (!selectedResidentId && filteredResidents[0]?.id) {
      setSelectedResidentId(filteredResidents[0].id);
    }
  }, [filteredResidents, selectedResidentId]);

  const selectedResident =
    residents.find((resident) => resident.id === selectedResidentId) ?? filteredResidents[0] ?? null;

  async function handleVerifyResident(resident: AdminResidentRecord) {
    try {
      setIsSaving(true);
      setSelectedResidentId(resident.id);
      await verifyResident(resident.id);
      await residentsQuery.refetch();
      toast.success("Resident marked as verified.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to verify resident.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleAccount(resident: AdminResidentRecord) {
    try {
      setIsSaving(true);
      setSelectedResidentId(resident.id);
      await setResidentAccountState(resident.profileId, resident.account !== "Active");
      await residentsQuery.refetch();
      toast.success(
        resident.account === "Active"
          ? "Resident account suspended."
          : "Resident account reactivated.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update account state.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-primary/72">Residents</p>
          <h1 className="mt-2 font-serif text-4xl font-bold">Resident registry and verification</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Search resident records, review verification state, and manage account access
            from one cleaner registry view.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search name, barangay, or contact"
              className="pl-11"
            />
          </div>
          <Select
            value={verificationFilter}
            onChange={(event) => setVerificationFilter(event.target.value)}
          >
            <option value="all">All residents</option>
            <option value="verified">Verified</option>
            <option value="pending verification">Pending verification</option>
          </Select>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-2xl">Resident records</CardTitle>
            <CardDescription>
              Scan registry entries in a denser table and use the action menu for account operations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Resident</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Barangay</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Requests</TableHead>
                  <TableHead className="w-[72px] text-right">Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {residentsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      Loading resident records...
                    </TableCell>
                  </TableRow>
                ) : filteredResidents.length > 0 ? (
                  filteredResidents.map((resident) => (
                    <TableRow
                      key={resident.id}
                      data-selected={selectedResident?.id === resident.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedResidentId(resident.id)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-semibold">{resident.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">Resident profile</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={resident.status === "Verified" ? "secondary" : "outline"}>
                          {resident.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{resident.barangay}</TableCell>
                      <TableCell className="text-muted-foreground">{resident.account}</TableCell>
                      <TableCell className="text-muted-foreground">{resident.contact}</TableCell>
                      <TableCell className="font-semibold text-primary">{resident.referenceCount}</TableCell>
                      <TableCell className="text-right">
                        <RowActions
                          actions={[
                            {
                              label: "View details",
                              icon: <Eye className="h-4 w-4" />,
                              onSelect: () => setSelectedResidentId(resident.id),
                            },
                            {
                              label: "Verify resident",
                              icon: <UserRoundCheck className="h-4 w-4" />,
                              disabled: isSaving || resident.status === "Verified",
                              onSelect: () => void handleVerifyResident(resident),
                            },
                            {
                              label: resident.account === "Active" ? "Suspend account" : "Reactivate account",
                              icon: <UserMinus className="h-4 w-4" />,
                              disabled: isSaving,
                              onSelect: () => void handleToggleAccount(resident),
                            },
                            {
                              label: "Send follow-up",
                              icon: <Send className="h-4 w-4" />,
                              onSelect: () => {
                                setSelectedResidentId(resident.id);
                                toast.success("Verification follow-up reminder sent.");
                              },
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      No residents matched the current search and verification filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-2xl">Selected resident</CardTitle>
            <CardDescription>
              Review the selected profile. Row-level actions are available from the table menu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {selectedResident ? (
              <>
                <div className="rounded-3xl border border-primary/10 bg-muted/25 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xl font-semibold">{selectedResident.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedResident.barangay} | {selectedResident.contact}
                      </p>
                    </div>
                    <Badge variant={selectedResident.status === "Verified" ? "secondary" : "outline"}>
                      {selectedResident.status}
                    </Badge>
                  </div>
                  <div className="mt-4 space-y-3 rounded-2xl bg-white px-4 py-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/72">
                        Account
                      </p>
                      <p className="text-right font-semibold">{selectedResident.account}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/72">
                        Barangay
                      </p>
                      <p className="text-right font-semibold">{selectedResident.barangay}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/72">
                        Requests
                      </p>
                      <p className="text-right font-semibold">{selectedResident.referenceCount}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    Use the action menu on the selected resident&apos;s row to verify the account,
                    suspend or reactivate access, send a follow-up, or open the record for review.
                  </p>
                </div>
              </>
            ) : (
              <div className="rounded-3xl border border-primary/10 bg-muted/25 px-5 py-8 text-center text-muted-foreground">
                No resident is currently selected.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
