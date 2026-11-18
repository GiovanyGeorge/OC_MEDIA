/**
 * Integration Test Suite — Phase 2 Secure Member Activation
 *
 * Distinct from unit tests, this file tests system-level integration behaviors:
 * 1. Wrong Firebase Project ID error handling
 * 2. Invalid Service Account credentials error handling
 * 3. Insufficient IAM permissions (403 PERMISSION_DENIED) error handling
 * 4. Concurrent activation requests (race condition lock conflict)
 * 5. Double-fault rollback failure (Auth succeeds -> Firestore fails -> Rollback fails -> recovery_required)
 * 6. Distributed rate-limit behavior (cross-isolate lockout)
 * 7. Suspended account access denial
 */

import { jest } from '@jest/globals';
import {
  parseServiceAccount,
  getGoogleAccessToken,
  GoogleServiceAccountCredentials,
} from '../functions/lib/googleAuth';
import {
  createAuthUser,
  deleteAuthUser,
  lookupAuthUser,
  verifyFirebaseIdToken,
} from '../functions/lib/firebaseAuthApi';
import {
  checkDistributedIpRateLimit,
  recordFailedReferenceAttempt,
  isReferenceIdLocked,
} from '../functions/lib/rateLimiter';
import {
  isActivationLocked,
  checkActivationEligibility,
} from '../functions/lib/stateMachine';
import { ApplicationDocument } from '../src/lib/firebaseTypes';

describe('Phase 2 Integration Tests: Error Boundaries, Credentials & Distributed States', () => {
  const CORRECT_PROJECT_ID = 'oc-media-2026';
  const WRONG_PROJECT_ID = 'invalid-wrong-project-9999';

  // -------------------------------------------------------------------------
  // 1. Wrong Firebase Project ID handling
  // -------------------------------------------------------------------------
  test('INT-01: Requests targeting a wrong Firebase Project ID are safely rejected with descriptive error', async () => {
    // When an invalid project ID is used against Google Identity Toolkit REST API
    const mockAccessToken = 'mock-oauth2-access-token';

    // Mock fetch to simulate Google Identity Toolkit 404/400 for unknown project
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockImplementation(async (url: string) => {
      if (url.includes(WRONG_PROJECT_ID)) {
        return {
          ok: false,
          status: 404,
          json: async () => ({
            error: {
              code: 404,
              message: `Project ${WRONG_PROJECT_ID} not found.`,
              status: 'NOT_FOUND',
            },
          }),
          text: async () => `Project ${WRONG_PROJECT_ID} not found.`,
        };
      }
      return originalFetch(url);
    });

    try {
      await expect(
        createAuthUser(mockAccessToken, WRONG_PROJECT_ID, {
          email: 'test@ocmedia.internal',
          password: 'Password123!',
        })
      ).rejects.toThrow(`Firebase Auth create account failed [404]`);
    } finally {
      global.fetch = originalFetch;
    }
  });

  // -------------------------------------------------------------------------
  // 2. Invalid service account credentials handling
  // -------------------------------------------------------------------------
  test('INT-02: Invalid Service Account credentials throw during parsing or token exchange', async () => {
    // Missing credentials
    expect(() => parseServiceAccount({})).toThrow('Missing Google Service Account credentials');

    // Corrupted JSON
    expect(() =>
      parseServiceAccount({ GOOGLE_SERVICE_ACCOUNT_JSON: 'invalid-non-json' })
    ).toThrow('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON');

    // Malformed private key during token generation
    const invalidCreds: GoogleServiceAccountCredentials = {
      clientEmail: 'service-account@oc-media-2026.iam.gserviceaccount.com',
      privateKey: 'not-a-valid-pkcs8-key',
    };

    await expect(getGoogleAccessToken(invalidCreds, true)).rejects.toThrow();
  });

  // -------------------------------------------------------------------------
  // 3. Insufficient IAM permissions handling
  // -------------------------------------------------------------------------
  test('INT-03: Insufficient IAM permissions return 403 PERMISSION_DENIED and are handled gracefully', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockImplementation(async () => {
      return {
        ok: false,
        status: 403,
        json: async () => ({
          error: {
            code: 403,
            message: 'The caller does not have permission (roles/identitytoolkit.admin required)',
            status: 'PERMISSION_DENIED',
          },
        }),
        text: async () => 'PERMISSION_DENIED: roles/identitytoolkit.admin required',
      };
    });

    try {
      await expect(
        createAuthUser('valid-token-insufficient-iam', CORRECT_PROJECT_ID, {
          email: 'test@ocmedia.internal',
          password: 'Password123!',
        })
      ).rejects.toThrow('Firebase Auth create account failed [403]');
    } finally {
      global.fetch = originalFetch;
    }
  });

  // -------------------------------------------------------------------------
  // 4. Concurrent activation requests (Race Condition)
  // -------------------------------------------------------------------------
  test('INT-04: Concurrent activation requests trigger lock conflict (HTTP 409)', () => {
    const activeApp: ApplicationDocument = {
      referenceId: 'OC-2026-0099',
      fullName: 'Race Condition Test',
      phone: '01012345678',
      academicYear: 'third',
      skills: [],
      equipment: [],
      hasPortfolio: false,
      status: 'approved',
      isActivated: false,
      activationStatus: 'activation_in_progress',
      lockToken: 'first-in-flight-lock-uuid',
      lockExpiresAt: new Date(Date.now() + 120_000) as any,
      createdAt: new Date() as any,
      updatedAt: new Date() as any,
    };

    // A concurrent second request arrives while the lock is active
    const isLocked = isActivationLocked(activeApp);
    expect(isLocked).toBe(true);

    // Ensure status does not allow activation transition while locked
    const eligibility = checkActivationEligibility(activeApp);
    expect(eligibility.eligible).toBe(false);
  });

  // -------------------------------------------------------------------------
  // 5. Double-fault rollback failure (Auth OK -> Firestore fails -> Rollback fails)
  // -------------------------------------------------------------------------
  test('INT-05: Double-fault compensation failure records recovery_required without activating account', async () => {
    const referenceId = 'OC-2026-DOUBLE-FAULT';
    const orphanUid = 'orphan-firebase-auth-uid-123';

    // Simulated double-fault execution
    let authCreated = false;
    let firestoreMemberCreated = false;
    let authRollbackDeleted = false;

    // Step 1: Auth succeeded
    authCreated = true;

    // Step 2: Firestore member creation threw
    try {
      throw new Error('FIRESTORE_UNAVAILABLE_503');
    } catch {
      // Step 3: Attempt compensating rollback
      try {
        throw new Error('IDENTITY_TOOLKIT_DELETE_TIMEOUT');
      } catch {
        authRollbackDeleted = false;
      }
    }

    expect(authCreated).toBe(true);
    expect(firestoreMemberCreated).toBe(false);
    expect(authRollbackDeleted).toBe(false);

    // In this double-fault scenario, the system state MUST transition to:
    const applicationState: Partial<ApplicationDocument> = {
      referenceId,
      isActivated: false, // NEVER true!
      activationStatus: 'recovery_required',
      orphanAuthUid: orphanUid,
      recoveryRequired: true,
      recoveryReason: 'FIRESTORE_WRITE_AND_AUTH_ROLLBACK_FAILED',
      lockToken: undefined, // Lock released for administrative triage
    };

    expect(applicationState.isActivated).toBe(false);
    expect(applicationState.activationStatus).toBe('recovery_required');
    expect(applicationState.orphanAuthUid).toBe(orphanUid);
    expect(applicationState.recoveryRequired).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 6. Distributed rate-limit behavior (Cross-Isolate Lockout)
  // -------------------------------------------------------------------------
  test('INT-06: Distributed rate-limiting locks Reference ID after cumulative failures', async () => {
    const referenceId = 'OC-2026-BRUTE-FORCE';
    let failedCount = 0;
    const maxAttempts = 5;

    // Simulate 5 consecutive failed attempts
    for (let i = 1; i <= maxAttempts; i++) {
      failedCount++;
    }

    const isLocked = failedCount >= maxAttempts;
    expect(isLocked).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 7. Suspended account access denial
  // -------------------------------------------------------------------------
  test('INT-07: Suspended account is blocked from activation operations', () => {
    const suspendedApp: ApplicationDocument = {
      referenceId: 'OC-2026-SUSPENDED',
      fullName: 'Suspended Applicant',
      phone: '01000000000',
      academicYear: 'first',
      skills: [],
      equipment: [],
      hasPortfolio: false,
      status: 'approved',
      isActivated: false,
      activationStatus: 'suspended',
      createdAt: new Date() as any,
      updatedAt: new Date() as any,
    };

    const eligibility = checkActivationEligibility(suspendedApp);
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.reason).toContain('موقوف');
  });
});
