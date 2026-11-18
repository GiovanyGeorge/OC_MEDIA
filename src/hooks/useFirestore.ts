/**
 * Firestore Client Hooks — OC Media Platform
 * Phase 3: Client-side reads for Admin & Member dashboards.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  where,
} from 'firebase/firestore';
import { db, firebaseReady } from '../lib/firebase';
import type {
  ApplicationDocument,
  MemberDocument,
  PortfolioDocument,
  EvaluationDocument,
} from '../lib/firebaseTypes';

// ---------------------------------------------------------------------------
// Hook: Fetch All Applications (Admin only)
// ---------------------------------------------------------------------------
export function useApplications() {
  const [applications, setApplications] = useState<ApplicationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => d.data() as ApplicationDocument);
      setApplications(docs);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'FAILED_TO_LOAD');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const updateApplicationStatus = async (referenceId: string, status: 'approved' | 'rejected') => {
    if (!firebaseReady) throw new Error('FIREBASE_NOT_CONFIGURED');
    const docRef = doc(db, 'applications', referenceId);
    await updateDoc(docRef, {
      status,
      activationStatus: status === 'approved' ? 'approved' : undefined,
      updatedAt: serverTimestamp(),
    });
    await reload();
  };

  return { applications, loading, error, reload, updateApplicationStatus };
}

// ---------------------------------------------------------------------------
// Hook: Fetch All Members (Admin only)
// ---------------------------------------------------------------------------
export function useMembers() {
  const [members, setMembers] = useState<MemberDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'members'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => d.data() as MemberDocument);
      setMembers(docs);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'FAILED_TO_LOAD');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { members, loading, error, reload };
}

// ---------------------------------------------------------------------------
// Hook: Member Portfolios (Member or Admin)
// ---------------------------------------------------------------------------
export function usePortfolios(targetUid?: string) {
  const [portfolios, setPortfolios] = useState<PortfolioDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!firebaseReady || !targetUid) {
      setPortfolios([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'portfolios'),
        where('memberUid', '==', targetUid)
      );
      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => ({
        ...d.data(),
        itemId: d.id,
      })) as PortfolioDocument[];
      setPortfolios(docs);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'FAILED_TO_LOAD');
    } finally {
      setLoading(false);
    }
  }, [targetUid]);

  useEffect(() => {
    reload();
  }, [reload]);

  const addPortfolio = async (item: Omit<PortfolioDocument, 'itemId' | 'createdAt' | 'updatedAt'>) => {
    if (!firebaseReady) throw new Error('FIREBASE_NOT_CONFIGURED');
    const docRef = await addDoc(collection(db, 'portfolios'), {
      ...item,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    // Write back the generated itemId
    await updateDoc(docRef, { itemId: docRef.id });
    await reload();
  };

  const updatePortfolio = async (itemId: string, item: Partial<PortfolioDocument>) => {
    if (!firebaseReady) throw new Error('FIREBASE_NOT_CONFIGURED');
    const docRef = doc(db, 'portfolios', itemId);
    const { itemId: _id, memberUid: _uid, createdAt: _c, ...updateFields } = item;
    await updateDoc(docRef, {
      ...updateFields,
      updatedAt: serverTimestamp(),
    });
    await reload();
  };

  const deletePortfolio = async (itemId: string) => {
    if (!firebaseReady) throw new Error('FIREBASE_NOT_CONFIGURED');
    const docRef = doc(db, 'portfolios', itemId);
    await deleteDoc(docRef);
    await reload();
  };

  return { portfolios, loading, error, reload, addPortfolio, updatePortfolio, deletePortfolio };
}

// ---------------------------------------------------------------------------
// Hook: Member Profile update (restricted to permitted fields)
// ---------------------------------------------------------------------------
export function useMemberProfile(uid?: string) {
  const [updating, setUpdating] = useState(false);

  const updatePermittedProfile = async (updates: {
    currentSkills?: string[];
    currentEquipment?: string[];
    phone?: string;
    bio?: string;
  }) => {
    if (!firebaseReady || !uid) throw new Error('NOT_READY');
    setUpdating(true);
    try {
      const docRef = doc(db, 'members', uid);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } finally {
      setUpdating(false);
    }
  };

  return { updatePermittedProfile, updating };
}

// ---------------------------------------------------------------------------
// Hook: Member Evaluations (Read by owner)
// ---------------------------------------------------------------------------
export function useEvaluations(targetUid?: string) {
  const [evaluation, setEvaluation] = useState<EvaluationDocument | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!firebaseReady || !targetUid) {
      setEvaluation(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const q = query(collection(db, 'evaluations'), where('targetUid', '==', targetUid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setEvaluation(snap.docs[0].data() as EvaluationDocument);
      } else {
        setEvaluation(null);
      }
    } catch {
      setEvaluation(null);
    } finally {
      setLoading(false);
    }
  }, [targetUid]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { evaluation, loading, reload };
}
