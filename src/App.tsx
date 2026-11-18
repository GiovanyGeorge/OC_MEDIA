/**
 * Main Application Router — OC Media Platform
 * Phase 3: Hash-based routing supporting:
 * - Public Recruitment Form (default or #recruitment)
 * - Legacy In-Memory Spreadsheet Dashboard (#dashboard)
 * - Firebase Admin Console (#admin) [Protected: admin]
 * - Firebase Member Portal (#member) [Protected: member]
 * - Unified Sign In Page (#login)
 * - Self-Service Activation Page (#activate)
 */

import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RecruitmentForm } from './components/RecruitmentForm';
import { SuccessView } from './components/SuccessView';
import { Footer } from './components/Footer';
import { SetupNoticeModal } from './components/SetupNoticeModal';
import { SubmissionResult, FormDataState } from './types/recruitment';
import { DashboardApp } from './dashboard/DashboardApp';

// Phase 3 Modules
import { AuthProvider } from './lib/auth';
import { I18nProvider } from './lib/i18n';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './auth/LoginPage';
import { ActivationPage } from './auth/ActivationPage';
import { AdminDashboard } from './admin/AdminDashboard';
import { MemberDashboard } from './member/MemberDashboard';

export type AppView =
  | 'recruitment'
  | 'spreadsheet_dashboard'
  | 'admin_dashboard'
  | 'member_dashboard'
  | 'login'
  | 'activate';

function AppContent() {
  const [view, setView] = useState<AppView>(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('activate')) return 'activate';
    if (hash.includes('login')) return 'login';
    if (hash.includes('admin')) return 'admin_dashboard';
    if (hash.includes('member')) return 'member_dashboard';
    if (hash.includes('dashboard')) return 'spreadsheet_dashboard';
    return 'recruitment';
  });

  const [loginSuggestedTab, setLoginSuggestedTab] = useState<'admin' | 'member'>('member');
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [lastSubmittedData, setLastSubmittedData] = useState<FormDataState | null>(null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('activate')) {
        setView('activate');
      } else if (hash.includes('login')) {
        setView('login');
      } else if (hash.includes('admin')) {
        setView('admin_dashboard');
      } else if (hash.includes('member')) {
        setView('member_dashboard');
      } else if (hash.includes('dashboard')) {
        setView('spreadsheet_dashboard');
      } else {
        setView('recruitment');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (newView: AppView, newHash = '') => {
    window.location.hash = newHash;
    setView(newView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSuccess = (result: SubmissionResult, data: FormDataState) => {
    setSubmissionResult(result);
    setLastSubmittedData(data);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setSubmissionResult(null);
    setLastSubmittedData(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route 1: Unified Login Page
  if (view === 'login') {
    return (
      <LoginPage
        initialTab={loginSuggestedTab}
        onLoginSuccess={(role) => {
          if (role === 'admin') {
            navigateTo('admin_dashboard', '#admin');
          } else {
            navigateTo('member_dashboard', '#member');
          }
        }}
        onNavigateToRecruitment={() => navigateTo('recruitment', '')}
        onNavigateToActivation={() => navigateTo('activate', '#activate')}
      />
    );
  }

  // Route 2: Self-Service Activation Page
  if (view === 'activate') {
    return (
      <ActivationPage
        onNavigateToLogin={() => {
          setLoginSuggestedTab('member');
          navigateTo('login', '#login');
        }}
        onNavigateToRecruitment={() => navigateTo('recruitment', '')}
      />
    );
  }

  // Route 3: Admin Console (Protected: admin)
  if (view === 'admin_dashboard') {
    return (
      <ProtectedRoute
        allowedRole="admin"
        onNavigateToLogin={(tab) => {
          setLoginSuggestedTab(tab || 'admin');
          navigateTo('login', '#login');
        }}
        onNavigateToRecruitment={() => navigateTo('recruitment', '')}
      >
        <AdminDashboard
          onBackToRecruitment={() => navigateTo('recruitment', '')}
          onOpenSpreadsheetDashboard={() => navigateTo('spreadsheet_dashboard', '#dashboard')}
        />
      </ProtectedRoute>
    );
  }

  // Route 4: Member Portal (Protected: member)
  if (view === 'member_dashboard') {
    return (
      <ProtectedRoute
        allowedRole="member"
        onNavigateToLogin={(tab) => {
          setLoginSuggestedTab(tab || 'member');
          navigateTo('login', '#login');
        }}
        onNavigateToRecruitment={() => navigateTo('recruitment', '')}
      >
        <MemberDashboard onBackToRecruitment={() => navigateTo('recruitment', '')} />
      </ProtectedRoute>
    );
  }

  // Route 5: Existing Spreadsheet In-Memory Analytics Dashboard (#dashboard)
  if (view === 'spreadsheet_dashboard') {
    return <DashboardApp onBackToRecruitment={() => navigateTo('recruitment', '')} />;
  }

  // Route 6: Public Recruitment Form (Default)
  return (
    <div className="min-h-screen bg-brand-darkest text-slate-100 flex flex-col font-arabic relative selection:bg-brand-blue selection:text-white">
      {/* Top Banner and Navigation */}
      <Header onOpenSetupModal={() => setIsSetupModalOpen(true)} />

      {/* Floating Quick-Access Bar for Portal Login & Activation */}
      <div className="bg-brand-navy/60 border-b border-brand-border py-2 px-4 text-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-slate-400 text-[11px] hidden sm:inline">
            كلية الحاسبات والذكاء الاصطناعي — جامعة العاصمة
          </span>
          <div className="flex items-center gap-2 mr-auto sm:mr-0">
            <button
              onClick={() => navigateTo('activate', '#activate')}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-brand-cyan border border-brand-cyan/20 text-[11px] font-bold transition"
            >
              تفعيل حساب عضو
            </button>
            <button
              onClick={() => {
                setLoginSuggestedTab('member');
                navigateTo('login', '#login');
              }}
              className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[11px] font-bold transition"
            >
              تسجيل الدخول
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1">
        {submissionResult && lastSubmittedData ? (
          <SuccessView
            result={submissionResult}
            formData={lastSubmittedData}
            onReset={handleReset}
          />
        ) : (
          <RecruitmentForm
            onSuccess={handleSuccess}
            onOpenSetupModal={() => setIsSetupModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Setup Instructions Modal */}
      <SetupNoticeModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
      />
    </div>
  );
}

export function App() {
  return (
    <I18nProvider initialLang="ar">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;
