import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ExternalLink, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  ArrowUpDown, 
  Eye, 
  FileCheck
} from 'lucide-react';
import { ApplicantRecord, FilterState } from '../types/dashboard';
import { MEDIA_SKILLS, EQUIPMENT_OPTIONS, ACADEMIC_YEARS } from '../../constants/options';

interface ApplicantsTablePageProps {
  applicants: ApplicantRecord[];
  onSelectApplicant: (applicant: ApplicantRecord) => void;
  lang: 'ar' | 'en';
}

export const ApplicantsTablePage: React.FC<ApplicantsTablePageProps> = ({ applicants, onSelectApplicant, lang }) => {
  const isAr = lang === 'ar';

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    academicYear: '',
    skill: '',
    equipmentItem: '',
    status: '',
    portfolioFilter: 'all'
  });

  const [sortField, setSortField] = useState<'name' | 'date' | 'year' | 'status'>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Filter logic
  const filteredApplicants = useMemo(() => {
    return applicants.filter((a) => {
      // 1. Search query
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

      // 5. Status
      if (filters.status && a.status !== filters.status) {
        return false;
      }

      // 6. Portfolio
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
        cmp = a.status.localeCompare(b.status, 'ar');
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

  const handleSort = (field: 'name' | 'date' | 'year' | 'status') => {
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
      portfolioFilter: 'all'
    });
    setCurrentPage(1);
  };

  const uniqueStatuses = useMemo(() => {
    const set = new Set<string>();
    applicants.forEach(a => { if (a.status) set.add(a.status); });
    return Array.from(set);
  }, [applicants]);

  return (
    <div className="space-y-5">
      {/* Search and Filters Header */}
      <div className="p-5 rounded-2xl bg-brand-dark border border-slate-800 shadow-sm space-y-4">
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
              placeholder={isAr ? 'بحث بالاسم، رقم الهاتف، أو كود الطلب...' : 'Search by name, phone, or ID...'}
              className="w-full px-4 py-2.5 rounded-xl bg-brand-navy border border-slate-700/80 text-white text-xs placeholder-slate-500 outline-none focus:border-brand-cyan"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              {sortedApplicants.length} {isAr ? 'متقدم مطابق' : 'matching applicants'}
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="px-3 py-2 rounded-xl bg-brand-navy hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition"
              title={isAr ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'إعادة ضبط' : 'Reset'}</span>
            </button>
          </div>
        </div>

        {/* Filters Controls Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-3 border-t border-slate-800 text-xs">
          {/* Academic Year */}
          <div>
            <select
              value={filters.academicYear}
              onChange={(e) => { setFilters(prev => ({ ...prev, academicYear: e.target.value })); setCurrentPage(1); }}
              className="w-full p-2 rounded-xl bg-brand-navy border border-slate-700 text-slate-200 outline-none focus:border-brand-cyan text-xs"
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
              className="w-full p-2 rounded-xl bg-brand-navy border border-slate-700 text-slate-200 outline-none focus:border-brand-cyan text-xs"
            >
              <option value="">{isAr ? 'جميع المهارات' : 'All Skills'}</option>
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
              className="w-full p-2 rounded-xl bg-brand-navy border border-slate-700 text-slate-200 outline-none focus:border-brand-cyan text-xs"
            >
              <option value="">{isAr ? 'جميع المعدات' : 'All Equipment'}</option>
              {EQUIPMENT_OPTIONS.map(eq => (
                <option key={eq.id} value={eq.id}>{isAr ? eq.labelAr : eq.labelEn}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => { setFilters(prev => ({ ...prev, status: e.target.value })); setCurrentPage(1); }}
              className="w-full p-2 rounded-xl bg-brand-navy border border-slate-700 text-slate-200 outline-none focus:border-brand-cyan text-xs"
            >
              <option value="">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
              {uniqueStatuses.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Portfolio Filter */}
          <div className="col-span-2 sm:col-span-1">
            <select
              value={filters.portfolioFilter}
              onChange={(e) => { setFilters(prev => ({ ...prev, portfolioFilter: e.target.value as FilterState['portfolioFilter'] })); setCurrentPage(1); }}
              className="w-full p-2 rounded-xl bg-brand-navy border border-slate-700 text-slate-200 outline-none focus:border-brand-cyan text-xs"
            >
              <option value="all">{isAr ? 'البورتفوليو: الكل' : 'Portfolio: All'}</option>
              <option value="with_portfolio">{isAr ? 'ببورتفوليو فقط' : 'With Portfolio'}</option>
              <option value="without_portfolio">{isAr ? 'بدون بورتفوليو' : 'Without Portfolio'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-2xl bg-brand-dark border border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className={`w-full text-xs ${isAr ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className="bg-brand-navy/90 border-b border-slate-800 text-slate-400 font-semibold select-none">
                <th className="p-3.5 pr-4">{isAr ? 'الكود' : 'ID'}</th>
                <th className="p-3.5 cursor-pointer hover:text-white transition" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    <span>{isAr ? 'الاسم بالكامل' : 'Full Name'}</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3.5">{isAr ? 'الهاتف' : 'Phone'}</th>
                <th className="p-3.5 cursor-pointer hover:text-white transition" onClick={() => handleSort('year')}>
                  <div className="flex items-center gap-1">
                    <span>{isAr ? 'الفرقة' : 'Year'}</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3.5">{isAr ? 'المهارات' : 'Skills'}</th>
                <th className="p-3.5">{isAr ? 'البورتفوليو' : 'Portfolio'}</th>
                <th className="p-3.5 cursor-pointer hover:text-white transition" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1">
                    <span>{isAr ? 'الحالة' : 'Status'}</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3.5 text-center">{isAr ? 'إجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedApplicants.length > 0 ? (
                paginatedApplicants.map((applicant) => (
                  <tr 
                    key={applicant.id}
                    onClick={() => onSelectApplicant(applicant)}
                    className="hover:bg-brand-navy/60 transition cursor-pointer group"
                  >
                    <td className="p-3.5 pr-4 font-mono text-[11px] text-slate-400">{applicant.id}</td>
                    <td className="p-3.5 font-bold text-white group-hover:text-brand-cyan transition">
                      {applicant.fullName}
                    </td>
                    <td className="p-3.5 font-mono text-slate-300" dir="ltr">{applicant.phoneNumber}</td>
                    <td className="p-3.5 text-slate-300 font-medium">{applicant.academicYear}</td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {applicant.mediaSkills.slice(0, 2).map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-brand-navy border border-slate-700 text-[10px] text-slate-300">
                            {s}
                          </span>
                        ))}
                        {applicant.mediaSkills.length > 2 && (
                          <span className="text-[10px] text-brand-cyan self-center">
                            +{applicant.mediaSkills.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5">
                      {applicant.hasPortfolio ? (
                        <a
                          href={applicant.portfolioUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] text-brand-cyan hover:underline"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>{isAr ? 'معاينة' : 'View'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-500 text-[11px]">{isAr ? 'لا يوجد' : 'None'}</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-brand-cyan border border-brand-cyan/20">
                        {applicant.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        className="p-1.5 rounded-lg bg-brand-navy hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title={isAr ? 'عرض التفاصيل' : 'View Details'}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    {isAr ? 'لا توجد طلبات مطابقة لمعايير البحث الحالية' : 'No applicants match the current search criteria'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-brand-navy/40 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>{isAr ? 'عرض' : 'Show'}</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-brand-navy border border-slate-700 text-white rounded-lg p-1 text-xs"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>{isAr ? 'عنصر بالصفحة' : 'per page'}</span>
          </div>

          <div className="flex items-center gap-2">
            <span>
              {isAr ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                className="p-1.5 rounded-lg bg-brand-navy border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 text-slate-300"
              >
                {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                className="p-1.5 rounded-lg bg-brand-navy border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 text-slate-300"
              >
                {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
