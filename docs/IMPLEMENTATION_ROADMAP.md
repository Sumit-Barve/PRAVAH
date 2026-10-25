# SAKSHAM — Multi-Phase Implementation Roadmap
## AICTE Approval Workflow Automation & Compliance Management System (SIH PS 26262)

---

### Phase 1: Project Foundation & Government-Grade Administrative Shell (Current Phase)
- **Goal:** Establish a robust TypeScript monorepo, clean technical architecture, PostgreSQL schema with Prisma, and a government-grade administrative web portal.
- **Milestones:**
  1. Complete workspace setup with npm workspaces (`client`, `server`, `shared`).
  2. Official Regulatory Source Register and Rules Register documenting APH 2024–27 norms.
  3. Relational Prisma Schema modeling all core entities (Applications, Scrutiny, EVC, Compliance, Documents, Audit).
  4. Backend Express service with health, readiness, and API routes.
  5. Tailored government-grade administrative design system (deep navy blue, crisp typography, accessible tables, restrained saffron/green indicators).
  6. Comprehensive dashboard and 9 operational queue/management routes with deterministic synthetic dataset.
  7. Prototype notice and non-claim disclaimer clearly visible.

---

### Phase 2: PostgreSQL Persistence, Authentication & Scrutiny Engine
- **Goal:** Activate live PostgreSQL database persistence and implement role-based authentication with fine-grained scrutiny checklists.
- **Milestones:**
  1. Run Prisma database migrations against containerized PostgreSQL (`prisma migrate dev`).
  2. Implement secure authentication (OAuth2 / SAML / JWT with HTTP-only cookies) supporting AICTE officer roles:
     - Scrutiny Officer
     - Regional Officer (RO)
     - EVC Convener & Expert
     - Standing Hearing / Appellate Committee (SHC/SAC) Member
     - System Administrator / Bureau Officer
  3. Interactive scrutiny checklist interface with document preview, automated checklist evaluation, and deficiency recording.
  4. Automated issuance of deficiency letters and trigger for Re-Scrutiny workflows.

---

### Phase 3: EVC Committee Scheduling & Inspection Escalations
- **Goal:** Operationalize Expert Visit Committee (EVC) logistics, committee constitution, inspection reporting, and delay escalations.
- **Milestones:**
  1. Conflict-of-interest-free automated committee recommendation algorithm.
  2. Officer inspection calendar with geo-tagging support and observation upload workflows.
  3. 48-hour post-inspection report submission countdown timers.
  4. Multi-tier alert escalation: Regional Officer alert at 24h, Member Secretary escalation at 48h for delayed EVC reports.

---

### Phase 4: Time-Bound Undertakings & Document Validity Engine
- **Goal:** Automate institutional compliance tracking and proactive document expiry alerting.
- **Milestones:**
  1. Time-bound conditional approval undertaking management (30, 60, 90-day compliance windows).
  2. Automated daily cron scheduler checking document validity (Land Lease, Fire Safety NOC, Occupancy, NBA Accreditation, FDR).
  3. Configurable multi-stage reminder notices (180-day advisory, 90-day warning, 30-day show-cause trigger).
  4. Institution compliance upload portal with versioned document submission history.

---

### Phase 5: Appellate (SAC/SHC) Hearings, Advanced Reporting & Audit Forensics
- **Goal:** Support statutory hearing workflows, consolidated regional reports, forensic audit trails, and authorized legacy gateway integration.
- **Milestones:**
  1. Standing Hearing Committee (SHC) and Standing Appellate Committee (SAC) docket management.
  2. Hearing schedule notice generation, digital case sheet preparation, and signed hearing minutes recording.
  3. Consolidated national and regional analytical dashboards with exportable reports (PDF / Excel).
  4. Cryptographic immutable audit trail logging all state transitions.
  5. Authorized read-only gateway connector for legacy AICTE portal data synchronization.
