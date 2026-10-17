# KHORAK (ખોરાક) — Offline-First Anganwadi Nutrition Supply-Chain Tracker

> **Seva First Innovation Challenge 2026, Gujarat**  
> **Problem Statement:** PS000052  
> **Official Title:** Inventory & Supplementary Nutrition Supply Chain Tracker for Anganwadi Centers (ICDS).  
> **Product Tagline:** *“From dispatch to distribution. Every quantity accounted for.”*  
> **District Focus:** Panchmahal District (Godhra & Shehra Blocks), Gujarat.

---

## 1. Executive Summary

In Gujarat's Integrated Child Development Services (ICDS), supplementary nutrition is delivered through two distinct streams:
1. **Take-Home Rations (THR):** Micro-nutrient fortified premix packets (**Balshakti**, **Matrushakti**, and **Purnashakti**) manufactured by GCMMFL (Amul) for children aged 6 months–3 years, pregnant/lactating mothers, and adolescent girls.
2. **Hot Cooked Meals (HCM) & Morning Snacks:** Perishable and staple ingredients (**Wheat grain**, **Fortified Rice**, **Tuver/Moong Dal**, and **Fortified Cottonseed/Soy Oil**) prepared and served daily to children aged 3–6 years at Anganwadi Centres (AWCs).

### The Core Problem Solved
As highlighted in the **Comptroller and Auditor General (CAG) Gujarat Performance Audit Report No. 6 of 2024 (ICDS)**, major accountability gaps occur after supplies leave central warehouses:
- Frontline Anganwadi Workers (AWWs) are often pressured to sign supplier delivery challans before unbagging or counting packets, obscuring transit shortages and damaged goods.
- Physical balances frequently deviate from theoretical stock registers due to rodent damage, bag leakage, and unrecorded distributions.
- Existing tools like POSHAN Tracker operate primarily as top-down beneficiary monitoring systems rather than ground-up physical supply-chain ledger tools with exception resolution.
- Connectivity in tribal and rural areas (e.g., Godhra rural, Shehra, Morva Hadaf) is intermittent, rendering cloud-only portals inaccessible during real-world distribution cycles.

**KHORAK** acts as an **independent supply-chain accountability layer**. It guarantees that:
- Every stock movement is backed by an immutable ledger event with actor, timestamp, and device metadata.
- Short deliveries and transit damages **never** silently inflate usable stock; they automatically instantiate structured Discrepancy cases.
- Frontline workers can record incoming receipts, distributions, and physical counts **100% offline**, synchronizing idempotently when connectivity is restored.
- The interface is fully bilingual in **Gujarati (`ગુજરાતી`)** and **English**, designed specifically for mobile touchscreens with visual steppers to eliminate text-entry friction.

---

## 2. System Architecture

```mermaid
graph TD
    subgraph Frontline_Field_Tier["Frontline Field Tier (Offline-First)"]
        A[Mobile PWA / Tablet] -->|Offline Read/Write| B[(Dexie.js IndexedDB)]
        B -->|Event Queue / Outbox| C[Sync Engine]
    end

    subgraph Transport_Layer["Idempotent API Gateway"]
        C -->|HTTP POST /api/sync/batch (Bearer JWT)| D[Express 5 / Node.js]
        A -->|Online REST API Calls| D
    end

    subgraph Backend_Services["Authoritative Backend Services"]
        D --> E[Auth & Scope Enforcement Middleware]
        E --> F[Ledger Service (Append-Only Event Ledger)]
        E --> G[Discrepancy & Write-Off Workflow Engine]
        E --> H[Auto-MPR & Compliance Aggregator]
        E --> I[Tamper-Evident Audit Logger]
    end

    subgraph Persistence_Tier["Persistence Tier (ACID Relational)"]
        F --> J[(Relational SQLite / PostgreSQL via Prisma ORM)]
        G --> J
        H --> J
        I --> J
    end
```

### Key Technical Pillars
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Canvas Signature Pad, Recharts, TanStack / Custom Contexts.
- **Offline Engine:** Dexie.js (IndexedDB) with local transaction queues, client-generated UUIDs, and idempotent batch resolution.
- **Backend:** Node.js, Express, TypeScript, Zod request schemas, JWT authentication, and bcrypt password hashing.
- **Data Integrity:** Strict append-only `StockLedgerEvent` architecture. Current balances are computed on demand from transaction history inside database transactions. Negative stock balances are strictly blocked.
- **Design System:** Palette rooted in Gujarat nutrition and public service:
  - Deep Forest Green (`#1B4332` / `#2D6A4F`): Authority, nutrition, sustainability.
  - Saffron / Ochre (`#D97706` / `#B45309`): Gujarati cultural familiarity, alertness, action.
  - Warm Off-White (`#FBF9F5`): Glare-free, readable in bright outdoor conditions.

---

## 3. Seeded Demo Accounts & Credentials

The system includes pre-seeded accounts representing the entire administrative hierarchy of Panchmahal District:

| Role | Username | Password | User Name | Assigned Jurisdiction | Responsibilities |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AWW** | `aww_hansa` | `khorak123` | Hansaben Patel | Vavdi Buzarg AWC (`24190101`) | Verify receipts, record THR distribution, log HCM meals, count stock, report spoilage |
| **AWH** | `awh_gitaben` | `khorak123` | Gitaben Parmar | Vavdi Buzarg AWC (`24190101`) | Read-only view of stock, incoming dispatches, and daily meal guidelines |
| **Supervisor** | `sup_rekha` | `khorak123` | Rekhaben Varma | Godhra Rural Sector A (4 AWCs) | Resolve delivery discrepancies, order recounts, approve damage write-offs, review low-stock warnings |
| **CDPO** | `cdpo_mahesh` | `khorak123` | Maheshbhai Joshi | Godhra Block (120 AWCs) | Block-wide stock monitoring, critical buffer warnings, inter-sector allocation |
| **DPO** | `dpo_priya` | `khorak123` | Dr. Priyaben Dave | Panchmahal District (7 Blocks) | High-level district stock availability, CAG compliance audit trail, leak detection |
| **Supplier** | `supplier_amul` | `khorak123` | Kishorebhai Bhatt | GCMMFL Logistics (Amul) | Issue dispatches, upload challan numbers, track delivery fulfillment |

*Note: All demo accounts feature **1-Click Quick Login** buttons on the login screen for instant evaluation.*

---

## 4. Getting Started Locally

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ / v24+ recommended)
- **npm**: v9.0.0 or later

### Installation & Execution
```bash
# 1. Clone repository
git clone <repo-url>
cd khorak

# 2. Install monorepo dependencies
npm install

# 3. Setup and seed the database
npm run db:setup
npm run db:seed

# 4. Start both Server (Port 5000) and Client (Port 5173) concurrently
npm run dev
```

The application will be accessible at:
- **Web Application (Vite Dev Server):** `http://localhost:5173/`
- **Backend API (Express):** `http://localhost:5000/api/health`

### Running Automated Tests
```bash
# Run unit and integration tests (Vitest)
npm test

# Run build verification for both Server and Client
npm run build
```

---

## 5. End-to-End Walkthrough Scenario

To experience the core value proposition of KHORAK, follow this 5-minute evaluation scenario:

```
[Supplier: GCMMFL] Dispatches 100 Balshakti packets (Challan #CH-AMUL-9021)
       │
       ▼
[AWW: Hansaben] Unpacks delivery at Vavdi Buzarg AWC
       │── Physically counts 80 intact packets, 0 damaged, 20 missing
       │── Confirms delivery verification
       │
       ├──► Stock Ledger increases by EXACTLY 80 packets (NOT 100)
       └──► System opens DISCREPANCY Case #DISC-xxxx (Shortage: 20 packets)
       │
       ▼
[Supervisor: Rekhaben] Inspects Sector Exception Queue
       │── Opens Discrepancy Case
       │── Reviews Supplier Dispatch manifest vs AWW physical receipt
       │── Requests physical recount OR accepts shortage note with supplier debit
       │
       ▼
[AWW: Hansaben] Conducts Take-Home Ration Distribution
       │── Selects registered beneficiary (e.g., Ramesh Solanki, 18 months)
       │── Allocates 2 packets of Balshakti premix
       │── Captures guardian's finger-trace signature on canvas
       │── Stock balance decreases from 80 to 78 packets
       │
       ▼
[System / Reports] Auto-Generates Monthly Progress Report (MPR)
       │── Formula: Opening + Receipts - Distributions - WriteOffs + Adjustments = Closing
       │── Automatically flags that Vavdi Buzarg delivered 24 out of 25 mandated feeding days
       │── Exports print-ready PDF and CSV audit trail
```

---

## 6. Core Modules Implemented

### 1. Delivery Receipt Verification (Frontline AWW)
- Side-by-side comparison of supplier dispatch manifest (`CH-AMUL-xxxx`) vs actual count.
- Three-tier item classification:
  - **Accepted Quantity:** Added directly to usable centre stock.
  - **Damaged Quantity:** Segregated; does **not** enter usable stock.
  - **Missing Quantity:** Calculates variance (`Expected - Actual - Damaged`) and generates a persistent discrepancy ticket.
- Optional camera/file upload for delivery challan and condition photo.

### 2. Double-Stream Stock Accounting (THR vs HCM)
- **THR Stream:** Tracks individual foil packets by batch number (e.g., `LOT-BAL-26-09`) and expiry dates. Beneficiary roster with finger-trace signature capture.
- **Direct Aadhaar QR Code Scanning (Enrollment & Distribution):** Frontline AWWs do not need to type beneficiary profiles manually. Scanning the QR code on the back of an Aadhaar card automatically extracts the citizen's Full Name, Date of Birth, Gender, and Guardian. The system automatically transliterates names into Gujarati and infers the eligible nutrition category (`Balshakti`, `Matrushakti`, or `Purnashakti`) while cryptographically hashing the UID to maintain zero-Aadhaar-storage privacy compliance. Supports live camera scanning, photo upload, and instant 1-click evaluation samples.
- **⚡ Fast-Track Distribution Popup:** While handing over packets, the AWW simply scans the mother's Aadhaar card. A modal instantly pops up identifying the beneficiary, matching their eligible THR item, displaying the AWC's live stock balance, and pre-filling the mandated packet quota with large touch steppers (`+` / `-`). One tap on **"Confirm & Hand Over Stock"** debits the ledger, celebrates completion, and presents a **"Scan Next Aadhaar Card →"** button for rapid queue processing.
- **HCM Stream:** Tracks bulk cooking staples (Wheat in kg, Rice in kg, Tuver Dal in kg, Oil in litres). Daily meal log cross-checks morning snack attendees and lunch attendees against mandated per-child recipe quotas (e.g., 75g wheat + 20g dal + 5g oil per child) to identify abnormal ingredient depletion.

### 3. Physical Count & Reconciliation
- Monthly stock verification workflow.
- Displays current **Book Balance** vs **Physical Count**.
- Discrepancies generate a variance report and notify the sector supervisor before any ledger adjustment can occur.

### 4. Wastage & Damage Write-Off
- Dedicated reporting for rodent damage, moisture spoilage, or bag tears.
- Includes a built-in **Gujarati Voice-Note Simulator** (`ઓડિયો નોંધ: "ગોદામમાં ઉંદરે બોરી કાપી નાખી છે..."`) ensuring frontline workers who struggle with typing can record evidence naturally.
- Zero write-offs alter stock balances until the Sector Supervisor reviews and issues formal approval.

### 5. Supervisor Exception Queue & Heatmap
- Sector health dashboard displaying real-time AWC status:
  - 🟢 **Healthy Stock:** Buffer > 15 days.
  - 🟡 **Low Buffer:** Buffer between 5–14 days.
  - 🔴 **Critical Shortage / Stale Data:** Buffer < 5 days or > 14 days without an update.
- Action modal to **Approve Adjustment**, **Request Recount**, or **Reject Claim** with mandatory audit remarks.

### 6. Auto-Generated Monthly Progress Report (MPR) & CAG Compliance
- Replaces manual paper registers (Register No. 6 & No. 8) with an automated, auditable monthly stock summary.
- Directly addresses the 2024 CAG Audit finding (unaccounted stock in Panchmahal District) with full provenance for every packet and kilogram.
- One-click **Print to PDF** and **Export to CSV**.

### 7. Offline Sync Centre & Local Outbox
- Stores transactions in browser IndexedDB (Dexie.js).
- Displays live online/offline indicator, pending synchronization queue count, and manual "Sync Now" trigger.
- Synchronizes with server `/api/sync/batch` using client-generated UUIDs to prevent duplicate postings upon network reconnection.

---

## 7. Automated Test Suite

The backend includes a comprehensive Vitest test suite (`server/tests/khorak.test.ts`) covering all critical domain rules:

```bash
✓ tests/khorak.test.ts (12 tests) 585ms
  ✓ 1. Receipt increases stock by accepted quantity ONLY
  ✓ 2. A short delivery creates a reviewable Discrepancy case
  ✓ 3. Rejected or damaged items do NOT become usable stock
  ✓ 4. THR distribution reduces the correct item's balance
  ✓ 5. HCM consumption affects raw ingredient stock, not THR packet stock
  ✓ 6. Approved supervisor adjustments create an explicit ledger event
  ✓ 7. Negative stock is strictly blocked when requesting more than available
  ✓ 8. Write-off requests do not change committed stock until approved
  ✓ 9. Duplicate offline synchronization requests are idempotent and do not post twice
  ✓ 10. Auto-Generated MPR accurately reconciles opening, received, issued, and closing stock
  ✓ 11. Tamper-evident audit log records critical supply chain events
  ✓ 12. Strict role-based scoping prevents cross-sector / unauthorized access
```

---

## 8. Compliance, Privacy, & Security Considerations

1. **Synthetic Demo Data:** All names, phone numbers, and child references are synthetic. No real citizen Aadhaar numbers, biometric data, or sensitive medical records are stored.
2. **Access Control:** Every API endpoint validates the caller's JWT token, verified role, and assigned geographical jurisdiction (`awcId`, `sectorId`, `blockId`).
3. **Auditability:** Every stock movement records the initiating user, device timestamp, server timestamp, and source document reference.
4. **Positioning:** KHORAK does not seek to displace government systems like POSHAN Tracker or TeCHO+. Rather, it provides the missing **field-level inventory and supply-chain verification layer** that ensures food allocated by the State actually reaches frontline Anganwadis and beneficiaries.

---

## 9. License & Innovation Challenge Details

Built for the **Seva First Innovation Challenge 2026, Gujarat**.  
Problem Statement **PS000052**: *Inventory & Supplementary Nutrition Supply Chain Tracker for Anganwadi Centers (ICDS).*  
Designed and implemented with pride for the frontline Anganwadi workers of Gujarat.
