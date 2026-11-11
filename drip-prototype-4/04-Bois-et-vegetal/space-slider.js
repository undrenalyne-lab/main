/* Progressive enhancement: native horizontal scrolling works without JavaScript. */
(()=>{
 const section=document.querySelector('#space'),track=section?.querySelector('.space-track');
 if(!track)return;
 const slides=[...track.querySelectorAll('.space-slide')],choices=[...section.querySelectorAll('[data-space-index]')],position=section.querySelector('.space-position b'),announcement=section.querySelector('.space-announcement');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let active=0,settle;
 function update(index,announce=true){
  active=(index+slides.length)%slides.length;
  choices.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===active)));
  position.textContent=String(active+1).padStart(2,'0');
  if(announce)announcement.textContent=`${active+1} of ${slides.length}: ${slides[active].querySelector('figcaption span').textContent}`;
 }
 function go(index){clearTimeout(settle);update(index);track.scrollTo({left:active*track.clientWidth,behavior:reduced.matches?'instant':'smooth'});}
 section.querySelector('.space-prev').addEventListener('click',()=>go(active-1));
 section.querySelector('.space-next').addEventListener('click',()=>go(active+1));
 choices.forEach((button,i)=>button.addEventListener('click',()=>go(i)));
 track.addEventListener('keydown',e=>{const key=e.key;if(!['ArrowLeft','ArrowRight','Home','End'].includes(key))return;e.preventDefault();go(key==='Home'?0:key==='End'?slides.length-1:active+(key==='ArrowRight'?1:-1));});
 track.addEventListener('scroll',()=>{clearTimeout(settle);settle=setTimeout(()=>update(Math.round(track.scrollLeft/track.clientWidth)),140);},{passive:true});
 let width=track.clientWidth;
 new ResizeObserver(()=>{if(Math.abs(width-track.clientWidth)<1)return;width=track.clientWidth;clearTimeout(settle);track.scrollTo({left:active*width,behavior:'instant'});}).observe(track);
 section.querySelector('.space-controls').hidden=false;section.querySelector('.space-choices').hidden=false;update(0,false);
})();
