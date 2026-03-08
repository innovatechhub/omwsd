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
