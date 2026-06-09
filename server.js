const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const PORT = process.env.PORT || 3000;

// load .env if present — simple key=value parser, no dependencies needed
try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8')
    .split('\n')
    .forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx < 1) return;
      const k = trimmed.slice(0, eqIdx).trim();
      const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (k && !(k in process.env)) process.env[k] = v;
    });
} catch (_) { /* no .env file — that's fine */ }

// key lives here in server memory only — never sent to the browser
let apiKey  = process.env.ELEVENLABS_API_KEY || '';
const VOICE_ID = process.env.VOICE_ID || 'JVVJ6VsnUPJAdfGmEBGP';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.svg':  'image/svg+xml',
};

const server = http.createServer((req, res) => {
  if (req.method === 'GET'  && req.url === '/api/key-status') return handleKeyStatus(req, res);
  if (req.method === 'POST' && req.url === '/api/save-key')   return handleSaveKey(req, res);
  if (req.method === 'POST' && req.url === '/api/tts')        return handleTts(req, res);
  serveStatic(req, res);
});

// tells the browser whether a key is already loaded — never returns the key itself
function handleKeyStatus(_req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ configured: apiKey.length > 0 }));
}

// browser posts key once; we hold it in memory, it never comes back
function handleSaveKey(req, res) {
  readBody(req, (err, raw) => {
    if (err) return badRequest(res, 'read error');
    try {
      const { key } = JSON.parse(raw);
      if (!key || typeof key !== 'string') return badRequest(res, 'missing key');
      apiKey = key.trim();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (_) { badRequest(res, 'invalid JSON'); }
  });
}

// browser sends only {text} — no key in the request at all
function handleTts(req, res) {
  if (!apiKey) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'no API key configured' }));
  }

  readBody(req, (err, raw) => {
    if (err) return badRequest(res, 'read error');
    let text;
    try {
      ({ text } = JSON.parse(raw));
    } catch (_) { return badRequest(res, 'invalid JSON'); }

    if (!text || typeof text !== 'string') return badRequest(res, 'missing text');

    const payload = JSON.stringify({
      text,
      model_id:       'eleven_turbo_v2_5',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    });

    const options = {
      hostname: 'api.elevenlabs.io',
      path:     `/v1/text-to-speech/${encodeURIComponent(VOICE_ID)}`,
      method:   'POST',
      headers: {
        'xi-api-key':     apiKey,
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Accept':         'audio/mpeg',
      },
    };

    const proxyReq = https.request(options, proxyRes => {
      const ct = proxyRes.headers['content-type'] || 'audio/mpeg';
      res.writeHead(proxyRes.statusCode, { 'Content-Type': ct });
      proxyRes.pipe(res);
    });

    proxyReq.on('error', err => {
      console.error('ElevenLabs proxy error:', err.message);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'upstream error' }));
      }
    });

    proxyReq.write(payload);
    proxyReq.end();
  });
}

function serveStatic(req, res) {
  const safePath = req.url.split('?')[0];
  const filePath = path.join(__dirname, safePath === '/' ? 'index.html' : safePath);

  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500);
      return res.end(err.code === 'ENOENT' ? 'Not found' : 'Server error');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

// ── helpers ──────────────────────────────────────────────────────────────────

function readBody(req, cb) {
  let raw = '';
  req.on('data', chunk => { raw += chunk; });
  req.on('end',  () => cb(null, raw));
  req.on('error', cb);
}

function badRequest(res, msg) {
  res.writeHead(400, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: msg }));
}

server.listen(PORT, () =>
  console.log(`✨ pookie facts running at http://localhost:${PORT}`)
);
