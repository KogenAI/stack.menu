import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';

const require = createRequire(import.meta.url);
const {Given, When, Then, setDefaultTimeout} = require('@cucumber/cucumber');
setDefaultTimeout(115000);

const root = process.cwd();
const P = 'stack-menu-bruno-sponsorship: ';
const skip = /(^|\/)(node_modules|dist|\.generated|\.git|\.kogen)(\/|$)/;
const tail = text => String(text).split('\n').slice(-40).join('\n');

let copy = null;
function builtCopy() {
  if (copy) return copy;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bruno-'));
  fs.cpSync(root, dir, {recursive: true, filter: src => !skip.test(path.relative(root, src).split(path.sep).join('/'))});
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(dir, 'node_modules'));
  const script = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).scripts.build;
  const bin = path.join(dir, 'node_modules', '.bin');
  const r = spawnSync('sh', ['-c', script], {cwd: dir, encoding: 'utf8', timeout: 100000, env: {...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}`, NO_COLOR: '1'}});
  assert.equal(r.status, 0, `${P}build of the copy finished with code ${r.status}\n${tail(r.stdout)}\n${tail(r.stderr)}`);
  copy = dir;
  return dir;
}
const read = file => {
  const full = path.join(builtCopy(), file);
  assert.ok(fs.existsSync(full), `${P}${file} does not exist in the built copy`);
  return fs.readFileSync(full, 'utf8');
};
const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!skip.test(e.name)) walk(p, out); } else out.push(p);
  }
  return out;
};
const load = file => import(pathToFileURL(path.join(builtCopy(), file)).href);
async function route(query) {
  const {onRequest} = await load('functions/route.js');
  const res = await onRequest({request: new Request(`http://localhost/route${query}`)});
  assert.equal(res.status, 200, `${P}GET /route${query} returned ${res.status}`);
  return res.text();
}

const HOME = 'dist/index.html';
const PROFILE = 'dist/sponsors/bruno/index.html';
const attr = (tag, name) => (new RegExp(`\\s${name}="([^"]*)"`).exec(tag) || [])[1];
const cardHtml = html => {
  const m = /<(\w+)\b[^>]*data-sponsor="bruno"[^>]*>/.exec(html);
  assert.ok(m, `${P}the page has no element with data-sponsor="bruno"`);
  const open = m.index;
  const close = html.indexOf(`</${m[1]}>`, open);
  assert.ok(close > open, `${P}the data-sponsor="bruno" element is not closed`);
  return {open, html: html.slice(open, close)};
};
const links = html => [...html.matchAll(/<a\b[^>]*>/g)].map(m => m[0]);
const text = html => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
function assertBrunoUrl(href, where) {
  const u = new URL(href);
  assert.equal(u.protocol, 'https:', `${P}${where}: ${href} is not https`);
  assert.ok(u.hostname === 'usebruno.com' || u.hostname.endsWith('.usebruno.com'), `${P}${where}: ${href} is not a usebruno.com link`);
  assert.equal(u.search, '', `${P}${where}: ${href} carries a query string; the plain product link has no referral parameters`);
  assert.equal(u.hash, '', `${P}${where}: ${href} has a fragment`);
}
Given(P + 'a built copy of the project', function () { builtCopy(); });

Then(P + 'the homepage has one Sponsored card for Bruno after the full demo and its caption', function () {
  const html = read(HOME);
  assert.equal(html.split('data-sponsor="bruno"').length - 1, 1, `${P}expected exactly one data-sponsor="bruno" element on the homepage`);
  const caption = html.indexOf('id="hero-demo-caption"');
  assert.ok(caption > 0, `${P}homepage lost the hero demo caption`);
  const figureEnd = html.indexOf('</figure>', caption);
  assert.ok(figureEnd > caption, `${P}hero demo figure is not closed`);
  const card = cardHtml(html);
  assert.ok(card.open > figureEnd, `${P}the card is not after the full hero demo figure (video, caption and demo summary)`);
  const agents = html.indexOf('Bring the coding agent you already use');
  assert.ok(agents > card.open, `${P}the card is not before the "Bring the coding agent you already use" section`);
  const sponsorSection = html.lastIndexOf('<section', card.open);
  const label = attr(html.slice(sponsorSection, html.indexOf('>', sponsorSection)), 'aria-labelledby');
  const labelTag = label && html.indexOf(`id="${label}"`, sponsorSection);
  assert.ok(labelTag > sponsorSection && labelTag < card.open, `${P}the card has no visible group disclosure`);
  assert.match(text(html.slice(labelTag, card.open)), /\bSponsored\b/, `${P}the group does not say Sponsored`);
  assert.match(text(card.html), /Bruno/, `${P}the card does not name Bruno`);
  assert.match(card.html, /<img\b[^>]*\balt="[^"]*"/, `${P}the card has no Bruno mark image with an alt attribute`);
  const src = /<img\b[^>]*\bsrc="([^"]+)"/.exec(card.html);
  assert.ok(src && src[1].startsWith('/'), `${P}the card mark must be a first-party root-relative image`);
  const asset = path.join(builtCopy(), 'dist', src[1].split('?')[0]);
  assert.ok(fs.existsSync(asset) && fs.statSync(asset).size > 0, `${P}mark ${src[1]} is missing from dist`);
  const markDigest = createHash('sha256').update(fs.readFileSync(asset)).digest('hex');
  assert.equal(markDigest, '08f9f3af6b9608d8c9619e883395209e2ba437cdc2ec344020b5723b835fcf82',
    `${P}the homepage does not use the reviewed Bruno mark`);
});

Then(P + 'the card primary link goes to the plain Bruno product link and the secondary link opens the sponsor profile', function () {
  const card = cardHtml(read(HOME)).html;
  const primary = links(card).filter(a => attr(a, 'data-sponsor-link') === 'primary');
  const secondary = links(card).filter(a => attr(a, 'data-sponsor-link') === 'profile');
  assert.equal(primary.length, 1, `${P}expected exactly one a[data-sponsor-link="primary"] in the card`);
  assert.equal(secondary.length, 1, `${P}expected exactly one a[data-sponsor-link="profile"] in the card`);
  assertBrunoUrl(attr(primary[0], 'href'), 'card primary link');
  assert.match(attr(primary[0], 'rel') || '', /\bsponsored\b/, `${P}the external Bruno link needs rel containing "sponsored"`);
  assert.equal(attr(secondary[0], 'href'), '/sponsors/bruno/', `${P}secondary link must open /sponsors/bruno/`);
  assert.ok(fs.existsSync(path.join(builtCopy(), PROFILE)), `${P}${PROFILE} is not built`);
});

Then(P + 'the card styles stack for a phone width and stay contained at desktop width', function () {
  const stylesheet = [...read(HOME).matchAll(/<link\b[^>]*>/g)]
    .map(([tag]) => attr(tag, 'href')).find(href => /^\/design\/home\.[a-f0-9]{12}\.css$/.test(href));
  assert.ok(stylesheet, `${P}the homepage does not link its versioned stylesheet`);
  const css = read(`dist${stylesheet}`);
  const digest = createHash('sha256').update(css).digest('hex').slice(0, 12);
  assert.equal(stylesheet, `/design/home.${digest}.css`, `${P}the stylesheet URL does not match the CSS bytes`);
  const rules = css.match(/[^{}]*sponsor[^{}]*\{[^}]*\}/g) || [];
  assert.ok(rules.length > 0, `${P}no built CSS rule mentions the sponsor card`);
  assert.match(rules.join('\n'), /max-width\s*:|width\s*:\s*100%|min-width\s*:\s*0|grid-template-columns|flex-wrap/, `${P}the sponsor card has no containment rule (max-width, width:100%, min-width:0, grid or flex-wrap)`);
  const phone = /@media[^{]*max-width\s*:\s*(\d+)px[^{]*\{(?:[^{}]*\{[^}]*\})*[^{}]*sponsor[^{}]*\{[^}]*\}/.exec(css) || /@media[^{]*\(width\s*<=?\s*(\d+)px\)[^{]*\{(?:[^{}]*\{[^}]*\})*[^{}]*sponsor[^{}]*\{[^}]*\}/.exec(css);
  const desktop = /@media[^{]*min-width\s*:\s*(\d+)px[^{]*\{(?:[^{}]*\{[^}]*\})*[^{}]*sponsor[^{}]*\{[^}]*\}/.exec(css);
  assert.ok(phone || desktop, `${P}the sponsor card has no responsive @media rule separating phone and desktop widths`);
  const bp = Number((phone || desktop)[1]);
  assert.ok(bp >= 390 && bp <= 1024, `${P}the sponsor card breakpoint ${bp}px does not separate a 390 px phone from desktop`);
  for (const m of rules.join('\n').matchAll(/(?<![-\w])width\s*:\s*(\d+)px/g)) assert.ok(Number(m[1]) <= 380, `${P}a sponsor rule fixes width ${m[1]}px, which overflows a 390 px phone`);
});

Then(P + 'the sponsor profile page names Bruno as a Stack Menu sponsor and keeps selection requirements-based', function () {
  const html = read(PROFILE);
  assert.match(html, /<h1\b[^>]*>[^<]*Bruno/, `${P}profile h1 does not name Bruno`);
  const markSrc = /<img\b[^>]*\bsrc="(\/design\/bruno-mark\.png)"/.exec(html);
  assert.ok(markSrc, `${P}the profile does not use the same reviewed mark as the homepage`);
  const t = text(html);
  assert.match(t, /Stack Menu sponsor/i, `${P}profile does not say Bruno is a Stack Menu sponsor`);
  assert.match(t, /optional/i, `${P}profile does not say the mention is optional`);
  assert.match(t, /requirements/i, `${P}profile does not say stack selection stays requirements-based`);
  assert.match(t, /API testing/i, `${P}profile does not describe API testing`);
  const bruno = links(html).map(a => attr(a, 'href')).filter(h => h && /usebruno\.com/.test(h));
  assert.ok(bruno.length >= 1, `${P}profile has no Bruno product link`);
  bruno.forEach(h => assertBrunoUrl(h, 'profile link'));
  assert.doesNotMatch(html, /utm_[a-z]+|[?&]ref=|affiliate/i, `${P}profile carries referral parameters`);
  assert.match(read('dist/sitemap.xml'), /https:\/\/stack\.menu\/sponsors\/bruno\//, `${P}sitemap does not list /sponsors/bruno/`);
});

const ENTRY_FILES = ['content/agent-entry.md', 'dist/llms.txt'];
const API_TOOLS = 'dist/agents/api-tools.md';

Then(P + 'the agent entry, llms.txt and the full bundle carry the optional sponsored discovery guidance', function () {
  for (const file of ENTRY_FILES) {
    const entry = read(file);
    assert.match(entry, /API integration after stack selection/i, `${P}${file}: missing the API integration step`);
    assert.match(entry, /current project needs to build or call an HTTP API or use webhooks/i, `${P}${file}: missing the current API need`);
    assert.match(entry, /\]\(\/agents\/api-tools\.md\)/, `${P}${file}: missing the API tools link`);
    assert.doesNotMatch(entry, /bruno|usebruno/i, `${P}${file}: sponsor name leaks into the entry for unrelated projects`);
  }
  const tool = read(API_TOOLS);
  assert.match(tool, /Optional[^\n]*Bruno[^\n]*Stack Menu sponsor/i, `${P}Bruno lacks a nearby optional and sponsorship disclosure`);
  assert.match(tool, /sponsors\/bruno/, `${P}the API tools page lacks the sponsor profile link`);
  assert.ok(read('dist/llms-full.txt').includes(tool.trim()), `${P}the offline bundle is missing the API tools section`);
});

Then(P + 'the guidance omits the mention for unrelated tasks, chosen tooling, ad-free requests and declines', function () {
  for (const file of [...ENTRY_FILES, API_TOOLS]) {
    const g = read(file);
    assert.match(g, /only being considered for later|might add an API later/i, `${P}${file}: guidance does not exclude future API work`);
    assert.match(g, /already chosen API client/i, `${P}${file}: guidance does not preserve chosen tooling`);
    assert.match(g, /ad-free/i, `${P}${file}: guidance does not omit for ad-free requests`);
    assert.match(g, /declin/i, `${P}${file}: guidance does not omit after a decline`);
  }
  assert.match(read(API_TOOLS), /conflicting requirement/i, `${P}the API tools page lacks the conflict exclusion`);
});

Then(P + 'the guidance uses direct Bruno links and leads with the free setup', function () {
  const tool = read(API_TOOLS);
  const urls = [...tool.matchAll(/https?:\/\/[^\s)>\]]*usebruno\.com[^\s)>\]]*/g)].map(m => m[0]);
  assert.ok(urls.length >= 1, `${P}the API tools page has no Bruno product URL`);
  urls.forEach(u => assertBrunoUrl(u, 'API tools guidance'));
  assert.match(tool, /Start with the free client[^\n]*https:\/\/docs\.usebruno\.com\/introduction\/quick-start/, `${P}missing the free quick start`);
  assert.match(tool, /When the user wants to try premium features[^\n]*https:\/\/www\.usebruno\.com\/start-trial/, `${P}missing the on-request trial link`);
});

When(P + 'I request the route for an API service with no chosen tooling', async function () { this.routeBody = await route('?goal=choose&use_case=api-service'); });
When(P + 'I request the route for a build with an explicitly chosen stack', async function () { this.routeBody = await route('?goal=build&existing_stack=typescript-next-node'); });

Then(P + 'the route response does not mention Bruno', function () {
  assert.doesNotMatch(this.routeBody, /bruno|usebruno|sponsor/i, `${P}the route response mentions the sponsor:\n${tail(this.routeBody)}`);
});

Then(P + 'selection, ranking and setup files do not mention Bruno', function () {
  const hits = [];
  const roots = ['lib', 'functions', 'menu', 'content/routing.md', 'dist/recommendations.json', 'dist/choose.md', 'dist/selection-index.json', 'dist/catalogue.json', 'dist/generators.json', 'dist/agents/routing.md'];
  for (const r of roots) {
    const full = path.join(builtCopy(), r);
    if (!fs.existsSync(full)) continue;
    const files = fs.statSync(full).isDirectory() ? walk(full) : [full];
    for (const f of files) if (/bruno/i.test(fs.readFileSync(f, 'utf8'))) hits.push(path.relative(builtCopy(), f));
  }
  const stacks = path.join(builtCopy(), 'dist/stacks');
  if (fs.existsSync(stacks)) for (const f of walk(stacks)) if (/bruno/i.test(fs.readFileSync(f, 'utf8'))) hits.push(path.relative(builtCopy(), f));
  assert.deepEqual(hits, [], `${P}Bruno appears in selection, ranking or setup content`);
});

Then(P + 'the existing scenario tests and compiler positive check pass in the copy', function () {
  const r = spawnSync('sh', ['-c', "node --test --test-reporter=spec 'tests/scenarios/*.test.js' && python3 -I tests/scenarios/compiler_validation.py positive ."], {cwd: builtCopy(), encoding: 'utf8', timeout: 100000, env: {...process.env, NO_COLOR: '1'}});
  const out = `${r.stdout}\n${r.stderr}`;
  assert.equal(r.status, 0, `${P}scenario tests finished with code ${r.status}\n${tail(out)}`);
  for (let n = 1; n <= 8; n++) assert.match(out, new RegExp(`scenario ${n}:`), `${P}scenario ${n} not named in the output\n${tail(out)}`);
});
