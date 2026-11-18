import { ApplicantRecord, DashboardSummary } from '../types/dashboard';

/**
 * Downloads a string content as a CSV file in the browser with UTF-8 BOM
 */
function downloadCsv(csvContent: string, fileName: string): void {
  // UTF-8 BOM (\uFEFF) ensures Excel opens Arabic characters correctly without garbling
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escapes a cell value for CSV
 */
function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Export filtered applicants list as CSV
 */
export function exportApplicantsToCsv(applicants: ApplicantRecord[], fileName = 'OC_Media_Applicants.csv'): void {
  const headers = [
    'Submission ID',
    'Submission Date',
    'Full Name',
    'Phone Number',
    'Academic Year',
    'Media Skills',
    'Equipment',
    'Portfolio URL',
    'Has Portfolio',
    'Original Status',
    'Evaluation Status',
    'Skill Rating',
    'Portfolio Rating',
    'Shortlisted',
    'Reviewed',
    'Internal Notes'
  ];

  const rows = applicants.map(a => [
    escapeCsvCell(a.id),
    escapeCsvCell(a.submissionDate),
    escapeCsvCell(a.fullName),
    escapeCsvCell(a.phoneNumber),
    escapeCsvCell(a.academicYear),
    escapeCsvCell(a.mediaSkills.join('، ')),
    escapeCsvCell(a.equipment.join('، ')),
    escapeCsvCell(a.portfolioUrl),
    escapeCsvCell(a.hasPortfolio ? 'نعم' : 'لا'),
    escapeCsvCell(a.status),
    escapeCsvCell(a.evaluation?.statusOverride || a.status),
    escapeCsvCell(a.evaluation?.skillRating ? `${a.evaluation.skillRating}/5` : '-'),
    escapeCsvCell(a.evaluation?.portfolioRating ? `${a.evaluation.portfolioRating}/5` : '-'),
    escapeCsvCell(a.evaluation?.isShortlisted ? 'نعم (Shortlisted)' : 'لا'),
    escapeCsvCell(a.evaluation?.isReviewed ? 'نعم' : 'لا'),
    escapeCsvCell(a.evaluation?.notes || '')
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadCsv(csv, fileName);
}

/**
 * Export shortlisted applicants only as CSV
 */
export function exportShortlistedApplicantsCsv(applicants: ApplicantRecord[]): void {
  const shortlisted = applicants.filter(a => {
    const status = (a.evaluation?.statusOverride || a.status || '').toLowerCase();
    return a.evaluation?.isShortlisted || status.includes('shortlist') || status.includes('ترشيح');
  });

  exportApplicantsToCsv(shortlisted, `OC_Media_Shortlisted_${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Export accepted applicants only as CSV
 */
export function exportAcceptedApplicantsCsv(applicants: ApplicantRecord[]): void {
  const accepted = applicants.filter(a => {
    const status = (a.evaluation?.statusOverride || a.status || '').toLowerCase();
    return status.includes('accept') || status.includes('مقبول');
  });

  exportApplicantsToCsv(accepted, `OC_Media_Accepted_${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Export analytics summary report as CSV
 */
export function exportAnalyticsSummaryCsv(summary: DashboardSummary, fileName = 'OC_Media_Analytics_Summary.csv'): void {
  const lines: string[] = [
    'تقرير تحليلات لجنة الإعلام - كلية الحاسبات والذكاء الاصطناعي - جامعة العاصمة',
    `تاريخ استخراج التقرير,${new Date().toLocaleString('ar-EG')}`,
    '',
    'المؤشرات العامة (KPIs)',
    `إجمالي المتقدمين,${summary.totalApplicants}`,
    `قيد المراجعة,${summary.pendingCount}`,
    `المقبولين,${summary.acceptedCount}`,
    `المرفوضين,${summary.rejectedCount}`,
    `المرشحين للقائمة المختصرة (Shortlisted),${summary.shortlistedCount}`,
    `تمت مراجعتهم,${summary.reviewedCount}`,
    `بانتظار المراجعة,${summary.unreviewedCount}`,
    `المتقدمين ببورتفوليو,${summary.applicantsWithPortfolio} (${summary.portfolioPercentage}%)`,
    `المتقدمين بدون بورتفوليو,${summary.applicantsWithoutPortfolio}`,
    `ملاك معدات متعددة (أكثر من معدة),${summary.multipleEquipmentCount} (${summary.multipleEquipmentPercentage}%)`,
    '',
    'توزيع الفرق الدراسية',
    'الفرقة,العدد,النسبة المئوية'
  ];

  summary.academicYearStats.forEach(y => {
    lines.push(`${escapeCsvCell(y.labelAr)},${y.count},${y.percentage}%`);
  });

  lines.push('');
  lines.push('أبرز المهارات الإعلامية');
  lines.push('المهارة,العدد,النسبة المئوية');
  summary.allSkillsStats.forEach(s => {
    lines.push(`${escapeCsvCell(s.labelAr)},${s.count},${s.percentage}%`);
  });

  lines.push('');
  lines.push('أبرز المعدات والأدوات');
  lines.push('المعدة,العدد,النسبة المئوية');
  summary.allEquipmentStats.forEach(e => {
    lines.push(`${escapeCsvCell(e.labelAr)},${e.count},${e.percentage}%`);
  });

  lines.push('');
  lines.push('حالات الطلبات');
  lines.push('الحالة,العدد,النسبة المئوية');
  summary.statusStats.forEach(st => {
    lines.push(`${escapeCsvCell(st.status)},${st.count},${st.percentage}%`);
  });

  downloadCsv(lines.join('\n'), fileName);
}

/**
 * Export skills distribution as CSV
 */
export function exportSkillsDistributionCsv(summary: DashboardSummary, fileName = 'OC_Media_Skills_Distribution.csv'): void {
  const headers = ['Skill (EN)', 'المهارة (AR)', 'العدد (Count)', 'النسبة المئوية (%)'];
  const rows = summary.allSkillsStats.map(s => [
    escapeCsvCell(s.skill),
    escapeCsvCell(s.labelAr),
    s.count,
    `${s.percentage}%`
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadCsv(csv, fileName);
}

/**
 * Export equipment distribution as CSV
 */
export function exportEquipmentDistributionCsv(summary: DashboardSummary, fileName = 'OC_Media_Equipment_Distribution.csv'): void {
  const headers = ['Equipment (EN)', 'المعدة / الأداة (AR)', 'العدد (Count)', 'النسبة المئوية (%)'];
  const rows = summary.allEquipmentStats.map(e => [
    escapeCsvCell(e.item),
    escapeCsvCell(e.labelAr),
    e.count,
    `${e.percentage}%`
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadCsv(csv, fileName);
}

/**
 * Triggers a print preview of the current view
 */
export function triggerPrintReport(): void {
  window.print();
}
