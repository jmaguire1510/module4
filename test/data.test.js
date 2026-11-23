import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCSV, normalizeSources } from '../data.js';
import { calculate, qualityIssues, ratio, slaCard, slaTargetComparison } from '../public/service-metrics.js';

const sources = {
  monthlyCSV: 'Market,Month,Requests Received,Requests Completed,Average Resolution Time (Hours),Client Satisfaction (%),SLA Met (%),Repeat Issues\nMinneapolis,,10,8,30,,90,1\n',
  coordinatorCSV: 'Market,Workplace Coordinator,Requests Assigned (YTD),Requests Completed (YTD),Requests Completed (FY Goal),Completed Within SLA (YTD),Site Visits (YTD),Site Visits (FY Goal),Average Resolution Time (Hours),Client Satisfaction (%),SLA Target (%),Satisfaction Target (%)\nMinneapolis,Person,100,80,120,72,8,12,30,90,90,92\nMinneapolis,Other,10,10,20,10,2,3,32,93,90,92\n',
  goalsCSV: 'Market,Completed Requests (FY Goal),Site Visits (FY Goal),Completion Rate Target (%),Average Resolution Target (Hours),Client Satisfaction Target (%),SLA Compliance Target (%),Maximum Repeat Issue Rate (%)\nMpls.,140,15,92,36,92,90,8\nTOTAL,140,15,92,36,92,90,8\n',
  coordinatorNotes: '"Year-to-date figures through 1/31/2026."'
};

test('CSV parser handles quoted values and rejects malformed quotes', () => {
  assert.deepEqual(parseCSV('"a,b","x""y"\r\n1,2'), [['a,b', 'x"y'], ['1', '2']]);
  assert.throws(() => parseCSV('"unclosed'), /Unterminated/);
});

test('undated records remain undated and the observed market alias joins goals', () => {
  const data = normalizeSources(sources);
  assert.equal(data.monthly[0].month, null);
  assert.equal(data.goals[0].market, 'Minneapolis');
  assert.ok(qualityIssues(data).some(i => i.includes('no month')));
  assert.ok(qualityIssues(data).some(i => i.includes('satisfaction')));
});

test('SLA is the weighted share of completed requests, not assigned requests or an average of coordinator rates', () => {
  const view = calculate(normalizeSources(sources), 'all');
  assert.equal(view.sla, 100 * 82 / 90);
  assert.equal(view.slaTarget, 90);
  assert.notEqual(view.slaTarget, 92);
  assert.equal(view.targets.completed, 140);
  assert.equal(ratio(0, 0), null);
});

test('SLA comparison reports percentage-point direction without rounding away near-target differences', () => {
  assert.equal(slaTargetComparison(100 * 3230 / 3466, 90), '3.2 percentage points above SLA target');
  assert.equal(slaTargetComparison(100 * 603 / 657, 90), '1.8 percentage points above SLA target');
  assert.equal(slaTargetComparison(85, 90), '5.0 percentage points below SLA target');
  assert.equal(slaTargetComparison(90, 90), 'At SLA target (0.0 percentage points)');
  assert.equal(slaTargetComparison(89.96, 90), 'Less than 0.1 percentage points below SLA target');
  assert.equal(slaTargetComparison(90.04, 90), 'Less than 0.1 percentage points above SLA target');
});

test('SLA comparison is unavailable without a denominator or applicable target', () => {
  const data = normalizeSources(sources);
  for (const coordinator of data.coordinators) {
    coordinator.completed = 0;
    coordinator.withinSla = 0;
  }
  let view = calculate(data, 'all');
  assert.equal(slaTargetComparison(view.sla, view.slaTarget), 'Target comparison: Unavailable');
  assert.equal(slaCard(view, data.coordinatorCutoff).value, 'Unavailable');
  data.coordinators[0].completed = 80;
  data.coordinators[0].withinSla = 72;
  data.goals[0].sla = null;
  view = calculate(data, 'all');
  assert.equal(slaTargetComparison(view.sla, view.slaTarget), 'Target comparison: Unavailable');
  data.coordinatorCutoff = '2027-01-31';
  assert.equal(slaTargetComparison(calculate(data, 'all').sla, calculate(data, 'all').slaTarget), 'Target comparison: Unavailable');
});

test('a blank coordinator completed count suppresses only affected totals and SLA cards', () => {
  const data = normalizeSources({ ...sources, coordinatorCSV: sources.coordinatorCSV.replace('100,80,120,72', '100,,120,72') });
  assert.equal(data.coordinators[0].completed, null);
  const view = calculate(data, 'Minneapolis');
  assert.equal(view.totals.completed, null);
  assert.equal(view.sla, null);
  assert.deepEqual(slaCard(view, data.coordinatorCutoff), {
    label: 'Completed within SLA',
    value: 'Unavailable',
    detail: 'Completed requests unavailable · 90% SLA target',
    comparison: 'Target comparison: Unavailable',
    cutoff: 'YTD through 2026-01-31'
  });
  assert.ok(qualityIssues(data).some(issue => issue.includes('Person (Minneapolis)') && issue.includes('missing')));
  data.coordinators.push({ ...data.coordinators[1], market: 'Chicago', name: 'Other market' });
  data.goals.push({ ...data.goals[0], market: 'Chicago' });
  assert.equal(calculate(data, 'Chicago').totals.completed, 10);
  assert.equal(calculate(data, 'Chicago').sla, 100);
  assert.equal(calculate(data, 'all').sla, null);
});

test('a missing SLA target retains the rate but withholds target comparison', () => {
  const data = normalizeSources(sources);
  data.goals[0].sla = null;
  const card = slaCard(calculate(data, 'Minneapolis'), data.coordinatorCutoff);
  assert.equal(card.value, '91.1%');
  assert.equal(card.detail, '82 of 90 completed · target unavailable');
  assert.equal(card.comparison, 'Target comparison: Unavailable');
});

test('different market SLA targets do not produce an aggregate comparison', () => {
  const data = normalizeSources(sources);
  data.coordinators.push({ ...data.coordinators[1], market: 'Chicago', name: 'Other market' });
  data.goals.push({ ...data.goals[0], market: 'Chicago', sla: 95 });
  const card = slaCard(calculate(data, 'all'), data.coordinatorCutoff);
  assert.equal(card.value, '92.0%');
  assert.equal(card.comparison, 'Target comparison: Unavailable');
});

test('invalid input and duplicate dated records are rejected', () => {
  assert.throws(() => normalizeSources({ ...sources, monthlyCSV: `${sources.monthlyCSV.replace('Minneapolis,,', 'Minneapolis,Jan 2026,')}Minneapolis,Jan 2026,10,8,30,90,90,1\n` }), /duplicate/);
  assert.throws(() => normalizeSources({ ...sources, coordinatorNotes: 'through 2/30/2026' }), /invalid YTD cutoff/);
  assert.throws(() => normalizeSources({ ...sources, goalsCSV: sources.goalsCSV.replace('Market', 'Location') }), /columns have changed/);
  assert.throws(() => normalizeSources({ ...sources, coordinatorCSV: sources.coordinatorCSV.replace('100,80,120,72', '100,80,120,81') }), /exceeds completed/);
});

test('missing market coverage is withheld and 2026 goals are not used in another year', () => {
  const data = normalizeSources(sources);
  data.goals.push({ ...data.goals[0], market: 'Unmatched' });
  assert.equal(calculate(data, 'all').complete, false);
  assert.equal(calculate(data, 'all').sla, null);
  data.coordinatorCutoff = '2027-01-31';
  assert.equal(calculate(data, 'Minneapolis').goalsAvailable, false);
});

test('valid dated months are parsed without assigning dates to blank rows', () => {
  const data = normalizeSources({ ...sources, monthlyCSV: `${sources.monthlyCSV}Minneapolis,2026-02-01,10,8,30,90,90,1\nMinneapolis,3/1/2026,10,8,30,90,90,1\n` });
  assert.equal(data.monthly[0].month, null);
  assert.equal(data.monthly[1].month, '2026-02');
  assert.equal(data.monthly[2].month, '2026-03');
  assert.throws(() => normalizeSources({ ...sources, monthlyCSV: sources.monthlyCSV.replace('Minneapolis,,', 'Minneapolis,2/30/2026,') }), /invalid month/);
});
