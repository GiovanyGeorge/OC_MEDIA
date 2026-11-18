import React from 'react';
import { Camera, CheckCircle2, Laptop } from 'lucide-react';
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
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Camera className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              {isAr ? 'تحليل المعدات والأدوات والتجهيزات (Equipment & Gear)' : 'Equipment & Gear Analytics'}
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            {isAr
              ? 'إحصائيات الكاميرات الاحترافية، معدات الصوت، الإضاءة، وأجهزة المونتاج والتصميم المتوفرة لدى الطلاب'
              : 'Inventory of DSLR/mirrorless cameras, audio gear, studio lighting, and computing devices with applicants'}
          </p>
        </div>
        <div className="text-xs text-slate-300 font-medium px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto font-mono">
          {summary.allEquipmentStats.length} {isAr ? 'فئة معدات مسجلة' : 'Categories'}
        </div>
      </div>

      {/* Highlights KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Most Common Gear */}
        <div className="p-5 rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1">
              {isAr ? 'المعدة الأكثر توفراً' : 'Most Common Gear'}
            </span>
            <div className="text-lg font-bold text-white truncate max-w-[190px]" title={summary.topEquipment[0]?.labelAr}>
              {summary.topEquipment[0] ? (isAr ? summary.topEquipment[0].labelAr : summary.topEquipment[0].labelEn) : '-'}
            </div>
            <span className="text-xs text-cyan-400 font-mono mt-0.5 block">
              {summary.topEquipment[0]?.count || 0} {isAr ? 'أجهزة مسجلة' : 'units'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5" />
          </div>
        </div>

        {/* Multi-Gear Owners */}
        <div className="p-5 rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1">
              {isAr ? 'حائزو أكثر من معدة (Multi-Gear)' : 'Multi-Gear Owners'}
            </span>
            <div className="text-2xl font-black text-white">
              {summary.multipleEquipmentCount}
            </div>
            <span className="text-xs text-emerald-400 font-mono mt-0.5 block">
              {summary.multipleEquipmentPercentage}% {isAr ? 'من إجمالي المتقدمين' : 'of applicants'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Total Available Gear Units */}
        <div className="p-5 rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1">
              {isAr ? 'إجمالي الأجهزة والمعدات المتوفرة' : 'Total Available Gear Units'}
            </span>
            <div className="text-2xl font-black text-white">
              {summary.allEquipmentStats.reduce((sum, e) => sum + e.count, 0)}
            </div>
            <span className="text-xs text-blue-400 font-mono mt-0.5 block">
              {summary.uniqueEquipmentCount} {isAr ? 'نوع جهاز ومعدة' : 'unique gear types'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Laptop className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Bar Chart */}
      <div className="p-6 rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm">
        <h3 className="font-bold text-white text-sm mb-4 pb-3 border-b border-slate-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{isAr ? 'رسم بياني لتوزيع المعدات والأدوات المتوفرة' : 'Equipment Distribution Chart'}</span>
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
              <Bar dataKey="count" fill="#0891b2" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Equipment Table */}
      <div className="p-6 rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm">
        <h3 className="font-bold text-white text-sm mb-4 pb-3 border-b border-slate-800">
          {isAr ? 'جدول أعداد ونسب توفر المعدات الكامل' : 'Detailed Equipment Inventory'}
        </h3>

        <div className="overflow-x-auto">
          <table className={`w-full text-xs ${isAr ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/60">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">{isAr ? 'المعدة أو الجهاز' : 'Equipment / Gear'}</th>
                <th className="py-3 px-3 text-center">{isAr ? 'عدد الحائزين' : 'Available Units'}</th>
                <th className="py-3 px-3 text-center">{isAr ? 'النسبة المئوية' : 'Percentage'}</th>
                <th className="py-3 px-3">{isAr ? 'مؤشر التوزيع' : 'Visual Ratio'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {summary.allEquipmentStats.map((item, index) => (
                <tr key={item.item} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 text-slate-500 font-mono">{index + 1}</td>
                  <td className="py-3 px-3 font-bold text-white">
                    {isAr ? item.labelAr : item.labelEn}
                    <span className="block text-[10px] text-slate-500 font-normal font-mono">{item.item}</span>
                  </td>
                  <td className="py-3 px-3 text-center font-bold font-mono text-cyan-400">{item.count}</td>
                  <td className="py-3 px-3 text-center font-bold font-mono text-slate-200">{item.percentage}%</td>
                  <td className="py-3 px-3 w-48">
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
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
