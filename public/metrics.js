export const measures = [
  { key: 'revenue', label: 'Revenue', goal: 'revenue' },
  { key: 'clients', label: 'New clients', goal: 'clients' },
  { key: 'hours', label: 'Consulting hours', goal: 'hours' },
  { key: 'projects', label: 'Completed projects', goal: 'projects' }
];

export function sum(rows, key) {
  return rows.reduce((total, row) => total + row[key], 0);
}

export function covered(rows, centers, month) {
  if (!centers.length) return false;
  const [year, last] = month.split('-').map(Number);
  const keys = new Set(rows.map(r => `${r.center}|${r.month}`));
  return centers.every(center => Array.from({ length: last }, (_, i) =>
    keys.has(`${center}|${year}-${String(i + 1).padStart(2, '0')}`)).every(Boolean));
}

export function calculate(data, center, month) {
  const centers = [...new Set([...data.monthly, ...data.goals, ...data.advisors].map(r => r.center))].sort();
  const selected = center === 'all' ? centers : [center];
  const year = month.slice(0, 4);
  const rows = data.monthly.filter(r => selected.includes(r.center) && r.month.slice(0, 4) === year && r.month <= month);
  const complete = covered(rows, selected, month);
  const goalRows = data.goals.filter(r => selected.includes(r.center));
  const goalsAvailable = year === '2026' && selected.every(c => goalRows.some(g => g.center === c));
  const totals = Object.fromEntries(measures.map(m => [m.key, sum(rows, m.key)]));
  const goals = goalsAvailable ? Object.fromEntries(measures.map(m => [m.key, sum(goalRows, m.goal)])) : null;
  const months = [...new Set(rows.map(r => r.month))].sort();
  const trend = months.map(m => ({ month: m, ...Object.fromEntries(measures.map(metric => [metric.key, sum(rows.filter(r => r.month === m), metric.key)])), complete: selected.every(c => rows.some(r => r.month === m && r.center === c)) }));
  return { centers, selected, rows, complete, goalsAvailable, totals, goals, trend };
}

export function qualityIssues(data) {
  const issues = [];
  const missing = data.monthly.filter(r => r.satisfaction === null);
  if (missing.length) issues.push(`${missing.length} monthly satisfaction value${missing.length === 1 ? ' is' : 's are'} missing: ${missing.map(r => `${r.center} (${r.month})`).join(', ')}.`);
  if (data.goalTotal) {
    for (const m of measures) {
      const actual = sum(data.goals, m.key);
      if (Math.abs(actual - data.goalTotal[m.key]) > 0.001) issues.push(`2026 Goals ${m.label.toLowerCase()} total differs from the sum of center goals by ${formatValue(Math.abs(actual - data.goalTotal[m.key]), m.key)}. Center goals are used.`);
    }
  } else issues.push('2026 Goals has no TOTAL row to validate against center goals.');
  const monthlyCenters = new Set(data.monthly.map(r => r.center));
  const goalCenters = new Set(data.goals.map(r => r.center));
  const unmatched = [...new Set([...monthlyCenters, ...goalCenters])].filter(c => !monthlyCenters.has(c) || !goalCenters.has(c));
  if (unmatched.length) issues.push(`Centers not matched between monthly data and goals: ${unmatched.join(', ')}.`);
  const advisorCenters = new Set(data.advisors.map(r => r.center));
  const unmatchedAdvisors = [...new Set([...monthlyCenters, ...advisorCenters])].filter(c => !monthlyCenters.has(c) || !advisorCenters.has(c));
  if (unmatchedAdvisors.length) issues.push(`Centers not matched between monthly and advisor data: ${unmatchedAdvisors.join(', ')}.`);
  const cutoffMonth = data.advisorCutoff.slice(0, 7);
  const cutoffDate = new Date(`${data.advisorCutoff}T00:00:00Z`);
  const nextDay = new Date(cutoffDate.valueOf() + 86400000);
  if (nextDay.getUTCDate() !== 1) issues.push('Advisor cutoff is not month-end; monthly and advisor totals cannot be reconciled.');
  else for (const center of [...monthlyCenters].filter(c => advisorCenters.has(c))) {
    const monthly = data.monthly.filter(r => r.center === center && r.month.slice(0, 4) === cutoffMonth.slice(0, 4) && r.month <= cutoffMonth);
    if (!covered(monthly, [center], cutoffMonth)) {
      issues.push(`${center}: monthly coverage is incomplete through the advisor cutoff; reconciliation unavailable.`);
      continue;
    }
    const advisors = data.advisors.filter(r => r.center === center);
    for (const m of measures.filter(m => m.key !== 'revenue')) {
      const difference = sum(monthly, m.key) - sum(advisors, m.key);
      if (Math.abs(difference) > 0.001) issues.push(`${center}: monthly and advisor YTD ${m.label.toLowerCase()} differ by ${formatValue(Math.abs(difference), m.key)} through ${data.advisorCutoff}.`);
    }
  }
  return issues;
}

export function revenueDifferences(data) {
  const cutoffMonth = data.advisorCutoff.slice(0, 7);
  const cutoff = new Date(`${data.advisorCutoff}T00:00:00Z`);
  if (new Date(cutoff.valueOf() + 86400000).getUTCDate() !== 1) return [];
  const centers = [...new Set(data.advisors.map(r => r.center))];
  return centers.flatMap(center => {
    const monthly = data.monthly.filter(r => r.center === center && r.month.slice(0, 4) === cutoffMonth.slice(0, 4) && r.month <= cutoffMonth);
    if (!covered(monthly, [center], cutoffMonth)) return [];
    const recorded = sum(monthly, 'revenue');
    const engagement = sum(data.advisors.filter(r => r.center === center), 'revenue');
    if (Math.abs(recorded - engagement) <= 0.001) return [];
    return [{ center, recorded, engagement }];
  });
}

export function formatValue(value, key) {
  if (key === 'revenue') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value);
}

export function formatMonth(value) {
  const [year, month] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1)));
}
