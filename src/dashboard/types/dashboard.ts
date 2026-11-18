export interface RawSpreadsheetRow {
  [key: string]: unknown;
}

export type ApplicantStatus = 'Pending Review' | 'Shortlisted' | 'Accepted' | 'Rejected' | string;

export interface ApplicantEvaluation {
  applicantId: string;
  statusOverride?: ApplicantStatus;
  skillRating?: number;        // 1 to 5
  portfolioRating?: number;    // 1 to 5
  notes?: string;              // Private administrative notes
  interviewNotes?: string;      // Committee feedback / observations
  isShortlisted?: boolean;     // Priority candidate
  isReviewed?: boolean;        // Reviewed indicator
  updatedAt?: string;          // ISO string
}

export interface ApplicantRecord {
  id: string;                 // Submission ID e.g. OC-MED-XXXX
  submissionDate: string;     // Formatted Date e.g. 2026-11-09 14:30
  rawDate?: Date;             // Parsed Date for sorting
  fullName: string;           // Full Name
  phoneNumber: string;        // Cleaned Phone Number
  academicYear: string;       // First / Second / Third / Fourth or Arabic
  academicYearNormalized: 'First' | 'Second' | 'Third' | 'Fourth' | 'Other';
  mediaSkills: string[];      // Array of parsed skills
  equipment: string[];        // Array of parsed equipment
  portfolioUrl: string;       // Direct URL or 'None'
  hasPortfolio: boolean;      // True if valid URL provided
  status: string;             // Imported Status e.g. 'قيد المراجعة' / 'Accepted'
  evaluation?: ApplicantEvaluation; // Optional local administrative overlay
  isDemo?: boolean;           // True if loaded from demo generator
}

export type DashboardTab = 'overview' | 'skills' | 'equipment' | 'applicants' | 'reports';

export interface FilterState {
  searchQuery: string;
  academicYear: string;
  skill: string;
  equipmentItem: string;
  status: string;
  portfolioFilter: 'all' | 'with_portfolio' | 'without_portfolio';
  reviewState?: 'all' | 'reviewed' | 'unreviewed' | 'shortlisted';
}

export interface SkillStat {
  skill: string;
  labelAr: string;
  labelEn: string;
  count: number;
  percentage: number;
}

export interface EquipmentStat {
  item: string;
  labelAr: string;
  labelEn: string;
  count: number;
  percentage: number;
}

export interface AcademicYearStat {
  yearKey: string;
  labelAr: string;
  labelEn: string;
  count: number;
  percentage: number;
}

export interface StatusStat {
  status: string;
  count: number;
  percentage: number;
}

export interface SkillByYearStat {
  skill: string;
  labelAr: string;
  labelEn: string;
  firstYear: number;
  secondYear: number;
  thirdYear: number;
  fourthYear: number;
  otherYear: number;
  total: number;
}

export interface DashboardSummary {
  totalApplicants: number;
  pendingCount: number;
  acceptedCount: number;
  rejectedCount: number;
  shortlistedCount: number;
  reviewedCount: number;
  unreviewedCount: number;
  applicantsWithPortfolio: number;
  portfolioPercentage: number;
  applicantsWithoutPortfolio: number;
  multipleEquipmentCount: number;
  multipleEquipmentPercentage: number;
  academicYearStats: AcademicYearStat[];
  topSkills: SkillStat[];
  allSkillsStats: SkillStat[];
  topEquipment: EquipmentStat[];
  allEquipmentStats: EquipmentStat[];
  skillByYearMatrix: SkillByYearStat[];
  statusStats: StatusStat[];
  uniqueSkillsCount: number;
  uniqueEquipmentCount: number;
  dateRange: {
    firstDate?: string;
    lastDate?: string;
  };
}

export interface ParseResult {
  success: boolean;
  applicants: ApplicantRecord[];
  fileName: string;
  rowCount: number;
  columnsDetected: string[];
  missingColumns?: string[];
  warnings?: string[];
  error?: string;
}

