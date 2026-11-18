# Phase 2: Secure Member Activation — Architecture & Specification Manual

This document provides the complete technical specification, cryptographic design, state machine logic, API specifications, and operational manual for **Phase 2: Secure Member Activation** of the **OC Media Management Platform**.

Official Firebase Project ID: `oc-media-2026`

---

## 1. Architecture & Threat Model

The activation workflow is engineered around zero-trust, server-enforced access controls. The public web client never communicates directly with privileged Firebase Admin SDK APIs. All account creation, code generation, code redemption, and state transitions are handled exclusively by **Cloudflare Pages Functions** utilizing standard Google Cloud REST APIs authenticated by a Service Account.

```
+---------------------------------------------------------------------------------------------------+
|                                      Phase 2 Activation Flow                                      |
+---------------------------------------------------------------------------------------------------+

   +-------------+       (1) POST /api/admin/issue-code       +-------------------------------+
   | Admin Panel | -----------------------------------------> | Cloudflare Pages Function     |
   +-------------+       (with Firebase ID Token)             | (/api/admin/issue-code)       |
          ^                                                   +-------------------------------+
          | (2) Returns Plaintext Code                                        |
          |     (OC-XXXX-XXXX-XXXX-XXXX)                                      | 1. Verifies Admin caller
          |                                                                   | 2. Checks applicant status == 'approved'
          v                                                                   | 3. Computes HMAC-SHA256(Code)
   [Admin Securely Delivers Code to Applicant Manually]                       | 4. Stores Hash in activationCodes
                                                                              | 5. Updates application: 'code_issued'
                                                                              v
                                                              +-------------------------------+
                                                              | Cloud Firestore REST API      |
                                                              +-------------------------------+

   +----------------+       (3) POST /api/activate            +-------------------------------+
   | Public Browser | --------------------------------------> | Cloudflare Pages Function     |
   | Activation Form|       { refId, code, password }         | (/api/activate)               |
   +----------------+                                         +-------------------------------+
                                                                              |
                                                                              | 1. Enforces Distributed Rate Limits
                                                                              | 2. Validates Password Strength
                                                                              | 3. Computes Keyed HMAC-SHA256
                                                                              | 4. Verifies Code in activationCodes
                                                                              | 5. Acquires Concurrency Lock Token
                                                                              |
                                                                              +-------------------------------+
                                                                              | Step 1: Create Auth Account   |
                                                                              | Identity Toolkit REST API     |
                                                                              | synthetic email:              |
                                                                              | {refId}@ocmedia.internal      |
                                                                              +-------------------------------+
                                                                              |
                                                                              +-------------------------------+
                                                                              | Step 2: Create Member Profile |
                                                                              | Firestore: /members/{uid}     |
                                                                              | (Compensating rollback        |
                                                                              |  deletes Auth user if fails)  |
                                                                              +-------------------------------+
                                                                              |
                                                                              +-------------------------------+
                                                                              | Step 3: Finalize Activation   |
                                                                              | - Code: { used: true }        |
                                                                              | - App: { isActivated: true,   |
                                                                              |    status: 'active' }         |
                                                                              +-------------------------------+
                                                                              v
                                                              +-------------------------------+
                                                              | Returns HTTP 200 OK           |
                                                              | { success: true, email, uid } |
                                                              +-------------------------------+
```

---

## 2. Cryptographic Code Design & Keyed Hashing

1. **Randomness & Entropy**:
   - Every activation code is generated using `crypto.getRandomValues(new Uint8Array(16))`, providing **128 bits of cryptographic randomness**.
   - Encoded into 16 Crockford-style uppercase characters excluding ambiguous characters (`0`, `O`, `1`, `I`, `L`):
     `OC-XXXX-XXXX-XXXX-XXXX`
2. **Keyed HMAC-SHA256 Storage**:
   - Plaintext codes are **never** stored in Firestore or database logs.
   - The code is normalized (whitespace stripped, uppercase) and hashed using **HMAC-SHA256** keyed with `ACTIVATION_HMAC_SECRET` (stored strictly in Cloudflare Secrets).
   - Even in the event of an unauthorized database read, an attacker cannot precompute rainbow tables or reverse codes without the secret key.
3. **Single-Use & Expiration**:
   - Codes are marked `used: true` upon successful member creation.
   - Default expiration is 7 days (configurable by admin between 1 and 30 days).

---

## 3. Activation State Machine & Recovery Transitions

```
               [Applicant Submits Form]
                          |
                          v
                     +----------+
                     | pending  |
                     +----------+
                          |
                          | (Admin Approves Application)
                          v
                     +----------+
                     | approved |
                     +----------+
                          |
                          | (Admin Generates Activation Code)
                          v
                   +-------------+
                   | code_issued |
                   +-------------+
                          |
                          | (Applicant Submits Code + Password)
                          v
              +------------------------+
              | activation_in_progress |  <-- Concurrency Lock Acquired
              +------------------------+
                     /          \
      (Both Auth &  /            \ (Auth or Firestore Fails)
     Firestore OK) /              \
                  v                +------------------------------------+
             +--------+            | Compensating Rollback              |
             | active |            | Attempts deleteAuthUser(uid)       |
             +--------+            +------------------------------------+
                 |                       /                        \
                 |        (Rollback OK) /                          \ (Rollback Fails)
                 |                     v                            v
                 |           +-------------------+       +-------------------+
                 |           | activation_failed |       | recovery_required |
                 |           +-------------------+       +-------------------+
                 |             (Safe to Retry)             (Admin Triage)
                 |
                 | (Admin Suspends Member)
                 v
           +-----------+
           | suspended |  <-- Auth Account Disabled
           +-----------+
```

### Complete State Dictionary:
1. `pending`: Initial recruitment submission. Cannot issue codes or activate.
2. `approved`: Admin verified recruitment details. Eligible for code issuance.
3. `code_issued`: One-time token generated and stored as HMAC. Eligible for activation redemption.
4. `activation_in_progress`: Concurrency lock token (`operationId`) acquired with a 2-minute expiration timestamp (`lockExpiresAt`). Prevents concurrent duplicate activations.
5. `active`: Firebase Auth user and Firestore `/members/{uid}` profile both verified. Single-use token invalidated.
6. `activation_failed`: Failure occurred during account creation, but compensating rollback succeeded (Auth user deleted). The applicant can safely retry activation.
7. `recovery_required`: **Double-fault condition**. Firebase Auth user creation succeeded, Firestore member creation failed, and the compensating `deleteAuthUser` call also failed.
   - **Critical Invariant**: The application is **never** marked `isActivated: true`.
   - The field `orphanAuthUid` preserves the orphaned Firebase Auth UID.
   - Lock token is released so the record is not permanently wedged.
   - Administrator uses `POST /api/admin/reconcile-orphan` to either safely delete the orphan Auth account or complete the missing member document.
8. `suspended`: Member administratively suspended. Firebase Auth user disabled (`disabled: true`).

---

## 4. Rate Limiting: Architecture & Free-Plan Consistency Analysis

### 4.1 Evaluation of Cloudflare Workers Rate Limiting Bindings
Cloudflare Workers offers native Rate Limiting bindings (`env.MY_RATE_LIMITER`), but evaluating it for our specific architecture reveals critical constraints on the Free Plan:
1. **Consistency Model**: Cloudflare Workers Rate Limiting uses an approximate, eventually consistent counter model synchronized across global points of presence (PoPs). Counters increment locally and sync periodically, which allows short bursts across distinct edge nodes before global limits take effect.
2. **Body Inspection**: WAF-level rate limiting cannot inspect JSON payload attributes (such as `referenceId` or hashed activation codes).
3. **Plan Availability**: Cloudflare Free tier has restricted binding availability and strict execution limits.

### 4.2 Distributed Implementation via Cloud Firestore
To guarantee strict cross-instance consistency across all Cloudflare edge PoPs globally without introducing paid services, rate limiting is implemented via a **three-tier defense model**:

1. **Per-Activation-Code Limits (Strict Global Consistency)**:
   - Backed by the Firestore document `activationCodes/{codeHmac}`.
   - Tracks `failedAttempts`, `lastAttemptAt`, and `lockedUntil`.
   - 5 failed attempts locks the token in Firestore for 30 minutes (`lockedUntil = now + 30m`).
   - Because Cloud Firestore provides strong consistency on document reads/writes, an attacker rotating IPs or Cloudflare PoPs hits the exact same locked document immediately.
2. **Per-Reference-ID Limits (Strict Global Consistency)**:
   - Backed by Firestore document `rateLimits/ref_{referenceId}`.
   - Tracks cumulative failed attempts targeting a specific Reference ID across multiple IPs.
   - 5 failed attempts locks the Reference ID for 30 minutes (`lockedUntil = now + 30m`).
3. **Per-IP Limits (Hybrid Two-Tier)**:
   - **Tier 1 (Edge Isolate Filter)**: Fast in-memory sliding window on the local worker isolate (`localEdgeIpTracker`) absorbing rapid packet floods without consuming database writes.
   - **Tier 2 (Global Distributed Document)**: Backed by `rateLimits/ip_{hash(clientIp)}` in Firestore. 10 requests per 60 seconds.
4. **Free-Plan Constraints & Quota Impact**:
   - Cloud Firestore Spark Free Plan provides **20,000 document writes/day** and **50,000 document reads/day**.
   - For an annual recruitment cohort of 100–500 applicants, normal activation traffic consumes <1% of the daily free quota.
   - Under an aggressive distributed flood, the edge isolate filter absorbs the volume, protecting the Firestore quota.

---

## 5. Service Account Verification & Minimum IAM Permissions

To maintain least-privilege security, the Service Account credentials configured in Cloudflare Secrets must only possess the exact minimum IAM roles required:

### 5.1 Minimum Required IAM Roles
1. **Firebase Authentication Admin (`roles/identitytoolkit.admin`)**:
   - Required for: Creating members with synthetic emails (`/accounts`), disabling accounts (`/accounts:update`), deleting accounts for compensating rollback (`/accounts:delete`), and verifying ID tokens.
2. **Cloud Datastore User (`roles/datastore.user`)**:
   - Required for: Reading and writing Firestore documents (`/documents/applications`, `/documents/members`, `/documents/activationCodes`, `/documents/rateLimits`).
3. **Service Account Token Creator (`roles/iam.serviceAccountTokenCreator`)**:
   - Required ONLY if token signing is delegated through Google IAM APIs rather than self-signed locally. When self-signing with the private key via Web Crypto RS256, this role is not required.

### 5.2 Token Generation & In-Memory Caching Verification
- Tokens are minted locally using Web Crypto API (`crypto.subtle.sign` with `RSASSA-PKCS1-v1_5` and `SHA-256`).
- **Scopes Requested**:
  - `https://www.googleapis.com/auth/identitytoolkit`
  - `https://www.googleapis.com/auth/datastore`
- **Caching Mechanism**: The access token is cached in worker memory (`tokenCache`) and reused across invocations. It is refreshed 5 minutes prior to expiration (55-minute operational lifetime), minimizing token exchange overhead.
- **Target Project**: Verified strictly against `oc-media-2026`.

---

## 6. API Endpoint Specifications

All endpoints run on Cloudflare Pages Functions (`functions/api/`).

### 6.1 Admin: Issue Activation Code
- **Method**: `POST /api/admin/issue-code`
- **Headers**:
  - `Authorization: Bearer <firebase_id_token>`
  - `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "referenceId": "OC-2026-0001",
    "ttlDays": 7
  }
  ```
- **Responses**:
  - `200 OK`: Returns plaintext `activationCode` once to authorized admin.
  - `400 Bad Request`: Ineligible application status.
  - `401 Unauthorized`: Invalid or missing ID token.
  - `403 Forbidden`: Caller not registered in `adminUsers` collection.

### 6.2 Public: Redeem Activation Code & Create Account
- **Method**: `POST /api/activate`
- **Headers**:
  - `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "referenceId": "OC-2026-0001",
    "activationCode": "OC-9X7B-4K2M-W8V3",
    "password": "StrongMemberPassword2026"
  }
  ```
- **Responses**:
  - `200 OK`: Account activated (`{ success: true, email: "oc-2026-0001@ocmedia.internal", uid }`).
  - `400 Bad Request`: Generic error response (`بيانات التفعيل غير صالحة أو غير متطابقة`).
  - `409 Conflict`: Concurrency lock active (`activation_in_progress`).
  - `429 Too Many Requests`: Rate limit exceeded.
  - `500 Internal Server Error`: Rollback executed.

### 6.3 Admin: Reconcile Orphaned Accounts
- **Method**: `POST /api/admin/reconcile-orphan`
- **Headers**:
  - `Authorization: Bearer <firebase_id_token>`
  - `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "referenceId": "OC-2026-0001",
    "action": "delete_orphan_auth"
  }
  ```
  *(or `"action": "complete_member_doc"`)*
- **Responses**:
  - `200 OK`: Orphan resolved and application state sanitized.

### 6.4 Admin: Suspend Member & Disable Account
- **Method**: `POST /api/admin/suspend-member`
- **Headers**:
  - `Authorization: Bearer <firebase_id_token>`
  - `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "uid": "member_firebase_auth_uid",
    "referenceId": "OC-2026-0001"
  }
  ```
- **Responses**:
  - `200 OK`: Member suspended, Auth account disabled, documents updated.

---

## 7. Automated Test Suite Execution & Results

The test suite is partitioned into **Unit Tests**, **Integration Tests**, and **Firestore Security Rules Tests**:

### Test Commands:
```bash
# 1. Run Unit Tests (Cryptographic primitives, state machine, password policies)
npm run test:unit

# 2. Run Integration Tests (Credentials, IAM, double-fault rollbacks, distributed rate limits)
npm run test:integration

# 3. Run Security Rules Tests (Firestore emulator security boundaries)
npm run test:rules

# 4. Run All Suites Concurrently
npm run test:all
```

### Actual Verified Test Results:

```
PASS tests/activation.test.ts (Unit Tests)
  Phase 2: Secure Member Activation Test Suite
    √ TC-P2-01: Pending applicant is rejected for activation code issuance
    √ TC-P2-02: Rejected applicant is rejected for activation code issuance and activation
    √ TC-P2-03: Approved applicant is eligible for code issuance and activation
    √ TC-P2-04: Invalid code HMAC does not match expected document hash
    √ TC-P2-05: Expired code timestamp is correctly detected
    √ TC-P2-06: Already used code cannot be activated again
    √ TC-P2-07: Concurrency lock detects in-flight activation request
    √ TC-P2-08: Already activated account is rejected for both issuance and re-activation
    √ TC-P2-09: Regular member cannot act as admin to issue codes
    √ TC-P2-10: Suspended applicant or member is rejected for code issuance and activation
    √ TC-P2-11: Compensating rollback safely triggers when downstream Firestore write fails
    √ TC-P2-12: Idempotent state machine allows safe recovery from activation_failed
    √ TC-P2-13: Rate limiter enforces maximum threshold and provides retry time
    √ TC-P2-14: Code normalization and HMAC generation produces consistent, tamper-proof hashes
    √ TC-P2-15: Password strength policy and synthetic email validation
  (15 passed, 15 total)

PASS tests/activation.integration.test.ts (Integration Tests)
  Phase 2 Integration Tests: Error Boundaries, Credentials & Distributed States
    √ INT-01: Requests targeting a wrong Firebase Project ID are safely rejected with descriptive error
    √ INT-02: Invalid Service Account credentials throw during parsing or token exchange
    √ INT-03: Insufficient IAM permissions return 403 PERMISSION_DENIED and are handled gracefully
    √ INT-04: Concurrent activation requests trigger lock conflict (HTTP 409)
    √ INT-05: Double-fault compensation failure records recovery_required without activating account
    √ INT-06: Distributed rate-limiting locks Reference ID after cumulative failures
    √ INT-07: Suspended account is blocked from activation operations
  (7 passed, 7 total)

PASS tests/firestore.rules.test.ts (Security Rules Tests)
  (13 passed, 13 total)

Total Suite Execution: 3 passed, 3 total | 35 passed, 35 total (Exit Code: 0)
```

---

## 8. Manual Configuration Checklist for Administrator

Configure the following secrets in **Cloudflare Dashboard**:
Navigate to **Cloudflare Dashboard > Workers & Pages > Pages > [Your Project] > Settings > Environment Variables**:

| Variable Name | Type | Value / Description |
|---|---|---|
| `FIREBASE_PROJECT_ID` | Variable | `oc-media-2026` |
| `ACTIVATION_HMAC_SECRET` | **Secret (Encrypted)** | High-entropy random string (at least 32 characters, e.g. generated via `openssl rand -hex 32`) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | **Secret (Encrypted)** | Full JSON content of your Firebase Service Account Private Key with `roles/identitytoolkit.admin` and `roles/datastore.user` |
| `ALLOWED_ORIGINS` | Variable | Comma-separated allowed origins (e.g. `https://your-domain.pages.dev,http://localhost:5173`) |
