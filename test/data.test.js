import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCSV, normalizeSources } from '../data.js';
import { calculate, qualityIssues, ratio } from '../public/service-metrics.js';

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
