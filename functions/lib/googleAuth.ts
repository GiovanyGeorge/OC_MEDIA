/**
 * Google OAuth 2.0 Service Account Authentication using Web Crypto API.
 * Runs in Cloudflare Workers / Pages Functions with zero external dependencies.
 */

interface CachedToken {
  accessToken: string;
  expiresAt: number; // Unix timestamp in ms
}

let tokenCache: CachedToken | null = null;

/**
 * Base64URL encoding helper.
 */
function base64UrlEncode(data: Uint8Array | string): string {
  let binary = '';
  if (typeof data === 'string') {
    const bytes = new TextEncoder().encode(data);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
  } else {
    for (let i = 0; i < data.byteLength; i++) {
      binary += String.fromCharCode(data[i]);
    }
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Converts a PEM-formatted PKCS#8 private key string to an ArrayBuffer.
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  // Normalize escaped newlines from environment variables
  const cleanPem = pem
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----/g, '')
    .replace(/-----END (?:RSA )?PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');

  const binaryString = atob(cleanPem);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export interface GoogleServiceAccountCredentials {
  clientEmail: string;
  privateKey: string;
}

/**
 * Parses Service Account credentials from environment or JSON.
 */
export function parseServiceAccount(
  env: Record<string, any>
): GoogleServiceAccountCredentials {
  if (env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      const parsed = typeof env.GOOGLE_SERVICE_ACCOUNT_JSON === 'string'
        ? JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON)
        : env.GOOGLE_SERVICE_ACCOUNT_JSON;
      return {
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key,
      };
    } catch (err) {
      throw new Error(`Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON: ${(err as Error).message}`);
    }
  }

  if (env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_PRIVATE_KEY) {
    return {
      clientEmail: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: env.GOOGLE_PRIVATE_KEY,
    };
  }

  throw new Error(
    'Missing Google Service Account credentials. Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY.'
  );
}

const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/identitytoolkit',
  'https://www.googleapis.com/auth/datastore',
].join(' ');

/**
 * Generates an OAuth 2.0 access token using Web Crypto RS256 JWT signing.
 */
export async function getGoogleAccessToken(
  credentials: GoogleServiceAccountCredentials,
  forceRefresh = false
): Promise<string> {
  const nowMs = Date.now();
  // Return cached token if valid for at least 5 more minutes
  if (!forceRefresh && tokenCache && tokenCache.expiresAt > nowMs + 300_000) {
    return tokenCache.accessToken;
  }

  const nowSec = Math.floor(nowMs / 1000);
  const expSec = nowSec + 3600; // 1 hour token lifetime

  // 1. Prepare JWT Header and Claims
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const claims = {
    iss: credentials.clientEmail,
    scope: REQUIRED_SCOPES,
    aud: 'https://oauth2.googleapis.com/token',
    exp: expSec,
    iat: nowSec,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaims = base64UrlEncode(JSON.stringify(claims));
  const signInput = `${encodedHeader}.${encodedClaims}`;

  // 2. Import Private Key via Web Crypto API
  const keyBuffer = pemToArrayBuffer(credentials.privateKey);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // 3. Sign JWT
  const encoder = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signInput)
  );

  const encodedSignature = base64UrlEncode(new Uint8Array(signatureBuffer));
  const jwt = `${signInput}.${encodedSignature}`;

  // 4. Exchange JWT for Google OAuth2 Access Token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text();
    throw new Error(`Google OAuth2 token exchange failed [${tokenResponse.status}]: ${errorBody}`);
  }

  const tokenData = (await tokenResponse.json()) as {
    access_token: string;
    expires_in: number;
    token_type: string;
  };

  tokenCache = {
    accessToken: tokenData.access_token,
    expiresAt: nowMs + tokenData.expires_in * 1000,
  };

  return tokenCache.accessToken;
}
