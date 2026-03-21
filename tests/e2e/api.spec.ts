/**
 * API regression tests — tests the live Worker endpoints directly via fetch.
 * No browser required. Covers auth, test isolation, and data integrity.
 */

import { test, expect } from '@playwright/test';

const BASE = 'https://rtgs-pgl.selvaraj-s.workers.dev';
const WRITE_KEY = 'rtgs-kv-w-2026';
const WRONG_KEY = 'not-the-key';

function testHeaders(extra: Record<string, string> = {}) {
  return { 'X-Test-Mode': '1', ...extra };
}

test.describe('API — Auth', () => {
  test('GET /api/results returns 200', async ({ request }) => {
    const res = await request.get(`${BASE}/api/results`, { headers: testHeaders() });
    expect(res.status()).toBe(200);
  });

  test('POST without write key returns 401', async ({ request }) => {
    const res = await request.post(`${BASE}/api/results`, {
      headers: testHeaders({ 'Content-Type': 'application/json' }),
      data: { '1': { points: { d: 1, r: 0 } } },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorised');
  });

  test('POST with wrong write key returns 401', async ({ request }) => {
    const res = await request.post(`${BASE}/api/results`, {
      headers: testHeaders({ 'Content-Type': 'application/json', 'X-Write-Key': WRONG_KEY }),
      data: { '1': { points: { d: 1, r: 0 } } },
    });
    expect(res.status()).toBe(401);
  });

  test('401 response includes CORS header', async ({ request }) => {
    const res = await request.post(`${BASE}/api/results`, {
      headers: testHeaders({ 'Content-Type': 'application/json', 'X-Write-Key': WRONG_KEY }),
      data: {},
    });
    expect(res.headers()['access-control-allow-origin']).toBe('*');
  });

  test('PUT returns 405', async ({ request }) => {
    const res = await request.put(`${BASE}/api/results`, {
      headers: testHeaders({ 'Content-Type': 'application/json', 'X-Write-Key': WRITE_KEY }),
      data: {},
    });
    expect(res.status()).toBe(405);
  });

  test('OPTIONS preflight returns 200 with CORS headers', async ({ request }) => {
    const res = await request.fetch(`${BASE}/api/results`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://rtgs-pgl.selvaraj-s.workers.dev',
        'Access-Control-Request-Method': 'POST',
      },
    });
    expect(res.status()).toBe(200);
    expect(res.headers()['access-control-allow-origin']).toBe('*');
    expect(res.headers()['access-control-allow-methods']).toContain('POST');
  });
});

test.describe('API — Test isolation', () => {
  test.beforeEach(async ({ request }) => {
    // Clean test KV key before each test
    await request.delete(`${BASE}/api/results`, {
      headers: { 'X-Write-Key': WRITE_KEY, 'X-Test-Mode': '1' },
    });
  });

  test.afterEach(async ({ request }) => {
    await request.delete(`${BASE}/api/results`, {
      headers: { 'X-Write-Key': WRITE_KEY, 'X-Test-Mode': '1' },
    });
  });

  test('POST in test mode writes and GET reads back correctly', async ({ request }) => {
    await request.post(`${BASE}/api/results`, {
      headers: testHeaders({ 'Content-Type': 'application/json', 'X-Write-Key': WRITE_KEY }),
      data: { '5': { points: { d: 1, r: 0 }, course: 'Kalhaar Blues', date: 'May 2026' } },
    });
    const res = await request.get(`${BASE}/api/results`, { headers: testHeaders() });
    const body = await res.json();
    expect(body['5']).toMatchObject({ points: { d: 1, r: 0 }, course: 'Kalhaar Blues' });
  });

  test('DELETE clears only the test KV key', async ({ request }) => {
    // Write to test key
    await request.post(`${BASE}/api/results`, {
      headers: testHeaders({ 'Content-Type': 'application/json', 'X-Write-Key': WRITE_KEY }),
      data: { '1': { points: { d: 1, r: 0 } } },
    });
    // DELETE test key
    const delRes = await request.delete(`${BASE}/api/results`, {
      headers: { 'X-Write-Key': WRITE_KEY, 'X-Test-Mode': '1' },
    });
    expect(delRes.status()).toBe(200);
    // Test key should now be empty
    const res = await request.get(`${BASE}/api/results`, { headers: testHeaders() });
    const body = await res.json();
    expect(Object.keys(body)).toHaveLength(0);
  });

  test('DELETE without test mode returns 403', async ({ request }) => {
    const res = await request.delete(`${BASE}/api/results`, {
      headers: { 'X-Write-Key': WRITE_KEY },
    });
    expect(res.status()).toBe(403);
  });

  test('POST with invalid JSON returns 400', async ({ request }) => {
    const res = await request.fetch(`${BASE}/api/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Write-Key': WRITE_KEY, 'X-Test-Mode': '1' },
      body: 'not {{ valid json',
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid JSON');
  });
});
