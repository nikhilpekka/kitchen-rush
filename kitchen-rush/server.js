const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const clients = new Map();
const streams = new Set();
let nextSlot = 0;

function lanAddress() {
  for (const list of Object.values(os.networkInterfaces())) {
    for (const item of list || []) {
      if (item.family === 'IPv4' && !item.internal) return item.address;
    }
  }
  return 'localhost';
}
function send(res, status, type, body) {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(body);
}
function broadcast(client) {
  const message = `data: ${JSON.stringify({ id: client.id, slot: client.slot, ...client.input })}\n\n`;
  for (const res of streams) res.write(message);
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > 8192) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'GET' && url.pathname === '/info') {
    return send(res, 200, 'application/json; charset=utf-8', JSON.stringify({ ip: lanAddress(), port: PORT }));
  }
  if (req.method === 'GET' && url.pathname === '/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write(': connected\n\n');
    streams.add(res);
    for (const client of clients.values()) res.write(`data: ${JSON.stringify({ id: client.id, slot: client.slot, ...client.input })}\n\n`);
    req.on('close', () => streams.delete(res));
    return;
  }
  if (req.method === 'POST' && url.pathname === '/input') {
    try {
      const body = await readJson(req);
      const id = String(body.id || '');
      if (!/^[a-zA-Z0-9_-]{1,48}$/.test(id)) return send(res, 400, 'application/json', '{"error":"Invalid controller ID"}');
      let client = clients.get(id);
      if (!client) {
        if (clients.size >= 6) return send(res, 429, 'application/json', '{"error":"Lobby is full (maximum 6 phone controllers)"}');
        client = { id, slot: nextSlot++ % 8, input: { dx: 0, dy: 0, a: 0, b: 0, c: 0 }, lastSeen: Date.now() };
        clients.set(id, client);
      }
      client.lastSeen = Date.now();
      client.input = {
        dx: Math.max(-1, Math.min(1, Number(body.dx) || 0)),
        dy: Math.max(-1, Math.min(1, Number(body.dy) || 0)),
        a: body.a ? 1 : 0, b: body.b ? 1 : 0, c: body.c ? 1 : 0
      };
      broadcast(client);
      return send(res, 200, 'application/json; charset=utf-8', JSON.stringify({ ok: true, slot: client.slot }));
    } catch {
      return send(res, 400, 'application/json; charset=utf-8', '{"error":"Invalid JSON"}');
    }
  }
  if (req.method === 'GET' && url.pathname === '/pad') {
    return send(res, 200, 'text/html; charset=utf-8', fs.readFileSync(path.join(ROOT, 'pad.html'), 'utf8'));
  }
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    return send(res, 200, 'text/html; charset=utf-8', fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'));
  }
  if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, 'application/json', '{"ok":true}');
  return send(res, 404, 'text/plain; charset=utf-8', 'Not found');
});

setInterval(() => {
  const cutoff = Date.now() - 12000;
  for (const [id, client] of clients) {
    if (client.lastSeen < cutoff) {
      clients.delete(id);
      client.input = { dx: 0, dy: 0, a: 0, b: 0, c: 0 };
      broadcast(client);
    }
  }
}, 5000).unref();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Kitchen Rush is running at http://localhost:${PORT}`);
  console.log(`Phone controllers: http://${lanAddress()}:${PORT}/pad (same Wi-Fi)`);
});
