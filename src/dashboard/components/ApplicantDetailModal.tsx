import React from 'react';
import { 
  X, 
  User, 
  Phone, 
  Calendar, 
  ExternalLink, 
  Camera, 
  CheckCircle2, 
  Layers, 
  MessageCircle,
  Copy,
  Check
} from 'lucide-react';
import { ApplicantRecord } from '../types/dashboard';

interface ApplicantDetailModalProps {
  applicant: ApplicantRecord | null;
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
}

export const ApplicantDetailModal: React.FC<ApplicantDetailModalProps> = ({ applicant, isOpen, onClose, lang }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !applicant) return null;

  const isAr = lang === 'ar';

  const copyPhone = () => {
    navigator.clipboard.writeText(applicant.phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanPhone = applicant.phoneNumber.replace(/[\s\-\+]/g, '');
  const waPhone = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;
  const whatsappUrl = `https://wa.me/${waPhone}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className={`bg-brand-dark rounded-3xl border border-slate-700/80 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative ${
          isAr ? 'text-right' : 'text-left'
        }`}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-5 ${isAr ? 'left-5' : 'right-5'} p-2 rounded-xl bg-brand-navy hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-700`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-brand-navy border border-brand-cyan/30 flex items-center justify-center text-brand-cyan font-bold text-lg shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white truncate">{applicant.fullName}</h3>
              {applicant.isDemo && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  {isAr ? 'بيانات تجريبية' : 'Demo Record'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{applicant.id} • {applicant.submissionDate}</p>
          </div>
        </div>

        {/* Contact & Status Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-brand-navy/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-brand-cyan" />
              <span className="text-xs text-slate-300 font-mono" dir="ltr">{applicant.phoneNumber}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={copyPhone}
                className="p-1 rounded text-slate-400 hover:text-white"
                title={isAr ? 'نسخ الرقم' : 'Copy phone'}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded text-emerald-400 hover:bg-emerald-950/40"
                title={isAr ? 'مراسلة عبر واتساب' : 'Open WhatsApp'}
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-brand-navy/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-cyan" />
              <span className="text-xs text-slate-300 font-semibold">{applicant.academicYear}</span>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-brand-cyan border border-brand-cyan/20">
              {applicant.status || (isAr ? 'قيد المراجعة' : 'Under Review')}
            </span>
          </div>
        </div>

        {/* Media Skills */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-brand-cyan" />
            <span>{isAr ? 'المهارات الإعلامية المسجلة:' : 'Registered Media Skills:'}</span>
          </h4>
          {applicant.mediaSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {applicant.mediaSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-brand-navy border border-slate-700 text-xs font-medium text-slate-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">{isAr ? 'لم يتم تحديد مهارات' : 'No skills specified'}</p>
          )}
        </div>

        {/* Equipment */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-brand-cyan" />
            <span>{isAr ? 'المعدات والأجهزة المتوفرة:' : 'Available Equipment & Gear:'}</span>
          </h4>
          {applicant.equipment.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {applicant.equipment.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-brand-navy/80 border border-slate-700/80 text-xs text-slate-300"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">{isAr ? 'لا توجد معدات مسجلة' : 'No equipment recorded'}</p>
          )}
        </div>

        {/* Portfolio Link */}
        <div className="mb-6 p-4 rounded-xl bg-brand-navy/50 border border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-300">{isAr ? 'معرض الأعمال (البورتفوليو):' : 'Portfolio Link:'}</span>
            {applicant.hasPortfolio ? (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{isAr ? 'متوفر' : 'Available'}</span>
              </span>
            ) : (
              <span className="text-[11px] text-slate-500">{isAr ? 'غير متوفر' : 'Not provided'}</span>
            )}
          </div>
          {applicant.hasPortfolio ? (
            <a
              href={applicant.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-cyan hover:underline break-all inline-flex items-center gap-1 mt-1 font-mono"
            >
              <span>{applicant.portfolioUrl}</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          ) : (
            <p className="text-xs text-slate-400">{isAr ? 'لم يرفق المتقدم بورتفوليو مع استمارته' : 'The applicant did not attach a portfolio'}</p>
          )}
        </div>

        {/* Close Button */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-brand-navy hover:bg-slate-800 text-white text-xs font-bold transition border border-slate-700"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

