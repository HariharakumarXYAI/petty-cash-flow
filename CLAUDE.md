# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Company Profile

**Organisation:** CP AXTRA Public Company Limited — operating as **Makro**
**Rollout order:** Thailand first (180 stores, `cpaxtra.co.th` tenant), then Cambodia → Myanmar → Philippines progressively
**Legal entities:** Siam Makro PCL (TH) · Makro Cambodia Co Ltd (KH) · Makro Myanmar Ltd (MM)
**Currencies:** THB (TH) · USD (KH) · MMK (MM) · PHP (PH — future)

**Enterprise systems:**
| System | Purpose | Notes |
|---|---|---|
| Microsoft Entra ID / Azure AD | Authentication & SSO | Tenant: `cpaxtra.co.th`. Owner: `hrathina@cpaxtra.co.th`. Already live — use this for all auth. |
| Microsoft Teams | All internal communication | Use Teams webhooks for notifications, not Slack |
| Oracle EBS | Finance / accounting / payments | ERP integration target for approved claim payouts |
| Oracle Retail | Store master data | Source of truth for store codes, regions, legal entities |
| Home-grown Back Office (BO) | Internal ops | Potential future integration |
| POS / eCommerce | Store transactions | Potential future integration |
| GitHub | Source control (current) | Repo: `HariharakumarXYAI/petty-cash-flow` — migrate to company GitLab later |

**Working directory:** `/Users/hrathina/Documents/Development/Petty_cash/` — always work from here, not the OneDrive sync path.

---

## Project Context

PettyCash 360 is a multi-country petty cash management platform for Makro. The BRD and functional spec live in `../Documents/`. The full architecture and skills plan is in `../Documents/pettycash360_architecture_and_skills_plan.md`.

**Current state:** This repo is a UI-only Lovable prototype. All data is hardcoded in `src/lib/mock-data.ts`. There is no backend.

**Target state:** NestJS backend + Next.js frontend + PostgreSQL + Microsoft Entra ID SSO. The Lovable prototype components are kept and migrated to Next.js.

---

## Commands (current Vite prototype)

All commands run from `petty-cash-flow/`:

```bash
bun run dev          # Start development server
bun run build        # Production build
bun run lint         # ESLint
bun run test         # Run tests once (Vitest)
bun run test:watch   # Vitest watch mode
```

Run a single test file:
```bash
bun run test src/test/example.test.ts
```

---

## Current Prototype Architecture

### Tech Stack
- React 18 + TypeScript + Vite (SWC), shadcn/ui, Tailwind CSS
- React Router v6, TanStack Query v5 (unused — no API yet), React Hook Form + Zod, Recharts

### Path Aliases
`@/` maps to `src/`.

### Provider Tree (`src/App.tsx`)
```
QueryClientProvider
  TooltipProvider
    BrowserRouter
      AuthProvider           ← mock auth (no real SSO)
        AppLayout            ← wraps all authenticated pages
          GlobalFilterProvider  ← country/store/date/search filters
          SidebarProvider
            AppSidebar + AppTopBar + <page>
```

### Key Files
- `src/lib/mock-data.ts` — all data types and mock arrays (becomes TypeORM entities in the real backend)
- `src/lib/roles.ts` — `AppRole` type, role-based nav config, `getNavForRole()`, mock users
- `src/contexts/AuthContext.tsx` — mock auth; `switchRole()` is a demo helper
- `src/contexts/GlobalFilterContext.tsx` — global country/store/date filters consumed by all pages

### Claim Status Flow
`Draft` → `Submitted` → `OCR Validating` → `Auto Approved` / `Auto Approved with Alert` / `On Hold` / `Under Investigation` / `Awaiting Audit Document` → `Settled` / `Rejected`

### Multi-Country / Multi-Currency
Thailand (THB), Cambodia (USD), Myanmar (MMK). `Country = "TH" | "KH" | "MM"`.

---

## Target Full-Stack Architecture

### Backend: NestJS Modular Monolith

The module structure mirrors the bank reconciliation system pattern (Ingestion → Parser → Matcher → Reporter) adapted for petty cash:

```
backend/src/
├── auth/             # Microsoft Entra ID JWT validation, role+scope resolver
├── claim/            # Claim CRUD, submission orchestration
├── ocr/              # Azure Document Intelligence + Claude API fallback (Bull queue)
├── validation/       # 30 configurable rules in 9 sequential groups
│   └── rules/        # One file per rule group (VAL-001 to VAL-030)
├── decision/         # Maps validation results → AutoApproved/OnHold/Escalated
├── advance/          # Advance issuance, settlement, overdue tracking
├── cashbook/         # Ledger, running balance, replenishment
├── alert/            # Anomaly flags, investigation cases
├── analytics/        # Nightly CRON: peer benchmarks, YoY, anomaly scoring
├── audit/            # Sampling, document requests, findings
├── notification/     # MS Teams webhook + email
├── reporting/        # Dashboard KPI endpoints, report exports
└── master-data/      # Expense types, stores, rules config, access mappings
```

**Validation Engine:** Runs 30 rules (VAL-001 to VAL-030) in 9 sequential groups. Short-circuits on hard-stop failures. Rules are configurable per country and expense type from the database — no hardcoded thresholds. Each rule extends `BaseRule` with `code`, `evaluate()`, and severity.

**Claude API is used in 3 specific places:**
1. `ocr/ai-ocr.service.ts` — OCR fallback when Azure Document Intelligence confidence < 70%
2. `alert/alert.service.ts` — Duplicate receipt reasoning narrative for investigators
3. `analytics/analytics.service.ts` — Anomaly explanation that prepopulates investigation case notes

### Frontend: Next.js (migration target)

The Vite React components migrate to Next.js App Router cleanly (they are standard React). NextAuth.js handles Microsoft Entra ID SSO. TanStack Query replaces all mock data with real API calls.

### Database
PostgreSQL with TypeORM. The types in `mock-data.ts` map directly to entities: `Claim`, `Advance`, `CashbookEntry`, `AlertRecord`, `Investigation`, `AuditRequest`, `StoreInfo`, `ExpenseType`.

### Infrastructure
Azure (recommended — Entra ID dependency): App Service or Container Apps for NestJS, Static Web Apps or Vercel for Next.js, Azure Blob Storage for receipts, Azure Document Intelligence for OCR.

---

## Development Phases

- **Phase 1:** NestJS scaffold + Entra ID auth + OCR + 30 validation rules + decision engine + cashbook + Next.js migration. Milestone: real end-to-end claim submission.
- **Phase 2:** Approval workflows, advances, notifications (MS Teams), reports API.
- **Phase 3:** Analytics/benchmark engine (Claude AI), investigations, audit, ERP integration.

## Immediate Prerequisites
1. Register Azure AD app → get `clientId`, `tenantId`, `clientSecret`
2. Set up Azure Document Intelligence resource → get endpoint and key
3. Get Anthropic Claude API key
4. `nest new petty-cash-api` — scaffold backend alongside this frontend directory
