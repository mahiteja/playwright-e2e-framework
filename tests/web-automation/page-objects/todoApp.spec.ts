/**
 * Author: Mahiteja Bollojula
 * LinkedIn: https://www.linkedin.com/in/mahiteja-bollojula-477a60145/
 * todoApp.spec.ts
 *
 * Chapter 06 — Page Object Model Architecture.
 *
 * Demonstrates two POM patterns using TodoMVC (https://demo.playwright.dev/todomvc):
 *
 *  1. Composition pattern  — TodoPage class injected via custom fixture (lib/web-fixtures.ts)
 *  2. Direct instantiation — new TodoPage(page) inside a test for comparison
 *
 * Design principles:
 *  - Page Objects encapsulate UI actions only — NO assertions inside them
 *  - Fixtures manage lifecycle (create, inject, teardown)
 *  - Tests own the assertions → clear separation of concerns
 */

import { test, expect } from '../../../lib/web-fixtures';
import { TodoPage }  from '../../../lib/pages/TodoPage';

// ─────────────────────────────────────────────────────────────────────────────
// Pattern 1 — Composition via custom fixture
// `todoPage` is injected by lib/web-fixtures.ts; no `new TodoPage(page)` needed
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TodoPage via fixture (composition pattern)', () => {
  test.beforeEach(async ({ todoPage }) => {
    await todoPage.goto();
  });

  test('add a single todo and verify it appears', async ({ todoPage }) => {
    await todoPage.addTodo('Buy groceries');

    await expect(todoPage.todoItems).toHaveCount(1);
    await expect(todoPage.todoItems.first()).toContainText('Buy groceries');
  });

  test('add multiple todos in sequence', async ({ todoPage }) => {
    await todoPage.addTodos('Task A', 'Task B', 'Task C');

    await expect(todoPage.todoItems).toHaveCount(3);
    await expect(todoPage.todoCount).toContainText('3');
  });

  test('complete a todo — item gets completed class', async ({ todoPage }) => {
    await todoPage.addTodo('Go for a run');
    await todoPage.checkTodo(0);

    await expect(todoPage.todoItems.first()).toHaveClass(/completed/);
    // Count of "items left" drops to 0
    await expect(todoPage.todoCount).toContainText('0');
  });

  test('delete a todo by hovering and clicking destroy', async ({ todoPage }) => {
    await todoPage.addTodos('Keep me', 'Delete me');
    await expect(todoPage.todoItems).toHaveCount(2);

    await todoPage.deleteTodo(1);

    await expect(todoPage.todoItems).toHaveCount(1);
    await expect(todoPage.todoItems.first()).toContainText('Keep me');
  });

  test('edit a todo in-place with double-click', async ({ todoPage }) => {
    await todoPage.addTodo('Original text');
    await todoPage.editTodo(0, 'Updated text');

    await expect(todoPage.todoItems.first()).toContainText('Updated text');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Filter & clear — Active / Completed views
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Filters and clearCompleted()', () => {
  test.beforeEach(async ({ todoPage }) => {
    await todoPage.goto();
    await todoPage.addTodos('Task 1', 'Task 2', 'Task 3');
    await todoPage.checkTodo(0); // complete "Task 1"
  });

  test('Active filter shows only incomplete items', async ({ todoPage }) => {
    await todoPage.filterActive();

    await expect(todoPage.todoItems).toHaveCount(2);
    await expect(todoPage.todoItems).toContainText(['Task 2', 'Task 3']);
  });

  test('Completed filter shows only finished items', async ({ todoPage }) => {
    await todoPage.filterCompleted();

    await expect(todoPage.todoItems).toHaveCount(1);
    await expect(todoPage.todoItems.first()).toContainText('Task 1');
  });

  test('All filter shows every item', async ({ todoPage }) => {
    await todoPage.filterCompleted();
    await todoPage.filterAll();

    await expect(todoPage.todoItems).toHaveCount(3);
  });

  test('clearCompleted() removes all finished items', async ({ todoPage }) => {
    await todoPage.clearCompleted();

    await expect(todoPage.todoItems).toHaveCount(2);
    // Verify the remaining items are exactly Task 2 and Task 3 (no Task 1)
    await expect(todoPage.todoItems).toHaveText(['Task 2', 'Task 3']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Pattern 2 — Direct instantiation (no fixture)
// Shows how to use the POM without a custom fixture — useful in tests that
// already receive `page` from another source.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TodoPage via direct instantiation', () => {
  test('create instance inline — same page object, different wiring style', async ({ page }) => {
    // Instantiate manually — equivalent to the fixture approach above
    const todoPage = new TodoPage(page);
    await todoPage.goto();

    await todoPage.addTodos('Buy milk', 'Read a book');
    await todoPage.checkTodo(0);

    // Assertions still live in the test, not in the page object
    await expect(todoPage.todoItems).toHaveCount(2);
    await expect(todoPage.todoItems.first()).toHaveClass(/completed/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Pattern 3 — POM state-query methods
// Page objects can expose query methods that return data — never assertions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('POM state-query methods', () => {
  test('getItemCount() and getCountText() return current state', async ({ todoPage }) => {
    await todoPage.goto();
    await todoPage.addTodos('Alpha', 'Beta', 'Gamma');

    const count = await todoPage.getItemCount();
    expect(count).toBe(3);

    const countText = await todoPage.getCountText();
    expect(countText).toContain('3');
  });

  test('getTodoText() and isCompleted() inspect individual items', async ({ todoPage }) => {
    await todoPage.goto();
    await todoPage.addTodo('Buy coffee');
    await todoPage.checkTodo(0);

    const text      = await todoPage.getTodoText(0);
    const completed = await todoPage.isCompleted(0);

    expect(text).toBe('Buy coffee');
    expect(completed).toBe(true);
  });
});
