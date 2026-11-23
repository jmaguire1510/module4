import { loadData } from '../../data.js';

export default async function performance(request) {
  const headers = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8' };
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...headers, Allow: 'GET' } });
  }
  try {
    return new Response(JSON.stringify(await loadData()), { headers });
  } catch (error) {
    console.error('Source refresh failed:', error);
    return new Response(JSON.stringify({ error: `Unable to load source data: ${error.message}` }), { status: 502, headers });
  }
}

export const config = { path: '/api/performance' };
