# As-built: Morrowlane service performance

## Purpose and audience

Operations leadership uses the site to monitor service performance by market, compare coordinator YTD measures to annual goals and investigate priorities and source quality.

## What was built

The site offers a market filter, weighted completed-within-SLA percentage, coordinator YTD workload and visits, market goal progress, sortable market and coordinator tables, monthly record drill-down, dated monthly charts where source dates exist, and quality warnings. A dated leadership note describes the September priorities without presenting them as current verified trends.

## Data sources

The public [Morrowlane workbook](https://docs.google.com/spreadsheets/d/1FOrhcgDGuPIgQowaoYeDS3izkK2-2DaFmNRkTSpF1es/edit?gid=1731940043#gid=1731940043) contains Monthly Performance, Coordinator Activity and 2026 Goals. The coordinator note specifies its YTD cutoff. The 4 September 2026 leadership update was supplied separately. See [DATA_DICTIONARY.md](DATA_DICTIONARY.md).

## Data connection and dependencies

The local Node 20+ server and Netlify function both use `data.js` to fetch and validate Google Sheets CSV data on each API request. `public/service-app.js` renders the data, with calculations in `public/service-metrics.js`. No application packages are required. The Netlify function configuration has not been verified through an actual deployment. A static-only Netlify Drop does not provide the API.

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
