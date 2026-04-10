export interface AdminApplicationRecord {
  id: string;
  reference: string;
  resident: string;
  assistance: string;
  status: "Pending verification" | "For correction" | "Under review" | "Approved" | "Completed";
  barangay: string;
  priority: "Normal" | "High" | "Urgent";
  submittedAt: string;
  remarks: string;
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
}

export interface AdminApplicationCaseDetails {
  requirements: AdminCaseRequirementRecord[];
  documents: AdminCaseDocumentRecord[];
}

export interface AdminResidentRecord {
  id: string;
  profileId: string;
  name: string;
  status: "Verified" | "Pending verification";
  barangay: string;
  account: "Active" | "Suspended";
  contact: string;
  referenceCount: number;
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
}
