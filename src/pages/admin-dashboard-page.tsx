import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
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

import { getAdminApplications } from "@/services/admin-service";
import type { AdminApplicationRecord, AdminQueueItem } from "@/types/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

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

type DatePreset = "all" | "last7" | "last30" | "thisMonth" | "custom";

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPresetRange(preset: DatePreset): { from: string; to: string } {
  if (preset === "all" || preset === "custom") {
    return { from: "", to: "" };
  }

  const now = new Date();
  const end = toDateInputValue(now);

  if (preset === "thisMonth") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: toDateInputValue(startOfMonth), to: end };
  }

  const lookbackDays = preset === "last7" ? 6 : 29;
  const start = new Date(now);
  start.setDate(now.getDate() - lookbackDays);
  return { from: toDateInputValue(start), to: end };
}

function filterApplicationsByDateRange(
  applications: AdminApplicationRecord[],
  dateFrom: string,
  dateTo: string,
) {
  if (!dateFrom && !dateTo) {
    return applications;
  }

  return applications.filter((application) => {
    if (!application.submittedAtRaw) {
      return false;
    }

    const submittedDate = application.submittedAtRaw.slice(0, 10);
    if (dateFrom && submittedDate < dateFrom) {
      return false;
    }

    if (dateTo && submittedDate > dateTo) {
      return false;
    }

    return true;
  });
}

export function AdminDashboardPage() {
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const dashboardQuery = useQuery({
    queryKey: ["admin", "dashboard", "applications"],
    queryFn: getAdminApplications,
  });

  const applications = dashboardQuery.data ?? [];
  const filteredApplications = useMemo(
    () => filterApplicationsByDateRange(applications, dateFrom, dateTo),
    [applications, dateFrom, dateTo],
  );
  const hasInvalidDateRange = Boolean(dateFrom && dateTo && dateFrom > dateTo);
  const scopedApplications = hasInvalidDateRange ? [] : filteredApplications;

  const barangays = useMemo(() => {
    const counts = new Map<string, number>();

    for (const application of scopedApplications) {
      counts.set(application.barangay, (counts.get(application.barangay) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([name, applicationsTotal]) => ({ name, applications: applicationsTotal }))
      .sort((left, right) => right.applications - left.applications)
      .slice(0, 5);
  }, [scopedApplications]);

  const queue = useMemo(
    () =>
      scopedApplications
        .filter((application) =>
          ["Pending", "For correction", "For interview"].includes(application.status),
        )
        .slice(0, 5)
        .map(
          (application) =>
            ({
              reference: application.reference,
              resident: application.resident,
              service: application.assistance,
              status: application.status,
              priority: application.priority,
              submittedAtRaw: application.submittedAtRaw,
            }) satisfies AdminQueueItem,
        ),
    [scopedApplications],
  );

  const totalApplications = scopedApplications.length;
  const pendingVerification = scopedApplications.filter(
    (application) => application.status === "Pending",
  ).length;
  const approved = scopedApplications.filter(
    (application) => application.status === "Approved",
  ).length;
  const forCorrection = scopedApplications.filter(
    (application) => application.status === "For correction",
  ).length;
  const forInterview = scopedApplications.filter(
    (application) => application.status === "For interview",
  ).length;

  const activeCount = queue.filter((i) => i.status !== "Approved").length;

  const completionRate =
    totalApplications > 0 ? Math.round((approved / totalApplications) * 100) : 0;
  const reviewPressure =
    totalApplications > 0 ? Math.round((pendingVerification / totalApplications) * 100) : 0;

  const statusBreakdown = [
    { label: "Pending", value: pendingVerification, color: CHART_COLORS.pending },
    { label: "Approved", value: approved, color: CHART_COLORS.approved },
    { label: "Correction", value: forCorrection, color: CHART_COLORS.correction },
    {
      label: "For Interview",
      value: Math.max(totalApplications - pendingVerification - approved - forCorrection, 0),
      color: CHART_COLORS.other,
    },
  ].filter((i) => i.value > 0);

  const statusPalette = ["#14115e", "#2563eb", "#f97316", "#dc2626", "#16a34a", "#64748b"];
  const queueStatusBreakdown = Array.from(
    queue.reduce((map, item) => {
      map.set(item.status, (map.get(item.status) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([label, total], i) => ({ label, total, color: statusPalette[i % statusPalette.length] }));

  function handlePresetChange(nextPreset: DatePreset) {
    setDatePreset(nextPreset);

    if (nextPreset === "custom") {
      return;
    }

    const range = getPresetRange(nextPreset);
    setDateFrom(range.from);
    setDateTo(range.to);
  }

  function clearDateFilters() {
    setDatePreset("all");
    setDateFrom("");
    setDateTo("");
  }

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

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold">Date filter</p>
              <p className="text-xs text-muted-foreground">
                Filter dashboard data using application submission date.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:grid-cols-[180px_160px_160px_auto]">
              <Select
                value={datePreset}
                onChange={(event) => handlePresetChange(event.target.value as DatePreset)}
              >
                <option value="all">All time</option>
                <option value="last7">Last 7 days</option>
                <option value="last30">Last 30 days</option>
                <option value="thisMonth">This month</option>
                <option value="custom">Custom range</option>
              </Select>

              <Input
                type="date"
                value={dateFrom}
                onChange={(event) => {
                  setDatePreset("custom");
                  setDateFrom(event.target.value);
                }}
              />

              <Input
                type="date"
                value={dateTo}
                onChange={(event) => {
                  setDatePreset("custom");
                  setDateTo(event.target.value);
                }}
              />

              <Button type="button" variant="outline" onClick={clearDateFilters}>
                Clear
              </Button>
            </div>
          </div>

          {hasInvalidDateRange && (
            <p className="mt-3 text-xs text-destructive">
              End date must be the same as or later than the start date.
            </p>
          )}
        </CardContent>
      </Card>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Pending"
          value={fmt(pendingVerification)}
          sub={`${reviewPressure}% of total`}
          icon={<TimerReset className="h-4 w-4" />}
          highlight="amber"
        />
        <KpiCard
          label="For correction"
          value={fmt(forCorrection)}
          sub={`${fmt(activeCount)} queue items active`}
          icon={<AlertTriangle className="h-4 w-4" />}
          highlight="red"
        />
        <KpiCard
          label="For interview"
          value={fmt(forInterview)}
          sub={`${fmt(forInterview)} scheduled`}
          icon={<AlertTriangle className="h-4 w-4" />}
          highlight="red"
        />
        <KpiCard
          label="Approved"
          value={fmt(approved)}
          sub={`${completionRate}% completion rate`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          highlight="green"
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
      <div className="grid gap-6">
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
