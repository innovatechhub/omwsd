import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ClipboardCheck, FileText, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";

import {
  getAdminDashboardMetrics,
  getApplicationsByBarangay,
  getVerificationQueue,
} from "@/services/admin-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const quickActions = [
  {
    title: "Open applications queue",
    description: "Review pending, active, and correction cases.",
    to: "/admin/applications",
    icon: FileText,
  },
  {
    title: "Verify residents",
    description: "Check registry records and account status.",
    to: "/admin/residents",
    icon: Users,
  },
  {
    title: "Generate reports",
    description: "Export workload and case volume summaries.",
    to: "/admin/reports",
    icon: ClipboardCheck,
  },
];

export function AdminDashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const [metrics, barangays, queue] = await Promise.all([
        getAdminDashboardMetrics(),
        getApplicationsByBarangay(),
        getVerificationQueue(),
      ]);

      return { metrics, barangays, queue };
    },
  });

  const metrics = dashboardQuery.data?.metrics;
  const barangays = dashboardQuery.data?.barangays ?? [];
  const queue = dashboardQuery.data?.queue ?? [];

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-primary/10 bg-[linear-gradient(135deg,rgba(20,17,94,1),rgba(35,33,120,0.94))] p-8 text-primary-foreground shadow-panel">
        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-end">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.2em] text-primary-foreground/72">
              Admin Dashboard
            </p>
            <h1 className="font-serif text-4xl font-bold">Application operations overview</h1>
            <p className="max-w-3xl text-primary-foreground/82">
              Use this workspace to monitor intake volume, review the verification queue,
              and jump directly into the admin tasks that need attention.
            </p>
          </div>

          <div className="grid gap-3">
            {quickActions.map(({ title, description, to, icon: Icon }) => (
              <Button
                key={title}
                asChild
                variant="outline"
                className="h-auto justify-between rounded-3xl border-white/15 bg-white/10 px-5 py-4 text-white hover:bg-white/20"
              >
                <Link to={to}>
                  <span className="flex items-start gap-4 text-left">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block font-semibold">{title}</span>
                      <span className="mt-1 block text-sm font-normal text-primary-foreground/75">
                        {description}
                      </span>
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total applications" value={String(metrics?.totalApplications ?? 0)} description="Across the current intake cycle" />
        <MetricCard title="Pending verification" value={String(metrics?.pendingVerification ?? 0)} description="Waiting for staff validation" />
        <MetricCard title="Approved" value={String(metrics?.approved ?? 0)} description="Qualified requests cleared for release" />
        <MetricCard title="For correction" value={String(metrics?.forCorrection ?? 0)} description="Need follow-up documents or edits" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-2xl">Applications by barangay</CardTitle>
            <CardDescription>
              Current intake distribution across key barangays.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {barangays.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barangays}>
                  <CartesianGrid stroke="rgba(30,41,59,0.12)" vertical={false} />
                  <XAxis dataKey="name" stroke="#14115e" />
                  <YAxis stroke="#14115e" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: "1px solid rgba(20,17,94,0.12)",
                      backgroundColor: "rgba(255,255,255,0.98)",
                    }}
                  />
                  <Bar dataKey="applications" radius={[12, 12, 0, 0]} fill="#f9131f" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No application data available yet for barangay reporting." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-2xl">Priority verification queue</CardTitle>
            <CardDescription>
              Cases that still need immediate staff action or review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {queue.length > 0 ? (
              queue.map((item) => (
                <div key={item.reference} className="rounded-3xl border border-primary/10 bg-muted/35 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/72">
                      {item.reference}
                    </p>
                    <Badge variant={item.priority === "Urgent" ? "secondary" : "outline"}>
                      {item.priority}
                    </Badge>
                  </div>
                  <p className="mt-3 text-lg font-semibold">{item.resident}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.service}</p>
                  <div className="mt-4 rounded-2xl bg-white px-4 py-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/72">
                        Current status
                      </p>
                      <Badge variant={item.status === "Under review" ? "outline" : "secondary"}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message="No active queue items are available right now." />
            )}
            <Button asChild className="w-full sm:w-auto" disabled={queue.length === 0}>
              <Link to="/admin/applications">
                Open applications queue
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="font-sans text-4xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{description}</CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-3xl border border-primary/10 bg-muted/35 px-6 text-center text-muted-foreground">
      {message}
    </div>
  );
}
