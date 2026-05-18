import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  LoaderCircle,
  TimerReset,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getAdminDashboardMetrics,
  getApplicationsByBarangay,
  getVerificationQueue,
} from "@/services/admin-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const CHART_TOOLTIP_STYLE = {
  borderRadius: 14,
  border: "1px solid rgba(20,17,94,0.14)",
  backgroundColor: "rgba(255,255,255,0.98)",
};

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

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
  const totalApplications = metrics?.totalApplications ?? 0;
  const pendingVerification = metrics?.pendingVerification ?? 0;
  const approved = metrics?.approved ?? 0;
  const forCorrection = metrics?.forCorrection ?? 0;
  const urgentQueueCount = queue.filter((item) => item.priority === "Urgent").length;
  const highQueueCount = queue.filter((item) => item.priority === "High").length;
  const normalQueueCount = queue.filter((item) => item.priority === "Normal").length;
  const queueWithNextAction = queue.filter((item) => item.status !== "Completed").length;
  const completionRate =
    totalApplications > 0 ? Math.round((approved / totalApplications) * 100) : 0;
  const reviewPressure =
    totalApplications > 0 ? Math.round((pendingVerification / totalApplications) * 100) : 0;

  const statusBreakdown = [
    {
      label: "Pending verification",
      value: pendingVerification,
      color: "#f97316",
    },
    {
      label: "Approved",
      value: approved,
      color: "#16a34a",
    },
    {
      label: "For correction",
      value: forCorrection,
      color: "#dc2626",
    },
    {
      label: "Other",
      value: Math.max(totalApplications - pendingVerification - approved - forCorrection, 0),
      color: "#334155",
    },
  ].filter((item) => item.value > 0);

  const priorityBreakdown = [
    { label: "Urgent", total: urgentQueueCount, color: "#dc2626" },
    { label: "High", total: highQueueCount, color: "#f97316" },
    { label: "Normal", total: normalQueueCount, color: "#2563eb" },
  ].filter((item) => item.total > 0);

  const queueStatusMap = new Map<string, number>();
  for (const item of queue) {
    const currentTotal = queueStatusMap.get(item.status) ?? 0;
    queueStatusMap.set(item.status, currentTotal + 1);
  }
  const statusPalette = ["#14115e", "#2563eb", "#f97316", "#dc2626", "#16a34a", "#64748b"];
  const queueStatusBreakdown = Array.from(queueStatusMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, total], index) => ({
      label,
      total,
      color: statusPalette[index % statusPalette.length],
    }));

  return (
    <div className="space-y-6">
      {dashboardQuery.isError ? (
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div className="flex items-start gap-3 text-destructive">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="max-w-2xl text-sm">
                Unable to load one or more dashboard datasets. The cards below may be incomplete.
              </p>
            </div>
            <Button variant="outline" onClick={() => dashboardQuery.refetch()}>
              Retry fetch
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total applications"
          value={formatCount(totalApplications)}
          description="All submitted cases"
          signal="Intake volume"
          icon={<ClipboardCheck className="h-5 w-5" />}
          tone="indigo"
          className="animate-in fade-in-0 slide-in-from-bottom-2 duration-700"
        />
        <MetricCard
          title="Pending verification"
          value={formatCount(pendingVerification)}
          description="Awaiting first review"
          signal={`${reviewPressure}% of total`}
          icon={<TimerReset className="h-5 w-5" />}
          tone="amber"
          className="animate-in fade-in-0 slide-in-from-bottom-2 duration-700 [animation-delay:80ms]"
        />
        <MetricCard
          title="Approved"
          value={formatCount(approved)}
          description="Ready for release workflow"
          signal={`${completionRate}% completion`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="emerald"
          className="animate-in fade-in-0 slide-in-from-bottom-2 duration-700 [animation-delay:140ms]"
        />
        <MetricCard
          title="For correction"
          value={formatCount(forCorrection)}
          description="Needs resident follow-up"
          signal={`${formatCount(queueWithNextAction)} queue items with next action`}
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="rose"
          className="animate-in fade-in-0 slide-in-from-bottom-2 duration-700 [animation-delay:200ms]"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="overflow-hidden border-primary/15">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/0 to-transparent">
            <CardTitle>Application status mix</CardTitle>
            <CardDescription>Distribution of current application outcomes.</CardDescription>
          </CardHeader>
          <CardContent className={statusBreakdown.length > 0 ? "h-[320px]" : "h-[220px]"}>
            {dashboardQuery.isLoading ? (
              <LoadingState message="Loading application status metrics..." />
            ) : statusBreakdown.length > 0 ? (
              <div className="relative h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={76}
                      outerRadius={112}
                      paddingAngle={2}
                    >
                      {statusBreakdown.map((entry) => (
                        <Cell key={entry.label} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Completion
                  </p>
                  <p className="text-3xl font-semibold text-primary">{completionRate}%</p>
                </div>
              </div>
            ) : (
              <EmptyState message="No application status data yet." />
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-primary/15">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/0 to-transparent">
            <CardTitle>Applications by barangay</CardTitle>
            <CardDescription>Current distribution of submitted applications.</CardDescription>
          </CardHeader>
          <CardContent className={barangays.length > 0 ? "h-[320px]" : "h-[220px]"}>
            {dashboardQuery.isLoading ? (
              <LoadingState message="Loading barangay distribution..." />
            ) : barangays.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barangays} margin={{ left: -14, right: 10, top: 8, bottom: 8 }}>
                  <CartesianGrid stroke="rgba(15,23,42,0.12)" vertical={false} />
                  <XAxis dataKey="name" stroke="#334155" />
                  <YAxis stroke="#334155" allowDecimals={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="applications" radius={[8, 8, 0, 0]} fill="#14115e" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No barangay application data is available yet." />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr] xl:items-start">
        <Card className="h-fit overflow-hidden border-primary/15">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/0 to-transparent">
            <CardTitle>Queue composition</CardTitle>
            <CardDescription>Current queue split by urgency level.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[220px_1fr]">
            <div className={queue.length > 0 ? "h-[220px]" : "h-[170px]"}>
              {dashboardQuery.isLoading ? (
                <LoadingState message="Loading priority queue..." />
              ) : priorityBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityBreakdown}
                      dataKey="total"
                      nameKey="label"
                      innerRadius={50}
                      outerRadius={84}
                      paddingAngle={2}
                    >
                      {priorityBreakdown.map((item) => (
                        <Cell key={item.label} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No queue items to visualize yet." />
              )}
            </div>
            <div className="space-y-3">
              {priorityBreakdown.length > 0 ? (
                priorityBreakdown.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 rounded-xl border bg-muted/15 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <p className="text-sm text-foreground">{item.label}</p>
                    </div>
                    <p className="text-sm font-semibold">{item.total}</p>
                  </div>
                ))
              ) : null}
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 2xl:grid-cols-3">
                <SummaryTile label="Items in queue" value={String(queue.length)} />
                <SummaryTile label="Urgent items" value={String(urgentQueueCount)} />
                <SummaryTile label="With next action" value={String(queueWithNextAction)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit overflow-hidden border-primary/15">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/0 to-transparent">
            <CardTitle>Queue status distribution</CardTitle>
            <CardDescription>Current queue load by case status.</CardDescription>
          </CardHeader>
          <CardContent className={queueStatusBreakdown.length > 0 ? "h-[320px]" : "h-[220px]"}>
            {dashboardQuery.isLoading ? (
              <LoadingState message="Loading queue status distribution..." />
            ) : queueStatusBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={queueStatusBreakdown}
                  layout="vertical"
                  margin={{ left: 34, right: 12, top: 8, bottom: 8 }}
                >
                  <CartesianGrid stroke="rgba(15,23,42,0.12)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} stroke="#334155" />
                  <YAxis type="category" dataKey="label" stroke="#334155" width={96} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="total" radius={[6, 6, 6, 6]}>
                    {queueStatusBreakdown.map((item) => (
                      <Cell key={item.label} fill={item.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No queue status data available yet." />
            )}
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
  signal,
  icon,
  tone,
  className,
}: {
  title: string;
  value: string;
  description: string;
  signal: string;
  icon: ReactNode;
  tone: "indigo" | "amber" | "emerald" | "rose";
  className?: string;
}) {
  const toneClasses = {
    indigo: "border-l-primary bg-gradient-to-br from-primary/10 via-card to-card text-primary",
    amber: "border-l-orange-500 bg-gradient-to-br from-orange-500/10 via-card to-card text-orange-700",
    emerald:
      "border-l-emerald-600 bg-gradient-to-br from-emerald-500/10 via-card to-card text-emerald-700",
    rose: "border-l-rose-600 bg-gradient-to-br from-rose-500/10 via-card to-card text-rose-700",
  }[tone];

  return (
    <Card className={`border-l-4 ${className ?? ""}`}>
      <CardHeader className={`${toneClasses} pb-3`}>
        <div className="flex items-center justify-between gap-3">
          <CardDescription>{title}</CardDescription>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/70">
            {icon}
          </span>
        </div>
        <CardTitle className="text-3xl text-foreground">{value}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary/80">
          {signal}
        </p>
      </CardContent>
    </Card>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 text-center text-sm text-muted-foreground">
      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
      {message}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
