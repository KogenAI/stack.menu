import test from 'node:test';
import assert from 'node:assert/strict';
import {routeContext} from '../../lib/router.js';

test('scenario 5: an existing Expo build with an ios component stays Expo', () => {
  const result = routeContext({goal: 'build', existing_stack: 'expo-react-native', component: 'ios'});
  assert.deepEqual(result.candidates.map(c => c.id), ['expo-react-native']);
  assert.ok(!JSON.stringify(result).includes('swift-swiftui-ios'));
});
