export type SectorType = "pwd" | "senior_citizen" | "solo_parent";

export type SectorRegistrationStatus =
  | "pending_review"
  | "pending_appointment"
  | "appointment_booked"
  | "document_uploaded"
  | "under_review"
  | "verified"
  | "rejected";

export interface SectorRegistration {
  id: string;
  residentId: string;
  profileId: string;
  sectorType: SectorType;
  sectorTypeLabel: string;
  status: SectorRegistrationStatus;
  statusLabel: string;
  sectorIdType: string | null;
  sectorIdNumber: string | null;
  documentFilePath: string | null;
  documentFileName: string | null;
  documentBucket: string | null;
  documentUploadedAt: string | null;
  appointmentId: string | null;
  adminRemarks: string | null;
  reviewedAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentSlot {
  id: string;
  slotDate: string;
  slotTime: string;
  slotLabel: string;
  sectorType: SectorType | null;
  maxCapacity: number;
  bookedCount: number;
  availableCount: number;
  isFull: boolean;
  isActive: boolean;
  notes: string | null;
}

export interface Appointment {
  id: string;
  sectorRegistrationId: string;
  residentId: string;
  profileId: string;
  slotId: string;
  slotLabel: string;
  slotDate: string;
  sectorType: SectorType | null;
  sectorTypeLabel: string | null;
  status: "booked" | "confirmed" | "completed" | "cancelled" | "no_show";
  statusLabel: string;
  notes: string | null;
  createdAt: string;
}

export interface AdminSectorRegistrationRecord {
  id: string;
  residentId: string;
  profileId: string;
  residentName: string;
  residentCode: string;
  barangay: string;
  sectorType: SectorType;
  sectorTypeLabel: string;
  status: SectorRegistrationStatus;
  statusLabel: string;
  sectorIdType: string | null;
  sectorIdNumber: string | null;
  documentFilePath: string | null;
  documentFileName: string | null;
  documentBucket: string | null;
  documentUploadedAt: string | null;
  appointmentSlotLabel: string | null;
  appointmentStatus: string | null;
  appointmentStatusLabel: string | null;
  adminRemarks: string | null;
  reviewedAt: string | null;
  createdAt: string;
  createdAtLabel: string;
}

export interface AdminAppointmentRecord {
  id: string;
  sectorRegistrationId: string;
  residentName: string;
  residentCode: string;
  barangay: string;
  sectorType: SectorType;
  sectorTypeLabel: string;
  slotLabel: string;
  slotDate: string;
  status: "booked" | "confirmed" | "completed" | "cancelled" | "no_show";
  statusLabel: string;
  notes: string | null;
  createdAt: string;
}

export interface CreateAppointmentSlotInput {
  slotDate: string;
  slotTime: string;
  slotLabel: string;
  sectorType: SectorType | null;
  maxCapacity: number;
  notes?: string;
}
