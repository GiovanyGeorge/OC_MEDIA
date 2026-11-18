/**
 * Activation Codes Issuance Page — OC Media Platform
 * Phase 3: Issue cryptographically random, one-time activation codes via POST /api/admin/issue-code.
 * Displays the plaintext code ONCE with a copy button.
 */

import React, { useState } from 'react';
import { useApplications } from '../../hooks/useFirestore';
import { issueActivationCode } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import { Card, Badge, Modal, showToast } from '../../shared/ui';
import { KeyRound, Copy, Check, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';

interface ActivationCodesPageProps {
  preselectedRefId?: string;
  onClearPreselected?: () => void;
}

export function ActivationCodesPage({ preselectedRefId, onClearPreselected }: ActivationCodesPageProps) {
  const { applications, reload } = useApplications();
  const { t } = useI18n();

  const [referenceId, setReferenceId] = useState(preselectedRefId || '');
  const [ttlDays, setTtlDays] = useState(7);
  const [issuing, setIssuing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Result modal
  const [issuedCode, setIssuedCode] = useState<{
    code: string;
    refId: string;
    expiresAt: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Filter approved but unactivated applications
  const eligibleApps = applications.filter((a) => a.status === 'approved' && !a.isActivated);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const ref = referenceId.trim().toUpperCase();

    if (!ref) {
      setErrorMsg(t('يرجى إدخال الرقم المرجعي أو اختياره من القائمة.', 'Please enter or select a Reference ID.'));
      return;
    }

    setIssuing(true);
    try {
      const res = await issueActivationCode({ referenceId: ref, ttlDays });
      if (res.ok && res.data.success && res.data.activationCode) {
        setIssuedCode({
          code: res.data.activationCode,
          refId: ref,
          expiresAt: res.data.expiresAt || new Date(Date.now() + ttlDays * 86400000).toISOString(),
        });
        showToast(t('تم توليد كود التفعيل بنجاح!', 'Activation code generated!'), 'success');
        setReferenceId('');
        if (onClearPreselected) onClearPreselected();
        await reload();
      } else {
        const err = res.data.error || 'FAILED_TO_ISSUE';
        if (err.includes('NOT_APPROVED')) {
          setErrorMsg(t('لا يمكن إصدار كود لمتقدم غير معتمد (غير مقبول).', 'Cannot issue code to non-approved application.'));
        } else if (err.includes('ALREADY_ACTIVATED')) {
          setErrorMsg(t('هذا الحساب مفعّل بالفعل.', 'Account already activated.'));
        } else {
          setErrorMsg(t('فشل إصدار كود التفعيل: ' + err, 'Failed to issue code: ' + err));
        }
      }
    } catch {
      setErrorMsg(t('خطأ في الاتصال بالخادم الخلفي.', 'Backend connection error.'));
    } finally {
      setIssuing(false);
    }
  };

  const copyToClipboard = () => {
    if (!issuedCode) return;
    navigator.clipboard.writeText(issuedCode.code);
    setCopied(true);
    showToast(t('تم نسخ كود التفعيل للحافظة', 'Activation code copied to clipboard'), 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview & Security Notice */}
      <Card className="p-5 border-blue-500/30 bg-brand-navy/60">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-brand-cyan flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white mb-1">
              {t('نظام إصدار أكواد التفعيل الآمن (Phase 2 Architecture)', 'Secure Activation Code Issuance')}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t(
                'يتم توليد كود عشوائي مشفر بقوة 128 بت (CSPRNG) وتخزينه كـ HMAC-SHA256 فقط. يُعرض الكود الصريح للمسؤول لمرة واحدة فقط ولن يتم تخزينه بنصه الصريح أبداً في قاعدة البيانات.',
                'Codes are 128-bit CSPRNG generated and stored only as HMAC-SHA256 hashes. Plaintext is displayed ONCE and never retained in Firestore.'
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* Issuance Form */}
      <Card className="max-w-xl mx-auto p-6">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-brand-cyan" />
          <span>{t('توليد كود تفعيل جديد', 'Generate New Activation Code')}</span>
        </h3>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleIssue} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t('الرقم المرجعي للمتقدم:', 'Applicant Reference ID:')}
            </label>
            <input
              type="text"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              placeholder="OC-2026-XXXX"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy border border-brand-border text-white text-xs font-mono uppercase focus:border-brand-cyan focus:outline-none"
            />
          </div>

          {/* Quick Select from Eligible Applications */}
          {eligibleApps.length > 0 && (
            <div>
              <p className="text-[11px] text-slate-400 mb-1.5">
                {t('أو اختر من الطلبات المقبولة بانتظار التفعيل:', 'Or pick from approved eligible applicants:')}
              </p>
              <div className="max-h-36 overflow-y-auto space-y-1 p-2 rounded-xl bg-brand-navy/60 border border-brand-border">
                {eligibleApps.map((app) => (
                  <button
                    key={app.referenceId}
                    type="button"
                    onClick={() => setReferenceId(app.referenceId)}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between text-start transition ${
                      referenceId === app.referenceId
                        ? 'bg-brand-blue text-white font-bold'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="font-mono">{app.referenceId} — {app.fullName}</span>
                    <Badge color="cyan">{app.academicYear}</Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t('مدة صلاحية الكود (بالأيام):', 'Code Validity Period (Days):')}
            </label>
            <select
              value={ttlDays}
              onChange={(e) => setTtlDays(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy border border-brand-border text-white text-xs focus:border-brand-cyan focus:outline-none"
            >
              <option value={3}>{t('3 أيام', '3 Days')}</option>
              <option value={7}>{t('7 أيام (الافتراضي)', '7 Days (Default)')}</option>
              <option value={14}>{t('14 يوماً', '14 Days')}</option>
              <option value={30}>{t('30 يوماً', '30 Days')}</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={issuing || !referenceId.trim()}
            className="w-full py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blueHover text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{issuing ? t('جاري التوليد والتشفير...', 'Generating code...') : t('إصدار كود التفعيل الآن', 'Issue Code Now')}</span>
          </button>
        </form>
      </Card>

      {/* One-Time Code Display Modal */}
      {issuedCode && (
        <Modal
          isOpen={Boolean(issuedCode)}
          onClose={() => setIssuedCode(null)}
          title={t('تم إصدار كود التفعيل بنجاح (عرض لمرة واحدة)', 'Activation Code Issued (One-Time View)')}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>

            <div>
              <p className="text-xs text-slate-400 mb-1">
                {t(`الرقم المرجعي: ${issuedCode.refId}`, `Reference ID: ${issuedCode.refId}`)}
              </p>
              <div className="p-4 rounded-xl bg-brand-navy border-2 border-brand-cyan/50 text-brand-cyan font-mono text-lg font-extrabold tracking-widest break-all select-all my-2">
                {issuedCode.code}
              </div>
              <p className="text-[11px] text-amber-300 flex items-center justify-center gap-1 mt-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{t('احفظ أو شارك هذا الكود مع العضو فوراً. لن يتم عرضه مرة أخرى!', 'Save or share this code now. It will NEVER be shown again!')}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyToClipboard}
                className="flex-1 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blueHover text-white text-xs font-bold transition flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? t('تم النسخ!', 'Copied!') : t('نسخ الكود', 'Copy Code')}</span>
              </button>
              <button
                onClick={() => setIssuedCode(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                {t('إغلاق', 'Close')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
