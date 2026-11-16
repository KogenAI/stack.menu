import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {resolveRecommendation} from '../../lib/recommendation-policy.js';
import {root, readJson, readText} from './helpers.js';

// Pre-existing divergence recorded in docs/current-state.md: dist/choose.md renders alternatives only
// for a task's default primary and for overrides with their own alternative_ids, so the Go service
// alternative that the router returns for these ecosystem overrides is absent from the guide.
const KNOWN_MISSING_ALTERNATIVES = [
  {input: {use_case: 'api-service', ecosystem: 'python'}, alternative: 'go-api'},
  {input: {use_case: 'api-service', ecosystem: 'rust'}, alternative: 'go-api'}
];
const isKnown = (input, id) => KNOWN_MISSING_ALTERNATIVES.some(k => k.alternative === id && JSON.stringify(k.input) === JSON.stringify(input));

const exists = url => fs.existsSync(path.join(root, 'dist', url.replace(/^\//, '').replace(/\/$/, '/index.html')));

test('scenario 8: dist representations agree with their sources', () => {
  assert.ok(fs.existsSync(path.join(root, 'dist')), 'dist/ is built before this check');
  const policy = readJson('menu/recommendations.json');
  assert.deepEqual(JSON.parse(readText('dist/recommendations.json')), policy);

  const choose = readText('dist/choose.md');
  const inputs = [];
  for (const task of policy.use_cases) {
    inputs.push({use_case: task.id});
    for (const override of task.overrides || [])
      inputs.push({use_case: task.id, ...override.when});
  }
  for (const input of inputs) {
    const {task} = resolveRecommendation(policy, input);
    assert.ok(choose.includes(`\`${task.primary}\``), `choose.md names primary ${task.primary} for ${JSON.stringify(input)}`);
    for (const alternative of task.alternatives.filter(a => !isKnown(input, a.id)))
      assert.ok(choose.includes(alternative.choose_when), `choose.md has choose_when of ${alternative.id}`);
  }

  for (const name of ['recommendation-policy.js', 'migration-fit.js'])
    assert.ok(fs.readFileSync(path.join(root, 'lib', name)).equals(fs.readFileSync(path.join(root, 'dist/design', name))), `${name} is byte-equal`);

  const profiles = readJson('lib/selection-index.json').profiles;
  const advertised = JSON.parse(readText('dist/rewrite/sources.json')).sources;
  const sourceIds = readJson('menu/rewrite-sources.json').sources.map(s => s.id);
  assert.ok(sourceIds.every(id => advertised.some(s => s.id === id)), 'every rewrite source is advertised in dist/rewrite/sources.json');
  const sources = advertised;
  for (const entry of [...profiles, ...sources])
    for (const key of ['guide_url', 'markdown_url', 'json_url'])
      assert.ok(entry[key] && exists(entry[key]), `${entry.id} ${key} ${entry[key]} exists under dist/`);
});

// Strict expected failure: passes only while the recorded divergence still exists, and fails
// when choose.md starts carrying these alternatives so the expectation is removed deliberately.
test('scenario 8: expected failure (pre-existing) go-api alternative missing from choose.md for python and rust api-service', () => {
  const policy = readJson('menu/recommendations.json');
  const choose = readText('dist/choose.md');
  for (const {input, alternative} of KNOWN_MISSING_ALTERNATIVES) {
    const {task} = resolveRecommendation(policy, input);
    const found = task.alternatives.find(a => a.id === alternative);
    assert.ok(found, `${alternative} is still an applicable alternative for ${JSON.stringify(input)}`);
    assert.equal(choose.includes(found.choose_when), false,
      `${alternative} now appears in choose.md for ${JSON.stringify(input)}: remove this expected failure and its baseline record`);
  }
});
