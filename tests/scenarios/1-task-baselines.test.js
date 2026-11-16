import test from 'node:test';
import assert from 'node:assert/strict';
import {routeContext} from '../../lib/router.js';

const choose = input => routeContext({goal: 'choose', ...input});
const primary = input => choose(input).recommendation.primary.id;

test('scenario 1: nine task baselines, overrides and legacy aliases', () => {
  const baselines = [
    ['content-site', 'astro-content'],
    ['web-product', 'rails-hotwire-postgresql'],
    ['live-web', 'elixir-phoenix-liveview'],
    ['admin-web', 'python-django'],
    ['browser-client', 'typescript-react-vite-browser'],
    ['api-service', 'go-service'],
    ['cli', 'go-cli'],
    ['automation', 'python-scripts-workers']
  ];
  for (const [use_case, id] of baselines) assert.equal(primary({use_case}), id, `baseline ${use_case}`);

  const mobile = choose({use_case: 'cross-platform-mobile'});
  assert.equal(mobile.recommendation.primary.id, 'expo-react-native');
  assert.equal(mobile.recommendation.primary.conditional, true);
  assert.deepEqual(mobile.recommendation.use_case.role_options, ['ios', 'android']);
  assert.ok(mobile.questions.length > 0, 'shared-vs-platform question is pending');

  const overrides = [
    [{use_case: 'admin-web', ecosystem: 'python'}, 'python-django'],
    [{use_case: 'api-service', ecosystem: 'python'}, 'python-fastapi'],
    [{use_case: 'web-product', ecosystem: 'php'}, 'laravel-livewire-postgresql'],
    [{use_case: 'admin-web', ecosystem: 'ruby'}, 'rails-hotwire-postgresql'],
    [{use_case: 'web-product', ecosystem: 'elixir'}, 'elixir-phoenix-liveview'],
    [{use_case: 'web-product', ecosystem: 'react'}, 'typescript-next-node'],
    [{use_case: 'api-service', ecosystem: 'rust'}, 'rust-service'],
    [{use_case: 'cli', ecosystem: 'rust'}, 'rust-cli'],
    [{use_case: 'cross-platform-mobile', mobile_platform: 'ios'}, 'swift-swiftui-ios'],
    [{use_case: 'cross-platform-mobile', mobile_platform: 'android'}, 'kotlin-compose-android'],
    [{use_case: 'cross-platform-mobile', mobile_platform: 'shared'}, 'expo-react-native']
  ];
  for (const [input, id] of overrides) assert.equal(primary(input), id, JSON.stringify(input));

  const aliases = [
    ['python-api', 'api-service', {ecosystem: 'python'}, 'python-fastapi'],
    ['react-fullstack', 'web-product', {ecosystem: 'react'}, 'typescript-next-node'],
    ['ios', 'cross-platform-mobile', {mobile_platform: 'ios'}, 'swift-swiftui-ios'],
    ['android', 'cross-platform-mobile', {mobile_platform: 'android'}, 'kotlin-compose-android']
  ];
  for (const [alias, task, constraints, id] of aliases) {
    const result = choose({use_case: alias});
    assert.equal(result.recommendation.use_case.id, task, alias);
    assert.deepEqual(result.recommendation.constraints, {...constraints}, alias);
    assert.equal(result.recommendation.primary.id, id, alias);
  }
  assert.throws(() => choose({use_case: 'python-api', ecosystem: 'php'}), Error);
});
