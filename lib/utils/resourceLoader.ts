/**
 * Author: Mahiteja Bollojula
 * LinkedIn: https://www.linkedin.com/in/mahiteja-bollojula-477a60145/
 * resourceLoader.ts
 *
 * Central loader for all external test resources:
 *   - JSON payloads  →  resources/payloads/<domain>/<name>.json
 *   - YAML headers   →  resources/headers/<env>.yaml
 *
 * Usage:
 *   import { loadPayload, loadHeaders } from '../utils/resourceLoader';
 *
 *   const body = loadPayload<CreateUserPayload>('users', 'create');
 *   const hdrs = loadHeaders();          // uses TEST_ENV env var, defaults to 'test'
 *   const hdrs = loadHeaders('uat');     // explicit env
 */

import * as fs   from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

const RESOURCES_ROOT = path.resolve(process.cwd(), 'resources');

// ── Payload loader ────────────────────────────────────────────────────────────

/**
 * Read and parse a JSON payload file.
 *
 * @param domain  Sub-folder under resources/payloads/  (e.g. 'users')
 * @param name    File name without extension            (e.g. 'create')
 */
export function loadPayload<T>(domain: string, name: string): T {
  const filePath = path.join(RESOURCES_ROOT, 'payloads', domain, `${name}.json`);

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `[resourceLoader] Payload not found: ${filePath}\n` +
      `Expected: resources/payloads/${domain}/${name}.json`,
    );
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

// ── Header loader ─────────────────────────────────────────────────────────────

/**
 * Read and parse the YAML header file for the given environment.
 *
 * @param env  Environment name (defaults to TEST_ENV env var, then 'test')
 */
export function loadHeaders(env?: string): Record<string, string> {
  const resolvedEnv = env ?? process.env['TEST_ENV'] ?? 'test';
  const filePath    = path.join(RESOURCES_ROOT, 'headers', `${resolvedEnv}.yaml`);

  if (!fs.existsSync(filePath)) {
    console.warn(
      `[resourceLoader] Header file not found: ${filePath}. ` +
      `Create resources/headers/${resolvedEnv}.yaml to inject environment-specific headers.`,
    );
    return {};
  }

  const raw    = fs.readFileSync(filePath, 'utf-8');
  const parsed = yaml.load(raw);

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(
      `[resourceLoader] ${filePath} must be a YAML mapping of string keys to string values.`,
    );
  }

  // Coerce all values to string and strip surrounding quotes added by YAML scalars
  return Object.fromEntries(
    Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [
      k,
      String(v).replace(/^"|"$/g, '').trim(),
    ]),
  );
}
