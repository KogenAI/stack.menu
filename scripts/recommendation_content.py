"""Load and render Stack Menu's task-based editorial recommendation policy."""
from pathlib import Path
import json


ECOSYSTEMS = {'any', 'python', 'php', 'ruby', 'elixir', 'react', 'rust'}
MOBILE_PLATFORMS = {'shared', 'ios', 'android'}
CONDITION_VALUES = {'ecosystem': ECOSYSTEMS - {'any'}, 'mobile_platform': MOBILE_PLATFORMS}
COMPONENTS = {'web', 'api', 'cli', 'automation', 'ios', 'android'}


def _sources(value, context):
    if not isinstance(value, list) or not value:
        raise ValueError(f'{context} needs a non-empty sources list')
    for source in value:
        if (not isinstance(source, dict) or not isinstance(source.get('title'), str)
                or not source['title'].strip() or not isinstance(source.get('url'), str)
                or not source['url'].startswith(('https://', 'http://'))):
            raise ValueError(f'{context} sources need title and HTTP(S) url')


def _alternative_ids(item, alternatives, task_id):
    ids = item.get('alternative_ids')
    if ids is not None and (not isinstance(ids, list) or any(not isinstance(key, str) for key in ids)
                            or len(set(ids)) != len(ids)
                            or any(key not in alternatives or task_id not in alternatives[key]['use_cases'] for key in ids)):
        raise ValueError(f'{task_id} needs distinct alternative IDs belonging to that task')


def _alternatives(policy, task):
    ids = task.get('alternative_ids')
    return [item for item in policy['alternatives'] if task['id'] in item['use_cases']
            and (ids is None or item['id'] in ids) and item.get('profile_id') != task['primary']]


def _alternative_markdown(items):
    lines = []
    for item in items:
        profile = f" `{item['profile_id']}`" if item['profile_id'] else ''
        lines.append(f"- {item['label']}{profile}: {item['choose_when']} Tradeoff: {item['caveat']}")
        lines.append('  Sources: ' + '; '.join(f"[{source['title']}]({source['url']})" for source in item['sources']))
    return lines


def load_policy(root: Path) -> dict:
    """Read the maintained policy and validate task, alias and profile references."""
    policy = json.loads((root / 'menu/recommendations.json').read_text())
    if (policy.get('version') != 1 or not isinstance(policy.get('use_cases'), list)
            or not isinstance(policy.get('alternatives'), list)):
        raise ValueError('recommendations.json must use policy version 1 with use_cases and alternatives arrays')
    profiles = json.loads((root / 'menu/profiles.json').read_text())
    use_cases = {item.get('id'): item for item in policy['use_cases'] if isinstance(item, dict)}
    if len(use_cases) != len(policy['use_cases']) or None in use_cases:
        raise ValueError('recommendation use-case IDs must be present and unique')
    alternatives = {item.get('id'): item for item in policy['alternatives'] if isinstance(item, dict)}
    if len(alternatives) != len(policy['alternatives']) or None in alternatives:
        raise ValueError('recommendation alternative IDs must be present and unique')

    for item in policy['use_cases']:
        cid = item['id']
        if not isinstance(item.get('label'), str) or not item['label'].strip():
            raise ValueError(f'Recommendation use case {cid} needs a label')
        if item.get('component') is not None and item['component'] not in COMPONENTS:
            raise ValueError(f'Unsupported component for recommendation use case {cid}')
        roles = item.get('required_roles')
        if not isinstance(roles, list) or not roles or any(role not in COMPONENTS for role in roles):
            raise ValueError(f'Recommendation use case {cid} needs valid required_roles')
        if item.get('primary') not in profiles:
            raise ValueError(f'Recommendation use case {cid} needs a known primary profile ID')
        if not isinstance(item.get('why'), str) or not item['why'].strip() or not isinstance(item.get('tradeoff'), str) or not item['tradeoff'].strip():
            raise ValueError(f'Recommendation use case {cid} needs why and tradeoff')
        _sources(item.get('sources'), f'Recommendation use case {cid}')
        _alternative_ids(item, alternatives, cid)
        constraints = item.get('constraints', {})
        if not isinstance(constraints, dict) or set(constraints) - set(CONDITION_VALUES):
            raise ValueError(f'Recommendation use case {cid} has unsupported constraints')
        for dimension, values in constraints.items():
            if not isinstance(values, list) or not values or any(value not in (ECOSYSTEMS if dimension == 'ecosystem' else MOBILE_PLATFORMS) for value in values):
                raise ValueError(f'Recommendation use case {cid} has invalid {dimension} constraints')
        overrides = item.get('overrides', [])
        if not isinstance(overrides, list):
            raise ValueError(f'Recommendation use case {cid} overrides must be an array')
        seen_conditions = set()
        for override in overrides:
            when = override.get('when') if isinstance(override, dict) else None
            if not isinstance(when, dict) or not when or set(when) - set(CONDITION_VALUES):
                raise ValueError(f'Recommendation use case {cid} override needs a supported when condition')
            if any(value not in CONDITION_VALUES[key] for key, value in when.items()):
                raise ValueError(f'Recommendation use case {cid} override has invalid condition value')
            key = tuple(sorted(when.items()))
            if key in seen_conditions:
                raise ValueError(f'Recommendation use case {cid} repeats an override condition')
            seen_conditions.add(key)
            if any(value not in constraints.get(dimension, []) for dimension, value in when.items()):
                raise ValueError(f'Recommendation use case {cid} override condition is not declared in constraints')
            if override.get('primary') not in profiles:
                raise ValueError(f'Recommendation use case {cid} override needs a known primary profile ID')
            if not isinstance(override.get('why'), str) or not override['why'].strip() or not isinstance(override.get('tradeoff'), str) or not override['tradeoff'].strip():
                raise ValueError(f'Recommendation use case {cid} override needs why and tradeoff')
            _sources(override.get('sources'), f'Recommendation use case {cid} override')
            _alternative_ids(override, alternatives, cid)

    aliases = policy.get('aliases', {})
    if not isinstance(aliases, dict):
        raise ValueError('Recommendation aliases must be an object')
    for alias, mapping in aliases.items():
        if not isinstance(mapping, dict) or mapping.get('use_case') not in use_cases:
            raise ValueError(f'Recommendation alias {alias} must point to a known use case')
        conditions = {key: value for key, value in mapping.items() if key != 'use_case'}
        if set(conditions) - set(CONDITION_VALUES):
            raise ValueError(f'Recommendation alias {alias} has unsupported condition dimensions')
        if any(value not in CONDITION_VALUES[key] for key, value in conditions.items()):
            raise ValueError(f'Recommendation alias {alias} has invalid condition values')
        declared = use_cases[mapping['use_case']].get('constraints', {})
        if any(value not in declared.get(key, []) for key, value in conditions.items()):
            raise ValueError(f'Recommendation alias {alias} condition is not declared by its task')

    for item in policy['alternatives']:
        if not isinstance(item.get('profile_id'), (str, type(None))) or not isinstance(item.get('use_cases'), list) or not item['use_cases']:
            raise ValueError(f"Recommendation alternative {item['id']} needs profile_id and use-case references")
        missing = set(item['use_cases']) - use_cases.keys()
        if missing:
            raise ValueError(f"Recommendation alternative {item['id']} references unknown use cases: {sorted(missing)}")
        if item['profile_id'] is not None and item['profile_id'] not in profiles:
            raise ValueError(f"Recommendation alternative {item['id']} references unknown profile {item['profile_id']}")
        if not item.get('choose_when') or not item.get('caveat'):
            raise ValueError(f"Recommendation alternative {item['id']} needs choose_when and caveat")
        _sources(item.get('sources'), f"Recommendation alternative {item['id']}")
    return policy


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
