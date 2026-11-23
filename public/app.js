import { calculate, covered, formatMonth, formatValue, measures, qualityIssues, revenueDifferences, sum } from './metrics.js';

const $ = id => document.getElementById(id);
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const percent = (value, target) => target > 0 ? `${(value / target * 100).toFixed(1)}%` : '—';
let data;

function option(value, label) {
  const el = document.createElement('option');
  el.value = value;
  el.textContent = label;
  return el;
}

async function refresh() {
  $('refresh').disabled = true;
  $('status').hidden = false;
  $('status').className = 'status loading';
  $('status').textContent = 'Connecting to the source workbook…';
  try {
    const response = await fetch('/api/performance', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
    data = result;
    const oldMonth = $('month').value, oldCenter = $('center').value;
    const months = [...new Set(data.monthly.map(r => r.month))].sort().reverse();
    const centers = [...new Set([...data.monthly, ...data.goals, ...data.advisors].map(r => r.center))].sort();
    $('month').replaceChildren(...months.map(m => option(m, formatMonth(m))));
    $('center').replaceChildren(option('all', 'All centers'), ...centers.map(c => option(c, c)));
    if (months.includes(oldMonth)) $('month').value = oldMonth;
    if (oldCenter === 'all' || centers.includes(oldCenter)) $('center').value = oldCenter;
    $('dashboard').hidden = false;
    const fetched = new Date(data.fetchedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    $('status').className = 'status connected';
    $('status').textContent = `Source retrieved ${fetched} · Monthly data through ${formatMonth(months[0])} · Advisor data through ${data.advisorCutoff}`;
    render();
  } catch (error) {
    data = null;
    $('dashboard').hidden = true;
    $('status').className = 'status error';
    $('status').textContent = `${error.message}. Check workbook sharing and network access, then try again. No cached data is displayed.`;
  } finally {
    $('refresh').disabled = false;
  }
}

function render() {
  const month = $('month').value, center = $('center').value;
  const view = calculate(data, center, month);
  const label = center === 'all' ? 'All centers' : center;
  $('kpi-context').textContent = `Year to date through ${formatMonth(month)} · ${label}`;
  $('period-pill').textContent = `JAN – ${formatMonth(month).toUpperCase()}`;
  $('coverage-warning').hidden = view.complete;
  $('coverage-warning').textContent = 'Incomplete monthly coverage in this reporting view. Totals and annual progress are withheld until every selected center has a record for each month from January.';
  $('kpis').innerHTML = measures.map((m, i) => {
    const value = view.complete ? formatValue(view.totals[m.key], m.key) : '—';
    const goal = view.complete && view.goals && view.goals[m.key] > 0
      ? `${percent(view.totals[m.key], view.goals[m.key])} <span>of ${formatValue(view.goals[m.key], m.key)} annual goal</span>`
      : '<span>Annual goal comparison unavailable</span>';
    return `<article class="kpi-card"><div class="kpi-top"><span>${escape(m.key === 'revenue' ? 'RECORDED REVENUE' : m.label.toUpperCase())}</span><span class="kpi-icon kpi-icon-${i}" aria-hidden="true">${['↗', '♙', '◷', '◇'][i]}</span></div><div class="kpi-value">${value}</div><div class="kpi-goal">${goal}</div><div class="progress"><div class="progress-fill fill-${i}" data-progress="${view.complete && view.goals && view.goals[m.key] > 0 ? Math.min(100, view.totals[m.key] / view.goals[m.key] * 100) : 0}"></div></div></article>`;
  }).join('');
  // Widths are applied through SVG rather than inline styles so the CSP stays restrictive.
  document.querySelectorAll('.progress-fill').forEach(el => {
    const progress = Number(el.dataset.progress);
    el.innerHTML = `<svg viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden="true"><rect width="${progress}" height="4" rx="2"></rect></svg>`;
  });
  renderTrend(view);
  renderInsights(view, month);
  renderCenters(view, month);
  renderMonthly(view);
  renderAdvisors(center);
  const issues = qualityIssues(data);
  $('quality-count').textContent = `${issues.length} ${issues.length === 1 ? 'ISSUE' : 'ISSUES'}`;
  $('quality-list').innerHTML = issues.length ? issues.map(issue => `<div class="quality-item"><span>!</span><p>${escape(issue)}</p></div>`).join('') : '<p class="empty">No issues found by the available checks.</p>';
  const differences = revenueDifferences(data);
  $('revenue-comparison').innerHTML = differences.length ? differences.map(r => `<p>${escape(r.center)} through ${escape(data.advisorCutoff)}: ${formatValue(r.recorded, 'revenue')} recorded vs. ${formatValue(r.engagement, 'revenue')} engagement value.</p>`).join('') : '<p>No differing comparable center totals found, or periods are not comparable.</p>';
}

function renderTrend(view) {
  const complete = view.trend.filter(t => t.complete);
  const max = Math.max(1, ...complete.map(t => t.revenue));
  const width = 720, height = 220, left = 60, right = 10, top = 15, bottom = 35;
  const plotW = width - left - right, plotH = height - top - bottom;
  const count = view.trend.length;
  const step = plotW / Math.max(count, 1);
  const y = v => top + plotH - v / max * plotH;
  const grid = [0, 0.5, 1].map(n => `<line x1="${left}" y1="${y(max * n)}" x2="${width - right}" y2="${y(max * n)}" class="grid-line"/><text x="${left - 10}" y="${y(max * n) + 4}" text-anchor="end" class="axis-label">${escape(new Intl.NumberFormat('en-US', { notation: 'compact', style: 'currency', currency: 'USD', maximumFractionDigits: 1 }).format(max * n))}</text>`).join('');
  const bars = view.trend.map((t, i) => {
    const x = left + i * step + step * 0.22, w = step * 0.56;
    const bar = t.complete ? `<rect x="${x}" y="${y(t.revenue)}" width="${w}" height="${top + plotH - y(t.revenue)}" rx="3" class="${i === count - 1 ? 'bar latest' : 'bar'}"><title>${escape(formatMonth(t.month))}: ${escape(formatValue(t.revenue, 'revenue'))}</title></rect>` : '';
    return `${bar}<text x="${left + (i + 0.5) * step}" y="${height - 10}" text-anchor="middle" class="axis-label">${escape(formatMonth(t.month).split(' ')[0])}</text>`;
  }).join('');
  $('chart').innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Monthly revenue chart. Individual values are available in the monthly source records table.">${grid}${bars}</svg>`;
  $('trend-note').textContent = view.trend.some(t => !t.complete) ? 'Incomplete months omitted' : 'Selected year to date';
}

function renderInsights(view, month) {
  const items = [];
  const latest = view.trend.find(t => t.month === month);
  const previousDate = new Date(`${month}-01T00:00:00Z`);
  previousDate.setUTCMonth(previousDate.getUTCMonth() - 1);
  const previousMonth = previousDate.toISOString().slice(0, 7);
  const previous = view.trend.find(t => t.month === previousMonth);
  if (latest?.complete && previous?.complete && previous.revenue > 0) {
    const change = (latest.revenue - previous.revenue) / previous.revenue * 100;
    items.push({ icon: change < 0 ? '↘' : '↗', title: 'Revenue momentum', text: `${formatMonth(month)} revenue ${change < 0 ? 'decreased' : 'increased'} ${Math.abs(change).toFixed(1)}% from ${formatMonth(previousMonth)}.` });
  }
  const latestRows = data.monthly.filter(r => view.selected.includes(r.center) && r.month === month);
  const below = latestRows.filter(r => {
    const goal = data.goals.find(g => g.center === r.center);
    return month.startsWith('2026-') && r.satisfaction !== null && goal?.satisfaction !== null && goal?.satisfaction !== undefined && r.satisfaction < goal.satisfaction;
  });
  if (below.length) items.push({ icon: '!', title: 'Satisfaction below target', text: `${below.map(r => `${r.center} (${r.satisfaction}%)`).join(', ')} in ${formatMonth(month)}.` });
  const missing = latestRows.filter(r => r.satisfaction === null);
  if (missing.length) items.push({ icon: '!', title: 'Satisfaction unavailable', text: `No ${formatMonth(month)} value for ${missing.map(r => r.center).join(', ')}.` });
  if (!view.complete) items.push({ icon: '!', title: 'Incomplete reporting', text: 'Year-to-date values are withheld because one or more center-month records are missing.' });
  if (!view.goalsAvailable) items.push({ icon: '!', title: 'Goals unavailable', text: 'Annual goals are available only for matched centers in 2026.' });
  if (!items.length) items.push({ icon: '✓', title: 'No signal identified', text: 'No comparable month-over-month revenue or satisfaction exception was found for this view.' });
  $('insights').innerHTML = items.map(i => `<div class="insight"><div class="insight-icon">${escape(i.icon)}</div><div><strong>${escape(i.title)}</strong><p>${escape(i.text)}</p></div></div>`).join('');
}

function renderCenters(view, month) {
  const centers = [...view.selected];
  if ($('center-sort').value === 'revenue') {
    const values = new Map(centers.map(center => {
      const rows = view.rows.filter(r => r.center === center);
      return [center, covered(rows, [center], month) ? sum(rows, 'revenue') : null];
    }));
    centers.sort((a, b) => {
      const aValue = values.get(a), bValue = values.get(b);
      if (aValue === null) return bValue === null ? a.localeCompare(b) : 1;
      if (bValue === null) return -1;
      return bValue - aValue || a.localeCompare(b);
    });
  }
  $('center-table').innerHTML = centers.map(center => {
    const rows = view.rows.filter(r => r.center === center);
    const complete = covered(rows, [center], month);
    const goal = data.goals.find(g => g.center === center);
    const latest = rows.find(r => r.month === month);
    const revenue = complete ? sum(rows, 'revenue') : null;
    return `<tr><td><button type="button" class="center-button" data-center="${escape(center)}">${escape(center)} <span>↗</span></button></td><td class="table-strong">${revenue === null ? '—' : formatValue(revenue, 'revenue')}</td><td>${revenue !== null && month.startsWith('2026-') && goal?.revenue > 0 ? `${percent(revenue, goal.revenue)} <small>of ${formatValue(goal.revenue, 'revenue')}</small>` : '—'}</td><td>${complete ? formatValue(sum(rows, 'clients'), 'clients') : '—'}</td><td>${complete ? formatValue(sum(rows, 'hours'), 'hours') : '—'}</td><td>${complete ? formatValue(sum(rows, 'projects'), 'projects') : '—'}</td><td>${latest?.satisfaction == null ? '<span class="muted">Unavailable</span>' : `${latest.satisfaction}%${month.startsWith('2026-') && goal?.satisfaction != null ? ` <small>/ ${goal.satisfaction}% target</small>` : ''}`}</td></tr>`;
  }).join('');
}

function renderMonthly(view) {
  const rows = [...view.rows].sort((a, b) => b.month.localeCompare(a.month) || a.center.localeCompare(b.center));
  $('monthly-table').innerHTML = rows.length ? rows.map(r => `<tr><td>${escape(formatMonth(r.month))}</td><td>${escape(r.center)}</td><td class="table-strong">${formatValue(r.revenue, 'revenue')}</td><td>${formatValue(r.clients, 'clients')}</td><td>${formatValue(r.hours, 'hours')}</td><td>${formatValue(r.projects, 'projects')}</td><td>${r.satisfaction === null ? 'Unavailable' : `${r.satisfaction}%`}</td></tr>`).join('') : '<tr><td colspan="7">No monthly records in this view.</td></tr>';
}

function renderAdvisors(center) {
  $('advisor-context').textContent = `Through ${data.advisorCutoff}, independent of reporting month. Revenue is manager-recorded engagement value.`;
  const rows = data.advisors.filter(r => center === 'all' || r.center === center);
  $('advisor-table').innerHTML = rows.length ? rows.map(r => `<tr><td><strong>${escape(r.name)}</strong><small>${escape(r.center)}</small></td><td class="table-strong">${formatValue(r.revenue, 'revenue')}</td><td>${percent(r.revenue, r.revenueGoal)} <small>of ${formatValue(r.revenueGoal, 'revenue')}</small></td><td>${formatValue(r.hours, 'hours')}</td><td>${formatValue(r.clients, 'clients')}</td><td>${formatValue(r.projects, 'projects')}</td><td>${r.satisfaction == null ? 'Unavailable' : `${r.satisfaction}%${r.satisfactionGoal == null ? '' : ` <small>/ ${r.satisfactionGoal}% target</small>`}`}</td></tr>`).join('') : '<tr><td colspan="7">No advisor records for this center.</td></tr>';
}

$('refresh').addEventListener('click', refresh);
$('month').addEventListener('change', render);
$('center').addEventListener('change', render);
$('center-sort').addEventListener('change', render);
$('center-table').addEventListener('click', event => {
  const button = event.target.closest('button[data-center]');
  if (!button) return;
  $('center').value = button.dataset.center;
  render();
  $('overview').scrollIntoView({ behavior: 'smooth' });
});
refresh();
