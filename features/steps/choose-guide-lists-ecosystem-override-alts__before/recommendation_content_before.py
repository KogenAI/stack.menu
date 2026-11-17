"""Verbatim copy of the guide renderer functions of scripts/recommendation_content.py before this change."""


def _uncurated(task):
    return task.get('curated') is False


def _alternatives(policy, task):
    ids = task.get('alternative_ids')
    # An uncurated lead is an alternative record, so it is excluded by alternative id as well as by profile id.
    return [item for item in policy['alternatives'] if task['id'] in item['use_cases']
            and (ids is None or item['id'] in ids) and item.get('profile_id') != task['primary']
            and not (_uncurated(task) and item['id'] == task['primary'])]


def _alternative_markdown(items):
    lines = []
    for item in items:
        profile = f" `{item['profile_id']}`" if item['profile_id'] else ''
        lines.append(f"- {item['label']}{profile}: {item['choose_when']} Tradeoff: {item['caveat']}")
        lines.append('  Sources: ' + '; '.join(f"[{source['title']}]({source['url']})" for source in item['sources']))
    return lines


def markdown(policy: dict) -> str:
    """Render task guidance, constraints and conditional profile overrides."""
    aliases_by_task = {}
    for alias, mapping in policy.get('aliases', {}).items():
        aliases_by_task.setdefault(mapping['use_case'], []).append((alias, mapping))
    lines = [
        '## Task-based starting points', '',
        'Before building or rewriting, consider whether an existing service or specialized product already meets the need. If you intend to build or rewrite software, continue with the task below.', '',
        policy['scope'], '', policy['evidence_limits'], '',
        'Choose the matching software task, then apply explicit ecosystem and platform constraints. A constraint selects the corresponding conditional primary; it does not create a separate task.', ''
    ]
    for use_case in policy['use_cases']:
        if _uncurated(use_case):
            lead = next(item for item in policy['alternatives'] if item['id'] == use_case['primary'])
            lines += [f"### {use_case['label']} (`{use_case['id']}`)", '',
                      f"Uncurated starting lead: {lead['label']} (`{use_case['primary']}`). No curated Stack Menu profile covers this task; the lead is a research lead and no other profile is substituted.", '',
                      f"Choose it when: {lead['choose_when']}", '', f"Tradeoff: {lead['caveat']}", '',
                      'Lead sources: ' + '; '.join(f"[{s['title']}]({s['url']})" for s in lead['sources']), '',
                      use_case['why'], '', 'Tradeoff: ' + use_case['tradeoff'], '',
                      'Question: ' + use_case['question'], '']
        else:
            lines += [f"### {use_case['label']} (`{use_case['id']}`)", '',
                      f"Primary profile: `{use_case['primary']}`.", '', use_case['why'], '',
                      'Tradeoff: ' + use_case['tradeoff'], '']
        if use_case['id'] == 'cross-platform-mobile':
            lines += ['If the mobile platform is omitted, this primary is provisional. Ask whether the client is shared or platform-specific; do not exclude suitable single-platform clients until that is known.', '']
        for dimension, values in use_case.get('constraints', {}).items():
            names = {'ecosystem': 'Ecosystem', 'mobile_platform': 'Mobile platform'}
            lines.append(f"{names[dimension]} constraints: {', '.join(f'`{value}`' for value in values)}.")
        if use_case.get('constraints'):
            lines.append('')
        for override in use_case.get('overrides', []):
            condition = ', '.join(f'`{key}={value}`' for key, value in override['when'].items())
            lines += [f"When {condition}, use `{override['primary']}`: {override['why']}",
                      'Tradeoff: ' + override['tradeoff'],
                      'Sources: ' + '; '.join(f"[{s['title']}]({s['url']})" for s in override['sources']), '']
            if 'alternative_ids' in override:
                lines += ['Alternatives for this platform choice:', *_alternative_markdown(_alternatives(policy, {**use_case, **override})), '']
        if aliases_by_task.get(use_case['id']):
            rendered = []
            for alias, mapping in aliases_by_task[use_case['id']]:
                dimensions = ', '.join(f"{key}={value}" for key, value in mapping.items() if key != 'use_case')
                rendered.append(f"`{alias}` means this task" + (f" with {dimensions}" if dimensions else ''))
            lines += ['Aliases: ' + '; '.join(rendered) + '.', '']
        if use_case.get('sources'):
            lines += ['Sources: ' + '; '.join(f"[{s['title']}]({s['url']})" for s in use_case['sources']), '']
        alternatives = _alternatives(policy, use_case)
        if alternatives:
            lines.append('Alternatives for shared or undecided mobile scope:' if use_case['id'] == 'cross-platform-mobile' else 'Other scoped alternatives:')
            lines += _alternative_markdown(alternatives)
            lines.append('')
    return '\n'.join(lines).rstrip() + '\n'
