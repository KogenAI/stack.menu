import {assessMigration} from './migration-fit.js';
import index from './selection-index.json' with {type:'json'};
import recommendationPolicy from '../menu/recommendations.json' with {type:'json'};
import sourcePacket from '../menu/rewrite-sources.json' with {type:'json'};
import {resolveRecommendation} from './recommendation-policy.js';
const sources=sourcePacket.sources.map(source=>({...source,source_only:true,guide_url:`/rewrite/sources/${source.id}/`,markdown_url:`/rewrite/sources/${source.id}.md`,json_url:`/rewrite/sources/${source.id}.json`}));
const useCases=Object.fromEntries(recommendationPolicy.use_cases.map(useCase=>[useCase.id,useCase]));
export const fields={goal:['auto','choose','build','migrate'],component:['web','api','cli','automation','ios','android'],use_case:[...Object.keys(useCases),...Object.keys(recommendationPolicy.aliases||{})],ecosystem:['any','python','php','ruby','elixir','react','rust'],mobile_platform:['shared','ios','android'],ui:['any','server','full','client','native','none','terminal'],static_only:'boolean',offline_edits:'boolean',realtime:'boolean',existing_stack:'source',source_label:'label',target_stack:'profile'};
export function routeContext(input){
 if(!input || typeof input!=='object' || Array.isArray(input))throw new Error('Supply a JSON object of requirement fields.');
 for(const [key,value] of Object.entries(input)){
  const spec=Object.hasOwn(fields,key)?fields[key]:null;
  if(!spec)throw new Error(`Unknown field: ${key}. Read /context.schema.json.`);
  if(Array.isArray(spec) && !spec.includes(value))throw new Error(`Invalid ${key}. Use: ${spec.join(', ')}.`);
  if(['source','label'].includes(spec) && (typeof value!=='string'||!value.trim()||value.length>(spec==='label'?240:120)))throw new Error(`${key} must be a nonempty bounded string.`);
  if(spec==='boolean' && typeof value!=='boolean')throw new Error(`${key} must be a boolean.`);
  if(spec==='profile' && !index.profiles.some(p=>p.id===value))throw new Error(`Unknown ${key}; read /selection-index.json for profile IDs.`);
 }
 const goal=(!input.goal || input.goal==='auto')?(input.target_stack?'migrate':input.existing_stack?'build':'choose'):input.goal;
 const inferredTask=goal==='choose'&&!input.use_case?{api:'api-service',cli:'cli',automation:'automation',ios:'cross-platform-mobile',android:'cross-platform-mobile'}[input.component]:null;
 const policyInput={...input,use_case:input.use_case||inferredTask};
 const resolved=goal==='choose'&&policyInput.use_case?resolveRecommendation(recommendationPolicy,policyInput):null;
 const selectedUseCase=resolved?.task;
 if(selectedUseCase?.component && input.component && selectedUseCase.component!==input.component)throw new Error(`Use case ${selectedUseCase.id} applies to component ${selectedUseCase.component}, not ${input.component}.`);
 if(selectedUseCase && input.component && !(selectedUseCase.role_options||selectedUseCase.required_roles).includes(input.component))throw new Error(`Use case ${selectedUseCase.id} requires ${selectedUseCase.role_options?'one of these component roles':'component role(s)'}: ${(selectedUseCase.role_options||selectedUseCase.required_roles).join(', ')}.`);
 const component=input.component??selectedUseCase?.component;
 const nudges=[],resources=['/agents/guide.md'],questions=[...(resolved?.unresolved||[]),...(selectedUseCase?.pending_questions||[])];
 if(resolved?.alias)nudges.push(`The older ${resolved.alias} choice maps to task ${selectedUseCase.id} with its stated preferences.`);
 if(input.target_stack && goal!=='migrate')throw new Error('target_stack requires goal migrate or auto.');
 if(goal==='migrate' && !input.existing_stack)questions.push('Identify the current stack and actual application contracts before selecting a replacement.');
 if(goal==='build' && !input.existing_stack)questions.push('Which stack has already been chosen? Otherwise use goal choose.');
 if(input.realtime)nudges.push('For shared live sessions qualify reconnects, per-operation authorization, bounded fanout, persistence and overload. Capacity and media transport require separate measurements/design.');
 if(input.offline_edits)nudges.push('Offline editing needs client storage, synchronization and conflict rules; evaluate the backend separately. Candidate membership is not offline integration qualification.');
 if(input.static_only)nudges.push('Static-only constrains this component. Put database access, secrets and durable work in a separately hosted backend.');
 if(component==='ios'||component==='android')nudges.push('Choose shared or platform-specific client guidance from the actual requirements; select any shared backend separately.');
 let feasible=[],excluded=[];
 const profile=id=>index.profiles.find(p=>p.id===id);
 const existing=profile(input.existing_stack)||sources.find(p=>p.id===input.existing_stack)||(input.existing_stack?{id:input.existing_stack,title:input.source_label||input.existing_stack,kind:[],unknown_source:true}:null);
 const links=p=>p?[p.markdown_url,p.json_url].filter(Boolean):[];
 if(existing?.source_only||existing?.unknown_source)resources.push('/rewrite/sources.json');
 if(existing?.unknown_source&&!(goal==='migrate'&&input.target_stack))questions.push('This source has no curated record. Inspect its manifests, installed versions, official lifecycle and upgrade guides, then inventory actual responsibilities. Do not substitute a guide by language.');
 if(selectedUseCase&&goal==='choose'){
  resources.push('/recommendations.json');
  const ids=[selectedUseCase.primary,...selectedUseCase.alternatives.map(alternative=>alternative.profile_id)].filter(Boolean);
  for(const id of ids){const p=profile(id);if(p)resources.push(...links(p));}
 }
 if(goal==='build'){
  if(input.existing_stack){
   feasible=existing?.unknown_source?[]:[existing];resources.push(...links(existing));
  if(component&&existing&&!existing.unknown_source&&!existing.kind.includes(component))nudges.push(`The chosen ${existing.title} reference covers ${existing.kind.join(', ')}, not the requested ${component} component. Preserve it for its existing role and identify any separate component required; this does not authorize replacement.`);
  }
  else resources.push('/selection-index.json');
  nudges.unshift('Preserve the selected stack. Read the repository first, select tools by actual job, then continue authorized implementation and checks. Supplied constraints are prompts to verify fit, not permission to replace it.');
 }else if(goal==='migrate'){
  resources.push('/rewrite/guide.md','/rewrite/contracts.json');
  resources.push(...links(existing),...links(profile(input.target_stack)));
  if(!input.target_stack){
   questions.push('Which target should be evaluated, or should keeping the current stack be evaluated first?');
   resources.push('/choose.md','/selection-index.json');
  }else if(input.target_stack===input.existing_stack){
   nudges.push('Source and target identify the same profile. This is not a profile replacement; if a version upgrade is intended, inspect the actual versions and their upgrade guidance, preserving existing contracts and qualifying rollback.');
   questions.push('What installed-version change or other same-stack change is intended?');
  }
  const fit=assessMigration(existing,profile(input.target_stack),input);
  if(input.existing_stack&&input.target_stack){
   questions.push(...fit.questions);
   if(fit.missing_roles.length)nudges.push(`The selected target does not cover these documented source roles: ${fit.missing_roles.join(', ')}. Resolve the component boundary, retained interface/composition or explicitly changed product surface before planning replacement.`);
   if(fit.missing_responsibilities?.length)nudges.push(`The selected target does not document these source responsibilities: ${fit.missing_responsibilities.join(', ')}. Resolve their retained owner and interface, or explicitly change the product surface, before planning replacement.`);
   nudges.push(...fit.constraint_conflicts);
   if(fit.requires_clarification)nudges.push('Preserve the selected source and target resources while resolving scope and hard constraints. Do not silently substitute another target or treat documentation coverage as certified compatibility.');
  }else if(input.target_stack){
   questions.push(...fit.questions.filter(q=>!q.startsWith('Which current stack')));
   nudges.push(...fit.constraint_conflicts);
  }
  nudges.unshift('Evaluate keeping the current stack before a rewrite. Plan compatible replacement or staged coexistence, inventory dependencies and qualify rollback/ownership transfer. Shared capability labels do not prove compatibility.');
 }else{
  resources.push('/choose.md','/selection-index.json');
  if(input.existing_stack){
   resources.push(...links(existing),'/rewrite/guide.md','/rewrite/contracts.json');
   nudges.push('Reconsideration starts with the current stack as the baseline; keeping it is a valid option. Compare its actual constraints and costs against alternatives. Any replacement needs an explicit staged migration, contract inventory and qualified rollback.');
  }
  if(!selectedUseCase&&(input.ecosystem||input.mobile_platform))questions.push('Which task should the supplied ecosystem or mobile preference narrow? The preference is recorded but does not by itself identify the product job.');
  if(!component&&!selectedUseCase)questions.push('Identify the component: web, API, CLI, automation, native iOS or native Android. A product may combine several.');
  if(component==='web'&&!selectedUseCase)questions.push('What kind of web application is this: a content site, business application, collaborative application, data/admin tool or browser client for a separate API? Language and team preferences narrow that task.');
  for(const p of index.profiles){
   const reasons=[];
   if(selectedUseCase&&!selectedUseCase.required_roles.every(role=>p.kind.includes(role)))reasons.push('Does not cover every component role required by this use case.');
   if(selectedUseCase?.role_options&&!selectedUseCase.role_options.some(role=>p.kind.includes(role)))reasons.push('Does not cover a mobile client role.');
   if(component && !p.kind.includes(component))reasons.push('Outside this profile’s documented component role.');
   if(component==='web' && input.ui && input.ui!=='any' && p.ui!==input.ui)reasons.push('Does not match the supplied UI architecture.');
   if(input.static_only && p.host!=='static')reasons.push('This profile needs a runtime rather than static-only hosting.');
   if(input.offline_edits && component==='web' && !['client','full'].includes(p.ui))reasons.push('Requires a separate offline-capable client; not an offline editing frontend profile.');
   if(reasons.length)excluded.push({id:p.id,reasons});else feasible.push(p);
  }
  if(!feasible.length)nudges.push('No curated profile satisfies these fields. Report the conflict or coverage gap and research beyond the catalogue. Do not relax hard requirements silently.');
  if(input.realtime && component==='web' && feasible.some(p=>p.id==='elixir-phoenix-liveview'))nudges.push('For this feasible web choice, compare Phoenix + LiveView with the other feasible profiles for shared live sessions. This is a comparison prompt, not a preferred or qualified winner.');
  if(selectedUseCase){
   const primaryProfile=profile(selectedUseCase.primary);
   const primaryFeasible=feasible.some(p=>p.id===selectedUseCase.primary);
   if(!primaryFeasible)nudges.push(primaryProfile?`The task-based default ${primaryProfile.title} does not satisfy every supplied hard constraint. Preserve the constraint and resolve the fit; do not silently substitute a different profile.`:`The task-based default profile ${selectedUseCase.primary} is not present in the current catalogue. Treat this as a coverage gap and research the profile before recommending it.`);
  }
  nudges.unshift('Use supplied context; ask only questions that change the choice. Read feasible finalists before recommending a composition. No score or ordering here establishes a winning stack.');
 }
 const recommendation=selectedUseCase&&goal==='choose'?{
  constraints:resolved.constraints,
  use_case:{id:selectedUseCase.id,label:selectedUseCase.label,component:selectedUseCase.component,required_roles:selectedUseCase.required_roles,...(selectedUseCase.role_options?{role_options:selectedUseCase.role_options}:{})},
  primary:{id:selectedUseCase.primary,title:profile(selectedUseCase.primary)?.title??null,feasible:feasible.some(p=>p.id===selectedUseCase.primary),conditional:selectedUseCase.pending_questions.length>0},
  why:selectedUseCase.why,tradeoff:selectedUseCase.tradeoff,sources:selectedUseCase.sources,
  alternatives:selectedUseCase.alternatives.map(alternative=>({
   ...alternative,title:alternative.profile_id?profile(alternative.profile_id)?.title??null:null,
   feasible:alternative.profile_id?feasible.some(p=>p.id===alternative.profile_id):null
  }))
 }:undefined;
 return {schema_version:'1.1',goal,...(existing?.source_only||existing?.unknown_source?{existing_source:existing}:{}),resources:[...new Set(resources)],candidates:feasible.map(p=>({id:p.id,title:p.title,summary:p.summary,guide:p.markdown_url,record:p.json_url,tradeoff:p.tradeoff||p.caution})),excluded,nudges,questions,...(recommendation?{recommendation}:{}),evidence:'Documentation-reviewed profiles; application integrations and capacity unqualified.',handoff:['recommended composition','hard constraints satisfied or unresolved','alternatives and reasons','tools by required job','current primary documentation and versions','checks actually executed','unknowns and next representative prototype']};
}
