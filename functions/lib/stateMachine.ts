/**
 * Activation State Machine Engine & Transition Manager
 *
 * States:
 * - approved: Applicant approved by admin, eligible for activation code.
 * - code_issued: One-time activation code has been generated.
 * - activation_in_progress: Activation request locked and executing.
 * - active: Firebase Auth and Firestore member profile verified and active.
 * - activation_failed: Incomplete or faulted activation attempt.
 * - suspended: Member administratively suspended and account disabled.
 */

import { ApplicationDocument, ActivationStatus } from '../../src/lib/firebaseTypes';

export interface EligibilityCheckResult {
  eligible: boolean;
  reason?: string;
}

/**
 * Validates whether an applicant is eligible to have an activation code issued.
 */
export function checkCodeIssuanceEligibility(
  application: ApplicationDocument | null
): EligibilityCheckResult {
  if (!application) {
    return { eligible: false, reason: 'طلب التقديم غير موجود' };
  }

  if (!application.referenceId || application.referenceId.trim() === '') {
    return { eligible: false, reason: 'الرقم المرجعي غير صالح' };
  }

  if (application.status !== 'approved') {
    return {
      eligible: false,
      reason: 'لا يمكن تفعيل الحساب إلا للمتقدمين المقبولين رسمياً',
    };
  }

  if (application.isActivated === true || application.activationStatus === 'active') {
    return { eligible: false, reason: 'تم تفعيل هذا الحساب بالفعل مسبقاً' };
  }

  if (application.activationStatus === 'suspended') {
    return { eligible: false, reason: 'هذا الحساب موقوف إدارياً' };
  }

  return { eligible: true };
}

/**
 * Validates whether an applicant is in an acceptable state to begin activation.
 */
export function checkActivationEligibility(
  application: ApplicationDocument | null
): EligibilityCheckResult {
  if (!application) {
    return { eligible: false, reason: 'بيانات التفعيل غير صالحة' };
  }

  if (application.status !== 'approved') {
    return { eligible: false, reason: 'بيانات التفعيل غير صالحة' };
  }

  if (application.isActivated === true || application.activationStatus === 'active') {
    return { eligible: false, reason: 'تم تفعيل هذا الحساب بالفعل مسبقاً' };
  }

  if (application.activationStatus === 'suspended') {
    return { eligible: false, reason: 'هذا الحساب موقوف' };
  }

  const allowedStates: (ActivationStatus | undefined)[] = [
    'approved',
    'code_issued',
    'activation_failed', // Allows retry after previous failure
  ];

  if (!allowedStates.includes(application.activationStatus)) {
    return { eligible: false, reason: 'حالة الطلب الحالية لا تسمح بالتفعيل' };
  }

  return { eligible: true };
}

/**
 * Verifies if a lock token is still active on an application to prevent concurrent activation.
 *
 * @param application Current application document
 * @param nowMs Current time in milliseconds
 * @param lockTtlMs Lock duration (default 2 minutes)
 */
export function isActivationLocked(
  application: ApplicationDocument,
  nowMs: number = Date.now(),
  lockTtlMs: number = 120_000
): boolean {
  if (application.activationStatus !== 'activation_in_progress') {
    return false;
  }

  if (!application.lockToken) {
    return false;
  }

  // Check if lock expired
  if (application.lockExpiresAt) {
    const expiresMs = application.lockExpiresAt instanceof Date
      ? application.lockExpiresAt.getTime()
      : (application.lockExpiresAt as any)?._seconds
        ? (application.lockExpiresAt as any)._seconds * 1000
        : new Date(application.lockExpiresAt as any).getTime();

    if (nowMs < expiresMs) {
      return true;
    }
  }

  return false;
}
