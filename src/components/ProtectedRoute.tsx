/**
 * Route Protection Components — OC Media Platform
 * Phase 3: ProtectedRoute and role-based access guard.
 */

import { type ReactNode } from 'react';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { LoadingSpinner, Card } from '../shared/ui';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import type { MemberRole } from '../lib/firebaseTypes';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRole?: MemberRole;
  onNavigateToLogin: (suggestedTab?: 'admin' | 'member') => void;
  onNavigateToRecruitment: () => void;
}

export function ProtectedRoute({
  children,
  allowedRole,
  onNavigateToLogin,
  onNavigateToRecruitment,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { t, isAr } = useI18n();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-darkest text-slate-100 flex items-center justify-center p-4">
        <LoadingSpinner text={t('جاري التحقق من الصلاحيات...', 'Verifying access permissions...')} />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-brand-darkest text-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">
            {t('تسجيل الدخول مطلوب', 'Authentication Required')}
          </h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            {t(
              'يرجى تسجيل الدخول بحساب مصرح له للوصول إلى هذه الصفحة.',
              'Please sign in with an authorized account to access this section.'
            )}
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onNavigateToLogin(allowedRole)}
              className="w-full py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blueHover text-white text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <span>{t('تسجيل الدخول الآن', 'Sign In Now')}</span>
            </button>
            <button
              onClick={onNavigateToRecruitment}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <ArrowRight className={`w-3.5 h-3.5 ${isAr ? '' : 'rotate-180'}`} />
              <span>{t('العودة للاستمارة العامة', 'Back to Public Form')}</span>
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // Role mismatch
  if (allowedRole && user.role !== allowedRole) {
    return (
      <div className="min-h-screen bg-brand-darkest text-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-8">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">
            {t('غير مصرح لك بالدخول', 'Access Denied')}
          </h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            {t(
              `هذه الصفحة مخصصة لحسابات (${allowedRole === 'admin' ? 'الإدارة' : 'الأعضاء'}) فقط. دورك الحالي: ${user.role === 'admin' ? 'مسؤول' : 'عضو'}.`,
              `This section is restricted to ${allowedRole} accounts. Your current role is ${user.role}.`
            )}
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onNavigateToLogin(allowedRole)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              {t('تسجيل الدخول بحساب آخر', 'Sign In with Another Account')}
            </button>
            <button
              onClick={onNavigateToRecruitment}
              className="w-full py-2.5 rounded-xl bg-brand-navy hover:bg-brand-card text-slate-400 hover:text-white text-xs font-semibold transition"
            >
              {t('العودة للرئيسية', 'Back to Home')}
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
