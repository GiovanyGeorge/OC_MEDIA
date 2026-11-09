import { SubmissionPayload, SubmissionResult } from '../types/recruitment';

export const APPS_SCRIPT_URL: string = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || '';

export const isBackendConfigured = (): boolean => {
  return Boolean(
    APPS_SCRIPT_URL &&
    APPS_SCRIPT_URL.trim() !== '' &&
    APPS_SCRIPT_URL.startsWith('https://script.google.com/')
  );
};

/**
 * Converts a browser File object to a Base64 data string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('فشل قراءة الملف كـ Base64'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Submits applicant data to Google Apps Script backend
 */
export const submitRecruitmentForm = async (
  payload: SubmissionPayload
): Promise<SubmissionResult> => {
  if (!isBackendConfigured()) {
    throw new Error(
      'لم يتم ربط رابط Google Apps Script بعد. يرجى تهيئة متغير البيئة VITE_GOOGLE_APPS_SCRIPT_URL في ملف .env.'
    );
  }

  try {
    // We send payload as text/plain to avoid CORS preflight issues with Google Apps Script
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`خطأ في استجابة الخادم: كود ${response.status}`);
    }

    const result: SubmissionResult = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'فشلت عملية حفظ الطلب في Google Sheets');
    }

    return result;
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Re-throw descriptive error
      throw error;
    }
    throw new Error('حدث خطأ أثناء الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت وإعادة المحاولة.');
  }
};

/**
 * Health check / ping test to verify backend script deployment
 */
export const pingBackend = async (): Promise<{ success: boolean; status?: string; message?: string }> => {
  if (!isBackendConfigured()) {
    return {
      success: false,
      message: 'رابط Apps Script غير مهيأ بعد',
    };
  }

  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=ping`, {
      method: 'GET',
    });
    if (!response.ok) {
      return { success: false, message: `HTTP ${response.status}` };
    }
    const data = await response.json();
    return data;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: msg };
  }
};

