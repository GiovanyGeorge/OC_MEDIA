import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ExternalLink, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  ArrowUpDown, 
  Eye, 
  FileCheck,
  MessageSquare,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  Filter
} from 'lucide-react';
import { ApplicantRecord, FilterState } from '../types/dashboard';
import { MEDIA_SKILLS, EQUIPMENT_OPTIONS, ACADEMIC_YEARS } from '../../constants/options';
import { WhatsAppBroadcastModal } from './WhatsAppBroadcastModal';
import { generateWelcomeMessage, openWhatsAppChat } from '../utils/whatsapp';

interface ApplicantsTablePageProps {
  applicants: ApplicantRecord[];
  onSelectApplicant: (applicant: ApplicantRecord) => void;
  onQuickToggleShortlist?: (applicantId: string) => void;
  lang: 'ar' | 'en';
}

export const ApplicantsTablePage: React.FC<ApplicantsTablePageProps> = ({ 
  applicants, 
  onSelectApplicant, 
  onQuickToggleShortlist,
  lang 
}) => {
  const isAr = lang === 'ar';

  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [quickSentIds, setQuickSentIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    academicYear: '',
    skill: '',
    equipmentItem: '',
    status: '',
    portfolioFilter: 'all',
    reviewState: 'all'
  });

  const [sortField, setSortField] = useState<'name' | 'date' | 'year' | 'status' | 'rating'>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  const copyPhone = (id: string, phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Filter logic
  const filteredApplicants = useMemo(() => {
    return applicants.filter((a) => {
      const effectiveStatus = a.evaluation?.statusOverride || a.status || 'Pending Review';

      // 1. Search query (name, phone, id)
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.trim().toLowerCase();
        const matchesName = a.fullName.toLowerCase().includes(query);
        const matchesPhone = a.phoneNumber.includes(query);
        const matchesId = a.id.toLowerCase().includes(query);
        if (!matchesName && !matchesPhone && !matchesId) return false;
      }

      // 2. Academic Year
      if (filters.academicYear && a.academicYearNormalized !== filters.academicYear) {
        return false;
      }

      // 3. Skill
      if (filters.skill) {
        const hasSkill = a.mediaSkills.some(s => 
          s.toLowerCase().includes(filters.skill.toLowerCase()) || 
          filters.skill.toLowerCase().includes(s.toLowerCase())
        );
        if (!hasSkill) return false;
      }

      // 4. Equipment
      if (filters.equipmentItem) {
        const hasEquip = a.equipment.some(e => 
          e.toLowerCase().includes(filters.equipmentItem.toLowerCase()) || 
          filters.equipmentItem.toLowerCase().includes(e.toLowerCase())
        );
        if (!hasEquip) return false;
      }

      // 5. Status filter
      if (filters.status) {
        const stLower = effectiveStatus.toLowerCase();
        const fLower = filters.status.toLowerCase();
        if (fLower === 'pending review' || fLower === 'قيد المراجعة') {
          if (!stLower.includes('pending') && !stLower.includes('مراجعة')) return false;
        } else if (fLower === 'accepted' || fLower === 'مقبول') {
          if (!stLower.includes('accept') && !stLower.includes('مقبول')) return false;
        } else if (fLower === 'rejected' || fLower === 'مرفوض') {
          if (!stLower.includes('reject') && !stLower.includes('مرفوض')) return false;
        } else if (fLower === 'shortlisted' || fLower === 'مرشح') {
          if (!a.evaluation?.isShortlisted && !stLower.includes('shortlist') && !stLower.includes('ترشيح')) return false;
        } else if (effectiveStatus !== filters.status) {
          return false;
        }
      }

      // 6. Review State filter
      if (filters.reviewState === 'reviewed' && !a.evaluation?.isReviewed) return false;
      if (filters.reviewState === 'unreviewed' && a.evaluation?.isReviewed) return false;
      if (filters.reviewState === 'shortlisted' && !a.evaluation?.isShortlisted) return false;

      // 7. Portfolio filter
      if (filters.portfolioFilter === 'with_portfolio' && !a.hasPortfolio) return false;
      if (filters.portfolioFilter === 'without_portfolio' && a.hasPortfolio) return false;

      return true;
    });
  }, [applicants, filters]);

  // Sort logic
  const sortedApplicants = useMemo(() => {
    return [...filteredApplicants].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        cmp = a.fullName.localeCompare(b.fullName, 'ar');
      } else if (sortField === 'date') {
        const timeA = a.rawDate ? a.rawDate.getTime() : 0;
        const timeB = b.rawDate ? b.rawDate.getTime() : 0;
        cmp = timeA - timeB;
      } else if (sortField === 'year') {
        cmp = a.academicYear.localeCompare(b.academicYear, 'ar');
      } else if (sortField === 'status') {
        const statA = a.evaluation?.statusOverride || a.status || '';
        const statB = b.evaluation?.statusOverride || b.status || '';
        cmp = statA.localeCompare(statB, 'ar');
      } else if (sortField === 'rating') {
        const rateA = a.evaluation?.skillRating || 0;
        const rateB = b.evaluation?.skillRating || 0;
        cmp = rateA - rateB;
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [filteredApplicants, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(sortedApplicants.length / pageSize) || 1;
  const paginatedApplicants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedApplicants.slice(start, start + pageSize);
  }, [sortedApplicants, currentPage, pageSize]);

  const handleSort = (field: 'name' | 'date' | 'year' | 'status' | 'rating') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      academicYear: '',
      skill: '',
      equipmentItem: '',
      status: '',
      portfolioFilter: 'all',
      reviewState: 'all'
    });
    setCurrentPage(1);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery.trim()) count++;
    if (filters.academicYear) count++;
    if (filters.skill) count++;
    if (filters.equipmentItem) count++;
    if (filters.status) count++;
    if (filters.portfolioFilter !== 'all') count++;
    if (filters.reviewState && filters.reviewState !== 'all') count++;
    return count;
  }, [filters]);

  const getStatusBadge = (applicant: ApplicantRecord) => {
    const status = applicant.evaluation?.statusOverride || applicant.status || 'قيد المراجعة';
    const norm = status.toLowerCase();

    if (norm.includes('accept') || norm.includes('مقبول')) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" />
          <span>{isAr ? 'مقبول' : 'Accepted'}</span>
        </span>
      );
    }
    if (norm.includes('reject') || norm.includes('مرفوض')) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <XCircle className="w-3 h-3" />
          <span>{isAr ? 'مرفوض' : 'Rejected'}</span>
        </span>
      );
    }
    if (norm.includes('shortlist') || norm.includes('ترشيح') || applicant.evaluation?.isShortlisted) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
          <Star className="w-3 h-3 fill-purple-300" />
          <span>{isAr ? 'مرشح' : 'Shortlisted'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
        <Clock className="w-3 h-3" />
        <span>{isAr ? 'قيد المراجعة' : 'Pending'}</span>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      
      {/* Top Filter & Search Hub */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm space-y-3">
        
        {/* Row 1: Search bar and Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <div className={`absolute inset-y-0 ${isAr ? 'left-3' : 'right-3'} flex items-center pointer-events-none text-slate-400`}>
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => { setFilters(prev => ({ ...prev, searchQuery: e.target.value })); setCurrentPage(1); }}
              placeholder={isAr ? 'بحث بالاسم، برقم الهاتف، أو بكود الطلب (ID)...' : 'Search by applicant name, phone, or ID...'}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs placeholder-slate-500 outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* WhatsApp Outreach Hub Button */}
            <button
              type="button"
              onClick={() => setIsBroadcastModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm shadow-emerald-600/30"
              title={isAr ? 'فتح حملة إرسال رسائل الواتساب ورابط الجروب' : 'Open WhatsApp Outreach Hub'}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isAr ? 'إرسال رابط الجروب للطلاب' : 'Send Group Link'}</span>
            </button>

            {/* Reset Filters */}
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition"
                title={isAr ? 'إعادة ضبط كافة الفلاتر' : 'Reset all filters'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isAr ? `مسح الفلاتر (${activeFiltersCount})` : `Clear (${activeFiltersCount})`}</span>
              </button>
            )}

            <div className="text-xs text-slate-400 font-medium px-2 hidden md:block">
              <span className="text-white font-bold">{sortedApplicants.length}</span> {isAr ? 'متقدم مطابق' : 'matched'}
            </div>
          </div>
        </div>

        {/* Row 2: Granular Filters Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-800 text-xs">
          
          {/* Academic Year */}
          <div>
            <select
              value={filters.academicYear}
              onChange={(e) => { setFilters(prev => ({ ...prev, academicYear: e.target.value })); setCurrentPage(1); }}
              className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 outline-none focus:border-blue-500 text-xs"
            >
              <option value="">{isAr ? 'جميع الفرق الدراسية' : 'All Years'}</option>
              {ACADEMIC_YEARS.map(y => (
                <option key={y.id} value={y.id}>{isAr ? y.labelAr : y.labelEn}</option>
              ))}
            </select>
          </div>

          {/* Skill Filter */}
          <div>
            <select
              value={filters.skill}
              onChange={(e) => { setFilters(prev => ({ ...prev, skill: e.target.value })); setCurrentPage(1); }}
              className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 outline-none focus:border-blue-500 text-xs"
            >
              <option value="">{isAr ? 'جميع المهارات الإعلامية' : 'All Skills'}</option>
              {MEDIA_SKILLS.map(s => (
                <option key={s.id} value={s.id}>{isAr ? s.labelAr : s.labelEn}</option>
              ))}
            </select>
          </div>

          {/* Equipment Filter */}
          <div>
            <select
              value={filters.equipmentItem}
              onChange={(e) => { setFilters(prev => ({ ...prev, equipmentItem: e.target.value })); setCurrentPage(1); }}
              className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 outline-none focus:border-blue-500 text-xs"
            >
              <option value="">{isAr ? 'جميع المعدات والأجهزة' : 'All Equipment'}</option>
              {EQUIPMENT_OPTIONS.map(e => (
                <option key={e.id} value={e.id}>{isAr ? e.labelAr : e.labelEn}</option>
              ))}
            </select>
          </div>

          {/* Status Decision Filter */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => { setFilters(prev => ({ ...prev, status: e.target.value })); setCurrentPage(1); }}
              className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 outline-none focus:border-blue-500 text-xs font-medium"
            >
              <option value="">{isAr ? 'جميع الحالات والقرارات' : 'All Statuses'}</option>
              <option value="Pending Review">{isAr ? 'قيد المراجعة' : 'Pending Review'}</option>
              <option value="Shortlisted">{isAr ? 'مرشحين للقائمة المختصرة' : 'Shortlisted'}</option>
              <option value="Accepted">{isAr ? 'مقبولين' : 'Accepted'}</option>
              <option value="Rejected">{isAr ? 'مرفوضين' : 'Rejected'}</option>
            </select>
          </div>

          {/* Review Progress State */}
          <div>
            <select
              value={filters.reviewState || 'all'}
              onChange={(e) => { setFilters(prev => ({ ...prev, reviewState: e.target.value as any })); setCurrentPage(1); }}
              className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 outline-none focus:border-blue-500 text-xs"
            >
              <option value="all">{isAr ? 'حالة المراجعة: الكل' : 'Review: All'}</option>
              <option value="reviewed">{isAr ? 'تمت مراجعتهم فقط' : 'Reviewed Only'}</option>
              <option value="unreviewed">{isAr ? 'بانتظار المراجعة' : 'Unreviewed Only'}</option>
              <option value="shortlisted">{isAr ? 'قائمة التميز (Shortlist)' : 'Shortlisted Only'}</option>
            </select>
          </div>

          {/* Portfolio Availability Filter */}
          <div>
            <select
              value={filters.portfolioFilter}
              onChange={(e) => { setFilters(prev => ({ ...prev, portfolioFilter: e.target.value as any })); setCurrentPage(1); }}
              className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 outline-none focus:border-blue-500 text-xs"
            >
              <option value="all">{isAr ? 'البورتفوليو: الكل' : 'Portfolio: All'}</option>
              <option value="with_portfolio">{isAr ? 'ببورتفوليو فقط' : 'With Portfolio'}</option>
              <option value="without_portfolio">{isAr ? 'بدون بورتفوليو' : 'Without Portfolio'}</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Applicants Data Table Container */}
      <div className="rounded-2xl bg-[#0a1120] border border-slate-800 shadow-sm overflow-hidden flex flex-col">
        
        {/* Table Content with Overflow Scroll */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-start text-xs border-collapse">
            
            {/* Sticky Enterprise Table Header */}
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800 sticky top-0 z-10 backdrop-blur-sm">
                
                {/* Submission ID */}
                <th className="p-3.5 pr-4 text-start font-mono text-[11px] w-28">
                  {isAr ? 'كود الطلب' : 'ID'}
                </th>

                {/* Applicant Name */}
                <th 
                  onClick={() => handleSort('name')}
                  className="p-3.5 text-start cursor-pointer hover:text-white transition select-none min-w-[160px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{isAr ? 'اسم المتقدم' : 'Applicant Name'}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>

                {/* Phone */}
                <th className="p-3.5 text-start w-36">
                  {isAr ? 'رقم الهاتف' : 'Phone'}
                </th>

                {/* Academic Year */}
                <th 
                  onClick={() => handleSort('year')}
                  className="p-3.5 text-start cursor-pointer hover:text-white transition select-none w-28"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{isAr ? 'الفرقة' : 'Year'}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>

                {/* Skills */}
                <th className="p-3.5 text-start min-w-[200px]">
                  {isAr ? 'المهارات الإعلامية' : 'Media Skills'}
                </th>

                {/* Portfolio */}
                <th className="p-3.5 text-start w-28">
                  {isAr ? 'البورتفوليو' : 'Portfolio'}
                </th>

                {/* Status Decision */}
                <th 
                  onClick={() => handleSort('status')}
                  className="p-3.5 text-start cursor-pointer hover:text-white transition select-none w-32"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{isAr ? 'الحالة والقرار' : 'Status'}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>

                {/* Rating */}
                <th 
                  onClick={() => handleSort('rating')}
                  className="p-3.5 text-center cursor-pointer hover:text-white transition select-none w-24"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{isAr ? 'التقييم' : 'Rating'}</span>
                    <Star className="w-3 h-3 text-slate-500" />
                  </div>
                </th>

                {/* Actions */}
                <th className="p-3.5 text-center w-28">
                  {isAr ? 'الإجراءات' : 'Actions'}
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-800/80">
              {paginatedApplicants.length > 0 ? (
                paginatedApplicants.map((applicant) => (
                  <tr
                    key={applicant.id}
                    onClick={() => onSelectApplicant(applicant)}
                    className="hover:bg-slate-800/50 transition cursor-pointer group"
                  >
                    {/* Submission ID */}
                    <td className="p-3.5 pr-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {applicant.id}
                    </td>

                    {/* Full Name */}
                    <td className="p-3.5 font-bold text-white group-hover:text-blue-400 transition">
                      <div className="flex items-center gap-2">
                        {applicant.evaluation?.isReviewed && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title={isAr ? 'تمت مراجعته' : 'Reviewed'} />
                        )}
                        <span className="truncate max-w-[170px]">{applicant.fullName}</span>
                        {applicant.evaluation?.isShortlisted && (
                          <span title="Shortlisted">
                            <Star className="w-3.5 h-3.5 text-purple-400 fill-purple-400 shrink-0" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Phone Number */}
                    <td className="p-3.5 font-mono text-slate-300 whitespace-nowrap" dir="ltr">
                      <div className="flex items-center gap-1.5">
                        <span>{applicant.phoneNumber}</span>
                        <button
                          type="button"
                          onClick={(e) => copyPhone(applicant.id, applicant.phoneNumber, e)}
                          className="p-1 rounded text-slate-500 hover:text-white transition"
                          title={isAr ? 'نسخ الرقم' : 'Copy phone'}
                        >
                          {copiedId === applicant.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Academic Year */}
                    <td className="p-3.5 text-slate-300 font-medium whitespace-nowrap">
                      {applicant.academicYear}
                    </td>

                    {/* Skills Badges */}
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {applicant.mediaSkills.slice(0, 2).map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] text-slate-300 whitespace-nowrap">
                            {s}
                          </span>
                        ))}
                        {applicant.mediaSkills.length > 2 && (
                          <span className="text-[10px] text-blue-400 px-1 self-center font-bold">
                            +{applicant.mediaSkills.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Portfolio */}
                    <td className="p-3.5 whitespace-nowrap">
                      {applicant.hasPortfolio ? (
                        <a
                          href={applicant.portfolioUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-600/10 text-blue-400 hover:text-white hover:bg-blue-600 border border-blue-500/20 text-[11px] font-semibold transition"
                        >
                          <FileCheck className="w-3 h-3" />
                          <span>{isAr ? 'معاينة' : 'View'}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <span className="text-slate-500 text-[11px]">{isAr ? 'لا يوجد' : 'None'}</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5 whitespace-nowrap">
                      {getStatusBadge(applicant)}
                    </td>

                    {/* Rating */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      {applicant.evaluation?.skillRating ? (
                        <div className="flex items-center justify-center gap-0.5 text-amber-400 font-bold font-mono text-[11px]">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{applicant.evaluation.skillRating}/5</span>
                        </div>
                      ) : (
                        <span className="text-slate-600 font-mono text-[11px]">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Quick Shortlist Toggle Button */}
                        {onQuickToggleShortlist && (
                          <button
                            type="button"
                            onClick={() => onQuickToggleShortlist(applicant.id)}
                            className={`p-1.5 rounded-lg border transition ${
                              applicant.evaluation?.isShortlisted
                                ? 'bg-purple-950/40 border-purple-500/40 text-purple-300'
                                : 'bg-slate-800 hover:bg-slate-700 border-slate-700/80 text-slate-400 hover:text-purple-300'
                            }`}
                            title={applicant.evaluation?.isShortlisted ? (isAr ? 'إلغاء الترشيح من القائمة المختصرة' : 'Remove from Shortlist') : (isAr ? 'إضافة إلى القائمة المختصرة' : 'Add to Shortlist')}
                          >
                            <Star className={`w-3.5 h-3.5 ${applicant.evaluation?.isShortlisted ? 'fill-purple-400 text-purple-400' : ''}`} />
                          </button>
                        )}

                        {/* WhatsApp Instant Outreach Button */}
                        <button
                          type="button"
                          onClick={() => {
                            const msg = generateWelcomeMessage(applicant.fullName);
                            openWhatsAppChat(applicant.phoneNumber, msg);
                            setQuickSentIds(prev => new Set(prev).add(applicant.id));
                          }}
                          className={`p-1.5 rounded-lg border transition ${
                            quickSentIds.has(applicant.id)
                              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                              : 'bg-emerald-600/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600 hover:text-white'
                          }`}
                          title={isAr ? 'إرسال رسالة الترحيب ورابط الجروب عبر واتساب' : 'Send welcome message & group link via WhatsApp'}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        {/* View Details / Drawer */}
                        <button
                          type="button"
                          onClick={() => onSelectApplicant(applicant)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/80"
                          title={isAr ? 'عرض التفاصيل والتقييم' : 'View Details & Evaluation'}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-500">
                    <Filter className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
                    <p className="text-sm font-semibold text-slate-400">
                      {isAr ? 'لا توجد طلبات مطابقة لمعايير البحث الحالية' : 'No applicants match the current search criteria'}
                    </p>
                    {activeFiltersCount > 0 && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-3 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-bold transition"
                      >
                        {isAr ? 'إعادة ضبط كافة الفلاتر' : 'Reset all filters'}
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Enhanced Pagination Bar */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          
          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <span>{isAr ? 'عرض' : 'Show'}</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg p-1 text-xs outline-none font-mono"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>{isAr ? 'عنصر بالصفحة' : 'records per page'}</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="hidden sm:inline">
              {isAr 
                ? `عرض ${Math.min((currentPage - 1) * pageSize + 1, sortedApplicants.length)} - ${Math.min(currentPage * pageSize, sortedApplicants.length)} من أصل ${sortedApplicants.length}`
                : `Showing ${Math.min((currentPage - 1) * pageSize + 1, sortedApplicants.length)} - ${Math.min(currentPage * pageSize, sortedApplicants.length)} of ${sortedApplicants.length}`}
            </span>
          </div>

          {/* Page Navigation Buttons */}
          <div className="flex items-center gap-2">
            <span>
              {isAr ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 text-slate-300 transition"
                aria-label="Previous Page"
              >
                {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 text-slate-300 transition"
                aria-label="Next Page"
              >
                {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast WhatsApp Outreach Modal */}
      <WhatsAppBroadcastModal
        applicants={sortedApplicants}
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        lang={lang}
      />
    </div>
  );
};
