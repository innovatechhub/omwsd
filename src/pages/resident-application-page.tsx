import { FileText, ShieldCheck, Wallet } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useResidentPortal } from "@/hooks/use-resident-portal";

export function ResidentApplicationPage() {
  const portalQuery = useResidentPortal();
  const application = portalQuery.data?.application ?? null;

  if (portalQuery.isLoading) {
    return <ResidentApplicationState message="Loading your application history..." />;
  }

  if (portalQuery.error instanceof Error) {
    return <ResidentApplicationState message={portalQuery.error.message} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          My Application
        </p>
        <h1 className="mt-2 font-serif text-4xl font-bold">Case history and remarks</h1>
      </div>

      {application ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle>Reference {application.referenceNumber}</CardTitle>
                  <CardDescription>{application.assistanceName}</CardDescription>
                </div>
                <Badge variant={application.requiresAction ? "secondary" : "outline"}>
                  {application.statusLabel}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <ApplicationMetaCard
                icon={ShieldCheck}
                label="Current status"
                value={application.statusLabel}
                detail={application.adminRemarks ?? "No staff remarks have been added yet."}
              />
              <ApplicationMetaCard
                icon={FileText}
                label="Submitted"
                value={application.submittedAtLabel}
                detail={
                  application.reviewedAtLabel
                    ? `Reviewed ${application.reviewedAtLabel}`
                    : "Review is still pending."
                }
              />
              <ApplicationMetaCard
                icon={Wallet}
                label="Requested amount"
                value={application.requestedAmountLabel}
                detail={application.urgencyLabel}
              />
            </CardContent>
          </Card>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Status history</CardTitle>
                <CardDescription>
                  Every case movement recorded for your latest application.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {application.statusHistory.length > 0 ? (
                  application.statusHistory.map((item) => (
                    <div key={item.id} className="rounded-2xl bg-muted/60 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                        {item.createdAtLabel}
                      </p>
                      <p className="mt-2 font-semibold">{item.statusLabel}</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {item.remarks ?? "No remarks were recorded for this update."}
                      </p>
                    </div>
                  ))
                ) : (
                  <ResidentApplicationEmpty message="No status history has been posted yet." />
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Requirement checklist</CardTitle>
                  <CardDescription>
                    Requirement records linked to this application.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {application.requirements.length > 0 ? (
                    application.requirements.map((requirement) => (
                      <div
                        key={requirement.id}
                        className="rounded-2xl border border-primary/10 bg-white/90 px-4 py-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="font-semibold text-foreground">{requirement.name}</p>
                          <Badge
                            variant={
                              requirement.status === "approved"
                                ? "outline"
                                : requirement.status === "submitted"
                                  ? "default"
                                  : "secondary"
                            }
                          >
                            {requirement.statusLabel}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {requirement.remarks ??
                            requirement.description ??
                            "No additional remarks were attached."}
                        </p>
                        <p className="mt-3 text-xs uppercase tracking-[0.14em] text-primary/72">
                          Files uploaded: {requirement.documents.length}
                        </p>
                      </div>
                    ))
                  ) : (
                    <ResidentApplicationEmpty message="No explicit requirement records are linked yet." />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Uploaded documents</CardTitle>
                  <CardDescription>
                    Files already attached to this request in Supabase.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {application.documents.length > 0 ? (
                    application.documents.slice(0, 5).map((document) => (
                      <div
                        key={document.id}
                        className="rounded-2xl border border-primary/10 bg-muted/35 px-4 py-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="font-semibold text-foreground">{document.fileName}</p>
                          <Badge variant="outline">{document.statusLabel}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Uploaded {document.createdAtLabel}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {document.remarks ?? "No document remarks yet."}
                        </p>
                      </div>
                    ))
                  ) : (
                    <ResidentApplicationEmpty message="No uploaded documents are linked yet." />
                  )}

                  <Button asChild variant="outline">
                    <Link to="/resident/uploads">Open upload center</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No resident application found</CardTitle>
            <CardDescription>
              This portal account does not have a submitted assistance request yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/request-assistance">Submit a request</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ApplicationMetaCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl bg-muted/60 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
        {label}
      </p>
      <p className="mt-2 font-semibold">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
    </div>
  );
}

function ResidentApplicationState({ message }: { message: string }) {
  return (
    <Card className="border-primary/10">
      <CardContent className="p-8 text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  );
}

function ResidentApplicationEmpty({ message }: { message: string }) {
  return (
    <div className="rounded-2xl bg-muted/45 px-4 py-4 text-sm text-muted-foreground">
      {message}
    </div>
  );
}
