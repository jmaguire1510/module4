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

## Technical Stack

- **Runtime:** Node.js 20+
- **Deployment:** Netlify with serverless functions
- **Data source:** Google Sheets (CSV export)
- **Frontend:** Vanilla JavaScript, no frameworks
- **Testing:** Node.js built-in test runner
- **Security:** CSP headers, loopback binding for local server

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

---

**Last Updated:** November 23, 2026 at 11:20 AM ET  
**Repository:** [jmaguire1510/module4](https://github.com/jmaguire1510/module4)  
**Live Site:** https://jmaguiremodule4.netlify.app/
