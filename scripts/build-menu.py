#!/usr/bin/env python3
"""Generate the human guide and agent records from the same research + editorial view."""
from pathlib import Path
import json, html, re, shutil, hashlib
from datetime import date
import migration_content
import generator_content
R=Path(__file__).resolve().parent.parent
RESEARCH=R/'menu/inputs/research'
ELIXIR=R/'menu/inputs/elixir'
CURATED=R/'menu/curated'
OUT=R/'.generated/resources'
shutil.rmtree(R/'.generated',ignore_errors=True)
OUT.mkdir(parents=True)
PAGES={}
E=lambda x:html.escape(str(x),quote=True)
manifest=json.loads((RESEARCH/'catalogue.json').read_text())
meta=json.loads((R/'menu/profiles.json').read_text())
freshness=json.loads((RESEARCH/manifest['freshness_file']).read_text()) if manifest.get('freshness_file') else {}
records={}
research_ids=set()
for fn in manifest['record_files']:
 for d in json.loads((RESEARCH/fn).read_text()):
  if d['id'] in research_ids:raise ValueError(f'Duplicate imported research profile: {d["id"]}')
  research_ids.add(d['id'])
  if d['id'] not in meta:raise ValueError(f'Imported research profile lacks metadata: {d["id"]}')
  d={**d,**meta[d['id']], 'research_file':fn, 'research_source_file':f'inputs/research/{fn}', 'reviewed':manifest['research_date'], 'evidence_status':manifest['status']}
  d['best_practices']=d.pop('practices')
  d['research_freshness']={**freshness.get('profiles',{}).get(d['id'],{}),'scope':freshness.get('scope','Original documentation review only.')}
  for tool in d['tools']:
   if isinstance(tool.get('alternatives'),str):tool['alternatives']=[tool['alternatives']]
   elif isinstance(tool.get('alternatives'),dict):tool['alternatives']=[tool['alternatives']]
  d['guide_url']=f"/stacks/{d['id']}/"
  d['markdown_url']=f"/stacks/{d['id']}/guide.md"
  d['json_url']=f"/stacks/{d['id']}/record.json"
  records[d['id']]=d
curated_paths={p.stem:p for p in CURATED.glob('*.json')}
for sid,path in curated_paths.items():
 if sid in research_ids:raise ValueError(f'First-party profile duplicates imported research: {sid}')
 data=json.loads(path.read_text())
 if data.get('id')!=sid:raise ValueError(f'Curated profile ID mismatch: {sid}')
 required=['name','use_cases','choose_when','avoid_when','tools','setup_steps','verification_commands','open_questions','sources','reviewed_on','evidence_status']
 if set(data)!=set(['id',*required]):raise ValueError(f'Unexpected curated profile fields: {sid}')
 for field in required:
  if not data.get(field):raise ValueError(f'Missing curated profile field: {sid}.{field}')
 if sid not in meta:raise ValueError(f'Curated profile lacks profile metadata: {sid}')
 profile_required=['title','language','group','kind','ui','host','summary','shape','tradeoff','practices']
 if any(not meta[sid].get(field) for field in profile_required):raise ValueError(f'Incomplete profile metadata: {sid}')
 for key in ['use_cases','choose_when','avoid_when','setup_steps','verification_commands','open_questions']:
  if not isinstance(data[key],list) or any(not isinstance(x,str) or not x.strip() for x in data[key]):raise ValueError(f'Invalid curated profile list: {sid}.{key}')
 for tool in data['tools']:
  if set(tool)!=set(['job','default','alternatives','reason','limits','source_urls']):raise ValueError(f'Unexpected curated tool fields: {sid}')
  if not all(tool.get(k) for k in ['job','default','reason','limits','source_urls']):raise ValueError(f'Incomplete curated tool: {sid}')
  if not isinstance(tool['source_urls'],list) or not tool['source_urls'] or any(not x.startswith('https://') for x in tool['source_urls']):raise ValueError(f'Invalid curated tool sources: {sid}.{tool["job"]}')
 for source in data['sources']:
  if set(source)!=set(['url','title','claim']):raise ValueError(f'Unexpected curated source fields: {sid}')
  if not all(source.get(k) for k in ['url','title','claim']) or not source['url'].startswith('https://'):raise ValueError(f'Invalid curated source: {sid}')
 try:date.fromisoformat(data['reviewed_on'])
 except (TypeError,ValueError):raise ValueError(f'Invalid curated review date: {sid}')
 d={**data,**meta[sid], 'research_file':f'curated/{path.name}', 'reviewed':data['reviewed_on'], 'best_practices':meta[sid]['practices']}
 d['research_freshness']={'core_guidance_checked_on':data['reviewed_on'],'sources':[s['url'] for s in data['sources']],'scope':data['evidence_status']}
 d['guide_url']=f"/stacks/{sid}/";d['markdown_url']=f"/stacks/{sid}/guide.md";d['json_url']=f"/stacks/{sid}/record.json"
 records[sid]=d
expected=set(meta)
if set(records)!=expected:raise ValueError(f'Profile coverage mismatch: missing={expected-set(records)}, extra={set(records)-expected}')
records={i:records[i] for i in meta}
generator_policy,generators=generator_content.load(R,records)
for sid,d in records.items():
 d['generators']={**generators[sid], 'policy':generator_policy}
 d['setup_steps']=['Complete the selected starting point and baseline checks in the Generators section first; then continue with the integration steps appropriate to the chosen component.']+generators[sid]['integration_steps']
migration_shared,migration_profiles=migration_content.load(RESEARCH,manifest,records)
for sid,d in records.items():
 d['architecture_and_migration']=migration_profiles[sid]
 d['rewrite_url']='/rewrite/guide.md'
 d['migration_contracts_url']='/rewrite/contracts.json'
# Existing elixir.menu remains the editorial owner. Import a derived, dated view;
# never maintain its optional/runtime recommendations in this repository.
elixir=records['elixir-phoenix-liveview']
elixir['extended_reference']={f:json.loads((ELIXIR/(f+'.json')).read_text()) for f in ['stack','optional','runtime','app-types']}
elixir['extended_reference_owner']='https://elixir.menu/'
def normalize_reference(v):
 if isinstance(v,dict):return {k:normalize_reference(x) for k,x in v.items()}
 if isinstance(v,list):return [normalize_reference(x) for x in v]
 if isinstance(v,str) and v.startswith('/'):
  return 'https://elixir.menu/#stack' if v=='/variants/reference.html' else 'https://elixir.menu'+v
 return v
elixir['extended_reference']=normalize_reference(elixir['extended_reference'])
# Documentation instructions are distinct from installing every recommended tool.
COMMON=[
'Read README, dependency manifests, lockfiles, runtime pins and the maintained project workflow before changing anything. Preserve an existing stack unless reconsidering it is part of the request.',
'For a new component, read the Generators section before writing application files. Use its appropriate official initializer and retain its generated baseline; follow-up generators are conditional on the selected feature.',
'Use this guide to select tools by requirement. Resolve compatible versions from official and installed-version documentation; record the actual lockfile and runtime versions.',
'Create a plan for schema changes, identity, authorization, external effects and deployment. A library choice does not complete its integration.',
'Run relevant checks after configuration. Exercise the real interface, failure paths and packaged artifact on the intended target. Report commands, versions, results and untested behavior.',
'On failure, retain the command and diagnostic, fix the failing prerequisite and resume there. Do not regenerate over existing work or suppress failures to make a check green.'
]
REQUIREMENTS=[
('existing_stack','Existing project','Repository, chosen stack and conventions; whether a new stack is actually requested.'),
('deliverables','Target surfaces','Browser, API, command line, automation, iOS, Android; a product may combine several.'),
('native_ui','Native platform UI','Native controls and platform integration versus browser UI.'),
('offline','Offline behavior','Read-only cache, offline edits, synchronization and conflict policy.'),
('integrations','Required integrations','Vendor SDKs, data/AI libraries, payments and platform APIs.'),
('runtime','Runtime constraints','Latency, throughput, concurrency, memory, persistent connections and background work.'),
('deployment','Deployment','Allowed host/runtime, data residency, OS, native toolchains and operational constraints.'),
('data_security','Data and access','Tenancy, authorization, durability, retention, backups and recovery.'),
('maintenance','Maintenance','Team experience, delivery constraints, licensing, support and budget.')]
AGENT_INTRO=''
CHOOSE='''# Choosing a stack from requirements

First distinguish product components: a native client, browser frontend and backend may require different stacks. Do not force one language across all components. Honor an existing stack unless the user asks to revisit it.

## Gather requirements

'''+ '\n'.join(f'- **{title}:** {desc}' for _,title,desc in REQUIREMENTS)+'''

## Compare feasible options

1. Separate hard constraints from preferences. Reject a candidate that cannot serve its proposed component; do not reject a backend merely because a separate client must work offline.
2. Use selection-index.json for candidate discovery, then read the full guide.md or record.json for each finalist. The `kind`, `ui` and `host` fields describe these recommended profiles, not every theoretical capability of a language.
3. For native iOS use the SwiftUI profile; native Android uses Compose. For both platforms, evaluate two clients with a shared API. A browser wrapper is not evidence of native UI equivalence.
4. Compare connected server-led web apps (Phoenix, Rails, Laravel, Django), full-stack React (Next.js), or an API-backed browser client (React/Vite) according to the product. Services and clients can be combined.
5. Confirm required SDKs, platform APIs, runtime/deployment support and version compatibility in primary documentation before choosing. Unknown is not supported. If coverage is absent (desktop, .NET, games, embedded, scientific computing), say so and research beyond this catalogue.
6. Explain two or three feasible alternatives, the requirement favoring your recommendation, a drawback and any unresolved question. There are no measured cross-stack productivity scores here.
7. Resolve a consequential uncertainty with a small representative prototype before treating the choice as settled.

## Chooser rules for these curated profiles

The compact index publishes the curated `selection_rules` used by the context router and the visiting agent. Filter `kind` by the requested component. For web profiles, an explicit UI preference matches `ui` exactly; static-only frontend hosting requires `host == static`; offline browser editing keeps `ui` in `client, full`. These are starting points needing storage and sync qualification, not a claim that offline editing works out of the box. Server profiles can still supply the backend for an offline client. For native iOS + Android, make a separate context request for each client and evaluate the backend separately. If filters leave no profiles, explain the conflict instead of silently relaxing a hard constraint. Unknown categories are coverage gaps.

## Return a usable handoff

State the recommended component/stack composition, requirements satisfied, rejected alternatives and reasons, selected tools and why each is needed, version/documentation sources, verification plan, and unresolved questions. After selection, follow the chosen stack's setup and best-practice guidance. Separate documented capability from checks actually executed.
'''

def write(path,s):
 if isinstance(s,dict):
  PAGES[str(path)]=s;return
 p=OUT/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(s)
def ul(xs):return '<ul>'+''.join('<li>'+E(x)+'</li>' for x in xs)+'</ul>'
def links(urls):
 return '<div class="doc-links">'+''.join(f'<a href="{E(u)}">{E(label)} →</a>' for label,u in urls)+'</div>'
def docname(u):
 host=u.split('/')[2].removeprefix('www.'); tail=u.rstrip('/').split('/')[-1].replace('.html','').replace('-',' ')
 return host if tail in ['readme','overview','docs','guide',''] else tail[:55]
def shell(title,body,active=None,page='utility'):
 return {'title':title,'body':body,'active':active,'page':page}

def reference_tool_md(t,level=4):
 lines=['#'*level+' '+t.get('job',t.get('name',''))+': '+t.get('tool',t.get('start','')),'']
 for key,label in [('stage','Stage'),('summary','Overview'),('when','Use when'),('why','Why'),('use','Usage'),('next','Setup'),('boundary','Limits')]:
  if t.get(key):lines += [label+': '+t[key],'']
 lines += [f'- [{name}]({url})' for name,url in t.get('sources',[])]
 return '\n'.join(lines)

def reference_markdown(ref):
 lines=[]
 for key,title in [('stack','Foundation'),('optional','Optional libraries'),('runtime','OTP and performance')]:
  data=ref[key];lines+=['### '+title,'','Source reviewed: '+data.get('reviewed',''),'']
  for field in ['scope','principle','status','instruction','intro']:
   if data.get(field):lines += [str(data[field]),'']
  for group in data['groups']:
   lines+=['#### '+group['title'],'']
   for t in group['items']:lines += [reference_tool_md(t,5),'']
  for t in data.get('specialist_tracks',[]):lines += [reference_tool_md(t),'']
  for note in data.get('notes',[]):lines+=['- '+str(note)]
 paths=ref['app-types'];lines+=['### Other Elixir starting points','','Source reviewed: '+paths['reviewed'],'']
 for path in paths['types']:
  lines+=['#### '+path['name'],'',path['short'],'','Foundation: '+path['start'],'']
  if path.get('command'):lines+=['Starting command: `'+path['command']+'`','']
  lines += [path['explanation'],'','Limits: '+path['boundary'],'',*[f'- [{name}]({url})' for name,url in path['sources']],'']
 for key,label in [('decisions','Decisions'),('agent_steps','Agent steps'),('shared_checks','Shared checks')]:
  lines+=['#### '+label,'']
  for item in paths.get(key,[]):
   lines+=['- '+(json.dumps(item,ensure_ascii=False) if isinstance(item,dict) else str(item))]
 guidance=paths['agent_guidance'];lines+=['#### '+guidance['title'],'',guidance['body'],'',f"[{guidance['label']}]({guidance['url']})"]
 return '\n'.join(lines)

def markdown(d):
 source_file=d.get('research_source_file') or d['research_file']
 if source_file.startswith('curated/'):
  source_file='menu/'+source_file
 else:
  source_file='menu/'+source_file if source_file.startswith('inputs/') else 'menu/inputs/research/'+source_file
 lines=[f"# {d['title']}",'',d['summary'],'',f"Language: {d['language']} | Reviewed: {d['reviewed']} | Evidence: {d.get('evidence_status','documentation-reviewed')}",'',f"Source record: {source_file}.",'', 'Core guidance checked: '+d['research_freshness'].get('core_guidance_checked_on',d['reviewed'])+'. Review sources are listed below. /research-freshness.json describes the imported research packet; this record retains its own evidence scope. These recipes and selected dependency combinations need qualification in the actual project.']
 lines += ['','## Application role', 'Components: '+', '.join(d['kind']), 'UI: '+d['ui'], 'Deployment: '+d['host'], '', '## Use cases', *['- '+x for x in d['use_cases']], '', '## Fit',*['- '+x for x in d['choose_when']],'','## Choose something else when',*['- '+x for x in d['avoid_when']],'','## Agent workflow',*['- '+x for x in COMMON],'','## Best practices',*['- '+x for x in d['best_practices']],'',generator_content.markdown(d['generators'],generator_policy),'## Tools']
 for t in d['tools']:
  lines+=['',f"### {t['job']}: {t['default']}",'',t['reason'],'','Limits and integration: '+t['limits'],'','',*['- '+u for u in t.get('source_urls',[])]]
  if t.get('alternatives'):lines+=['','Alternatives: '+'; '.join(str(x) for x in t['alternatives'])]
  if t.get('setup'):lines+=['','Setup: '+t['setup']]
 lines+=['',migration_content.profile_markdown(d['architecture_and_migration'],migration_shared['contracts']),'','## Setup',* [f'{i+1}. {x}' for i,x in enumerate(d['setup_steps'])],'','## Verification','Commands below require the selected tools and project configuration. Replace example paths, schemes and IDs; distinguish tests from builds and interactive startup. These are instructions, not recorded passes.','','```text','\n'.join(d['verification_commands']),'```','','## Open questions',*['- '+x for x in d['open_questions']],'','## Sources']
 for s in d['sources']:lines += [f"- [{s.get('title',s['url'])}]({s['url']})"]
 if d.get('extended_reference'):lines+=['','## Extended Elixir reference','Imported from https://elixir.menu/; each dataset retains its own review date. Original editorial owner: elixir.menu.','',reference_markdown(d['extended_reference'])]
 lines+=['','Keep the project README current and link the selected guidance; preserve existing project instructions.']
 return '\n'.join(lines)+'\n'

for d in records.values():
 sid=d['id'];base=Path('stacks')/sid
 d['agent_workflow']=COMMON
 d['selection']={'native_ui':d['ui']=='native','static_hosting':d['host']=='static','offline_client_candidate':d['ui'] in ['client','full','native']}
 d['coverage_note']='Tools are curated starting points for this application role. Exact versions, integrations and offline behavior require project-specific qualification.'
 write(base/'record.json',json.dumps(d,ensure_ascii=False,indent=2)+'\n')
 write(base/'guide.md',markdown(d))

write('generators.json',json.dumps({'schema_version':'1.0','policy':generator_policy,'profiles':generators},ensure_ascii=False,indent=2)+'\n')
write('choose.md',CHOOSE)
write('llms-full.txt',CHOOSE+'\n\n'+migration_content.workflow_markdown(migration_shared,records)+'\n\n'+'\n\n---\n\n'.join(markdown(d) for d in records.values()))
RULES={'component':{'field':'kind','match':'includes'},'ui_preference':{'field':'ui','match':'equals'},'static_hosting':{'field':'host','values':['static']},'offline_browser':{'field':'ui','values':['client','full']},'native_both':['ios','android'],'unknown_is_supported':False}
index={'schema_version':'1.1','reviewed':'2026-10-10','selection_guide':'/choose.md','generators_url':'/generators.json','selection_rules':RULES,'coverage_gaps':manifest['coverage_gaps'],'profiles':[{k:d[k] for k in ['id','title','language','group','summary','shape','kind','ui','host','selection','use_cases','choose_when','avoid_when','tradeoff','reviewed','evidence_status','research_file','guide_url','markdown_url','json_url']+(['research_source_file'] if d.get('research_source_file') else [])} for d in records.values()]}
write('selection-index.json',json.dumps(index,ensure_ascii=False,separators=(',',':'))+'\n')
cat={'schema_version':'1.1','selection_rules':RULES,'reviewed':'2026-10-10','evidence_status':'documentation-reviewed','selection_guide':'/choose.md','agent_entry':'/llms.txt','generators_url':'/generators.json','requirements':[{ 'key':k,'label':t,'description':v} for k,t,v in REQUIREMENTS], 'coverage_gaps':manifest['coverage_gaps'],'field_semantics':{'kind':'Recommended application component; not exhaustive language capability.','host':'Deployment class for this profile; runtime adapters need separate qualification.','ui':'Recommended UI architecture. none means this profile provides no client UI.','generators':'Official initializer/template choices and conditional follow-up generation; documentation-reviewed, not executed.','best_practices':'Editorial summary of the linked research guide; verify installed-version documentation.'},'profiles':list(records.values())}
cat['research_freshness']=freshness
write('research-freshness.json',json.dumps(freshness,ensure_ascii=False,indent=2)+'\n')
cat['migration_reviewed_at']=migration_shared['reviewed_at']
cat['rewrite_guide']='/rewrite/guide.md'
cat['migration_contracts']='/rewrite/contracts.json'
cat['migration_evidence_status']='documentation-reviewed; application compatibility untested'
write('catalogue.json',json.dumps(cat,ensure_ascii=False,indent=2)+'\n')
migration_content.resources(migration_shared,migration_profiles,records,write,shell)

from minimal_site import prepare
prepare(R, OUT, PAGES, records, AGENT_INTRO, CHOOSE, write, shell)
from design_site import prepare as redesign
redesign(R, OUT, PAGES, records, write, shell)
shutil.copytree(R/'public',OUT,dirs_exist_ok=True)
(R/'.generated/pages.json').write_text(json.dumps(PAGES,ensure_ascii=False))
print(f'Prepared {len(records)} profiles and complete agent resources.')
