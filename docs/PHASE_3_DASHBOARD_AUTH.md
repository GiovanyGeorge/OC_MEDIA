# OC Media Platform — Phase 3: Admin Dashboard & Member Authentication

## 1. Executive Summary

Phase 3 implements the administrative console and member portal on top of the Firebase foundation (Phase 1) and secure activation system (Phase 2). All operations adhere strictly to the principle of least privilege, with complete RTL/LTR bilingual support, robust route protection, and real-time backend/Firestore integration.

**Firebase Project ID:** `oc-media-2026`  
**Application Architecture:** React 18 + TypeScript + Vite + Tailwind CSS + Cloudflare Pages Functions + Cloud Firestore & Firebase Authentication.

---

## 2. Authentication & Identity Architecture

### 2.1 Role Model
Only two roles exist across the system:
1. **Admin (`admin`)**: Authorized administrators whose Firebase Auth UID appears in the protected `adminUsers/{uid}` collection. Admins have access to overview metrics, application review (approve/reject), member suspension, activation code issuance, and orphan reconciliation.
2. **Member (`member`)**: Accepted applicants who have completed activation. Members access their personal portal, can view and edit a restricted subset of their profile, manage portfolio URLs, and review official performance evaluations.

No intermediate roles (e.g., Team Leader) exist.

### 2.2 Dual Login Workflows
1. **Admin Login**:
   - Credentials: Email (`admin@...`) + Password.
   - Authentication: Firebase `signInWithEmailAndPassword`.
   - Authorization: Verified by querying Firestore `adminUsers/{uid}`. Since Firestore rules deny non-admin access to this collection, successful read proves administrative status.
2. **Member Login**:
   - Credentials: Reference ID (`OC-2026-XXXX`) + Password.
   - Transformation: Synthetic email generated via `toSyntheticEmail(referenceId)` -> `oc-2026-xxxx@ocmedia.internal`.
   - Authentication: Firebase `signInWithEmailAndPassword`.
   - Profile & Status Check: Reads `members/{uid}` document to populate user profile and verifies `accountStatus !== 'suspended'`. If suspended, the session is invalidated immediately with error code `ACCOUNT_SUSPENDED`.

---

## 3. Route Protection & Routing Map

Hash-based routing is employed for seamless compatibility with Cloudflare Pages static hosting:

| Hash Route | View Component | Access Control | Purpose |
| :--- | :--- | :--- | :--- |
| `""` or `#recruitment` | `RecruitmentForm` | Public | Public recruitment submission form |
| `#dashboard` | `DashboardApp` | Passcode-gated | In-memory spreadsheet analytics dashboard (preserved) |
| `#login` | `LoginPage` | Public | Unified login interface with Member and Admin tabs |
| `#activate` | `ActivationPage` | Public (Rate-limited) | Self-service activation code redemption |
| `#admin` | `AdminDashboard` | Protected (`admin`) | Central administrative console with Firestore integration |
| `#member` | `MemberDashboard` | Protected (`member`) | Member portal with profile and portfolio management |

---

## 4. Administrative Features & API Endpoints

1. **Dashboard Overview (`AdminOverview.tsx`)**:
   - Displays real-time metrics queried from Firestore: total applications, pending review, approved, active members, suspended accounts.
   - Displays prominent alerts if any accounts enter `recovery_required` state.
2. **Applications Management (`ApplicationsPage.tsx`)**:
   - Search by name, Reference ID, or phone; filter by status (`pending`, `approved`, `rejected`).
   - Detail modal showing complete applicant profile, skills, equipment, and portfolio link.
   - Direct approval and rejection actions updating Firestore `applications/{referenceId}` documents.
   - Direct button to issue an activation code for approved applicants.
3. **Members Management (`MembersPage.tsx`)**:
   - Table of active and suspended members with search and filter.
   - Profile detail modal displaying bio, skills, and equipment.
   - Member suspension via `POST /api/admin/suspend-member`, which disables the Firebase Auth account and updates the member's Firestore status to `suspended`.
4. **Activation Code Issuance (`ActivationCodesPage.tsx`)**:
   - Admin initiates code generation for approved applicants via `POST /api/admin/issue-code`.
   - Backend generates a 128-bit CSPRNG code and stores only its HMAC-SHA256 hash in `activationCodes/{codeHash}` and `applications/{referenceId}`.
   - Plaintext code is displayed to the admin **ONCE** with a one-click copy button and is never stored in plaintext in the browser or database.
5. **Orphan Account Reconciliation (`OrphanReconciliationPage.tsx`)**:
   - Monitors applications flagged with `recovery_required` or `orphanAuthUid` resulting from compensation failure double-faults.
   - Executes remediation via `POST /api/admin/reconcile-orphan`:
     - `delete_orphan_auth`: Deletes the dangling Firebase Auth user and resets the application status to `approved` for retry.
     - `complete_member_doc`: Generates the missing `members/{uid}` document and completes activation.

---

## 5. Member Features & Security Restrictions

1. **Member Overview (`MemberOverview.tsx`)**:
   - Welcomes the member with their Reference ID, academic year, and status.
   - Quick overview of active skills, personal gear, and recent portfolio items.
2. **Profile Management (`MyProfilePage.tsx`)**:
   - **Locked Read-Only Fields**: Full Name, Reference ID, Academic Year, System Email, Role, Status.
   - **Permitted Editable Fields**: Contact Phone (`phone`), Bio (`bio`), Media Skills (`currentSkills`), Equipment (`currentEquipment`).
   - Enforced by Firestore Security Rules:
     ```cel
     request.resource.data.diff(resource.data).affectedKeys()
       .hasOnly(['currentSkills', 'currentEquipment', 'phone', 'bio', 'updatedAt'])
     ```
3. **Portfolio Management (`PortfolioPage.tsx`)**:
   - Add, edit, and delete portfolio items linked in `portfolios/{itemId}`.
   - Enforces ownership: `memberUid == request.auth.uid` is required on creation and immutable on update.
   - Validates URL syntax (`http://` or `https://`) and title length (1-200 characters).
4. **Evaluations & Feedback (`EvaluationsPage.tsx`)**:
   - Read-only view of official administrative evaluations from `evaluations/{targetUid}`.
   - Displays overall rating (1-5 stars), key strengths, and growth recommendations.

---

## 6. Testing & Quality Verification

### 6.1 Test Suite Breakdown
All 4 test suites pass cleanly:
- `tests/phase3.test.ts` (12 tests): Validates synthetic email transformation, permitted profile update boundaries, route access control, and portfolio ownership rules.
- `tests/activation.test.ts` (15 tests): Unit tests for state machine, HMAC generation, lock expiration, and rate limiting.
- `tests/activation.integration.test.ts` (7 tests): Integration tests for IAM permissions, concurrency locks, compensation failure, and distributed rate limits.
- `tests/firestore.rules.test.ts` (13 tests): Production Firestore security rules verified against the local emulator.

**Total Tests:** 47 passed, 0 failed.

### 6.2 Build Verification
- Command: `npm run build` (`tsc -b && vite build`)
- Result: Exit code 0 (2455 modules transformed, production bundle generated cleanly).

---

## 7. Operational Notes & Limitations

- **Reactivation**: While member suspension is fully supported via `POST /api/admin/suspend-member`, reactivating a suspended account currently requires an administrator to re-enable the Firebase Auth user via Identity Toolkit / Firebase Console and update Firestore `members/{uid}.accountStatus` to `active`.
- **Firebase Configuration**: The app includes a safe fallback warning when public `VITE_FIREBASE_*` environment variables are absent, allowing offline UI preview and ensuring the recruitment form and local spreadsheet dashboard remain fully functional.
