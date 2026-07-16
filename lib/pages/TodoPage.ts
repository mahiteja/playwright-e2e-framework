/**
 * Author: Mahiteja Bollojula
 * LinkedIn: https://www.linkedin.com/in/mahiteja-bollojula-477a60145/
 * TodoPage.ts
 *
 * Page Object for https://demo.playwright.dev/todomvc
 * Demonstrates the modern composition-based POM pattern (Chapter 06).
 *
 * Design principles:
 *  - Constructor receives `page` via injection (no inheritance needed)
 *  - Locators defined once as readonly properties
 *  - Methods encapsulate user actions only — no assertions inside
 *  - Assertions belong in the test spec
 */

import { type Page, type Locator } from '@playwright/test';

export class TodoPage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly newTodoInput:     Locator;
  readonly todoItems:        Locator;
  readonly todoCount:        Locator;
  readonly clearCompletedBtn: Locator;
  readonly toggleAllCheckbox: Locator;

  constructor(readonly page: Page) {
    this.newTodoInput      = page.getByPlaceholder('What needs to be done?');
    this.todoItems         = page.locator('.todo-list li');
    this.todoCount         = page.locator('.todo-count');
    this.clearCompletedBtn = page.getByRole('button', { name: 'Clear completed' });
    this.toggleAllCheckbox = page.locator('.toggle-all');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  /** Navigate to the TodoMVC demo (relative to baseURL). */
  async goto(): Promise<void> {
    await this.page.goto('/todomvc');
  }

  // ── Write actions ────────────────────────────────────────────────────────────

  /** Add a new todo item. */
  async addTodo(text: string): Promise<void> {
    await this.newTodoInput.fill(text);
    await this.newTodoInput.press('Enter');
  }

  /** Add multiple todos in sequence. */
  async addTodos(...items: string[]): Promise<void> {
    for (const item of items) {
      await this.addTodo(item);
    }
  }

  /** Check (complete) the todo at the given 0-based index. */
  async checkTodo(index: number): Promise<void> {
    await this.todoItems.nth(index).locator('.toggle').check();
  }

  /** Uncheck (reactivate) the todo at the given 0-based index. */
  async uncheckTodo(index: number): Promise<void> {
    await this.todoItems.nth(index).locator('.toggle').uncheck();
  }

  /** Double-click to enter edit mode and set new text, then confirm with Enter. */
  async editTodo(index: number, newText: string): Promise<void> {
    await this.todoItems.nth(index).locator('label').dblclick();
    const editInput = this.todoItems.nth(index).locator('.edit');
    await editInput.fill(newText);
    await editInput.press('Enter');
  }

  /** Hover over the item to reveal the destroy button, then click it. */
  async deleteTodo(index: number): Promise<void> {
    await this.todoItems.nth(index).hover();
    await this.todoItems.nth(index).locator('.destroy').click();
  }

  /** Toggle all items at once via the "toggle-all" checkbox. */
  async toggleAll(): Promise<void> {
    await this.toggleAllCheckbox.click();
  }

  /** Remove all completed items via the "Clear completed" button. */
  async clearCompleted(): Promise<void> {
    await this.clearCompletedBtn.click();
  }

  // ── Filter actions ───────────────────────────────────────────────────────────

  async filterAll(): Promise<void> {
    await this.page.getByRole('link', { name: 'All' }).click();
  }

  async filterActive(): Promise<void> {
    await this.page.getByRole('link', { name: 'Active' }).click();
  }

  async filterCompleted(): Promise<void> {
    await this.page.getByRole('link', { name: 'Completed' }).click();
  }

  // ── State queries (return data, never assert) ────────────────────────────────

  /** Number of visible todo items. */
  async getItemCount(): Promise<number> {
    return this.todoItems.count();
  }

  /** Text content of the "n items left" count badge. */
  async getCountText(): Promise<string> {
    return (await this.todoCount.textContent()) ?? '';
  }

  /** Retrieve the label text for a todo at the given 0-based index. */
  async getTodoText(index: number): Promise<string> {
    return (await this.todoItems.nth(index).locator('label').textContent()) ?? '';
  }

  /** Returns true when the todo at `index` has the "completed" class. */
  async isCompleted(index: number): Promise<boolean> {
    const classes = await this.todoItems.nth(index).getAttribute('class') ?? '';
    return classes.includes('completed');
  }
}
