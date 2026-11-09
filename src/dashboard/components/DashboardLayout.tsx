import React, { useState } from 'react';
import { 
  BarChart3, 
  Layers, 
  Camera, 
  Users, 
  Download, 
  UploadCloud, 
  Globe, 
  ArrowRight, 
  Menu, 
  X, 
  FileSpreadsheet
} from 'lucide-react';
import { DashboardTab } from '../types/dashboard';

interface DashboardLayoutProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  fileName: string | null;
  applicantCount: number;
  onUploadNewFile: () => void;
  onBackToRecruitment: () => void;
  lang: 'ar' | 'en';
  onToggleLang: () => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  activeTab,
  onTabChange,
  fileName,
  applicantCount,
  onUploadNewFile,
  onBackToRecruitment,
  lang,
  onToggleLang,
  children
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAr = lang === 'ar';

  const NAV_ITEMS: { id: DashboardTab; labelAr: string; labelEn: string; icon: React.ElementType }[] = [
    { id: 'overview', labelAr: 'نظرة عامة', labelEn: 'Overview', icon: BarChart3 },
    { id: 'skills', labelAr: 'تحليل المهارات', labelEn: 'Skills Analytics', icon: Layers },
    { id: 'equipment', labelAr: 'المعدات والأدوات', labelEn: 'Equipment & Gear', icon: Camera },
    { id: 'applicants', labelAr: 'إدارة المتقدمين', labelEn: 'Applicants Table', icon: Users },
    { id: 'reports', labelAr: 'التقارير والتصدير', labelEn: 'Reports & Export', icon: Download },
  ];

  return (
    <div className={`min-h-screen bg-brand-darkest text-slate-100 flex flex-col font-arabic ${isAr ? 'rtl' : 'ltr'}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Admin Navbar */}
      <header className="border-b border-slate-800 bg-brand-dark/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Org Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-brand-navy border border-slate-700 text-slate-400 hover:text-white lg:hidden"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="w-10 h-10 rounded-xl bg-brand-navy border border-slate-700 p-0.5 overflow-hidden flex items-center justify-center shrink-0">
              <img src="/logo.jpg" alt="OC Union" className="w-full h-full object-cover rounded-lg" />
            </div>

            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">لوحة تحليلات لجنة الإعلام</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-brand-blue/20 text-brand-cyan border border-brand-cyan/20 font-bold">
                  Admin Analytics
                </span>
              </div>
              <p className="text-[11px] text-slate-400">اتحاد طلاب حاسبات والذكاء الاصطناعي — جامعة العاصمة</p>
            </div>
          </div>

          {/* Active File Badge & Actions */}
          <div className="flex items-center gap-2.5">
            {fileName && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-navy border border-slate-700 text-xs">
                <FileSpreadsheet className="w-4 h-4 text-brand-cyan" />
                <span className="text-slate-300 font-medium truncate max-w-[180px]" title={fileName}>
                  {fileName}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-darkest text-brand-cyan font-bold">
                  {applicantCount}
                </span>
              </div>
            )}

            {/* Upload New File */}
            <button
              type="button"
              onClick={onUploadNewFile}
              className="px-3 py-1.5 rounded-xl bg-brand-navy hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
              title={isAr ? 'رفع ملف إكسل جديد' : 'Upload newer spreadsheet'}
            >
              <UploadCloud className="w-3.5 h-3.5 text-brand-cyan" />
              <span className="hidden sm:inline">{isAr ? 'تغيير الملف' : 'Replace File'}</span>
            </button>

            {/* Language Switcher */}
            <button
              type="button"
              onClick={onToggleLang}
              className="px-3 py-1.5 rounded-xl bg-brand-navy hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition"
              title={isAr ? 'Switch to English' : 'التحويل للغة العربية'}
            >
              <Globe className="w-3.5 h-3.5 text-brand-cyan" />
              <span>{isAr ? 'EN' : 'عربي'}</span>
            </button>

            {/* Back to Recruitment Portal */}
            <button
              type="button"
              onClick={onBackToRecruitment}
              className="px-3 py-1.5 rounded-xl bg-brand-blue/15 hover:bg-brand-blue/25 border border-brand-cyan/30 text-brand-cyan hover:text-white text-xs font-bold flex items-center gap-1.5 transition"
              title={isAr ? 'العودة لاستمارة التقديم' : 'Back to Public Form'}
            >
              <span>{isAr ? 'استمارة التقديم' : 'Recruitment Form'}</span>
              <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Body with Sidebar and Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col lg:flex-row gap-6 w-full">
        {/* Desktop Sidebar */}
        <aside className="w-60 shrink-0 hidden lg:block">
          <nav className="p-3 rounded-2xl bg-brand-dark border border-slate-800 sticky top-24 space-y-1 shadow-sm">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {isAr ? 'القائمة الرئيسية' : 'Navigation Menu'}
            </div>

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                    isActive
                      ? 'bg-brand-blue text-white shadow-sm shadow-brand-blue/40'
                      : 'text-slate-300 hover:bg-brand-navy hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{isAr ? item.labelAr : item.labelEn}</span>
                </button>
              );
            })}

            <div className="pt-4 mt-4 border-t border-slate-800 px-3 pb-1 text-[11px] text-slate-400 leading-normal">
              <span className="font-semibold block text-slate-300 mb-1">{isAr ? 'حماية البيانات:' : 'Data Privacy:'}</span>
              {isAr ? 'تتم كافة العمليات محلياً بذاكرة المتصفح ولا يتم حفظ أو إرسال سجلات الطلاب لأي جهة.' : 'Processed strictly in-memory.'}
            </div>
          </nav>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden p-4 rounded-2xl bg-brand-dark border border-slate-800 space-y-1 shadow-lg animate-fadeIn">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onTabChange(item.id); setMobileMenuOpen(false); }}
                  className={`w-full p-3 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                    isActive
                      ? 'bg-brand-blue text-white'
                      : 'text-slate-300 hover:bg-brand-navy hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{isAr ? item.labelAr : item.labelEn}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Main Workspace Area */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* Admin Footer */}
      <footer className="border-t border-slate-800/80 bg-brand-darkest text-slate-500 py-4 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>اتحاد طلاب كلية الحاسبات والذكاء الاصطناعي — جامعة العاصمة • OC Media Analytics</p>
          <p className="text-[11px] text-slate-600">Local Browser In-Memory Processing</p>
        </div>
      </footer>
    </div>
  );
};
