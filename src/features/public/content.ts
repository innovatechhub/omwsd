export interface PublicService {
  slug: string;
  title: string;
  category: string;
  summary: string;
  description: string;
  requirements: string[];
  process: string[];
  turnaround: string;
}

export const publicServices: PublicService[] = [
  {
    slug: "medical-assistance",
    title: "Medical Assistance",
    category: "Health",
    summary: "Support for medicines, diagnostics, and urgent treatment-related needs.",
    description:
      "OMSWD coordinates case intake for residents who need support for hospital referrals, medicines, laboratory procedures, or other medically urgent expenses.",
    requirements: [
      "Valid government-issued ID",
      "Medical abstract or certificate",
      "Prescription, quotation, or billing statement",
      "Barangay indigency or residency certification",
    ],
    process: [
      "Complete the assistance request form and upload initial documents.",
      "OMSWD validates residency and reviews the urgency of the case.",
      "Staff may request clarifications or additional medical paperwork.",
      "Approved applications proceed to assistance release scheduling.",
    ],
    turnaround: "Typically reviewed within 5 to 7 working days",
  },
  {
    slug: "burial-assistance",
    title: "Burial Assistance",
    category: "Emergency",
    summary: "Immediate support for burial expenses during bereavement.",
    description:
      "This service helps eligible families who need emergency assistance for funeral and burial-related costs after the death of a household member.",
    requirements: [
      "Valid ID of the requesting family member",
      "Death certificate or certification from the attending authority",
      "Funeral service quotation or official receipt",
      "Proof of residency or barangay certification",
    ],
    process: [
      "Submit the emergency request and supporting records.",
      "Staff reviews documentation and household eligibility.",
      "Case verification is prioritized because of the urgent timeline.",
      "Qualified applicants receive instructions for next release steps.",
    ],
    turnaround: "Targeted within 3 to 5 working days",
  },
  {
    slug: "food-relief",
    title: "Food Relief",
    category: "Basic Needs",
    summary: "Short-term support for families affected by crisis or disruption.",
    description:
      "Food relief intake is used for households experiencing temporary hardship caused by disasters, displacement, sudden income loss, or other emergencies.",
    requirements: [
      "Valid ID",
      "Brief incident or hardship description",
      "Barangay certification or incident endorsement",
    ],
    process: [
      "Submit a household request and describe the immediate need.",
      "OMSWD verifies barangay endorsement and household condition.",
      "Available relief support is matched to the validated request.",
      "Beneficiaries receive follow-up instructions from staff.",
    ],
    turnaround: "Initial review within 2 to 3 working days",
  },
  {
    slug: "educational-assistance",
    title: "Educational Assistance",
    category: "Education",
    summary: "Limited support for qualified residents with school-related needs.",
    description:
      "Educational assistance intake supports eligible students or guardians seeking help for tuition-related, school supply, or enrollment requirements.",
    requirements: [
      "Valid ID of the student or guardian",
      "Certificate of enrollment or school registration",
      "Assessment, billing statement, or fee quotation",
      "Proof of residency",
    ],
    process: [
      "Send an application with current school documents.",
      "Staff validates residency and checks eligibility requirements.",
      "Applicants may be asked for updated enrollment or income records.",
      "Qualified requests are endorsed for release scheduling.",
    ],
    turnaround: "Usually 7 to 10 working days",
  },
];

export const processTimeline = [
  "Create or sign in to your OMSWD account.",
  "Complete the request form and upload the required documents.",
  "Wait for residency verification and initial case review.",
  "Respond to any document corrections or follow-up instructions.",
  "Track application status through the resident portal.",
];

export const publicAnnouncements = [
  {
    slug: "document-check-before-submission",
    title: "Document check before online submission",
    date: "March 8, 2026",
    summary:
      "Residents are encouraged to prepare clear scanned copies of IDs, certifications, and supporting records before using the request portal.",
  },
  {
    slug: "resident-account-registration-open",
    title: "Resident account registration is now available",
    date: "March 8, 2026",
    summary:
      "Online account registration is active for residents who want to track requests and receive portal updates.",
  },
  {
    slug: "service-routing-and-verification",
    title: "Verification remains part of every assistance workflow",
    date: "March 8, 2026",
    summary:
      "All requests still undergo OMSWD validation and may require follow-up documents even after online submission.",
  },
];

export const faqItems = [
  {
    question: "Who can use the OMSWD request portal?",
    answer:
      "Residents of Pandan who need assistance and can provide basic identification and residency details may use the portal for intake and tracking.",
  },
  {
    question: "Do I need an account before requesting assistance?",
    answer:
      "The portal is designed around resident accounts so requests, updates, and follow-up documents can be tracked in one place.",
  },
  {
    question: "Will approval happen immediately after submission?",
    answer:
      "No. Every request still goes through residency verification, case review, and requirement checking before a decision is issued.",
  },
  {
    question: "What file types are accepted for uploads?",
    answer:
      "The portal accepts PDF, JPG, and PNG files for supporting documents and requirement uploads.",
  },
  {
    question: "Can OMSWD ask for more documents later?",
    answer:
      "Yes. Staff may request corrections, clarifications, or additional supporting files during review.",
  },
  {
    question: "Where can I track my request status?",
    answer:
      "Use the resident portal dashboard after signing in. That area is intended for status history, remarks, and upload follow-ups.",
  },
];

export const requirementsChecklist = [
  {
    title: "Identity and residency",
    items: [
      "Government-issued ID",
      "Barangay certification or proof of residency",
      "Current contact details",
    ],
  },
  {
    title: "Case-specific support records",
    items: [
      "Medical abstract, billing statement, or prescription",
      "School enrollment or assessment records",
      "Incident-related endorsements when applicable",
    ],
  },
  {
    title: "Portal submission readiness",
    items: [
      "Readable scanned or photographed documents",
      "Accurate personal and address information",
      "Consent to portal-based processing and follow-up",
    ],
  },
];

export const officeContacts = {
  office: "Office of Municipal Social Welfare and Development",
  municipality: "Pandan, Antique, Philippines",
  hours: "Monday to Friday, 8:00 AM to 5:00 PM",
  channels: [
    "Municipal social welfare office front desk",
    "Resident portal notifications for follow-up updates",
    "Official contact channels to be finalized by deployment",
  ],
};

export function getServiceBySlug(slug: string) {
  return publicServices.find((service) => service.slug === slug) ?? null;
}
