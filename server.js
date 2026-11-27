'use strict';

/**
 * Local development server for ShebaKhoj.
 *
 * Vercel does NOT run this file — it uses the serverless functions in /api.
 * Locally, `node server.js` serves public/ and dispatches /api/* to the very
 * same handlers, so development and production behave identically.
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { searchHandler, providersHandler, getApiKey } = require('./lib/handlers');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const PUBLIC_DIR = path.join(__dirname, 'public');

// ---------------------------------------------------------------------------
// Optional .env loading, LOCAL ONLY.
// On Vercel, GEMINI_API_KEY comes from the project's Environment Variables.
// ---------------------------------------------------------------------------
function loadEnvFile() {
  const file = path.join(__dirname, '.env');
  if (!fs.existsSync(file)) return;
  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch {
    return;
  }
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Real environment variables take priority over the file.
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvFile();

// ---------------------------------------------------------------------------
// Static files
// ---------------------------------------------------------------------------
const STATIC_FILES = new Map([
  ['/', { file: 'index.html', type: 'text/html; charset=utf-8' }],
  ['/index.html', { file: 'index.html', type: 'text/html; charset=utf-8' }],
  ['/styles.css', { file: 'styles.css', type: 'text/css; charset=utf-8' }],
  ['/app.js', { file: 'app.js', type: 'application/javascript; charset=utf-8' }],
  ['/favicon.svg', { file: 'favicon.svg', type: 'image/svg+xml' }],
]);

function send(res, status, body, type) {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy':
      "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; form-action 'self'",
  });
  res.end(body);
}

function serveStatic(res, name, type) {
  fs.readFile(path.join(PUBLIC_DIR, name), (err, data) => {
    if (err) return send(res, 404, 'পাতা পাওয়া যায়নি (404)', 'text/plain; charset=utf-8');
    return send(res, 200, data, type);
  });
}

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = new URL(req.url, 'http://' + (req.headers.host || 'localhost')).pathname;
  } catch {
    return send(res, 400, 'অবৈধ অনুরোধ।', 'text/plain; charset=utf-8');
  }

  if (req.method === 'GET' && STATIC_FILES.has(pathname)) {
    const entry = STATIC_FILES.get(pathname);
    return serveStatic(res, entry.file, entry.type);
  }

  if (pathname === '/api/providers') return providersHandler(req, res);
  if (pathname === '/api/search') return searchHandler(req, res);

  return send(res, 404, 'পাতা পাওয়া যায়নি (404)', 'text/plain; charset=utf-8');
});

server.listen(PORT, HOST, () => {
  console.log('সেবাখোঁজ (local) চলছে: http://' + HOST + ':' + PORT);
  console.log(
    getApiKey()
      ? 'Gemini API: key configured (AI mode)'
      : 'Gemini API: key not configured (demo mode)'
  );
});
