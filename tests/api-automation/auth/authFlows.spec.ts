/**
 * Author: Mahiteja Bollojula
 * LinkedIn: https://www.linkedin.com/in/mahiteja-bollojula-477a60145/
 * authFlows.spec.ts
 *
 * Covers every auth mechanism from Section 2 of the playbook:
 *  2.1  API Key (header)
 *  2.1  API Key (query param)
 *  2.2  Basic Auth
 *  2.3  Bearer / JWT
 *  2.4  OAuth 2.0 — Client Credentials (skipped without token server)
 *  2.5  OAuth 2.0 — Authorization Code (skipped without PKCE server)
 *  2.6  Cookie session auth + storageState reuse
 *  2.7  NTLM / Windows Auth (skipped without NTLM server)
 *  2.8  mTLS (skipped without client certificates)
 *  2.9  storageState — save to file and reload
 *
 * Uses httpbin.org to echo request headers back, allowing assertions
 * on exactly what auth material was transmitted.
 */

import * as fs   from 'fs';
import * as path from 'path';

import { test, expect }           from '../../../lib/api-fixtures';
import { loadEnv }                from '../../../lib/utils/envLoader';
import { bearerHeader, basicAuthHeader, apiKeyHeader, apiKeyParam } from '../../../lib/auth/bearerAuth';
import { clientCredentialsGrant, authorizationCodeGrant }           from '../../../lib/auth/oauth2';
import { singleMtlsOptions }      from '../../../lib/auth/mtls';

const HTTPBIN = 'https://httpbin.org';
const env     = loadEnv();

// ── 2.1  API Key — header ─────────────────────────────────────────────────────

test('2.1 API Key header — present in echoed headers', async ({ request }) => {
  const res = await request.get(`${HTTPBIN}/headers`, {
    headers: apiKeyHeader('pw-test-key-abc123'),
  });
  expect(res.status()).toBe(200);

  const { headers } = await res.json() as { headers: Record<string, string> };
  // httpbin normalises header names to title-case
  expect(headers['X-Api-Key']).toBe('pw-test-key-abc123');
});

// ── 2.1  API Key — query param ────────────────────────────────────────────────

test('2.1 API Key query param — present in echoed args', async ({ request }) => {
  const res = await request.get(`${HTTPBIN}/get`, {
    params: apiKeyParam('qp-key-456'),
  });
  expect(res.status()).toBe(200);

  const body = await res.json() as { args: Record<string, string> };
  expect(body.args['api_key']).toBe('qp-key-456');
});

// ── 2.2  Basic Auth ───────────────────────────────────────────────────────────

test('2.2 Basic Auth — httpbin verifies credentials', async ({ request }) => {
  const res = await request.get(`${HTTPBIN}/basic-auth/testuser/testpass`, {
    headers: basicAuthHeader('testuser', 'testpass'),
  });
  expect(res.status()).toBe(200);

  const body = await res.json() as { authenticated: boolean; user: string };
  expect(body.authenticated).toBe(true);
  expect(body.user).toBe('testuser');
});

test('2.2 Basic Auth — wrong password returns 401', async ({ request }) => {
  const res = await request.get(`${HTTPBIN}/basic-auth/testuser/testpass`, {
    headers: basicAuthHeader('testuser', 'wrongpass'),
    failOnStatusCode: false,
  });
  expect(res.status()).toBe(401);
});

// ── 2.3  Bearer / JWT ─────────────────────────────────────────────────────────

test('2.3 Bearer token — httpbin verifies token presence', async ({ request }) => {
  const token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.demo-payload';
  const res   = await request.get(`${HTTPBIN}/bearer`, {
    headers: bearerHeader(token),
  });
  expect(res.status()).toBe(200);

  const body = await res.json() as { authenticated: boolean; token: string };
  expect(body.authenticated).toBe(true);
  expect(body.token).toBe(token);
});

test('2.3 Bearer — missing token returns 401', async ({ request }) => {
  const res = await request.get(`${HTTPBIN}/bearer`, {
    failOnStatusCode: false,
  });
  expect(res.status()).toBe(401);
});

// ── 2.4  OAuth 2.0 — Client Credentials ──────────────────────────────────────

test('2.4 OAuth2 Client Credentials — fetches access_token', async ({ playwright }) => {
  test.skip(!env.OAUTH_TOKEN_URL || !env.OAUTH_CLIENT_ID, 'OAUTH_TOKEN_URL / OAUTH_CLIENT_ID not configured');

  const tokenCtx = await playwright.request.newContext();
  try {
    const token = await clientCredentialsGrant(
      tokenCtx,
      env.OAUTH_TOKEN_URL,
      env.OAUTH_CLIENT_ID,
      env.OAUTH_CLIENT_SECRET,
      'api:read'
    );
    expect(token.access_token).toBeTruthy();
    expect(token.token_type.toLowerCase()).toBe('bearer');

    // Use the access token to call a protected endpoint
    const apiCtx = await playwright.request.newContext({
      baseURL:          env.BASE_URL,
      extraHTTPHeaders: bearerHeader(token.access_token),
    });
    const res = await apiCtx.get('/users/1');
    expect(res.status()).toBe(200);
    await apiCtx.dispose();
  } finally {
    await tokenCtx.dispose();
  }
});

// ── 2.5  OAuth 2.0 — Authorization Code (pattern demonstration) ──────────────

test('2.5 OAuth2 Auth Code — token exchange structure is correct', async ({ playwright }) => {
  test.skip(true, 'Requires a running PKCE-capable authorization server');

  // Pattern: browser navigates to /authorize → user logs in → redirect with code
  // Then exchange the code for tokens server-side:
  const ctx   = await playwright.request.newContext();
  const token = await authorizationCodeGrant(
    ctx,
    env.OAUTH_TOKEN_URL,
    env.OAUTH_CLIENT_ID,
    'auth-code-from-redirect',
    'https://localhost/callback',
    'pkce-code-verifier'
  );
  expect(token.access_token).toBeTruthy();
  await ctx.dispose();
});

// ── 2.6  Cookie session + storageState ────────────────────────────────────────

test('2.6 Cookie session — storageState persists cookies across contexts', async ({ playwright }) => {
  // Step 1: "Login" — set a session cookie via httpbin
  const loginCtx = await playwright.request.newContext({ baseURL: HTTPBIN });
  await loginCtx.get('/cookies/set?session_token=sess-abc-123');
  const savedState = await loginCtx.storageState();
  await loginCtx.dispose();

  // Verify the cookie was captured
  const sessionCookie = savedState.cookies.find(c => c.name === 'session_token');
  expect(sessionCookie).toBeDefined();
  expect(sessionCookie?.value).toBe('sess-abc-123');

  // Step 2: Reuse session in a brand-new context — no re-login
  const sessionCtx = await playwright.request.newContext({
    baseURL:      HTTPBIN,
    storageState: savedState,
  });
  const res  = await sessionCtx.get('/cookies');
  const body = await res.json() as { cookies: Record<string, string> };
  expect(body.cookies['session_token']).toBe('sess-abc-123');
  await sessionCtx.dispose();
});

// ── 2.7  NTLM / Windows Auth ──────────────────────────────────────────────────

test('2.7 NTLM — httpCredentials are attached to context', async ({ playwright }) => {
  test.skip(!env.NTLM_URL, 'NTLM_URL not configured');

  const ctx = await playwright.request.newContext({
    httpCredentials: {
      username: env.NTLM_USER,
      password: env.NTLM_PASS,
      // Playwright handles NTLM challenge-response automatically
    },
  });
  const res = await ctx.get(env.NTLM_URL);
  // NTLM server returns 200 when credentials are valid
  expect(res.status()).toBe(200);
  await ctx.dispose();
});

// ── 2.8  Mutual TLS ───────────────────────────────────────────────────────────

test('2.8 mTLS — client certificate is sent', async ({ playwright }) => {
  const mtlsOpts = singleMtlsOptions({
    origin:   env.MTLS_ORIGIN || 'https://client.badssl.com',
    certPath: env.MTLS_CERT_PATH,
    keyPath:  env.MTLS_KEY_PATH,
    caPath:   env.MTLS_CA_PATH || undefined,
  });

  if (!mtlsOpts.clientCertificates?.length) {
    test.skip(true, 'mTLS certificate files not found — run: npm run cert:generate');
    return;
  }

  const ctx = await playwright.request.newContext(mtlsOpts);
  const res = await ctx.get(env.MTLS_ORIGIN || 'https://client.badssl.com/');
  expect([200, 204]).toContain(res.status());
  await ctx.dispose();
});

// ── 2.9  storageState — save to file and reload ───────────────────────────────

test('2.9 storageState — write to file then restore', async ({ playwright }) => {
  const stateFile = path.resolve(env.STORAGE_STATE_PATH);

  // Ensure the directory exists
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });

  // Step 1: Create context, set a cookie, save to file
  const ctx1 = await playwright.request.newContext({ baseURL: HTTPBIN });
  await ctx1.get('/cookies/set?auth=tok-xyz-789');
  await ctx1.storageState({ path: stateFile });
  await ctx1.dispose();

  // Step 2: Recreate from file — verify cookies survive a full process restart
  const ctx2 = await playwright.request.newContext({
    baseURL:      HTTPBIN,
    storageState: stateFile,
  });
  const res  = await ctx2.get('/cookies');
  const body = await res.json() as { cookies: Record<string, string> };
  expect(body.cookies['auth']).toBe('tok-xyz-789');
  await ctx2.dispose();
});
