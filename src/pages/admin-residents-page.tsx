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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
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
  const [activeResidentId, setActiveResidentId] = useState<string | null>(null);
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
    if (activeResidentId && !residents.some((resident) => resident.id === activeResidentId)) {
      setActiveResidentId(null);
    }
  }, [activeResidentId, residents]);

  const selectedResident = useMemo(
    () =>
      activeResidentId ? residents.find((resident) => resident.id === activeResidentId) ?? null : null,
    [activeResidentId, residents],
  );

  const verifiedCount = residents.filter((resident) => resident.status === "Verified").length;
  const activeAccounts = residents.filter((resident) => resident.account === "Active").length;

  async function handleVerifyResident(resident: AdminResidentRecord) {
    try {
      setIsSaving(true);
      setActiveResidentId(resident.id);
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
      setActiveResidentId(resident.id);
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

  function openResidentModal(residentId: string) {
    setActiveResidentId(residentId);
  }

  function closeResidentModal() {
    setActiveResidentId(null);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Residents
        </p>
        <h1 className="text-3xl font-semibold">Resident registry and verification</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Search resident profiles, verify records, and manage account access from one place.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total residents" value={String(residents.length)} />
        <SummaryCard label="Verified" value={String(verifiedCount)} />
        <SummaryCard label="Active accounts" value={String(activeAccounts)} />
        <SummaryCard label="Suspended" value={String(residents.length - activeAccounts)} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Registry filters</CardTitle>
          <CardDescription>Find resident records quickly by name, barangay, or contact.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search name, barangay, or contact"
              className="pl-9"
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resident table</CardTitle>
          <CardDescription>
            Responsive list with modal-based account actions for a cleaner registry view.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>{filteredResidents.length} resident(s) shown</p>
            <p>Tap or click a row to open the resident modal</p>
          </div>

          {residentsQuery.isLoading ? (
            <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
              Loading resident records...
            </div>
          ) : filteredResidents.length > 0 ? (
            <>
              <div className="grid gap-3 md:hidden">
                {filteredResidents.map((resident) => (
                  <button
                    key={resident.id}
                    type="button"
                    className="rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/20"
                    onClick={() => openResidentModal(resident.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-foreground">{resident.name}</p>
                        <p className="mt-1 truncate text-sm text-muted-foreground">{resident.contact}</p>
                      </div>
                      <Badge variant={resident.status === "Verified" ? "secondary" : "outline"}>
                        {resident.status}
                      </Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <DetailRow label="Barangay" value={resident.barangay} />
                      <DetailRow label="Account" value={resident.account} />
                      <DetailRow label="Requests" value={String(resident.referenceCount)} />
                      <DetailRow label="Status" value={resident.status} />
                    </div>
                  </button>
                ))}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <tr>
                      <TableHead>Resident</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Barangay</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Requests</TableHead>
                      <TableHead className="w-[70px] text-right">Actions</TableHead>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {filteredResidents.map((resident) => (
                      <TableRow
                        key={resident.id}
                        data-selected={selectedResident?.id === resident.id}
                        className="cursor-pointer"
                        onClick={() => openResidentModal(resident.id)}
                      >
                        <TableCell className="font-medium">{resident.name}</TableCell>
                        <TableCell>
                          <Badge variant={resident.status === "Verified" ? "secondary" : "outline"}>
                            {resident.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{resident.barangay}</TableCell>
                        <TableCell>{resident.account}</TableCell>
                        <TableCell>{resident.contact}</TableCell>
                        <TableCell className="font-medium text-primary">
                          {resident.referenceCount}
                        </TableCell>
                        <TableCell className="text-right">
                          <RowActions
                            actions={[
                              {
                                label: "Manage resident",
                                icon: <Eye className="h-4 w-4" />,
                                onSelect: () => openResidentModal(resident.id),
                              },
                              {
                                label: "Quick verify",
                                icon: <UserRoundCheck className="h-4 w-4" />,
                                disabled: isSaving || resident.status === "Verified",
                                onSelect: () => void handleVerifyResident(resident),
                              },
                            ]}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
              No residents matched the current filters.
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={selectedResident !== null}
        onClose={closeResidentModal}
        title="Resident management"
        description="Review profile status and run verification or account actions."
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeResidentModal}>
              Close
            </Button>
          </div>
        }
      >
        {selectedResident ? (
          <div className="space-y-5">
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{selectedResident.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedResident.contact}</p>
                </div>
                <Badge variant={selectedResident.status === "Verified" ? "secondary" : "outline"}>
                  {selectedResident.status}
                </Badge>
              </div>
              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                <DetailRow label="Barangay" value={selectedResident.barangay} />
                <DetailRow label="Account" value={selectedResident.account} />
                <DetailRow label="Linked requests" value={String(selectedResident.referenceCount)} />
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <Button
                type="button"
                disabled={isSaving || selectedResident.status === "Verified"}
                onClick={() => void handleVerifyResident(selectedResident)}
              >
                <UserRoundCheck className="h-4 w-4" />
                Verify resident
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={() => void handleToggleAccount(selectedResident)}
              >
                <UserMinus className="h-4 w-4" />
                {selectedResident.account === "Active" ? "Suspend account" : "Reactivate account"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => toast.success("Verification follow-up reminder sent.")}
              >
                <Send className="h-4 w-4" />
                Send follow-up
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
}
