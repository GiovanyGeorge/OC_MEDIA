/**
 * Public Member Activation Endpoint
 * POST /api/activate
 *
 * Body:
 *   {
 *     "referenceId": "OC-2026-0001",
 *     "activationCode": "OC-XXXX-XXXX-XXXX-XXXX",
 *     "password": "ChosenPassword123"
 *   }
 */

import { parseServiceAccount, getGoogleAccessToken } from '../lib/googleAuth';
import { createAuthUser, deleteAuthUser } from '../lib/firebaseAuthApi';
import { getDocument, createDocument, patchDocument } from '../lib/firestoreApi';
import {
  computeCodeHmac,
  validatePassword,
  generateSyntheticEmail,
} from '../lib/crypto';
import {
  checkActivationEligibility,
  isActivationLocked,
} from '../lib/stateMachine';
import { checkRateLimit, refIdTracker } from '../lib/rateLimiter';
import { ApplicationDocument, ActivationCodeDocument } from '../../src/lib/firebaseTypes';

interface Env {
  FIREBASE_PROJECT_ID: string;
  ACTIVATION_HMAC_SECRET: string;
  [key: string]: any;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // 1. Rate Limiting Check (IP & Reference ID)
  const clientIp = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const ipLimit = checkRateLimit(`ip:${clientIp}`, 10, 60_000);
  if (!ipLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: `تم تجاوز الحد المسموح به للطلبات. يرجى الانتظار لمدة ${ipLimit.retryAfterSec} ثانية.`,
      }),
      { status: 429, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  // 2. Parse & Validate Payload
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'تنسيق البيانات غير صالح.' }),
      { status: 400, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  const referenceId = body.referenceId?.toString().trim();
  const activationCode = body.activationCode?.toString().trim();
  const password = body.password?.toString();

  if (!referenceId || !activationCode || !password) {
    return new Response(
      JSON.stringify({ error: 'جميع حقول التفعيل مطلوبة (الرقم المرجعي، رمز التفعيل، كلمة المرور).' }),
      { status: 400, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  // Per-ReferenceID rate limiting (brute force protection)
  const refLimit = checkRateLimit(`ref:${referenceId}`, 5, 300_000, refIdTracker);
  if (!refLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: `تم تجاوز الحد الأقصى للمحاولات لهذا الرقم المرجعي. يرجى المحاولة بعد ${refLimit.retryAfterSec} ثانية.`,
      }),
      { status: 429, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  // Password Strength Policy Validation
  const pwdValidation = validatePassword(password);
  if (!pwdValidation.valid) {
    return new Response(
      JSON.stringify({
        error: 'كلمة المرور لا تستوفي شروط الأمان.',
        details: pwdValidation.errors,
      }),
      { status: 400, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  const projectId = env.FIREBASE_PROJECT_ID || 'oc-media-faf79';
  const hmacSecret = env.ACTIVATION_HMAC_SECRET;

  if (!hmacSecret) {
    return new Response(
      JSON.stringify({ error: 'النظام قيد التهيئة. يرجى مراجعة إدارة المنصة.' }),
      { status: 500, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  const credentials = parseServiceAccount(env);
  const accessToken = await getGoogleAccessToken(credentials);

  // 3. Verify Activation Code Keyed Hash
  const codeHmac = await computeCodeHmac(activationCode, hmacSecret);
  const codeDoc = await getDocument<ActivationCodeDocument>(
    accessToken,
    projectId,
    'activationCodes',
    codeHmac
  );

  // Generic rejection if code not found or belongs to another referenceId
  if (!codeDoc || codeDoc.referenceId !== referenceId) {
    return new Response(
      JSON.stringify({ error: 'بيانات التفعيل غير صالحة أو غير متطابقة.' }),
      { status: 400, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  const now = new Date();

  // Check code lockout
  if (codeDoc.lockedUntil) {
    const lockedUntilDate = new Date(codeDoc.lockedUntil as any);
    if (lockedUntilDate > now) {
      return new Response(
        JSON.stringify({ error: 'تم قفل رمز التفعيل مؤقتاً لتكرار المحاولات الخاطئة. يرجى المحاولة لاحقاً.' }),
        { status: 403, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
      );
    }
  }

  // Check single-use
  if (codeDoc.used === true) {
    return new Response(
      JSON.stringify({ error: 'رمز التفعيل تم استخدامه بالفعل مسبقاً.' }),
      { status: 400, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  // Check expiration
  const expiresAt = new Date(codeDoc.expiresAt as any);
  if (expiresAt < now) {
    return new Response(
      JSON.stringify({ error: 'رمز التفعيل منتهي الصلاحية.' }),
      { status: 400, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  // 4. Verify Application State & Concurrency Lock
  const application = await getDocument<ApplicationDocument>(
    accessToken,
    projectId,
    'applications',
    referenceId
  );

  const eligibility = checkActivationEligibility(application);
  if (!eligibility.eligible) {
    return new Response(
      JSON.stringify({ error: eligibility.reason }),
      { status: 400, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  // Concurrency check
  if (isActivationLocked(application!)) {
    return new Response(
      JSON.stringify({ error: 'عملية التفعيل قيد المعالجة حالياً. يرجى الانتظار دقيقة والمحاولة ثانية.' }),
      { status: 409, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  // 5. Acquire Concurrency Lock
  const operationId = crypto.randomUUID();
  const lockExpiresAt = new Date(now.getTime() + 120_000); // 2 minute lock

  await patchDocument(
    accessToken,
    projectId,
    'applications',
    referenceId,
    {
      activationStatus: 'activation_in_progress',
      lockToken: operationId,
      lockExpiresAt,
      operationId,
      updatedAt: now,
    },
    ['activationStatus', 'lockToken', 'lockExpiresAt', 'operationId', 'updatedAt']
  );

  // 6. Step 1: Create Firebase Authentication Account
  const syntheticEmail = generateSyntheticEmail(referenceId);
  let authUid: string;

  try {
    const authUser = await createAuthUser(accessToken, projectId, {
      email: syntheticEmail,
      password,
      displayName: application!.fullName,
      disabled: false,
    });
    authUid = authUser.localId;
  } catch (err: any) {
    // Release lock on Auth failure
    await patchDocument(
      accessToken,
      projectId,
      'applications',
      referenceId,
      {
        activationStatus: 'activation_failed',
        lockToken: null,
        lockExpiresAt: null,
        updatedAt: new Date(),
      },
      ['activationStatus', 'lockToken', 'lockExpiresAt', 'updatedAt']
    );

    if (err?.message === 'EMAIL_EXISTS') {
      return new Response(
        JSON.stringify({ error: 'تم إنشاء حساب لهذا المتقدم بالفعل. يرجى التواصل مع الإدارة للمساعدة.' }),
        { status: 409, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى لاحقاً.' }),
      { status: 500, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  // 7. Step 2: Create Member Document in Firestore (with Compensating Rollback)
  try {
    await createDocument(
      accessToken,
      projectId,
      'members',
      authUid,
      {
        uid: authUid,
        referenceId,
        fullName: application!.fullName,
        email: syntheticEmail,
        phone: application!.phone,
        role: 'member',
        accountStatus: 'active',
        academicYear: application!.academicYear,
        currentSkills: application!.skills || [],
        currentEquipment: application!.equipment || [],
        createdAt: now,
        updatedAt: now,
        activatedAt: now,
      }
    );
  } catch (firestoreErr) {
    // Compensating Rollback: Delete the newly created Firebase Auth user
    try {
      await deleteAuthUser(accessToken, projectId, authUid);
    } catch (deleteErr) {
      console.error('Failed compensating rollback of Auth user:', deleteErr);
    }

    // Reset application status to activation_failed and release lock
    await patchDocument(
      accessToken,
      projectId,
      'applications',
      referenceId,
      {
        activationStatus: 'activation_failed',
        lockToken: null,
        lockExpiresAt: null,
        updatedAt: new Date(),
      },
      ['activationStatus', 'lockToken', 'lockExpiresAt', 'updatedAt']
    );

    return new Response(
      JSON.stringify({ error: 'فشل استكمال إنشاء ملف العضو. تم التراجع عن العملية بأمان، يرجى إعادة المحاولة.' }),
      { status: 500, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  // 8. Step 3: Finalize Activation (Mark Code Used & Application Active)
  const finalNow = new Date();

  // Invalidate the activation code
  await patchDocument(
    accessToken,
    projectId,
    'activationCodes',
    codeHmac,
    {
      used: true,
      usedAt: finalNow,
    },
    ['used', 'usedAt']
  );

  // Transition application to active
  await patchDocument(
    accessToken,
    projectId,
    'applications',
    referenceId,
    {
      isActivated: true,
      activationStatus: 'active',
      memberUid: authUid,
      activatedAt: finalNow,
      lockToken: null,
      lockExpiresAt: null,
      updatedAt: finalNow,
    },
    ['isActivated', 'activationStatus', 'memberUid', 'activatedAt', 'lockToken', 'lockExpiresAt', 'updatedAt']
  );

  // 9. Success Response
  return new Response(
    JSON.stringify({
      success: true,
      message: 'تم تفعيل حسابك بنجاح! يمكنك الآن تسجيل الدخول باستخدام رقمك المرجعي وكلمة المرور.',
      referenceId,
      email: syntheticEmail,
      uid: authUid,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
  );
};
