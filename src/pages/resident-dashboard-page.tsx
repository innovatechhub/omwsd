import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileWarning,
  Upload,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useResidentPortal } from "@/hooks/use-resident-portal";

const progressSteps = [
  "Request submitted",
  "Initial verification",
  "Document review",
  "Decision and release",
];

const quickActions = [
  {
    title: "View application",
    description: "Review your submitted request and current case details.",
    to: "/resident/application",
    icon: FileCheck2,
  },
  {
    title: "Upload requirements",
    description: "Send additional files if OMSWD requests follow-up documents.",
    to: "/resident/uploads",
    icon: Upload,
  },
  {
    title: "Check notifications",
    description: "Read reminders, corrections, and verification updates.",
    to: "/resident/notifications",
    icon: BellRing,
  },
];

export function ResidentDashboardPage() {
  const portalQuery = useResidentPortal();
  const application = portalQuery.data?.application ?? null;
  const unreadNotifications = portalQuery.data?.unreadNotifications ?? 0;
  const needsActionCount = portalQuery.data?.needsActionCount ?? 0;

  if (portalQuery.isLoading) {
    return <ResidentDashboardState message="Loading your resident portal data..." />;
  }

  if (portalQuery.error instanceof Error) {
    return <ResidentDashboardState message={portalQuery.error.message} />;
  }

  const summaryCards = [
    {
      label: "Current status",
      value: application?.statusLabel ?? "No application yet",
      detail: application
        ? "This reflects the latest case status from Supabase."
        : "Submit a request first to begin tracking your case.",
      icon: Clock3,
    },
    {
      label: "Reference number",
      value: application?.referenceNumber ?? "Not available",
      detail: application
        ? "Use this when asking OMSWD for updates."
        : "A reference number is assigned after submission.",
      icon: FileCheck2,
    },
    {
      label: "Required action",
      value:
        needsActionCount > 0
          ? `${needsActionCount} item${needsActionCount === 1 ? "" : "s"}`
          : "No action needed",
      detail:
        needsActionCount > 0
          ? "Check your notifications and upload any requested files."
          : "No follow-up is currently required from you.",
      icon: needsActionCount > 0 ? FileWarning : CheckCircle2,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-primary/10 bg-[linear-gradient(135deg,rgba(20,17,94,1),rgba(35,33,120,0.94))] p-8 text-primary-foreground shadow-panel">
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-foreground/72">
              Resident Dashboard
            </p>
            <h1 className="font-serif text-4xl font-bold leading-tight md:text-5xl">
              Track your assistance request easily.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-white/82 md:text-lg">
              View your latest status, open your request details, and check if any follow-up
              action is needed.
            </p>
          </div>

          {application ? (
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/88">
              <Badge className="bg-white text-primary" variant="outline">
                {application.assistanceName}
              </Badge>
              <span>{application.referenceNumber}</span>
              <span>{application.submittedAtLabel}</span>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="lg" asChild>
              <Link to="/resident/application">
                {application ? "View application" : "Open application page"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              asChild
            >
              <Link to={application ? "/resident/uploads" : "/request-assistance"}>
                {application ? "Upload documents" : "Submit a request"}
                <Upload className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {summaryCards.map(({ label, value, detail, icon: Icon }) => (
          <Card key={label} className="border-primary/10 bg-white/95">
            <CardContent className="flex gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  {label}
                </p>
                <p className="mt-1 text-xl font-semibold leading-tight text-foreground">
                  {value}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle>Progress</CardTitle>
            <CardDescription>Simple overview of where your request is now.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {application ? (
              progressSteps.map((step, index) => {
                const isComplete = index < application.progressStep;
                const isCurrent = index === application.progressStep;

                return (
                  <div
                    key={step}
                    className={[
                      "flex items-center gap-4 rounded-2xl px-4 py-4",
                      isCurrent ? "bg-secondary/45" : "bg-muted/50",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                        isComplete
                          ? "bg-primary text-primary-foreground"
                          : isCurrent
                            ? "bg-white text-primary"
                            : "bg-white text-muted-foreground",
                      ].join(" ")}
                    >
                      {isComplete ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{step}</p>
                      <p className="text-sm text-muted-foreground">
                        {isComplete ? "Completed" : isCurrent ? "Current step" : "Upcoming"}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-3xl border border-primary/10 bg-muted/35 px-5 py-6 text-sm text-muted-foreground">
                No request is linked to this resident account yet. Submit an assistance
                request first so the portal can track it here.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle>Quick navigation</CardTitle>
            <CardDescription>Open the most important resident pages faster.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {quickActions.map(({ title, description, to, icon: Icon }) => (
              <Link
                key={title}
                to={to}
                className="flex items-start gap-4 rounded-2xl border border-primary/10 bg-white/90 px-4 py-4 transition-colors hover:bg-muted/40"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {description}
                  </p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
              </Link>
            ))}

            <div className="rounded-2xl border border-primary/10 bg-secondary/35 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Notifications
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">{unreadNotifications}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Unread updates waiting in your resident inbox.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function ResidentDashboardState({ message }: { message: string }) {
  return (
    <Card className="border-primary/10">
      <CardContent className="p-8 text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  );
}
