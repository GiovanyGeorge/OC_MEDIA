/**
 * Orphan Reconciliation Page — OC Media Platform
 * Phase 3: Detect and reconcile activation double-faults (orphaned Auth users) via POST /api/admin/reconcile-orphan.
 */

import { useState } from 'react';
import { useApplications } from '../../hooks/useFirestore';
import { reconcileOrphan } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import { Card, LoadingSpinner, ConfirmDialog, showToast } from '../../shared/ui';
import { AlertTriangle, RefreshCw, Trash2, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { ApplicationDocument } from '../../lib/firebaseTypes';

export function OrphanReconciliationPage() {
  const { applications, loading, reload } = useApplications();
  const { t } = useI18n();

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    app: ApplicationDocument | null;
    action: 'delete_orphan_auth' | 'complete_member_doc';
  }>({ isOpen: false, app: null, action: 'delete_orphan_auth' });

  const [reconciling, setReconciling] = useState(false);

  // Filter applications that require recovery
  const orphanApps = applications.filter(
    (a) => a.activationStatus === 'recovery_required' || a.recoveryRequired || a.orphanAuthUid
  );

  const handleConfirmReconcile = async () => {
    if (!confirmDialog.app) return;
    setReconciling(true);
    try {
      const res = await reconcileOrphan({
        referenceId: confirmDialog.app.referenceId,
        action: confirmDialog.action,
      });

      if (res.ok && res.data.success) {
        showToast(
          t(
            `تم تنفيذ عملية التسوية (${confirmDialog.action === 'delete_orphan_auth' ? 'حذف الحساب العالق' : 'إكمال إنشاء ملف العضو'}) بنجاح.`,
            `Orphan reconciliation completed (${confirmDialog.action}).`
          ),
          'success'
        );
        setConfirmDialog({ isOpen: false, app: null, action: 'delete_orphan_auth' });
        await reload();
      } else {
        showToast(res.data.error || t('فشل تنفيذ التسوية', 'Failed to reconcile orphan'), 'error');
      }
    } catch {
      showToast(t('خطأ أثناء الاتصال بالخادم', 'Connection error'), 'error');
    } finally {
      setReconciling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Information Header */}
      <Card className="p-5 border-amber-500/30 bg-brand-navy/60">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white mb-1">
              {t('تسوية الحسابات العالقة (Orphan Account Reconciliation)', 'Orphan Account Reconciliation')}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t(
                'في حالات نادرة عند حدوث خطأ غير متوقع أثناء التفعيل (مثل فشل كتابة Firestore وفشل التراجع التلقائي في Auth)، يدخل الحساب حالة recovery_required لمنع تكرار الخطأ. تتيح هذه الصفحة للمسؤول إما حذف حساب Auth العالق للسماح للمتقدم بالمحاولة مجدداً، أو استكمال إنشاء ملف العضو يدوياً.',
                'Double-fault recovery mechanism. When compensation fails, accounts are locked in recovery_required. Admins can either delete the orphaned Auth user for retry or complete the member document.'
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* Orphans Table */}
      {loading ? (
        <LoadingSpinner text={t('جاري فحص الحسابات العالقة...', 'Checking orphan records...')} />
      ) : orphanApps.length === 0 ? (
        <Card className="text-center py-12 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">
            {t('النظام سليم بالكامل — لا توجد حسابات عالقة', 'All Systems Clean — No Orphan Accounts')}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {t('كافة عمليات التفعيل السابقة اكتملت بنجاح أو تم التراجع عنها بشكل نظيف.', 'All previous activations completed cleanly or rolled back properly.')}
          </p>
          <button
            onClick={() => reload()}
            className="px-3 py-1.5 rounded-xl bg-brand-navy hover:bg-slate-800 border border-brand-border text-slate-300 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition mt-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('إعادة الفحص', 'Recheck Now')}</span>
          </button>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-brand-navy/80 border-b border-brand-border text-slate-400 uppercase text-[11px]">
                <tr>
                  <th className="px-4 py-3 font-semibold text-start">{t('الرقم المرجعي', 'Reference ID')}</th>
                  <th className="px-4 py-3 font-semibold text-start">{t('الاسم بالكامل', 'Full Name')}</th>
                  <th className="px-4 py-3 font-semibold text-start">{t('معرف Auth العالق', 'Orphan Auth UID')}</th>
                  <th className="px-4 py-3 font-semibold text-start">{t('سبب التعليق', 'Reason')}</th>
                  <th className="px-4 py-3 font-semibold text-center">{t('خيارات التسوية', 'Reconcile Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-slate-300">
                {orphanApps.map((app) => (
                  <tr key={app.referenceId} className="hover:bg-brand-navy/40 transition">
                    <td className="px-4 py-3 font-mono font-bold text-white">{app.referenceId}</td>
                    <td className="px-4 py-3 font-medium text-white">{app.fullName}</td>
                    <td className="px-4 py-3 font-mono text-amber-400 text-[11px] truncate max-w-[140px]" dir="ltr">
                      {app.orphanAuthUid || '—'}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-400 max-w-xs truncate">
                      {app.recoveryReason || t('فشل إنشاء ملف العضو بعد إنشاء حساب Auth', 'Member doc failed after Auth creation')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            setConfirmDialog({
                              isOpen: true,
                              app,
                              action: 'delete_orphan_auth',
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-[11px] font-bold transition flex items-center gap-1"
                          title={t('حذف حساب Auth العالق للسماح بإعادة المحاولة', 'Delete orphan Auth user to retry')}
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{t('حذف العالق', 'Delete Auth')}</span>
                        </button>

                        <button
                          onClick={() =>
                            setConfirmDialog({
                              isOpen: true,
                              app,
                              action: 'complete_member_doc',
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition flex items-center gap-1"
                          title={t('استكمال إنشاء وثيقة العضو في Firestore', 'Complete member doc in Firestore')}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{t('إكمال التفعيل', 'Complete')}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, app: null, action: 'delete_orphan_auth' })}
        onConfirm={handleConfirmReconcile}
        title={
          confirmDialog.action === 'delete_orphan_auth'
            ? t('تأكيد حذف حساب Auth العالق', 'Confirm Orphan Auth Deletion')
            : t('تأكيد استكمال إنشاء ملف العضو', 'Confirm Completing Member Profile')
        }
        message={
          confirmDialog.action === 'delete_orphan_auth'
            ? t(
                `سيقوم الخادم بحذف حساب Firebase Auth ذو المعرف (${confirmDialog.app?.orphanAuthUid}) وإعادة تعيين حالة الطلب إلى approved للسماح بإصدار كود جديد.`,
                `The backend will delete Firebase Auth user (${confirmDialog.app?.orphanAuthUid}) and reset application status to approved for retry.`
              )
            : t(
                `سيقوم الخادم بإنشاء وثيقة member/{uid} في Firestore وتعيين حالة الحساب إلى active ليكتمل التفعيل.`,
                `The backend will create the member/{uid} document in Firestore and set status to active.`
              )
        }
        confirmLabel={
          confirmDialog.action === 'delete_orphan_auth'
            ? t('نعم، حذف الحساب العالق', 'Yes, Delete Orphan Auth')
            : t('نعم، استكمال إنشاء الحساب', 'Yes, Complete Account')
        }
        variant={confirmDialog.action === 'delete_orphan_auth' ? 'danger' : 'primary'}
        loading={reconciling}
      />
    </div>
  );
}
