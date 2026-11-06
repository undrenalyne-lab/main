/* Drip Expresso — optional photo collections over the existing café route.
   Real category/photo hashes, native <dialog>, no dependencies. The original
   sections remain a normal document when JavaScript/dialog is unavailable. */
(() => {
  'use strict';
  if (/[?&]nojs\b/.test(location.search) || window.DripExplore) return;
  const root = document.documentElement;
  const ids = ['seats-overview', 'seats-inside', 'seats-front', 'seats-rear', 'objects', 'latest-views'];
  const labels = { 'seats-overview': 'All spaces', 'seats-inside': 'Inside', 'seats-front': 'Front terrace', 'seats-rear': 'Rear courtyard', objects: 'Details', 'latest-views': 'Latest views' };
  const sections = ids.map(id => document.getElementById(id)).filter(el => el?.classList.contains('photo-collection'));
  if (!sections.length || typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) return;

  const make = (tag, cls, text) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const button = (cls, text) => { const b = make('button', cls, text); b.type = 'button'; return b; };
  const link = (hash, text) => { const a = make('a', '', text); a.href = hash; return a; };
  const photos = new Map();
  const collections = new Map();
  for (const section of sections) {
    const heading = section.querySelector('h2');
    if (!heading) continue;
    if (!heading.id) heading.id = `${section.id}-title`;
    heading.tabIndex = -1;
    const entries = [];
    for (const a of section.querySelectorAll('a[data-photo-id][data-full]')) {
      const id = a.dataset.photoId;
      const thumb = a.querySelector('img');
      if (!id || photos.has(id) || !thumb) continue;
      const sourceCaption = a.closest('figure')?.querySelector('figcaption');
      // The no-JS link is navigation, not part of the photograph's caption.
      const title = sourceCaption?.querySelector('strong')?.textContent.trim();
      const description = sourceCaption?.querySelector('span')?.textContent.trim();
      const caption = [title, description].filter(Boolean).join(' — ') || thumb.alt || 'Café detail';
      const entry = { id, category: section.id, a, thumb, caption, full: a.dataset.full };
      photos.set(id, entry); entries.push(entry);
      a.setAttribute('aria-haspopup', 'dialog');
    }
    collections.set(section.id, { section, heading, entries });
  }
  if (!collections.size) return;

  const dialog = make('dialog', 'explore-dialog');
  dialog.id = 'explore-dialog';
  const head = make('header', 'explore-head');
  const closeButton = button('explore-close', '← Back to café');
  const practical = make('nav', 'explore-practical');
  practical.setAttribute('aria-label', 'Café information');
  practical.append(link('#menu', 'Menu'), link('#visit', 'Visit'));
  head.append(closeButton, practical);
  const tabs = make('nav', 'explore-tabs');
  tabs.setAttribute('aria-label', 'Photo collections');
  for (const [id] of collections) {
    const a = link(`#${id}`, labels[id]);
    a.dataset.gallery = '';
    tabs.appendChild(a);
  }
  const body = make('div', 'explore-body');
  const viewer = make('section', 'explore-viewer');
  viewer.hidden = true;
  const toolbar = make('div', 'explore-viewer-toolbar');
  const backButton = button('explore-back', '← Back to collection');
  const count = make('p', 'explore-counter');
  toolbar.append(backButton, count);
  const fullFigure = make('figure', 'explore-full');
  const imageWrap = make('div', 'explore-image-wrap');
  const caption = make('figcaption', 'explore-caption');
  caption.id = 'explore-photo-caption';
  caption.tabIndex = -1;
  fullFigure.append(imageWrap, caption);
  const status = make('p', 'explore-status');
  status.id = 'explore-photo-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const retry = button('explore-retry', 'Try loading again');
  retry.hidden = true;
  const photoNav = make('nav', 'explore-photo-nav');
  photoNav.setAttribute('aria-label', 'Photos in this collection');
  const previous = button('explore-prev', '← Previous photo');
  const next = button('explore-next', 'Next photo →');
  photoNav.append(previous, next);
  toolbar.appendChild(photoNav);
  viewer.append(toolbar, fullFigure, status, retry);
  for (const { section } of collections.values()) { section.hidden = true; body.appendChild(section); }
  body.appendChild(viewer);
  dialog.append(head, tabs, body);
  document.body.appendChild(dialog);
  root.classList.add('gallery-ready');

  let active = null;
  let renderedHash = null;
  let ticket = 0;
  let outsideFocus = null;
  let outsideHash = '#room';
  let intendedFocus = null;
  let photoState = 'idle';
  const scrollPositions = new Map();
  const fullReady = new Set();

  function readRoute(hash = location.hash) {
    let value;
    try { value = decodeURIComponent(hash.slice(1)); } catch (_) { return null; }
    if (collections.has(value)) return { category: value, photo: null };
    const photo = value.startsWith('photo-') ? photos.get(value.slice(6)) : null;
    return photo ? { category: photo.category, photo } : null;
  }
  const photoHash = entry => `#photo-${encodeURIComponent(entry.id)}`;
  function focus(el) {
    if (!el?.isConnected || !document.hasFocus() || el.closest('[hidden], [inert]')) return;
    el.focus({ preventScroll: true });
  }
  function rememberScroll() {
    if (active && !active.photo) scrollPositions.set(active.category, [body.scrollTop, dialog.scrollTop]);
  }
  function navigate(hash, target = null) {
    intendedFocus = target;
    if (location.hash === hash) { render(); return; }
    window.DripFacade?.rememberJourney?.();
    // Real hash navigation notifies the existing façade route handler as well.
    location.hash = hash;
  }
  function dismiss() {
    intendedFocus = 'outside';
    navigate(outsideHash, 'outside');
  }
  function leaveDialog() {
    rememberScroll();
    ++ticket;
    photoState = 'idle';
    if (dialog.open) dialog.close();
    root.classList.remove('gallery-open');
    active = null;
    renderedHash = null;
  }
  function settleOutside(hash, restore) {
    if (!restore) return;
    requestAnimationFrame(() => {
      if (location.hash !== hash || dialog.open) return;
      if (hash === '#menu') focus(document.getElementById('menu-title'));
      else if (hash === '#visit') focus(document.getElementById('visit-title'));
      else if (['#room', '#counter', '#courtyard', '#top'].includes(hash)) {
        const usable = outsideFocus?.isConnected && outsideFocus.getClientRects().length && !outsideFocus.closest('[inert], [hidden]');
        const section = document.getElementById(hash.slice(1));
        focus(usable ? outsideFocus : section?.querySelector('h2') || document.getElementById('room-title'));
      }
    });
  }
  function setPhoto(entry) {
    const mine = ++ticket;
    photoState = 'loading';
    const group = collections.get(entry.category);
    const index = group.entries.indexOf(entry);
    backButton.textContent = `← Back to ${labels[entry.category].toLowerCase()}`;
    count.textContent = `${index + 1} of ${group.entries.length}`;
    previous.disabled = index === 0;
    next.disabled = index === group.entries.length - 1;
    caption.textContent = entry.caption;
    status.textContent = 'Loading larger photo…';
    retry.hidden = true;
    imageWrap.dataset.state = 'loading';
    imageWrap.setAttribute('aria-busy', 'true');
    // A real thumbnail remains visible while the selected large file loads.
    // Its intrinsic dimensions reserve the same aspect ratio; no blank frame.
    const preview = entry.thumb.cloneNode(false);
    preview.removeAttribute('id');
    preview.removeAttribute('srcset');
    preview.removeAttribute('sizes');
    // Reuse the thumbnail already decoded in the collection; selecting its
    // smaller src would start a second request and briefly leave an empty frame.
    // A failed/unloaded thumbnail still has its independent small-file fallback.
    preview.src = entry.thumb.complete && entry.thumb.naturalWidth > 0
      ? entry.thumb.currentSrc : entry.thumb.getAttribute('src');
    preview.className = 'explore-image explore-preview';
    preview.loading = 'eager';
    preview.decoding = 'async';
    imageWrap.replaceChildren(preview);
    const full = new Image();
    full.className = 'explore-image';
    full.alt = entry.thumb.alt;
    full.decoding = 'async';
    const w = Number(entry.a.dataset.fullWidth || entry.thumb.getAttribute('width'));
    const h = Number(entry.a.dataset.fullHeight || entry.thumb.getAttribute('height'));
    if (w > 0 && h > 0) { full.width = w; full.height = h; }
    let settled = false;
    const current = () => mine === ticket && active?.photo?.id === entry.id && dialog.open;
    const fail = () => {
      if (settled || !current()) return;
      settled = true;
      photoState = 'error';
      imageWrap.dataset.state = 'error';
      imageWrap.setAttribute('aria-busy', 'false');
      status.textContent = 'The larger photo could not load. The preview is still available.';
      retry.hidden = false;
    };
    const loaded = () => {
      if (settled || !current()) return;
      if (!full.naturalWidth) { fail(); return; }
      settled = true;
      fullReady.add(entry.id);
      photoState = 'ready';
      imageWrap.dataset.state = 'ready';
      imageWrap.setAttribute('aria-busy', 'false');
      imageWrap.replaceChildren(full);
      status.textContent = '';
    };
    full.onerror = fail;
    full.onload = () => {
      if (typeof full.decode === 'function') full.decode().then(loaded, () => full.naturalWidth ? loaded() : fail());
      else loaded();
    };
    // No prefetch of neighbours or full images in other collections.
    full.src = entry.full;
    if (full.complete && full.naturalWidth) full.onload();
  }
  function render() {
    const hash = location.hash;
    const route = readRoute(hash);
    if (!route) {
      const wasOpen = dialog.open;
      const restore = intendedFocus === 'outside' || (wasOpen && dialog.contains(document.activeElement));
      intendedFocus = null;
      if (wasOpen) leaveDialog();
      settleOutside(hash, restore);
      return;
    }
    if (renderedHash === hash && dialog.open) { intendedFocus = null; return; }
    const old = active;
    rememberScroll();
    // A mouse click need not focus its link (notably in Safari). Keep the
    // explicit opener recorded by the click handler instead of an older focus.
    if (!dialog.open && !outsideFocus && document.activeElement !== document.body && !dialog.contains(document.activeElement)) outsideFocus = document.activeElement;
    active = route;
    renderedHash = hash;
    for (const [id, c] of collections) c.section.hidden = Boolean(route.photo) || id !== route.category;
    viewer.hidden = !route.photo;
    for (const a of tabs.querySelectorAll('a')) {
      if (a.hash === `#${route.category}`) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
    dialog.setAttribute('aria-labelledby', route.photo ? caption.id : collections.get(route.category).heading.id);
    dialog.dataset.collection = route.category;
    dialog.dataset.view = route.photo ? 'photo' : 'collection';
    root.classList.add('gallery-open');
    if (!dialog.open) dialog.showModal();
    if (route.photo) {
      setPhoto(route.photo);
      body.scrollTop = 0; dialog.scrollTop = 0;
      // Repeated keyboard activation keeps advancing photographs instead of
      // unexpectedly activating Back. At the end, focus the caption rather
      // than a newly disabled navigation button or a different action.
      focus(intendedFocus?.nodeType ? (intendedFocus.disabled ? caption : intendedFocus) : backButton);
    } else {
      ++ticket;
      photoState = 'idle';
      const saved = scrollPositions.get(route.category) || [0, 0];
      body.scrollTop = saved[0]; dialog.scrollTop = saved[1];
      const returning = old?.photo?.category === route.category ? old.photo.a : null;
      focus(intendedFocus?.nodeType ? intendedFocus : returning || collections.get(route.category).heading);
    }
    intendedFocus = null;
  }

  document.addEventListener('click', event => {
    const a = event.target.closest?.('a');
    if (!a || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || a.hasAttribute('download') || a.target === '_blank') return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || u.pathname !== location.pathname || u.search !== location.search || !readRoute(u.hash)) return;
    event.preventDefault();
    if (!dialog.contains(a)) {
      outsideFocus = a;
      outsideHash = ['#room', '#counter', '#courtyard', '#top', '#menu', '#visit'].includes(location.hash) ? location.hash : '#room';
    }
    navigate(u.hash);
  });
  closeButton.addEventListener('click', dismiss);
  backButton.addEventListener('click', () => {
    if (active?.photo) navigate(`#${active.category}`, active.photo.a);
  });
  function step(direction) {
    if (!active?.photo) return;
    const entries = collections.get(active.category).entries;
    const entry = entries[entries.indexOf(active.photo) + direction];
    if (entry) navigate(photoHash(entry), direction < 0 ? previous : next);
  }
  previous.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  retry.addEventListener('click', () => { if (active?.photo) setPhoto(active.photo); });
  dialog.addEventListener('cancel', event => { event.preventDefault(); dismiss(); });
  document.addEventListener('keydown', event => {
    // Dia can leave keyboard focus on HTML while the native modal is open.
    // Capture before the café's global handler, but never intercept a closed gallery.
    if (!dialog.open) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); dismiss(); return; }
    if (!active?.photo || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); event.stopPropagation(); step(event.key === 'ArrowLeft' ? -1 : 1);
    }
  }, true);
  practical.addEventListener('click', event => {
    const a = event.target.closest('a');
    if (!a || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    // The actual href keeps native navigation and the café router in charge.
    // Leave closure to the hash event so its destination can receive focus.
    intendedFocus = 'outside';
  });
  window.addEventListener('hashchange', render);
  window.addEventListener('popstate', render);
  window.DripExplore = Object.freeze({
    state: () => ({ open: dialog.open, category: active?.category || null, photo: active?.photo?.id || null, photoState, fullImagesLoaded: [...fullReady], categories: [...collections.keys()], photoCount: photos.size })
  });
  render();
})();
