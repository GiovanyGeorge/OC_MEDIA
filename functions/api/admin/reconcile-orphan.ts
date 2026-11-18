/**
 * Admin Endpoint: Reconcile Orphaned Accounts
 * POST /api/admin/reconcile-orphan
 *
 * Resolves double-fault compensation failures (where Auth user was created
 * but Firestore member creation failed AND initial Auth rollback failed).
 *
 * Headers:
 *   Authorization: Bearer <firebase_id_token>
 * Body:
 *   {
 *     "referenceId": "OC-2026-0001",
 *     "action": "delete_orphan_auth" | "complete_member_doc"
 *   }
 */

import { parseServiceAccount, getGoogleAccessToken } from '../../lib/googleAuth';
import { verifyFirebaseIdToken, deleteAuthUser, lookupAuthUser } from '../../lib/firebaseAuthApi';
import { getDocument, createDocument, patchDocument } from '../../lib/firestoreApi';
import { generateSyntheticEmail } from '../../lib/crypto';
import { ApplicationDocument } from '../../../src/lib/firebaseTypes';

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
  const projectId = env.FIREBASE_PROJECT_ID || 'oc-media-2026';
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
      JSON.stringify({ error: 'ليس لديك صلاحيات إدارية لإجراء معالجة استثنائية للحسابات.' }),
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

  const referenceId = body.referenceId?.toString().trim();
  const action = body.action?.toString().trim();

  if (!referenceId || !['delete_orphan_auth', 'complete_member_doc'].includes(action)) {
    return new Response(
      JSON.stringify({ error: 'الرقم المرجعي (referenceId) وإجراء المعالجة (action) كلاهما مطلوب.' }),
      { status: 400, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  const application = await getDocument<ApplicationDocument>(
    accessToken,
    projectId,
    'applications',
    referenceId
  );

  if (!application) {
    return new Response(
      JSON.stringify({ error: 'طلب التقديم غير موجود.' }),
      { status: 404, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  if (application.activationStatus !== 'recovery_required' && !application.orphanAuthUid) {
    return new Response(
      JSON.stringify({ error: 'هذا الحساب ليس بحاجة إلى معالجة استثنائية (لا يوجد حساب معلق).' }),
      { status: 400, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  const orphanUid = application.orphanAuthUid!;
  const now = new Date();

  if (action === 'delete_orphan_auth') {
    // Attempt deletion of the orphan Auth account
    try {
      await deleteAuthUser(accessToken, projectId, orphanUid);
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: `فشل حذف حساب المصادقة المعلق: ${err.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
      );
    }

    // Reset application to code_issued so user can re-activate
    await patchDocument(
      accessToken,
      projectId,
      'applications',
      referenceId,
      {
        activationStatus: 'code_issued',
        orphanAuthUid: null,
        recoveryRequired: false,
        recoveryReason: null,
        updatedAt: now,
      },
      ['activationStatus', 'orphanAuthUid', 'recoveryRequired', 'recoveryReason', 'updatedAt']
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم حذف حساب المصادقة المعلق بنجاح، وإعادة الطلب إلى حالة جاهزية التفعيل.',
        referenceId,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  if (action === 'complete_member_doc') {
    // Complete the missing Firestore member document
    const syntheticEmail = generateSyntheticEmail(referenceId);

    await createDocument(
      accessToken,
      projectId,
      'members',
      orphanUid,
      {
        uid: orphanUid,
        referenceId,
        fullName: application.fullName,
        email: syntheticEmail,
        phone: application.phone,
        role: 'member',
        accountStatus: 'active',
        academicYear: application.academicYear,
        currentSkills: application.skills || [],
        currentEquipment: application.equipment || [],
        createdAt: now,
        updatedAt: now,
        activatedAt: now,
      }
    );

    // Finalize application state as active
    await patchDocument(
      accessToken,
      projectId,
      'applications',
      referenceId,
      {
        isActivated: true,
        activationStatus: 'active',
        memberUid: orphanUid,
        activatedAt: now,
        orphanAuthUid: null,
        recoveryRequired: false,
        recoveryReason: null,
        lockToken: null,
        lockExpiresAt: null,
        updatedAt: now,
      },
      ['isActivated', 'activationStatus', 'memberUid', 'activatedAt', 'orphanAuthUid', 'recoveryRequired', 'recoveryReason', 'lockToken', 'lockExpiresAt', 'updatedAt']
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم استكمال إنشاء ملف العضو وتفعيل الحساب بنجاح.',
        referenceId,
        memberUid: orphanUid,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    );
  }

  return new Response(JSON.stringify({ error: 'إجراء غير مدعوم.' }), { status: 400 });
};
