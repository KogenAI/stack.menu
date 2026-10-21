from pathlib import Path
import json,xml.etree.ElementTree as ET,hashlib
R=Path(__file__).resolve().parent.parent;out=R/'dist'
# Keep complete curated guide twins for direct use. Negotiated page Markdown mirrors its HTML.
(out/'agents/routing.md').write_text((R/'content/routing.md').read_text())
(out/'examples').mkdir(exist_ok=True);(out/'examples/cookout.json').write_text((R/'content/cookout.json').read_text());(out/'cookout.json').unlink(missing_ok=True)
ns='http://www.sitemaps.org/schemas/sitemap/0.9';ET.register_namespace('',ns);tree=ET.Element('{'+ns+'}urlset')
for page in sorted(out.rglob('*.html')):
 if page.name=='404.html':continue
 relative=page.relative_to(out).as_posix();route='/' if relative=='index.html' else '/'+relative.removesuffix('index.html')
 element=ET.SubElement(tree,'{'+ns+'}url');ET.SubElement(element,'{'+ns+'}loc').text='https://stack.menu'+route
(out/'sitemap.xml').write_bytes(ET.tostring(tree,encoding='utf-8',xml_declaration=True))
(out/'robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: https://stack.menu/sitemap.xml\n')
# Static resources bypass Functions; /route remains inside the include set.
(out/'_routes.json').write_text(json.dumps({'version':1,'include':['/*'],'exclude':['/_astro/*','/design/*','/media/*','/agent-content/*','/menu-assets/*','/*.md','/*.txt','/*.json','/*.xml','/*.svg','/*.png']})+'\n')
policy=json.loads((R/'lib/security-policy.json').read_text())['policy']
(out/'_headers').write_text('''/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: {POLICY}
/*.md
  Content-Type: text/markdown; charset=utf-8
/*.json
  Content-Type: application/json; charset=utf-8
/llms.txt
  Content-Type: text/plain; charset=utf-8
/llms-full.txt
  Content-Type: text/plain; charset=utf-8
https://:project.pages.dev/*
  X-Robots-Tag: noindex, nofollow
https://:version.:project.pages.dev/*
  X-Robots-Tag: noindex, nofollow
'''.replace('{POLICY}',policy))
# Frozen build digest for local review; private evidence does not enter dist.
files={p.relative_to(out).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(out.rglob('*')) if p.is_file()}
(R/'.generated/build-digest.json').write_text(json.dumps(files,indent=2)+'\n')
print(f'Finalized {len(tree)} canonical pages; {len(files)} output files.')
