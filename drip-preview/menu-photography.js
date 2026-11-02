/* Optional product enlargement. The original names, prices, anchors and img
   sources are served in HTML. Without JS each photo links to its large file. */
(() => {
 'use strict';
 if (/[?&]nojs\b/.test(location.search)) return;
 const menu = document.getElementById('menu');
 if (!menu) return;
 const links = [...menu.querySelectorAll('a[data-menu-photo]')];
 const entries = new Map();
 for (const link of links) {
  const item = document.getElementById(`item-${link.dataset.menuPhoto}`);
  if (!item) continue;
  entries.set(link.dataset.menuPhoto, { link, item, image: link.querySelector('img') });
 }
 // A failed small image never hides its name, price or source description.
 for (const img of menu.querySelectorAll('.menu-photo img, .menu-taste img')) {
  const fail = () => {
   const figure = img.closest('figure');
   if (!figure || figure.classList.contains('menu-image-failed')) return;
   figure.classList.add('menu-image-failed');
   const note = document.createElement('span');
   note.className = 'menu-image-note'; note.textContent = 'Photo unavailable';
   img.after(note);
  };
  img.addEventListener('error', fail);
  if (img.complete && !img.naturalWidth) fail();
 }
 if (typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal || !entries.size) return;
 const dialog = document.createElement('dialog');
 dialog.className = 'menu-photo-dialog';
 dialog.setAttribute('aria-labelledby','menu-photo-title');
 dialog.innerHTML = '<header class="menu-photo-dialog-header"><button type="button" data-photo-close>← Back to menu</button><p>Drip Expresso · Bayswater</p></header><div class="menu-photo-detail"><figure class="menu-photo-large"></figure><div class="menu-photo-info"><p class="photo-category"></p><h2 id="menu-photo-title"></h2><p class="photo-price"></p><p class="photo-description"></p><p class="photo-status" role="status" aria-live="polite"></p><button type="button" data-photo-retry hidden>Try loading again</button><p class="photo-note"></p><p><a class="photo-item-link" href="#menu">Go to this item on the menu</a></p></div></div>';
 document.body.appendChild(dialog);
 const $ = s => dialog.querySelector(s);
 const close = $('[data-photo-close]'), retry = $('[data-photo-retry]');
 let active = null, originFocus = null, originScroll = 0, ticket = 0, closing = false;
 function focus(el) { if (el?.isConnected && document.hasFocus() && !el.closest('[inert],[hidden]')) el.focus({preventScroll:true}); }
 function hide(restore=true) {
  if (!active && !dialog.open) return;
  closing = false;
  ++ticket;
  if (dialog.open) dialog.close();
  document.documentElement.classList.remove('menu-photo-open');
  if (restore) {
   const scroll=originScroll, target=originFocus, mine=ticket, route=location.hash;
   requestAnimationFrame(()=>requestAnimationFrame(()=>{
    if(!dialog.open && mine===ticket && location.hash===route){menu.scrollTop=scroll;focus(target);}
   }));
  }
  active = null;
 }
 function load(entry) {
  const mine = ++ticket, wrap = $('.menu-photo-large'), status = $('.photo-status');
  retry.hidden = true; status.textContent = 'Loading larger photo…';
  const preview = entry.image.cloneNode(false);
  preview.removeAttribute('srcset'); preview.removeAttribute('sizes'); preview.loading = 'eager';
  preview.src = entry.image.currentSrc || entry.image.getAttribute('src');
  wrap.replaceChildren(preview);
  const full = new Image(); full.alt = entry.image.alt;
  full.width = Number(entry.link.dataset.fullWidth); full.height = Number(entry.link.dataset.fullHeight);
  full.decoding = 'async';
  let settled = false;
  const current = () => mine === ticket && active === entry && dialog.open;
  const failed = () => { if (settled || !current()) return; settled=true; clearTimeout(timer); status.textContent='The larger photo could not load. The menu details remain available.'; retry.hidden=false; };
  const timer = setTimeout(failed,12000);
  full.onerror = failed;
  full.onload = async () => {
   try { await full.decode(); } catch (_) { failed(); return; }
   if (settled || !current()) return;
   settled=true; clearTimeout(timer); wrap.replaceChildren(full); status.textContent='';
  };
  full.src = entry.link.href;
 }
 function show(entry,fromHistory=false) {
  closing = false;
  if (!dialog.open) { originFocus=entry.link; originScroll=menu.scrollTop; }
  active=entry;
  $('.photo-category').textContent=entry.item.querySelector('.item-context')?.textContent || '';
  $('#menu-photo-title').textContent=entry.item.querySelector('.nm')?.textContent || '';
  $('.photo-description').textContent=entry.link.dataset.description || '';
  $('.photo-note').textContent=entry.link.dataset.note || '';
  $('.photo-note').hidden=!entry.link.dataset.note;
  $('.photo-price').textContent=entry.link.dataset.prices || '';
  $('.photo-item-link').href=`#${entry.item.id}`;
  if (!dialog.open) dialog.showModal();
  document.documentElement.classList.add('menu-photo-open');
  focus(close); load(entry);
  if (!fromHistory) history.pushState({...history.state,dripMenuPhoto:entry.link.dataset.menuPhoto,dripMenuReturnHash:location.hash},'',location.pathname+location.search+`#${entry.item.id}`);
 }
 function dismiss() {
  if (!dialog.open || closing) return;
  closing = true;
  if (history.state?.dripMenuPhoto) history.back();
  else hide();
 }
 for (const [id,entry] of entries) {
  entry.link.setAttribute('aria-haspopup','dialog');
  entry.link.addEventListener('click',ev=>{
   if (ev.button!==0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
   ev.preventDefault();show(entry);
  });
 }
 close.addEventListener('click',dismiss);
 dialog.addEventListener('cancel',ev=>{ev.preventDefault();dismiss();});
 dialog.addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.preventDefault();ev.stopPropagation();dismiss();}});
 dialog.addEventListener('click',ev=>{if(ev.target===dialog){const r=dialog.getBoundingClientRect();if(ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom)dismiss();}});
 retry.addEventListener('click',()=>{if(active)load(active);});
 $('.photo-item-link').addEventListener('click',ev=>{
  ev.preventDefault(); const entry=active; if(!entry)return;
  history.replaceState({drip:'menu'},'',location.pathname+location.search+`#${entry.item.id}`);
  hide(false); entry.item.scrollIntoView({block:'center',behavior:'instant'}); focus(entry.item);
 });
 window.addEventListener('popstate',()=>{
  const entry=entries.get(history.state?.dripMenuPhoto);
  if(entry) show(entry,true); else hide();
 });
 window.addEventListener('hashchange',()=>{if(dialog.open && !history.state?.dripMenuPhoto)hide(false);});
 window.DripMenuPhotos={get active(){return active?.link.dataset.menuPhoto||null;},get open(){return dialog.open;}};
})();
