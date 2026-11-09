import { ApplicantRecord, DashboardSummary, SkillStat, EquipmentStat, AcademicYearStat, StatusStat } from '../types/dashboard';
import { MEDIA_SKILLS, EQUIPMENT_OPTIONS, ACADEMIC_YEARS } from '../../constants/options';

export function computeDashboardSummary(applicants: ApplicantRecord[]): DashboardSummary {
  const total = applicants.length;

  if (total === 0) {
    return {
      totalApplicants: 0,
      applicantsWithPortfolio: 0,
      portfolioPercentage: 0,
      applicantsWithoutPortfolio: 0,
      academicYearStats: [],
      topSkills: [],
      allSkillsStats: [],
      topEquipment: [],
      allEquipmentStats: [],
      statusStats: [],
      uniqueSkillsCount: 0,
      uniqueEquipmentCount: 0,
      dateRange: {}
    };
  }

  // 1. Portfolio stats
  const withPortfolio = applicants.filter(a => a.hasPortfolio).length;
  const portfolioPercentage = total > 0 ? Math.round((withPortfolio / total) * 100) : 0;

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
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
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

  // 3. Media Skills stats
  const skillsCountMap = new Map<string, number>();

  applicants.forEach(a => {
    a.mediaSkills.forEach(s => {
      // Find canonical match or keep as-is
      const matched = MEDIA_SKILLS.find(m => 
        s.toLowerCase().includes(m.id.toLowerCase()) || 
        s.includes(m.labelAr) ||
        m.labelAr.includes(s)
      );
      const key = matched ? matched.id : s;
      skillsCountMap.set(key, (skillsCountMap.get(key) || 0) + 1);
    });
  });

  const allSkillsStats: SkillStat[] = MEDIA_SKILLS.map(m => {
    const count = skillsCountMap.get(m.id) || 0;
    return {
      skill: m.id,
      labelAr: m.labelAr,
      labelEn: m.labelEn,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    };
  }).sort((a, b) => b.count - a.count);

  const topSkills = allSkillsStats.slice(0, 5);

  // 4. Equipment stats
  const equipCountMap = new Map<string, number>();

  applicants.forEach(a => {
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

  const allEquipmentStats: EquipmentStat[] = EQUIPMENT_OPTIONS.map(e => {
    const count = equipCountMap.get(e.id) || 0;
    return {
      item: e.id,
      labelAr: e.labelAr,
      labelEn: e.labelEn,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    };
  }).sort((a, b) => b.count - a.count);

  const topEquipment = allEquipmentStats.slice(0, 5);

  // 5. Status stats
  const statusMap = new Map<string, number>();
  applicants.forEach(a => {
    const s = a.status || 'قيد المراجعة';
    statusMap.set(s, (statusMap.get(s) || 0) + 1);
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
    applicantsWithPortfolio: withPortfolio,
    portfolioPercentage,
    applicantsWithoutPortfolio: total - withPortfolio,
    academicYearStats,
    topSkills,
    allSkillsStats,
    topEquipment,
    allEquipmentStats,
    statusStats,
    uniqueSkillsCount: skillsCountMap.size,
    uniqueEquipmentCount: equipCountMap.size,
    dateRange: {
      firstDate,
      lastDate
    }
  };
}

