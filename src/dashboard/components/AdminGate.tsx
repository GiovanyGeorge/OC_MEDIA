import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldAlert, KeyRound, Eye, EyeOff } from 'lucide-react';

interface AdminGateProps {
  onAuthenticated: () => void;
  onBackToRecruitment: () => void;
  lang: 'ar' | 'en';
}

export const AdminGate: React.FC<AdminGateProps> = ({ onAuthenticated, onBackToRecruitment, lang }) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAr = lang === 'ar';

  // Read admin passcode from environment variable or default to OC@2026
  const EXPECTED_PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE || 'OC@2026';

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(false);

    setTimeout(() => {
      if (passcode.trim() === EXPECTED_PASSCODE) {
        onAuthenticated();
      } else {
        setError(true);
        setIsSubmitting(false);
      }
    }, 250);
  };

  return (
    <div className={`min-h-screen bg-brand-darkest text-slate-100 flex items-center justify-center p-4 font-arabic ${isAr ? 'rtl' : 'ltr'}`} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md bg-brand-dark rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
        {/* Top ambient glow */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-48 h-24 bg-brand-blue/20 rounded-full blur-2xl pointer-events-none" />

        {/* Union Logo & Lock Badge */}
        <div className="relative z-10 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-navy border border-slate-700/80 p-0.5 mx-auto mb-3 shadow-sm flex items-center justify-center">
            <img src="/logo.jpg" alt="OC Union" className="w-full h-full object-cover rounded-xl" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-brand-cyan border border-brand-cyan/20 text-xs font-semibold mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>{isAr ? 'منطقة مسؤولي الاتحاد فقط' : 'Authorized Personnel Only'}</span>
          </div>
          <h2 className="text-xl font-bold text-white">
            {isAr ? 'لوحة تحليلات لجنة الإعلام' : 'Media Analytics Portal'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isAr ? 'يرجى إدخال رمز الأمان الإداري للمتابعة' : 'Please enter the admin security passcode'}
          </p>
        </div>

        {/* Passcode Form */}
        <form onSubmit={handleVerify} className="space-y-4 relative z-10">
          <div className="space-y-1.5 text-right">
            <label htmlFor="adminPass" className={`block text-xs font-semibold text-slate-300 ${isAr ? 'text-right' : 'text-left'}`}>
              {isAr ? 'رمز الأمان السري (Passcode):' : 'Admin Security Code:'}
            </label>

            <div className="relative" dir="ltr">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="adminPass"
                value={passcode}
                onChange={(e) => { setPasscode(e.target.value); setError(false); }}
                placeholder="••••••••"
                autoFocus
                className={`w-full pl-9 pr-10 py-2.5 rounded-xl bg-brand-navy text-white text-sm placeholder-slate-600 border transition outline-none text-left font-mono tracking-widest focus:ring-2 ${
                  error 
                    ? 'border-red-500 focus:ring-red-500/30' 
                    : 'border-slate-700/80 focus:border-brand-cyan focus:ring-brand-cyan/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-400 flex items-center gap-1 mt-1 animate-fadeIn">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{isAr ? 'رمز الأمان غير صحيح. يرجى التحقق وإعادة المحاولة.' : 'Invalid passcode. Please try again.'}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !passcode.trim()}
            className="w-full py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blueHover text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{isSubmitting ? (isAr ? 'جاري التحقق...' : 'Verifying...') : (isAr ? 'تسجيل الدخول للوحة' : 'Enter Dashboard')}</span>
          </button>
        </form>

        {/* Back to public portal */}
        <div className="mt-6 pt-4 border-t border-slate-800 relative z-10 flex items-center justify-center">
          <button
            type="button"
            onClick={onBackToRecruitment}
            className="text-xs text-slate-400 hover:text-slate-200 transition flex items-center gap-1.5"
          >
            <ArrowRight className={`w-3.5 h-3.5 ${isAr ? '' : 'rotate-180'}`} />
            <span>{isAr ? 'الرجوع لاستمارة التقديم العامة' : 'Back to Public Form'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

