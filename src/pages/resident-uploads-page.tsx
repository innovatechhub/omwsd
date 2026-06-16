import { useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Eye, FileText, Info, LoaderCircle, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { DocumentDropzone } from "@/components/forms/document-dropzone";
import { ResidentPageHeader } from "@/components/resident/resident-page-header";
import { ResidentStateCard } from "@/components/resident/resident-state-card";
import { ResidentTableSkeleton } from "@/components/resident/resident-table-skeleton";
import { FileViewerModal } from "@/components/ui/file-viewer-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { useResidentPortal } from "@/hooks/use-resident-portal";
import { queryKeys } from "@/lib/query-keys";
import { uploadResidentFollowUpDocuments } from "@/services/resident-service";
import { createSignedFileUrl } from "@/services/storage-service";
import type { ResidentUploadedDocument } from "@/types/resident";

export function ResidentUploadsPage() {
  const [searchParams] = useSearchParams();
  const preselectedRequirementId = searchParams.get("requirement") ?? "";

  const [files, setFiles] = useState<File[]>([]);
  const [selectedRequirementId, setSelectedRequirementId] = useState(preselectedRequirementId);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingDocumentId, setViewingDocumentId] = useState<string | null>(null);
  const [fileViewerUrl, setFileViewerUrl] = useState<string | null>(null);
  const [fileViewerTitle, setFileViewerTitle] = useState<string>("Document");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const portalQuery = useResidentPortal();
  const application = portalQuery.data?.application ?? null;
  const openRequirements =
    application?.requirements.filter((requirement) =>
      ["pending", "rejected", "needs_resubmission"].includes(requirement.status),
    ) ?? [];

  useEffect(() => {
    if (preselectedRequirementId) {
      setSelectedRequirementId(preselectedRequirementId);
    }
  }, [preselectedRequirementId]);

  async function handleUpload() {
    if (!application) {
      return;
    }

    try {
      setIsUploading(true);
      await uploadResidentFollowUpDocuments({
        applicationId: application.id,
        residentId: application.residentId,
        referenceNumber: application.referenceNumber,
        files,
        applicationRequirementId: selectedRequirementId || undefined,
      });
      await queryClient.invalidateQueries({
        queryKey: user ? queryKeys.resident.portal(user.id) : ["resident", "portal"],
      });
      const count = files.length;
      setFiles([]);
      setSelectedRequirementId("");
      toast.success(
        `${count} file${count === 1 ? "" : "s"} uploaded successfully.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload files.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleViewDocument(document: ResidentUploadedDocument) {
    try {
      setViewingDocumentId(document.id);
      const signedUrl = await createSignedFileUrl(document.bucket, document.filePath);
      setFileViewerTitle(document.fileName ?? "Document");
      setFileViewerUrl(signedUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to open this file.");
    } finally {
      setViewingDocumentId((current) => (current === document.id ? null : current));
    }
  }

  if (portalQuery.isLoading) {
    return <ResidentUploadLoadingState />;
  }

  if (portalQuery.error instanceof Error) {
    return <ResidentStateCard message={portalQuery.error.message} />;
  }

  return (
    <div className="space-y-6">
      <ResidentPageHeader
        eyebrow="Upload Requirements"
        title="Document submission center"
        description="Attach follow-up files to your current case and keep requirement reviews moving."
        chips={["Requirement Uploads", "Review Follow-up"]}
      />

      <Card className="portal-card border-[var(--portal-outline)] shadow-none">
        <CardHeader>
          <CardTitle>Supporting requirements</CardTitle>
          <CardDescription>
            Upload follow-up files and link them to your current application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {application ? (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <InfoTile icon={ShieldCheck} label="Reference" value={application.referenceNumber} />
                <InfoTile icon={FileText} label="Service" value={application.assistanceName} />
                <InfoTile icon={BadgeCheck} label="Status" value={application.statusLabel} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--portal-ink)]" htmlFor="requirement">
                  Link this upload to a requirement
                </label>
                <Select
                  id="requirement"
                  value={selectedRequirementId}
                  onChange={(event) => setSelectedRequirementId(event.target.value)}
                >
                  <option value="">General supporting document</option>
                  {openRequirements.map((requirement) => (
                    <option key={requirement.id} value={requirement.id}>
                      {requirement.name} ({requirement.statusLabel})
                    </option>
                  ))}
                </Select>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  <div className="space-y-1 text-sm text-blue-800">
                    <p className="font-semibold">Upload guidelines</p>
                    <ul className="list-inside list-disc space-y-0.5 text-xs text-blue-700">
                      <li>Accepted formats: PDF, JPG, PNG, HEIC</li>
                      <li>Maximum file size: 10 MB per file</li>
                      <li>Clear, readable scans are required for verification</li>
                      {selectedRequirementId && (() => {
                        const req = openRequirements.find((r) => r.id === selectedRequirementId);
                        return req?.description ? (
                          <li>For <strong>{req.name}</strong>: {req.description}</li>
                        ) : null;
                      })()}
                    </ul>
                  </div>
                </div>
              </div>

              <DocumentDropzone
                label="Upload additional files"
                description="Files uploaded here will be saved in your application records."
                files={files}
                onChange={setFiles}
              />

              {files.length > 0 && (
                <div className="rounded-lg border border-[var(--portal-outline)] bg-[var(--portal-surface-soft)] px-4 py-3 text-sm text-[var(--portal-ink)]">
                  <span className="font-semibold">{files.length}</span> file{files.length === 1 ? "" : "s"} selected for upload:{" "}
                  {files.map((f) => f.name).join(", ")}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[var(--portal-muted)]">
                  {application.documents.length} file
                  {application.documents.length === 1 ? "" : "s"} currently attached.
                </p>
                <Button
                  type="button"
                  onClick={() => void handleUpload()}
                  disabled={files.length === 0 || isUploading}
                  className="bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]"
                >
                  {isUploading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  Upload files
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="w-[90px] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {application.documents.length > 0 ? (
                    application.documents.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell className="font-medium text-[var(--portal-ink)]">{document.fileName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{document.statusLabel}</Badge>
                        </TableCell>
                        <TableCell>{document.createdAtLabel}</TableCell>
                        <TableCell className="text-[var(--portal-muted)]">
                          {document.remarks ?? "No remarks were added for this file yet."}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-[var(--portal-outline)] bg-white hover:bg-[var(--portal-surface-soft)]"
                            onClick={() => void handleViewDocument(document)}
                            disabled={viewingDocumentId === document.id}
                          >
                            {viewingDocumentId === document.id ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-[var(--portal-muted)]">
                        No follow-up documents have been uploaded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </>
          ) : (
            <div className="space-y-4">
              <div className="portal-empty-state px-4 py-4 text-sm text-[var(--portal-muted)]">
                No current application is linked to this account. Uploads are available after
                your first submission.
              </div>
              <Button
                asChild
                className="bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]"
              >
                <Link to="/resident/application?request=1">Submit a request first</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <FileViewerModal
        open={fileViewerUrl !== null}
        url={fileViewerUrl}
        title={fileViewerTitle}
        onClose={() => setFileViewerUrl(null)}
      />
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
}) {
  return (
    <div className="portal-metric-card flex items-center gap-3 px-3 py-3 text-sm">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white">
        <Icon className="h-4 w-4 text-[var(--portal-accent)]" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--portal-muted)]">
          {label}
        </p>
        <p className="font-medium text-[var(--portal-ink)]">{value}</p>
      </div>
    </div>
  );
}

function ResidentUploadLoadingState() {
  return (
    <div className="space-y-6">
      <ResidentPageHeader
        eyebrow="Upload Requirements"
        title="Document submission center"
        description="Loading your upload center..."
        chips={["Requirement Uploads", "Review Follow-up"]}
      />
      <Card className="portal-card border-[var(--portal-outline)] shadow-none">
        <CardHeader>
          <CardTitle>Supporting requirements</CardTitle>
          <CardDescription>Preparing your upload context and linked requirements.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="portal-metric-card space-y-3 px-3 py-3">
                <div className="h-3 w-1/2 animate-pulse rounded-full bg-[rgba(214,222,234,0.9)]" />
                <div className="h-4 w-4/5 animate-pulse rounded-full bg-[rgba(214,222,234,0.8)]" />
              </div>
            ))}
          </div>
          <div className="portal-empty-state p-5">
            <div className="h-3 w-1/3 animate-pulse rounded-full bg-[rgba(214,222,234,0.9)]" />
            <div className="mt-3 h-3 w-2/3 animate-pulse rounded-full bg-[rgba(214,222,234,0.75)]" />
          </div>
        </CardContent>
      </Card>
      <ResidentTableSkeleton title="Loading uploaded documents" columns={5} rows={5} />
    </div>
  );
}
