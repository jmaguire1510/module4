export function sum(rows, key) {
  return rows.reduce((total, row) => total + row[key], 0);
}

export function ratio(numerator, denominator) {
  return denominator > 0 ? 100 * numerator / denominator : null;
}

export function marketsFor(data) {
  return [...new Set([...data.monthly, ...data.coordinators, ...data.goals].map(r => r.market))].sort();
}

export function calculate(data, market) {
  const markets = market === 'all' ? marketsFor(data) : [market];
  const rows = data.coordinators.filter(row => markets.includes(row.market));
  const goals = data.goals.filter(row => markets.includes(row.market));
  const complete = markets.length > 0 && markets.every(name => rows.some(row => row.market === name));
  const goalsAvailable = data.coordinatorCutoff.startsWith('2026-') && markets.every(name => goals.some(row => row.market === name));
  const totals = Object.fromEntries(['assigned', 'withinSla', 'visits'].map(key => [key, sum(rows, key)]));
  totals.completed = rows.some(row => row.completed === null) ? null : sum(rows, 'completed');
  const targets = goalsAvailable ? { completed: sum(goals, 'completed'), visits: sum(goals, 'visits') } : null;
  const slaTargets = [...new Set(goals.map(row => row.sla))];
  const slaTarget = goalsAvailable && slaTargets.length === 1 ? slaTargets[0] : null;
  return { markets, rows, complete, goalsAvailable, totals, targets, sla: complete ? ratio(totals.withinSla, totals.completed) : null, slaTarget };
}

export function qualityIssues(data) {
  const issues = [];
  const undated = data.monthly.filter(row => !row.month);
  if (undated.length) issues.push(`${undated.length} of ${data.monthly.length} monthly records have no month. Dates and trends cannot be inferred from row order.`);
  for (const [key, label] of [['satisfaction', 'satisfaction'], ['sla', 'SLA']]) {
    const missing = data.monthly.filter(row => row[key] === null);
    if (missing.length) issues.push(`${missing.length} monthly ${label} value${missing.length === 1 ? ' is' : 's are'} missing (export record${missing.length === 1 ? '' : 's'} ${missing.map(row => row.record).join(', ')}).`);
  }
  const missingCompleted = data.coordinators.filter(row => row.completed === null);
  if (missingCompleted.length) issues.push(`${missingCompleted.length} coordinator completed-request value${missingCompleted.length === 1 ? ' is' : 's are'} missing: ${missingCompleted.map(row => `${row.name} (${row.market})`).join(', ')}. Affected completed totals and SLA rates are unavailable.`);
  const groups = [
    ['monthly', new Set(data.monthly.map(r => r.market))],
    ['coordinator', new Set(data.coordinators.map(r => r.market))],
    ['goals', new Set(data.goals.map(r => r.market))]
  ];
  for (const [label, names] of groups) {
    const missing = marketsFor(data).filter(name => !names.has(name));
    if (missing.length) issues.push(`Markets missing from ${label} data: ${missing.join(', ')}.`);
  }
  if (!data.goalTotal) issues.push('2026 Goals has no TOTAL row to compare with market goals.');
  else for (const key of ['completed', 'visits']) {
    if (sum(data.goals, key) !== data.goalTotal[key]) issues.push(`2026 Goals ${key} TOTAL does not match the sum of market goals.`);
  }
  return issues;
}

export function formatNumber(value) {
  return value === null ? 'Unavailable' : new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value);
}

export function formatPercent(value) {
  return value === null ? 'Unavailable' : `${value.toFixed(1)}%`;
}

export function slaTargetComparison(sla, target) {
  if (sla === null || target === null) return 'Target comparison: Unavailable';
  const difference = sla - target;
  if (difference === 0) return 'At SLA target (0.0 percentage points)';
  const magnitude = Math.abs(difference);
  const amount = magnitude < 0.05 ? 'Less than 0.1' : magnitude.toFixed(1);
  return `${amount} percentage points ${difference > 0 ? 'above' : 'below'} SLA target`;
}

export function slaCard(view, cutoff) {
  const target = view.slaTarget === null ? 'target unavailable' : `${view.slaTarget}% SLA target`;
  const detail = !view.complete ? 'Missing market coverage' : view.totals.completed === null
    ? `Completed requests unavailable · ${target}`
    : `${formatNumber(view.totals.withinSla)} of ${formatNumber(view.totals.completed)} completed · ${target}`;
  return {
    label: 'Completed within SLA',
    value: formatPercent(view.sla),
    detail,
    comparison: slaTargetComparison(view.sla, view.slaTarget),
    cutoff: `YTD through ${cutoff}`
  };
}

export function formatMonth(value) {
  if (!value) return 'Unavailable';
  const [year, month] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1)));
}
