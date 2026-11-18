/**
 * API Client — OC Media Platform
 * Phase 3: HTTP client for Cloudflare Pages Functions endpoints.
 * Automatically attaches Firebase Auth ID token for authenticated requests.
 */

import { auth, firebaseReady } from './firebase';

// ---------------------------------------------------------------------------
// Base URL — Cloudflare Pages Functions are co-hosted at the same origin.
// In development, Vite proxies /api/* to the Pages Functions dev server.
// ---------------------------------------------------------------------------

async function getIdToken(): Promise<string | null> {
  if (!firebaseReady || !auth.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken();
  } catch {
    return null;
  }
}

interface ApiResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
}

async function apiRequest<T = unknown>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  requireAuth = true,
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (requireAuth) {
    const token = await getIdToken();
    if (!token) throw new Error('NOT_AUTHENTICATED');
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({})) as T;
  return { ok: res.ok, status: res.status, data };
}

// ---------------------------------------------------------------------------
// Admin API endpoints (all require admin auth)
// ---------------------------------------------------------------------------

export interface IssueCodeRequest {
  referenceId: string;
  ttlDays?: number;
}

export interface IssueCodeResponse {
  success: boolean;
  activationCode?: string;
  expiresAt?: string;
  ttlDays?: number;
  error?: string;
}

export async function issueActivationCode(req: IssueCodeRequest): Promise<ApiResponse<IssueCodeResponse>> {
  return apiRequest<IssueCodeResponse>('POST', '/api/admin/issue-code', req);
}

export interface SuspendMemberRequest {
  uid?: string;
  referenceId?: string;
}

export interface SuspendMemberResponse {
  success: boolean;
  error?: string;
}

export async function suspendMember(req: SuspendMemberRequest): Promise<ApiResponse<SuspendMemberResponse>> {
  return apiRequest<SuspendMemberResponse>('POST', '/api/admin/suspend-member', req);
}

export interface ReconcileOrphanRequest {
  referenceId: string;
  action: 'delete_orphan_auth' | 'complete_member_doc';
}

export interface ReconcileOrphanResponse {
  success: boolean;
  error?: string;
}

export async function reconcileOrphan(req: ReconcileOrphanRequest): Promise<ApiResponse<ReconcileOrphanResponse>> {
  return apiRequest<ReconcileOrphanResponse>('POST', '/api/admin/reconcile-orphan', req);
}

// ---------------------------------------------------------------------------
// Public API endpoints
// ---------------------------------------------------------------------------

export interface ActivateRequest {
  referenceId: string;
  activationCode: string;
  password: string;
}

export interface ActivateResponse {
  success: boolean;
  uid?: string;
  error?: string;
}

export async function activateAccount(req: ActivateRequest): Promise<ApiResponse<ActivateResponse>> {
  return apiRequest<ActivateResponse>('POST', '/api/activate', req, false);
}
