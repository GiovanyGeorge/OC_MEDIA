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
  FileSpreadsheet,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Printer,
  ShieldCheck
} from 'lucide-react';
import { DashboardTab } from '../types/dashboard';
import { triggerPrintReport } from '../utils/exportUtils';

interface DashboardLayoutProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  fileName: string | null;
  applicantCount: number;
  onUploadNewFile: () => void;
  onBackToRecruitment: () => void;
  onLockSession?: () => void;
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
  onLockSession,
  lang,
  onToggleLang,
  children
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isAr = lang === 'ar';

  const NAV_ITEMS: { 
    id: DashboardTab; 
    labelAr: string; 
    labelEn: string; 
    icon: React.ElementType;
    descriptionAr: string;
    descriptionEn: string;
  }[] = [
    { 
      id: 'overview', 
      labelAr: 'نظرة عامة', 
      labelEn: 'Overview', 
      icon: BarChart3,
      descriptionAr: 'المؤشرات والرسوم البيانية',
      descriptionEn: 'KPIs & Distribution Charts'
    },
    { 
      id: 'skills', 
      labelAr: 'تحليل المهارات', 
      labelEn: 'Skills Analytics', 
      icon: Layers,
      descriptionAr: 'توزيع المهارات والسنوات',
      descriptionEn: 'Skills & Academic Breakdown'
    },
    { 
      id: 'equipment', 
      labelAr: 'المعدات والأدوات', 
      labelEn: 'Equipment & Gear', 
      icon: Camera,
      descriptionAr: 'الكاميرات والأجهزة المتوفرة',
      descriptionEn: 'Gear Inventory & Devices'
    },
    { 
      id: 'applicants', 
      labelAr: 'إدارة المتقدمين', 
      labelEn: 'Applicants Management', 
      icon: Users,
      descriptionAr: 'الفلترة والتقييم الداخلي',
      descriptionEn: 'Search, Filter & Review'
    },
    { 
      id: 'reports', 
      labelAr: 'التقارير والتصدير', 
      labelEn: 'Reports & Export', 
      icon: Download,
      descriptionAr: 'تصدير إكسل والنسخ الاحتياطي',
      descriptionEn: 'CSV Exports & Backup'
    },
  ];

  return (
    <div className={`min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-arabic ${isAr ? 'rtl' : 'ltr'}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Enterprise Header */}
      <header className="border-b border-slate-800/80 bg-[#0a1120]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & University / Faculty Brand */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Drawer Trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white lg:hidden"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo Image */}
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 p-0.5 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
              <img src="/logo.jpg" alt="Faculty Logo" className="w-full h-full object-cover rounded-lg" />
            </div>

            {/* Brand Titles */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-white truncate tracking-tight">
                  {isAr ? 'لجنة الإعلام — كلية الحاسبات والذكاء الاصطناعي' : 'Media Committee — FCAI'}
                </span>
                <span className="hidden xl:inline-flex text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-blue-600/15 text-blue-400 border border-blue-500/20">
                  {isAr ? 'جامعة العاصمة' : 'Capital University'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                {isAr ? 'نظام التحليلات الإداري المتقدم وإدارة شؤون المتقدمين' : 'Enterprise Recruitment Analytics & Applicant Review'}
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Active File Pill */}
            {fileName && (
              <div 
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs shadow-inner"
                title={`${fileName} (${applicantCount} ${isAr ? 'سجل' : 'records'})`}
              >
                <FileSpreadsheet className="w-4 h-4 text-brand-cyan shrink-0" />
                <span className="text-slate-300 font-mono text-[11px] truncate max-w-[140px] lg:max-w-[190px]">
                  {fileName}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-brand-cyan">
                  {applicantCount} {isAr ? 'طالب' : 'applicants'}
                </span>
              </div>
            )}

            {/* Replace File Button */}
            <button
              type="button"
              onClick={onUploadNewFile}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              title={isAr ? 'رفع ملف إكسل جديد لاستبدال التحليل' : 'Upload newer spreadsheet'}
            >
              <UploadCloud className="w-3.5 h-3.5 text-brand-cyan" />
              <span className="hidden sm:inline">{isAr ? 'تغيير الملف' : 'Replace File'}</span>
            </button>

            {/* Print Friendly Report */}
            <button
              type="button"
              onClick={triggerPrintReport}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition hidden md:flex items-center justify-center"
              title={isAr ? 'طباعة / حفظ التقرير PDF' : 'Print / Save as PDF'}
            >
              <Printer className="w-4 h-4 text-slate-300" />
            </button>

            {/* Language Switcher */}
            <button
              type="button"
              onClick={onToggleLang}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition"
              title={isAr ? 'Switch to English' : 'التحويل للغة العربية'}
            >
              <Globe className="w-3.5 h-3.5 text-brand-cyan" />
              <span className="font-mono">{isAr ? 'EN' : 'عربي'}</span>
            </button>

            {/* Back to Public Recruitment Portal */}
            <button
              type="button"
              onClick={onBackToRecruitment}
              className="px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:text-white text-xs font-bold flex items-center gap-1.5 transition"
              title={isAr ? 'العودة لصفحة التقديم العامة' : 'Back to Public Form'}
            >
              <span className="hidden sm:inline">{isAr ? 'الاستمارة العامة' : 'Public Form'}</span>
              <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
            </button>

            {/* Lock / Logout Session */}
            {onLockSession && (
              <button
                type="button"
                onClick={onLockSession}
                className="p-2 rounded-xl bg-red-950/30 hover:bg-red-900/40 border border-red-500/30 text-red-300 hover:text-white transition"
                title={isAr ? 'قفل الجلسة وتسجيل الخروج' : 'Lock Session & Logout'}
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col lg:flex-row gap-6">
        
        {/* Desktop Collapsible Sidebar */}
        <aside 
          className={`shrink-0 hidden lg:block transition-all duration-300 ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          <div className="sticky top-24 bg-[#0a1120] border border-slate-800/90 rounded-2xl p-3 shadow-md flex flex-col gap-2">
            
            {/* Header of Sidebar with Toggle Collapse */}
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-800/70 mb-1">
              {!isSidebarCollapsed && (
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {isAr ? 'أقسام النظام' : 'Navigation'}
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition mx-auto"
                title={isSidebarCollapsed ? (isAr ? 'توسيع القائمة' : 'Expand Sidebar') : (isAr ? 'تصغير القائمة' : 'Collapse Sidebar')}
              >
                {isSidebarCollapsed ? (
                  isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                ) : (
                  isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onTabChange(item.id)}
                    className={`w-full rounded-xl transition flex items-center gap-3 ${
                      isSidebarCollapsed ? 'justify-center p-3' : 'p-2.5 text-right'
                    } ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm font-bold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
                    }`}
                    title={isSidebarCollapsed ? (isAr ? item.labelAr : item.labelEn) : undefined}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {!isSidebarCollapsed && (
                      <div className="min-w-0 text-start flex-1">
                        <div className="text-xs">{isAr ? item.labelAr : item.labelEn}</div>
                        <div className="text-[10px] text-slate-400 font-normal truncate">
                          {isAr ? item.descriptionAr : item.descriptionEn}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Data Privacy & In-Memory Assurance */}
            {!isSidebarCollapsed ? (
              <div className="pt-3 mt-2 border-t border-slate-800/70 px-2 pb-1 text-[11px] text-slate-400 leading-relaxed">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>{isAr ? 'خصوصية كاملة' : 'Strict Local Privacy'}</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  {isAr 
                    ? 'كافة ملفات الإكسل يتم تحليلها بذاكرة المتصفح دون إرسال أي بيانات لخوادم خارجية.' 
                    : 'All spreadsheet data is processed locally in-memory.'}
                </p>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-800/70 flex justify-center text-emerald-400" title={isAr ? 'معالجة محلية آمنة' : 'Local processing'}>
                <ShieldCheck className="w-4 h-4" />
              </div>
            )}
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden p-4 rounded-2xl bg-[#0a1120] border border-slate-800 space-y-1 shadow-2xl animate-fadeIn">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onTabChange(item.id); setMobileMenuOpen(false); }}
                  className={`w-full p-3 rounded-xl text-xs font-bold transition flex items-center gap-3 ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <div className="text-start">
                    <div>{isAr ? item.labelAr : item.labelEn}</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      {isAr ? item.descriptionAr : item.descriptionEn}
                    </div>
                  </div>
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

      {/* Enterprise Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070b14] text-slate-500 py-4 text-xs">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-start">
          <div>
            <span className="font-semibold text-slate-400">
              {isAr ? 'كلية الحاسبات والذكاء الاصطناعي — جامعة العاصمة' : 'Faculty of Computers and Artificial Intelligence — Capital University'}
            </span>
            <span className="mx-2 hidden sm:inline">•</span>
            <span className="text-slate-500">{isAr ? 'لجنة الإعلام (OC Media 2026)' : 'OC Media Committee'}</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Enterprise Local Analytics • Clean In-Memory Processing
          </div>
        </div>
      </footer>
    </div>
  );
};
