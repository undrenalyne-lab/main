/* Progressive enhancement: all content and links work without JavaScript. */
(() => {
  document.documentElement.classList.add('js');
  const menu = document.querySelector('.menu-toggle');
  const nav = document.getElementById('navigation');
  const label = (open) => { menu.firstChild.textContent = `${menu.dataset.openLabel} `; menu.setAttribute('aria-label', open ? menu.dataset.closeLabel : menu.dataset.openLabel); menu.lastElementChild.textContent = open ? '−' : '+'; };
  function setMenu(open, restoreFocus = false) {
    nav.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded', String(open));
    label(open);
    if (restoreFocus) menu.focus();
  }
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') setMenu(false, true); });
  document.addEventListener('click', event => { if (!event.target.closest('.site-header') && menu.getAttribute('aria-expanded') === 'true') setMenu(false); });
  window.matchMedia('(min-width: 761px)').addEventListener('change', () => setMenu(false));

  const tablist = document.querySelector('.service-tabs');
  const tabs = [...tablist.querySelectorAll('.service-tab')];
  const panels = [...document.querySelectorAll('.service-panel')];
  tablist.setAttribute('role', 'tablist');
  tabs.forEach((tab, i) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[i].id);
    panels[i].setAttribute('role', 'tabpanel');
    panels[i].setAttribute('aria-labelledby', tab.id);
    panels[i].tabIndex = 0;
    tab.addEventListener('click', event => { event.preventDefault(); activate(i); });
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (i + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (i + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); activate(next); tabs[next].focus(); }
    });
  });
  function activate(index) {
    tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; panels[i].hidden = i !== index; });
  }
  function syncHash() {
    const index = panels.findIndex(panel => `#${panel.id}` === location.hash);
    if (index >= 0) activate(index);
  }
  activate(0); syncHash(); window.addEventListener('hashchange', syncHash);
})();
