"""Apply sourced current corrections without rewriting imported snapshots."""
import json
from datetime import date


def apply(root, records):
    packet = json.loads((root / 'menu/updates.json').read_text())
    seen = set()
    for update in packet['updates']:
        sid, job = update['profile_id'], update['tool_job']
        if (sid, job) in seen:
            raise ValueError('Duplicate current correction: ' + sid + '/' + job)
        seen.add((sid, job))
        date.fromisoformat(update['reviewed_on'])
        record = records[sid]
        matches = [tool for tool in record['tools'] if tool['job'] == job]
        if len(matches) != 1 or matches[0]['limits'] != update['previous_limits']:
            raise ValueError('Review correction against changed input: ' + sid + '/' + job)
        if not update['limits'] or not update['sources'] or any(not s['url'].startswith('https://') for s in update['sources']):
            raise ValueError('Correction needs text and primary sources: ' + sid)
        matches[0]['limits'] = update['limits']
        matches[0]['source_urls'] = list(dict.fromkeys(matches[0]['source_urls'] + [s['url'] for s in update['sources']]))
        record.setdefault('current_corrections', []).append({k: v for k, v in update.items() if k != 'previous_limits'})
    return packet
