"""Accessible guide presentation adapted from Oghogho's Stack Menu design.

The maintained records remain the content owner; enhancement only builds a
portable brief from choices made in the browser. Every recommendation, generator
and migration section is served in the initial HTML.
"""
import html
import json

import generator_content
import migration_content


def escape(value):
    return html.escape(str(value), quote=True)


def items(values, ordered=False):
    tag = 'ol' if ordered else 'ul'
    return '<' + tag + '>' + ''.join('<li>' + escape(value) + '</li>' for value in values) + '</' + tag + '>'


def section(anchor, title, content):
    return '<section class="guide-section" id="' + anchor + '"><h2>' + escape(title) + '</h2>' + content + '</section>'


def prepare(root, out, pages, records, write, shell):
    """Replace all canonical guide page props after minimal_site.prepare."""
    contracts = json.loads((out / 'rewrite/contracts.json').read_text())['contracts']
    profiles = json.loads((root / 'menu/profiles.json').read_text())
    navigation = [
        ('agent-guide', 'Agent guide'), ('when-to-use', 'When to use'),
        ('generators', 'Generate the baseline'), ('set-up-project', 'Set up project'),
        ('tools', 'Tools and agent brief'), ('architecture', 'Architecture'),
        ('transitions', 'Migration options'), ('run-checks', 'Run checks'),
        ('working-practices', 'Working practices'), ('questions', 'Open questions'),
        ('sources', 'Sources'),
    ]
    for record in records.values():
        sid = record['id']
        title = escape(record['title'])
        md_url, json_url = escape(record['markdown_url']), escape(record['json_url'])
        guide_url = 'https://stack.menu' + record['markdown_url']
        brief = '\n'.join([
            '# ' + record['title'] + ' — agent brief', '',
            'Read https://stack.menu/llms.txt and ' + guide_url + '.', '',
            'Use this stack for my application. First resolve my requirements, existing code and open questions.',
            'Use the official generator or documented starting point before custom scaffolding. Follow the guide’s generator workflow and preserve the generated foundation.',
            'Check current official documentation and record compatible runtime, framework and tool versions.',
            'Explain the selected tools and their limits, then propose the setup and verification plan.',
            'These recipes are documentation-reviewed; distinguish proposed checks from checks actually run.',
        ])
        actions = ('<a class="btn-primary" href="' + md_url + '" download="' + escape(sid) + '-guide.md">↓ Download guide</a>'
                   '<a class="btn-secondary" href="/choose/">Help me choose a stack</a>'
                   '<a class="file-link" href="' + md_url + '">Full guide .md ↗</a>'
                   '<a class="file-link" href="' + json_url + '">Structured data .json ↗</a>')
        band = ('<div class="guide-band"><div class="guide-wrap"><nav aria-label="Breadcrumb"><ol class="crumbs">'
                '<li><a href="/library/">Stack library</a></li><li aria-hidden="true">›</li><li>' + escape(profiles[sid]['group']) + '</li>'
                '<li aria-hidden="true">›</li><li aria-current="page">' + title + '</li></ol></nav>'
                '<div class="guide-intro"><h1 class="display">' + title + '</h1><p class="guide-lede">' + escape(record['summary']) + '</p>'
                '<p class="guide-shape">' + escape(record['shape']) + '</p><p class="guide-note">These recipes and dependency combinations need checking in your actual project before you rely on them.</p></div>'
                '<div class="guide-actions">' + actions + '</div></div></div>')
        agent = section('agent-guide', 'Give this guide to your agent',
            '<div class="agent-card"><p>Paste the guide address into your agent chat, together with what you want to build.</p>'
            '<div class="link-field"><a href="' + md_url + '"><code>' + escape(guide_url) + '</code></a></div>'
            '<p><a href="/agents/">How to use Stack Menu with your agent →</a></p></div>')
        fit = section('when-to-use', 'When to use ' + record['title'],
            '<div class="fit-grid"><div class="g-card fit-card"><h3>Choose it when</h3>' + items(record['choose_when']) + '</div>'
            '<div class="g-card fit-card"><h3>Consider another path when</h3>' + items(record['avoid_when']) + '</div></div>'
            '<p class="guide-caption">Use cases: ' + escape('; '.join(record['use_cases'])) + '.</p>')
        generators = generator_content.profile_html(record['generators'], record['generators']['policy'])
        setup = section('set-up-project', 'Set up your project', '<div class="g-card guide-steps">' + items(record['setup_steps'], True) + '</div>')
        tool_cards = []
        for index, tool in enumerate(record['tools']):
            tool_cards.append('<article class="tool-card"><div class="tool-card-head"><h3 class="tool-job">' + escape(tool['job']) + '</h3>'
                '<label class="tool-picker guide-enhanced"><input type="checkbox" name="brief-tool" value="' + str(index) + '">'
                '<span class="tool-pill"><span aria-hidden="true" class="tool-plus">+</span><span aria-hidden="true" class="tool-check">✓</span>'
                '<span class="tool-name">' + escape(tool['default']) + '</span><span class="guide-sr-only"> — include in agent brief</span></span></label>'
                '<p class="tool-static">' + escape(tool['default']) + '</p></div><p class="tool-why">' + escape(tool['reason']) + '</p>'
                '<p class="tool-limits"><strong>Limits:</strong> ' + escape(tool['limits']) + '</p>'
                '<div class="tool-sources">' + ''.join('<a href="' + escape(url) + '">' + escape(url.split('/')[2]) + ' ↗</a>' for url in tool.get('source_urls', [])) + '</div></article>')
        tools = section('tools', 'Recommended tools and agent brief',
            '<p class="guide-caption">Choose the tools your application needs. The brief includes your selections, their purpose and their limits; the complete guide keeps all recommendations and sources.</p>'
            '<div class="tools-layout"><div><div class="tools-clear-row guide-enhanced"><button type="button" class="g-textbtn" data-clear-tools>Clear selections</button></div>'
            '<div class="tool-groups">' + ''.join(tool_cards) + '</div></div><aside class="brief-col" aria-label="Agent brief"><div class="brief-card">'
            '<div class="brief-head"><h3>Your agent brief</h3><button type="button" class="g-textbtn guide-enhanced" data-copy-brief>Copy brief</button></div>'
            '<div class="brief-body" tabindex="0" role="region" aria-label="Agent brief text"><pre id="guide-brief">' + escape(brief) + '</pre></div>'
            '<button type="button" class="btn-primary guide-enhanced" data-download-brief>↓ Download brief .md</button>'
            '<p class="guide-caption" id="brief-count">Select tools to tailor this brief.</p><p class="guide-caption" data-brief-status role="status"></p>'
            '<noscript><p>Copy the brief text above or <a href="' + md_url + '" download>download the complete guide</a>.</p></noscript></div></aside></div>')
        architecture = migration_content.profile_html(record['architecture_and_migration'], contracts)
        checks = section('run-checks', 'Run checks', '<p class="guide-caption">Run these in the configured application. They are instructions, not recorded passes.</p><div class="cmd"><pre><code>' + escape('\n'.join(record['verification_commands'])) + '</code></pre></div>')
        practices = section('working-practices', 'Working practices', '<div class="g-card guide-rows">' + items(record['best_practices']) + '</div>')
        questions = section('questions', 'Questions to resolve', '<div class="g-card guide-rows">' + items(record['open_questions']) + '</div>')
        correction_note = ''.join('<p class="guide-caption">Current correction reviewed ' + escape(c['reviewed_on']) + ': ' + escape(c['limits']) + ' Evidence: ' + escape(c['evidence_status']) + '.</p>' for c in record.get('current_corrections', []))
        sources = section('sources', 'Sources', correction_note + '<p class="guide-caption">Original source review: ' + escape(record['reviewed']) + '. Core guidance rechecked: ' + escape(record['research_freshness'].get('core_guidance_checked_on', record['reviewed'])) + '. <a href="/research-freshness.json">Check scope</a>.</p>'
            '<div class="sources">' + ''.join('<a class="source" href="' + escape(source['url']) + '"><span>' + escape(source.get('title', source['url'])) + '</span><span aria-hidden="true">↗</span></a>' for source in record['sources']) + '</div>')
        extended = ''
        if record.get('extended_reference'):
            extended = section('extended-reference', 'Extended Elixir reference', '<p>The full Markdown and JSON include the attributed Elixir Menu optional libraries, runtime and other application paths. <a href="https://elixir.menu/">Read the maintained Elixir Menu reference →</a></p>')
        nav = '<nav class="guide-nav" aria-label="On this page"><p>On this page</p>' + ''.join('<a href="#' + anchor + '">' + label + '</a>' for anchor, label in navigation) + '</nav>'
        body = '<link rel="stylesheet" href="/design/guide.css"><main id="main" class="stack-guide" data-profile="' + escape(sid) + '">' + band + '<div class="guide-wrap guide-layout">' + nav + '<div class="guide-body">' + agent + fit + generators + setup + tools + architecture + checks + practices + questions + sources + extended + '</div></div></main><script src="/design/guide.js" defer></script>'
        props = shell(record['title'], body, page='guide')
        props['description'] = record['summary']
        write('stacks/' + sid + '/index.html', props)
