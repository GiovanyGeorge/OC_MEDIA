/**
 * Cloud Firestore REST API Client for Cloudflare Workers / Pages Functions
 *
 * Implements low-overhead JSON serialization to/from Google Firestore REST format.
 * Base URL: https://firestore.googleapis.com/v1/projects/{projectId}/databases/(default)/documents
 */

/**
 * Converts a JavaScript value into Firestore REST value representation.
 */
export function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === 'boolean') {
    return { booleanValue: val };
  }
  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return { integerValue: val.toString() };
    }
    return { doubleValue: val };
  }
  if (typeof val === 'string') {
    return { stringValue: val };
  }
  if (val instanceof Date) {
    return { timestampValue: val.toISOString() };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(toFirestoreValue),
      },
    };
  }
  if (typeof val === 'object') {
    // Check if it's already a Firestore timestamp or special object
    if (val._seconds !== undefined && val._nanoseconds !== undefined) {
      return { timestampValue: new Date(val._seconds * 1000).toISOString() };
    }
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        fields[k] = toFirestoreValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

/**
 * Converts Firestore REST value representation into a JavaScript value.
 */
export function fromFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') {
    return null;
  }
  if ('nullValue' in val) return null;
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('stringValue' in val) return String(val.stringValue);
  if ('timestampValue' in val) return new Date(val.timestampValue);
  if ('arrayValue' in val) {
    return (val.arrayValue.values || []).map(fromFirestoreValue);
  }
  if ('mapValue' in val) {
    const obj: Record<string, any> = {};
    const fields = val.mapValue.fields || {};
    for (const [k, v] of Object.entries(fields)) {
      obj[k] = fromFirestoreValue(v);
    }
    return obj;
  }
  return null;
}

export function toFirestoreDocument(data: Record<string, any>): { fields: Record<string, any> } {
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields[key] = toFirestoreValue(value);
    }
  }
  return { fields };
}

export function fromFirestoreDocument(doc: any): Record<string, any> {
  if (!doc || !doc.fields) {
    return {};
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(doc.fields)) {
    result[key] = fromFirestoreValue(value);
  }
  return result;
}

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1';

/**
 * Retrieves a document from Firestore. Returns null if not found (404).
 */
export async function getDocument<T = Record<string, any>>(
  accessToken: string,
  projectId: string,
  collection: string,
  documentId: string
): Promise<T | null> {
  const url = `${FIRESTORE_BASE}/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${encodeURIComponent(collection)}/${encodeURIComponent(documentId)}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Firestore getDocument failed [${res.status}]: ${errorBody}`);
  }

  const rawDoc = (await res.json()) as any;
  return fromFirestoreDocument(rawDoc) as T;
}

/**
 * Creates a new document with an explicit documentId.
 */
export async function createDocument<T = Record<string, any>>(
  accessToken: string,
  projectId: string,
  collection: string,
  documentId: string,
  data: Record<string, any>
): Promise<T> {
  const url = `${FIRESTORE_BASE}/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${encodeURIComponent(collection)}?documentId=${encodeURIComponent(documentId)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(toFirestoreDocument(data)),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Firestore createDocument failed [${res.status}]: ${errorBody}`);
  }

  const rawDoc = (await res.json()) as any;
  return fromFirestoreDocument(rawDoc) as T;
}

/**
 * Updates/patches specific fields in an existing document.
 */
export async function patchDocument<T = Record<string, any>>(
  accessToken: string,
  projectId: string,
  collection: string,
  documentId: string,
  data: Record<string, any>,
  updateMaskFields?: string[],
  precondition?: { exists?: boolean; updateTime?: string }
): Promise<T> {
  const fields = updateMaskFields || Object.keys(data);
  const queryParams = new URLSearchParams();
  for (const field of fields) {
    queryParams.append('updateMask.fieldPaths', field);
  }

  if (precondition?.exists !== undefined) {
    queryParams.append('currentDocument.exists', String(precondition.exists));
  }
  if (precondition?.updateTime) {
    queryParams.append('currentDocument.updateTime', precondition.updateTime);
  }

  const url = `${FIRESTORE_BASE}/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${encodeURIComponent(collection)}/${encodeURIComponent(documentId)}?${queryParams.toString()}`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(toFirestoreDocument(data)),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Firestore patchDocument failed [${res.status}]: ${errorBody}`);
  }

  const rawDoc = (await res.json()) as any;
  return fromFirestoreDocument(rawDoc) as T;
}
