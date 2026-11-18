/**
 * Admin Dashboard Container — OC Media Platform
 * Phase 3: Administrative control panel with full Firestore & backend integration.
 */

import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { AdminOverview } from './pages/AdminOverview';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { MembersPage } from './pages/MembersPage';
import { ActivationCodesPage } from './pages/ActivationCodesPage';
import { OrphanReconciliationPage } from './pages/OrphanReconciliationPage';
import { ToastContainer } from '../shared/ui';
import {
  BarChart3,
  Users,
  UserCheck,
  KeyRound,
  AlertTriangle,
  Globe,
  LogOut,
  ArrowRight,
  Menu,
  X,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';

export type AdminTab = 'overview' | 'applications' | 'members' | 'codes' | 'reconciliation';

interface AdminDashboardProps {
  onBackToRecruitment: () => void;
  onOpenSpreadsheetDashboard: () => void;
}

export function AdminDashboard({
  onBackToRecruitment,
  onOpenSpreadsheetDashboard,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [preselectedRefId, setPreselectedRefId] = useState<string | undefined>();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user, logout } = useAuth();
  const { isAr, toggleLang, t } = useI18n();

  const handleIssueCodeForApp = (referenceId: string) => {
    setPreselectedRefId(referenceId);
    setActiveTab('codes');
  };

  const navItems: { id: AdminTab; labelAr: string; labelEn: string; icon: React.ElementType }[] = [
    { id: 'overview', labelAr: 'نظرة عامة', labelEn: 'Overview', icon: BarChart3 },
    { id: 'applications', labelAr: 'طلبات التقديم', labelEn: 'Applications', icon: Users },
    { id: 'members', labelAr: 'إدارة الأعضاء', labelEn: 'Members', icon: UserCheck },
    { id: 'codes', labelAr: 'إصدار الأكواد', labelEn: 'Issue Codes', icon: KeyRound },
    { id: 'reconciliation', labelAr: 'التسوية الإدارية', labelEn: 'Reconciliation', icon: AlertTriangle },
  ];

  return (
    <div className={`min-h-screen bg-brand-darkest text-slate-100 flex flex-col font-arabic ${isAr ? 'rtl' : 'ltr'}`} dir={isAr ? 'rtl' : 'ltr'}>
      <ToastContainer />

      {/* Top Header */}
      <header className="border-b border-brand-border bg-brand-dark/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-brand-navy border border-brand-border text-slate-300 hover:text-white lg:hidden"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo */}
            <div className="w-10 h-10 rounded-xl bg-brand-navy border border-brand-border p-0.5 overflow-hidden flex items-center justify-center shrink-0">
              <img src="/logo.jpg" alt="OC Media" className="w-full h-full object-cover rounded-lg" />
            </div>

            {/* Titles */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-white truncate">
                  {t('لوحة تحكم إدارة إعلام الكلية', 'Media Committee Admin Console')}
                </span>
                <span className="hidden xl:inline-flex text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-blue-500/15 text-brand-cyan border border-brand-cyan/20">
                  {t('جامعة العاصمة', 'Capital Univ')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                {t('إدارة مركزية لطلبات التقديم وتفعيل حسابات الأعضاء', 'Central management for recruitments and member activation')}
              </p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Open Legacy Spreadsheet Analytics */}
            <button
              onClick={onOpenSpreadsheetDashboard}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-navy hover:bg-brand-card border border-brand-border text-slate-300 hover:text-white text-xs font-semibold transition"
              title={t('فتح لوحة تحليلات ملفات الإكسل المحلية', 'Open local spreadsheet analytics dashboard')}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-brand-cyan" />
              <span>{t('تحليلات الإكسل', 'Spreadsheet Analytics')}</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLang}
              className="px-2.5 py-1.5 rounded-xl bg-brand-navy hover:bg-brand-card border border-brand-border text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition"
              title={t('Switch to English', 'التحويل للغة العربية')}
            >
              <Globe className="w-3.5 h-3.5 text-brand-cyan" />
              <span className="font-mono">{isAr ? 'EN' : 'عربي'}</span>
            </button>

            {/* Back to Public Form */}
            <button
              onClick={onBackToRecruitment}
              className="px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:text-white text-xs font-bold flex items-center gap-1.5 transition"
            >
              <span className="hidden sm:inline">{t('الاستمارة العامة', 'Public Form')}</span>
              <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
            </button>

            {/* Logout */}
            <button
              onClick={() => logout()}
              className="p-2 rounded-xl bg-red-950/30 hover:bg-red-900/40 border border-red-500/30 text-red-300 hover:text-white transition"
              title={t('تسجيل الخروج', 'Logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col lg:flex-row gap-6">
        {/* Desktop Sidebar */}
        <aside className="shrink-0 hidden lg:block w-64">
          <div className="sticky top-24 bg-brand-dark border border-brand-border rounded-2xl p-3 shadow-md space-y-1">
            <div className="px-2 py-1.5 border-b border-brand-border mb-2 flex items-center gap-2 text-xs font-bold text-slate-400">
              <Shield className="w-4 h-4 text-brand-blue" />
              <span>{t('أقسام الإدارة المركزية', 'Administration')}</span>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full p-2.5 rounded-xl transition flex items-center gap-3 text-xs font-bold ${
                      isActive
                        ? 'bg-brand-blue text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{isAr ? item.labelAr : item.labelEn}</span>
                  </button>
                );
              })}
            </nav>

            {/* Admin identity pill */}
            {user && (
              <div className="pt-3 mt-3 border-t border-brand-border px-2 text-[11px] text-slate-400">
                <p className="text-[10px] text-slate-500">{t('مسجل باسم المسؤول:', 'Signed in as Admin:')}</p>
                <p className="font-mono text-white truncate mt-0.5">{user.email || user.uid}</p>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden p-4 rounded-2xl bg-brand-dark border border-brand-border space-y-1 mb-4 shadow-xl">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl text-xs font-bold transition flex items-center gap-3 ${
                    isActive ? 'bg-brand-blue text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{isAr ? item.labelAr : item.labelEn}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {activeTab === 'overview' && <AdminOverview onNavigateTab={setActiveTab} />}
          {activeTab === 'applications' && (
            <ApplicationsPage onIssueCodeForApp={handleIssueCodeForApp} />
          )}
          {activeTab === 'members' && <MembersPage />}
          {activeTab === 'codes' && (
            <ActivationCodesPage
              preselectedRefId={preselectedRefId}
              onClearPreselected={() => setPreselectedRefId(undefined)}
            />
          )}
          {activeTab === 'reconciliation' && <OrphanReconciliationPage />}
        </main>
      </div>
    </div>
  );
}
