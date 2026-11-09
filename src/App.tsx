import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RecruitmentForm } from './components/RecruitmentForm';
import { SuccessView } from './components/SuccessView';
import { Footer } from './components/Footer';
import { SetupNoticeModal } from './components/SetupNoticeModal';
import { SubmissionResult, FormDataState } from './types/recruitment';
import { DashboardApp } from './dashboard/DashboardApp';

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
