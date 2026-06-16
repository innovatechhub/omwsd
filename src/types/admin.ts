import type { FamilyCompositionMember } from "@/types/application";

export interface AdminApplicationRecord {
  id: string;
  reference: string;
  resident: string;
  assistance: string;
  status: "Pending" | "For correction" | "For interview" | "Approved";
  barangay: string;
  municipality: string;
  priority: "Normal" | "High" | "Urgent";
  submittedAt: string;
  submittedAtRaw: string | null;
  requestReason: string;
  remarks: string;
  birthDate: string | null;
  sex: string | null;
  civilStatus: string | null;
  contactNumber: string;
  addressLine: string;
  householdSize: number | null;
  monthlyIncome: number | null;
  educationalAttainment: string | null;
  occupation: string | null;
  relationshipToBeneficiary: string | null;
  familyComposition: FamilyCompositionMember[];
  profileId: string | null;
}

export interface AdminProgramRequirementRecord {
  id: string;
  name: string;
  description: string | null;
  documentType: string | null;
  isRequired: boolean;
  sortOrder: number;
}

export interface AdminProgramRecord {
  id: string;
  code: string;
  name: string;
  supportType: string;
  description: string;
  estimatedProcessingDays: number | null;
  isActive: boolean;
  requirements: AdminProgramRequirementRecord[];
}

export interface SaveAdminProgramInput {
  id?: string;
  code: string;
  name: string;
  supportType: string;
  description: string;
  estimatedProcessingDays: number | null;
  isActive: boolean;
  requirements: Array<{
    id?: string;
    name: string;
    description: string | null;
    documentType: string | null;
    isRequired: boolean;
    sortOrder: number;
  }>;
}

export interface AdminCaseDocumentRecord {
  id: string;
  applicationRequirementId: string | null;
  bucket: string;
  filePath: string;
  fileName: string;
  status: string;
  statusLabel: string;
  remarks: string | null;
  createdAt: string;
  createdAtLabel: string;
}

export interface AdminCaseRequirementRecord {
  id: string;
  requirementId: string;
  name: string;
  description: string | null;
  sortOrder: number;
  status: string;
  statusLabel: string;
  remarks: string | null;
  reviewedAt: string | null;
  reviewedAtLabel: string | null;
  documents: AdminCaseDocumentRecord[];
  isActionable: boolean;
}

export interface AdminApplicationCaseDetails {
  requirements: AdminCaseRequirementRecord[];
  documents: AdminCaseDocumentRecord[];
}

export interface AdminResidentRecord {
  id: string;
  profileId: string;
  residentCode: string;
  name: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  email: string;
  status: "Verified" | "Pending verification";
  barangay: string;
  municipality: string;
  addressLine: string;
  account: "Active" | "Suspended";
  contact: string;
  birthDate: string;
  birthDateLabel: string;
  sex: string;
  sexLabel: string;
  civilStatus: string;
  civilStatusLabel: string;
  governmentIdType: string;
  governmentIdTypeLabel: string;
  governmentIdNumber: string;
  registeredAt: string;
  verifiedAt: string;
  referenceCount: number;
  hasResidentRow: boolean;
}

export interface AdminResidentIdFile {
  name: string;
  filePath: string;
  bucket: string;
  updatedAt: string | null;
}

export interface AdminDashboardMetrics {
  totalApplications: number;
  pendingVerification: number;
  approved: number;
  forCorrection: number;
}

export interface AdminBarangayMetric {
  name: string;
  applications: number;
}

export interface AdminQueueItem {
  reference: string;
  resident: string;
  service: string;
  status: string;
  priority: "Normal" | "High" | "Urgent";
  submittedAtRaw: string | null;
}
