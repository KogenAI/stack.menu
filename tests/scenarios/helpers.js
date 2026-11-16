// Shared helpers for the offline scenario tests (node:test and node:assert only).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
export const readText = file => fs.readFileSync(path.join(root, file), 'utf8');

/** Ids of every profile in the selection index, derived at run time. */
export const profileIds = () => readJson('lib/selection-index.json').profiles.map(p => p.id);

/** Build a Request for the Pages route handler without a network. */
export const request = (query = '', init = {}) =>
  new Request(`http://localhost/route${query}`, {method: 'GET', ...init});

export async function call(handler, req) {
  const res = await handler({request: req});
  const text = await res.text();
  let body = null;
  try { body = JSON.parse(text); } catch { /* non-JSON bodies are not expected */ }
  return {status: res.status, body, headers: res.headers};
}
