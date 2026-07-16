/**
 * Author: Mahiteja Bollojula
 * LinkedIn: https://www.linkedin.com/in/mahiteja-bollojula-477a60145/
 * asyncJob.spec.ts
 *
 * Covers: expect.poll() for async polling (3.2), retries, timeouts.
 *
 * Real-world pattern:
 *  POST /jobs            → 202 Accepted { jobId }
 *  GET  /jobs/:id/status → 200 { status: 'pending' | 'running' | 'complete' | 'failed' }
 *  Poll until status === 'complete' or timeout.
 *
 * Since jsonplaceholder has no real async jobs, we demonstrate the full pattern
 * with a mocked status progression using page.route, and a live polling example
 * that targets a stable endpoint.
 */

import { test, expect } from '../../../lib/api-fixtures';

// ── Live expect.poll() against a stable endpoint ─────────────────────────────

test.describe('expect.poll() — live endpoint polling', () => {

  test('poll until /posts/1 title is non-empty', async ({ apiContext }) => {
    await expect.poll(
      async () => {
        const res  = await apiContext.get('/posts/1');
        const body = await res.json() as { title: string };
        return body.title;
      },
      {
        intervals: [500, 1_000, 2_000],
        timeout:   15_000,
        message:   'Expected post title to be non-empty within 15s',
      }
    ).toBeTruthy();
  });

  test('poll until user list contains at least 5 items', async ({ apiContext }) => {
    await expect.poll(
      async () => {
        const res  = await apiContext.get('/users');
        const body = await res.json() as unknown[];
        return body.length;
      },
      {
        timeout: 10_000,
        message: 'Expected at least 5 users',
      }
    ).toBeGreaterThanOrEqual(5);
  });

  test('poll until status code is 200', async ({ apiContext }) => {
    // Demonstrate polling for a specific HTTP status
    await expect.poll(
      async () => {
        const res = await apiContext.get('/todos/1');
        return res.status();
      },
      {
        intervals: [100, 200, 500, 1_000],
        timeout:   10_000,
      }
    ).toBe(200);
  });

});

// ── Simulated async job lifecycle (page.route mock) ───────────────────────────

test.describe('Async job lifecycle with mocked status progression', () => {

  test('POST job → poll for complete status', async ({ page, apiContext }) => {
    // State machine: each call advances the job through the lifecycle
    const statusSequence = ['pending', 'pending', 'running', 'running', 'complete'];
    let callCount = 0;

    // Mock the status endpoint to progress through states
    await page.route('**/api/jobs/*/status', async route => {
      const status = statusSequence[Math.min(callCount++, statusSequence.length - 1)];
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify({ status, progress: callCount * 20 }),
      });
    });

    // Step 1: Create the job
    const createRes = await apiContext.post('/posts', {
      data: { title: 'background-export', body: 'user=1', userId: 1 },
    });
    expect(createRes.status()).toBe(201);
    const { id: jobId } = await createRes.json() as { id: number };

    // Step 2: Poll via page.evaluate so page.route intercepts the calls
    const finalStatus = await page.evaluate(async (jid: number) => {
      let attempts = 0;
      while (attempts < 10) {
        const res    = await fetch(`https://api.example.com/api/jobs/${jid}/status`);
        const body   = await res.json() as { status: string };
        if (body.status === 'complete' || body.status === 'failed') {
          return body.status;
        }
        attempts++;
        await new Promise(r => setTimeout(r, 100));
      }
      return 'timeout';
    }, jobId);

    expect(finalStatus).toBe('complete');
  });

});

// ── Retry configuration + timeout assertions (3.2) ───────────────────────────

test.describe('Retry + timeout patterns', () => {

  test('request times out gracefully when timeout is too short', async ({ playwright }) => {
    const ctx = await playwright.request.newContext({ timeout: 1 }); // 1ms — will always timeout
    await expect(
      ctx.get('https://jsonplaceholder.typicode.com/users/1')
    ).rejects.toThrow();
    await ctx.dispose();
  });

  test('custom timeout per-request', async ({ apiContext }) => {
    // Per-request timeout override: a large timeout should succeed
    const res = await apiContext.get('/users/1', { timeout: 10_000 });
    expect(res.status()).toBe(200);
  });

});
