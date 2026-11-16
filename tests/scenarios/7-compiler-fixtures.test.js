import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {root} from './helpers.js';

test('scenario 7: compiler rejects invalid recommendation policies', () => {
  const r = spawnSync('python3', ['-I', path.join(root, 'tests/scenarios/compiler_validation.py'), 'negative', root], {encoding: 'utf8', cwd: root});
  assert.equal(r.status, 0, `compiler negative fixtures failed:\n${r.stdout}\n${r.stderr}`);
});
