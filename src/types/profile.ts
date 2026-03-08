import type { AppRole } from "@/types/auth";

export interface ResidentProfileSettings {
  profileId: string;
  residentId: string | null;
  residentCode: string | null;
  role: AppRole | null;
  email: string;
  fullName: string;
  phoneNumber: string;
  birthDate: string;
  sex: string;
  civilStatus: string;
  municipality: string;
  barangay: string;
  addressLine: string;
  householdSize: string;
  monthlyIncome: string;
  isActive: boolean;
  isVerified: boolean;
  verifiedAt: string | null;
}

export interface UpdateResidentProfileInput {
  email: string;
  fullName: string;
  phoneNumber: string;
  birthDate: string;
  sex: string;
  civilStatus: string;
  municipality: string;
  barangay: string;
  addressLine: string;
  householdSize: string;
  monthlyIncome: string;
}
