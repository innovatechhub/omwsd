import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  LoaderCircle,
  Plus,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useResidentPortal } from "@/hooks/use-resident-portal";
import {
  useAvailableAppointmentSlots,
  useBookStandaloneAppointment,
  useResidentAppointments,
  useSectorRegistrations,
} from "@/hooks/use-sector-registrations";
import { AppointmentSlotPicker } from "@/components/sector/appointment-slot-picker";
import { Button } from "@/components/ui/button";
import type { Appointment, SectorRegistration, SectorType } from "@/types/sector";

const SECTOR_LABELS: Record<SectorType, string> = {
  pwd: "PWD",
  senior_citizen: "Senior Citizen",
  solo_parent: "Solo Parent",
};

const STATUS_CONFIG: Record<
  Appointment["status"],
  { label: string; color: string; icon: React.ReactNode }
> = {
  booked: {
    label: "Booked",
    color: "bg-blue-100 text-blue-700",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  completed: {
    label: "Completed",
    color: "bg-slate-100 text-slate-600",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-600",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  no_show: {
    label: "No show",
    color: "bg-orange-100 text-orange-700",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const cfg = STATUS_CONFIG[appointment.status];
  return (
    <div className="flex items-start gap-4 rounded-xl border border-[var(--portal-outline)] bg-white p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--portal-surface-soft)]">
        <Calendar className="h-5 w-5 text-[var(--portal-accent)]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[var(--portal-ink)] truncate">{appointment.slotLabel}</p>
        <p className="text-xs text-[var(--portal-muted)] mt-0.5">
          {appointment.sectorTypeLabel && (
            <span className="font-medium text-[var(--portal-ink)]">{appointment.sectorTypeLabel} · </span>
          )}
          Booked on {new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(appointment.createdAt))}
        </p>
      </div>
      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.color}`}>
        {cfg.icon}
        {cfg.label}
      </span>
    </div>
  );
}

function BookAppointmentPanel({
  verifiedRegistrations,
  userId,
  residentId,
  onBooked,
}: {
  verifiedRegistrations: SectorRegistration[];
  userId: string;
  residentId: string;
  onBooked: () => void;
}) {
  const [selectedSector, setSelectedSector] = useState<SectorType>(
    verifiedRegistrations[0]?.sectorType ?? "pwd"
  );
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const reg = verifiedRegistrations.find((r) => r.sectorType === selectedSector);
  const slotsQuery = useAvailableAppointmentSlots(selectedSector);
  const slots = slotsQuery.data ?? [];
  const bookMutation = useBookStandaloneAppointment(userId, selectedSector);

  async function handleBook() {
    if (!selectedSlotId || !reg) {
      toast.error("Please select an appointment slot.");
      return;
    }
    try {
      await bookMutation.mutateAsync({
        sectorRegistrationId: reg.id,
        residentId,
        slotId: selectedSlotId,
      });
      toast.success("Appointment booked!");
      setSelectedSlotId(null);
      onBooked();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to book appointment.");
    }
  }

  return (
    <div className="portal-card p-6 space-y-5">
      <div>
        <h2 className="text-base font-bold text-[var(--portal-ink)]">Book a new appointment</h2>
        <p className="mt-1 text-sm text-[var(--portal-muted)]">
          Select your sector and pick an available date and time at the OMSWD office.
        </p>
      </div>

      {verifiedRegistrations.length > 1 && (
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
            Sector
          </label>
          <div className="flex flex-wrap gap-2">
            {verifiedRegistrations.map((r) => (
              <button
                key={r.sectorType}
                type="button"
                onClick={() => { setSelectedSector(r.sectorType); setSelectedSlotId(null); }}
                className={[
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                  selectedSector === r.sectorType
                    ? "border-[var(--portal-accent)] bg-[var(--portal-accent)] text-white"
                    : "border-[var(--portal-outline)] bg-white text-[var(--portal-ink)] hover:bg-[var(--portal-surface-soft)]",
                ].join(" ")}
              >
                {SECTOR_LABELS[r.sectorType]}
              </button>
            ))}
          </div>
        </div>
      )}

      {slotsQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-[var(--portal-muted)]">
          <LoaderCircle className="h-4 w-4 animate-spin" /> Loading available slots...
        </div>
      ) : (
        <AppointmentSlotPicker
          slots={slots}
          selectedSlotId={selectedSlotId}
          onSelect={setSelectedSlotId}
          disabled={bookMutation.isPending}
        />
      )}

      <Button
        onClick={() => void handleBook()}
        disabled={bookMutation.isPending || !selectedSlotId}
        className="bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]"
      >
        {bookMutation.isPending ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Calendar className="h-4 w-4" />
        )}
        Confirm appointment
      </Button>
    </div>
  );
}

export function ResidentAppointmentsPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const portalQuery = useResidentPortal();
  const residentId = portalQuery.data?.residentId ?? "";

  const registrationsQuery = useSectorRegistrations(userId);
  const registrations = registrationsQuery.data ?? [];
  const verifiedRegistrations = registrations.filter((r) => r.status === "verified");

  const appointmentsQuery = useResidentAppointments(userId);
  const appointments = appointmentsQuery.data ?? [];

  const [showBookPanel, setShowBookPanel] = useState(false);

  const isLoading = registrationsQuery.isLoading || appointmentsQuery.isLoading || portalQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoaderCircle className="h-7 w-7 animate-spin text-[var(--portal-accent)]" />
      </div>
    );
  }

  if (verifiedRegistrations.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            to="/resident/sectors"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--portal-muted)] hover:text-[var(--portal-ink)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Sector Registration
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-[var(--portal-ink)]">My Appointments</h1>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--portal-outline)] py-16 text-center">
          <Calendar className="mb-3 h-10 w-10 text-[var(--portal-muted)]" />
          <p className="text-sm font-semibold text-[var(--portal-ink)]">No verified sector registration</p>
          <p className="mt-1 text-xs text-[var(--portal-muted)]">
            You need a verified sector registration before booking appointments.
          </p>
          <Link
            to="/resident/sectors"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--portal-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--portal-accent-strong)]"
          >
            Go to Sector Registration
          </Link>
        </div>
      </div>
    );
  }

  const upcomingAppointments = appointments.filter(
    (a) => a.status === "booked" || a.status === "confirmed"
  );
  const pastAppointments = appointments.filter(
    (a) => a.status === "completed" || a.status === "cancelled" || a.status === "no_show"
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/resident/sectors"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--portal-muted)] hover:text-[var(--portal-ink)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Sector Registration
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-[var(--portal-ink)]">My Appointments</h1>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            Schedule and track your OMSWD office visits.
          </p>
        </div>
        {!showBookPanel && (
          <Button
            onClick={() => setShowBookPanel(true)}
            className="bg-[var(--portal-accent)] text-white hover:bg-[var(--portal-accent-strong)]"
          >
            <Plus className="h-4 w-4" />
            Book appointment
          </Button>
        )}
      </div>

      {/* Verified sector badges */}
      <div className="flex flex-wrap gap-2">
        {verifiedRegistrations.map((r) => (
          <span
            key={r.sectorType}
            className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {r.sectorTypeLabel} — Verified
          </span>
        ))}
      </div>

      {showBookPanel && (
        <BookAppointmentPanel
          verifiedRegistrations={verifiedRegistrations}
          userId={userId}
          residentId={residentId}
          onBooked={() => {
            setShowBookPanel(false);
            void appointmentsQuery.refetch();
          }}
        />
      )}

      {/* Upcoming */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
          Upcoming
        </h2>
        {upcomingAppointments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--portal-outline)] py-10 text-center">
            <Clock className="mx-auto mb-2 h-7 w-7 text-[var(--portal-muted)]" />
            <p className="text-sm text-[var(--portal-muted)]">No upcoming appointments.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingAppointments.map((a) => (
              <AppointmentCard key={a.id} appointment={a} />
            ))}
          </div>
        )}
      </div>

      {/* Past */}
      {pastAppointments.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
            Past appointments
          </h2>
          <div className="space-y-3">
            {pastAppointments.map((a) => (
              <AppointmentCard key={a.id} appointment={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
