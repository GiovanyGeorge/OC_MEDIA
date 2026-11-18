import { 
  ApplicantRecord, 
  DashboardSummary, 
  SkillStat, 
  EquipmentStat, 
  AcademicYearStat, 
  StatusStat,
  SkillByYearStat
} from '../types/dashboard';
import { MEDIA_SKILLS, EQUIPMENT_OPTIONS, ACADEMIC_YEARS } from '../../constants/options';

export function computeDashboardSummary(applicants: ApplicantRecord[]): DashboardSummary {
  const total = applicants.length;

  if (total === 0) {
    return {
      totalApplicants: 0,
      pendingCount: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      shortlistedCount: 0,
      reviewedCount: 0,
      unreviewedCount: 0,
      applicantsWithPortfolio: 0,
      portfolioPercentage: 0,
      applicantsWithoutPortfolio: 0,
      multipleEquipmentCount: 0,
      multipleEquipmentPercentage: 0,
      academicYearStats: [],
      topSkills: [],
      allSkillsStats: [],
      topEquipment: [],
      allEquipmentStats: [],
      skillByYearMatrix: [],
      statusStats: [],
      uniqueSkillsCount: 0,
      uniqueEquipmentCount: 0,
      dateRange: {}
    };
  }

  // 1. Portfolio stats
  const withPortfolio = applicants.filter(a => a.hasPortfolio).length;
  const portfolioPercentage = Math.round((withPortfolio / total) * 100);

  // 2. Academic Year stats
  const yearCounts: { [k: string]: number } = {
    First: 0,
    Second: 0,
    Third: 0,
    Fourth: 0,
    Other: 0
  };

  applicants.forEach(a => {
    yearCounts[a.academicYearNormalized] = (yearCounts[a.academicYearNormalized] || 0) + 1;
  });

  const academicYearStats: AcademicYearStat[] = ACADEMIC_YEARS.map(y => {
    const count = yearCounts[y.id] || 0;
    return {
      yearKey: y.id,
      labelAr: y.labelAr,
      labelEn: y.labelEn,
      count,
      percentage: Math.round((count / total) * 100)
    };
  });

  if (yearCounts.Other > 0) {
    academicYearStats.push({
      yearKey: 'Other',
      labelAr: 'أخرى / غير محدد',
      labelEn: 'Other / Unspecified',
      count: yearCounts.Other,
      percentage: Math.round((yearCounts.Other / total) * 100)
    });
  }

  // 3. Media Skills stats & Cross-Analysis with Academic Years
  const skillsCountMap = new Map<string, number>();
  const skillYearMap = new Map<string, { first: number; second: number; third: number; fourth: number; other: number }>();

  applicants.forEach(a => {
    a.mediaSkills.forEach(s => {
      const matched = MEDIA_SKILLS.find(m => 
        s.toLowerCase().includes(m.id.toLowerCase()) || 
        s.includes(m.labelAr) ||
        m.labelAr.includes(s)
      );
      const key = matched ? matched.id : s;
      skillsCountMap.set(key, (skillsCountMap.get(key) || 0) + 1);

      if (!skillYearMap.has(key)) {
        skillYearMap.set(key, { first: 0, second: 0, third: 0, fourth: 0, other: 0 });
      }
      const ym = skillYearMap.get(key)!;
      if (a.academicYearNormalized === 'First') ym.first++;
      else if (a.academicYearNormalized === 'Second') ym.second++;
      else if (a.academicYearNormalized === 'Third') ym.third++;
      else if (a.academicYearNormalized === 'Fourth') ym.fourth++;
      else ym.other++;
    });
  });

  const allSkillsStats: SkillStat[] = MEDIA_SKILLS.map(m => {
    const count = skillsCountMap.get(m.id) || 0;
    return {
      skill: m.id,
      labelAr: m.labelAr,
      labelEn: m.labelEn,
      count,
      percentage: Math.round((count / total) * 100)
    };
  }).sort((a, b) => b.count - a.count);

  const topSkills = allSkillsStats.slice(0, 5);

  const skillByYearMatrix: SkillByYearStat[] = MEDIA_SKILLS.map(m => {
    const ym = skillYearMap.get(m.id) || { first: 0, second: 0, third: 0, fourth: 0, other: 0 };
    const skillTotal = skillsCountMap.get(m.id) || 0;
    return {
      skill: m.id,
      labelAr: m.labelAr,
      labelEn: m.labelEn,
      firstYear: ym.first,
      secondYear: ym.second,
      thirdYear: ym.third,
      fourthYear: ym.fourth,
      otherYear: ym.other,
      total: skillTotal
    };
  }).filter(s => s.total > 0).sort((a, b) => b.total - a.total);

  // 4. Equipment stats & Multiple Gear ownership
  const equipCountMap = new Map<string, number>();
  let multipleEquipmentCount = 0;

  applicants.forEach(a => {
    if (a.equipment.length >= 2) {
      multipleEquipmentCount++;
    }
    a.equipment.forEach(eq => {
      const matched = EQUIPMENT_OPTIONS.find(e => 
        eq.toLowerCase().includes(e.id.toLowerCase()) || 
        eq.includes(e.labelAr) ||
        e.labelAr.includes(eq)
      );
      const key = matched ? matched.id : eq;
      equipCountMap.set(key, (equipCountMap.get(key) || 0) + 1);
    });
  });

  const multipleEquipmentPercentage = Math.round((multipleEquipmentCount / total) * 100);

  const allEquipmentStats: EquipmentStat[] = EQUIPMENT_OPTIONS.map(e => {
    const count = equipCountMap.get(e.id) || 0;
    return {
      item: e.id,
      labelAr: e.labelAr,
      labelEn: e.labelEn,
      count,
      percentage: Math.round((count / total) * 100)
    };
  }).sort((a, b) => b.count - a.count);

  const topEquipment = allEquipmentStats.slice(0, 5);

  // 5. Status stats & Evaluation Breakdown
  let pendingCount = 0;
  let acceptedCount = 0;
  let rejectedCount = 0;
  let shortlistedCount = 0;
  let reviewedCount = 0;

  const statusMap = new Map<string, number>();

  applicants.forEach(a => {
    const effectiveStatus = a.evaluation?.statusOverride || a.status || 'قيد المراجعة';
    statusMap.set(effectiveStatus, (statusMap.get(effectiveStatus) || 0) + 1);

    const norm = effectiveStatus.toLowerCase();
    if (norm.includes('accept') || norm.includes('مقبول')) {
      acceptedCount++;
    } else if (norm.includes('reject') || norm.includes('مرفوض')) {
      rejectedCount++;
    } else if (norm.includes('shortlist') || norm.includes('ترشيح') || a.evaluation?.isShortlisted) {
      shortlistedCount++;
    } else {
      pendingCount++;
    }

    if (a.evaluation?.isReviewed) {
      reviewedCount++;
    }
  });

  const statusStats: StatusStat[] = Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count,
    percentage: Math.round((count / total) * 100)
  })).sort((a, b) => b.count - a.count);

  // 6. Dates
  const validDates = applicants
    .map(a => a.rawDate)
    .filter((d): d is Date => Boolean(d && !isNaN(d.getTime())))
    .sort((a, b) => a.getTime() - b.getTime());

  const firstDate = validDates[0]?.toISOString().split('T')[0];
  const lastDate = validDates[validDates.length - 1]?.toISOString().split('T')[0];

  return {
    totalApplicants: total,
    pendingCount,
    acceptedCount,
    rejectedCount,
    shortlistedCount,
    reviewedCount,
    unreviewedCount: total - reviewedCount,
    applicantsWithPortfolio: withPortfolio,
    portfolioPercentage,
    applicantsWithoutPortfolio: total - withPortfolio,
    multipleEquipmentCount,
    multipleEquipmentPercentage,
    academicYearStats,
    topSkills,
    allSkillsStats,
    topEquipment,
    allEquipmentStats,
    skillByYearMatrix,
    statusStats,
    uniqueSkillsCount: skillsCountMap.size,
    uniqueEquipmentCount: equipCountMap.size,
    dateRange: {
      firstDate,
      lastDate
    }
  };
}
