/**
 * Member Overview Page — OC Media Platform
 * Phase 3: Member welcome, status card, cohort info, and portfolio summary.
 */

import { useAuth } from '../../lib/auth';
import { usePortfolios } from '../../hooks/useFirestore';
import { useI18n } from '../../lib/i18n';
import { Card, StatCard, Badge, LoadingSpinner } from '../../shared/ui';
import { UserCheck, Sparkles, FolderGit2, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';

interface MemberOverviewProps {
  onNavigateTab: (tab: 'profile' | 'portfolio' | 'evaluations') => void;
}

export function MemberOverview({ onNavigateTab }: MemberOverviewProps) {
  const { user } = useAuth();
  const profile = user?.memberProfile;
  const { portfolios, loading } = usePortfolios(user?.uid);
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="p-6 relative overflow-hidden bg-gradient-to-r from-brand-card to-brand-navy border-brand-border">
        <div className="absolute top-0 right-0 w-64 h-32 bg-brand-blue/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-blue/20 border border-brand-blue/30 text-brand-cyan flex items-center justify-center shrink-0">
              <UserCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  {t(`مرحباً بك، ${profile?.fullName || 'عضو اللجنة'}!`, `Welcome, ${profile?.fullName || 'Member'}!`)}
                </h2>
                <Badge color="emerald">{t('عضو معتمد', 'Verified Member')}</Badge>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {t(
                  `الرقم المرجعي: ${profile?.referenceId || '—'} • ${profile?.academicYear || 'كلية الحاسبات والذكاء الاصطناعي'}`,
                  `Ref ID: ${profile?.referenceId || '—'} • ${profile?.academicYear || 'FCAI'}`
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('profile')}
              className="px-3.5 py-2 rounded-xl bg-brand-blue hover:bg-brand-blueHover text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <span>{t('تعديل الملف الشخصي', 'Edit Profile')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </Card>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label={t('أعمال المعرض المسجلة', 'Portfolio Items')}
          value={loading ? '...' : portfolios.length}
          icon={FolderGit2}
          color="cyan"
        />
        <StatCard
          label={t('المهارات المعتمدة', 'Active Skills')}
          value={profile?.currentSkills?.length || 0}
          icon={Sparkles}
          color="blue"
        />
        <StatCard
          label={t('حالة العضوية', 'Membership Status')}
          value={profile?.accountStatus === 'active' ? t('نشط', 'Active') : t('موقوف', 'Suspended')}
          icon={ShieldCheck}
          color={profile?.accountStatus === 'active' ? 'emerald' : 'red'}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bio & Skills Snapshot */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-blue" />
              <span>{t('المهارات والمعدات الحالية', 'Skills & Gear Snapshot')}</span>
            </h3>
            <button
              onClick={() => onNavigateTab('profile')}
              className="text-xs text-brand-cyan hover:underline"
            >
              {t('تحديث', 'Update')}
            </button>
          </div>

          <div>
            <p className="text-xs text-slate-400 mb-2">{t('المهارات:', 'Skills:')}</p>
            <div className="flex flex-wrap gap-1.5">
              {profile?.currentSkills && profile.currentSkills.length > 0 ? (
                profile.currentSkills.map((s, idx) => (
                  <Badge key={idx} color="blue">{s}</Badge>
                ))
              ) : (
                <span className="text-slate-500 text-xs">{t('لم يتم إضافة مهارات بعد', 'No skills added yet')}</span>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-400 mb-2">{t('المعدات الشخصية:', 'Personal Gear:')}</p>
            <div className="flex flex-wrap gap-1.5">
              {profile?.currentEquipment && profile.currentEquipment.length > 0 ? (
                profile.currentEquipment.map((e, idx) => (
                  <Badge key={idx} color="cyan">{e}</Badge>
                ))
              ) : (
                <span className="text-slate-500 text-xs">{t('لا توجد معدات مسجلة', 'No equipment listed')}</span>
              )}
            </div>
          </div>

          {profile?.bio && (
            <div className="pt-2 border-t border-brand-border">
              <p className="text-xs text-slate-400 mb-1">{t('نبذة عنك:', 'Bio:')}</p>
              <p className="text-xs text-slate-300 leading-relaxed">{profile.bio}</p>
            </div>
          )}
        </Card>

        {/* Recent Portfolios */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-brand-cyan" />
              <span>{t('معرض الأعمال الأخير', 'Recent Portfolio Items')}</span>
            </h3>
            <button
              onClick={() => onNavigateTab('portfolio')}
              className="text-xs text-brand-cyan hover:underline"
            >
              {t('إدارة المعرض', 'Manage All')}
            </button>
          </div>

          {loading ? (
            <LoadingSpinner text={t('جاري جلب الأعمال...', 'Loading items...')} />
          ) : portfolios.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-slate-400 mb-3">
                {t('لم تقم بإضافة أي أعمال أو روابط لمعرضك بعد.', 'You have not added any portfolio items yet.')}
              </p>
              <button
                onClick={() => onNavigateTab('portfolio')}
                className="px-3 py-1.5 rounded-xl bg-brand-blue hover:bg-brand-blueHover text-white text-xs font-bold transition"
              >
                {t('إضافة أول عمل الآن', 'Add First Item')}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {portfolios.slice(0, 3).map((item) => (
                <div
                  key={item.itemId}
                  className="p-3 rounded-xl bg-brand-navy border border-brand-border flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-white truncate">{item.title}</p>
                    <p className="text-[11px] text-slate-400 font-mono truncate" dir="ltr">{item.url}</p>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-cyan transition shrink-0"
                    title={t('فتح الرابط', 'Open link')}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
