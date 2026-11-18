import React from 'react';
import { 
  Users, 
  FileCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Star, 
  Camera, 
  Layers, 
  PieChart as PieIcon, 
  BarChart3, 
  FolderCheck,
  TrendingUp
} from 'lucide-react';
import { DashboardSummary } from '../types/dashboard';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';

interface OverviewPageProps {
  summary: DashboardSummary;
  lang: 'ar' | 'en';
}

const YEAR_COLORS = ['#38bdf8', '#2563eb', '#818cf8', '#c084fc', '#94a3b8'];
const PORTFOLIO_COLORS = ['#10b981', '#475569'];

export const OverviewPage: React.FC<OverviewPageProps> = ({ summary, lang }) => {
  const isAr = lang === 'ar';

  // 1. Academic Year Data
  const yearPieData = summary.academicYearStats.map((item, index) => ({
    name: isAr ? item.labelAr : item.labelEn,
    value: item.count,
    color: YEAR_COLORS[index % YEAR_COLORS.length]
  }));

  // 2. Portfolio Stats Data
  const portfolioPieData = [
    { 
      name: isAr ? 'أرفق بورتفوليو' : 'With Portfolio', 
      value: summary.applicantsWithPortfolio, 
      color: PORTFOLIO_COLORS[0] 
    },
    { 
      name: isAr ? 'بدون بورتفوليو' : 'Without Portfolio', 
      value: summary.applicantsWithoutPortfolio, 
      color: PORTFOLIO_COLORS[1] 
    }
  ].filter(d => d.value > 0);

  // 3. Skills Bar Data (Top 6)
  const skillsBarData = summary.topSkills.slice(0, 6).map((s) => ({
    name: isAr ? s.labelAr : s.labelEn,
    count: s.count,
    percentage: s.percentage
  }));

  // 4. Equipment Bar Data (Top 6)
  const equipmentBarData = summary.topEquipment.slice(0, 6).map((e) => ({
    name: isAr ? e.labelAr : e.labelEn,
    count: e.count,
    percentage: e.percentage
  }));

  // 5. Status Distribution Data
  const statusBarData = summary.statusStats.map((st) => ({
    name: st.status,
    count: st.count,
    percentage: st.percentage
  }));

  return (
    <div className="space-y-6">
      
      {/* Top Welcome & Meta Bar */}
      <div className="p-5 rounded-2xl bg-[#0a1120] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <span>{isAr ? 'نظرة عامة على مؤشرات القبول واللجنة' : 'Recruitment Analytics Overview'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAr 
              ? 'تحليل إحصائي فوري ودقيق مستخرج مباشرة من بيانات استمارات المتقدمين المسجلة' 
              : 'Live statistical insights computed directly from uploaded applicant records'}
          </p>
        </div>
        
        {summary.dateRange.firstDate && (
          <div className="text-[11px] text-slate-400 font-mono px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
            {isAr ? 'الفترة:' : 'Period:'} {summary.dateRange.firstDate} {summary.dateRange.lastDate ? `→ ${summary.dateRange.lastDate}` : ''}
          </div>
        )}
      </div>

      {/* Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Applicants */}
        <div className="p-5 rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">
              {isAr ? 'إجمالي المتقدمين' : 'Total Applicants'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight">{summary.totalApplicants}</div>
            <p className="text-[11px] text-slate-500 mt-1">
              {isAr ? 'سجل مكتمل بالاستمارة' : 'Total completed submissions'}
            </p>
          </div>
        </div>

        {/* Pending Review */}
        <div className="p-5 rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">
              {isAr ? 'قيد المراجعة' : 'Pending Review'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight">{summary.pendingCount}</div>
            <p className="text-[11px] text-amber-400/80 mt-1 font-medium">
              {summary.totalApplicants > 0 ? Math.round((summary.pendingCount / summary.totalApplicants) * 100) : 0}% {isAr ? 'من المتقدمين' : 'of applicants'}
            </p>
          </div>
        </div>

        {/* Accepted Applicants */}
        <div className="p-5 rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">
              {isAr ? 'المقبولين' : 'Accepted'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight">{summary.acceptedCount}</div>
            <p className="text-[11px] text-emerald-400/80 mt-1 font-medium">
              {summary.totalApplicants > 0 ? Math.round((summary.acceptedCount / summary.totalApplicants) * 100) : 0}% {isAr ? 'تم قبولهم' : 'accepted candidates'}
            </p>
          </div>
        </div>

        {/* Rejected Applicants */}
        <div className="p-5 rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">
              {isAr ? 'المرفوضين' : 'Rejected'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight">{summary.rejectedCount}</div>
            <p className="text-[11px] text-slate-500 mt-1">
              {summary.totalApplicants > 0 ? Math.round((summary.rejectedCount / summary.totalApplicants) * 100) : 0}% {isAr ? 'غير مطابق' : 'rejected applicants'}
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Highlights Row: Shortlisted & Portfolio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Shortlisted */}
        <div className="p-4 rounded-xl bg-[#0a1120] border border-slate-800/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium block">
                {isAr ? 'المرشحين المتميزين (Shortlisted)' : 'Shortlisted Candidates'}
              </span>
              <span className="text-xl font-bold text-white">{summary.shortlistedCount}</span>
            </div>
          </div>
          <span className="text-xs font-mono text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded-lg border border-purple-500/20">
            {summary.totalApplicants > 0 ? Math.round((summary.shortlistedCount / summary.totalApplicants) * 100) : 0}%
          </span>
        </div>

        {/* Portfolio Rate */}
        <div className="p-4 rounded-xl bg-[#0a1120] border border-slate-800/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium block">
                {isAr ? 'نسبة إرفاق البورتفوليو' : 'Portfolio Attached Rate'}
              </span>
              <span className="text-xl font-bold text-white">{summary.portfolioPercentage}%</span>
            </div>
          </div>
          <span className="text-xs font-mono text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded-lg border border-blue-500/20">
            {summary.applicantsWithPortfolio}/{summary.totalApplicants}
          </span>
        </div>

        {/* Multi-Gear Owners */}
        <div className="p-4 rounded-xl bg-[#0a1120] border border-slate-800/90 flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium block">
                {isAr ? 'ملاك أكثر من معدة' : 'Multiple Gear Owners'}
              </span>
              <span className="text-xl font-bold text-white">{summary.multipleEquipmentCount}</span>
            </div>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded-lg border border-cyan-500/20">
            {summary.multipleEquipmentPercentage}%
          </span>
        </div>
      </div>

      {/* Visual Analytics Grid 1: Academic Year & Portfolio Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Academic Year Chart */}
        <div className="p-6 rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-white text-sm">
                {isAr ? 'توزيع المتقدمين حسب الفرقة الدراسية' : 'Applicants by Academic Year'}
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              {summary.academicYearStats.length} {isAr ? 'فرق مسجلة' : 'years'}
            </span>
          </div>

          <div className="h-64 flex items-center justify-center">
            {yearPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={yearPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {yearPieData.map((entry, index) => (
                      <Cell key={`year-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500">{isAr ? 'لا توجد بيانات كافية' : 'No data available'}</p>
            )}
          </div>

          {/* Academic Year Legend */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-3 border-t border-slate-800/80 text-xs">
            {yearPieData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300 font-medium">{item.name}:</span>
                <span className="text-white font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio Submission Statistics */}
        <div className="p-6 rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FolderCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">
                {isAr ? 'إحصائيات إرفاق معرض الأعمال (البورتفوليو)' : 'Portfolio Submission Statistics'}
              </h3>
            </div>
            <span className="text-[11px] text-emerald-400 font-mono font-bold">
              {summary.portfolioPercentage}% {isAr ? 'مرفق' : 'rate'}
            </span>
          </div>

          <div className="h-64 flex items-center justify-center">
            {portfolioPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolioPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {portfolioPieData.map((entry, index) => (
                      <Cell key={`portfolio-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500">{isAr ? 'لا توجد بيانات كافية' : 'No data available'}</p>
            )}
          </div>

          {/* Portfolio Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-slate-800/80 text-xs">
            {portfolioPieData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300 font-medium">{item.name}:</span>
                <span className="text-white font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid 2: Skills & Equipment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Most Popular Skills Chart */}
        <div className="p-6 rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-white text-sm">
                {isAr ? 'أكثر المهارات الإعلامية طلباً' : 'Most Popular Media Skills'}
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              {summary.uniqueSkillsCount} {isAr ? 'مجال' : 'skills'}
            </span>
          </div>

          <div className="h-64">
            {skillsBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillsBarData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#cbd5e1" fontSize={11} width={130} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#2563eb" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500">{isAr ? 'لا توجد بيانات' : 'No data available'}</p>
            )}
          </div>
        </div>

        {/* Most Common Equipment Chart */}
        <div className="p-6 rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white text-sm">
                {isAr ? 'أكثر المعدات والأجهزة توفراً' : 'Most Common Equipment & Gear'}
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              {summary.uniqueEquipmentCount} {isAr ? 'فئة' : 'gear categories'}
            </span>
          </div>

          <div className="h-64">
            {equipmentBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={equipmentBarData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#cbd5e1" fontSize={11} width={130} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#0891b2" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500">{isAr ? 'لا توجد بيانات' : 'No data available'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Application Status Distribution Breakdown */}
      <div className="p-6 rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-white text-sm">
              {isAr ? 'توزيع حالات الاستمارات وقرارات المراجعة' : 'Application Status & Review Decisions'}
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {summary.reviewedCount} {isAr ? 'تمت مراجعتهم' : 'reviewed'} • {summary.unreviewedCount} {isAr ? 'بانتظار المراجعة' : 'unreviewed'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statusBarData.map((st, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1 truncate">{st.name}</span>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl font-black text-white">{st.count}</span>
                <span className="text-xs text-blue-400 font-bold font-mono">
                  {summary.totalApplicants > 0 ? Math.round((st.count / summary.totalApplicants) * 100) : 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
