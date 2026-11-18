/**
 * Admin Overview Page — OC Media Platform
 * Phase 3: Real statistics from Firestore applications and members collections.
 */

import { useApplications, useMembers } from '../../hooks/useFirestore';
import { useI18n } from '../../lib/i18n';
import { Card, StatCard, LoadingSpinner, Badge } from '../../shared/ui';
import {
  Users,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface AdminOverviewProps {
  onNavigateTab: (tab: 'applications' | 'members' | 'codes' | 'reconciliation') => void;
}

export function AdminOverview({ onNavigateTab }: AdminOverviewProps) {
  const { applications, loading: appLoading } = useApplications();
  const { members, loading: memLoading } = useMembers();
  const { t } = useI18n();

  const loading = appLoading || memLoading;

  if (loading) {
    return <LoadingSpinner text={t('جاري جلب إحصائيات النظام من Firestore...', 'Loading platform metrics from Firestore...')} />;
  }

  // Calculate stats
  const totalApps = applications.length;
  const pendingApps = applications.filter((a) => a.status === 'pending').length;
  const approvedApps = applications.filter((a) => a.status === 'approved').length;
  const rejectedApps = applications.filter((a) => a.status === 'rejected').length;

  const activeMembers = members.filter((m) => m.accountStatus === 'active').length;
  const suspendedMembers = members.filter((m) => m.accountStatus === 'suspended').length;

  const recoveryRequiredApps = applications.filter(
    (a) => a.activationStatus === 'recovery_required' || a.recoveryRequired
  );

  return (
    <div className="space-y-6">
      {/* Warning if orphaned / recovery accounts exist */}
      {recoveryRequiredApps.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
            <div>
              <p className="text-xs font-bold text-white">
                {t(
                  `تنبيه: يوجد ${recoveryRequiredApps.length} حساب في حالة تتطلب التسوية الإدارية (Recovery Required).`,
                  `Notice: ${recoveryRequiredApps.length} account(s) require administrative reconciliation.`
                )}
              </p>
              <p className="text-[11px] text-amber-400/80 mt-0.5">
                {t(
                  'حدث خطأ غير متزامن أثناء التفعيل مما ترك حساب Auth بدون ملف عضو. يرجى مراجعة قسم التسوية.',
                  'An asynchronous rollback double-fault occurred. Visit Orphan Reconciliation to resolve.'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('reconciliation')}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shrink-0 transition"
          >
            {t('حل المشكلات الآن', 'Reconcile Now')}
          </button>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('إجمالي طلبات التقديم', 'Total Applications')}
          value={totalApps}
          icon={Users}
          color="blue"
        />
        <StatCard
          label={t('طلبات قيد المراجعة', 'Pending Review')}
          value={pendingApps}
          icon={Clock}
          color="cyan"
        />
        <StatCard
          label={t('الأعضاء النشطون', 'Active Members')}
          value={activeMembers}
          icon={UserCheck}
          color="emerald"
        />
        <StatCard
          label={t('الحسابات الموقوفة', 'Suspended Accounts')}
          value={suspendedMembers}
          icon={ShieldAlert}
          color={suspendedMembers > 0 ? 'red' : 'slate'}
        />
      </div>

      {/* Applications Breakdown & Members Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications Card */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-blue" />
              <span>{t('حالة طلبات التوظيف (Firestore)', 'Application Status (Firestore)')}</span>
            </h3>
            <button
              onClick={() => onNavigateTab('applications')}
              className="text-xs text-brand-cyan hover:underline flex items-center gap-1"
            >
              <span>{t('عرض الكل', 'View All')}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-brand-navy/60 border border-brand-border">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-slate-300">{t('قيد المراجعة (Pending)', 'Pending Review')}</span>
              </div>
              <Badge color="yellow">{pendingApps}</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-brand-navy/60 border border-brand-border">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-300">{t('مقبول ومؤهل للتفعيل (Approved)', 'Approved for Activation')}</span>
              </div>
              <Badge color="emerald">{approvedApps}</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-brand-navy/60 border border-brand-border">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-xs text-slate-300">{t('مرفوض (Rejected)', 'Rejected')}</span>
              </div>
              <Badge color="red">{rejectedApps}</Badge>
            </div>
          </div>
        </Card>

        {/* Quick Actions Card */}
        <Card className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-cyan" />
            <span>{t('الإجراءات السريعة للمسؤول', 'Quick Administrative Actions')}</span>
          </h3>

          <div className="space-y-2.5">
            <button
              onClick={() => onNavigateTab('codes')}
              className="w-full p-3 rounded-xl bg-brand-navy hover:bg-brand-card border border-brand-border text-start flex items-center justify-between transition"
            >
              <div>
                <p className="text-xs font-bold text-white">{t('إصدار كود تفعيل جديد', 'Issue Activation Code')}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {t('توليد كود تفعيل مشفر مدته 7 أيام لمتقدم مقبول', 'Generate a secure 7-day activation code for approved applicants')}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => onNavigateTab('applications')}
              className="w-full p-3 rounded-xl bg-brand-navy hover:bg-brand-card border border-brand-border text-start flex items-center justify-between transition"
            >
              <div>
                <p className="text-xs font-bold text-white">{t('مراجعة طلبات التقديم', 'Review Applications')}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {t('اعتماد أو رفض طلبات التوظيف المسجلة في Firestore', 'Approve or reject recruitments stored in Firestore')}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => onNavigateTab('members')}
              className="w-full p-3 rounded-xl bg-brand-navy hover:bg-brand-card border border-brand-border text-start flex items-center justify-between transition"
            >
              <div>
                <p className="text-xs font-bold text-white">{t('إدارة أعضاء الفريق', 'Manage Media Members')}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {t('عرض الأعضاء النشطين أو إيقاف الحسابات عبر واجهة Cloudflare', 'View active members or suspend via backend API')}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
