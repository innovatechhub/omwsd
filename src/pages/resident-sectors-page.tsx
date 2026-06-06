import { ArrowRight, CheckCircle2, Clock, FileSearch, ShieldCheck, Users, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useSectorRegistrations } from "@/hooks/use-sector-registrations";
import { SectorStatusBadge } from "@/components/sector/sector-status-badge";
import type { SectorRegistration, SectorType } from "@/types/sector";

interface SectorConfig {
  type: SectorType;
  label: string;
  description: string;
  idTypes: string[];
  color: string;
  icon: React.ReactNode;
}

const SECTORS: SectorConfig[] = [
  {
    type: "pwd",
    label: "Person with Disability (PWD)",
    description: "Access PWD benefits, services, and discounts through the OMSWD.",
    idTypes: ["PWD ID", "Medical Certificate", "Disability Assessment Report"],
    color: "from-blue-50 to-blue-100/60 border-blue-200",
    icon: <Users className="h-6 w-6 text-blue-600" />,
  },
  {
    type: "senior_citizen",
    label: "Senior Citizen",
    description: "Register as a senior citizen (60 years old and above) for OSCA benefits.",
    idTypes: ["Senior Citizen ID", "Birth Certificate", "Government-issued ID with birthdate"],
    color: "from-amber-50 to-amber-100/60 border-amber-200",
    icon: <ShieldCheck className="h-6 w-6 text-amber-600" />,
  },
  {
    type: "solo_parent",
    label: "Solo Parent",
    description: "Register as a solo parent under RA 8972 for support services.",
    idTypes: ["Solo Parent ID", "Birth Certificate of child/ren", "Proof of solo parenthood"],
    color: "from-purple-50 to-purple-100/60 border-purple-200",
    icon: <FileSearch className="h-6 w-6 text-purple-600" />,
  },
];

function statusIcon(reg: SectorRegistration | undefined) {
  if (!reg) return null;
  if (reg.status === "verified") return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (reg.status === "rejected") return <XCircle className="h-4 w-4 text-red-500" />;
  return <Clock className="h-4 w-4 text-amber-500" />;
}

export function ResidentSectorsPage() {
  const { user } = useAuth();
  const registrationsQuery = useSectorRegistrations(user?.id ?? "");
  const registrations = registrationsQuery.data ?? [];

  const regByType = registrations.reduce<Partial<Record<SectorType, SectorRegistration>>>((acc, r) => {
    acc[r.sectorType] = r;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--portal-ink)]">Sector Registration</h1>
        <p className="mt-1 text-sm text-[var(--portal-muted)]">
          Register under special sectors to access targeted government services and benefits.
        </p>
      </div>

      {/* How it works */}
      <div className="portal-soft-card rounded-xl p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--portal-muted)]">How it works</p>
        <ol className="grid gap-3 sm:grid-cols-4">
          {[
            { step: "1", title: "Select sector", detail: "Choose PWD, Senior Citizen, or Solo Parent." },
            { step: "2", title: "Book appointment", detail: "Pick an available date and time at the OMSWD office." },
            { step: "3", title: "Upload document", detail: "Submit a photo or scan of your qualifying ID or certificate." },
            { step: "4", title: "Get verified", detail: "OMSWD staff reviews your submission and confirms your status." },
          ].map(({ step, title, detail }) => (
            <li key={step} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--portal-accent)] text-xs font-bold text-white">
                {step}
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--portal-ink)]">{title}</p>
                <p className="text-xs text-[var(--portal-muted)]">{detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Sector tiles */}
      <div className="grid gap-5 md:grid-cols-3">
        {SECTORS.map((sector) => {
          const reg = regByType[sector.type];
          const isVerified = reg?.status === "verified";

          return (
            <div
              key={sector.type}
              className={`relative flex flex-col rounded-xl border bg-gradient-to-br p-5 ${sector.color}`}
            >
              {isVerified && (
                <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified
                </span>
              )}

              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/70 shadow-sm">
                  {sector.icon}
                </div>
                <div className="flex-1 pr-8">
                  <p className="text-sm font-bold text-[var(--portal-ink)]">{sector.label}</p>
                </div>
              </div>

              <p className="mb-4 flex-1 text-xs text-[var(--portal-muted)]">{sector.description}</p>

              {reg ? (
                <div className="mb-4 rounded-lg border border-white/70 bg-white/60 px-3 py-2">
                  <div className="mb-1 flex items-center gap-2">
                    {statusIcon(reg)}
                    <SectorStatusBadge status={reg.status} label={reg.statusLabel} />
                  </div>
                  {reg.adminRemarks && (
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--portal-muted)]">{reg.adminRemarks}</p>
                  )}
                </div>
              ) : (
                <div className="mb-4 rounded-lg border border-dashed border-white/80 bg-white/40 px-3 py-2 text-xs text-[var(--portal-muted)]">
                  Not yet registered
                </div>
              )}

              <Link
                to={`/resident/sectors/${sector.type}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[var(--portal-ink)] shadow-sm transition-colors hover:bg-white/80"
              >
                {reg ? "View registration" : "Register now"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
