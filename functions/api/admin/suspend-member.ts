/**
 * Admin Endpoint: Suspend Member & Disable Account
 * POST /api/admin/suspend-member
 *
 * Headers:
 *   Authorization: Bearer <firebase_id_token>
 * Body:
 *   { "uid": "firebase_auth_uid", "referenceId": "OC-2026-0001" }
 */

import { parseServiceAccount, getGoogleAccessToken } from '../../lib/googleAuth';
import { verifyFirebaseIdToken, disableAuthUser } from '../../lib/firebaseAuthApi';
import { getDocument, patchDocument } from '../../lib/firestoreApi';

interface Env {
  FIREBASE_PROJECT_ID: string;
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
  const credentials = parseServiceAccount(env);
  const accessToken = await getGoogleAccessToken(credentials);

  let callerUid: string;
  try {
    const verified = await verifyFirebaseIdToken(accessToken, projectId, idToken);
    callerUid = verified.uid;
  } catch {
    return new Response(
      JSON.stringify({ error: 'رمز الجلسة غير صالح أو منتهي الصلاحية.' }),
      { status: 401, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  const adminDoc = await getDocument(accessToken, projectId, 'adminUsers', callerUid);
  if (!adminDoc) {
    return new Response(
      JSON.stringify({ error: 'ليس لديك صلاحيات إدارية لإيقاف الأعضاء.' }),
      { status: 403, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  // 2. Parse & Validate Body
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'تنسيق البيانات غير صالح.' }),
      { status: 400, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  const targetUid = body.uid?.toString().trim();
  const referenceId = body.referenceId?.toString().trim();

  if (!targetUid || !referenceId) {
    return new Response(
      JSON.stringify({ error: 'معرف المستخدم (uid) والرقم المرجعي (referenceId) كلاهما مطلوب.' }),
      { status: 400, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  // Prevent self-suspension
  if (targetUid === callerUid) {
    return new Response(
      JSON.stringify({ error: 'لا يمكنك إيقاف حسابك الإداري الخاص.' }),
      { status: 400, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  const now = new Date();

  // 3. Disable Firebase Auth Account Administratively
  try {
    await disableAuthUser(accessToken, projectId, targetUid);
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: `فشل تعطيل حساب الدخول: ${err.message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  // 4. Update member document to 'suspended'
  await patchDocument(
    accessToken,
    projectId,
    'members',
    targetUid,
    {
      accountStatus: 'suspended',
      suspendedAt: now,
      suspendedByUid: callerUid,
      updatedAt: now,
    },
    ['accountStatus', 'suspendedAt', 'suspendedByUid', 'updatedAt']
  );

  // 5. Update application document to 'suspended'
  await patchDocument(
    accessToken,
    projectId,
    'applications',
    referenceId,
    {
      activationStatus: 'suspended',
      updatedAt: now,
    },
    ['activationStatus', 'updatedAt']
  );

  return new Response(
    JSON.stringify({
      success: true,
      message: 'تم إيقاف العضو وتعطيل حسابه بنجاح.',
      targetUid,
      referenceId,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
  );
};
