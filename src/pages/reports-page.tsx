import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";

import {
  getAdminApplications,
  getAdminDashboardMetrics,
  getMonthlyApplicationVolume,
  getSectorRegistrationsByProfileIds,
} from "@/services/admin-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { printDilgDataForm } from "@/lib/print-dilg-data-form";
import type { AdminApplicationRecord } from "@/types/admin";

function formatFormDate(value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatMonthLabel(value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatAddress(application: AdminApplicationRecord) {
  return [application.addressLine, application.barangay, application.municipality]
    .filter(Boolean)
    .join(", ");
}

function formatGender(value: string | null) {
  return value ? value.trim().replace(/_/g, " ") : "";
}

export function ReportsPage() {
  const [period, setPeriod] = useState("6");
  const [barangayFilter, setBarangayFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const reportsQuery = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: async () => {
      const [monthlyVolume, applications, metrics] = await Promise.all([
        getMonthlyApplicationVolume(),
        getAdminApplications(),
        getAdminDashboardMetrics(),
      ]);
      const profileIds = applications
        .map((a) => a.profileId)
        .filter((id): id is string => Boolean(id));
      const sectorMap = await getSectorRegistrationsByProfileIds(profileIds);
      return { monthlyVolume, applications, metrics, sectorMap };
    },
  });

  const fullSeries = reportsQuery.data?.monthlyVolume ?? [];
  const visibleMonths = Number(period);
  const filteredSeries = useMemo(
    () => fullSeries.slice(Math.max(fullSeries.length - visibleMonths, 0)),
    [fullSeries, visibleMonths],
  );

  const selectedMonthLabels = useMemo(
    () => new Set(filteredSeries.map((item) => item.month)),
    [filteredSeries],
  );

  const barangayOptions = useMemo(() => {
    const all = (reportsQuery.data?.applications ?? [])
      .map((a) => a.barangay)
      .filter(Boolean);
    return Array.from(new Set(all)).sort();
  }, [reportsQuery.data?.applications]);

  const formRows = useMemo(() => {
    const dateFromMs = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0) : null;
    const dateToMs = dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : null;

    return (reportsQuery.data?.applications ?? [])
      .filter((application) => {
        if (!selectedMonthLabels.has(formatMonthLabel(application.submittedAtRaw))) return false;
        if (barangayFilter && application.barangay !== barangayFilter) return false;
        if (application.submittedAtRaw) {
          const submittedMs = new Date(application.submittedAtRaw).getTime();
          if (dateFromMs !== null && submittedMs < dateFromMs) return false;
          if (dateToMs !== null && submittedMs > dateToMs) return false;
        }
        return true;
      })
      .sort((left, right) =>
        (left.submittedAtRaw ?? "").localeCompare(right.submittedAtRaw ?? ""),
      );
  }, [reportsQuery.data?.applications, selectedMonthLabels, barangayFilter, dateFrom, dateTo]);

  const totals = useMemo(() => {
    const totalApplications = filteredSeries.reduce((sum, item) => sum + item.applications, 0);
    const averagePerMonth =
      filteredSeries.length > 0 ? Math.round(totalApplications / filteredSeries.length) : 0;
    const peak =
      filteredSeries.length > 0 ? Math.max(...filteredSeries.map((item) => item.applications)) : 0;
    return { totalApplications, averagePerMonth, peak };
  }, [filteredSeries]);

  const blankRows = Math.max(12 - formRows.length, 0);
  const sectorMap = reportsQuery.data?.sectorMap ?? new Map<string, Set<string>>();
  const metrics = reportsQuery.data?.metrics;
  const isLoading = reportsQuery.isLoading;
  const isError = reportsQuery.isError;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Application Reports</h2>
          <p className="text-sm text-muted-foreground">AICS data form preview and monthly summary</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="3">Last 3 months</option>
            <option value="6">Last 6 months</option>
            <option value="12">Last 12 months</option>
          </Select>
          <Button variant="secondary" onClick={() => printDilgDataForm(formRows, sectorMap)}>
            <Printer className="h-4 w-4" />
            Print data form
          </Button>
        </div>
      </section>

      <section className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Barangay</label>
          <Select value={barangayFilter} onChange={(e) => setBarangayFilter(e.target.value)} className="min-w-[160px]">
            <option value="">All barangays</option>
            {barangayOptions.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Date from</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Date to</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        {(barangayFilter || dateFrom || dateTo) && (
          <button
            onClick={() => { setBarangayFilter(""); setDateFrom(""); setDateTo(""); }}
            className="h-9 rounded-md px-3 text-sm text-muted-foreground underline-offset-2 hover:underline"
          >
            Clear filters
          </button>
        )}
      </section>

      <section>
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>AICS data form</CardTitle>
            <CardDescription>
              Same table layout as the printable AICS data form for the last {period} months
              {barangayFilter ? ` · ${barangayFilter}` : ""}
              {dateFrom || dateTo
                ? ` · ${dateFrom || "…"} → ${dateTo || "…"}`
                : ""}
              .
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="px-6 py-8 text-sm text-muted-foreground">Loading AICS data...</p>
            ) : isError ? (
              <p className="px-6 py-8 text-sm text-destructive">Unable to load reporting data.</p>
            ) : formRows.length === 0 ? (
              <p className="px-6 py-8 text-sm text-muted-foreground">No data available yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] table-fixed border-collapse text-sm">
                  <colgroup>
                    <col className="w-[10%]" />
                    <col className="w-[25%]" />
                    <col className="w-[29%]" />
                    <col className="w-[10%]" />
                    <col className="w-[8%]" />
                    <col className="w-[6%]" />
                    <col className="w-[7%]" />
                    <col className="w-[5%]" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="border border-slate-400 bg-stone-50 px-3 py-3 text-left text-xs font-extrabold uppercase tracking-[0.08em]">
                        Date
                      </th>
                      <th className="border border-slate-400 bg-stone-50 px-3 py-3 text-left text-xs font-extrabold uppercase tracking-[0.08em]">
                        Name
                      </th>
                      <th className="border border-slate-400 bg-stone-50 px-3 py-3 text-left text-xs font-extrabold uppercase tracking-[0.08em]">
                        Address
                      </th>
                      <th className="border border-slate-400 bg-sky-300 px-2 py-3 text-center text-xs font-extrabold uppercase tracking-[0.04em] text-slate-950">
                        Gender
                      </th>
                      <th className="border border-slate-400 bg-yellow-300 px-2 py-3 text-center text-xs font-extrabold uppercase leading-tight tracking-[0.02em] text-slate-950">
                        Solo<br />Parent
                      </th>
                      <th className="border border-slate-400 bg-green-700 px-2 py-3 text-center text-xs font-extrabold uppercase tracking-[0.04em] text-slate-950">
                        4Ps
                      </th>
                      <th className="border border-slate-400 bg-rose-500 px-2 py-3 text-center text-xs font-extrabold uppercase tracking-[0.04em] text-slate-950">
                        Senior
                      </th>
                      <th className="border border-slate-400 bg-slate-500 px-2 py-3 text-center text-xs font-extrabold uppercase tracking-[0.04em] text-slate-950">
                        PWD
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formRows.map((application) => {
                      const sectors = application.profileId
                        ? sectorMap.get(application.profileId)
                        : undefined;
                      return (
                        <tr key={application.id} className="hover:bg-muted/20">
                          <td className="h-10 border border-slate-400 px-3 py-2 text-xs font-medium">
                            {formatFormDate(application.submittedAtRaw)}
                          </td>
                          <td className="h-10 border border-slate-400 px-3 py-2 font-medium">
                            {application.resident}
                          </td>
                          <td className="h-10 border border-slate-400 px-3 py-2 text-xs text-muted-foreground">
                            {formatAddress(application)}
                          </td>
                          <td className="h-10 border border-slate-400 px-2 py-2 text-center text-xs font-semibold capitalize">
                            {formatGender(application.sex)}
                          </td>
                          <td className="h-10 border border-slate-400 px-2 py-2 text-center text-sm font-bold text-slate-700">
                            {sectors?.has("solo_parent") ? "✓" : ""}
                          </td>
                          <td className="h-10 border border-slate-400 px-2 py-2 text-center text-sm font-bold text-slate-700">
                            {sectors?.has("4ps") ? "✓" : ""}
                          </td>
                          <td className="h-10 border border-slate-400 px-2 py-2 text-center text-sm font-bold text-slate-700">
                            {sectors?.has("senior_citizen") ? "✓" : ""}
                          </td>
                          <td className="h-10 border border-slate-400 px-2 py-2 text-center text-sm font-bold text-slate-700">
                            {sectors?.has("pwd") ? "✓" : ""}
                          </td>
                        </tr>
                      );
                    })}
                    {Array.from({ length: blankRows }, (_, index) => (
                      <tr key={`blank-${index}`}>
                        {Array.from({ length: 8 }, (_, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="h-10 border border-slate-400 px-3 py-2"
                          ></td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
