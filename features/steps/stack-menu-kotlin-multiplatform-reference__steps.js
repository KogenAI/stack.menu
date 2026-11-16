import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';

const require = createRequire(import.meta.url);
const {Given, Then, When, setDefaultTimeout} = require('@cucumber/cucumber');
setDefaultTimeout(115000);

const root = process.cwd();
const P = 'stack-menu-kotlin-multiplatform-reference: ';
const ID = 'kotlin-multiplatform-mobile';
const TASK = 'cross-platform-mobile';
const skip = /(^|\/)(node_modules|dist|\.generated|\.git|\.kogen)(\/|$)/;
const tail = text => String(text).split('\n').slice(-40).join('\n');

// One built disposable copy per acceptance run: the build is the real configured build script.
let copy = null;
function builtCopy() {
  if (copy) return copy;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kmp-'));
  fs.cpSync(root, dir, {recursive: true, filter: src => !skip.test(path.relative(root, src).split(path.sep).join('/'))});
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(dir, 'node_modules'));
  const script = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).scripts.build;
  const bin = path.join(dir, 'node_modules', '.bin');
  const r = spawnSync('sh', ['-c', script], {cwd: dir, encoding: 'utf8', timeout: 100000, env: {...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}`, NO_COLOR: '1'}});
  assert.equal(r.status, 0, `${P}build of the copy finished with code ${r.status}\n${tail(r.stdout)}\n${tail(r.stderr)}`);
  copy = dir;
  return dir;
}
const read = file => fs.readFileSync(path.join(builtCopy(), file), 'utf8');
const policy = () => JSON.parse(read('menu/recommendations.json'));
const alt = () => {
  const found = policy().alternatives.find(item => item.id === ID);
  assert.ok(found, `${P}menu/recommendations.json has no alternative ${ID}`);
  return found;
};
const load = file => import(pathToFileURL(path.join(builtCopy(), file)).href);
const isKmp = item => item.id === ID;
const PLATFORMS = [undefined, 'shared', 'android', 'ios'];
const query = platform => `?goal=choose&use_case=${TASK}${platform ? `&mobile_platform=${platform}` : ''}`;

async function route(platform) {
  const {onRequest} = await load('functions/route.js');
  const res = await onRequest({request: new Request(`http://localhost/route${query(platform)}`)});
  assert.equal(res.status, 200, `${P}GET /route${query(platform)} returned ${res.status}`);
  return JSON.parse(await res.text());
}

Given(P + 'a built copy of the project', function () { builtCopy(); });

Then(P + 'the policy has the alternative kotlin-multiplatform-mobile for the cross-platform-mobile task with a null profile', function () {
  const item = alt();
  assert.equal(item.profile_id, null, `${P}profile_id must be null (uncurated)`);
  assert.deepEqual(item.use_cases, [TASK]);
  assert.equal(policy().alternatives.filter(isKmp).length, 1);
});

Then(P + 'the policy loader accepts the policy', function () {
  const code = "import sys, pathlib\nsys.path.insert(0, 'scripts')\nimport recommendation_content\nrecommendation_content.load_policy(pathlib.Path('.'))\n";
  const r = spawnSync('python3', ['-I', '-c', code], {cwd: builtCopy(), encoding: 'utf8'});
  assert.equal(r.status, 0, `${P}load_policy failed\n${r.stderr}`);
});

Then(P + 'the alternative cites only official Kotlin pages', function () {
  const sources = alt().sources;
  assert.ok(Array.isArray(sources) && sources.length > 0, `${P}no sources`);
  for (const source of sources) {
    const url = new URL(source.url);
    assert.equal(url.protocol, 'https:', `${P}${source.url} is not https`);
    assert.equal(url.hostname, 'kotlinlang.org', `${P}${source.url} is not an official Kotlin page`);
  }
});

Then(P + 'the trigger names Kotlin or Android-led teams and shared domain and data logic with native UI', function () {
  const text = alt().choose_when;
  for (const pattern of [/Kotlin/, /Android/, /domain/i, /data/i, /native/i])
    assert.match(text, pattern, `${P}choose_when lacks ${pattern}: ${text}`);
});

Then(P + 'the caveat states the missing profile, Xcode and Apple ownership, the Compose Multiplatform decision and interop qualification', function () {
  const text = alt().caveat;
  for (const pattern of [/no curated Stack Menu profile/i, /Xcode/, /Apple/, /Compose Multiplatform/, /shared[- ]UI/i, /interop/i, /librar/i])
    assert.match(text, pattern, `${P}caveat lacks ${pattern}: ${text}`);
});

Then(P + 'the caveat names Wasm web, watchOS and tvOS as Beta', function () {
  const text = alt().caveat;
  for (const pattern of [/Wasm/, /watchOS/, /tvOS/, /Beta/])
    assert.match(text, pattern, `${P}caveat lacks ${pattern}: ${text}`);
});

Then(P + 'the caveat does not claim stability for everything and says it does not replace an existing project', function () {
  const text = alt().caveat;
  assert.doesNotMatch(text, /stable (for|on) (everything|all|every)/i, `${P}caveat overclaims stability: ${text}`);
  assert.match(text, /not replace an existing/i, `${P}caveat must say it does not replace an existing project: ${text}`);
});

for (const [name, platform] of [['an undecided mobile platform', undefined], ['the shared platform', 'shared'], ['the android platform', 'android'], ['the ios platform', 'ios']]) {
  When(P + `I request the choose route for ${name}`, async function () {
    this.route = await route(platform);
    this.platform = platform;
  });
}

Then(P + 'the route primary is {string}', function (id) {
  assert.equal(this.route.recommendation.primary.id, id);
});

Then(P + 'the route alternatives include the Kotlin Multiplatform alternative with feasible null', function () {
  const found = this.route.recommendation.alternatives.filter(isKmp);
  assert.equal(found.length, 1, `${P}route alternatives for ${this.platform || 'undecided'}: ${this.route.recommendation.alternatives.map(a => a.id)}`);
  assert.equal(found[0].feasible, null);
  assert.equal(found[0].profile_id, null);
  assert.equal(found[0].choose_when, alt().choose_when);
  assert.equal(found[0].caveat, alt().caveat);
});

Then(P + 'the route alternatives omit the Kotlin Multiplatform alternative', function () {
  assert.ok(!this.route.recommendation.alternatives.some(isKmp), `${P}route alternatives for ${this.platform} list ${ID}`);
});

Then(P + 'the route output otherwise matches the policy without the alternative', async function () {
  const source = policy();
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'kmp-base-'));
  fs.mkdirSync(path.join(base, 'menu'));
  fs.cpSync(path.join(builtCopy(), 'lib'), path.join(base, 'lib'), {recursive: true});
  fs.copyFileSync(path.join(builtCopy(), 'menu/rewrite-sources.json'), path.join(base, 'menu/rewrite-sources.json'));
  fs.writeFileSync(path.join(base, 'package.json'), '{"type":"module"}');
  const strip = list => list.filter(id => id !== ID);
  source.alternatives = source.alternatives.filter(item => !isKmp(item));
  for (const task of source.use_cases) {
    if (task.alternative_ids) task.alternative_ids = strip(task.alternative_ids);
    for (const override of task.overrides || []) if (override.alternative_ids) override.alternative_ids = strip(override.alternative_ids);
  }
  fs.writeFileSync(path.join(base, 'menu/recommendations.json'), JSON.stringify(source));
  const actual = (await load('lib/router.js')).routeContext;
  const baseline = (await import(pathToFileURL(path.join(base, 'lib/router.js')).href)).routeContext;
  const inputs = PLATFORMS.map(p => ({goal: 'choose', use_case: TASK, ...(p ? {mobile_platform: p} : {})}));
  inputs.push({goal: 'build', existing_stack: 'expo-react-native', component: 'ios'},
    {goal: 'migrate', existing_stack: 'expo-react-native', target_stack: 'swift-swiftui-ios'});
  for (const input of inputs) {
    const result = actual(input);
    if (result.recommendation) result.recommendation.alternatives = result.recommendation.alternatives.filter(item => !isKmp(item));
    assert.deepEqual(result, baseline(input), `${P}route output changed beyond the alternative for ${JSON.stringify(input)}`);
  }
});

Then(P + 'recommendations.json carries the alternative unchanged from the policy', function () {
  assert.deepEqual(JSON.parse(read('dist/recommendations.json')).alternatives.find(isKmp), alt());
});

function chooseSection(markdown, marker) {
  const start = markdown.indexOf(marker);
  assert.ok(start >= 0, `${P}dist/choose.md has no section starting ${marker}`);
  const rest = markdown.slice(start + marker.length);
  const end = rest.search(/\nWhen `|\n#{2,3} |\nAliases:/);
  return rest.slice(0, end < 0 ? undefined : end);
}

Then(P + 'choose.md lists the alternative under shared or undecided scope and the android choice but not the ios choice', function () {
  const item = alt();
  const md = read('dist/choose.md');
  const sections = {
    shared: chooseSection(md, 'Alternatives for shared or undecided mobile scope:'),
    android: chooseSection(md, 'When `mobile_platform=android`'),
    ios: chooseSection(md, 'When `mobile_platform=ios`')
  };
  for (const key of ['shared', 'android']) {
    assert.ok(sections[key].includes(item.choose_when), `${P}choose.md ${key} section lacks the trigger`);
    assert.ok(sections[key].includes(item.caveat), `${P}choose.md ${key} section lacks the caveat`);
  }
  assert.ok(!sections.ios.includes(item.choose_when), `${P}choose.md ios section lists ${ID}`);
});

Then(P + 'the chooser data resolves the same trigger and caveat for undecided, shared and android and omits it for ios', async function () {
  const item = alt();
  const {resolveRecommendation} = await load('dist/design/recommendation-policy.js');
  const contract = JSON.parse(read('dist/recommendations.json'));
  for (const platform of PLATFORMS) {
    const found = resolveRecommendation(contract, {use_case: TASK, ...(platform ? {mobile_platform: platform} : {})}).task.alternatives.filter(isKmp);
    if (platform === 'ios') assert.equal(found.length, 0, `${P}chooser data for ios lists ${ID}`);
    else {
      assert.equal(found.length, 1, `${P}chooser data for ${platform || 'undecided'} lacks ${ID}`);
      assert.equal(found[0].choose_when, item.choose_when);
      assert.equal(found[0].caveat, item.caveat);
    }
  }
});

Then(P + 'the existing scenario tests pass in the copy', function () {
  const r = spawnSync('sh', ['-c', "node --test --test-reporter=spec 'tests/scenarios/*.test.js'"], {cwd: builtCopy(), encoding: 'utf8', timeout: 100000, env: {...process.env, NO_COLOR: '1'}});
  const out = `${r.stdout}\n${r.stderr}`;
  assert.equal(r.status, 0, `${P}node --test over tests/scenarios finished with code ${r.status}\n${tail(out)}`);
  for (let n = 1; n <= 8; n++) assert.match(out, new RegExp(`scenario ${n}:`), `${P}scenario ${n} not named in the test output\n${tail(out)}`);
});
