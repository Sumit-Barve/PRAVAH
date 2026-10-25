export type ApplicationStage =
  | 'SUBMITTED'
  | 'SCRUTINY'
  | 'RE_SCRUTINY'
  | 'EVC_SCHEDULED'
  | 'EVC_COMPLETED'
  | 'SHC_HEARING'
  | 'SAC_APPEAL'
  | 'APPROVED_CONDITIONAL'
  | 'APPROVAL_GRANTED'
  | 'REJECTED';

export type ApplicationCategory =
  | 'NEW_INSTITUTE'
  | 'EOA_EXISTING'
  | 'INTAKE_INCREASE'
  | 'SUPERNUMERARY_SEATS'
  | 'CHANGE_OF_SITE'
  | 'WOMEN_TO_COED'
  | 'CLOSURE';

export type Region =
  | 'NORTHERN'
  | 'NORTH_WEST'
  | 'WESTERN'
  | 'CENTRAL'
  | 'SOUTH_WEST'
  | 'SOUTHERN'
  | 'EASTERN'
  | 'SOUTH_CENTRAL';

export type InstitutionType =
  | 'PRIVATE_SELF_FINANCED'
  | 'GOVERNMENT'
  | 'GOVT_AIDED'
  | 'DEEMED_UNIVERSITY'
  | 'STATE_UNIVERSITY';

export type PriorityLevel = 'NORMAL' | 'MEDIUM' | 'HIGH' | 'CRITICAL_OVERDUE';

export type EVCStatus =
  | 'PENDING_CONSTITUTION'
  | 'CONSTITUTED'
  | 'SCHEDULED'
  | 'VISIT_COMPLETED'
  | 'REPORT_SUBMITTED'
  | 'REPORT_OVERDUE';

export type ComplianceStatus =
  | 'ACTIVE_PENDING'
  | 'UNDER_REVIEW'
  | 'VERIFIED_SATISFACTORY'
  | 'OVERDUE_ESCALATED';

export type DocumentType =
  | 'LAND_LEASE'
  | 'FIRE_SAFETY_NOC'
  | 'BUILDING_OCCUPANCY'
  | 'NBA_ACCREDITATION'
  | 'FDR_ENDOWMENT';

export type ValidityStatus =
  | 'VALID'
  | 'EXPIRING_SOON'
  | 'CRITICAL_WARNING'
  | 'EXPIRED';

export type UserRole =
  | 'SCRUTINY_OFFICER'
  | 'REGIONAL_OFFICER'
  | 'EVC_EXPERT'
  | 'EVC_CONVENER'
  | 'SAC_SHC_MEMBER'
  | 'MEMBER_SECRETARY'
  | 'SYSTEM_ADMIN'
  | 'INSTITUTION_USER';

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  region?: Region | null;
  department?: string | null;
  institutionId?: string | null;
  institutionName?: string | null;
  permanentInstituteId?: string | null;
  isActive: boolean;
  isEmailVerified?: boolean;
  lastLoginAt?: string | null;
}

export interface Institution {
  id: string;
  permanentInstituteId: string;
  name: string;
  trustName: string;
  institutionType: InstitutionType;
  region: Region;
  state: string;
  district?: string | null;
  address?: string | null;
  pincode?: string | null;
  contactEmail: string;
  contactPhone?: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  applicationNumber: string; // e.g. "AICTE/2026/RO-NW/10928"
  permanentInstituteId: string; // e.g. "1-3489128"
  instituteName: string;
  trustName: string;
  category: ApplicationCategory;
  institutionType: InstitutionType;
  region: Region;
  state: string;
  currentStage: ApplicationStage;
  priority: PriorityLevel;
  totalAgeingDays: number;
  stageAgeingDays: number;
  submissionDate: string;
  assignedOfficerId?: string | null;
  assignedOfficer?: string | null;
  pendingWithRole: UserRole;
  isDeficient: boolean;
  deficiencyCount: number;
  evcScheduledDate?: string | null;
  landAreaAcres: number;
  approvedIntake: number;
  requestedIntake: number;
  academicCycle?: string;
  isDraft?: boolean;
  draftData?: Record<string, unknown> | null;
  institutionId?: string | null;
  documents?: ApplicationDocument[];
  deficiencyNotices?: DeficiencyNotice[];
  lastUpdated: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  institutionId: string;
  documentType: DocumentType;
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  fileHash?: string | null;
  uploadedById: string;
  verificationStatus: string;
  remarks?: string | null;
  aiValidation?: NugenDocumentValidationResult | null;
  createdAt: string;
  updatedAt: string;
}

export type NugenRelevance = 'MATCH' | 'LIKELY_MISMATCH' | 'INCONCLUSIVE';

export interface NugenDocumentValidationResult {
  expectedDocumentType: DocumentType;
  predictedDocumentType: string;
  relevance: NugenRelevance;
  confidenceScore?: number;
  extractedFields: {
    documentNumber?: string;
    issuingAuthority?: string;
    issueDate?: string;
    expiryDate?: string;
    institutionName?: string;
    landAreaAcres?: string;
    aphClauseRef?: string;
    [key: string]: string | undefined;
  };
  explanation: string;
  inconsistencies: string[];
  validatedAt: string;
  model: string;
}

export interface DeficiencyNotice {
  id: string;
  applicationId: string;
  applicationNumber?: string;
  noticeNumber: string;
  title: string;
  description: string;
  parameterName?: string | null;
  requirementRef?: string | null;
  issuedById: string;
  issuedByName: string;
  issuedRole: UserRole;
  isReleased: boolean;
  releasedAt?: string | null;
  dueDate?: string | null;
  status:
    | 'DRAFT'
    | 'ISSUED'
    | 'RESPONDED'
    | 'RESOLVED'
    | 'ESCALATED'
    | 'AWAITING_OFFICER_REVIEW'
    | 'RESOLVED_SATISFIED'
    | 'REJECTED_UNSATISFACTORY'
    | 'ISSUED_PENDING_RESPONSE'
    | string;
  institutionResponse?: string | null;
  responseSubmittedAt?: string | null;
  responseDocumentRef?: string | null;
  officerReviewNotes?: string | null;
  reviewedAt?: string | null;
  reviewedById?: string | null;
  reviewedByName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  recipientUserId?: string | null;
  institutionId?: string | null;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'DEFICIENCY' | 'DEADLINE' | 'SUCCESS';
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface EVCInspection {
  id: string;
  applicationId: string;
  applicationNumber: string;
  instituteName: string;
  region: Region;
  proposedDate: string;
  actualVisitDate?: string;
  status: EVCStatus;
  convenerName: string;
  convenerAffiliation: string;
  isOverdue: boolean;
  delayHours: number;
  reportUploadedDate?: string;
  recommendationOutcome?: string;
  expertMembers?: Array<{
    id?: string;
    name: string;
    designation: string;
    specialization: string;
  }>;
}

export interface ComplianceItem {
  id: string;
  applicationId: string;
  applicationNumber: string;
  instituteName: string;
  region: Region;
  undertakingType: string;
  description: string;
  grantedDate: string;
  dueDate: string;
  daysRemaining: number;
  status: ComplianceStatus;
  isOverdue: boolean;
  submittedDocumentRef?: string;
  lastReminderSentDate?: string;
  escalationLevel: string;
}

export interface DocumentValidityItem {
  id: string;
  applicationId: string;
  instituteName: string;
  documentType: DocumentType;
  documentIdentifier: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  daysToExpiry: number;
  validityStatus: ValidityStatus;
  alertLevel: 'GREEN' | 'AMBER' | 'ORANGE' | 'RED' | string;
  requiredForCategory: ApplicationCategory[];
  lastVerificationDate?: string;
}

export interface DashboardMetrics {
  totalApplications: number;
  stageDistribution: Record<ApplicationStage, number>;
  categoryDistribution: Record<ApplicationCategory, number>;
  pendingScrutinyCount: number;
  overdueTasksCount: number;
  evcScheduledCount: number;
  evcOverdueReportsCount: number;
  complianceDueSoonCount: number;
  complianceOverdueCount: number;
  documentValidityExpiringSoonCount: number;
  documentValidityExpiredCount: number;
  averageAgeingDays: number;
  criticalAlertCount: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  actionCode: string;
  actionTitle: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddressMasked: string;
  previousState?: string;
  newState?: string;
}

export interface RegulatoryRule {
  id: string;
  ruleCode: string;
  applicationCategory: ApplicationCategory;
  requirementTitle: string;
  responsibleRole: UserRole;
  sourceTitle: string;
  chapterSectionPage: string;
  sourceVersion: string;
  effectivePeriod: string;
  verificationStatus: 'VERIFIED' | 'PROPOSED' | 'DEPRECATED' | 'PENDING_VERIFICATION' | string;
  slaDays: number;
  escalationIntervalDays: number;
  notes: string;
}

/**
 * Category-specific document requirement mapping based on AICTE Approval Process Handbook (APH 2024-27)
 */
export const CATEGORY_DOCUMENT_CHECKLIST: Record<
  ApplicationCategory,
  Array<{
    documentType: DocumentType;
    title: string;
    description: string;
    mandatory: boolean;
    aphClause: string;
  }>
> = {
  NEW_INSTITUTE: [
    {
      documentType: 'LAND_LEASE',
      title: 'Registered Land Deed / Government Allotment Order',
      description: 'Min 30-year registered lease or ownership deed in the name of the Applicant Trust/Society.',
      mandatory: true,
      aphClause: 'APH 2024-27 Chapter I Clause 1.4',
    },
    {
      documentType: 'BUILDING_OCCUPANCY',
      title: 'Building Plan Approval & Occupancy Certificate',
      description: 'Sanctioned structural plan and Competent Authority Occupancy / Completion Certificate.',
      mandatory: true,
      aphClause: 'APH 2024-27 Chapter I Clause 1.6',
    },
    {
      documentType: 'FIRE_SAFETY_NOC',
      title: 'Fire Safety Certificate / NOC',
      description: 'Valid Fire Safety NOC issued by the State Fire and Rescue Services Authority.',
      mandatory: true,
      aphClause: 'APH 2024-27 Chapter I Clause 1.7',
    },
    {
      documentType: 'FDR_ENDOWMENT',
      title: 'Joint Fixed Deposit Receipt (Endowment Fund)',
      description: 'Proof of Joint FDR in the joint names of Trust/Society and Regional Officer, AICTE.',
      mandatory: true,
      aphClause: 'APH 2024-27 Chapter I Clause 1.8',
    },
  ],
  EOA_EXISTING: [
    {
      documentType: 'FIRE_SAFETY_NOC',
      title: 'Annual Fire Safety NOC / Renewal Endorsement',
      description: 'Current valid fire safety clearance for campus buildings.',
      mandatory: true,
      aphClause: 'APH 2024-27 Chapter II Clause 2.3',
    },
    {
      documentType: 'BUILDING_OCCUPANCY',
      title: 'Building Structural Stability / Occupancy Verification',
      description: 'Structural stability certificate issued by PWD / Empanelled Structural Engineer.',
      mandatory: true,
      aphClause: 'APH 2024-27 Chapter II Clause 2.4',
    },
    {
      documentType: 'LAND_LEASE',
      title: 'Land Ownership / Lease Continuity Certificate',
      description: 'Proof of continuous unencumbered lease validity.',
      mandatory: false,
      aphClause: 'APH 2024-27 Chapter II Clause 2.5',
    },
  ],
  INTAKE_INCREASE: [
    {
      documentType: 'NBA_ACCREDITATION',
      title: 'Valid NBA Accreditation Letter (Eligible Programmes)',
      description: 'Minimum 50% eligible programmes accredited by NBA with validity covering academic year.',
      mandatory: true,
      aphClause: 'APH 2024-27 Chapter II Clause 2.14',
    },
    {
      documentType: 'BUILDING_OCCUPANCY',
      title: 'Expanded Built-up Area Verification',
      description: 'Proof of additional carpet and instructional area as per AICTE cadre & intake norms.',
      mandatory: true,
      aphClause: 'APH 2024-27 Chapter II Clause 2.15',
    },
    {
      documentType: 'FIRE_SAFETY_NOC',
      title: 'Updated Fire Safety NOC (Covering Expanded Facilities)',
      description: 'Fire NOC covering new laboratories and classroom blocks.',
      mandatory: true,
      aphClause: 'APH 2024-27 Chapter II Clause 2.16',
    },
  ],
  SUPERNUMERARY_SEATS: [
    {
      documentType: 'NBA_ACCREDITATION',
      title: 'NBA Accreditation Certificate / Valid Status',
      description: 'Accreditation status in the respective programme applied for supernumerary intake.',
      mandatory: true,
      aphClause: 'APH 2024-27 Chapter II Clause 2.18',
    },
    {
      documentType: 'FIRE_SAFETY_NOC',
      title: 'Fire Safety NOC',
      description: 'Valid campus safety clearance.',
      mandatory: true,
      aphClause: 'APH 2024-27 Chapter II Clause 2.19',
    },
  ],
  CHANGE_OF_SITE: [
    {
      documentType: 'LAND_LEASE',
      title: 'New Site Registered Land Deed / Ownership Title',
      description: 'Registered title deeds for the proposed new site conforming to AICTE norms.',
      mandatory: true,
      aphClause: 'APH 2024-27 Chapter II Clause 2.22',
    },
    {
      documentType: 'BUILDING_OCCUPANCY',
      title: 'New Site Building Plan & Occupancy Certificate',
      description: 'Sanctioned architectural building plan and Occupancy Certificate of new site.',
      mandatory: true,
      aphClause: 'APH 2024-27 Chapter II Clause 2.23',
    },
    {
      documentType: 'FIRE_SAFETY_NOC',
      title: 'New Site Fire NOC',
      description: 'Fire Safety Certificate issued for new campus.',
      mandatory: true,
      aphClause: 'APH 2024-27 Chapter II Clause 2.24',
    },
  ],
  WOMEN_TO_COED: [
    {
      documentType: 'BUILDING_OCCUPANCY',
      title: 'Modified Infrastructure & Common Amenities Verification',
      description: 'Adequate separate common rooms, restrooms, and security amenities for co-education.',
      mandatory: true,
      aphClause: 'APH 2024-27 Chapter II Clause 2.25',
    },
    {
      documentType: 'FIRE_SAFETY_NOC',
      title: 'Fire Safety Clearance',
      description: 'Current campus fire safety NOC.',
      mandatory: true,
      aphClause: 'APH 2024-27 Chapter II Clause 2.26',
    },
  ],
  CLOSURE: [
    {
      documentType: 'BUILDING_OCCUPANCY',
      title: 'Trustees / Governing Body Resolution for Progressive Closure',
      description: 'Resolution of the Society/Trust and No Objection from Affiliating University & State Govt.',
      mandatory: true,
      aphClause: 'APH 2024-27 Chapter II Clause 2.28',
    },
  ],
};

export * from './mockData';
