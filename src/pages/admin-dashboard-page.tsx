import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock,
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
import { Link } from "react-router-dom";

import {
  getAdminDashboardMetrics,
  getApplicationsByBarangay,
  getVerificationQueue,
} from "@/services/admin-service";
import type { AdminQueueItem } from "@/types/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const CHART_COLORS = {
  pending: "#f97316",
  approved: "#16a34a",
  correction: "#dc2626",
  other: "#94a3b8",
  urgent: "#dc2626",
  high: "#f97316",
  normal: "#2563eb",
};

const CHART_TOOLTIP_STYLE = {
  borderRadius: 8,
  border: "1px solid hsl(var(--border))",
  backgroundColor: "hsl(var(--background))",
  fontSize: 12,
};

function fmt(value: number) {
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

  const urgentCount = queue.filter((i) => i.priority === "Urgent").length;
  const highCount = queue.filter((i) => i.priority === "High").length;
  const normalCount = queue.filter((i) => i.priority === "Normal").length;
  const activeCount = queue.filter((i) => i.status !== "Completed").length;

  const completionRate =
    totalApplications > 0 ? Math.round((approved / totalApplications) * 100) : 0;
  const reviewPressure =
    totalApplications > 0 ? Math.round((pendingVerification / totalApplications) * 100) : 0;

  const statusBreakdown = [
    { label: "Pending", value: pendingVerification, color: CHART_COLORS.pending },
    { label: "Approved", value: approved, color: CHART_COLORS.approved },
    { label: "Correction", value: forCorrection, color: CHART_COLORS.correction },
    {
      label: "Other",
      value: Math.max(totalApplications - pendingVerification - approved - forCorrection, 0),
      color: CHART_COLORS.other,
    },
  ].filter((i) => i.value > 0);

  const priorityBreakdown = [
    { label: "Urgent", total: urgentCount, color: CHART_COLORS.urgent },
    { label: "High", total: highCount, color: CHART_COLORS.high },
    { label: "Normal", total: normalCount, color: CHART_COLORS.normal },
  ].filter((i) => i.total > 0);

  const statusPalette = ["#14115e", "#2563eb", "#f97316", "#dc2626", "#16a34a", "#64748b"];
  const queueStatusBreakdown = Array.from(
    queue.reduce((map, item) => {
      map.set(item.status, (map.get(item.status) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([label, total], i) => ({ label, total, color: statusPalette[i % statusPalette.length] }));

  return (
    <div className="space-y-6">
      {dashboardQuery.isError && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">Failed to load dashboard data.</span>
          <Button size="sm" variant="outline" onClick={() => dashboardQuery.refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total applications"
          value={fmt(totalApplications)}
          sub="All submitted cases"
          icon={<ClipboardCheck className="h-4 w-4" />}
        />
        <KpiCard
          label="Pending verification"
          value={fmt(pendingVerification)}
          sub={`${reviewPressure}% of total`}
          icon={<TimerReset className="h-4 w-4" />}
          highlight="amber"
        />
        <KpiCard
          label="Approved"
          value={fmt(approved)}
          sub={`${completionRate}% completion rate`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          highlight="green"
        />
        <KpiCard
          label="For correction"
          value={fmt(forCorrection)}
          sub={`${fmt(activeCount)} queue items active`}
          icon={<AlertTriangle className="h-4 w-4" />}
          highlight="red"
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Application status</CardTitle>
            <CardDescription>Distribution of current application outcomes.</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardQuery.isLoading ? (
              <ChartSkeleton />
            ) : statusBreakdown.length > 0 ? (
              <div className="relative h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={70}
                      outerRadius={105}
                      paddingAngle={2}
                    >
                      {statusBreakdown.map((e) => (
                        <Cell key={e.label} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xs text-muted-foreground">Completion</p>
                  <p className="text-2xl font-semibold">{completionRate}%</p>
                </div>
              </div>
            ) : (
              <Empty message="No application data yet." />
            )}
            {statusBreakdown.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
                {statusBreakdown.map((e) => (
                  <LegendDot key={e.label} color={e.color} label={`${e.label} (${fmt(e.value)})`} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Applications by barangay</CardTitle>
            <CardDescription>Submitted applications per barangay.</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardQuery.isLoading ? (
              <ChartSkeleton />
            ) : barangays.length > 0 ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barangays} margin={{ left: -16, right: 8, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Bar dataKey="applications" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty message="No barangay data yet." />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Queue row */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Queue composition</CardTitle>
            <CardDescription>Active queue split by urgency level.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardQuery.isLoading ? (
              <ChartSkeleton height={180} />
            ) : priorityBreakdown.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="h-[160px] w-[160px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityBreakdown}
                        dataKey="total"
                        nameKey="label"
                        innerRadius={44}
                        outerRadius={72}
                        paddingAngle={2}
                      >
                        {priorityBreakdown.map((i) => (
                          <Cell key={i.label} fill={i.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {priorityBreakdown.map((i) => (
                    <div key={i.label} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: i.color }} />
                        {i.label}
                      </span>
                      <span className="font-medium">{i.total}</span>
                    </div>
                  ))}
                  <div className="border-t" />
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <StatTile label="Total" value={String(queue.length)} />
                    <StatTile label="Urgent" value={String(urgentCount)} />
                    <StatTile label="Active" value={String(activeCount)} />
                  </div>
                </div>
              </div>
            ) : (
              <Empty message="No queue items yet." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Queue by status</CardTitle>
            <CardDescription>Queue load broken down by case status.</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardQuery.isLoading ? (
              <ChartSkeleton />
            ) : queueStatusBreakdown.length > 0 ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={queueStatusBreakdown}
                    layout="vertical"
                    margin={{ left: 8, right: 12, top: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                      {queueStatusBreakdown.map((i) => (
                        <Cell key={i.label} fill={i.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty message="No queue status data yet." />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live queue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Verification queue</CardTitle>
            <CardDescription>Prioritized list for immediate reviewer action.</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/applications">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {dashboardQuery.isLoading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading queue...
            </div>
          ) : queue.length > 0 ? (
            <div className="divide-y">
              {queue.map((item) => (
                <QueueRow key={item.reference} item={item} />
              ))}
            </div>
          ) : (
            <Empty message="No verification queue entries yet." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  icon: ReactNode;
  highlight?: "amber" | "green" | "red";
}) {
  const iconClasses: Record<NonNullable<typeof highlight>, string> = {
    amber: "text-amber-600 bg-amber-50",
    green: "text-emerald-600 bg-emerald-50",
    red: "text-red-600 bg-red-50",
  };
  const iconClass = highlight ? iconClasses[highlight] : "text-primary bg-primary/8";

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
          {icon}
        </span>
      </CardContent>
    </Card>
  );
}

function QueueRow({ item }: { item: AdminQueueItem }) {
  const priorityVariant: Record<string, string> = {
    Urgent: "bg-red-50 text-red-700 border-red-200",
    High: "bg-orange-50 text-orange-700 border-orange-200",
    Normal: "bg-blue-50 text-blue-700 border-blue-200",
  };

  const slaDays = item.submittedAtRaw
    ? Math.floor((Date.now() - new Date(item.submittedAtRaw).getTime()) / 86_400_000)
    : null;
  const slaClass =
    slaDays === null ? "" : slaDays < 3 ? "text-emerald-600" : slaDays <= 7 ? "text-amber-600" : "text-red-600";

  return (
    <Link
      to="/admin/applications"
      className="flex items-center justify-between gap-4 py-3 text-sm transition-colors hover:bg-muted/40 px-1"
    >
      <div className="min-w-0">
        <p className="truncate font-medium text-primary">{item.reference}</p>
        <p className="truncate text-muted-foreground">{item.resident} · {item.service}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {slaDays !== null && (
          <span className={`inline-flex items-center gap-1 text-xs font-medium ${slaClass}`}>
            <Clock className="h-3 w-3" />
            {slaDays}d
          </span>
        )}
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${priorityVariant[item.priority] ?? ""}`}
        >
          {item.priority}
        </span>
        <Badge variant="outline">{item.status}</Badge>
      </div>
    </Link>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 px-2 py-2 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold">{value}</p>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-md border border-dashed bg-muted/20 text-sm text-muted-foreground"
      style={{ height }}
    >
      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
      Loading...
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="flex h-[120px] items-center justify-center rounded-md border border-dashed bg-muted/20 text-sm text-muted-foreground">
      {message}
    </div>
  );
}
