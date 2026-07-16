# TypeDoc-Style API Reference 📘

## 👤 Author

- Name: Mahiteja Bollojula
- LinkedIn: [https://www.linkedin.com/in/mahiteja-bollojula-477a60145/](https://www.linkedin.com/in/mahiteja-bollojula-477a60145/)
- Email: mahiteja.bollojula01@gmail.com
- GitHub: [https://github.com/mahiteja](https://github.com/mahiteja)

This document describes exported and internally significant symbols across the Playwright + TypeScript codebase.

## 🧭 Contents

- Configuration module APIs
- Core fixture APIs
- Base/client/auth utility APIs
- Schema and matcher APIs
- Page object APIs
- Test-suite significant symbols
- Enum inventory

## ⚙️ Configuration Module

Source: [playwright.config.ts](playwright.config.ts)

### testEnv (internal constant)

Signature:

```ts
const testEnv: string
```

Resolves the active environment from process env TEST_ENV, defaulting to test.

### envFile (internal constant)

Signature:

```ts
const envFile: string
```

Absolute path to the selected env file (.env.test or .env.uat) loaded by dotenv.

### shardTotal / shardIndex (internal constants)

Signatures:

```ts
const shardTotal: number
const shardIndex: number
```

Derived from SHARD_TOTAL and SHARD_INDEX to enable local or CI sharding.

### default export (Playwright config)

Signature:

```ts
export default defineConfig({...})
```

Defines project-wide runtime behavior:

- two projects (api-tests and web-tests)
- environment header injection via loadHeaders()
- trace/screenshot/video policies
- CI blob reporting and optional sharding

Side effects:

- loads dotenv before utility imports
- imports matcher registration module for global matcher availability

## 🧩 Fixtures

### lib/api-fixtures.ts

Source: [lib/api-fixtures.ts](lib/api-fixtures.ts)

#### resolveAuthHeaders (internal)

Signature:

```ts
function resolveAuthHeaders(): Record<string, string>
```

Returns auth headers using this precedence: Bearer token, then API key, then Basic auth.

Returns:

- Record<string, string>: merged auth header map (possibly empty)

Behavior notes:

- Basic auth value is base64(username:password)
- mTLS and NTLM are intentionally not handled in this helper

#### interface ApiFixtures (internal type map)

Signature:

```ts
interface ApiFixtures {
  apiContext: APIRequestContext
  usersClient: UsersClient
  authHeaders: Record<string, string>
}
```

Defines typed fixture contracts used by test.extend.

#### test

Signature:

```ts
export const test: TestType<PlaywrightTestArgs & PlaywrightTestOptions & ApiFixtures, ...>
```

Extended Playwright test object exposing:

- authHeaders fixture
- apiContext fixture (isolated APIRequestContext)
- usersClient fixture

Side effects:

- creates and disposes request context per fixture lifecycle

#### expect

Signature:

```ts
export { baseExpect as expect }
```

Re-export of Playwright expect for consistent imports.

### lib/web-fixtures.ts

Source: [lib/web-fixtures.ts](lib/web-fixtures.ts)

#### interface WebFixtures (internal type map)

Signature:

```ts
interface WebFixtures {
  todoPage: TodoPage
}
```

Defines typed fixture contracts for web tests.

#### test

Signature:

```ts
export const test: TestType<PlaywrightTestArgs & PlaywrightTestOptions & WebFixtures, ...>
```

Extended Playwright test object with todoPage fixture.

#### expect

Signature:

```ts
export { baseExpect as expect }
```

Re-export of Playwright expect.

## 🧱 Base Client and Domain Client

### lib/base/ApiClient.ts

Source: [lib/base/ApiClient.ts](lib/base/ApiClient.ts)

#### interface QueryParams

Signature:

```ts
export interface QueryParams {
  [key: string]: string | number | boolean | undefined
}
```

Represents optional URL query parameters accepted by API wrappers.

#### interface GetOptions

Signature:

```ts
export interface GetOptions {
  params?: QueryParams
  headers?: Record<string, string>
  timeout?: number
}
```

Options for GET/DELETE-like calls.

#### interface BodyOptions

Signature:

```ts
export interface BodyOptions {
  params?: QueryParams
  headers?: Record<string, string>
  timeout?: number
}
```

Options for body-bearing calls (POST/PUT/PATCH).

#### interface RequestLog (internal)

Signature:

```ts
interface RequestLog {
  method: string
  path: string
  status: number
  body?: unknown
}
```

Structured payload for failure logging.

#### class ApiClient

Signature:

```ts
export class ApiClient {
  constructor(protected readonly request: APIRequestContext)
  async get(path: string, options?: GetOptions): Promise<APIResponse>
  async post(path: string, payload: unknown, options?: BodyOptions): Promise<APIResponse>
  async put(path: string, payload: unknown, options?: BodyOptions): Promise<APIResponse>
  async patch(path: string, payload: unknown, options?: BodyOptions): Promise<APIResponse>
  async delete(path: string, options?: GetOptions): Promise<APIResponse>
  protected logOnFailure(log: RequestLog): void
  private sanitiseParams(params?: QueryParams): Record<string, string | number | boolean> | undefined
}
```

Role:

- reusable HTTP abstraction wrapping APIRequestContext

Constructor params:

- request: APIRequestContext, underlying transport context

Method details:

- get/post/put/patch/delete:
  - params:
    - path: string
    - payload: unknown (for body methods)
    - options: GetOptions | BodyOptions
  - returns: Promise<APIResponse>
  - behavior: sanitizes undefined query values and logs failed status responses
- sanitiseParams:
  - strips undefined query entries because Playwright rejects them
- logOnFailure:
  - prints structured failure block when status >= 400

Edge cases:

- options.params with only undefined values are omitted entirely
- log includes serialized request body when provided

### lib/clients/UsersClient.ts

Source: [lib/clients/UsersClient.ts](lib/clients/UsersClient.ts)

#### interface Geo

Signature:

```ts
export interface Geo {
  lat: string
  lng: string
}
```

Latitude/longitude string pair from user address payload.

#### interface Address

Signature:

```ts
export interface Address {
  street: string
  suite: string
  city: string
  zipcode: string
  geo: Geo
}
```

Nested address model inside User.

#### interface Company

Signature:

```ts
export interface Company {
  name: string
  catchPhrase: string
  bs: string
}
```

Company model inside User.

#### interface User

Signature:

```ts
export interface User {
  id: number
  name: string
  username: string
  email: string
  address: Address
  phone: string
  website: string
  company: Company
}
```

Typed representation of the users resource.

#### interface CreateUserPayload

Signature:

```ts
export interface CreateUserPayload {
  name: string
  username: string
  email: string
  phone?: string
  website?: string
}
```

Payload for create and full update operations.

#### type UpdateUserPayload

Signature:

```ts
export type UpdateUserPayload = Partial<CreateUserPayload>
```

Partial payload for PATCH updates.

#### class UsersClient

Signature:

```ts
export class UsersClient extends ApiClient {
  constructor(request: APIRequestContext)
  async listUsers(params?: { _limit?: number; _page?: number }, options?: GetOptions): Promise<APIResponse>
  async getUser(id: number, options?: GetOptions): Promise<APIResponse>
  async createUser(payload: CreateUserPayload, options?: BodyOptions): Promise<APIResponse>
  async updateUser(id: number, payload: CreateUserPayload, options?: BodyOptions): Promise<APIResponse>
  async patchUser(id: number, payload: UpdateUserPayload, options?: BodyOptions): Promise<APIResponse>
  async deleteUser(id: number, options?: GetOptions): Promise<APIResponse>
}
```

Role:

- typed domain client mapping user REST operations to base client wrappers

Behavior notes:

- listUsers merges pagination params with additional options.params

## 🔐 Auth Utilities

### lib/auth/bearerAuth.ts

Source: [lib/auth/bearerAuth.ts](lib/auth/bearerAuth.ts)

#### bearerHeader

Signature:

```ts
export function bearerHeader(token: string): { Authorization: string }
```

Builds Bearer auth header.

Params:

- token: string, non-empty access token

Returns:

- Authorization header object

Throws:

- Error when token is empty

#### basicAuthHeader

Signature:

```ts
export function basicAuthHeader(username: string, password: string): { Authorization: string }
```

Builds HTTP Basic Authorization header.

Params:

- username: string
- password: string

Returns:

- Authorization: Basic base64(username:password)

Throws:

- Error when either credential is missing

#### apiKeyHeader

Signature:

```ts
export function apiKeyHeader(apiKey: string, headerName = 'X-API-Key'): Record<string, string>
```

Builds API key header with customizable key name.

#### apiKeyParam

Signature:

```ts
export function apiKeyParam(apiKey: string, paramName = 'api_key'): Record<string, string>
```

Builds API key query param object.

### lib/auth/oauth2.ts

Source: [lib/auth/oauth2.ts](lib/auth/oauth2.ts)

#### interface TokenResponse

Signature:

```ts
export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in?: number
  scope?: string
  refresh_token?: string
}
```

Standard token endpoint response projection.

#### clientCredentialsGrant

Signature:

```ts
export async function clientCredentialsGrant(
  request: APIRequestContext,
  tokenUrl: string,
  clientId: string,
  clientSecret: string,
  scope?: string
): Promise<TokenResponse>
```

Performs OAuth2 client credentials grant.

Returns:

- Promise<TokenResponse>

Throws:

- Error including status and response text on non-OK response

#### refreshTokenGrant

Signature:

```ts
export async function refreshTokenGrant(
  request: APIRequestContext,
  tokenUrl: string,
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<TokenResponse>
```

Performs OAuth2 refresh token grant.

#### authorizationCodeGrant

Signature:

```ts
export async function authorizationCodeGrant(
  request: APIRequestContext,
  tokenUrl: string,
  clientId: string,
  code: string,
  redirectUri: string,
  codeVerifier: string
): Promise<TokenResponse>
```

Exchanges auth code + PKCE verifier for token set.

### lib/auth/mtls.ts

Source: [lib/auth/mtls.ts](lib/auth/mtls.ts)

#### interface MtlsCertConfig

Signature:

```ts
export interface MtlsCertConfig {
  origin: string
  certPath: string
  keyPath: string
  caPath?: string
  passphrase?: string
}
```

Input model for mTLS certificate definitions.

#### interface ClientCertEntry

Signature:

```ts
export interface ClientCertEntry {
  origin: string
  certPath: string
  keyPath: string
  caPath?: string
  passphrase?: string
}
```

Output model compatible with Playwright clientCertificates option.

#### buildClientCertificates

Signature:

```ts
export function buildClientCertificates(configs: MtlsCertConfig[]): ClientCertEntry[]
```

Builds valid certificate entries, skipping any config missing cert/key files.

Side effects:

- emits console warning when files are missing

#### singleMtlsOptions

Signature:

```ts
export function singleMtlsOptions(cfg: MtlsCertConfig): { clientCertificates?: ClientCertEntry[] }
```

Convenience wrapper for one mTLS origin.

Returns empty object when certificate files are unavailable.

## 🌍 Environment and Resource Utilities

### lib/utils/envLoader.ts

Source: [lib/utils/envLoader.ts](lib/utils/envLoader.ts)

#### interface Env

Signature:

```ts
export interface Env {
  TEST_ENV: string
  BASE_URL: string
  API_KEY: string
  BASIC_USER: string
  BASIC_PASS: string
  BEARER_TOKEN: string
  OAUTH_CLIENT_ID: string
  OAUTH_CLIENT_SECRET: string
  OAUTH_TOKEN_URL: string
  NTLM_USER: string
  NTLM_PASS: string
  NTLM_URL: string
  MTLS_ORIGIN: string
  MTLS_CERT_PATH: string
  MTLS_KEY_PATH: string
  MTLS_CA_PATH: string
  STORAGE_STATE_PATH: string
}
```

Typed environment shape consumed by tests and fixtures.

#### loadEnv

Signature:

```ts
export function loadEnv(): Env
```

Resolves process env with defaults for local development.

### lib/utils/resourceLoader.ts

Source: [lib/utils/resourceLoader.ts](lib/utils/resourceLoader.ts)

#### RESOURCES_ROOT (internal constant)

Signature:

```ts
const RESOURCES_ROOT: string
```

Absolute root path for resources directory.

#### loadPayload

Signature:

```ts
export function loadPayload<T>(domain: string, name: string): T
```

Loads and parses JSON payload fixture.

Params:

- domain: subfolder under resources/payloads
- name: file name without extension

Returns:

- parsed payload typed as T

Throws:

- Error when expected payload file does not exist

#### loadHeaders

Signature:

```ts
export function loadHeaders(env?: string): Record<string, string>
```

Loads and normalizes YAML header mapping.

Params:

- env: optional environment key; falls back to TEST_ENV then test

Returns:

- Record<string, string> (empty map when file is missing)

Throws:

- Error when YAML content is not a key-value mapping

Side effects:

- warning log when header file is absent

### lib/utils/headerLoader.ts

Source: [lib/utils/headerLoader.ts](lib/utils/headerLoader.ts)

#### loadHeaders (re-export)

Signature:

```ts
export { loadHeaders } from './resourceLoader'
```

Backward-compatible indirection to resource loader implementation.

## ✅ Schemas and Matchers

### lib/schemas/userSchema.ts

Source: [lib/schemas/userSchema.ts](lib/schemas/userSchema.ts)

#### GeoSchema

Signature:

```ts
export const GeoSchema = z.object({ lat: z.string(), lng: z.string() })
```

Coordinates schema.

#### AddressSchema

Signature:

```ts
export const AddressSchema = z.object({ street, suite, city, zipcode, geo })
```

User address schema.

#### CompanySchema

Signature:

```ts
export const CompanySchema = z.object({ name, catchPhrase, bs })
```

User company schema.

#### UserSchema

Signature:

```ts
export const UserSchema = z.object({ id, name, username, email, address, phone, website, company })
```

Full user resource contract.

#### UserListSchema

Signature:

```ts
export const UserListSchema = z.array(UserSchema)
```

List response contract.

#### CreateUserResponseSchema

Signature:

```ts
export const CreateUserResponseSchema = z.object({ id, name, username, email })
```

Create response subset contract.

#### Inferred types

Signatures:

```ts
export type User = z.infer<typeof UserSchema>
export type UserList = z.infer<typeof UserListSchema>
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>
```

Compile-time type projections from runtime schemas.

### lib/matchers/customMatchers.ts

Source: [lib/matchers/customMatchers.ts](lib/matchers/customMatchers.ts)

#### zodSafeParse (internal helper)

Signature:

```ts
function zodSafeParse(schema: { safeParse(v: unknown): ... }, value: unknown):
  { success: true } | { success: false; errors: Record<string, string[] | undefined> }
```

Adapter that normalizes zod safeParse results for matcher reporting.

#### toHaveStatusCode

Signature:

```ts
toHaveStatusCode(received: unknown, expected: number): Promise<{ pass: boolean; message(): string }>
```

Asserts exact HTTP status.

#### toBeSuccessfulJSON

Signature:

```ts
toBeSuccessfulJSON(received: unknown): Promise<{ pass: boolean; message(): string }>
```

Asserts 2xx and application/json content-type.

#### toMatchApiSchema

Signature:

```ts
toMatchApiSchema(received: unknown, schema: { safeParse(v: unknown): ... }): Promise<{ pass: boolean; message(): string }>
```

Asserts response body conforms to provided schema.

#### toContainKey

Signature:

```ts
toContainKey(received: unknown, key: string): Promise<{ pass: boolean; message(): string }>
```

Asserts top-level body key presence.

#### toRespondWithin

Signature:

```ts
toRespondWithin(received: unknown, maxMs: number, startTime: number): Promise<{ pass: boolean; message(): string }>
```

Asserts elapsed response duration against threshold.

#### Global matcher type augmentation

Signature:

```ts
declare global {
  namespace PlaywrightTest {
    interface Matchers<R, T = unknown> {
      toHaveStatusCode(expected: number): R
      toBeSuccessfulJSON(): R
      toMatchApiSchema(schema: { safeParse(v: unknown): { success: boolean; error?: ... } }): R
      toContainKey(key: string): R
      toRespondWithin(maxMs: number, startTime: number): R
    }
  }
}
```

Extends Playwright assertion typings for custom matchers.

## 📄 Page Object

### lib/pages/TodoPage.ts

Source: [lib/pages/TodoPage.ts](lib/pages/TodoPage.ts)

#### class TodoPage

Signature:

```ts
export class TodoPage {
  readonly newTodoInput: Locator
  readonly todoItems: Locator
  readonly todoCount: Locator
  readonly clearCompletedBtn: Locator
  readonly toggleAllCheckbox: Locator

  constructor(readonly page: Page)
  async goto(): Promise<void>
  async addTodo(text: string): Promise<void>
  async addTodos(...items: string[]): Promise<void>
  async checkTodo(index: number): Promise<void>
  async uncheckTodo(index: number): Promise<void>
  async editTodo(index: number, newText: string): Promise<void>
  async deleteTodo(index: number): Promise<void>
  async toggleAll(): Promise<void>
  async clearCompleted(): Promise<void>
  async filterAll(): Promise<void>
  async filterActive(): Promise<void>
  async filterCompleted(): Promise<void>
  async getItemCount(): Promise<number>
  async getCountText(): Promise<string>
  async getTodoText(index: number): Promise<string>
  async isCompleted(index: number): Promise<boolean>
}
```

Role:

- encapsulates TodoMVC interactions and state queries without assertions

Key method behavior:

- addTodos iterates sequentially through provided labels
- editTodo uses double-click to enter edit mode then commits with Enter
- deleteTodo requires hover to reveal destroy control
- isCompleted checks class attribute for completed marker

## 🧪 Test Suite Significant Symbols

These modules mostly define executable test scenarios rather than reusable exports. The following constants and internal constructs are significant for understanding behavior and extension points.

### tests/api-automation/users/getUser.spec.ts

Source: [tests/api-automation/users/getUser.spec.ts](tests/api-automation/users/getUser.spec.ts)

- BASE
  - Signature: const BASE = 'https://jsonplaceholder.typicode.com'
  - Purpose: canonical base URL constant (currently informational in this spec)
- smokeMatrix
  - Signature: const smokeMatrix: { path: string; expectedStatus: number }[]
  - Purpose: data-driven status coverage for endpoint paths

### tests/api-automation/users/createUser.spec.ts

Source: [tests/api-automation/users/createUser.spec.ts](tests/api-automation/users/createUser.spec.ts)

- createPayload
  - Signature: const createPayload = loadPayload<CreateUserPayload>('users', 'create')
  - Purpose: POST fixture payload source
- putPayload
  - Signature: const putPayload = loadPayload<CreateUserPayload>('users', 'put')
  - Purpose: PUT full replacement payload source
- patchPayload
  - Signature: const patchPayload = loadPayload<UpdateUserPayload>('users', 'patch')
  - Purpose: PATCH partial payload source
- userIds
  - Signature: const userIds = [1, 2, 3, 5, 8]
  - Purpose: data-driven GET schema validation matrix

### tests/api-automation/auth/authFlows.spec.ts

Source: [tests/api-automation/auth/authFlows.spec.ts](tests/api-automation/auth/authFlows.spec.ts)

- HTTPBIN
  - Signature: const HTTPBIN = 'https://httpbin.org'
  - Purpose: auth behavior echo endpoint target
- env
  - Signature: const env = loadEnv()
  - Purpose: runtime auth and endpoint configuration input

### tests/api-automation/polling/asyncJob.spec.ts

Source: [tests/api-automation/polling/asyncJob.spec.ts](tests/api-automation/polling/asyncJob.spec.ts)

- statusSequence (inside mocked lifecycle test)
  - Signature: const statusSequence = ['pending', 'pending', 'running', 'running', 'complete']
  - Purpose: deterministic mocked async-job state transitions

### tests/web-automation/hybrid/apiSeedUiVerify.spec.ts

Source: [tests/web-automation/hybrid/apiSeedUiVerify.spec.ts](tests/web-automation/hybrid/apiSeedUiVerify.spec.ts)

- API
  - Signature: const API = 'https://jsonplaceholder.typicode.com'
  - Purpose: hybrid API+UI seed/verify endpoint root

### tests/web-automation/locators/locators.spec.ts

Source: [tests/web-automation/locators/locators.spec.ts](tests/web-automation/locators/locators.spec.ts)

- PW_DOCS, INTERNET, TODOMVC
  - Signature: const PW_DOCS / INTERNET / TODOMVC: string
  - Purpose: stable public targets for locator patterns

### tests/web-automation/assertions/assertions.spec.ts

Source: [tests/web-automation/assertions/assertions.spec.ts](tests/web-automation/assertions/assertions.spec.ts)

- PW_DOCS, INTERNET, TODOMVC
  - Signature: const ...: string
  - Purpose: site constants used to exercise assertion APIs

### tests/web-automation/interactions/interactions.spec.ts

Source: [tests/web-automation/interactions/interactions.spec.ts](tests/web-automation/interactions/interactions.spec.ts)

- INTERNET, TODOMVC
  - Signature: const ...: string
  - Purpose: interaction playground endpoints

### tests/web-automation/mocking/routeInterception.spec.ts

Source: [tests/web-automation/mocking/routeInterception.spec.ts](tests/web-automation/mocking/routeInterception.spec.ts)

- API, INTERNET, GQL_ENDPOINT
  - Signature: const ...: string
  - Purpose: routing/mocking targets
- GET_USER_QUERY, CREATE_USER_MUTATION
  - Signature: const ...: string (GraphQL documents)
  - Purpose: operation-specific interception and assertions

### tests/web-automation/visual/visual.spec.ts

Source: [tests/web-automation/visual/visual.spec.ts](tests/web-automation/visual/visual.spec.ts)

- TODOMVC, PW_DOCS
  - Signature: const ...: string
  - Purpose: reproducible visual baseline targets

### tests/web-automation/waiting/waiting.spec.ts

Source: [tests/web-automation/waiting/waiting.spec.ts](tests/web-automation/waiting/waiting.spec.ts)

- INTERNET, TODOMVC, PW_DOCS
  - Signature: const ...: string
  - Purpose: target URLs used for wait strategy demonstrations

## 🔢 Enum Inventory

No TypeScript enums are declared in the current codebase.