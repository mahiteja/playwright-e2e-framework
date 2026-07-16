/**
 * Author: Mahiteja Bollojula
 * LinkedIn: https://www.linkedin.com/in/mahiteja-bollojula-477a60145/
 * apiSeedUiVerify.spec.ts
 *
 * Covers: UI + API hybrid testing (1.8) — the three core patterns:
 *
 *  Pattern 1 — API seed → UI verify:
 *    Create test data via API (fast, no UI form fill), then verify the UI renders it.
 *
 *  Pattern 2 — API auth → browser navigation:
 *    Authenticate via API request, persist session cookies, then navigate
 *    the browser using the established session — no UI login page.
 *
 *  Pattern 3 — UI interaction + API teardown:
 *    Exercise a UI flow, then clean up the test data via API in a finally block
 *    to guarantee teardown even if the UI assertion fails.
 *
 *  Pattern 4 — API call while browser session is live:
 *    Use page.request to call protected endpoints that share the browser's
 *    cookie jar — verifies the same session is active for both.
 */

import { test, expect } from '../../../lib/api-fixtures';

const API = 'https://jsonplaceholder.typicode.com';

// ── Pattern 1: API seed → UI verify ──────────────────────────────────────────

test('Pattern 1 — create post via API, verify UI renders it', async ({
  request,
  page,
}) => {
  // ── Setup: seed test data via API — no UI form required ──
  const createRes = await request.post(`${API}/posts`, {
    data: { title: 'Hybrid Test Post', body: 'Seeded via API', userId: 1 },
  });
  expect(createRes.status()).toBe(201);
  const { id: postId } = await createRes.json() as { id: number };
  expect(postId).toBeGreaterThan(0);

  // ── Mock the page's data fetch so we control what the UI "sees" ──
  // (In a real app the backend persists the record; we mock here for demo)
  await page.route(`${API}/posts/${postId}`, route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: postId,
        title: 'Hybrid Test Post',
        body: 'Seeded via API',
        userId: 1,
      }),
    })
  );

  // ── UI: navigate to the resource page ────────────────────────
  await page.goto(`${API}/posts/${postId}`);
  const rendered = JSON.parse(await page.locator('body').innerText()) as {
    id: number;
    title: string;
  };

  expect(rendered.title).toBe('Hybrid Test Post');
  expect(rendered.id).toBe(postId);
});

// ── Pattern 2: API auth → browser navigation ─────────────────────────────────

test('Pattern 2 — authenticate via API, reuse session in browser', async ({
  playwright,
  page,
}) => {
  // ── Step 1: Perform login via API ─────────────────────────────
  const loginCtx = await playwright.request.newContext({
    baseURL: 'https://httpbin.org',
  });
  // httpbin /cookies/set sets a cookie and redirects to /cookies
  await loginCtx.get('/cookies/set?auth_token=sess-hybrid-abc');
  const savedState = await loginCtx.storageState();
  await loginCtx.dispose();

  // ── Step 2: Inject the API-obtained cookies into the browser ──
  await page.context().addCookies(
    savedState.cookies.map(c => ({
      ...c,
      domain: c.domain || 'httpbin.org',
      path: c.path || '/',
    }))
  );

  // ── Step 3: Navigate — browser carries the session ────────────
  await page.goto('https://httpbin.org/cookies');
  const body = JSON.parse(await page.locator('body').innerText()) as {
    cookies: Record<string, string>;
  };

  expect(body.cookies['auth_token']).toBe('sess-hybrid-abc');
});

// ── Pattern 3: UI test + API teardown in finally ──────────────────────────────

test('Pattern 3 — UI interaction with guaranteed API teardown', async ({
  request,
  page,
}) => {
  // ── Setup: create a todo via API ───────────────────────────────
  const createRes = await request.post(`${API}/todos`, {
    data: { title: 'Hybrid teardown todo', completed: false, userId: 1 },
  });
  expect(createRes.status()).toBe(201);
  const { id: todoId } = await createRes.json() as { id: number };

  try {
    // ── UI: mock the page to show our created todo ────────────────
    await page.route(`${API}/todos/${todoId}`, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: todoId,
          title: 'Hybrid teardown todo',
          completed: false,
          userId: 1,
        }),
      })
    );

    await page.goto(`${API}/todos/${todoId}`);
    const todo = JSON.parse(await page.locator('body').innerText()) as {
      title: string;
      completed: boolean;
    };

    expect(todo.title).toBe('Hybrid teardown todo');
    expect(todo.completed).toBe(false);

  } finally {
    // ── Teardown runs even if the UI assertion fails ───────────────
    const deleteRes = await request.delete(`${API}/todos/${todoId}`);
    expect(deleteRes.status()).toBe(200);
  }
});

// ── Pattern 4: page.request shares the browser's cookie jar ──────────────────

test('Pattern 4 — page.request and page share the same session', async ({
  page,
}) => {
  // Navigate once to establish the origin in the browser context
  await page.goto(`${API}/users/1`);

  // page.request uses the same cookie jar and session as the browser tab
  const apiRes = await page.request.get(`${API}/users/1`);
  expect(apiRes.status()).toBe(200);

  const user = await apiRes.json() as { id: number; name: string };
  expect(user.id).toBe(1);
  expect(user.name).toBeTruthy();

  // Verify the UI and API see the same data
  const uiText = await page.locator('body').innerText();
  const uiUser = JSON.parse(uiText) as { id: number; name: string };
  expect(uiUser.id).toBe(user.id);
  expect(uiUser.name).toBe(user.name);
});
