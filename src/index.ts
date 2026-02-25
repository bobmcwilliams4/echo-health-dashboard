import { Hono } from 'hono';
import { cors } from 'hono/cors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  PHOENIX_SVC: Fetcher;
  ENVIRONMENT: string;
  ECHO_API_KEY?: string;
}

interface WorkerDef {
  name: string;
  url: string;
  category: string;
}

interface WorkerStatus {
  name: string;
  url: string;
  category: string;
  status: 'up' | 'down' | 'slow';
  statusCode: number;
  responseMs: number;
  error: string | null;
  checkedAt: string;
}

// ---------------------------------------------------------------------------
// Worker registry -- all 33 ECHO OMEGA PRIME workers
// ---------------------------------------------------------------------------

const WORKERS: WorkerDef[] = [
  // Core
  { name: 'echo-shared-brain',        url: 'https://echo-shared-brain.bmcii1976.workers.dev',        category: 'Core' },
  { name: 'echo-memory-prime',        url: 'https://echo-memory-prime.bmcii1976.workers.dev',        category: 'Core' },
  { name: 'omniscient-sync',          url: 'https://omniscient-sync.bmcii1976.workers.dev',          category: 'Core' },
  { name: 'echo-build-orchestrator',  url: 'https://echo-build-orchestrator.bmcii1976.workers.dev',  category: 'Core' },
  { name: 'echo-engine-runtime',      url: 'https://echo-engine-runtime.bmcii1976.workers.dev',      category: 'Core' },

  // Scrapers
  { name: 'shadowglass-v8-warpspeed', url: 'https://shadowglass-v8-warpspeed.bmcii1976.workers.dev', category: 'Scrapers' },
  { name: 'encore-cloud-scraper',     url: 'https://encore-cloud-scraper.bmcii1976.workers.dev',     category: 'Scrapers' },
  { name: 'echo-knowledge-scout',     url: 'https://echo-knowledge-scout.bmcii1976.workers.dev',     category: 'Scrapers' },

  // AI
  { name: 'echo-chat',                url: 'https://echo-chat.bmcii1976.workers.dev',                category: 'AI' },
  { name: 'echo-swarm-brain',         url: 'https://echo-swarm-brain.bmcii1976.workers.dev',         category: 'AI' },
  { name: 'echo-ai-orchestrator',     url: 'https://echo-ai-orchestrator.bmcii1976.workers.dev',     category: 'AI' },
  { name: 'echo-agent-coordinator',   url: 'https://echo-agent-coordinator.bmcii1976.workers.dev',   category: 'AI' },
  { name: 'echo-a2a-protocol',        url: 'https://echo-a2a-protocol.bmcii1976.workers.dev',        category: 'AI' },

  // Data
  { name: 'echo-graph-rag',           url: 'https://echo-graph-rag.bmcii1976.workers.dev',           category: 'Data' },
  { name: 'echo-knowledge-forge',     url: 'https://echo-knowledge-forge.bmcii1976.workers.dev',     category: 'Data' },
  { name: 'echo-ekm-archive',         url: 'https://echo-ekm-archive.bmcii1976.workers.dev',         category: 'Data' },

  // Infrastructure
  { name: 'echo-relay',               url: 'https://echo-relay.bmcii1976.workers.dev',               category: 'Infrastructure' },
  { name: 'echo-gs343-cloud',         url: 'https://echo-gs343-cloud.bmcii1976.workers.dev',         category: 'Infrastructure' },
  { name: 'echo-phoenix-cloud',       url: 'https://echo-phoenix-cloud.bmcii1976.workers.dev',       category: 'Infrastructure' },
  { name: 'echo-mega-gateway-cloud',  url: 'https://echo-mega-gateway-cloud.bmcii1976.workers.dev',  category: 'Infrastructure' },
  { name: 'echo-security-sandbox',    url: 'https://echo-security-sandbox.bmcii1976.workers.dev',    category: 'Infrastructure' },

  // Sites
  { name: 'profinish-api',            url: 'https://profinish-api.bmcii1976.workers.dev',            category: 'Sites' },
  { name: 'billymc-api',              url: 'https://billymc-api.bmcii1976.workers.dev',              category: 'Sites' },
  { name: 'echo-tax-return',          url: 'https://echo-tax-return.bmcii1976.workers.dev',          category: 'Sites' },
  { name: 'echo-domain-harvester',    url: 'https://echo-domain-harvester.bmcii1976.workers.dev',    category: 'Sites' },

  // Cognition
  { name: 'echo-ekm-query',           url: 'https://echo-ekm-query.bmcii1976.workers.dev',           category: 'Cognition' },
  { name: 'echo-crystal-memory',      url: 'https://echo-crystal-memory.bmcii1976.workers.dev',      category: 'Cognition' },
  { name: 'echo-embedding',           url: 'https://echo-embedding.bmcii1976.workers.dev',           category: 'Cognition' },
  { name: 'echo-talk',                url: 'https://echo-talk.bmcii1976.workers.dev',                category: 'Cognition' },
  { name: 'echo-graph-query',         url: 'https://echo-graph-query.bmcii1976.workers.dev',         category: 'Cognition' },
  { name: 'echo-memory-orchestrator', url: 'https://echo-memory-orchestrator.bmcii1976.workers.dev', category: 'Cognition' },
  { name: 'echo-engine-matrix',       url: 'https://echo-engine-matrix.bmcii1976.workers.dev',       category: 'Cognition' },
  { name: 'forge-x-cloud',            url: 'https://forge-x-cloud.bmcii1976.workers.dev',            category: 'Cognition' },
];

// ---------------------------------------------------------------------------
// Category metadata
// ---------------------------------------------------------------------------

const CATEGORY_ICONS: Record<string, string> = {
  Core:           '&#x1F9E0;',
  Scrapers:       '&#x1F577;',
  AI:             '&#x1F916;',
  Data:           '&#x1F4CA;',
  Infrastructure: '&#x2699;',
  Sites:          '&#x1F310;',
  Cognition:      '&#x1F52C;',
};

const CATEGORY_ORDER = ['Core', 'AI', 'Data', 'Scrapers', 'Cognition', 'Infrastructure', 'Sites'];

// ---------------------------------------------------------------------------
// Hono app
// ---------------------------------------------------------------------------

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

function requireAuth(c: any): boolean {
  const key = c.req.header('X-Echo-API-Key') || '';
  const expected = c.env.ECHO_API_KEY || 'echo-omega-prime-health-2026';
  return key === expected;
}

// ---------------------------------------------------------------------------
// GET /health -- self health
// ---------------------------------------------------------------------------

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'echo-health-dashboard',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    workers_monitored: WORKERS.length,
  });
});

// ---------------------------------------------------------------------------
// POST /init-schema
// ---------------------------------------------------------------------------

app.post('/init-schema', async (c) => {
  if (!requireAuth(c)) return c.json({ error: 'Unauthorized' }, 401);
  try {
    await c.env.DB.exec(`
      CREATE TABLE IF NOT EXISTS snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        snapshot_type TEXT NOT NULL,
        data TEXT NOT NULL,
        workers_total INTEGER DEFAULT 0,
        workers_online INTEGER DEFAULT 0,
        workers_offline INTEGER DEFAULT 0,
        avg_response_ms INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_snapshots_type ON snapshots(snapshot_type);
      CREATE INDEX IF NOT EXISTS idx_snapshots_time ON snapshots(created_at);

      CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_type TEXT NOT NULL,
        severity TEXT DEFAULT 'medium',
        message TEXT NOT NULL,
        worker_name TEXT,
        acknowledged INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
      CREATE INDEX IF NOT EXISTS idx_alerts_ack ON alerts(acknowledged);
    `);
    return c.json({ ok: true, message: 'Schema initialized' });
  } catch (e: any) {
    return c.json({ ok: false, error: e.message }, 500);
  }
});

// ---------------------------------------------------------------------------
// GET /api/workers -- returns the worker registry for client-side checking
// ---------------------------------------------------------------------------

app.get('/api/workers', (c) => {
  return c.json({ workers: WORKERS, total: WORKERS.length });
});

// ---------------------------------------------------------------------------
// GET /api/status -- returns latest cached status (populated by client reports)
// ---------------------------------------------------------------------------

app.get('/api/status', async (c) => {
  const cached = await c.env.CACHE.get('status:latest', 'json');
  if (cached) return c.json(cached);
  // No cached status yet -- return the registry so the client can start checking
  return c.json({
    total: WORKERS.length,
    online: 0,
    slow: 0,
    offline: 0,
    avgMs: 0,
    checkedAt: null,
    workers: WORKERS.map(w => ({
      name: w.name,
      url: w.url,
      category: w.category,
      status: 'unknown' as any,
      statusCode: 0,
      responseMs: 0,
      error: null,
      checkedAt: null,
    })),
  });
});

// ---------------------------------------------------------------------------
// POST /api/report -- browser sends check results, we cache + optionally store
// ---------------------------------------------------------------------------

app.post('/api/report', async (c) => {
  try {
    const body = await c.req.json();
    const results: WorkerStatus[] = body.workers || [];
    if (results.length === 0) return c.json({ ok: false, error: 'No workers in report' }, 400);

    const online = results.filter(r => r.status === 'up').length;
    const offline = results.filter(r => r.status === 'down').length;
    const slow = results.filter(r => r.status === 'slow').length;
    const avgMs = Math.round(results.reduce((s, r) => s + r.responseMs, 0) / results.length);

    const payload = {
      total: results.length,
      online,
      slow,
      offline,
      avgMs,
      checkedAt: new Date().toISOString(),
      workers: results,
    };

    // Cache for 60s
    await c.env.CACHE.put('status:latest', JSON.stringify(payload), { expirationTtl: 60 });

    return c.json({ ok: true, online, offline, slow, avgMs });
  } catch (e: any) {
    return c.json({ ok: false, error: e.message }, 500);
  }
});

// ---------------------------------------------------------------------------
// POST /api/check -- store a snapshot + alerts from the latest report
// ---------------------------------------------------------------------------

app.post('/api/check', async (c) => {
  if (!requireAuth(c)) return c.json({ error: 'Unauthorized' }, 401);

  const cached = await c.env.CACHE.get('status:latest', 'json') as any;
  if (!cached || !cached.workers) {
    return c.json({ error: 'No status data available. Load the dashboard first to collect data.' }, 400);
  }

  const results: WorkerStatus[] = cached.workers;
  const online = cached.online;
  const offline = cached.offline;
  const avgMs = cached.avgMs;

  // Store snapshot
  await c.env.DB.prepare(
    `INSERT INTO snapshots (snapshot_type, data, workers_total, workers_online, workers_offline, avg_response_ms)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind('full_check', JSON.stringify(results), results.length, online, offline, avgMs).run();

  // Create alerts for down workers
  for (const r of results) {
    if (r.status === 'down') {
      await c.env.DB.prepare(
        `INSERT INTO alerts (alert_type, severity, message, worker_name)
         VALUES (?, ?, ?, ?)`
      ).bind('worker_down', 'high', `${r.name} is DOWN: ${r.error}`, r.name).run();
    } else if (r.status === 'slow') {
      await c.env.DB.prepare(
        `INSERT INTO alerts (alert_type, severity, message, worker_name)
         VALUES (?, ?, ?, ?)`
      ).bind('worker_slow', 'medium', `${r.name} slow response: ${r.responseMs}ms`, r.name).run();
    }
  }

  return c.json({ ok: true, total: results.length, online, offline, avgMs });
});

// ---------------------------------------------------------------------------
// GET /api/snapshots
// ---------------------------------------------------------------------------

app.get('/api/snapshots', async (c) => {
  const limit = parseInt(c.req.query('limit') || '50');
  const rows = await c.env.DB.prepare(
    `SELECT id, snapshot_type, workers_total, workers_online, workers_offline, avg_response_ms, created_at
     FROM snapshots ORDER BY id DESC LIMIT ?`
  ).bind(limit).all();
  return c.json({ snapshots: rows.results });
});

// ---------------------------------------------------------------------------
// GET /api/alerts
// ---------------------------------------------------------------------------

app.get('/api/alerts', async (c) => {
  const ack = c.req.query('acknowledged');
  let sql = 'SELECT * FROM alerts';
  const params: any[] = [];
  if (ack !== undefined) {
    sql += ' WHERE acknowledged = ?';
    params.push(ack === 'true' ? 1 : 0);
  }
  sql += ' ORDER BY id DESC LIMIT 200';
  const rows = params.length > 0
    ? await c.env.DB.prepare(sql).bind(...params).all()
    : await c.env.DB.prepare(sql).all();
  return c.json({ alerts: rows.results });
});

// ---------------------------------------------------------------------------
// POST /api/alerts/:id/ack
// ---------------------------------------------------------------------------

app.post('/api/alerts/:id/ack', async (c) => {
  if (!requireAuth(c)) return c.json({ error: 'Unauthorized' }, 401);
  const id = c.req.param('id');
  await c.env.DB.prepare('UPDATE alerts SET acknowledged = 1 WHERE id = ?').bind(id).run();
  return c.json({ ok: true, id });
});

// ---------------------------------------------------------------------------
// GET / -- Full HTML dashboard
// ---------------------------------------------------------------------------

app.get('/', (c) => {
  const html = buildDashboardHTML();
  return c.html(html);
});

// ---------------------------------------------------------------------------
// HTML builder
// ---------------------------------------------------------------------------

function buildDashboardHTML(): string {
  const categoryHTML = CATEGORY_ORDER.map(cat => {
    const icon = CATEGORY_ICONS[cat] || '';
    const workers = WORKERS.filter(w => w.category === cat);
    const cards = workers.map(w => {
      const shortName = w.name.replace(/^echo-/, '');
      return `<div class="card" data-worker="${w.name}">
        <div class="card-header">
          <span class="status-dot loading" data-dot="${w.name}"></span>
          <span class="card-name">${shortName}</span>
        </div>
        <div class="card-meta">
          <span class="response-time" data-ms="${w.name}">--</span>
          <span class="check-time" data-time="${w.name}">Checking...</span>
        </div>
        <div class="card-url">${w.url.replace('https://', '')}</div>
      </div>`;
    }).join('\n');

    return `<div class="category-section">
      <h2 class="category-title">${icon} ${cat} <span class="category-count" data-cat-count="${cat}">(${workers.length})</span></h2>
      <div class="card-grid">${cards}</div>
    </div>`;
  }).join('\n');

  const workersJSON = JSON.stringify(WORKERS);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ECHO OMEGA PRIME | System Health</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0d1117;
    --surface: #161b22;
    --surface-hover: #1c2333;
    --border: #30363d;
    --text: #e6edf3;
    --text-dim: #8b949e;
    --text-bright: #ffffff;
    --green: #3fb950;
    --green-dim: rgba(63, 185, 80, 0.15);
    --red: #f85149;
    --red-dim: rgba(248, 81, 73, 0.15);
    --yellow: #d29922;
    --yellow-dim: rgba(210, 153, 34, 0.15);
    --blue: #58a6ff;
    --blue-dim: rgba(88, 166, 255, 0.08);
    --purple: #bc8cff;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    line-height: 1.5;
    min-height: 100vh;
  }

  .header {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 16px 24px;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-inner {
    max-width: 1440px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }

  .header-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-bright);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .header-title .logo-text {
    background: linear-gradient(135deg, var(--blue), var(--purple));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .header-stats {
    display: flex;
    gap: 16px;
    align-items: center;
    flex-wrap: wrap;
  }

  .stat-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
  }

  .stat-pill.online  { background: var(--green-dim);  color: var(--green); }
  .stat-pill.offline { background: var(--red-dim);    color: var(--red); }
  .stat-pill.slow    { background: var(--yellow-dim); color: var(--yellow); }
  .stat-pill.latency { background: var(--blue-dim);   color: var(--blue); }

  .last-check {
    font-size: 12px;
    color: var(--text-dim);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .refresh-indicator {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--green);
    animation: pulse-green 2s ease-in-out infinite;
  }

  .alerts-bar {
    max-width: 1440px;
    margin: 12px auto 0;
    padding: 0 24px;
    display: none;
  }

  .alerts-bar.visible { display: block; }

  .alert-banner {
    background: var(--red-dim);
    border: 1px solid rgba(248, 81, 73, 0.4);
    border-radius: 8px;
    padding: 10px 16px;
    font-size: 13px;
    color: var(--red);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .alert-banner strong { color: var(--text-bright); }

  .main {
    max-width: 1440px;
    margin: 0 auto;
    padding: 20px 24px 60px;
  }

  .category-section { margin-bottom: 28px; }

  .category-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-dim);
    margin-bottom: 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .category-count {
    font-weight: 400;
    font-size: 13px;
    color: var(--text-dim);
  }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  @media (max-width: 1024px) {
    .card-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 640px) {
    .card-grid { grid-template-columns: 1fr; }
    .header-inner { flex-direction: column; align-items: flex-start; }
  }

  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px 16px;
    transition: border-color 0.2s, background 0.2s, transform 0.15s;
    cursor: default;
  }

  .card:hover {
    border-color: var(--blue);
    background: var(--surface-hover);
    transform: translateY(-1px);
  }

  .card.status-up    { border-left: 3px solid var(--green); }
  .card.status-down  { border-left: 3px solid var(--red); }
  .card.status-slow  { border-left: 3px solid var(--yellow); }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .card-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-bright);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: var(--text-dim);
    margin-bottom: 4px;
  }

  .response-time {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .response-time.fast   { color: var(--green); }
  .response-time.medium { color: var(--yellow); }
  .response-time.slow   { color: var(--red); }

  .card-url {
    font-size: 11px;
    color: var(--text-dim);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    opacity: 0.7;
  }

  .status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status-dot.up {
    background: var(--green);
    box-shadow: 0 0 6px var(--green);
    animation: pulse-green 2s ease-in-out infinite;
  }

  .status-dot.down {
    background: var(--red);
    box-shadow: 0 0 6px var(--red);
    animation: pulse-red 1.5s ease-in-out infinite;
  }

  .status-dot.slow {
    background: var(--yellow);
    box-shadow: 0 0 6px var(--yellow);
    animation: pulse-yellow 2s ease-in-out infinite;
  }

  .status-dot.loading {
    background: var(--text-dim);
    animation: pulse-loading 1s ease-in-out infinite;
  }

  @keyframes pulse-green {
    0%, 100% { box-shadow: 0 0 4px var(--green); }
    50%      { box-shadow: 0 0 12px var(--green), 0 0 20px rgba(63,185,80,0.3); }
  }

  @keyframes pulse-red {
    0%, 100% { box-shadow: 0 0 4px var(--red); }
    50%      { box-shadow: 0 0 12px var(--red), 0 0 20px rgba(248,81,73,0.3); }
  }

  @keyframes pulse-yellow {
    0%, 100% { box-shadow: 0 0 4px var(--yellow); }
    50%      { box-shadow: 0 0 12px var(--yellow), 0 0 20px rgba(210,153,34,0.3); }
  }

  @keyframes pulse-loading {
    0%, 100% { opacity: 0.4; }
    50%      { opacity: 1; }
  }

  .uptime-bar-container {
    max-width: 1440px;
    margin: 0 auto;
    padding: 0 24px 8px;
  }

  .uptime-bar {
    display: flex;
    gap: 2px;
    height: 20px;
    align-items: flex-end;
  }

  .uptime-tick {
    flex: 1;
    min-width: 3px;
    border-radius: 2px 2px 0 0;
    transition: height 0.3s;
  }

  .uptime-tick.full    { background: var(--green); height: 100%; }
  .uptime-tick.partial { background: var(--yellow); }
  .uptime-tick.none    { background: var(--red); height: 100%; }
  .uptime-tick.empty   { background: var(--border); height: 4px; }

  .footer {
    text-align: center;
    padding: 20px;
    font-size: 12px;
    color: var(--text-dim);
    border-top: 1px solid var(--border);
    margin-top: 40px;
  }

  .footer a { color: var(--blue); text-decoration: none; }

  .loading-overlay {
    position: fixed;
    inset: 0;
    background: rgba(13, 17, 23, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
    transition: opacity 0.4s;
  }

  .loading-overlay.hidden { opacity: 0; pointer-events: none; }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border);
    border-top-color: var(--blue);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .timeline-section { margin-top: 32px; }

  .timeline-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-dim);
    margin-bottom: 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border);
  }

  .timeline-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .timeline-table th {
    text-align: left;
    padding: 8px 12px;
    color: var(--text-dim);
    font-weight: 600;
    border-bottom: 1px solid var(--border);
  }

  .timeline-table td {
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    color: var(--text);
  }

  .timeline-table tr:hover td { background: var(--surface-hover); }

  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
  }

  .badge.ok   { background: var(--green-dim); color: var(--green); }
  .badge.warn { background: var(--yellow-dim); color: var(--yellow); }
  .badge.bad  { background: var(--red-dim); color: var(--red); }

  .btn {
    padding: 8px 16px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
  }

  .btn:hover { background: var(--surface-hover); border-color: var(--blue); color: var(--text-bright); }
  .btn.primary { background: var(--blue); color: #000; border-color: var(--blue); }
  .btn.primary:hover { background: #79b8ff; }

  .actions-bar { display: flex; gap: 10px; margin-bottom: 20px; align-items: center; }

  .progress-text {
    font-size: 12px;
    color: var(--text-dim);
    margin-left: 8px;
  }
</style>
</head>
<body>

<div class="loading-overlay" id="loadingOverlay">
  <div class="spinner"></div>
</div>

<header class="header">
  <div class="header-inner">
    <div class="header-title">
      <span class="logo-text">ECHO OMEGA PRIME</span>
      <span style="color:var(--text-dim); font-weight:400; font-size:14px;">System Health</span>
    </div>
    <div class="header-stats" id="headerStats">
      <div class="stat-pill online" id="statOnline">
        <span>&#x2714;</span> <span id="countOnline">--</span> Online
      </div>
      <div class="stat-pill offline" id="statOffline" style="display:none">
        <span>&#x2716;</span> <span id="countOffline">0</span> Offline
      </div>
      <div class="stat-pill slow" id="statSlow" style="display:none">
        <span>&#x26A0;</span> <span id="countSlow">0</span> Slow
      </div>
      <div class="stat-pill latency">
        <span>&#x23F1;</span> Avg <span id="avgMs">--</span>ms
      </div>
      <div class="last-check">
        <span class="refresh-indicator"></span>
        <span id="lastCheck">Checking...</span>
      </div>
    </div>
  </div>
</header>

<div class="alerts-bar" id="alertsBar">
  <div class="alert-banner">
    <span>&#x1F6A8;</span>
    <span id="alertText">Workers offline</span>
  </div>
</div>

<div class="uptime-bar-container">
  <div class="uptime-bar" id="uptimeBar"></div>
</div>

<main class="main">
  <div class="actions-bar">
    <button class="btn primary" onclick="refreshNow()">Refresh Now</button>
    <button class="btn" onclick="toggleAutoRefresh()">
      <span id="autoRefreshLabel">Auto-refresh: ON (30s)</span>
    </button>
    <span class="progress-text" id="progressText"></span>
  </div>

  ${categoryHTML}

  <div class="timeline-section" id="timelineSection">
    <h2 class="timeline-title">&#x1F4C8; Recent Snapshots</h2>
    <table class="timeline-table">
      <thead>
        <tr>
          <th>Time</th>
          <th>Total</th>
          <th>Online</th>
          <th>Offline</th>
          <th>Avg ms</th>
          <th>Health</th>
        </tr>
      </thead>
      <tbody id="snapshotBody">
        <tr><td colspan="6" style="text-align:center;color:var(--text-dim);">Loading snapshots...</td></tr>
      </tbody>
    </table>
  </div>
</main>

<footer class="footer">
  ECHO OMEGA PRIME &mdash; System Health Dashboard v1.0.0 &mdash;
  Monitoring <strong>${WORKERS.length}</strong> workers &mdash;
  <a href="/health">API Health</a> &middot;
  <a href="/api/status">Status JSON</a> &middot;
  <a href="/api/alerts">Alerts JSON</a>
</footer>

<script>
(function() {
  var WORKERS = ${workersJSON};
  var autoRefresh = true;
  var refreshTimer = null;
  var uptimeHistory = [];
  var checking = false;

  function timeAgo(iso) {
    if (!iso) return '--';
    var diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 5) return 'just now';
    if (diff < 60) return Math.floor(diff) + 's ago';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  }

  function formatTime(iso) {
    if (!iso) return '--';
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch(e) { return iso; }
  }

  // Check a single worker from the browser
  function checkWorker(w) {
    return new Promise(function(resolve) {
      var start = Date.now();
      var done = false;
      var timer = setTimeout(function() {
        if (done) return;
        done = true;
        resolve({
          name: w.name, url: w.url, category: w.category,
          status: 'down', statusCode: 0, responseMs: 5000,
          error: 'Timeout', checkedAt: new Date().toISOString()
        });
      }, 5000);

      fetch(w.url + '/health', { mode: 'cors', cache: 'no-store' })
        .then(function(resp) {
          if (done) return;
          done = true;
          clearTimeout(timer);
          var elapsed = Date.now() - start;
          var st = elapsed > 3000 ? 'slow' : 'up';
          resolve({
            name: w.name, url: w.url, category: w.category,
            status: resp.ok ? st : 'down',
            statusCode: resp.status,
            responseMs: elapsed,
            error: resp.ok ? null : 'HTTP ' + resp.status,
            checkedAt: new Date().toISOString()
          });
        })
        .catch(function(err) {
          if (done) return;
          done = true;
          clearTimeout(timer);
          resolve({
            name: w.name, url: w.url, category: w.category,
            status: 'down', statusCode: 0, responseMs: Date.now() - start,
            error: err.message || 'Fetch failed',
            checkedAt: new Date().toISOString()
          });
        });
    });
  }

  // Check all workers from browser in parallel batches
  async function checkAllWorkers() {
    if (checking) return null;
    checking = true;
    var results = [];
    var BATCH = 6;
    var total = WORKERS.length;
    var completed = 0;

    for (var i = 0; i < total; i += BATCH) {
      var batch = WORKERS.slice(i, i + BATCH);
      var batchResults = await Promise.all(batch.map(checkWorker));
      results = results.concat(batchResults);
      completed += batchResults.length;
      document.getElementById('progressText').textContent = 'Checking ' + completed + '/' + total + '...';

      // Update individual cards as they complete
      for (var j = 0; j < batchResults.length; j++) {
        updateCard(batchResults[j]);
      }
    }

    document.getElementById('progressText').textContent = '';
    checking = false;

    // Send report to server for caching
    try {
      await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workers: results })
      });
    } catch(e) { /* non-critical */ }

    return results;
  }

  function updateCard(w) {
    var card = document.querySelector('[data-worker="' + w.name + '"]');
    if (!card) return;

    card.classList.remove('status-up', 'status-down', 'status-slow');
    card.classList.add('status-' + w.status);

    var dot = document.querySelector('[data-dot="' + w.name + '"]');
    if (dot) {
      dot.classList.remove('up', 'down', 'slow', 'loading');
      dot.classList.add(w.status);
    }

    var msEl = document.querySelector('[data-ms="' + w.name + '"]');
    if (msEl) {
      msEl.textContent = w.responseMs + 'ms';
      msEl.classList.remove('fast', 'medium', 'slow');
      if (w.responseMs < 500) msEl.classList.add('fast');
      else if (w.responseMs < 2000) msEl.classList.add('medium');
      else msEl.classList.add('slow');
    }

    var timeEl = document.querySelector('[data-time="' + w.name + '"]');
    if (timeEl) timeEl.textContent = timeAgo(w.checkedAt);
  }

  function updateSummary(results) {
    if (!results || results.length === 0) return;

    var online = 0, offline = 0, slow = 0, totalMs = 0;
    for (var i = 0; i < results.length; i++) {
      if (results[i].status === 'up') online++;
      else if (results[i].status === 'down') offline++;
      else if (results[i].status === 'slow') slow++;
      totalMs += results[i].responseMs;
    }
    var avgMs = Math.round(totalMs / results.length);

    document.getElementById('countOnline').textContent = online;
    document.getElementById('countOffline').textContent = offline;
    document.getElementById('countSlow').textContent = slow;
    document.getElementById('avgMs').textContent = avgMs;
    document.getElementById('lastCheck').textContent = timeAgo(new Date().toISOString());

    document.getElementById('statOffline').style.display = offline > 0 ? 'flex' : 'none';
    document.getElementById('statSlow').style.display = slow > 0 ? 'flex' : 'none';

    var alertsBar = document.getElementById('alertsBar');
    if (offline > 0) {
      alertsBar.classList.add('visible');
      var downNames = results.filter(function(w) { return w.status === 'down'; }).map(function(w) { return w.name; }).join(', ');
      document.getElementById('alertText').innerHTML =
        '<strong>' + offline + ' worker(s) offline:</strong> ' + downNames;
    } else {
      alertsBar.classList.remove('visible');
    }

    // Category counts
    var catCounts = {}, catOnline = {};
    for (var i = 0; i < results.length; i++) {
      var cat = results[i].category;
      catCounts[cat] = (catCounts[cat] || 0) + 1;
      if (results[i].status === 'up') catOnline[cat] = (catOnline[cat] || 0) + 1;
    }
    for (var cat in catCounts) {
      var el = document.querySelector('[data-cat-count="' + cat + '"]');
      if (el) {
        var on = catOnline[cat] || 0;
        var tot = catCounts[cat];
        el.textContent = '(' + on + '/' + tot + ')';
        el.style.color = on === tot ? 'var(--green)' : (on === 0 ? 'var(--red)' : 'var(--yellow)');
      }
    }

    // Uptime bar
    uptimeHistory.push({ time: new Date().toISOString(), online: online, total: results.length });
    if (uptimeHistory.length > 60) uptimeHistory = uptimeHistory.slice(-60);
    renderUptimeBar();
  }

  function renderUptimeBar() {
    var bar = document.getElementById('uptimeBar');
    bar.innerHTML = '';
    var max = 60;
    for (var i = 0; i < max; i++) {
      var tick = document.createElement('div');
      tick.classList.add('uptime-tick');
      if (i < uptimeHistory.length) {
        var entry = uptimeHistory[i];
        var pct = entry.online / entry.total;
        if (pct >= 1) {
          tick.classList.add('full');
        } else if (pct > 0) {
          tick.classList.add('partial');
          tick.style.height = Math.max(20, pct * 100) + '%';
        } else {
          tick.classList.add('none');
        }
        tick.title = formatTime(entry.time) + ': ' + entry.online + '/' + entry.total + ' online';
      } else {
        tick.classList.add('empty');
      }
      bar.appendChild(tick);
    }
  }

  async function fetchSnapshots() {
    try {
      var resp = await fetch('/api/snapshots?limit=20');
      if (!resp.ok) return;
      var data = await resp.json();
      var tbody = document.getElementById('snapshotBody');
      if (!data.snapshots || data.snapshots.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-dim);">No snapshots stored yet.</td></tr>';
        return;
      }
      tbody.innerHTML = data.snapshots.map(function(s) {
        var pct = s.workers_total > 0 ? Math.round((s.workers_online / s.workers_total) * 100) : 0;
        var badgeClass = 'ok';
        if (pct < 100 && pct >= 80) badgeClass = 'warn';
        if (pct < 80) badgeClass = 'bad';
        return '<tr>' +
          '<td>' + formatTime(s.created_at) + '</td>' +
          '<td>' + s.workers_total + '</td>' +
          '<td style="color:var(--green)">' + s.workers_online + '</td>' +
          '<td style="color:' + (s.workers_offline > 0 ? 'var(--red)' : 'var(--text-dim)') + '">' + s.workers_offline + '</td>' +
          '<td>' + s.avg_response_ms + 'ms</td>' +
          '<td><span class="badge ' + badgeClass + '">' + pct + '% UP</span></td>' +
          '</tr>';
      }).join('');
    } catch(e) { console.error('Snapshots fetch failed:', e); }
  }

  window.refreshNow = async function() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
    var results = await checkAllWorkers();
    updateSummary(results);
    document.getElementById('loadingOverlay').classList.add('hidden');
  };

  window.toggleAutoRefresh = function() {
    autoRefresh = !autoRefresh;
    document.getElementById('autoRefreshLabel').textContent =
      autoRefresh ? 'Auto-refresh: ON (30s)' : 'Auto-refresh: OFF';
    if (autoRefresh) {
      startAutoRefresh();
    } else if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  };

  function startAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(async function() {
      if (!autoRefresh || checking) return;
      var results = await checkAllWorkers();
      updateSummary(results);
    }, 30000);
  }

  async function boot() {
    var results = await checkAllWorkers();
    updateSummary(results);
    document.getElementById('loadingOverlay').classList.add('hidden');
    fetchSnapshots();
    startAutoRefresh();
    setInterval(fetchSnapshots, 120000);
  }

  boot();
})();
</script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export default app;
