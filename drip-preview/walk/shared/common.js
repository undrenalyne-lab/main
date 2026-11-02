/* Utilitaires communs : création d'éléments, photos dérivées, préférence de mouvement,
   annonces pour lecteurs d'écran et dialogues. Script classique (fonctionne aussi en file://). */
(function () {
  'use strict';

  const BASE = window.DRIP_BASE || '';
  const PHOTOS = window.DRIP_PHOTOS || {};

  const store = {
    get(key) {
      try { return window.localStorage.getItem(key); } catch (e) { return null; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, value); } catch (e) { /* stockage indisponible : préférence non mémorisée */ }
    }
  };

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (value === null || value === undefined || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key === 'on') for (const [type, fn] of Object.entries(value)) node.addEventListener(type, fn);
      else if (key === 'style') Object.assign(node.style, value);
      else if (key === 'dataset') Object.assign(node.dataset, value);
      else if (value === true) node.setAttribute(key, '');
      else node.setAttribute(key, value);
    }
    for (const child of children.flat()) {
      if (child === null || child === undefined || child === false) continue;
      node.append(child.nodeType ? child : document.createTextNode(String(child)));
    }
    return node;
  }

  const SVG_NS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs, ...children) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (value !== null && value !== undefined) node.setAttribute(key, value);
    }
    for (const child of children.flat()) if (child) node.append(child);
    return node;
  }

  const ICONS = {
    cup: 'M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9Z M16 10h1.5a2.5 2.5 0 0 1 0 5H16 M8 3.5c0 1 1 1.5 1 2.5 M11.5 3.5c0 1 1 1.5 1 2.5',
    clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7v5l3 2',
    pin: 'M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21Z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
    sound: 'M4 10v4h3.5L12 18V6L7.5 10H4Z M15.5 9a4.5 4.5 0 0 1 0 6 M18 6.5a8 8 0 0 1 0 11',
    soundOff: 'M4 10v4h3.5L12 18V6L7.5 10H4Z M16 9.5l5 5 M21 9.5l-5 5',
    motion: 'M3 12c2.5-4 5-4 7.5 0s5 4 7.5 0 M3 17c2.5-4 5-4 7.5 0s5 4 7.5 0',
    still: 'M4 12h16 M4 17h16',
    back: 'M15 18l-6-6 6-6',
    forward: 'M9 6l6 6-6 6',
    up: 'M6 15l6-6 6 6',
    down: 'M6 9l6 6 6-6',
    left: 'M15 18l-6-6 6-6',
    right: 'M9 6l6 6-6 6',
    plus: 'M12 7v10 M7 12h10',
    close: 'M6 6l12 12 M18 6L6 18',
    grid: 'M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z',
    map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z M9 4v14 M15 6v14',
    eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z'
  };
  function icon(name, extra) {
    const node = svg('svg', { class: 'icon' + (extra ? ' ' + extra : ''), viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' });
    for (const d of ICONS[name].split(' M').map((p, i) => (i ? 'M' + p : p))) node.append(svg('path', { d }));
    return node;
  }

  function photo(key) {
    const p = PHOTOS[key];
    if (!p) throw new Error('Photo inconnue : ' + key);
    return p;
  }
  const largest = (key) => photo(key).files.reduce((a, b) => (a.w > b.w ? a : b));
  const smallest = (key) => photo(key).files.reduce((a, b) => (a.w < b.w ? a : b));
  const srcset = (key) => photo(key).files.map((f) => `${BASE}${f.path} ${f.w}w`).join(', ');
  const aspect = (key) => { const c = photo(key).crop; return c[2] / c[3]; };

  // Coordonnées de l'original -> pourcentages dans le dérivé recadré.
  function pct(key, x, y) {
    const [cx, cy, cw, ch] = photo(key).crop;
    return { x: ((x - cx) / cw) * 100, y: ((y - cy) / ch) * 100 };
  }
  function rectPct(key, r) {
    const [cx, cy, cw, ch] = photo(key).crop;
    return { x: ((r[0] - cx) / cw) * 100, y: ((r[1] - cy) / ch) * 100, w: (r[2] / cw) * 100, h: (r[3] / ch) * 100 };
  }
  function inside(key, x, y, margin) {
    const p = pct(key, x, y);
    const m = margin === undefined ? 3 : margin;
    return p.x >= m && p.x <= 100 - m && p.y >= m && p.y <= 100 - m;
  }

  // Image responsive avec repli lisible si le fichier manque.
  function img(key, opts) {
    const o = opts || {};
    const big = largest(key);
    const node = el('img', {
      src: BASE + (o.small ? smallest(key) : big).path,
      srcset: srcset(key),
      sizes: o.sizes || '100vw',
      width: big.w,
      height: big.h,
      alt: o.alt || '',
      decoding: 'async',
      loading: o.eager ? 'eager' : 'lazy',
      class: o.class || null,
      draggable: 'false'
    });
    node.addEventListener('error', () => {
      const box = el('div', { class: 'photo-missing', role: 'img', 'aria-label': o.alt || 'Photo unavailable' },
        el('strong', { text: 'Photo unavailable' }), o.alt ? el('span', { text: o.alt }) : null);
      node.replaceWith(box);
      document.dispatchEvent(new CustomEvent('drip:missing', { detail: { key } }));
    }, { once: true });
    return node;
  }

  function preload(key, sizes) {
    const image = new Image();
    image.decoding = 'async';
    image.sizes = sizes || '100vw';
    image.srcset = srcset(key);
    image.src = BASE + largest(key).path;
    return image;
  }

  // Préférence de mouvement : système, paramètre ?motion=reduce, ou bouton (mémorisé si possible).
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  let manual = store.get('drip-motion');
  if (new URLSearchParams(window.location.search).get('motion') === 'reduce') manual = 'reduce';
  const reduced = () => (manual ? manual === 'reduce' : mq.matches);
  function applyMotion() {
    document.documentElement.classList.toggle('reduce-motion', reduced());
    document.dispatchEvent(new CustomEvent('drip:motion', { detail: { reduced: reduced() } }));
  }
  mq.addEventListener('change', applyMotion);
  applyMotion();

  function motionToggle() {
    const label = el('span');
    const button = el('button', { type: 'button', class: 'tool-btn motion-toggle' });
    function render() {
      const r = reduced();
      button.setAttribute('aria-pressed', String(r));
      button.replaceChildren(icon(r ? 'still' : 'motion'), label);
      label.textContent = r ? 'Motion off' : 'Motion on';
      button.title = r ? 'Animations are reduced' : 'Reduce animations';
    }
    button.addEventListener('click', () => {
      manual = reduced() ? 'full' : 'reduce';
      store.set('drip-motion', manual);
      applyMotion();
    });
    document.addEventListener('drip:motion', render);
    render();
    return button;
  }

  let live;
  function announce(message) {
    if (!live) {
      live = el('div', { class: 'visually-hidden', 'aria-live': 'polite', 'aria-atomic': 'true' });
      document.body.append(live);
    }
    live.textContent = '';
    window.setTimeout(() => { live.textContent = message; }, 40);
  }

  // Dialogue modal : Échap et clic sur le fond ferment, le focus revient au déclencheur.
  function modal(dialog) {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', () => {
      const opener = dialog._opener;
      dialog._opener = null;
      if (opener && document.contains(opener) && !opener.closest('[inert]')) opener.focus();
    });
    return dialog;
  }
  function openModal(dialog, opener) {
    dialog._opener = opener || document.activeElement;
    if (!dialog.open) dialog.showModal();
  }

  window.Drip = { el, svg, icon, photo, img, preload, srcset, largest, aspect, pct, rectPct, inside, reduced, motionToggle, announce, modal, openModal, store, base: BASE };
})();
