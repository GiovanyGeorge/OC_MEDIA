import React, { useRef, useState } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  Layers, 
  Camera, 
  BarChart3, 
  CheckCircle2,
  Star,
  Printer,
  Upload,
  Database,
  Check,
  AlertCircle
} from 'lucide-react';
import { ApplicantRecord, DashboardSummary } from '../types/dashboard';
import { 
  exportApplicantsToCsv, 
  exportShortlistedApplicantsCsv,
  exportAcceptedApplicantsCsv,
  exportAnalyticsSummaryCsv, 
  exportSkillsDistributionCsv, 
  exportEquipmentDistributionCsv,
  triggerPrintReport
} from '../utils/exportUtils';
import { 
  exportEvaluationsBackup, 
  importEvaluationsFromJson 
} from '../utils/evaluationStorage';

interface ReportsPageProps {
  applicants: ApplicantRecord[];
  summary: DashboardSummary;
  onEvaluationsReloaded?: () => void;
  lang: 'ar' | 'en';
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ 
  applicants, 
  summary, 
  onEvaluationsReloaded,
  lang 
}) => {
  const isAr = lang === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ message: string; isError: boolean } | null>(null);

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const res = importEvaluationsFromJson(text);
      if (res.success) {
        setImportStatus({
          message: isAr ? `تم استيراد ${res.count} تقييم بنجاح!` : `Successfully imported ${res.count} evaluations!`,
          isError: false
        });
        if (onEvaluationsReloaded) onEvaluationsReloaded();
      } else {
        setImportStatus({
          message: res.error || (isAr ? 'فشل استيراد ملف النسخ الاحتياطي' : 'Import failed'),
          isError: true
        });
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Download className="w-5 h-5 text-blue-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              {isAr ? 'مركز التقارير والتصدير والنسخ الاحتياطي (Reports & Backup)' : 'Reports & Export Center'}
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            {isAr
              ? 'تصدير بيانات المتقدمين، القوائم المختصرة، الإحصائيات بصيغ CSV مهيأة لـ Excel، والنسخ الاحتياطي للتقييمات'
              : 'Export applicants records, shortlisted candidates, and analytics as UTF-8 CSV ready for Microsoft Excel'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Print Report Button */}
          <button
            type="button"
            onClick={triggerPrintReport}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isAr ? 'طباعة تقرير' : 'Print View'}</span>
          </button>

          <div className="text-xs text-emerald-400 font-medium px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 flex items-center gap-1.5 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>UTF-8 BOM</span>
          </div>
        </div>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Export All Applicants */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm mb-1">
              {isAr ? 'سجل المتقدمين الكامل (Full Applicants)' : 'Full Applicants Dataset (CSV)'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isAr
                ? 'تصدير جدول المتقدمين بالكامل مع كافة الحقول بالإضافة لنتائج التقييم والملاحظات الداخلية.'
                : 'Complete table of all registered applicants including contact info, skills, gear, and evaluation status.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => exportApplicantsToCsv(applicants)}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm shadow-blue-600/30"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isAr ? `تصدير (${applicants.length}) سجل` : `Export (${applicants.length}) Records`}</span>
          </button>
        </div>

        {/* Export Shortlisted Applicants */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
              <Star className="w-5 h-5 fill-purple-400/30" />
            </div>
            <h3 className="font-bold text-white text-sm mb-1">
              {isAr ? 'قائمة المرشحين المتميزين (Shortlisted)' : 'Shortlisted Candidates (CSV)'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isAr
                ? 'تصدير قائمة الطلاب الذين تم تمييزهم وترشيحهم للقائمة المختصرة بناء على مراجعة اللجنة.'
                : 'Export candidates marked as shortlisted with contact info, skills, and private committee notes.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => exportShortlistedApplicantsCsv(applicants)}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm shadow-purple-600/30"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isAr ? `تصدير (${summary.shortlistedCount}) مرشح` : `Export (${summary.shortlistedCount}) Shortlisted`}</span>
          </button>
        </div>

        {/* Export Accepted Applicants */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm mb-1">
              {isAr ? 'سجل المقبولين النهائي (Accepted)' : 'Accepted Candidates (CSV)'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isAr
                ? 'تصدير الطلاب الذين تم اعتماد قبولهم باللجنة بشكل نهائي لسهولة التواصل معهم وتوزيع المهام.'
                : 'Export all officially accepted students ready for team grouping and onboarding communication.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => exportAcceptedApplicantsCsv(applicants)}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/30"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isAr ? `تصدير (${summary.acceptedCount}) مقبول` : `Export (${summary.acceptedCount}) Accepted`}</span>
          </button>
        </div>

        {/* Export Analytics Summary */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-blue-400 flex items-center justify-center mb-3">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm mb-1">
              {isAr ? 'ملخص التحليلات والمؤشرات (Summary CSV)' : 'Analytics Summary (CSV)'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isAr
                ? 'تقرير تنفيذي يحتوي على إجمالي المؤشرات، نسب الفرق الدراسية، ملخص المهارات والمعدات، وتوزيع الحالات.'
                : 'Executive summary report containing all KPIs, academic year shares, and committee distributions.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => exportAnalyticsSummaryCsv(summary)}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isAr ? 'تصدير ملخص التحليلات' : 'Export Summary'}</span>
          </button>
        </div>

        {/* Export Skills Distribution */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-blue-400 flex items-center justify-center mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm mb-1">
              {isAr ? 'توزيع المهارات الإعلامية (Skills CSV)' : 'Skills Distribution (CSV)'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isAr
                ? 'جدول تفصيلي بأعداد ونسب المتقدمين في كل مهارة إعلامية على حدة.'
                : 'Detailed counts and percentages for each media skill domain.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => exportSkillsDistributionCsv(summary)}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isAr ? 'تصدير جدول المهارات' : 'Export Skills'}</span>
          </button>
        </div>

        {/* Export Equipment Distribution */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400 flex items-center justify-center mb-3">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm mb-1">
              {isAr ? 'توزيع المعدات والأجهزة (Gear CSV)' : 'Equipment Inventory (CSV)'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isAr
                ? 'إحصائيات الكاميرات ومعدات الصوت والإضاءة والأجهزة المتوفرة لدى الطلاب.'
                : 'Breakdown of cameras, lighting, mics, and editing hardware owned by applicants.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => exportEquipmentDistributionCsv(summary)}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isAr ? 'تصدير جدول المعدات' : 'Export Gear'}</span>
          </button>
        </div>
      </div>

      {/* Internal Evaluations Backup & Restore Section */}
      <div className="p-6 rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-white text-sm">
              {isAr ? 'إدارة النسخ الاحتياطي لتقييمات المتقدمين (Evaluations Backup & Restore)' : 'Evaluations Data Backup & Restore'}
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {summary.reviewedCount} {isAr ? 'تقييم مسجل' : 'evaluations stored'}
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {isAr
            ? 'يتم حفظ كافة التقييمات والملاحظات الداخلية ومستويات النجوم محلياً في متصفحك. يمكنك تنزيل نسخة احتياطية بصيغة JSON لنقلها لجهاز آخر أو استرجاعها في أي وقت دون المساس بملف الإكسل الأصلي.'
            : 'All administrative evaluations, star ratings, and internal notes are saved locally in your browser. You can export a JSON backup to transfer to another device or restore at any time.'}
        </p>

        {importStatus && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            importStatus.isError 
              ? 'bg-rose-950/40 border border-rose-500/30 text-rose-300' 
              : 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
          }`}>
            {importStatus.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
            <span>{importStatus.message}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {/* Download Backup */}
          <button
            type="button"
            onClick={exportEvaluationsBackup}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm shadow-purple-600/30"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isAr ? 'تنزيل نسخة احتياطية من التقييمات (JSON)' : 'Download Evaluations Backup (JSON)'}</span>
          </button>

          {/* Restore / Import Backup */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold transition flex items-center gap-2"
          >
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span>{isAr ? 'استرجاع تقييمات من ملف احتياطي' : 'Restore Evaluations from JSON'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportBackup}
            className="hidden"
          />
        </div>
      </div>

    </div>
  );
};
