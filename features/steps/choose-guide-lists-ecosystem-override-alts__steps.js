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
const P = 'choose-guide-lists-ecosystem-override-alts: ';
const skip = /(^|\/)(node_modules|dist|\.generated|\.git|\.kogen)(\/|$)/;
const BEFORE = path.join(root, 'features/steps/choose-guide-lists-ecosystem-override-alts__before/recommendation_content_before.py');
const HEADING = 'Alternatives for this platform choice:';
const SECTION_END = /^(When `|### |Aliases: |Sources: |Other scoped alternatives:|Alternatives for shared or undecided)/;
const tail = text => text.split('\n').slice(-30).join('\n');

const run = (cmd, args, cwd, env) => spawnSync(cmd, args, {cwd, env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024});

async function resolver() {
  return (await import(pathToFileURL(path.join(root, 'lib/recommendation-policy.js')).href)).resolveRecommendation;
}
const policyOf = dir => JSON.parse(fs.readFileSync(path.join(dir, 'menu/recommendations.json'), 'utf8'));
const chooseOf = dir => fs.readFileSync(path.join(dir, 'dist/choose.md'), 'utf8');

const altLines = alternatives => alternatives.flatMap(a => [
  `- ${a.label}${a.profile_id ? ` \`${a.profile_id}\`` : ''}: ${a.choose_when} Tradeoff: ${a.caveat}`,
  '  Sources: ' + a.sources.map(s => `[${s.title}](${s.url})`).join('; ')
]);

function taskLines(choose, task) {
  const lines = choose.split('\n');
  const start = lines.indexOf(`### ${task.label} (\`${task.id}\`)`);
  assert.ok(start >= 0, `${P}choose.md has no section for ${task.id}`);
  const end = lines.findIndex((line, i) => i > start && line.startsWith('### '));
  return lines.slice(start, end < 0 ? lines.length : end);
}

const whenPrefix = override =>
  `When ${Object.entries(override.when).map(([k, v]) => `\`${k}=${v}\``).join(', ')}, use \`${override.primary}\`:`;

function overrideRange(lines, override, task) {
  const start = lines.findIndex(line => line.startsWith(whenPrefix(override)));
  assert.ok(start >= 0, `${P}choose.md has no override ${whenPrefix(override)} under ${task.id}`);
  let end = start + 1;
  while (end < lines.length && !(end > start + 2 && SECTION_END.test(lines[end]))) end++;
  return [start, end];
}

const blockAfter = (lines, heading) => {
  const start = lines.indexOf(heading);
  if (start < 0) return null;
  const end = lines.indexOf('', start);
  return lines.slice(start + 1, end < 0 ? lines.length : end);
};

// Builds the copy by running the package.json build script text through the shell with the
// project's local binaries on PATH, as the package manager would.
Given(P + 'a disposable built copy of the project', function () {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cgl-'));
  fs.cpSync(root, dir, {recursive: true, filter: src => !skip.test(path.relative(root, src).split(path.sep).join('/'))});
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(dir, 'node_modules'));
  const script = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).scripts?.build;
  assert.equal(typeof script, 'string', `${P}package.json has no build script`);
  const env = {...process.env, PATH: `${path.join(dir, 'node_modules/.bin')}${path.delimiter}${process.env.PATH}`};
  const built = run('sh', ['-c', script], dir, env);
  assert.equal(built.status, 0, `${P}the build script failed in the copy\n${tail((built.stdout || '') + (built.stderr || ''))}`);
  this.copy = dir;
});

Then(P + 'the built choose guide lists the go-api choose_when under the {string} override of api-service', async function (ecosystem) {
  const resolveRecommendation = await resolver();
  const policy = policyOf(this.copy);
  const task = policy.use_cases.find(t => t.id === 'api-service');
  const override = task.overrides.find(o => o.when.ecosystem === ecosystem);
  assert.ok(override, `${P}api-service has no ${ecosystem} override`);
  const alternative = resolveRecommendation(policy, {use_case: 'api-service', ecosystem}).task.alternatives.find(a => a.id === 'go-api');
  assert.ok(alternative, `${P}go-api is not a resolver alternative for api-service ecosystem=${ecosystem}`);
  const lines = taskLines(chooseOf(this.copy), task);
  const [start, end] = overrideRange(lines, override, task);
  const section = lines.slice(start, end).join('\n');
  assert.ok(section.includes(alternative.choose_when),
    `${P}the ${ecosystem} override section of dist/choose.md lacks the go-api choose_when text:\n${section}`);
  assert.ok(section.includes(HEADING), `${P}the ${ecosystem} override section lacks the heading ${HEADING}`);
});

Then(P + 'the built choose guide matches the shared resolver for every task and override', async function () {
  const resolveRecommendation = await resolver();
  const policy = policyOf(this.copy);
  const choose = chooseOf(this.copy);
  let overrides = 0;
  for (const task of policy.use_cases) {
    const lines = taskLines(choose, task);
    const base = resolveRecommendation(policy, {use_case: task.id}).task;
    const heading = lines.find(l => /^(Other scoped alternatives|Alternatives for shared or undecided mobile scope):$/.test(l));
    assert.deepEqual(heading ? blockAfter(lines, heading) : [], altLines(base.alternatives),
      `${P}default alternatives of ${task.id} differ from the resolver`);
    for (const override of task.overrides || []) {
      overrides++;
      const input = {use_case: task.id, ...override.when};
      const selected = resolveRecommendation(policy, input).task;
      const [start, end] = overrideRange(lines, override, task);
      const block = blockAfter(lines.slice(start, end), HEADING);
      if (override.alternative_ids || selected.alternatives.length)
        assert.deepEqual(block, altLines(selected.alternatives),
          `${P}override alternatives for ${JSON.stringify(input)} differ from the resolver`);
      else
        assert.equal(block, null, `${P}override ${JSON.stringify(input)} has no applicable alternatives but renders a heading`);
    }
  }
  assert.ok(overrides > 0, `${P}the policy has no overrides to walk`);
});

Then(P + 'the built guide differs from the renderer before this change only by added override alternative blocks', async function () {
  const resolveRecommendation = await resolver();
  const policy = policyOf(this.copy);
  const code = [
    'import importlib.util, json, sys',
    'def load(n, p):',
    '    s = importlib.util.spec_from_file_location(n, p); m = importlib.util.module_from_spec(s); s.loader.exec_module(m); return m',
    'old = load("before", sys.argv[1]); new = load("after", sys.argv[2]); policy = json.load(open(sys.argv[3]))',
    'json.dump({"old": old.markdown(policy), "new": new.markdown(policy)}, sys.stdout)'
  ].join('\n');
  const out = run('python3', ['-I', '-c', code, BEFORE,
    path.join(this.copy, 'scripts/recommendation_content.py'), path.join(this.copy, 'menu/recommendations.json')], root);
  assert.equal(out.status, 0, `${P}rendering both versions failed\n${out.stderr}`);
  const {old, new: now} = JSON.parse(out.stdout);
  assert.ok(chooseOf(this.copy).includes(now), `${P}dist/choose.md does not carry the renderer's Markdown`);

  const o = old.split('\n'), n = now.split('\n');
  let i = 0, j = 0, taskHeading = null, when = null;
  const inserted = [];
  while (j < n.length) {
    const line = n[j];
    if (line.startsWith('### ')) taskHeading = line;
    if (line.startsWith('When `')) when = line;
    if (i < o.length && line === o[i]) { i++; j++; continue; }
    assert.equal(line, HEADING, `${P}rendering changed at new line ${j + 1} (not an added alternatives block): ${line}`);
    const start = j++;
    while (j < n.length && n[j] !== '') j++;
    inserted.push({taskHeading, when, block: n.slice(start, j)});
    j++;
  }
  assert.equal(i, o.length, `${P}the old rendering was not fully preserved (stopped at old line ${i + 1})`);

  const expected = [];
  for (const task of policy.use_cases)
    for (const override of task.overrides || []) {
      const alts = resolveRecommendation(policy, {use_case: task.id, ...override.when}).task.alternatives;
      if (!override.alternative_ids && alts.length)
        expected.push({taskHeading: `### ${task.label} (\`${task.id}\`)`, prefix: whenPrefix(override), block: [HEADING, ...altLines(alts)]});
    }
  assert.equal(inserted.length, expected.length,
    `${P}added blocks ${JSON.stringify(inserted.map(x => x.when))} differ from overrides expected to gain one ${JSON.stringify(expected.map(x => x.prefix))}`);
  expected.forEach((e, k) => {
    const got = inserted[k];
    assert.ok(got.taskHeading === e.taskHeading && got.when.startsWith(e.prefix), `${P}added block ${k} sits under ${got.when}, expected ${e.prefix}`);
    assert.deepEqual(got.block, e.block, `${P}added block under ${e.prefix} differs from the resolver's applicable alternatives`);
  });
});

When(P + 'I run scenario 8 on the copy', function () {
  const r = run('node', ['--test', '--test-reporter=spec', 'tests/scenarios/8-representations.test.js'], this.copy);
  this.result = r.status;
  this.output = (r.stdout || '') + (r.stderr || '');
});

Then(P + 'scenario 8 passes', function () {
  assert.equal(this.result, 0, `${P}scenario 8 did not pass\n${tail(this.output)}`);
  assert.match(this.output, /✔ scenario 8: dist representations agree with their sources/, `${P}scenario 8 representation check not reported as passing\n${tail(this.output)}`);
  assert.doesNotMatch(this.output, /✖/, `${P}a scenario 8 test failed\n${tail(this.output)}`);
});

Then(P + 'scenario 8 fails', function () {
  assert.notEqual(this.result, 0, `${P}scenario 8 unexpectedly passed on a guide missing an override alternative\n${tail(this.output)}`);
});

Then(P + 'scenario 8 carries no known-missing list and no expected-failure test', function () {
  const text = fs.readFileSync(path.join(this.copy, 'tests/scenarios/8-representations.test.js'), 'utf8');
  assert.doesNotMatch(text, /KNOWN_MISSING|isKnown/, `${P}the scenario 8 test still carries a known-missing exemption`);
  assert.doesNotMatch(text, /expected failure/i, `${P}the scenario 8 test still carries an expected-failure test`);
  assert.doesNotMatch(this.output, /expected failure/i, `${P}scenario 8 output still reports an expected-failure test`);
});

Then(P + 'current-state records the go-api failure as repaired and names scenario 8 as its guard', function () {
  const text = fs.readFileSync(path.join(this.copy, 'docs/current-state.md'), 'utf8');
  const record = text.slice(text.indexOf('### Baseline record'));
  assert.match(record, /go-api/, `${P}the baseline record no longer names go-api`);
  assert.match(record, /repaired/i, `${P}the baseline record does not say the failure was repaired`);
  assert.match(record, /scenario 8/i, `${P}the baseline record does not name scenario 8 as the guard`);
  assert.doesNotMatch(record, /recorded, not repaired|Diagnostic: `choose\.md has choose_when of go-api`/,
    `${P}the baseline record still lists go-api as an open failure`);
});

Given(P + 'the copy built guide has the go-api alternative removed from the python override of api-service', function () {
  const policy = policyOf(this.copy);
  const task = policy.use_cases.find(t => t.id === 'api-service');
  const override = task.overrides.find(o => o.when.ecosystem === 'python');
  const goApi = policy.alternatives.find(a => a.id === 'go-api');
  const file = path.join(this.copy, 'dist/choose.md');
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const heading = lines.indexOf(`### ${task.label} (\`${task.id}\`)`);
  const [start, end] = overrideRange(lines.slice(heading), override, task);
  const item = lines.findIndex((line, k) => k >= heading + start && k < heading + end && line.includes(goApi.choose_when));
  if (item >= 0) lines.splice(item, 2);
  fs.writeFileSync(file, lines.join('\n'));
});
