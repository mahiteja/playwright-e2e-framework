/**
 * Author: Mahiteja Bollojula
 * LinkedIn: https://www.linkedin.com/in/mahiteja-bollojula-477a60145/
 * assertions.spec.ts
 *
 * Chapter 05 — Assertions & Verification.
 *
 * All assertions in Playwright auto-retry until the condition is met
 * or the timeout expires, eliminating flakiness from timing issues.
 *
 * Topics covered:
 *  - toBeVisible() / toBeHidden()
 *  - toHaveText() / toContainText()
 *  - toHaveValue()
 *  - toHaveAttribute()
 *  - toHaveClass()
 *  - toHaveCount()
 *  - toBeEnabled() / toBeDisabled()
 *  - toBeChecked()
 *  - toBeFocused()
 *  - toHaveTitle() / toHaveURL()  — page-level assertions
 *  - expect.soft()                — collect all failures, not just the first
 *  - Custom timeout per assertion
 */

import { test, expect } from '../../../lib/web-fixtures';

const PW_DOCS  = 'https://playwright.dev/';
const INTERNET = 'https://the-internet.herokuapp.com';
const TODOMVC  = 'https://demo.playwright.dev/todomvc';

// ─────────────────────────────────────────────────────────────────────────────
// Visibility assertions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('toBeVisible() / toBeHidden()', () => {
  test('page heading is visible on playwright.dev', async ({ page }) => {
    await page.goto(PW_DOCS);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('non-existent element passes toBeHidden()', async ({ page }) => {
    await page.goto(PW_DOCS);
    await expect(page.locator('#non-existent-element-xyz')).toBeHidden();
  });

  test('auto-retry waits for dynamic content on the-internet', async ({ page }) => {
    await page.goto(`${INTERNET}/dynamic_loading/1`);
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.locator('#finish')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#finish')).toContainText('Hello World!', { timeout: 10_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Text assertions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('toHaveText() / toContainText()', () => {
  test('page content passes toContainText() on playwright.dev', async ({ page }) => {
    await page.goto(PW_DOCS);
    await expect(page.getByText('end-to-end testing')).toBeVisible();
  });

  test('regex match on playwright.dev page content', async ({ page }) => {
    await page.goto(PW_DOCS);
    await expect(page.getByText(/reliable/i)).toBeVisible();
  });

  test('toHaveText() matches heading on the-internet login page', async ({ page }) => {
    await page.goto(`${INTERNET}/login`);
    await expect(page.getByRole('heading', { level: 2 })).toHaveText('Login Page');
  });

  test('toHaveText() with array matches all todo items on TodoMVC', async ({ page }) => {
    await page.goto(TODOMVC);
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('Apple'); await input.press('Enter');
    await input.fill('Banana'); await input.press('Enter');
    await expect(page.getByTestId('todo-item')).toHaveText(['Apple', 'Banana']);
  });

  test('toContainText() with array checks partial matches on TodoMVC', async ({ page }) => {
    await page.goto(TODOMVC);
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('Buy groceries'); await input.press('Enter');
    await input.fill('Walk the dog'); await input.press('Enter');
    await expect(page.getByTestId('todo-item')).toContainText(['Buy', 'Walk']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Value assertions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('toHaveValue()', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${INTERNET}/login`);
  });

  test('assert Username input value after fill() on the-internet login', async ({ page }) => {
    await page.getByLabel('Username').fill('tomsmith');
    await expect(page.getByLabel('Username')).toHaveValue('tomsmith');
  });

  test('assert Password input value after fill()', async ({ page }) => {
    await page.getByLabel('Password').fill('SuperSecretPassword!');
    await expect(page.getByLabel('Password')).toHaveValue('SuperSecretPassword!');
  });

  test('assert value changes after clear() and fill()', async ({ page }) => {
    const input = page.getByLabel('Username');
    await input.fill('initial');
    await input.clear();
    await input.fill('updated');
    await expect(input).toHaveValue('updated');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Attribute assertions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('toHaveAttribute()', () => {
  test('assert type=text on Username input on the-internet login', async ({ page }) => {
    await page.goto(`${INTERNET}/login`);
    await expect(page.getByLabel('Username')).toHaveAttribute('type', 'text');
  });

  test('assert type=password on Password input', async ({ page }) => {
    await page.goto(`${INTERNET}/login`);
    await expect(page.getByLabel('Password')).toHaveAttribute('type', 'password');
  });

  test('assert href attribute on nav link on playwright.dev', async ({ page }) => {
    await page.goto(PW_DOCS);
    await expect(page.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', /docs/);
  });

  test('Login button does NOT have disabled attribute', async ({ page }) => {
    await page.goto(`${INTERNET}/login`);
    await expect(page.getByRole('button', { name: /Login/i })).not.toHaveAttribute('disabled');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Class assertions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('toHaveClass()', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TODOMVC);
  });

  test('completed todo has the completed class on TodoMVC', async ({ page }) => {
    await page.getByPlaceholder('What needs to be done?').fill('My task');
    await page.keyboard.press('Enter');
    await page.getByTestId('todo-item').first().getByRole('checkbox').check();
    await expect(page.getByTestId('todo-item').first()).toHaveClass(/completed/);
  });

  test('incomplete todo does NOT have the completed class', async ({ page }) => {
    await page.getByPlaceholder('What needs to be done?').fill('My task');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('todo-item').first()).not.toHaveClass(/completed/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Count assertions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('toHaveCount()', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TODOMVC);
  });

  test('assert exact number of todo items after adding them', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('Task 1'); await input.press('Enter');
    await input.fill('Task 2'); await input.press('Enter');
    await input.fill('Task 3'); await input.press('Enter');
    await expect(page.getByTestId('todo-item')).toHaveCount(3);
  });

  test('count drops after deleting a todo', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('Task A'); await input.press('Enter');
    await input.fill('Task B'); await input.press('Enter');
    await page.getByTestId('todo-item').first().hover();
    await page.getByTestId('todo-item').first().locator('.destroy').click();
    await expect(page.getByTestId('todo-item')).toHaveCount(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// State assertions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('State — toBeEnabled() / toBeDisabled() / toBeChecked() / toBeFocused()', () => {
  test('enabled inputs pass toBeEnabled() on the-internet login', async ({ page }) => {
    await page.goto(`${INTERNET}/login`);
    await expect(page.getByLabel('Username')).toBeEnabled();
    await expect(page.getByRole('button', { name: /Login/i })).toBeEnabled();
  });

  test('dynamically disabled input passes toBeDisabled() on dynamic controls', async ({ page }) => {
    await page.goto(`${INTERNET}/dynamic_controls`);
    await page.getByRole('button', { name: /Disable/i }).first().click();
    await expect(page.locator('#input-example input')).toBeDisabled({ timeout: 10_000 });
  });

  test('checked checkbox passes toBeChecked() on TodoMVC', async ({ page }) => {
    await page.goto(TODOMVC);
    await page.getByPlaceholder('What needs to be done?').fill('My task');
    await page.keyboard.press('Enter');
    await page.getByTestId('todo-item').first().getByRole('checkbox').check();
    await expect(page.getByTestId('todo-item').first().getByRole('checkbox')).toBeChecked();
  });

  test('unchecked checkbox passes not.toBeChecked() on TodoMVC', async ({ page }) => {
    await page.goto(TODOMVC);
    await page.getByPlaceholder('What needs to be done?').fill('Task');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('todo-item').first().getByRole('checkbox')).not.toBeChecked();
  });

  test('focused input passes toBeFocused() on TodoMVC', async ({ page }) => {
    await page.goto(TODOMVC);
    await expect(page.getByPlaceholder('What needs to be done?')).toBeFocused();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Page-level assertions: toHaveTitle() and toHaveURL()
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page-level — toHaveTitle() / toHaveURL()', () => {
  test('toHaveTitle() matches page title on playwright.dev', async ({ page }) => {
    await page.goto(PW_DOCS);
    await expect(page).toHaveTitle(/Playwright/);
  });

  test('toHaveTitle() accepts a regex', async ({ page }) => {
    await page.goto(PW_DOCS);
    await expect(page).toHaveTitle(/^Playwright/);
  });

  test('toHaveURL() after login redirect on the-internet', async ({ page }) => {
    await page.goto(`${INTERNET}/login`);
    await page.getByLabel('Username').fill('tomsmith');
    await page.getByLabel('Password').fill('SuperSecretPassword!');
    await page.getByRole('button', { name: /Login/i }).click();
    await page.waitForURL('**/secure');
    await expect(page).toHaveURL(/secure/);
  });

  test('toHaveURL() with regex pattern on playwright.dev docs', async ({ page }) => {
    await page.goto('https://playwright.dev/docs/intro');
    await expect(page).toHaveURL(/\/docs\/intro/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// expect.soft() — collect multiple failures in one run
// ─────────────────────────────────────────────────────────────────────────────

test.describe('expect.soft()', () => {
  test('soft assertions run past failures and report all at end', async ({ page }) => {
    await page.goto(PW_DOCS);
    await expect.soft(page).toHaveTitle(/Playwright/);
    await expect.soft(page.getByRole('link', { name: 'Docs' })).toBeVisible();
    await expect.soft(page.getByRole('link', { name: 'API' })).toBeVisible();
    await expect.soft(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Custom assertion timeout
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Custom timeout per assertion', () => {
  test('extend timeout for slow dynamic content on the-internet', async ({ page }) => {
    await page.goto(`${INTERNET}/dynamic_loading/1`);
    await page.getByRole('button', { name: 'Start' }).click();
    // The element appears after ~2 seconds; allow up to 10 s
    await expect(page.locator('#finish')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#finish')).toContainText('Hello World!', { timeout: 10_000 });
  });
});
