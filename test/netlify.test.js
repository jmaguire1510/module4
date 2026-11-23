import test from 'node:test';
import assert from 'node:assert/strict';
import performance, { config } from '../netlify/functions/performance.mjs';

test('Netlify endpoint refreshes worksheet values and reports source errors', async t => {
  let completed = '80';
  let fail = false;
  t.mock.method(globalThis, 'fetch', async url => {
    if (fail) return new Response('Unavailable', { status: 503 });
    const params = new URL(url).searchParams;
    let csv;
    if (params.get('gid')) {
      csv = 'Market,Month,Requests Received,Requests Completed,Average Resolution Time (Hours),Client Satisfaction (%),SLA Met (%),Repeat Issues\nExample,,100,80,30,90,90,1';
    } else if (params.get('range') === 'A1:A2') {
      csv = '"Year-to-date figures through 1/31/2026."';
    } else if (params.get('sheet') === 'Coordinator Activity') {
      csv = `Market,Workplace Coordinator,Requests Assigned (YTD),Requests Completed (YTD),Requests Completed (FY Goal),Completed Within SLA (YTD),Site Visits (YTD),Site Visits (FY Goal),Average Resolution Time (Hours),Client Satisfaction (%),SLA Target (%),Satisfaction Target (%)\nExample,Person,100,${completed},120,70,8,12,30,90,90,92`;
    } else {
      csv = 'Market,Completed Requests (FY Goal),Site Visits (FY Goal),Completion Rate Target (%),Average Resolution Target (Hours),Client Satisfaction Target (%),SLA Compliance Target (%),Maximum Repeat Issue Rate (%)\nExample,120,12,92,36,92,90,8';
    }
    return new Response(csv, { headers: { 'Content-Type': 'text/csv' } });
  });
  assert.equal(config.path, '/api/performance');
  const request = new Request('https://example.test/api/performance');
  let response = await performance(request);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal((await response.json()).coordinators[0].completed, 80);
  completed = '90';
  response = await performance(request);
  assert.equal((await response.json()).coordinators[0].completed, 90);
  assert.equal((await performance(new Request(request, { method: 'POST' }))).status, 405);
  fail = true;
  t.mock.method(console, 'error', () => {});
  response = await performance(request);
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /HTTP 503/);
});
