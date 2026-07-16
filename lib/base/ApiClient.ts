/**
 * Author: Mahiteja Bollojula
 * LinkedIn: https://www.linkedin.com/in/mahiteja-bollojula-477a60145/
 * ApiClient.ts
 *
 * Base HTTP client that wraps Playwright's APIRequestContext.
 * Domain clients (e.g. UsersClient) extend this class.
 *
 * Responsibilities:
 *  - Provide typed get / post / put / patch / delete wrappers
 *  - Accept per-request header overrides merged on top of context defaults
 *  - Log full request + response details when a non-2xx status is received
 */

import { type APIRequestContext, type APIResponse } from '@playwright/test';

// ── Option types ─────────────────────────────────────────────────────────────

export interface QueryParams {
  [key: string]: string | number | boolean | undefined;
}

export interface GetOptions {
  params?:  QueryParams;
  headers?: Record<string, string>;
  /** Override the default timeout (ms) for this request only. */
  timeout?: number;
}

export interface BodyOptions {
  params?:  QueryParams;
  headers?: Record<string, string>;
  timeout?: number;
}

// ── Internal log record ───────────────────────────────────────────────────────

interface RequestLog {
  method:   string;
  path:     string;
  status:   number;
  body?:    unknown;
}

// ── Base client ───────────────────────────────────────────────────────────────

export class ApiClient {
  constructor(protected readonly request: APIRequestContext) {}

  // ── Public HTTP methods ──────────────────────────────────────────────────

  async get(path: string, options?: GetOptions): Promise<APIResponse> {
    const res = await this.request.get(path, {
      params:  this.sanitiseParams(options?.params),
      headers: options?.headers,
      timeout: options?.timeout,
    });
    this.logOnFailure({ method: 'GET', path, status: res.status() });
    return res;
  }

  async post(path: string, payload: unknown, options?: BodyOptions): Promise<APIResponse> {
    const res = await this.request.post(path, {
      data:    payload,
      params:  this.sanitiseParams(options?.params),
      headers: options?.headers,
      timeout: options?.timeout,
    });
    this.logOnFailure({ method: 'POST', path, status: res.status(), body: payload });
    return res;
  }

  async put(path: string, payload: unknown, options?: BodyOptions): Promise<APIResponse> {
    const res = await this.request.put(path, {
      data:    payload,
      params:  this.sanitiseParams(options?.params),
      headers: options?.headers,
      timeout: options?.timeout,
    });
    this.logOnFailure({ method: 'PUT', path, status: res.status(), body: payload });
    return res;
  }

  async patch(path: string, payload: unknown, options?: BodyOptions): Promise<APIResponse> {
    const res = await this.request.patch(path, {
      data:    payload,
      params:  this.sanitiseParams(options?.params),
      headers: options?.headers,
      timeout: options?.timeout,
    });
    this.logOnFailure({ method: 'PATCH', path, status: res.status(), body: payload });
    return res;
  }

  async delete(path: string, options?: GetOptions): Promise<APIResponse> {
    const res = await this.request.delete(path, {
      params:  this.sanitiseParams(options?.params),
      headers: options?.headers,
      timeout: options?.timeout,
    });
    this.logOnFailure({ method: 'DELETE', path, status: res.status() });
    return res;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Strip undefined values — Playwright rejects them as param values. */
  private sanitiseParams(
    params?: QueryParams
  ): Record<string, string | number | boolean> | undefined {
    if (!params) return undefined;
    const clean: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) clean[k] = v;
    }
    return Object.keys(clean).length ? clean : undefined;
  }

  /** Writes structured failure context to the test output channel. */
  protected logOnFailure(log: RequestLog): void {
    if (log.status >= 400) {
      const lines: string[] = [
        `┌─ API FAILURE ────────────────────────────────────`,
        `│  ${log.method} ${log.path}`,
        `│  Status : ${log.status}`,
      ];
      if (log.body !== undefined) {
        lines.push(`│  Request: ${JSON.stringify(log.body)}`);
      }
      lines.push(`└──────────────────────────────────────────────────`);
      console.error(lines.join('\n'));
    }
  }
}
