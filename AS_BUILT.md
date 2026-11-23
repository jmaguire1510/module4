# As-built: Morrowlane service performance

## Purpose and audience

Operations leadership uses the site to monitor service performance by market, compare coordinator YTD measures to annual goals and investigate priorities and source quality.

## What was built

The site offers a market filter, weighted completed-within-SLA percentage, coordinator YTD workload and visits, market goal progress, sortable market and coordinator tables, monthly record drill-down, dated monthly charts where source dates exist, and quality warnings. A dated leadership note describes the September priorities without presenting them as current verified trends.

## Data sources

The public [Morrowlane workbook](https://docs.google.com/spreadsheets/d/1FOrhcgDGuPIgQowaoYeDS3izkK2-2DaFmNRkTSpF1es/edit?gid=1731940043#gid=1731940043) contains Monthly Performance, Coordinator Activity and 2026 Goals. The coordinator note specifies its YTD cutoff. The 4 September 2026 leadership update was supplied separately. See [DATA_DICTIONARY.md](DATA_DICTIONARY.md).

## Data connection and dependencies

The local Node 20+ server and Netlify function both use `data.js` to fetch and validate Google Sheets CSV data on each API request. `public/service-app.js` renders the data, with calculations in `public/service-metrics.js`. The previous Canyon & Coast `public/app.js` and `public/metrics.js` remain in the project but are not referenced by the current page or served by the local server. No application packages are required. The Netlify function configuration has not been verified through an actual deployment. A static-only Netlify Drop does not provide the API.

## Decisions and assumptions

- Leadership's 93% is 3,230 completed within SLA divided by 3,466 completed requests, rounded to the nearest whole percent; the dashboard shows 93.2% and the 90% SLA target. It is not the separately named 92% completion-rate target.
- The target sheet's `Mpls.` maps to Minneapolis. Coordinator YTD counts are not added to monthly records. Annual goals are compared only when the coordinator cutoff is in 2026.
- The target percentages do not establish a time-phased forecast or unspecified traffic-light thresholds. Monthly satisfaction, SLA and resolution values are not averaged without a defensible denominator.
- Dated charts use only explicitly dated rows for the selected market. Undated rows are shown by export-record number; row order is never used to assign a date.

## Known limitations

All 32 monthly dates were missing at discovery, preventing reliable date coverage, monthly trends and latest-month comparisons. One monthly satisfaction and one SLA value were also missing. Monthly SLA definitions and the 92% completion-rate and 8% repeat-rate denominators need confirmation. Market monthly and coordinator totals cannot be compared reliably until dates and definitions are confirmed. Four source fetches are not transactional.

The site has no authentication and the source was publicly readable at discovery. The scenario is fictional, but real data requires approved access controls and organizational policy review. Publication and testing of a public link remain outstanding. Netlify's `public` publish directory would also include the retained, unused legacy JavaScript files.

## Needs confirmation

- Restore and validate the Month field for every monthly row; confirm the correct periods and resolve source discrepancies.
- Define the monthly SLA denominator, the 92% completion-rate denominator, repeat-issue-rate denominator, and weighting for market-level satisfaction and resolution.
- Confirm any leadership-approved on-track thresholds or time-phasing; decide public hosting and access requirements.

---

# Historical as-built: Canyon & Coast (previous data source)

## Purpose and audience

The tool helps senior leadership monitor center performance, compare reported results with annual goals, investigate trends and identify exceptions. The provided workbook is fictional, according to the requester.

## What was built

The dashboard offers reporting-month and center filters, year-to-date KPI cards, a monthly revenue chart, center sorting and drill-down, monthly source records, advisor activity, and data-quality checks. A print layout supports dated PDF snapshots. The local application runs with Node.js; the project also includes a Netlify function and deployment configuration.

## Data sources

The public [Google workbook](https://docs.google.com/spreadsheets/d/1-Tvkbdv5Noo8ooA5qOYyARORa1lZJk6A/edit?gid=137972702#gid=137972702) supplies Monthly Performance, Advisor Activity and 2026 Goals. The advisor note provides the YTD cutoff. See [DATA_DICTIONARY.md](DATA_DICTIONARY.md) for fields, dates, source definitions and discovery findings.

## Data connection and dependencies

`data.js` fetches four CSV ranges from Google Sheets in parallel on each request, validates their schema and values, and attaches a retrieval timestamp. The local Node server and the Netlify function expose the result at `/api/performance`; the browser requests it on load and refresh. Source errors are displayed instead of substituting sample or cached data. Node.js 20 or later is required locally; no application packages are required. The source must remain accessible to the server or function. Static-only hosting of `public` does not provide the API.

## Decisions and assumptions

- Recorded monthly revenue answers the center-performance question. Advisor revenue is manager-recorded engagement value and is displayed separately; it is not added to recorded revenue.
- `N. Coast` in the goals sheet is explicitly mapped to `North Coast`. Goals apply only to 2026, and the sum of center goals is used instead of the discrepant source TOTAL row.
- Annual attainment equals the selected year's January-to-selected-month actual divided by the full-year goal. It is not a time-phased forecast or on-track determination. Incomplete monthly coverage suppresses affected YTD totals.
- Satisfaction below the relevant center target is identified; missing values are unavailable. The application does not calculate a firm-wide satisfaction average without response counts.
- Green/yellow/red thresholds have not been supplied and are not invented. Revenue movement and source-target comparisons are observations, not a complete assessment of business health.
- The retrieval timestamp is not the workbook's last-modified time. Four source requests are not a transactional snapshot and could span edits made during refresh.

## Known limitations

- No public deployment has been completed or verified. Netlify configuration and the function handler have been checked locally, not on Netlify. A static Netlify Drop alone will not deploy the function.
- The source is public and the site has no authentication or authorization. This configuration is suitable only for approved public, non-sensitive data; a sensitive production deployment needs protected source access and an access-control layer.
- Two monthly satisfaction values are missing; the annual revenue TOTAL is inconsistent with center goals; Los Angeles monthly and advisor YTD hours differ. The quality panel exposes these and compares the differently defined Bay Area revenue measures.
- Only 2026 center goals are integrated. Source header, range, cutoff format, and sharing changes may stop refresh and require review. No source modification was made to test propagation.

## Needs confirmation

- Leadership's approved green/yellow/red thresholds and whether any time-phased pace measure is wanted.
- Which authoritative annual revenue total should replace the inconsistent workbook TOTAL, and why Los Angeles hours differ.
- The intended public hosting account and permission to publish the complete application. Verify the deployed URL, anonymous access and live updates before submission.
- Whether a production source should use authenticated access, its retention rules, and how source updates should be monitored.
