"""Compiler validation for the recommendation policy (Python 3.9+, standard library only).

Usage: compiler_validation.py (positive|negative) <repository-root>

positive: load_policy accepts the real menu/recommendations.json and markdown renders.
negative: load_policy rejects invalid policies; each runs on a temporary copy, never menu/.
"""
import copy
import json
import sys
import tempfile
from pathlib import Path


def _compiler(root):
    sys.path.insert(0, str(root / 'scripts'))
    import recommendation_content
    return recommendation_content


def _copy_with(root, policy):
    tmp = tempfile.TemporaryDirectory()
    menu = Path(tmp.name) / 'menu'
    menu.mkdir()
    (menu / 'profiles.json').write_text((root / 'menu/profiles.json').read_text())
    (menu / 'recommendations.json').write_text(json.dumps(policy))
    return tmp


def _unknown_primary(policy):
    policy['use_cases'][0]['primary'] = 'no-such-profile'


def _alternative_outside_task(policy):
    task = policy['use_cases'][0]
    other = next(t for t in policy['use_cases'] if t['id'] != task['id'])
    alternative = next(a for a in policy['alternatives'] if other['id'] in a['use_cases'] and task['id'] not in a['use_cases'])
    task['alternative_ids'] = [alternative['id']]


def _undeclared_override_condition(policy):
    # The cli task overrides on ecosystem=rust; declare only python so the override is undeclared.
    task = next(t for t in policy['use_cases'] if t['id'] == 'cli')
    assert [o['when'] for o in task['overrides']] == [{'ecosystem': 'rust'}]
    task['constraints'] = {'ecosystem': ['python']}


def _alternative_without_sources(policy):
    policy['alternatives'][0]['sources'] = []


NEGATIVE = [
    ('unknown primary', _unknown_primary),
    ('alternative outside its task', _alternative_outside_task),
    ('override condition not declared in constraints', _undeclared_override_condition),
    ('alternative without sources', _alternative_without_sources),
]


def positive(root):
    module = _compiler(root)
    policy = module.load_policy(root)
    assert module.markdown(policy).strip(), 'markdown rendering is empty'
    print('ok  real policy loads and renders')


def negative(root):
    module = _compiler(root)
    base = json.loads((root / 'menu/recommendations.json').read_text())
    failures = []
    control = _copy_with(root, base)  # the unmodified policy must load, so only the mutation can be rejected
    try:
        module.load_policy(Path(control.name))
    finally:
        control.cleanup()
    for name, mutate in NEGATIVE:
        policy = copy.deepcopy(base)
        mutate(policy)
        tmp = _copy_with(root, policy)
        try:
            module.load_policy(Path(tmp.name))
        except ValueError as error:
            print(f'ok  rejected {name}: ValueError')
        except Exception as error:  # a different failure is not a validation rejection
            failures.append(f'{name}: raised {type(error).__name__} instead of ValueError')
        else:
            failures.append(f'{name}: accepted')
        finally:
            tmp.cleanup()
    if failures:
        raise SystemExit('compiler accepted invalid policy: ' + '; '.join(failures))


def main(argv):
    if len(argv) != 3 or argv[1] not in ('positive', 'negative'):
        raise SystemExit(__doc__)
    root = Path(argv[2]).resolve()
    {'positive': positive, 'negative': negative}[argv[1]](root)


if __name__ == '__main__':
    main(sys.argv)
