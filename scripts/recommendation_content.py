"""Load and render Stack Menu's task-based editorial recommendation policy."""
from pathlib import Path
import json


def load_policy(root: Path) -> dict:
    """Read the maintained recommendation owner and validate its cross-references."""
    policy = json.loads((root / 'menu/recommendations.json').read_text())
    if policy.get('version') != 1 or not isinstance(policy.get('use_cases'), list) or not isinstance(policy.get('alternatives'), list):
        raise ValueError('recommendations.json must use policy version 1 with use_cases and alternatives arrays')
    use_cases = {item['id']: item for item in policy['use_cases']}
    if len(use_cases) != len(policy['use_cases']):
        raise ValueError('recommendation use-case IDs must be unique')
    alternatives = {item['id']: item for item in policy['alternatives']}
    if len(alternatives) != len(policy['alternatives']):
        raise ValueError('recommendation alternative IDs must be unique')
    allowed_components = {'web', 'api', 'cli', 'automation', 'ios', 'android'}
    for item in policy['use_cases']:
        if item.get('component') is not None and item['component'] not in allowed_components:
            raise ValueError(f"Unsupported component for recommendation use case {item['id']}")
        roles = item.get('required_roles')
        if not isinstance(roles, list) or not roles or any(role not in allowed_components for role in roles):
            raise ValueError(f"Recommendation use case {item['id']} needs valid required_roles")
        if not isinstance(item.get('primary'), str) or not item['primary']:
            raise ValueError(f"Recommendation use case {item['id']} needs a primary profile ID")
        if not item.get('why') or not item.get('tradeoff') or not item.get('sources'):
            raise ValueError(f"Recommendation use case {item['id']} needs why, tradeoff and sources")
    for item in policy['alternatives']:
        if not isinstance(item.get('profile_id'), (str, type(None))) or not item.get('use_cases'):
            raise ValueError(f"Recommendation alternative {item['id']} needs profile_id and use-case references")
        missing = set(item['use_cases']) - use_cases.keys()
        if missing:
            raise ValueError(f"Recommendation alternative {item['id']} references unknown use cases: {sorted(missing)}")
        if not item.get('choose_when') or not item.get('caveat') or not item.get('sources'):
            raise ValueError(f"Recommendation alternative {item['id']} needs choose_when, caveat and sources")
    return policy


def markdown(policy: dict) -> str:
    """Render the policy's editorial guidance for inclusion in generated agent Markdown."""
    lines = [
        '## Task-based starting points',
        '',
        policy['scope'],
        '',
        policy['evidence_limits'],
        '',
        'Choose the matching product job first; apply hard constraints before treating a primary profile as feasible.',
        ''
    ]
    for use_case in policy['use_cases']:
        lines += [
            f"### {use_case['label']} (`{use_case['id']}`)",
            '',
            f"Primary profile: `{use_case['primary']}`.",
            '',
            use_case['why'],
            '',
            'Tradeoff: ' + use_case['tradeoff'],
            ''
        ]
        if use_case.get('sources'):
            lines += ['Sources: ' + '; '.join(f"[{source['title']}]({source['url']})" for source in use_case['sources']), '']
        alternatives = [item for item in policy['alternatives'] if use_case['id'] in item['use_cases']]
        if alternatives:
            lines.append('Conditional alternatives:')
            for item in alternatives:
                profile = f" `{item['profile_id']}`" if item['profile_id'] else ''
                lines += [f"- {item['label']}{profile}: {item['choose_when']} Tradeoff: {item['caveat']}"]
                if item.get('sources'):
                    lines.append('  Sources: ' + '; '.join(f"[{source['title']}]({source['url']})" for source in item['sources']))
            lines.append('')
    return '\n'.join(lines).rstrip() + '\n'
