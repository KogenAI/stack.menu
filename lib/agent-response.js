// Negotiate generated page representations; ordinary HTML and asset responses remain authoritative.
function acceptedTypes(accept = '') {
  const header = String(accept || '').trim();
  if (!header) return {html: 1, markdown: 0, explicitMarkdown: false};
  const entries = header.toLowerCase().split(',').map(value => {
    const [type, ...parameters] = value.trim().split(';');
    const qValue = parameters.find(part => part.trim().startsWith('q='));
    const q = qValue ? Number(qValue.trim().slice(2)) : 1;
    return {type: type.trim(), q: Number.isFinite(q) && q >= 0 && q <= 1 ? q : 0};
  }).filter(entry => entry.type.includes('/'));
  const qualityFor = mediaType => {
    const [major] = mediaType.split('/');
    const matches = entries.flatMap(entry => {
      if (entry.type === mediaType) return [{specificity: 2, q: entry.q}];
      if (entry.type === `${major}/*`) return [{specificity: 1, q: entry.q}];
      if (entry.type === '*/*') return [{specificity: 0, q: entry.q}];
      return [];
    });
    if (!matches.length) return 0;
    const specificity = Math.max(...matches.map(entry => entry.specificity));
    return Math.max(...matches.filter(entry => entry.specificity === specificity).map(entry => entry.q));
  };
  return {
    html: qualityFor('text/html'),
    markdown: qualityFor('text/markdown'),
    explicitMarkdown: entries.some(entry => entry.type === 'text/markdown' && entry.q > 0),
  };
}

function prefersMarkdown({html, markdown, explicitMarkdown}) {
  return markdown > 0 && (markdown > html || (explicitMarkdown && markdown === html));
}

export function wantsMarkdown(accept = '') {
  return prefersMarkdown(acceptedTypes(accept));
}

export async function agentContent(context) {
  const request = context.request;
  const downstreamHeaders = new Headers(request.headers);
  if (wantsMarkdown(request.headers.get('Accept'))) {
    for (const name of ['If-None-Match', 'If-Modified-Since', 'Range', 'If-Range']) downstreamHeaders.delete(name);
  }
  const original = await context.next(new Request(request, {headers: downstreamHeaders}));
  const isPage = (original.headers.get('Content-Type') || '').includes('text/html');
  if (!['GET', 'HEAD'].includes(request.method) || !isPage) return original;
  const headers = new Headers(original.headers);
  const vary = new Set((headers.get('Vary') || '').split(',').map(s => s.trim()).filter(Boolean));
  if (![...vary].some(s => s.toLowerCase() === 'accept')) vary.add('Accept');
  headers.set('Vary', [...vary].join(', '));
  const requestedUrl = new URL(request.url);
  const markdownPath = requestedUrl.pathname === '/' ? '/agent-content/index.md' : '/agent-content' + requestedUrl.pathname.replace(/\/+$/, '').replace(/\.html$/, '') + '.md';
  const links = `<${requestedUrl.origin}${markdownPath}>; rel="alternate"; type="text/markdown", <${requestedUrl.origin}/llms.txt>; rel="describedby"; type="text/plain", <${requestedUrl.origin}/sitemap.xml>; rel="sitemap"; type="application/xml"`;
  if (original.status === 200) headers.set('Link', links);
  // Shared caches must not reuse an HTML entity for the Markdown request or vice versa.
  headers.set('Cache-Control', 'private, no-cache');
  if (!wantsMarkdown(request.headers.get('Accept'))) return new Response(original.body, {status: original.status, statusText: original.statusText, headers});
  if (original.status === 404) {
    if (original.body) await original.body.cancel();
    const url = new URL(request.url);
    const body = `# Page not found\n\nThis address does not have a public page.\n\n[Home](${url.origin}/) · [Sitemap](${url.origin}/sitemap.xml) · [Agent guide](${url.origin}/llms.txt)\n`;
    for (const name of ['Content-Length', 'Content-Encoding', 'ETag', 'Last-Modified']) headers.delete(name);
    headers.set('Content-Type', 'text/markdown; charset=utf-8');
    return new Response(request.method === 'HEAD' ? null : body, {status:404, headers});
  }
  if (original.status !== 200) return new Response(original.body, {status:original.status, statusText:original.statusText, headers});
  if (original.body) await original.body.cancel();
  const target = new URL(request.url);
  const path = target.pathname.replace(/\/+$/, '') || '/';
  target.pathname = path === '/' ? '/agent-content/index.md' : `/agent-content${path.replace(/\.html$/, '')}.md`;
  target.search = '';
  const markdown = await context.env.ASSETS.fetch(new Request(target, {method:'GET'}));
  if (markdown.status !== 200 || !(markdown.headers.get('Content-Type') || '').includes('text/markdown')) {
    // A build/source mismatch must remain visible as a failed representation, never a false Markdown 200.
    if (markdown.body) await markdown.body.cancel();
    headers.set('Content-Type', 'text/markdown; charset=utf-8');
    for (const name of ['Content-Length', 'Content-Encoding', 'ETag', 'Last-Modified']) headers.delete(name);
    return new Response(request.method === 'HEAD' ? null : '# Representation unavailable\n\nUse the HTML page or the sitemap while this page is rebuilt.\n', {status:503, headers});
  }
  for (const name of ['Content-Length', 'Content-Encoding', 'ETag', 'Last-Modified']) headers.delete(name);
  headers.set('Content-Type', 'text/markdown; charset=utf-8');
  return new Response(request.method === 'HEAD' ? null : markdown.body, {status:200, headers});
}
