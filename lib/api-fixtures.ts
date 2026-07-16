/**
 * Author: Mahiteja Bollojula
 * LinkedIn: https://www.linkedin.com/in/mahiteja-bollojula-477a60145/
 * api-fixtures.ts
 *
 * Central fixture module. All API tests import { test, expect } from here.
 *
 * Fixtures provided:
 *  apiContext   — Isolated APIRequestContext with env baseURL + YAML headers + auth
 *  usersClient  — UsersClient backed by apiContext
 *  authHeaders  — Plain Record with the resolved auth header(s) for the active env
 *
 * All standard Playwright fixtures (page, browser, context, playwright, request)
 * remain available because test.extend() inherits them from the base test object.
 */

import { test as base, expect as baseExpect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

import { UsersClient } from './clients/UsersClient';
import { loadEnv }     from './utils/envLoader';
import { loadHeaders } from './utils/headerLoader';

// Register custom matchers as a side-effect — once on module load
import './matchers/customMatchers';

// ── Auth header resolver ──────────────────────────────────────────────────────

function resolveAuthHeaders(): Record<string, string> {
  const env     = loadEnv();
  const headers: Record<string, string> = {};

  if (env.BEARER_TOKEN) {
    // Bearer token takes priority (may have been fetched by a global-setup)
    headers['Authorization'] = `Bearer ${env.BEARER_TOKEN}`;
  } else if (env.API_KEY) {
    headers['X-API-Key'] = env.API_KEY;
  } else if (env.BASIC_USER && env.BASIC_PASS) {
    const encoded = Buffer.from(`${env.BASIC_USER}:${env.BASIC_PASS}`).toString('base64');
    headers['Authorization'] = `Basic ${encoded}`;
  }
  // NTLM and mTLS are handled per-context in their respective test files

  return headers;
}

// ── Fixture type map ──────────────────────────────────────────────────────────

interface ApiFixtures {
  /** Isolated request context with baseURL, YAML headers, and auth headers. */
  apiContext:  APIRequestContext;
  /** UsersClient backed by apiContext. */
  usersClient: UsersClient;
  /** Plain auth headers object — useful when building ad-hoc contexts. */
  authHeaders: Record<string, string>;
}

// ── Extended test ─────────────────────────────────────────────────────────────

export const test = base.extend<ApiFixtures>({

  authHeaders: async ({}, use) => {
    await use(resolveAuthHeaders());
  },

  apiContext: async ({ playwright }, use) => {
    const env         = loadEnv();
    const yamlHeaders = loadHeaders();
    const authHeaders = resolveAuthHeaders();

    const context = await playwright.request.newContext({
      baseURL:          env.BASE_URL,
      extraHTTPHeaders: { ...yamlHeaders, ...authHeaders },
    });

    await use(context);
    await context.dispose();
  },

  // usersClient reuses the apiContext fixture — no extra context created
  usersClient: async ({ apiContext }, use) => {
    await use(new UsersClient(apiContext));
  },

});

// Re-export expect so tests can do: import { test, expect } from '../lib/api-fixtures'
export { baseExpect as expect };