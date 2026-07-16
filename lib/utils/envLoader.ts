/**
 * Author: Mahiteja Bollojula
 * LinkedIn: https://www.linkedin.com/in/mahiteja-bollojula-477a60145/
 * envLoader.ts
 *
 * Reads already-loaded environment variables (dotenv is called in playwright.config.ts
 * before any fixture or test code runs) and returns a strongly-typed Env object.
 * Never call dotenv.config() here — the config module owns that responsibility.
 */

export interface Env {
  TEST_ENV:            string;
  BASE_URL:            string;
  API_KEY:             string;
  BASIC_USER:          string;
  BASIC_PASS:          string;
  BEARER_TOKEN:        string;
  OAUTH_CLIENT_ID:     string;
  OAUTH_CLIENT_SECRET: string;
  OAUTH_TOKEN_URL:     string;
  NTLM_USER:           string;
  NTLM_PASS:           string;
  NTLM_URL:            string;
  MTLS_ORIGIN:         string;
  MTLS_CERT_PATH:      string;
  MTLS_KEY_PATH:       string;
  MTLS_CA_PATH:        string;
  STORAGE_STATE_PATH:  string;
}

export function loadEnv(): Env {
  return {
    TEST_ENV:            process.env['TEST_ENV']            ?? 'test',
    BASE_URL:            process.env['BASE_URL']            ?? 'https://jsonplaceholder.typicode.com',
    API_KEY:             process.env['API_KEY']             ?? '',
    BASIC_USER:          process.env['BASIC_USER']          ?? 'testuser',
    BASIC_PASS:          process.env['BASIC_PASS']          ?? 'testpass',
    BEARER_TOKEN:        process.env['BEARER_TOKEN']        ?? '',
    OAUTH_CLIENT_ID:     process.env['OAUTH_CLIENT_ID']     ?? '',
    OAUTH_CLIENT_SECRET: process.env['OAUTH_CLIENT_SECRET'] ?? '',
    OAUTH_TOKEN_URL:     process.env['OAUTH_TOKEN_URL']     ?? '',
    NTLM_USER:           process.env['NTLM_USER']           ?? '',
    NTLM_PASS:           process.env['NTLM_PASS']           ?? '',
    NTLM_URL:            process.env['NTLM_URL']            ?? '',
    MTLS_ORIGIN:         process.env['MTLS_ORIGIN']         ?? '',
    MTLS_CERT_PATH:      process.env['MTLS_CERT_PATH']      ?? 'certs/client.pem',
    MTLS_KEY_PATH:       process.env['MTLS_KEY_PATH']       ?? 'certs/client-key.pem',
    MTLS_CA_PATH:        process.env['MTLS_CA_PATH']        ?? '',
    STORAGE_STATE_PATH:  process.env['STORAGE_STATE_PATH']  ?? 'fixtures/auth/storageState.json',
  };
}
