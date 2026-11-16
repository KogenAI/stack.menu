import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';

const require = createRequire(import.meta.url);
const {Given, When, Then, setDefaultTimeout} = require('@cucumber/cucumber');
setDefaultTimeout(115000);

const root = process.cwd();
const P = 'stack-menu-recommendation-emphasis: ';
const skip = /(^|\/)(node_modules|dist|\.generated|\.git|\.kogen)(\/|$)/;
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const router = () => import(pathToFileURL(path.join(root, 'lib/router.js')).href);
const ROLES = ['primary', 'alternative', null];
let built = null;

const tasks = () => readJson('menu/recommendations.json').use_cases.map(u => u.id);
const profiles = () => readJson('lib/selection-index.json').profiles;

When(P + 'I route the choose goal for every task', async function () {
  const {routeContext} = await router();
  this.responses = Object.fromEntries(tasks().map(id => [id, routeContext({goal: 'choose', use_case: id})]));
});

When(P + 'I route choose for task {string} with static_only true', async function (task) {
  const {routeContext} = await router();
  this.responses = {[task]: routeContext({goal: 'choose', use_case: task, static_only: true})};
});

Then(P + 'exactly one candidate is marked primary whenever the primary is feasible', function () {
  for (const [task, r] of Object.entries(this.responses)) {
    const marked = r.candidates.filter(c => c.recommendation_role === 'primary').map(c => c.id);
    if (r.recommendation.primary.feasible) assert.deepEqual(marked, [r.recommendation.primary.id], `${P}${task} needs exactly its primary marked`);
    else assert.deepEqual(marked, [], `${P}${task} has an infeasible primary but a marked candidate`);
  }
});

Then(P + 'the primary is infeasible and no candidate is marked primary', function () {
  const [task, r] = Object.entries(this.responses)[0];
  assert.equal(r.recommendation.primary.feasible, false, `${P}${task} primary should be infeasible under static_only`);
  assert.ok(r.candidates.length > 0, `${P}the catalogue must stay visible`);
  assert.equal(r.candidates.filter(c => c.recommendation_role === 'primary').length, 0, `${P}no candidate may be primary`);
});

Then(P + 'each alternative marker is a feasible alternative with a profile ID', function () {
  for (const [task, r] of Object.entries(this.responses)) {
    for (const c of r.candidates) assert.ok(ROLES.includes(c.recommendation_role) && Object.hasOwn(c, 'recommendation_role'), `${P}${task}/${c.id} has an invalid or missing role`);
    const marked = r.candidates.filter(c => c.recommendation_role === 'alternative').map(c => c.id).sort();
    const expected = r.recommendation.alternatives.filter(a => a.profile_id && a.feasible === true && a.profile_id !== r.recommendation.primary.id).map(a => a.profile_id);
    assert.deepEqual(marked, [...new Set(expected)].sort(), `${P}${task} alternative markers`);
  }
});

Then(P + 'candidates keep catalogue order and none is dropped', function () {
  const all = profiles();
  for (const [task, r] of Object.entries(this.responses)) {
    const ids = r.candidates.map(c => c.id);
    const order = all.map(p => p.id).filter(id => ids.includes(id));
    assert.deepEqual(ids, order, `${P}${task} candidates are out of catalogue order`);
    const {required_roles: roles, component, role_options: options} = r.recommendation.use_case;
    const expected = all.filter(p => roles.every(x => p.kind.includes(x)) && (!component || p.kind.includes(component)) && (!options || options.some(x => p.kind.includes(x)))).map(p => p.id);
    assert.deepEqual(ids, expected, `${P}${task} candidates differ from the feasible catalogue`);
  }
});

When(P + 'I route build, migrate and a choose without a task', async function () {
  const {routeContext} = await router();
  const ids = profiles().map(p => p.id);
  this.responses = {
    build: routeContext({goal: 'build', existing_stack: ids[0], use_case: tasks()[0]}),
    migrate: routeContext({goal: 'migrate', existing_stack: ids[0], target_stack: ids[1]}),
    untasked: routeContext({goal: 'choose', component: 'web'})
  };
});

Then(P + 'no response carries a recommendation or a candidate recommendation_role', function () {
  for (const [name, r] of Object.entries(this.responses)) {
    assert.equal(r.recommendation, undefined, `${P}${name} must not carry a recommendation`);
    for (const c of r.candidates) assert.ok(!Object.hasOwn(c, 'recommendation_role'), `${P}${name}/${c.id} must not carry a role`);
  }
});

Then(P + 'no candidate is a rewrite source', function () {
  const sources = new Set(readJson('menu/rewrite-sources.json').sources.map(s => s.id));
  for (const [task, r] of Object.entries(this.responses))
    for (const c of r.candidates) assert.ok(!sources.has(c.id) && !c.source_only, `${P}${task} lists source-only ${c.id}`);
});

Then(P + 'every rewrite source is rejected as a target_stack', async function () {
  const {routeContext} = await router();
  const ids = profiles().map(p => p.id);
  for (const s of readJson('menu/rewrite-sources.json').sources)
    assert.throws(() => routeContext({goal: 'migrate', existing_stack: ids[0], target_stack: s.id}), /target_stack/, `${P}${s.id} accepted as a target`);
});

Then(P + 'the leading nudge points to recommendation.primary and calls candidates the feasible catalogue', function () {
  for (const [task, r] of Object.entries(this.responses)) {
    const lead = r.nudges[0];
    assert.match(lead, /recommendation\.primary/, `${P}${task} leading nudge`);
    assert.match(lead, /feasible catalogue/, `${P}${task} leading nudge`);
    assert.match(lead, /not finalists/, `${P}${task} leading nudge`);
    assert.ok(!r.nudges.some(n => /Read feasible finalists/.test(n)), `${P}${task} keeps the old finalist nudge`);
  }
});

Then(P + 'the schema version is still 1.1', function () {
  for (const r of Object.values(this.responses)) assert.equal(r.schema_version, '1.1');
});

// Runs the package.json build script text through the shell in a disposable copy,
// with the project's local binaries on PATH, as the package manager would.
Given(P + 'a disposable built copy of the project', {timeout: 115000}, function () {
  if (built) { this.copy = built.copy; return; }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'smre-'));
  fs.cpSync(root, dir, {recursive: true, filter: src => !skip.test(path.relative(root, src).split(path.sep).join('/'))});
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(dir, 'node_modules'));
  const script = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).scripts?.build;
  assert.equal(typeof script, 'string', `${P}package.json has no build script`);
  const bin = path.join(dir, 'node_modules', '.bin');
  const r = spawnSync('sh', ['-c', script], {cwd: dir, encoding: 'utf8', timeout: 105000, env: {...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}`, NO_COLOR: '1'}});
  this.buildOutput = `${String(r.stdout).slice(-1500)}\n${String(r.stderr).slice(-1500)}`;
  this.buildExists = fs.existsSync(path.join(dir, 'dist/choose.md'));
  assert.ok(this.buildExists, `${P}the build script produced no dist/choose.md\n${this.buildOutput}`);
  built = {copy: dir};
  this.copy = dir;
});

const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
};

Then(P + 'the generated choose guide has no finalist wording', function () {
  const choose = fs.readFileSync(path.join(this.copy, 'dist/choose.md'), 'utf8');
  const bad = /\b(the|feasible)\s+finalists?\b|finalist's/i;
  assert.ok(!bad.test(choose), `${P}dist/choose.md still calls candidates finalists`);
  assert.match(choose, /feasible catalogue/, `${P}dist/choose.md should describe the feasible catalogue`);
  for (const f of ['dist/llms-full.txt', 'dist/llms.txt']) {
    const p = path.join(this.copy, f);
    if (fs.existsSync(p)) assert.ok(!bad.test(fs.readFileSync(p, 'utf8')), `${P}${f} still uses finalist wording`);
  }
});

Then(P + 'the library labels each per-guide task link related task and keeps its target', function () {
  const candidates = walk(this.copy).filter(p => p.endsWith(`${path.sep}design${path.sep}data.js`) && !p.includes('node_modules'));
  assert.ok(candidates.length > 0, `${P}no built design/data.js found`);
  const text = fs.readFileSync(candidates[0], 'utf8');
  const data = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
  assert.ok(data.stacks.length > 0);
  for (const s of data.stacks) {
    const labels = s.files.map(f => f[0]);
    assert.ok(!labels.includes('recommendation'), `${P}${s.id} still labels a guide recommendation`);
    const related = s.files.find(f => f[0] === 'related task');
    assert.ok(related, `${P}${s.id} lacks a related task link`);
    assert.equal(related[2], `/choose/?stack=${s.id}`, `${P}${s.id} related task target`);
  }
});

Then(P + 'the routing contract and schema describe the roles', function () {
  const routing = fs.readFileSync(path.join(this.copy, 'dist/agents/routing.md'), 'utf8');
  for (const word of ['recommendation_role', 'primary', 'alternative', 'feasible catalogue'])
    assert.ok(routing.includes(word), `${P}dist/agents/routing.md lacks ${word}`);
  const schema = fs.readFileSync(path.join(this.copy, 'dist/context.schema.json'), 'utf8');
  assert.ok(schema.includes('recommendation_role'), `${P}dist/context.schema.json lacks recommendation_role`);
  assert.equal(JSON.parse(schema).additionalProperties, false, `${P}schema input validation must be unchanged`);
});
