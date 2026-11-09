import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  AlertTriangle, 
  Activity, 
  FolderLock, 
  Sheet 
} from 'lucide-react';
import { APPS_SCRIPT_URL, isBackendConfigured, pingBackend } from '../services/api';

interface SetupNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupNoticeModal: React.FC<SetupNoticeModalProps> = ({ isOpen, onClose }) => {
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [testResult, setTestResult] = useState<{ loading: boolean; success?: boolean; message?: string } | null>(null);

  if (!isOpen) return null;

  const handleCopyEnv = () => {
    navigator.clipboard.writeText('VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec');
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2500);
  };

  const handleTestConnection = async () => {
    setTestResult({ loading: true });
    try {
      const res = await pingBackend();
      if (res.success) {
        setTestResult({ loading: false, success: true, message: 'الاتصال ناجح! تم التحقق من Google Apps Script.' });
      } else {
        setTestResult({ loading: false, success: false, message: res.message || 'تعذر الاتصال بالرابط المحدد.' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestResult({ loading: false, success: false, message: msg });
    }
  };

  const configured = isBackendConfigured();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-brand-dark rounded-3xl border border-brand-cyan/40 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative text-right">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl bg-brand-navy hover:bg-brand-card text-slate-400 hover:text-white transition border border-brand-border"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-navy border border-brand-cyan/40 flex items-center justify-center text-brand-cyan">
            <Sheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">إعداد ربط Google Sheets و Google Drive</h3>
            <p className="text-xs text-slate-400">دليل ربط استمارة لجنة الإعلام بحساب جوجل الخاص بالاتحاد</p>
          </div>
        </div>

        {/* Current Status Box */}
        <div className={`p-4 rounded-2xl mb-6 border ${
          configured 
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
            : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              {configured ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-amber-400" />}
              <span>حالة الرابط الحالي في ملف البيئة (.env):</span>
            </div>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
              configured ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {configured ? 'مُهيأ (Configured)' : 'غير مُهيأ (Pending Setup)'}
            </span>
          </div>

          <p className="text-xs text-slate-300 font-mono break-all bg-brand-darkest/70 p-2.5 rounded-xl border border-brand-border" dir="ltr">
            {APPS_SCRIPT_URL || 'لم يتم تعيين VITE_GOOGLE_APPS_SCRIPT_URL'}
          </p>

          {configured && (
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testResult?.loading}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{testResult?.loading ? 'جاري الفحص...' : 'اختبار اتصال Google Apps Script الآن'}</span>
              </button>

              {testResult?.message && (
                <span className={`text-xs ${testResult.success ? 'text-emerald-300' : 'text-red-300'}`}>
                  {testResult.message}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 4-Step Guide */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <h4 className="font-bold text-white text-sm pb-1 border-b border-brand-border/40 flex items-center gap-2">
            <FolderLock className="w-4 h-4 text-brand-cyan" />
            <span>خطوات التفعيل السريع في 3 دقائق:</span>
          </h4>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-brand-navy/60 border border-brand-border">
              <span className="font-bold text-brand-cyan block mb-1">الخطوة 1: إنشاء ملف Google Sheets</span>
              <span>افتح <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-brand-cyan underline inline-flex items-center gap-0.5">sheets.new <ExternalLink className="w-3 h-3" /></a> باسم "سجلات المتقدمين - لجنة الإعلام 2026".</span>
            </div>

            <div className="p-3 rounded-xl bg-brand-navy/60 border border-brand-border">
              <span className="font-bold text-brand-cyan block mb-1">الخطوة 2: إضافة سكريبت المعالجة (Apps Script)</span>
              <span>من القائمة العلوية في الشيت، اختر <strong>Extensions (الإضافات)</strong> &gt; <strong>Apps Script</strong>. امسح الكود الموجود والصق محتوى الملف المرفق: <code className="text-brand-cyan font-mono bg-brand-darkest px-1.5 py-0.5 rounded">google-apps-script/Code.gs</code>.</span>
            </div>

            <div className="p-3 rounded-xl bg-brand-navy/60 border border-brand-border">
              <span className="font-bold text-brand-cyan block mb-1">الخطوة 3: النشر كتطبيق ويب (Deploy as Web App)</span>
              <ul className="list-disc list-inside space-y-1 text-slate-300 mr-2 mt-1">
                <li>اضغط على زر <strong>Deploy</strong> باللون الأزرق &gt; <strong>New deployment</strong>.</li>
                <li>اضغط علامة الترس بجانب "Select type" واختر <strong>Web app</strong>.</li>
                <li>في خانة <strong>Execute as</strong>: اختر <strong>Me (حسابك)</strong>.</li>
                <li>في خانة <strong>Who has access</strong>: اختر <strong>Anyone (أي شخص)</strong> لتمكين الطلاب من إرسال الاستمارة دون الحاجة لتسجيل دخول.</li>
                <li>اضغط <strong>Deploy</strong> ووافق على الأذونات (Authorize access).</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-brand-navy/60 border border-brand-border">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-brand-cyan block">الخطوة 4: نسخ الرابط لملف .env</span>
                <button
                  type="button"
                  onClick={handleCopyEnv}
                  className="text-xs text-brand-cyan hover:underline flex items-center gap-1"
                >
                  {copiedEnv ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedEnv ? 'تم النسخ' : 'نسخ الصيغة'}</span>
                </button>
              </div>
              <span>انسخ رابط الويب الصادر (Web App URL ينتهي بـ <code className="text-brand-cyan font-mono">/exec</code>) وضعه في ملف <code className="text-brand-cyan font-mono">.env</code>:</span>
              <pre className="mt-2 bg-brand-darkest p-2.5 rounded-lg text-brand-cyan font-mono text-xs overflow-x-auto text-left" dir="ltr">
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
              </pre>
            </div>
          </div>
        </div>

        {/* Close action */}
        <div className="mt-6 pt-4 border-t border-brand-border/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-brand-blue hover:bg-brand-blueHover text-white text-xs font-bold transition shadow-sm"
          >
            فهمت، حسناً
          </button>
        </div>
      </div>
    </div>
  );
};

