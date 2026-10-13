import {writeFile} from 'node:fs/promises';import {fields} from '../lib/router.js';
import index from '../lib/selection-index.json' with {type:'json'};
const properties=Object.fromEntries(Object.entries(fields).map(([name,type])=>[name,type==='boolean'?{type:'boolean'}:{type:'string',enum:type==='profile'?index.profiles.map(p=>p.id):type}]));
await writeFile('.generated/resources/context.schema.json',JSON.stringify({$schema:'https://json-schema.org/draft/2020-12/schema',$id:'https://stack.menu/context.schema.json',title:'Stack Menu context routing',type:'object',additionalProperties:false,properties},null,2)+'\n');
