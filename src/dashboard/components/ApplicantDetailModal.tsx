import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Calendar, 
  ExternalLink, 
  Camera, 
  CheckCircle2, 
  Layers, 
  Copy, 
  Check, 
  Send,
  Star,
  FileText,
  FileCheck,
  ShieldCheck,
  Save,
  Clock
} from 'lucide-react';
import { ApplicantRecord, ApplicantEvaluation, ApplicantStatus } from '../types/dashboard';
import { generateWelcomeMessage, openWhatsAppChat } from '../utils/whatsapp';

interface ApplicantDetailModalProps {
  applicant: ApplicantRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveEvaluation?: (evaluation: ApplicantEvaluation) => void;
  lang: 'ar' | 'en';
}

export const ApplicantDetailModal: React.FC<ApplicantDetailModalProps> = ({ 
  applicant, 
  isOpen, 
  onClose, 
  onSaveEvaluation,
  lang 
}) => {
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Evaluation Form State
  const [statusOverride, setStatusOverride] = useState<ApplicantStatus>('Pending Review');
  const [skillRating, setSkillRating] = useState<number>(0);
  const [portfolioRating, setPortfolioRating] = useState<number>(0);
  const [isShortlisted, setIsShortlisted] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [interviewNotes, setInterviewNotes] = useState<string>('');

  // Sync evaluation state when applicant changes
  useEffect(() => {
    if (applicant) {
      const evalData = applicant.evaluation;
      setStatusOverride((evalData?.statusOverride as ApplicantStatus) || applicant.status || 'Pending Review');
      setSkillRating(evalData?.skillRating || 0);
      setPortfolioRating(evalData?.portfolioRating || 0);
      setIsShortlisted(Boolean(evalData?.isShortlisted));
      setNotes(evalData?.notes || '');
      setInterviewNotes(evalData?.interviewNotes || '');
      setSavedSuccess(false);
    }
  }, [applicant]);

  if (!isOpen || !applicant) return null;

  const isAr = lang === 'ar';

  const copyPhone = () => {
    navigator.clipboard.writeText(applicant.phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEvaluation = () => {
    if (!applicant) return;

    const updatedEval: ApplicantEvaluation = {
      applicantId: applicant.id,
      statusOverride,
      skillRating,
      portfolioRating,
      isShortlisted,
      notes,
      interviewNotes,
      isReviewed: true,
      updatedAt: new Date().toISOString()
    };

    if (onSaveEvaluation) {
      onSaveEvaluation(updatedEval);
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Check if portfolio URL is an image file
  const isImageUrl = (url: string) => {
    return /\.(jpeg|jpg|gif|png|webp)($|\?)/i.test(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className={`bg-[#0a1120] rounded-3xl border border-slate-700/80 w-full max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-7 shadow-2xl relative ${
          isAr ? 'text-right' : 'text-left'
        }`}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-5 ${isAr ? 'left-5' : 'right-5'} p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-700`}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Profile Info */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-white truncate">{applicant.fullName}</h3>
              {isShortlisted && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold flex items-center gap-1">
                  <Star className="w-3 h-3 fill-purple-400 text-purple-400" />
                  <span>Shortlisted</span>
                </span>
              )}
              {applicant.isDemo && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  {isAr ? 'بيانات تجريبية' : 'Demo Record'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {applicant.id} • {applicant.submissionDate}
            </p>
          </div>
        </div>

        {/* Section 1: Personal Information & Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {/* Phone */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Phone className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-xs text-slate-200 font-mono truncate" dir="ltr">{applicant.phoneNumber}</span>
            </div>
            <button
              type="button"
              onClick={copyPhone}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title={isAr ? 'نسخ الرقم' : 'Copy phone'}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Academic Year */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-200 font-semibold">{applicant.academicYear}</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">
              {applicant.academicYearNormalized}
            </span>
          </div>
        </div>

        {/* WhatsApp Outreach Action Button */}
        <button
          type="button"
          onClick={() => {
            const msg = generateWelcomeMessage(applicant.fullName);
            openWhatsAppChat(applicant.phoneNumber, msg);
          }}
          className="w-full mb-5 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/30"
        >
          <Send className="w-3.5 h-3.5 -scale-x-100" />
          <span>{isAr ? 'إرسال رابط الجروب الترحيبي عبر واتساب' : 'Send Welcome Message & Group Link via WhatsApp'}</span>
        </button>

        {/* Section 2: Media Skills */}
        <div className="mb-5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>{isAr ? 'المهارات الإعلامية المسجلة:' : 'Registered Media Skills:'}</span>
          </h4>
          {applicant.mediaSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {applicant.mediaSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">{isAr ? 'لم يتم تحديد مهارات' : 'No skills specified'}</p>
          )}
        </div>

        {/* Section 3: Equipment */}
        <div className="mb-5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-cyan-400" />
            <span>{isAr ? 'المعدات والأجهزة المتوفرة:' : 'Available Equipment & Gear:'}</span>
          </h4>
          {applicant.equipment.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {applicant.equipment.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/80 text-xs text-slate-300"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">{isAr ? 'لا توجد معدات مسجلة' : 'No equipment recorded'}</p>
          )}
        </div>

        {/* Section 4: Portfolio Link & Preview */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'معرض الأعمال (البورتفوليو):' : 'Portfolio Link & Preview:'}</span>
            </span>
            {applicant.hasPortfolio ? (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'متوفر' : 'Available'}</span>
              </span>
            ) : (
              <span className="text-[11px] text-slate-500">{isAr ? 'غير متوفر' : 'Not provided'}</span>
            )}
          </div>

          {applicant.hasPortfolio ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <a
                  href={applicant.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:underline break-all inline-flex items-center gap-1.5 font-mono truncate"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{applicant.portfolioUrl}</span>
                </a>
                <a
                  href={applicant.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shrink-0 transition"
                >
                  {isAr ? 'فتح الرابط' : 'Open'}
                </a>
              </div>

              {/* Image Preview if applicable */}
              {isImageUrl(applicant.portfolioUrl) && (
                <div className="mt-2 rounded-xl overflow-hidden border border-slate-800 max-h-56 bg-black flex items-center justify-center">
                  <img 
                    src={applicant.portfolioUrl} 
                    alt="Portfolio Preview" 
                    className="max-h-56 w-auto object-contain"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400">{isAr ? 'لم يرفق المتقدم بورتفوليو مع استمارته' : 'The applicant did not attach a portfolio'}</p>
          )}
        </div>

        {/* Section 5: Evaluation & Administrative Review Workflow */}
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/60 border border-slate-700/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                {isAr ? 'سير عمل التقييم والمراجعة الإدارية (Internal Evaluation)' : 'Administrative Evaluation Workflow'}
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
              {isAr ? 'حفظ محلي آمن' : 'Local Storage Only'}
            </span>
          </div>

          {/* Status & Shortlist Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                {isAr ? 'حالة الطلب والقرار النهائي:' : 'Application Status & Decision:'}
              </label>
              <select
                value={statusOverride}
                onChange={(e) => setStatusOverride(e.target.value as ApplicantStatus)}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none focus:border-blue-500 font-semibold"
              >
                <option value="Pending Review">{isAr ? 'قيد المراجعة (Pending Review)' : 'Pending Review'}</option>
                <option value="Shortlisted">{isAr ? 'مرشح للقائمة المختصرة (Shortlisted)' : 'Shortlisted'}</option>
                <option value="Accepted">{isAr ? 'مقبول (Accepted)' : 'Accepted'}</option>
                <option value="Rejected">{isAr ? 'مرفوض (Rejected)' : 'Rejected'}</option>
              </select>
            </div>

            {/* Shortlist Toggle */}
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-slate-800 border border-slate-700 w-full hover:bg-slate-750 transition">
                <input
                  type="checkbox"
                  checked={isShortlisted}
                  onChange={(e) => setIsShortlisted(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded bg-slate-900 border-slate-600 focus:ring-0"
                />
                <Star className={`w-3.5 h-3.5 ${isShortlisted ? 'text-purple-400 fill-purple-400' : 'text-slate-400'}`} />
                <span className="text-xs font-bold text-slate-200">
                  {isAr ? 'إضافة إلى القائمة المختصرة' : 'Mark as Shortlisted'}
                </span>
              </label>
            </div>
          </div>

          {/* Ratings: Skill & Portfolio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Skill Rating */}
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/70">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-300">
                  {isAr ? 'تقييم المهارات الإعلامية:' : 'Skill Assessment:'}
                </span>
                <span className="text-xs font-bold text-blue-400 font-mono">
                  {skillRating > 0 ? `${skillRating}/5` : '-'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSkillRating(star === skillRating ? 0 : star)}
                    className="p-1 hover:scale-110 transition"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        star <= skillRating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Portfolio Rating */}
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/70">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-300">
                  {isAr ? 'تقييم جودة البورتفوليو:' : 'Portfolio Assessment:'}
                </span>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {portfolioRating > 0 ? `${portfolioRating}/5` : '-'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setPortfolioRating(star === portfolioRating ? 0 : star)}
                    className="p-1 hover:scale-110 transition"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        star <= portfolioRating
                          ? 'text-emerald-400 fill-emerald-400'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>{isAr ? 'ملاحظات إدارية داخلية (خاصة باللجنة):' : 'Internal Committee Notes:'}</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder={isAr ? 'أضف ملاحظات داخلية حول مستوى الطالب أو ترشيحه...' : 'Add private notes about candidate...'}
              className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none focus:border-blue-500 placeholder-slate-500 resize-none"
            />
          </div>

          {/* Committee Feedback / Observations */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>{isAr ? 'ملاحظات التوجيه والمتابعة:' : 'Follow-up Observations:'}</span>
            </label>
            <textarea
              value={interviewNotes}
              onChange={(e) => setInterviewNotes(e.target.value)}
              rows={2}
              placeholder={isAr ? 'ملاحظات حول المهام المقترحة أو المتابعة المستقبلية...' : 'Follow-up task recommendations...'}
              className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none focus:border-blue-500 placeholder-slate-500 resize-none"
            />
          </div>

          {/* Save Evaluation Button */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              {applicant.evaluation?.updatedAt && (
                <span>
                  {isAr ? 'آخر تحديث للتقييم: ' : 'Last evaluated: '}
                  {new Date(applicant.evaluation.updatedAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                </span>
              )}
            </span>

            <button
              type="button"
              onClick={handleSaveEvaluation}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-blue-600/30"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{isAr ? 'تم الحفظ بنجاح!' : 'Saved!'}</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{isAr ? 'حفظ التقييم' : 'Save Evaluation'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition border border-slate-700"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
