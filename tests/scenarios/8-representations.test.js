import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {resolveRecommendation} from '../../lib/recommendation-policy.js';
import {root, readJson, readText} from './helpers.js';

const exists = url => fs.existsSync(path.join(root, 'dist', url.replace(/^\//, '').replace(/\/$/, '/index.html')));

test('scenario 8: dist representations agree with their sources', () => {
  assert.ok(fs.existsSync(path.join(root, 'dist')), 'dist/ is built before this check');
  const policy = readJson('menu/recommendations.json');
  assert.deepEqual(JSON.parse(readText('dist/recommendations.json')), policy);

  const choose = readText('dist/choose.md');
  const lines = choose.split('\n');
  const render = alternatives => alternatives.flatMap(a => [
    `- ${a.label}${a.profile_id ? ` \`${a.profile_id}\`` : ''}: ${a.choose_when} Tradeoff: ${a.caveat}`,
    '  Sources: ' + a.sources.map(s => `[${s.title}](${s.url})`).join('; ')
  ]);
  // Lines of the block that follows a heading line, up to the next blank line.
  const blockAfter = (start) => {
    const block = [];
    for (let i = start + 1; i < lines.length && lines[i] !== ''; i++) block.push(lines[i]);
    return block;
  };
  const taskStart = id => lines.findIndex(l => l.endsWith(`(\`${id}\`)`) && l.startsWith('### '));
  const sectionEnd = start => {
    const next = lines.findIndex((l, i) => i > start && l.startsWith('### '));
    return next === -1 ? lines.length : next;
  };
  for (const task of policy.use_cases) {
    const start = taskStart(task.id);
    assert.ok(start >= 0, `choose.md has a section for ${task.id}`);
    const end = sectionEnd(start);
    const section = lines.slice(start, end);
    const rel = (re) => section.findIndex(l => re.test(l));

    const base = resolveRecommendation(policy, {use_case: task.id}).task;
    assert.ok(choose.includes(`\`${base.primary}\``), `choose.md names primary ${base.primary} for ${task.id}`);
    const defaultHeading = section.findIndex(l => /^(Other scoped alternatives|Alternatives for shared or undecided mobile scope):$/.test(l));
    assert.deepEqual(defaultHeading === -1 ? [] : blockAfter(start + defaultHeading), render(base.alternatives),
      `${task.id} default alternatives equal the resolver's`);

    for (const override of task.overrides || []) {
      const input = {use_case: task.id, ...override.when};
      const {task: selected} = resolveRecommendation(policy, input);
      const condition = Object.entries(override.when).map(([k, v]) => `\`${k}=${v}\``).join(', ');
      const at = section.findIndex(l => l.startsWith(`When ${condition}, use \`${override.primary}\`:`));
      assert.ok(at >= 0, `${task.id} section carries the override ${condition}`);
      // The override's own block ends at the next override, aliases, sources or default alternatives.
      let stop = section.length;
      for (let i = at + 3; i < section.length; i++)
        if (/^(When `|Aliases: |Sources: |Other scoped alternatives:|Alternatives for shared or undecided)/.test(section[i])) { stop = i; break; }
      const own = section.slice(at, stop);
      const heading = own.findIndex(l => l === 'Alternatives for this platform choice:');
      if (override.alternative_ids || selected.alternatives.length) {
        assert.notEqual(heading, -1, `${JSON.stringify(input)} renders the alternatives heading`);
        assert.deepEqual(blockAfter(start + at + heading), render(selected.alternatives),
          `${JSON.stringify(input)} alternatives equal the resolver's`);
      } else {
        assert.equal(heading, -1, `${JSON.stringify(input)} has no applicable alternatives and no heading`);
      }
    }
  }

  for (const name of ['recommendation-policy.js', 'migration-fit.js'])
    assert.ok(fs.readFileSync(path.join(root, 'lib', name)).equals(fs.readFileSync(path.join(root, 'dist/design', name))), `${name} is byte-equal`);

  const profiles = readJson('lib/selection-index.json').profiles;
  const advertised = JSON.parse(readText('dist/rewrite/sources.json')).sources;
  const sourceIds = readJson('menu/rewrite-sources.json').sources.map(s => s.id);
  assert.ok(sourceIds.every(id => advertised.some(s => s.id === id)), 'every rewrite source is advertised in dist/rewrite/sources.json');
  const sources = advertised;
  for (const entry of [...profiles, ...sources])
    for (const key of ['guide_url', 'markdown_url', 'json_url'])
      assert.ok(entry[key] && exists(entry[key]), `${entry.id} ${key} ${entry[key]} exists under dist/`);
});
