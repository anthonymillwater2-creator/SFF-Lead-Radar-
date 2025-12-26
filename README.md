# SFF Lead Radar
**Lead Analysis Tool for ShortFormFactory**

Automated lead qualification, triage, and outreach generation for video editing opportunities.

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the App
```bash
npm run dev
```

### 3. Open in Browser
Visit: **http://localhost:5173**

---

## How to Use

### Step 1: Input Lead
1. Set today's date (if needed)
2. Paste the entire job posting text into the textarea
   - Works with LinkedIn, Reddit, Twitter/X, Upwork, Facebook posts
   - Include URLs if available

### Step 2: Analyze
Click **"Analyze Lead"** button

### Step 3: Review Results

The app generates 5 analysis blocks:

#### BLOCK 1 — TRIAGE
- **Decision**: PASS (green), HOLD (yellow), or SKIP (red)
- **Score**: 0-100 total qualification score
- **Learnability**: GREEN/YELLOW/RED complexity assessment
- **Scope Risk**: LOW/MEDIUM/HIGH project scope risk
- **Effort**: LOW/MEDIUM/HIGH estimated effort
- **Reasons**: Key factors driving the decision

#### BLOCK 2 — EXTRACTED FIELDS
Automatically parsed data:
- Platform, Niche, Deliverable Type
- Target Length, Cadence, Budget
- Tools Required, Client Needs
- Region Fit, Licensing Risk
- And more...

#### BLOCK 3 — SERVICE MATCH
- Best matching SFF service recommendation
- Pricing basis (per video vs per batch)
- Quote anchor logic

#### BLOCK 4 — OUTREACH
- **PASS leads**: Initial DM + 24h and 72h follow-ups
- **HOLD leads**: Clarifier DM + 72h follow-up
- **SKIP leads**: Skip note explanation
- Copy buttons for each message

#### BLOCK 5 — CSV LOG ROW
Pre-formatted CSV row ready to paste into your tracking spreadsheet

---

## Decision Criteria

### PASS (70+ score)
- Strong fit for SFF services (fit score ≥25)
- High learnability (GREEN or YELLOW with low scope risk)
- Recurring opportunities preferred
- Clear deliverable specifications

### HOLD (50-69 score)
- Moderate fit but missing key details
- Budget unclear
- Cadence/volume not specified
- Send clarifier DM to gather more info

### SKIP (<50 score or hard skip)
Hard skips:
- Filming/on-camera work required
- Unpaid/exposure-only opportunities
- Advanced VFX/After Effects primary work

---

## Scoring System

### Fit Score (0-50 points)
- +25: Clear hiring intent
- +15: CapCut mentioned
- +10: Captions needed
- +10: Stock sourcing required
- +5: AI voice/TTS needed

### Complexity Score (-20 to +20 points)
- +20: Same format/repetitive work
- +10: Template/preset based
- +10: Examples provided
- -10: Advanced motion graphics
- -20: After Effects required

### Commercial Viability (0-30 points)
- +15: Recurring cadence specified
- +10: Budget mentioned
- +5: Clear deliverable specs

---

## Example Leads to Test

Try pasting these:

**PASS Example:**
```
Looking for a CapCut editor for my fitness YouTube shorts. Need 7 shorts per week, 15-30 seconds each. I provide raw footage, you add captions and music. Budget is $50-75 per batch of 7. DM me if interested! https://youtube.com/@example
```

**HOLD Example:**
```
Need a video editor for my podcast clips. Looking for someone to create engaging content. Must be good with editing. Let me know your rates.
```

**SKIP Example:**
```
Looking for videographer to film and edit my wedding. Must have professional camera equipment and be available for in-person shoot. Unpaid but great exposure!
```

---

## Available Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

---

## Deployment

### Deploy to Vercel
1. Push code to GitHub
2. Import project in Vercel
3. Deploy (automatic with `vercel.json` configuration)

The `vercel.json` file is already configured for Vite deployment.

---

## Tech Stack

- **React 19** - UI framework
- **Vite 7** - Build tool
- **Tailwind CSS 4** - Styling
- **Lucide React** - Icons

---

## Features

✅ Automated field extraction from job posts
✅ Intelligent scoring algorithm
✅ PASS/HOLD/SKIP triage decisions
✅ Auto-generated outreach messages
✅ Follow-up scheduling
✅ CSV export for tracking
✅ Service matching recommendations
✅ Copy-to-clipboard functionality
✅ Color-coded visual feedback

---

## Project Structure

```
SFF-Lead-Radar/
├── src/
│   ├── LeadHelperApp.jsx    # Main component
│   ├── main.jsx              # App entry point
│   └── index.css             # Tailwind imports
├── index.html                # HTML template
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind configuration
├── postcss.config.js         # PostCSS configuration
├── vercel.json               # Vercel deployment config
└── package.json              # Dependencies
```

---

## Support

Questions or issues? Check the code or update the logic in `src/LeadHelperApp.jsx`
