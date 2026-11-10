import React, { useState, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Phone, 
  GraduationCap, 
  Upload, 
  X, 
  FileCheck, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight,
  Check, 
  Link as LinkIcon, 
  Camera, 
  ShieldCheck, 
  Sparkles,
  Send
} from 'lucide-react';
import { FormDataState, FormErrors, SubmissionResult } from '../types/recruitment';
import { ACADEMIC_YEARS, MEDIA_SKILLS, EQUIPMENT_OPTIONS } from '../constants/options';
import { submitRecruitmentForm, fileToBase64, isBackendConfigured } from '../services/api';

interface RecruitmentFormProps {
  onSuccess: (result: SubmissionResult, submittedData: FormDataState) => void;
  onOpenSetupModal?: () => void;
}

const STEPS = [
  { id: 1, label: 'البيانات الشخصية' },
  { id: 2, label: 'المهارات' },
  { id: 3, label: 'المعدات' },
  { id: 4, label: 'البورتفوليو والإرسال' },
];

export const RecruitmentForm: React.FC<RecruitmentFormProps> = ({ onSuccess, onOpenSetupModal }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState<FormDataState>({
    fullName: '',
    phoneNumber: '',
    academicYear: '',
    mediaSkills: [],
    otherSkill: '',
    equipment: [],
    otherEquipment: '',
    portfolioFile: null,
    externalPortfolioUrl: '',
    agreedToTerms: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgressText, setSubmissionProgressText] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Field change handlers
  const handleInputChange = (field: keyof FormDataState, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Toggle skills checkbox
  const toggleSkill = (skillId: string) => {
    setFormData((prev) => {
      const exists = prev.mediaSkills.includes(skillId);
      const updated = exists 
        ? prev.mediaSkills.filter((s) => s !== skillId)
        : [...prev.mediaSkills, skillId];
      return { ...prev, mediaSkills: updated };
    });
    if (errors.mediaSkills) {
      setErrors((prev) => ({ ...prev, mediaSkills: undefined }));
    }
  };

  // Toggle equipment checkbox
  const toggleEquipment = (equipId: string) => {
    setFormData((prev) => {
      const exists = prev.equipment.includes(equipId);
      const updated = exists 
        ? prev.equipment.filter((e) => e !== equipId)
        : [...prev.equipment, equipId];
      return { ...prev, equipment: updated };
    });
  };

  // File handling
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        portfolioFile: 'الصيغة غير مدعومة. المقبول: PDF, JPG, PNG.',
      }));
      return;
    }

    if (file.size > maxSizeBytes) {
      setErrors((prev) => ({
        ...prev,
        portfolioFile: 'حجم الملف يتجاوز الحد الأقصى (10 ميجابايت).',
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, portfolioFile: file }));
    setErrors((prev) => ({ ...prev, portfolioFile: undefined }));
  };

  const removeFile = () => {
    setFormData((prev) => ({ ...prev, portfolioFile: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Step validation
  const validateStep = (stepNumber: number): boolean => {
    const newErrors: FormErrors = {};

    if (stepNumber === 1) {
      const nameParts = formData.fullName.trim().split(/\s+/).filter(Boolean);
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'يرجى كتابة الاسم بالكامل.';
      } else if (nameParts.length < 3) {
        newErrors.fullName = 'يرجى كتابة الاسم ثلاثياً على الأقل.';
      }

      const cleanedPhone = formData.phoneNumber.replace(/[\s\-\+]/g, '');
      const standardPhone = cleanedPhone.startsWith('20') ? '0' + cleanedPhone.slice(2) : cleanedPhone;
      const phoneRegex = /^01[0125][0-9]{8}$/;

      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = 'يرجى إدخال رقم الهاتف المحمول.';
      } else if (!phoneRegex.test(standardPhone)) {
        newErrors.phoneNumber = 'رقم الهاتف غير صحيح (11 رقم يبدأ بـ 010 أو 011 أو 012 أو 015).';
      }

      if (!formData.academicYear) {
        newErrors.academicYear = 'يرجى اختيار الفرقة الدراسية.';
      }
    }

    if (stepNumber === 2) {
      if (formData.mediaSkills.length === 0) {
        newErrors.mediaSkills = 'يرجى اختيار مهارة واحدة على الأقل للمتابعة.';
      } else if (formData.mediaSkills.includes('Other') && !formData.otherSkill.trim()) {
        newErrors.otherSkill = 'يرجى كتابة المهارة الأخرى في الحقل المخصص.';
      }
    }

    if (stepNumber === 3) {
      if (formData.equipment.includes('Other') && !formData.otherEquipment.trim()) {
        newErrors.otherEquipment = 'يرجى كتابة المعدات الأخرى.';
      }
    }

    if (stepNumber === 4) {
      if (formData.externalPortfolioUrl.trim()) {
        try {
          const url = new URL(formData.externalPortfolioUrl.trim());
          if (!['http:', 'https:'].includes(url.protocol)) {
            newErrors.externalPortfolioUrl = 'الرابط يجب أن يبدأ بـ https://';
          }
        } catch {
          newErrors.externalPortfolioUrl = 'صيغة الرابط غير صحيحة.';
        }
      }

      if (!formData.agreedToTerms) {
        newErrors.agreedToTerms = 'يرجى تأكيد صحة البيانات للمتابعة.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(4)) {
      return;
    }

    if (!isBackendConfigured()) {
      setErrors((prev) => ({
        ...prev,
        general: 'تنبيه: لم يتم ضبط رابط Google Apps Script في ملف .env.',
      }));
      if (onOpenSetupModal) onOpenSetupModal();
      return;
    }

    setIsSubmitting(true);
    setSubmissionProgressText('جاري تجهيز الطلب...');

    try {
      let filePayload = undefined;
      if (formData.portfolioFile) {
        setSubmissionProgressText('جاري معالجة ملف البورتفوليو...');
        const base64 = await fileToBase64(formData.portfolioFile);
        filePayload = {
          name: formData.portfolioFile.name,
          type: formData.portfolioFile.type,
          size: formData.portfolioFile.size,
          base64: base64,
        };
      }

      setSubmissionProgressText('جاري الحفظ في Google Sheets...');

      let cleanPhone = formData.phoneNumber.replace(/[\s\-\+]/g, '');
      if (cleanPhone.startsWith('20')) {
        cleanPhone = '0' + cleanPhone.slice(2);
      }

      const resolvedSkills = formData.mediaSkills.map((skillId) => {
        const found = MEDIA_SKILLS.find((m) => m.id === skillId);
        return found ? found.labelAr : skillId;
      });

      const resolvedEquipment = formData.equipment.map((eqId) => {
        const found = EQUIPMENT_OPTIONS.find((e) => e.id === eqId);
        return found ? found.labelAr : eqId;
      });

      const result = await submitRecruitmentForm({
        fullName: formData.fullName.trim(),
        phoneNumber: cleanPhone,
        academicYear: formData.academicYear || 'First',
        mediaSkills: resolvedSkills,
        otherSkill: formData.otherSkill.trim() || undefined,
        equipment: resolvedEquipment,
        otherEquipment: formData.otherEquipment.trim() || undefined,
        externalPortfolioUrl: formData.externalPortfolioUrl.trim() || undefined,
        file: filePayload,
      });

      onSuccess(result, formData);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'حدث خطأ أثناء الإرسال.';
      setErrors((prev) => ({
        ...prev,
        general: errMsg,
      }));
    } finally {
      setIsSubmitting(false);
      setSubmissionProgressText('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Intro Heading */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-navy border border-slate-700/60 text-brand-cyan text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>استمارة التقديم 2026/2025</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          انضم إلى فريق الميديا والتوثيق
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1.5 max-w-md mx-auto">
          شارك في تغطية الفعاليات الكبرى وصناعة المحتوى البصري للكلية
        </p>
      </div>

      {/* Progress Steps Header */}
      <div className="mb-8">
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {STEPS.map((step) => {
            const isPassed = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <button
                key={step.id}
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  if (step.id < currentStep) setCurrentStep(step.id);
                }}
                className={`flex flex-col items-center gap-1.5 group transition ${
                  step.id <= currentStep ? 'cursor-pointer' : 'cursor-default opacity-60'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isPassed
                      ? 'bg-brand-blue text-white'
                      : isCurrent
                      ? 'bg-brand-cyan text-brand-darkest ring-4 ring-brand-cyan/20 font-black'
                      : 'bg-brand-navy text-slate-400 border border-slate-700'
                  }`}
                >
                  {isPassed ? <Check className="w-4 h-4 stroke-[3]" /> : step.id}
                </div>
                <span className={`text-[11px] sm:text-xs font-medium truncate max-w-[70px] sm:max-w-none ${
                  isCurrent ? 'text-brand-cyan font-bold' : isPassed ? 'text-slate-200' : 'text-slate-500'
                }`}>
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Progress Bar Line */}
        <div className="w-full bg-brand-navy h-1.5 rounded-full mt-4 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-brand-blue to-brand-cyan h-full transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Global Error Banner */}
      {errors.general && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs sm:text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block mb-0.5">تنبيه:</span>
            {errors.general}
          </div>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="bg-brand-dark rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-card-dark relative">
          <AnimatePresence mode="wait">
            {/* ========================================================= */}
            {/* STEP 1: Personal Info                                     */}
            {/* ========================================================= */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-brand-cyan" />
                    <span>البيانات الشخصية</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">أدخل بياناتك للتواصل معك وتأكيد انضمامك للفريق</p>
                </div>

                <div className="space-y-5">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label htmlFor="fullName" className="block text-xs font-semibold text-slate-200">
                      الاسم بالكامل (ثلاثي على الأقل) <span className="text-brand-cyan">*</span>
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="مثال: أحمد محمد علي"
                      disabled={isSubmitting}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-brand-navy text-white text-sm placeholder-slate-500 border transition outline-none focus:ring-2 ${
                        errors.fullName
                          ? 'border-red-500 focus:ring-red-500/20'
                          : 'border-slate-700/80 focus:border-brand-cyan focus:ring-brand-cyan/20'
                      }`}
                    />
                    {errors.fullName && (
                      <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.fullName}</span>
                      </p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label htmlFor="phoneNumber" className="block text-xs font-semibold text-slate-200">
                      رقم الهاتف (واتساب نشط) <span className="text-brand-cyan">*</span>
                    </label>
                    <div className="relative" dir="ltr">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        placeholder="01012345678"
                        disabled={isSubmitting}
                        className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-brand-navy text-white text-sm placeholder-slate-500 border transition outline-none text-left focus:ring-2 ${
                          errors.phoneNumber
                            ? 'border-red-500 focus:ring-red-500/20'
                            : 'border-slate-700/80 focus:border-brand-cyan focus:ring-brand-cyan/20'
                        }`}
                      />
                    </div>
                    {errors.phoneNumber && (
                      <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.phoneNumber}</span>
                      </p>
                    )}
                  </div>

                  {/* Academic Year */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-200">
                      الفرقة الدراسية الحالية <span className="text-brand-cyan">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {ACADEMIC_YEARS.map((year) => {
                        const isSelected = formData.academicYear === year.id;
                        return (
                          <button
                            key={year.id}
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleInputChange('academicYear', year.id)}
                            className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                              isSelected
                                ? 'bg-brand-blue/20 border-brand-cyan text-white ring-1 ring-brand-cyan'
                                : 'bg-brand-navy/60 border-slate-700/80 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            <GraduationCap className={`w-4 h-4 ${isSelected ? 'text-brand-cyan' : 'text-slate-500'}`} />
                            <span className="font-bold text-xs">{year.labelAr}</span>
                          </button>
                        );
                      })}
                    </div>
                    {errors.academicYear && (
                      <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.academicYear}</span>
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* STEP 2: Media Skills                                      */}
            {/* ========================================================= */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Camera className="w-4 h-4 text-brand-cyan" />
                      <span>المهارات الإعلامية</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">اختر المهارات التي تجيدها أو ترغب بالتخصص بها</p>
                  </div>
                  <span className="text-xs text-brand-cyan font-bold bg-brand-navy px-2.5 py-1 rounded-md border border-slate-700">
                    محدد ({formData.mediaSkills.length})
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {MEDIA_SKILLS.map((skill) => {
                    const isSelected = formData.mediaSkills.includes(skill.id);
                    const IconComponent = skill.icon || Camera;

                    return (
                      <button
                        key={skill.id}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => toggleSkill(skill.id)}
                        className={`p-3 rounded-xl border text-right transition flex items-center gap-2.5 ${
                          isSelected
                            ? 'bg-brand-blue/20 border-brand-cyan text-white ring-1 ring-brand-cyan'
                            : 'bg-brand-navy/60 border-slate-700/80 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-brand-cyan text-brand-darkest' : 'bg-brand-darkest text-slate-400'
                        }`}>
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-xs truncate flex-1">{skill.labelAr}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-brand-cyan shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {formData.mediaSkills.includes('Other') && (
                  <div className="p-3 rounded-xl bg-brand-navy border border-slate-700 space-y-1.5 animate-fadeIn">
                    <label htmlFor="otherSkill" className="block text-xs font-semibold text-brand-cyan">
                      وضح المهارة الأخرى بالتفصيل <span className="text-brand-cyan">*</span>
                    </label>
                    <input
                      type="text"
                      id="otherSkill"
                      value={formData.otherSkill}
                      onChange={(e) => handleInputChange('otherSkill', e.target.value)}
                      placeholder="مثال: تعليق صوتي (Voice Over)، رسم رقمي..."
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 rounded-lg bg-brand-dark text-white text-xs border border-slate-700 outline-none focus:border-brand-cyan"
                    />
                    {errors.otherSkill && (
                      <p className="text-xs text-red-400">{errors.otherSkill}</p>
                    )}
                  </div>
                )}

                {errors.mediaSkills && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.mediaSkills}</span>
                  </p>
                )}
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* STEP 3: Equipment                                         */}
            {/* ========================================================= */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Camera className="w-4 h-4 text-brand-cyan" />
                      <span>المعدات والأجهزة المتوفرة لديك</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">حدد ما تمتلكه (اختياري - عدم توفر أجهزة لا يمنع القبول)</p>
                  </div>
                  <span className="text-xs text-slate-400">اختياري</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {EQUIPMENT_OPTIONS.map((equip) => {
                    const isSelected = formData.equipment.includes(equip.id);
                    const IconComponent = equip.icon || Camera;

                    return (
                      <button
                        key={equip.id}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => toggleEquipment(equip.id)}
                        className={`p-3 rounded-xl border text-right transition flex items-center gap-3 ${
                          isSelected
                            ? 'bg-brand-blue/20 border-brand-cyan text-white'
                            : 'bg-brand-navy/60 border-slate-700/80 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-brand-cyan text-brand-darkest' : 'bg-brand-darkest text-slate-400'
                        }`}>
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-xs truncate flex-1">{equip.labelAr}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-brand-cyan shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {formData.equipment.includes('Other') && (
                  <div className="p-3 rounded-xl bg-brand-navy border border-slate-700 space-y-1.5 animate-fadeIn">
                    <label htmlFor="otherEquipment" className="block text-xs font-semibold text-brand-cyan">
                      أذكر المعدات الإضافية <span className="text-brand-cyan">*</span>
                    </label>
                    <input
                      type="text"
                      id="otherEquipment"
                      value={formData.otherEquipment}
                      onChange={(e) => handleInputChange('otherEquipment', e.target.value)}
                      placeholder="مثال: طائرة درون، عدسات مخصصة..."
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 rounded-lg bg-brand-dark text-white text-xs border border-slate-700 outline-none focus:border-brand-cyan"
                    />
                    {errors.otherEquipment && (
                      <p className="text-xs text-red-400">{errors.otherEquipment}</p>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* STEP 4: Portfolio & Confirmation                          */}
            {/* ========================================================= */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-brand-cyan" />
                    <span>سابقة الأعمال وتأكيد الطلب</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">إرفاق بورتفوليو أو رابط أعمال سابقة (اختياري)</p>
                </div>

                {/* File Upload Box */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-200">
                    رفع ملف بورتفوليو (PDF أو صور JPG/PNG)
                  </label>

                  {!formData.portfolioFile ? (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
                        dragActive
                          ? 'border-brand-cyan bg-brand-blue/10'
                          : 'border-slate-700 bg-brand-navy/50 hover:border-slate-500'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={isSubmitting}
                      />
                      <Upload className="w-6 h-6 text-brand-cyan mx-auto mb-2" />
                      <p className="text-xs font-bold text-white mb-0.5">اضغط لاختيار ملف أو اسحبه هنا</p>
                      <p className="text-[11px] text-slate-400">PDF, JPG, PNG (حد أقصى 10 ميجابايت)</p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-brand-navy border border-slate-700 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileCheck className="w-5 h-5 text-brand-cyan shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate max-w-xs">{formData.portfolioFile.name}</p>
                          <p className="text-[10px] text-slate-400">{(formData.portfolioFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="p-1 rounded-md text-red-400 hover:bg-red-950/40"
                        title="إلغاء الملف"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {errors.portfolioFile && (
                    <p className="text-xs text-red-400">{errors.portfolioFile}</p>
                  )}
                </div>

                {/* External link */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <label htmlFor="externalUrl" className="block text-xs font-semibold text-slate-200">
                    أو رابط معرض أعمال خارجي (Behance / Google Drive / Vimeo)
                  </label>
                  <div className="relative" dir="ltr">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <LinkIcon className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="url"
                      id="externalUrl"
                      value={formData.externalPortfolioUrl}
                      onChange={(e) => handleInputChange('externalPortfolioUrl', e.target.value)}
                      placeholder="https://behance.net/username"
                      disabled={isSubmitting}
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-brand-navy text-white text-xs placeholder-slate-500 border border-slate-700/80 outline-none text-left focus:border-brand-cyan"
                    />
                  </div>
                  {errors.externalPortfolioUrl && (
                    <p className="text-xs text-red-400">{errors.externalPortfolioUrl}</p>
                  )}
                </div>

                {/* Agreement & Privacy */}
                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <div className="p-3 rounded-xl bg-brand-navy/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-brand-cyan shrink-0 mt-0.5" />
                    <span>تُستخدم البيانات لتنظيم وتوزيع مهام فريق الميديا بالكلية، ولا تُشارك مع أي طرف خارجي.</span>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.agreedToTerms}
                        onChange={(e) => handleInputChange('agreedToTerms', e.target.checked)}
                        disabled={isSubmitting}
                        className="w-4 h-4 rounded border-slate-700 bg-brand-navy text-brand-blue focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs text-slate-300">أقر بصحة البيانات ورغبتي في الانضمام لفريق الميديا والبدء في الأنشطة.</span>
                    </label>
                    {errors.agreedToTerms && (
                      <p className="text-xs text-red-400 mt-1">{errors.agreedToTerms}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-800">
            {currentStep > 1 ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handlePrevStep}
                className="px-4 py-2 rounded-xl border border-slate-700 bg-brand-navy text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>السابق</span>
              </button>
            ) : <div />}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blueHover text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <span>المتابعة للخطوة التالية</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-md ${
                  isSubmitting
                    ? 'bg-brand-navy border border-brand-cyan text-brand-cyan cursor-wait'
                    : 'bg-brand-blue hover:bg-brand-blueHover text-white shadow-brand-blue/30 active:scale-[0.99]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin" />
                    <span>{submissionProgressText || 'جاري الإرسال...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 -scale-x-100" />
                    <span>تأكيد وإرسال الاستمارة</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
