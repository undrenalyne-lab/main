const controls=document.querySelector('.browse-controls');
const search=document.querySelector('#menu-search');
const count=document.querySelector('#result-count');
const select=document.querySelector('#category-jump');
const sections=[...document.querySelectorAll('.menu-category')];
const buttons=[...document.querySelectorAll('[data-filter]')];
let active='all';
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function filter(){
 const query=normalize(search.value.trim());let total=0;
 for(const section of sections){let visible=0;const categoryText=section.querySelector('h3').textContent;for(const item of section.querySelectorAll('.menu-item')){const match=(active==='all'||section.dataset.group===active)&&normalize(item.textContent+' '+(item.dataset.subgroup||'')).includes(query);item.hidden=!match;if(match)visible++;}for(const label of section.querySelectorAll('.subgroup-heading,.group-footnote'))label.hidden=![...section.querySelectorAll('.menu-item')].some(i=>!i.hidden&&i.dataset.subgroup===label.dataset.subgroup);section.hidden=visible===0;total+=visible;}
 buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===active)));
 document.querySelectorAll('[data-category-link]').forEach(a=>a.hidden=document.getElementById(a.getAttribute('href').slice(1)).hidden);
 [...select.options].forEach(o=>{if(o.value)o.disabled=document.getElementById(o.value).hidden;});select.value='';
 count.textContent=`${total} ${total===1?'item':'items'}`;document.querySelector('#no-results').hidden=total!==0;
}
buttons.forEach(b=>b.addEventListener('click',()=>{active=b.dataset.filter;filter();}));search.addEventListener('input',filter);
function goToCategory(id){const target=document.getElementById(id);if(!target?.classList.contains('menu-category'))return;active='all';search.value='';filter();target.querySelector('h3').focus({preventScroll:true});target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
select.addEventListener('change',()=>{if(select.value){const id=select.value;history.replaceState(null,'','#'+id);goToCategory(id);}});
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',event=>{const id=a.getAttribute('href').slice(1);if(document.getElementById(id)?.classList.contains('menu-category')){event.preventDefault();history.pushState(null,'','#'+id);goToCategory(id);}}));
document.querySelector('#reset-search').addEventListener('click',()=>{search.value='';active='all';filter();search.focus();});
controls.hidden=false;document.querySelector('.menu-tools').hidden=false;filter();
if(location.hash)goToCategory(location.hash.slice(1));
