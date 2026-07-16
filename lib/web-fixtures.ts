/**
 * Author: Mahiteja Bollojula
 * LinkedIn: https://www.linkedin.com/in/mahiteja-bollojula-477a60145/
 * web-fixtures.ts
 *
 * Extends Playwright's base `test` object with web-specific fixtures.
 * Import { test, expect } from here in web automation spec files
 * that need page-object instances pre-wired to the current page.
 *
 * Fixtures provided:
 *  todoPage — TodoPage instance injected with the active `page` fixture
 *
 * All standard Playwright fixtures (page, browser, context, request, …)
 * remain available because test.extend() inherits the base object.
 */

import { test as base, expect as baseExpect } from '@playwright/test';
import { TodoPage } from './pages/TodoPage';

// ── Fixture type declarations ─────────────────────────────────────────────────

interface WebFixtures {
  /** Fully constructed TodoPage wired to the current `page`. */
  todoPage: TodoPage;
}

// ── Extended test object ───────────────────────────────────────────────────────

export const test = base.extend<WebFixtures>({
  todoPage: async ({ page }, use) => {
    const todo = new TodoPage(page);
    await use(todo);
    // No teardown needed — `page` is reset between tests automatically
  },
});

export { baseExpect as expect };
