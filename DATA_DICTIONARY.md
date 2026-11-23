# Morrowlane data discovery and dictionary

Discovery: 23 November 2026. The supplied Google workbook and worksheet GID `1731940043` returned actual CSV data; the XLSX export returned three worksheets. The application can retrieve public CSV exports without credentials at discovery time. Availability depends on sharing permissions and Google's export service.

## Worksheets, fields and coverage

| Source | Grain and fields | Period |
| --- | --- | --- |
| Monthly Performance | 32 market records. Market (text); Month (text, **all 32 blank**); Requests Received, Requests Completed and Repeat Issues (counts); Average Resolution Time (hours); Client Satisfaction and SLA Met (percentages, nullable). | Cannot be established: every Month is empty. Do not assign months from row order. |
| Coordinator Activity | 12 coordinators. Market and Workplace Coordinator (text); Requests Assigned, Requests Completed, Completed Within SLA and Site Visits (YTD counts); completed requests and site visits FY goals (counts); Average Resolution Time (hours); Client Satisfaction, SLA Target and Satisfaction Target (percentages). | The source note states YTD through 31 August 2026. |
| 2026 Goals | Four market rows and one TOTAL row. Completed Requests and Site Visits FY goals (counts); Completion Rate, Client Satisfaction, SLA Compliance and Maximum Repeat Issue Rate targets (percentages); Average Resolution target (hours). | Annual goals for 2026, approved December 2025. |
| Leadership update | Director's update, dated 4 September 2026: 93% completed within SLA through August 31, 90% SLA target, and 92% satisfaction target; Denver resolution and Austin demand are priorities. | Dated narrative, not a live replacement for the source records. |

## Relationships and definitions

- Market links all worksheets. Goals use `Mpls.` for `Minneapolis`; this explicit observed alias must be maintained.
- Leadership's 93% is **coordinator completed within SLA / coordinator completed requests**, not completed requests / assigned requests. From the 12 coordinator rows: 3,230 / 3,466 = 93.19%, which rounds to 93%. The 90% target is the SLA target.
- The goals sheet's `Completion Rate Target (%)` is a separate 92% measure. Its denominator is not defined in the workbook, so it must not be used as the target for leadership's SLA figure.
- Monthly `SLA Met (%)` has no documented denominator. It cannot safely be treated as the same measure as the coordinator ratio, or averaged across months or markets without a documented weighting basis.
- FY goals in the goals sheet are market targets; matching coordinator goals can be shown at their own grain. Coordinator measures are separate YTD snapshots, not extra monthly amounts to add.
- Site visits are in the coordinator and goals sheets, not Monthly Performance. No individual client, request-level timestamps, staffing capacity, backlog aging, expense, or financial data was found.

## Data quality

- All 32 Monthly Performance Month cells are blank in both CSV and XLSX. Earliest and latest monthly dates, chronological trends, latest-month values and month-based YTD totals **cannot be verified**. Source row order is not a date.
- One monthly satisfaction value and one monthly SLA value are blank. Their dates cannot be identified while Month is missing.
- No duplicate coordinator `(Market, Workplace Coordinator)` keys or duplicate goal-market keys were found. Monthly market-month duplicates cannot be evaluated because Month is blank.
- Goal market name `Mpls.` differs from `Minneapolis`; the mapping is explicit.
- Monthly completed counts summed across the eight undated records differ slightly from coordinator YTD counts: Minneapolis 825 vs 824; Chicago 1,038 vs 1,037; Denver 658 vs 657; Austin 951 vs 948. Without confirmed dates and definitions, those totals are not comparable and should not be treated as reconciliation.
- Annual completed-request goals sum to 5,260 and site-visit goals sum to 1,290, matching the TOTAL row. No formulas were found in the exported worksheets. Percentages lack response/sample counts and definitions needed to compute trustworthy weighted satisfaction.
- The leadership update reports Denver and Austin trends. Because monthly dates are missing, the current workbook cannot independently validate those trends or establish which monthly row represents August. It also cannot explain the transaction-level reason for any discrepancy with monthly SLA percentages.

## Application dictionary

| Fields | Source and type | Use |
| --- | --- | --- |
| Market | All worksheets; text | Filter, group and link records; normalize observed `Mpls.` alias |
| Month | Monthly Performance; text, nullable | Show source date when present; never infer or impute. Undated rows are shown by source row number. |
| Requests Received / Requests Completed / Repeat Issues | Monthly Performance; counts | Raw market-record drill-down only unless dates and definitions support more |
| Average Resolution Time (Hours) / Client Satisfaction (%) / SLA Met (%) | Monthly Performance; number / nullable percentages | Raw records; no cross-market or cross-month average without appropriate denominators |
| Workplace Coordinator | Coordinator Activity; text | Coordinator drill-down |
| Requests Assigned (YTD) / Requests Completed (YTD) | Coordinator Activity; counts | Coordinator and market workload and completed totals |
| Completed Within SLA (YTD) | Coordinator Activity; count | Numerator of dated leadership SLA calculation; completed requests are the denominator |
| Site Visits (YTD) / Site Visits (FY Goal) | Coordinator Activity; counts | Coordinator and market YTD visit figures and FY target |
| Requests Completed (FY Goal) | Coordinator Activity; count | Coordinator annual target |
| Average Resolution Time (Hours) / Client Satisfaction (%) | Coordinator Activity; number / nullable percentage | Individual coordinator drill-down; do not average without a documented basis |
| SLA Target (%) / Satisfaction Target (%) | Coordinator Activity; nullable percentages | Individual coordinator comparisons where the relevant measure is available |
| Completed Requests / Site Visits (FY Goal) | 2026 Goals; counts | Market and firm annual goal progress for same-year coordinator YTD totals |
| Completion Rate Target (%) | 2026 Goals; percentage | Source reference only; definition and denominator unconfirmed |
| Average Resolution / Satisfaction / SLA / Maximum Repeat Issue targets | 2026 Goals; numeric | Market target references; SLA target applies to the coordinator completed-within-SLA ratio; other comparisons need matched-grain measures and definitions |
| Coordinator cutoff note | Coordinator Activity; text | Reporting cutoff and year-matching guard |

## KPI suitability and privacy

Supported: coordinator YTD assigned and completed counts, site visits, completed-within-SLA counts and weighted SLA ratio (sum within SLA / sum completed), annual completed-request and visit goal progress when the cutoff is in 2026, individual coordinator values and raw monthly records. A zero denominator is unavailable.

Unsupported until data is repaired or clarified: monthly or year-to-date trends and current monthly values (restore Month dates); firm-wide satisfaction (survey counts); request completion rate versus the 92% target (definition and denominator); repeat issue rate versus 8% (definition and denominator); market-wide weighted resolution time (measurement denominator); staffing utilization, backlog aging and financial measures (underlying data). Traffic-light thresholds beyond supplied targets are not specified.

The supplied scenario is described as fictional. Public sharing and AI use of real data require organizational permission, data minimization and appropriate protections; public readability alone is not authorization.

---

# Historical discovery: Canyon & Coast (previous data source)

Discovery performed 23 November 2026 against the publicly accessible Google Sheets workbook. The supplied worksheet GID, `137972702`, is **Monthly Performance**. The workbook export contains three worksheets; the other two are accessible by worksheet name. Google Sheets CSV and XLSX exports returned actual data without credentials at discovery time. Availability depends on the owner's sharing settings and Google's export service; a public link is not access control.

## Structure and coverage

| Worksheet | Grain and coverage | Fields |
| --- | --- | --- |
| Monthly Performance | 48 center-month records; six centers, January–August 2026 | Center (text), Month (month and year text), New Clients (integer), Consulting Hours (number), Completed Projects (integer), Revenue ($) (currency), Client Satisfaction (%) (percentage, nullable) |
| Advisor Activity | 22 advisor records, described as year-to-date through 31 August 2026 | Center and Advisor (text); New Clients, Consulting Hours, Completed Projects and Revenue (numeric YTD and FY Goal pairs); Client Satisfaction and Satisfaction Target (percentages) |
| 2026 Goals | Six center goals and a TOTAL row; approved December 2025 | Center (text), New Clients, Consulting Hours, Completed Projects, Revenue ($) (annual numeric goals), Client Satisfaction Target (%) (percentage) |

The monthly time series covers January through August 2026; the advisor sheet explicitly states that its YTD data is through 31 August 2026. Goals apply to 2026. No earlier monthly history is present in the discovered workbook.

## Relationships and meaning

- Center is the shared business-unit key. `N. Coast` in 2026 Goals corresponds to `North Coast` in the other worksheets; this explicit normalization should be reviewed if source names change.
- Monthly rows are center-level monthly measures. Advisor rows are manager-maintained advisor-level YTD measures and annual goals; their revenue is described as engagement value, not necessarily recognized revenue. They are not independent amounts to add to monthly totals.
- Goals are annual center-level targets. The TOTAL row is a summary, not another center. Annual progress is meaningful only for matching-year, complete year-to-date monthly data; it is not a forecast.
- Satisfaction percentages lack response counts and survey methodology. Center or advisor percentages can be displayed individually, but a company-wide weighted satisfaction rate cannot be reliably calculated.

## Data quality findings

- Two missing monthly satisfaction values: Central Coast in April and San Diego in January 2026. Other populated records have all fields present.
- No duplicate center-month or center-advisor keys were found. All observed month values parse, and all six centers have eight monthly rows.
- Center naming is inconsistent (`N. Coast` versus `North Coast`).
- The Goals TOTAL revenue is $10,600,000, while its six center goals sum to $11,000,000. The sum of advisor revenue goals is also $11,000,000. The dashboard should use the sum of center goals and flag the source total discrepancy.
- Bay Area monthly recorded revenue totals $1,835,000 versus $1,880,000 in advisor YTD manager-recorded engagement value, a $45,000 difference. These are different measures, not proof either is wrong; engagement value may be logged before it appears as recorded monthly revenue. Neither field alone establishes cash receipts. Los Angeles monthly consulting hours total 1,448 versus 1,402 advisor YTD hours, a 46-hour difference to investigate. Other observed center totals agree across these measures.
- Los Angeles monthly revenue decreased from $224,000 in January to $108,000 in August; this is an observation, not an explanation.
- No formulas were found in the exported worksheets. No individual clients, project records, expense records, staffing capacity, pipeline, or receivables were discovered.

## Dictionary and application use

| Field | Source | Meaning and type | Application use |
| --- | --- | --- | --- |
| Center | All three | Business unit; text | Filter, group and link records; normalize the observed goal alias |
| Month | Monthly Performance | Reporting month; text such as `Jan 2026` | Chronological trends, period selection and coverage checks |
| New Clients | Monthly Performance | New client count in a center-month; integer | YTD totals, trends and annual goal progress |
| Consulting Hours | Monthly Performance | Center-month consulting hours; number | YTD totals, trends and annual goal progress |
| Completed Projects | Monthly Performance | Center-month completed project count; integer | YTD totals, trends and annual goal progress |
| Revenue ($) | Monthly Performance | Center-month revenue; currency | YTD totals, trends and annual goal progress |
| Client Satisfaction (%) | Monthly Performance | Center-month percentage; nullable number | Individual center comparisons; missing values shown as unavailable |
| Advisor | Advisor Activity | Advisor name; text | Advisor drill-down |
| New Clients / Consulting Hours / Completed Projects / Revenue (YTD) | Advisor Activity | Advisor YTD amounts; numeric; revenue described as manager-recorded engagement value | Advisor drill-down and center-level reconciliation, never added to monthly totals |
| New Clients / Consulting Hours / Completed Projects / Revenue (FY Goal) | Advisor Activity | Advisor annual goals; numeric | Advisor progress against annual goals |
| Client Satisfaction (%) / Satisfaction Target (%) | Advisor Activity | Advisor satisfaction and target; percentages | Advisor drill-down |
| New Clients / Consulting Hours / Completed Projects / Revenue ($) | 2026 Goals | Annual center targets; numeric | Matching-year progress, calculated from center rows rather than the TOTAL row |
| Client Satisfaction Target (%) | 2026 Goals | Annual center satisfaction target; percentage | Compare individual center satisfaction with its target |
| Worksheet heading and notes | Advisor Activity, 2026 Goals | Reporting cutoff and goal context; text | Source freshness and interpretation |

## KPI suitability

**Supported:** monthly and YTD revenue, new clients, consulting hours and completed projects; center trends and contributions; progress toward matching annual center goals; individual center and advisor satisfaction versus target; advisor YTD measures and goal progress; data completeness and cross-sheet reconciliation exceptions. Comparisons must identify the reporting period and source.

**Unsupported without additional data:** profit, margin, expenses and budget variance (costs and expense budgets); utilization (available/billable capacity and definitions); client retention or churn (client-level history); pipeline and conversion (opportunities and stages); receivables and collection days (invoices, payments and due dates); firm-wide weighted satisfaction (response counts and consistent methodology); engagement profitability (project-level revenue, costs and hours); reliable forecasts or seasonality (longer historical series and assumptions).

## Readiness and responsible use

- **Can we get it?** All three worksheets were retrieved as machine-readable exports, and the application can refresh them while sharing permissions and Google export access remain available.
- **Can we trust it?** The missing values, naming alias, hours mismatch and inconsistent revenue goal total above require attention. The revenue measures have different definitions and should not be combined.
- **Can we explain it?** The monthly sheet supplies recorded revenue; the advisor sheet supplies manager-recorded engagement value through its stated cutoff. Annual goal attainment uses the entire annual goal as denominator, not a time-phased target.
- **Can we use it?** The user describes this workbook as fictional and freely shareable. For real organizational data, public accessibility does not establish permission to use an AI service: check organizational policy, authorization, privacy, the tool's data protections and data minimization before sharing.
