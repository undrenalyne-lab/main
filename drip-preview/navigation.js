/* The main café page is a normal document. All movement-driven storytelling
   lives in walk/index.html, which visitors choose with “Start the walk”. */
(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.remove('stage', 'entry-journey');
  root.classList.add('fixed');
  const rail = document.querySelector('.places-nav');
  const links = [...document.querySelectorAll('.site-nav [data-zone], .places-nav a')];
  const sections = [...document.querySelectorAll('main > section[id]')];
  function sectionForHash() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { return 'welcome'; }
    if (id === 'cafe') return 'room';
    const target = document.getElementById(id);
    if (target?.closest('.photo-collection')) return 'room';
    return target?.closest('main > section')?.id || 'welcome';
  }
  function mark(section) {
    const zone = section === 'welcome' ? 'street' : ['menu', 'visit'].includes(section) ? section : 'room';
    for (const a of links) {
      const current = a.dataset.zone === zone || a.hasAttribute('data-gallery') && a.hash === location.hash;
      if (current) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    }
  }
  function revealLink(a) {
    if (!a || !rail || !rail.contains(a)) return;
    const outer = rail.getBoundingClientRect(), inner = a.getBoundingClientRect();
    if (inner.left < outer.left + 12) rail.scrollLeft -= outer.left + 12 - inner.left;
    else if (inner.right > outer.right - 12) rail.scrollLeft += inner.right - outer.right + 12;
  }
  function sync() { mark(sectionForHash()); }
  rail?.addEventListener('focusin', event => revealLink(event.target.closest('a')));
  window.addEventListener('hashchange', sync);
  window.addEventListener('popstate', sync);
  // The category picker closes on selection. Anchor movement stays native.
  document.addEventListener('click', event => {
    const a = event.target.closest('a[data-menu-jump]');
    if (a) document.querySelector('.menu-index')?.removeAttribute('open');
  });
  // Highlight the section in view without changing the URL or scrolling the page.
  let queued = false;
  window.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      if (document.querySelector('dialog[open]')) return;
      const line = (rail?.getBoundingClientRect().bottom || document.querySelector('.site-header')?.getBoundingClientRect().bottom || 94) + 80;
      const current = sections.filter(s => s.parentElement?.id === 'main' && s.getBoundingClientRect().height > 0 && s.getBoundingClientRect().top <= line).at(-1);
      if (current) mark(current.id);
    });
  }, { passive: true });
  window.DripFacade = { mode: 'fixed' };
  sync();
})();
