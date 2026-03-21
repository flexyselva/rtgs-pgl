/**
 * RTGS PGL — Cloudflare Worker
 *
 * Routes:
 *   GET  /api/results  → read all Season 3 results from KV
 *   POST /api/results  → write results to KV (requires X-Write-Key header)
 *   *                  → forward to static assets (public/)
 */

interface Env {
  RESULTS: KVNamespace;
  WRITE_KEY: string;
  ASSETS: Fetcher;
}

const KV_KEY = 'season3_results';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Write-Key',
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

      // GET — return all stored results
      if (request.method === 'GET') {
        const raw = await env.RESULTS.get(KV_KEY);
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

        // Merge incoming results with existing ones
        const raw = await env.RESULTS.get(KV_KEY);
        const existing: Record<string, unknown> = raw ? JSON.parse(raw) : {};
        const merged = { ...existing, ...body };

        await env.RESULTS.put(KV_KEY, JSON.stringify(merged));
        return json({ ok: true });
      }

      return json({ error: 'Method not allowed' }, 405);
    }

    // ── Static assets (everything else) ──
    return env.ASSETS.fetch(request);
  },
};
