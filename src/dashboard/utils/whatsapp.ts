export const DEFAULT_WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/F1eGCSLPt8YCcpMO3HDxea';

/**
 * Normalizes phone numbers to WhatsApp international format for Egypt (+20)
 */
export function formatWhatsAppPhone(phone: string): string {
  // Remove spaces, dashes, plus signs, brackets
  let cleaned = String(phone || '').replace(/[\s\-\+\(\)]/g, '');

  // If starts with 002, strip 00
  if (cleaned.startsWith('002')) {
    cleaned = cleaned.substring(2);
  }

  // If starts with 20 (country code), keep it
  if (cleaned.startsWith('20') && cleaned.length >= 12) {
    return cleaned;
  }

  // If starts with 01 (Egyptian mobile format: 010, 011, 012, 015)
  if (cleaned.startsWith('01')) {
    return '20' + cleaned.substring(1);
  }

  // If starts with 1 (without the 0) e.g. 1012345678
  if (cleaned.startsWith('1') && cleaned.length === 10) {
    return '20' + cleaned;
  }

  return cleaned;
}

/**
 * Generates the unified, friendly welcome message with the Media 2026 group link
 */
export function generateWelcomeMessage(
  applicantName: string,
  groupLink: string = DEFAULT_WHATSAPP_GROUP_URL
): string {
  // Get first name for warm personal greeting
  const firstName = applicantName ? applicantName.split(/\s+/)[0] : '';
  const greetingName = firstName ? `يا ${firstName}` : '';

  return `أهلاً بك ${greetingName} 👋
معاك فريق لجنة الإعلام (OC Media 2026) — كلية الحاسبات والذكاء الاصطناعي، جامعة العاصمة 🎬📸

سعداء جداً بانضمامك لينا! ✨
ده لينك الجروب الرسمي الخاص بفريق الميديا لموسم 2026 علشان نبدأ ننسق الأنشطة والمهام وتوزيع الشغل:
👉 ${groupLink}

منور الفريق، ومتحمسين للشغل سوا! 🚀`;
}

/**
 * Opens WhatsApp Web or desktop with the pre-filled message
 */
export function openWhatsAppChat(phone: string, message: string): void {
  const formattedNumber = formatWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodedText}`;
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
}
