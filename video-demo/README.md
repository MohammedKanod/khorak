# KHORAK — SFIC 2026 Product Demonstration Video
**Challenge:** Seva First Innovation Challenge 2026, Gujarat  
**Problem Statement:** PS000052 (Inventory & Supplementary Nutrition Supply Chain Tracker for Anganwadi Centers - ICDS)  
**Official Product Tagline:** “From dispatch to distribution. Every quantity accounted for.”  
**Rendered Output File:** `video-demo/out/KHORAK_SFIC_2026_Demo.mp4`

---

## 1. Project Overview & Story Arc

This demonstration video illustrates how KHORAK solves the 4 fundamental gaps documented by the CAG Gujarat 2024 audit and DDO Panchmahal for PS000052:

1. **Paper-Based Register Lag:** Replaces 13 physical registers with real-time digital intake and double-entry stock math.
2. **Beneficiary Verification Gap:** Directly scans the QR code on the beneficiary's Aadhaar card to auto-detect age/category (Child 0-3 vs Pregnant Mother) and executes high-speed handovers via Continuous Loop Distribution.
3. **Stockouts & Unrecorded Spoilage:** Auditable photo and reason-code logging for pest/moisture damage + live Sector Heatmap alerting supervisors before rations run dry.
4. **Manual Reporting Overhead:** Generates the Form 6 Monthly Progress Report (MPR) in 1 tap, eliminating tedious pre-sector compilation meetings.

$$\text{100 Expected on Challan} \longrightarrow \text{80 Physically Received} \longrightarrow \text{20 Shortage Discrepancy}$$

$$\text{80 Usable Stock} - \text{15 Distributed via Aadhaar Loop} = \text{65 Live Verified Balance}$$

---

## 2. Technical Specifications

- **Output Resolution:** 1920 × 1080 (1080p Full HD)
- **Aspect Ratio:** 16:9
- **Frame Rate:** 30 fps
- **Total Duration:** 137 seconds (4,110 frames / 2 min 17s)
- **Container Format:** MP4 (H.264 video, AAC audio, 48 kHz stereo)
- **Video Engine:** Remotion 4.0 (React deterministic motion graphics)
- **Audio Voiceover:** High-definition Neural Narrator (`en-IN-PrabhatNeural`, natural Indian English)
- **Design Tokens:** Warm Cream (`#FAF3E8`), Forest Green (`#1E3E2B`), Gujarat Saffron (`#E85D04`), Pastel Action Tiles (`#8CEFDA`, `#FDC58A`, `#ADC4FA`, `#F8B4BA`)

---

## 3. Scene Breakdown & Application Verification Status

Every product scene uses authentic, high-DPI screenshots captured directly from the running KHORAK application (`http://localhost:5173` frontend + `http://localhost:5000` API) with zero fabricated screens.

| Scene | Timeline | Feature Demonstrated | Live Evidence Source | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Scene 1** | 0:00–0:15 | The Hook: Unaccounted Ration Discrepancy | Remotion animated counters (`100` → `80` → `20`) | Concept Hook |
| **Scene 2** | 0:15–0:31 | Problem Statement PS000052 (4 Pillars) + KHORAK Intro | [`01-dashboard.png`](file:///m:/disk%20M/khorak/video-demo/public/screenshots/01-dashboard.png) (3×3 Gujarati tiles) | **100% Real Live App** |
| **Scene 3** | 0:31–0:49 | Challan Intake & Shortage Flagging | [`02-receive-stock-list.png`](file:///m:/disk%20M/khorak/video-demo/public/screenshots/02-receive-stock-list.png), [`03-receive-stock-dialog.png`](file:///m:/disk%20M/khorak/video-demo/public/screenshots/03-receive-stock-dialog.png) (Challan `CH-GSCSCL-4410`, 80 accepted, 20 shortage) | **100% Real Live App** |
| **Scene 4** | 0:49–1:11 | Aadhaar QR Scan & Continuous Loop Distribution | [`10-thr-roster.png`](file:///m:/disk%20M/khorak/video-demo/public/screenshots/10-thr-roster.png), [`11-aadhaar-scanner-modal.png`](file:///m:/disk%20M/khorak/video-demo/public/screenshots/11-aadhaar-scanner-modal.png), [`13-handover-confirmation.png`](file:///m:/disk%20M/khorak/video-demo/public/screenshots/13-handover-confirmation.png) | **100% Real Live App** |
| **Scene 5** | 1:11–1:27 | Live Running Stock Ledger Engine | [`04-stock-ledger.png`](file:///m:/disk%20M/khorak/video-demo/public/screenshots/04-stock-ledger.png), [`05-stock-balance.png`](file:///m:/disk%20M/khorak/video-demo/public/screenshots/05-stock-balance.png) (`80 received − 15 distributed = 65 remaining balance`) | **100% Real Live App** |
| **Scene 6** | 1:27–1:45 | Spoilage Logging & Supervisor Sector Heatmap | [`14-spoilage-reporting.png`](file:///m:/disk%20M/khorak/video-demo/public/screenshots/14-spoilage-reporting.png) (Pest/moisture write-offs), [`15-sector-heatmap.png`](file:///m:/disk%20M/khorak/video-demo/public/screenshots/15-sector-heatmap.png) (Supervisor oversight) | **100% Real Live App** |
| **Scene 7** | 1:45–2:01 | Offline IndexedDB Sync & Auto Form 6 MPR | [`06-sync-centre.png`](file:///m:/disk%20M/khorak/video-demo/public/screenshots/06-sync-centre.png) (Outbox queue), [`08-reports-mpr.png`](file:///m:/disk%20M/khorak/video-demo/public/screenshots/08-reports-mpr.png) (One-click MPR) | **100% Real Live App** |
| **Scene 8** | 2:01–2:17 | Expected Outcomes & Challenge Closing | Motion graphics, brand emblem, 4 outcome pills, and PS000052 credentials | **Official Challenge Closing** |

---

## 4. How to Preview & Render

To launch the interactive Remotion Studio player:
```powershell
cd "video-demo"
npm run start
```

To render the complete 1080p MP4 deliverable:
```powershell
cd "video-demo"
npm run build
```
