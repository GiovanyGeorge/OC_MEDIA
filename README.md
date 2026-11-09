# OC Student Union — Media Committee Recruitment & Analytics Platform 2026

Modern, Arabic-first student recruitment and administrative analytics dashboard for the **Media Committee of the Student Union, Faculty of Computers and Artificial Intelligence, Capital University**.

The platform consists of two integrated components:
1. **Public Recruitment Portal:** A sleek multi-step recruitment form connected directly to **Google Sheets** and **Google Drive** via **Google Apps Script Web App** (zero-cost, no Supabase/Firebase required).
2. **Administrative Analytics Dashboard:** A private, browser-based administrative interface for uploading downloaded Google Sheets spreadsheets (.XLSX / .CSV), parsing records in-memory, visualizing committee statistics with Recharts, managing applicants, and exporting reports.

---

## 🌟 Key Features

### 1. Public Recruitment Portal
- **Arabic-First Design:** Native RTL layout (`dir="rtl"`), Arabic typography (Cairo & Tajawal), and official OC Student Union visual identity.
- **4-Step Guided Flow:** 
  - Step 1: Personal Information (Three-part name, Egyptian active WhatsApp number, Academic Year).
  - Step 2: Media Skills Selection (12 specialized domains).
  - Step 3: Available Equipment & Gear (11 hardware categories).
  - Step 4: Optional Portfolio Upload (PDF, JPG, PNG up to 10MB) or external link (Behance, Drive, Vimeo).
- **Zero Mention of Interviews:** Immediate joining and team orientation flow.
- **Instant Backend Verification:** Server-side validation, duplicate prevention by phone number, automatic row formatting, and direct Google Drive storage.

### 2. Administrative Analytics Dashboard
- **Local Browser In-Memory Processing:**
  - Accepts `.xlsx`, `.xls`, and `.csv` files downloaded directly from Google Sheets.
  - Parsed 100% locally in the browser with SheetJS (`xlsx`).
  - No database required, no external API transmission, and no sensitive data saved to `localStorage`.
- **Dashboard Sections:**
  - **Overview:** Total applicants, portfolio attachment percentage, academic year distribution donut chart, top 5 requested skills bar chart, and application status breakdown.
  - **Skills Analytics:** Detailed statistics and charts for all 12 media skill domains.
  - **Equipment Analytics:** Detailed inventory of cameras, gimbals, mics, lights, and editing workstations.
  - **Applicants Management Table:** Search by name/phone/ID, filter by academic year, skill, equipment, status, and portfolio presence. Multi-column sorting and pagination.
  - **Applicant Profile Modal:** Comprehensive view of applicant information, registered skills, available equipment, and direct Google Drive portfolio link.
  - **Reports & Export Center:** One-click UTF-8 CSV exports for filtered applicant records, complete analytics summary, skills distribution, and equipment inventory.
- **Bilingual Interface:** Toggle between Arabic (RTL) and English (LTR) at any time.
- **Sample Test Dataset Included:** Built-in fictional dataset marked with `[TEST]` for instant dashboard demonstration and testing.

---

## 🛠️ Technology Stack

- **Frontend:** [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v3](https://tailwindcss.com/)
- **Charts & Visualization:** [Recharts](https://recharts.org/)
- **Spreadsheet Parsing:** [SheetJS (xlsx)](https://docs.sheetjs.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Backend:** [Google Apps Script Web App](https://developers.google.com/apps-script)
- **Database:** [Google Sheets](https://www.google.com/sheets/about/)
- **File Storage:** [Google Drive](https://www.google.com/drive/)

---

## 📁 Repository Structure

```text
├── google-apps-script/
│   └── Code.gs                         # Google Apps Script backend source code
├── public/
│   └── logo.jpg                        # Official OC Student Union logo
├── src/
│   ├── components/
│   │   ├── Header.tsx                  # Public portal header with logo and status
│   │   ├── RecruitmentForm.tsx         # 4-step recruitment form & validation
│   │   ├── SuccessView.tsx             # Submission receipt & reference code
│   │   ├── SetupNoticeModal.tsx        # Guided setup & backend ping modal
│   │   └── Footer.tsx                  # Public portal footer
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── DashboardLayout.tsx     # Admin sidebar, header, language switcher
│   │   │   ├── FileUploadZone.tsx      # Excel/CSV drag-and-drop parser
│   │   │   ├── OverviewPage.tsx        # KPIs and primary charts (Recharts)
│   │   │   ├── SkillsPage.tsx          # Comprehensive 12-skill analytics
│   │   │   ├── EquipmentPage.tsx       # 11-category equipment analysis
│   │   │   ├── ApplicantsTablePage.tsx # Filterable, searchable data table
│   │   │   ├── ApplicantDetailModal.tsx# Profile card & portfolio link
│   │   │   └── ReportsPage.tsx         # CSV export generator
│   │   ├── types/
│   │   │   └── dashboard.ts            # Dashboard interfaces & data structures
│   │   ├── utils/
│   │   │   ├── excelParser.ts          # Local XLSX/CSV column auto-detection
│   │   │   ├── analytics.ts            # Aggregate metric calculator
│   │   │   ├── sampleDataGenerator.ts  # Fictional test dataset generator
│   │   │   └── exportUtils.ts          # UTF-8 BOM CSV exporter
│   │   └── DashboardApp.tsx            # Main dashboard controller
│   ├── constants/
│   │   └── options.ts                  # Academic years, skills, and equipment
│   ├── services/
│   │   └── api.ts                      # Google Apps Script HTTP client & base64
│   ├── types/
│   │   └── recruitment.ts              # Form types & payload schemas
│   ├── App.tsx                         # View controller (Form vs Dashboard)
│   ├── index.css                       # Tailwind custom directives & typography
│   └── main.tsx                        # Application entry point
├── .env.example                        # Example environment variables
├── package.json                        # Dependencies and build scripts
├── vite.config.ts                      # Vite configuration with chunk splitting
├── SETUP_GUIDE_AR.md                   # Step-by-step Arabic deployment guide
└── README.md                           # Documentation
```

---

## 🚀 How to Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   ```
   Add your Google Apps Script URL in `.env`:
   ```env
   VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

---

## 📊 How to Access the Analytics Dashboard

1. **Via Browser URL:** Navigate to `/#/dashboard` or `/#/admin` (e.g. `http://localhost:3000/#/dashboard`).
2. **Via Public Page Shortcut:** Click the **"لوحة التحليلات (Admin)"** pill button at the bottom-left of the recruitment portal.
3. **Using Real Data:**
   - Go to your Google Sheet containing applicant responses.
   - Click **File** > **Download** > **Microsoft Excel (.xlsx)** or **CSV**.
   - Drop the file into the dashboard to analyze your applicant records.
4. **Using Test Data:**
   - Click **"معاينة لوحة التحكم ببيانات تجريبية (Demo)"** to explore all features instantly with fictional test records.

---

## 🔒 Security & Privacy

- **Zero External Telemetry:** All spreadsheet parsing and aggregation is performed inside client browser memory using SheetJS.
- **No National IDs:** In strict compliance with university privacy policies, national IDs are never collected or stored.
- **No Insecure Storage:** Applicant records are not persisted in `localStorage` or `cookies`.
- **Anti-Duplication:** Handled server-side in Google Apps Script via telephone number verification.

---

## 🏛️ Credits

- **Faculty of Computers and Artificial Intelligence, Capital University**
- **OC Student Union — Media Committee (لجنة الإعلام والتوثيق)**
- Academic Year: **2025 / 2026**
