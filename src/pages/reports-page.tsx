import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
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
    const peak =
      filteredSeries.length > 0 ? Math.max(...filteredSeries.map((item) => item.applications)) : 0;
    return { totalApplications, averagePerMonth, peak };
  }, [filteredSeries]);

  const topBarangays = reportsQuery.data?.barangays ?? [];
  const totalTopBarangayVolume = useMemo(
    () => topBarangays.reduce((sum, b) => sum + b.applications, 0),
    [topBarangays],
  );

  const metrics = reportsQuery.data?.metrics;
  const latestMonth = filteredSeries[filteredSeries.length - 1]?.applications ?? 0;
  const previousMonth =
    filteredSeries.length > 1 ? (filteredSeries[filteredSeries.length - 2]?.applications ?? 0) : 0;
  const monthOverMonth = latestMonth - previousMonth;
  const pendingRatio = metrics?.totalApplications
    ? Math.round(((metrics.pendingVerification ?? 0) / metrics.totalApplications) * 100)
    : 0;

  const isLoading = reportsQuery.isLoading;
  const isError = reportsQuery.isError;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Application Reports</h2>
          <p className="text-sm text-muted-foreground">Monthly volume and barangay breakdown</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
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

      {/* Summary row */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Period volume", value: String(totals.totalApplications) },
          { label: "Avg per month", value: String(totals.averagePerMonth) },
          { label: "Peak month", value: String(totals.peak) },
          { label: "Pending", value: String(metrics?.pendingVerification ?? 0) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-1 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Monthly volume table */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly application volume</CardTitle>
            <CardDescription>Last {period} months of submitted assistance requests</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="px-6 py-8 text-sm text-muted-foreground">Loading report data...</p>
            ) : isError ? (
              <p className="px-6 py-8 text-sm text-destructive">Unable to load reporting data.</p>
            ) : filteredSeries.length === 0 ? (
              <p className="px-6 py-8 text-sm text-muted-foreground">No data available yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Month
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Applications
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        vs. Prev
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        % of Period
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSeries.map((row, i) => {
                      const prev = i > 0 ? filteredSeries[i - 1].applications : null;
                      const diff = prev !== null ? row.applications - prev : null;
                      const share =
                        totals.totalApplications > 0
                          ? Math.round((row.applications / totals.totalApplications) * 100)
                          : 0;
                      const isPeak = row.applications === totals.peak && totals.peak > 0;

                      return (
                        <tr key={row.month} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-6 py-3 font-medium">
                            {row.month}
                            {isPeak && (
                              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                                peak
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-right font-semibold">
                            {row.applications}
                          </td>
                          <td className="px-6 py-3 text-right">
                            {diff === null ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              <span
                                className={
                                  diff > 0
                                    ? "text-emerald-600"
                                    : diff < 0
                                    ? "text-red-500"
                                    : "text-muted-foreground"
                                }
                              >
                                {diff > 0 ? "+" : ""}
                                {diff}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-right text-muted-foreground">{share}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/20">
                      <td className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Total
                      </td>
                      <td className="px-6 py-3 text-right font-bold">{totals.totalApplications}</td>
                      <td className="px-6 py-3 text-right">
                        <span
                          className={
                            monthOverMonth > 0
                              ? "text-emerald-600"
                              : monthOverMonth < 0
                              ? "text-red-500"
                              : "text-muted-foreground"
                          }
                        >
                          {monthOverMonth > 0 ? "+" : ""}
                          {monthOverMonth !== 0 ? monthOverMonth : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right text-muted-foreground">{pendingRatio}% pending</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Barangay table */}
        <Card>
          <CardHeader>
            <CardTitle>Barangay demand snapshot</CardTitle>
            <CardDescription>Highest request volume from current application records</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="px-6 py-8 text-sm text-muted-foreground">Loading barangay data...</p>
            ) : isError ? (
              <p className="px-6 py-8 text-sm text-destructive">Unable to load barangay data.</p>
            ) : topBarangays.length === 0 ? (
              <p className="px-6 py-8 text-sm text-muted-foreground">
                Barangay data will appear once applications are recorded.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Barangay
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Applications
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Share
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topBarangays.map((barangay, index) => {
                      const share =
                        totalTopBarangayVolume > 0
                          ? Math.round((barangay.applications / totalTopBarangayVolume) * 100)
                          : 0;

                      return (
                        <tr key={barangay.name} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-6 py-3 text-muted-foreground">{index + 1}</td>
                          <td className="px-6 py-3 font-medium">{barangay.name}</td>
                          <td className="px-6 py-3 text-right font-semibold">
                            {barangay.applications}
                          </td>
                          <td className="px-6 py-3 text-right text-muted-foreground">{share}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/20">
                      <td colSpan={2} className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Total
                      </td>
                      <td className="px-6 py-3 text-right font-bold">{totalTopBarangayVolume}</td>
                      <td className="px-6 py-3 text-right text-muted-foreground">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
