/**
 * Author: Mahiteja Bollojula
 * LinkedIn: https://www.linkedin.com/in/mahiteja-bollojula-477a60145/
 * customMatchers.ts
 *
 * Registers custom expect matchers via expect.extend().
 * Import this file once (done automatically via lib/api-fixtures.ts) and the
 * matchers are available on every `expect()` call in the test suite.
 *
 * Matchers:
 *  - toHaveStatusCode(expected)         — assert exact HTTP status
 *  - toBeSuccessfulJSON()               — assert 2xx + application/json
 *  - toMatchApiSchema(schema)           — Zod schema contract validation
 *  - toContainKey(key)                  — assert top-level key presence
 *  - toRespondWithin(maxMs, startTime)  — assert response latency SLA
 */

import { expect } from '@playwright/test';
import type { APIResponse } from '@playwright/test';

// Internal helper: run safeParse and return structured error or null
function zodSafeParse(
  schema: { safeParse(v: unknown): { success: boolean; error?: { flatten(): { fieldErrors: Record<string, string[] | undefined> } } } },
  value:  unknown
): { success: true } | { success: false; errors: Record<string, string[] | undefined> } {
  const result = schema.safeParse(value);
  if (result.success) return { success: true };
  return {
    success: false,
    errors:  result.error?.flatten().fieldErrors ?? {},
  };
}

expect.extend({

  // ── toHaveStatusCode ──────────────────────────────────────────────────────
  async toHaveStatusCode(received: unknown, expected: number) {
    const res    = received as APIResponse;
    const actual = res.status();
    const pass   = actual === expected;
    return {
      pass,
      message: () => pass
        ? `Expected HTTP status NOT to be ${expected}\n  URL: ${res.url()}`
        : `Expected HTTP ${expected}, got ${actual}\n  URL: ${res.url()}`,
    };
  },

  // ── toBeSuccessfulJSON ────────────────────────────────────────────────────
  async toBeSuccessfulJSON(received: unknown) {
    const res    = received as APIResponse;
    const status = res.status();
    const ct     = res.headers()['content-type'] ?? '';
    const pass   = res.ok() && ct.includes('application/json');
    return {
      pass,
      message: () => pass
        ? `Expected response NOT to be successful JSON`
        : `Expected 2xx + application/json, got ${status} + "${ct}"\n  URL: ${res.url()}`,
    };
  },

  // ── toMatchApiSchema ──────────────────────────────────────────────────────
  async toMatchApiSchema(
    received: unknown,
    schema:   { safeParse(v: unknown): { success: boolean; error?: { flatten(): { fieldErrors: Record<string, string[] | undefined> } } } }
  ) {
    const res    = received as APIResponse;
    const body   = await res.json();
    const result = zodSafeParse(schema, body);
    return {
      pass:    result.success,
      message: () => result.success
        ? `Expected response NOT to match schema\n  URL: ${res.url()}`
        : `API schema contract broken at ${res.url()}:\n${JSON.stringify(
            (result as { success: false; errors: Record<string, string[] | undefined> }).errors,
            null,
            2
          )}`,
    };
  },

  // ── toContainKey ──────────────────────────────────────────────────────────
  async toContainKey(received: unknown, key: string) {
    const res  = received as APIResponse;
    const body = await res.json() as Record<string, unknown>;
    const pass = Object.prototype.hasOwnProperty.call(body, key);
    return {
      pass,
      message: () => pass
        ? `Expected body NOT to contain key "${key}"`
        : `Expected body to contain key "${key}"\n  Got keys: ${Object.keys(body).join(', ')}\n  URL: ${res.url()}`,
    };
  },

  // ── toRespondWithin ───────────────────────────────────────────────────────
  async toRespondWithin(received: unknown, maxMs: number, startTime: number) {
    const res     = received as APIResponse;
    const elapsed = performance.now() - startTime;
    const pass    = elapsed <= maxMs;
    return {
      pass,
      message: () => pass
        ? `Expected response to take MORE than ${maxMs}ms (took ${elapsed.toFixed(0)}ms)`
        : `Expected response ≤ ${maxMs}ms, got ${elapsed.toFixed(0)}ms\n  URL: ${res.url()}`,
    };
  },

});

// ── TypeScript type augmentation ──────────────────────────────────────────────

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PlaywrightTest {
    // Using unknown as the second type param for compatibility across versions
    interface Matchers<R, T = unknown> {
      toHaveStatusCode(expected: number): R;
      toBeSuccessfulJSON(): R;
      toMatchApiSchema(schema: {
        safeParse(v: unknown): {
          success: boolean;
          error?: { flatten(): { fieldErrors: Record<string, string[] | undefined> } };
        };
      }): R;
      toContainKey(key: string): R;
      toRespondWithin(maxMs: number, startTime: number): R;
    }
  }
}

export {};
