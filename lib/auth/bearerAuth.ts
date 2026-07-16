/**
 * Author: Mahiteja Bollojula
 * LinkedIn: https://www.linkedin.com/in/mahiteja-bollojula-477a60145/
 * bearerAuth.ts
 *
 * Pure helper functions for constructing standard Authorization headers.
 * No network calls — use oauth2.ts for token-fetching flows.
 */

// ── Header builders ──────────────────────────────────────────────────────────

/** Returns { Authorization: 'Bearer <token>' } */
export function bearerHeader(token: string): { Authorization: string } {
  if (!token) throw new Error('[bearerAuth] Bearer token must be a non-empty string.');
  return { Authorization: `Bearer ${token}` };
}

/** Returns { Authorization: 'Basic <base64>' } */
export function basicAuthHeader(
  username: string,
  password: string
): { Authorization: string } {
  if (!username || !password) {
    throw new Error('[bearerAuth] Both username and password are required for Basic auth.');
  }
  const encoded = Buffer.from(`${username}:${password}`).toString('base64');
  return { Authorization: `Basic ${encoded}` };
}

/**
 * Returns { [headerName]: apiKey }.
 * headerName defaults to 'X-API-Key' but is configurable for non-standard APIs.
 */
export function apiKeyHeader(
  apiKey: string,
  headerName = 'X-API-Key'
): Record<string, string> {
  if (!apiKey) throw new Error('[bearerAuth] API key must be a non-empty string.');
  return { [headerName]: apiKey };
}

/**
 * Returns a query-param object for API-key-in-URL authentication.
 * Usage: request.get('/endpoint', { params: apiKeyParam('mykey') })
 */
export function apiKeyParam(
  apiKey: string,
  paramName = 'api_key'
): Record<string, string> {
  if (!apiKey) throw new Error('[bearerAuth] API key must be a non-empty string.');
  return { [paramName]: apiKey };
}
