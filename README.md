# EcoCity — Smart Urban Waste Management Desktop Application

> A modern, full-stack Electron + React desktop application for intelligent urban waste segregation, citizen reporting, collection logistics, IoT bin monitoring, and circular economy analytics. Built for municipal corporations, residential societies, and waste management authorities.

---

## 🌟 Key Highlights & Hackathon Demo Features

- **Real Desktop Application:** Built with **Electron (v45)**, **React 19**, **Vite**, **Tailwind CSS v4**, and **SQLite**.
- **Role-Aware Security & Demonstration Personas:**
  - **Sarah Jenkins (Administrator / Chief Solid Waste Officer):** Full administrative control, route dispatch, analytics, policy settings, workforce roster, and database management.
  - **Rajesh Kumar (Field Worker / Senior Collector - Ward 4):** Assigned route views, task progression, verified weighbridge weight entry, and vehicle telemetry.
  - **Elena Rostova (Citizen / Resident Activist - Ward 1):** Waste segregation directory, interactive educational quiz, photo-supported waste problem reporting, and live complaint tracking.
- **Durable Local SQLite Persistence:** Built-in SQLite database engine powered by `sql.js` with instant disk persistence to `ecocity.sqlite` in the OS user data directory. Data survives restarts, form submissions create real records, and status updates persist immediately.
- **Interactive Recharts Telemetry:** Dynamic 7-day category trends, waste stream composition breakdown (wet, dry, recyclable, hazardous), ward-wise recycling performance, and task execution progress.
- **Waste Segregation Assistant & Educational Quiz:** Searchable directory of common household items across all 6 municipal disposal categories (Wet, Dry, Hazardous, E-Waste, Sanitary, Reject) with bin colors, composting instructions, safety precautions, and an interactive 8-question quiz with scores and badge certificates.
- **Digital Citizen Grievance Reporting:** Submit reports with validation, live photo upload preview, automatic sequence IDs (`REP-2026-XXXX`), priority tags, and status lifecycle (`Submitted` → `Assigned` → `In Progress` → `Resolved`).
- **Collection Management:** Full CRUD task dispatching, worker assignment, route instructions, table & card view toggles, and weighbridge weight recording.
- **Smart Bin IoT Monitoring:** 16 simulated public smart bins across 5 municipal wards with fill level gauges, battery status, and a **Live IoT Simulation Mode** that dynamically fluctuates readings and triggers critical alerts.
- **Sustainability & Environmental Impact Scorecard:** Clearly documented empirical estimation models based on EPA WARM standards calculating CO₂e emissions prevented, trees saved from paper recycling, and landfill airspace preserved.
- **CSV Data Export:** One-click CSV generation for historical collections, citizen reports, and collection tasks with native OS file save dialogs.

---

## 🏗️ System Architecture

```
ecoCity/
├── src/
│   ├── main/
│   │   ├── index.js          # Electron main process, window management & CSP headers
│   │   ├── database.js       # SQLite database engine, schema & sample dataset seeder
│   │   └── ipc/
│   │       └── index.js      # Secure IPC handlers for CRUD, stats, simulation & CSV export
│   ├── preload/
│   │   └── index.js          # Context isolation bridge exposing typed 'electronAPI'
│   └── renderer/
│       ├── index.html        # HTML entry point with Plus Jakarta Sans & Outfit fonts
│       └── src/
│           ├── components/   # Sidebar, TopBar, and DemoUserModal
│           ├── context/      # AuthContext (Role permissions) & ToastContext
│           ├── data/         # Segregation items directory & quiz dataset
│           ├── pages/        # Dashboard, Segregation, Reports, Tasks, Bins, Analytics, etc.
│           ├── services/     # api.js IPC communication client
│           ├── styles/       # Tailwind CSS v4 & custom glassmorphism styles
│           ├── App.jsx       # HashRouter & ProtectedRoute layout shell
│           └── main.jsx      # React DOM mounting
├── scripts/
│   └── verify-workflows.js   # Automated end-to-end integration test suite
├── package.json
├── vite.config.mjs
└── README.md
```

### Security Posture
- `contextIsolation: true`
- `nodeIntegration: false`
- `webSecurity: true`
- Strict Content Security Policy (`CSP`) restricting external script execution
- Zero raw Node.js or SQLite handles exposed to the renderer; all actions use sanitized IPC channels with parameter binding.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js:** v18.0.0 or later (Tested on Node v24.13.1)
- **npm:** v9.0.0 or later

### Installation
Clone the repository and install all dependencies:

```bash
npm install
```

### Running in Development Mode
Launches the Vite dev server with hot-module replacement and boots the Electron desktop shell:

```bash
npm run dev
```

### Running in Production / Local Desktop Mode
Builds the optimized renderer bundle and launches the native Electron application:

```bash
npm run build
npm start
```

---

## 🧪 Automated Workflow Verification

To verify that the SQLite database, CRUD queries, worker assignments, weight logging, and dashboard telemetry calculations are functioning properly, run the included integration test suite:

```bash
node scripts/verify-workflows.js
```

**Expected output:**
```
=== EcoCity Automated End-to-End Workflow Verification ===
✓ Step 1: Database initialized and seeded.
✓ Step 2: Initial dashboard computed total waste: 105863.3 kg
✓ Step 3: Citizen Elena Rostova filed report: REP-2026-0023
✓ Step 4: Administrator dispatched task TSK-2026-0023 to Worker Rajesh Kumar (WRK-01)
✓ Step 5: Rajesh Kumar marked task TSK-2026-0023 as Completed with 135.5 kg.
✓ Step 6: Verified report REP-2026-0023 status is now: "Resolved"
✓ Step 7: Verified Rajesh Kumar tasks_completed incremented to: 185
✓ Step 8: Verified updated citywide total waste weight: 106134.3 kg (+271.0 kg increase)
✓ Step 9: Verified quiz results persisted in SQLite: 1 records.
✓ Step 10: Verified smart bins in database: 16 public bins, 8 critical fill alerts.
=== ALL 10 CRITICAL WORKFLOW CHECKS PASSED PERFECTLY! ===
```

---

## 🏆 Hackathon Demonstration Workflow

Follow this 8-step script to showcase EcoCity to judges:

1. **Sign in as Administrator (Sarah Jenkins):**
   - The application opens on the **Executive Operations Dashboard** displaying live citywide stats (Total Waste, Segregation Rate: 84.8%, Recycling Rate: 42.6%, Pending Complaints, and Active Workers).
   - Point out the 7-day trend chart, waste composition donut chart, and ward-by-ward comparisons.
2. **Explore the Waste Segregation Assistant:**
   - Navigate to **Segregation Assistant**.
   - Type `"battery"` or `"peels"` in the search bar. Click on any card to view detailed disposal streams, bin colors, and safety precautions.
   - Switch to the **Segregation Quiz** tab, answer a few questions, and show the instant educational feedback and score tracking.
3. **Submit a Real Waste Complaint as Citizen:**
   - Click **Demo Switcher** in the top bar and select **Elena Rostova (Citizen)**.
   - Notice how the sidebar updates dynamically to show only citizen-relevant modules.
   - Navigate to **Waste Reports**, click **Report Waste Problem**, enter a title and description, upload an image preview, and submit. An ID like `REP-2026-0023` is generated.
4. **Dispatch a Collection Task as Administrator:**
   - Switch back to **Sarah Jenkins (Admin)**.
   - Open **Waste Reports**, click on the newly submitted complaint, and click **Dispatch Collection Task to Worker**. Select **Rajesh Kumar** and confirm.
5. **Execute the Collection as Field Worker:**
   - Switch to **Rajesh Kumar (Field Worker)**.
   - Navigate to **Collection Management**. His assigned task appears highlighted.
   - Click **Start Route** (status updates to `In Progress`), then click **Record Verified Collection**.
   - Input the weighbridge scale weight (e.g. `145.0 kg`) and confirm.
6. **Verify Dynamic Synchronization:**
   - Notice the collection task is marked `Completed`, the citizen report is automatically marked `Resolved`, and Rajesh's completed task count is incremented.
7. **Inspect Smart Bin Telemetry:**
   - Navigate to **Smart Bins**.
   - Toggle **Live IoT Simulation**. Watch the ultrasonic sensor levels dynamically fluctuate every 5 seconds.
   - Highlight how bins exceeding 80% capacity show high-priority dispatch buttons.
8. **Export Analytics to CSV:**
   - Navigate to **Analytics & Impact**.
   - Review the documented carbon offset metrics and trees saved.
   - Select **Collection Telemetry CSV** or **Citizen Reports CSV** and click **Export CSV**. Save the file to your machine and open it in Excel or Numbers.

---

## 📦 Building Distributable Packages

To build production desktop installers:

### For macOS (`.dmg` and `.zip`)
```bash
npm run pack     # Unpacked macOS application bundle
npm run dist     # Distributable .dmg installer and zip
```

### For Windows (`.exe` / NSIS installer)
```bash
npm run dist -- --win
```

Installers and executables will be generated in the `release/` directory.

---

## 📋 Summary of Implemented Features

| Feature Module | Implementation Status | Notes |
| :--- | :---: | :--- |
| **Electron Desktop Shell** | ✅ Complete | Native window, secure preload, context isolation, IPC bridges |
| **Local SQLite Persistence** | ✅ Complete | Powered by `sql.js`, persistent disk storage to `ecocity.sqlite` |
| **Demonstration Roles** | ✅ Complete | Admin, Field Worker, Citizen with permission guards |
| **Main Dashboard** | ✅ Complete | Dynamic Recharts, KPI summary cards, live DB calculations |
| **Segregation Assistant** | ✅ Complete | Searchable directory (18+ items, 6 categories) + 8-question quiz |
| **Waste Problem Reporting** | ✅ Complete | Image upload preview, auto-sequence ID, status progression |
| **Collection Management** | ✅ Complete | Route dispatching, worker assignment, weighbridge scale entry |
| **Smart Bin Monitoring** | ✅ Complete | 16 bins across 5 wards, fill gauges, periodic IoT simulation |
| **Sustainability Analytics** | ✅ Complete | EPA WARM calculation model, carbon offset, CSV exporter |
| **Notification Center** | ✅ Complete | Event logs, read/unread states, deep-links to screens |
| **Workforce Directory** | ✅ Complete | Worker roster, shift management, fleet assignments |
| **Settings & Demo Reset** | ✅ Complete | Municipality configuration, model parameters, factory reset |

---

## ⚖️ Limitations & Commercial Viability Roadmap

- **Simulated Hardware:** Smart bin ultrasonic sensors and weighbridges run in high-fidelity simulation mode. In production, this can be connected to LoRaWAN / NB-IoT gateways (e.g. MQTT or HTTP webhooks).
- **Authentication:** Demo mode provides instant persona switching without password prompts for hackathon presentation convenience. Production deployment would integrate OAuth2 / SAML / municipal Active Directory.
- **GIS Mapping:** Displays ward and route coordinates; can be enhanced with Mapbox / OpenStreetMap tile overlays for live GPS vehicle tracking.

---

**Developed with ❤️ for the Smart Cities Hackathon.**
