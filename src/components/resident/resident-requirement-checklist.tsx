import { Eye, LoaderCircle, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ResidentRequirement, ResidentUploadedDocument } from "@/types/resident";

interface ResidentRequirementChecklistProps {
  requirements: ResidentRequirement[];
  viewingDocumentId: string | null;
  onViewDocument: (document: ResidentUploadedDocument) => void;
  onResubmit: (requirementId: string) => void;
}

export function ResidentRequirementChecklist({
  requirements, viewingDocumentId, onViewDocument, onResubmit,
}: ResidentRequirementChecklistProps) {
  if (requirements.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No requirements are linked yet.</p>;
  }

  const groups = requirements.reduce<Record<string, ResidentRequirement[]>>((result, requirement) => {
    (result[requirement.name] ??= []).push(requirement);
    return result;
  }, {});

  return (
    <Table className="min-w-[720px] table-fixed" aria-label="Requirement checklist">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[34%]">Document</TableHead>
          <TableHead className="w-[20%]">Status</TableHead>
          <TableHead className="w-[26%]">Uploaded files</TableHead>
          <TableHead className="w-[20%] text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      {Object.entries(groups).map(([name, items]) => (
        <TableBody key={name}>
          <TableRow className="bg-[var(--portal-surface-soft)]">
            <TableHead colSpan={4} scope="rowgroup" className="h-auto py-3 text-sm normal-case tracking-normal text-[var(--portal-ink)]">
              {name}
              <span className="ml-2 font-normal text-[var(--portal-muted)]">({items.length} item{items.length === 1 ? "" : "s"})</span>
            </TableHead>
          </TableRow>
          {items.map((requirement) => {
            const needsResubmit = ["rejected", "needs_resubmission"].includes(requirement.status);
            return (
              <TableRow key={requirement.id} className={needsResubmit ? "bg-yellow-50" : undefined}>
                <TableCell className="align-top [overflow-wrap:anywhere]">
                  <p className="font-medium text-[var(--portal-ink)]">{requirement.description || requirement.documentType || "Supporting document"}</p>
                  <p className="mt-1 text-xs text-[var(--portal-muted)]">{requirement.isRequired ? "Required" : "Optional"}</p>
                  {requirement.reviewedAtLabel && <p className="mt-1 text-xs text-[var(--portal-muted)]">Reviewed {requirement.reviewedAtLabel}</p>}
                  {requirement.remarks && <p className="mt-2 text-sm text-yellow-800">Staff note: {requirement.remarks}</p>}
                </TableCell>
                <TableCell className="align-top">
                  <Badge className="max-w-full whitespace-normal" variant={requirement.status === "approved" ? "secondary" : requirement.status === "submitted" ? "default" : "outline"}>
                    {requirement.statusLabel}
                  </Badge>
                </TableCell>
                <TableCell className="align-top">
                  {requirement.documents.length ? (
                    <div className="space-y-2">
                      {requirement.documents.map((document) => (
                        <Button
                          key={document.id}
                          variant="outline"
                          size="sm"
                          className="h-auto w-full justify-start gap-2 py-2 text-left"
                          disabled={viewingDocumentId !== null}
                          aria-label={`View ${document.fileName}`}
                          onClick={() => onViewDocument(document)}
                        >
                          {viewingDocumentId === document.id ? <LoaderCircle className="h-3.5 w-3.5 shrink-0 animate-spin" /> : <Eye className="h-3.5 w-3.5 shrink-0" />}
                          <span className="min-w-0 whitespace-normal [overflow-wrap:anywhere]">{document.fileName}</span>
                        </Button>
                      ))}
                    </div>
                  ) : <span className="text-xs text-[var(--portal-muted)]">No files uploaded</span>}
                </TableCell>
                <TableCell className="text-right align-top">
                  {needsResubmit && (
                    <Button size="sm" className="bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]" onClick={() => onResubmit(requirement.id)}>
                      <Upload className="h-3 w-3" /> Resubmit
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      ))}
    </Table>
  );
}
