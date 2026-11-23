# Morrowlane verification record

Checked 23 November 2026 against the live public workbook and local site.

- Monthly Performance returned 32 records, all with missing months; Coordinator Activity returned 12 records with a YTD cutoff of 31 August 2026. Goals contain four market rows and one total. Monthly trends are explicitly withheld rather than inferred.
- Coordinator counts sum to 3,230 completed within SLA and 3,466 completed. 3,230 / 3,466 × 100 = 93.190998...%, displayed as 93.2% and rounding to the leadership update's 93%. The target shown is the 90% SLA target, not the separate 92% completion-rate target.
- Denver coordinator totals are 657 completed and 603 within SLA, or 91.8%; its annual completed goal is 1,020. The browser displayed those values and its three coordinators. `Mpls.` was mapped to Minneapolis.
- Denver export record 17 contains 82 received, 75 completed and 39-hour resolution with no month; the source drill-down displayed those values without assigning a date.
- Live browser checks covered the market filter, market drill-down, SLA sorting, raw-record details and refresh. A simulated response with two dated Denver records produced the expected request and resolution charts, with the remaining undated records omitted. A simulated source error hid the dashboard and displayed the error. Automated tests cover invalid data, missing dates, zero denominators, weighted SLA and refresh behavior.
- Monthly data has one missing satisfaction and one missing SLA value. Its dates and denominators prevent reliable reconciliation with the leadership YTD figure. The director's September narrative is identified as a dated report rather than a live trend.

## Remaining work

Restore the missing monthly dates and confirm definitions with the source owner. No public deployment or private-browser public-link test has been performed; publishing requires an authorized host and an actual deployment of the function. No changes were made to the potentially shared source workbook. Confirm approved performance thresholds and whether any time-phased target is appropriate.

---

# Historical verification: Canyon & Coast (previous data source)

Checked 23 November 2026 against the live workbook and the local dashboard. Source data can change; figures below are a dated snapshot rather than permanent constants.

## Data readiness and value checks

- The monthly GID and both named worksheets returned machine-readable data; the local API and the Netlify function handler independently loaded 48 monthly rows and 22 advisor rows. The Netlify platform deployment itself was not tested.
- **Raw value:** North Coast, August 2026, monthly recorded revenue was $128,000 in the source; the monthly drill-down and chart's hover title showed $128,000.
- **Cross-sheet reference:** the 2026 Goals sheet lists `N. Coast` with a $1,400,000 revenue goal. The dashboard maps it to North Coast and displayed that goal alongside North Coast's monthly performance.
- **Calculation:** North Coast January–August revenue was $112,000 + $118,000 + $121,000 + $124,000 + $125,000 + $126,000 + $126,000 + $128,000 = $980,000. $980,000 / $1,400,000 × 100 = 70.0% of the annual goal. The dashboard displayed both figures.
- **Definition discrepancy:** Bay Area recorded monthly revenue through August was $1,835,000; advisor manager-recorded engagement value through August 31 was $1,880,000, a $45,000 difference. The dashboard labels them separately and notes that they have different definitions. The data does not establish the precise transaction-level cause of the gap.
- **Other quality checks:** the site identified two missing satisfaction values, the $400,000 difference between the goals TOTAL and the center-goal sum, and the 46-hour Los Angeles difference. Central Coast April satisfaction appeared as unavailable.

## Interactions and changes

- Tested month and center filters, selecting a center row, expanding monthly records, navigation anchors, the chart bar hover/title, both center sort orders and refresh. Refresh retained the chosen period and center. Tested a simulated source error and confirmed the dashboard is hidden and the error shown.
- Verified the source API uses `no-store`; an automated endpoint test changed a **mock** source value and confirmed the next request returned the new value. The real workbook was not changed.
- Added sorting, explicit audience and annual-goal/threshold explanation, print formatting, and a Netlify function so the full project can be deployed with its live endpoint. The site does not assign invented traffic-light thresholds.
- A dated local PDF snapshot was generated and its text checked for the retrieval date, August 2026 reporting period and $6,470,000 YTD revenue.
- `npm test`: six tests passed, including validation, missing coverage, source definitions and the Netlify handler's refresh and error behavior.

## Remaining assignment steps

1. Publish the **complete project including the function** to an authorized Netlify account or equivalent host; static-only Netlify Drop of `public` is insufficient. No public URL exists from this verification.
2. Open that public URL in a private browser and repeat the source, interaction and refresh checks.
3. If authorized, temporarily change a safe value in the source, confirm the deployed site updates, restore it, and confirm again. This potentially shared workbook was not edited during testing.
4. Obtain leadership's explicit thresholds and resolve the outstanding source-data questions. Review [AS_BUILT.md](AS_BUILT.md) and its Needs confirmation list.
5. After publishing, save a new dated PDF snapshot of the actual public site and submit the public link through the course's learner dashboard.
