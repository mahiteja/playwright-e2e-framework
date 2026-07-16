/**
 * Author: Mahiteja Bollojula
 * LinkedIn: https://www.linkedin.com/in/mahiteja-bollojula-477a60145/
 * mtls.ts
 *
 * Helpers for building mTLS client certificate options.
 * Compatible with both playwright.request.newContext() and browser.newContext().
 *
 * To generate a self-signed client certificate for local testing:
 *   openssl req -x509 -newkey rsa:4096 -keyout certs/client-key.pem \
 *     -out certs/client.pem -days 365 -nodes -subj "/CN=playwright-test-client"
 */

import * as fs   from 'fs';
import * as path from 'path';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MtlsCertConfig {
  /** The origin this certificate applies to (e.g. 'https://api.example.com'). */
  origin:       string;
  /** Absolute or project-relative path to the PEM-encoded certificate. */
  certPath:     string;
  /** Absolute or project-relative path to the PEM-encoded private key. */
  keyPath:      string;
  /** Optional CA certificate path for mutual verification. */
  caPath?:      string;
  /** Optional passphrase if the key is encrypted. */
  passphrase?:  string;
}

export interface ClientCertEntry {
  origin:      string;
  certPath:    string;
  keyPath:     string;
  caPath?:     string;
  passphrase?: string;
}

// ── Builder ───────────────────────────────────────────────────────────────────

/**
 * Builds a `clientCertificates` array compatible with Playwright context options.
 * Skips any entry whose cert or key file does not exist (graceful degradation in CI).
 */
export function buildClientCertificates(configs: MtlsCertConfig[]): ClientCertEntry[] {
  return configs
    .filter(cfg => {
      const certExists = fs.existsSync(path.resolve(cfg.certPath));
      const keyExists  = fs.existsSync(path.resolve(cfg.keyPath));
      if (!certExists || !keyExists) {
        console.warn(
          `[mtls] Certificate files not found for origin ${cfg.origin} — skipping.`
        );
      }
      return certExists && keyExists;
    })
    .map(cfg => {
      const entry: ClientCertEntry = {
        origin:   cfg.origin,
        certPath: path.resolve(cfg.certPath),
        keyPath:  path.resolve(cfg.keyPath),
      };
      if (cfg.caPath)     entry.caPath     = path.resolve(cfg.caPath);
      if (cfg.passphrase) entry.passphrase = cfg.passphrase;
      return entry;
    });
}

/**
 * Convenience wrapper: builds options for a single mTLS-protected origin.
 * Returns an empty object if the cert files are missing so tests can skip gracefully.
 */
export function singleMtlsOptions(cfg: MtlsCertConfig): {
  clientCertificates?: ClientCertEntry[];
} {
  const certs = buildClientCertificates([cfg]);
  return certs.length ? { clientCertificates: certs } : {};
}
