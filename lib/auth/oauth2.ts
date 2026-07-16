/**
 * Author: Mahiteja Bollojula
 * LinkedIn: https://www.linkedin.com/in/mahiteja-bollojula-477a60145/
 * oauth2.ts
 *
 * OAuth 2.0 token-fetching helpers.
 * Both flows use Playwright's APIRequestContext so the token request
 * participates in tracing and is visible in the Playwright HTML report.
 */

import { type APIRequestContext } from '@playwright/test';

// ── Shared response shape ─────────────────────────────────────────────────────

export interface TokenResponse {
  access_token:  string;
  token_type:    string;
  expires_in?:   number;
  scope?:        string;
  refresh_token?: string;
}

// ── Client Credentials flow ───────────────────────────────────────────────────

/**
 * Exchanges client credentials for an access token (RFC 6749 §4.4).
 *
 * @param request   - An APIRequestContext (can be a temporary context)
 * @param tokenUrl  - The token endpoint URL
 * @param clientId  - OAuth client ID
 * @param clientSecret - OAuth client secret
 * @param scope     - Space-separated list of requested scopes (optional)
 */
export async function clientCredentialsGrant(
  request:      APIRequestContext,
  tokenUrl:     string,
  clientId:     string,
  clientSecret: string,
  scope?:       string
): Promise<TokenResponse> {
  const form: Record<string, string> = {
    grant_type:    'client_credentials',
    client_id:     clientId,
    client_secret: clientSecret,
  };
  if (scope) form['scope'] = scope;

  const res = await request.post(tokenUrl, { form });

  if (!res.ok()) {
    throw new Error(
      `[oauth2] client_credentials grant failed: ${res.status()} — ${await res.text()}`
    );
  }

  return res.json() as Promise<TokenResponse>;
}

// ── Refresh Token flow ────────────────────────────────────────────────────────

/**
 * Exchanges a refresh token for a new access token (RFC 6749 §6).
 */
export async function refreshTokenGrant(
  request:      APIRequestContext,
  tokenUrl:     string,
  clientId:     string,
  clientSecret: string,
  refreshToken: string
): Promise<TokenResponse> {
  const res = await request.post(tokenUrl, {
    form: {
      grant_type:    'refresh_token',
      client_id:     clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    },
  });

  if (!res.ok()) {
    throw new Error(
      `[oauth2] refresh_token grant failed: ${res.status()} — ${await res.text()}`
    );
  }

  return res.json() as Promise<TokenResponse>;
}

// ── Authorization Code flow helper (PKCE step) ────────────────────────────────

/**
 * Exchanges an authorization code + PKCE verifier for tokens (RFC 7636).
 * Call this after the browser redirect delivers `code` to your callback URL.
 */
export async function authorizationCodeGrant(
  request:      APIRequestContext,
  tokenUrl:     string,
  clientId:     string,
  code:         string,
  redirectUri:  string,
  codeVerifier: string
): Promise<TokenResponse> {
  const res = await request.post(tokenUrl, {
    form: {
      grant_type:    'authorization_code',
      client_id:     clientId,
      code,
      redirect_uri:  redirectUri,
      code_verifier: codeVerifier,
    },
  });

  if (!res.ok()) {
    throw new Error(
      `[oauth2] authorization_code grant failed: ${res.status()} — ${await res.text()}`
    );
  }

  return res.json() as Promise<TokenResponse>;
}
