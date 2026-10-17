# KHORAK (ખોરાક) — Implementation Notes
**Project:** Inventory & Supplementary Nutrition Supply Chain Tracker for Anganwadi Centers (ICDS)  
**Problem Statement:** PS000052, Seva First Innovation Challenge (SFIC) 2026, Panchmahal, Gujarat  
**Tagline:** *From dispatch to distribution. Every quantity accounted for.*

---

## 1. Existing State & Context Discovery
- **Repository Initial State:** Clean directory containing problem domain documents:
  - `Claude Research.pdf`
  - `PS000052 Khorak PRD.docx` (author: Mohammed Kanod, DDO Panchmahal challenge specification).
- **Core Problem Identified:**
  - CAG Gujarat 2024 Report No. 6 found 14% of enrolled beneficiaries (64 lakh people) in Gujarat did not receive mandated nutrition (246 days delivered vs 300 mandated).
  - Data from DPO Panchmahal was unavailable during audits due to reliance on 13 paper registers compiled manually at "pre-sector meetings".
  - Existing GCMMFL OTP system only verifies the delivery moment for THR, with no verification of actual received quantities vs dispatch, and zero visibility into what happens at the AWC storeroom or during beneficiary distribution.
  - POSHAN Tracker tracks child health and beneficiary growth, but has **no inventory or supply chain tracking module**. KHORAK is the missing accountability layer between delivery truck and beneficiary.
- **Environment Assessment:**
  - OS: Windows
  - Node.js: v24.19.0, npm: 11.17.0, Python: 3.13.15
  - Docker / psql: Not installed on host. 
  - Decision: Use SQLite with Prisma ORM on the backend. This guarantees complete zero-dependency local execution, full ACID relational transactions, append-only audit trail, and reproducible seeding on any Windows development setup without Docker.

---

## 2. Chosen Architecture

### Monorepo / Unified Full-Stack Layout
```
khorak/
├── server/                      # Node.js + Express + TypeScript + Prisma ORM
│   ├── prisma/
│   │   ├── schema.prisma        # Complete relational schema (AWCs, Stock, Discrepancies, etc.)
│   │   ├── seed.ts              # Deterministic Gujarat/Panchmahal demo data
│   │   └── migrations/
│   ├── src/
│   │   ├── middleware/          # Auth, RBAC, Scope-isolation, validation
│   │   ├── routes/              # Dispatch, Receipt, Stock, THR, HCM, Discrepancy, Approvals, Reports, Sync
│   │   ├── services/            # Stock balance engine, ledger transactions, audit logger
│   │   └── index.ts             # Express app entrypoint
│   ├── tests/                   # Vitest automated test suite
│   └── tsconfig.json
├── client/                      # React 18 + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/          # Reusable UI primitives, Stepper, Header, Sidebar, SyncBanner
│   │   ├── context/             # AuthContext, LanguageContext (EN/GU), OfflineContext
│   │   ├── db/                  # Dexie.js IndexedDB local persistence & outbox queue
│   │   ├── locales/             # Complete Gujarati (ગુજરાતી) & English translation dictionary
│   │   ├── pages/               # All 23 role-specific screens (AWW, Supervisor, CDPO, DPO, Supplier)
│   │   ├── services/            # API client with sync engine & offline fallback
│   │   └── App.tsx
│   ├── public/                  # PWA manifest, service-worker, icons
│   ├── tailwind.config.js       # Forest Green (#1B4332), Off-White (#FBF9F5), Warm Amber (#D97706)
│   └── vite.config.ts
├── package.json                 # Unified workspace scripts (npm run dev, test, build, seed)
└── IMPLEMENTATION_NOTES.md
```

### Key Technical Decisions:
1. **Offline-First with Dexie.js (IndexedDB) & Client UUIDs:**
   - Frontline AWW operations (Stock Intake, Daily Distribution, Spoilage Flagging, Physical Count) are immediately written to local IndexedDB and assigned a stable UUID (`operation_id`).
   - The UI reflects local pending status with clear badge: "Saved on this device — waiting to sync" (સ્થાનિક રીતે સાચવેલ).
   - A dedicated Outbox Queue flushes queued operations to `POST /api/sync/batch` when online or on manual "Sync Now".
   - Server enforces idempotency on `operation_id` to prevent double-posting.
2. **Transaction-Based Stock Ledger (Never mutable balances):**
   - Authoritative balance is computed from ledger events (`OPENING_BALANCE`, `RECEIPT`, `DISTRIBUTION_THR`, `CONSUMPTION_HCM`, `APPROVED_WRITE_OFF`, `APPROVED_ADJUSTMENT`).
   - Short deliveries (e.g. dispatched 100, accepted 80) only post accepted 80 to usable stock. The 20 short packets trigger a `DISCREPANCY` case. Damaged or rejected stock is segregated and cannot increase usable stock.
3. **THR vs HCM Strict Separation:**
   - **THR:** Packaged nutritional premix (Balshakti, Matrushakti, Purnashakti packets) for children 6m-3y, pregnant women, lactating mothers. Tracked by packet counts and beneficiary rosters.
   - **HCM:** Raw cooking ingredients (Wheat, Rice, Dal, Oil, Spices) for children 3-6y. Tracked by weight/volume, daily attendance cross-checks (flagging if meals served > attendance + 5%), and ingredient consumption calculation.
4. **First-Class Gujarati Localization:**
   - Comprehensive bilingual translations for frontline terminology (e.g., આંગણવાડી કેન્દ્ર, સ્ટોક આવક, વિતરણ, ખોરાક, ચકાસણી, વિસંગતતા).
   - Large stepper buttons (+ / -) to eliminate English keyboard barriers for AWWs.
5. **Role-Based Access Control & Strict Data Scoping:**
   - AWW: Only their assigned AWC.
   - AWH: Read-only for their assigned AWC.
   - Supervisor: Only AWCs in their assigned sector.
   - CDPO: All AWCs in their assigned block.
   - DPO: Read-only district-level analytics.
   - Supplier / SHG: Only their dispatches and deliveries.

---

## 3. Implementation Milestones
- [x] **Milestone 1:** Repository inspection, PRD analysis, and architecture baseline.
- [x] **Milestone 2:** Backend database schema, Prisma migrations, authentication, RBAC, and deterministic Panchmahal seed data.
- [x] **Milestone 3:** Core business logic engines (Stock ledger, Discrepancy lifecycle, Approval thresholds, HCM vs THR workflows).
- [x] **Milestone 4:** Frontend foundation with Tailwind CSS design tokens, bilingual i18n (Gujarati/English), Dexie.js offline outbox queue, and PWA setup.
- [x] **Milestone 5:** Frontline AWW workflows (Intake with stepper & photo capture, Beneficiary THR distribution with signature/photo, HCM cooking log with attendance cross-check, Spoilage reporting, Physical count reconciliation, Monthly Progress Report generator).
- [x] **Milestone 6:** Oversight & Administration dashboards (Supervisor sector heatmap & discrepancy approvals, CDPO block monitor & delivery schedule, DPO district analytics & CAG audit view, Supplier dispatch portal).
- [x] **Milestone 7:** Automated testing (Vitest backend & business rule tests), offline disconnection/reconnection verification, and end-to-end demo script validation.
- [x] **Enhancement:** Direct Aadhaar QR Code Scanner & Parser (`html5-qrcode` camera scan, photo upload, and instant demo presets with smart category inference and zero-Aadhaar-storage privacy hashing).
