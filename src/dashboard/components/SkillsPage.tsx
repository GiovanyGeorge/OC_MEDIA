import React from 'react';
import { Sparkles, Layers } from 'lucide-react';
import { DashboardSummary } from '../types/dashboard';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';

interface SkillsPageProps {
  summary: DashboardSummary;
  lang: 'ar' | 'en';
}

export const SkillsPage: React.FC<SkillsPageProps> = ({ summary, lang }) => {
  const isAr = lang === 'ar';

  const chartData = summary.allSkillsStats.map((s) => ({
    name: isAr ? s.labelAr : s.labelEn,
    count: s.count,
    percentage: s.percentage
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="p-6 rounded-2xl bg-brand-dark border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-brand-cyan" />
            <h2 className="text-lg font-bold text-white">
              {isAr ? 'تحليل المهارات الإعلامية (Skills Analytics)' : 'Media Skills Analytics'}
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            {isAr
              ? 'توزيع نسب وأعداد المتقدمين عبر كافة مجالات الإنتاج والتغطية والتصميم'
              : 'Distribution of applicant skills across all production and design domains'}
          </p>
        </div>
        <div className="text-xs text-slate-300 font-medium px-3.5 py-1.5 rounded-xl bg-brand-navy border border-slate-700 self-start sm:self-auto">
          {summary.allSkillsStats.length} {isAr ? 'مجال إعلامي مسجل' : 'Skill Categories'}
        </div>
      </div>

      {/* Main Bar Chart */}
      <div className="p-6 rounded-2xl bg-brand-dark border border-slate-800 shadow-sm">
        <h3 className="font-bold text-white text-sm mb-4 pb-3 border-b border-slate-800 flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand-cyan" />
          <span>{isAr ? 'رسم بياني لجميع المهارات الإعلامية' : 'All Media Skills Distribution'}</span>
        </h3>

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
      </div>

      {/* Detailed Skills Table */}
      <div className="p-6 rounded-2xl bg-brand-dark border border-slate-800 shadow-sm">
        <h3 className="font-bold text-white text-sm mb-4 pb-3 border-b border-slate-800">
          {isAr ? 'جدول نسب وأعداد المهارات' : 'Detailed Skills Table'}
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
                <tr key={skill.skill} className="hover:bg-brand-navy/40 transition">
                  <td className="py-3 pr-2 text-slate-500 font-mono">{index + 1}</td>
                  <td className="py-3 font-semibold text-white">
                    {isAr ? skill.labelAr : skill.labelEn}
                    <span className="block text-[10px] text-slate-500 font-normal">{skill.skill}</span>
                  </td>
                  <td className="py-3 font-bold text-brand-cyan">{skill.count}</td>
                  <td className="py-3 font-bold text-slate-200">{skill.percentage}%</td>
                  <td className="py-3 w-40">
                    <div className="w-full bg-brand-navy h-2 rounded-full overflow-hidden border border-slate-700/60">
                      <div
                        className="bg-brand-blue h-full rounded-full"
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

