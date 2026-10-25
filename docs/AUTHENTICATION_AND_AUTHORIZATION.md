# SAKSHAM — Authentication and Server-Side Authorization Specification
**Phase 3A Architecture & Implementation Guide**  
**SIH Problem Statement 26262 | AICTE Approval Workflow & Compliance Management System**

---

## 1. Executive Summary & Security Objectives

SAKSHAM manages high-stakes statutory approvals for technical institutions under the mandate of the All India Council for Technical Education (AICTE) and the Supreme Court strict timeline mandate (*Parshvanath Charitable Trust*, (2013) 3 SCC 385). 

Phase 2 established a database-backed REST API and read-only pages. However, Phase 2 lacked server-side identity verification: client components stored a synthetic active role in browser `localStorage`, and all Express endpoints were unprotected.

Phase 3A establishes:
1. **Cryptographic Identity Verification:** Passwords stored exclusively as **Argon2id** hashes with salt and memory-hardness parameters per OWASP guidelines.
2. **Authoritative Session Management:** Short-lived signed JWT stored in a **SameSite=Lax, HttpOnly, Secure** cookie (`saksham_token`), accompanied by active user checks and `tokenVersion` revocation in PostgreSQL.
3. **Defense-in-Depth CSRF & Origin Validation:** Origin validation, double-submit CSRF cookie (`saksham_csrf_token`), and mandatory custom headers on state-changing operations (`POST`, `PUT`, `PATCH`, `DELETE`).
4. **Authoritative Server-Side Role-Based Access Control (RBAC):** Strict middleware guards verifying roles and regional jurisdictions on every protected route. The browser's declared role is never trusted.
5. **Separation of Duties & Human Authority Safeguards:** `SYSTEM_ADMIN` is strictly segregated from regulatory evaluation and approval powers. System administrators manage IT infrastructure and accounts; only authorized AICTE officers (`SCRUTINY_OFFICER`, `REGIONAL_OFFICER`, `MEMBER_SECRETARY`, `SAC_SHC_MEMBER`) can evaluate or sign off on institutional approval dockets.
6. **Audit Trail Integration:** Authentication lifecycle events (login success, login failure, logout, account lockout, privilege escalation attempts) are written to the database audit ledger with masked IP addresses.

---

## 2. Authentication Architecture

### 2.1 Password Hashing Specification
- **Algorithm:** Argon2id (hybrid data-dependent memory access preventing GPU and side-channel attacks)
- **Time Cost (Iterations):** 3
- **Memory Cost:** 65,536 KiB (64 MiB)
- **Parallelism:** 1 thread
- **Salt:** Automatically generated 16-byte cryptographically secure random salt per hash
- **Implementation:** `argon2` npm library (native RFC 9106 implementation)

### 2.2 Session Transport & Cookie Strategy
- **Cookie Name:** `saksham_token`
- **Payload Contents:**
  ```json
  {
    "sub": "usr-ro-01",
    "username": "neelesh.verma",
    "role": "REGIONAL_OFFICER",
    "region": "CENTRAL",
    "tokenVersion": 0,
    "iat": 1729778400,
    "exp": 1729807200
  }
  ```
- **Lifespan:** 8 hours (statutory officer working shift)
- **Cookie Security Flags:**
  - `HttpOnly: true` (Inaccessible to JavaScript; immune to XSS token exfiltration)
  - `SameSite: 'lax'` (Mitigates cross-site request forgery)
  - `Secure: true` (Enforced in production; optional over HTTP on `localhost` for local testing)
  - `Path: '/'`

### 2.3 Stateful Revocation via `tokenVersion`
While JWT verification is fast, pure stateless JWTs cannot be revoked immediately if an officer's account is compromised, disabled, or an officer logs out. SAKSHAM couples JWT verification with a database `tokenVersion` and `isActive` check:
1. When a user changes their password, is disabled by an administrator, or performs a global logout, their database `tokenVersion` is incremented.
2. In the `requireAuth` middleware, the token's `tokenVersion` is compared to the database. A mismatch causes immediate rejection (HTTP 401).

### 2.4 CSRF & Origin Protection
1. **Origin / Referer Validation:** For state-changing HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`), the request `Origin` header must match the configured application origin (`ALLOWED_ORIGINS`).
2. **Double-Submit CSRF Token:** On login, an additional non-HttpOnly cookie `saksham_csrf_token` is issued. Frontend API requests send this token in the `x-csrf-token` header, and the server validates match.
3. **Custom Client Header:** Requests must include `X-Requested-With: XMLHttpRequest` or `X-Saksham-Client: web`.

### 2.5 Brute-Force & Rate Limiting
- **Endpoint:** `POST /api/auth/login`
- **Rate Limit:** 5 requests per 15 minutes per IP address.
- **Account Lockout:** 5 consecutive failed login attempts lock the user account for 15 minutes (`lockedUntil`).
- **Response Consistency:** Constant-time comparison and identical generic error message (`"Invalid username or password"`) for both non-existent users and incorrect passwords to prevent user enumeration.

---

## 3. Statutory Role-Based Access Control (RBAC) Matrix

AICTE statutory processes require clear separation of duties. SAKSHAM defines 6 roles:

| Role Code | Title & Description | Statutory Authority |
| :--- | :--- | :--- |
| `MEMBER_SECRETARY` | AICTE Executive Leadership | Council-level national authority. Final institutional approval sign-off, national reports, Council orders. |
| `REGIONAL_OFFICER` | Regional Office Director | Jurisdictional officer for 1 of 8 regional offices. Manages regional queues, constitutes EVC panels. |
| `SCRUTINY_OFFICER` | Scrutiny Committee Expert | Preliminary document verification, faculty cadre audits, deficiency reporting under APH Chapter I/II. |
| `EVC_EXPERT` / `EVC_CONVENER` | Expert Visit Committee Member | On-site physical infrastructure and laboratory verification under 48-hour reporting SLA (APH Sec 1.5.4). |
| `SAC_SHC_MEMBER` | Standing Appellate / Hearing Bench | Quasi-judicial bench hearing appeals against Scrutiny or EVC deficiencies. |
| `SYSTEM_ADMIN` | IT Infrastructure Administrator | Server maintenance, platform security, user onboarding. **No regulatory evaluation authority.** |

### 3.1 Endpoint & Resource Permission Matrix

| Resource / Action | Method & Endpoint | Permitted Roles | Regional Record-Level Scope |
| :--- | :--- | :--- | :--- |
| **Auth Identity** | `GET /api/auth/me` | All authenticated users | Self |
| **Login / Logout** | `POST /api/auth/login`, `/logout` | Public (Login) / Auth (Logout) | — |
| **Executive Dashboard** | `GET /api/metrics` | `MEMBER_SECRETARY`, `REGIONAL_OFFICER`, `SYSTEM_ADMIN` | National (MS/Admin) or Regional (RO) |
| **Applications Master Register** | `GET /api/applications` | All authenticated roles | Filterable. RO scoped to region when filtered. |
| **Application Details** | `GET /api/applications/:id` | All authenticated roles | Unrestricted read for authorized evaluators |
| **Scrutiny Queue** | `GET /api/applications?stage=SCRUTINY` | `SCRUTINY_OFFICER`, `REGIONAL_OFFICER`, `MEMBER_SECRETARY` | Scrutiny evaluators and regional supervisors |
| **EVC Management** | `GET /api/evc` | `EVC_EXPERT`, `REGIONAL_OFFICER`, `MEMBER_SECRETARY`, `SYSTEM_ADMIN` | EVC logistics and committee conveners |
| **Institutional Undertakings** | `GET /api/compliance` | `REGIONAL_OFFICER`, `MEMBER_SECRETARY`, `SYSTEM_ADMIN` | Compliance monitoring officers |
| **Document Validity** | `GET /api/documents` | `SCRUTINY_OFFICER`, `REGIONAL_OFFICER`, `MEMBER_SECRETARY`, `SYSTEM_ADMIN` | All inspection and scrutiny officers |
| **Regulatory Rules Register** | `GET /api/rules` | All authenticated roles | Public statutory reference |
| **Forensic Audit Ledger** | `GET /api/audit` | `MEMBER_SECRETARY`, `SYSTEM_ADMIN` | **Strictly restricted.** Evaluators cannot view full audit ledger. |
| **User Administration** | `GET /api/admin/users` | `SYSTEM_ADMIN` | Administrative IT division only |

### 3.2 Human Authority & Separation of Duties Boundary
1. **System Administrator Safeguard:** `SYSTEM_ADMIN` users cannot advance an application from `SCRUTINY` to `APPROVED`, sign an approval letter, or override deficiency findings.
2. **Single-Officer Barrier:** An officer assigned as `SCRUTINY_OFFICER` cannot serve as the `EVC_EXPERT` convener on the same institution file.
3. **No Automated Approval:** SAKSHAM assists evaluation and aggregates data. Letters of Approval (LoA) require explicit human member signature.

---

---

## 5. Institution Portal Authentication & Multi-Tenant Isolation

### 5.1 Role Addition & User Profile
- **Role:** `INSTITUTION_USER`
- **Institution Association:** Stored in `SystemUser.institutionId`, linking the representative to their verified `Institution` record.
- **Permanent Institute ID (PID):** Stored on the `Institution` model (e.g., `1-109923841`).

### 5.2 Server-Side Tenant Scoping
- **Strict Server Scoping:** `req.user.institutionId` is derived exclusively from the authenticated session. Any client-provided `institutionId` parameter in request payloads or query parameters is ignored or validated against `req.user.institutionId`.
- **Cross-Tenant Access Denial:** Any attempt by an institution to access `/api/institution/applications/:id` or `/api/institution/applications/:id/documents/:docId/file` belonging to a different institution results in HTTP 404/403.
- **Officer Privilege Guard:** An institution user attempting to access officer routes (e.g. `/api/audit`, `/api/applications`, `/api/rules`, `/api/evc`) is blocked by `requireOfficer` middleware with HTTP 403 Forbidden.

### 5.3 Complete Authentication Endpoints
- `POST /api/auth/register-institution`: Public registration creating institution and representative records.
- `POST /api/auth/verify-email`: Opaque token verification activating the institution account.
- `POST /api/auth/login`: Real email & password authentication, issuing HttpOnly JWT and CSRF cookies.
- `GET /api/auth/me`: Validates active cookie, checks `tokenVersion`, and returns user & institution profile.
- `POST /api/auth/logout`: Clears session cookies and revokes active token version in PostgreSQL.
- `POST /api/auth/forgot-password`: Generates secure password reset token (logged to dev outbox).
- `POST /api/auth/reset-password`: Consumes reset token and sets new Argon2id password hash.
- `GET /api/auth/dev-outbox`: Local development endpoint exposing simulated emails and tokens for seamless testing.

