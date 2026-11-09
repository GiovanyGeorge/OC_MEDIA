export interface RawSpreadsheetRow {
  [key: string]: unknown;
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
  status: string;             // Status e.g. 'قيد المراجعة' / 'Under Review' / 'Accepted' / 'Rejected'
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

export interface DashboardSummary {
  totalApplicants: number;
  applicantsWithPortfolio: number;
  portfolioPercentage: number;
  applicantsWithoutPortfolio: number;
  academicYearStats: AcademicYearStat[];
  topSkills: SkillStat[];
  allSkillsStats: SkillStat[];
  topEquipment: EquipmentStat[];
  allEquipmentStats: EquipmentStat[];
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

