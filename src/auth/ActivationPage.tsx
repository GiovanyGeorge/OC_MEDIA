/**
 * Account Activation Page — OC Media Platform
 * Phase 3: Public self-service member account activation using one-time activation code.
 */

import React, { useState } from 'react';
import { activateAccount } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { Card, showToast } from '../shared/ui';
import { ShieldCheck, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface ActivationPageProps {
  onNavigateToLogin: () => void;
  onNavigateToRecruitment: () => void;
}

export function ActivationPage({ onNavigateToLogin, onNavigateToRecruitment }: ActivationPageProps) {
  const { t, isAr } = useI18n();

  const [referenceId, setReferenceId] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const ref = referenceId.trim().toUpperCase();
    const code = activationCode.trim().toUpperCase();

    if (!ref || !code || !password) {
      setErrorMsg(t('يرجى ملء جميع الحقول المطلوبة.', 'Please fill in all required fields.'));
      return;
    }

    if (password.length < 8) {
      setErrorMsg(t('كلمة المرور يجب أن تكون 8 أحرف على الأقل وتتضمن حروفاً وأرقاماً.', 'Password must be at least 8 characters with letters and numbers.'));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(t('كلمتا المرور غير متطابقتين.', 'Passwords do not match.'));
      return;
    }

    setLoading(true);
    try {
      const res = await activateAccount({
        referenceId: ref,
        activationCode: code,
        password,
      });

      if (res.ok && res.data.success) {
        setIsSuccess(true);
        showToast(t('تم تفعيل حسابك بنجاح! يمكنك الآن تسجيل الدخول.', 'Account activated! You can now log in.'), 'success');
      } else {
        const err = res.data.error || 'ACTIVATION_FAILED';
        if (err.includes('RATE_LIMIT')) {
          setErrorMsg(t('تم تجاوز عدد المحاولات المسموح بها. يرجى الانتظار والمحاولة لاحقاً.', 'Too many attempts. Please try again later.'));
        } else if (err.includes('INVALID_CODE') || err.includes('CODE_EXPIRED')) {
          setErrorMsg(t('كود التفعيل غير صالح أو منتهي الصلاحية. يرجى مراجعة إدارة الكلية.', 'Activation code is invalid or expired. Contact administration.'));
        } else if (err.includes('ALREADY_ACTIVATED')) {
          setErrorMsg(t('هذا الحساب تم تفعيله مسبقاً. يمكنك تسجيل الدخول مباشرة.', 'Account already activated. Please sign in directly.'));
        } else if (err.includes('NOT_APPROVED')) {
          setErrorMsg(t('طلب التقديم غير معتمد للتفعيل بعد.', 'Application not approved for activation yet.'));
        } else {
          setErrorMsg(t('فشل التفعيل. يرجى التحقق من الرقم المرجعي وكود التفعيل.', 'Activation failed. Please verify your reference ID and code.'));
        }
      }
    } catch {
      setErrorMsg(t('تعذر الاتصال بخادم التفعيل. يرجى المحاولة لاحقاً.', 'Network error connecting to activation server.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-brand-darkest text-slate-100 flex items-center justify-center p-4 font-arabic ${isAr ? 'rtl' : 'ltr'}`} dir={isAr ? 'rtl' : 'ltr'}>
      <Card className="w-full max-w-md p-6 sm:p-8 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-48 h-20 bg-brand-cyan/20 rounded-full blur-2xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center mb-6 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-brand-navy border border-slate-700/80 p-0.5 mx-auto mb-3 flex items-center justify-center overflow-hidden shadow-sm">
            <img src="/logo.jpg" alt="OC Media" className="w-full h-full object-cover rounded-xl" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            {t('تفعيل حساب عضو لجنة الإعلام', 'Activate Member Account')}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t('كلية الحاسبات والذكاء الاصطناعي — جامعة العاصمة', 'Faculty of Computers and AI — Capital University')}
          </p>
        </div>

        {isSuccess ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-1">
                {t('تم تفعيل الحساب بنجاح!', 'Account Activated Successfully!')}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                {t(
                  'أهلاً بك في فريق إعلام الكلية! يمكنك الآن استخدام رقمك المرجعي وكلمة المرور الجديدة لتسجيل الدخول.',
                  'Welcome to the Media Team! You can now sign in using your Reference ID and new password.'
                )}
              </p>
            </div>
            <button
              onClick={onNavigateToLogin}
              className="w-full py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blueHover text-white text-xs font-bold transition shadow-sm"
            >
              {t('الانتقال لصفحة تسجيل الدخول', 'Go to Sign In')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('الرقم المرجعي (Reference ID):', 'Reference ID:')}
              </label>
              <input
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="OC-2026-XXXX"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy border border-brand-border text-white text-xs font-mono uppercase focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('كود التفعيل (Activation Code):', 'Activation Code:')}
              </label>
              <input
                type="text"
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy border border-brand-border text-white text-xs font-mono uppercase tracking-widest focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan/30"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                {t('الكود الذي استلمته من إدارة الكلية بعد قبول طلبك', 'The one-time code provided by the administration')}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('تعيين كلمة المرور الجديدة:', 'Set New Password:')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-brand-navy border border-brand-border text-white text-xs focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('تأكيد كلمة المرور:', 'Confirm Password:')}
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy border border-brand-border text-white text-xs focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan/30"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !referenceId.trim() || !activationCode.trim() || !password}
              className="w-full py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blueHover text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? t('جاري التفعيل وإنشاء الحساب...', 'Activating account...') : t('تفعيل الحساب الآن', 'Activate Account Now')}</span>
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="text-xs text-slate-400 hover:text-white transition"
              >
                {t('لديك حساب مفعّل بالفعل؟ تسجيل الدخول', 'Already activated? Sign In')}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-brand-border flex items-center justify-center">
          <button
            type="button"
            onClick={onNavigateToRecruitment}
            className="text-xs text-slate-400 hover:text-slate-200 transition flex items-center gap-1.5"
          >
            <ArrowRight className={`w-3.5 h-3.5 ${isAr ? '' : 'rotate-180'}`} />
            <span>{t('العودة للاستمارة العامة', 'Back to Public Form')}</span>
          </button>
        </div>
      </Card>
    </div>
  );
}
