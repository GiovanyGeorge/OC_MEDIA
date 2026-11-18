# Phase 2: Secure Member Activation — Architecture & Specification Manual

This document provides the complete technical specification, cryptographic design, state machine logic, API specifications, and operational manual for **Phase 2: Secure Member Activation** of the **OC Media Management Platform**.

Firebase Project ID: `oc-media-faf79`

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
                                                                              | 1. Enforces IP & RefId Rate Limits
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
   - Even in the event of an unauthorized database read, attacker cannot precompute rainbow tables or reverse codes without the secret key.
3. **Single-Use & Expiration**:
   - Codes are marked `used: true` upon successful member creation.
   - Default expiration is 7 days (configurable by admin between 1 and 30 days).

---

## 3. Activation State Machine

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
      (Both Auth &  /            \ (Auth or Firestore
     Firestore OK) /              \ Fails Permanently)
                  v                v
             +--------+    +-------------------+
             | active |    | activation_failed |  <-- Lock Released
             +--------+    +-------------------+      (Eligible for Safe Retry)
                 |
                 | (Admin Suspends Member)
                 v
           +-----------+
           | suspended |  <-- Auth Account Disabled
           +-----------+
```

### State Machine Transitions & Invariants:
1. `pending`: Initial recruitment submission. Cannot issue codes or activate.
2. `approved`: Admin verified recruitment details. Eligible for code issuance.
3. `code_issued`: One-time token generated and stored as HMAC. Eligible for activation redemption.
4. `activation_in_progress`: Concurrency lock token (`operationId`) acquired with a 2-minute expiration timestamp (`lockExpiresAt`). Prevents concurrent duplicate activations.
5. `active`: Firebase Auth user and Firestore `/members/{uid}` profile both verified. Single-use token invalidated.
6. `activation_failed`: Failure occurred during account creation. Safe retry is allowed.
7. `suspended`: Member administratively suspended. Firebase Auth user disabled (`disabled: true`).

---

## 4. API Endpoint Specifications

All endpoints run on Cloudflare Pages Functions (`functions/api/`).

### 4.1 Admin: Issue Activation Code
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
  - `200 OK`:
    ```json
    {
      "success": true,
      "message": "تم إصدار رمز التفعيل بنجاح.",
      "referenceId": "OC-2026-0001",
      "activationCode": "OC-9X7B-4K2M-W8V3",
      "expiresAt": "2026-11-26T22:00:00.000Z",
      "ttlDays": 7
    }
    ```
  - `400 Bad Request`: Ineligible status or missing reference ID.
  - `401 Unauthorized`: Missing or invalid Firebase ID token.
  - `403 Forbidden`: Caller UID is not listed in `/adminUsers` collection.

### 4.2 Public: Redeem Activation Code & Create Account
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
  - `200 OK`:
    ```json
    {
      "success": true,
      "message": "تم تفعيل حسابك بنجاح! يمكنك الآن تسجيل الدخول باستخدام رقمك المرجعي وكلمة المرور.",
      "referenceId": "OC-2026-0001",
      "email": "oc-2026-0001@ocmedia.internal",
      "uid": "generated_firebase_auth_uid"
    }
    ```
  - `400 Bad Request`: Invalid code, mismatched reference ID, expired code, already used code, or weak password.
  - `403 Forbidden`: Code locked due to >= 5 failed attempts (30-minute lockout).
  - `409 Conflict`: Activation currently in progress by another request (`activation_in_progress`).
  - `429 Too Many Requests`: IP or Reference ID rate limit exceeded.
  - `500 Internal Server Error`: Safe rollback executed upon network or database failure.

### 4.3 Admin: Suspend Member & Disable Account
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
  - `401/403`: Unauthorized.

---

## 5. Google Authentication & Identity Toolkit Integration

### 5.1 Service Account Token Exchange
In Cloudflare Workers (where Node.js `google-auth-library` cannot run without heavy polyfills), tokens are issued directly via the Web Crypto API:
- **Private Key Format**: PKCS#8 RSA (`RSASSA-PKCS1-v1_5` with SHA-256).
- **Scope**: `https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/datastore`.
- **Token Endpoint**: `https://oauth2.googleapis.com/token`.
- **In-Memory Caching**: Access tokens are cached in worker memory and reused until 5 minutes before expiration (55 minutes cache lifetime).

### 5.2 Firebase Identity Toolkit Administrative REST API
- **Endpoint**: `POST https://identitytoolkit.googleapis.com/v1/projects/oc-media-faf79/accounts`
- **Authorization**: `Bearer <oauth2_access_token>`
- **Request Payload**:
  ```json
  {
    "email": "oc-2026-0001@ocmedia.internal",
    "password": "ChosenPassword123",
    "displayName": "Full Name",
    "emailVerified": true,
    "disabled": false
  }
  ```
- **Disabling User**: `POST https://identitytoolkit.googleapis.com/v1/projects/oc-media-faf79/accounts:update` with `{"localId": uid, "disableUser": true}`.
- **Rollback Deletion**: `POST https://identitytoolkit.googleapis.com/v1/projects/oc-media-faf79/accounts:delete` with `{"localId": uid}`.

---

## 6. Rate Limiting & Brute-Force Protection

1. **IP Rate Limiting**:
   - Max 10 requests per minute per IP address.
   - Enforced by `functions/lib/rateLimiter.ts` using sliding memory counters.
2. **Reference ID Rate Limiting**:
   - Max 5 failed activation attempts per Reference ID within 5 minutes.
3. **Activation Code Lockout**:
   - 5 consecutive failed code attempts locks the token in Firestore for 30 minutes (`lockedUntil: now + 30m`).
4. **Generic Error Responses**:
   - Prevents enumeration: Identical generic error message returned whether the reference ID does not exist, the code does not exist, or the hash does not match.

---

## 7. Account Recovery & Password Reset Architecture

Because the platform uses **synthetic internal email addresses** (`{referenceId}@ocmedia.internal`) that do not possess a public email inbox, self-service password reset emails cannot be delivered.

### Safe Admin-Assisted Password Recovery Flow:
1. Member contacts platform administrator and proves identity (student ID, phone number verification).
2. Admin opens Member Detail in Dashboard.
3. Admin clicks **Issue Password Reset Token**:
   - Backend sets user password directly via Identity Toolkit API (`POST /accounts:update` with `localId` and temporary random password) OR generates an admin-supervised reset session.
   - Member logs in and is forced to change password immediately.

---

## 8. Automated Test Suite Execution & Results

The test suite covers all Phase 2 requirements across cryptographic verification, state machine constraints, race conditions, compensating rollbacks, and rate limits.

### Execution Command:
```bash
npm run test:activation
# and
npm run test:all
```

### Actual Test Results:

```
PASS tests/activation.test.ts
  Phase 2: Secure Member Activation Test Suite
    √ TC-P2-01: Pending applicant is rejected for activation code issuance (3 ms)
    √ TC-P2-02: Rejected applicant is rejected for activation code issuance and activation (1 ms)
    √ TC-P2-03: Approved applicant is eligible for code issuance and activation
    √ TC-P2-04: Invalid code HMAC does not match expected document hash (18 ms)
    √ TC-P2-05: Expired code timestamp is correctly detected
    √ TC-P2-06: Already used code cannot be activated again (1 ms)
    √ TC-P2-07: Concurrency lock detects in-flight activation request
    √ TC-P2-08: Already activated account is rejected for both issuance and re-activation (1 ms)
    √ TC-P2-09: Regular member cannot act as admin to issue codes
    √ TC-P2-10: Suspended applicant or member is rejected for code issuance and activation (1 ms)
    √ TC-P2-11: Compensating rollback safely triggers when downstream Firestore write fails
    √ TC-P2-12: Idempotent state machine allows safe recovery from activation_failed
    √ TC-P2-13: Rate limiter enforces maximum threshold and provides retry time (1 ms)
    √ TC-P2-14: Code normalization and HMAC generation produces consistent, tamper-proof hashes (1 ms)
    √ TC-P2-15: Password strength policy and synthetic email validation (1 ms)

PASS tests/firestore.rules.test.ts (13 tests)

Total Test Execution: 28 passed, 28 total (Exit Code: 0)
```

---

## 9. Manual Configuration Checklist for Administrator

Configure the following secrets in **Cloudflare Dashboard**:
Navigate to **Cloudflare Dashboard > Workers & Pages > Pages > [Your Project] > Settings > Environment Variables**:

| Variable Name | Type | Description |
|---|---|---|
| `FIREBASE_PROJECT_ID` | Variable | Set to `oc-media-faf79` |
| `ACTIVATION_HMAC_SECRET` | **Secret (Encrypted)** | High-entropy random string (at least 32 characters, e.g. generated via `openssl rand -hex 32`) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | **Secret (Encrypted)** | Full JSON content of your Firebase Service Account Private Key |
| `ALLOWED_ORIGINS` | Variable | Comma-separated allowed origins (e.g. `https://ocmedia.pages.dev,http://localhost:5173`) |
