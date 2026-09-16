import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { SectorRegistrationStatus } from "@/types/sector";

const statusVariantMap: Record<SectorRegistrationStatus, BadgeProps["variant"]> = {
  pending_review: "warning",
  pending_appointment: "muted",
  appointment_booked: "info",
  document_uploaded: "warning",
  under_review: "purple",
  verified: "success",
  rejected: "destructive",
};

interface Props {
  status: SectorRegistrationStatus;
  label: string;
}

export function SectorStatusBadge({ status, label }: Props) {
  return (
    <Badge
      variant={statusVariantMap[status]}
      className="rounded-md px-2.5 py-0.5 text-xs font-medium normal-case tracking-normal"
    >
      {label}
    </Badge>
  );
}
