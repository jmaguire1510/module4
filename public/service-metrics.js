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
  
  // Month field completeness
  const undated = data.monthly.filter(row => !row.month);
  if (undated.length === data.monthly.length) {
    issues.push('⚠ no month provided — all monthly records are undated. Trends and time-series analysis cannot be performed. Restore month values to enable date-based analysis.');
  } else if (undated.length) {
    issues.push(`⚠ partial month data — ${undated.length} of ${data.monthly.length} monthly records have no month provided. Undated records cannot be charted or time-ordered. Dated records: ${data.monthly.filter(r => r.month).length}.`);
  }
  
  // Monthly satisfaction data
  const missingSatisfaction = data.monthly.filter(row => row.satisfaction === null);
  if (missingSatisfaction.length === data.monthly.length) {
    issues.push('⚠ no satisfaction provided — all monthly satisfaction values are missing. Client satisfaction cannot be measured at the monthly level. Records affected: all 32.');
  } else if (missingSatisfaction.length) {
    const satisfactionRecords = missingSatisfaction.map(row => `${row.market} record ${row.record}`).join('; ');
    issues.push(`⚠ partial satisfaction data — ${missingSatisfaction.length} of ${data.monthly.length} monthly records have no satisfaction provided. Affected: ${satisfactionRecords}.`);
  }
  
  // Monthly SLA data
  const missingSLA = data.monthly.filter(row => row.sla === null);
  if (missingSLA.length === data.monthly.length) {
    issues.push('⚠ no SLA provided — all monthly SLA values are missing. Monthly SLA compliance cannot be compared to coordinator-level SLA. Records affected: all 32.');
  } else if (missingSLA.length) {
    const slaRecords = missingSLA.map(row => `${row.market} record ${row.record}`).join('; ');
    issues.push(`⚠ partial SLA data — ${missingSLA.length} of ${data.monthly.length} monthly records have no SLA provided. Affected: ${slaRecords}.`);
  }
  
  // Coordinator completed counts
  const missingCompleted = data.coordinators.filter(row => row.completed === null);
  if (missingCompleted.length) {
    const coordinatorList = missingCompleted.map(row => `${row.name} (${row.market})`).join('; ');
    issues.push(`⚠ no completed counts provided — ${missingCompleted.length} coordinator record${missingCompleted.length === 1 ? '' : 's'} missing completed-request data: ${coordinatorList}. Affected market SLA calculations and completed totals are unavailable.`);
  }
  
  // Market coverage across data sources
  const groups = [
    ['monthly', new Set(data.monthly.map(r => r.market))],
    ['coordinator', new Set(data.coordinators.map(r => r.market))],
    ['goals', new Set(data.goals.map(r => r.market))]
  ];
  for (const [label, names] of groups) {
    const missing = marketsFor(data).filter(name => !names.has(name));
    if (missing.length) {
      const pluralMarket = missing.length === 1 ? 'market is' : 'markets are';
      issues.push(`⚠ ${missing.length} ${pluralMarket} missing from ${label} data: ${missing.join(', ')}. This market may not be reflected in certain views or comparisons.`);
    }
  }
  
  // Goal TOTAL reconciliation
  if (!data.goalTotal) {
    issues.push('⚠ no TOTAL row in 2026 Goals — cannot verify that market goal totals match the stated annual target. Please add a TOTAL row for reconciliation.');
  } else {
    for (const key of ['completed', 'visits']) {
      if (sum(data.goals, key) !== data.goalTotal[key]) {
        issues.push(`⚠ 2026 Goals ${key === 'completed' ? 'completed requests' : 'site visits'} TOTAL mismatch — market goals sum to ${sum(data.goals, key)} but the TOTAL row shows ${data.goalTotal[key]}. Verify that all markets are included and figures are current.`);
      }
    }
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
