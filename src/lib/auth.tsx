/**
 * Authentication Context — OC Media Platform
 * Phase 3: Firebase Auth state management, login/logout, role resolution.
 *
 * Admin verification: After Firebase Auth sign-in, the client reads
 * adminUsers/{uid} from Firestore. If the doc exists → admin.
 * This relies on Firestore rules: only admins can read adminUsers.
 *
 * Member verification: Convert referenceId → synthetic email, sign in,
 * read members/{uid} to get profile and confirm accountStatus !== 'suspended'.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, firebaseReady } from './firebase';
import type { MemberDocument, MemberRole } from './firebaseTypes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthUser {
  uid: string;
  email: string | null;
  role: MemberRole;
  memberProfile?: MemberDocument;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  loginAdmin: (email: string, password: string) => Promise<void>;
  loginMember: (referenceId: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert reference ID to the synthetic email used by the activation system. */
export function toSyntheticEmail(referenceId: string): string {
  return `${referenceId.toLowerCase()}@ocmedia.internal`;
}

/** Resolve the user's role by probing Firestore. */
async function resolveRole(uid: string): Promise<{ role: MemberRole; memberProfile?: MemberDocument }> {
  // Try admin first
  try {
    const adminSnap = await getDoc(doc(db, 'adminUsers', uid));
    if (adminSnap.exists()) {
      return { role: 'admin' };
    }
  } catch {
    // Permission denied → not admin (expected for members)
  }

  // Try member
  try {
    const memberSnap = await getDoc(doc(db, 'members', uid));
    if (memberSnap.exists()) {
      const profile = memberSnap.data() as MemberDocument;
      if (profile.accountStatus === 'suspended') {
        throw new Error('ACCOUNT_SUSPENDED');
      }
      return { role: 'member', memberProfile: profile };
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'ACCOUNT_SUSPENDED') throw err;
    // Permission denied or doc doesn't exist
  }

  // If neither admin nor member doc found — no recognized role
  throw new Error('NO_ROLE');
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen to Firebase Auth state
  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser: User | null) => {
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const { role, memberProfile } = await resolveRole(fbUser.uid);
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          role,
          memberProfile,
        });
      } catch {
        // No valid role — sign out silently
        await firebaseSignOut(auth);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ---- Admin Login ----------------------------------------------------------
  const loginAdmin = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      if (!firebaseReady) throw new Error('FIREBASE_NOT_CONFIGURED');
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // Verify admin role
      try {
        const adminSnap = await getDoc(doc(db, 'adminUsers', cred.user.uid));
        if (!adminSnap.exists()) {
          await firebaseSignOut(auth);
          throw new Error('NOT_ADMIN');
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'NOT_ADMIN') throw err;
        // Permission denied reading adminUsers → not an admin
        await firebaseSignOut(auth);
        throw new Error('NOT_ADMIN');
      }

      setUser({
        uid: cred.user.uid,
        email: cred.user.email,
        role: 'admin',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (msg === 'NOT_ADMIN') {
        setError('NOT_ADMIN');
      } else if (msg === 'FIREBASE_NOT_CONFIGURED') {
        setError('FIREBASE_NOT_CONFIGURED');
      } else if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) {
        setError('INVALID_CREDENTIALS');
      } else if (msg.includes('auth/too-many-requests')) {
        setError('TOO_MANY_REQUESTS');
      } else {
        setError('UNKNOWN_ERROR');
      }
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ---- Member Login ---------------------------------------------------------
  const loginMember = useCallback(async (referenceId: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      if (!firebaseReady) throw new Error('FIREBASE_NOT_CONFIGURED');
      const syntheticEmail = toSyntheticEmail(referenceId);
      const cred = await signInWithEmailAndPassword(auth, syntheticEmail, password);

      // Read member profile
      const memberSnap = await getDoc(doc(db, 'members', cred.user.uid));
      if (!memberSnap.exists()) {
        await firebaseSignOut(auth);
        throw new Error('NO_MEMBER_PROFILE');
      }

      const profile = memberSnap.data() as MemberDocument;
      if (profile.accountStatus === 'suspended') {
        await firebaseSignOut(auth);
        throw new Error('ACCOUNT_SUSPENDED');
      }

      setUser({
        uid: cred.user.uid,
        email: cred.user.email,
        role: 'member',
        memberProfile: profile,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (msg === 'ACCOUNT_SUSPENDED') {
        setError('ACCOUNT_SUSPENDED');
      } else if (msg === 'NO_MEMBER_PROFILE') {
        setError('NO_MEMBER_PROFILE');
      } else if (msg === 'FIREBASE_NOT_CONFIGURED') {
        setError('FIREBASE_NOT_CONFIGURED');
      } else if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) {
        setError('INVALID_CREDENTIALS');
      } else if (msg.includes('auth/too-many-requests')) {
        setError('TOO_MANY_REQUESTS');
      } else {
        setError('UNKNOWN_ERROR');
      }
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ---- Logout ---------------------------------------------------------------
  const logout = useCallback(async () => {
    setError(null);
    if (firebaseReady) {
      await firebaseSignOut(auth);
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, loginAdmin, loginMember, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
