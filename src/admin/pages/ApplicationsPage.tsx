/**
 * Applications Management Page — OC Media Platform
 * Phase 3: List, filter, search, view details, approve, and reject applications in Firestore.
 */

import { useState, useMemo } from 'react';
import { useApplications } from '../../hooks/useFirestore';
import { useI18n } from '../../lib/i18n';
import { Card, Badge, LoadingSpinner, EmptyState, Modal, ConfirmDialog, showToast } from '../../shared/ui';
import { Search, Filter, CheckCircle2, XCircle, Eye, ExternalLink, RefreshCw, KeyRound } from 'lucide-react';
import type { ApplicationDocument } from '../../lib/firebaseTypes';

interface ApplicationsPageProps {
  onIssueCodeForApp?: (referenceId: string) => void;
}

export function ApplicationsPage({ onIssueCodeForApp }: ApplicationsPageProps) {
  const { applications, loading, reload, updateApplicationStatus } = useApplications();
  const { t } = useI18n();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedApp, setSelectedApp] = useState<ApplicationDocument | null>(null);

  // Status mutation confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    referenceId: string;
    newStatus: 'approved' | 'rejected';
  }>({ isOpen: false, referenceId: '', newStatus: 'approved' });

  const [actionLoading, setActionLoading] = useState(false);

  // Filtered applications
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        app.referenceId.toLowerCase().includes(q) ||
        app.fullName.toLowerCase().includes(q) ||
        app.phone.includes(q);

      const matchStatus = statusFilter === 'all' || app.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [applications, search, statusFilter]);

  const handleConfirmStatusChange = async () => {
    const { referenceId, newStatus } = confirmDialog;
    setActionLoading(true);
    try {
      await updateApplicationStatus(referenceId, newStatus);
      showToast(
        t(
          `تم تحديث حالة الطلب إلى ${newStatus === 'approved' ? 'مقبول' : 'مرفوض'} بنجاح`,
          `Application status updated to ${newStatus}`
        ),
        'success'
      );
      setConfirmDialog({ isOpen: false, referenceId: '', newStatus: 'approved' });
      if (selectedApp && selectedApp.referenceId === referenceId) {
        setSelectedApp({ ...selectedApp, status: newStatus });
      }
    } catch {
      showToast(t('فشل تحديث حالة الطلب', 'Failed to update application status'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge color="emerald">{t('مقبول', 'Approved')}</Badge>;
      case 'rejected':
        return <Badge color="red">{t('مرفوض', 'Rejected')}</Badge>;
      default:
        return <Badge color="yellow">{t('قيد المراجعة', 'Pending')}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <Card className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('البحث بالاسم، الرقم المرجعي أو الهاتف...', 'Search by name, reference ID or phone...')}
            className="w-full pr-9 pl-4 py-2 rounded-xl bg-brand-navy border border-brand-border text-white text-xs focus:border-brand-cyan focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-brand-navy border border-brand-border text-white text-xs focus:border-brand-cyan focus:outline-none"
          >
            <option value="all">{t('جميع الحالات', 'All Statuses')}</option>
            <option value="pending">{t('قيد المراجعة', 'Pending')}</option>
            <option value="approved">{t('مقبول', 'Approved')}</option>
            <option value="rejected">{t('مرفوض', 'Rejected')}</option>
          </select>

          <button
            onClick={() => reload()}
            className="p-2 rounded-xl bg-brand-navy hover:bg-slate-800 border border-brand-border text-slate-300 hover:text-white transition"
            title={t('تحديث البيانات', 'Refresh data')}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </Card>

      {/* Applications Table */}
      {loading ? (
        <LoadingSpinner text={t('جاري تحميل طلبات التقديم...', 'Loading applications...')} />
      ) : filteredApps.length === 0 ? (
        <EmptyState
          title={t('لا توجد طلبات تقديم مطابقة', 'No matching applications found')}
          description={t('جرّب تغيير كلمات البحث أو معايير الفلترة.', 'Try adjusting your search or filters.')}
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-brand-navy/80 border-b border-brand-border text-slate-400 uppercase text-[11px]">
                <tr>
                  <th className="px-4 py-3 font-semibold text-start">{t('الرقم المرجعي', 'Reference ID')}</th>
                  <th className="px-4 py-3 font-semibold text-start">{t('الاسم بالكامل', 'Full Name')}</th>
                  <th className="px-4 py-3 font-semibold text-start">{t('السنة الدراسية', 'Academic Year')}</th>
                  <th className="px-4 py-3 font-semibold text-start">{t('الحالة', 'Status')}</th>
                  <th className="px-4 py-3 font-semibold text-start">{t('التفعيل', 'Activation')}</th>
                  <th className="px-4 py-3 font-semibold text-center">{t('الإجراءات', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-slate-300">
                {filteredApps.map((app) => (
                  <tr key={app.referenceId} className="hover:bg-brand-navy/40 transition">
                    <td className="px-4 py-3 font-mono font-bold text-white">{app.referenceId}</td>
                    <td className="px-4 py-3 font-medium text-white">{app.fullName}</td>
                    <td className="px-4 py-3">{app.academicYear}</td>
                    <td className="px-4 py-3">{getStatusBadge(app.status)}</td>
                    <td className="px-4 py-3">
                      {app.isActivated ? (
                        <Badge color="emerald">{t('مفعّل', 'Activated')}</Badge>
                      ) : app.status === 'approved' ? (
                        <Badge color="cyan">{t('مؤهل للتفعيل', 'Eligible')}</Badge>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title={t('عرض التفاصيل', 'View Details')}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {app.status === 'pending' && (
                          <>
                            <button
                              onClick={() =>
                                setConfirmDialog({
                                  isOpen: true,
                                  referenceId: app.referenceId,
                                  newStatus: 'approved',
                                })
                              }
                              className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition"
                              title={t('قبول الطلب', 'Approve Application')}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setConfirmDialog({
                                  isOpen: true,
                                  referenceId: app.referenceId,
                                  newStatus: 'rejected',
                                })
                              }
                              className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition"
                              title={t('رفض الطلب', 'Reject Application')}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {app.status === 'approved' && !app.isActivated && onIssueCodeForApp && (
                          <button
                            onClick={() => onIssueCodeForApp(app.referenceId)}
                            className="p-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 transition"
                            title={t('إصدار كود تفعيل', 'Issue Activation Code')}
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Applicant Detail Modal */}
      {selectedApp && (
        <Modal
          isOpen={Boolean(selectedApp)}
          onClose={() => setSelectedApp(null)}
          title={t(`تفاصيل طلب التقديم — ${selectedApp.referenceId}`, `Application Details — ${selectedApp.referenceId}`)}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-brand-navy border border-brand-border">
                <p className="text-slate-400 text-[11px] mb-0.5">{t('الاسم بالكامل', 'Full Name')}</p>
                <p className="font-bold text-white">{selectedApp.fullName}</p>
              </div>
              <div className="p-3 rounded-xl bg-brand-navy border border-brand-border">
                <p className="text-slate-400 text-[11px] mb-0.5">{t('رقم الهاتف', 'Phone')}</p>
                <p className="font-mono text-white" dir="ltr">{selectedApp.phone}</p>
              </div>
              <div className="p-3 rounded-xl bg-brand-navy border border-brand-border">
                <p className="text-slate-400 text-[11px] mb-0.5">{t('السنة الدراسية', 'Academic Year')}</p>
                <p className="text-white">{selectedApp.academicYear}</p>
              </div>
              <div className="p-3 rounded-xl bg-brand-navy border border-brand-border">
                <p className="text-slate-400 text-[11px] mb-0.5">{t('حالة الطلب', 'Status')}</p>
                <div>{getStatusBadge(selectedApp.status)}</div>
              </div>
            </div>

            {/* Skills */}
            <div className="p-3 rounded-xl bg-brand-navy border border-brand-border">
              <p className="text-slate-400 text-xs mb-2">{t('المهارات الإعلامية:', 'Media Skills:')}</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedApp.skills && selectedApp.skills.length > 0 ? (
                  selectedApp.skills.map((s, idx) => (
                    <Badge key={idx} color="blue">{s}</Badge>
                  ))
                ) : (
                  <span className="text-slate-500 text-xs">{t('لم يتم تحديد مهارات', 'No skills specified')}</span>
                )}
              </div>
            </div>

            {/* Equipment */}
            <div className="p-3 rounded-xl bg-brand-navy border border-brand-border">
              <p className="text-slate-400 text-xs mb-2">{t('المعدات المتوفرة:', 'Equipment & Gear:')}</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedApp.equipment && selectedApp.equipment.length > 0 ? (
                  selectedApp.equipment.map((e, idx) => (
                    <Badge key={idx} color="cyan">{e}</Badge>
                  ))
                ) : (
                  <span className="text-slate-500 text-xs">{t('لا تتوفر معدات خاصة', 'No gear reported')}</span>
                )}
              </div>
            </div>

            {/* Portfolio Link */}
            {selectedApp.portfolioUrl && (
              <div className="p-3 rounded-xl bg-brand-navy border border-brand-border flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-[11px]">{t('رابط معرض الأعمال:', 'Portfolio Link:')}</p>
                  <p className="text-xs text-white truncate max-w-sm" dir="ltr">{selectedApp.portfolioUrl}</p>
                </div>
                <a
                  href={selectedApp.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg bg-brand-blue/20 text-brand-cyan hover:bg-brand-blue/30 transition flex items-center gap-1 text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{t('فتح الرابط', 'Open')}</span>
                </a>
              </div>
            )}

            {/* Quick Actions inside modal */}
            <div className="pt-2 flex items-center gap-2 justify-end border-t border-brand-border">
              {selectedApp.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        referenceId: selectedApp.referenceId,
                        newStatus: 'approved',
                      });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t('قبول الطلب', 'Approve')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        referenceId: selectedApp.referenceId,
                        newStatus: 'rejected',
                      });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{t('رفض الطلب', 'Reject')}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, referenceId: '', newStatus: 'approved' })}
        onConfirm={handleConfirmStatusChange}
        title={
          confirmDialog.newStatus === 'approved'
            ? t('تأكيد قبول طلب التقديم', 'Confirm Application Approval')
            : t('تأكيد رفض طلب التقديم', 'Confirm Application Rejection')
        }
        message={
          confirmDialog.newStatus === 'approved'
            ? t(
                `هل أنت متأكد من قبول الطلب ${confirmDialog.referenceId}؟ سيصبح المتقدم مؤهلاً لتلقي كود التفعيل.`,
                `Are you sure you want to approve ${confirmDialog.referenceId}? The applicant will become eligible for account activation.`
              )
            : t(
                `هل أنت متأكد من رفض الطلب ${confirmDialog.referenceId}؟ لن يتمكن المتقدم من تفعيل الحساب.`,
                `Are you sure you want to reject ${confirmDialog.referenceId}? The applicant will not be eligible for activation.`
              )
        }
        confirmLabel={
          confirmDialog.newStatus === 'approved' ? t('نعم، قبول الطلب', 'Yes, Approve') : t('نعم، رفض الطلب', 'Yes, Reject')
        }
        variant={confirmDialog.newStatus === 'approved' ? 'primary' : 'danger'}
        loading={actionLoading}
      />
    </div>
  );
}
