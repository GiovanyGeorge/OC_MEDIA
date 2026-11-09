import React, { useState, useMemo } from 'react';
import { ApplicantRecord, DashboardTab } from './types/dashboard';
import { computeDashboardSummary } from './utils/analytics';
import { DashboardLayout } from './components/DashboardLayout';
import { FileUploadZone } from './components/FileUploadZone';
import { OverviewPage } from './components/OverviewPage';
import { SkillsPage } from './components/SkillsPage';
import { EquipmentPage } from './components/EquipmentPage';
import { ApplicantsTablePage } from './components/ApplicantsTablePage';
import { ReportsPage } from './components/ReportsPage';
import { ApplicantDetailModal } from './components/ApplicantDetailModal';
import { AdminGate } from './components/AdminGate';

interface DashboardAppProps {
  onBackToRecruitment: () => void;
}

export const DashboardApp: React.FC<DashboardAppProps> = ({ onBackToRecruitment }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  
  // Data state
  const [applicants, setApplicants] = useState<ApplicantRecord[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [showUploaderModal, setShowUploaderModal] = useState(false);

  // Selected applicant for detail modal
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantRecord | null>(null);

  const isAr = lang === 'ar';

  const handleDataLoaded = (newApplicants: ApplicantRecord[], loadedFileName: string) => {
    setApplicants(newApplicants);
    setFileName(loadedFileName);
    setShowUploaderModal(false);
    setActiveTab('overview');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setApplicants([]);
    setFileName(null);
  };

  const summary = useMemo(() => {
    return computeDashboardSummary(applicants);
  }, [applicants]);

  // If not authenticated, show the secure Admin Gate
  if (!isAuthenticated) {
    return (
      <AdminGate
        onAuthenticated={() => setIsAuthenticated(true)}
        onBackToRecruitment={onBackToRecruitment}
        lang={lang}
      />
    );
  }

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      fileName={fileName}
      applicantCount={applicants.length}
      onUploadNewFile={() => setShowUploaderModal(true)}
      onBackToRecruitment={onBackToRecruitment}
      onLockSession={handleLogout}
      lang={lang}
      onToggleLang={() => setLang(l => (l === 'ar' ? 'en' : 'ar'))}
    >
      {/* If no file is loaded yet, show the FileUploadZone */}
      {applicants.length === 0 ? (
        <div className="py-6">
          <FileUploadZone onDataLoaded={handleDataLoaded} lang={lang} />
        </div>
      ) : (
        /* If data is loaded, render the active tab */
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <OverviewPage summary={summary} lang={lang} />
          )}

          {activeTab === 'skills' && (
            <SkillsPage summary={summary} lang={lang} />
          )}

          {activeTab === 'equipment' && (
            <EquipmentPage summary={summary} lang={lang} />
          )}

          {activeTab === 'applicants' && (
            <ApplicantsTablePage 
              applicants={applicants}
              onSelectApplicant={setSelectedApplicant}
              lang={lang}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsPage applicants={applicants} summary={summary} lang={lang} />
          )}
        </div>
      )}

      {/* Upload New File Modal Overlay (when already viewing data) */}
      {showUploaderModal && applicants.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-brand-dark rounded-3xl border border-slate-700 w-full max-w-xl p-6 relative">
            <button
              onClick={() => setShowUploaderModal(false)}
              className="absolute top-4 left-4 p-2 rounded-xl bg-brand-navy hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              ✕
            </button>
            <h3 className="text-base font-bold text-white mb-4 pr-2">
              {isAr ? 'رفع ملف إكسل أو CSV جديد لاستبدال التحليل الحالي' : 'Upload New Spreadsheet to Replace Current Analysis'}
            </h3>
            <FileUploadZone onDataLoaded={handleDataLoaded} lang={lang} />
          </div>
        </div>
      )}

      {/* Applicant Detail Profile Modal */}
      <ApplicantDetailModal
        applicant={selectedApplicant}
        isOpen={Boolean(selectedApplicant)}
        onClose={() => setSelectedApplicant(null)}
        lang={lang}
      />
    </DashboardLayout>
  );
};
