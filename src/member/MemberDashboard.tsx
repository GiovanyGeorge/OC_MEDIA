/**
 * Member Dashboard Container — OC Media Platform
 * Phase 3: Member portal with profile editing, portfolio management, and evaluations.
 */

import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { MemberOverview } from './pages/MemberOverview';
import { MyProfilePage } from './pages/MyProfilePage';
import { PortfolioPage } from './pages/PortfolioPage';
import { EvaluationsPage } from './pages/EvaluationsPage';
import { ToastContainer } from '../shared/ui';
import {
  Home,
  User,
  FolderGit2,
  Award,
  Globe,
  LogOut,
  ArrowRight,
  Menu,
  X,
  UserCheck,
} from 'lucide-react';

export type MemberTab = 'overview' | 'profile' | 'portfolio' | 'evaluations';

interface MemberDashboardProps {
  onBackToRecruitment: () => void;
}

export function MemberDashboard({ onBackToRecruitment }: MemberDashboardProps) {
  const [activeTab, setActiveTab] = useState<MemberTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user, logout } = useAuth();
  const profile = user?.memberProfile;
  const { isAr, toggleLang, t } = useI18n();

  const navItems: { id: MemberTab; labelAr: string; labelEn: string; icon: React.ElementType }[] = [
    { id: 'overview', labelAr: 'الرئيسية', labelEn: 'Overview', icon: Home },
    { id: 'profile', labelAr: 'ملفي الشخصي', labelEn: 'My Profile', icon: User },
    { id: 'portfolio', labelAr: 'معرض الأعمال', labelEn: 'Portfolio', icon: FolderGit2 },
    { id: 'evaluations', labelAr: 'التقييمات', labelEn: 'Evaluations', icon: Award },
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
                  {t('بوابة عضو إعلام الكلية', 'Media Member Portal')}
                </span>
                <span className="hidden xl:inline-flex text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-blue-500/15 text-brand-cyan border border-brand-cyan/20">
                  {profile?.referenceId || t('عضو', 'Member')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                {t('كلية الحاسبات والذكاء الاصطناعي — جامعة العاصمة', 'Faculty of Computers and AI — Capital University')}
              </p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
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
              <UserCheck className="w-4 h-4 text-brand-cyan" />
              <span>{t('أقسام حساب العضو', 'Member Portal')}</span>
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

            {/* Member identity footer */}
            {profile && (
              <div className="pt-3 mt-3 border-t border-brand-border px-2 text-[11px] text-slate-400">
                <p className="text-[10px] text-slate-500">{t('العضو المسجل:', 'Signed in as:')}</p>
                <p className="font-bold text-white truncate mt-0.5">{profile.fullName}</p>
                <p className="font-mono text-brand-cyan text-[10px]">{profile.referenceId}</p>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
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
          {activeTab === 'overview' && <MemberOverview onNavigateTab={setActiveTab} />}
          {activeTab === 'profile' && <MyProfilePage />}
          {activeTab === 'portfolio' && <PortfolioPage />}
          {activeTab === 'evaluations' && <EvaluationsPage />}
        </main>
      </div>
    </div>
  );
}
