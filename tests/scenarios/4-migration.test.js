import test from 'node:test';
import assert from 'node:assert/strict';
import {routeContext} from '../../lib/router.js';
import {onRequest} from '../../functions/route.js';
import {call, request} from './helpers.js';

test('scenario 4: migration source and target handling', async () => {
  const same = routeContext({goal: 'migrate', existing_stack: 'typescript-next-node', target_stack: 'typescript-next-node'});
  assert.ok(same.questions.some(q => /installed-version/i.test(q)), 'installed-version question');
  assert.equal(Object.hasOwn(same, 'recommendation'), false);
  assert.deepEqual(same.candidates, []);

  const mismatch = routeContext({goal: 'migrate', existing_stack: 'typescript-next-node', target_stack: 'go-cli'});
  assert.ok(mismatch.questions.length > 0, 'clarification questions');
  assert.ok(mismatch.nudges.some(n => /roles/i.test(n)), 'missing-roles nudge');
  for (const id of ['typescript-next-node', 'go-cli']) {
    assert.ok(mismatch.resources.includes(`/stacks/${id}/guide.md`), `keeps ${id} guide`);
    assert.ok(mismatch.resources.includes(`/stacks/${id}/record.json`), `keeps ${id} record`);
  }

  const source = routeContext({goal: 'migrate', existing_stack: 'wordpress', target_stack: 'typescript-next-node'});
  assert.equal(source.existing_source.id, 'wordpress');
  const accepted = await call(onRequest, request('', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({goal: 'migrate', existing_stack: 'wordpress', target_stack: 'typescript-next-node'})}));
  assert.equal(accepted.status, 200);
  const rejected = await call(onRequest, request('', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({goal: 'migrate', existing_stack: 'typescript-next-node', target_stack: 'wordpress'})}));
  assert.equal(rejected.status, 400);
  assert.throws(() => routeContext({goal: 'migrate', existing_stack: 'typescript-next-node', target_stack: 'wordpress'}), Error);

  const unknown = routeContext({goal: 'migrate', existing_stack: 'unlisted-legacy-system', source_label: 'Python 3 monolith'});
  assert.equal(unknown.existing_source.unknown_source, true);
  assert.ok(unknown.questions.length > 0, 'research question');
  assert.deepEqual(unknown.candidates, []);
  assert.ok(!unknown.resources.some(r => r.startsWith('/stacks/')), 'no guide chosen by language');
});
