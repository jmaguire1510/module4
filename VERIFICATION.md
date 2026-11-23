# Morrowlane verification record

Checked 23 November 2026 against the live public workbook and local site.

- Monthly Performance returned 32 records, all with missing months; Coordinator Activity returned 12 records with a YTD cutoff of 31 August 2026. Goals contain four market rows and one total. Monthly trends are explicitly withheld rather than inferred.
- Coordinator counts sum to 3,230 completed within SLA and 3,466 completed. 3,230 / 3,466 × 100 = 93.190998...%, displayed as 93.2% and rounding to the leadership update's 93%. The target shown is the 90% SLA target, not the separate 92% completion-rate target.
- Denver coordinator totals are 657 completed and 603 within SLA, or 91.8%; its annual completed goal is 1,020. The browser displayed those values and its three coordinators. `Mpls.` was mapped to Minneapolis.
- Denver export record 17 contains 82 received, 75 completed and 39-hour resolution with no month; the source drill-down displayed those values without assigning a date.
- Live browser checks covered the market filter, market drill-down, SLA sorting, raw-record details and refresh. A simulated response with two dated Denver records produced the expected request and resolution charts, with the remaining undated records omitted. A simulated source error hid the dashboard and displayed the error. Automated tests cover invalid data, missing dates, zero denominators, weighted SLA and refresh behavior.
- Monthly data has one missing satisfaction and one missing SLA value. Its dates and denominators prevent reliable reconciliation with the leadership YTD figure. The director's September narrative is identified as a dated report rather than a live trend.
- KPI status legend displays color-coded status indicators (Green: Met, Yellow: 50–74%, Red: < 50%) in compact single-line format below KPI cards.
- Leadership focus panel displays on right side alongside Market performance table in two-column layout (desktop) with responsive single-column fallback (mobile).

## Remaining work

Restore the missing monthly dates and confirm definitions with the source owner. No public deployment or private-browser public-link test has been performed; publishing requires an authorized host and an actual deployment of the function. No changes were made to the potentially shared source workbook. Confirm approved performance thresholds and whether any time-phased target is appropriate.
