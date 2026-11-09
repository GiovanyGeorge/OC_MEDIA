import React from 'react';
import { Camera, CheckCircle2 } from 'lucide-react';
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

interface EquipmentPageProps {
  summary: DashboardSummary;
  lang: 'ar' | 'en';
}

export const EquipmentPage: React.FC<EquipmentPageProps> = ({ summary, lang }) => {
  const isAr = lang === 'ar';

  const chartData = summary.allEquipmentStats.map((e) => ({
    name: isAr ? e.labelAr : e.labelEn,
    count: e.count,
    percentage: e.percentage
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="p-6 rounded-2xl bg-brand-dark border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Camera className="w-5 h-5 text-brand-cyan" />
            <h2 className="text-lg font-bold text-white">
              {isAr ? 'تحليل المعدات والأدوات (Equipment Analytics)' : 'Equipment & Gear Analytics'}
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            {isAr
              ? 'إحصائيات الكاميرات ومعدات الصوت والإضاءة والأجهزة المتوفرة لدى الطلاب'
              : 'Inventory of cameras, audio, lighting, and computing gear available with applicants'}
          </p>
        </div>
        <div className="text-xs text-slate-300 font-medium px-3.5 py-1.5 rounded-xl bg-brand-navy border border-slate-700 self-start sm:self-auto">
          {summary.allEquipmentStats.length} {isAr ? 'فئة معدات' : 'Equipment Categories'}
        </div>
      </div>

      {/* Main Bar Chart */}
      <div className="p-6 rounded-2xl bg-brand-dark border border-slate-800 shadow-sm">
        <h3 className="font-bold text-white text-sm mb-4 pb-3 border-b border-slate-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-brand-cyan" />
          <span>{isAr ? 'رسم بياني لتوزيع المعدات والأدوات' : 'Equipment Distribution Chart'}</span>
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
              <Bar dataKey="count" fill="#0284c7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Equipment Table */}
      <div className="p-6 rounded-2xl bg-brand-dark border border-slate-800 shadow-sm">
        <h3 className="font-bold text-white text-sm mb-4 pb-3 border-b border-slate-800">
          {isAr ? 'جدول أعداد ونسب توفر المعدات' : 'Detailed Equipment Table'}
        </h3>

        <div className="overflow-x-auto">
          <table className={`w-full text-xs ${isAr ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3 pr-2">#</th>
                <th className="pb-3">{isAr ? 'المعدة أو الجهاز' : 'Equipment / Gear'}</th>
                <th className="pb-3">{isAr ? 'عدد الحائزين' : 'Available Units'}</th>
                <th className="pb-3">{isAr ? 'النسبة المئوية' : 'Percentage'}</th>
                <th className="pb-3">{isAr ? 'مؤشر التوزيع' : 'Visual Ratio'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {summary.allEquipmentStats.map((item, index) => (
                <tr key={item.item} className="hover:bg-brand-navy/40 transition">
                  <td className="py-3 pr-2 text-slate-500 font-mono">{index + 1}</td>
                  <td className="py-3 font-semibold text-white">
                    {isAr ? item.labelAr : item.labelEn}
                    <span className="block text-[10px] text-slate-500 font-normal">{item.item}</span>
                  </td>
                  <td className="py-3 font-bold text-brand-cyan">{item.count}</td>
                  <td className="py-3 font-bold text-slate-200">{item.percentage}%</td>
                  <td className="py-3 w-40">
                    <div className="w-full bg-brand-navy h-2 rounded-full overflow-hidden border border-slate-700/60">
                      <div
                        className="bg-cyan-500 h-full rounded-full"
                        style={{ width: `${item.percentage}%` }}
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

