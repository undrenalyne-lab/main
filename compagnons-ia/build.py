from pathlib import Path
from string import Template
from html import escape as e
import json
root=Path(__file__).resolve().parent
data=json.loads((root/'catalog.json').read_text())
def source(p,key):
 s=next(s for s in p['sources'] if s['id']==p['fieldSources'][key]);return f'<a class="source-ref" href="{e(s["url"],quote=True)}" target="_blank" rel="noopener noreferrer" aria-label="Source {e(s["label"],quote=True)} — nouvel onglet">↗</a>'
rows=[('price','Abonnement payant'),('free','Accès gratuit'),('voice','Voix'),('memoryText','Mémoire'),('privacy','Données'),('export','Export'),('deletion','Suppression')]
table='<table><caption class="sr-only">Conditions et fonctionnalités annoncées ; sources consultées le 3 octobre 2026</caption><thead><tr><th scope="col">Ce qui compte</th>'+''.join(f'<th scope="col"><span>{e(p["name"])}</span><a href="#fiche-{p["id"]}">Lire la fiche ↓</a></th>' for p in data['products'])+'</tr></thead><tbody>'
shorts={'price':lambda p:p['price'],'free':lambda p:{'kindroid':'Aperçu ponctuel seulement','nomi':'Démarrage gratuit ; limites non confirmées','replika':'Accès gratuit limité annoncé'}[p['id']],'voice':lambda p:'Voix annoncée ; formule/quotas à vérifier' if p['id']=='nomi' else 'Voix annoncée avec abonnement','memoryText':lambda p:'Mémoire annoncée ; non testée','privacy':lambda p:{'kindroid':'Chiffré, pas de bout en bout ; traitement côté fournisseur','nomi':'Pas de bout en bout ; usages et exceptions dans la politique','replika':'Traitement par des fournisseurs IA ; usages internes anonymisés'}[p['id']],'export':lambda p:'Autonome, tous les 30 jours' if p['directExport'] else 'Autonome non confirmé','deletion':lambda p:'Procédure documentée ; conservation et exceptions à lire'}
for key,label in rows:table+='<tr><th scope="row">'+label+'</th>'+''.join('<td>'+e(shorts[key](p))+' '+source(p,key)+'</td>' for p in data['products'])+'</tr>'
table+='</tbody></table>'
details=''
for i,p in enumerate(data['products']):
 details+=f'<details class="product-detail" id="fiche-{p["id"]}"><summary><span class="product-num">0{i+1}</span><span><strong>{e(p["name"])}</strong><small>{e(p["descriptor"])}</small></span><span class="open-symbol" aria-hidden="true">+</span></summary><div class="detail-body"><p class="detail-provenance">Consulté le 3 octobre 2026 · Documentation du fournisseur · Aucun essai d’usage</p><dl>'
 for key,label in rows:details+=f'<dt>{label}</dt><dd>{e(p[key])} '+(e(p['priceDetail'])+' ' if key=='price' else '')+source(p,key)+'</dd>'
 details+='</dl><div class="unknown-list"><h3>Ce qui reste à vérifier</h3><ul>'+''.join('<li>'+e(x)+'</li>' for x in p['unknowns'])+'</ul></div><h3>Sources consultées</h3><ul class="source-list">'+''.join(f'<li><a href="{e(s["url"],quote=True)}" target="_blank" rel="noopener noreferrer">{e(s["label"])} ↗<span class="sr-only">, nouvel onglet</span></a><small>Mise à jour : {e(s["updated"])}. {e(s["covers"])}. {e(s.get("access",""))}</small></li>' for s in p['sources'])+'</ul><a class="text-link" href="#selection">Revenir au sélecteur ↑</a></div></details>'
(root/'index.html').write_text(Template((root/'template.html').read_text()).substitute(comparison=table,details=details))
(root/'catalog.js').write_text('window.COMPANION_CATALOG = '+json.dumps(data,ensure_ascii=False)+';\n')
print('Built static index.html and catalog.js')
