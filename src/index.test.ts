/**
 * RTGS PGL — Worker Unit Tests
 *
 * Tests call worker.fetch() directly with a mocked Env (in-memory KV store).
 * No miniflare / workerd runtime required — runs in standard Node.js via Vitest.
 *
 * Persona coverage:
 *   Fan / Guest  — read-only (GET only, no write key)
 *   Admin        — full read + write with correct write key
 *   Captain      — same write access as Admin (shared key)
 *
 * Additional coverage:
 *   API edge cases  — wrong key, bad JSON, wrong method, CORS preflight
 *   Data integrity  — merge behaviour, overwrite, all 40 matches
 */

import { describe, it, expect, beforeEach } from 'vitest';
import worker from './index';

// ── Constants ────────────────────────────────────────────────────────────────

const WRITE_KEY = 'rtgs-kv-w-2026';
const WRONG_KEY = 'not-the-key';
const KV_KEY    = 'season3_results';

// ── Mock Env ─────────────────────────────────────────────────────────────────

/** In-memory KV store matching the KVNamespace interface used by the worker */
function makeKV(): KVNamespace {
  const store = new Map<string, string>();
  return {
    async get(key: string)               { return store.get(key) ?? null; },
    async put(key: string, val: string)  { store.set(key, val); },
    async delete(key: string)            { store.delete(key); },
    async list()                         { return { keys: [], list_complete: true, cursor: '' } as KVNamespaceListResult<unknown, string>; },
    async getWithMetadata()              { return { value: null, metadata: null, cacheStatus: null }; },
  } as unknown as KVNamespace;
}

/** Minimal ASSETS binding — just returns 200 for any static request */
function makeAssets(): Fetcher {
  return { fetch: async () => new Response('static', { status: 200 }) } as unknown as Fetcher;
}

/** Minimal ExecutionContext — worker doesn't call waitUntil so this is sufficient */
function makeCtx(): ExecutionContext {
  return { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;
}

function makeEnv(writeKey = WRITE_KEY): { RESULTS: KVNamespace; WRITE_KEY: string; ASSETS: Fetcher } {
  return { RESULTS: makeKV(), WRITE_KEY: writeKey, ASSETS: makeAssets() };
}

// ── Request helpers ──────────────────────────────────────────────────────────

function getResults(env: ReturnType<typeof makeEnv>): Promise<Response> {
  return worker.fetch(new Request('http://localhost/api/results'), env, makeCtx());
}

function postResults(
  body: unknown,
  env: ReturnType<typeof makeEnv>,
  key: string | null = WRITE_KEY,
): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (key !== null) headers['X-Write-Key'] = key;
  return worker.fetch(
    new Request('http://localhost/api/results', {
      method: 'POST', headers, body: JSON.stringify(body),
    }),
    env,
    makeCtx(),
  );
}

// ── Fan / Guest persona ──────────────────────────────────────────────────────

describe('Fan / Guest persona', () => {
  it('GET /api/results returns 200 with empty object when no results exist', async () => {
    const env = makeEnv();
    const res = await getResults(env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({});
  });

  it('GET /api/results returns stored results', async () => {
    const env = makeEnv();
    const stored = { '1': { points: { d: 1, r: 0 }, course: 'Prestige GC', date: 'Apr 2026' } };
    await env.RESULTS.put(KV_KEY, JSON.stringify(stored));
    const data = await getResults(env).then(r => r.json());
    expect(data).toMatchObject(stored);
  });

  it('GET /api/results returns JSON content-type', async () => {
    const res = await getResults(makeEnv());
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });

  it('GET /api/results includes CORS header', async () => {
    const res = await getResults(makeEnv());
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('POST without write key returns 401 Unauthorised', async () => {
    const res = await postResults({ '1': { points: { d: 1, r: 0 } } }, makeEnv(), null);
    expect(res.status).toBe(401);
    expect((await res.json() as { error: string }).error).toBe('Unauthorised');
  });

  it('POST with wrong write key returns 401 Unauthorised', async () => {
    const res = await postResults({ '1': { points: { d: 1, r: 0 } } }, makeEnv(), WRONG_KEY);
    expect(res.status).toBe(401);
  });

  it('401 response includes CORS header so browser can read the error', async () => {
    const res = await postResults({ '1': { points: { d: 1, r: 0 } } }, makeEnv(), WRONG_KEY);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});

// ── Admin persona ────────────────────────────────────────────────────────────

describe('Admin persona', () => {
  let env: ReturnType<typeof makeEnv>;
  beforeEach(() => { env = makeEnv(); });

  it('POST with correct write key returns 200 { ok: true }', async () => {
    const res = await postResults({ '5': { points: { d: 1, r: 0 } } }, env);
    expect(res.status).toBe(200);
    expect((await res.json() as { ok: boolean }).ok).toBe(true);
  });

  it('written result is immediately readable via GET', async () => {
    await postResults({ '5': { points: { d: 1, r: 0 }, course: 'Kalhaar Blues', date: 'May 2026' } }, env);
    const data = await getResults(env).then(r => r.json() as Record<string, unknown>);
    expect(data['5']).toMatchObject({ points: { d: 1, r: 0 }, course: 'Kalhaar Blues' });
  });

  it('can record a Team D win (d:1 r:0)', async () => {
    await postResults({ '1': { points: { d: 1, r: 0 } } }, env);
    const data = await getResults(env).then(r => r.json() as Record<string, { points: { d: number; r: number } }>);
    expect(data['1'].points).toEqual({ d: 1, r: 0 });
  });

  it('can record a Team R win (d:0 r:1)', async () => {
    await postResults({ '2': { points: { d: 0, r: 1 } } }, env);
    const data = await getResults(env).then(r => r.json() as Record<string, { points: { d: number; r: number } }>);
    expect(data['2'].points).toEqual({ d: 0, r: 1 });
  });

  it('can record a halved match (d:0.5 r:0.5)', async () => {
    await postResults({ '3': { points: { d: 0.5, r: 0.5 } } }, env);
    const data = await getResults(env).then(r => r.json() as Record<string, { points: { d: number; r: number } }>);
    expect(data['3'].points).toEqual({ d: 0.5, r: 0.5 });
  });

  it('can record a singles match with net score', async () => {
    await postResults({ '25': { points: { d: 1, r: 0 }, netScore: '3&2' } }, env);
    const data = await getResults(env).then(r => r.json() as Record<string, unknown>);
    expect(data['25']).toMatchObject({ netScore: '3&2', points: { d: 1, r: 0 } });
  });

  it('can record a singles halve with "All Square" net score', async () => {
    await postResults({ '26': { points: { d: 0.5, r: 0.5 }, netScore: 'A/S' } }, env);
    const data = await getResults(env).then(r => r.json() as Record<string, unknown>);
    expect(data['26']).toMatchObject({ netScore: 'A/S', points: { d: 0.5, r: 0.5 } });
  });

  it('can update course and date fields', async () => {
    await postResults({ '7': { points: { d: 1, r: 0 }, course: 'Classic Golf', date: 'Jun 2026' } }, env);
    const data = await getResults(env).then(r => r.json() as Record<string, unknown>);
    expect(data['7']).toMatchObject({ course: 'Classic Golf', date: 'Jun 2026' });
  });

  it('merges new results without overwriting previous entries', async () => {
    await postResults({ '1': { points: { d: 1, r: 0 } } }, env);
    await postResults({ '2': { points: { d: 0, r: 1 } } }, env);
    const data = await getResults(env).then(r => r.json() as Record<string, unknown>);
    expect(data['1']).toBeDefined();
    expect(data['2']).toBeDefined();
  });

  it('can overwrite (correct) a previously recorded result', async () => {
    await postResults({ '1': { points: { d: 1, r: 0 } } }, env);
    await postResults({ '1': { points: { d: 0.5, r: 0.5 } } }, env); // correction
    const data = await getResults(env).then(r => r.json() as Record<string, { points: { d: number; r: number } }>);
    expect(data['1'].points).toEqual({ d: 0.5, r: 0.5 });
  });

  it('POSTing null for a match id clears that match from KV', async () => {
    await postResults({ '1': { points: { d: 1, r: 0 } } }, env);
    await postResults({ '1': null }, env);
    const data = await getResults(env).then(r => r.json() as Record<string, unknown>);
    expect(data['1']).toBeUndefined();
  });

  it('clearing one match does not affect other stored results', async () => {
    await postResults({ '1': { points: { d: 1, r: 0 } } }, env);
    await postResults({ '2': { points: { d: 0, r: 1 } } }, env);
    await postResults({ '1': null }, env);
    const data = await getResults(env).then(r => r.json() as Record<string, unknown>);
    expect(data['1']).toBeUndefined();
    expect(data['2']).toBeDefined();
  });

  it('can record results for all 40 matches in a single POST', async () => {
    const payload: Record<string, unknown> = {};
    for (let i = 1; i <= 40; i++) payload[String(i)] = { points: { d: 1, r: 0 } };
    await postResults(payload, env);
    const data = await getResults(env).then(r => r.json() as Record<string, unknown>);
    expect(Object.keys(data)).toHaveLength(40);
  });
});

// ── Captain persona ──────────────────────────────────────────────────────────

describe('Captain persona (shared write key)', () => {
  it('Captain D can write a singles result with the shared write key', async () => {
    const env = makeEnv();
    const res = await postResults({ '25': { points: { d: 1, r: 0 }, netScore: '2 Up' } }, env);
    expect(res.status).toBe(200);
    expect((await res.json() as { ok: boolean }).ok).toBe(true);
  });

  it('Captain R can write a singles result with the shared write key', async () => {
    const env = makeEnv();
    const res = await postResults({ '26': { points: { d: 0, r: 1 }, netScore: '3&2' } }, env);
    expect(res.status).toBe(200);
    expect((await res.json() as { ok: boolean }).ok).toBe(true);
  });

  it('results from both captains coexist in KV without conflict', async () => {
    const env = makeEnv();
    await postResults({ '25': { points: { d: 1, r: 0 }, netScore: '2 Up' } }, env);   // Captain D
    await postResults({ '26': { points: { d: 0, r: 1 }, netScore: '3&2' } }, env);   // Captain R
    const data = await getResults(env).then(r => r.json() as Record<string, unknown>);
    expect(data['25']).toMatchObject({ points: { d: 1, r: 0 } });
    expect(data['26']).toMatchObject({ points: { d: 0, r: 1 } });
  });

  it('Captain cannot write with wrong key', async () => {
    const env = makeEnv();
    const res = await postResults({ '25': { points: { d: 1, r: 0 } } }, env, WRONG_KEY);
    expect(res.status).toBe(401);
  });

  it('Captain can read all results without a write key (GET is public)', async () => {
    const env = makeEnv();
    await postResults({ '1': { points: { d: 1, r: 0 } } }, env);
    const res = await getResults(env);
    expect(res.status).toBe(200);
    const data = await res.json() as Record<string, unknown>;
    expect(data['1']).toBeDefined();
  });
});

// ── API edge cases ───────────────────────────────────────────────────────────

describe('API edge cases', () => {
  it('POST with invalid JSON body returns 400', async () => {
    const env = makeEnv();
    const res = await worker.fetch(
      new Request('http://localhost/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Write-Key': WRITE_KEY },
        body: 'not {{ valid json',
      }),
      env,
      makeCtx(),
    );
    expect(res.status).toBe(400);
    expect((await res.json() as { error: string }).error).toBe('Invalid JSON');
  });

  it('PUT /api/results returns 405 Method Not Allowed', async () => {
    const env = makeEnv();
    const res = await worker.fetch(
      new Request('http://localhost/api/results', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Write-Key': WRITE_KEY },
        body: '{}',
      }),
      env,
      makeCtx(),
    );
    expect(res.status).toBe(405);
  });

  it('DELETE without write key returns 401', async () => {
    const env = makeEnv();
    const res = await worker.fetch(
      new Request('http://localhost/api/results', { method: 'DELETE' }),
      env,
      makeCtx(),
    );
    expect(res.status).toBe(401);
  });

  it('DELETE with write key but without test mode returns 403', async () => {
    const env = makeEnv();
    const res = await worker.fetch(
      new Request('http://localhost/api/results', {
        method: 'DELETE',
        headers: { 'X-Write-Key': WRITE_KEY },
      }),
      env,
      makeCtx(),
    );
    expect(res.status).toBe(403);
    expect((await res.json() as { error: string }).error).toBe('DELETE only permitted in test mode');
  });

  it('OPTIONS preflight returns 200 with CORS headers', async () => {
    const env = makeEnv();
    const res = await worker.fetch(
      new Request('http://localhost/api/results', { method: 'OPTIONS' }),
      env,
      makeCtx(),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(res.headers.get('Access-Control-Allow-Headers')).toContain('X-Write-Key');
  });

  it('non-API route is forwarded to ASSETS and returns 200', async () => {
    const env = makeEnv();
    const res = await worker.fetch(
      new Request('http://localhost/'),
      env,
      makeCtx(),
    );
    expect(res.status).toBe(200);
  });

  it('non-API subroute is forwarded to ASSETS', async () => {
    const env = makeEnv();
    const res = await worker.fetch(
      new Request('http://localhost/season3'),
      env,
      makeCtx(),
    );
    expect(res.status).toBe(200);
  });
});

// ── Dual-captain approval data ───────────────────────────────────────────────

describe('Dual-captain approval data', () => {
  let env: ReturnType<typeof makeEnv>;
  beforeEach(() => { env = makeEnv(); });

  it('captain can POST a pending result with status and submittedBy fields', async () => {
    const payload = {
      '5': {
        points: { d: 1, r: 0 },
        status: 'pending',
        submittedBy: 'captain.d',
        submittedAt: '2026-03-21T10:00:00.000Z',
        course: 'Prestige GC',
        date: 'Mar 2026',
      },
    };
    const res = await postResults(payload, env);
    expect(res.status).toBe(200);
  });

  it('pending result is stored and returned verbatim via GET', async () => {
    const payload = {
      '5': {
        points: { d: 1, r: 0 },
        status: 'pending',
        submittedBy: 'captain.d',
        submittedAt: '2026-03-21T10:00:00.000Z',
      },
    };
    await postResults(payload, env);
    const data = await getResults(env).then(r => r.json() as Record<string, unknown>);
    expect(data['5']).toMatchObject({ status: 'pending', submittedBy: 'captain.d' });
  });

  it('pending result can be overwritten to confirmed by admin', async () => {
    // Captain submits as pending
    await postResults({
      '5': { points: { d: 1, r: 0 }, status: 'pending', submittedBy: 'captain.d' },
    }, env);
    // Admin confirms
    await postResults({
      '5': { points: { d: 1, r: 0 }, status: 'confirmed' },
    }, env);
    const data = await getResults(env).then(r => r.json() as Record<string, { status: string }>);
    expect(data['5'].status).toBe('confirmed');
  });

  it('disputed result can be overwritten to confirmed', async () => {
    await postResults({
      '6': { points: { d: 0, r: 1 }, status: 'disputed', submittedBy: 'captain.d' },
    }, env);
    await postResults({
      '6': { points: { d: 0, r: 1 }, status: 'confirmed' },
    }, env);
    const data = await getResults(env).then(r => r.json() as Record<string, { status: string }>);
    expect(data['6'].status).toBe('confirmed');
  });

  it('legacy result with no status field is returned as-is (no status key)', async () => {
    // Simulate a legacy result written without a status field
    await env.RESULTS.put(KV_KEY, JSON.stringify({
      '3': { points: { d: 0.5, r: 0.5 }, course: 'Classic GC', date: 'Jan 2026' },
    }));
    const data = await getResults(env).then(r => r.json() as Record<string, { status?: string }>);
    expect(data['3'].status).toBeUndefined(); // worker passes through unchanged
    expect(data['3']).toMatchObject({ points: { d: 0.5, r: 0.5 } });
  });

  it('pending result can be cleared (set to null)', async () => {
    await postResults({
      '7': { points: { d: 1, r: 0 }, status: 'pending', submittedBy: 'captain.d' },
    }, env);
    await postResults({ '7': null }, env);
    const data = await getResults(env).then(r => r.json() as Record<string, unknown>);
    expect(data['7']).toBeUndefined();
  });
});

// ── Test Mode (X-Test-Mode: 1) ───────────────────────────────────────────────

describe('Test mode (X-Test-Mode: 1)', () => {
  let env: ReturnType<typeof makeEnv>;
  beforeEach(() => { env = makeEnv(); });

  function getTestMode(e: ReturnType<typeof makeEnv>) {
    return worker.fetch(
      new Request('http://localhost/api/results', { headers: { 'X-Test-Mode': '1' } }),
      e, makeCtx(),
    );
  }

  function postTestMode(body: unknown, e: ReturnType<typeof makeEnv>) {
    return worker.fetch(
      new Request('http://localhost/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Write-Key': WRITE_KEY, 'X-Test-Mode': '1' },
        body: JSON.stringify(body),
      }),
      e, makeCtx(),
    );
  }

  function deleteTestMode(e: ReturnType<typeof makeEnv>) {
    return worker.fetch(
      new Request('http://localhost/api/results', {
        method: 'DELETE',
        headers: { 'X-Write-Key': WRITE_KEY, 'X-Test-Mode': '1' },
      }),
      e, makeCtx(),
    );
  }

  it('GET in test mode returns empty object when no test results stored', async () => {
    const res = await getTestMode(env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({});
  });

  it('POST in test mode writes to isolated test KV key', async () => {
    await postTestMode({ '1': { points: { d: 1, r: 0 } } }, env);
    const testData = await getTestMode(env).then(r => r.json() as Record<string, unknown>);
    expect(testData['1']).toBeDefined();
  });

  it('test mode writes do not affect production KV key', async () => {
    await postTestMode({ '1': { points: { d: 1, r: 0 } } }, env);
    const prodData = await getResults(env).then(r => r.json() as Record<string, unknown>);
    expect(prodData['1']).toBeUndefined();
  });

  it('production writes do not affect test KV key', async () => {
    await postResults({ '1': { points: { d: 1, r: 0 } } }, env);
    const testData = await getTestMode(env).then(r => r.json() as Record<string, unknown>);
    expect(testData['1']).toBeUndefined();
  });

  it('DELETE in test mode with write key returns 200 { ok: true }', async () => {
    await postTestMode({ '1': { points: { d: 1, r: 0 } } }, env);
    const res = await deleteTestMode(env);
    expect(res.status).toBe(200);
    expect((await res.json() as { ok: boolean }).ok).toBe(true);
  });

  it('DELETE in test mode clears only the test KV key', async () => {
    await postResults({ '99': { points: { d: 1, r: 0 } } }, env);  // prod data
    await postTestMode({ '1': { points: { d: 1, r: 0 } } }, env);   // test data
    await deleteTestMode(env);
    // test key should be empty
    const testData = await getTestMode(env).then(r => r.json() as Record<string, unknown>);
    expect(Object.keys(testData)).toHaveLength(0);
    // prod key should be untouched
    const prodData = await getResults(env).then(r => r.json() as Record<string, unknown>);
    expect(prodData['99']).toBeDefined();
  });

  it('DELETE in test mode without write key returns 401', async () => {
    const res = await worker.fetch(
      new Request('http://localhost/api/results', {
        method: 'DELETE',
        headers: { 'X-Test-Mode': '1' },
      }),
      env, makeCtx(),
    );
    expect(res.status).toBe(401);
  });
});
