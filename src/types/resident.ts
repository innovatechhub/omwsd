export interface ResidentUploadedDocument {
  id: string;
  applicationRequirementId: string | null;
  bucket: string;
  filePath: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  status: string;
  statusLabel: string;
  remarks: string | null;
  createdAt: string;
  createdAtLabel: string;
}

export interface ResidentRequirement {
  id: string;
  requirementId: string;
  name: string;
  description: string | null;
  documentType: string | null;
  isRequired: boolean;
  sortOrder: number;
  status: string;
  statusLabel: string;
  remarks: string | null;
  reviewedAt: string | null;
  reviewedAtLabel: string | null;
  documents: ResidentUploadedDocument[];
}

export interface ResidentStatusHistoryEntry {
  id: string;
  createdAt: string;
  createdAtLabel: string;
  status: string;
  statusLabel: string;
  remarks: string | null;
}

export interface ResidentApplicationSummary {
  id: string;
  residentId: string | null;
  referenceNumber: string;
  status: string;
  statusLabel: string;
  urgency: string | null;
  urgencyLabel: string;
  assistanceName: string;
  assistanceSlug: string | null;
  requestReason: string;
  requestedAmount: number | null;
  requestedAmountLabel: string;
  submittedAt: string;
  submittedAtLabel: string;
  reviewedAt: string | null;
  reviewedAtLabel: string | null;
  adminRemarks: string | null;
  requirements: ResidentRequirement[];
  documents: ResidentUploadedDocument[];
  statusHistory: ResidentStatusHistoryEntry[];
  progressStep: number;
  requiresAction: boolean;
}

export interface ResidentNotification {
  id: string;
  title: string;
  body: string;
  category: string;
  categoryLabel: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
  createdAtLabel: string;
}

export interface ResidentPortalSnapshot {
  residentId: string | null;
  application: ResidentApplicationSummary | null;
  notifications: ResidentNotification[];
  unreadNotifications: number;
  needsActionCount: number;
  profileIsComplete: boolean;
}
