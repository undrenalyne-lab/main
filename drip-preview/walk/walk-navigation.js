/* Optional navigation only. Every destination is also a native HTML link. */
(() => {
  'use strict';
  const sections = [...document.querySelectorAll('.beat[id]')];
  const ids = new Set(sections.map(section => section.id));
  const jumpMenu = document.querySelector('.walk-jump');
  const links = [...document.querySelectorAll('.walk-jump [data-walk-jump]')];

  function idFromHash(hash) {
    try { const id = decodeURIComponent(hash.slice(1)); return ids.has(id) ? id : null; }
    catch (_) { return null; }
  }
  function mark(id) {
    for (const link of links) {
      if (idFromHash(link.hash) === id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }
  document.addEventListener('drip:walk-view', event => mark(event.detail.id));
  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-walk-jump]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const id = idFromHash(link.hash);
    if (!id) return;
    jumpMenu.open = false;
    if (window.DripWalk?.jumpToView(id)) event.preventDefault();
    mark(id);
  });
  function restore() {
    const id = idFromHash(location.hash);
    if (!id) return;
    window.DripWalk?.jumpToView(id, { history: false, focus: false });
    mark(id);
  }
  window.addEventListener('hashchange', restore);
  window.addEventListener('popstate', restore);
  jumpMenu.addEventListener('keydown', event => {
    if (event.key === 'Escape' && jumpMenu.open) {
      event.preventDefault();
      jumpMenu.open = false;
      jumpMenu.querySelector('summary').focus();
    }
  });
  mark(idFromHash(location.hash) || sections[0].id);
  restore();
})();
