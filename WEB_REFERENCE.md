# Web Reference 🌐

## 👤 Author

- Name: Mahiteja Bollojula
- LinkedIn: [https://www.linkedin.com/in/mahiteja-bollojula-477a60145/](https://www.linkedin.com/in/mahiteja-bollojula-477a60145/)
- Email: mahiteja.bollojula01@gmail.com
- GitHub: [https://github.com/mahiteja](https://github.com/mahiteja)

This document is the external developer and contributor reference for the web automation side of this repository.

## 🎯 Purpose

The web layer demonstrates practical Playwright browser testing patterns in a maintainable structure:

- fixture-driven test composition
- Page Object Model via composition
- reliable locator and assertion strategies
- realistic user interaction simulation
- robust waiting and async handling
- network interception and protocol mocking
- visual regression techniques
- hybrid API + UI flows

## 🏗️ Web Architecture

Primary modules:

- [lib/web-fixtures.ts](lib/web-fixtures.ts): extends Playwright test with page object fixtures
- [lib/pages/TodoPage.ts](lib/pages/TodoPage.ts): TodoMVC page object
- [tests/web-automation](tests/web-automation): web-focused suites grouped by domain

Fixture flow:

1. test imports come from [lib/web-fixtures.ts](lib/web-fixtures.ts)
2. web fixture injects a TodoPage instance bound to Playwright page
3. tests call page object actions and assert at spec level

## 🧩 Web Fixture API

Source: [lib/web-fixtures.ts](lib/web-fixtures.ts)

### test

Signature:

```ts
export const test = base.extend<WebFixtures>({
  todoPage: async ({ page }, use) => {
    const todo = new TodoPage(page);
    await use(todo);
  },
});
```

Provides standard Playwright fixtures plus todoPage.

### expect

Signature:

```ts
export { baseExpect as expect };
```

Re-exported expect for consistent imports.

### WebFixtures

Signature:

```ts
interface WebFixtures {
  todoPage: TodoPage;
}
```

## 📄 Page Object Reference

Source: [lib/pages/TodoPage.ts](lib/pages/TodoPage.ts)

### Class: TodoPage

Role:

- Encapsulates TodoMVC user actions and query helpers.
- Keeps assertions in tests, not in page object methods.

Constructor:

```ts
constructor(readonly page: Page)
```

Public locators:

```ts
readonly newTodoInput: Locator
readonly todoItems: Locator
readonly todoCount: Locator
readonly clearCompletedBtn: Locator
readonly toggleAllCheckbox: Locator
```

Public methods:

- goto
  - Signature: async goto(): Promise<void>
  - Behavior: navigates to /todomvc using project baseURL.

- addTodo
  - Signature: async addTodo(text: string): Promise<void>
  - Behavior: fills input and submits via Enter.

- addTodos
  - Signature: async addTodos(...items: string[]): Promise<void>
  - Behavior: sequentially adds all provided items.

- checkTodo
  - Signature: async checkTodo(index: number): Promise<void>
  - Behavior: marks item at index as completed.

- uncheckTodo
  - Signature: async uncheckTodo(index: number): Promise<void>
  - Behavior: unmarks item at index.

- editTodo
  - Signature: async editTodo(index: number, newText: string): Promise<void>
  - Behavior: enters edit mode with double-click and commits via Enter.

- deleteTodo
  - Signature: async deleteTodo(index: number): Promise<void>
  - Behavior: hover-reveals destroy button and clicks it.

- toggleAll
  - Signature: async toggleAll(): Promise<void>
  - Behavior: toggles completion state for all items.

- clearCompleted
  - Signature: async clearCompleted(): Promise<void>
  - Behavior: removes completed items.

- filterAll
  - Signature: async filterAll(): Promise<void>

- filterActive
  - Signature: async filterActive(): Promise<void>

- filterCompleted
  - Signature: async filterCompleted(): Promise<void>

- getItemCount
  - Signature: async getItemCount(): Promise<number>
  - Returns: visible todo item count.

- getCountText
  - Signature: async getCountText(): Promise<string>
  - Returns: text from items-left badge.

- getTodoText
  - Signature: async getTodoText(index: number): Promise<string>
  - Returns: label text for indexed item.

- isCompleted
  - Signature: async isCompleted(index: number): Promise<boolean>
  - Returns: true when item class includes completed.

## 🧪 Web Test Domains

### Assertions

Source: [tests/web-automation/assertions/assertions.spec.ts](tests/web-automation/assertions/assertions.spec.ts)

Covers locator and page assertions with auto-retry semantics:

- visibility and hidden state
- text/value/attribute/class/count checks
- enabled/disabled/checked/focused checks
- title and URL checks
- soft assertions
- per-assertion timeout tuning

### Locators

Source: [tests/web-automation/locators/locators.spec.ts](tests/web-automation/locators/locators.spec.ts)

Covers role- and semantics-first strategies:

- getByRole
- getByText
- getByLabel
- getByPlaceholder
- getByTestId
- getByAltText
- getByTitle
- chaining, filtering, and nth/first/last

### Interactions

Source: [tests/web-automation/interactions/interactions.spec.ts](tests/web-automation/interactions/interactions.spec.ts)

Covers user action simulation:

- fill and clear
- selectOption
- check and uncheck
- click and dblclick
- hover
- keyboard interactions
- file uploads with in-memory buffers
- drag and drop with mouse primitives

### Waiting

Source: [tests/web-automation/waiting/waiting.spec.ts](tests/web-automation/waiting/waiting.spec.ts)

Covers wait strategy hierarchy:

- expect retries
- waitForLoadState
- waitForURL
- waitForResponse
- waitForFunction
- anti-pattern example for waitForTimeout

### Network Mocking and Protocol Patterns

Source: [tests/web-automation/mocking/routeInterception.spec.ts](tests/web-automation/mocking/routeInterception.spec.ts)

Covers:

- route.fulfill for REST mocks
- route.fetch + fulfill for response augmentation
- route.abort error-path testing
- GraphQL operation-based mocking
- WebSocket observation
- Server-Sent Events mocked stream

### Visual Regression

Source: [tests/web-automation/visual/visual.spec.ts](tests/web-automation/visual/visual.spec.ts)

Covers:

- full-page baselines
- element snapshots
- diff tolerances
- animation disabling for determinism
- masking dynamic regions
- dark mode emulation
- responsive viewport baselines

### Hybrid API + UI

Source: [tests/web-automation/hybrid/apiSeedUiVerify.spec.ts](tests/web-automation/hybrid/apiSeedUiVerify.spec.ts)

Patterns:

- API seed then UI verification
- API auth then browser reuse
- UI interaction with API teardown in finally
- page.request with shared browser session state

### Page Object Usage Patterns

Source: [tests/web-automation/page-objects/todoApp.spec.ts](tests/web-automation/page-objects/todoApp.spec.ts)

Demonstrates:

- fixture-injected composition pattern
- direct class instantiation pattern
- state query methods that return data only

## ▶️ Running Web Suites

Run all web tests:

```bash
npx playwright test --project=web-tests
```

Run one web domain:

```bash
npx playwright test tests/web-automation/locators/locators.spec.ts --project=web-tests
```

Run visual tests and update baselines:

```bash
npx playwright test tests/web-automation/visual/visual.spec.ts --project=web-tests --update-snapshots
```

Run in UI/debug modes:

```bash
npm run test:ui
npm run test:debug
```

## ⚙️ Configuration Relevant to Web

Source: [playwright.config.ts](playwright.config.ts)

web-tests project uses:

- Desktop Chrome device profile
- baseURL: https://demo.playwright.dev
- viewport: 1280x720
- empty extraHTTPHeaders to avoid API-header bleed into browser navigation

Global web-relevant settings:

- test timeout: 30000 ms
- fullyParallel: true
- trace/screenshot/video retained on failure
- HTML report output to playwright-report

## 🤝 Contributor Guidelines for Web Changes

When contributing web tests or page objects:

- Prefer role/label/testid locators over fragile CSS selectors.
- Keep assertions in spec files, not in page object action methods.
- Use condition-based waiting, avoid fixed sleeps.
- Add visual baselines intentionally and review diffs before committing.
- Keep test data setup deterministic and isolated.
- Add or update tests in the nearest domain folder under [tests/web-automation](tests/web-automation).

## 🔗 Related Docs

- Project overview and setup: [README.md](README.md)
- API and shared library symbol reference: [API_REFERENCE.md](API_REFERENCE.md)