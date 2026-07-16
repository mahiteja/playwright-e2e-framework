/**
 * Author: Mahiteja Bollojula
 * LinkedIn: https://www.linkedin.com/in/mahiteja-bollojula-477a60145/
 * routeInterception.spec.ts
 *
 * Covers: page.route() mocking (1.7), GraphQL interception (1.9),
 * WebSocket observation and mocking (1.10), SSE stream mocking (1.11),
 * request abort for error-path testing, HAR record / replay.
 */

import { test, expect } from '../../../lib/api-fixtures';

const API      = 'https://jsonplaceholder.typicode.com';
const INTERNET = 'https://the-internet.herokuapp.com';

// ── 1.7  Fulfill with fixture data ────────────────────────────────────────────

test.describe('Request interception — fulfill', () => {

  test('mock GET /users with two fixture users', async ({ page }) => {
    const mockUsers = [
      { id: 1, name: 'Mocked Alice', email: 'alice@mock.dev' },
      { id: 2, name: 'Mocked Bob',   email: 'bob@mock.dev'   },
    ];

    await page.route(`${API}/users`, route =>
      route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify(mockUsers),
      })
    );

    await page.goto(`${API}/users`);
    const body = JSON.parse(await page.locator('body').innerText()) as typeof mockUsers;
    expect(body).toHaveLength(2);
    expect(body[0].name).toBe('Mocked Alice');
  });

  test('return 500 to exercise client error-handling path', async ({ page }) => {
    await page.route(`${API}/users`, route =>
      route.fulfill({
        status: 500,
        body:   JSON.stringify({ error: 'Internal Server Error' }),
      })
    );

    const statusCode = await page.evaluate(async () => {
      const res = await fetch('https://jsonplaceholder.typicode.com/users');
      return res.status;
    });

    expect(statusCode).toBe(500);
  });

});

// ── 1.7  Intercept + augment live response ─────────────────────────────────────

test('intercept live response and inject extra fields', async ({ page }) => {
  await page.route(`${API}/users/1`, async route => {
    const res  = await route.fetch();
    const body = await res.json() as Record<string, unknown>;

    body['_intercepted']   = true;
    body['_interceptedAt'] = new Date().toISOString();

    await route.fulfill({ response: res, body: JSON.stringify(body) });
  });

  await page.goto(`${API}/users/1`);
  const user = JSON.parse(await page.locator('body').innerText()) as Record<string, unknown>;

  expect(user['_intercepted']).toBe(true);
  expect(user['_interceptedAt']).toBeTruthy();
  expect(user['id']).toBe(1); // original fields preserved
});

// ── 1.7  Abort request to test error paths ────────────────────────────────────

test('abort request — fetch rejects on network failure', async ({ page }) => {
  await page.route(`${API}/users/99`, route => route.abort('failed'));

  const error = await page.evaluate(async () => {
    try {
      await fetch('https://jsonplaceholder.typicode.com/users/99');
      return null;
    } catch (e) {
      return (e as Error).message ?? 'fetch error';
    }
  });

  expect(error).toBeTruthy();
});

// ── 1.9  GraphQL — mock by operation name ─────────────────────────────────────

// Real public endpoint used as the mock target — Playwright intercepts before the request reaches the network
const GQL_ENDPOINT = 'https://the-internet.herokuapp.com/graphql';

const GET_USER_QUERY = `
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
    }
  }
`;

const CREATE_USER_MUTATION = `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      email
      role
    }
  }
`;

test.describe('GraphQL mocking via page.route', () => {

  test('mock GetUser query with variables returns fixture data', async ({ page }) => {
    await page.goto(INTERNET);
    await page.route('**/graphql', async route => {
      const body = JSON.parse(route.request().postData() ?? '{}') as {
        query?: string;
        variables?: Record<string, unknown>;
      };

      if (body.query?.includes('GetUser')) {
        const userId = (body.variables as { id?: number })?.id ?? 1;
        await route.fulfill({
          status:      200,
          contentType: 'application/json',
          body:        JSON.stringify({
            data: { user: { id: userId, name: 'GQL Alice', email: 'gql@test.dev' } },
          }),
        });
      } else {
        await route.continue();
      }
    });

    const result = await page.evaluate(
      async ({ endpoint, query }: { endpoint: string; query: string }) => {
        const res = await fetch(endpoint, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            query,
            variables: { id: '1' },
          }),
        });
        return res.json();
      },
      { endpoint: GQL_ENDPOINT, query: GET_USER_QUERY },
    );

    const typed = result as { data: { user: { id: number; name: string; email: string } } };
    expect(typed.data.user.name).toBe('GQL Alice');
    expect(typed.data.user.email).toBe('gql@test.dev');
  });

  test('mock CreateUser mutation returns new user', async ({ page }) => {
    await page.goto(INTERNET);
    await page.route('**/graphql', async route => {
      const body = JSON.parse(route.request().postData() ?? '{}') as {
        query?: string;
        variables?: Record<string, unknown>;
      };

      if (body.query?.includes('CreateUser')) {
        const input = (body.variables as { input?: { email?: string; role?: string } })?.input;
        await route.fulfill({
          status:      200,
          contentType: 'application/json',
          body:        JSON.stringify({
            data: { createUser: { id: 99, email: input?.email ?? 'new@test.dev', role: input?.role ?? 'VIEWER' } },
          }),
        });
      } else {
        await route.continue();
      }
    });

    const result = await page.evaluate(
      async ({ endpoint, query }: { endpoint: string; query: string }) => {
        const res = await fetch(endpoint, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            query,
            variables: { input: { email: 'pw@test.dev', role: 'VIEWER' } },
          }),
        });
        return res.json();
      },
      { endpoint: GQL_ENDPOINT, query: CREATE_USER_MUTATION },
    );

    const typed = result as { data: { createUser: { id: number; email: string; role: string } } };
    expect(typed.data.createUser.id).toBeTruthy();
    expect(typed.data.createUser.email).toBe('pw@test.dev');
    expect(typed.data.createUser.role).toBe('VIEWER');
  });

  test('GraphQL 200 with errors field — assert errors array', async ({ page }) => {
    await page.goto(INTERNET);
    await page.route('**/graphql', route =>
      route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify({
          data:   null,
          errors: [{ message: 'Field not found', locations: [{ line: 1, column: 3 }] }],
        }),
      })
    );

    const result = await page.evaluate(async (endpoint: string) => {
      const res = await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query: '{ unknownField }' }),
      });
      return res.json() as unknown;
    }, GQL_ENDPOINT);

    // HTTP 200 does NOT mean success in GraphQL — always assert errors field
    const typed = result as { data: null; errors: { message: string; locations: { line: number; column: number }[] }[] };
    expect(typed.data).toBeNull();
    expect(typed.errors).toHaveLength(1);
    expect(typed.errors[0].message).toBe('Field not found');
    expect(typed.errors[0]).toHaveProperty('locations');
  });

});

// ── 1.10  WebSocket — observe frames ─────────────────────────────────────────

test.describe('WebSocket observation', () => {

  test('capture all frames received by the page', async ({ page }) => {
    const received: string[] = [];

    page.on('websocket', ws => {
      ws.on('framereceived', event => received.push(String(event.payload)));
      ws.on('framesent',     event => console.log('[WS sent]', String(event.payload)));
    });

    await page.goto(INTERNET);

    // Attempt to connect to a public echo server.
    // The test is informational — skip gracefully if the server is unreachable
    // (common in firewalled CI environments).
    const connected = await page.evaluate(() => {
      return new Promise<boolean>(resolve => {
        try {
          const ws = new WebSocket('wss://echo.websocket.events');
          ws.onopen  = () => { ws.send('playwright-ws-test'); resolve(true); };
          ws.onerror = () => resolve(false);
          setTimeout(() => resolve(false), 3_000);
        } catch {
          resolve(false);
        }
      });
    });

    if (!connected) {
      // Echo server unreachable (CI / firewall) — pattern was exercised, skip assertion
      test.skip(true, 'WebSocket echo server unreachable in this environment');
      return;
    }

    // Give a brief window for the echo to arrive
    await page.waitForTimeout(1_000);
    expect(received.length).toBeGreaterThan(0);
    expect(typeof received[0]).toBe('string');
  });

  test('assert no unexpected WebSocket connections from the page', async ({ page }) => {
    const wsUrls: string[] = [];
    page.on('websocket', ws => wsUrls.push(ws.url()));

    await page.goto(`${API}/users`);
    await page.waitForLoadState('networkidle');

    // jsonplaceholder doesn't use WS — confirm no surprise connections
    expect(wsUrls).toHaveLength(0);
  });

});

// ── 1.11  Server-Sent Events — mock stream ───────────────────────────────────

test.describe('Server-Sent Events mocking', () => {

  test('mock SSE stream and assert all events received', async ({ page }) => {
    // Navigate to a real page first so the EventSource is same-origin (no CORS needed)
    await page.goto(INTERNET);

    await page.route(`${INTERNET}/api/stream`, async route => {
      const body = [
        'data: {"type":"start","jobId":"j-001"}\n\n',
        'data: {"type":"progress","value":40}\n\n',
        'data: {"type":"progress","value":80}\n\n',
        'data: {"type":"complete","result":"ok"}\n\n',
      ].join('');

      await route.fulfill({
        status:  200,
        headers: {
          'Content-Type':  'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection':    'keep-alive',
        },
        body,
      });
    });

    // Open an EventSource from within the page — same-origin request is intercepted by Playwright
    const events = await page.evaluate((sseUrl: string) => {
      return new Promise<object[]>(resolve => {
        const collected: object[] = [];
        const es = new EventSource(sseUrl);
        es.onmessage = (e: MessageEvent) => {
          collected.push(JSON.parse(e.data as string) as object);
          if (collected.length === 4) { es.close(); resolve(collected); }
        };
        setTimeout(() => resolve(collected), 8_000);
      });
    }, `${INTERNET}/api/stream`);

    expect(events).toHaveLength(4);
    expect(events[0]).toMatchObject({ type: 'start' });
    expect(events[3]).toMatchObject({ type: 'complete', result: 'ok' });
  });

});
