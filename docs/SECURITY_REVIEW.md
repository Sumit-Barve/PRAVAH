# SAKSHAM — Application Security & Audit Ledger Review
## Vulnerability Assessment, Authorization Architecture & Forensic Integrity Analysis
**Project Name:** SAKSHAM  
**Subtitle:** AICTE Approval Workflow & Compliance Management System  
**SIH Problem Statement ID:** 26262  
**Audit Scope:** Application Security, API Authorization, Data Protection, Forensic Audit Trail Integrity & Statutory Compliance  
**Classification:** Comprehensive Security Audit & Threat Modeling  

---

## 1. Security Architecture Assessment Summary

The SAKSHAM system was subjected to a thorough application-security and threat-modeling review. In its current Phase 1 implementation, **the security layer is simulated rather than enforced**. While the user interface includes security disclaimers and visual security indicators, **no real authentication, authorization, or cryptographic integrity controls are active on the backend API or data store**.

```
+-----------------------------------------------------------------------------------------+
|                                    THREAT LANDSCAPE                                     |
+-----------------------------------------------------------------------------------------+
| Threat Category        | Severity | Current State                                       |
+------------------------+----------+-----------------------------------------------------+
| Authentication Bypass  | CRITICAL | 100% Client-side simulated; no backend token checks |
| Privilege Escalation   | CRITICAL | Any client can switch to MEMBER_SECRETARY role      |
| Broken Object Access   | HIGH     | No record-level ownership checks (IDOR vulnerable)  |
| Audit Trail Tampering  | HIGH     | Claimed "tamper-evident" log has no integrity chain |
| Information Leakage    | MEDIUM   | Stack trace returned in non-production error handler|
| CORS Wildcard          | MEDIUM   | origin: '*' permits arbitrary cross-origin calls    |
| Misleading Branding    | LOW      | Implies official AICTE copyright in prototype demo  |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Forensic Review of Core Security Domains

### 2.1 Authentication & Session / Token Handling
- **Current Implementation:**  
  `client/src/context/AuthContext.tsx` contains a static dictionary `PRESET_USERS` mapping `UserRole` to pre-baked profiles. Calling `login(selectedRole)` simply writes `saksham_authenticated: true` to the browser's `localStorage`.  
  On the backend, `server/src/app.ts` does not contain any authentication middleware. No JWT tokens, Bearer headers, or session cookies are required or validated.
- **Vulnerability:**  
  Any external client or script can issue requests directly to `/api/applications`, `/api/rules`, `/api/evc`, `/api/compliance`, `/api/documents`, and `/api/audit` without providing any authentication credentials whatsoever.
- **Required Remediation:**  
  Implement a standards-compliant stateless JWT architecture:
  - Issue cryptographically signed short-lived JWT access tokens (15-minute validity) accompanied by HttpOnly, Secure, SameSite refresh tokens (7-day validity).
  - Verify tokens on every protected route via an Express `authenticateToken` middleware.

### 2.2 Password Handling & Credential Storage
- **Current Implementation:**  
  In `client/src/pages/LoginPage.tsx`, the password field is hardcoded with a static masked string (`'••••••••••••'`). Submitting the form ignores the input value.  
  In `server/prisma/schema.prisma`, `model SystemUser` possesses fields for `id`, `username`, `email`, `fullName`, `role`, `region`, and `department`, but **completely lacks a password or credential hash field**.
- **Vulnerability:**  
  There is currently no password authentication mechanism implemented in the database or server.
- **Required Remediation:**  
  - Add `passwordHash String` and `salt String` to `SystemUser` in `schema.prisma`.
  - Hash passwords using **Argon2id** (memory: 64MB, iterations: 3) or **bcrypt** (cost factor 12+).
  - Enforce password complexity policies (minimum 12 characters, uppercase, lowercase, numbers, special characters).

### 2.3 Role-Based & Record-Level Authorization (RBAC & Tenancy)
- **Current Implementation:**  
  The frontend provides a "Dev Role Simulator" in the top navigation bar (`AppLayout.tsx`) allowing users to switch between `SCRUTINY_OFFICER`, `REGIONAL_OFFICER`, `EVC_EXPERT`, `SAC_SHC_MEMBER`, `MEMBER_SECRETARY`, and `SYSTEM_ADMIN` with a single click.  
  The backend API endpoints have zero role-based access checks.
- **Vulnerabilities:**
  1. **Vertical Privilege Escalation:** An unprivileged user or external client can invoke administrative endpoints without permission.
  2. **Insecure Direct Object Reference (IDOR):** An institution or regional officer can view or modify applications outside their jurisdiction because endpoints do not check record ownership.
  3. **Violation of Regional Tenancy:** A Regional Officer assigned to Western Region (WRO) must not have operational authority to clear scrutiny or schedule EVCs for Southern Region (SRO) applications.
- **Required Remediation:**  
  Implement two-tier authorization middleware on Express:
  - `requireRole(allowedRoles: UserRole[])`: Validates the authenticated user's role against the endpoint's permitted roles.
  - `requireJurisdiction(applicationIdParam: string)`: Ensures the officer's assigned region matches the target application's region (except for Council HQ / `MEMBER_SECRETARY`).

### 2.4 SQL Injection & Input Validation
- **Current Implementation:**  
  Current backend controllers filter in-memory arrays and do not execute SQL queries. Zod is declared as a dependency (`zod: ^3.23.8`), but **no Zod request validation middleware is wired into any route**.
- **Vulnerabilities:**  
  Query parameters (`?stage=`, `?region=`, `?search=`) in `applicationController.ts` are checked only with basic `typeof === 'string'` checks. When database persistence is enabled, unvalidated query inputs could introduce SQL injection or schema bypass vulnerabilities if raw queries or unsanitized Prisma inputs are used.
- **Required Remediation:**  
  - Create reusable Zod schemas for all request queries, route parameters, and mutation payloads.
  - Apply a generic validation middleware: `validateRequest({ body, query, params })`.
  - Strictly utilize Prisma Client parameterized query builders; never concatenate strings into `$queryRaw`.

### 2.5 File Upload & Storage Safety
- **Current Implementation:**  
  File uploads (such as institutional undertakings, fire NOCs, and lease deeds) are simulated via browser alerts. No file upload endpoint (`multipart/form-data`) exists.
- **Vulnerabilities for Upcoming Phases:**  
  Accepting user-uploaded PDF or image documents creates high-risk vectors: malicious executable uploads, oversized files (DoS), MIME-type spoofing, and path traversal.
- **Required Architecture for Implementation:**
  - Validate files by checking file magic bytes (binary signatures), not merely file extensions or client-sent MIME headers.
  - Enforce maximum upload limit: 10 MB per PDF document.
  - Store files outside the web root in private cloud object storage (e.g., S3 or MinIO) with random UUID filenames.
  - Serve uploaded documents exclusively through short-lived (15-minute) pre-signed download URLs.
  - Scan all incoming files asynchronously using an anti-malware service (e.g., ClamAV).

### 2.6 Exposed Credentials & Environment Defaults
- **Current Implementation:**  
  `.env.example` contains placeholder secrets:
  - `JWT_SECRET="placeholder_dev_jwt_secret_change_in_production_min32chars"`
  - `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/saksham_db?schema=public"`
  - `CORS origin: '*'` in `server/src/app.ts`.
- **Vulnerabilities:**  
  Using default or placeholder secrets in production leads to total token forgery. Wildcard CORS allows malicious sites to make cross-origin requests from authenticated browser sessions.
- **Required Remediation:**  
  - Enforce startup validation with `dotenv-safe` or Zod to prevent the server from booting in production if `JWT_SECRET` equals the default placeholder or is under 32 characters.
  - Restrict CORS origin strictly to verified frontend domain origins (e.g., `process.env.CLIENT_ORIGIN`).

### 2.7 Information Leakage & Error Handling
- **Current Implementation:**  
  `server/src/middleware/errorHandler.ts` lines 25–26:
  ```typescript
  ...(process.env.NODE_ENV !== 'production' && { details: err.details, stack: err.stack }),
  ```
- **Vulnerability:**  
  If `NODE_ENV` is not explicitly set to `production` (which is common in misconfigured deployments), the server exposes full internal stack traces, filenames, line numbers, and database error messages to callers.
- **Required Remediation:**  
  Ensure stack traces are exclusively logged to secure internal log streams (e.g., Winston/Pino) and never serialized into the HTTP response body under any condition.

---

## 3. Forensic Integrity Audit of the Audit Ledger

### 3.1 Analysis of the Claimed "Tamper-Evident" Audit Trail
In `docs/ARCHITECTURE.md` and UI footers, SAKSHAM claims to provide an **"immutable, tamper-evident forensic audit log"**.  
An inspection of `server/prisma/schema.prisma` (`model AuditLogEntry`) and `shared/src/mockData.ts` reveals:

```prisma
model AuditLogEntry {
  id              String       @id @default(uuid())
  timestamp       DateTime     @default(now())
  actorId         String
  actorName       String
  actorRole       UserRole
  actionCode      String
  actionTitle     String
  entityType      String
  entityId        String
  details         String
  ipAddressMasked String
  previousState   String?
  newState        String?
}
```

### Critical Finding: The Current Ledger Has Zero Tamper-Evidence
1. **No Cryptographic Chaining:** There is no previous block/entry hash pointer (`previousHash`), current hash (`currentHash`), or HMAC signature.
2. **Modifiable in SQL:** Any database administrator, compromised service account, or SQL injection attacker can execute `UPDATE "AuditLogEntry" SET ...` or `DELETE FROM "AuditLogEntry"` without leaving any algorithmic trace of tampering.
3. **Foreign Key Constraint Flaw:** `AuditLogEntry` defines `application Application? @relation(fields: [entityId], references: [id])`. But `entityType` can be `RULE`, `EVC`, `COMPLIANCE`, or `DOCUMENT`. If a non-application entity ID is entered, database foreign key constraints will fail or prevent logging!

### 3.2 Proposed Verifiable Tamper-Evident Hash-Chained Ledger Architecture

To turn the audit trail into a genuinely tamper-evident forensic ledger:

```
[Entry N-1]                                [Entry N]
+------------------------------------+     +------------------------------------+
| id: aud-101                        |     | id: aud-102                        |
| timestamp: 2026-10-23T10:00:00Z    |     | timestamp: 2026-10-23T10:05:00Z    |
| actorId: usr-ro-01                 |     | actorId: usr-scr-02                |
| actionCode: EVC_SCHEDULED          |     | actionCode: DEFICIENCY_RECORDED    |
| payloadHash: SHA256(payload)       |     | payloadHash: SHA256(payload)       |
| previousHash: 8f9b...a12c          |     | previousHash: e3b0...9f1a --------+ [Points to N-1 Hash]
| currentHash:  e3b0...9f1a ---------+---->| currentHash:  4a7c...88bc          |
| digitalSignature: RSA_SIGN(currHash)|    | digitalSignature: RSA_SIGN(currHash)|
+------------------------------------+     +------------------------------------+
```

#### Mathematical Hash Formula:
$$\text{EntryHash}_N = \text{HMAC-SHA256}\left(\text{Secret}, \text{EntryHash}_{N-1} \parallel \text{Timestamp} \parallel \text{ActorID} \parallel \text{ActionCode} \parallel \text{PayloadHash}\right)$$

#### Database Schema Enhancement:
```prisma
model AuditLogEntry {
  id               String       @id @default(uuid())
  sequenceNumber   BigInt       @unique @default(autoincrement())
  timestamp        DateTime     @default(now())
  actorId          String
  actorRole        UserRole
  actionCode       String
  actionTitle      String
  entityType       String
  entityId         String
  payloadDigest    String       // SHA-256 hash of previousState + newState + details
  ipAddressMasked  String
  
  // Cryptographic Tamper-Evidence
  previousEntryHash String     // Hash of sequenceNumber - 1
  currentEntryHash  String     // HMAC-SHA256 of this entry including previousEntryHash
  serverSignature   String?    // Ed25519 or RSA signature generated by private key
  
  createdAt        DateTime     @default(now())

  @@index([entityType, entityId])
  @@index([actorId])
  @@index([sequenceNumber])
}
```

---

## 4. Government Identity & Emblem Compliance

### Legal Notice & Brand Representation
The user prompt explicitly mandates:
> *"Do not display a real official government emblem or imply AICTE commissioning unless authorized; use a neutral prototype identity otherwise."*

- **Current State:**  
  `client/src/components/layout/AppLayout.tsx` and `client/src/components/common/GovtEmblem.tsx` render an Indian flag SVG and custom gold seal, but the header and footer display text claiming:
  - *"अखिल भारतीय तकनीकी शिक्षा परिषद / ALL INDIA COUNCIL FOR TECHNICAL EDUCATION"*
  - *"भारत सरकार | Government of India • शिक्षा मंत्रालय (Ministry of Education)"*
  - *"© 2026 All India Council for Technical Education (AICTE). All Rights Reserved."*
- **Compliance Risk:**  
  Displaying official copyright and ministry attribution in an academic/hackathon prototype without formal commissioning can be misconstrued as an official government portal.
- **Recommended Remediation:**  
  Maintain the visual elegance while clearly qualifying the identity:
  - Change header banner to: **"SAKSHAM — Prototype Research Platform for AICTE Workflows (SIH Problem Statement 26262)"**.
  - Update footer copyright to: **"Developed for Smart India Hackathon 2026 (Problem Statement 26262). Academic Prototype Demonstration — Not an Official Government Portal."**
