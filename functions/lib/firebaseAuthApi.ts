/**
 * Firebase Identity Toolkit API (Firebase Auth Administrative REST API)
 * Uses standard Google Cloud REST endpoints with OAuth2 Bearer token authentication.
 *
 * Requirements:
 * - Free / Spark tier compatible (standard Google Cloud API included with Firebase).
 * - Administrative account creation, disabling, lookup, and deletion.
 */

export interface CreateUserParams {
  email: string;
  password: string;
  displayName?: string;
  disabled?: boolean;
}

export interface AuthUserRecord {
  localId: string; // Firebase Auth UID
  email: string;
  displayName?: string;
  disabled: boolean;
}

/**
 * Creates a new Firebase Authentication user administratively.
 *
 * API Endpoint: POST https://identitytoolkit.googleapis.com/v1/projects/{projectId}/accounts
 * Scope: https://www.googleapis.com/auth/identitytoolkit
 * IAM Role: Firebase Authentication Admin / Service Account Token Creator
 */
export async function createAuthUser(
  accessToken: string,
  projectId: string,
  params: CreateUserParams
): Promise<AuthUserRecord> {
  const url = `https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/accounts`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      displayName: params.displayName || '',
      emailVerified: true,
      disabled: params.disabled || false,
    }),
  });

  const data = (await response.json()) as any;

  if (!response.ok) {
    const errorCode = data?.error?.message || 'UNKNOWN_ERROR';
    if (errorCode.includes('EMAIL_EXISTS')) {
      throw new Error('EMAIL_EXISTS');
    }
    throw new Error(`Firebase Auth create account failed [${response.status}]: ${errorCode}`);
  }

  return {
    localId: data.localId,
    email: data.email,
    displayName: data.displayName,
    disabled: Boolean(data.disabled),
  };
}

/**
 * Disables a user's Firebase Auth account (used during suspension).
 *
 * API Endpoint: POST https://identitytoolkit.googleapis.com/v1/projects/{projectId}/accounts:update
 */
export async function disableAuthUser(
  accessToken: string,
  projectId: string,
  uid: string
): Promise<void> {
  const url = `https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/accounts:update`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      localId: uid,
      disableUser: true,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Firebase Auth disable user failed [${response.status}]: ${errorBody}`);
  }
}

/**
 * Deletes a Firebase Auth account (used strictly for compensating rollback if Firestore fails).
 *
 * API Endpoint: POST https://identitytoolkit.googleapis.com/v1/projects/{projectId}/accounts:delete
 */
export async function deleteAuthUser(
  accessToken: string,
  projectId: string,
  uid: string
): Promise<void> {
  const url = `https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/accounts:delete`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      localId: uid,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Firebase Auth delete user failed [${response.status}]: ${errorBody}`);
  }
}

/**
 * Looks up a user by email or UID.
 *
 * API Endpoint: POST https://identitytoolkit.googleapis.com/v1/projects/{projectId}/accounts:lookup
 */
export async function lookupAuthUser(
  accessToken: string,
  projectId: string,
  query: { localId?: string; email?: string }
): Promise<AuthUserRecord | null> {
  const url = `https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/accounts:lookup`;

  const body: Record<string, string[]> = {};
  if (query.localId) body.localId = [query.localId];
  if (query.email) body.email = [query.email];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as any;
  const user = data?.users?.[0];
  if (!user) {
    return null;
  }

  return {
    localId: user.localId,
    email: user.email,
    displayName: user.displayName,
    disabled: Boolean(user.disabled),
  };
}

/**
 * Verifies a client-supplied Firebase ID token using Google Identity Toolkit REST API.
 * Validates expiration, signature, and project ID without needing third-party JWT libraries.
 */
export async function verifyFirebaseIdToken(
  accessToken: string,
  projectId: string,
  idToken: string
): Promise<{ uid: string; email?: string }> {
  const url = `https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/accounts:lookup`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idToken: idToken,
    }),
  });

  if (!response.ok) {
    throw new Error('INVALID_ID_TOKEN');
  }

  const data = (await response.json()) as any;
  const user = data?.users?.[0];
  if (!user || !user.localId) {
    throw new Error('INVALID_ID_TOKEN');
  }

  return {
    uid: user.localId,
    email: user.email,
  };
}
