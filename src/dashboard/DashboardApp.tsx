import React, { useState, useMemo, useEffect } from 'react';
import { ApplicantRecord, DashboardTab, ApplicantEvaluation } from './types/dashboard';
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
import { 
  loadEvaluationsFromStorage, 
  saveEvaluationToStorage 
} from './utils/evaluationStorage';

interface DashboardAppProps {
  onBackToRecruitment: () => void;
}

export const DashboardApp: React.FC<DashboardAppProps> = ({ onBackToRecruitment }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  
  // Raw uploaded data state
  const [rawApplicants, setRawApplicants] = useState<ApplicantRecord[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [showUploaderModal, setShowUploaderModal] = useState(false);

  // Administrative Evaluations Map (stored locally in browser)
  const [evaluationsMap, setEvaluationsMap] = useState<Record<string, ApplicantEvaluation>>({});

  // Load evaluations from localStorage on mount
  useEffect(() => {
    const loaded = loadEvaluationsFromStorage();
    setEvaluationsMap(loaded);
  }, []);

  // Merge raw applicants with administrative evaluations in-memory
  const applicants = useMemo(() => {
    return rawApplicants.map((applicant) => ({
      ...applicant,
      evaluation: evaluationsMap[applicant.id] || applicant.evaluation
    }));
  }, [rawApplicants, evaluationsMap]);

  // Selected applicant for detail modal / drawer
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null);

  const selectedApplicant = useMemo(() => {
    if (!selectedApplicantId) return null;
    return applicants.find(a => a.id === selectedApplicantId) || null;
  }, [selectedApplicantId, applicants]);

  const isAr = lang === 'ar';

  const handleDataLoaded = (newApplicants: ApplicantRecord[], loadedFileName: string) => {
    setRawApplicants(newApplicants);
    setFileName(loadedFileName);
    setShowUploaderModal(false);
    setActiveTab('overview');
  };

  const handleSaveEvaluation = (updatedEval: ApplicantEvaluation) => {
    const newMap = saveEvaluationToStorage(updatedEval);
    setEvaluationsMap(newMap);
  };

  const handleQuickToggleShortlist = (applicantId: string) => {
    const current = evaluationsMap[applicantId];
    const isShortlisted = !current?.isShortlisted;
    const updatedEval: ApplicantEvaluation = {
      ...current,
      applicantId,
      isShortlisted,
      statusOverride: isShortlisted ? 'Shortlisted' : (current?.statusOverride || 'Pending Review'),
      updatedAt: new Date().toISOString(),
      isReviewed: true
    };
    const newMap = saveEvaluationToStorage(updatedEval);
    setEvaluationsMap(newMap);
  };

  const handleReloadEvaluations = () => {
    const fresh = loadEvaluationsFromStorage();
    setEvaluationsMap(fresh);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setRawApplicants([]);
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
              onSelectApplicant={(a) => setSelectedApplicantId(a.id)}
              onQuickToggleShortlist={handleQuickToggleShortlist}
              lang={lang}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsPage 
              applicants={applicants} 
              summary={summary} 
              onEvaluationsReloaded={handleReloadEvaluations}
              lang={lang} 
            />
          )}
        </div>
      )}

      {/* Upload New File Modal Overlay (when already viewing data) */}
      {showUploaderModal && applicants.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0a1120] rounded-3xl border border-slate-700 w-full max-w-xl p-6 relative shadow-2xl">
            <button
              onClick={() => setShowUploaderModal(false)}
              className="absolute top-4 left-4 p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-800"
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

      {/* Applicant Detail Profile & Evaluation Modal / Drawer */}
      <ApplicantDetailModal
        applicant={selectedApplicant}
        isOpen={Boolean(selectedApplicant)}
        onClose={() => setSelectedApplicantId(null)}
        onSaveEvaluation={handleSaveEvaluation}
        lang={lang}
      />
    </DashboardLayout>
  );
};
