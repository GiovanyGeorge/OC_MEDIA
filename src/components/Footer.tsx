import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/60 bg-brand-darkest text-slate-500 py-6 text-xs text-center">
      <div className="max-w-4xl mx-auto px-4">
        <p> كلية الحاسبات والذكاء الاصطناعي — جامعة العاصمة</p>
        <p className="text-[11px] text-slate-600 mt-1">جميع الحقوق محفوظة © {new Date().getFullYear()} • لجنة الإعلام (OC Media)</p>
      </div>
    </footer>
  );
};
