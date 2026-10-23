"""Adapt Oghogho's interaction layouts to the maintained production records.

Editable HTML lives in src/design; browser behavior/styles live in public/design.
The normal content compiler calls prepare after minimal_site.prepare, so every
reference representation keeps its original maintained owner.
"""
import html
import json


def escape(value):
    return html.escape(str(value), quote=True)


def prepare(root, out, pages, records, write, shell):
    def links():
        return '<ul class="stack-server-links">' + ''.join(
            '<li><a href="' + escape(profile['guide_url']) + '">' +
            escape(profile['title']) + '</a> — ' + escape(profile['summary']) + '</li>'
            for profile in records.values()) + '</ul>'

    # Keep the initial library controls and fallback complete before scripts run.
    # The browser replaces the cards with the designer's animated folder UI.
    groups = list(dict.fromkeys(profile['group'] for profile in records.values()))
    group_filters = '<button type="button" class="chip" data-group="all" aria-pressed="true">All stacks</button>' + ''.join(
        '<button type="button" class="chip" data-group="' + escape(group) + '" aria-pressed="false">' + escape(group) + '</button>'
        for group in groups)
    cards = ''
    for group in groups:
        members = [p for p in records.values() if p['group'] == group]
        cards += '<section><h2 class="text-[20px] font-semibold leading-7 text-ink">' + escape(group) + '</h2>'
        cards += '<div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">'
        for profile in members:
            cards += ('<article class="stack-fallback"><h3>' + escape(profile['title']) +
                      '</h3><p>' + escape(profile['language']) + '</p><p>' +
                      escape(profile['summary']) + '</p><a href="' +
                      escape(profile['guide_url']) + '">Open complete guide</a></article>')
        cards += '</div></section>'

    keys = ['id', 'title', 'language', 'group', 'summary', 'shape', 'kind',
            'ui', 'host', 'tradeoff', 'choose_when', 'avoid_when',
            'best_practices', 'open_questions', 'guide_url', 'markdown_url', 'json_url']
    canonical = {key: {field: value[field] for field in keys} for key, value in records.items()}
    write('design/interactive-data.js', 'window.StackInteractiveProfiles=' +
          json.dumps(canonical, ensure_ascii=False).replace('</', '<\\/') + ';\n')
    write('design/migration-fit.js', (root / 'lib/migration-fit.js').read_text())
    configs = [
        ('library', 'library/index.html', 'Stack library', 'library',
         f'Browse all {len(records)} curated stack guides, search languages and tools, and choose stacks to compare.'),
        ('compare', 'compare/index.html', 'Compare stacks', 'library',
         'Compare the roles, tradeoffs, working practices and open questions of two or three curated stacks.'),
        ('recommend', 'choose/index.html', 'Get a stack recommendation', 'recommend',
         'Filter curated stack guides by application type, then compare the tradeoffs with your agent.'),
        ('rewrite', 'rewrite/index.html', 'Rewrite your stack', 'rewrite',
         'Evaluate a migration between curated stacks with a current agent brief, contracts and rollback checks.'),
    ]
    for source, path, title, current, description in configs:
        body = (root / 'src/design' / (source + '.html')).read_text()
        body = (body.replace('{{SERVER_CARDS}}', cards).replace('{{SERVER_LINKS}}', links())
                .replace('{{GROUP_FILTERS}}', group_filters)
                .replace('{{PROFILE_COUNT}}', str(len(records))))
        props = shell(title, body, page=current)
        props['description'] = description
        props['scripts'] = ['/design/interactive-data.js', '/design/interactive.js']
        props['styles'] = ['/design/stack-guide.css', '/design/interactive.css']
        if source == 'rewrite':
            props['styles'].append('/design/rewrite-scope.css')
        write(path, props)
