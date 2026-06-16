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

export interface RequirementFileEntry {
  requirementTemplateId: string;
  files: File[];
}

export interface FamilyCompositionMember {
  name: string;
  educationalAttainment: string;
  age: string;
  relationship: string;
  occupation: string;
  monthlyIncome: string;
}

export interface ResidentAssistanceRequestInput {
  assistanceTypeSlug: string;
  requestedAmount: string;
  householdSize: string;
  monthlyIncome: string;
  requestReason: string;
  /** Per-requirement files keyed by assistance_requirement template id */
  requirementFiles: RequirementFileEntry[];
  /** General / unlinked supporting documents */
  supportingDocuments: File[];
  consentAccepted: boolean;
  relationshipToBeneficiary?: string;
  educationalAttainment?: string;
  occupation?: string;
  familyComposition: FamilyCompositionMember[];
}
