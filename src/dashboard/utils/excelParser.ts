import * as XLSX from 'xlsx';
import { ApplicantRecord, ParseResult, RawSpreadsheetRow } from '../types/dashboard';

// Known column aliases for flexible matching
const COLUMN_ALIASES = {
  id: ['submission id', 'submissionid', 'id', 'كود الطلب', 'الرقم المرجعي', 'رقم الاستمارة', 'معرف الطلب', 'submission_id'],
  date: ['submission date', 'submissiondate', 'date', 'timestamp', 'تاريخ التقديم', 'تاريخ ووقت التقديم', 'التاريخ', 'submission_date'],
  fullName: ['full name', 'fullname', 'name', 'الاسم', 'الاسم بالكامل', 'الاسم ثلاثي', 'اسم الطالب', 'full_name'],
  phone: ['phone number', 'phonenumber', 'phone', 'mobile', 'whatsapp', 'رقم الهاتف', 'الهاتف', 'المحمول', 'رقم الواتساب', 'phone_number'],
  academicYear: ['academic year', 'academicyear', 'year', 'الفرقة', 'الفرقة الدراسية', 'السنة الدراسية', 'academic_year'],
  mediaSkills: ['media skills', 'mediaskills', 'skills', 'المهارات', 'المهارات الإعلامية', 'media_skills'],
  equipment: ['equipment', 'gear', 'المعدات', 'الأجهزة', 'المعدات والأدوات', 'المعدات المتوفرة'],
  portfolioUrl: ['portfolio url', 'portfoliourl', 'portfolio', 'link', 'drive url', 'رابط البورتفوليو', 'البورتفوليو', 'معرض الأعمال', 'portfolio_url'],
  status: ['status', 'الحالة', 'حالة الطلب', 'وضع الطلب']
};

/**
 * Normalizes text for header comparison
 */
function normalizeHeader(header: string): string {
  return String(header || '')
    .trim()
    .toLowerCase()
    .replace(/[\-_]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Matches a spreadsheet header to a recognized canonical field
 */
function matchHeader(header: string): keyof typeof COLUMN_ALIASES | null {
  const normalized = normalizeHeader(header);
  for (const [canonicalField, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.some(alias => normalized === alias || normalized.includes(alias))) {
      return canonicalField as keyof typeof COLUMN_ALIASES;
    }
  }
  return null;
}

/**
 * Splits comma/semicolon/newline-separated strings into a clean array
 */
export function splitMultiValue(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
  
  const text = String(val).trim();
  if (!text || text === '-' || text === 'لا يوجد' || text === 'None') return [];

  // Split on Arabic comma (،), standard comma (,), semicolon (;), pipe (|), or newline
  return text
    .split(/[\u060C,;|\n]+/)
    .map(item => item.trim())
    .filter(item => item.length > 0 && item !== '-' && item !== 'لا توجد معدات محددة');
}

/**
 * Normalizes academic year into a canonical group
 */
export function normalizeAcademicYear(val: unknown): 'First' | 'Second' | 'Third' | 'Fourth' | 'Other' {
  const str = String(val || '').toLowerCase().trim();
  if (str.includes('first') || str.includes('1') || str.includes('أولى') || str.includes('اولى') || str.includes('إعدادي')) {
    return 'First';
  }
  if (str.includes('second') || str.includes('2') || str.includes('ثانية')) {
    return 'Second';
  }
  if (str.includes('third') || str.includes('3') || str.includes('ثالثة')) {
    return 'Third';
  }
  if (str.includes('fourth') || str.includes('4') || str.includes('رابعة') || str.includes('تخرج')) {
    return 'Fourth';
  }
  return 'Other';
}

/**
 * Formats date values safely from Excel serial numbers, ISO strings, or localized text
 */
export function parseDateValue(val: unknown): { formatted: string; rawDate?: Date } {
  if (!val) return { formatted: '-' };

  // If already a Date object
  if (val instanceof Date && !isNaN(val.getTime())) {
    return {
      formatted: val.toISOString().replace('T', ' ').substring(0, 16),
      rawDate: val
    };
  }

  // If Excel numeric timestamp
  if (typeof val === 'number') {
    try {
      const parsed = XLSX.SSF.parse_date_code(val);
      if (parsed) {
        const d = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d, parsed.H || 0, parsed.M || 0, parsed.S || 0));
        return {
          formatted: `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')} ${String(parsed.H || 0).padStart(2, '0')}:${String(parsed.M || 0).padStart(2, '0')}`,
          rawDate: d
        };
      }
    } catch {
      // Fallback
    }
  }

  const str = String(val).trim();
  const dateObj = new Date(str);
  if (!isNaN(dateObj.getTime()) && str.length > 5) {
    return {
      formatted: str.replace('T', ' ').substring(0, 19),
      rawDate: dateObj
    };
  }

  return { formatted: str };
}

/**
 * Parses XLSX or CSV file buffer directly in browser
 */
export async function parseSpreadsheetFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve({
            success: false,
            applicants: [],
            fileName: file.name,
            rowCount: 0,
            columnsDetected: [],
            error: 'الملف فارغ أو تعذر قراءة محتواه.'
          });
          return;
        }

        const workbook = XLSX.read(data, {
          type: 'binary',
          cellDates: true,
          dateNF: 'yyyy-mm-dd hh:mm'
        });

        // Pick first sheet
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          resolve({
            success: false,
            applicants: [],
            fileName: file.name,
            rowCount: 0,
            columnsDetected: [],
            error: 'لا توجد أوراق عمل (Sheets) داخل الملف المرفوع.'
          });
          return;
        }

        const worksheet = workbook.Sheets[sheetName];
        const rawJson: RawSpreadsheetRow[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          raw: false
        });

        if (!rawJson || rawJson.length === 0) {
          resolve({
            success: false,
            applicants: [],
            fileName: file.name,
            rowCount: 0,
            columnsDetected: [],
            error: 'ورقة العمل لا تحتوي على صفوف بيانات (Rows).'
          });
          return;
        }

        // Detect columns from first row
        const detectedKeys = Object.keys(rawJson[0]);
        const headerMap: { [canonical in keyof typeof COLUMN_ALIASES]?: string } = {};

        detectedKeys.forEach((key) => {
          const matched = matchHeader(key);
          if (matched && !headerMap[matched]) {
            headerMap[matched] = key;
          }
        });

        // Check essential columns: at least fullName and (skills or phone)
        const missing: string[] = [];
        if (!headerMap.fullName) missing.push('Full Name (الاسم)');
        if (!headerMap.mediaSkills && !headerMap.academicYear) missing.push('Media Skills / Academic Year (المهارات / الفرقة)');

        if (missing.length > 0) {
          resolve({
            success: false,
            applicants: [],
            fileName: file.name,
            rowCount: rawJson.length,
            columnsDetected: detectedKeys,
            missingColumns: missing,
            error: `الأعمدة الأساسية غير متوفرة في الجدول: ${missing.join(', ')}. يرجى التأكد من تحميل شيت التقديم الخاص بـ Google Sheets.`
          });
          return;
        }

        // Map rows to ApplicantRecord
        const applicants: ApplicantRecord[] = [];
        const seenPhones = new Set<string>();
        let duplicateCount = 0;

        rawJson.forEach((row, index) => {
          const nameVal = String(headerMap.fullName ? row[headerMap.fullName] : '').trim();
          if (!nameVal) return; // Skip empty rows

          const idVal = String(headerMap.id ? row[headerMap.id] : '').trim() || `ROW-${index + 1}`;
          const dateInfo = parseDateValue(headerMap.date ? row[headerMap.date] : '');
          const phoneVal = String(headerMap.phone ? row[headerMap.phone] : '').trim();
          const yearVal = String(headerMap.academicYear ? row[headerMap.academicYear] : '').trim();
          const skillsVal = splitMultiValue(headerMap.mediaSkills ? row[headerMap.mediaSkills] : '');
          const equipVal = splitMultiValue(headerMap.equipment ? row[headerMap.equipment] : '');
          const portfolioVal = String(headerMap.portfolioUrl ? row[headerMap.portfolioUrl] : '').trim();
          const statusVal = String(headerMap.status ? row[headerMap.status] : '').trim() || 'قيد المراجعة';

          const hasValidPortfolio = Boolean(
            portfolioVal &&
            portfolioVal.startsWith('http') &&
            portfolioVal !== 'لا يوجد'
          );

          if (phoneVal) {
            if (seenPhones.has(phoneVal)) duplicateCount++;
            seenPhones.add(phoneVal);
          }

          applicants.push({
            id: idVal,
            submissionDate: dateInfo.formatted,
            rawDate: dateInfo.rawDate,
            fullName: nameVal,
            phoneNumber: phoneVal,
            academicYear: yearVal || 'غير محدد',
            academicYearNormalized: normalizeAcademicYear(yearVal),
            mediaSkills: skillsVal,
            equipment: equipVal,
            portfolioUrl: portfolioVal,
            hasPortfolio: hasValidPortfolio,
            status: statusVal
          });
        });

        const warnings: string[] = [];
        if (duplicateCount > 0) {
          warnings.push(`تم رصد ${duplicateCount} أرقام هواتف مكررة في الجدول.`);
        }

        resolve({
          success: true,
          applicants,
          fileName: file.name,
          rowCount: applicants.length,
          columnsDetected: detectedKeys,
          warnings
        });

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        resolve({
          success: false,
          applicants: [],
          fileName: file.name,
          rowCount: 0,
          columnsDetected: [],
          error: `حدث خطأ أثناء معالجة ملف الإكسل: ${msg}`
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        applicants: [],
        fileName: file.name,
        rowCount: 0,
        columnsDetected: [],
        error: 'فشل المتصفح في قراءة الملف المحدد.'
      });
    };

    reader.readAsBinaryString(file);
  });
}

