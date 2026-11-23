# Morrowlane service performance monitor

A source-backed dashboard for Morrowlane operations leadership. See [DATA_DICTIONARY.md](DATA_DICTIONARY.md) for discovery, [VERIFICATION.md](VERIFICATION.md) for checks and [AS_BUILT.md](AS_BUILT.md) for maintenance details and open questions.

## Run

Requires Node.js 20 or later. No package installation is needed.

```sh
npm start
```

Open `http://127.0.0.1:3000`. Set `PORT` to change the port. Run checks with `npm test`.

The server retrieves the specified monthly worksheet, Coordinator Activity, 2026 Goals and the coordinator cutoff note directly from Google Sheets on each refresh. It validates headers, data types, known dated keys and the cutoff. Errors are displayed rather than replaced with cached or sample data. The retrieval timestamp is not the source last-modified time. If access fails, the workbook owner must grant public read/export access or the application must be extended with an authenticated server-side integration.

## Reading the dashboard

- The market filter applies to coordinator YTD totals and source records. The coordinator note supplies the cutoff; annual goals are compared only when that cutoff falls in 2026.
- The leadership SLA measure is the sum of completed-within-SLA requests divided by the sum of completed requests, not the 92% completion-rate target and not an unweighted average. At discovery, 3,230 / 3,466 = 93.2%, rounding to the director's 93%, against the 90% SLA target.
- The SLA card compares the unrounded rate with the applicable target and displays the gap in percentage points; the comparison is unavailable if the rate or target is unavailable. If a coordinator's completed count is missing, affected SLA rates and completed totals are withheld and the quality panel identifies the missing source value.
- All monthly source Month fields were blank at discovery. The application does not invent dates or trend lines; raw records remain available. Dated records can be charted for an individual market when valid dates are supplied.
- Individual coordinator satisfaction and resolution values are not market averages. No time-phased goal pace or additional red/yellow/green thresholds are invented. Completion-rate and repeat-issue-rate denominators need confirmation.
- Source quality checks flag missing months and measurements, unmatched markets and inconsistent annual total rows. The `Mpls.` goal alias is mapped to Minneapolis. The director's September priorities are a dated narrative, not verified current monthly trends.

## Publishing

The local server is not a public deployment. The repository includes Netlify function and configuration files so that a **Netlify build from the complete project** can publish `public` and deploy the source-backed `/api/performance` endpoint. A static-only Netlify Drop of the `public` folder does not deploy this function and will not produce a working dashboard. Connect the full repository to a Netlify site or use a deployment method that builds and uploads the function; then test the resulting HTTPS URL in a private browser, including refresh. Netlify deployment and a public URL have not been verified by this project.

For a dated snapshot, select the desired market and use the browser's Print → Save as PDF. The source retrieval timestamp and coordinator YTD cutoff appear in the printed view; open the monthly details first if those records should be included.

## Security and operations

The server binds to loopback only and does not provide user authentication or authorization. The assignment describes Morrowlane as fictional; its workbook was publicly readable at discovery. Anyone with access to a public workbook may be able to view its contents. Do not expose this service or a workbook publicly for sensitive business data. For real data, follow company policy, use only necessary fields, verify permission and the AI tool's data protections, and handle personal information appropriately. A production deployment requires an authenticated, authorized access layer, protected source access, and operational monitoring. Source sheet names, header rows and the 2026 goal mapping are validated; structural changes need review.
