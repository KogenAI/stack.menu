#!/usr/bin/env python3
"""Explicitly refresh the dated, attributed build inputs; never edit their owners."""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
from datetime import date

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--research', type=Path, required=True, help='Canonical research packet directory')
parser.add_argument('--elixir', type=Path, required=True, help='Elixir Menu production directory')
parser.add_argument('--snapshot-date', type=date.fromisoformat, required=True, help='Explicit review date, YYYY-MM-DD')
args = parser.parse_args()
manifest = json.loads((args.research/'catalogue.json').read_text())
copies = [(args.research/name, ROOT/'menu/inputs/research'/name)
          for name in ['catalogue.json', *manifest['record_files'], *manifest.get('migration_files', []), *([manifest['freshness_file']] if manifest.get('freshness_file') else [])]]
copies += [(args.elixir/'content'/f'{name}.json', ROOT/'menu/inputs/elixir'/f'{name}.json')
           for name in ['stack', 'optional', 'runtime', 'app-types']]
copies += [(args.elixir/name, ROOT/'public/menu-assets'/f'elixir-{name}.txt')
           for name in ['LICENSE', 'NOTICE']]
# Check all required inputs before replacing any snapshot.
for source, _ in copies:
    if not source.is_file():
        raise SystemExit(f'Missing source input: {source}')
    if source.suffix == '.json':
        json.loads(source.read_text())
for source, destination in copies:
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)
provenance = {
    'snapshot_date': args.snapshot_date.isoformat(),
    'research_owner': 'Kogen Stack Menu research packet, 2026-10-10',
    'elixir_owner': 'https://elixir.menu/',
    'elixir_license': 'Apache-2.0; original LICENSE and NOTICE included',
    'policy': 'Dated build snapshots. Refresh at editorial owners; do not edit these copies independently.',
    'files': {str(destination.relative_to(ROOT)): hashlib.sha256(destination.read_bytes()).hexdigest()
              for _, destination in copies},
}
(ROOT/'menu/inputs/provenance.json').write_text(json.dumps(provenance, indent=2)+'\n')
print(f'Refreshed {len(copies)} attributed inputs. Build snapshots contain no private Markdown research notes.')
