/**
 * Author: Mahiteja Bollojula
 * LinkedIn: https://www.linkedin.com/in/mahiteja-bollojula-477a60145/
 * visual.spec.ts
 *
 * Chapter 09 — Visual Regression Testing.
 *
 * Playwright's built-in screenshot engine handles anti-aliasing, colour-space
 * differences, and rendering variations. Baselines are stored alongside test
 * files in a __screenshots__ folder.
 *
 * First-run workflow:
 *   npx playwright test visual --update-snapshots     ← creates baselines
 *   npx playwright test visual                        ← compares against them
 *
 * Topics covered:
 *  - Full-page screenshot comparison
 *  - Element / component screenshot comparison
 *  - maxDiffPixelRatio tolerance
 *  - animations: 'disabled' for deterministic snapshots
 *  - Dark-mode emulation
 *  - Masking dynamic regions to suppress noise
 *  - page.screenshot() for capture-only (no comparison)
 *
 * All tests navigate to real, publicly accessible pages.
 * Run with --update-snapshots to regenerate baselines whenever the page layout changes.
 */

import { test, expect } from '../../../lib/web-fixtures';

const TODOMVC = 'https://demo.playwright.dev/todomvc';
const PW_DOCS = 'https://playwright.dev/';

// ─────────────────────────────────────────────────────────────────────────────
// Full-page screenshot
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Full-page screenshots', () => {
  test('full-page snapshot of TodoMVC empty state', async ({ page }) => {
    await page.goto(TODOMVC);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('todomvc-full-page.png', {
      fullPage:          true,
      animations:        'disabled',
      maxDiffPixelRatio: 0.05,
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Component / element screenshot
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Element / component screenshots', () => {
  test('TodoMVC header section matches baseline — tight crop', async ({ page }) => {
    await page.goto(TODOMVC);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.header')).toHaveScreenshot('todomvc-header.png', {
      animations:        'disabled',
      maxDiffPixelRatio: 0.05,
    });
  });

  test('element screenshot with tolerance using maxDiffPixels', async ({ page }) => {
    await page.goto(TODOMVC);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.header')).toHaveScreenshot('todomvc-header-tolerance.png', {
      animations:    'disabled',
      maxDiffPixels: 100,
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Masking dynamic regions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Masking dynamic content', () => {
  test('mask navigation on playwright.dev to suppress version-number noise', async ({ page }) => {
    await page.goto(PW_DOCS);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('playwright-homepage-masked.png', {
      animations:        'disabled',
      maxDiffPixelRatio: 0.05,
      // Mask the nav bar which may contain version numbers or dynamic content
      mask:              [page.locator('nav')],
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Dark-mode emulation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Dark mode', () => {
  test('playwright.dev renders correctly in dark colour scheme', async ({ page }) => {
    await page.goto(PW_DOCS);
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('playwright-dark-mode.png', {
      animations:        'disabled',
      maxDiffPixelRatio: 0.05,
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// page.screenshot() — capture-only (no comparison)
// Useful for generating debug artefacts or storing evidence without a baseline
// ─────────────────────────────────────────────────────────────────────────────

test.describe('page.screenshot() — capture only', () => {
  test('screenshot buffer of playwright.dev is non-empty', async ({ page }) => {
    await page.goto(PW_DOCS);
    await page.waitForLoadState('networkidle');

    const screenshotBuffer = await page.screenshot({ animations: 'disabled' });
    expect(screenshotBuffer.byteLength).toBeGreaterThan(1_000);
  });

  test('capture a specific element as a PNG buffer on playwright.dev', async ({ page }) => {
    await page.goto(PW_DOCS);
    await page.waitForLoadState('networkidle');

    const heading = page.getByRole('heading', { level: 1 });
    const elementBuffer = await heading.screenshot({ animations: 'disabled' });
    expect(elementBuffer.byteLength).toBeGreaterThan(1_000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Different viewport sizes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Viewport / responsive snapshots', () => {
  test('TodoMVC at mobile viewport (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(TODOMVC);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('todomvc-mobile.png', {
      fullPage:          true,
      animations:        'disabled',
      maxDiffPixelRatio: 0.05,
    });
  });
});
