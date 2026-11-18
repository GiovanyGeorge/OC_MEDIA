/**
 * Authentication / Login Page — OC Media Platform
 * Phase 3: Tabbed login for Admins (Email + Password) and Members (Reference ID + Password).
 */

import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { Card, showToast } from '../shared/ui';
import { Lock, UserCheck, Shield, KeyRound, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';

interface LoginPageProps {
  initialTab?: 'admin' | 'member';
  onLoginSuccess: (role: 'admin' | 'member') => void;
  onNavigateToRecruitment: () => void;
  onNavigateToActivation: () => void;
}

export function LoginPage({
  initialTab = 'member',
  onLoginSuccess,
  onNavigateToRecruitment,
  onNavigateToActivation,
}: LoginPageProps) {
  const [tab, setTab] = useState<'admin' | 'member'>(initialTab);
  const { loginAdmin, loginMember, error, loading } = useAuth();
  const { t, isAr } = useI18n();

  // Admin form state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Member form state
  const [memberRefId, setMemberRefId] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [showMemberPassword, setShowMemberPassword] = useState(false);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword) return;
    try {
      await loginAdmin(adminEmail.trim(), adminPassword);
      showToast(t('تم تسجيل دخول الإدارة بنجاح', 'Admin signed in successfully'), 'success');
      onLoginSuccess('admin');
    } catch {
      // Error is set in AuthContext
    }
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberRefId.trim() || !memberPassword) return;
    try {
      await loginMember(memberRefId.trim().toUpperCase(), memberPassword);
      showToast(t('تم تسجيل دخول العضو بنجاح', 'Member signed in successfully'), 'success');
      onLoginSuccess('member');
    } catch {
      // Error is set in AuthContext
    }
  };

  const getErrorMessage = () => {
    if (!error) return null;
    switch (error) {
      case 'INVALID_CREDENTIALS':
        return t('بيانات الدخول غير صحيحة، يرجى التأكد وإعادة المحاولة.', 'Invalid credentials. Please verify and try again.');
      case 'NOT_ADMIN':
        return t('هذا الحساب ليس مسجلاً ضمن إدارة النظام المصرح لها.', 'This account is not authorized as an administrator.');
      case 'ACCOUNT_SUSPENDED':
        return t('تم إيقاف هذا الحساب إدارياً. يرجى التواصل مع المسؤول.', 'This account has been administratively suspended. Contact an admin.');
      case 'NO_MEMBER_PROFILE':
        return t('لم يتم العثور على ملف عضو مرتبط بهذا المعرف. هل قمت بتفعيل الحساب؟', 'No member profile found. Have you activated your account?');
      case 'FIREBASE_NOT_CONFIGURED':
        return t('خدمة Firebase غير مكتملة الإعداد حالياً في البيئة.', 'Firebase is not yet configured in this environment.');
      case 'TOO_MANY_REQUESTS':
        return t('محاولات متكررة خاطئة. تم قفل المحاولات مؤقتاً.', 'Too many attempts. Access temporarily locked.');
      default:
        return t('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة لاحقاً.', 'An error occurred during sign in. Please try again.');
    }
  };

  return (
    <div className={`min-h-screen bg-brand-darkest text-slate-100 flex items-center justify-center p-4 font-arabic ${isAr ? 'rtl' : 'ltr'}`} dir={isAr ? 'rtl' : 'ltr'}>
      <Card className="w-full max-w-md p-6 sm:p-8 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-48 h-20 bg-brand-blue/20 rounded-full blur-2xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center mb-6 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-brand-navy border border-slate-700/80 p-0.5 mx-auto mb-3 flex items-center justify-center overflow-hidden shadow-sm">
            <img src="/logo.jpg" alt="OC Media" className="w-full h-full object-cover rounded-xl" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            {t('بوابة لجنة الإعلام', 'OC Media Portal')}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t('كلية الحاسبات والذكاء الاصطناعي — جامعة العاصمة', 'Faculty of Computers and AI — Capital University')}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-xl bg-brand-navy p-1 mb-6 border border-brand-border">
          <button
            type="button"
            onClick={() => setTab('member')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              tab === 'member'
                ? 'bg-brand-blue text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>{t('دخول الأعضاء', 'Member Portal')}</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('admin')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              tab === 'admin'
                ? 'bg-brand-blue text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>{t('دخول الإدارة', 'Admin Portal')}</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-red-400" />
            <span>{getErrorMessage()}</span>
          </div>
        )}

        {/* Member Login Form */}
        {tab === 'member' && (
          <form onSubmit={handleMemberSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('الرقم المرجعي (Reference ID):', 'Reference ID:')}
              </label>
              <input
                type="text"
                value={memberRefId}
                onChange={(e) => setMemberRefId(e.target.value)}
                placeholder="OC-2026-XXXX"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy border border-brand-border text-white text-xs font-mono uppercase focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan/30"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                {t('الرمز المسلم لك عند قبول الاستمارة أو في كود التفعيل', 'The reference ID issued with your application')}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('كلمة المرور:', 'Password:')}
              </label>
              <div className="relative">
                <input
                  type={showMemberPassword ? 'text' : 'password'}
                  value={memberPassword}
                  onChange={(e) => setMemberPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-brand-navy border border-brand-border text-white text-xs focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan/30"
                />
                <button
                  type="button"
                  onClick={() => setShowMemberPassword(!showMemberPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showMemberPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !memberRefId.trim() || !memberPassword}
              className="w-full py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blueHover text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? t('جاري التحقق...', 'Signing in...') : t('تسجيل الدخول كعضو', 'Sign In as Member')}</span>
            </button>

            {/* Link to activate account */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onNavigateToActivation}
                className="text-xs text-brand-cyan hover:underline inline-flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('لديك كود تفعيل؟ فعّل حسابك الآن', 'Have an activation code? Activate here')}</span>
              </button>
            </div>
          </form>
        )}

        {/* Admin Login Form */}
        {tab === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('البريد الإلكتروني للإدارة:', 'Admin Email:')}
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@ocmedia.internal"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy border border-brand-border text-white text-xs focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('كلمة المرور الإدارية:', 'Admin Password:')}
              </label>
              <div className="relative">
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-brand-navy border border-brand-border text-white text-xs focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan/30"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !adminEmail.trim() || !adminPassword}
              className="w-full py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blueHover text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Shield className="w-4 h-4" />
              <span>{loading ? t('جاري التحقق...', 'Signing in...') : t('تسجيل الدخول كمسؤول', 'Sign In as Admin')}</span>
            </button>
          </form>
        )}

        {/* Footer Navigation Back to Public Portal */}
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
