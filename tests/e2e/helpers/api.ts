/**
 * API helpers for E2E tests.
 *
 * All write operations use X-Test-Mode: 1 to route KV reads/writes
 * to the isolated 'season3_results_test' key, keeping prod data clean.
 */

const WRITE_KEY = 'rtgs-kv-w-2026';

export async function apiGet(baseURL: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${baseURL}/api/results`, {
    headers: { 'X-Test-Mode': '1' },
  });
  return res.json() as Promise<Record<string, unknown>>;
}

export async function apiPost(
  baseURL: string,
  body: Record<string, unknown>,
): Promise<{ ok?: boolean; error?: string }> {
  const res = await fetch(`${baseURL}/api/results`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Write-Key': WRITE_KEY,
      'X-Test-Mode': '1',
    },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<{ ok?: boolean; error?: string }>;
}

export async function apiDelete(baseURL: string): Promise<void> {
  await fetch(`${baseURL}/api/results`, {
    method: 'DELETE',
    headers: { 'X-Write-Key': WRITE_KEY, 'X-Test-Mode': '1' },
  });
}
