import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  Printer, 
  RefreshCw, 
  Calendar, 
  User, 
  Phone, 
  Layers, 
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { SubmissionResult, FormDataState } from '../types/recruitment';
import { ACADEMIC_YEARS } from '../constants/options';

interface SuccessViewProps {
  result: SubmissionResult;
  formData: FormDataState;
  onReset: () => void;
}

export const SuccessView: React.FC<SuccessViewProps> = ({ result, formData, onReset }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#1d63ff', '#60a5fa', '#93c5fd'],
      });
    } catch {
      // Fallback
    }
  }, []);

  const copySubmissionId = () => {
    if (result.submissionId) {
      navigator.clipboard.writeText(result.submissionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const yearObj = ACADEMIC_YEARS.find((y) => y.id === formData.academicYear);
  const yearText = yearObj ? yearObj.labelAr : formData.academicYear;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 animate-fadeIn">
      <div className="bg-brand-dark rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-card-dark text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-1.5">
          تم استلام استمارتك بنجاح
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto mb-6">
          شكراً لتقديمك في لجنة الإعلام باتحاد طلاب كلية الحاسبات والذكاء الاصطناعي — جامعة العاصمة
        </p>

        {/* Submission ID Card */}
        <div className="bg-brand-navy border border-slate-700/80 rounded-xl p-4 mb-6 text-center">
          <p className="text-[11px] text-slate-400 mb-1">الرقم المرجعي للاستمارة</p>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-lg sm:text-xl font-bold text-brand-cyan tracking-wider">
              {result.submissionId || 'OC-MED-SUBMITTED'}
            </span>
            <button
              type="button"
              onClick={copySubmissionId}
              className="p-1.5 rounded-lg bg-brand-darkest hover:bg-slate-800 text-slate-300 transition flex items-center gap-1 text-xs border border-slate-700"
              title="نسخ الرقم"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-brand-cyan" />}
            </button>
          </div>
        </div>

        {/* Applicant Receipt Summary */}
        <div className="bg-brand-navy/60 rounded-xl border border-slate-800 p-4 mb-6 text-xs text-right space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
            <span>ملخص البيانات المسجلة</span>
            <span className="font-mono text-[10px]">{result.submissionDate || ''}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
              <span className="text-slate-400">الاسم:</span>
              <span className="font-semibold text-white truncate">{formData.fullName}</span>
            </div>

            <div className="flex items-center gap-2" dir="ltr">
              <span className="font-mono font-semibold text-white">{formData.phoneNumber}</span>
              <span className="text-slate-400">:الهاتف</span>
              <Phone className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
              <span className="text-slate-400">الفرقة:</span>
              <span className="font-semibold text-white">{yearText}</span>
            </div>

            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
              <span className="text-slate-400">المهارات:</span>
              <span className="font-semibold text-white">{formData.mediaSkills.length} مهارة</span>
            </div>
          </div>

          {result.portfolioUrl && result.portfolioUrl.startsWith('http') && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">ملف البورتفوليو على Google Drive:</span>
              <a
                href={result.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="text-brand-cyan hover:underline inline-flex items-center gap-1 font-medium"
              >
                <span>معاينة الملف</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Friendly Next Step Notice */}
        <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/20 text-xs text-blue-200 mb-6 flex items-center gap-2.5 text-right">
          <MessageSquare className="w-4 h-4 text-brand-cyan shrink-0" />
          <span>سيتم التواصل معك هاتفياً أو عبر رسائل الواتساب لتحديد موعد ومكان المقابلة الشخصية في الكلية.</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800 text-xs">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl border border-slate-700 bg-brand-navy text-slate-300 hover:text-white transition flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة الإيصال</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="px-5 py-2 rounded-xl bg-brand-blue hover:bg-brand-blueHover text-white font-bold transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تقديم طلب جديد</span>
          </button>
        </div>
      </div>
    </div>
  );
};
