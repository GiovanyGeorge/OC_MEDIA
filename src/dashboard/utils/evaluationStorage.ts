import { ApplicantEvaluation } from '../types/dashboard';

const STORAGE_KEY = 'oc_media_admin_evaluations_v1';

/**
 * Loads all stored applicant evaluations from localStorage
 */
export function loadEvaluationsFromStorage(): Record<string, ApplicantEvaluation> {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {};
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, ApplicantEvaluation>;
    }
    return {};
  } catch (err) {
    console.error('Failed to load evaluations from storage:', err);
    return {};
  }
}

/**
 * Saves or updates an applicant's evaluation in localStorage
 */
export function saveEvaluationToStorage(evaluation: ApplicantEvaluation): Record<string, ApplicantEvaluation> {
  const current = loadEvaluationsFromStorage();
  const updated: Record<string, ApplicantEvaluation> = {
    ...current,
    [evaluation.applicantId]: {
      ...evaluation,
      updatedAt: new Date().toISOString(),
      isReviewed: true
    }
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save evaluation to storage:', err);
  }

  return updated;
}

/**
 * Removes an evaluation for a specific applicant
 */
export function removeEvaluationFromStorage(applicantId: string): Record<string, ApplicantEvaluation> {
  const current = loadEvaluationsFromStorage();
  if (!current[applicantId]) return current;

  delete current[applicantId];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Failed to update storage after removing evaluation:', err);
  }

  return { ...current };
}

/**
 * Exports all evaluations as a downloadable JSON backup file
 */
export function exportEvaluationsBackup(): void {
  const evaluations = loadEvaluationsFromStorage();
  const payload = {
    exportDate: new Date().toISOString(),
    system: 'OC Media Analytics Dashboard',
    committee: 'Media Committee - Faculty of Computers & Artificial Intelligence',
    totalEvaluations: Object.keys(evaluations).length,
    evaluations
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `OC_Media_Evaluations_Backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Imports evaluations from an uploaded JSON backup file
 */
export function importEvaluationsFromJson(
  jsonContent: string
): { success: boolean; count: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonContent);
    const candidateMap = parsed.evaluations || parsed;

    if (!candidateMap || typeof candidateMap !== 'object') {
      return { success: false, count: 0, error: 'الملف لا يحتوي على سجلات تقييم صالحة' };
    }

    const current = loadEvaluationsFromStorage();
    let importCount = 0;

    for (const [key, value] of Object.entries(candidateMap)) {
      if (typeof value === 'object' && value !== null) {
        current[key] = {
          ...(value as ApplicantEvaluation),
          applicantId: key,
          updatedAt: (value as ApplicantEvaluation).updatedAt || new Date().toISOString()
        };
        importCount++;
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    return { success: true, count: importCount };
  } catch (err) {
    return {
      success: false,
      count: 0,
      error: err instanceof Error ? err.message : 'فشل قراءة ملف النسخ الاحتياطي'
    };
  }
}

/**
 * Clears all evaluations from localStorage
 */
export function clearAllEvaluationsFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear evaluations from storage:', err);
  }
}
