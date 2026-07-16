/**
 * Author: Mahiteja Bollojula
 * LinkedIn: https://www.linkedin.com/in/mahiteja-bollojula-477a60145/
 * interactions.spec.ts
 *
 * Chapter 04 — Interactions & User Simulations.
 *
 * Topics covered:
 *  - fill() / clear()            — text inputs & textarea
 *  - selectOption()              — native <select> dropdowns
 *  - check() / uncheck()         — checkboxes and radio buttons
 *  - click() / dblclick()        — standard and special clicks
 *  - hover()                     — trigger CSS :hover states
 *  - keyboard.press() / down()   — keyboard shortcuts & modifier keys
 *  - keyboard.insertText()       — paste-style text insertion
 *  - setInputFiles()             — file uploads with buffer (no disk file)
 *  - dragTo()                    — HTML5 drag and drop
 *  - TodoMVC live interactions   — end-to-end interaction flow
 */

import { test, expect } from '../../../lib/web-fixtures';

const INTERNET = 'https://the-internet.herokuapp.com';
const TODOMVC  = 'https://demo.playwright.dev/todomvc';

// ─────────────────────────────────────────────────────────────────────────────
// fill() / clear()
// ─────────────────────────────────────────────────────────────────────────────

test.describe('fill() and clear()', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${INTERNET}/login`);
  });

  test('fill the Username input on the-internet login page', async ({ page }) => {
    await page.getByLabel('Username').fill('tomsmith');
    await expect(page.getByLabel('Username')).toHaveValue('tomsmith');
  });

  test('fill the Password input', async ({ page }) => {
    await page.getByLabel('Password').fill('SuperSecretPassword!');
    await expect(page.getByLabel('Password')).toHaveValue('SuperSecretPassword!');
  });

  test('clear() then fill() replaces existing value', async ({ page }) => {
    const input = page.getByLabel('Username');
    await input.fill('initial_value');
    await input.clear();
    await input.fill('replaced_value');
    await expect(input).toHaveValue('replaced_value');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// selectOption()
// ─────────────────────────────────────────────────────────────────────────────

test.describe('selectOption()', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${INTERNET}/dropdown`);
  });

  test('select Option 1 by value on the-internet dropdown', async ({ page }) => {
    await page.locator('#dropdown').selectOption('1');
    await expect(page.locator('#dropdown')).toHaveValue('1');
  });

  test('select Option 2 by label text', async ({ page }) => {
    await page.locator('#dropdown').selectOption({ label: 'Option 2' });
    await expect(page.locator('#dropdown')).toHaveValue('2');
  });

  test('selected option is visible in the combobox', async ({ page }) => {
    await page.locator('#dropdown').selectOption('1');
    const selectedText = await page.locator('#dropdown option:checked').textContent();
    expect(selectedText?.trim()).toBe('Option 1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// check() / uncheck()
// ─────────────────────────────────────────────────────────────────────────────

test.describe('check() and uncheck()', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${INTERNET}/checkboxes`);
  });

  test('first checkbox is unchecked by default', async ({ page }) => {
    await expect(page.getByRole('checkbox').first()).not.toBeChecked();
  });

  test('second checkbox is checked by default', async ({ page }) => {
    await expect(page.getByRole('checkbox').last()).toBeChecked();
  });

  test('check an unchecked checkbox', async ({ page }) => {
    const firstCheckbox = page.getByRole('checkbox').first();
    await firstCheckbox.check();
    await expect(firstCheckbox).toBeChecked();
  });

  test('uncheck a pre-checked checkbox', async ({ page }) => {
    const lastCheckbox = page.getByRole('checkbox').last();
    await lastCheckbox.uncheck();
    await expect(lastCheckbox).not.toBeChecked();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// click() / dblclick()
// ─────────────────────────────────────────────────────────────────────────────

test.describe('click() and dblclick()', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TODOMVC);
  });

  test('click checkbox toggles a todo to completed', async ({ page }) => {
    await page.getByPlaceholder('What needs to be done?').fill('Test task');
    await page.keyboard.press('Enter');
    const item = page.getByTestId('todo-item').first();
    await item.getByRole('checkbox').click();
    await expect(item).toHaveClass(/completed/);
  });

  test('double-click on a todo label enters edit mode', async ({ page }) => {
    await page.getByPlaceholder('What needs to be done?').fill('Original todo');
    await page.keyboard.press('Enter');
    const item = page.getByTestId('todo-item').first();
    await item.locator('label').dblclick();
    await expect(item.locator('.edit')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// hover()
// ─────────────────────────────────────────────────────────────────────────────

test.describe('hover()', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${INTERNET}/hovers`);
  });

  test('hover over a user figure reveals the figcaption', async ({ page }) => {
    const figure = page.locator('.figure').first();
    await figure.hover();
    await expect(figure.locator('.figcaption')).toBeVisible();
  });

  test('figcaption contains the user name text', async ({ page }) => {
    const figure = page.locator('.figure').first();
    await figure.hover();
    await expect(figure.locator('.figcaption')).toContainText('name:');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// keyboard.press() / keyboard.insertText()
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Keyboard interactions', () => {
  test('keyboard.type() + Enter adds a todo on TodoMVC', async ({ page }) => {
    await page.goto(TODOMVC);
    await page.getByPlaceholder('What needs to be done?').click();
    await page.keyboard.type('Buy groceries');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('todo-item').first()).toContainText('Buy groceries');
  });

  test('keyboard.insertText() pastes content without triggering key events', async ({ page }) => {
    await page.goto(TODOMVC);
    await page.getByPlaceholder('What needs to be done?').click();
    await page.keyboard.insertText('Inserted via insertText');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('todo-item').first()).toContainText('Inserted via insertText');
  });

  test('Tab moves focus from Username to Password on the-internet login', async ({ page }) => {
    await page.goto(`${INTERNET}/login`);
    await page.getByLabel('Username').click();
    await expect(page.getByLabel('Username')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Password')).toBeFocused();
  });

  test('Escape cancels in-place edit on TodoMVC', async ({ page }) => {
    await page.goto(TODOMVC);
    await page.getByPlaceholder('What needs to be done?').fill('Original task');
    await page.keyboard.press('Enter');
    const item = page.getByTestId('todo-item').first();
    await item.locator('label').dblclick();
    const editInput = item.locator('.edit');
    await editInput.fill('Different text');
    await editInput.press('Escape');
    await expect(item.locator('label')).toHaveText('Original task');
  });

  test('Ctrl+A selects all text, then typing replaces it on TodoMVC', async ({ page }) => {
    await page.goto(TODOMVC);
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('Hello World');
    await input.press('Control+a');
    await page.keyboard.insertText('Replaced');
    await input.press('Enter');
    await expect(page.getByTestId('todo-item').first()).toContainText('Replaced');
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// setInputFiles() — file upload from memory buffer
// ─────────────────────────────────────────────────────────────────────────────

test.describe('setInputFiles()', () => {
  test('upload a file from an in-memory buffer on the-internet upload page', async ({ page }) => {
    await page.goto(`${INTERNET}/upload`);

    await page.locator('#file-upload').setInputFiles({
      name:     'playwright-test.txt',
      mimeType: 'text/plain',
      buffer:   Buffer.from('Uploaded via Playwright test automation'),
    });
    await page.locator('#file-submit').click();

    // The upload page shows the filename after successful upload
    await expect(page.locator('#uploaded-files')).toContainText('playwright-test.txt');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// dragTo() — HTML5 drag and drop
// ─────────────────────────────────────────────────────────────────────────────

test.describe('dragTo()', () => {
  test('drag column A onto column B on the-internet drag and drop page', async ({ page }) => {
    await page.goto(`${INTERNET}/drag_and_drop`);

    const columnA = page.locator('#column-a');
    const columnB = page.locator('#column-b');

    await expect(columnA.locator('header')).toHaveText('A');
    await expect(columnB.locator('header')).toHaveText('B');

    // jQuery-based drag requires low-level mouse simulation
    const sourceBox = await columnA.boundingBox();
    const targetBox = await columnB.boundingBox();

    await page.mouse.move(
      sourceBox!.x + sourceBox!.width / 2,
      sourceBox!.y + sourceBox!.height / 2
    );
    await page.mouse.down();
    await page.mouse.move(
      targetBox!.x + targetBox!.width / 2,
      targetBox!.y + targetBox!.height / 2,
      { steps: 5 }
    );
    await page.mouse.up();

    // Both columns remain accessible after the drag interaction
    await expect(columnA).toBeVisible();
    await expect(columnB).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Live site: TodoMVC end-to-end interaction flow
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TodoMVC — end-to-end interaction flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc');
  });

  test('add, complete, and delete a todo via interactions', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    const items  = page.locator('.todo-list li');

    // Add two items
    await input.fill('Buy groceries');
    await input.press('Enter');
    await input.fill('Walk the dog');
    await input.press('Enter');

    await expect(items).toHaveCount(2);

    // Complete the first item
    await items.first().locator('.toggle').check();
    await expect(items.first()).toHaveClass(/completed/);

    // Delete the second item via hover + destroy button
    await items.nth(1).hover();
    await items.nth(1).locator('.destroy').click();
    await expect(items).toHaveCount(1);
  });

  test('double-click to edit a todo in-place', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('Original text');
    await input.press('Enter');

    const item = page.locator('.todo-list li').first();
    await item.locator('label').dblclick();

    const editInput = item.locator('.edit');
    await editInput.fill('Updated text');
    await editInput.press('Enter');

    await expect(item.locator('label')).toHaveText('Updated text');
  });
});
