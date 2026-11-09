import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RecruitmentForm } from './components/RecruitmentForm';
import { SuccessView } from './components/SuccessView';
import { Footer } from './components/Footer';
import { SetupNoticeModal } from './components/SetupNoticeModal';
import { SubmissionResult, FormDataState } from './types/recruitment';
import { DashboardApp } from './dashboard/DashboardApp';
import { BarChart3 } from 'lucide-react';

export function App() {
  const [view, setView] = useState<'recruitment' | 'dashboard'>(() => {
    const hash = window.location.hash.toLowerCase();
    return (hash.includes('dashboard') || hash.includes('admin')) ? 'dashboard' : 'recruitment';
  });

  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [lastSubmittedData, setLastSubmittedData] = useState<FormDataState | null>(null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('dashboard') || hash.includes('admin')) {
        setView('dashboard');
      } else {
        setView('recruitment');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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

  const switchToDashboard = () => {
    window.location.hash = '#dashboard';
    setView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const switchToRecruitment = () => {
    window.location.hash = '';
    setView('recruitment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If in Dashboard view, render the full Dashboard application
  if (view === 'dashboard') {
    return <DashboardApp onBackToRecruitment={switchToRecruitment} />;
  }

  // Otherwise, render the untouched Recruitment Form application
  return (
    <div className="min-h-screen bg-brand-darkest text-slate-100 flex flex-col font-arabic relative selection:bg-brand-blue selection:text-white">
      {/* Top Banner and Navigation */}
      <Header onOpenSetupModal={() => setIsSetupModalOpen(true)} />

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

      {/* Admin Floating Shortcut Pill */}
      <div className="fixed bottom-4 left-4 z-30">
        <button
          type="button"
          onClick={switchToDashboard}
          className="px-3.5 py-2 rounded-full bg-brand-dark/95 hover:bg-slate-800 border border-slate-700/80 text-brand-cyan hover:text-white text-xs font-bold transition shadow-lg backdrop-blur-md flex items-center gap-2 group"
          title="فتح لوحة تحليلات وإدارة المتقدمين (Admin Dashboard)"
        >
          <BarChart3 className="w-4 h-4 text-brand-cyan group-hover:scale-110 transition-transform" />
          <span>لوحة التحليلات (Admin)</span>
        </button>
      </div>

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

export default App;
