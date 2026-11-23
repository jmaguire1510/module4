# As-built: Morrowlane Service Performance Monitor

## 1. Purpose and audience

**Purpose:** Provide operations leadership with real-time visibility into service performance by market and coordinator, enabling comparison against annual goals and identification of performance priorities.

**Audience:** Morrowlane operations leadership. The dashboard is designed to answer: "How are we performing on service delivery across markets?" and "Which markets or coordinators need attention?"

**Hosting:** https://jmaguiremodule4.netlify.app/

**Data freshness:** Live refresh on page load; timestamp shows Google Sheets retrieval time, not workbook last-modified time. Errors are displayed; no cached data is substituted. Google may serve a cached copy of the Sheet export for a minute or two, so changes in the Sheet may not appear on the next refresh.

## 2. What was built (views, features, interactions)

### Views and navigation
- **Executive overview** (default): Year-to-date KPI cards, leadership focus insights, market performance table
- **Market performance**: Sortable table of market YTD metrics with drill-down
- **Coordinator activity**: Detailed coordinator YTD workload and satisfaction
- **Data quality**: Workbook-wide checks and reconciliation issues

### KPI cards (four displayed at top)
1. **Completed within SLA** – Weighted SLA %, target comparison (percentage-point difference from 90%), numerator/denominator, YTD cutoff
2. **Requests completed** – Total completed requests and progress toward annual goal (unavailable if any coordinator's completed count is missing)
3. **Requests assigned** – Total assigned requests (coordinator YTD)
4. **Site visits** – Total site visits and progress toward annual goal

### Market filter
- Dropdown: "All markets" or individual market names; applies to all metrics and charts; persists across refresh

### Monthly trend chart
- Bar chart for dated records only; metric selector for "Requests received" or "Resolution time" (hours)
- Shows only records with valid Month dates; if none: "Trend unavailable"
- Hover titles show exact values; undated record count shown at bottom

### Market performance table
- Columns: Market | Completed (YTD) | Annual Goal | Within SLA (count) | SLA Target (%) | Assigned (count) | Site Visits (count)
- Sortable by market name or by SLA (low to high); click market row to scroll to coordinator details
- Annual goal progress shown where applicable

### Monthly source records (collapsible)
- Table: Record | Market | Month | Received | Completed | Resolution | Satisfaction | SLA Met | Repeat Issues
- Record numbers are export identifiers only, not dates; Month column will be empty for all records

### Coordinator activity table
- Columns: Coordinator / Market | Assigned | Completed | Within SLA | Resolution | Satisfaction | Site Visits
- YTD through coordinator cutoff date; shows coordinator satisfaction vs. satisfaction target where both available
- Flags coordinators with satisfaction below target

### Leadership focus panel
Displays:
- Coordinator satisfaction below target (if any): lists count, directs to table
- SLA performance versus target (if available)
- Director's September 4, 2026 priorities (dated narrative, not live verified trends)

### Data quality panel
- Count of issues found
- Specific issues include: missing monthly dates, missing monthly satisfaction/SLA values, missing coordinator completed counts, unmatched markets, goal TOTAL discrepancies

## 3. Data sources and what each provides

| Source | Grain | Fields | Use |
|--------|-------|--------|-----|
| **Monthly Performance** (gid: 1731940043) | 32 market-month records | Market, Month (all 32 blank), Requests Received/Completed, Avg Resolution Time, Client Satisfaction (%), SLA Met (%), Repeat Issues | Raw market monthly drill-down. Trends and comparisons unavailable while Month is missing. SLA Met (%) denominator undocumented. |
| **Coordinator Activity** (sheet, range A4:L) | 12 coordinators (4 markets × 3 each) | Market, Coordinator Name, Assigned/Completed/Within SLA (YTD), Completed/Visits FY Goals, Avg Resolution, Satisfaction (%), SLA Target (%), Satisfaction Target (%) | Primary SLA measure: (sum within SLA) / (sum completed). YTD workload by market/coordinator. Goal progress (2026 cutoff only). Individual coordinator satisfaction vs. target. |
| **2026 Goals** (sheet, range A4:H) | 5 rows (4 markets + TOTAL) | Market (Mpls. → Minneapolis), Completed/Visits FY Goals, Completion Rate (%), Avg Resolution Target, Satisfaction/SLA/Repeat targets (%) | Annual goal targets. SLA target: 90%. TOTAL row reconciliation. |
| **Leadership update** (Sept 4, 2026) | Dated narrative | YTD 93% SLA, 90% target, 92% satisfaction target, Denver/Austin priorities | Dated context in "Leadership focus" panel. Cannot validate from workbook (monthly dates missing). |

**YTD cutoff:** Extracted from Coordinator Activity header note. At discovery: 31 August 2026 (2026-08-31).

## 4. Data connection and dependencies

### Retrieval mechanism
- **Source:** Public Google Sheets workbook (ID: 1FOrhcgDGuPIgQowaoYeDS3izkK2-2DaFmNRkTSpF1es)
- **Method:** Four parallel CSV exports via Google Visualization API (gviz/tq)
- **Ranges:**
  - Monthly: gid 1731940043 (all columns A:H)
  - Coordinator: sheet name "Coordinator Activity", range A4:L (skips rows 1–3)
  - Goals: sheet name "2026 Goals", range A4:H (skips rows 1–3)
  - Cutoff note: sheet name, range A1:A2 (extracts date from text)
- **Timeout:** 15 seconds per CSV; **Size limit:** 5MB per response

### Data validation
1. **Schema:** Exact column count and header text match required; source changes detected and cause failure
2. **Data types:**
   - Market, Month, Coordinator: text (required)
   - Counts: integer
   - Percentages: 0–100 range
   - Hours: numeric
   - Month: parsed (Jan 2026, 1/15/2026, 2026-01)
3. **Business logic:**
   - Completed within SLA ≤ completed requests (enforced)
   - Unique market-month and market-coordinator keys (enforced)
   - Coordinator cutoff: required format (m/d/yyyy) parsed and validated as ISO date
4. **Missing data:** Month/satisfaction/SLA accepted as null; completed count as null makes aggregate SLA unavailable

### Runtime dependencies
- **Node.js:** 20 or later (local server)
- **Network:** Internet access to Google Sheets; public workbook readability required
- **Retrieval timestamp:** Set at load time; not workbook's last-modified time

### Deployment
- **Local:** `npm start` runs Node.js server on http://127.0.0.1:3000 (loopback only)
- **Hosted:** Netlify function + build (complete repository required; static-only drop will not work)
- **API endpoint:** `/api/performance` returns JSON with all normalized data

### Application dependencies
- No npm packages; built-in Node.js modules only (http, fs, URL)
- JavaScript ES modules (import/export)
- No frameworks or build tools

## 5. Decisions and assumptions

### SLA (Completed within SLA)
- **Definition:** `Σ(completed within SLA) / Σ(completed requests) × 100` from Coordinator Activity sheet
- **At discovery:** 3,230 / 3,466 = 93.19% (displayed as 93.2%, rounded to leadership's 93%)
- **Target:** 90% (from 2026 Goals SLA Compliance Target; all markets uniform at discovery)
- **Comparison:** Unrounded SLA rate vs. target; displayed as percentage-point difference (e.g., "3.2 percentage points above target")
- **Missing data:** If any coordinator's completed count is null, aggregate SLA becomes unavailable; warning identifies specific coordinator
- **Market-level:** When single market selected, only that market's coordinators summed
- **NOT:** Requests completed / assigned; monthly average of SLA Met (%); unweighted coordinator average

### Completed Requests (annual goal progress)
- **Numerator:** Sum of Completed (YTD) from selected market(s)
- **Denominator:** Sum of Completed FY Goal from selected market(s)
- **Guard:** Computed only when coordinator cutoff is in year 2026
- **Display:** e.g., "1,234 of 1,560 FY goal"

### Site Visits (annual goal progress)
- **Numerator:** Sum of Visits (YTD) from selected market(s)
- **Denominator:** Sum of Visits FY Goal from selected market(s)
- **Guard:** Computed only when coordinator cutoff is in year 2026

### Thresholds and traffic lights
**Decision:** No invented thresholds. Only source-supplied targets displayed:
- SLA Target: 90% (from 2026 Goals)
- Satisfaction Target: 92% (from coordinator record and leadership update)
- Completion Rate Target: 92% – **denominator unconfirmed; not used as SLA target**
- Repeat Issue Rate Target: 8% – **denominator unconfirmed**
- Resolution Time Target: 36 hours (from 2026 Goals)

Red/yellow/green thresholds not invented beyond "above/below target" for SLA.

### Naming and mapping rules
- **`Mpls.` → `Minneapolis`:** Explicit mapping applied during goal-sheet parsing; observed during discovery
- **Market key:** Matched across worksheets by name (after Mpls. mapping); mismatches flagged in data quality
- **Record identifiers:** Monthly records identified by export row number (1-based, excluding headers); display identifiers only, never used to infer dates

### YTD vs. monthly reconciliation
- Coordinator Activity: YTD through stated cutoff (31 August 2026 at discovery)
- Monthly Performance: Individual month records; dates entirely missing
- **Non-reconcilable because:** Month column blank; monthly SLA Met (%) denominator undocumented; no explicit transaction-level link
- Figures presented separately; no cross-table aggregation

### Satisfaction and resolution metrics
- **Individual coordinator satisfaction:** Displayed where available; not averaged into market rates
- **Coordinator satisfaction target:** Compared per-coordinator; flagged if below target
- **Market satisfaction:** No market-wide average computed (requires response counts and weighting, absent)
- **Resolution time:** Displayed as individual coordinator values; not averaged without documented denominator

### No time-phased or pace calculations
- Annual goal progress shown as YTD actual ÷ full-year goal, not "on pace for the year"
- Assumes: Goals not time-phased by month

### Revenue definition
- **Invoiced revenue** (from Monthly Performance tab) is used on center and firm-wide views, not signed engagement value
- **Rationale:** Invoiced revenue reconciles with finance; signed engagement value can change. When leadership memo reported $6.6 million YTD using signed engagement value vs. site's $6,470,000, the $130,000 gap comprised $45,000 of logged-but-not-invoiced work (visible on Advisor Activity tab) plus $85,000 not yet in any source. Leadership's priority is converting signed engagements to billed work, so invoiced revenue was retained for monitoring.

### Firm-wide Client Satisfaction
- **Metric:** Count of centers at or above 92% satisfaction target, not an average
- **Rationale:** Average of individual center satisfaction rates (91.3%) masked the fact that three of six centers were below target. Count-based view makes underperforming centers visible.

### Advisor pace calculation
- Uses same months-reported fraction as centers (Year-to-date as of August 31, 2026)
- **Assumption:** Advisor Activity tab's YTD figures cover the same months as Monthly Performance tab
- **Risk:** If advisor totals are updated on a different cadence than monthly rows, advisor pace will be misstated

## 6. Known limitations

### Data completeness
1. **All 32 monthly dates are blank.** Trends cannot be established; latest-month values unknown; YTD is opaque aggregate
2. **Missing individual values:**
   - 1 monthly satisfaction value (market unknown)
   - 1 monthly SLA value (market unknown)
   - Some coordinator completed-request counts (affects SLA for those markets)
3. **Undocumented denominators:**
   - Monthly "SLA Met (%)" – no documented denominator; cannot compare to coordinator SLA ratio
   - "Completion Rate Target" (92%) – denominator unconfirmed; not used
   - "Maximum Repeat Issue Rate" (8%) – denominator unconfirmed; not used

### Comparison and reconciliation gaps
1. Monthly vs. coordinator: Cannot reconcile because Month missing and denominators differ
2. Goal TOTAL row: Discrepancies flagged in data quality
3. Market definitions: No validation that "Denver" in monthly = "Denver" in coordinator; matched by text only

### Authentication and security
1. **No authentication:** Server binds to loopback (127.0.0.1) only
2. **Public workbook:** Source workbook is publicly readable at discovery
3. For real data: Authenticated, authorized access layer required

### Source change handling
1. Column order, count, and header text must match exactly; reordering/changes break parsing
2. Sheet names "Coordinator Activity" and "2026 Goals" must exist and be exact (case-sensitive)
3. YTD cutoff format must match `/through\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/i`; unrecognized/missing cutoff fails
4. No graceful degradation; schema mismatches cause complete failure (dashboard hidden, error displayed)
5. Google may serve a cached copy of the Sheet export for a minute or two, so changes in the Sheet may not appear on the next refresh

### Advisor pace timing risk
- Advisor Activity tab YTD figures are stated to run through 8/31/2026
- If advisor totals are updated on a different schedule than monthly rows, advisor pace calculations will be misstated
- No confirmation that both tabs are updated simultaneously or on the same cadence

### Client Satisfaction measurement
- Collection method not documented in project materials; how centers measure and report satisfaction is unknown
- Affects interpretation of satisfaction trends and cross-center comparisons

### Application behavior
1. Errors are fatal: Source failures, parse errors, validation errors hide dashboard; no fallback or partial display
2. Four separate fetches: Not transactional; could span source edits
3. Timestamp limitation: Shows fetch time, not workbook last-modified
4. Print: PDF snapshots tested; other print styles not tested

### Missing workbook data
- No revenue, cost, expense, or financial data
- No staffing capacity or utilization
- No request-level timestamps or aging
- No backlog or pipeline
- No client contact or project information
- No historical data prior to discovery date (23 November 2026)

## Needs confirmation

1. **Data update cadence:** Center managers update their monthly rows and YTD figures. Confirm whether center managers and advisor managers update on the same schedule and whether Advisor Activity tab YTD is finalized before Monthly Performance data is published.
2. **Los Angeles gap:** Still open; assigned to Los Angeles center to resolve.
3. **Invoiced revenue reconciliation:** Confirm that invoiced revenue on Monthly Performance tab matches finance records for all periods covered.
4. **Satisfaction target weighting:** Confirm whether the 92% satisfaction target applies uniformly to all centers or whether weighting/time-phasing is required.
5. **Traffic-light thresholds:** Establish leadership-approved thresholds beyond 90% SLA and 92% satisfaction targets (e.g., yellow range 85–90% SLA).
6. **Completion Rate Target (92%) denominator:** Define what metric drives the 92% completion-rate target; currently not used in dashboard.
7. **Repeat Issue Rate Target (8%) denominator:** Define what metric drives the 8% repeat-issue-rate target; currently not used in dashboard.
8. **Monthly SLA Met (%) denominator:** Define how monthly SLA Met (%) should compare to coordinator-level completed-within-SLA ratio.
9. **Market-level aggregation rules:** Confirm weighting for firm-wide metrics (e.g., should satisfaction use center manager feedback, client survey, or transaction-based data?).
10. **Historical data retention:** Decide retention policy for monthly records once dates are restored; plan for data archival if records exceed a certain age.

## Update Log

### 2026-11-23 – KPI Status Legend Redesign
- **Changed:** Status legend layout and styling
- **Files modified:** `public/index.html`, `public/styles.css`
- **Details:**
  - Converted legend from table layout to flexbox horizontal single-line layout
  - Reduced font size from 11px to 8px for compact presentation
  - Set margin-top to 0 to tuck legend immediately below KPI cards
  - Reduced gap between legend items from 16px to 12px
  - Shortened text labels: "Green: Met", "Yellow: 50–74%", "Red: < 50%"
  - Maintained color-coded indicators (green #2d7a3f, yellow #d9a926, red #c8453a)
- **Result:** Compact, integrated legend providing immediate reference for KPI status colors without consuming dashboard space

### 2026-11-23 – Leadership Focus Panel Repositioned
- **Changed:** Dashboard layout to display Leadership focus alongside Market performance
- **Files modified:** `public/index.html`
- **Details:**
  - Moved "Leadership focus" panel from standalone `main-grid` div into two-column `main-grid` layout
  - Market performance table now displays on left (1.8fr width)
  - Leadership focus panel now displays on right (1fr width)
  - Responsive design: two-column layout on desktop (> 760px), single column on mobile (< 760px)
  - Existing CSS grid layout maintained; no additional styles needed
- **Result:** More efficient use of dashboard space; leadership priorities now visible alongside market data at desktop widths

### 2026-11-23 – PDF Export Right-Side Cutoff Fix
- **Changed:** Print media CSS to prevent right-side content cutoff
- **Files modified:** `public/styles.css`
- **Details:**
  - Added `overflow: hidden` to shell and content containers
  - Added `width: 100%; box-sizing: border-box` to grid containers (kpi-grid, main-grid, bottom-grid, kpi-and-quality-row, table-wrap)
  - Changed table layout from default to `table-layout: fixed` with `text-overflow: ellipsis` for long text values
  - Added `overflow: hidden` to panel, chart, insight, definition-note, and source-details elements
  - Added `overflow-wrap: break-word` to universal selector for better text wrapping
  - Ensures all content fits within landscape page margins (0.5in on all sides)
- **Result:** PDF exports now display complete page width without clipping right-side content

### 2026-11-23 – PDF Export Filename Date
- **Changed:** PDF export now includes date in filename
- **Files modified:** `public/service-app.js`
- **Details:**
  - When "Save PDF" button is clicked, document title is updated to `Morrowlane-Performance-YYYY-MM-DD`
  - Browser print dialog uses this title as the default PDF filename
  - Original page title is restored after print dialog closes
  - Date format: ISO 8601 (YYYY-MM-DD)
- **Result:** Exported PDF files are automatically named with the export date (e.g., `Morrowlane-Performance-2026-11-23.pdf`)
