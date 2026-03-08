import { useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Eye, FileText, LoaderCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { DocumentDropzone } from "@/components/forms/document-dropzone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useResidentPortal } from "@/hooks/use-resident-portal";
import { queryKeys } from "@/lib/query-keys";
import { uploadResidentFollowUpDocuments } from "@/services/resident-service";
import { createSignedFileUrl } from "@/services/storage-service";
import type { ResidentUploadedDocument } from "@/types/resident";

export function ResidentUploadsPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedRequirementId, setSelectedRequirementId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [viewingDocumentId, setViewingDocumentId] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const portalQuery = useResidentPortal();
  const application = portalQuery.data?.application ?? null;
  const openRequirements =
    application?.requirements.filter((requirement) =>
      ["pending", "rejected", "needs_resubmission"].includes(requirement.status),
    ) ?? [];

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
      setFiles([]);
      setSelectedRequirementId("");
      toast.success("Documents uploaded to your resident application.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload files.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleViewDocument(document: ResidentUploadedDocument) {
    const viewer = window.open("", "_blank", "noopener,noreferrer");

    try {
      setViewingDocumentId(document.id);
      const signedUrl = await createSignedFileUrl(document.bucket, document.filePath);

      if (viewer) {
        viewer.location.href = signedUrl;
        return;
      }

      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      viewer?.close();
      toast.error(error instanceof Error ? error.message : "Unable to open this file.");
    } finally {
      setViewingDocumentId((current) => (current === document.id ? null : current));
    }
  }

  if (portalQuery.isLoading) {
    return <ResidentUploadState message="Loading your upload center..." />;
  }

  if (portalQuery.error instanceof Error) {
    return <ResidentUploadState message={portalQuery.error.message} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Upload Requirements
        </p>
        <h1 className="mt-2 font-serif text-4xl font-bold">Document submission center</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supporting requirements</CardTitle>
          <CardDescription>
            Additional files here are attached to your current application in Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {application ? (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="flex items-center gap-3 rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <span>{application.referenceNumber}</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span>{application.assistanceName}</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                    <BadgeCheck className="h-5 w-5" />
                  </div>
                  <span>{application.statusLabel}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="requirement">
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

              <DocumentDropzone
                label="Upload additional files"
                description="Add corrected or requested documents here. They will be written to the `uploaded_documents` table and storage bucket."
                files={files}
                onChange={setFiles}
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {application.documents.length} file
                  {application.documents.length === 1 ? "" : "s"} currently attached to this
                  request.
                </p>
                <Button
                  type="button"
                  onClick={() => void handleUpload()}
                  disabled={files.length === 0 || isUploading}
                >
                  {isUploading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  Upload to application
                </Button>
              </div>

              <div className="grid gap-3">
                {application.documents.length > 0 ? (
                  application.documents.map((document) => (
                    <div
                      key={document.id}
                      className="rounded-2xl border border-primary/10 bg-white/90 px-4 py-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-semibold text-foreground">{document.fileName}</p>
                        <Badge variant="outline">{document.statusLabel}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Uploaded {document.createdAtLabel}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {document.remarks ?? "No remarks were added for this file yet."}
                      </p>
                      <div className="mt-4 flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void handleViewDocument(document)}
                          disabled={viewingDocumentId === document.id}
                        >
                          {viewingDocumentId === document.id ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          View file
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-muted/45 px-4 py-4 text-sm text-muted-foreground">
                    No follow-up documents have been uploaded for this application yet.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-muted/45 px-4 py-4 text-sm text-muted-foreground">
                No current application is linked to this resident account, so upload storage
                is not available yet.
              </div>
              <Button asChild>
                <Link to="/request-assistance">Submit a request first</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ResidentUploadState({ message }: { message: string }) {
  return (
    <Card className="border-primary/10">
      <CardContent className="p-8 text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  );
}
