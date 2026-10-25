# SAKSHAM — Regulatory Verification Matrix
## Statutory Traceability, Handbook Citations & Legal Rule Verification
**Project Name:** SAKSHAM  
**Subtitle:** AICTE Approval Workflow & Compliance Management System  
**SIH Problem Statement ID:** 26262  
**Audit Priority:** Highest Priority  
**Primary Regulatory Starting Point:** All India Council for Technical Education Official Portal ([https://www.aicte.gov.in/](https://www.aicte.gov.in/))  
**Primary Statutory Source:** AICTE Approval Process Handbook (APH) 2024–25 to 2026–27 ([https://www.aicte.gov.in/sites/default/files/APH%20Final.pdf](https://www.aicte.gov.in/sites/default/files/APH%20Final.pdf))  
**Judicial Benchmark:** Supreme Court of India in *Parshvanath Charitable Trust & Ors. v. AICTE & Ors.* (2013) 3 SCC 385  

---

## 1. Classification Methodology & Standards

Every regulatory claim, workflow interval, threshold, and citation found in SAKSHAM's codebase and documentation has been verified against published official AICTE sources and relevant statutory/judicial precedents. Each provision is assigned exactly one legal status classification:

1. **Verified applicable rule:** Directly supported by published text in the official APH 2024–27 or statutory act with universal force for the specified category.
2. **Verified rule with limited scope:** Legally supported by official sources, but applicable only to specific program types, institution categories, or geographic exemptions, rather than universally.
3. **Operational policy — requires an authorized internal source:** Established through annual public notices, procedural office memoranda, or executive council circulars rather than permanent handbook text.
4. **Unverified:** Proposed, inferred, or prototype rule without traceable official statutory documentation. Retained strictly as an unresolved item.
5. **Incorrect or contradicted by source:** Directly refuted, misattributed, or contradicted by published handbook norms or judicial orders.

---

## 2. Comprehensive Regulatory Verification Table

| No. | Implemented Claim / Rule | SAKSHAM Current Representation | Official Classification | Statutory / Judicial Evidence & Legal Grounding | Traceable Official Source & Citation | Exact Scope & Limitations |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Application Submission Window: February 1–28** | Hardcoded in docs and calendar stepper as a static statutory window. | **Operational policy — requires an authorized internal source** | APH does not fix a calendar date of Feb 1–28 in statutory regulations. The application window is published annually via **Official Public Notice** in national dailies and AICTE portal. For AY 2024–25, AICTE opened submissions on Dec 6, 2023, with extensions into Feb 2024. | AICTE Approval Bureau Annual Public Notices & Portal Notifications ([https://www.aicte.gov.in](https://www.aicte.gov.in)) | All Technical & Management Institutions (New & Existing). Window dates shift annually based on Council notification. |
| **2** | **First Scrutiny & Deficiency Communication: March 1–20** | Modeled in stepper as "April 10 / March 1–20 Cutoff". | **Operational policy — requires an authorized internal source** | Neither APH 2024–27 nor *Parshvanath* mandates March 1–20 as fixed calendar days. *Parshvanath* (Para 46.2) mandates that AICTE must communicate defects within **three weeks** from receipt of application/inspection. Annual milestone dates vary by Council calendar. | Supreme Court Judgment in *Parshvanath Charitable Trust* (2013) 3 SCC 385 (Para 46.2); APH Ch. I Sec 1.3 | New Institutions & Extension of Approval with Deficiencies. |
| **3** | **Re-Scrutiny and EVC: March 21–April 15** | Modeled in stepper as fixed calendar window (Re-scrutiny April 25, EVC May 10). | **Operational policy — requires an authorized internal source** | Re-scrutiny and EVC scheduling are sequential operational phases triggered by deficiency rectifications. Under *Parshvanath*, applicants receive **15 days** to cure defects. Rigid calendar intervals must be dynamically configured per academic cycle. | *Parshvanath Charitable Trust v. AICTE* (2013) 3 SCC 385 (Para 46.3); APH Ch. I Sec 1.5 | Applications with rectifiable deficiencies under Chapter I/II. |
| **4** | **SHC/SAC Processing: April 16–30** | Stepper marks SHC as May 20 and SAC as May 31. | **Verified rule with limited scope** | Standing Hearing Committee (SHC) and Standing Appellate Committee (SAC) are statutory quasi-judicial hearing bodies constituted under AICTE Act Sec 10(k) and APH Chapter VIII. Institutions have a statutory right to appeal before SAC within **10 calendar days** of SHC recommendation. | AICTE Act 1987 Sec 10(k); APH 2024–27 Chapter VIII, Section 8.2, pp. 95–98 | Aggrieved institutions whose applications are rejected or severely penalized by Scrutiny/EVC. |
| **5** | **Final Decision / Letter Cutoff: June 10** | Stepper marks June 10 as "National Cutoff Date (June 10 Non-Extendable)" citing *Parshvanath*. | **Incorrect or contradicted by source** | In the landmark *Parshvanath* judgment (2013) 3 SCC 385, the Supreme Court mandated **April 30** as the final cutoff for AICTE approval grant/refusal! **June 10** was historically fixed for *Affiliating University / State Government* approvals, not AICTE's initial council decisions (though subsequent annual MAs have modified timelines in specific years). Confusing AICTE cutoff with university affiliation deadline is factually incorrect. | *Parshvanath Charitable Trust v. AICTE* (2013) 3 SCC 385 (Schedule at p. 411); AICTE Annual Calendar Orders | Council approval decisions (LoA / EoA) nationwide. |
| **6** | **Universal 7-Day Scrutiny Turnaround SLA** | Hardcoded in `MOCK_REGULATORY_RULES` (REG-001, REG-004) and `StatutoryCalendarStepper.tsx`. | **Operational policy — requires an authorized internal source** | The 7-day turnaround is an internal administrative service-level agreement (SLA) adopted for administrative efficiency. It is **not** a statutory rule in APH 2024–27. *Parshvanath* allows up to 21 days (3 weeks) for deficiency communication. Treating 7 days as a legal requirement is legally unverified. | AICTE Citizen Charter / Internal E-Governance SOP; Not published in APH 2024–27 statutory text | Scrutiny Committee file review allocations. |
| **7** | **EVC Report Submission Within 48 Hours** | Hardcoded in REG-011 and `StatutoryCalendarStepper.tsx`. | **Verified applicable rule** | Explicitly mandated by AICTE EVC Inspection Guidelines. The Committee Convener and Expert Members must finalize, sign, and upload the geo-tagged inspection report along with time-stamped multimedia evidence within **48 hours (2 days)** of completing the campus visit. | APH 2024–27 Chapter I, Section 1.5.4, p. 25; AICTE Digital Inspection Manual | All physical and hybrid Expert Visit Committees (New, EoA with Deficiencies, Intake Increase). |
| **8** | **Universal 30/60/90-Day Conditional Compliance Periods** | Hardcoded in REG-009, REG-010, `CompliancePage.tsx`, and `schema.prisma`. | **Verified rule with limited scope** | While conditional approvals subject to affidavits exist (e.g. appointment of faculty cadre, Fire NOC renewal, mutation of revenue land), the compliance period depends entirely on the nature of the undertaking. Some allow 90 days; others require compliance prior to commencement of academic session (August 1) or grant up to 6 months. A single universal 90-day period across all categories does not exist. | APH 2024–27 Chapter II Section 2.7 & Executive Committee Circulars | Institutions granted conditional Extension of Approval (EoA) subject to undertakings. |
| **9** | **Minimum Land Lease Tenure of 30 Years** | Hardcoded in REG-001, `ScrutinyEvaluationModal.tsx`, and `DocumentValidityPage.tsx`. | **Verified applicable rule** | APH 2024–27 requires that land must either be owned by the trust/society or held on a registered government/private lease for a **minimum period of 30 years**. Furthermore, the remaining live lease must not fall below the duration of the longest program offered; otherwise EoA is withheld until 30-year renewal is proven. | APH 2024–27 Chapter I, Section 1.3(a), p. 16; Appendix 4 / Annexure 3 | All Technical & Polytechnic Institutions operating on leased land. |
| **10** | **Fire Safety NOC Expiry Handling** | Hardcoded in REG-009, `DocumentValidityPage.tsx`, and `ScrutinyEvaluationModal.tsx`. | **Verified applicable rule** | A valid Fire & Life Safety Certificate from the competent State Fire Authority is mandatory before submission and throughout operation. Validity tenure (1–5 years) is governed by State Fire Acts. Operating with an expired Fire NOC is a non-negotiable compliance breach under NBC 2016 and APH norms. | National Building Code of India (NBC 2016); APH 2024–27 Chapter I, Section 1.3(f), p. 19 | All institutional premises, laboratories, and hostel structures. |
| **11** | **NBA / NAAC Accreditation Tenure & Intake Expansion** | Hardcoded in REG-005: "Minimum 50% eligible courses NBA accredited with score >= 675". | **Verified rule with limited scope** | In APH 2024–27, AICTE introduced 3-year block approvals and lifted rigid intake caps for well-performing institutions. To qualify for expansion/multi-year EoA, institutions must have valid NBA accreditation in at least **30% of eligible courses** (or valid NAAC >= 3.01 / NIRF top 100). The 50% / score >= 675 threshold is an older handbook formulation or restricted to Tier-1 autonomous expansions. | APH 2024–27 Chapter III, Section 3.2, pp. 48–51; AICTE Gazette Notification F. No. AB/AICTE/REG/2024 | Existing institutions seeking addition of new courses or expansion of approved intake. |
| **12** | **Minimum Land, Built-up Area & FSR / FAR Calculations** | Hardcoded as static acreages (`7.5 acres`, `10.2 acres`) in `mockData.ts` and `ApplicationDetailDrawer.tsx`. | **Incorrect or contradicted by source** | **Major Regulatory Shift in APH 2024–27 (Appendix 4 / Annexure 3):** AICTE abolished rigid historical acreage minimums (e.g., 2.5 acres urban, 5 acres rural). Under APH 2024–27, the land required is **governed by the prevailing FSI/FAR (Floor Space Index / Floor Area Ratio) norms declared by the local competent town planning authority**. The land must simply be sufficient to legally accommodate the mandatory instructional, administrative, and amenities built-up area under local building bye-laws. SAKSHAM's codebase still enforces obsolete acreage rules. | APH 2024–27 Appendix 4 (*Norms for Land and Built-up Area Requirements*), pp. 118–124 | All Diploma, UG, and PG technical institutions. |
| **13** | **List & Names of AICTE Regional Offices** | Hardcoded 7 Regional Offices in `schema.prisma` enum `Region` and `RegionalJurisdictionHub.tsx`. | **Incorrect or contradicted by source** | AICTE officially maintains **8 Regional Offices and 1 Camp Office**: <br>1. Northern (Kanpur)<br>2. North-Western (Chandigarh)<br>3. Central (Bhopal)<br>4. Western (Mumbai)<br>5. South-Western (Bengaluru)<br>6. Southern (Chennai)<br>7. Eastern (Kolkata)<br>8. **South-Central Regional Office (SCRO, Hyderabad)**<br>9. **Camp Office (Guwahati, North-East)**.<br>SAKSHAM's codebase completely omitted **SCRO Hyderabad** (handling Telangana and Andhra Pradesh) and misallocated states. | Official AICTE Directory of Regional Offices ([https://www.aicte.gov.in/about-us/regional-offices](https://www.aicte.gov.in/about-us/regional-offices)) | Regional allocation and jurisdictional routing nationwide. |
| **14** | **Supreme Court Mandated Deadlines (*Parshvanath* Precedent)** | Hardcoded across `StatutoryCalendarStepper.tsx` and `SOURCE_REGISTER.md`. | **Verified applicable rule (with date corrections required)** | *Parshvanath Charitable Trust v. AICTE* (2013) 3 SCC 385 is the binding constitutional precedent governing time-bound approvals. The Supreme Court ruled that no authority has the power to alter the schedule. However, the exact dates modeled in SAKSHAM confuse university affiliation milestones with AICTE council cutoffs and must be harmonized. | Supreme Court of India Civil Appeal No. 9048 of 2012, (2013) 3 SCC 385 | All statutory approval authorities, universities, and state technical education boards. |
| **15** | **EVC 2.0 Geo-tagging & Video SOP** | Hardcoded in REG-013 as "Pending Verification". | **Operational policy — requires an authorized internal source** | Mandated by AICTE Planning & Coordination Bureau Office Memorandum for digital evidence verification. Inspection photos must be GPS-tagged with latitude, longitude, and IST timestamp. Video walkthrough of laboratories and computing centers is mandatory. | AICTE Digital Inspection Guidelines & Circular P&C/2024/EVC | All EVC inspections conducted in 2024–2027. |

---

## 3. Representation of Regulatory Rules in Software

### 3.1 Hardcoded Values and Locations Identified

| File Path | Hardcoded Regulatory Value / Logic | Risk / Defect | Remediation Strategy |
| :--- | :--- | :--- | :--- |
| `client/src/components/features/StatutoryCalendarStepper.tsx` | Fixed calendar cutoff dates (`March 15`, `April 10`, `April 25`, `May 10`, `May 20`, `May 31`, `June 10`) | Breaks whenever AICTE issues annual cycle circulars. Conflates Council cutoffs with University affiliation. | Migrate to database-driven `StatutoryMilestone` entity fetched from `/api/rules/calendar?academicYear=2026-27`. |
| `client/src/components/features/ScrutinyEvaluationModal.tsx` | Hardcoded 5-item checklist (`DEFAULT_CHECKLIST`), 30-year lease text, 1:15 STR, 1:2:6 cadre ratio. | Cannot evaluate program-specific norms (e.g. BBA/BCA vs Engineering vs Architecture). | Replace with category-specific checklist query: `/api/rules/scrutiny-checklist?category=${category}&programme=${programme}`. |
| `server/prisma/schema.prisma` | `enum Region { NORTHERN, NORTH_WEST, WESTERN, CENTRAL, SOUTH_WEST, SOUTHERN, EASTERN }` | **Omits SOUTH_CENTRAL (Hyderabad)**. Institutions in AP and Telangana cannot be represented. | Update Prisma enum: add `SOUTH_CENTRAL` and `CAMP_OFFICE_GUWAHATI`. |
| `client/src/components/features/RegionalJurisdictionHub.tsx` | Array of 7 regional offices, excluding SCRO Hyderabad. | Severe operational defect. | Expand to all 8 Regional Offices and Guwahati Camp Office. |
| `shared/src/mockData.ts` | Land area hardcoded as fixed acres (`7.5`, `10.2`, `5.1`) with static note "Meets Rural/Urban Norms". | Ignores APH 2024–27 FSI/FAR built-up area calculation rule. | Implement formula: `Achieved FSI = Total Built-up Area / Plot Area <= Permissible Local FSI`. |
| `server/prisma/schema.prisma` | `model RegulatoryRule` has only 15 fields, lacking versioning, conditional criteria, and reviewer approvals. | Rules can be modified by anyone; lacks approval lifecycle. | Implement Enterprise Regulatory Rule Model specified below. |

---

## 4. Proposed Dynamic Regulatory Rule Data Model

A regulatory rule must not become active merely because someone enters a value in a form or edits frontend mock data. To safeguard statutory integrity and preserve the human-authority boundary, the following schema must be implemented in `schema.prisma`:

```prisma
enum RuleStatus {
  DRAFT
  UNDER_LEGAL_REVIEW
  ACTIVE_VERIFIED
  SUPERSEDED
  DISABLED
}

enum RuleApplicabilityCategory {
  NEW_INSTITUTE
  EOA_EXISTING
  INTAKE_INCREASE
  SUPERNUMERARY_SEATS
  CHANGE_OF_SITE
  WOMEN_TO_COED
  CLOSURE
  ALL_CATEGORIES
}

model DynamicRegulatoryRule {
  id                      String                    @id @default(uuid())
  ruleCode                String                    @unique // e.g. "APH-2024-CH1-R01"
  ruleTitle               String
  description             String                    @db.Text
  
  // Categorical & Conditional Applicability
  applicabilityCategory   RuleApplicabilityCategory
  applicableProgramme     String?                   // Engineering, Management, Pharmacy, MCA, Architecture
  applicableLevel         String?                   // Diploma, UG, PG
  isAutonomousOnly        Boolean                   @default(false)
  
  // Statutory Source Traceability
  sourceDocumentTitle     String                    // e.g. "AICTE Approval Process Handbook"
  sourcePublicUrl         String
  academicCycle           String                    // e.g. "2024-25 to 2026-27"
  sourceVersion           String                    // e.g. "APH 2024-27 Final"
  chapterOrClauseRef      String                    // e.g. "Chapter I, Section 1.3(a)"
  tableOrAppendixRef      String?                   // e.g. "Appendix 4, Table 4.1"
  printedPageNumber       Int?
  effectiveFromDate       DateTime
  effectiveToDate         DateTime?
  isJudicialMandate       Boolean                   @default(false)
  judicialPrecedentRef    String?                   // e.g. "Parshvanath (2013) 3 SCC 385"
  
  // Configured Thresholds & Validations
  validationType          String                    // THRESHOLD, RATIO, DOCUMENT_PRESENCE, DATE_WINDOW
  parameterKey            String                    // e.g. "minimum_lease_years", "str_ratio"
  configuredThresholdNum  Float?                    // e.g. 30.0, 15.0
  configuredThresholdStr  String?
  comparisonOperator      String?                   // GTE, LTE, EQ, IN
  slaTurnaroundDays       Int                       @default(7)
  escalationIntervalDays  Int                       @default(3)
  
  // Workflow Governance
  permittedWorkflowStage  ApplicationStage
  responsibleRole         UserRole
  
  // Regulatory Governance & Approval Lifecycle
  ruleStatus              RuleStatus                @default(DRAFT)
  draftedById             String
  approvedById            String?
  approvedAt              DateTime?
  legalVettingNotes       String?                   @db.Text
  supersededByRuleCode    String?
  
  createdAt               DateTime                  @default(now())
  updatedAt               DateTime                  @updatedAt
  
  @@index([applicabilityCategory, ruleStatus])
  @@index([parameterKey])
}
```

### Governance Rules for Dynamic Configuration
1. **Separation of Duties:** A Scrutiny Officer or Regional Officer cannot alter rules. Only authorized Bureau Officers with the `SYSTEM_ADMIN` role may draft rule changes.
2. **Four-Eyes Legal Approval Principle:** A drafted rule cannot transition to `ACTIVE_VERIFIED` without explicit sign-off by a designated `MEMBER_SECRETARY` or Legal Cell approver.
3. **Immutability & Supersession:** Once active, a regulatory rule is never overwritten in place. When handbook norms amend, the rule is marked `SUPERSEDED` with an effective cutoff date, and a new versioned rule is created.
