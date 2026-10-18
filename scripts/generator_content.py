"""Compile first-party generator research into the existing guide representations."""
import html
import json


def load(root, profile_ids):
    policy = json.loads((root / 'content/generation-policy.json').read_text())
    directory = root / 'menu/generators'
    paths = {p.stem: p for p in directory.glob('*.json')}
    if set(paths) != set(profile_ids):
        raise ValueError(f'Generator coverage mismatch: missing={set(profile_ids)-set(paths)}, extra={set(paths)-set(profile_ids)}')
    profiles = {}
    for sid in profile_ids:
        data = json.loads(paths[sid].read_text())
        if data['profile_id'] != sid:
            raise ValueError(f'Generator profile ID mismatch: {sid}')
        for field in ['reviewed_on', 'evidence_status', 'starting_points', 'preserve', 'verification', 'integration_steps', 'sources']:
            if not data[field]:
                raise ValueError(f'Missing generator guidance: {sid}.{field}')
        for item in data['starting_points'] + data['follow_up_generators']:
            if not item['name'] or not item['when']:
                raise ValueError(f'Generator needs a name and condition: {sid}')
            for command in item['commands']:
                if not all(command[key] for key in ['run', 'cwd', 'purpose']):
                    raise ValueError(f'Incomplete generator command: {sid}')
        profiles[sid] = data
    return policy, profiles


def markdown(data, policy):
    lines = ['## Generators: create the baseline first', '',
             f"Generator documentation reviewed: {data['reviewed_on']}. Evidence: {data['evidence_status']}.", '',
             '### Required workflow', '', *['- ' + x for x in policy['instructions']]]
    for key, title in [('starting_points', 'Choose a starting point'), ('follow_up_generators', 'Conditional follow-up generators')]:
        lines += ['', '### ' + title]
        for item in data[key]:
            lines += ['', '#### ' + item['name'], '', 'Use when: ' + item['when'], '']
            lines += [f'{i}. {step}' for i, step in enumerate(item.get('steps', []), 1)]
            for command in item['commands']:
                lines += ['', 'Working directory: ' + command['cwd'], '', command['purpose'], '', '```sh', command['run'], '```']
            lines += ['', *['- ' + x for x in item['notes']]]
    for key, title in [('preserve', 'Preserve the generated foundation'), ('verification', 'Baseline and generation checks')]:
        lines += ['', '### ' + title, '', *['- ' + x for x in data[key]]]
    lines += ['', '### Generation receipt', '', *['- ' + x for x in policy['receipt']], '', '### Generator sources', '']
    lines += [f"- [{s['title']}]({s['url']})" for s in data['sources']]
    return '\n'.join(lines) + '\n'


def profile_html(data, policy):
    escape = lambda value: html.escape(str(value), quote=True)
    items = lambda values: '<ul>' + ''.join('<li>' + escape(x) + '</li>' for x in values) + '</ul>'
    body = '<section id="generators"><h2>Generators: create the baseline first</h2>'
    body += '<p>Generator documentation reviewed: ' + escape(data['reviewed_on']) + '. Evidence: ' + escape(data['evidence_status']) + '.</p>'
    body += '<h3>Required workflow</h3>' + items(policy['instructions'])
    for key, title in [('starting_points', 'Choose a starting point'), ('follow_up_generators', 'Conditional follow-up generators')]:
        body += '<h3>' + title + '</h3>'
        for item in data[key]:
            body += '<h4>' + escape(item['name']) + '</h4><p>Use when: ' + escape(item['when']) + '</p>'
            if item.get('steps'):
                body += '<ol>' + ''.join('<li>' + escape(x) + '</li>' for x in item['steps']) + '</ol>'
            for command in item['commands']:
                body += '<p>Working directory: ' + escape(command['cwd']) + '</p><p>' + escape(command['purpose']) + '</p><pre><code>' + escape(command['run']) + '</code></pre>'
            body += items(item['notes'])
    for key, title in [('preserve', 'Preserve the generated foundation'), ('verification', 'Baseline and generation checks')]:
        body += '<h3>' + title + '</h3>' + items(data[key])
    body += '<h3>Generation receipt</h3>' + items(policy['receipt'])
    body += '<h3>Generator sources</h3><ul>' + ''.join('<li><a href="' + escape(s['url']) + '">' + escape(s['title']) + '</a></li>' for s in data['sources']) + '</ul></section>'
    return body
