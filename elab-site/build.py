"""Generate the two static pages, with no third-party build dependencies."""
from pathlib import Path
from string import Template
from html import escape
import json
ROOT=Path(__file__).resolve().parent
content=json.loads((ROOT/'content.json').read_text())
template=Template((ROOT/'template.html').read_text())
def br(value):return escape(value).replace('\n','<br>')
for lang, raw in content.items():
 d={k:escape(v,quote=True) for k,v in raw.items() if isinstance(v,str)}
 d.update(lang=lang,base='..' if lang=='en' else '.',home='./index.html',fr_link='../index.html' if lang=='en' else './index.html',en_link='./index.html' if lang=='en' else './en/index.html',home_label='Accueil' if lang=='fr' else 'Home',legal_label='Informations légales (pages en français)' if lang=='fr' else 'Legal information (French pages)',fr_current='aria-current="page"' if lang=='fr' else '',en_current='aria-current="page"' if lang=='en' else '')
 for k in ['expertise_title','method_title','about_title','contact_title']:d[k]=br(raw[k])
 d['hero_lines']=''.join(f'<span{" class=accent" if i==2 else ""}>{escape(line)}</span>' for i,line in enumerate(raw['hero_lines']))
 d['nav_links']=''.join(f'<a href="#{anchor}">{escape(label)}</a>' for anchor,label in zip(['expertises','methode','studio'],raw['nav']))
 d['tabs_html']=''.join(f'<a class="service-tab" id="tab-{i}" href="#service-{i}"><span class="tab-number" aria-hidden="true">0{i+1}</span>{escape(label)}<span class="tab-arrow" aria-hidden="true">↗</span></a>' for i,label in enumerate(raw['tabs']))
 panels=[]
 for i,s in enumerate(raw['services']):
  items=''.join(f'<li>{escape(x)}</li>' for x in s['items'])
  panels.append(f'''<article id="service-{i}" class="service-panel" aria-labelledby="service-heading-{i}"><figure class="service-media"><img src="{d['base']}/elab-site/assets/{escape(s['image'])}" alt="{escape(s['alt'],quote=True)}" width="1168" height="784" loading="lazy"><figcaption>{escape(s['caption'])}</figcaption></figure><div class="service-copy"><p class="eyebrow">{escape(s['tag'])}</p><h3 id="service-heading-{i}">{escape(s['title'])}</h3><p>{escape(s['body'])}</p><ul>{items}</ul><a class="text-link" href="#contact">{escape(s['cta'])}<span aria-hidden="true">↗</span></a></div></article>''')
 d['panels']='\n'.join(panels)
 d['steps_html']=''.join(f'<li><span class="step-number" aria-hidden="true">0{i+1}</span><h3>{escape(t)}</h3><p>{escape(b)}</p></li>' for i,(t,b) in enumerate(raw['steps']))
 d['questions_html']=''.join(f'<details><summary>{escape(t)}<span aria-hidden="true">+</span></summary><p>{escape(b)}</p></details>' for t,b in raw['questions'])
 d['legal_links']=''.join(f'<a href="https://undrenalynelab.io/{path}">{escape(label)}</a>' for path,label in zip(['mentions-legales.html','cgv.html','politique-confidentialite.html'],raw['legal']))
 path=ROOT.parent/('en/index.html' if lang=='en' else 'index.html');path.parent.mkdir(exist_ok=True);path.write_text(template.substitute(d))
 print(f'Built {path.relative_to(ROOT.parent)}')
