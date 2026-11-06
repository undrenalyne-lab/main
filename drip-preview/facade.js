/* Drip Expresso — façade → counter → menu.
   Classic script (also works from file://). The page is complete without it.

   One spine, one number: pos.
     0  the street (façade)          ← "Visit" opens its sheet here
     1  close to the door
     2  inside the threshold          ← "The café"
     3  at the counter                ← "Menu"
   Every frame is a pure function of pos and of the sheets' openness, so a move can be
   reversed or retargeted at any moment and never freezes on a double exposure. */
(() => {
  'use strict';
  if (/[?&]nojs\b/.test(location.search)) return;

  const root = document.documentElement;
  const STAGE = root.classList.contains('stage');
  const KEY = 'drip-facade-motion';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

  // ---- Motion on / off: a reload into the other mode, hash kept --------------------
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'motion-toggle';
  toggle.setAttribute('aria-pressed', String(STAGE));
  toggle.innerHTML = '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M3 7h9M6 10h11M3 13h9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>' +
    `<span>${STAGE ? 'Motion on' : 'Motion off'}</span>`;
  toggle.title = STAGE ? 'Show the still version' : 'Show the moving version';
  toggle.addEventListener('click', () => {
    const next = root.classList.contains('stage') ? 'off' : 'on';
    try { localStorage.setItem(KEY, next); } catch (e) { /* private mode: the URL carries it */ }
    const u = new URL(location.href);
    u.searchParams.set('motion', next);
    location.replace(u.href);
  });
  $('.site-header').appendChild(toggle);

  // Both document and animated modes share the same URL/location indication.
  const navLinks = $$('.site-nav a[data-zone]');
  const placesNav = $('.places-nav');
  const placeLinks = $$('.places-nav a[data-zone], .places-nav a[data-gallery]');
  // Reveal only this horizontal rail; do not move page scroll or steal focus.
  function revealPlaceLink(a) {
    if (!a || !placesNav || placesNav.scrollWidth <= placesNav.clientWidth) return;
    const rail = placesNav.getBoundingClientRect(), link = a.getBoundingClientRect();
    const inset = 12;
    if (link.left < rail.left + inset) placesNav.scrollLeft += link.left - rail.left - inset;
    else if (link.right > rail.right - inset) placesNav.scrollLeft += link.right - rail.right + inset;
  }
  placesNav?.addEventListener('focusin', e => {
    const a = e.target.closest('a');
    // After a touch-close, show the current place. For keyboard users, the
    // restored opener takes priority when both links cannot fit in the rail.
    if (a?.matches(':focus-visible')) revealPlaceLink(a);
  });
  window.addEventListener('resize', () => {
    const focused = placesNav?.querySelector('a:focus-visible');
    revealPlaceLink(focused || placesNav?.querySelector('[aria-current]'));
  });
  function updateNav(zone = st.zone) {
    for (const a of navLinks) {
      if (a.dataset.zone === zone || (a.dataset.zone==='room' && ['counter','room','courtyard','cafe'].includes(zone))) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    }
    const place = zone==='menu'?'counter':zone==='visit'?'street':zone==='cafe'?'room':zone;
    const hash = location.hash;
    const photoCollection = hash.startsWith('#photo-')
      ? document.getElementById(hash.slice(1))?.closest('.photo-collection')?.id : null;
    const collection = photoCollection || hash.slice(1);
    const galleryHref = collection.startsWith('seats-') ? '#seats-overview' : collection === 'objects' ? '#objects' : collection === 'latest-views' ? '#latest-views' : null;
    let currentPlace = null;
    for (const a of placeLinks) {
      const selected = galleryHref ? a.getAttribute('href') === galleryHref : a.dataset.zone === place;
      if (selected) { a.setAttribute('aria-current', 'location'); currentPlace = a; }
      else a.removeAttribute('aria-current');
    }
    revealPlaceLink(currentPlace);
    root.dataset.place=place;
  }
  function zoneFromHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (h === 'menu' || h === 'drinks' || h === 'food' || h.startsWith('cat-') || h.startsWith('item-')) return 'menu';
    if (h === 'cafe' || /^(seats-|objects$|latest-views$|photo-)/.test(h)) return 'room';
    if (h === 'visit' || h === 'counter' || h === 'room' || h === 'courtyard') return h;
    return 'street';
  }
  const urlFor = (zone) => location.pathname + location.search + (zone === 'street' ? '' : '#' + zone);

  if (!STAGE) {
    const syncFixedNav = () => updateNav(zoneFromHash());
    syncFixedNav();
    window.addEventListener('hashchange', syncFixedNav);
    window.addEventListener('popstate', syncFixedNav);
    window.DripFacade = { mode: 'fixed' };
    return;
  }

  const shots = JSON.parse($('#drip-shots').textContent);
  const zones = { menu: $('#menu'), cafe: $('#cafe'), visit: $('#visit') };
  const ZONE_POS = { street: 0, visit: 0, cafe: 2, menu: 3, counter: 3, room: 2, courtyard: 2 };
  const placePanels = Object.fromEntries($$('[data-place-panel]').map(e=>[e.dataset.placePanel,e]));
  let placeAnimation = null, placeTicket = 0, pendingPlaceFocus = null, enteringRoom = false;
  let facadeTimer = 0, photoWaitTimer = 0, navigationTicket = 0;
  const decodedPlaces = new WeakSet();
  const unavailablePlacePhotos = new WeakSet();
  const loadStatus = document.createElement('p');
  loadStatus.className = 'view-load-status';
  loadStatus.setAttribute('role', 'status');
  document.body.appendChild(loadStatus);

  // Picture coordinates (logical pixels of each recomposed image).
  const DOOR = [1052, 511, 159, 344];          // reviewed façade, 1448 × 1086
  const DOOR_HIT = [1037, 442, 187, 416];      // whole mustard frame in the same plane
  const T_IN = [133, 205, 845, 1843];          // what the doorway frames, inside the threshold picture
  const PORTAL_ZOOM = 1.35;                    // façade push while the doorway opens (on top of 1.12)
  const CAM = {                                // fx/fy: where the frame sits in the free range; z: zoom over cover
    street: { d: { fx: .5, fy: .5, z: 1, fit: 1 }, m: { fx: .82, fy: .5, z: 1, fit: 1 } },
    streetVisit: { d: { fx: .5, fy: .5, z: 1, fit: 1 }, m: { fx: .82, fy: .5, z: 1, fit: 1 } },
    push: { d: { fx: 1, fy: .9, z: 1.12 }, m: { fx: .8, fy: .62, z: 1.12 } },
    threshold: { d: { fx: .42, fy: .36, z: 1 }, m: { fx: .4, fy: .32, z: 1 } },
    thresholdCafe: { d: { fx: .4, fy: .3, z: 1 }, m: { fx: .4, fy: .28, z: 1 } },
    counter: { d: { fx: .5, fy: .5, z: 1 }, m: { fx: .52, fy: .55, z: 1 } },
    counterMenu: { d: { fx: .4, fy: .55, z: 1 }, m: { fx: .5, fy: .6, z: 1 } }
  };

  const st = { zone: 'street', pos: 0, vel: 0, target: 0, o: { menu: 0, cafe: 0, visit: 0 }, cc: 0, gatedSince: 0 };
  const L = {};
  let stage, V = { x: 0, y: 0, w: 1, h: 1 }, mobile = false, panels = {}, pendingFocus = null, vehicleTimer = 0;
  let alive = false; // set once the stage is built; until then links keep their plain behaviour
  let fellBack = false; // terminal: late decode/load callbacks may never restart the detached stage
  let entryJourney = null; // native scroll owns the spine only while active

  function buildStage() {
    // ---- stage --------------------------------------------------------------------
    stage = document.createElement('div');
    stage.className = 'scene';
    // The scene contains the real entrance link, so it must remain in the
    // accessibility tree. Decorative interior layers use empty image alt text.
    document.body.insertBefore(stage, $('main'));
    for (const key of ['street', 'threshold', 'counter']) {
      const s = shots[key];
      const layer = document.createElement('div');
      layer.className = `layer layer-${key}`;
      const shot = document.createElement('div');
      shot.className = 'shot';
      shot.style.width = s.w + 'px';
      shot.style.height = s.h + 'px';
      layer.appendChild(shot);
      stage.appendChild(layer);
      L[key] = { key, s, layer, shot, img: null, ready: false, shown: null };
    }
    stage.style.background = 'var(--paper)';

    // The façade uses the page's own <img>: no second download.
    const facade = $('.facade-img');
    L.street.shot.appendChild(facade);
    L.street.img = facade;
    buildFacadeLife(L.street.shot);
    root.classList.add('ready');

    measure();
    const onFacade = () => {
      clearTimeout(facadeTimer); if(fellBack)return;
      const current = facade.currentSrc || facade.src;
      L.street.loadedWidth = shots.street.files.find(f => new URL(f.src, document.baseURI).href === current)?.w || facade.naturalWidth;
      L.street.ready = true; L.street.layer.classList.add('img-ok'); light(); kick();
    };
    facadeTimer = setTimeout(() => fallback('The entrance image did not finish loading.'), 8000);
    if (facade.complete) { if (facade.naturalWidth) onFacade(); else fallback('The entrance image could not load.'); }
    else { facade.addEventListener('load', onFacade, { once: true }); facade.addEventListener('error', () => fallback('The entrance image could not load.'), { once: true }); }
  }

  // ---- pictures -----------------------------------------------------------------------
  const requiresInterior = zone => ['menu', 'counter', 'cafe', 'room'].includes(zone);
  const interiorReady = () => !requiresInterior(st.zone) || (L.threshold.ready && L.counter.ready);
  function pictureFile(l) {
    // The mobile façade is short, but entering the café fills the viewport.
    // Budget for that destination, including Retina pixels, before the journey.
    const height = Math.max(V.h, mobile ? window.innerHeight : V.h);
    const cover = Math.max(V.w / l.s.w, height / l.s.h);
    const zoom = l.key === 'street' ? 1.12 * 1.10 : 1;
    const need = l.s.w * cover * zoom * (window.devicePixelRatio || 1);
    return l.s.files.find(f => f.w >= need) || l.s.files[l.s.files.length - 1];
  }
  function ensureResolution(l) {
    if (fellBack || !l || !l.ready || !l.img) return;
    const file = pictureFile(l);
    if (file.w <= l.loadedWidth || l.pendingFile === file.src || l.failedUpgrade === file.src) return;
    const ticket = l.upgradeTicket = (l.upgradeTicket || 0) + 1;
    l.pendingFile = file.src;
    const next = new Image();
    next.alt = l.img.alt; next.className = l.img.className; next.decoding = 'async';
    if (l.key === 'street') { next.width = l.s.w; next.height = l.s.h; }
    const fail = () => {
      if (l.upgradeTicket !== ticket) return;
      l.pendingFile = null; l.failedUpgrade = file.src; kick();
    };
    next.addEventListener('error', fail, { once: true });
    next.addEventListener('load', () => {
      (next.decode ? next.decode() : Promise.resolve()).then(() => {
        if (fellBack || l.upgradeTicket !== ticket || !next.naturalWidth) return;
        // Keep the current photograph until the sharper replacement is decoded.
        l.img.replaceWith(next); l.img = next; l.loadedWidth = file.w;
        l.pendingFile = null; l.failedUpgrade = null; kick();
      }).catch(fail);
    }, { once: true });
    next.src = file.src;
  }
  function load(key) {
    if(fellBack)return;
    const l = L[key];
    if (l.img) {
      if (l.failed && (requiresInterior(zoneFromHash()) || (typeof entryJourney !== 'undefined' && entryJourney?.wantsInterior))) fallback('An interior photograph could not load.');
      ensureResolution(l);
      return;
    }
    const file = pictureFile(l);
    const im = new Image();
    im.alt = '';
    im.decoding = 'async';
    im.className = 'is-loading';
    // Ready only once decoded: a first appearance mid-move must not paint an empty frame.
    const failed = reason => {
      clearTimeout(l.imageTimer); l.failed = reason;
      // A canceled journey must not take the current, unrelated view down with it.
      if (!fellBack && (requiresInterior(zoneFromHash()) || (typeof entryJourney !== 'undefined' && entryJourney?.wantsInterior))) fallback(reason);
    };
    l.imageTimer=setTimeout(()=>{if(alive && !l.ready)failed('An interior image did not finish loading.');},6500);
    const done = () => { clearTimeout(l.imageTimer); if(fellBack)return; l.failed = null; l.ready = true; l.loadedWidth = file.w; im.classList.remove('is-loading'); ensureResolution(l); kick(); };
    im.addEventListener('load', () => { (im.decode ? im.decode() : Promise.resolve()).then(done).catch(() => failed('An interior image could not be decoded.')); }, { once: true });
    im.addEventListener('error', () => failed('An interior image could not load.'), { once: true });
    im.src = file.src;
    l.shot.appendChild(im);
    l.img = im;
  }

  // ---- façade life: lights come on, traffic passes in the glass ------------------------
  function el(cls, r) {
    const d = document.createElement('div');
    d.className = cls;
    if (r) {
      d.style.left = r[0] + 'px';
      d.style.top = r[1] + 'px';
      if (r[2] != null) { d.style.width = r[2] + 'px'; d.style.height = r[3] + 'px'; }
    }
    return d;
  }
  const PANES = [[535, 465, 237, 162], [787, 465, 253, 162], [1480, 418, 185, 265]];
  const panes = [];

  function buildFacadeLife(shot) {
    // Only the two photographed fluorescent tubes: calibrated on the final
    // 1448 × 1086 reviewed image. No additional fixtures or reflected traffic.
    shot.appendChild(el('fx fx-tube t1', [463, 370, 233, 10]));
    shot.appendChild(el('fx fx-tube t2', [800, 370, 233, 10]));
    shot.appendChild(el('fx fx-glow g1', [433, 340, 293, 72]));
    shot.appendChild(el('fx fx-glow g2', [770, 340, 293, 72]));
    const hit = document.createElement('a');
    hit.className = 'door-hit';
    hit.href = '#room';
    hit.dataset.zone = 'room';
    hit.setAttribute('aria-label', 'Come inside the café');
    hit.innerHTML = '<span class="door-label">Come inside <span aria-hidden="true">↗</span></span>';
    hit.tabIndex = 0;
    Object.assign(hit.style, { left: DOOR_HIT[0] + 'px', top: DOOR_HIT[1] + 'px', width: DOOR_HIT[2] + 'px', height: DOOR_HIT[3] + 'px' });
    shot.appendChild(hit);
  }

  let lit = false;
  function light() {
    if (lit || fellBack) return;
    lit = true;
    setTimeout(() => { if(!fellBack)L.street.layer.classList.add('lit'); }, 250);
    syncFacadeLife();
  }

  // Vehicles are drawn in picture pixels, at the height of the reflected roadside (y ≈ 628).
  // Each part: [background, left (share of length), bottom px, width (share), height px, radius].
  // Sheen parts add light (bodywork catching the sun); shade parts darken (glass, tyres, shadow).
  const tyres = [['#15181b', .11, 0, .16, 10, '50%'], ['#15181b', .73, 0, .16, 10, '50%']];
  // The cabin is drawn as a bright outline (roof and pillars) around dark glass.
  const car = (top, bottom, glass, roof) => ({
    w: 128, h: 50, speed: 560 + Math.random() * 80,
    sheen: [[`linear-gradient(${top}, ${bottom})`, 0, 7, 1, 19, '11px 15px 5px 5px'],
      ['transparent', .21, 24, .58, 25, '15px 20px 2px 2px', `border:4px solid ${roof};border-bottom:0`],
      [roof, .49, 24, .025, 22, '1px']],
    shade: [[glass, .245, 25, .53, 20, '13px 18px 2px 2px'], ['rgba(20,22,25,.85)', .04, 3, .92, 5, '3px'], ...tyres]
  });
  const KINDS = [
    () => ({ ...car('#ffffff', '#cfcdc6', 'linear-gradient(#3b4450, #5a6570)', '#ffffff'), a: .62, b: .62 }),
    () => ({ ...car('#e4e8eb', '#8f989f', 'linear-gradient(#323a43, #535d66)', '#f4f7fa'), a: .6, b: .58 }),
    () => ({ ...car('#ee8a74', '#a8402f', 'linear-gradient(#352a2e, #4c4045)', '#ffe2d8'), a: .6, b: .62 }),
    () => ({ ...car('#59626d', '#2c323a', 'linear-gradient(#20252b, #3a424b)', '#dfe7ef'), a: .7, b: .5 }),
    () => {
      const pillars = [0.14, 0.29, 0.44, 0.59, 0.74, 0.89].map((x) => ['#f3eee2', x, 55, .016, 37, '1px']);
      return {
        w: 430, h: 104, speed: 330, a: .58, b: .55,
        sheen: [['linear-gradient(#f6f2e8, #cfc8b8)', 0, 10, 1, 44, '4px 4px 6px 6px'], ['#f3eee2', 0, 92, 1, 12, '16px 16px 2px 2px'], ...pillars],
        shade: [['linear-gradient(#2a3039, #424a55)', .015, 56, .97, 35, '5px'], ['rgba(20,22,25,.85)', .03, 4, .94, 6, '3px'],
          ['#15181b', .1, 0, .09, 14, '50%'], ['#15181b', .8, 0, .09, 14, '50%']]
      };
    }
  ];
  let passes = 0;

  // passBy(kind, ltr) forces a vehicle and a direction (used by the test hooks).
  function facadeActive() {
    return alive && !fellBack && document.visibilityState === 'visible' && Boolean(L.street.shown);
  }
  function syncFacadeLife() {
    const active = facadeActive();
    root.dataset.facadeActive = String(active);
    if (!active) {
      clearTimeout(vehicleTimer); vehicleTimer = 0;
      for (const p of panes) for (const node of [p.shade,p.sheen]) for (const a of node.getAnimations()) a.cancel();
    } else if (lit && panes.length && !vehicleTimer) vehicleTimer = setTimeout(passBy, 5200 + Math.random() * 3800);
  }
  function passBy(force, forceLtr) {
    clearTimeout(vehicleTimer); vehicleTimer = 0;
    if (!facadeActive() || st.pos > .6 || !panes.length) return;
    vehicleTimer = setTimeout(passBy, 5200 + Math.random() * 3800);
    passes += 1;
    const kind = KINDS[typeof force === 'number' ? force : passes % 4 === 3 ? 4 : Math.floor(Math.random() * 4)]();
    const ltr = typeof forceLtr === 'boolean' ? forceLtr : Math.random() < .5;
    const from = ltr ? 500 - kind.w : 1700;
    const to = ltr ? 1700 : 500 - kind.w;
    const duration = Math.abs(to - from) / kind.speed * 1000;
    const top = 628 - kind.h;
    const parts = (list) => list.map(([c, x, bottom, w, h, r, more = '']) =>
      `<i style="box-sizing:border-box;background:${c};left:${(x * kind.w).toFixed(1)}px;bottom:${bottom}px;width:${(w * kind.w).toFixed(1)}px;height:${h}px;border-radius:${r};${more}"></i>`).join('');
    for (const p of panes) {
      for (const [node, list, alpha] of [[p.shade, kind.shade, kind.a], [p.sheen, kind.sheen, kind.b]]) {
        for (const a of node.getAnimations()) a.cancel();
        node.innerHTML = parts(list);
        Object.assign(node.style, { top: (top - p.r[1]) + 'px', width: kind.w + 'px', height: kind.h + 'px', opacity: alpha });
        node.animate([
          { transform: `translate3d(${from - p.r[0]}px,0,0)` },
          { transform: `translate3d(${to - p.r[0]}px,0,0)` }
        ], { duration, easing: 'linear' });
      }
    }
  }

  // ---- geometry ---------------------------------------------------------------------
  function measure() {
    V = { x: 0, y: 0, w: stage.clientWidth || 1, h: stage.clientHeight || 1 };
    mobile = matchMedia('(max-width: 759px)').matches;
    const top = stage.offsetTop;
    for (const z of Object.keys(zones)) {
      const e = zones[z];
      panels[z] = { left: e.offsetLeft, top: e.offsetTop - top, w: e.offsetWidth, h: e.offsetHeight };
    }
    for (const key of ['threshold', 'counter']) ensureResolution(L[key]);
  }
  // The part of the stage left visible by a sheet that is `o` open.
  function vpFor(zone, o) {
    const p = panels[zone];
    if (!p || o <= 0) return V;
    if (mobile) {
      // Compact landscape puts Visit beside the scene, not over its bottom.
      if (p.left >= V.w || p.left + p.w <= 0) return V;
      const edge = p.top + (1 - o) * p.h;
      return { x: 0, y: 0, w: V.w, h: clamp(edge, Math.min(V.h, 120), V.h) };
    }
    if (zone === 'cafe') {
      const edge = clamp(p.left + o * p.w, 0, V.w - 200);
      return { x: edge, y: 0, w: V.w - edge, h: V.h };
    }
    return { x: 0, y: 0, w: clamp(p.left + (1 - o) * p.w, 200, V.w), h: V.h };
  }
  let counterBand = 0;
  function counterVp() {
    const vp = vpFor('menu', st.o.menu);
    if (!mobile || st.cc <= 0) return vp;
    const card = $('#counter .stop-copy');
    // In compact landscape the controls sit to the right, not over the photo.
    // The resolved CSS width remains available while the departing card is hidden.
    if (card && matchMedia('(max-width: 759px) and (orientation: landscape)').matches) {
      const width = parseFloat(getComputedStyle(card).width) || 0;
      const w = lerp(V.w, Math.max(1, V.w - width), st.cc);
      return w < vp.w ? { ...vp, w } : vp;
    }
    if (card && card.offsetHeight) {
      const r = card.getBoundingClientRect(), s = stage.getBoundingClientRect();
      if (r.top > s.top + 40) counterBand = r.top - s.top;
    }
    if (!counterBand) return vp;
    const h = lerp(V.h, clamp(counterBand, Math.min(V.h, 160), V.h), st.cc);
    return h < vp.h ? { ...vp, h } : vp;
  }
  const cam = (name) => CAM[name][mobile ? 'm' : 'd'];
  const lerpCam = (a, b, t) => ({ fx: lerp(a.fx, b.fx, t), fy: lerp(a.fy, b.fy, t), z: lerp(a.z, b.z, t), fit: lerp(a.fit ?? 1, b.fit ?? 1, t) });
  function geom(s, vp, c) {
    const k = lerp(Math.min(vp.w / s.w, vp.h / s.h), Math.max(vp.w / s.w, vp.h / s.h), c.fit ?? 1) * c.z;
    return { k, x: vp.x - c.fx * (s.w * k - vp.w), y: vp.y - c.fy * (s.h * k - vp.h) };
  }
  const mapR = (g, r) => ({ x: g.x + g.k * r[0], y: g.y + g.k * r[1], w: g.k * r[2], h: g.k * r[3] });
  const lerpRect = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });
  function intersect(a, b) {
    const x = Math.max(a.x, b.x), y = Math.max(a.y, b.y);
    return { x, y, w: Math.max(0, Math.min(a.x + a.w, b.x + b.w) - x), h: Math.max(0, Math.min(a.y + a.h, b.y + b.h) - y) };
  }

  // Slow breathing of the street view while nothing else moves.
  function drift(c, t, a) {
    if (a <= 0) return c;
    const tau = Math.PI * 2;
    if (mobile) return { fx: clamp(c.fx + a * .22 * Math.sin(t * tau / 34), 0, 1), fy: c.fy, z: c.z + a * .012 * (.5 - .5 * Math.cos(t * tau / 23)) };
    return {
      fx: clamp(c.fx + a * .35 * Math.sin(t * tau / 31), 0, 1),
      fy: clamp(c.fy + a * .25 * Math.sin(t * tau / 41), 0, 1),
      z: c.z + a * .016 * (.5 - .5 * Math.cos(t * tau / 26))
    };
  }

  // ---- render -------------------------------------------------------------------------
  function show(l, g, clip, opacity) {
    if (!g) {
      if (l.shown !== false) { l.layer.style.visibility = 'hidden'; l.shown = false; }
      return;
    }
    if (l.shown !== true) { l.layer.style.visibility = 'visible'; l.shown = true; }
    l.shot.style.transform = `translate3d(${g.x.toFixed(2)}px,${g.y.toFixed(2)}px,0) scale(${g.k.toFixed(5)})`;
    if (l.key === 'street') l.shot.style.setProperty('--photo-scale', g.k.toFixed(5));
    l.layer.style.clipPath = clip
      ? `inset(${clip.y.toFixed(1)}px ${(V.w - clip.x - clip.w).toFixed(1)}px ${(V.h - clip.y - clip.h).toFixed(1)}px ${clip.x.toFixed(1)}px)`
      : '';
    l.layer.style.opacity = opacity == null || opacity >= 1 ? '' : opacity.toFixed(3);
  }

  const thresholdCam = () => lerpCam(cam('threshold'), cam('thresholdCafe'), st.o.cafe);
  const counterCam = () => lerpCam(cam('counter'), cam('counterMenu'), st.o.menu);

  function render(now) {
    const pos = st.pos;
    if (pos <= 1) {
      const rest = lerpCam(cam('street'), cam('streetVisit'), smooth(st.o.visit));
      const c = lerpCam(rest, cam('push'), pos);
      let g = geom(shots.street, vpFor('visit', st.o.visit), c);
      if (typeof entryJourney !== 'undefined' && entryJourney?.active && mobile) {
        const start = entryJourney.startGeometry();
        const end = geom(shots.street, V, cam('push'));
        const t = smooth(pos);
        g = { k: lerp(start.k, end.k, t), x: lerp(start.x, end.x, t), y: lerp(start.y, end.y, t) };
      }
      show(L.street, g);
      show(L.threshold, null);
      show(L.counter, null);
    } else if (pos < 2) {
      portal(pos - 1);
      show(L.counter, null);
    } else if (pos < 3) {
      turn(pos - 2);
      show(L.street, null);
    } else {
      show(L.street, null);
      show(L.threshold, null);
      show(L.counter, geom(shots.counter, counterVp(), counterCam()));
    }
    syncFacadeLife();
  }

  // A photographic cut through the doorway. Both views meet at one crisp,
  // full-height edge; no floating rectangle or invented in-between geometry.
  function portal(p) {
    const t = smooth(p);
    const g1 = geom(shots.street, vpFor('visit', st.o.visit), cam('push'));
    const doorway = mapR(g1, DOOR);
    const cx = doorway.x + doorway.w / 2;
    const cy = doorway.y + doorway.h / 2;
    const zoom = 1 + .10 * t;
    const gS = { k: g1.k * zoom, x: cx - (cx - g1.x) * zoom, y: cy - (cy - g1.y) * zoom };
    const gT = geom(shots.threshold, vpFor('cafe', st.o.cafe), thresholdCam());
    const edge = V.w * (1 - t);
    show(L.street, edge > .5 ? gS : null, {x:0,y:0,w:edge,h:V.h});
    show(L.threshold, edge < V.w - .5 ? gT : null, {x:edge,y:0,w:V.w-edge,h:V.h});
  }

  // Turning left inside: the counter comes in from the left, side by side, never on top.
  function turn(q) {
    const gT = geom(shots.threshold, vpFor('cafe', st.o.cafe), thresholdCam());
    const gC = geom(shots.counter, counterVp(), counterCam());
    const dx = V.w * q;
    show(L.threshold, dx < V.w - .5 ? { k: gT.k, x: gT.x + dx, y: gT.y } : null, { x: dx, y: 0, w: V.w - dx, h: V.h });
    show(L.counter, dx > .5 ? { k: gC.k, x: gC.x + dx - V.w, y: gC.y } : null, { x: 0, y: 0, w: dx, h: V.h });
  }

  // ---- motion -------------------------------------------------------------------------
  const ACC = 7.5;
  const vmax = (pos, dir) => (pos < 1 ? 3 : pos < 2 ? 1.55 : 1.9) * (dir < 0 ? 1.35 : 1);

  function sheetTargets() {
    const z = st.zone, p = st.pos;
    return { menu: z === 'menu' ? 1 : 0, cafe: z === 'cafe' && Math.abs(p - 2) < .38 ? 1 : 0, visit: z === 'visit' ? 1 : 0 };
  }

  // Mobile: the counter's card covers the bottom of the scene. st.cc eases the
  // counter's framing into the band above that card (and back out for the menu).
  const ccTarget = () => (mobile && st.zone === 'counter' ? 1 : 0);
  function step(dt, now) {
    const cct = ccTarget();
    st.cc += (cct - st.cc) * (1 - Math.exp(-dt / .11));
    if (Math.abs(cct - st.cc) < .002) st.cc = cct;
    const tg = sheetTargets();
    for (const z of Object.keys(st.o)) {
      const want = tg[z];
      st.o[z] += (want - st.o[z]) * (1 - Math.exp(-dt / (want > st.o[z] ? .11 : .085)));
      if (Math.abs(want - st.o[z]) < .002) st.o[z] = want;
    }
    // Do not walk through a door before the room behind it has loaded (2.5 s at most).
    let ceiling = 3;
    if (!L.threshold.ready) ceiling = .999;
    else if (!L.counter.ready) ceiling = 1.999;
    // A ceiling only stops us going further; it never pulls the view back (deep links).
    const target = st.pos > ceiling ? st.target : Math.min(st.target, ceiling);
    if (target < st.target) {
      if (!st.gatedSince) st.gatedSince = now;
      else if (now - st.gatedSince > 4500) { fallback('The interior image is taking too long to load.'); return; }
    } else st.gatedSince = 0;

    const d = target - st.pos;
    if (d === 0 && st.vel === 0) return;
    const dir = Math.sign(d) || -Math.sign(st.vel);
    const want = dir * Math.min(vmax(st.pos, dir), Math.sqrt(2 * ACC * Math.abs(d)));
    st.vel += clamp(want - st.vel, -ACC * dt, ACC * dt);
    const next = st.pos + st.vel * dt;
    if ((target - next) * d <= 0 || (Math.abs(target - next) < .0015 && Math.abs(st.vel) < .08)) {
      st.pos = target;
      st.vel = 0;
    } else st.pos = clamp(next, 0, 3);
  }

  function finish() {
    st.pos = st.target;
    st.vel = 0;
    const tg = sheetTargets();
    for (const z of Object.keys(st.o)) st.o[z] = tg[z];
    st.cc = ccTarget();
  }

  const moving = () => st.pos !== Math.min(st.target, 3) || st.vel !== 0 || st.cc !== ccTarget() || Object.keys(st.o).some((z) => st.o[z] !== sheetTargets()[z]);

  function syncSheets() {
    if(!alive || fellBack)return;
    let menuOpened = false;
    root.dataset.placeSettled=String(Math.abs(st.pos-st.target)<.01);
    if(enteringRoom && Math.abs(st.pos-st.target)<.01){enteringRoom=false;root.classList.remove('entering-room');setPlace('room','street',reduced.matches,true);}
    if(pendingPlaceFocus && Math.abs(st.pos-st.target)<.01){const h=$('h2',placePanels[pendingPlaceFocus]);pendingPlaceFocus=null;if(h)h.focus({preventScroll:true});}
    for (const z of Object.keys(zones)) {
      const e = zones[z], o = st.o[z];
      const v = o.toFixed(4);
      if (e._o !== v) { e.style.setProperty('--o', v); e._o = v; }
      const open = o > .001;
      if (open !== e._open) {
        e.classList.toggle('is-open', open); e._open = open;
        if (z === 'menu' && open) menuOpened = true;
      }
      const active = st.zone === z;
      if (active !== e._active) { e.inert = !active; e._active = active; }
    }
    if (menuOpened) spy();
    if (pendingFocus && st.o[pendingFocus] > .6) {
      const h = $('h2', zones[pendingFocus]);
      pendingFocus = null;
      if (h) h.focus({ preventScroll: true });
    }
  }

  // Real elapsed time is integrated in small steps, so a starved frame rate (background
  // tab, busy machine) makes the picture jumpier but never makes the journey longer.
  // Past 4 s of wall time a journey simply lands where it was going.
  let raf = 0, last = 0, journeyStart = 0, watchdog = 0;
  function frame(now) {
    raf = 0;
    if (!alive || fellBack) return;
    if (typeof entryJourney !== 'undefined' && entryJourney?.active) {
      entryJourney.paint(now); last = 0; journeyStart = 0; return;
    }
    let dt = last ? Math.min(1, (now - last) / 1000) : 1 / 60;
    last = now;
    const wasMoving = moving();
    if (wasMoving && !journeyStart) journeyStart = now;
    if (!wasMoving) journeyStart = 0;
    if (journeyStart && now - journeyStart > 4000) { if(!interiorReady()){fallback('The interior photograph did not load.');return;} finish(); journeyStart = 0; }
    while (dt > 1e-6 && alive && !fellBack) { const h = Math.min(dt, 1 / 60); step(h, now); dt -= h; }
    if(!alive || fellBack)return;
    render(now);
    syncSheets();
    if (document.visibilityState === 'visible' && moving()) raf = requestAnimationFrame(frame);
    else last = 0;
  }
  function kick() { if (alive && !fellBack && !raf && document.visibilityState === 'visible') raf = requestAnimationFrame(frame); }

  // ---- navigation -------------------------------------------------------------------
  function markPlacePhotoUnavailable(photo) {
    if (unavailablePlacePhotos.has(photo)) return;
    unavailablePlacePhotos.add(photo);
    const figure = photo.closest('figure');
    const panel = photo.closest('[data-place-panel]');
    if (figure) { figure.hidden = true; figure.classList.add('is-photo-unavailable'); }
    if (!panel) return;
    if (photo.hasAttribute('data-place-detail')) {
      panel.classList.add('has-unavailable-detail');
      return;
    }
    panel.classList.add('has-unavailable-primary');
    const copy = $('.stop-story', panel) || $('.stop-copy', panel);
    if (copy && !$('.photo-unavailable-note', copy)) {
      const note = document.createElement('p');
      note.className = 'photo-unavailable-note';
      note.setAttribute('role', 'status');
      note.textContent = 'This photograph is unavailable. The menu and other views are still available.';
      const heading = $('h2', copy);
      if (heading) heading.after(note); else copy.prepend(note);
    }
  }

  function go(zone, opts = {}) {
    if(!alive || fellBack)return;
    if (!(zone in ZONE_POS)) return;
    if (typeof entryJourney !== 'undefined' && entryJourney) {
      if (entryJourney.active && zone !== 'street') {
        entryJourney.stop();
        // A route takes control immediately, but an undecoded interior must still
        // use the existing loading ceiling instead of exposing an empty layer.
        const canLand = !requiresInterior(zone) || (L.threshold.ready && L.counter.ready);
        opts = { ...opts, instant: Boolean(opts.instant) || canLand };
      }
    }
    if (zone==='cafe') zone='room';
    syncMenuCurrent(zone === 'menu' ? location.hash : '');
    if (zone==='menu') prepareMenuMedia();
    if (requiresInterior(zone)) { load('threshold'); load('counter'); if(fellBack)return; }
    const prev = st.zone;
    const activeBefore = document.activeElement;
    const restoreOutsideFocus = activeBefore && ((zones[prev] && zones[prev].contains(activeBefore)) || (placePanels[prev] && placePanels[prev].contains(activeBefore)));
    if (zone === 'street' && typeof entryJourney !== 'undefined' && entryJourney?.start(opts.journeyProgress || 0)) {
      // An explicit Back outside can close the focused panel. Passive scroll and
      // startup never move focus; retain the existing route's restoration here.
      if (opts.focus !== false && restoreOutsideFocus) {
        const back = placeLinks.find(a => a.dataset.zone === 'street') || navLinks.find(a => a.dataset.zone === prev);
        if (back) back.focus({ preventScroll: true });
      }
      return;
    }
    const ticket = ++navigationTicket;
    clearTimeout(photoWaitTimer);
    loadStatus.textContent = '';
    const panel=['room','courtyard'].includes(zone)?placePanels[zone]:null;
    const photos=panel?[$('img',panel),...(matchMedia('(min-width: 1100px)').matches?$$('img[data-place-detail]',panel):[])].filter(Boolean):[];
    const pendingPhotos=photos.filter(photo=>!decodedPlaces.has(photo) && !unavailablePlacePhotos.has(photo));
    // Hidden lazy images are deliberately requested on intent. Keep the current
    // view intact until the next image has loaded AND decoded, including fast reversals.
    if (pendingPhotos.length) {
      loadStatus.textContent = 'Opening ' + (zone === 'room' ? 'the room…' : 'the courtyard…');
      const failed = () => { if (ticket === navigationTicket && !fellBack) fallback('A photograph could not load.'); };
      const expire = [];
      const requests = pendingPhotos.map(photo=>new Promise((resolve,reject)=>{
        let settled = false;
        const current = () => ticket === navigationTicket && !fellBack && alive;
        const unavailable = () => {
          if (settled) return;
          settled = true;
          if (!current()) { resolve(); return; }
          markPlacePhotoUnavailable(photo);
          if (photo.hasAttribute('data-place-detail')) resolve();
          else reject(new Error('The main photograph is unavailable.'));
        };
        expire.push(unavailable);
        const ready=()=>{
          if (settled) return;
          if(!photo.naturalWidth){unavailable();return;}
          try {
            (photo.decode?photo.decode():Promise.resolve()).then(()=>{
              if (settled) return;
              settled = true;
              if (current()) decodedPlaces.add(photo);
              resolve();
            }, unavailable);
          } catch (_) { unavailable(); }
        };
        photo.loading='eager';
        if(photo.complete)ready();
        else{photo.addEventListener('load',ready,{once:true});photo.addEventListener('error',unavailable,{once:true});}
      }));
      photoWaitTimer = setTimeout(()=>expire.forEach(fn=>fn()), 8000);
      Promise.all(requests).then(()=>{
        if(ticket!==navigationTicket || fellBack || !alive)return;
        clearTimeout(photoWaitTimer);go(zone,opts);
      }).catch(failed);
      return;
    }
    if (zone === prev) {
      // Gallery hashes share the room scene but still change its active link.
      updateNav(zone);
      if (opts.focus === false) pendingFocus = null;
      if (opts.instant || reduced.matches || (opts.skip && moving())) {
        finish();
        // Settled state must also be painted: a paused RAF cannot own this commit.
        render(performance.now()); syncSheets();
      }
      kick();
      return;
    }
    st.zone = zone;
    st.target = ZONE_POS[zone];
    // Photo viewpoints beyond the doorway use an editorial wipe, not a fabricated 3D route.
    const entrance=zone==='room' && prev==='street' && !opts.instant && !reduced.matches;
    enteringRoom=entrance;root.classList.toggle('entering-room',entrance);
    const photoCut=!entrance && (['room','courtyard'].includes(zone)||['room','courtyard'].includes(prev));
    // Jump the underlying photo spine without discarding the caller's motion intent.
    // History/deep-link restoration stays instant; ordinary room changes may wipe.
    const instantPlace=Boolean(opts.instant)||reduced.matches;
    setPlace(zone,prev,instantPlace, opts.focus !== false && !entrance);
    journeyStart = 0;
    // Second safety net, independent of animation frames (which a busy or hidden
    // window can starve): whatever happens, the journey has landed after 4.5 s.
    clearTimeout(watchdog);
    watchdog = setTimeout(() => { if (!alive || fellBack)return; if (moving()) { if(!interiorReady()){fallback('The interior photograph did not load.');return;} finish(); render(performance.now()); syncSheets(); } }, 4500);
    const settled = opts.instant || photoCut || reduced.matches;
    if (settled) finish();
    updateNav();
    pendingFocus = zone in zones && opts.focus !== false ? zone : null;
    if (zone === 'street' && opts.focus !== false) {
      const back = placeLinks.find((a) => a.dataset.zone === 'street') || navLinks.find((a) => a.dataset.zone === prev);
      if (back && restoreOutsideFocus) back.focus({ preventScroll: true });
    }
    // The watchdog checks moving(), which is false after finish(). Commit the
    // scene and sheets now rather than leaving stale CSS until a future frame.
    if (settled) { render(performance.now()); syncSheets(); }
    kick();
  }

  function prepareMenuMedia() {
    if (root.classList.contains('menu-media-ready')) return;
    // CSS keeps the unopened menu body out of layout until real menu intent.
    // Install honest placeholders before revealing its reserved photo dimensions.
    for (const photo of $$('.lead-photo img, .art img', zones.menu)) prepareMenuPhoto(photo);
    root.classList.add('menu-media-ready');
  }

  function prepareMenuPhoto(photo) {
    const figure = photo.closest('figure');
    if (!figure) { photo.loading = 'eager'; return; }
    const status = document.createElement('span');
    status.className = 'menu-photo-status';
    status.textContent = 'Loading photograph…';
    figure.dataset.menuPhotoState = 'loading';
    photo.after(status);
    let settled = false, decoding = false, timeout = 0;
    const settle = (state) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      photo.removeEventListener('load', ready);
      photo.removeEventListener('error', unavailable);
      photo.removeEventListener('abort', unavailable);
      figure.dataset.menuPhotoState = state;
      status.textContent = state === 'ready' ? '' : 'Photograph unavailable.';
      status.hidden = state === 'ready';
    };
    const unavailable = () => settle('unavailable');
    const ready = () => {
      if (settled || decoding) return;
      if (!photo.naturalWidth) { unavailable(); return; }
      decoding = true;
      try { Promise.resolve(photo.decode ? photo.decode() : undefined).then(() => settle('ready'), unavailable); }
      catch (_) { unavailable(); }
    };
    photo.addEventListener('load', ready);
    photo.addEventListener('error', unavailable);
    photo.addEventListener('abort', unavailable);
    timeout = setTimeout(unavailable, 8000);
    photo.loading = 'eager';
    if (photo.complete) ready();
  }

  function syncMenuCurrent(hash) {
    for (const item of $$('[data-menu-current]', zones.menu)) item.removeAttribute('data-menu-current');
    if (!hash.startsWith('#item-')) return;
    const item = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (item && zones.menu.contains(item)) item.setAttribute('data-menu-current', '');
  }

  function clearPlaceAnimations() {
    // Restore final CSS before removing fill effects, including a cancelled route's
    // photo-only mask. Text and navigation themselves never animate.
    for(const e of Object.values(placePanels)){
      e.style.removeProperty('clip-path');
      e.style.removeProperty('background');
      const photo=$('.stop-photo',e), copy=$('.stop-copy',e);
      if(copy){copy.style.removeProperty('background');copy.style.removeProperty('visibility');}
      for(const node of [e,photo].filter(Boolean)){
        node.style.removeProperty('clip-path');
        for(const animation of node.getAnimations())animation.cancel();
      }
    }
    placeAnimation=null;
  }

  function setPlace(zone, prev, instant, shouldFocus = true) {
    if(!alive || fellBack)return;
    const seq=++placeTicket;
    pendingPlaceFocus=null;
    clearPlaceAnimations();
    const old=placePanels[prev], next=placePanels[zone];
    for(const e of Object.values(placePanels)){e.classList.remove('is-place-current','is-leaving');e.style.clipPath='';e.inert=true;}
    if(next){next.classList.add('is-place-current');next.inert=false;}
    const rank={street:0,visit:0,counter:1,menu:1,room:2,cafe:2,courtyard:3};
    const forward=(rank[zone]??0)>=(rank[prev]??0);
    const incoming=forward?'inset(0 0 0 100%)':'inset(0 100% 0 0)';
    const outgoing=forward?'inset(0 100% 0 0)':'inset(0 0 0 100%)';
    const oldPhoto=old && prev!=='counter'?$('.stop-photo',old):null;
    const nextPhoto=next && zone!=='counter'?$('.stop-photo',next):null;
    const animate=!instant&&!reduced.matches;
    function complete(){
      if(fellBack || !alive || seq!==placeTicket)return;
      if(old)old.classList.remove('is-leaving');
      clearPlaceAnimations();
      if(!shouldFocus || !next)return;
      if(zone==='counter'){pendingPlaceFocus='counter';syncSheets();}
      else{const h=$('h2',next);if(h)h.focus({preventScroll:true});}
    }
    if(!animate || (!nextPhoto && !oldPhoto)){complete();return;}
    // Expose the old photograph (or live scene) beneath the mask without sliding
    // typography. The destination copy is immediately stable and readable.
    if(oldPhoto){
      old.classList.add('is-leaving');old.style.background='transparent';
      const copy=$('.stop-copy',old);if(copy)copy.style.visibility='hidden';
    }
    if(nextPhoto){
      next.style.background='transparent';
      const copy=$('.stop-copy',next);if(copy)copy.style.background='var(--paper)';
      placeAnimation=nextPhoto.animate([{clipPath:incoming},{clipPath:'inset(0 0 0 0)'}],{duration:420,easing:'cubic-bezier(.25,.6,.2,1)',fill:'both'});
    }else{
      placeAnimation=oldPhoto.animate([{clipPath:'inset(0 0 0 0)'},{clipPath:outgoing}],{duration:320,easing:'cubic-bezier(.25,.6,.2,1)',fill:'forwards'});
    }
    // A later navigation/fallback owns cleanup after cancellation. Never focus or
    // clear its new effects from this route's rejected/obsolete completion.
    placeAnimation.finished.then(complete).catch(()=>{});
  }

  function fallback(reason) {
    if(fellBack)return;
    if (typeof entryJourney !== 'undefined') entryJourney?.dispose();
    fellBack=true; alive=false; ++placeTicket; ++navigationTicket;
    clearTimeout(facadeTimer); clearTimeout(photoWaitTimer); loadStatus.textContent='';
    pendingFocus=null; pendingPlaceFocus=null;
    clearTimeout(vehicleTimer); clearTimeout(watchdog);
    for(const l of Object.values(L))clearTimeout(l.imageTimer);
    cancelAnimationFrame(raf); raf=0;
    clearPlaceAnimations();
    const facade=$('.facade-img');
    if(facade && !$('.welcome-photo').contains(facade))$('.welcome-photo').appendChild(facade);
    if(stage)stage.remove();
    root.classList.remove('stage','ready'); root.classList.add('fixed');
    for(const e of [...Object.values(zones),...Object.values(placePanels)]){e.inert=false;e.classList.remove('is-open','is-place-current','is-leaving');e.style.removeProperty('--o');}
    st.zone = zoneFromHash();
    updateNav();
    toggle.querySelector('span').textContent='Motion off'; toggle.setAttribute('aria-pressed','false');toggle.title='Show the moving version';
    window.DripFacade={mode:'fixed',reason};
    requestAnimationFrame(() => { const target=document.getElementById(location.hash.slice(1)); if(target)target.scrollIntoView({block:'start'}); });
  }
  reduced.addEventListener('change',e=>{if(e.matches)fallback('Reduced motion requested.');});

  function navigate(zone) {
    if (entryJourney?.active) {
      if (zone === 'street') history.replaceState({ ...history.state, dripJourney: 0 }, '', location.href);
      else entryJourney.remember();
    }
    if (location.pathname + location.search + location.hash !== urlFor(zone)) history.pushState({ drip: zone }, '', urlFor(zone));
    go(zone, { skip: true });
    if (zone === 'menu') menuSheet.scrollTop = 0;
  }

  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('a[data-zone]');
    if (!alive || !a || ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    ev.preventDefault();
    navigate(a.dataset.zone);
  });
  window.addEventListener('popstate', restoreRoute);
  window.addEventListener('hashchange', restoreRoute);
  // After a resource fallback, native anchor navigation still owns the document.
  const syncFixedMenuCurrent = () => { if (fellBack) syncMenuCurrent(location.hash); };
  window.addEventListener('popstate', syncFixedMenuCurrent);
  window.addEventListener('hashchange', syncFixedMenuCurrent);
  document.addEventListener('keydown', (ev) => {
    if (!ev.defaultPrevented && !root.classList.contains('gallery-open') && !root.classList.contains('menu-photo-open') && alive && ev.key === 'Escape' && (st.zone !== 'street' || zoneFromHash() !== 'street' || (entryJourney?.active && st.pos > .01))) { ev.preventDefault(); navigate('street'); }
  });

  // Real, shareable category/item anchors also work in the plain document.
  const menuSheet = zones.menu;
  const switchLinks = $$('.menu-switch a');
  function scrollMenuAnchor(hash, focus = false) {
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target || !menuSheet.contains(target)) return;
    const index = $('.menu-index', menuSheet);
    if (index) index.open = false;
    const head = $('.sheet-head', menuSheet);
    const top = target.getBoundingClientRect().top - menuSheet.getBoundingClientRect().top + menuSheet.scrollTop - head.offsetHeight - 12;
    menuSheet.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
    if (focus) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); pendingFocus = null; }
  }
  for (const a of [...switchLinks, ...$$('[data-menu-jump]')]) {
    a.addEventListener('click', ev => {
      if (!alive || fellBack || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      ev.preventDefault();
      const hash = a.getAttribute('href');
      if (location.hash !== hash) history.pushState({ drip: 'menu' }, '', location.pathname + location.search + hash);
      go('menu', { instant: true, focus: false });
      scrollMenuAnchor(hash, true);
    });
  }
  function galleryNeedsDocument() {
    return document.readyState === 'complete' && !root.classList.contains('gallery-ready') && /^#(seats-|objects$|latest-views$|photo-)/.test(location.hash);
  }
  window.addEventListener('load', () => { if (galleryNeedsDocument()) fallback('Photo collections are shown as a normal page.'); });
  function restoreRoute() {
    if (galleryNeedsDocument()) { fallback('Photo collections are shown as a normal page.'); return; }
    if (fellBack) { st.zone = zoneFromHash(); updateNav(); return; }
    if (!alive) return;
    const hash = location.hash;
    const anchor = /^#(food|drinks|cat-|item-)/.test(hash);
    const focusFromMenu = document.hasFocus() && menuSheet.contains(document.activeElement);
    // A browser/global-navigation action must not steal focus back into a sheet.
    // A menu anchor owns its own focus, so suppress delayed heading focus too.
    if (!focusFromMenu || anchor) pendingFocus = null;
    go(zoneFromHash(), { instant: true, focus: focusFromMenu && !anchor, journeyProgress: Number(history.state?.dripJourney) || 0 });
    if (hash === '#menu') menuSheet.scrollTop = 0;
    if (anchor) requestAnimationFrame(() => {
      if (location.hash !== hash) return;
      scrollMenuAnchor(hash, focusFromMenu && document.hasFocus() && menuSheet.contains(document.activeElement));
    });
  }
  function spy() {
    // Reading offsets in the closed, laid-out menu forces unnecessary startup layout.
    if (!alive || fellBack || st.zone !== 'menu' || !menuSheet._open) return;
    const food = $('#food');
    const y = menuSheet.scrollTop + $('.sheet-head', menuSheet).offsetHeight + 60;
    const drinks = $('#drinks');
    const current = food.offsetTop <= y ? '#food' : drinks.offsetTop <= y ? '#drinks' : null;
    for (const a of switchLinks) {
      if (a.getAttribute('href') === current) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    }
  }
  menuSheet.addEventListener('scroll', spy, { passive: true });

  // ---- Short arrival: native document scroll, never wheel/touch capture. ----
  // Links keep the existing route controller. This driver neither writes history
  // nor moves focus; disabling it leaves the previous site behaviour unchanged.
  function createEntryJourney() {
    if (/[?&]journey=0(?:&|$)/.test(location.search) || reduced.matches) return null;
    const track = document.createElement('div');
    track.className = 'entry-scroll-track';
    track.setAttribute('aria-hidden', 'true');
    const cue = document.createElement('p');
    cue.className = 'entry-scroll-cue';
    cue.textContent = 'Scroll to come inside';
    const arrival = document.createElement('nav');
    arrival.className = 'entry-arrival';
    arrival.setAttribute('aria-label','Continue from the counter');
    arrival.innerHTML = '<span>At the counter.</span><a href="#menu" data-zone="menu">View the menu <span aria-hidden="true">↗</span></a><a href="#room" data-zone="room">Look around the café <span aria-hidden="true">→</span></a>';
    arrival.hidden = true;
    const info = $('.welcome-info');
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = new URL('entry-scroll.css?v=349fc25079', document.currentScript?.src || location.href).href;
    let ready = false, disposed = false, active = false, span = 1;
    let requested = 0, baseline = null, visualZone = null, resizing = false;
    let measuredW = 0, measuredH = 0;
    const oldSceneId = stage.getAttribute('id');
    const oldInfoInert = info.inert;
    const oldInfoVisibility = info.style.visibility;
    const progress = () => clamp((window.scrollY || 0) / span, 0, 1);
    const resetMotion = () => {
      clearTimeout(watchdog); watchdog = 0; journeyStart = 0; last = 0;
      cancelAnimationFrame(raf); raf = 0;
      pendingFocus = null; pendingPlaceFocus = null; enteringRoom = false;
      root.classList.remove('entering-room');
    };
    function normalViewport() {
      return { x: stage.offsetLeft, y: stage.offsetTop, w: stage.clientWidth || 1, h: stage.clientHeight || 1 };
    }
    function size(p = 0) {
      span = Math.max(1, window.innerHeight) * 2.4;
      track.style.height = (span + window.innerHeight) + 'px';
      measuredW = window.innerWidth; measuredH = window.innerHeight;
      measure();
      window.scrollTo({ top: p * span, behavior: 'instant' });
    }
    function start(savedProgress = 0) {
      if (!ready || disposed || reduced.matches || !alive || fellBack) return false;
      // Returning Outside supersedes a still-decoding Room/Courtyard request.
      // Its completion/error callback must not reclaim the route afterwards.
      ++navigationTicket;
      clearTimeout(photoWaitTimer); photoWaitTimer = 0;
      loadStatus.textContent = '';
      resetMotion();
      if (active) stop();
      const previous = st.zone;
      st.zone = 'street'; st.pos = st.target = st.vel = st.cc = 0;
      counterBand = 0;
      for (const z of Object.keys(st.o)) st.o[z] = 0;
      setPlace('street', previous, true, false);
      updateNav('street');
      baseline = normalViewport();
      stage.id = 'entry-scroll-scene';
      document.body.appendChild(track);
      cue.hidden = false;
      document.body.appendChild(cue);
      arrival.hidden = true;
      document.body.appendChild(arrival);
      root.classList.add('entry-journey');
      active = true; requested = 0; visualZone = null;
      size(clamp(savedProgress, 0, 1));
      syncSheets(); kick();
      return true;
    }
    function stop() {
      if (!active) return;
      active = false; resetMotion();
      root.classList.remove('entry-journey');
      root.style.removeProperty('--entry-welcome');
      track.remove();
      cue.remove();
      arrival.remove();
      if (oldSceneId === null) stage.removeAttribute('id'); else stage.id = oldSceneId;
      info.inert = oldInfoInert; info.style.visibility = oldInfoVisibility;
      loadStatus.textContent = '';
      window.scrollTo({ top: 0, behavior: 'instant' });
      measure();
    }
    function paint(now) {
      if (!active || resizing || disposed || !alive || fellBack) return;
      requested = progress() * 3;
      cue.hidden = requested > .03;
      if (requested > .02) { load('street'); load('threshold'); load('counter'); }
      if (!active || !alive || fellBack) return;
      let ceiling = 3;
      if (!L.threshold.ready) ceiling = .999;
      else if (!L.counter.ready) ceiling = 1.999;
      // Keep the complete, sharp small facade until its enlarged version is
      // decoded; never magnify the mobile thumbnail while that upgrade loads.
      if (L.street.pendingFile) ceiling = .02;
      st.zone = 'street';
      st.pos = st.target = Math.min(requested, ceiling); st.vel = 0;
      arrival.hidden = st.pos < 2.94;
      st.gatedSince = 0;
      for (const z of Object.keys(st.o)) st.o[z] = 0;
      loadStatus.textContent = requested > ceiling ? 'Opening the café photograph…' : '';
      const zone = st.pos < 1.75 ? 'street' : st.pos < 2.75 ? 'room' : 'counter';
      if (zone !== visualZone) { updateNav(zone); visualZone = zone; }
      const welcome = clamp(1 - st.pos / .35, 0, 1);
      root.style.setProperty('--entry-welcome', String(welcome));
      info.inert = welcome < .99;
      info.style.visibility = welcome === 0 ? 'hidden' : oldInfoVisibility;
      render(now); syncSheets();
    }
    function resize() {
      if (!active || resizing) return;
      // ResizeObserver also fires for our own stage change; only a real viewport
      // change remaps the native scroll range. Preserve its logical fraction.
      if (window.innerWidth === measuredW && window.innerHeight === measuredH) { measure(); kick(); return; }
      const p = progress();
      resizing = true;
      root.classList.remove('entry-journey');
      updateNav('street'); baseline = normalViewport();
      root.classList.add('entry-journey');
      visualZone = null;
      size(p);
      resizing = false; kick();
    }
    function scroll() { if (active && !resizing) kick(); }
    function dispose() {
      stop(); disposed = true;
      window.removeEventListener('scroll', scroll);
      css.onload = null; css.onerror = null;
    }
    css.onload = () => {
      if (disposed || fellBack) return;
      ready = true;
      if (zoneFromHash() === 'street' && st.zone === 'street') start();
    };
    css.onerror = () => { ready = false; stop(); };
    window.addEventListener('scroll', scroll, { passive: true });
    document.head.appendChild(css);
    return {
      get active() { return active; },
      get wantsInterior() { return active && requested > .02; },
      start, stop, paint, resize, dispose,
      remember() { history.replaceState({ ...history.state, dripJourney: progress() }, '', location.href); },
      startGeometry() {
        const vp = { x: baseline.x - stage.offsetLeft, y: baseline.y - stage.offsetTop, w: baseline.w, h: baseline.h };
        return geom(shots.street, vp, cam('street'));
      },
      state: () => ({ enabled: true, ready, active, requested: +requested.toFixed(4), rendered: +st.pos.toFixed(4), scroll: window.scrollY || 0, range: span, phase: visualZone })
    };
  }

  // ---- housekeeping -----------------------------------------------------------------
  document.addEventListener('visibilitychange', () => {
    if (!alive || fellBack) return;
    if (document.visibilityState === 'hidden') {
      cancelAnimationFrame(raf); raf = 0; last = 0;
      if(placeAnimation && placeAnimation.playState === 'running')placeAnimation.pause();
      syncFacadeLife();
    } else {
      journeyStart = 0; last = 0;
      if(placeAnimation && placeAnimation.playState === 'paused')placeAnimation.play();
      syncFacadeLife(); kick();
    }
  });
  const onResize = () => {
    if (!alive) return;
    counterBand = 0;
    if (entryJourney?.active) { entryJourney.resize(); return; }
    measure(); render(performance.now()); syncSheets(); spy(); kick();
  };
  window.addEventListener('resize', onResize);

  // ---- start ------------------------------------------------------------------------
  try {
    buildStage();
    if (fellBack) return;
    alive = true;
  } catch (err) {
    console.error('Drip façade: falling back to the still page', err);
    const facade = $('.facade-img');
    if (facade && !$('.welcome-photo').contains(facade)) $('.welcome-photo').appendChild(facade);
    if (stage) stage.remove();
    root.classList.remove('stage', 'ready');
    root.classList.add('fixed');
    window.DripFacade = { mode: 'fixed', error: String(err) };
    return;
  }
  if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(stage);
  const first = zoneFromHash();
  history.replaceState({ drip: first }, '');
  go(first, { instant: true, focus: false });
  updateNav();
  if (first === 'menu') requestAnimationFrame(() => scrollMenuAnchor(location.hash));
  render(performance.now());
  syncSheets();
  kick();
  entryJourney = createEntryJourney();

  // Test hooks (the browser pane may throttle requestAnimationFrame when hidden).
  const snapshot = () => ({
    zone: st.zone, pos: +st.pos.toFixed(4), vel: +st.vel.toFixed(3), target: st.target,
    o: Object.fromEntries(Object.entries(st.o).map(([k, v]) => [k, +v.toFixed(3)])),
    layers: Object.fromEntries(Object.entries(L).map(([k, l]) => [k, { shown: l.shown, ready: l.ready, clip: l.layer.style.clipPath, opacity: l.layer.style.opacity }]))
  });
  window.DripFacade = {
    mode: 'stage',
    state: snapshot,
    rememberJourney: () => { if (entryJourney?.active) entryJourney.remember(); },
    journey: () => entryJourney ? entryJourney.state() : { enabled: false, active: false },
    go: (zone) => { navigate(zone); return snapshot(); },
    tick(ms = 16) {
      const n = Math.max(1, Math.round(ms / 16));
      let now = performance.now();
      for (let i = 0; i < n; i++) { now += 16; step(.016, now); }
      render(now);
      syncSheets();
      return snapshot();
    },
    finish() { finish(); render(performance.now()); syncSheets(); return snapshot(); },
    // Holds one frame of the spine for inspection: peek(1.5, 'menu').
    peek(pos, zone = st.zone, o) {
      st.zone = zone;
      st.pos = st.target = clamp(pos, 0, 3);
      st.vel = 0;
      const tg = sheetTargets();
      for (const z of Object.keys(st.o)) st.o[z] = o && z in o ? o[z] : tg[z];
      updateNav();
      render(performance.now());
      syncSheets();
      return snapshot();
    },
    passBy
  };
})();
