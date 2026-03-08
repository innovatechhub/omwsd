import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Download, MapPinned } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import {
  getAdminDashboardMetrics,
  getApplicationsByBarangay,
  getMonthlyApplicationVolume,
} from "@/services/admin-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

type ReportSeriesPoint = {
  month: string;
  applications: number;
};

function exportCsv(series: ReportSeriesPoint[]) {
  const header = "month,applications";
  const rows = series.map((item) => `${item.month},${item.applications}`);
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "omswd-admin-report.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const [period, setPeriod] = useState("6");

  const reportsQuery = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: async () => {
      const [monthlyVolume, barangays, metrics] = await Promise.all([
        getMonthlyApplicationVolume(),
        getApplicationsByBarangay(),
        getAdminDashboardMetrics(),
      ]);

      return { monthlyVolume, barangays, metrics };
    },
  });

  const fullSeries = reportsQuery.data?.monthlyVolume ?? [];
  const visibleMonths = Number(period);
  const filteredSeries = useMemo(
    () => fullSeries.slice(Math.max(fullSeries.length - visibleMonths, 0)),
    [fullSeries, visibleMonths],
  );
  const totals = useMemo(() => {
    const totalApplications = filteredSeries.reduce((sum, item) => sum + item.applications, 0);
    const averagePerMonth =
      filteredSeries.length > 0 ? Math.round(totalApplications / filteredSeries.length) : 0;
    const peak = filteredSeries.length > 0
      ? Math.max(...filteredSeries.map((item) => item.applications))
      : 0;

    return { totalApplications, averagePerMonth, peak };
  }, [filteredSeries]);
  const topBarangays = reportsQuery.data?.barangays ?? [];
  const metrics = reportsQuery.data?.metrics;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-primary/72">Reports</p>
          <h1 className="mt-2 font-serif text-4xl font-bold">Live admin reporting</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Track application volume, identify high-demand barangays, and export a clean
            CSV summary for OMSWD reporting.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[180px_auto]">
          <Select value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option value="3">Last 3 months</option>
            <option value="6">Last 6 months</option>
            <option value="12">Last 12 months</option>
          </Select>
          <Button
            variant="secondary"
            disabled={filteredSeries.length === 0}
            onClick={() => {
              exportCsv(filteredSeries);
              toast.success("CSV report exported.");
            }}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Period volume"
          value={String(totals.totalApplications)}
          detail={`${period} month reporting window`}
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <MetricCard
          title="Average per month"
          value={String(totals.averagePerMonth)}
          detail="Across the selected period"
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <MetricCard
          title="Peak month"
          value={String(totals.peak)}
          detail="Highest application load"
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <MetricCard
          title="Pending verification"
          value={String(metrics?.pendingVerification ?? 0)}
          detail="Current staff review backlog"
          icon={<MapPinned className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-2xl">Monthly application volume</CardTitle>
            <CardDescription>
              Last {period} months of submitted assistance requests
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[340px]">
            {reportsQuery.isLoading ? (
              <div className="flex h-full items-center justify-center rounded-3xl border border-primary/10 bg-muted/35 px-6 text-center text-muted-foreground">
                Loading report data...
              </div>
            ) : reportsQuery.isError ? (
              <div className="flex h-full items-center justify-center rounded-3xl border border-red-400/25 bg-red-500/10 px-6 text-center text-destructive">
                Unable to load reporting data right now.
              </div>
            ) : filteredSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredSeries}>
                  <CartesianGrid stroke="rgba(30,41,59,0.12)" vertical={false} />
                  <XAxis dataKey="month" stroke="#14115e" />
                  <YAxis stroke="#14115e" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: "1px solid rgba(20,17,94,0.12)",
                      backgroundColor: "rgba(255,255,255,0.98)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="applications"
                    stroke="#f9131f"
                    fill="rgba(249,19,31,0.20)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-3xl border border-primary/10 bg-muted/35 px-6 text-center text-muted-foreground">
                No application data is available yet for reporting.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-2xl">Barangay demand snapshot</CardTitle>
            <CardDescription>
              Highest request volume based on current application records
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reportsQuery.isLoading ? (
              <div className="rounded-3xl border border-primary/10 bg-muted/35 px-4 py-5 text-sm text-muted-foreground">
                Loading barangay reporting...
              </div>
            ) : reportsQuery.isError ? (
              <div className="rounded-3xl border border-red-400/25 bg-red-500/10 px-4 py-5 text-sm text-destructive">
                Unable to load barangay reporting right now.
              </div>
            ) : topBarangays.length > 0 ? (
              topBarangays.map((barangay, index) => (
                <div
                  key={barangay.name}
                  className="flex items-center justify-between rounded-3xl border border-primary/10 bg-muted/35 px-4 py-4"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/72">
                      Rank {index + 1}
                    </p>
                    <p className="mt-1 text-lg font-semibold">{barangay.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{barangay.applications}</p>
                    <p className="text-sm text-muted-foreground">applications</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-primary/10 bg-muted/35 px-4 py-5 text-sm text-muted-foreground">
                Barangay reporting will appear once applications are recorded.
              </div>
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
  detail,
  icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-secondary">
          {icon}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/72">
            {title}
          </p>
          <p className="mt-1 text-3xl font-bold">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}
