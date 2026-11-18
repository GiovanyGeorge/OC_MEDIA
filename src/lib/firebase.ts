/**
 * Firebase Foundation — OC Media Platform
 * Phase 1: Firebase App, Auth, and Firestore initialization.
 *
 * Security notes:
 * - Only PUBLIC Firebase config keys are stored here (via Vite env vars).
 * - Firebase Web API keys are project identifiers, NOT secret credentials.
 * - Service account private keys are NEVER placed in this file or any
 *   frontend bundle. They live exclusively in Cloudflare Secrets.
 * - Account creation goes through a trusted Cloudflare Pages Function backend.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// ---------------------------------------------------------------------------
// Firebase project configuration (all public — safe to ship in frontend)
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// ---------------------------------------------------------------------------
// Guard: warn when env vars are absent (dev convenience, never crashes app)
// ---------------------------------------------------------------------------
const REQUIRED_VARS: (keyof typeof firebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'messagingSenderId',
  'appId',
];

const missingVars = REQUIRED_VARS.filter((k) => !firebaseConfig[k]);

export const firebaseReady = missingVars.length === 0;

if (!firebaseReady) {
  console.warn(
    '[firebase.ts] Firebase configuration is incomplete. ' +
      'Missing env vars: ' +
      missingVars.map((k) => `VITE_FIREBASE_${k.replace(/([A-Z])/g, '_$1').toUpperCase()}`).join(', ') +
      '. ' +
      'Copy .env.example → .env and fill in your Firebase project credentials. ' +
      'Existing app features (recruitment form, admin dashboard) remain fully functional.'
  );
}

// ---------------------------------------------------------------------------
// Singleton initialization — prevents duplicate Firebase app errors
// ---------------------------------------------------------------------------
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (firebaseReady) {
  // Use existing app if already initialized (e.g. HMR in Vite dev mode)
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  // Cast placeholders so TypeScript callers still compile cleanly.
  // Any code that calls auth/db methods MUST check `firebaseReady` first.
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
}

export { app, auth, db };
