import test from 'node:test';
import assert from 'node:assert/strict';
import {routeContext} from '../../lib/router.js';

const ids = result => result.candidates.map(c => c.id);

test('scenario 3: hard constraints never replace the default and ui filters only web', () => {
  const result = routeContext({goal: 'choose', use_case: 'web-product', static_only: true});
  assert.equal(result.recommendation.primary.id, 'rails-hotwire-postgresql');
  assert.equal(result.recommendation.primary.feasible, false);
  assert.ok(result.nudges.some(n => /hard constraint/i.test(n) && n.includes(result.recommendation.primary.title)),
    'a nudge says the default does not satisfy a hard constraint');
  assert.ok(!ids(result).includes('rails-hotwire-postgresql'));

  const web = routeContext({goal: 'choose', component: 'web'});
  const webClient = routeContext({goal: 'choose', component: 'web', ui: 'client'});
  assert.ok(ids(webClient).length > 0);
  assert.ok(ids(webClient).every(id => ids(web).includes(id)));
  assert.ok(ids(webClient).length < ids(web).length, 'ui filters candidates for explicit web');

  assert.deepEqual(ids(routeContext({goal: 'choose', component: 'api', ui: 'client'})), ids(routeContext({goal: 'choose', component: 'api'})));
  assert.deepEqual(ids(routeContext({goal: 'choose', ui: 'client'})), ids(routeContext({goal: 'choose'})));
});
