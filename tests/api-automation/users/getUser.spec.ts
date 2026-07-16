/**
 * Author: Mahiteja Bollojula
 * LinkedIn: https://www.linkedin.com/in/mahiteja-bollojula-477a60145/
 * getUser.spec.ts
 *
 * Covers: GET operations, response assertions (1.4), response chaining (1.5),
 * soft assertions (3.9), response time / SLA (3.10), Zod schema validation (3.8),
 * data-driven endpoint smoke matrix (3.7).
 */

import { test, expect }   from '../../../lib/api-fixtures';
import { UserSchema, UserListSchema } from '../../../lib/schemas/userSchema';

const BASE = 'https://jsonplaceholder.typicode.com';

// ── Single user ───────────────────────────────────────────────────────────────

test.describe('GET /users/:id', () => {

  test('returns 200 with valid User schema', async ({ usersClient }) => {
    const res = await usersClient.getUser(1);

    await expect(res).toHaveStatusCode(200);
    await expect(res).toBeSuccessfulJSON();
    await expect(res).toMatchApiSchema(UserSchema);
    await expect(res).toContainKey('id');
  });

  test('returns 404 for non-existent user', async ({ usersClient }) => {
    const res = await usersClient.getUser(9999);
    await expect(res).toHaveStatusCode(404);
  });

  test('soft-validates every field on user response', async ({ usersClient }) => {
    const res  = await usersClient.getUser(1);
    await expect(res).toHaveStatusCode(200);

    const user = await res.json() as Record<string, unknown>;

    // Soft assertions: all evaluated, all failures reported at the end
    expect.soft(user['id'],      'id is a number').toEqual(expect.any(Number));
    expect.soft(user['name'],    'name is non-empty').toBeTruthy();
    expect.soft(user['email'],   'email contains @').toMatch(/@/);
    expect.soft(user['username'],'username is defined').toBeDefined();
    expect.soft(user['phone'],   'phone is defined').toBeDefined();
    expect.soft(user['website'], 'website is defined').toBeDefined();
    expect.soft(user['address'], 'address has city').toMatchObject({
      city: expect.any(String),
    });
    expect.soft(user['company'], 'company has name').toMatchObject({
      name: expect.any(String),
    });
  });

  test('responds within 500ms SLA', async ({ apiContext }) => {
    const t0  = performance.now();
    const res = await apiContext.get('/users/1');
    await expect(res).toRespondWithin(500, t0);
    await expect(res).toHaveStatusCode(200);
  });

});

// ── User list ─────────────────────────────────────────────────────────────────

test.describe('GET /users', () => {

  test('returns all users with valid list schema', async ({ usersClient }) => {
    const res  = await usersClient.listUsers();
    const body = await res.json() as unknown[];

    await expect(res).toHaveStatusCode(200);
    await expect(res).toMatchApiSchema(UserListSchema);
    expect(body).toHaveLength(10);
  });

  test('pagination — _limit=3 returns exactly 3 users', async ({ usersClient }) => {
    const res  = await usersClient.listUsers({ _limit: 3 });
    const body = await res.json() as unknown[];

    await expect(res).toHaveStatusCode(200);
    expect(body).toHaveLength(3);
  });

});

// ── Data-driven smoke matrix (3.7) ────────────────────────────────────────────

const smokeMatrix: { path: string; expectedStatus: number }[] = [
  { path: '/users/1',    expectedStatus: 200 },
  { path: '/users/2',    expectedStatus: 200 },
  { path: '/users/10',   expectedStatus: 200 },
  { path: '/users/9999', expectedStatus: 404 },
];

test.describe('Data-driven: endpoint smoke matrix', () => {
  for (const { path, expectedStatus } of smokeMatrix) {
    test(`GET ${path} → ${expectedStatus}`, async ({ apiContext }) => {
      const res = await apiContext.get(path);
      await expect(res).toHaveStatusCode(expectedStatus);
    });
  }
});

// ── Response snapshot (3.11) ──────────────────────────────────────────────────

test('response headers match snapshot', async ({ apiContext }) => {
  const res     = await apiContext.get('/users/1');
  const headers = res.headers();

  // Stringify so Playwright treats this as a text snapshot, not a binary file
  expect(JSON.stringify({
    'content-type': headers['content-type'],
  }, null, 2)).toMatchSnapshot('user-1-headers.json');
});

test('user body matches snapshot (exclude volatile fields)', async ({ apiContext }) => {
  const res  = await apiContext.get('/users/1');
  const body = await res.json() as Record<string, unknown>;

  // Exclude any fields that might change across API versions
  const { id: _id, ...stableFields } = body;
  // Stringify before snapshotting — Playwright toMatchSnapshot needs string or Buffer
  expect(JSON.stringify(stableFields, null, 2)).toMatchSnapshot('user-1-stable-body.json');
});

// ── P95 latency across samples (3.10) ─────────────────────────────────────────

test('P95 latency across 5 samples < 800ms', async ({ apiContext }) => {
  const samples: number[] = [];

  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    await apiContext.get('/users/1');
    samples.push(performance.now() - t0);
  }

  samples.sort((a, b) => a - b);
  const p95 = samples[Math.ceil(samples.length * 0.95) - 1];
  const avg = samples.reduce((s, v) => s + v, 0) / samples.length;

  console.log(`GET /users/1 latency — avg: ${avg.toFixed(1)}ms, p95: ${p95.toFixed(1)}ms`);
  expect(p95, `P95 (${p95.toFixed(0)}ms) exceeds 800ms`).toBeLessThan(800);
});
