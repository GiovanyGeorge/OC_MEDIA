import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Check, 
  Copy, 
  Search, 
  MessageSquare, 
  Users, 
  Sparkles, 
  ExternalLink,
  Phone,
  RotateCcw
} from 'lucide-react';
import { ApplicantRecord } from '../types/dashboard';
import { 
  DEFAULT_WHATSAPP_GROUP_URL, 
  generateWelcomeMessage, 
  openWhatsAppChat,
  formatWhatsAppPhone
} from '../utils/whatsapp';

interface WhatsAppBroadcastModalProps {
  applicants: ApplicantRecord[];
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
}

export const WhatsAppBroadcastModal: React.FC<WhatsAppBroadcastModalProps> = ({
  applicants,
  isOpen,
  onClose,
  lang
}) => {
  const isAr = lang === 'ar';

  const [groupLink, setGroupLink] = useState(DEFAULT_WHATSAPP_GROUP_URL);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSent, setFilterSent] = useState<'all' | 'sent' | 'unsent'>('all');
  const [sentApplicantIds, setSentApplicantIds] = useState<Set<string>>(new Set());
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  if (!isOpen) return null;

  const handleSendToApplicant = (applicant: ApplicantRecord) => {
    const message = generateWelcomeMessage(applicant.fullName, groupLink);
    openWhatsAppChat(applicant.phoneNumber, message);

    // Mark as sent in local state
    setSentApplicantIds((prev) => {
      const next = new Set(prev);
      next.add(applicant.id);
      return next;
    });
  };

  const handleCopySample = () => {
    const sample = generateWelcomeMessage('أحمد', groupLink);
    navigator.clipboard.writeText(sample);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const filteredApplicants = applicants.filter((a) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = a.fullName.toLowerCase().includes(q);
      const matchPhone = a.phoneNumber.includes(q);
      if (!matchName && !matchPhone) return false;
    }

    // Sent filter
    const isSent = sentApplicantIds.has(a.id);
    if (filterSent === 'sent' && !isSent) return false;
    if (filterSent === 'unsent' && isSent) return false;

    return true;
  });

  const sentCount = applicants.filter((a) => sentApplicantIds.has(a.id)).length;
  const progressPercent = applicants.length > 0 ? Math.round((sentCount / applicants.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className={`bg-brand-dark rounded-3xl border border-slate-700/80 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl relative ${
          isAr ? 'text-right' : 'text-left'
        }`}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  {isAr ? 'إرسال رابط جروب الميديا عبر واتساب' : 'WhatsApp Group Outreach Hub'}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                  Media 2026
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? 'إرسال الرسالة الترحيبية الموحدة مع رابط الجروب بضغطة زر لكل متقدم مباشرة على رقمه'
                  : 'Send unified welcome message with the group link directly to each applicant'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-brand-navy hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top Info Banner & Template Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Unified Message Preview */}
            <div className="p-4 rounded-2xl bg-brand-navy/70 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAr ? 'نص الرسالة الموحدة المعتمدة:' : 'Unified Welcome Message Template:'}</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopySample}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
                  title={isAr ? 'نسخ نص الرسالة' : 'Copy template text'}
                >
                  {copiedTemplate ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTemplate ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ النص' : 'Copy')}</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-brand-darkest/90 border border-slate-800 text-xs text-slate-200 leading-relaxed font-arabic whitespace-pre-line select-text">
                {generateWelcomeMessage('الطالب', groupLink)}
              </div>
            </div>

            {/* Group Link Config & Progress */}
            <div className="p-4 rounded-2xl bg-brand-navy/70 border border-slate-800 flex flex-col justify-between gap-3">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  {isAr ? 'رابط الجروب الرسمي (WhatsApp Group Link):' : 'Official WhatsApp Group Link:'}
                </label>
                <div className="flex items-center gap-2" dir="ltr">
                  <input
                    type="url"
                    value={groupLink}
                    onChange={(e) => setGroupLink(e.target.value)}
                    placeholder="https://chat.whatsapp.com/..."
                    className="w-full px-3 py-2 rounded-xl bg-brand-darkest border border-slate-700 text-emerald-400 text-xs font-mono outline-none focus:border-emerald-500"
                  />
                  <a
                    href={groupLink}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-brand-navy hover:bg-slate-700 text-slate-300 hover:text-white transition shrink-0"
                    title={isAr ? 'فتح الجروب للمعاينة' : 'Open group'}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Outreach Progress Card */}
              <div className="p-3.5 rounded-xl bg-brand-darkest/70 border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400">{isAr ? 'تقدم الإرسال:' : 'Outreach Progress:'}</span>
                  <span className="font-bold text-white">
                    {sentCount} {isAr ? 'من' : 'of'} {applicants.length} ({progressPercent}%)
                  </span>
                </div>
                <div className="w-full bg-brand-navy h-2 rounded-full overflow-hidden border border-slate-700">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1">
              <div className={`absolute inset-y-0 ${isAr ? 'left-3' : 'right-3'} flex items-center pointer-events-none text-slate-400`}>
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'بحث بالاسم أو رقم الهاتف...' : 'Search by name or phone...'}
                className="w-full px-4 py-2 rounded-xl bg-brand-navy border border-slate-700 text-white text-xs placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setFilterSent('all')}
                className={`px-3 py-1.5 rounded-xl border transition ${
                  filterSent === 'all'
                    ? 'bg-brand-blue text-white border-brand-blue'
                    : 'bg-brand-navy text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                {isAr ? `الكل (${applicants.length})` : `All (${applicants.length})`}
              </button>

              <button
                type="button"
                onClick={() => setFilterSent('unsent')}
                className={`px-3 py-1.5 rounded-xl border transition ${
                  filterSent === 'unsent'
                    ? 'bg-brand-blue text-white border-brand-blue'
                    : 'bg-brand-navy text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                {isAr ? `لم يُرسل (${applicants.length - sentCount})` : `Unsent (${applicants.length - sentCount})`}
              </button>

              <button
                type="button"
                onClick={() => setFilterSent('sent')}
                className={`px-3 py-1.5 rounded-xl border transition ${
                  filterSent === 'sent'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-brand-navy text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                {isAr ? `تم الإرسال (${sentCount})` : `Sent (${sentCount})`}
              </button>

              {sentApplicantIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSentApplicantIds(new Set())}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                  title={isAr ? 'إعادة تعيين حالات الإرسال' : 'Reset sent status'}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Applicants List */}
          <div className="rounded-2xl bg-brand-darkest/60 border border-slate-800 overflow-hidden">
            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-800/60">
              {filteredApplicants.length > 0 ? (
                filteredApplicants.map((applicant) => {
                  const isSent = sentApplicantIds.has(applicant.id);
                  const cleanPhone = formatWhatsAppPhone(applicant.phoneNumber);

                  return (
                    <div
                      key={applicant.id}
                      className="p-3.5 sm:p-4 hover:bg-brand-navy/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      {/* Applicant info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white truncate">{applicant.fullName}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-brand-navy border border-slate-700 text-slate-300">
                            {applicant.academicYear}
                          </span>
                          {isSent && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>{isAr ? 'تم الإرسال' : 'Sent'}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1 font-mono text-slate-300" dir="ltr">
                            <Phone className="w-3.5 h-3.5 text-emerald-400" />
                            <span>+{cleanPhone}</span>
                          </span>
                          <span>•</span>
                          <span className="text-slate-400 truncate max-w-xs">
                            {applicant.mediaSkills.slice(0, 3).join('، ')}
                            {applicant.mediaSkills.length > 3 && ` (+${applicant.mediaSkills.length - 3})`}
                          </span>
                        </div>
                      </div>

                      {/* WhatsApp Send Action */}
                      <button
                        type="button"
                        onClick={() => handleSendToApplicant(applicant)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 ${
                          isSent
                            ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/40'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 active:scale-[0.98]'
                        }`}
                      >
                        <Send className="w-3.5 h-3.5 -scale-x-100" />
                        <span>{isSent ? (isAr ? 'إعادة الإرسال' : 'Resend') : (isAr ? 'إرسال عبر واتساب' : 'Send WhatsApp')}</span>
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  {isAr ? 'لا يوجد متقدمين مطابقين للبحث' : 'No applicants found matching the search'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>
              {isAr ? 'يتم فتح محادثة الواتساب مباشرة مع كل طالب بالرسالة المجهزة' : 'WhatsApp opens directly with the pre-filled message'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-brand-navy hover:bg-slate-800 text-white font-bold border border-slate-700 transition"
          >
            {isAr ? 'تم / إغلاق' : 'Done / Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
