import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const require = createRequire(import.meta.url);
const {Given, When, Then, setDefaultTimeout} = require('@cucumber/cucumber');
setDefaultTimeout(115000);

const root = process.cwd();
const P = 'stack-menu-scenario-baseline: ';
const skip = /(^|\/)(node_modules|dist|\.generated|\.git|\.kogen)(\/|$)/;
const CHECK_CMD = /npm\s+run\s+check/;
const BUILD_CMD = /npm\s+run\s+build/;

// Kept values from the unchanged package.json: no new dependency, same build script.
const KEPT_DEPENDENCIES = {astro: '7.3.8', sharp: '0.35.5'};
const KEPT_DEV_DEPENDENCIES = {tailwindcss: '3.4.17', wrangler: '4.150.0'};
const KEPT_BUILD = 'python3 scripts/build-menu.py && node scripts/build-schema.mjs && tailwindcss -c tailwind.config.mjs -i src/tailwind.css -o .generated/tailwind.css --minify && astro build && python3 scripts/build-agent-content.py && python3 scripts/finalize.py';

const MUTATIONS = {
  'build returns all candidates': {
    file: 'lib/router.js',
    from: 'feasible=existing?.unknown_source?[]:[existing];',
    to: 'feasible=index.profiles.slice();'
  },
  'content-site primary changed': {
    file: 'menu/recommendations.json',
    from: '"primary": "astro-content"',
    to: '"primary": "rails-hotwire-postgresql"'
  }
};

const tail = text => text.split('\n').slice(-40).join('\n');

Given(P + 'a disposable copy of the project', function () {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'smb-'));
  fs.cpSync(root, dir, {recursive: true, filter: src => !skip.test(path.relative(root, src).split(path.sep).join('/'))});
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(dir, 'node_modules'));
  this.copy = dir;
});

Given(P + 'the copy has the mutation {string}', function (name) {
  const m = MUTATIONS[name];
  assert.ok(m, `${P}unknown mutation ${name}`);
  const file = path.join(this.copy, m.file);
  const text = fs.readFileSync(file, 'utf8');
  assert.ok(text.includes(m.from), `${P}mutation ${name}: text not found in ${m.file}`);
  fs.writeFileSync(file, text.replace(m.from, () => m.to));
});

// Runs the package.json "check" script text through the shell in the copy, with the
// project's local binaries on PATH, as the package manager would.
When(P + 'I run the check script in the copy', function () {
  const script = JSON.parse(fs.readFileSync(path.join(this.copy, 'package.json'), 'utf8')).scripts?.check;
  if (typeof script !== 'string') {
    this.result = 127;
    this.output = 'package.json has no check script';
    return;
  }
  const bin = path.join(this.copy, 'node_modules', '.bin');
  const r = spawnSync('sh', ['-c', script], {cwd: this.copy, encoding: 'utf8', timeout: 100000, env: {...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}`, NO_COLOR: '1', FORCE_COLOR: '0'}});
  this.result = r.status;
  this.output = `${r.stdout || ''}\n${r.stderr || ''}${r.error ? '\n' + String(r.error) : ''}`;
});

Then(P + 'the command succeeds', function () {
  assert.equal(this.result, 0, `${P}check script finished with code ${this.result}\n${tail(this.output)}`);
});

Then(P + 'the output names scenarios 1 to 8', function () {
  for (let n = 1; n <= 8; n++) assert.match(this.output, new RegExp(`scenario ${n}:`), `${P}scenario ${n} not named in output\n${tail(this.output)}`);
});

Then(P + 'the command fails', function () {
  assert.notEqual(this.result, 0, `${P}check script unexpectedly succeeded on a mutated copy\n${tail(this.output)}`);
});

Then(P + 'the output reports scenario {int} as failed', function (n) {
  assert.match(this.output, new RegExp(`✖[^\\n]*scenario ${n}:`), `${P}scenario ${n} not reported failed (code ${this.result})\n${tail(this.output)}`);
});

Then(P + 'the check script builds before node --test and runs python3', function () {
  const script = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).scripts?.check;
  assert.equal(typeof script, 'string', `${P}package.json has no check script`);
  const b = script.search(BUILD_CMD);
  const t = script.indexOf('node --test');
  assert.ok(b >= 0 && t > b, `${P}check script must run the build script before node --test: ${script}`);
  assert.ok(script.includes('python3'), `${P}check script must run a python3 step: ${script}`);
});

Then(P + 'the package dependencies and build script are the kept ones', function () {
  const now = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.deepEqual(now.dependencies, KEPT_DEPENDENCIES, `${P}dependencies changed`);
  assert.deepEqual(now.devDependencies, KEPT_DEV_DEPENDENCIES, `${P}devDependencies changed`);
  assert.equal(now.scripts.build, KEPT_BUILD, `${P}build script changed`);
});

Then(P + 'the lockfile is unchanged from the committed tree', function () {
  const r = spawnSync('git', ['diff', '--name-only', 'HEAD', '--', 'package-lock.json'], {cwd: root, encoding: 'utf8'});
  assert.equal(r.status, 0, `${P}git diff failed: ${r.stderr}`);
  assert.equal(r.stdout.trim(), '', `${P}package-lock.json changed:\n${r.stdout}`);
});

Then(P + 'product files under lib, functions and menu are unchanged from the committed tree', function () {
  const r = spawnSync('git', ['diff', '--name-only', 'HEAD', '--', 'lib', 'functions', 'menu'], {cwd: root, encoding: 'utf8'});
  assert.equal(r.status, 0, `${P}git diff failed: ${r.stderr}`);
  const u = spawnSync('git', ['ls-files', '--others', '--exclude-standard', '--', 'lib', 'functions', 'menu'], {cwd: root, encoding: 'utf8'});
  assert.equal(`${r.stdout}${u.stdout}`.trim(), '', `${P}product files changed:\n${r.stdout}${u.stdout}`);
});

Then(P + 'workflow step 5 mentions the check command', function () {
  const line = fs.readFileSync(path.join(root, 'docs/website-workflow.md'), 'utf8').split('\n').find(l => /^5\. /.test(l));
  assert.ok(line, `${P}docs/website-workflow.md has no step 5`);
  assert.match(line, CHECK_CMD, `${P}step 5 does not mention the check command: ${line.slice(0, 200)}`);
});

Then(P + 'current-state records the check scope and a baseline on an existing commit', function () {
  const text = fs.readFileSync(path.join(root, 'docs/current-state.md'), 'utf8');
  assert.match(text, CHECK_CMD, `${P}docs/current-state.md does not mention the check command`);
  assert.match(text, /pre-existing/i, `${P}docs/current-state.md records no pre-existing failure classification`);
  const hashes = text.match(/\b[0-9a-f]{40}\b/g) || [];
  assert.ok(hashes.length > 0, `${P}docs/current-state.md names no full 40-character commit hash`);
});
