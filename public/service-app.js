import { calculate, formatMonth, formatNumber, formatPercent, marketsFor, qualityIssues, ratio } from './service-metrics.js';

const $ = id => document.getElementById(id);
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const goalProgress = (actual, goal) => goal > 0 ? `${formatPercent(ratio(actual, goal))} of ${formatNumber(goal)} FY goal` : 'Annual goal unavailable';
let data;

function option(value, label) {
  const node = document.createElement('option');
  node.value = value;
  node.textContent = label;
  return node;
}

async function refresh() {
  $('refresh').disabled = true;
  $('status').className = 'status loading';
  $('status').textContent = 'Connecting to the source workbook…';
  try {
    const response = await fetch('/api/performance', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
    data = result;
    const previous = $('market').value;
    const markets = marketsFor(data);
    $('market').replaceChildren(option('all', 'All markets'), ...markets.map(name => option(name, name)));
    if (previous === 'all' || markets.includes(previous)) $('market').value = previous;
    const fetched = new Date(data.fetchedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    $('status').className = 'status connected';
    $('status').textContent = `Source retrieved ${fetched} · Coordinator YTD through ${data.coordinatorCutoff} · Monthly dates subject to source completeness`;
    $('dashboard').hidden = false;
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
  const market = $('market').value;
  const view = calculate(data, market);
  $('kpi-context').textContent = `Coordinator YTD through ${data.coordinatorCutoff} · ${market === 'all' ? 'All markets' : market}`;
  $('period-pill').textContent = `YTD THROUGH ${data.coordinatorCutoff}`;
  $('coverage-warning').hidden = view.complete;
  $('coverage-warning').textContent = 'Coordinator records are missing for at least one selected market. Aggregate values are withheld.';
  const cards = [
    { label: 'Completed within SLA', value: view.sla === null ? 'Unavailable' : formatPercent(view.sla), detail: view.complete ? `${formatNumber(view.totals.withinSla)} of ${formatNumber(view.totals.completed)} completed · ${view.slaTarget === null ? 'target unavailable' : `${view.slaTarget}% SLA target`}` : 'Missing market coverage' },
    { label: 'Requests completed', value: view.complete ? formatNumber(view.totals.completed) : 'Unavailable', detail: view.complete && view.targets ? goalProgress(view.totals.completed, view.targets.completed) : 'Annual goal unavailable' },
    { label: 'Requests assigned', value: view.complete ? formatNumber(view.totals.assigned) : 'Unavailable', detail: 'Coordinator YTD assignments' },
    { label: 'Site visits', value: view.complete ? formatNumber(view.totals.visits) : 'Unavailable', detail: view.complete && view.targets ? goalProgress(view.totals.visits, view.targets.visits) : 'Annual goal unavailable' }
  ];
  $('kpis').innerHTML = cards.map((card, i) => `<article class="kpi-card"><div class="kpi-top"><span>${escape(card.label.toUpperCase())}</span><span class="kpi-icon kpi-icon-${i}" aria-hidden="true">${['✓', '▤', '↗', '◇'][i]}</span></div><div class="kpi-value">${escape(card.value)}</div><div class="kpi-goal">${escape(card.detail)}</div></article>`).join('');
  renderTrend(market);
  renderInsights(view);
  renderMarkets(view);
  renderMonthly(view);
  renderCoordinators(view);
  const issues = qualityIssues(data);
  $('quality-count').textContent = `${issues.length} ${issues.length === 1 ? 'ISSUE' : 'ISSUES'}`;
  $('quality-list').innerHTML = issues.length ? issues.map(issue => `<div class="quality-item"><span>!</span><p>${escape(issue)}</p></div>`).join('') : '<p class="empty">No issues found by the available checks.</p>';
}

function renderTrend(market) {
  const chart = $('chart');
  const rows = data.monthly.filter(r => market !== 'all' && r.market === market && r.month).sort((a, b) => a.month.localeCompare(b.month));
  const undated = data.monthly.filter(r => (market === 'all' || r.market === market) && !r.month).length;
  if (market === 'all') {
    chart.innerHTML = '<p class="empty">Select a market to inspect dated monthly records. Undated rows are available in the source-record table below.</p>';
  } else if (!rows.length) {
    chart.innerHTML = '<p class="empty">Trend unavailable: no dated monthly records for this market. Dates cannot be inferred from row order.</p>';
  } else {
    const key = $('trend-metric').value;
    const max = Math.max(1, ...rows.map(row => row[key]));
    const step = 620 / rows.length;
    const bars = rows.map((row, i) => {
      const height = row[key] / max * 150;
      return `<rect class="bar" x="${50 + i * step + step * 0.2}" y="${170 - height}" width="${step * 0.6}" height="${height}"><title>${escape(formatMonth(row.month))}: ${formatNumber(row[key])}${key === 'resolution' ? ' hours' : ' requests'}</title></rect><text class="axis-label" text-anchor="middle" x="${50 + (i + 0.5) * step}" y="190">${escape(formatMonth(row.month))}</text>`;
    }).join('');
    chart.innerHTML = `<svg viewBox="0 0 720 210" role="img" aria-label="Dated monthly records. Exact values are in the monthly source table.">${bars}</svg>`;
  }
  $('trend-note').textContent = undated ? `${undated} undated record${undated === 1 ? '' : 's'} omitted` : 'Dated records only';
}

function renderInsights(view) {
  const items = [];
  if (view.sla !== null && view.slaTarget !== null) {
    items.push({ title: 'Completed within SLA', text: `${formatPercent(view.sla)} versus the ${view.slaTarget}% SLA target, based on coordinator YTD completed requests.` });
  }
  const below = view.rows.filter(r => r.satisfaction !== null && r.satisfactionGoal !== null && r.satisfaction < r.satisfactionGoal);
  if (below.length) items.push({ title: 'Coordinator satisfaction below target', text: `${below.length} of ${view.rows.length} coordinator records are below their stated satisfaction target. See the coordinator table for details; this is not a market-wide satisfaction rate.` });
  items.push({ title: 'Director’s September priorities', text: 'The September 4, 2026 update calls for reducing Denver resolution time, reviewing Austin staffing and maintaining satisfaction at or above 92%. These are reported priorities, not verified current monthly trends.' });
  $('insights').innerHTML = items.map(item => `<div class="insight"><div class="insight-icon">!</div><div><strong>${escape(item.title)}</strong><p>${escape(item.text)}</p></div></div>`).join('');
}

function renderMarkets(view) {
  const marketViews = view.markets.map(market => ({ market, ...calculate(data, market) }));
  if ($('market-sort').value === 'sla') marketViews.sort((a, b) => a.sla === null ? (b.sla === null ? a.market.localeCompare(b.market) : 1) : b.sla === null ? -1 : a.sla - b.sla || a.market.localeCompare(b.market));
  $('market-table').innerHTML = marketViews.map(v => `<tr><td><button type="button" class="center-button" data-market="${escape(v.market)}">${escape(v.market)} <span>↗</span></button></td><td class="table-strong">${v.complete ? formatNumber(v.totals.completed) : 'Unavailable'}</td><td>${v.complete && v.targets ? escape(goalProgress(v.totals.completed, v.targets.completed)) : 'Unavailable'}</td><td>${formatPercent(v.sla)}</td><td>${v.slaTarget === null ? 'Unavailable' : `${v.slaTarget}%`}</td><td>${v.complete ? formatNumber(v.totals.assigned) : 'Unavailable'}</td><td>${v.complete ? formatNumber(v.totals.visits) : 'Unavailable'}</td></tr>`).join('');
  const goals = data.goals.filter(g => view.markets.includes(g.market));
  const target = value => value === null ? 'unavailable' : `${value}%`;
  $('target-context').textContent = data.coordinatorCutoff.startsWith('2026-') && goals.length
    ? `2026 source targets by market: ${goals.map(g => `${g.market}: resolution ${g.resolution} hours, satisfaction ${target(g.satisfaction)}, SLA ${target(g.sla)}, completion rate ${target(g.completionRate)}, maximum repeat issue rate ${target(g.repeat)}`).join(' · ')}. Completion and repeat-rate definitions require confirmation.`
    : '2026 market targets are not comparable to the coordinator reporting year.';
}

function renderMonthly(view) {
  const rows = data.monthly.filter(r => view.markets.includes(r.market));
  $('monthly-table').innerHTML = rows.length ? rows.map(r => `<tr><td>${r.record}</td><td>${escape(r.market)}</td><td>${escape(formatMonth(r.month))}</td><td>${formatNumber(r.received)}</td><td>${formatNumber(r.completed)}</td><td>${formatNumber(r.resolution)} h</td><td>${r.satisfaction === null ? 'Unavailable' : `${r.satisfaction}%`}</td><td>${r.sla === null ? 'Unavailable' : `${r.sla}%`}</td><td>${formatNumber(r.repeat)}</td></tr>`).join('') : '<tr><td colspan="9">No monthly records for this market.</td></tr>';
}

function renderCoordinators(view) {
  $('coordinator-context').textContent = `YTD through ${data.coordinatorCutoff}. Satisfaction and resolution are individual figures, not market averages.`;
  $('coordinator-table').innerHTML = view.rows.length ? view.rows.map(r => `<tr><td><strong>${escape(r.name)}</strong><small>${escape(r.market)}</small></td><td>${formatNumber(r.assigned)}</td><td>${formatNumber(r.completed)} <small>of ${formatNumber(r.completedGoal)} FY goal</small></td><td>${formatPercent(ratio(r.withinSla, r.completed))} <small>${formatNumber(r.withinSla)} of ${formatNumber(r.completed)} · ${r.slaGoal === null ? 'target unavailable' : `${r.slaGoal}% target`}</small></td><td>${formatNumber(r.resolution)} h</td><td>${r.satisfaction === null ? 'Unavailable' : `${r.satisfaction}%${r.satisfactionGoal === null ? '' : ` <small>/ ${r.satisfactionGoal}% target</small>`}`}</td><td>${formatNumber(r.visits)} <small>of ${formatNumber(r.visitsGoal)} FY goal</small></td></tr>`).join('') : '<tr><td colspan="7">No coordinator records for this market.</td></tr>';
}

$('refresh').addEventListener('click', refresh);
$('market').addEventListener('change', render);
$('market-sort').addEventListener('change', render);
$('trend-metric').addEventListener('change', render);
$('market-table').addEventListener('click', event => {
  const button = event.target.closest('button[data-market]');
  if (!button) return;
  $('market').value = button.dataset.market;
  render();
  $('overview').scrollIntoView({ behavior: 'smooth' });
});
refresh();
