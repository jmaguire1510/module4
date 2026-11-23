const BASE = 'https://docs.google.com/spreadsheets/d/1FOrhcgDGuPIgQowaoYeDS3izkK2-2DaFmNRkTSpF1es/gviz/tq';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHLY_HEADERS = ['Market', 'Month', 'Requests Received', 'Requests Completed', 'Average Resolution Time (Hours)', 'Client Satisfaction (%)', 'SLA Met (%)', 'Repeat Issues'];
const COORDINATOR_HEADERS = ['Market', 'Workplace Coordinator', 'Requests Assigned (YTD)', 'Requests Completed (YTD)', 'Requests Completed (FY Goal)', 'Completed Within SLA (YTD)', 'Site Visits (YTD)', 'Site Visits (FY Goal)', 'Average Resolution Time (Hours)', 'Client Satisfaction (%)', 'SLA Target (%)', 'Satisfaction Target (%)'];
const GOAL_HEADERS = ['Market', 'Completed Requests (FY Goal)', 'Site Visits (FY Goal)', 'Completion Rate Target (%)', 'Average Resolution Target (Hours)', 'Client Satisfaction Target (%)', 'SLA Compliance Target (%)', 'Maximum Repeat Issue Rate (%)'];

export function parseCSV(text) {
  const rows = [];
  let row = [], field = '', quoted = false, closed = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else field += c;
    } else if (c === '"' && !field && !closed) quoted = true;
    else if (c === ',') { row.push(field); field = ''; closed = false; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = ''; closed = false;
    } else {
      if (closed || c === '"') throw new Error('Malformed CSV from Google Sheets');
      field += c;
    }
  }
  if (quoted) throw new Error('Unterminated quoted CSV field');
  if (field || row.length || closed) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(value => value.trim() !== ''));
}

function table(text, headers, label) {
  const rows = parseCSV(text);
  if (!rows.length || rows[0].length !== headers.length || headers.some((h, i) => rows[0][i].trim() !== h)) {
    throw new Error(`${label}: source columns have changed`);
  }
  if (rows.length === 1) throw new Error(`${label}: no records returned`);
  return rows.slice(1).map((row, i) => {
    if (row.length !== headers.length) throw new Error(`${label}: invalid column count on row ${i + 2}`);
    return row.map(value => value.trim());
  });
}

function number(value, context, { nullable = false, integer = false, percent = false } = {}) {
  if (!value && nullable) return null;
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(value)) throw new Error(`${context}: invalid or missing number`);
  const result = Number(value.replaceAll(',', ''));
  if (!Number.isFinite(result) || (integer && !Number.isInteger(result)) || (percent && result > 100)) throw new Error(`${context}: number out of range`);
  return result;
}

function required(value, context) {
  if (!value) throw new Error(`${context}: missing text`);
  return value;
}

function unique(records, key, label) {
  const seen = new Set();
  for (const record of records) {
    const value = key(record);
    if (seen.has(value)) throw new Error(`${label}: duplicate key ${value}`);
    seen.add(value);
  }
}

function parseMonth(value) {
  if (!value) return null;
  const match = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})$/i.exec(value);
  if (match) return `${match[2]}-${String(MONTHS.findIndex(m => m.toLowerCase() === match[1].toLowerCase()) + 1).padStart(2, '0')}`;
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  if (us) {
    const isoDate = `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`;
    const date = new Date(`${isoDate}T00:00:00Z`);
    if (!Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === isoDate) return isoDate.slice(0, 7);
  }
  const iso = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(value);
  if (iso) {
    const date = new Date(`${iso[1]}-${iso[2]}-${iso[3] || '01'}T00:00:00Z`);
    if (!Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === `${iso[1]}-${iso[2]}-${iso[3] || '01'}`) return `${iso[1]}-${iso[2]}`;
  }
  throw new Error(`Monthly Performance: invalid month ${value}`);
}

export function normalizeSources({ monthlyCSV, coordinatorCSV, goalsCSV, coordinatorNotes }) {
  const monthly = table(monthlyCSV, MONTHLY_HEADERS, 'Monthly Performance').map((r, i) => ({
    record: i + 1, market: required(r[0], `Monthly record ${i + 1}`), month: parseMonth(r[1]),
    received: number(r[2], 'Monthly requests received', { integer: true }),
    completed: number(r[3], 'Monthly requests completed', { integer: true }),
    resolution: number(r[4], 'Monthly resolution time'),
    satisfaction: number(r[5], 'Monthly satisfaction', { nullable: true, percent: true }),
    sla: number(r[6], 'Monthly SLA', { nullable: true, percent: true }),
    repeat: number(r[7], 'Monthly repeat issues', { integer: true })
  }));
  const coordinators = table(coordinatorCSV, COORDINATOR_HEADERS, 'Coordinator Activity').map(r => ({
    market: required(r[0], 'Coordinator market'), name: required(r[1], 'Coordinator name'),
    assigned: number(r[2], 'Coordinator assigned', { integer: true }),
    completed: number(r[3], 'Coordinator completed', { integer: true }),
    completedGoal: number(r[4], 'Coordinator completed goal', { integer: true }),
    withinSla: number(r[5], 'Coordinator within SLA', { integer: true }),
    visits: number(r[6], 'Coordinator visits', { integer: true }),
    visitsGoal: number(r[7], 'Coordinator visits goal', { integer: true }),
    resolution: number(r[8], 'Coordinator resolution time'),
    satisfaction: number(r[9], 'Coordinator satisfaction', { nullable: true, percent: true }),
    slaGoal: number(r[10], 'Coordinator SLA target', { nullable: true, percent: true }),
    satisfactionGoal: number(r[11], 'Coordinator satisfaction target', { nullable: true, percent: true })
  }));
  for (const r of coordinators) if (r.withinSla > r.completed) throw new Error(`Coordinator Activity: completed within SLA exceeds completed for ${r.name}`);
  const goalRows = table(goalsCSV, GOAL_HEADERS, '2026 Goals').map(r => ({
    sourceMarket: required(r[0], 'Goal market'), market: r[0] === 'Mpls.' ? 'Minneapolis' : r[0],
    completed: number(r[1], 'Goal completed requests', { integer: true }),
    visits: number(r[2], 'Goal site visits', { integer: true }),
    completionRate: number(r[3], 'Goal completion rate', { nullable: true, percent: true }),
    resolution: number(r[4], 'Goal resolution time'),
    satisfaction: number(r[5], 'Goal satisfaction', { nullable: true, percent: true }),
    sla: number(r[6], 'Goal SLA', { nullable: true, percent: true }),
    repeat: number(r[7], 'Goal repeat issue rate', { nullable: true, percent: true })
  }));
  unique(monthly.filter(r => r.month), r => `${r.market}|${r.month}`, 'Monthly Performance');
  unique(coordinators, r => `${r.market}|${r.name}`, 'Coordinator Activity');
  unique(goalRows, r => r.market, '2026 Goals');
  const notes = parseCSV(coordinatorNotes).map(r => r.join(' ')).join(' ');
  const cutoffMatch = /through\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/i.exec(notes);
  if (!cutoffMatch) throw new Error('Coordinator Activity: YTD cutoff is missing or unrecognized');
  const cutoff = `${cutoffMatch[3]}-${cutoffMatch[1].padStart(2, '0')}-${cutoffMatch[2].padStart(2, '0')}`;
  const date = new Date(`${cutoff}T00:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== cutoff) throw new Error('Coordinator Activity: invalid YTD cutoff');
  return { monthly, coordinators, goals: goalRows.filter(r => r.market !== 'TOTAL'), goalTotal: goalRows.find(r => r.market === 'TOTAL') ?? null, coordinatorCutoff: cutoff, coordinatorNote: notes };
}

async function getCSV(params) {
  const url = new URL(BASE);
  url.search = new URLSearchParams({ tqx: 'out:csv', ...params });
  const response = await fetch(url, { signal: AbortSignal.timeout(15000), redirect: 'follow' });
  if (!response.ok) throw new Error(`Google Sheets returned HTTP ${response.status}`);
  if (!response.headers.get('content-type')?.toLowerCase().includes('text/csv')) throw new Error('Google Sheets did not return CSV data; check sharing permissions');
  const text = await response.text();
  if (text.length > 5_000_000) throw new Error('Google Sheets response exceeds size limit');
  return text;
}

export async function loadData() {
  const [monthlyCSV, coordinatorCSV, goalsCSV, coordinatorNotes] = await Promise.all([
    getCSV({ gid: '1731940043', headers: '1' }),
    getCSV({ sheet: 'Coordinator Activity', range: 'A4:L', headers: '1' }),
    getCSV({ sheet: '2026 Goals', range: 'A4:H', headers: '1' }),
    getCSV({ sheet: 'Coordinator Activity', range: 'A1:A2', headers: '0' })
  ]);
  return { ...normalizeSources({ monthlyCSV, coordinatorCSV, goalsCSV, coordinatorNotes }), fetchedAt: new Date().toISOString() };
}
