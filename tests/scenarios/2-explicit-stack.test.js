import test from 'node:test';
import assert from 'node:assert/strict';
import {routeContext} from '../../lib/router.js';
import {profileIds} from './helpers.js';

const conflicts = [
  {use_case: 'cli', ecosystem: 'rust', component: 'cli'},
  {use_case: 'web-product', ecosystem: 'php', component: 'web'},
  {use_case: 'api-service', ecosystem: 'python', component: 'api'},
  {use_case: 'automation', ecosystem: 'react', component: 'automation'},
  {use_case: 'content-site', ecosystem: 'elixir', component: 'ios'},
  {use_case: 'live-web', ecosystem: 'ruby', component: 'android'}
];

test('scenario 2: an explicit stack is preserved for every profile', () => {
  const ids = profileIds();
  assert.ok(ids.length > 0);
  for (const id of ids) {
    const plain = routeContext({goal: 'build', existing_stack: id});
    assert.match(plain.nudges[0], /preserve/i);
    for (const conflict of conflicts) {
      const result = routeContext({goal: 'build', existing_stack: id, ...conflict});
      const label = `${id} with ${JSON.stringify(conflict)}`;
      assert.deepEqual(result.candidates.map(c => c.id), [id], label);
      assert.equal(Object.hasOwn(result, 'recommendation'), false, label);
      assert.equal(result.nudges[0], plain.nudges[0], label);
    }
  }
});
