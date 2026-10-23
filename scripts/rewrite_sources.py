"""Validate and render source-only application migration references."""
from pathlib import Path
import html
import json
import re
from datetime import date


E = lambda value: html.escape(str(value), quote=True)
REQUIRED = (
    'id', 'title', 'language', 'group', 'summary', 'kind', 'roles', 'ui', 'host',
    'responsibilities', 'lifecycle', 'version_check', 'inventory', 'options',
    'target_research', 'caution', 'sources'
)
DOMAIN_ROLES = {'publishing', 'plugins', 'orders', 'payments', 'commerce'}
CANONICAL_ROLES = {'browser-ui', 'server-runtime'}


def load_sources(root, records=None):
    """Load source-only records, rejecting overlap with new-project targets."""
    packet = json.loads((Path(root) / 'menu/rewrite-sources.json').read_text())
    if packet.get('version') != 1 or not packet.get('qualification'):
        raise ValueError('Invalid rewrite source catalogue header')
    try:
        date.fromisoformat(packet['reviewed_on'])
    except (KeyError, TypeError, ValueError):
        raise ValueError('Invalid rewrite source review date')
    sources = {}
    target_ids = set(records or {})
    for source in packet.get('sources', []):
        sid = source.get('id')
        if not sid or sid in sources or sid in target_ids:
            raise ValueError('Duplicate or target-overlapping rewrite source: ' + str(sid))
        missing = [key for key in REQUIRED if not source.get(key)]
        if missing:
            raise ValueError(f'Missing rewrite source fields for {sid}: {", ".join(missing)}')
        if source['group'] != 'Rewrite sources':
            raise ValueError('Rewrite source has unexpected catalogue group: ' + sid)
        if not set(source['roles']).intersection(CANONICAL_ROLES):
            raise ValueError('Rewrite source lacks a canonical application role: ' + sid)
        for key in ('kind', 'roles', 'responsibilities', 'version_check', 'inventory', 'options'):
            if not isinstance(source[key], list) or any(not isinstance(x, str) or not x.strip() for x in source[key]):
                raise ValueError(f'Invalid rewrite source list {sid}.{key}')
        if any(role not in CANONICAL_ROLES | DOMAIN_ROLES for role in source['roles']):
            raise ValueError('Unknown rewrite source responsibility role: ' + sid)
        lifecycle = source['lifecycle']
        if not all(lifecycle.get(key) for key in ('status', 'date', 'as_of', 'sources')):
            raise ValueError('Incomplete lifecycle evidence: ' + sid)
        if lifecycle['as_of'] != packet['reviewed_on']:
            raise ValueError('Lifecycle review date differs from catalogue date: ' + sid)
        try:
            date.fromisoformat(lifecycle['as_of'])
        except (TypeError, ValueError):
            raise ValueError('Invalid lifecycle review date: ' + sid)
        for source_ref in source['sources']:
            if not all(source_ref.get(key) for key in ('title', 'url', 'claim')) or not source_ref['url'].startswith('https://'):
                raise ValueError('Invalid rewrite source citation: ' + sid)
        if not lifecycle['sources'] or any(not url.startswith('https://') for url in lifecycle['sources']):
            raise ValueError('Invalid lifecycle source URL: ' + sid)
        source['guide_url'] = f'/rewrite/sources/{sid}/'
        source['markdown_url'] = f'/rewrite/sources/{sid}.md'
        source['json_url'] = f'/rewrite/sources/{sid}.json'
        sources[sid] = source
    if not sources:
        raise ValueError('Rewrite source catalogue is empty')
    return sources


def _references(text, sources, markdown=False):
    def link(match):
        source = sources.get(match.group(1))
        if not source:
            return match.group(0)
        label = source['title'] + ' source guide'
        return f'[{label}]({match.group(0)})' if markdown else '<a href="' + E(match.group(0)) + '">' + E(label) + '</a>'
    return re.sub(r'/rewrite/sources/([a-z0-9-]+)/', link, text if markdown else E(text))


def _list(values, sources):
    return '<ul>' + ''.join('<li>' + _references(value, sources) + '</li>' for value in values) + '</ul>'


def _display_role(value):
    labels = {'browser-ui': 'Browser interface', 'server-runtime': 'Server runtime', 'publishing': 'Publishing', 'plugins': 'Plugins and custom behavior', 'orders': 'Orders', 'payments': 'Payments', 'commerce': 'Commerce operations'}
    key, sep, detail = value.partition(':')
    return labels.get(key.strip(), key.strip()) + (': ' + detail.strip() if sep else '')


def _markdown(source, qualification, sources):
    lifecycle = source['lifecycle']
    lines = [
        '# ' + source['title'], '', source['summary'], '',
        f"Reviewed: {lifecycle['as_of']} | Evidence: documentation-reviewed | Classification: source-only",
        '', qualification, '', '## Application role', '',
        'Language: ' + source['language'], 'Components: ' + ', '.join(source['kind']),
        'Roles: ' + ', '.join(_display_role(role) for role in source['roles']), 'UI: ' + source['ui'], 'Host: ' + source['host'], '',
        '## Responsibilities to inventory', '', *['- ' + _references(_display_role(item), sources, markdown=True) for item in source['responsibilities']], '',
        '## Lifecycle and version check', '', lifecycle['status'], lifecycle['date'],
        '', *['- ' + item for item in source['version_check']], '',
        '## Application inventory before rewrite', '',
        'Inventory the actual application before choosing a target. For every responsibility, record its owner and interface, then mark it kept, replaced or retired. A target match is not compatibility evidence.', '',
        *['- ' + item for item in source['inventory']], '',
        '## Change options', '', *['- ' + item for item in source['options']], '',
        '## Target research', '', source['target_research'], '',
        '## Caution', '', source['caution'], '',
        '## Sources', ''
    ]
    lines += [f"- [{ref['title']}]({ref['url']}): {ref['claim']}" for ref in source['sources']]
    lines += ['', 'Lifecycle references: ' + ', '.join(f'[{url}]({url})' for url in lifecycle['sources']), '']
    return '\n'.join(lines)


def _html(source, qualification, sources):
    life = source['lifecycle']
    refs = ''.join('<li><a href="' + E(s['url']) + '">' + E(s['title']) + '</a>: ' + E(s['claim']) + '</li>' for s in source['sources'])
    body = '<main id="main" class="prose-page"><header class="page-title"><p class="eyebrow">Rewrite source · existing systems</p><h1>' + E(source['title']) + '</h1><p class="lede">' + E(source['summary']) + '</p><p class="evidence-note">Reviewed ' + E(life['as_of']) + ' · documentation-reviewed · Source coverage does not recommend this as a new-project target.</p></header>'
    body += '<section><h2>Application role</h2><p><strong>Language:</strong> ' + E(source['language']) + ' · <strong>Components:</strong> ' + E(', '.join(source['kind'])) + '</p><p><strong>Roles:</strong> ' + E(', '.join(_display_role(role) for role in source['roles'])) + '</p><p><strong>UI:</strong> ' + E(source['ui']) + '</p><p><strong>Host:</strong> ' + E(source['host']) + '</p><h2>Responsibilities to inventory</h2>' + _list([_display_role(item) for item in source['responsibilities']], sources) + '</section>'
    body += '<section><h2>Lifecycle and version check</h2><p>' + E(life['status']) + ' ' + E(life['date']) + '</p>' + _list(source['version_check'], sources) + '<h2>Inventory before rewrite</h2><p>Inventory the actual application before choosing a target. For every responsibility, record its owner and interface, then mark it kept, replaced or retired. A target match is not compatibility evidence.</p>' + _list(source['inventory'], sources) + '</section>'
    body += '<section><h2>Change options</h2>' + _list(source['options'], sources) + '<h2>Target research</h2><p>' + E(source['target_research']) + '</p><h2>Caution</h2><p>' + E(source['caution']) + '</p></section>'
    body += '<section><h2>Sources</h2><ul>' + refs + '</ul><p>' + E(qualification) + '</p><p><a href="' + E(source['markdown_url']) + '">Read Markdown</a> · <a href="' + E(source['json_url']) + '">Read JSON</a></p></section></main>'
    return body


def prepare(root, write, shell):
    """Emit the source index and per-source HTML, Markdown and JSON resources."""
    root = Path(root)
    packet = json.loads((root / 'menu/rewrite-sources.json').read_text())
    sources = load_sources(root)
    index = {
        'version': packet['version'], 'reviewed_on': packet['reviewed_on'],
        'evidence': packet['evidence'], 'qualification': packet['qualification'],
        'sources': []
    }
    for source in sources.values():
        index['sources'].append(source)
        sid = source['id']
        write(f'rewrite/sources/{sid}.json', json.dumps(source, ensure_ascii=False, indent=2) + '\n')
        write(f'rewrite/sources/{sid}.md', _markdown(source, packet['qualification'], sources))
        body = _html(source, packet['qualification'], sources)
        props = shell(source['title'] + ' rewrite source', body, 'rewrite', 'guide')
        props['description'] = 'Evaluate changes to ' + source['title'] + ': check lifecycle, installed versions and application responsibilities before selecting a rewrite target or upgrade path.'
        write(f'rewrite/sources/{sid}/index.html', props)
    write('rewrite/sources.json', json.dumps(index, ensure_ascii=False, indent=2) + '\n')
    return sources
