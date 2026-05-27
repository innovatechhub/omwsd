export interface AssistanceRequestFormValues {
  fullName: string;
  email: string;
  phoneNumber: string;
  birthDate: string;
  sex: string;
  civilStatus: string;
  addressLine: string;
  barangay: string;
  municipality: string;
  governmentIdType: string;
  governmentIdNumber: string;
  governmentIdFiles: File[];
  assistanceTypeSlug: string;
  requestedAmount: string;
  householdSize: string;
  monthlyIncome: string;
  requestReason: string;
  supportingDocuments: File[];
  consentAccepted: boolean;
}

export interface AssistanceRequestSubmissionResult {
  applicationId: string;
  referenceNumber: string;
}

export interface ResidentAssistanceRequestInput {
  assistanceTypeSlug: string;
  requestedAmount: string;
  householdSize: string;
  monthlyIncome: string;
  requestReason: string;
  supportingDocuments: File[];
  consentAccepted: boolean;
}
