# Phase 1: Firebase Foundation — OC Media Platform

This document details the complete architectural foundation, database schema, security rules, environment configuration, and verification procedures established in **Phase 1** for the **OC Media Management Platform**.

---

## 1. Executive Summary & Scope

Phase 1 establishes the Firebase client infrastructure, security rules, and type definitions without breaking, altering, or removing any existing features (including the Google Apps Script recruitment workflow, local evaluation state machine, and spreadsheet analytics).

### Key Deliverables Completed:
1. **Firebase SDK Integration (`src/lib/firebase.ts`)**:
   - Single-instance initialization with HMR guard (`getApps().length === 0`).
   - Graceful fallback when environment variables are unpopulated (warns without crashing runtime).
   - Strict client/server boundary: **No** private keys or Service Account credentials in Vite code.
2. **Type-Safe Domain Models (`src/lib/firebaseTypes.ts`)**:
   - Strict TypeScript interfaces for all 9 core Firestore collections.
   - Comprehensive tracking of application status, activation lifecycle, role-based access, and rate-limiting metrics.
3. **Enterprise Firestore Security Rules (`firestore.rules`)**:
   - Deny-by-default architecture.
   - Server-enforced authorization via `adminUsers` collection checks (`isAdmin()`).
   - Granular field-level write controls preventing self-promotion or status tampering.
   - Cryptographic activation code collection locked to client access (`allow read, write: if false`).
4. **Environment Specification (`.env.example`)**:
   - Complete manifest of public Vite Firebase parameters and Cloudflare Pages Functions backend secrets.
5. **Local Emulator Configuration (`firebase.json`)**:
   - Standalone emulation setup for Firestore and Auth (ports 8080, 9099, UI on 4000).
6. **Security Test Suite (`tests/firestore.rules.test.ts`)**:
   - 13 comprehensive unit tests validating security rules against privilege escalation, unauthorized access, and field manipulation.

---

## 2. File Manifest

| File Path | Status | Purpose |
|---|---|---|
| `src/lib/firebase.ts` | **Created** | Firebase App, Auth, and Firestore initialization & safety guard |
| `src/lib/firebaseTypes.ts` | **Created** | TypeScript interfaces for all Firestore collection schemas |
| `firestore.rules` | **Created** | Production security rules governing all collections & actions |
| `firebase.json` | **Created** | Local Firebase Emulator configuration |
| `.env.example` | **Updated** | Reference guide for public Vite env vars and Cloudflare secrets |
| `jest.config.ts` | **Created** | Test runner configuration for security rules unit tests |
| `tests/firestore.rules.test.ts` | **Created** | Rules unit test suite (10 core + 3 boundary test cases) |
| `docs/PHASE_1_FIREBASE_FOUNDATION.md` | **Created** | This documentation manual |

---

## 3. Firestore Database Architecture

The platform data model consists of 9 isolated collections designed around least-privilege principles:

### 3.1 `applications`
- **Document ID Strategy**: Applicant Reference ID (e.g., `OC-2026-0001`).
- **Ownership & Access**: Admin read/write only. Unauthenticated users and regular members cannot read or query this collection.
- **Fields**:
  - `referenceId` (string, required): Unique identifier.
  - `fullName` (string, required): Full applicant name.
  - `phone` (string, required): Contact number.
  - `academicYear` (string, required): Academic grade/level.
  - `skills` (list of strings, required): Tagged media skills.
  - `equipment` (list of strings, required): Owned gear.
  - `hasPortfolio` (boolean, required): Submission flag.
  - `portfolioUrl` (string, optional): External URL if supplied.
  - `status` (`'pending' | 'approved' | 'rejected'`, required): Evaluation state.
  - `isActivated` (boolean, required): Account activation flag.
  - `activationStatus` (`'approved' | 'activation_locked' | 'account_creating' | 'active' | 'recovery_required' | 'activation_failed'`, optional).
  - `activationCodeHash` (string, optional): SHA-256 hash of issued one-time activation token.
  - `activationCodeExpiresAt` (Timestamp, optional): Code expiry deadline.
  - `memberUid` (string, optional): Bound Firebase Auth UID upon activation.
  - `adminNotes` (string, optional): Internal admin commentary.
  - `createdAt`, `updatedAt` (Timestamp, required).

### 3.2 `members`
- **Document ID Strategy**: Firebase Auth UID (`auth.uid`).
- **Ownership & Access**:
  - Read: Owner (`auth.uid == uid`) OR Admin.
  - Create: Admin / Trusted Backend only (`allow create: if isAdmin()`).
  - Update: Admin OR Owner restricted to: `['currentSkills', 'currentEquipment', 'phone', 'bio', 'updatedAt']`. Cannot modify `role`, `accountStatus`, `referenceId`, or `uid`.
  - Delete: Disallowed (`allow delete: if false`).
- **Fields**:
  - `uid` (string, immutable): Firebase Auth UID.
  - `referenceId` (string, immutable): Link back to application.
  - `fullName` (string, immutable by member): Name.
  - `email` (string, immutable): Synthetic email `{referenceId.toLowerCase()}@ocmedia.internal`.
  - `phone` (string): Contact number (10–20 chars).
  - `role` (`'admin' | 'member'`, immutable by member): Security role.
  - `accountStatus` (`'active' | 'suspended'`, immutable by member): Status indicator.
  - `academicYear` (string, immutable by member): Cohort/level.
  - `currentSkills` (list of strings): Member skills.
  - `currentEquipment` (list of strings): Member equipment.
  - `bio` (string, optional): Member profile summary (max 1000 chars).
  - `createdAt`, `updatedAt`, `activatedAt` (Timestamp).

### 3.3 `activationCodes`
- **Document ID Strategy**: SHA-256 hash of the one-time code string.
- **Ownership & Access**: **Zero client access**. Rules enforce `allow read, write: if false;`. Only accessible via Admin SDK in Cloudflare Pages Functions.
- **Fields**:
  - `referenceId` (string, required): Associated applicant.
  - `codeHash` (string, required): The hashed token.
  - `expiresAt` (Timestamp, required): Hard expiration timestamp (7 days).
  - `used` (boolean, required): Single-use enforcement flag.
  - `usedAt` (Timestamp, optional): Timestamp of redemption.
  - `failedAttempts` (number, required): Brute-force counter.
  - `lockedUntil` (Timestamp, optional): Temporary lockout deadline.
  - `createdAt` (Timestamp, required).

### 3.4 `adminUsers`
- **Document ID Strategy**: Firebase Auth UID.
- **Ownership & Access**:
  - Read: Admin only.
  - Write: Admin SDK only (`allow write: if false`).
- **Fields**:
  - `uid`, `email`, `displayName`, `grantedAt`, `grantedBy`.

### 3.5 `portfolios`
- **Document ID Strategy**: Auto-generated UID.
- **Ownership & Access**:
  - Read: Admin OR Owner (`resource.data.memberUid == auth.uid`).
  - Create: Active member (`isMemberActive()`) where `request.resource.data.memberUid == auth.uid`.
  - Update/Delete: Admin OR Active Owner. `memberUid` is immutable.
- **Fields**:
  - `itemId` (string): Identifier.
  - `memberUid` (string, immutable): Owner UID.
  - `title` (string, 1-200 chars): Item title.
  - `description` (string, max 500 chars, optional).
  - `url` (string, valid http(s) URL, max 500 chars).
  - `type` (`'link' | 'image' | 'drive_pdf'`).
  - `driveFileId` (string, optional): Google Drive File ID.
  - `tags` (list of strings, optional).
  - `isPublic` (boolean).
  - `createdAt`, `updatedAt` (Timestamp).

### 3.6 `evaluations`
- **Document ID Strategy**: Target Member UID.
- **Ownership & Access**:
  - Read: Evaluated Member (`isOwner(targetUid)`) OR Admin.
  - Write: Admin only.

### 3.7 `feedback`
- **Document ID Strategy**: Auto-generated UID.
- **Ownership & Access**:
  - Read: Recipient Member (`resource.data.memberUid == auth.uid`) OR Admin.
  - Write: Admin only.

### 3.8 `privateNotes`
- **Document ID Strategy**: Auto-generated UID.
- **Ownership & Access**: Admin only (`allow read, write: if isAdmin();`). Members have zero visibility.

### 3.9 `systemSettings`
- **Document ID Strategy**: Semantic document IDs (`public`, `private`).
- **Ownership & Access**:
  - `public`: Readable by everyone (unauthenticated included). Written only by Admin.
  - Any other document: Admin read/write only.

---

## 4. Security Rules Summary (`firestore.rules`)

The security rules enforce 7 critical security requirements:

1. **Role Independence from Token Claims**:
   Admin privileges rely strictly on database existence checks (`exists(/databases/$(database)/documents/adminUsers/$(request.auth.uid))`). A client cannot elevate privileges by falsifying custom claims or document attributes.
2. **Strict Field Whitelisting on Self-Update**:
   Active members can only update `currentSkills`, `currentEquipment`, `phone`, `bio`, and `updatedAt`.
   Attempts to mutate `role`, `accountStatus`, `referenceId`, or `uid` fail immediately.
3. **Suspension Enforcement**:
   Suspended accounts (`accountStatus != 'active'`) are prevented from creating, updating, or deleting portfolios or modifying member details.
4. **Client Inaccessibility of Sensitive Collections**:
   `activationCodes` has all client access severed (`allow read, write: if false`).
   `adminUsers` cannot be read by members, preventing enumeration of administrative personnel.
5. **Private Notes Isolation**:
   Internal committee notes in `privateNotes` are isolated to `isAdmin()`.
6. **URL & String Formatting Guardrails**:
   Portfolio URLs are constrained to valid HTTP/S protocols with strict size bounds (<= 500 chars).
7. **Safe Public Configuration**:
   Only `/systemSettings/public` can be read unauthenticated, preventing leaks of internal thresholds or administrative lists.

---

## 5. Security Test Matrix

The automated unit test suite covers the following 13 test cases:

| ID | Category | Scenario | Expected | Actual Result |
|---|---|---|---|---|
| **TC-01** | Applications | Unauthenticated read of `/applications/{refId}` | **DENY** | **PASSED** (367 ms) |
| **TC-02** | Applications | Active member reading `/applications` collection | **DENY** | **PASSED** (212 ms) |
| **TC-03** | Members | Member reading another member's document `/members/{otherUid}` | **DENY** | **PASSED** (152 ms) |
| **TC-04** | Members | Member attempting to self-escalate `role: 'admin'` | **DENY** | **PASSED** (203 ms) |
| **TC-05** | Members | Member attempting to alter `accountStatus` | **DENY** | **PASSED** (127 ms) |
| **TC-06** | Portfolios | Suspended member attempting to create a portfolio item | **DENY** | **PASSED** (135 ms) |
| **TC-07** | Private Notes | Member reading `/privateNotes/{noteId}` | **DENY** | **PASSED** (130 ms) |
| **TC-08** | Admin Users | Member listing or reading `/adminUsers` | **DENY** | **PASSED** (109 ms) |
| **TC-09** | Portfolios | Member creating portfolio claiming another member's UID | **DENY** | **PASSED** (115 ms) |
| **TC-10** | Admin Access | Admin reading applications, members, adminUsers, and privateNotes | **ALLOW** | **PASSED** (189 ms) |
| **TC-11** | Members | Active member updating permitted fields (`bio`, `currentSkills`) | **ALLOW** | **PASSED** (104 ms) |
| **TC-12** | Settings | Unauthenticated client reading `/systemSettings/public` | **ALLOW** | **PASSED** (121 ms) |
| **TC-13** | Settings | Unauthenticated client reading `/systemSettings/private` | **DENY** | **PASSED** (127 ms) |

**Suite Summary**: `13 passed, 13 total` (Execution time: 4.626s, Exit Code: 0)

---

## 6. How to Run Emulators & Tests Locally

### Prerequisites
- Node.js 18+ and Java Runtime (JRE 11+ required for Firebase Emulator Suite).

### Step 1: Start the Firebase Emulator
```bash
npx firebase emulators:start --only firestore,auth
```
- Firestore Emulator will run on: `localhost:8080`
- Auth Emulator will run on: `localhost:9099`
- Emulator UI: `http://localhost:4000`

### Step 2: Execute the Test Suite
In a separate terminal:
```bash
npm run test:rules
# or
npx jest tests/firestore.rules.test.ts
```

---

## 7. Manual Firebase Console Setup Instructions

To deploy to production after local validation, the administrator must perform the following manual setup in the Firebase Console:

1. **Create Firebase Project**:
   - Navigate to [Firebase Console](https://console.firebase.google.com/).
   - Click **Add Project** and name it (e.g., `oc-media-2026`).
   - Disable Google Analytics (optional, saves quota/overhead).
   - Ensure the project remains on the **Spark (Free) Plan**. Do not configure billing.

2. **Enable Authentication**:
   - In the Firebase Console sidebar, select **Build > Authentication**.
   - Click **Get Started**.
   - Under the **Sign-in method** tab, enable **Email/Password**.
   - Disable "Email link (passwordless sign-in)".

3. **Enable Cloud Firestore**:
   - In the sidebar, select **Build > Firestore Database**.
   - Click **Create Database**.
   - Choose a nearby region (e.g., `europe-west1` or `eur3`).
   - Start in **Production mode** (rules will be deployed via CLI).

4. **Register Web App**:
   - In **Project Overview > Project Settings**, click the Web icon (`</>`) to add an app.
   - App nickname: `OC Media Web`.
   - Copy the `firebaseConfig` object values into your local `.env` file matching the variables in `.env.example`.

5. **Generate Service Account (For Cloudflare Backend in Phase 2)**:
   - In **Project Settings > Service accounts**, select **Firebase Admin SDK**.
   - Click **Generate new private key**.
   - Store this JSON file securely. It will be provided as an encrypted secret to Cloudflare Pages Functions in Phase 2. **Never commit this JSON file to version control.**

6. **Deploy Security Rules**:
   - Run `npx firebase deploy --only firestore:rules` from project root.

---

## 8. Verification & Backward Compatibility

- **Existing App Functionality**: All existing functionality (Recruitment Form, Google Apps Script integration, Local Evaluation State, and Analytics Dashboard) remains completely untouched and functional.
- **Build Verification**: `npm run build` runs cleanly with no errors, bundling the safe `src/lib/firebase.ts` module with zero runtime breaks.
