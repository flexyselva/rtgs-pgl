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

        // Merge incoming results with existing ones
        const raw = await env.RESULTS.get(kvKey);
        const existing: Record<string, unknown> = raw ? JSON.parse(raw) : {};
        const merged = { ...existing, ...body };

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

    // ── Static assets (everything else) ──
    return env.ASSETS.fetch(request);
  },
};
