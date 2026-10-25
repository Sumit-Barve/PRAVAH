# SAKSHAM — Project Charter
## AICTE Approval Workflow Automation & Compliance Management System
**Tagline:** Intelligent Scrutiny. Automated Workflows. Transparent Compliance.  
**Initiative:** Smart India Hackathon (SIH) — Problem Statement ID 26262  
**Domain:** Ministry of Education / All India Council for Technical Education (AICTE)  
**Project Phase:** Phase 1 — Project Foundation & Government-Grade Administrative Portal Shell  

---

### 1. Executive Summary & Problem Background
The All India Council for Technical Education (AICTE) regulates technical and management education institutions across India in accordance with the AICTE Act (Act 52 of 1987). Each academic cycle, thousands of technical institutions submit applications for:
- Establishment of New Technical Institutions
- Extension of Approval (EoA) for Existing Institutions
- Increase in Approved Intake / Introduction of New Programs or Courses
- Introduction of Supernumerary Seats (FN / OCI / CIWG / NRI)
- Change of Site / Location or Change in Name of Institution / Trust
- Conversion of Women’s Institutions into Co-ed Institutions
- Progressive or Complete Closure of Programs / Institutions

Under the conventional process, applications transition through intense multi-stage evaluation pipelines:
1. **Online Institutional Submission & Initial Fee/Data Ingestion**
2. **Scrutiny Committee (Physical / Virtual document examination)**
3. **Re-Scrutiny Committee (Opportunity for rectification of minor deficiencies)**
4. **Expert Visit Committee (EVC) (Physical on-site inspection of land, building, faculty, labs)**
5. **Standing Hearing Committee (SHC) (Formal hearing for contested deficiencies)**
6. **Standing Appellate Committee (SAC) (Appeals process)**
7. **Executive Committee (EC) / Approval Bureau Final Review**

Processing application queues at scale while monitoring time-bound undertakings, lease tenures, occupancy certificates, fire safety NOCs, and accreditation validity strains AICTE officials and regional officers.

**SAKSHAM** is engineered as an integrated, role-based workflow automation, compliance monitoring, and alert escalation platform built from the operational perspective of AICTE officials.

---

### 2. Primary Goals & Objectives (SIH PS 26262)
1. **End-to-End Workflow Orchestration:** Transparent, stage-wise application routing across Scrutiny, Re-Scrutiny, EVC, SHC, and SAC.
2. **Application Ageing & Bottleneck Visibility:** Stage-wise pendency tracking, highlighting stalled applications before statutory regulatory deadlines lapse.
3. **EVC Planning & Escalation Management:** Dynamic scheduling of Expert Visit Committees, alert triggers for non-submission of inspection reports, and committee composition monitoring.
4. **Institutional Undertaking Tracking:** Automated tracking of conditional approvals granted subject to time-bound affidavits/undertakings (e.g., pending land titles, fire NOC renewals, faculty recruitment).
5. **Document Validity Auditing:** Proactive alerting for land lease agreements approaching expiry, expiring municipal approvals, fire safety certificates, and NBA accreditations.
6. **Immutable Regulatory Audit Trails:** Full forensic traceability of every administrative decision, finding, committee note, and stage change.

---

### 3. Cardinal Regulatory Guardrail
> **MANDATORY PRINCIPLE:**  
> SAKSHAM is an administrative and analytical decision-support system for authorized AICTE officials, regional officers, and appointed expert committees. **It does NOT and shall NEVER independently or autonomously grant regulatory approval.**  
> Regulatory approval remains the sole legal prerogative of the authorized statutory authorities (Regional Committees, Approval Bureau, and the Executive Committee of the AICTE).

---

### 4. Scope Boundaries & SIH Problem Statement Integrity
- **In Scope (PS 26262):**
  - Workflow queues, stage transitions, and pendency calculation.
  - Document validity monitoring (Lease, Fire NOC, Occupancy, NBA, FDR).
  - Time-bound compliance and institutional undertaking lifecycle.
  - EVC scheduling, dispatch, report receipt, and delay escalation.
  - Forensic audit logs, role-based access, and executive dashboards.
- **Out of Scope (Distinct from other SIH statements):**
  - Advanced forensic pixel-level document-forgery detection (separate problem statement).
  - Unsupervised automated approval algorithms.
  - Direct live scraping or unauthorized tampering with legacy production databases.

---

### 5. Stakeholder Profiles & Roles
| Role Name | Scope of Responsibility | Primary Portal Interactions |
| :--- | :--- | :--- |
| **Scrutiny Officer / Expert** | Reviews submitted institutional documents against APH norms. | Scrutiny checklist, deficiency recording, recommendation. |
| **Regional Officer (RO)** | Manages Regional Office queue, assigns EVCs, verifies compliance. | Regional queue, committee constitution, escalation review. |
| **EVC Expert / Convener** | Conducts on-site verification of infrastructure, faculty, equipment. | Inspection schedule, geo-tagged observation upload, EVC report. |
| **Hearing/Appeals Officer (SHC/SAC)** | Presides over contested applications and institutional representations. | Hearing schedules, document submission review, hearing notes. |
| **Approval Bureau / Member Sec.** | Oversees nationwide approval progress, bottleneck resolutions. | Executive analytics, regulatory rule management, policy overrides. |
| **Institutional Representative (View)**| Submits undertakings and reviews compliance deficiency status. | Status tracker, deficiency response, compliance uploads. |

---

### 6. Phase 1 Deliverables
- Clean monorepo architecture (React + Vite + TypeScript frontend, Express + TypeScript + Prisma backend, PostgreSQL setup).
- Government-grade administrative UI inspired by national digital design guidelines (deep navy blue, crisp typography, accessible contrast, restrained saffron/green indicators).
- Unified synthetic demo dataset backing 10 core routes (`/login`, `/dashboard`, `/applications`, `/workflow-queue`, `/evc`, `/compliance`, `/document-validity`, `/reports`, `/audit`, `/admin/rules`).
- Complete regulatory and architectural documentation suite.
