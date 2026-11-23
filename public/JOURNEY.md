# Morrowlane Service Performance Monitor — Journey Log

## Project Overview

Built a source-backed dashboard for Morrowlane operations leadership to monitor service performance by market, track coordinator workload, and compare performance against annual goals.

## Timeline

### Phase 1: Initial Discovery (November 23, 2026)

**Data Readiness Assessment**

Before building, we applied four critical questions to ensure data quality:

1. **Can I get it?** ✅
   - Confirmed access to Morrowlane workbook: [1FOrhcgDGuPIgQowaoYeDS3izkK2-2DaFmNRkTSpF1es](https://docs.google.com/spreadsheets/d/1FOrhcgDGuPIgQowaoYeDS3izkK2-2DaFmNRkTSpF1es/edit?gid=1731940043#gid=1731940043)
   - Three worksheets identified: Monthly Performance, Coordinator Activity, 2026 Goals
   - CSV export format accessible for application retrieval

2. **Can I trust it?** ⚠️
   - **Missing data identified:** All 32 monthly Month fields were blank
   - One monthly satisfaction value missing (market unknown)
   - One monthly SLA value missing (market unknown)
   - Noted: source fetches are not transactional; could span edits during refresh

3. **Can I explain it?** ✅
   - Monthly Performance: 32 records (4 markets × 8 months)
   - Coordinator Activity: 12 YTD records through 2026-08-31
   - 2026 Goals: 4 markets + 1 total row
   - SLA measure: completed within SLA ÷ completed requests (target: 90%)
   - Completion-rate target (92%) has unconfirmed denominator
   - Repeat-issue rate (8%) has unconfirmed denominator

4. **Can I use it?** ✅
   - Fictional data, no PII or sensitive information
   - Safe for public workbook and public deployment
   - Real data would require policy review and authentication

### Phase 2: Initial Application Build

**Architecture:**
- Node.js 20+ local server
- Google Sheets CSV export via public URLs
- Netlify function for serverless deployment
- No npm packages required; built-in modules only

**Features Implemented:**
- Market filter dropdown
- Year-to-date KPI cards
- Weighted SLA percentage calculation (3,230 / 3,466 = 93.2%)
- Coordinator table with YTD measures and goal progress
- Monthly record drill-down by market
- Data-quality warnings for missing values
- Print layout support for dated PDF snapshots

**Data Quality Checks:**
- Identified `Mpls.` → `Minneapolis` mapping required in goals
- Flagged missing monthly dates preventing trend analysis
- Noted unconfirmed completion-rate and repeat-issue denominators

### Phase 3: SLA Comparison Enhancement

**Requirement:** Show percentage-point difference from target on SLA card

**Implementation:**
- Unrounded SLA rate compared to 90% target
- Display: "X percentage points above/below target"
- Edge cases handled:
  - Missing coordinator completed count → SLA unavailable
  - Missing target → comparison unavailable
  - Rounding < 0.1 points → "Less than 0.1 percentage points"
- 12 automated tests covering invalid data, zero denominators, and edge cases

**Verification:**
- Overall: 3,230 / 3,466 = 93.2% (3.2 points above 90% target) ✓
- Denver: 603 / 657 = 91.8% (1.8 points above 90% target) ✓
- All tests passing

### Phase 4: Cleanup and Deployment

**Legacy Project Removal:**
- Removed all Canyon & Coast Business Advisors references from documentation
- Stripped historical sections from AS_BUILT.md and VERIFICATION.md
- Retained unused legacy scripts (`public/app.js`, `public/metrics.js`) due to access restrictions

**Deployment:**
- Commit: `c1db1fc` pushed to `main`
- Netlify auto-deployment to https://jmaguiremodule4.netlify.app/
- API endpoint: `/api/performance` (live and responding)
- Security headers configured: CSP, X-Content-Type-Options

**Verification:**
- Site live and serving Morrowlane dashboard
- API returning current workbook data (fetched 11/23/2026 4:20 PM)
- All features functional: filters, tables, drill-down, quality warnings

## Outstanding Items

1. **Restore missing monthly dates** — All 32 Month fields blank; needed for trend analysis
2. **Confirm SLA denominator** — Monthly SLA definition needs leadership approval
3. **Confirm completion-rate denominator** — 92% target's calculation basis needs clarity
4. **Define repeat-issue rate** — 8% target's denominator needs confirmation
5. **Establish traffic-light thresholds** — On-track/at-risk/off-track definitions needed
6. **Time-phasing review** — Determine if pace-to-target metrics are appropriate
7. **Legacy cleanup** — Remove DATA_DICTIONARY.md historical section and unused scripts

### Phase 5: Smart Data Quality Callouts (November 23, 2026)

**Requirement:** Make missing data issues immediately visible with plain-language callouts

**Implementation:**
- Prominent yellow banner appears at top of dashboard when issues detected
- Shows top 3 critical issues by default; "+ N additional issues" link to view all
- Inline callouts in monthly table: "[no month provided]", "[no data]"
- Messages are specific: "Denver record 20" identifies affected rows
- Explains business impact: "Trends and time-series analysis cannot be performed"

**Features:**
- Banner positioned right after page title for immediate visibility
- Semantic HTML with `role="alert"` and `aria-live="assertive"` for accessibility
- CSP-compliant styling (no inline styles)
- Plain-language messages: "no month provided — all monthly records are undated..."
- Actionable: Link to full Data Quality panel for complete details

**Verification:**
- All 12 tests passing (no regressions)
- Banner displays correctly with proper styling
- Messages are specific and contextual

### Phase 6: PDF Export Button (November 23, 2026)

**Requirement:** Add button to save PDF snapshot of dashboard

**Implementation:**
- "💾 Save PDF" button in header next to "Refresh data" button
- Grouped in `.button-group` container for clean layout
- Triggers browser's native print dialog on click
- User selects "Save as PDF" and chooses save location
- Respects existing print CSS media queries for optimal layout

**Features:**
- Works in all modern browsers (Chrome, Edge, Firefox, Safari)
- Preserves current state: selected market, filters, all visible data
- Includes data quality alerts and warnings in PDF
- No external dependencies; uses `window.print()`

**Verification:**
- All 12 tests passing
- Button verified in HTML with correct ID and styling
- Event listener verified in JavaScript
- Responsive layout maintained

## Technical Stack

- **Runtime:** Node.js 20+
- **Deployment:** Netlify with serverless functions
- **Data source:** Google Sheets (CSV export)
- **Frontend:** Vanilla JavaScript, no frameworks
- **Testing:** Node.js built-in test runner
- **Security:** CSP headers, loopback binding for local server

## Recent Changes (November 23, 2026)

### KPI Status Legend Redesign
- Converted legend from table layout to compact single-line flexbox layout
- Reduced font size to 8px and removed margin for tight integration below KPI cards
- Shortened labels: "Green: Met", "Yellow: 50–74%", "Red: < 50%"
- Maintains color-coded indicators for visual reference

### Leadership Focus Panel Repositioned
- Moved Leadership focus panel to right-side two-column layout alongside Market performance table
- Improves information density: leadership priorities now visible alongside market data
- Responsive design: two-column on desktop (> 760px), single column on mobile
- No CSS changes needed; restructured HTML to leverage existing grid layout

## Data Sources

- **Primary workbook:** [Morrowlane Workplace Solutions - Performance Data](https://docs.google.com/spreadsheets/d/1FOrhcgDGuPIgQowaoYeDS3izkK2-2DaFmNRkTSpF1es/edit?gid=1731940043#gid=1731940043)
- **Leadership memo:** September 4, 2026 update from Lena Morales, Director of Operations
- **Documentation:** [AS_BUILT.md](../AS_BUILT.md), [VERIFICATION.md](../VERIFICATION.md), [DATA_DICTIONARY.md](../DATA_DICTIONARY.md)

## Key Decisions

- **SLA calculation:** Weighted average of all coordinators (not per-market average)
- **Source priority:** Monthly Performance provides recorded SLA; definitions differ from coordinator raw counts
- **Missing dates:** Data withheld, not inferred from row order
- **Legacy code:** Unused Canyon & Coast scripts retained to avoid unintended side effects
- **Public deployment:** Fictional data suitable for public hosting; real data requires auth layer
- **Data quality visibility:** Prominent banner makes issues discoverable without scrolling
- **PDF export:** Native print functionality preserves state and styling

---

**Last Updated:** November 23, 2026 at 3:24 PM ET  
**Repository:** [jmaguire1510/module4](https://github.com/jmaguire1510/module4)  
**Live Site:** https://jmaguiremodule4.netlify.app/
