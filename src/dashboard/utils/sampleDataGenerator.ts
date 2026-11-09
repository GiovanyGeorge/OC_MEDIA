import * as XLSX from 'xlsx';
import { ApplicantRecord } from '../types/dashboard';

/**
 * Fictional test applicants dataset.
 * All entries are explicitly tagged with "[TEST]" / "[تجريبي]" so they can never be mistaken for real records.
 */
export const SAMPLE_APPLICANTS_DATA: ApplicantRecord[] = [
  {
    id: 'TEST-OC-2026-001',
    submissionDate: '2026-11-01 10:15',
    rawDate: new Date('2026-11-01T10:15:00'),
    fullName: 'يوسف كريم المنشاوي [تجريبي]',
    phoneNumber: '01011110001',
    academicYear: 'الفرقة الأولى',
    academicYearNormalized: 'First',
    mediaSkills: ['مونتاج الفيديو', 'تصوير فوتوغرافي', 'Color Grading'],
    equipment: ['كاميرا احترافية DSLR / Mirrorless', 'حامل كاميرا / ترايبود', 'كمبيوتر / لابتوب للمونتاج'],
    portfolioUrl: 'https://behance.net/sample-youssef-demo',
    hasPortfolio: true,
    status: 'قيد المراجعة',
    isDemo: true
  },
  {
    id: 'TEST-OC-2026-002',
    submissionDate: '2026-11-01 11:30',
    rawDate: new Date('2026-11-01T11:30:00'),
    fullName: 'مريم عادل الشريف [تجريبي]',
    phoneNumber: '01122220002',
    academicYear: 'الفرقة الثانية',
    academicYearNormalized: 'Second',
    mediaSkills: ['تصميم جرافيك', 'موشن جرافيكس', 'تصميم واجهات UI/UX'],
    equipment: ['تابلت رسم ديجيتال', 'كمبيوتر / لابتوب للمونتاج'],
    portfolioUrl: 'https://drive.google.com/sample-mariam-portfolio',
    hasPortfolio: true,
    status: 'مقبول مبدئياً',
    isDemo: true
  },
  {
    id: 'TEST-OC-2026-003',
    submissionDate: '2026-11-02 09:00',
    rawDate: new Date('2026-11-02T09:00:00'),
    fullName: 'عمر خالد الدسوقي [تجريبي]',
    phoneNumber: '01233330003',
    academicYear: 'الفرقة الثالثة',
    academicYearNormalized: 'Third',
    mediaSkills: ['تصوير فيديو وإخراج', 'مونتاج الفيديو'],
    equipment: ['كاميرا احترافية DSLR / Mirrorless', 'مانع اهتزاز (جيمبل)', 'ميكروفون تسجيل صوتي'],
    portfolioUrl: 'https://vimeo.com/sample-omar-demo',
    hasPortfolio: true,
    status: 'قيد المراجعة',
    isDemo: true
  },
  {
    id: 'TEST-OC-2026-004',
    submissionDate: '2026-11-02 14:20',
    rawDate: new Date('2026-11-02T14:20:00'),
    fullName: 'سارة طارق عبد الرحمن [تجريبي]',
    phoneNumber: '01544440004',
    academicYear: 'الفرقة الأولى',
    academicYearNormalized: 'First',
    mediaSkills: ['صناعة محتوى وإعداد', 'كتابة محتوى وسكريبت', 'إدارة سوشيال ميديا'],
    equipment: ['كاميرا هاتف بجودة عالية', 'رينج لايت'],
    portfolioUrl: '',
    hasPortfolio: false,
    status: 'قيد المراجعة',
    isDemo: true
  },
  {
    id: 'TEST-OC-2026-005',
    submissionDate: '2026-11-03 16:45',
    rawDate: new Date('2026-11-03T16:45:00'),
    fullName: 'أحمد ماجد البرنس [تجريبي]',
    phoneNumber: '01055550005',
    academicYear: 'الفرقة الرابعة',
    academicYearNormalized: 'Fourth',
    mediaSkills: ['هندسة وتصميم صوت', 'مونتاج الفيديو'],
    equipment: ['سماعات احترافية للمونتاج', 'ميكروفون تسجيل صوتي', 'كمبيوتر / لابتوب للمونتاج'],
    portfolioUrl: 'https://drive.google.com/sample-audio-demo',
    hasPortfolio: true,
    status: 'مقبول مبدئياً',
    isDemo: true
  },
  {
    id: 'TEST-OC-2026-006',
    submissionDate: '2026-11-03 18:10',
    rawDate: new Date('2026-11-03T18:10:00'),
    fullName: 'نور الدين مصطفى [تجريبي]',
    phoneNumber: '01166660006',
    academicYear: 'الفرقة الثانية',
    academicYearNormalized: 'Second',
    mediaSkills: ['تصوير فوتوغرافي', 'تصوير فيديو وإخراج'],
    equipment: ['كاميرا احترافية DSLR / Mirrorless', 'إضاءة سوفت بوكس / استوديو'],
    portfolioUrl: 'https://behance.net/nour-sample',
    hasPortfolio: true,
    status: 'قيد المراجعة',
    isDemo: true
  },
  {
    id: 'TEST-OC-2026-007',
    submissionDate: '2026-11-04 12:05',
    rawDate: new Date('2026-11-04T12:05:00'),
    fullName: 'فاطمة حسام الزيات [تجريبي]',
    phoneNumber: '01277770007',
    academicYear: 'الفرقة الثالثة',
    academicYearNormalized: 'Third',
    mediaSkills: ['تصميم جرافيك', 'إدارة سوشيال ميديا'],
    equipment: ['كمبيوتر / لابتوب للمونتاج'],
    portfolioUrl: '',
    hasPortfolio: false,
    status: 'قيد المراجعة',
    isDemo: true
  },
  {
    id: 'TEST-OC-2026-008',
    submissionDate: '2026-11-05 15:30',
    rawDate: new Date('2026-11-05T15:30:00'),
    fullName: 'محمود سامح عبد الله [تجريبي]',
    phoneNumber: '01088880008',
    academicYear: 'الفرقة الأولى',
    academicYearNormalized: 'First',
    mediaSkills: ['مونتاج الفيديو', 'موشن جرافيكس'],
    equipment: ['كمبيوتر / لابتوب للمونتاج'],
    portfolioUrl: 'https://drive.google.com/sample-motion-reel',
    hasPortfolio: true,
    status: 'قيد المراجعة',
    isDemo: true
  },
  {
    id: 'TEST-OC-2026-009',
    submissionDate: '2026-11-06 11:20',
    rawDate: new Date('2026-11-06T11:20:00'),
    fullName: 'شهد علاء الغمري [تجريبي]',
    phoneNumber: '01599990009',
    academicYear: 'الفرقة الثانية',
    academicYearNormalized: 'Second',
    mediaSkills: ['كتابة محتوى وسكريبت', 'صناعة محتوى وإعداد'],
    equipment: ['كاميرا هاتف بجودة عالية'],
    portfolioUrl: '',
    hasPortfolio: false,
    status: 'قيد المراجعة',
    isDemo: true
  },
  {
    id: 'TEST-OC-2026-010',
    submissionDate: '2026-11-06 17:40',
    rawDate: new Date('2026-11-06T17:40:00'),
    fullName: 'كريم وائل الصاوي [تجريبي]',
    phoneNumber: '01100000010',
    academicYear: 'الفرقة الرابعة',
    academicYearNormalized: 'Fourth',
    mediaSkills: ['تصميم واجهات UI/UX', 'تصميم جرافيك'],
    equipment: ['كمبيوتر / لابتوب للمونتاج', 'تابلت رسم ديجيتال'],
    portfolioUrl: 'https://figma.com/sample-portfolio-ui',
    hasPortfolio: true,
    status: 'مقبول مبدئياً',
    isDemo: true
  },
  {
    id: 'TEST-OC-2026-011',
    submissionDate: '2026-11-07 10:00',
    rawDate: new Date('2026-11-07T10:00:00'),
    fullName: 'ندى إيهاب الفقي [تجريبي]',
    phoneNumber: '01211110011',
    academicYear: 'الفرقة الأولى',
    academicYearNormalized: 'First',
    mediaSkills: ['تصوير فوتوغرافي', 'إدارة سوشيال ميديا'],
    equipment: ['كاميرا هاتف بجودة عالية', 'رينج لايت'],
    portfolioUrl: 'https://instagram.com/sample-photo-reel',
    hasPortfolio: true,
    status: 'قيد المراجعة',
    isDemo: true
  },
  {
    id: 'TEST-OC-2026-012',
    submissionDate: '2026-11-08 14:15',
    rawDate: new Date('2026-11-08T14:15:00'),
    fullName: 'بلال حسني النجار [تجريبي]',
    phoneNumber: '01022220012',
    academicYear: 'الفرقة الثالثة',
    academicYearNormalized: 'Third',
    mediaSkills: ['مونتاج الفيديو', 'تصوير فيديو وإخراج', 'هندسة وتصميم صوت'],
    equipment: ['كاميرا احترافية DSLR / Mirrorless', 'سماعات احترافية للمونتاج', 'حامل كاميرا / ترايبود'],
    portfolioUrl: 'https://drive.google.com/sample-bilal-works',
    hasPortfolio: true,
    status: 'مقبول مبدئياً',
    isDemo: true
  }
];

/**
 * Generates and downloads an Excel spreadsheet file with sample test applicants
 * matching the exact Google Sheet columns.
 */
export function downloadSampleSpreadsheet(): void {
  const rows = SAMPLE_APPLICANTS_DATA.map(item => ({
    'Submission ID': item.id,
    'Submission Date': item.submissionDate,
    'Full Name': item.fullName,
    'Phone Number': item.phoneNumber,
    'Academic Year': item.academicYear,
    'Media Skills': item.mediaSkills.join('، '),
    'Equipment': item.equipment.join('، '),
    'Portfolio URL': item.portfolioUrl || 'لا يوجد',
    'Status': item.status
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Recruitment_Applications');

  XLSX.writeFile(workbook, 'OC_Media_Recruitment_SAMPLE_TEST_DATA.xlsx');
}

