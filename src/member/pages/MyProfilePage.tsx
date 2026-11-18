/**
 * Member Profile Page — OC Media Platform
 * Phase 3: View profile and edit ONLY permitted fields (currentSkills, currentEquipment, phone, bio).
 * Enforced by Firestore Security Rules:
 * request.resource.data.diff(resource.data).affectedKeys().hasOnly(['currentSkills', 'currentEquipment', 'phone', 'bio', 'updatedAt'])
 */

import { useState } from 'react';
import { useAuth } from '../../lib/auth';
import { useMemberProfile } from '../../hooks/useFirestore';
import { useI18n } from '../../lib/i18n';
import { Card, showToast } from '../../shared/ui';
import { MEDIA_SKILLS, EQUIPMENT_OPTIONS } from '../../constants/options';
import { User, Phone, BookOpen, Sparkles, Camera, Save, Lock, ShieldCheck } from 'lucide-react';

export function MyProfilePage() {
  const { user } = useAuth();
  const profile = user?.memberProfile;
  const { updatePermittedProfile, updating } = useMemberProfile(user?.uid);
  const { t, isAr } = useI18n();

  // Mutable state (only permitted fields)
  const [phone, setPhone] = useState(profile?.phone || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [currentSkills, setCurrentSkills] = useState<string[]>(profile?.currentSkills || []);
  const [currentEquipment, setCurrentEquipment] = useState<string[]>(profile?.currentEquipment || []);

  const handleToggleSkill = (skill: string) => {
    setCurrentSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleToggleEquipment = (eq: string) => {
    setCurrentEquipment((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || phone.trim().length < 10) {
      showToast(t('يرجى إدخال رقم هاتف صحيح (10 إلى 20 رقماً).', 'Enter valid phone (10-20 digits).'), 'error');
      return;
    }

    try {
      await updatePermittedProfile({
        phone: phone.trim(),
        bio: bio.trim(),
        currentSkills,
        currentEquipment,
      });

      // Update in-memory profile
      if (user && user.memberProfile) {
        user.memberProfile.phone = phone.trim();
        user.memberProfile.bio = bio.trim();
        user.memberProfile.currentSkills = currentSkills;
        user.memberProfile.currentEquipment = currentEquipment;
      }

      showToast(t('تم حفظ تعديلات الملف الشخصي بنجاح!', 'Profile updated successfully!'), 'success');
    } catch {
      showToast(t('فشل تحديث الملف الشخصي. يرجى التحقق من الصلاحيات.', 'Failed to update profile.'), 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Immutability Notice */}
      <Card className="p-4 border-blue-500/30 bg-brand-navy/60">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-brand-cyan shrink-0" />
          <p className="text-xs text-slate-300 leading-relaxed">
            {t(
              'حقول الهوية الأساسية (الاسم، الرقم المرجعي، السنة الدراسية، الدور، حالة الحساب) محمية ومقفلة أمنياً ولا يمكن تعديلها إلا عبر الإدارة.',
              'Identity fields (Name, Reference ID, Academic Year, Role, Status) are locked and cannot be modified.'
            )}
          </p>
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Read-Only Locked Fields */}
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" />
            <span>{t('بيانات الهوية الرسمية (مقفلة)', 'Official Identity (Locked)')}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">{t('الاسم بالكامل:', 'Full Name:')}</label>
              <input
                type="text"
                value={profile?.fullName || ''}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-brand-border text-slate-400 text-xs font-semibold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">{t('الرقم المرجعي (Reference ID):', 'Reference ID:')}</label>
              <input
                type="text"
                value={profile?.referenceId || ''}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-brand-border text-brand-cyan font-mono text-xs font-bold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">{t('السنة الدراسية:', 'Academic Year:')}</label>
              <input
                type="text"
                value={profile?.academicYear || ''}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-brand-border text-slate-400 text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">{t('البريد الداخلي للنظام:', 'System Email:')}</label>
              <input
                type="text"
                value={profile?.email || ''}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-brand-border text-slate-400 font-mono text-xs cursor-not-allowed"
                dir="ltr"
              />
            </div>
          </div>
        </Card>

        {/* Mutable Permitted Fields */}
        <Card className="p-6 space-y-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-brand-blue" />
            <span>{t('البيانات القابلة للتحديث', 'Editable Profile Information')}</span>
          </h3>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-brand-cyan" />
              <span>{t('رقم الهاتف للتواصل (WhatsApp / Calls):', 'Contact Phone Number:')}</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010XXXXXXXX"
              required
              className="w-full sm:w-1/2 px-3.5 py-2.5 rounded-xl bg-brand-navy border border-brand-border text-white text-xs font-mono focus:border-brand-cyan focus:outline-none"
              dir="ltr"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-brand-cyan" />
              <span>{t('النبذة الشخصية (Bio):', 'About You / Bio:')}</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder={t('اكتب نبذة مختصرة عن اهتماماتك الإعلامية ومجالات تميزك...', 'Brief bio about your media interests...')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy border border-brand-border text-white text-xs focus:border-brand-cyan focus:outline-none resize-none"
            />
          </div>

          {/* Skills Checklist */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
              <span>{t('مهاراتك الإعلامية النشطة:', 'Your Active Media Skills:')}</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {MEDIA_SKILLS.map((skill) => {
                const selected = currentSkills.includes(skill.id);
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => handleToggleSkill(skill.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                      selected
                        ? 'bg-brand-blue text-white border-blue-400 font-bold shadow-sm'
                        : 'bg-brand-navy text-slate-400 border-brand-border hover:text-white hover:border-slate-600'
                    }`}
                  >
                    {isAr ? skill.labelAr : skill.labelEn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Equipment Checklist */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-brand-cyan" />
              <span>{t('المعدات والأجهزة المتوفرة لديك:', 'Your Available Equipment:')}</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map((eq) => {
                const selected = currentEquipment.includes(eq.id);
                return (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => handleToggleEquipment(eq.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                      selected
                        ? 'bg-cyan-600 text-white border-cyan-400 font-bold shadow-sm'
                        : 'bg-brand-navy text-slate-400 border-brand-border hover:text-white hover:border-slate-600'
                    }`}
                  >
                    {isAr ? eq.labelAr : eq.labelEn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-brand-border flex justify-end">
            <button
              type="submit"
              disabled={updating}
              className="px-6 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blueHover text-white text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{updating ? t('جاري الحفظ...', 'Saving...') : t('حفظ التعديلات', 'Save Changes')}</span>
            </button>
          </div>
        </Card>
      </form>
    </div>
  );
}
