import {assessMigration} from './migration-fit.js';
import index from './selection-index.json' with {type:'json'};
export const fields={goal:['auto','choose','build','migrate'],component:['web','api','cli','automation','ios','android'],ui:['any','server','full','client','native','none','terminal'],static_only:'boolean',offline_edits:'boolean',realtime:'boolean',existing_stack:'profile',target_stack:'profile'};
export function routeContext(input){
 if(!input || typeof input!=='object' || Array.isArray(input))throw new Error('Supply a JSON object of requirement fields.');
 for(const [key,value] of Object.entries(input)){
  const spec=Object.hasOwn(fields,key)?fields[key]:null;
  if(!spec)throw new Error(`Unknown field: ${key}. Read /context.schema.json.`);
  if(Array.isArray(spec) && !spec.includes(value))throw new Error(`Invalid ${key}. Use: ${spec.join(', ')}.`);
  if(spec==='boolean' && typeof value!=='boolean')throw new Error(`${key} must be a boolean.`);
  if(spec==='profile' && !index.profiles.some(p=>p.id===value))throw new Error(`Unknown ${key}; read /selection-index.json for profile IDs.`);
 }
 const goal=(!input.goal || input.goal==='auto')?(input.target_stack?'migrate':input.existing_stack?'build':'choose'):input.goal;
 const nudges=[],resources=['/agents/guide.md'],questions=[];
 if(input.target_stack && goal!=='migrate')throw new Error('target_stack requires goal migrate or auto.');
 if(goal==='migrate' && !input.existing_stack)questions.push('Identify the current stack and actual application contracts before selecting a replacement.');
 if(goal==='build' && !input.existing_stack)questions.push('Which stack has already been chosen? Otherwise use goal choose.');
 if(input.realtime)nudges.push(goal==='choose'
  ? 'For shared live sessions compare Phoenix + LiveView with other feasible web profiles. Qualify reconnects, per-operation authorization, bounded fanout, persistence and overload. Capacity and media transport require separate measurements/design.'
  : 'Within the chosen stack and any explicitly selected target, qualify reconnects, per-operation authorization, bounded fanout, persistence and overload. Capacity and media transport need separate measurements/design. Compare other stacks only when the user asks to reconsider.');
 if(input.offline_edits)nudges.push('Offline editing needs client storage, synchronization and conflict rules; evaluate the backend separately. Candidate membership is not offline integration qualification.');
 if(input.static_only)nudges.push('Static-only constrains this component. Put database access, secrets and durable work in a separately hosted backend.');
 if(input.component==='ios'||input.component==='android')nudges.push('Use the native client guide and choose any shared backend separately.');
 let feasible=[],excluded=[];
 const profile=id=>index.profiles.find(p=>p.id===id);
 const links=p=>[p.markdown_url,p.json_url];
 if(input.component==='ios'||input.component==='android')resources.push(...links(profile(input.component==='ios'?'swift-swiftui-ios':'kotlin-compose-android')));
 if(goal==='build'){
  if(input.existing_stack){
   feasible=[profile(input.existing_stack)];resources.push(...links(feasible[0]));
   if(input.component&&!feasible[0].kind.includes(input.component))nudges.push(`The chosen ${feasible[0].title} profile covers ${feasible[0].kind.join(', ')}, not the requested ${input.component} component. Preserve it for its existing role and identify any separate component required; this does not authorize replacement.`);
  }
  else resources.push('/selection-index.json');
  nudges.unshift('Preserve the selected stack. Read the repository first, select tools by actual job, then continue authorized implementation and checks. Supplied constraints are prompts to verify fit, not permission to replace it.');
 }else if(goal==='migrate'){
  resources.push('/rewrite/guide.md','/rewrite/contracts.json');
  for(const id of [input.existing_stack,input.target_stack].filter(Boolean))resources.push(...links(profile(id)));
  if(!input.target_stack){
   questions.push('Which target should be evaluated, or should keeping the current stack be evaluated first?');
   resources.push('/choose.md','/selection-index.json');
  }else if(input.target_stack===input.existing_stack){
   nudges.push('Source and target identify the same profile. This is not a profile replacement; if a version upgrade is intended, inspect the actual versions and their upgrade guidance, preserving existing contracts and qualifying rollback.');
   questions.push('What installed-version change or other same-stack change is intended?');
  }
  const fit=assessMigration(profile(input.existing_stack),profile(input.target_stack),input);
  if(input.existing_stack&&input.target_stack){
   questions.push(...fit.questions);
   if(fit.missing_roles.length)nudges.push(`The selected target does not cover these documented source roles: ${fit.missing_roles.join(', ')}. Resolve the component boundary, retained interface/composition or explicitly changed product surface before planning replacement.`);
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
   resources.push(...links(profile(input.existing_stack)),'/rewrite/guide.md','/rewrite/contracts.json');
   nudges.push('Reconsideration starts with the current stack as the baseline; keeping it is a valid option. Compare its actual constraints and costs against alternatives. Any replacement needs an explicit staged migration, contract inventory and qualified rollback.');
  }
  if(!input.component)questions.push('Identify the component: web, API, CLI, automation, native iOS or native Android. A product may combine several.');
  for(const p of index.profiles){
   const reasons=[];
   if(input.component && !p.kind.includes(input.component))reasons.push('Outside this profile’s documented component role.');
   if(input.component==='web' && input.ui && input.ui!=='any' && p.ui!==input.ui)reasons.push('Does not match the supplied UI architecture.');
   if(input.static_only && p.host!=='static')reasons.push('This profile needs a runtime rather than static-only hosting.');
   if(input.offline_edits && input.component==='web' && !['client','full'].includes(p.ui))reasons.push('Requires a separate offline-capable client; not an offline editing frontend profile.');
   if(reasons.length)excluded.push({id:p.id,reasons});else feasible.push(p);
  }
  if(!feasible.length)nudges.push('No curated profile satisfies these fields. Report the conflict or coverage gap and research beyond the catalogue. Do not relax hard requirements silently.');
  nudges.unshift('Use supplied context; ask only questions that change the choice. Read feasible finalists before recommending a composition. No score or ordering here establishes a winning stack.');
 }
 return {schema_version:'1.0',goal,resources:[...new Set(resources)],candidates:feasible.map(p=>({id:p.id,title:p.title,summary:p.summary,guide:p.markdown_url,record:p.json_url,tradeoff:p.tradeoff})),excluded,nudges,questions,evidence:'Documentation-reviewed profiles; application integrations and capacity unqualified.',handoff:['recommended composition','hard constraints satisfied or unresolved','alternatives and reasons','tools by required job','current primary documentation and versions','checks actually executed','unknowns and next representative prototype']};
}
