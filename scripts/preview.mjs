// Local adapter runs the actual Pages handlers, not a separate mock routing implementation.
import http from 'node:http';import {readFile,stat} from 'node:fs/promises';import {resolve,extname,sep} from 'node:path';
import {onRequest as middleware} from '../functions/_middleware.js';import {onRequest as route} from '../functions/route.js';
const root=resolve('dist');const port=Number(process.env.STACK_MENU_PORT||8770);
const mime={'.html':'text/html; charset=utf-8','.md':'text/markdown; charset=utf-8','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.woff2':'font/woff2'};
async function assets(request){
 const url=new URL(request.url);let file;
 try{file=resolve(root,'.'+decodeURIComponent(url.pathname));}catch{return new Response('Invalid path',{status:400});}
 if(file!==root&&!file.startsWith(root+sep))return new Response('Forbidden',{status:403});
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
 try{if((await stat(file)).isDirectory()){if(!url.pathname.endsWith('/')){url.pathname+='/';return Response.redirect(url.href,301);}file=resolve(file,'index.html');}
  const bytes=await readFile(file);return new Response(request.method==='HEAD'?null:bytes,{headers:{'Content-Type':mime[extname(file)]||'application/octet-stream'}});
 }catch{const bytes=await readFile(resolve(root,'404.html'));return new Response(request.method==='HEAD'?null:bytes,{status:404,headers:{'Content-Type':mime['.html']}});}
}
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,`http://127.0.0.1:${port}`);
  const request=new Request(url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:req,duplex:'half'})});
  const response=await middleware({request,env:{ASSETS:{fetch:assets}},next:async modified=>{const downstream=modified||request;return url.pathname.replace(/\/$/,'')==='/route'?route({request:downstream}):assets(downstream);}});
  res.writeHead(response.status,Object.fromEntries(response.headers));if(response.body){for await(const chunk of response.body)res.write(chunk);}res.end();
 }catch(e){console.error(e.message);if(!res.headersSent)res.writeHead(500);res.end('Local preview failed');}
}).listen(port,'127.0.0.1',()=>console.log(`Local preview: http://127.0.0.1:${port}/`));
