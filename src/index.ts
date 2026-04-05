/**
 * RTGS PGL — Cloudflare Worker
 *
 * Routes:
 *   GET  /api/results   → read all Season 3 results from KV
 *   POST /api/results   → write results to KV (requires X-Write-Key or Bearer token)
 *   GET  /api/schedule  → read Season 3 match schedule and rosters from KV (public)
 *   POST /api/schedule  → write schedule/rosters to KV (requires X-Write-Key or admin Bearer)
 *   POST /api/track     → append analytics event to daily KV key (open)
 *   GET  /api/analytics → read analytics events for last N days (requires X-Write-Key)
 *   POST /api/login     → authenticate user, return signed token
 *   POST /api/log       → store client-side error log entry (open)
 *   GET  /api/log       → read error log entries for last N days (requires auth)
 *   *                   → forward to static assets (public/)
 */

interface Env {
  RESULTS: KVNamespace;
  GALLERY: R2Bucket;
  WRITE_KEY: string;
  ASSETS: Fetcher;
  VERSION: string;
  AUTH_HMAC_SECRET: string;
  AUTH_USERS: string;
}

const KV_KEY           = 'season3_results';
const KV_TEST_KEY      = 'season3_results_test'; // isolated key used by E2E tests
const KV_SCHEDULE_KEY  = 'season3_schedule';
const KV_ROSTERS_KEY   = 'season3_rosters';
const KV_HELP_KEY      = 'help_submissions';
const KV_GALLERY_KEY   = 'season3_gallery'; // photo metadata list

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Write-Key, X-Test-Mode, Authorization',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

// ── Auth helper functions ──────────────────────────────────────────────────

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function base64urlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function signToken(payload: object, secret: string): Promise<string> {
  const payloadB64 = base64urlEncode(JSON.stringify(payload));
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(payloadB64);
  const key = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, msgData);
  const sigB64 = base64urlEncode(String.fromCharCode(...new Uint8Array(sig)));
  return `${payloadB64}.${sigB64}`;
}

async function verifyToken(token: string, secret: string): Promise<object | null> {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const msgData = encoder.encode(payloadB64);
    const key = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    // Decode provided signature
    const providedSig = Uint8Array.from(atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, providedSig, msgData);
    if (!valid) return null;
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── Bearer token extraction + verification ────────────────────────────────

async function verifyBearer(request: Request, secret: string): Promise<{ username: string; role: string; team: string | null; display: string } | null> {
  const authHeader = request.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const payload = await verifyToken(token, secret) as { username?: string; role?: string; team?: string | null; display?: string } | null;
  if (!payload || !payload.username || !payload.role) return null;
  return { username: payload.username, role: payload.role, team: payload.team ?? null, display: payload.display ?? '' };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // ── Preflight ──
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // ── API routes ──

    // ── POST /api/login — authenticate and return signed token ──
    if (url.pathname === '/api/login' && request.method === 'POST') {
      let body: { username?: string; password?: string };
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

      const { username, password } = body;
      if (!username || !password) return json({ error: 'Invalid credentials' }, 401);

      let users: Array<{ username: string; passwordHash: string; role: string; team: string | null; display: string }> = [];
      try { users = JSON.parse(env.AUTH_USERS ?? '[]'); } catch { return json({ error: 'Server misconfigured' }, 500); }

      const incoming = await hashPassword(password);
      const match = users.find(u => u.username === username && u.passwordHash === incoming);
      if (!match) return json({ error: 'Invalid credentials' }, 401);

      const payload = {
        username: match.username,
        role:     match.role,
        team:     match.team,
        display:  match.display,
        exp:      Date.now() + 30 * 60 * 1000,
      };
      const token = await signToken(payload, env.AUTH_HMAC_SECRET ?? '');
      return json({ token, username: match.username, role: match.role, team: match.team, display: match.display });
    }

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

      // POST — write results (auth required: X-Write-Key or Bearer token with admin/captain role)
      if (request.method === 'POST') {
        const writeKey = request.headers.get('X-Write-Key') ?? '';
        const writeKeyOk = env.WRITE_KEY && writeKey === env.WRITE_KEY;
        let bearerOk = false;
        if (!writeKeyOk) {
          const tokenPayload = await verifyBearer(request.clone(), env.AUTH_HMAC_SECRET ?? '');
          bearerOk = tokenPayload !== null && (tokenPayload.role === 'admin' || tokenPayload.role === 'captain');
        }
        if (!writeKeyOk && !bearerOk) {
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

    // ── GET /api/schedule — return match schedule + rosters (public) ──
    // ── POST /api/schedule — overwrite schedule and/or rosters (admin only) ──
    if (url.pathname === '/api/schedule') {

      if (request.method === 'GET') {
        const [scheduleRaw, rostersRaw] = await Promise.all([
          env.RESULTS.get(KV_SCHEDULE_KEY),
          env.RESULTS.get(KV_ROSTERS_KEY),
        ]);
        const matches = scheduleRaw ? JSON.parse(scheduleRaw) : [];
        const rosters = rostersRaw ? JSON.parse(rostersRaw) : { teamD: [], teamR: [] };
        return json({ matches, rosters });
      }

      if (request.method === 'POST') {
        const writeKey = request.headers.get('X-Write-Key') ?? '';
        const writeKeyOk = env.WRITE_KEY && writeKey === env.WRITE_KEY;
        let bearerOk = false;
        if (!writeKeyOk) {
          const tokenPayload = await verifyBearer(request.clone(), env.AUTH_HMAC_SECRET ?? '');
          bearerOk = tokenPayload !== null && tokenPayload.role === 'admin';
        }
        if (!writeKeyOk && !bearerOk) {
          return json({ error: 'Unauthorised' }, 401);
        }

        let body: { matches?: unknown[]; rosters?: { teamD?: unknown[]; teamR?: unknown[] } };
        try {
          body = await request.json();
        } catch {
          return json({ error: 'Invalid JSON' }, 400);
        }

        const writes: Promise<void>[] = [];
        if (body.matches !== undefined) {
          writes.push(env.RESULTS.put(KV_SCHEDULE_KEY, JSON.stringify(body.matches)));
        }
        if (body.rosters !== undefined) {
          writes.push(env.RESULTS.put(KV_ROSTERS_KEY, JSON.stringify(body.rosters)));
        }
        await Promise.all(writes);
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
      const cf = (request as any).cf;
      const event = {
        event:    String(body.event    || 'unknown').slice(0, 64),
        page:     String(body.page     || '/').slice(0, 128),
        persona:  String(body.persona  || 'fan').slice(0, 32),
        username: String(body.username || 'guest').slice(0, 64),
        ts:       now.toISOString(),
        country:  (request.headers.get('CF-IPCountry') || '').slice(0, 8),
        city:     cf?.city     != null ? String(cf.city).slice(0, 64)    : null,
        isp:      cf?.asOrganization != null ? String(cf.asOrganization).slice(0, 128) : null,
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

    // ── POST /api/log — store client-side error (open, no auth) ──
    if (url.pathname === '/api/log' && request.method === 'POST') {
      let body: Record<string, unknown>;
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

      const now = new Date();
      const dateKey = `errors_${now.toISOString().slice(0, 10)}`;
      const entry = {
        level:    String(body.level    || 'error').slice(0, 16),
        context:  String(body.context  || '').slice(0, 64),
        message:  String(body.message  || '').slice(0, 256),
        stack:    String(body.stack    || '').slice(0, 512),
        username: String(body.username || 'guest').slice(0, 64),
        page:     String(body.page     || '/').slice(0, 128),
        ts:       String(body.ts       || now.toISOString()).slice(0, 32),
        ua:       String(body.ua       || '').slice(0, 128),
      };

      const raw = await env.RESULTS.get(dateKey);
      const entries: unknown[] = raw ? JSON.parse(raw) : [];
      if (entries.length >= 500) entries.splice(0, entries.length - 499); // cap at 500, drop oldest
      entries.push(entry);
      await env.RESULTS.put(dateKey, JSON.stringify(entries));
      return json({ ok: true });
    }

    // ── GET /api/log — read error log entries for last N days (auth required) ──
    if (url.pathname === '/api/log' && request.method === 'GET') {
      const writeKey = request.headers.get('X-Write-Key') ?? '';
      const writeKeyOk = env.WRITE_KEY && writeKey === env.WRITE_KEY;
      let bearerOk = false;
      if (!writeKeyOk) {
        const tokenPayload = await verifyBearer(request.clone(), env.AUTH_HMAC_SECRET ?? '');
        bearerOk = tokenPayload !== null && tokenPayload.role === 'admin';
      }
      if (!writeKeyOk && !bearerOk) {
        return json({ error: 'Unauthorised' }, 401);
      }

      const days = Math.min(parseInt(url.searchParams.get('days') || '3'), 7);
      const dateKeys: string[] = [];
      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setUTCDate(d.getUTCDate() - i);
        dateKeys.push(`errors_${d.toISOString().slice(0, 10)}`);
      }

      const raws = await Promise.all(dateKeys.map(k => env.RESULTS.get(k)));
      const allErrors: unknown[] = [];
      raws.forEach(raw => { if (raw) allErrors.push(...JSON.parse(raw)); });

      return json({ errors: allErrors });
    }

    if (url.pathname === '/api/help' && request.method === 'POST') {
      let body: { message?: string; email?: string; page?: string; persona?: string; username?: string };
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

      const message = String(body.message || '').trim().slice(0, 1000);
      if (!message) return json({ error: 'Message is required' }, 400);

      const email = String(body.email || '').trim().slice(0, 200);
      if (email && !email.includes('@')) return json({ error: 'Invalid email' }, 400);

      const now = new Date();
      const entry = {
        id:       crypto.randomUUID(),
        message,
        email,
        page:     String(body.page     || '/').slice(0, 128),
        persona:  String(body.persona  || 'fan').slice(0, 32),
        username: String(body.username || 'guest').slice(0, 64),
        ts:       now.toISOString(),
        country:  (request.headers.get('CF-IPCountry') || '').slice(0, 8),
      };

      const raw = await env.RESULTS.get(KV_HELP_KEY);
      const entries: unknown[] = raw ? JSON.parse(raw) : [];
      entries.push(entry);
      if (entries.length > 200) entries.splice(0, entries.length - 200);
      await env.RESULTS.put(KV_HELP_KEY, JSON.stringify(entries));
      return json({ ok: true, id: entry.id });
    }

    if (url.pathname === '/api/help' && request.method === 'GET') {
      const writeKey = request.headers.get('X-Write-Key') ?? '';
      const writeKeyOk = env.WRITE_KEY && writeKey === env.WRITE_KEY;
      let bearerOk = false;
      if (!writeKeyOk) {
        const tokenPayload = await verifyBearer(request.clone(), env.AUTH_HMAC_SECRET ?? '');
        bearerOk = tokenPayload !== null && tokenPayload.role === 'admin';
      }
      if (!writeKeyOk && !bearerOk) return json({ error: 'Unauthorised' }, 401);

      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
      const raw = await env.RESULTS.get(KV_HELP_KEY);
      const all: unknown[] = raw ? JSON.parse(raw) : [];
      return json({ submissions: all.slice().reverse().slice(0, limit) });
    }

    // ── POST /api/gallery/upload — organiser or admin only ──
    if (url.pathname === '/api/gallery/upload' && request.method === 'POST') {
      const tokenPayload = await verifyBearer(request.clone(), env.AUTH_HMAC_SECRET ?? '');
      if (!tokenPayload || (tokenPayload.role !== 'organiser' && tokenPayload.role !== 'admin')) {
        return json({ error: 'Unauthorised' }, 401);
      }

      let formData: FormData;
      try { formData = await request.formData(); } catch { return json({ error: 'Invalid form data' }, 400); }

      const file = formData.get('file') as File | null;
      const description = String(formData.get('description') || '').trim().slice(0, 200);

      if (!file) return json({ error: 'No file provided' }, 400);
      if (!file.type.startsWith('image/')) return json({ error: 'File must be an image' }, 400);
      if (file.size > 10 * 1024 * 1024) return json({ error: 'Image must be under 10MB' }, 400);

      const id = crypto.randomUUID();
      const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
      const r2Key = `photos/${id}/${safeFilename}`;

      await env.GALLERY.put(r2Key, file.stream(), {
        httpMetadata: { contentType: file.type },
      });

      const photo = {
        id,
        r2Key,
        filename: safeFilename,
        description,
        uploadedBy: tokenPayload.username,
        uploadedAt: new Date().toISOString(),
        likes: [] as string[],
        comments: [] as Array<{ username: string; text: string; ts: string }>,
      };

      const raw = await env.RESULTS.get(KV_GALLERY_KEY);
      const photos: unknown[] = raw ? JSON.parse(raw) : [];
      photos.push(photo);
      if (photos.length > 500) photos.splice(0, photos.length - 500);
      await env.RESULTS.put(KV_GALLERY_KEY, JSON.stringify(photos));

      return json({ ok: true, id });
    }

    // ── GET /api/gallery — public, returns all photo metadata newest first ──
    if (url.pathname === '/api/gallery' && request.method === 'GET') {
      const raw = await env.RESULTS.get(KV_GALLERY_KEY);
      const photos: unknown[] = raw ? JSON.parse(raw) : [];
      return json({ photos: photos.slice().reverse() });
    }

    // ── GET /api/gallery/image/* — serve image from R2 (public) ──
    if (url.pathname.startsWith('/api/gallery/image/') && request.method === 'GET') {
      const r2Key = decodeURIComponent(url.pathname.replace('/api/gallery/image/', ''));
      const object = await env.GALLERY.get(r2Key);
      if (!object) return new Response('Not found', { status: 404 });
      const headers = new Headers(corsHeaders);
      headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
      headers.set('Cache-Control', 'public, max-age=31536000');
      return new Response(object.body, { headers });
    }

    // ── POST /api/gallery/like — authenticated users ──
    if (url.pathname === '/api/gallery/like' && request.method === 'POST') {
      const tokenPayload = await verifyBearer(request.clone(), env.AUTH_HMAC_SECRET ?? '');
      if (!tokenPayload) return json({ error: 'Unauthorised' }, 401);

      let body: { photoId?: string; action?: string };
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

      const { photoId, action } = body;
      if (!photoId || !action) return json({ error: 'Missing fields' }, 400);

      const raw = await env.RESULTS.get(KV_GALLERY_KEY);
      const photos: Array<{ id: string; likes: string[] }> = raw ? JSON.parse(raw) : [];
      const photo = photos.find(p => p.id === photoId);
      if (!photo) return json({ error: 'Photo not found' }, 404);

      const username = tokenPayload.username;
      if (action === 'like' && !photo.likes.includes(username)) {
        photo.likes.push(username);
      } else if (action === 'unlike') {
        photo.likes = photo.likes.filter(u => u !== username);
      }

      await env.RESULTS.put(KV_GALLERY_KEY, JSON.stringify(photos));
      return json({ ok: true, likes: photo.likes.length });
    }

    // ── POST /api/gallery/comment — authenticated users ──
    if (url.pathname === '/api/gallery/comment' && request.method === 'POST') {
      const tokenPayload = await verifyBearer(request.clone(), env.AUTH_HMAC_SECRET ?? '');
      if (!tokenPayload) return json({ error: 'Unauthorised' }, 401);

      let body: { photoId?: string; text?: string };
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

      const text = String(body.text || '').trim().slice(0, 300);
      if (!text || !body.photoId) return json({ error: 'Missing fields' }, 400);

      const raw = await env.RESULTS.get(KV_GALLERY_KEY);
      const photos: Array<{ id: string; comments: Array<{ username: string; text: string; ts: string }> }> = raw ? JSON.parse(raw) : [];
      const photo = photos.find(p => p.id === body.photoId);
      if (!photo) return json({ error: 'Photo not found' }, 404);

      photo.comments.push({ username: tokenPayload.username, text, ts: new Date().toISOString() });

      await env.RESULTS.put(KV_GALLERY_KEY, JSON.stringify(photos));
      return json({ ok: true });
    }

    // ── DELETE /api/gallery/:id — admin only ──
    const galleryDeleteMatch = url.pathname.match(/^\/api\/gallery\/([^/]+)$/);
    if (galleryDeleteMatch && request.method === 'DELETE') {
      const tokenPayload = await verifyBearer(request.clone(), env.AUTH_HMAC_SECRET ?? '');
      if (!tokenPayload || tokenPayload.role !== 'admin') return json({ error: 'Unauthorised' }, 401);

      const photoId = galleryDeleteMatch[1];
      const raw = await env.RESULTS.get(KV_GALLERY_KEY);
      const photos: Array<{ id: string; r2Key: string }> = raw ? JSON.parse(raw) : [];
      const photo = photos.find(p => p.id === photoId);
      if (!photo) return json({ error: 'Not found' }, 404);

      await env.GALLERY.delete(photo.r2Key);
      const updated = photos.filter(p => p.id !== photoId);
      await env.RESULTS.put(KV_GALLERY_KEY, JSON.stringify(updated));
      return json({ ok: true });
    }

    // ── Static assets (everything else) ──
    const assetResponse = await env.ASSETS.fetch(request);

    // Inject version and (on staging) banner into HTML pages
    if (assetResponse.headers.get('Content-Type')?.includes('text/html')) {
      let html = await assetResponse.text();

      // Inject version into footer — applies to all environments
      const versionSuffix = `&nbsp;&middot;&nbsp; v${env.VERSION ?? 'unknown'}`;
      html = html.replace('All Rights Reserved', 'All Rights Reserved' + versionSuffix);

      // Inject staging banner — staging only
      if (url.hostname.includes('staging')) {
        const banner = `<div style="position:fixed;top:0;left:0;right:0;z-index:9999;background:#b45309;color:#fff;text-align:center;padding:8px 16px;font-family:Raleway,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.05em;">STAGING — This is not the live site. Data here is independent of production.</div><div style="height:37px"></div>`;
        html = html.replace('<body>', '<body>' + banner);
      }

      return new Response(html, {
        status: assetResponse.status,
        headers: assetResponse.headers,
      });
    }

    return assetResponse;
  },
};
