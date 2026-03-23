/**
 * RTGS PGL — Cloudflare Worker
 *
 * Routes:
 *   GET  /api/results   → read all Season 3 results from KV
 *   POST /api/results   → write results to KV (requires X-Write-Key header)
 *   POST /api/track     → append analytics event to daily KV key (open)
 *   GET  /api/analytics → read analytics events for last N days (requires X-Write-Key)
 *   *                   → forward to static assets (public/)
 */

interface Env {
  RESULTS: KVNamespace;
  WRITE_KEY: string;
  ASSETS: Fetcher;
}

const KV_KEY      = 'season3_results';
const KV_TEST_KEY = 'season3_results_test'; // isolated key used by E2E tests

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Write-Key, X-Test-Mode',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // ── Preflight ──
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // ── API routes ──
    if (url.pathname === '/api/results') {

      // Determine which KV key to use — test mode uses an isolated key
      const isTestMode = request.headers.get('X-Test-Mode') === '1';
      const kvKey = isTestMode ? KV_TEST_KEY : KV_KEY;

      // GET — return all stored results
      if (request.method === 'GET') {
        const raw = await env.RESULTS.get(kvKey);
        const results = raw ? JSON.parse(raw) : {};
        return json(results);
      }

      // POST — write results (auth required)
      if (request.method === 'POST') {
        const writeKey = request.headers.get('X-Write-Key') ?? '';
        if (!env.WRITE_KEY || writeKey !== env.WRITE_KEY) {
          return json({ error: 'Unauthorised' }, 401);
        }

        let body: Record<string, unknown>;
        try {
          body = await request.json();
        } catch {
          return json({ error: 'Invalid JSON' }, 400);
        }

        // Merge incoming results with existing ones.
        // A null value means "clear this match" — delete the key.
        const raw = await env.RESULTS.get(kvKey);
        const existing: Record<string, unknown> = raw ? JSON.parse(raw) : {};
        const merged = { ...existing, ...body };
        for (const k of Object.keys(body)) {
          if (body[k] === null) delete merged[k];
        }

        await env.RESULTS.put(kvKey, JSON.stringify(merged));
        return json({ ok: true });
      }

      // DELETE — clear test results (test mode only, auth required)
      if (request.method === 'DELETE') {
        const writeKey = request.headers.get('X-Write-Key') ?? '';
        if (!env.WRITE_KEY || writeKey !== env.WRITE_KEY) {
          return json({ error: 'Unauthorised' }, 401);
        }
        if (!isTestMode) {
          return json({ error: 'DELETE only permitted in test mode' }, 403);
        }
        await env.RESULTS.delete(kvKey);
        return json({ ok: true });
      }

      return json({ error: 'Method not allowed' }, 405);
    }

    // ── POST /api/track — append analytics event (no auth) ──
    if (url.pathname === '/api/track' && request.method === 'POST') {
      let body: { event?: string; page?: string; persona?: string; username?: string };
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

      const now = new Date();
      const dateKey = `analytics_${now.toISOString().slice(0, 10)}`;
      const event = {
        event:    String(body.event    || 'unknown').slice(0, 64),
        page:     String(body.page     || '/').slice(0, 128),
        persona:  String(body.persona  || 'fan').slice(0, 32),
        username: String(body.username || 'guest').slice(0, 64),
        ts:       now.toISOString(),
        country:  (request.headers.get('CF-IPCountry') || '').slice(0, 8),
      };

      const raw = await env.RESULTS.get(dateKey);
      const events: unknown[] = raw ? JSON.parse(raw) : [];
      events.push(event);
      await env.RESULTS.put(dateKey, JSON.stringify(events));
      return json({ ok: true });
    }

    // ── GET /api/analytics — read events for last N days (auth required) ──
    if (url.pathname === '/api/analytics' && request.method === 'GET') {
      const writeKey = request.headers.get('X-Write-Key') ?? '';
      if (!env.WRITE_KEY || writeKey !== env.WRITE_KEY) {
        return json({ error: 'Unauthorised' }, 401);
      }

      const days = Math.min(parseInt(url.searchParams.get('days') || '7'), 30);
      const dateKeys: string[] = [];
      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setUTCDate(d.getUTCDate() - i);
        dateKeys.push(`analytics_${d.toISOString().slice(0, 10)}`);
      }

      const raws = await Promise.all(dateKeys.map(k => env.RESULTS.get(k)));
      const allEvents: unknown[] = [];
      raws.forEach(raw => { if (raw) allEvents.push(...JSON.parse(raw)); });

      return json({ events: allEvents });
    }

    // ── Static assets (everything else) ──
    const assetResponse = await env.ASSETS.fetch(request);

    // Inject staging banner into HTML pages
    if (
      url.hostname.includes('staging') &&
      assetResponse.headers.get('Content-Type')?.includes('text/html')
    ) {
      const html = await assetResponse.text();
      const banner = `<div style="position:fixed;top:0;left:0;right:0;z-index:9999;background:#b45309;color:#fff;text-align:center;padding:8px 16px;font-family:Raleway,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.05em;">STAGING — This is not the live site. Data here is independent of production.</div><div style="height:37px"></div>`;
      const injected = html.replace('<body>', '<body>' + banner);
      return new Response(injected, {
        status: assetResponse.status,
        headers: assetResponse.headers,
      });
    }

    return assetResponse;
  },
};
