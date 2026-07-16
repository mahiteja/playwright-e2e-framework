/**
 * Author: Mahiteja Bollojula
 * LinkedIn: https://www.linkedin.com/in/mahiteja-bollojula-477a60145/
 * userSchema.ts
 *
 * Zod schemas for the jsonplaceholder /users resource.
 * Import and use with `toMatchApiSchema()` custom matcher or directly with
 * `.parse()` / `.safeParse()` for detailed field-level error reporting.
 */

import { z } from 'zod';

// ── Nested schemas ────────────────────────────────────────────────────────────

export const GeoSchema = z.object({
  lat: z.string(),
  lng: z.string(),
});

export const AddressSchema = z.object({
  street:  z.string(),
  suite:   z.string(),
  city:    z.string(),
  zipcode: z.string(),
  geo:     GeoSchema,
});

export const CompanySchema = z.object({
  name:        z.string().min(1),
  catchPhrase: z.string(),
  bs:          z.string(),
});

// ── Core schemas ──────────────────────────────────────────────────────────────

/** Full user object as returned by GET /users/:id */
export const UserSchema = z.object({
  id:       z.number().int().positive(),
  name:     z.string().min(1),
  username: z.string().min(1),
  email:    z.string().email(),
  address:  AddressSchema,
  phone:    z.string(),
  website:  z.string(),
  company:  CompanySchema,
});

/** Array of users returned by GET /users */
export const UserListSchema = z.array(UserSchema);

/** Subset returned by POST /users (jsonplaceholder echoes back partial fields) */
export const CreateUserResponseSchema = z.object({
  id:       z.number().int().positive(),
  name:     z.string().min(1),
  username: z.string().min(1),
  email:    z.string(),
});

// ── Inferred TypeScript types ─────────────────────────────────────────────────

export type User              = z.infer<typeof UserSchema>;
export type UserList          = z.infer<typeof UserListSchema>;
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;
