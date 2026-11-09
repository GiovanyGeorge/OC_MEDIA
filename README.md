# OC Media Committee Recruitment Platform 2026

Modern, Arabic-first student recruitment web application for the **Media Committee of the Student Union, Faculty of Computers and Artificial Intelligence, Capital University**.

The platform is directly integrated with **Google Sheets** (for real-time applicant data records) and **Google Drive** (for portfolio uploads) via a lightweight, secure **Google Apps Script Web App** backend—operating at **zero cost without Supabase, Firebase, or paid services**.

---

## 🌟 Key Features

- **Arabic-First & RTL Design:** Built with native right-to-left layout (`dir="rtl"`), Arabic typography (Cairo & Tajawal), and university identity.
- **Brand Identity:** Deep navy blue and vibrant cyan palette matching the official OC Student Union logo.
- **Zero-Cost Backend:** Powered by Google Apps Script, storing submissions directly in Google Sheets and files in Google Drive.
- **Client-Side Validation:**
  - Three-part full name verification in Arabic.
  - Egyptian phone number validation (11 digits: `010`, `011`, `012`, `015`).
  - Academic year selection (First, Second, Third, Fourth).
  - Media skills multi-selection with custom text option.
  - Equipment multi-selection with custom text option.
  - Optional portfolio file upload (PDF, JPG, JPEG, PNG up to 10MB) with drag-and-drop, live size check, and remove capability.
- **Anti-Duplication:** Google Apps Script checks for existing phone numbers before recording a new submission.
- **Submission Confirmation:** Generates a unique tracking reference code (`OC-MED-XXXX`), displays a confirmation receipt, provides one-click copy, printable view, and clear next-step interview timeline.
- **Security & Privacy:**
  - No national ID or sensitive documents collected.
  - No secret credentials exposed in frontend client code.
  - Google Drive files and Sheets remain restricted to committee administrators.

---

## 🛠️ Technology Stack

- **Frontend:** [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v3](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Effects:** [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
- **Backend:** [Google Apps Script](https://developers.google.com/apps-script)
- **Database:** [Google Sheets](https://www.google.com/sheets/about/)
- **Storage:** [Google Drive](https://www.google.com/drive/)

---

## 📁 Repository Structure

```text
├── google-apps-script/
│   └── Code.gs                  # Full Google Apps Script backend source code
├── public/
│   └── logo.jpg                 # Official OC Student Union logo
├── src/
│   ├── components/
│   │   ├── Header.tsx           # Hero section, identity badges, status pill
│   │   ├── RecruitmentForm.tsx  # Multi-section recruitment form & validation
│   │   ├── SuccessView.tsx      # Confirmation page, receipt & ID copy
│   │   ├── SetupNoticeModal.tsx # Guided setup & backend ping test modal
│   │   └── Footer.tsx           # University & union footer
│   ├── constants/
│   │   └── options.ts           # Academic years, skills & equipment options
│   ├── services/
│   │   └── api.ts               # Google Apps Script communication & base64 encoding
│   ├── types/
│   │   └── recruitment.ts       # TypeScript interfaces & types
│   ├── App.tsx                  # Main application state & view management
│   ├── index.css                # Tailwind directives & custom animations
│   ├── main.tsx                 # React entry point
│   └── vite-env.d.ts            # Vite environment definitions
├── .env.example                 # Example environment variables
├── package.json                 # Project dependencies & scripts
├── tailwind.config.js           # Custom university navy/cyan color theme
├── vite.config.ts               # Vite configuration
├── SETUP_GUIDE_AR.md            # Detailed Arabic setup manual
└── README.md                    # English documentation
```

---

## 🚀 Setup & Deployment Guide

### 1. Google Sheets Setup
1. Open [Google Sheets](https://sheets.new) while logged into your committee's Google account.
2. Title the spreadsheet `OC_Media_Recruitment_Applications_2026`.
3. The script will automatically format and initialize the following header row upon first submission:
   1. `Submission ID`
   2. `Submission Date`
   3. `Full Name`
   4. `Phone Number`
   5. `Academic Year`
   6. `Media Skills`
   7. `Equipment`
   8. `Portfolio URL`
   9. `Status`

### 2. Google Apps Script Setup
1. Inside the spreadsheet, click **Extensions** > **Apps Script**.
2. Replace all code in `Code.gs` with the contents of [`google-apps-script/Code.gs`](./google-apps-script/Code.gs).
3. Save the project (`Ctrl + S`).

### 3. Deploying the Web App
1. Click **Deploy** > **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Configure the deployment settings:
   - **Description:** `OC Media Recruitment Web API`
   - **Execute as:** `Me (your Google account)`
   - **Who has access:** `Anyone` *(required for applicants to submit without requiring individual Google Sheet edit permissions)*.
4. Click **Deploy**.
5. Grant required permissions when prompted (**Authorize access** > **Advanced** > **Go to project (unsafe)** > **Allow**).
6. Copy the generated **Web app URL** (ending with `/exec`).

### 4. Google Drive Integration
- The script automatically checks for a dedicated folder named `OC_Media_Recruitment_Portfolios_2026` in Google Drive (creating it automatically if it does not exist).
- Files are saved as `[SubmissionID]_[ApplicantName].[extension]` and shared with view permissions for committee reviewers.

### 5. Frontend Configuration & Local Development
1. Clone this repository or navigate to the project directory:
   ```bash
   cd e:/OC_Media_2026
   ```
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and set your Web App URL:
   ```env
   VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycb.../exec
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Build for production:
   ```bash
   npm run build
   ```

---

## 🌐 Hosting Instructions

### Vercel (Recommended)
1. Push this project to GitHub.
2. Go to [Vercel](https://vercel.com) and import the repository.
3. In **Environment Variables**, add:
   - Name: `VITE_GOOGLE_APPS_SCRIPT_URL`
   - Value: `https://script.google.com/macros/s/YOUR_ID/exec`
4. Click **Deploy**.

### Netlify
1. Connect your repository on [Netlify](https://netlify.com).
2. Set build command to `npm run build` and publish directory to `dist`.
3. Add the `VITE_GOOGLE_APPS_SCRIPT_URL` environment variable.
4. Deploy the site.

---

## 🔒 Security & Privacy

- **No National IDs:** In compliance with privacy guidelines, national identification numbers are strictly excluded.
- **Isolated Credentials:** Client code carries no secret tokens; all Google Drive / Sheets operations occur strictly server-side within the Apps Script container.
- **Anti-Duplication:** Multiple submissions from the same phone number are blocked to prevent duplicate entries.
- **Privacy Notice:** Clear Arabic disclosure is presented to every applicant explaining data retention and review criteria.

---

## 🏛️ Organization Credits

- **Faculty of Computers and Artificial Intelligence, Capital University**
- **OC Student Union — Media Committee (لجنة الإعلام والتوثيق)**
- Academic Year: **2025 / 2026**

