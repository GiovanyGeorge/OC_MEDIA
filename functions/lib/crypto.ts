/**
 * Cryptographic Utilities for OC Media Activation
 * Uses Web Crypto API (supported natively in Cloudflare Workers & modern Node.js).
 */

// Human-friendly alphabet excluding easily confused characters: 0, O, 1, I, L
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Generates a cryptographically secure random activation code with >= 128 bits of entropy.
 * Format: OC-XXXX-XXXX-XXXX-XXXX (16 Crockford-style characters = 16 * 5 = 80 bits minimum per chunk,
 * using 128 bits of pure cryptographic randomness from crypto.getRandomValues).
 */
export function generateActivationCode(): string {
  // 16 bytes = 128 bits of cryptographic randomness
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);

  let chars = '';
  for (let i = 0; i < 16; i++) {
    // Map each byte into the 32-character alphabet
    chars += CODE_ALPHABET[randomBytes[i] % CODE_ALPHABET.length];
  }

  // Format into 4 groups of 4 characters: OC-XXXX-XXXX-XXXX-XXXX
  return `OC-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}-${chars.slice(12, 16)}`;
}

/**
 * Normalizes an activation code string for consistent hashing.
 * Removes leading/trailing spaces, converts to uppercase, replaces em-dashes.
 */
export function normalizeActivationCode(code: string): string {
  return code
    .trim()
    .toUpperCase()
    .replace(/[\u2010-\u2015]/g, '-') // Replace unicode dashes
    .replace(/\s+/g, '');
}

/**
 * Converts an ArrayBuffer to a hexadecimal string.
 */
function bufferToHex(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer);
  let hexString = '';
  for (let i = 0; i < byteArray.length; i++) {
    hexString += byteArray[i].toString(16).padStart(2, '0');
  }
  return hexString;
}

/**
 * Computes a keyed HMAC-SHA256 hex digest of the normalized activation code.
 * Storing only the HMAC prevents rainbow table attacks and guarantees that
 * even if the database is read, codes cannot be reversed without the secret.
 */
export async function computeCodeHmac(code: string, secret: string): Promise<string> {
  const normalized = normalizeActivationCode(code);
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(normalized);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return bufferToHex(signature);
}

/**
 * Timing-safe string comparison to prevent timing attacks.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates member password strength policy.
 * - Minimum 8 characters, maximum 128 characters
 * - At least one uppercase English letter (A-Z)
 * - At least one lowercase English letter (a-z)
 * - At least one digit (0-9)
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['كلمة المرور مطلوبة'] };
  }

  if (password.length < 8) {
    errors.push('يجب ألا تقل كلمة المرور عن 8 أحرف');
  }
  if (password.length > 128) {
    errors.push('يجب ألا تزيد كلمة المرور عن 128 حرفاً');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل (A-Z)');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('يجب أن تحتوي كلمة المرور على حرف صغير واحد على الأقل (a-z)');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('يجب أن تحتوي كلمة المرور على رقم واحد على الأقل (0-9)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generates the agreed synthetic internal email address for a member.
 * e.g. "OC-2026-0001" -> "oc-2026-0001@ocmedia.internal"
 */
export function generateSyntheticEmail(referenceId: string): string {
  const cleanRef = referenceId.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
  return `${cleanRef}@ocmedia.internal`;
}
