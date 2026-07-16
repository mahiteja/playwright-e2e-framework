/**
 * Author: Mahiteja Bollojula
 * LinkedIn: https://www.linkedin.com/in/mahiteja-bollojula-477a60145/
 * UsersClient.ts
 *
 * Domain client for the /users resource.
 * Exposes typed methods that map 1-to-1 to REST operations.
 * Inherits logging and header-merge behaviour from ApiClient.
 */

import { type APIRequestContext, type APIResponse } from '@playwright/test';
import { ApiClient, type BodyOptions, type GetOptions } from '../base/ApiClient';

// ── Response shape interfaces ────────────────────────────────────────────────

export interface Geo {
  lat: string;
  lng: string;
}

export interface Address {
  street:  string;
  suite:   string;
  city:    string;
  zipcode: string;
  geo:     Geo;
}

export interface Company {
  name:        string;
  catchPhrase: string;
  bs:          string;
}

export interface User {
  id:       number;
  name:     string;
  username: string;
  email:    string;
  address:  Address;
  phone:    string;
  website:  string;
  company:  Company;
}

// ── Request payload interfaces ───────────────────────────────────────────────

export interface CreateUserPayload {
  name:      string;
  username:  string;
  email:     string;
  phone?:    string;
  website?:  string;
}

export type UpdateUserPayload = Partial<CreateUserPayload>;

// ── Client ────────────────────────────────────────────────────────────────────

export class UsersClient extends ApiClient {
  constructor(request: APIRequestContext) {
    super(request);
  }

  /** GET /users — list all users, supports _limit / _page pagination. */
  async listUsers(
    params?: { _limit?: number; _page?: number },
    options?: GetOptions
  ): Promise<APIResponse> {
    return this.get('/users', { ...options, params: { ...options?.params, ...params } });
  }

  /** GET /users/:id */
  async getUser(id: number, options?: GetOptions): Promise<APIResponse> {
    return this.get(`/users/${id}`, options);
  }

  /** POST /users */
  async createUser(payload: CreateUserPayload, options?: BodyOptions): Promise<APIResponse> {
    return this.post('/users', payload, options);
  }

  /** PUT /users/:id — full replacement */
  async updateUser(id: number, payload: CreateUserPayload, options?: BodyOptions): Promise<APIResponse> {
    return this.put(`/users/${id}`, payload, options);
  }

  /** PATCH /users/:id — partial update */
  async patchUser(id: number, payload: UpdateUserPayload, options?: BodyOptions): Promise<APIResponse> {
    return this.patch(`/users/${id}`, payload, options);
  }

  /** DELETE /users/:id */
  async deleteUser(id: number, options?: GetOptions): Promise<APIResponse> {
    return this.delete(`/users/${id}`, options);
  }
}
