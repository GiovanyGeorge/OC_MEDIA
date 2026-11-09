import React from 'react';
import { 
  Users, 
  FileCheck, 
  Sparkles, 
  Camera, 
  PieChart as PieIcon, 
  BarChart3, 
  Calendar 
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

export const OverviewPage: React.FC<OverviewPageProps> = ({ summary, lang }) => {
  const isAr = lang === 'ar';

  const pieData = summary.academicYearStats.map((item, index) => ({
    name: isAr ? item.labelAr : item.labelEn,
    value: item.count,
    color: YEAR_COLORS[index % YEAR_COLORS.length]
  }));

  const skillsBarData = summary.topSkills.map((s) => ({
    name: isAr ? s.labelAr : s.labelEn,
    count: s.count
  }));

  const statusBarData = summary.statusStats.map((st) => ({
    name: st.status,
    count: st.count
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Applicants */}
        <div className="p-5 rounded-2xl bg-brand-dark border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">
              {isAr ? 'إجمالي المتقدمين' : 'Total Applicants'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-brand-cyan flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{summary.totalApplicants}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {isAr ? 'طالب مسجل بالاستمارة' : 'Registered students'}
          </p>
        </div>

        {/* Portfolio Rate */}
        <div className="p-5 rounded-2xl bg-brand-dark border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">
              {isAr ? 'نسبة إرفاق البورتفوليو' : 'Portfolio Attached'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {summary.portfolioPercentage}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {summary.applicantsWithPortfolio} {isAr ? 'من إجمالي المتقدمين' : 'of total applicants'}
          </p>
        </div>

        {/* Top Skill */}
        <div className="p-5 rounded-2xl bg-brand-dark border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">
              {isAr ? 'المهارة الأكثر طلباً' : 'Top Requested Skill'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="text-lg font-bold text-white truncate" title={summary.topSkills[0]?.labelAr}>
            {summary.topSkills[0] ? (isAr ? summary.topSkills[0].labelAr : summary.topSkills[0].labelEn) : '-'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {summary.topSkills[0]?.count || 0} {isAr ? 'متقدم يجيدها' : 'applicants'}
          </p>
        </div>

        {/* Top Equipment */}
        <div className="p-5 rounded-2xl bg-brand-dark border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">
              {isAr ? 'أكثر المعدات توفراً' : 'Top Available Gear'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
          </div>
          <div className="text-lg font-bold text-white truncate" title={summary.topEquipment[0]?.labelAr}>
            {summary.topEquipment[0] ? (isAr ? summary.topEquipment[0].labelAr : summary.topEquipment[0].labelEn) : '-'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {summary.topEquipment[0]?.count || 0} {isAr ? 'أجهزة متوفرة' : 'units available'}
          </p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Academic Year Chart */}
        <div className="p-6 rounded-2xl bg-brand-dark border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-brand-cyan" />
              <h3 className="font-bold text-white text-sm">
                {isAr ? 'توزيع المتقدمين حسب الفرقة الدراسية' : 'Applicants by Academic Year'}
              </h3>
            </div>
          </div>

          <div className="h-64 flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500">{isAr ? 'لا توجد بيانات' : 'No data available'}</p>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-3 pt-3 border-t border-slate-800/60 text-xs">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300 font-medium">{item.name}:</span>
                <span className="text-white font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Skills Chart */}
        <div className="p-6 rounded-2xl bg-brand-dark border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-cyan" />
              <h3 className="font-bold text-white text-sm">
                {isAr ? 'أعلى 5 مهارات إعلامية طلباً' : 'Top 5 Media Skills'}
              </h3>
            </div>
          </div>

          <div className="h-64">
            {skillsBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillsBarData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#cbd5e1" fontSize={11} width={120} tickLine={false} />
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
      </div>

      {/* Application Status Distribution */}
      <div className="p-6 rounded-2xl bg-brand-dark border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-cyan" />
            <h3 className="font-bold text-white text-sm">
              {isAr ? 'توزيع حالات الاستمارات (Application Status)' : 'Application Status Distribution'}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statusBarData.map((st, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-brand-navy border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">{st.name}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{st.count}</span>
                <span className="text-xs text-brand-cyan font-bold">
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

