# Playwright API and Web Testing Framework (TypeScript) 🚀

## 👤 Author

- Name: Mahiteja Bollojula
- LinkedIn: [https://www.linkedin.com/in/mahiteja-bollojula-477a60145/](https://www.linkedin.com/in/mahiteja-bollojula-477a60145/)
- Email: mahiteja.bollojula01@gmail.com
- GitHub: [https://github.com/mahiteja](https://github.com/mahiteja)

Production-oriented Playwright framework that combines API automation and browser automation in one TypeScript codebase. It is built around reusable fixtures, typed domain clients, environment-aware configuration, custom assertions, schema validation, and CI-ready reporting.

## 📚 Concept Playbooks

Use these quick-reference playbooks to understand the core testing concepts used in this framework:

- 🔌 API Concepts Playbook: [Playwright API Playbook](https://mahiteja.github.io/playwright-api-playbook/)
  Covers API-first test design, request/response validation, authentication patterns, and resilient API automation techniques.
- 🖥️ Web Concepts Playbook: [Playwright TypeScript Playbook](https://mahiteja.github.io/playwright-typescript-playbook/)
  Covers locator strategy, page-object patterns, UI stability practices, and maintainable end-to-end browser workflows.

This project is aimed at external developers and open-source contributors who want to:

- validate REST APIs quickly with typed helpers
- run realistic UI tests with robust locator and wait strategies
- cover advanced auth and network mocking scenarios
- contribute new clients, tests, matchers, or tooling in a consistent structure

## 📌 Project Overview

The framework provides two execution tracks under a single Playwright config:

- API track: uses isolated API request contexts, typed clients, custom response matchers, Zod schemas, auth helpers, and payload/header resource loaders.
- Web track: uses page objects and fixture injection for maintainable UI automation patterns.

It demonstrates practical patterns for:

- request lifecycle management
- auth strategies (API key, Basic, Bearer, OAuth2, NTLM, mTLS, cookie state)
- schema contract validation
- data-driven testing
- snapshot and visual regression testing
- API and UI hybrid flows
- request interception (REST, GraphQL, SSE, WebSocket observation)
- sharding and CI report aggregation

## 🧩 Topics Covered

Major domain areas implemented in this repository:

- API client abstraction with typed wrappers and failure logging
- environment-aware fixture composition
- reusable auth header/token/certificate helpers
- structured resource loading from JSON and YAML
- custom Playwright matchers for API quality signals
- Zod schema contracts and inferred TS types
- Page Object Model with composition-based fixture injection
- locator strategy deep-dive on real public sites
- interaction patterns for keyboard/mouse/forms/uploads/drag-drop
- explicit waiting and anti-flakiness patterns
- visual regression baselines and masking/tolerance controls
- network interception and protocol-level mocks
- API seed plus UI verify hybrid testing
- GitHub Actions matrix sharding, report merge, and publication

## ⚡ Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Playwright browser dependencies installed via Playwright CLI

### Installation

```bash
npm install
npm run install:pw
npm run lint
```

### First Test Run

```bash
npm run test:test
```

### Optional Interactive Modes

```bash
npm run test:debug
npm run test:ui
npm run report
```

## 🗂️ Project Structure

```text
playwright-api-framework/
  .env.test / .env.uat                Environment-specific variables
  playwright.config.ts                Global Playwright config, project split, reporters
  package.json                        Scripts and dependency manifest
  tsconfig.json                       TypeScript compiler setup

  lib/
    api-fixtures.ts                   API fixtures: apiContext, usersClient, authHeaders
    web-fixtures.ts                   Web fixture: todoPage
    base/ApiClient.ts                 Base typed HTTP wrapper
    clients/UsersClient.ts            Domain client for /users
    auth/
      bearerAuth.ts                   API key, basic, bearer helper builders
      oauth2.ts                       OAuth2 grant helpers
      mtls.ts                         mTLS certificate option builders
    schemas/userSchema.ts             Zod schemas and inferred user types
    matchers/customMatchers.ts        expect.extend API matchers + TS augmentation
    pages/TodoPage.ts                 TodoMVC page object
    utils/
      envLoader.ts                    Typed environment loader
      headerLoader.ts                 Backward-compatible loadHeaders export
      resourceLoader.ts               JSON payload + YAML header loaders

  tests/
    api-automation/
      users/                          CRUD, schema checks, snapshots, SLAs
      auth/                           All authentication mechanism examples
      polling/                        expect.poll, timeout/retry patterns
    web-automation/
      assertions/                     Locator and page assertion patterns
      locators/                       Locator strategy reference suite
      interactions/                   User action simulation patterns
      waiting/                        Wait strategy reference suite
      visual/                         Screenshot/visual regression patterns
      mocking/                        REST/GraphQL/SSE/WS interception patterns
      hybrid/                         API + UI combined workflow patterns
      page-objects/                   POM usage and fixture composition patterns

  resources/
    headers/                          Environment YAML header bundles
    payloads/users/                   Example JSON payloads for user APIs

  config/
    headers.test.yaml / headers.uat.yaml Legacy/alternate header config location

  .github/workflows/api-tests.yml     CI: sharded execution + merged reports
```

## ⚙️ Configuration

### Environment Selection

Set TEST_ENV to choose which environment file is loaded by [playwright.config.ts](playwright.config.ts):

- test uses [.env.test](.env.test)
- uat uses [.env.uat](.env.uat)

Example:

```bash
npm run test:test
npm run test:uat
```

### Environment Variables

Core variables consumed by [lib/utils/envLoader.ts](lib/utils/envLoader.ts):

- TEST_ENV
- BASE_URL
- API_KEY
- BASIC_USER, BASIC_PASS
- BEARER_TOKEN
- OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, OAUTH_TOKEN_URL
- NTLM_USER, NTLM_PASS, NTLM_URL
- MTLS_ORIGIN, MTLS_CERT_PATH, MTLS_KEY_PATH, MTLS_CA_PATH
- STORAGE_STATE_PATH

### Header Injection

Headers are loaded from [resources/headers/test.yaml](resources/headers/test.yaml) or [resources/headers/uat.yaml](resources/headers/uat.yaml) and merged into context defaults.

### Playwright Config Highlights

Implemented in [playwright.config.ts](playwright.config.ts):

- testDir set to tests
- two projects: api-tests and web-tests
- fullyParallel enabled
- CI-aware workers/reporter behavior
- optional shard from SHARD_TOTAL and SHARD_INDEX
- html/list/allure reporters enabled; blob reporter in CI
- trace/screenshot/video retention on failure
- api and web baseURL/header behavior separated per project

## 📊 Allure Reporting Process

Allure reporting is enabled by default in [playwright.config.ts](playwright.config.ts) via `allure-playwright`.

### 1. Run tests to produce allure-results

```bash
npm run test:test
```

Or run a focused test file:

```bash
npx playwright test tests/api-automation/users/getUser.spec.ts --project=api-tests
```

This produces raw Allure result files in [allure-results](allure-results).

### 2. Generate static Allure HTML report

```bash
npm run allure:gen
```

This compiles [allure-results](allure-results) into [allure-report/index.html](allure-report/index.html).

### 3. Open the report

```bash
npm run allure:open
```

### Notes

- Clean regeneration is built into `allure:gen` (`--clean`).
- CI in [.github/workflows/api-tests.yml](.github/workflows/api-tests.yml) also generates Allure when `allure-results` is present.
- If you run PowerShell with strict execution policy, use `npm.cmd`/`npx.cmd` variants.

## 💡 Usage Examples

### API test with typed client and custom matchers

```ts
import { test, expect } from '../../../lib/api-fixtures';
import { UserSchema } from '../../../lib/schemas/userSchema';

test('returns schema-valid user', async ({ usersClient }) => {
  const res = await usersClient.getUser(1);
  await expect(res).toHaveStatusCode(200);
  await expect(res).toBeSuccessfulJSON();
  await expect(res).toMatchApiSchema(UserSchema);
});
```

### Load payload fixtures from resources

```ts
import { loadPayload } from '../../../lib/utils/resourceLoader';
import type { CreateUserPayload } from '../../../lib/clients/UsersClient';

const createPayload = loadPayload<CreateUserPayload>('users', 'create');
```

### API key and basic auth header builders

```ts
import { apiKeyHeader, basicAuthHeader } from '../../../lib/auth/bearerAuth';

const keyHeaders = apiKeyHeader('my-key');
const basic = basicAuthHeader('user', 'pass');
```

### Page object usage through web fixture

```ts
import { test, expect } from '../../../lib/web-fixtures';

test('add todo using injected page object', async ({ todoPage }) => {
  await todoPage.goto();
  await todoPage.addTodo('Buy groceries');
  await expect(todoPage.todoItems).toHaveCount(1);
});
```

### OAuth2 client credentials helper

```ts
import { clientCredentialsGrant } from '../../../lib/auth/oauth2';

const token = await clientCredentialsGrant(
  tokenCtx,
  process.env.OAUTH_TOKEN_URL!,
  process.env.OAUTH_CLIENT_ID!,
  process.env.OAUTH_CLIENT_SECRET!,
  'api:read'
);
```

## 🧪 Scripts

From [package.json](package.json):

- npm run test: run all Playwright tests
- npm run test:test: force TEST_ENV=test and run tests
- npm run test:uat: force TEST_ENV=uat and run tests
- npm run test:debug: run in Playwright debug mode
- npm run test:ui: run in Playwright UI mode
- npm run report: open last Playwright HTML report
- npm run lint: type-check via tsc --noEmit
- npm run install:pw: install Chromium with dependencies
- npm run allure:gen: generate Allure report from allure-results
- npm run allure:open: open generated Allure report

Local sharding example:

```bash
SHARD_TOTAL=4 SHARD_INDEX=1 npx playwright test
```

## 📦 Dependencies

Key runtime dependencies:

- @playwright/test: test runner, browser and API automation primitives
- zod: schema contracts and runtime validation
- dotenv: environment file loading
- js-yaml: YAML parsing for environment-specific headers

Key development dependencies:

- typescript and @types/node: strict TS checks and node typings
- cross-env: cross-platform environment variable setting in scripts
- allure-playwright: Playwright reporter that emits Allure raw result files
- allure-commandline: CLI used by `allure:gen` and `allure:open`

## 🤝 Contributing

External contributors are welcome.

### Contribution Workflow

1. Fork and clone.
2. Install dependencies and Playwright browsers.
3. Create a branch for your change.
4. Add or update tests close to the changed behavior.
5. Run lint and relevant test files locally.
6. Open a pull request with rationale and test evidence.

### Local Validation Checklist

```bash
npm run lint
npm run test:test
```

For targeted iteration:

```bash
npx playwright test tests/api-automation/users/getUser.spec.ts
npx playwright test tests/web-automation/page-objects/todoApp.spec.ts
```

### Where to Extend

- add new domain client classes under [lib/clients/UsersClient.ts](lib/clients/UsersClient.ts) pattern
- wire client fixtures in [lib/api-fixtures.ts](lib/api-fixtures.ts)
- add schema contracts in [lib/schemas/userSchema.ts](lib/schemas/userSchema.ts)
- add custom assertions in [lib/matchers/customMatchers.ts](lib/matchers/customMatchers.ts)
- add new test resources under [resources/payloads/users/create.json](resources/payloads/users/create.json) and [resources/headers/test.yaml](resources/headers/test.yaml)

## 🔄 CI/CD

[.github/workflows/api-tests.yml](.github/workflows/api-tests.yml) runs:

- 4-way sharded Playwright execution
- blob artifact upload from each shard
- merged HTML report generation
- optional Allure generation
- optional GitHub Pages publishing for main branch pushes

Required repository secrets for authenticated environments include BASE_URL, BEARER_TOKEN, API_KEY, BASIC_USER/BASIC_PASS, and OAuth2 credentials.

## 🐳 Jenkins And Docker Compose

Containerized pipeline files are included:

- [Jenkinsfile](Jenkinsfile): Jenkins declarative pipeline running tests in a Playwright Docker image
- [docker-compose.yml](docker-compose.yml): local container execution for lint, tests, and Allure generation

Run with Docker Compose:

```bash
docker compose up --build playwright-tests
```

Run with Jenkins:

- create a Pipeline job pointing to [Jenkinsfile](Jenkinsfile)
- ensure Jenkins agent has Docker access
- run the job; reports are archived from playwright-report, test-results, allure-results, and allure-report

## 📚 API Reference

A full TypeDoc-style API reference for exported and internally significant symbols is available in [API_REFERENCE.md](API_REFERENCE.md).

## 🌐 Web Reference

A dedicated web automation reference is available in [WEB_REFERENCE.md](WEB_REFERENCE.md).

