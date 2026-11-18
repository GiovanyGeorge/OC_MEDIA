/**
 * Firestore Security Rules Tests — OC Media Platform
 * Phase 1: 10 security test cases against the production rules.
 *
 * Run with Firebase Emulator Suite:
 *   npx firebase emulators:start --only firestore,auth
 *   npx jest tests/firestore.rules.test.ts
 *
 * Or use the helper script:
 *   npm run test:rules
 */

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
} from 'firebase/firestore';

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

let testEnv: RulesTestEnvironment;

const RULES_PATH = join(process.cwd(), 'firestore.rules');

/** Seed data written by the Admin SDK (bypasses rules) */
async function seedDatabase(testEnv: RulesTestEnvironment) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();

    // Seed adminUsers
    await setDoc(doc(db, 'adminUsers', 'admin_uid_1'), {
      uid: 'admin_uid_1',
      email: 'admin@ocmedia.internal',
      displayName: 'OC Admin',
      grantedAt: new Date(),
      grantedBy: 'system',
    });

    // Seed approved application
    await setDoc(doc(db, 'applications', 'OC-2026-0001'), {
      referenceId: 'OC-2026-0001',
      fullName: 'Ahmed Mohamed',
      phone: '01012345678',
      academicYear: 'second',
      skills: ['photography'],
      equipment: ['camera'],
      hasPortfolio: false,
      status: 'approved',
      isActivated: true,
      activationStatus: 'active',
      memberUid: 'member_uid_1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Seed member 1 (active)
    await setDoc(doc(db, 'members', 'member_uid_1'), {
      uid: 'member_uid_1',
      referenceId: 'OC-2026-0001',
      fullName: 'Ahmed Mohamed',
      email: 'oc-2026-0001@ocmedia.internal',
      phone: '01012345678',
      role: 'member',
      accountStatus: 'active',
      academicYear: 'second',
      currentSkills: ['photography'],
      currentEquipment: ['camera'],
      createdAt: new Date(),
      updatedAt: new Date(),
      activatedAt: new Date(),
    });

    // Seed member 2 (active, different user)
    await setDoc(doc(db, 'members', 'member_uid_2'), {
      uid: 'member_uid_2',
      referenceId: 'OC-2026-0002',
      fullName: 'Sara Ali',
      email: 'oc-2026-0002@ocmedia.internal',
      phone: '01098765432',
      role: 'member',
      accountStatus: 'active',
      academicYear: 'third',
      currentSkills: ['video-editing'],
      currentEquipment: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      activatedAt: new Date(),
    });

    // Seed suspended member
    await setDoc(doc(db, 'members', 'suspended_uid'), {
      uid: 'suspended_uid',
      referenceId: 'OC-2026-0003',
      fullName: 'Suspended User',
      email: 'oc-2026-0003@ocmedia.internal',
      phone: '01011111111',
      role: 'member',
      accountStatus: 'suspended',
      academicYear: 'first',
      currentSkills: [],
      currentEquipment: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      activatedAt: new Date(),
    });

    // Seed a private note
    await setDoc(doc(db, 'privateNotes', 'note_1'), {
      noteId: 'note_1',
      targetType: 'member',
      targetId: 'member_uid_1',
      authorUid: 'admin_uid_1',
      content: 'Internal admin note — not for member eyes.',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Seed systemSettings public doc
    await setDoc(doc(db, 'systemSettings', 'public'), {
      platformName: 'OC Media Platform',
      recruitmentOpen: true,
      currentCohort: '2026',
      whatsappGroupLink: 'https://chat.whatsapp.com/F1eGCSLPt8YCcpMO3HDxea',
      updatedAt: new Date(),
    });

    // Seed systemSettings private doc
    await setDoc(doc(db, 'systemSettings', 'private'), {
      activationCodeTtlDays: 7,
      maxFailedActivationAttempts: 5,
      lockoutDurationMinutes: 30,
      adminEmails: ['admin@ocmedia.internal'],
      updatedAt: new Date(),
    });
  });
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'oc-media-test',
    firestore: {
      rules: readFileSync(RULES_PATH, 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });

  await seedDatabase(testEnv);
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
  await seedDatabase(testEnv);
});

// ---------------------------------------------------------------------------
// TC-01: Unauthenticated read of /applications — DENY
// ---------------------------------------------------------------------------
test('TC-01: Unauthenticated user cannot read applications', async () => {
  const unauthedDb = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(unauthedDb, 'applications', 'OC-2026-0001')));
});

// ---------------------------------------------------------------------------
// TC-02: Member reading /applications list — DENY
// ---------------------------------------------------------------------------
test('TC-02: Active member cannot read applications collection', async () => {
  const memberDb = testEnv
    .authenticatedContext('member_uid_1', { email: 'oc-2026-0001@ocmedia.internal' })
    .firestore();
  await assertFails(getDocs(collection(memberDb, 'applications')));
});

// ---------------------------------------------------------------------------
// TC-03: Member reading another member's /members doc — DENY
// ---------------------------------------------------------------------------
test('TC-03: Member cannot read another member document', async () => {
  const memberDb = testEnv
    .authenticatedContext('member_uid_1')
    .firestore();
  await assertFails(getDoc(doc(memberDb, 'members', 'member_uid_2')));
});

// ---------------------------------------------------------------------------
// TC-04: Member updating their own `role` field — DENY
// ---------------------------------------------------------------------------
test('TC-04: Member cannot update their own role field', async () => {
  const memberDb = testEnv
    .authenticatedContext('member_uid_1')
    .firestore();
  await assertFails(
    updateDoc(doc(memberDb, 'members', 'member_uid_1'), {
      role: 'admin',
      updatedAt: new Date(),
    })
  );
});

// ---------------------------------------------------------------------------
// TC-05: Member updating their own `accountStatus` — DENY
// ---------------------------------------------------------------------------
test('TC-05: Member cannot update their own accountStatus', async () => {
  const memberDb = testEnv
    .authenticatedContext('member_uid_1')
    .firestore();
  await assertFails(
    updateDoc(doc(memberDb, 'members', 'member_uid_1'), {
      accountStatus: 'suspended',
      updatedAt: new Date(),
    })
  );
});

// ---------------------------------------------------------------------------
// TC-06: Suspended member creating portfolio — DENY
// ---------------------------------------------------------------------------
test('TC-06: Suspended member cannot create a portfolio item', async () => {
  const suspendedDb = testEnv
    .authenticatedContext('suspended_uid')
    .firestore();
  await assertFails(
    setDoc(doc(suspendedDb, 'portfolios', 'portfolio_test_1'), {
      itemId: 'portfolio_test_1',
      memberUid: 'suspended_uid',
      title: 'My Work',
      url: 'https://example.com/work',
      type: 'link',
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );
});

// ---------------------------------------------------------------------------
// TC-07: Member reading /privateNotes — DENY
// ---------------------------------------------------------------------------
test('TC-07: Member cannot read privateNotes collection', async () => {
  const memberDb = testEnv
    .authenticatedContext('member_uid_1')
    .firestore();
  await assertFails(getDoc(doc(memberDb, 'privateNotes', 'note_1')));
});

// ---------------------------------------------------------------------------
// TC-08: Member reading /adminUsers — DENY
// ---------------------------------------------------------------------------
test('TC-08: Member cannot read adminUsers collection', async () => {
  const memberDb = testEnv
    .authenticatedContext('member_uid_1')
    .firestore();
  await assertFails(getDocs(collection(memberDb, 'adminUsers')));
});

// ---------------------------------------------------------------------------
// TC-09: Member creating portfolio with another member's memberUid — DENY
// ---------------------------------------------------------------------------
test('TC-09: Member cannot create a portfolio item claiming another member UID', async () => {
  const memberDb = testEnv
    .authenticatedContext('member_uid_1')
    .firestore();
  await assertFails(
    setDoc(doc(memberDb, 'portfolios', 'spoof_portfolio'), {
      itemId: 'spoof_portfolio',
      memberUid: 'member_uid_2', // Spoofed — this is NOT the caller's UID
      title: 'Spoofed Portfolio',
      url: 'https://example.com/spoof',
      type: 'link',
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );
});

// ---------------------------------------------------------------------------
// TC-10: Admin reading all permitted resources — ALLOW
// ---------------------------------------------------------------------------
test('TC-10: Admin can read applications, members, adminUsers, and privateNotes', async () => {
  const adminDb = testEnv
    .authenticatedContext('admin_uid_1')
    .firestore();

  await assertSucceeds(getDoc(doc(adminDb, 'applications', 'OC-2026-0001')));
  await assertSucceeds(getDoc(doc(adminDb, 'members', 'member_uid_1')));
  await assertSucceeds(getDoc(doc(adminDb, 'members', 'member_uid_2')));
  await assertSucceeds(getDoc(doc(adminDb, 'adminUsers', 'admin_uid_1')));
  await assertSucceeds(getDoc(doc(adminDb, 'privateNotes', 'note_1')));
  await assertSucceeds(getDoc(doc(adminDb, 'systemSettings', 'private')));
});

// ---------------------------------------------------------------------------
// Bonus TC-11: Active member can update ONLY permitted profile fields — ALLOW
// ---------------------------------------------------------------------------
test('TC-11: Active member can update bio and currentSkills on own document', async () => {
  const memberDb = testEnv
    .authenticatedContext('member_uid_1')
    .firestore();

  await assertSucceeds(
    updateDoc(doc(memberDb, 'members', 'member_uid_1'), {
      bio: 'Photography enthusiast.',
      currentSkills: ['photography', 'video-editing'],
      updatedAt: new Date(),
    })
  );
});

// ---------------------------------------------------------------------------
// Bonus TC-12: Unauthenticated user can read systemSettings/public — ALLOW
// ---------------------------------------------------------------------------
test('TC-12: Unauthenticated user can read systemSettings/public document', async () => {
  const unauthedDb = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(unauthedDb, 'systemSettings', 'public')));
});

// ---------------------------------------------------------------------------
// Bonus TC-13: Unauthenticated user cannot read systemSettings/private — DENY
// ---------------------------------------------------------------------------
test('TC-13: Unauthenticated user cannot read systemSettings/private document', async () => {
  const unauthedDb = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(unauthedDb, 'systemSettings', 'private')));
});
