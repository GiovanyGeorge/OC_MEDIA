/**
 * Cloudflare Pages Functions Global Middleware
 * - CORS restriction to authorized origins
 * - Security response headers
 * - Request size limiting (64 KB max)
 * - Centralized error handling
 */

interface Env {
  ALLOWED_ORIGINS?: string;
  [key: string]: any;
}

const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
];

function getAllowedOrigin(request: Request, env: Env): string | null {
  const origin = request.headers.get('Origin');
  if (!origin) return null;

  const configured = env.ALLOWED_ORIGINS
    ? env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : [];

  const allowedList = [...DEFAULT_ORIGINS, ...configured];

  if (allowedList.includes(origin) || origin.endsWith('.pages.dev')) {
    return origin;
  }

  return null;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;

  const allowedOrigin = getAllowedOrigin(request, env);

  // Handle CORS preflight (OPTIONS)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Request size limit enforcement (max 64 KB)
  const contentLength = request.headers.get('Content-Length');
  if (contentLength && parseInt(contentLength, 10) > 65_536) {
    return new Response(
      JSON.stringify({ error: 'حجم الطلب يتجاوز الحد المسموح به (64KB)' }),
      {
        status: 413,
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
      }
    );
  }

  try {
    const response = await next();

    // Attach security headers and CORS to response
    const headers = new Headers(response.headers);
    if (allowedOrigin) {
      headers.set('Access-Control-Allow-Origin', allowedOrigin);
      headers.set('Vary', 'Origin');
    }
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: 'حدث خطأ غير متوقع أثناء معالجة الطلب',
        message: err?.message || 'Internal Server Error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin } : {}),
        },
      }
    );
  }
};
