# SAKSHAM — Institution Portal Specification & User Guide
**AICTE Approval Workflow & Compliance Management System**  
**SIH Problem Statement:** 26262  
**Target Audience:** Institutional Heads, Registrars, AICTE Liaison Officers  

---

## 1. Overview

The **Institution Portal** in SAKSHAM provides an intuitive, secure interface for technical and polytechnic institutions across India to:
1. Register institutional representatives and verify their credentials.
2. Maintain official institutional data and Permanent Institute ID (PID) associations.
3. Draft, validate, and submit category-specific AICTE applications.
4. Upload mandatory regulatory documents with SHA-256 integrity verification.
5. Receive and respond to official deficiency notices issued by AICTE Scrutiny Officers.
6. Submit evidence against compliance undertakings and track validity of statutory documents.

---

## 2. Institution Account Lifecycle

```
[Public Registration] 
       ↓
[Email Verification Token Issued] 
       ↓
[Email Verified & Authorized via PID] 
       ↓
[Institution Portal Access Activated]
```

### 2.1 Demo Accounts for Evaluation
For evaluation and testing, the seed script provisions active institutional accounts:
- **Institution 1:** Apex Institute of Technology
  - **Email:** `director@apextech.ac.in`
  - **Password:** `Institute@2026`
  - **PID:** `1-109923841` (Western Region, Maharashtra)
- **Institution 2:** Sahyadri College of Engineering & Management
  - **Email:** `principal@sahyadri.ac.in`
  - **Password:** `Institute@2026`
  - **PID:** `1-209938492` (South-West Region, Karnataka)

---

## 3. Application Lifecycle & Wizard

### 3.1 Supported Application Categories
In accordance with AICTE Approval Process Handbook (APH 2024–27):
1. **Extension of Approval (EoA):** Annual extension for existing accredited programmes.
2. **Increase in Intake / Additional Course:** Expansion of student capacity or new engineering/management disciplines.
3. **New Technical Institution:** Establishment of new polytechnic or degree college.
4. **Closure of Course / Institution:** Controlled winding up of obsolete courses or institutions.
5. **Change of Site / Location:** Physical relocation requiring EVC inspection.

### 3.2 5-Step Application Wizard
- **Step 1: Category & Academic Cycle** — Selection of approval type and target academic year (e.g., 2026-2027).
- **Step 2: Basic Institution Particulars** — Verification of official address, trust details, and contact person.
- **Step 3: Programmes & Proposed Intake** — Tabular entry of department name, degree level (UG/PG/Diploma), and requested intake seats.
- **Step 4: Category-Specific Document Checklist** — Secure file upload (PDF/PNG, max 10MB) against statutory norms.
- **Step 5: Preliminary Validation & Submission** — Automated client & server completeness check ensuring zero missing fields/files prior to final queue submission.

---

## 4. Document Verification & Integrity

All uploaded documents undergo:
1. **MIME Type Validation:** Magic number byte verification preventing malicious file masquerading.
2. **Cryptographic Integrity:** Automatic computation of SHA-256 hashes displayed in the institutional document vault.
3. **Secure Vaulting:** Private server storage preventing unauthorized public downloads or cross-tenant exposure.
4. **Audit Logging:** Every file upload records the uploader's user ID, IP address, and timestamp.

---

## 5. Deficiency Notices & Clarification Responses

1. **Notice Receipt:** When a Scrutiny Officer releases a deficiency notice, an in-app banner and email notification are triggered.
2. **Clarification Submission:** The institution accesses `/institution/applications/:id`, reviews the cited APH clause and remedial requirement, and submits:
   - Written clarification response.
   - Reference or upload of supplemental supporting document.
3. **Two-Way Status Tracking:**
   - `DRAFT`: Internal to AICTE officers.
   - `RELEASED`: Visible to institution, awaiting response.
   - `RESPONDED`: Clarification submitted, pending officer re-scrutiny.
   - `RESOLVED`: Finding cleared by authorized scrutiny officer.
