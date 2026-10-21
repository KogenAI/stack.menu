"""One view of researched architecture and contracts for HTML, Markdown and JSON."""
import html
import json

E = lambda value: html.escape(str(value), quote=True)


def load(research, manifest, records):
    shared = json.loads((research / 'migrations.json').read_text())
    profiles = {}
    for name in manifest['migration_files']:
        if name == 'migrations.json':
            continue
        packet = json.loads((research / name).read_text())
        for profile in packet['profiles']:
            sid = profile['id']
            if sid in profiles or sid not in records:
                raise ValueError('Duplicate or unknown migration profile: ' + sid)
            profile = {**profile, 'reviewed_at': packet['reviewed_at'], 'evidence': packet['evidence']}
            if profile['evidence'] != 'documentation-reviewed':
                raise ValueError('Unexpected qualification claim: ' + sid)
            for field in ['version_scope', 'operating_model', 'architecture', 'developer_workflow', 'avoid', 'transitions', 'sources']:
                if not profile.get(field):
                    raise ValueError(f'Missing {field}: {sid}')
            transition_ids = set()
            for transition in profile['transitions']:
                cap = transition['capability']
                if transition.get('id') in transition_ids or cap not in {c['id'] for c in shared['contracts']}:
                    raise ValueError(f'Duplicate transition or unknown capability {cap}: {sid}')
                transition_ids.add(transition.get('id'))
                for field in ['existing_contract', 'coexistence', 'target', 'benefits', 'checks', 'rollback', 'sources']:
                    if not transition.get(field):
                        raise ValueError(f'Missing transition {field}: {sid}/{cap}')
                for benefit in transition['benefits']:
                    if not all(benefit.get(k) for k in ['benefit', 'prerequisites', 'tradeoffs']):
                        raise ValueError(f'Benefit lacks conditions: {sid}/{cap}')
                if not all(s.startswith('https://') for s in transition['sources']):
                    raise ValueError(f'Invalid documentation URL: {sid}/{cap}')
            profiles[sid] = profile
    if set(profiles) != set(records):
        raise ValueError('Migration research must cover every current profile')
    return shared, profiles


def items(values):
    return '<ul>' + ''.join('<li>' + E(v) + '</li>' for v in values) + '</ul>'


def docs(sources):
    return '<div class="doc-links">' + ''.join('<a href="' + E(s) + '">' + E(s.split('/')[2]) + ' →</a>' for s in sources) + '</div>'


def profile_html(profile, contracts):
    labels = {c['id']: c['title'] for c in contracts}
    output = '<section id="architecture"><p class="eyebrow">Build with the stack’s strengths</p><h2>Architecture and developer workflow.</h2>'
    output += '<p>' + E(profile['operating_model']) + '</p><p class="evidence-note">Version scope: ' + E(profile['version_scope']) + ' · Reviewed ' + E(profile['reviewed_at']) + '</p>'
    for title, key in [('Architecture boundaries', 'architecture'), ('Tools and feedback', 'developer_workflow'), ('Translations to avoid', 'avoid')]:
        output += '<h3>' + title + '</h3>' + items(profile[key])
    output += docs([s['url'] for s in profile['sources']]) + '</section>'
    output += '<section id="transitions"><p class="eyebrow">For an existing application</p><h2>Keep the contracts while you change the stack.</h2><p>These are documented options and proposed checks. Inspect the actual source application before adopting a transition.</p>'
    for move in profile['transitions']:
        output += '<details class="migration-detail"><summary>' + E(labels[move['capability']]) + (': ' + E(move['option_title']) if move.get('option_title') else '') + '</summary><div>'
        for title, key in [('Inspect the source', 'existing_contract'), ('During coexistence', 'coexistence'), ('Target design', 'target'), ('Rollback', 'rollback')]:
            output += '<h3>' + title + '</h3><p>' + E(move[key]) + '</p>'
        output += '<h3>Benefits and prerequisites</h3>'
        for benefit in move['benefits']:
            output += '<p><strong>' + E(benefit['benefit']) + '</strong><br>Requires: ' + E(benefit['prerequisites']) + '<br>Tradeoffs: ' + E(benefit['tradeoffs']) + '</p>'
        output += '<h3>Checks before transfer</h3>' + items(move['checks']) + docs(move['sources']) + '</div></details>'
    output += '<p><a class="button dark" href="/rewrite/guide.md">Read the migration workflow →</a></p></section>'
    return output


def profile_markdown(profile, contracts):
    labels = {c['id']: c['title'] for c in contracts}
    lines = ['## Architecture and developer workflow', '', profile['operating_model'], '', 'Version scope: ' + profile['version_scope'], 'Reviewed: ' + profile['reviewed_at'] + ' | Evidence: ' + profile['evidence'], '']
    for title, key in [('Architecture boundaries', 'architecture'), ('Tools and feedback', 'developer_workflow'), ('Translations to avoid', 'avoid')]:
        lines += ['### ' + title, '', *['- ' + value for value in profile[key]], '']
    lines += ['### Architecture sources', '', *['- [' + s['title'] + '](' + s['url'] + '): ' + s['claim'] for s in profile['sources']], '', '## Transition options', '', 'Proposed designs and checks; these are not executed compatibility results.', '']
    for move in profile['transitions']:
        lines += ['### ' + labels[move['capability']] + (': ' + move['option_title'] if move.get('option_title') else ''), '']
        for title, key in [('Inspect the source', 'existing_contract'), ('During coexistence', 'coexistence'), ('Target design', 'target'), ('Rollback', 'rollback')]:
            lines += ['**' + title + ':** ' + move[key], '']
        lines += ['**Benefits and prerequisites**', '']
        for benefit in move['benefits']:
            lines += ['- ' + benefit['benefit'] + ' Requires: ' + benefit['prerequisites'] + ' Tradeoffs: ' + benefit['tradeoffs']]
        lines += ['', '**Checks before transfer**', '', *['- ' + c for c in move['checks']], '', *['- ' + s for s in move['sources']], '']
    lines += ['Rewrite workflow: /rewrite/guide.md', 'Shared contracts and phases: /rewrite/contracts.json', '']
    return '\n'.join(lines)


def workflow_markdown(shared, records):
    lines = ['# Rewrite an existing application', '', shared['qualification'], '', 'Reviewed: ' + shared['reviewed_at'], '', '## Required application inventory', '', 'Source and target runtime/library versions; dependency purpose and contracts; replaced boundary; coexistence requirement; each data/job/scheduler owner; routing cohort; backward compatibility and rollback window; actual qualification results.', '', 'The website composes researched guidance. Free-text inventory remains unresolved until the actual application is inspected. A shared capability name does not prove tools or protocols are interchangeable. Compare documented application roles before planning replacement: language overlap is insufficient. If the selected target does not cover the source roles, establish the replaced component boundary and how a retained interface or separate composition preserves them, or record an explicitly intended change to the product surface. An explicit component documented by the source can narrow that scope. Resolve target component, web UI, static-hosting and browser offline constraints without silently changing the selected target.', '', '## Choose the kind of change', '']
    for mode in shared['modes']:
        lines += ['### ' + mode['title'], '', mode['description'], '']
    lines += ['## Steps and acceptance gates', '']
    for phase in shared['phases']:
        lines += ['### ' + phase['title'], '', *['- ' + a for a in phase['actions']], '', 'Gate: ' + phase['gate'], '', 'Rollback: ' + phase['rollback'], '']
    lines += ['## Capability contracts', '']
    for contract in shared['contracts']:
        lines += ['### ' + contract['title'], '', 'Inventory: ' + contract['inventory'], '', 'Gate: ' + contract['gate'], '', 'Rollback: ' + contract['rollback'], '']
    lines += ['## Research by stack', '']
    for record in records.values():
        lines += ['- [' + record['title'] + '](' + record['markdown_url'] + ') | /rewrite/profiles/' + record['id'] + '.json']
    lines += ['', '## Specific boundaries', '']
    for note in shared['pair_notes']:
        lines += ['### ' + note['title'], '', note['body'], '', *['- ' + s for s in note['sources']], '']
    lines += ['## Evidence to record', '', 'For each application check: purpose, selected tools/versions, prerequisites, environment, scenario/command, expected result, actual result and receipt. Documentation review, site build, application integration, verified coexistence and measured performance are distinct states. Unknown coverage must be researched, not marked satisfied.', '', '## Sources', '', *['- [' + s['title'] + '](' + s['url'] + '): ' + s['claim'] for s in shared['sources']], '']
    return '\n'.join(lines)


def render_page(shared, records):
    options = ''.join('<option value="' + E(d['id']) + '">' + E(d['title']) + '</option>' for d in records.values())
    body = '<main id="main" class="wrap rewrite-page"><header class="page-title"><p class="eyebrow">Rewrite an existing application</p><h1>Change the stack.<br>Keep the required behavior.</h1><p class="lede">Start with what runs today. Plan how the systems coexist, when ownership transfers, and which benefits need a later change.</p></header>'
    body += '<div class="chooser-layout"><form id="rewrite-form"><fieldset><legend>Choose the source and target</legend><label class="field">Current stack<select id="rewrite-source"><option value="">Select the current stack</option>' + options + '</select></label><label class="field">Target stack<select id="rewrite-target"><option value="">Select the target stack</option>' + options + '</select></label><p><a href="/choose/">Need help choosing a target? →</a></p></fieldset><fieldset><legend>What kind of change?</legend>'
    for mode in shared['modes']:
        body += '<label class="choice"><input type="radio" name="mode" value="' + mode['id'] + '"' + (' checked' if mode['id'] == 'incremental' else '') + '><span><strong>' + E(mode['title']) + '</strong><small>' + E(mode['description']) + '</small></span></label>'
    body += '</fieldset><fieldset><legend>What are you replacing?</legend><div id="rewrite-capabilities">'
    for contract in shared['contracts']:
        body += '<label class="choice"><input type="checkbox" name="capability" value="' + contract['id'] + '" checked><span>' + E(contract['title']) + '</span></label>'
    body += '</div><p class="evidence-note">Select only responsibilities in scope. Missing stack-specific coverage stays visible for further research.</p></fieldset><fieldset><legend>Record the actual application</legend><label class="field">Versions, dependencies and what must remain<textarea id="rewrite-inventory" rows="4" placeholder="For example: Rails 7, Sidekiq/Redis, PostgreSQL; keep old workers for email jobs"></textarea></label><label class="field">Boundary, routing and ownership<textarea id="rewrite-boundary" rows="3" placeholder="Endpoints, tenant or job types; writer, consumer and scheduler owners"></textarea></label><label class="field">Compatibility and rollback window<textarea id="rewrite-rollback" rows="3" placeholder="Supported clients, retained formats, promotion thresholds and rollback period"></textarea></label><p class="evidence-note">These notes stay in this page and are included in your brief. The guide does not inspect the repository or verify free-text constraints.</p></fieldset><button type="reset" class="quiet">Reset plan</button></form>'
    body += '<section class="shortlist" aria-labelledby="rewrite-title"><p class="eyebrow">Your transition</p><h2 id="rewrite-title" aria-live="polite">Choose the source and target stacks.</h2><p id="rewrite-status">Read the source practices and target guidance before selecting dependencies.</p><div id="rewrite-plan"></div><details id="rewrite-handoff"><summary>Prepare a brief and download the plan</summary><p id="brief-status" class="evidence-note" role="status"></p><button id="refresh-brief" class="quiet" type="button" hidden>Replace with updated brief</button><textarea id="rewrite-prompt" rows="12" aria-label="Rewrite brief"></textarea><div class="guide-actions"><button type="button" class="button dark" data-copy="#rewrite-prompt">Copy rewrite brief</button><button type="button" class="button" id="download-rewrite-md" disabled>Download brief .md</button><button type="button" class="button" id="download-rewrite-json" disabled>Download plan .json</button><a id="rewrite-share" class="text-link" href="/rewrite/" hidden>Link to these stack choices →</a></div><p class="evidence-note">The choices link includes stack IDs, mode and capabilities only. Your application notes and manual edits are kept out of the link. The JSON download contains the recorded inventory and researched plan; the Markdown download preserves your edited brief.</p></details></section></div>'
    body += '<section class="rewrite-workflow"><h2>Steps that every transition needs.</h2><ol>'
    for phase in shared['phases']:
        body += '<li><h3>' + E(phase['title']) + '</h3>' + items(phase['actions']) + '<p><strong>Before advancing:</strong> ' + E(phase['gate']) + '</p><p><strong>Rollback:</strong> ' + E(phase['rollback']) + '</p></li>'
    body += '</ol><p><a href="/rewrite/guide.md">Complete rewrite guide .md →</a> · <a href="/rewrite/contracts.json">Contracts and phases .json →</a></p><p class="evidence-note">' + E(shared['qualification']) + ' Reviewed ' + E(shared['reviewed_at']) + '.</p></section><noscript><p>The interactive plan requires JavaScript. Read the <a href="/rewrite/guide.md">complete rewrite workflow</a> and the <a href="/#stacks">source and target guides</a> without it.</p></noscript></main>'
    return body


def resources(shared, profiles, records, write, shell):
    write('rewrite/contracts.json', json.dumps(shared, ensure_ascii=False, indent=2) + '\n')
    write('rewrite/guide.md', workflow_markdown(shared, records))
    index = {'schema': 'stack-menu-rewrite/1', 'reviewed_at': shared['reviewed_at'], 'evidence': shared['evidence'], 'qualification': shared['qualification'], 'shared': shared, 'profiles': []}
    for sid, record in records.items():
        profile = profiles[sid]
        full = {**profile, 'title': record['title'], 'kind': record['kind'], 'guide_url': record['guide_url'], 'markdown_url': record['markdown_url'], 'json_url': record['json_url']}
        index['profiles'].append(full)
        write('rewrite/profiles/' + sid + '.json', json.dumps(full, ensure_ascii=False, indent=2) + '\n')
    write('rewrite/records.json', json.dumps(index, ensure_ascii=False, separators=(',', ':')) + '\n')
    write('rewrite/index.html', shell('Rewrite an application', render_page(shared, records), 'rewrite', 'rewrite'))
