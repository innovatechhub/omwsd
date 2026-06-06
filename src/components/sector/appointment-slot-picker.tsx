import { Calendar, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppointmentSlot } from "@/types/sector";

interface Props {
  slots: AppointmentSlot[];
  selectedSlotId: string | null;
  onSelect: (slotId: string) => void;
  disabled?: boolean;
}

export function AppointmentSlotPicker({ slots, selectedSlotId, onSelect, disabled }: Props) {
  if (slots.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--portal-outline)] p-8 text-center text-sm text-[var(--portal-muted)]">
        No available appointment slots at this time. Please check back later.
      </div>
    );
  }

  // Group by date
  const grouped = slots.reduce<Record<string, AppointmentSlot[]>>((acc, slot) => {
    const key = slot.slotDate;
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([date, dateSlots]) => (
        <div key={date}>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
            <Calendar className="h-3.5 w-3.5" />
            {new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date(date + "T00:00:00"))}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {dateSlots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                disabled={disabled || slot.isFull}
                onClick={() => onSelect(slot.id)}
                className={cn(
                  "flex items-start justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                  slot.isFull
                    ? "cursor-not-allowed border-[var(--portal-outline)] bg-slate-50 opacity-50"
                    : selectedSlotId === slot.id
                      ? "border-[var(--portal-accent)] bg-blue-50 ring-1 ring-[var(--portal-accent)]"
                      : "border-[var(--portal-outline)] bg-white hover:border-[var(--portal-accent)] hover:bg-blue-50/40",
                )}
              >
                <span>
                  <span className="flex items-center gap-1 font-medium text-[var(--portal-ink)]">
                    <Clock className="h-3.5 w-3.5 text-[var(--portal-muted)]" />
                    {new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(`${slot.slotDate}T${slot.slotTime}`))}
                  </span>
                  {slot.notes && (
                    <span className="mt-0.5 block text-xs text-[var(--portal-muted)]">{slot.notes}</span>
                  )}
                </span>
                <span className={cn(
                  "ml-3 flex items-center gap-1 whitespace-nowrap text-xs",
                  slot.isFull ? "text-red-500" : "text-[var(--portal-muted)]",
                )}>
                  <Users className="h-3.5 w-3.5" />
                  {slot.isFull ? "Full" : `${slot.availableCount} left`}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
