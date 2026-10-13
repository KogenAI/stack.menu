import {routeContext,fields} from '../lib/router.js';
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex'};
const reply=(data,status=200,extra={})=>new Response(JSON.stringify(data,null,2)+'\n',{status,headers:{...headers,...extra}});
export async function onRequest({request}){
 if(request.method==='HEAD')return new Response(null,{headers});
 if(request.method==='GET'){
  const query=new URL(request.url).searchParams;
  if(!query.size)return reply({description:'Context-dependent routing for Stack Menu. POST explicit requirement fields; do not send private conversation text.',schema:'/context.schema.json',instructions:'/agents/routing.md',fields});
  const input=Object.create(null);
  for(const [k,v] of query){if(Object.hasOwn(input,k))return reply({error:`Repeated field: ${k}`},400);input[k]=(Object.hasOwn(fields,k)&&fields[k]==='boolean')?(v==='true'?true:v==='false'?false:v):v;}
  try{return reply(routeContext(input));}catch(e){return reply({error:e.message,schema:'/context.schema.json'},400);}
 }
 if(request.method!=='POST')return reply({error:'Use GET or POST.'},405,{Allow:'GET, HEAD, POST'});
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))return reply({error:'Use Content-Type: application/json.'},415);
 // Bound the actual body, including chunked clients; content-length alone is insufficient.
 const reader=request.body?.getReader();let size=0,chunks=[];
 if(reader){try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16384){await reader.cancel();return reply({error:'Context exceeds 16 KiB. Send only structured requirement fields.'},413);}chunks.push(value);}}catch{return reply({error:'Unable to read context.'},400);}}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
 try{return reply(routeContext(JSON.parse(new TextDecoder().decode(bytes))));}catch(e){return reply({error:e instanceof SyntaxError?'Invalid JSON.':e.message,schema:'/context.schema.json'},400);}
}
