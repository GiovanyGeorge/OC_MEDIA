/**
 * Members Management Page — OC Media Platform
 * Phase 3: List active and suspended members, view profiles, and suspend via Cloudflare Pages backend.
 */

import { useState, useMemo } from 'react';
import { useMembers } from '../../hooks/useFirestore';
import { suspendMember } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import { Card, Badge, LoadingSpinner, EmptyState, Modal, ConfirmDialog, showToast } from '../../shared/ui';
import { Search, UserX, Eye, RefreshCw, ShieldAlert } from 'lucide-react';
import type { MemberDocument } from '../../lib/firebaseTypes';

export function MembersPage() {
  const { members, loading, reload } = useMembers();
  const { t } = useI18n();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [selectedMember, setSelectedMember] = useState<MemberDocument | null>(null);

  // Suspend action state
  const [suspendDialog, setSuspendDialog] = useState<{
    isOpen: boolean;
    member: MemberDocument | null;
  }>({ isOpen: false, member: null });

  const [actionLoading, setActionLoading] = useState(false);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        m.fullName.toLowerCase().includes(q) ||
        m.referenceId.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        m.email.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'all' || m.accountStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [members, search, statusFilter]);

  const handleConfirmSuspend = async () => {
    if (!suspendDialog.member) return;
    setActionLoading(true);
    try {
      const res = await suspendMember({
        uid: suspendDialog.member.uid,
        referenceId: suspendDialog.member.referenceId,
      });

      if (res.ok && res.data.success) {
        showToast(
          t(
            `تم إيقاف حساب العضو (${suspendDialog.member.fullName}) بنجاح وتعطيل وصوله.`,
            `Member ${suspendDialog.member.fullName} suspended successfully.`
          ),
          'success'
        );
        setSuspendDialog({ isOpen: false, member: null });
        await reload();
      } else {
        showToast(res.data.error || t('فشل إيقاف الحساب', 'Failed to suspend member'), 'error');
      }
    } catch {
      showToast(t('حدث خطأ أثناء الاتصال بالخادم', 'Server connection error'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('البحث باسم العضو، الرقم المرجعي أو الهاتف...', 'Search member by name, reference ID or phone...')}
            className="w-full pr-9 pl-4 py-2 rounded-xl bg-brand-navy border border-brand-border text-white text-xs focus:border-brand-cyan focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-brand-navy border border-brand-border text-white text-xs focus:border-brand-cyan focus:outline-none"
          >
            <option value="all">{t('جميع الأعضاء', 'All Members')}</option>
            <option value="active">{t('النشطون فقط', 'Active Only')}</option>
            <option value="suspended">{t('الموقوفون فقط', 'Suspended Only')}</option>
          </select>

          <button
            onClick={() => reload()}
            className="p-2 rounded-xl bg-brand-navy hover:bg-slate-800 border border-brand-border text-slate-300 hover:text-white transition"
            title={t('تحديث البيانات', 'Refresh members')}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </Card>

      {/* Members Table */}
      {loading ? (
        <LoadingSpinner text={t('جاري جلب قائمة أعضاء اللجنة...', 'Loading members list...')} />
      ) : filteredMembers.length === 0 ? (
        <EmptyState
          title={t('لا يوجد أعضاء مطابقون', 'No members found')}
          description={t('لم يتم العثور على أعضاء يطابقون معايير البحث.', 'No members match the current filter.')}
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
                  <th className="px-4 py-3 font-semibold text-start">{t('رقم الهاتف', 'Phone')}</th>
                  <th className="px-4 py-3 font-semibold text-start">{t('حالة الحساب', 'Account Status')}</th>
                  <th className="px-4 py-3 font-semibold text-center">{t('الإجراءات', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-slate-300">
                {filteredMembers.map((member) => (
                  <tr key={member.uid} className="hover:bg-brand-navy/40 transition">
                    <td className="px-4 py-3 font-mono font-bold text-white">{member.referenceId}</td>
                    <td className="px-4 py-3 font-medium text-white">{member.fullName}</td>
                    <td className="px-4 py-3">{member.academicYear}</td>
                    <td className="px-4 py-3 font-mono" dir="ltr">{member.phone}</td>
                    <td className="px-4 py-3">
                      {member.accountStatus === 'active' ? (
                        <Badge color="emerald">{t('نشط', 'Active')}</Badge>
                      ) : (
                        <Badge color="red">{t('موقوف إدارياً', 'Suspended')}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedMember(member)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title={t('عرض الملف الشخصي', 'View Profile')}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {member.accountStatus === 'active' && (
                          <button
                            onClick={() => setSuspendDialog({ isOpen: true, member })}
                            className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition"
                            title={t('إيقاف حساب العضو', 'Suspend Member')}
                          >
                            <UserX className="w-3.5 h-3.5" />
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

      {/* Member Profile Modal */}
      {selectedMember && (
        <Modal
          isOpen={Boolean(selectedMember)}
          onClose={() => setSelectedMember(null)}
          title={t(`ملف العضو — ${selectedMember.fullName}`, `Member Profile — ${selectedMember.fullName}`)}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-brand-navy border border-brand-border">
                <p className="text-slate-400 text-[11px] mb-0.5">{t('الرقم المرجعي', 'Reference ID')}</p>
                <p className="font-mono font-bold text-white">{selectedMember.referenceId}</p>
              </div>
              <div className="p-3 rounded-xl bg-brand-navy border border-brand-border">
                <p className="text-slate-400 text-[11px] mb-0.5">{t('حالة الحساب', 'Account Status')}</p>
                <div>
                  {selectedMember.accountStatus === 'active' ? (
                    <Badge color="emerald">{t('نشط ومصرح له', 'Active')}</Badge>
                  ) : (
                    <Badge color="red">{t('موقوف إدارياً', 'Suspended')}</Badge>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-brand-navy border border-brand-border">
                <p className="text-slate-400 text-[11px] mb-0.5">{t('البريد الإلكتروني الداخلي', 'Internal Email')}</p>
                <p className="font-mono text-white text-[11px] truncate" dir="ltr">{selectedMember.email}</p>
              </div>
              <div className="p-3 rounded-xl bg-brand-navy border border-brand-border">
                <p className="text-slate-400 text-[11px] mb-0.5">{t('رقم الهاتف', 'Phone')}</p>
                <p className="font-mono text-white" dir="ltr">{selectedMember.phone}</p>
              </div>
            </div>

            {/* Bio */}
            {selectedMember.bio && (
              <div className="p-3 rounded-xl bg-brand-navy border border-brand-border">
                <p className="text-slate-400 text-xs mb-1">{t('النبذة الشخصية (Bio):', 'Bio:')}</p>
                <p className="text-xs text-white leading-relaxed">{selectedMember.bio}</p>
              </div>
            )}

            {/* Current Skills */}
            <div className="p-3 rounded-xl bg-brand-navy border border-brand-border">
              <p className="text-slate-400 text-xs mb-2">{t('المهارات الحالية للعضو:', 'Current Skills:')}</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedMember.currentSkills && selectedMember.currentSkills.length > 0 ? (
                  selectedMember.currentSkills.map((s, idx) => (
                    <Badge key={idx} color="blue">{s}</Badge>
                  ))
                ) : (
                  <span className="text-slate-500 text-xs">{t('لم يتم تسجيل مهارات', 'No skills registered')}</span>
                )}
              </div>
            </div>

            {/* Current Equipment */}
            <div className="p-3 rounded-xl bg-brand-navy border border-brand-border">
              <p className="text-slate-400 text-xs mb-2">{t('المعدات الحالية:', 'Current Equipment:')}</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedMember.currentEquipment && selectedMember.currentEquipment.length > 0 ? (
                  selectedMember.currentEquipment.map((e, idx) => (
                    <Badge key={idx} color="cyan">{e}</Badge>
                  ))
                ) : (
                  <span className="text-slate-500 text-xs">{t('لا تتوفر معدات شخصية', 'No equipment registered')}</span>
                )}
              </div>
            </div>

            {/* Suspension note if already suspended */}
            {selectedMember.accountStatus === 'suspended' && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                <span>{t('هذا الحساب تم إيقافه وتعطيل دخوله إلى منصة الأعضاء.', 'This account is currently suspended and blocked from login.')}</span>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Suspension Confirmation Dialog */}
      <ConfirmDialog
        isOpen={suspendDialog.isOpen}
        onClose={() => setSuspendDialog({ isOpen: false, member: null })}
        onConfirm={handleConfirmSuspend}
        title={t('تأكيد إيقاف حساب العضو', 'Confirm Member Suspension')}
        message={t(
          `هل أنت متأكد من إيقاف حساب العضو (${suspendDialog.member?.fullName})؟ سيؤدي هذا الإجراء إلى تعطيل تسجيل الدخول في Firebase Auth وتحديث حالة العضو في Firestore إلى (suspended).`,
          `Are you sure you want to suspend (${suspendDialog.member?.fullName})? This will disable Firebase Auth login and mark their Firestore profile as suspended.`
        )}
        confirmLabel={t('نعم، إيقاف الحساب', 'Yes, Suspend Account')}
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
