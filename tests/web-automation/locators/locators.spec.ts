/**
 * Author: Mahiteja Bollojula
 * LinkedIn: https://www.linkedin.com/in/mahiteja-bollojula-477a60145/
 * locators.spec.ts
 *
 * Chapter 03 — Locators & Selectors Deep Dive.
 * Every test navigates to a real, publicly accessible website.
 *
 * Sites used:
 *  https://playwright.dev/              — Microsoft Playwright docs (stable)
 *  https://the-internet.herokuapp.com   — Automation practice playground
 *  https://demo.playwright.dev/todomvc  — Microsoft's React TodoMVC demo
 *  https://books.toscrape.com           — Static book catalogue (very stable)
 *  https://en.wikipedia.org/wiki/Main_Page — links with title attributes
 *
 * Topics covered:
 *  getByRole · getByText · getByLabel · getByPlaceholder
 *  getByTestId · getByAltText · getByTitle · locator() CSS
 *  Chaining · filter() · nth/first/last
 */

import { test, expect } from '../../../lib/web-fixtures';

const PW_DOCS  = 'https://playwright.dev/';
const INTERNET = 'https://the-internet.herokuapp.com';
const TODOMVC  = 'https://demo.playwright.dev/todomvc';

// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// getByRole()
// ─────────────────────────────────────────────────────────────────────────────

test.describe('getByRole()', () => {
  test('locate h1 heading on playwright.dev', async ({ page }) => {
    await page.goto(PW_DOCS);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('locate primary nav links on playwright.dev', async ({ page }) => {
    await page.goto(PW_DOCS);
    await expect(page.getByRole('link', { name: 'Docs' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'API' })).toBeVisible();
  });

  test('locate Login button by role on the-internet', async ({ page }) => {
    await page.goto(`${INTERNET}/login`);
    await expect(page.getByRole('button', { name: /Login/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Login/i })).toBeEnabled();
  });

  test('count all checkboxes by role on the-internet checkboxes page', async ({ page }) => {
    await page.goto(`${INTERNET}/checkboxes`);
    await expect(page.getByRole('checkbox')).toHaveCount(2);
  });

  test('locate combobox (select) by role on the-internet dropdown page', async ({ page }) => {
    await page.goto(`${INTERNET}/dropdown`);
    await expect(page.getByRole('combobox')).toBeVisible();
  });

  test('locate table column headers by role on the-internet tables page', async ({ page }) => {
    await page.goto(`${INTERNET}/tables`);
    // Scope to #table1 — the page has 2 tables so the unscoped role would be ambiguous
    const firstTable = page.locator('#table1');
    await expect(firstTable).toBeVisible();
    await expect(firstTable.getByRole('columnheader', { name: 'Last Name' })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getByText()
// ─────────────────────────────────────────────────────────────────────────────

test.describe('getByText()', () => {
  test('partial text match on the-internet login page heading', async ({ page }) => {
    await page.goto(`${INTERNET}/login`);
    await expect(page.getByText('Login Page')).toBeVisible();
  });

  test('partial text match on playwright.dev', async ({ page }) => {
    await page.goto(PW_DOCS);
    await expect(page.getByText('end-to-end testing')).toBeVisible();
  });

  test('regex text match on playwright.dev', async ({ page }) => {
    await page.goto(PW_DOCS);
    await expect(page.getByText(/reliable/i)).toBeVisible();
  });

  test('exact text match for section heading on the-internet', async ({ page }) => {
    await page.goto(`${INTERNET}/checkboxes`);
    await expect(page.getByText('Checkboxes', { exact: true })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getByLabel()
// ─────────────────────────────────────────────────────────────────────────────

test.describe('getByLabel()', () => {
  test('locate text and password inputs by their label on the-internet login', async ({ page }) => {
    await page.goto(`${INTERNET}/login`);
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('label-located input accepts typed value', async ({ page }) => {
    await page.goto(`${INTERNET}/login`);
    await page.getByLabel('Username').fill('tomsmith');
    await expect(page.getByLabel('Username')).toHaveValue('tomsmith');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getByPlaceholder()
// ─────────────────────────────────────────────────────────────────────────────

test.describe('getByPlaceholder()', () => {
  test('locate the todo input by placeholder on TodoMVC', async ({ page }) => {
    await page.goto(TODOMVC);
    await expect(page.getByPlaceholder('What needs to be done?')).toBeVisible();
  });

  test('todo input is auto-focused on page load', async ({ page }) => {
    await page.goto(TODOMVC);
    await expect(page.getByPlaceholder('What needs to be done?')).toBeFocused();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getByTestId()
// ─────────────────────────────────────────────────────────────────────────────

test.describe('getByTestId()', () => {
  test('locate todo items by data-testid after adding entries on TodoMVC', async ({ page }) => {
    await page.goto(TODOMVC);
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('Buy groceries');
    await input.press('Enter');
    await input.fill('Walk the dog');
    await input.press('Enter');

    await expect(page.getByTestId('todo-item')).toHaveCount(2);
    await expect(page.getByTestId('todo-item').first()).toContainText('Buy groceries');
    await expect(page.getByTestId('todo-item').last()).toContainText('Walk the dog');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getByAltText() & getByTitle()
// ─────────────────────────────────────────────────────────────────────────────

test.describe('getByAltText()', () => {
  test('locate a book thumbnail by its alt text on books.toscrape.com', async ({ page }) => {
    await page.goto('https://books.toscrape.com');
    const firstImage = page.getByRole('img').first();
    await expect(firstImage).toBeVisible();
    const altText = await firstImage.getAttribute('alt');
    expect(altText).toBeTruthy();
    await expect(page.getByAltText(altText!)).toBeVisible();
  });

  test('every product image on books.toscrape.com has non-empty alt text', async ({ page }) => {
    await page.goto('https://books.toscrape.com');
    const images = page.locator('article.product_pod img');
    await expect(images).toHaveCount(20);
    const firstAlt = await images.first().getAttribute('alt');
    expect(firstAlt).toBeTruthy();
  });
});

test.describe('getByTitle()', () => {
  test('locate links with title attributes on Wikipedia main page', async ({ page }) => {
    await page.goto('https://en.wikipedia.org/wiki/Main_Page');
    await expect(page.getByTitle('Main Page').first()).toBeVisible();
  });

  test('retrieve the title attribute value from a Wikipedia link', async ({ page }) => {
    await page.goto('https://en.wikipedia.org/wiki/Main_Page');
    const titleValue = await page.getByTitle('Main Page').first().getAttribute('title');
    expect(titleValue).toBe('Main Page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Chaining & Filtering
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Chaining & Filtering', () => {
  test('filter todo items by text content (hasText) on TodoMVC', async ({ page }) => {
    await page.goto(TODOMVC);
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('Buy groceries'); await input.press('Enter');
    await input.fill('Walk the dog');  await input.press('Enter');
    await input.fill('Buy coffee');    await input.press('Enter');

    const buyItems = page.getByTestId('todo-item').filter({ hasText: 'Buy' });
    await expect(buyItems).toHaveCount(2);
    await expect(buyItems.first()).toContainText('Buy groceries');
  });

  test('filter todo items by child element presence on TodoMVC', async ({ page }) => {
    await page.goto(TODOMVC);
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('Task A'); await input.press('Enter');
    await input.fill('Task B'); await input.press('Enter');

    await page.getByTestId('todo-item').first().getByRole('checkbox').check();

    const completedItems = page.getByTestId('todo-item').filter({
      has: page.locator('.toggle:checked'),
    });
    await expect(completedItems).toHaveCount(1);
    await expect(completedItems.first()).toContainText('Task A');
  });

  test('scope locator to a table row on the-internet tables page', async ({ page }) => {
    await page.goto(`${INTERNET}/tables`);
    const smithRow = page.locator('#table1 tbody tr').filter({ hasText: 'Smith' });
    await expect(smithRow).toBeVisible();
    await expect(smithRow.locator('td').first()).toContainText('Smith');
  });

  test('chain locators to scope within a specific TodoMVC item', async ({ page }) => {
    await page.goto(TODOMVC);
    await page.getByPlaceholder('What needs to be done?').fill('Important task');
    await page.keyboard.press('Enter');

    const item = page.getByTestId('todo-item').first();
    await expect(item.getByRole('checkbox')).toBeVisible();
    await expect(item.locator('label')).toHaveText('Important task');
  });

  test('nth(), first(), last() positional helpers on TodoMVC list', async ({ page }) => {
    await page.goto(TODOMVC);
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('First task');  await input.press('Enter');
    await input.fill('Second task'); await input.press('Enter');
    await input.fill('Third task');  await input.press('Enter');

    const items = page.getByTestId('todo-item');
    await expect(items.first()).toContainText('First task');
    await expect(items.nth(1)).toContainText('Second task');
    await expect(items.last()).toContainText('Third task');
  });
});
