/**
 * Admin Endpoint: Issue Activation Code
 * POST /api/admin/issue-code
 *
 * Headers:
 *   Authorization: Bearer <firebase_id_token>
 * Body:
 *   { "referenceId": "OC-2026-0001", "ttlDays": 7 }
 */

import { parseServiceAccount, getGoogleAccessToken } from '../../lib/googleAuth';
import { verifyFirebaseIdToken } from '../../lib/firebaseAuthApi';
import { getDocument, createDocument, patchDocument } from '../../lib/firestoreApi';
import { generateActivationCode, computeCodeHmac } from '../../lib/crypto';
import { checkCodeIssuanceEligibility } from '../../lib/stateMachine';
import { ApplicationDocument } from '../../../src/lib/firebaseTypes';

interface Env {
  FIREBASE_PROJECT_ID: string;
  ACTIVATION_HMAC_SECRET: string;
  [key: string]: any;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // 1. Authorize Admin Caller
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'غير مصرح لك. رمز التحقق مفقود.' }),
      { status: 401, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  const idToken = authHeader.substring(7).trim();
  const projectId = env.FIREBASE_PROJECT_ID || 'oc-media-faf79';
  const hmacSecret = env.ACTIVATION_HMAC_SECRET;

  if (!hmacSecret) {
    return new Response(
      JSON.stringify({ error: 'إعدادات النظام غير مكتملة (ACTIVATION_HMAC_SECRET مفقود).' }),
      { status: 500, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  const credentials = parseServiceAccount(env);
  const accessToken = await getGoogleAccessToken(credentials);

  // Verify caller ID token
  let callerUid: string;
  try {
    const verified = await verifyFirebaseIdToken(accessToken, projectId, idToken);
    callerUid = verified.uid;
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'رمز الجلسة غير صالح أو منتهي الصلاحية.' }),
      { status: 401, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  // Check if caller is registered in adminUsers collection
  const adminDoc = await getDocument(accessToken, projectId, 'adminUsers', callerUid);
  if (!adminDoc) {
    return new Response(
      JSON.stringify({ error: 'ليس لديك صلاحيات إدارية لإصدار رموز التفعيل.' }),
      { status: 403, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  // 2. Parse & Validate Request Body
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'تنسيق الطلب غير صالح.' }),
      { status: 400, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  const referenceId = body.referenceId?.toString().trim();
  const ttlDays = typeof body.ttlDays === 'number' && body.ttlDays > 0 && body.ttlDays <= 30
    ? body.ttlDays
    : 7;

  if (!referenceId) {
    return new Response(
      JSON.stringify({ error: 'الرقم المرجعي (referenceId) مطلوب.' }),
      { status: 400, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  // 3. Fetch Application Document & Check Eligibility
  const application = await getDocument<ApplicationDocument>(
    accessToken,
    projectId,
    'applications',
    referenceId
  );

  const eligibility = checkCodeIssuanceEligibility(application);
  if (!eligibility.eligible) {
    return new Response(
      JSON.stringify({ error: eligibility.reason }),
      { status: 400, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  // 4. Generate Cryptographic Activation Code & Keyed HMAC
  const plaintextCode = generateActivationCode();
  const codeHmac = await computeCodeHmac(plaintextCode, hmacSecret);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);

  // 5. Store Keyed Hash in activationCodes Collection
  await createDocument(
    accessToken,
    projectId,
    'activationCodes',
    codeHmac,
    {
      referenceId,
      codeHash: codeHmac,
      expiresAt,
      used: false,
      failedAttempts: 0,
      createdAt: now,
      issuedByUid: callerUid,
    }
  );

  // 6. Transition Application State to 'code_issued'
  await patchDocument(
    accessToken,
    projectId,
    'applications',
    referenceId,
    {
      activationStatus: 'code_issued',
      activationCodeHash: codeHmac,
      activationCodeExpiresAt: expiresAt,
      updatedAt: now,
    },
    ['activationStatus', 'activationCodeHash', 'activationCodeExpiresAt', 'updatedAt']
  );

  // 7. Return Plaintext Code to Authorized Admin Once
  return new Response(
    JSON.stringify({
      success: true,
      message: 'تم إصدار رمز التفعيل بنجاح.',
      referenceId,
      activationCode: plaintextCode,
      expiresAt: expiresAt.toISOString(),
      ttlDays,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
  );
};
