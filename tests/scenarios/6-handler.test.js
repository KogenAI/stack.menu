import test from 'node:test';
import assert from 'node:assert/strict';
import {routeContext} from '../../lib/router.js';
import {onRequest} from '../../functions/route.js';
import {call, request} from './helpers.js';

const json = {'Content-Type': 'application/json'};

test('scenario 6: handler statuses and GET parity with routeContext', async () => {
  assert.equal((await call(onRequest, request('?bogus=1'))).status, 400, 'unknown field');
  assert.equal((await call(onRequest, request('?goal=nonsense'))).status, 400, 'bad enum');
  assert.equal((await call(onRequest, request('?goal=choose&goal=build'))).status, 400, 'repeated field');

  const big = JSON.stringify({source_label: 'x'.repeat(17 * 1024)});
  assert.equal((await call(onRequest, request('', {method: 'POST', headers: json, body: big}))).status, 413, 'oversized body');
  assert.equal((await call(onRequest, request('', {method: 'POST', headers: {'Content-Type': 'text/plain'}, body: '{}'}))).status, 415, 'wrong content type');
  for (const method of ['PUT', 'DELETE', 'PATCH']) assert.equal((await call(onRequest, request('', {method}))).status, 405, method);

  const queries = [
    ['?goal=choose&use_case=content-site', {goal: 'choose', use_case: 'content-site'}],
    ['?goal=choose&use_case=web-product&static_only=true', {goal: 'choose', use_case: 'web-product', static_only: true}],
    ['?goal=build&existing_stack=expo-react-native&component=ios', {goal: 'build', existing_stack: 'expo-react-native', component: 'ios'}],
    ['?goal=migrate&existing_stack=typescript-next-node&target_stack=go-cli', {goal: 'migrate', existing_stack: 'typescript-next-node', target_stack: 'go-cli'}]
  ];
  for (const [query, input] of queries) {
    const res = await call(onRequest, request(query));
    assert.equal(res.status, 200, query);
    assert.deepEqual(res.body, routeContext(input), query);
  }
});
