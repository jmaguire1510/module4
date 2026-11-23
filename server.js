import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { loadData } from './data.js';

const port = Number(process.env.PORT || 3000);
const files = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
  '/service-app.js': ['service-app.js', 'text/javascript; charset=utf-8'],
  '/service-metrics.js': ['service-metrics.js', 'text/javascript; charset=utf-8']
};
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'");
  if (req.method !== 'GET') { res.writeHead(405, { Allow: 'GET' }); res.end(); return; }
  const path = new URL(req.url, 'http://localhost').pathname;
  if (path === '/api/performance') {
    res.setHeader('Cache-Control', 'no-store');
    try {
      const data = await loadData();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(data));
    } catch (error) {
      console.error('Source refresh failed:', error);
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: `Unable to load source data: ${error.message}` }));
    }
    return;
  }
  const file = files[path];
  if (!file) { res.writeHead(404); res.end('Not found'); return; }
  try {
    const content = await readFile(new URL(`./public/${file[0]}`, import.meta.url));
    res.writeHead(200, { 'Content-Type': file[1] }); res.end(content);
  } catch (error) {
    console.error('Static file error:', error);
    res.writeHead(500); res.end('Unable to load application');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Morrowlane service monitor available at http://127.0.0.1:${port}`));
