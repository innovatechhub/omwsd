import { Badge } from "@/components/ui/badge";
import type { SectorRegistrationStatus } from "@/types/sector";

interface Props {
  status: SectorRegistrationStatus;
  label: string;
}

const variantMap: Record<SectorRegistrationStatus, string> = {
  pending_appointment: "bg-slate-100 text-slate-600",
  appointment_booked:  "bg-blue-100 text-blue-700",
  document_uploaded:   "bg-yellow-100 text-yellow-700",
  under_review:        "bg-purple-100 text-purple-700",
  verified:            "bg-green-100 text-green-700",
  rejected:            "bg-red-100 text-red-700",
};

export function SectorStatusBadge({ status, label }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantMap[status]}`}>
      {label}
    </span>
  );
}
