import {agentContent} from '../lib/agent-response.js';
export async function onRequest(context){
 const url=new URL(context.request.url);
 if(url.hostname==='www.stack.menu'){url.hostname='stack.menu';url.protocol='https:';return Response.redirect(url.href,301);}
 const response=await agentContent(context);
 const headers=new Headers(response.headers);
 headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','strict-origin-when-cross-origin');
 headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self' https://plausible.io; connect-src 'self' https://plausible.io; style-src 'self'; font-src 'self'; img-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
 if(url.hostname!=='stack.menu')headers.set('X-Robots-Tag','noindex, nofollow');
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
