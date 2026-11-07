/* Accessible disclosure navigation and opt-in short reveals. No scroll driver. */
(() => {
  'use strict';
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const nav = document.querySelector('#primary-navigation');
  const mobileToggle = document.querySelector('.mobile-nav-toggle');
  const items = [...document.querySelectorAll('.nav-item')];
  const narrow = matchMedia('(max-width:759px)');
  const hover = matchMedia('(hover:hover) and (pointer:fine)');
  if (!header || !nav || !mobileToggle) return;
  let closeTimer;
  const scrim = document.createElement('div');
  scrim.className = 'nav-scrim';
  scrim.hidden = true;
  scrim.setAttribute('aria-hidden', 'true');
  document.body.append(scrim);
  const trigger = item => item.querySelector('.nav-trigger');
  function syncScrim() {
    scrim.hidden = !header.classList.contains('mobile-open') && !items.some(item => item.classList.contains('is-open'));
  }
  function closeItems(returnFocus = false) {
    clearTimeout(closeTimer);
    for (const item of items) {
      const button = trigger(item);
      if (returnFocus && item.contains(document.activeElement)) button.focus();
      item.classList.remove('is-open');
      delete item.dataset.openReason;
      button.setAttribute('aria-expanded', 'false');
      document.getElementById(button.getAttribute('aria-controls')).hidden = true;
    }
    syncScrim();
  }
  function openItem(item, reason = 'click') {
    clearTimeout(closeTimer);
    closeItems();
    item.classList.add('is-open');
    item.dataset.openReason = reason;
    const button = trigger(item);
    button.setAttribute('aria-expanded', 'true');
    document.getElementById(button.getAttribute('aria-controls')).hidden = false;
    syncScrim();
  }
  function closeMobile(returnFocus = false) {
    closeItems();
    if (returnFocus) mobileToggle.focus();
    header.classList.remove('mobile-open');
    mobileToggle.setAttribute('aria-expanded', 'false');
    mobileToggle.querySelector('.toggle-label').textContent = 'Explore';
    syncScrim();
  }
  root.classList.add('nav-ready');
  closeItems();
  for (const item of items) {
    const button = trigger(item);
    button.addEventListener('click', () => {
      if (item.dataset.openReason === 'hover') { item.dataset.openReason = 'click'; return; }
      item.classList.contains('is-open') ? closeItems() : openItem(item);
    });
    button.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown') {
        event.preventDefault(); openItem(item);
        item.querySelector('.nav-panel a')?.focus();
      }
    });
    item.addEventListener('pointerenter', event => {
      const focusedPanel = items.find(other => other.classList.contains('is-open') && other.querySelector('.nav-panel').contains(document.activeElement));
      if (focusedPanel && focusedPanel !== item) return;
      if (hover.matches && !narrow.matches && event.pointerType !== 'touch') openItem(item, 'hover');
    });
    item.addEventListener('pointerleave', () => {
      if (hover.matches && !narrow.matches) closeTimer = setTimeout(() => {
        const focusIsInOpenItem = items.some(open => open.classList.contains('is-open') && open.contains(document.activeElement));
        if (!focusIsInOpenItem) closeItems();
      }, 180);
    });
  }
  mobileToggle.addEventListener('click', () => {
    if (header.classList.contains('mobile-open')) { closeMobile(); return; }
    header.classList.add('mobile-open');
    mobileToggle.setAttribute('aria-expanded', 'true');
    mobileToggle.querySelector('.toggle-label').textContent = 'Close';
    syncScrim();
  });
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) closeMobile();
  });
  document.addEventListener('click', event => {
    if (!header.contains(event.target)) closeMobile();
  });
  document.addEventListener('focusin', event => {
    if (!header.contains(event.target)) closeMobile();
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (items.some(item => item.classList.contains('is-open'))) { closeItems(true); return; }
    if (header.classList.contains('mobile-open')) closeMobile(true);
  });
  narrow.addEventListener('change', () => closeMobile());
  window.addEventListener('hashchange', () => closeMobile());
  window.addEventListener('pageshow', () => closeMobile());
  // Observe entry only; content stays visible without JS or when motion is reduced.
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion:reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed'); observer.unobserve(entry.target);
      }
    }, { threshold:.12 });
    document.querySelectorAll('.room-story, .menu-entry-copy, .zone-visit .sheet').forEach(el => {
      el.classList.add('reveal-once'); observer.observe(el);
    });
  }
})();
