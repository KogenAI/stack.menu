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
const P = 'stack-menu-desktop-guidance: ';
const TASK = 'desktop-app';
const skip = /(^|\/)(node_modules|dist|\.generated|\.git|\.kogen)(\/|$)/;
const tail = text => String(text).split('\n').slice(-40).join('\n');

let copy = null;
function builtCopy() {
  if (copy) return copy;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'desk-'));
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
const task = () => {
  const found = policy().use_cases.find(item => item.id === TASK);
  assert.ok(found, `${P}menu/recommendations.json has no use case ${TASK}`);
  return found;
};
const lead = () => {
  const found = policy().alternatives.find(item => item.id === task().primary);
  assert.ok(found, `${P}task primary ${task().primary} is not an alternative id`);
  return found;
};
const others = () => policy().alternatives.filter(item => item.use_cases.includes(TASK) && item.id !== task().primary);
const allText = item => `${item.label} ${item.choose_when} ${item.caveat}`;
const load = file => import(pathToFileURL(path.join(builtCopy(), file)).href);

async function route(query) {
  const {onRequest} = await load('functions/route.js');
  const res = await onRequest({request: new Request(`http://localhost/route${query}`)});
  assert.equal(res.status, 200, `${P}GET /route${query} returned ${res.status}`);
  return JSON.parse(await res.text());
}

Given(P + 'a built copy of the project', function () { builtCopy(); });

function loadPolicy(mutated) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'desk-policy-'));
  fs.mkdirSync(path.join(dir, 'menu'));
  fs.copyFileSync(path.join(builtCopy(), 'menu/profiles.json'), path.join(dir, 'menu/profiles.json'));
  fs.writeFileSync(path.join(dir, 'menu/recommendations.json'), JSON.stringify(mutated));
  const code = "import sys, pathlib\nsys.path.insert(0, 'scripts')\nimport recommendation_content as m\ntry:\n    m.load_policy(pathlib.Path(sys.argv[1]))\nexcept ValueError as error:\n    print('ValueError', error)\n    sys.exit(3)\n";
  return spawnSync('python3', ['-I', '-c', code, dir], {cwd: builtCopy(), encoding: 'utf8'});
}
function rejected(name, mutate) {
  const value = policy();
  mutate(value);
  const r = loadPolicy(value);
  assert.equal(r.status, 3, `${P}load_policy did not reject ${name}: exit ${r.status}\n${r.stdout}\n${r.stderr}`);
}

Then(P + 'the policy has the desktop-app task with curated false and a null-profile lead', function () {
  const t = task();
  assert.equal(t.curated, false);
  assert.equal(t.component, 'desktop');
  assert.deepEqual(t.required_roles, ['desktop']);
  assert.equal(typeof t.question, 'string');
  assert.ok(t.question.trim().length > 0, `${P}task question is empty`);
  const l = lead();
  assert.equal(l.profile_id, null);
  assert.ok(l.use_cases.includes(TASK));
});

Then(P + 'the lead and task cite official https sources and the policy loader accepts the policy', function () {
  for (const item of [task(), lead(), ...others()]) {
    assert.ok(Array.isArray(item.sources) && item.sources.length > 0, `${P}${item.id} has no sources`);
    for (const source of item.sources) assert.equal(new URL(source.url).protocol, 'https:', `${P}${source.url} is not https`);
  }
  const r = loadPolicy(policy());
  assert.equal(r.status, 0, `${P}load_policy failed\n${r.stdout}\n${r.stderr}`);
});

Then(P + 'no profile or generator exists for the desktop frameworks', function () {
  const profiles = JSON.parse(read('lib/selection-index.json')).profiles;
  assert.ok(!profiles.some(p => p.kind.includes('desktop') || /tauri|electron|gpui|compose-multiplatform/i.test(p.id)), `${P}a desktop profile exists`);
  const generators = fs.readdirSync(path.join(builtCopy(), 'menu/generators'));
  assert.ok(!generators.some(name => /tauri|electron|gpui|desktop/i.test(name)), `${P}a desktop generator exists: ${generators}`);
});

Then(P + 'the lead names stable Tauri 2, the alpha 3.0 line and system webview differences', function () {
  const text = allText(lead());
  for (const pattern of [/Tauri/, /stable/i, /alpha/i, /webview/i, /Rust/]) assert.match(text, pattern, `${P}lead lacks ${pattern}: ${text}`);
});

Then(P + 'the alternatives cover Electron with its upgrade obligation, Compose Multiplatform, GPUI and single-OS native clients', function () {
  const list = others();
  const find = pattern => {
    const found = list.find(item => pattern.test(item.label));
    assert.ok(found, `${P}no desktop alternative labelled ${pattern}: ${list.map(i => i.label)}`);
    assert.equal(found.profile_id, null);
    return found;
  };
  assert.match(allText(find(/Electron/)), /upgrade/i);
  assert.match(allText(find(/Compose Multiplatform/)), /Kotlin/);
  find(/GPUI/);
  assert.match(allText(find(/native/i)), /SwiftUI|AppKit/);
});

Then(P + 'the GPUI alternative requires pre-1.0 acceptance, an exact revision and per-OS qualification', function () {
  const text = allText(others().find(item => /GPUI/.test(item.label)));
  for (const pattern of [/pre-1\.0/i, /breaking/i, /exact revision/i, /every target|each target/i])
    assert.match(text, pattern, `${P}GPUI text lacks ${pattern}: ${text}`);
});

Then(P + 'Windows-native and dotnet stay an explicit coverage gap', function () {
  const text = allText(others().find(item => /native/i.test(item.label)));
  assert.match(text, /Windows/);
  assert.match(text, /\.NET/);
  assert.match(text, /coverage gap/i);
});

Then(P + 'the task states it is not universal Tauri superiority and that goal:build preserves a chosen stack', function () {
  const text = task().tradeoff;
  assert.match(text, /not (a )?universal/i, `${P}tradeoff lacks the non-universal statement: ${text}`);
  assert.match(text, /accessibility/i);
  assert.match(text, /goal:build/);
});

When(P + 'I request the route for component desktop', async function () { this.route = await route('?component=desktop'); });
When(P + 'I request the route for use case desktop-app', async function () { this.route = await route(`?goal=choose&use_case=${TASK}`); });

Then(P + 'the route succeeds with an uncurated primary and no substitute', function () {
  const r = this.route;
  assert.equal(r.goal, 'choose');
  assert.equal(r.recommendation.use_case.id, TASK);
  const p = r.recommendation.primary;
  assert.equal(p.id, task().primary);
  assert.equal(p.curated, false);
  assert.equal(p.feasible, null);
  assert.equal(typeof p.title, 'string');
  assert.deepEqual(r.candidates, []);
  assert.ok(!r.recommendation.alternatives.some(a => a.id === p.id), `${P}the lead is repeated as an alternative`);
});

Then(P + 'the route carries the coverage nudge and the consequential question', function () {
  const r = this.route;
  assert.ok(r.nudges.some(n => /coverage gap/i.test(n) && /desktop/i.test(n)), `${P}no desktop coverage-gap nudge: ${JSON.stringify(r.nudges)}`);
  assert.ok(!r.nudges.some(n => /not present in the current catalogue/i.test(n)), `${P}the missing-default-profile nudge fired: ${JSON.stringify(r.nudges)}`);
  assert.ok(r.questions.includes(task().question), `${P}route questions lack the task question: ${JSON.stringify(r.questions)}`);
});

Then(P + 'the route alternatives match the policy with feasible null', function () {
  const expected = others().map(a => a.id).sort();
  const actual = this.route.recommendation.alternatives;
  assert.deepEqual(actual.map(a => a.id).sort(), expected);
  for (const item of actual) {
    const source = others().find(a => a.id === item.id);
    assert.equal(item.feasible, null);
    assert.equal(item.profile_id, null);
    assert.equal(item.choose_when, source.choose_when);
    assert.equal(item.caveat, source.caveat);
    assert.deepEqual(item.sources, source.sources);
  }
});

When(P + 'I request the build route for an unlisted desktop stack', async function () {
  this.route = await route('?goal=build&component=desktop&existing_stack=acme-gpui-editor&source_label=Acme%20GPUI%20editor');
});

Then(P + 'the route keeps the chosen stack and offers research without a substitute', function () {
  const r = this.route;
  assert.equal(r.goal, 'build');
  assert.equal(r.recommendation, undefined);
  assert.deepEqual(r.candidates, []);
  assert.equal(r.existing_source.unknown_source, true);
  assert.equal(r.existing_source.id, 'acme-gpui-editor');
  assert.ok(r.nudges.some(n => /Preserve the selected stack/i.test(n)));
  assert.ok(r.questions.some(q => /Do not substitute/i.test(q)), `${P}no research question: ${JSON.stringify(r.questions)}`);
  assert.ok(r.resources.includes('/rewrite/sources.json'));
});

Then(P + 'the compiler accepts the unchanged policy', function () {
  const r = loadPolicy(policy());
  assert.equal(r.status, 0, `${P}control policy rejected\n${r.stdout}\n${r.stderr}`);
});

Then(P + 'the compiler rejects a curated task with a null primary', function () {
  rejected('a curated null primary', value => { value.use_cases.find(t => t.id !== TASK && t.curated !== false).primary = null; });
});
for (const field of ['sources', 'why', 'tradeoff']) {
  Then(P + `the compiler rejects an uncurated task without ${field}`, function () {
    rejected(`an uncurated task without ${field}`, value => { delete value.use_cases.find(t => t.id === TASK)[field]; });
  });
}

Then(P + 'recommendations.json carries the desktop task and alternatives unchanged from the policy', function () {
  const built = JSON.parse(read('dist/recommendations.json'));
  assert.deepEqual(built.use_cases.find(t => t.id === TASK), task());
  for (const item of [lead(), ...others()]) assert.deepEqual(built.alternatives.find(a => a.id === item.id), item);
});

Then(P + 'choose.md shows the lead, alternatives, triggers and sources', function () {
  const md = read('dist/choose.md');
  const t = task();
  assert.ok(md.includes(`\`${t.primary}\``), `${P}choose.md lacks the lead id`);
  assert.ok(md.includes(t.question), `${P}choose.md lacks the question`);
  for (const item of [lead(), ...others()]) {
    assert.ok(md.includes(item.choose_when), `${P}choose.md lacks the trigger of ${item.id}`);
    assert.ok(md.includes(item.caveat), `${P}choose.md lacks the caveat of ${item.id}`);
    for (const source of item.sources) assert.ok(md.includes(source.url), `${P}choose.md lacks ${source.url}`);
  }
});

Then(P + 'the chooser data resolves the same uncurated lead, question and alternatives', async function () {
  const {resolveRecommendation} = await load('dist/design/recommendation-policy.js');
  const contract = JSON.parse(read('dist/recommendations.json'));
  const resolved = resolveRecommendation(contract, {use_case: TASK}).task;
  assert.equal(resolved.curated, false);
  assert.equal(resolved.primary, task().primary);
  assert.equal(resolved.question, task().question);
  assert.deepEqual(resolved.alternatives.map(a => a.id).sort(), others().map(a => a.id).sort());
  assert.ok(contract.alternatives.some(a => a.id === resolved.primary && a.choose_when === lead().choose_when));
  const kinds = read('dist/design/interactive.js');
  assert.match(kinds, /desktop/, `${P}the built interactive script never mentions desktop`);
});

Then(P + 'choose.md lists Desktop under target surfaces and the agent entry covers desktop', function () {
  const md = read('dist/choose.md');
  const line = md.split('\n').find(l => l.includes('Target surfaces'));
  assert.ok(line && /desktop/i.test(line), `${P}Target surfaces line: ${line}`);
  assert.match(read('content/agent-entry.md'), /desktop/i);
  assert.match(read('content/routing.md'), /desktop/i);
});

Then(P + 'desktop stack preparation stays a coverage gap', function () {
  const gaps = JSON.parse(read('lib/selection-index.json')).coverage_gaps;
  assert.ok(gaps.includes('Desktop stack preparation'), `${P}coverage_gaps: ${JSON.stringify(gaps)}`);
});

Then(P + 'the existing scenario tests and compiler positive check pass in the copy', function () {
  const r = spawnSync('sh', ['-c', "node --test --test-reporter=spec 'tests/scenarios/*.test.js' && python3 -I tests/scenarios/compiler_validation.py positive ."], {cwd: builtCopy(), encoding: 'utf8', timeout: 100000, env: {...process.env, NO_COLOR: '1'}});
  const out = `${r.stdout}\n${r.stderr}`;
  assert.equal(r.status, 0, `${P}scenario tests finished with code ${r.status}\n${tail(out)}`);
  for (let n = 1; n <= 8; n++) assert.match(out, new RegExp(`scenario ${n}:`), `${P}scenario ${n} not named in the output\n${tail(out)}`);
});
