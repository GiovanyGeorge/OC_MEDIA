import React, { useState } from 'react';
import { Sparkles, Layers, BarChart3, Grid } from 'lucide-react';
import { DashboardSummary } from '../types/dashboard';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend
} from 'recharts';

interface SkillsPageProps {
  summary: DashboardSummary;
  lang: 'ar' | 'en';
}

export const SkillsPage: React.FC<SkillsPageProps> = ({ summary, lang }) => {
  const isAr = lang === 'ar';
  const [viewMode, setViewMode] = useState<'overall' | 'crossYear'>('overall');

  // Overall Chart Data
  const chartData = summary.allSkillsStats.map((s) => ({
    name: isAr ? s.labelAr : s.labelEn,
    count: s.count,
    percentage: s.percentage
  }));

  // Cross-Year Chart Data (Top 8 Skills by Year)
  const crossYearData = summary.skillByYearMatrix.slice(0, 8).map(m => ({
    name: isAr ? m.labelAr : m.labelEn,
    first: m.firstYear,
    second: m.secondYear,
    third: m.thirdYear,
    fourth: m.fourthYear,
    total: m.total
  }));

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              {isAr ? 'تحليل المهارات الإعلامية المتخصصة (Skills Analytics)' : 'Media Skills Analytics'}
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            {isAr
              ? 'توزيع نسب وأعداد المتقدمين عبر كافة مجالات الإنتاج والتغطية والتصميم، والتحليل المتقاطع مع الفرق الدراسية'
              : 'Distribution of applicant skills across all production domains, cross-analyzed with academic years'}
          </p>
        </div>
        
        {/* Toggle View Mode Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setViewMode('overall')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              viewMode === 'overall' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{isAr ? 'التوزيع الإجمالي' : 'Overall Distribution'}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('crossYear')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              viewMode === 'crossYear' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>{isAr ? 'التحليل المتقاطع مع الفرق' : 'Cross-Year Analysis'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Chart Section */}
      <div className="p-6 rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>
              {viewMode === 'overall'
                ? (isAr ? 'رسم بياني لتوزيع جميع المهارات الإعلامية' : 'All Media Skills Distribution')
                : (isAr ? 'توزيع المهارات الأعلى طلباً عبر الفرق الدراسية' : 'Top Skills Breakdown by Academic Year')}
            </span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {summary.allSkillsStats.length} {isAr ? 'مهارة مسجلة' : 'skills'}
          </span>
        </div>

        {viewMode === 'overall' ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 45 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  angle={-30} 
                  textAnchor="end"
                  interval={0}
                />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={crossYearData} margin={{ top: 10, right: 10, left: 0, bottom: 45 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  angle={-30} 
                  textAnchor="end"
                  interval={0}
                />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }}
                />
                <Bar dataKey="first" name={isAr ? 'الفرقة الأولى' : '1st Year'} fill="#38bdf8" stackId="a" />
                <Bar dataKey="second" name={isAr ? 'الفرقة الثانية' : '2nd Year'} fill="#2563eb" stackId="a" />
                <Bar dataKey="third" name={isAr ? 'الفرقة الثالثة' : '3rd Year'} fill="#818cf8" stackId="a" />
                <Bar dataKey="fourth" name={isAr ? 'الفرقة الرابعة' : '4th Year'} fill="#c084fc" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Cross-Analysis Table: Skills vs Academic Years */}
      <div className="p-6 rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-white text-sm">
              {isAr ? 'مصفوفة التحليل المتقاطع: المهارات مقابل الفرق الدراسية' : 'Cross-Analysis Matrix: Skills vs Academic Year'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAr ? 'توزيع عدد الطلاب المجيدين لكل مهارة حسب سنتهم الدراسية بالكلية' : 'Number of qualified applicants per academic year'}
            </p>
          </div>
          <span className="text-xs text-blue-400 font-bold bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
            {summary.totalApplicants} {isAr ? 'إجمالي المتقدمين' : 'total'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className={`w-full text-xs ${isAr ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/60">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">{isAr ? 'المهارة الإعلامية' : 'Media Skill'}</th>
                <th className="py-3 px-3 text-center">{isAr ? 'الفرقة الأولى' : '1st Year'}</th>
                <th className="py-3 px-3 text-center">{isAr ? 'الفرقة الثانية' : '2nd Year'}</th>
                <th className="py-3 px-3 text-center">{isAr ? 'الفرقة الثالثة' : '3rd Year'}</th>
                <th className="py-3 px-3 text-center">{isAr ? 'الفرقة الرابعة' : '4th Year'}</th>
                <th className="py-3 px-3 text-center">{isAr ? 'الإجمالي' : 'Total'}</th>
                <th className="py-3 px-3 text-center">{isAr ? 'النسبة' : 'Share'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {summary.skillByYearMatrix.map((item, index) => {
                const pct = summary.totalApplicants > 0 ? Math.round((item.total / summary.totalApplicants) * 100) : 0;
                return (
                  <tr key={item.skill} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 text-slate-500 font-mono">{index + 1}</td>
                    <td className="py-3 px-3 font-bold text-white">
                      {isAr ? item.labelAr : item.labelEn}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-300">
                      {item.firstYear > 0 ? <span className="font-semibold text-blue-300">{item.firstYear}</span> : '-'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-300">
                      {item.secondYear > 0 ? <span className="font-semibold text-blue-400">{item.secondYear}</span> : '-'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-300">
                      {item.thirdYear > 0 ? <span className="font-semibold text-indigo-400">{item.thirdYear}</span> : '-'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-300">
                      {item.fourthYear > 0 ? <span className="font-semibold text-purple-400">{item.fourthYear}</span> : '-'}
                    </td>
                    <td className="py-3 px-3 text-center font-bold font-mono text-white">
                      {item.total}
                    </td>
                    <td className="py-3 px-3 text-center font-bold font-mono text-blue-400">
                      {pct}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Skills Table */}
      <div className="p-6 rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm">
        <h3 className="font-bold text-white text-sm mb-4 pb-3 border-b border-slate-800">
          {isAr ? 'جدول نسب وأعداد المهارات الكامل' : 'All Media Skills Distribution'}
        </h3>

        <div className="overflow-x-auto">
          <table className={`w-full text-xs ${isAr ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3 pr-2">#</th>
                <th className="pb-3">{isAr ? 'المهارة الإعلامية' : 'Media Skill'}</th>
                <th className="pb-3">{isAr ? 'عدد المتقدمين' : 'Applicants Count'}</th>
                <th className="pb-3">{isAr ? 'النسبة المئوية' : 'Percentage'}</th>
                <th className="pb-3">{isAr ? 'مؤشر التوزيع' : 'Visual Ratio'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {summary.allSkillsStats.map((skill, index) => (
                <tr key={skill.skill} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 pr-2 text-slate-500 font-mono">{index + 1}</td>
                  <td className="py-3 font-semibold text-white">
                    {isAr ? skill.labelAr : skill.labelEn}
                    <span className="block text-[10px] text-slate-500 font-normal">{skill.skill}</span>
                  </td>
                  <td className="py-3 font-bold text-blue-400 font-mono">{skill.count}</td>
                  <td className="py-3 font-bold text-slate-200 font-mono">{skill.percentage}%</td>
                  <td className="py-3 w-40">
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: `${skill.percentage}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
