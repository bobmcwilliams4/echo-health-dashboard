<div align="center">

# Echo Health Dashboard

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Hono](https://img.shields.io/badge/Hono-4.6-E36002?logo=hono&logoColor=white)](https://hono.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![D1 Database](https://img.shields.io/badge/D1-SQLite-003B57?logo=sqlite&logoColor=white)](https://developers.cloudflare.com/d1/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production-brightgreen)](https://echo-health-dashboard.bmcii1976.workers.dev)

**Real-time system health monitoring for 33 Cloudflare Workers across 7 categories.**

[Live Dashboard](https://echo-health-dashboard.bmcii1976.workers.dev) | [API Status](https://echo-health-dashboard.bmcii1976.workers.dev/api/status) | [Alerts](https://echo-health-dashboard.bmcii1976.workers.dev/api/alerts)

</div>

---

## Overview

Echo Health Dashboard is a self-contained Cloudflare Worker that provides a real-time visual monitoring dashboard for the entire ECHO OMEGA PRIME infrastructure. It monitors 33 production Workers spanning AI orchestration, data pipelines, scraping systems, cognition services, and web applications -- all from a single, zero-dependency deployment.

The dashboard uses a **client-side health check architecture** where the visitor's browser performs parallel health probes against each Worker, then reports results back for caching and persistence. This design overcomes Cloudflare's same-account Worker-to-Worker routing limitation while providing sub-second visual feedback.

---

## Architecture

```
                         ECHO HEALTH DASHBOARD
                         Architecture Overview

    +------------------+         +--------------------------+
    |                  |  GET /  |                          |
    |    Browser       +-------->+  echo-health-dashboard   |
    |    (Client)      |<--------+  Cloudflare Worker       |
    |                  | HTML+JS |                          |
    +--------+---------+         +-----+--------+-----------+
             |                         |        |
             |  fetch /health          |        |
             |  (parallel batches      |        |
             |   of 6 workers)         |        |
             |                         |        |
     +-------v---------+        +-----v--+ +---v-----------+
     |                  |        |        | |               |
     |  33 ECHO Workers |        |  D1    | |  KV Cache     |
     |  *.bmcii1976.    |        |  DB    | |  (60s TTL)    |
     |  workers.dev     |        |        | |               |
     +---------+--------+        +--------+ +---------------+
               |
               | results[]
               |
     +---------v--------+
     |                  |
     |  POST /api/report|------> KV cache (latest status)
     |  POST /api/check |------> D1 snapshots + alerts
     |                  |
     +------------------+
```

### Data Flow

```
1. Browser loads GET / (full HTML dashboard with embedded JS)
2. Client JS fetches worker registry from GET /api/workers
3. Client probes each worker's /health endpoint in parallel batches of 6
4. Cards update in real-time as each batch completes
5. Full results POST'd to /api/report -> cached in KV (60s TTL)
6. Authenticated POST to /api/check -> persists snapshot to D1 + generates alerts
7. Auto-refresh cycle repeats every 30 seconds
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Visual Dashboard** | Dark-themed, responsive grid layout with real-time status cards for all 33 workers |
| **Client-Side Health Checks** | Browser-based parallel probes with 5-second timeout per worker, batched in groups of 6 |
| **Animated Status Indicators** | Pulsing green/yellow/red dots with glow effects for up/slow/down states |
| **Color-Coded Response Times** | Green (<500ms), yellow (500-2000ms), red (>2000ms) latency display |
| **Sparkline Uptime Bar** | 60-tick historical uptime visualization showing online/partial/offline states over time |
| **Alert System** | Automatic alert generation for down and slow workers, stored in D1 with acknowledgment workflow |
| **Alert Banner** | Prominent red banner listing offline workers when any service is down |
| **Auto-Refresh** | 30-second polling cycle with toggle control; progress indicator during checks |
| **Category Grouping** | Workers organized into 7 categories with per-category online/total counts |
| **Snapshot History** | Tabular view of historical check results with health percentage badges |
| **Sticky Header** | Summary stats (online/offline/slow/avg latency) always visible while scrolling |
| **Responsive Design** | 3-column grid on desktop, 2-column on tablet, single-column on mobile |
| **KV Caching** | Latest status cached in Workers KV with 60-second TTL for fast reads |
| **D1 Persistence** | Full snapshot and alert history stored in D1 SQLite for historical analysis |
| **Phoenix Integration** | Service binding to `echo-phoenix-cloud` for auto-healing capabilities |
| **Zero External Dependencies** | Single Hono framework dependency; all CSS and JS inline in the Worker |

---

## Workers Monitored

33 Cloudflare Workers across 7 operational categories:

### Core (5 workers)

| Worker | URL | Purpose |
|--------|-----|---------|
| `echo-shared-brain` | `echo-shared-brain.bmcii1976.workers.dev` | Universal shared context (D1 + KV + R2 + Vectorize) |
| `echo-memory-prime` | `echo-memory-prime.bmcii1976.workers.dev` | 9-pillar cloud memory system (44 endpoints) |
| `omniscient-sync` | `omniscient-sync.bmcii1976.workers.dev` | Cross-instance plans, todos, policies, broadcasts |
| `echo-build-orchestrator` | `echo-build-orchestrator.bmcii1976.workers.dev` | Engine build pipeline coordination |
| `echo-engine-runtime` | `echo-engine-runtime.bmcii1976.workers.dev` | 674 engines, 30K+ doctrines, hybrid search |

### AI (5 workers)

| Worker | URL | Purpose |
|--------|-----|---------|
| `echo-chat` | `echo-chat.bmcii1976.workers.dev` | 14 AI personalities, 12-layer prompt builder |
| `echo-swarm-brain` | `echo-swarm-brain.bmcii1976.workers.dev` | Swarm intelligence coordination (129 endpoints) |
| `echo-ai-orchestrator` | `echo-ai-orchestrator.bmcii1976.workers.dev` | 29 LLM workers, smart dispatch, queue builds |
| `echo-agent-coordinator` | `echo-agent-coordinator.bmcii1976.workers.dev` | Multi-agent workflows, 5 strategies |
| `echo-a2a-protocol` | `echo-a2a-protocol.bmcii1976.workers.dev` | Google A2A agent discovery and delegation |

### Data (3 workers)

| Worker | URL | Purpose |
|--------|-----|---------|
| `echo-graph-rag` | `echo-graph-rag.bmcii1976.workers.dev` | 312K nodes, 3.3M edges, 101-domain knowledge graph |
| `echo-knowledge-forge` | `echo-knowledge-forge.bmcii1976.workers.dev` | 5,387 documents, knowledge synthesis |
| `echo-ekm-archive` | `echo-ekm-archive.bmcii1976.workers.dev` | Enterprise knowledge management archive |

### Scrapers (3 workers)

| Worker | URL | Purpose |
|--------|-----|---------|
| `shadowglass-v8-warpspeed` | `shadowglass-v8-warpspeed.bmcii1976.workers.dev` | 80 counties, 259K+ deed records |
| `encore-cloud-scraper` | `encore-cloud-scraper.bmcii1976.workers.dev` | 47 counties, scheduled scraping |
| `echo-knowledge-scout` | `echo-knowledge-scout.bmcii1976.workers.dev` | 7-source daily intelligence scanning |

### Cognition (8 workers)

| Worker | URL | Purpose |
|--------|-----|---------|
| `echo-ekm-query` | `echo-ekm-query.bmcii1976.workers.dev` | Knowledge query interface |
| `echo-crystal-memory` | `echo-crystal-memory.bmcii1976.workers.dev` | Structured crystal memory persistence |
| `echo-embedding` | `echo-embedding.bmcii1976.workers.dev` | Vector embedding generation |
| `echo-talk` | `echo-talk.bmcii1976.workers.dev` | Conversational intelligence |
| `echo-graph-query` | `echo-graph-query.bmcii1976.workers.dev` | Graph-based knowledge retrieval |
| `echo-memory-orchestrator` | `echo-memory-orchestrator.bmcii1976.workers.dev` | Multi-tier memory coordination |
| `echo-engine-matrix` | `echo-engine-matrix.bmcii1976.workers.dev` | Engine capability matrix |
| `forge-x-cloud` | `forge-x-cloud.bmcii1976.workers.dev` | Autonomous engine builder (cron, 36/hr) |

### Infrastructure (5 workers)

| Worker | URL | Purpose |
|--------|-----|---------|
| `echo-relay` | `echo-relay.bmcii1976.workers.dev` | Cloud relay for MCP tool routing |
| `echo-gs343-cloud` | `echo-gs343-cloud.bmcii1976.workers.dev` | Error healing templates |
| `echo-phoenix-cloud` | `echo-phoenix-cloud.bmcii1976.workers.dev` | Auto-healing and recovery |
| `echo-mega-gateway-cloud` | `echo-mega-gateway-cloud.bmcii1976.workers.dev` | Tool discovery gateway |
| `echo-security-sandbox` | `echo-security-sandbox.bmcii1976.workers.dev` | CTF security challenges |

### Sites (4 workers)

| Worker | URL | Purpose |
|--------|-----|---------|
| `profinish-api` | `profinish-api.bmcii1976.workers.dev` | Pro Finish Custom Carpentry API (70+ endpoints) |
| `billymc-api` | `billymc-api.bmcii1976.workers.dev` | BillyMC AI-SDR sales platform |
| `echo-tax-return` | `echo-tax-return.bmcii1976.workers.dev` | Tax return preparation service |
| `echo-domain-harvester` | `echo-domain-harvester.bmcii1976.workers.dev` | Domain intelligence harvester |

---

## API Reference

### Public Endpoints

#### `GET /`
Serves the full HTML dashboard with embedded CSS and JavaScript. No authentication required.

**Response:** HTML page (Content-Type: text/html)

---

#### `GET /health`
Self health check endpoint. Returns service metadata and the count of monitored workers.

**Auth:** None

**Response:**
```json
{
  "status": "ok",
  "service": "echo-health-dashboard",
  "version": "1.0.0",
  "timestamp": "2026-02-25T04:30:00.000Z",
  "workers_monitored": 33
}
```

---

#### `GET /api/workers`
Returns the full worker registry with names, URLs, and categories. Used by the client-side JavaScript to know which workers to probe.

**Auth:** None

**Response:**
```json
{
  "workers": [
    { "name": "echo-shared-brain", "url": "https://echo-shared-brain.bmcii1976.workers.dev", "category": "Core" },
    { "name": "echo-memory-prime", "url": "https://echo-memory-prime.bmcii1976.workers.dev", "category": "Core" }
  ],
  "total": 33
}
```

---

#### `GET /api/status`
Returns the latest cached status from KV. If no status has been reported yet, returns the worker registry with `unknown` status.

**Auth:** None

**Response:**
```json
{
  "total": 33,
  "online": 28,
  "slow": 3,
  "offline": 2,
  "avgMs": 342,
  "checkedAt": "2026-02-25T04:30:00.000Z",
  "workers": [
    {
      "name": "echo-shared-brain",
      "url": "https://echo-shared-brain.bmcii1976.workers.dev",
      "category": "Core",
      "status": "up",
      "statusCode": 200,
      "responseMs": 127,
      "error": null,
      "checkedAt": "2026-02-25T04:30:00.000Z"
    }
  ]
}
```

---

#### `POST /api/report`
Receives health check results from the browser client and caches them in KV with a 60-second TTL. Called automatically after each client-side check cycle.

**Auth:** None

**Request Body:**
```json
{
  "workers": [
    {
      "name": "echo-shared-brain",
      "url": "https://echo-shared-brain.bmcii1976.workers.dev",
      "category": "Core",
      "status": "up",
      "statusCode": 200,
      "responseMs": 127,
      "error": null,
      "checkedAt": "2026-02-25T04:30:00.000Z"
    }
  ]
}
```

**Response:**
```json
{
  "ok": true,
  "online": 28,
  "offline": 2,
  "slow": 3,
  "avgMs": 342
}
```

---

#### `GET /api/snapshots`
Returns historical check snapshots stored in D1. Use the `limit` query parameter to control the number of results.

**Auth:** None

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | integer | 50 | Maximum number of snapshots to return |

**Response:**
```json
{
  "snapshots": [
    {
      "id": 42,
      "snapshot_type": "full_check",
      "workers_total": 33,
      "workers_online": 31,
      "workers_offline": 2,
      "avg_response_ms": 287,
      "created_at": "2026-02-25T04:30:00"
    }
  ]
}
```

---

#### `GET /api/alerts`
Returns alert records from D1. Optionally filter by acknowledgment status.

**Auth:** None

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `acknowledged` | `true` / `false` | *(all)* | Filter alerts by acknowledgment status |

**Response:**
```json
{
  "alerts": [
    {
      "id": 7,
      "alert_type": "worker_down",
      "severity": "high",
      "message": "echo-gs343-cloud is DOWN: Timeout",
      "worker_name": "echo-gs343-cloud",
      "acknowledged": 0,
      "created_at": "2026-02-25T04:28:00"
    }
  ]
}
```

---

### Authenticated Endpoints

All authenticated endpoints require the `X-Echo-API-Key` header.

#### `POST /init-schema`
Initializes the D1 database schema (creates `snapshots` and `alerts` tables with indexes). Safe to call multiple times (uses `CREATE TABLE IF NOT EXISTS`).

**Auth:** `X-Echo-API-Key` header required

**Response:**
```json
{ "ok": true, "message": "Schema initialized" }
```

---

#### `POST /api/check`
Reads the latest cached status from KV and persists it as a D1 snapshot. Also generates `worker_down` (severity: high) and `worker_slow` (severity: medium) alerts automatically.

**Auth:** `X-Echo-API-Key` header required

**Request:** No body required (reads from KV cache)

**Example:**
```bash
curl -X POST https://echo-health-dashboard.bmcii1976.workers.dev/api/check \
  -H "X-Echo-API-Key: YOUR_API_KEY"
```

**Response:**
```json
{ "ok": true, "total": 33, "online": 31, "offline": 2, "avgMs": 287 }
```

---

#### `POST /api/alerts/:id/ack`
Acknowledges a specific alert by ID, setting its `acknowledged` flag to 1.

**Auth:** `X-Echo-API-Key` header required

**Example:**
```bash
curl -X POST https://echo-health-dashboard.bmcii1976.workers.dev/api/alerts/7/ack \
  -H "X-Echo-API-Key: YOUR_API_KEY"
```

**Response:**
```json
{ "ok": true, "id": "7" }
```

---

## Dashboard UI

The dashboard serves a self-contained HTML page with inline CSS and JavaScript. No external assets, CDN dependencies, or build step required.

### Visual Design

- **Theme:** Dark mode inspired by GitHub's dark default (`#0d1117` background, `#161b22` surfaces)
- **Typography:** System font stack (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`)
- **Layout:** Max-width 1440px, responsive grid (3 columns / 2 columns / 1 column)
- **Header:** Sticky with gradient title, summary stat pills, and live refresh indicator

### Status Indicators

| Status | Dot Color | Glow Animation | Card Border | Response Time Color |
|--------|-----------|----------------|-------------|---------------------|
| **Up** | Green (`#3fb950`) | 2s pulse with expanding glow | 3px green left border | Green (<500ms) |
| **Slow** | Yellow (`#d29922`) | 2s pulse with expanding glow | 3px yellow left border | Yellow (500-2000ms) |
| **Down** | Red (`#f85149`) | 1.5s pulse (faster, urgent) | 3px red left border | Red (>2000ms or timeout) |
| **Loading** | Gray | 1s opacity fade | None | `--` placeholder |

### Uptime Sparkline Bar

A 60-tick horizontal bar below the header tracks uptime history across check cycles:

- **Full green tick:** All workers online (100%)
- **Partial yellow tick:** Some workers online (height proportional to percentage)
- **Full red tick:** All workers offline (0%)
- **Gray stub:** No data yet for that slot

Hover over any tick to see the timestamp and online/total count.

### Cards

Each worker card displays:
- Animated status dot with glow effect
- Worker name (with `echo-` prefix stripped for readability)
- Response time in milliseconds with color coding
- Relative timestamp ("just now", "15s ago", etc.)
- Full Worker URL in muted text

Cards have a subtle hover animation (lift + blue border highlight).

---

## Architecture Decision: Client-Side Health Checks

### The Problem

Cloudflare Workers on the same account cannot reliably `fetch()` each other through their public URLs due to internal routing behavior. A Worker calling another same-account Worker via its `*.workers.dev` URL may get routed internally in unexpected ways, producing inaccurate health data.

### The Solution

The dashboard delegates health checking to the **visitor's browser**. The client-side JavaScript:

1. Fetches the worker registry from `/api/workers`
2. Issues parallel `fetch()` calls to each worker's `/health` endpoint in batches of 6
3. Measures response time and status from the browser's perspective
4. Reports aggregated results back to the dashboard worker via `POST /api/report`

This approach provides **accurate, real-world latency measurements** from the end user's vantage point, which is arguably more valuable than server-to-server checks. The 5-second timeout per worker and batch-of-6 concurrency limit prevent browser resource exhaustion.

### Trade-offs

| Aspect | Client-Side | Server-Side |
|--------|-------------|-------------|
| Accuracy | Measures real user experience | Measures inter-datacenter latency |
| CORS | Requires workers to set CORS headers | No CORS needed |
| Availability | Requires browser visit to generate data | Can run on cron schedule |
| Same-account routing | Not affected | Affected by Cloudflare internal routing |
| Cost | Zero Workers CPU for checks | CPU time per check cycle |

---

## Infrastructure

### Cloudflare Bindings

| Binding | Type | Name/ID | Purpose |
|---------|------|---------|---------|
| `DB` | D1 Database | `echo-health-dashboard` (`b13d2c7e-432f-4df8-ac73-c68a7c799286`) | Snapshot history and alert storage |
| `CACHE` | KV Namespace | `5d95c200ed8f469f9160ae94757381bc` | Latest status cache (60s TTL) |
| `PHOENIX_SVC` | Service Binding | `echo-phoenix-cloud` | Auto-healing service integration |
| `ECHO_API_KEY` | Secret | *(set via wrangler)* | API authentication for write endpoints |

### D1 Schema

**`snapshots` table** -- Stores periodic full-fleet health snapshots:

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER (PK) | Auto-incrementing ID |
| `snapshot_type` | TEXT | Check type (e.g., `full_check`) |
| `data` | TEXT | Full JSON array of worker statuses |
| `workers_total` | INTEGER | Total workers checked |
| `workers_online` | INTEGER | Workers responding successfully |
| `workers_offline` | INTEGER | Workers that failed or timed out |
| `avg_response_ms` | INTEGER | Average response time across all workers |
| `created_at` | TEXT | ISO 8601 timestamp |

**`alerts` table** -- Stores generated alerts for down/slow workers:

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER (PK) | Auto-incrementing ID |
| `alert_type` | TEXT | `worker_down` or `worker_slow` |
| `severity` | TEXT | `high` (down) or `medium` (slow) |
| `message` | TEXT | Human-readable alert description |
| `worker_name` | TEXT | Name of the affected worker |
| `acknowledged` | INTEGER | 0 = unacknowledged, 1 = acknowledged |
| `created_at` | TEXT | ISO 8601 timestamp |

---

## Deployment

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) 3.x
- Cloudflare account with Workers, D1, and KV enabled

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/bobmcwilliams4/echo-health-dashboard.git
cd echo-health-dashboard

# Install dependencies
npm install

# Initialize the D1 database schema
npm run db:init
# or: npx wrangler d1 execute echo-health-dashboard --remote --file=schema.sql

# Set the API key secret
echo "your-api-key" | npx wrangler secret put ECHO_API_KEY

# Deploy to Cloudflare Workers
npm run deploy
# or: npx wrangler deploy
```

### Local Development

```bash
npm run dev
# Opens local dev server at http://localhost:8787
```

> **Note:** Client-side health checks will work in local dev since the browser makes direct requests to production worker URLs.

---

## Configuration

### Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `ENVIRONMENT` | var | `production` | Deployment environment identifier |
| `ECHO_API_KEY` | secret | `echo-omega-prime-health-2026` | API key for authenticated endpoints |

### Tuning Constants (in source)

| Constant | Value | Description |
|----------|-------|-------------|
| Batch size | 6 | Number of concurrent health probes per batch |
| Check timeout | 5,000ms | Per-worker health check timeout |
| Slow threshold | 3,000ms | Response time above which a worker is marked "slow" |
| Auto-refresh interval | 30,000ms | Time between automatic check cycles |
| KV cache TTL | 60s | Expiration time for cached status in KV |
| Uptime history length | 60 | Number of ticks retained in the sparkline bar |
| Snapshot fetch interval | 120,000ms | How often the dashboard reloads snapshot history |
| Alert limit | 200 | Maximum alerts returned per query |

### Adding a New Worker

To monitor an additional worker, add an entry to the `WORKERS` array in `src/index.ts`:

```typescript
{ name: 'my-new-worker', url: 'https://my-new-worker.bmcii1976.workers.dev', category: 'Core' },
```

The worker must expose a `/health` endpoint that returns a `200 OK` response with CORS headers enabled.

---

## Project Structure

```
echo-health-dashboard/
  src/
    index.ts          # Hono app: API routes, worker registry, HTML dashboard (1,155 lines)
  schema.sql          # D1 database schema (snapshots + alerts tables)
  wrangler.toml       # Cloudflare Workers configuration (D1, KV, service bindings)
  package.json        # Dependencies (hono) and scripts (dev, deploy, db:init)
  tsconfig.json       # TypeScript configuration
  README.md           # This file
```

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Cloudflare Workers (V8 isolate) |
| Framework | [Hono](https://hono.dev/) 4.6 |
| Language | TypeScript 5.7 |
| Database | Cloudflare D1 (SQLite at the edge) |
| Cache | Cloudflare Workers KV |
| Service Mesh | Cloudflare Service Bindings (Phoenix) |
| Deployment | Wrangler CLI |

---

## License

[MIT](LICENSE)

---

<div align="center">

**ECHO OMEGA PRIME** -- System Health Dashboard v1.0.0

Monitoring 33 Workers | 7 Categories | Real-Time Client-Side Probes

</div>
