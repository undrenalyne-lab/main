const menuDialog=document.querySelector('#menu-dialog'),galleryDialog=document.querySelector('#gallery-dialog'),popover=document.querySelector('#menu-popover'),navButton=document.querySelector('.nav-button'),nav=document.querySelector('nav'),mobileToggle=document.querySelector('.mobile-toggle');let category='all',lastTrigger=null;
function closeNav(){nav.classList.remove('open');mobileToggle.setAttribute('aria-expanded','false');mobileToggle.setAttribute('aria-label','Open navigation');setPopover(false)}
function setPopover(open){popover.classList.toggle('open',open);navButton.setAttribute('aria-expanded',String(open))}
navButton.addEventListener('click',()=>setPopover(navButton.getAttribute('aria-expanded')!=='true'));
const menuNav=document.querySelector('.menu-nav');// Click disclosure avoids hover opening immediately toggling shut on click.
menuNav.addEventListener('focusout',e=>{if(!menuNav.contains(e.relatedTarget))setPopover(false)});
mobileToggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');mobileToggle.setAttribute('aria-expanded',String(open));mobileToggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');if(!open)setPopover(false)});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeNav));
// Keyboard: leaving the open mobile panel closes it, so it never stays open over the page.
nav.addEventListener('focusout',e=>{if(nav.classList.contains('open')&&e.relatedTarget&&!nav.contains(e.relatedTarget)&&e.relatedTarget!==mobileToggle)closeNav()});
// Crossing the mobile breakpoint (rotation, zoom, resize) resets the navigation state.
matchMedia('(max-width: 700px)').addEventListener('change',closeNav);
function renderMenu(){
  // Search every word independently, ignoring accents, punctuation and spacing.
  // Keep the source data and its display order unchanged.
  const normalize=value=>value.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const query=normalize(document.querySelector('input[type=search]').value);
  const terms=query?query.split(/\s+/):[];
  const container=document.querySelector('#menu-items');container.replaceChildren();
  const chapters=[['breakfast','01','Breakfast'],['lunch','02','Lunch'],['coffee-bites','03','Coffee & quick bites'],['cold-drinks','04','Cold drinks & matcha']];
  let count=0;
  for(const [chapter,number,label] of chapters){
    const matches=window.menuItems.filter(item=>{
      if((category!=='all'&&item.group!==category&&item.chapter!==category&&item.category!==category)||item.chapter!==chapter)return false;
      const text=normalize(`${item.name} ${item.description} ${item.sectionLabel} ${item.category}`);
      return terms.every(term=>text.includes(term));
    });
    if(!matches.length)continue;
    const heading=document.createElement('h3');heading.className='menu-chapter';heading.textContent=`${number} / ${label}`;container.append(heading);
    matches.forEach(item=>{
      const row=document.createElement('article');row.className='menu-item'+(item.photo?' has-photo':'');row.id=item.id;
      const copy=document.createElement('div');copy.className='dish-copy';
      const section=document.createElement('p');section.className='dish-section';section.textContent=item.sectionLabel;copy.append(section);
      const title=document.createElement('h4');title.textContent=item.name;copy.append(title);
      const prices=document.createElement('p');prices.className='dish-price';prices.textContent=item.displayPrice||item.prices.join(' / ');copy.append(prices);
      if(item.sectionNote){const note=document.createElement('p');note.className='dish-description section-note';note.textContent=item.sectionNote;copy.append(note)}
      if(item.description){const description=document.createElement('p');description.className='dish-description';description.textContent=item.description;copy.append(description)}
      if(item.photo){
        const figure=document.createElement('figure');figure.className='dish-photo';
        const link=document.createElement('a');link.href=item.photo.full;link.target='_blank';link.rel='noopener';link.setAttribute('aria-label',`View full photo of ${item.name} (opens in a new tab)`);
        const img=document.createElement('img');img.src=item.photo.src;if(item.photo.srcset)img.srcset=item.photo.srcset;img.sizes='(max-width: 600px) 120px, 240px';img.width=item.photo.width;img.height=item.photo.height;img.alt=item.photo.alt;img.loading='lazy';img.decoding='async';
        link.append(img);figure.append(link);row.append(figure);
        if(item.photo.note){const note=document.createElement('p');note.className='dish-photo-note';note.textContent=item.photo.note;copy.append(note)}
      }
      row.append(copy);container.append(row);count++;
    });
  }
  document.querySelector('.empty').hidden=count>0;
  document.querySelector('#menu-count').textContent=`${count} ${count===1?'item':'items'}`;
  // The two tile-only filters (Burgers & Toasties, Matcha) show their chip only while active,
  // so a filtered list always displays which filter is applied.
  document.querySelectorAll('[data-filter]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.filter===category));if('contextual' in b.dataset)b.hidden=b.dataset.filter!==category});
}
// Keep the pressed chip visible inside the horizontally scrolling filter row (narrow screens).
function revealActiveFilter(){
  const strip=document.querySelector('.menu-filter-strip'),chip=strip&&strip.querySelector('[aria-pressed=true]');
  if(!chip||strip.scrollWidth<=strip.clientWidth)return;
  // The right padding is the faded edge of the row: the pressed chip must sit before it.
  const s=strip.getBoundingClientRect(),c=chip.getBoundingClientRect(),edge=Math.max(8,parseFloat(getComputedStyle(strip).paddingRight)||0);
  if(c.left<s.left+8)strip.scrollLeft+=c.left-s.left-8;
  else if(c.right>s.right-edge)strip.scrollLeft+=c.right-s.right+edge;
}
function openDialog(dialog,trigger){
  // Dropdown children become hidden on opening. Restore focus to their visible owner.
  lastTrigger=nav.contains(trigger)?(matchMedia('(max-width: 700px)').matches?mobileToggle:menuNav.contains(trigger)?navButton:trigger):trigger;
  closeNav();dialog.showModal();dialog.scrollTop=0;
  if(dialog===menuDialog)revealActiveFilter();
}
function resetMenu(){category='all';document.querySelector('input[type=search]').value='';renderMenu();revealActiveFilter();document.querySelector('input[type=search]').focus()}
document.querySelector('#menu-reset').addEventListener('click',resetMenu);
document.querySelectorAll('[data-menu]').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.menu;document.querySelector('input[type=search]').value='';renderMenu();openDialog(menuDialog,button)}));document.querySelectorAll('[data-gallery]').forEach(button=>button.addEventListener('click',()=>openDialog(galleryDialog,button)));document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.filter;renderMenu();revealActiveFilter()}));document.querySelector('input[type=search]').addEventListener('input',renderMenu);
for(const dialog of [menuDialog,galleryDialog]){dialog.querySelector('.close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});dialog.addEventListener('close',()=>{const target=lastTrigger?.getClientRects().length?lastTrigger:(matchMedia('(max-width: 700px)').matches?mobileToggle:navButton);target?.focus()})}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const wasOpen=navButton.getAttribute('aria-expanded')==='true',wasMobileOpen=nav.classList.contains('open');closeNav();if(!menuDialog.open&&!galleryDialog.open){if(wasMobileOpen)mobileToggle.focus();else if(wasOpen)navButton.focus()}}});document.addEventListener('click',e=>{if(!menuNav.contains(e.target))setPopover(false);if(!nav.contains(e.target)&&!mobileToggle.contains(e.target))closeNav()});
