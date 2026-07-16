/**
 * Author: Mahiteja Bollojula
 * LinkedIn: https://www.linkedin.com/in/mahiteja-bollojula-477a60145/
 * createUser.spec.ts
 *
 * Covers: POST/PUT/PATCH/DELETE (1.2), JSON payloads from fixture files,
 * request chaining (1.5), Zod schema validation (3.8),
 * custom matchers, data-driven CRUD matrix (3.7).
 */

import { test, expect }    from '../../../lib/api-fixtures';
import { CreateUserResponseSchema, UserSchema } from '../../../lib/schemas/userSchema';
import type { CreateUserPayload, UpdateUserPayload } from '../../../lib/clients/UsersClient';
import { loadPayload }     from '../../../lib/utils/resourceLoader';

// ── Load payloads from resources/ ────────────────────────────────────────────

const createPayload = loadPayload<CreateUserPayload>('users', 'create');
const putPayload    = loadPayload<CreateUserPayload>('users', 'put');
const patchPayload  = loadPayload<UpdateUserPayload>('users', 'patch');

// ── POST ─────────────────────────────────────────────────────────────────────

test.describe('POST /users', () => {

  test('creates a user and returns schema-valid response', async ({ usersClient }) => {
    const res  = await usersClient.createUser(createPayload);
    const body = await res.json() as Record<string, unknown>;

    await expect(res).toHaveStatusCode(201);
    await expect(res).toBeSuccessfulJSON();
    await expect(res).toMatchApiSchema(CreateUserResponseSchema);
    expect(body['name']).toBe(createPayload.name);
    expect(body['email']).toBe(createPayload.email);
    // jsonplaceholder always returns id=101 for new posts — just check it's truthy
    expect(body['id']).toBeTruthy();
  });

  test('POST response contains key "id"', async ({ usersClient }) => {
    const res = await usersClient.createUser(createPayload);
    await expect(res).toContainKey('id');
  });

});

// ── PUT (full replace) ────────────────────────────────────────────────────────

test.describe('PUT /users/:id', () => {

  test('full update returns 200 with updated fields', async ({ usersClient }) => {
    const res  = await usersClient.updateUser(1, putPayload);
    const body = await res.json() as Record<string, unknown>;

    await expect(res).toHaveStatusCode(200);
    expect(body['name']).toBe(putPayload.name);
    expect(body['email']).toBe(putPayload.email);
  });

});

// ── PATCH (partial update) ────────────────────────────────────────────────────

test.describe('PATCH /users/:id', () => {

  test('partial update returns 200 with patched field', async ({ usersClient }) => {
    const res  = await usersClient.patchUser(1, patchPayload);
    const body = await res.json() as Record<string, unknown>;

    await expect(res).toHaveStatusCode(200);
    if (patchPayload.email) {
      expect(body['email']).toBe(patchPayload.email);
    }
  });

});

// ── DELETE ────────────────────────────────────────────────────────────────────

test.describe('DELETE /users/:id', () => {

  test('returns 200', async ({ usersClient }) => {
    const res = await usersClient.deleteUser(1);
    await expect(res).toHaveStatusCode(200);
  });

});

// ── Request chaining (1.5) ────────────────────────────────────────────────────

test.describe('Request chaining', () => {

  test('create → verify → delete (seed → test → teardown)', async ({ usersClient }) => {
    // Step 1: Seed via API
    const createRes = await usersClient.createUser(createPayload);
    await expect(createRes).toHaveStatusCode(201);
    const { id } = await createRes.json() as { id: number };
    expect(id).toBeGreaterThan(0);

    // jsonplaceholder returns id=11 for /users (10 existing records).
    // The record isn't actually persisted — GET against a real id to show chaining.
    const getRes = await usersClient.getUser(1);
    await expect(getRes).toHaveStatusCode(200);
    await expect(getRes).toMatchApiSchema(UserSchema);

    // Step 3: Tear down (jsonplaceholder accepts the DELETE)
    const deleteRes = await usersClient.deleteUser(1);
    await expect(deleteRes).toHaveStatusCode(200);
  });

});

// ── Data-driven: CRUD against multiple user IDs (3.7) ─────────────────────────

const userIds = [1, 2, 3, 5, 8];

test.describe('Data-driven: GET multiple user IDs', () => {
  for (const id of userIds) {
    test(`user ${id} has valid schema`, async ({ usersClient }) => {
      const res = await usersClient.getUser(id);
      await expect(res).toHaveStatusCode(200);
      await expect(res).toMatchApiSchema(UserSchema);
    });
  }
});

// ── Zod safeParse with human-readable failure report (3.8) ────────────────────

test('safeParse surfaces all field violations', async ({ usersClient }) => {
  const res  = await usersClient.getUser(1);
  await expect(res).toHaveStatusCode(200);

  const body   = await res.json();
  const result = UserSchema.safeParse(body);

  if (!result.success) {
    throw new Error(
      `Schema contract broken:\n${JSON.stringify(result.error.flatten().fieldErrors, null, 2)}`
    );
  }

  expect(result.data.id).toBe(1);
  expect(result.data.email).toMatch(/@/);
});
