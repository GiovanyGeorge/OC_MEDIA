/**
 * Member Evaluations & Feedback Page — OC Media Platform
 * Phase 3: Read-only evaluation and performance view for member.
 */

import { useAuth } from '../../lib/auth';
import { useEvaluations } from '../../hooks/useFirestore';
import { useI18n } from '../../lib/i18n';
import { Card, Badge, LoadingSpinner } from '../../shared/ui';
import { Award, Star, CheckCircle, TrendingUp, Sparkles } from 'lucide-react';

export function EvaluationsPage() {
  const { user } = useAuth();
  const { evaluation, loading } = useEvaluations(user?.uid);
  const { t } = useI18n();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-brand-blue" />
          <span>{t('تقييمات وملاحظات إدارة اللجنة', 'Evaluations & Committee Feedback')}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {t('ملاحظات الأداء والتقييمات الإدارية المعتمدة لعضويتك.', 'Approved performance evaluations and committee feedback.')}
        </p>
      </div>

      {loading ? (
        <LoadingSpinner text={t('جاري جلب سجل التقييمات...', 'Loading evaluations...')} />
      ) : !evaluation ? (
        <Card className="text-center py-12 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-navy border border-brand-border flex items-center justify-center mx-auto text-slate-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">
            {t('لا توجد تقييمات منشورة حتى الآن', 'No Evaluations Published Yet')}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            {t(
              'تقوم إدارة لجنة الإعلام بإجراء تقييمات دورية للمشاريع والتغطيات الإعلامية. ستظهر تقييماتك وملاحظات التميز هنا فور اعتمادها.',
              'The media leadership reviews coverage and projects periodically. Your evaluations will appear here once finalized.'
            )}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Overall Rating Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">{t('التقييم العام للأداء:', 'Overall Performance Rating:')}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= evaluation.overallRating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-600'
                      }`}
                    />
                  ))}
                  <span className="text-lg font-bold text-white mx-2">{evaluation.overallRating} / 5</span>
                </div>
              </div>
              <Badge color="emerald">{t('معتمد رسمياً', 'Officially Approved')}</Badge>
            </div>
          </Card>

          {/* Strengths */}
          {evaluation.strengths && (
            <Card className="p-5 space-y-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>{t('نقاط القوة والتميز:', 'Key Strengths:')}</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-brand-navy/60 p-3 rounded-xl border border-brand-border">
                {evaluation.strengths}
              </p>
            </Card>
          )}

          {/* Areas for Improvement */}
          {evaluation.areasForImprovement && (
            <Card className="p-5 space-y-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-cyan" />
                <span>{t('مجالات التطوير والتوصيات:', 'Growth Opportunities & Recommendations:')}</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-brand-navy/60 p-3 rounded-xl border border-brand-border">
                {evaluation.areasForImprovement}
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
