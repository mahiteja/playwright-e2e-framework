/**
 * Author: Mahiteja Bollojula
 * LinkedIn: https://www.linkedin.com/in/mahiteja-bollojula-477a60145/
 * waiting.spec.ts
 *
 * Chapter 07 — Handling Async & Waiting.
 *
 * Playwright auto-waits before every action, but understanding explicit
 * wait strategies is essential for complex async flows.
 *
 * Topics covered (in priority order — safest to most dangerous):
 *  1. Auto-wait       — built in; covered implicitly in every test
 *  2. expect(locator) — auto-retrying assertions (safest explicit wait)
 *  3. waitForLoadState()  — page lifecycle events
 *  4. waitForURL()        — navigation to a URL pattern
 *  5. waitForResponse()   — capture & inspect API responses
 *  6. waitForFunction()   — custom JavaScript conditions (use sparingly)
 *  7. waitForSelector()   — legacy API, prefer assertions instead
 *  8. Anti-pattern demo   — waitForTimeout() and why to avoid it
 *
 * All tests navigate to real, publicly accessible pages.
 */

import { test, expect } from '../../../lib/web-fixtures';

const INTERNET = 'https://the-internet.herokuapp.com';
const TODOMVC  = 'https://demo.playwright.dev/todomvc';
const PW_DOCS  = 'https://playwright.dev/';

// ─────────────────────────────────────────────────────────────────────────────
// 1 & 2 — Auto-wait and expect() retrying assertions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Auto-wait and retrying assertions', () => {
  test('expect(locator).toBeVisible() auto-retries until element appears on the-internet', async ({ page }) => {
    await page.goto(`${INTERNET}/dynamic_loading/1`);
    await page.getByRole('button', { name: 'Start' }).click();
    // Playwright retries this assertion until the element is visible
    await expect(page.locator('#finish')).toBeVisible({ timeout: 10_000 });
  });

  test('expect().toHaveCount() waits until correct count is reached on TodoMVC', async ({ page }) => {
    await page.goto(TODOMVC);
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('Task 1'); await input.press('Enter');
    await input.fill('Task 2'); await input.press('Enter');
    await input.fill('Task 3'); await input.press('Enter');
    await input.fill('Task 4'); await input.press('Enter');
    await expect(page.getByTestId('todo-item')).toHaveCount(4);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3 — waitForLoadState()
// ─────────────────────────────────────────────────────────────────────────────

test.describe('waitForLoadState()', () => {
  test('domcontentloaded fires before all resources finish on playwright.dev', async ({ page }) => {
    await page.goto(PW_DOCS);
    await page.waitForLoadState('domcontentloaded');
    // DOM is parsed; heading is available even before all resources finish loading
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('load state completes and title is set on playwright.dev', async ({ page }) => {
    await page.goto(PW_DOCS);
    await page.waitForLoadState('load');
    await expect(page).toHaveTitle(/Playwright/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4 — waitForURL()
// ─────────────────────────────────────────────────────────────────────────────

test.describe('waitForURL()', () => {
  test('waitForURL() after login redirect on the-internet', async ({ page }) => {
    await page.goto(`${INTERNET}/login`);
    await page.getByLabel('Username').fill('tomsmith');
    await page.getByLabel('Password').fill('SuperSecretPassword!');
    await page.getByRole('button', { name: /Login/i }).click();

    // Blocks until the URL matches — captures the redirect to /secure
    await page.waitForURL('**/secure');
    await expect(page).toHaveURL(/secure/);
    await expect(page.locator('.flash.success')).toContainText('secure area');
  });

  test('waitForURL() with glob pattern on playwright.dev docs', async ({ page }) => {
    await page.goto(PW_DOCS);
    await page.getByRole('link', { name: 'Docs' }).first().click();
    await page.waitForURL('**/docs/**');
    await expect(page).toHaveURL(/\/docs\//);
  });

  test('waitForURL() with regex on a docs page', async ({ page }) => {
    await page.goto('https://playwright.dev/docs/intro');
    await page.waitForURL(/\/docs\/intro/);
    await expect(page).toHaveURL(/\/docs\/intro/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5 — waitForResponse()
// ─────────────────────────────────────────────────────────────────────────────

test.describe('waitForResponse()', () => {
  test('capture JSON API response when navigating to jsonplaceholder', async ({ page }) => {
    // Set up the listener BEFORE the navigation triggers the request
    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('jsonplaceholder.typicode.com/posts') && resp.status() === 200
    );
    await page.goto('https://jsonplaceholder.typicode.com/posts');
    const response = await responsePromise;

    expect(response.ok()).toBe(true);
    const posts = await response.json() as Array<{ id: number; title: string }>;
    expect(Array.isArray(posts)).toBe(true);
    expect(posts.length).toBeGreaterThan(0);
    expect(posts[0]).toHaveProperty('id');
    expect(posts[0]).toHaveProperty('title');
  });

  test('waitForResponse() captures redirect response after login form submit', async ({ page }) => {
    // IMPORTANT: start listening BEFORE triggering the action
    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/secure') && resp.status() === 200
    );
    await page.goto(`${INTERNET}/login`);
    await page.getByLabel('Username').fill('tomsmith');
    await page.getByLabel('Password').fill('SuperSecretPassword!');
    await page.getByRole('button', { name: /Login/i }).click();
    const response = await responsePromise;

    expect(response.status()).toBe(200);
    await expect(page).toHaveURL(/secure/);
  });

  test('wait for the main page response with Promise.all()', async ({ page }) => {
    const [htmlResp] = await Promise.all([
      page.waitForResponse(
        resp => resp.url() === PW_DOCS && resp.status() === 200
      ),
      page.goto(PW_DOCS),
    ]);

    expect(htmlResp.ok()).toBe(true);
    await expect(page).toHaveTitle(/Playwright/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6 — waitForFunction() — custom JS conditions (use sparingly)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('waitForFunction()', () => {
  test('waitForFunction with string expression waits for element on the-internet', async ({ page }) => {
    await page.goto(`${INTERNET}/dynamic_loading/1`);
    await page.getByRole('button', { name: 'Start' }).click();

    // Use string form to avoid TypeScript DOM lib requirements
    await page.waitForFunction('!!document.querySelector("#finish h4")', { timeout: 10_000 });
    await expect(page.locator('#finish h4')).toHaveText('Hello World!');
  });

  test('waitForFunction on dynamic_loading/2 waits for loading to complete', async ({ page }) => {
    await page.goto(`${INTERNET}/dynamic_loading/2`);
    await page.getByRole('button', { name: 'Start' }).click();

    // Wait until loading indicator is gone and content appears
    await page.waitForFunction(
      '!document.querySelector("#loading") || document.querySelector("#loading").style.display === "none"',
      { timeout: 10_000 }
    );
    await expect(page.locator('#finish h4')).toHaveText('Hello World!');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Per-action and per-assertion timeouts
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Timeout configuration', () => {
  test('custom timeout per assertion on slow dynamic content', async ({ page }) => {
    await page.goto(`${INTERNET}/dynamic_loading/1`);
    await page.getByRole('button', { name: 'Start' }).click();
    // Allow up to 10 s for this element to appear
    await expect(page.locator('#finish')).toBeVisible({ timeout: 10_000 });
  });

  test('custom timeout on click action on playwright.dev', async ({ page }) => {
    await page.goto(PW_DOCS);
    // Demonstrates per-action timeout on a real interactive element
    await page.getByRole('link', { name: /Docs|Get started/i }).first().click({ timeout: 10_000 });
    await expect(page).toHaveURL(/playwright\.dev/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Anti-pattern: waitForTimeout() — never use in production tests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Anti-pattern — waitForTimeout()', () => {
  /**
   * This test demonstrates WHY waitForTimeout() is an anti-pattern.
   * Use condition-based waiting instead of fixed delays.
   */
  test('waitForTimeout() wastes time — use condition-based waiting instead', async ({ page }) => {
    await page.goto(`${INTERNET}/dynamic_loading/1`);
    await page.getByRole('button', { name: 'Start' }).click();

    // ❌ Anti-pattern — always waits the full duration regardless of readiness
    // await page.waitForTimeout(5000);

    // ✅ Correct — retries automatically, exits as soon as condition is true
    await expect(page.locator('#finish')).toBeVisible({ timeout: 10_000 });
  });
});
