# PRAVAH — AICTE Approval Workflow & Compliance Management System
> **Tagline:** Intelligent Scrutiny. Automated Workflows. Transparent Compliance.  
> **Problem Statement ID:** Smart India Hackathon (SIH) 26262 — “Integrated AICTE Approval Workflow Automation, Compliance Monitoring and Alert Management System”  
> **Statutory Alignment:** AICTE Approval Process Handbook (APH) 2024–25 to 2026–27  
> **Phase:** Phase 1 — Project Foundation & Government-Grade Administrative Portal Shell  

---

## 1. Project Overview & Scope
**PRAVAH** is a role-based workflow automation and compliance management platform designed from the perspective of AICTE officials, regional officers, and expert committee members who process technical institution approval queues.

### Key Capabilities in Phase 1:
- **Government-Grade Administrative Shell:** Deep navy blue palette (`#0A1B38`), crisp typography, accessible high-contrast tables, and restrained saffron/green indicators.
- **Ten Core Navigable Routes:**
  - `/login`: Formal administrative sign-in with development role persona simulator.
  - `/dashboard`: Unified executive dashboard with mathematically synchronized metrics.
  - `/applications`: Searchable, multi-parameter filterable master application register.
  - `/workflow-queue`: Scrutiny & Re-Scrutiny SLA queues with ageing indicators (>7d breach alerts).
  - `/evc`: Expert Visit Committee inspection tracker and 48-hour report submission countdown.
  - `/compliance`: Time-bound institutional undertakings and 30/60/90-day conditional approvals.
  - `/document-validity`: Land lease tenure (&ge;30y), Fire Safety NOC, and NBA accreditation expiry monitoring.
  - `/reports`: Operational reporting and regional workload distribution charts (Recharts).
  - `/audit`: Forensic, tamper-evident audit trail capturing every officer decision and stage transition.
  - `/admin/rules`: Versioned regulatory rules engine citing specific APH chapters and clauses.
- **Cardinal Regulatory Principle:** PRAVAH supports authorized human scrutiny, inspection, and verification. **It does NOT and shall NEVER autonomously grant regulatory approval.**
- **Transparent Boundaries:** Uses a coherent, deterministic synthetic dataset. Fully isolated from restricted live AICTE systems.

---

## 2. Technical Architecture & Tech Stack

```
PRAVAH/
├── client/                     # React 18 + Vite + TypeScript Frontend
│   ├── src/components/         # Layout, StatCard, StatusBadge, ApplicationDetailDrawer
│   ├── src/pages/              # 10 route page components
│   └── src/context/            # AuthContext & Role simulator
├── server/                     # Node.js + Express + TypeScript Backend API
│   ├── src/controllers/        # Health, Applications, Metrics, Rules, Operations
│   ├── src/middleware/         # ErrorHandler, RequestLogger
│   └── prisma/schema.prisma    # PostgreSQL Relational Schema
├── shared/                     # Cross-layer Type Definitions & Shared Mock Data
│   └── src/                    # Single source of truth for entities & metrics
├── docs/                       # Statutory and Architectural Specification Documents
│   ├── PROJECT_CHARTER.md
│   ├── ARCHITECTURE.md
│   ├── SOURCE_REGISTER.md
│   ├── REGULATORY_RULES_REGISTER.md
│   └── IMPLEMENTATION_ROADMAP.md
├── docker-compose.yml          # PostgreSQL 16 container definition
├── .env.example                # Clean configuration placeholders
└── package.json                # Root npm workspaces configuration
```

### Technology Matrix:
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, React Router v6, Lucide React, Framer Motion, Recharts, React Hook Form, Zod.
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, Helmet, Cors, Zod.
- **Database:** PostgreSQL 16 (via Docker Compose).
- **Testing:** Vitest for client and server integration testing.

---

## 3. Quickstart & Installation

### Prerequisites:
- **Node.js:** v18.0.0 or higher (v24+ tested)
- **npm:** v9.0.0 or higher
- **Docker & Docker Compose** (Optional for local PostgreSQL container)

### Step 1: Install Dependencies
From the repository root:
```bash
npm install
```

### Step 2: Environment Configuration
Copy the template configuration:
```bash
cp .env.example .env
```
*(Windows PowerShell: `Copy-Item .env.example .env`)*

### Step 3 (Optional): Start Local PostgreSQL Container
```bash
npm run docker:up
```

### Step 4: Build Shared Types
```bash
npm run build --workspace=shared
```

---

## 4. Running the Development Environment

### Start Both Server & Client Concurrently:
```bash
npm run dev
```

### Or Run Services Individually:
- **Frontend Client (Vite Dev Server):**
  ```bash
  npm run dev:client
  ```
  Accessible at: `http://localhost:5173`

- **Backend API Service:**
  ```bash
  npm run dev:server
  ```
  Accessible at: `http://localhost:5000`

---

## 5. API Endpoints & Health Probes

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Liveness probe returning service status and uptime seconds. |
| `GET` | `/api/health/ready` | Readiness probe verifying DB configuration & storage readiness. |
| `GET` | `/api/metrics` | Consolidated dashboard metrics mathematically computed. |
| `GET` | `/api/applications` | Master application list with query filters (`search`, `stage`, `region`). |
| `GET` | `/api/applications/:id` | Individual application record details. |
| `GET` | `/api/rules` | Regulatory rules register citing APH clauses. |
| `GET` | `/api/evc` | Expert Visit Committee inspection records. |
| `GET` | `/api/compliance` | Time-bound institutional undertakings. |
| `GET` | `/api/documents` | Document validity and expiry items. |
| `GET` | `/api/audit` | Forensic regulatory audit entries. |

---

## 6. Testing, Linting & Verification Commands

- **Run all automated tests across workspaces:**
  ```bash
  npm test
  ```
- **Type-check and lint all packages:**
  ```bash
  npm run lint
  ```
- **Build production bundles:**
  ```bash
  npm run build
  ```

---

## 7. Regulatory Source Register & Compliance Citations
See full statutory references in:
- `docs/PROJECT_CHARTER.md` — Project mission, SIH 26262 scope, non-negotiable human decision guardrail.
- `docs/ARCHITECTURE.md` — System architecture, state machine, and Prisma schema.
- `docs/SOURCE_REGISTER.md` — Official AICTE APH 2024–27 and court-mandated calendar citations.
- `docs/REGULATORY_RULES_REGISTER.md` — Verification register of regulatory rules and SLA intervals.
- `docs/IMPLEMENTATION_ROADMAP.md` — Phased development plan through Phase 5.
