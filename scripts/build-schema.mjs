import {writeFile} from 'node:fs/promises';import {fields} from '../lib/router.js';
import index from '../lib/selection-index.json' with {type:'json'};
import recommendations from '../menu/recommendations.json' with {type:'json'};
const profileIds=new Set(index.profiles.map(profile=>profile.id));
const useCaseIds=new Set(recommendations.use_cases.map(useCase=>useCase.id));
if(useCaseIds.size!==recommendations.use_cases.length)throw new Error('Recommendation use-case IDs must be unique.');
for(const useCase of recommendations.use_cases){
 if(!profileIds.has(useCase.primary))throw new Error(`Recommendation ${useCase.id} references unknown primary profile ${useCase.primary}.`);
 if(!fields.use_case.includes(useCase.id))throw new Error(`Recommendation ${useCase.id} is missing from the route schema.`);
}
for(const alternative of recommendations.alternatives){
 if(alternative.profile_id&&!profileIds.has(alternative.profile_id))throw new Error(`Recommendation alternative ${alternative.id} references unknown profile ${alternative.profile_id}.`);
 for(const useCaseId of alternative.use_cases)if(!useCaseIds.has(useCaseId))throw new Error(`Recommendation alternative ${alternative.id} references unknown use case ${useCaseId}.`);
}
const properties=Object.fromEntries(Object.entries(fields).map(([name,type])=>[name,type==='boolean'?{type:'boolean'}:{type:'string',enum:type==='profile'?index.profiles.map(p=>p.id):type}]));
await writeFile('.generated/resources/context.schema.json',JSON.stringify({$schema:'https://json-schema.org/draft/2020-12/schema',$id:'https://stack.menu/context.schema.json',title:'Stack Menu context routing',type:'object',additionalProperties:false,properties},null,2)+'\n');
await writeFile('.generated/resources/recommendations.json',JSON.stringify(recommendations,null,2)+'\n');
