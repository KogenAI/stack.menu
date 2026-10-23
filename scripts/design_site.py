"""Oghogho's presentation over Stack Menu's maintained content records."""
import html,json,re

# Artwork selection is visual identity; profile facts remain in menu/.
ART = dict(zip(['elixir-phoenix-liveview','typescript-next-node','typescript-react-vite-browser','rails-hotwire-postgresql','laravel-livewire-postgresql','python-django','go-service','rust-service','python-fastapi','go-cli','rust-cli','python-scripts-workers','swift-swiftui-ios','kotlin-compose-android'], ['dusk','graphite','vite','ruby','livewire','verdant','gocyan','copper','teal','terminal','ember','python','swift','kotlin']))

def prepare(root,out,pages,records,write,shell):
    e=lambda x:html.escape(str(x),quote=True)
    stacks=[];search={}
    for i,(key,d) in enumerate(records.items()):
        # Existing profiles keep their chosen artwork; new profiles get a stable neutral folder.
        art=ART.get(key,'graphite')
        group=d['group']
        size=max(1,round((out/d['markdown_url'].lstrip('/')).stat().st_size/1024))
        stacks.append(dict(id=key,label=d['title'],lang=d['language'],group=group,art=art,seed=i+3,blurb=d['summary'],files=[['rewrite stack','','/rewrite/?from='+key],['recommendation','','/choose/?stack='+key],['guide.md',f'MD · {size} KB',d['guide_url']]]))
        search[key]=' '.join([d['title'],d['language'],d['shape'],d['summary'],json.dumps(d['tools'],ensure_ascii=False)])
    write('design/data.js','window.StackMenuData = '+json.dumps(dict(stacks=stacks,search=search),ensure_ascii=False).replace('<','\\u003c')+';\n')
    for route,name,title in [('index.html','home','Your agent’s guide to the right stack'),('agents/index.html','agents','For agents')]:
        body=(root/'src/design'/f'{name}.html').read_text()
        if name=='home':
            ids=re.search(r'data-stack-folders data-ids="([^"]+)"',body).group(1).split(',')
            fallback=''.join('<a class="fallback-card" href="'+e(records[k]['guide_url'])+'"><strong>'+e(records[k]['title'])+'</strong><span>'+e(records[k]['language'])+'</span></a>' for k in ids)
            body=re.sub(r'(<div id="library"[^>]*>)</div>',lambda m:m[1]+fallback+'</div>',body)
        else:
            # Initial HTML retains the full authored entry and direct machine resources.
            original=pages[route]['body'].removeprefix('<main id="main">').removesuffix('</main>')
            original=re.sub(r'<h1>(.*?)</h1>',r'<h2>\1</h2>',original,count=1)
            body=body.replace('</main>','<section class="prose-page agent-reference"><details><summary>Read the full agent instructions</summary>'+original+'</details></section></main>')
        body=body.replace('{{PROFILE_COUNT}}',str(len(records)))
        props=shell(title,body,page=name)
        props['description']=('Stack guides for you and your coding agent. Choose the right stack, build with it or plan a rewrite.' if name=='home' else 'Give your agent direct access to Stack Menu: task-based recommendations, complete Markdown and JSON guides, generators and rewrite contracts.')
        props['styles']=['/design/'+name+'.css']
        props['scripts']=['/design/'+name+'.js']
        write(route,props)
    from design_interactive import prepare as interactive
    interactive(root,out,pages,records,write,shell)
    from design_guides import prepare as guides
    guides(root,out,pages,records,write,shell)
    # Information pages share the same typography and responsive shell.
    for path,props in pages.items():
        if props['page']=='utility':
            props['body']=props['body'].replace('<main id="main">','<main id="main" class="prose-page">')
