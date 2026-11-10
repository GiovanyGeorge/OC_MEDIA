import React from 'react';
import { isBackendConfigured } from '../services/api';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  onOpenSetupModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSetupModal }) => {
  const backendConfigured = isBackendConfigured();

  return (
    <header className="border-b border-slate-800/80 bg-brand-darkest/95 backdrop-blur-md sticky top-0 z-40 transition-all">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-brand-navy border border-slate-700/80 p-0.5 shadow-sm overflow-hidden flex items-center justify-center">
            <img
              src="/logo.jpg"
              alt="شعار الكلية"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold text-white tracking-wide">لجنة الإعلام</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/10 text-brand-cyan border border-brand-cyan/20 font-medium">OC Media</span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400">كلية الحاسبات والذكاء الاصطناعي — جامعة العاصمة</p>
          </div>
        </div>

        {/* Status indicator */}
        <div>
          {backendConfigured ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="hidden sm:inline">النظام متصل</span>
              <CheckCircle2 className="w-3.5 h-3.5 sm:hidden" />
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenSetupModal}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ربط Google Sheets</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
