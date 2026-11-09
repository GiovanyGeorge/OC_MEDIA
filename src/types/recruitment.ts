export type AcademicYear = 'First' | 'Second' | 'Third' | 'Fourth';

export interface FormDataState {
  fullName: string;
  phoneNumber: string;
  academicYear: AcademicYear | '';
  mediaSkills: string[];
  otherSkill: string;
  equipment: string[];
  otherEquipment: string;
  portfolioFile: File | null;
  externalPortfolioUrl: string;
  agreedToTerms: boolean;
}

export interface FormErrors {
  fullName?: string;
  phoneNumber?: string;
  academicYear?: string;
  mediaSkills?: string;
  otherSkill?: string;
  equipment?: string;
  otherEquipment?: string;
  portfolioFile?: string;
  externalPortfolioUrl?: string;
  agreedToTerms?: string;
  general?: string;
}

export interface SubmissionPayload {
  fullName: string;
  phoneNumber: string;
  academicYear: string;
  mediaSkills: string[];
  otherSkill?: string;
  equipment: string[];
  otherEquipment?: string;
  externalPortfolioUrl?: string;
  file?: {
    name: string;
    type: string;
    size: number;
    base64: string;
  };
}

export interface SubmissionResult {
  success: boolean;
  submissionId?: string;
  submissionDate?: string;
  fullName?: string;
  phone?: string;
  portfolioUrl?: string;
  message?: string;
  error?: string;
}

