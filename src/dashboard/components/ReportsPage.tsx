import React from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  Layers, 
  Camera, 
  BarChart3, 
  CheckCircle2 
} from 'lucide-react';
import { ApplicantRecord, DashboardSummary } from '../types/dashboard';
import { 
  exportApplicantsToCsv, 
  exportAnalyticsSummaryCsv, 
  exportSkillsDistributionCsv, 
  exportEquipmentDistributionCsv 
} from '../utils/exportUtils';

interface ReportsPageProps {
  applicants: ApplicantRecord[];
  summary: DashboardSummary;
  lang: 'ar' | 'en';
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ applicants, summary, lang }) => {
  const isAr = lang === 'ar';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-brand-dark border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Download className="w-5 h-5 text-brand-cyan" />
            <h2 className="text-lg font-bold text-white">
              {isAr ? 'مركز التقارير والتصدير (Reports & Exports)' : 'Reports & Export Center'}
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            {isAr
              ? 'تصدير بيانات المتقدمين والإحصائيات بصيغة CSV جاهزة للفتح المباشر في برنامج Microsoft Excel'
              : 'Export applicants records and analytics as UTF-8 CSV ready for Microsoft Excel'}
          </p>
        </div>
        <div className="text-xs text-emerald-400 font-medium px-3.5 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 flex items-center gap-1.5 self-start sm:self-auto">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{isAr ? 'تشفير UTF-8 BOM مدمج (يدعم اللغة العربية)' : 'UTF-8 Arabic BOM Included'}</span>
        </div>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Export All Applicants */}
        <div className="p-6 rounded-2xl bg-brand-dark border border-slate-800 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-brand-cyan flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm mb-1">
              {isAr ? 'سجل المتقدمين الكامل (Full Applicants CSV)' : 'Full Applicants Dataset (CSV)'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isAr
                ? 'تصدير جدول المتقدمين بالكامل بجميع الحقول (الاسم، الهاتف، الفرقة، المهارات، المعدات، رابط البورتفوليو، والحالة).'
                : 'Complete table of all registered applicants including contact info, skills, gear, and portfolio links.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => exportApplicantsToCsv(applicants)}
            className="w-full py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blueHover text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isAr ? `تصدير (${applicants.length}) سجل` : `Export (${applicants.length}) Records`}</span>
          </button>
        </div>

        {/* Export Analytics Summary */}
        <div className="p-6 rounded-2xl bg-brand-dark border border-slate-800 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm mb-1">
              {isAr ? 'تقرير ملخص التحليلات (Analytics Summary)' : 'Analytics Summary Report (CSV)'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isAr
                ? 'تقرير تنفيذي يحتوي على إجمالي المؤشرات، نسب الفرق الدراسية، ملخص المهارات والمعدات، وتوزيع حالات الطلبات.'
                : 'Executive summary report containing all KPIs, academic year shares, and committee distributions.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => exportAnalyticsSummaryCsv(summary)}
            className="w-full py-2.5 rounded-xl bg-brand-navy hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isAr ? 'تصدير ملخص التحليلات' : 'Export Summary Report'}</span>
          </button>
        </div>

        {/* Export Skills Distribution */}
        <div className="p-6 rounded-2xl bg-brand-dark border border-slate-800 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm mb-1">
              {isAr ? 'توزيع المهارات الإعلامية (Skills Distribution)' : 'Skills Distribution (CSV)'}
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
            className="w-full py-2.5 rounded-xl bg-brand-navy hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isAr ? 'تصدير تقرير المهارات' : 'Export Skills Table'}</span>
          </button>
        </div>

        {/* Export Equipment Distribution */}
        <div className="p-6 rounded-2xl bg-brand-dark border border-slate-800 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm mb-1">
              {isAr ? 'توزيع المعدات المتوفرة (Equipment Distribution)' : 'Equipment Inventory (CSV)'}
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
            className="w-full py-2.5 rounded-xl bg-brand-navy hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isAr ? 'تصدير تقرير المعدات' : 'Export Equipment Table'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

