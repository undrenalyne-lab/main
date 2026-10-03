/* Preferences live only in the current document. No network, persistence or analytics. */
(()=>{
 const form=document.querySelector('#selection-form'),results=document.querySelector('#results');
 const steps=[...document.querySelectorAll('.form-step')],progress=[...document.querySelectorAll('.progress li')];
 const next=document.querySelector('.next'),back=document.querySelector('.back'),error=document.querySelector('#form-error');
 let screen=0;
 function preferences(){return {mode:form.elements.mode.value,budget:form.elements.budget.value,export:form.elements.export.checked,memory:form.elements.memory.checked,offline:form.elements.offline.checked};}
 function setScreen(n,focus=true){
  if(n>0&&(!form.elements.mode.value||!form.elements.adult.checked))n=0;
  if(n>1&&!form.elements.budget.value)n=1;
  screen=n;error.hidden=true;form.hidden=n===3;results.hidden=n!==3;
  steps.forEach((s,i)=>{s.hidden=n!==i});progress.forEach((p,i)=>{if(i===Math.min(n,2))p.setAttribute('aria-current','step');else p.removeAttribute('aria-current')});
  document.querySelector('#step-label').textContent=`Étape ${Math.min(n+1,3)} / 3`;
  back.hidden=n===0;next.innerHTML=n===2?'Voir ma sélection <span aria-hidden="true">→</span>':'Continuer <span aria-hidden="true">→</span>';
  if(n===3)renderResults();
  if(focus)(n===3?document.querySelector('#results-title'):steps[n].querySelector('h3')).focus();
 }
 function go(n){history.pushState({companionStep:n},'', '#selection');setScreen(n);}
 function invalid(text,control){error.textContent=text;error.hidden=false;control.focus();}
 form.addEventListener('submit',event=>{
  event.preventDefault();
  if(screen===0){if(!form.elements.mode.value){invalid('Choisissez le texte ou la voix pour continuer.',form.elements.mode[0]);return;}if(!form.elements.adult.checked){invalid('Confirmez avoir 18 ans ou plus pour utiliser le sélecteur.',form.elements.adult);return;}}
  if(screen===1&&!form.elements.budget.value){invalid('Choisissez un budget, ou indiquez que vous ne fixez pas encore de plafond.',form.elements.budget[0]);return;}
  go(Math.min(screen+1,3));
 });
 back.addEventListener('click',()=>go(Math.max(0,screen-1)));
 function el(tag,text,className){const n=document.createElement(tag);if(text)n.textContent=text;if(className)n.className=className;return n;}
 function renderResults(){
  const prefs=preferences(),decisions=CompanionSelector.select(COMPANION_CATALOG.products,prefs),count=decisions.filter(d=>d.status==='match').length;
  document.querySelector('#results-title').textContent=count===0?'Aucune correspondance confirmée.':`${count} ${count===1?'piste documentée':'pistes documentées'}.`;
  const budget={'0':'Sans abonnement payant','15':'Plafond de 15 USD / mois','25':'Plafond de 25 USD / mois',any:'Sans plafond fixé'}[prefs.budget];
  document.querySelector('#results-summary').textContent=`${prefs.mode==='voice'?'Voix indispensable':'Texte suffisant'} · ${budget}. ${prefs.export?'Export autonome demandé. ':''}${prefs.memory?'Mémoire annoncée demandée. ':''}${prefs.offline?'Hors ligne demandé. ':''}`;
  const container=document.querySelector('#result-items');container.replaceChildren();
  if(!count){const empty=el('div','', 'empty-state');empty.append(el('h4','Vous pouvez ajuster vos critères.'),el('p','Les pistes avec inconnues ne constituent pas des correspondances confirmées. Les trois fiches restent accessibles pour comprendre les limites.'));container.append(empty);}
  for(const d of decisions){
   const p=COMPANION_CATALOG.products.find(p=>p.id===d.id),article=el('article','',`result-item ${d.status}`);article.dataset.product=p.id;article.dataset.status=d.status;
   const top=el('div','','result-top');top.append(el('h4',p.name),el('span',{match:'Critères documentés',unknown:'À vérifier',excluded:'Hors critères'}[d.status],'result-status'));article.append(top,el('p',d.plan,'plan'));
   const notes=[...d.reasons,...d.unknowns];if(d.status==='match')notes.push('Correspondance documentaire ; limites de la formule et qualité en français à vérifier.');
   const list=el('ul');notes.forEach(t=>list.append(el('li',t)));article.append(list);
   const a=el('a','Lire la fiche et ses sources ↗','text-link');a.href='#fiche-'+p.id;article.append(a);container.append(article);
  }
 }
 document.querySelector('#edit').addEventListener('click',()=>go(2));
 document.querySelector('#reset').addEventListener('click',()=>{form.reset();go(0);document.querySelector('.form-step h3').scrollIntoView({block:'center'});});
 window.addEventListener('popstate',e=>{if(Number.isInteger(e.state?.companionStep))setScreen(e.state.companionStep);});
 document.addEventListener('click',event=>{
  const a=event.target.closest('a[href^="#fiche-"]');if(!a)return;
  const detail=document.getElementById(a.getAttribute('href').slice(1));if(detail){event.preventDefault();history.pushState(history.state,'',a.getAttribute('href'));detail.open=true;detail.querySelector('summary').focus();detail.scrollIntoView({block:'start'});}
 });
 history.replaceState({companionStep:0},'',location.href);setScreen(0,false);
})();
