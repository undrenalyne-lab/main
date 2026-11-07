/* Visite au scroll : le défilement natif guide une caméra lente dans les photos originales du café.
   - Passages de porte liés au défilement : la porte s'ouvre en masque ; à l'arrêt l'image reste lisible
     (dedans la nouvelle pièce, autour la précédente), jamais deux photos superposées en transparence.
   - Autres passages minutés (fondu, pivot, demi-tour) : ils vont toujours à leur terme, à l'aller comme au retour.
   - Aucun détournement du scroll. Mouvement réduit (système, bouton ou ?motion=reduce) : lecture fixe. */
(function () {
  'use strict';

  const { announce, reduced } = window.Drip;
  const PHOTOS = window.DRIP_PHOTOS;
  const W = window.DRIP_WALK;
  const root = document.documentElement;
  const stage = document.getElementById('stage');
  const scrim = document.getElementById('scrim');
  const placeEl = document.getElementById('place');
  const sections = [...document.querySelectorAll('.beat')];
  const beats = sections.map((el) => W.beats.find((b) => b.id === el.dataset.beat));
  const n = beats.length;

  const MAX_ZOOM = 1.12; // rapprochement maximal au-delà du plein écran
  const ZONE = 0.35; // part du plan consacrée à l'approche d'une porte (liée au défilement)
  const P0 = 0.4; // avancée du passage atteinte à la fin de l'approche ; le reste est minuté
  const HYST = 0.05; // hystérésis des changements de plan minutés (part de la hauteur d'écran)
  const DUR = { portal: 1300, pan: 1100, turn: 1250, dissolve: 950 };

  const tools = document.getElementById('tools-slot');
  window.DripSound.mount(tools);
  tools.append(window.Drip.motionToggle());

  // Practical links are native links to the current café site, including without JavaScript.

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (t) => { const x = clamp(t, 0, 1); return x * x * (3 - 2 * x); };
  const ease = (t) => { const x = clamp(t, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, t) => a + (b - a) * t;
  const pick = (v) => (v && !Array.isArray(v) && typeof v === 'object' ? v[mode] : v);
  const isPortal = (i) => i > 0 && Boolean(beats[i].cut) && beats[i].cut.type === 'portal';
  // Même passage joué dans l'autre sens : pivot inversé, porte refermée.
  const flipCut = (c) => Object.assign({}, c, c.dir ? { dir: -c.dir } : {}, { back: !c.back });

  let vw = 0;
  let vh = 0;
  let dpr = 1;
  let mode = 'side';
  let cine = false;
  let tops = [];
  let heights = [];
  let active = -1;
  let chosen = null;
  let shown = null; // plan affiché au repos
  let shownBeat = -1;
  let trans = null; // passage minuté en cours
  let raf = 0;
  let glowKey = '';
  const layers = new Map();

  function shotOf(i) {
    if (beats[i].id === 'visit' && chosen) return pick(W.corners[chosen].shot);
    return pick(beats[i].shot);
  }
  // Caméra à plusieurs étapes (regard qui monte puis redescend, par exemple).
  function camAt(i, t) {
    const cam = beats[i].id === 'visit' && chosen ? pick(W.corners[chosen].cam) : pick(beats[i].cam);
    const segs = cam.length - 1;
    const x = clamp(t, 0, 1) * segs;
    const j = Math.min(segs - 1, Math.floor(x));
    const k = smooth(x - j);
    const a = cam[j];
    const b = cam[j + 1];
    return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  }

  // ---------- Calques photo ----------
  function fxFor(p) {
    return (W.fx || []).filter((f) => p.source.endsWith(f.source)).flatMap((f) => f.items);
  }

  function layerOf(key) {
    let L = layers.get(key);
    if (L) return L;
    const p = PHOTOS[key];
    const el = document.createElement('div');
    el.className = 'layer';
    el.dataset.shot = key;
    const shot = document.createElement('div');
    shot.className = 'shot';
    const img = document.createElement('img');
    img.decoding = 'async';
    img.alt = '';
    img.draggable = false;
    shot.append(img);
    const [cx, cy, cw, ch] = p.crop;
    for (const item of fxFor(p)) {
      const [x, y, w, h] = item.rect;
      const fx = document.createElement('div');
      fx.className = 'fx fx-' + item.kind;
      Object.assign(fx.style, {
        left: ((x - cx) / cw) * 100 + '%', top: ((y - cy) / ch) * 100 + '%',
        width: (w / cw) * 100 + '%', height: (h / ch) * 100 + '%'
      });
      shot.append(fx);
    }
    el.append(shot);
    stage.insertBefore(el, scrim);
    // Coordonnées logiques = pixels de la photo originale (recadrage compris), quel que soit le fichier chargé.
    L = { key, el, shot, img, files: p.files, W: cw, H: ch, crop: p.crop, tone: p.tone, base: 1, file: null, masked: false };
    layers.set(key, L);
    sizeLayer(L);
    return L;
  }

  // Le calque est posé à sa taille maximale (plein écran × rapprochement maximal) : la caméra ne fait que
  // le réduire. Fichier : le plus léger couvrant cette taille, sinon le plus grand original disponible.
  // Les dérivés ne dépassent jamais la résolution native : aucun agrandissement artificiel de fichier.
  function sizeLayer(L) {
    const cover = Math.max(vw / L.W, vh / L.H);
    L.base = cover * MAX_ZOOM;
    L.shot.style.width = Math.round(L.W * L.base) + 'px';
    L.shot.style.height = Math.round(L.H * L.base) + 'px';
    const need = L.W * L.base * dpr;
    const sorted = [...L.files].sort((a, b) => a.w - b.w);
    const f = sorted.find((x) => x.w >= need) || sorted[sorted.length - 1];
    if (f !== L.file && (!L.file || f.w > L.file.w)) {
      L.file = f;
      L.img.src = window.Drip.base + f.path;
    }
  }

  // Toujours plein écran : un portrait se parcourt verticalement, un paysage horizontalement.
  function geometry(L, cam) {
    // The arrival photo must show the complete sign and terrace before entering.
    // The doorway transition still uses these exact source coordinates.
    if (L.key === 'pro-street' || L.key === 'pro-street-m') {
      const top = Math.max(128, document.querySelector('.walk-navigation').getBoundingClientRect().bottom + 16);
      const room = Math.max(120, vh - top - 76);
      const s = Math.min(vw / L.W, room / L.H);
      const w = L.W * s, h = L.H * s;
      return { s, w, h, x: (vw - w) / 2, y: vw < 900 ? top + 12 : top + (room - h) / 2 };
    }
    const cover = Math.max(vw / L.W, vh / L.H);
    const s = cover * clamp(cam[2], 1, MAX_ZOOM);
    const w = L.W * s;
    const h = L.H * s;
    return { s, w, h, x: clamp(vw / 2 - cam[0] * w, vw - w, 0), y: clamp(vh / 2 - cam[1] * h, vh - h, 0) };
  }

  // Rectangle de la photo source (pixels) → écran, calque au repos.
  function rectOn(L, g, r) {
    return { x: g.x + (r[0] - L.crop[0]) * g.s, y: g.y + (r[1] - L.crop[1]) * g.s, w: r[2] * g.s, h: r[3] * g.s };
  }

  function draw(L, g, v) {
    L.shot.style.transform = `translate3d(${g.x.toFixed(1)}px, ${g.y.toFixed(1)}px, 0) scale(${(g.s / L.base).toFixed(5)})`;
    L.el.style.transform = v.tf || '';
    L.el.style.opacity = v.o >= 0.999 ? '' : Math.max(0, v.o).toFixed(3);
    L.el.style.zIndex = String(v.z);
    L.el.classList.add('is-on');
    if (v.mask) {
      const m = v.mask;
      const st = L.el.style;
      st.setProperty('--mx', m.x.toFixed(1) + 'px');
      st.setProperty('--my', m.y.toFixed(1) + 'px');
      st.setProperty('--mw', m.w.toFixed(1) + 'px');
      st.setProperty('--mh', m.h.toFixed(1) + 'px');
      st.setProperty('--mf', m.f.toFixed(1) + 'px');
      if (!L.masked) { L.el.classList.add('masked'); L.masked = true; }
    } else if (L.masked) {
      L.el.classList.remove('masked');
      L.masked = false;
    }
  }

  function hide(L) {
    if (!L.el.classList.contains('is-on')) return;
    L.el.classList.remove('is-on', 'masked');
    L.masked = false;
    L.el.style.transform = '';
    L.el.style.opacity = '';
  }

  // ---------- Passage de porte (lié au défilement) ----------
  // La même porte est alignée dans les deux images ; la précédente s'agrandit vers elle,
  // la suivante n'apparaît que dans l'ouverture, qui s'élargit jusqu'à tout l'écran.
  function portalVisuals(pre, gPre, post, gPost, cut, p, inO) {
    const e = ease(p);
    const A = rectOn(pre, gPre, cut.from);
    const B = rectOn(post, gPost, cut.to);
    const acx = A.x + A.w / 2;
    const acy = A.y + A.h / 2;
    const bcx = B.x + B.w / 2;
    const bcy = B.y + B.h / 2;
    const cx = lerp(acx, bcx, e);
    const cy = lerp(acy, bcy, e);
    const rh = A.h * Math.pow(B.h / A.h, e);
    const aOut = rh / A.h;
    const k0 = clamp((A.w / A.h) / (B.w / B.h), 0.9, 1.1); // ajustement d'aspect limité à 10 %, qui s'efface
    const sy = rh / B.h;
    const sx = sy * lerp(k0, 1, e);
    const tx = cx - sx * bcx;
    const ty = cy - sy * bcy;
    // L'ouverture garde la forme de la porte, puis s'élargit à la fin ; son bord est fondu, sauf à l'arrivée.
    const g = Math.pow(smooth(p), 2.4);
    const dw = A.w * aOut;
    const dh = A.h * aOut;
    const F = lerp(Math.max(3, Math.min(dw, dh) * 0.05), 36, smooth(p / 0.6)) * (1 - smooth((p - 0.75) / 0.25));
    let x1 = lerp(cx - dw / 2, 0, g);
    let y1 = lerp(cy - dh / 2, 0, g);
    let x2 = lerp(cx + dw / 2, vw, g);
    let y2 = lerp(cy + dh / 2, vh, g);
    // Jamais au-delà de la photo entrante : son bord ne doit pas apparaître comme une ligne nette.
    const inset = F / 2;
    x1 = Math.max(x1, tx + sx * gPost.x + inset);
    y1 = Math.max(y1, ty + sy * gPost.y + inset);
    x2 = Math.min(x2, tx + sx * (gPost.x + gPost.w) - inset);
    y2 = Math.min(y2, ty + sy * (gPost.y + gPost.h) - inset);
    const win = { x: x1, y: y1, w: Math.max(0, x2 - x1), h: Math.max(0, y2 - y1) };
    return {
      pre: { tf: `translate3d(${(cx - aOut * acx).toFixed(1)}px, ${(cy - aOut * acy).toFixed(1)}px, 0) scale(${aOut.toFixed(5)})`, o: 1 - smooth((p - 0.72) / 0.28), z: 1 },
      post: {
        tf: `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${sx.toFixed(5)}, ${sy.toFixed(5)})`,
        o: inO === undefined ? smooth(p / 0.06) : inO, z: 2,
        mask: { x: (win.x - tx) / sx, y: (win.y - ty) / sy, w: win.w / sx, h: win.h / sy, f: F / sy }
      }
    };
  }

  // ---------- Passages minutés ----------
  function timedVisuals(T) {
    const p = T.p;
    const e = ease(p);
    const type = T.cut.type;
    const tf = (x) => (Math.abs(x) < 0.05 ? '' : `translate3d(${x.toFixed(1)}px, 0, 0)`);
    if (type === 'turn') {
      const d = 0.4 * vw * (T.cut.dir || 1);
      return {
        pre: { tf: tf(-d * e), o: 1 - smooth(p / 0.5), z: 1 },
        post: { tf: tf(d * (1 - e)), o: smooth((p - 0.38) / 0.62), z: 2 }
      };
    }
    if (type === 'pan') {
      const d = 0.24 * vw * (T.cut.dir || 1);
      return {
        pre: { tf: tf(-d * e), o: 1 - smooth((p - 0.2) / 0.8), z: 1 },
        post: { tf: tf(d * (1 - e)), o: smooth(p / 0.55), z: 2 }
      };
    }
    return { pre: { o: 1 - smooth((p - 0.35) / 0.65), z: 1 }, post: { o: smooth(p / 0.6), z: 2 } };
  }

  function beginTimed(key, toBeat, now) {
    const fromBeat = shownBeat;
    let cut = { type: 'dissolve' };
    if (toBeat === fromBeat + 1 && beats[toBeat].cut) cut = beats[toBeat].cut;
    else if (toBeat === fromBeat - 1 && beats[fromBeat].cut) cut = flipCut(beats[fromBeat].cut);
    trans = { from: shown, to: key, fromBeat, toBeat, cut, p: 0, last: now };
  }

  function settle() {
    shown = trans.to;
    shownBeat = trans.toBeat;
    trans = null;
  }

  // ---------- Lumière ambiante autour des cadres ----------
  function glowFrom(L, g) {
    const t = L.tone || [70, 52, 40];
    const gx = clamp((g.x + g.w / 2) / vw, 0, 1);
    const key = L.key + ':' + Math.round(gx * 20);
    if (key === glowKey) return;
    glowKey = key;
    stage.style.setProperty('--glow', `rgb(${t[0]}, ${t[1]}, ${t[2]})`);
    stage.style.setProperty('--gx', (gx * 100).toFixed(0) + '%');
  }

  // ---------- Plan actif (textes, repère de lieu, voile de lisibilité) ----------
  function activeAt(mid) {
    let a = active;
    if (a < 0) {
      a = 0;
      while (a < n - 1 && mid >= tops[a + 1]) a++;
      return a;
    }
    while (a < n - 1 && mid >= tops[a + 1] + (isPortal(a + 1) ? 0 : HYST * vh)) a++;
    while (a > 0 && mid < tops[a] - (isPortal(a) ? 0 : HYST * vh)) a--;
    return a;
  }

  function placeOf(i) {
    return beats[i].id === 'visit' && chosen ? W.corners[chosen].label : beats[i].place;
  }

  function setActive(a) {
    if (active >= 0) sections[active].classList.remove('is-active');
    sections[a].classList.add('is-active');
    active = a;
    const place = placeOf(a);
    if (placeEl.textContent !== place) {
      placeEl.textContent = place;
      placeEl.classList.remove('is-shown');
      void placeEl.offsetWidth;
      placeEl.classList.add('is-shown');
    }
    const kind = beats[a].caption ? beats[a].caption.kind : null;
    stage.classList.toggle('sc-left', mode === 'side' && Boolean(kind));
    stage.classList.toggle('sc-bottom', mode === 'full' && Boolean(kind));
    document.dispatchEvent(new CustomEvent('drip:walk-view', { detail: { id: sections[a].id } }));
  }

  // ---------- Rendu ----------
  // Approche d'une porte : liée au défilement, une seule image qui s'avance vers la porte.
  // Franchissement : minuté (révélation opaque par la porte), il va toujours à son terme ;
  // un arrêt du défilement ne peut donc jamais figer deux photos superposées.
  function render(now) {
    raf = 0;
    if (!cine) return;
    const mid = window.scrollY + vh * 0.5;
    const a = activeAt(mid);
    if (a !== active) setActive(a);
    const used = new Set();

    let raw = 0;
    while (raw < n - 1 && mid >= tops[raw + 1]) raw++;
    const approach = isPortal(raw) && mid < tops[raw] + heights[raw] * ZONE;
    const target = approach ? raw - 1 : a; // plan à atteindre
    let t = 1;
    if (!approach) {
      const start = isPortal(a) ? tops[a] + heights[a] * ZONE : tops[a];
      const span = isPortal(a) ? heights[a] * (1 - ZONE) : heights[a];
      t = clamp((mid - start) / span, 0, 1);
    }
    const tOf = (i) => (i === target ? t : i < target ? 1 : 0);
    const key = shotOf(target);

    if (trans) {
      if (key === trans.from) {
        trans = { from: trans.to, to: trans.from, fromBeat: trans.toBeat, toBeat: trans.fromBeat, cut: flipCut(trans.cut), p: 1 - trans.p, last: now };
      } else if (key !== trans.to) {
        settle();
      } else {
        trans.toBeat = target;
      }
    }
    if (!trans && shown !== key) {
      if (shown === null) { shown = key; shownBeat = target; }
      else beginTimed(key, target, now);
    }
    if (trans) {
      const dur = DUR[trans.cut.type] || DUR.dissolve;
      trans.p = Math.min(1, trans.p + Math.max(0, now - trans.last) / dur);
      trans.last = now;
      if (trans.p >= 1) settle();
    }

    if (trans && trans.cut.type === 'portal') {
      // Franchissement minuté : côté porte (pre) et pièce suivante (post), quel que soit le sens.
      const back = Boolean(trans.cut.back);
      const preKey = back ? trans.to : trans.from;
      const postKey = back ? trans.from : trans.to;
      const preBeat = back ? trans.toBeat : trans.fromBeat;
      const postBeat = back ? trans.fromBeat : trans.toBeat;
      const r = trans.p;
      const p = back ? 1 - (1 - P0) * r : P0 + (1 - P0) * r;
      const inO = back ? 1 - smooth((r - 0.85) / 0.15) : smooth(r / 0.12);
      const pre = layerOf(preKey);
      const post = layerOf(postKey);
      const gPre = geometry(pre, camAt(preBeat, 1));
      const gPost = geometry(post, camAt(postBeat, tOf(postBeat)));
      const cut = beats[postBeat].cut && beats[postBeat].cut.type === 'portal' ? beats[postBeat].cut : trans.cut;
      const v = portalVisuals(pre, gPre, post, gPost, cut, p, inO);
      draw(pre, gPre, v.pre);
      draw(post, gPost, v.post);
      used.add(pre).add(post);
      glowFrom(p < 0.6 ? pre : post, p < 0.6 ? gPre : gPost);
    } else if (trans) {
      const pre = layerOf(trans.from);
      const post = layerOf(trans.to);
      const gPre = geometry(pre, camAt(trans.fromBeat, tOf(trans.fromBeat)));
      const gPost = geometry(post, camAt(trans.toBeat, tOf(trans.toBeat)));
      const v = timedVisuals(trans);
      draw(pre, gPre, v.pre);
      draw(post, gPost, v.post);
      used.add(pre).add(post);
      glowFrom(trans.p < 0.5 ? pre : post, trans.p < 0.5 ? gPre : gPost);
    } else {
      shownBeat = target;
      const L = layerOf(shown);
      const g = geometry(L, camAt(target, t));
      let v = { o: 1, z: 1 };
      if (approach && shown === shotOf(raw - 1)) {
        // Approche : l'image s'avance vers sa porte, seule (la pièce suivante est préparée, pas affichée).
        const post = layerOf(shotOf(raw));
        const q = clamp((mid - tops[raw]) / (heights[raw] * ZONE), 0, 1);
        v = portalVisuals(L, g, post, geometry(post, camAt(raw, 0)), beats[raw].cut, q * P0).pre;
      }
      draw(L, g, v);
      used.add(L);
      glowFrom(L, g);
    }
    layers.forEach((L) => { if (!used.has(L)) hide(L); });
    for (const j of [a - 1, a + 1, a + 2]) if (j >= 0 && j < n) layerOf(shotOf(j)); // vues proches seulement
    root.style.setProperty('--progress', (window.scrollY / Math.max(1, root.scrollHeight - vh)).toFixed(4));
    if (trans) kick();
  }

  function kick() { if (!raf) raf = requestAnimationFrame(render); }

  function measure() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    dpr = window.devicePixelRatio || 1;
    const next = vw >= 900 && vw / vh > 1 ? 'side' : 'full';
    if (next !== mode) { mode = next; trans = null; shown = null; shownBeat = -1; }
    root.classList.toggle('side', cine && mode === 'side');
    tops = sections.map((s) => s.getBoundingClientRect().top + window.scrollY);
    heights = sections.map((s) => s.offsetHeight);
    layers.forEach(sizeLayer);
    if (active >= 0) setActive(active);
  }

  function resizeAtView() {
    if (!cine) return; // Le document fixe garde son défilement natif.
    // Les dimensions mémorisées décrivent encore l'ancien viewport. Garder
    // le point regardé au milieu du plan, pas son ancien scrollY en pixels.
    const i = active >= 0 ? active : activeAt(window.scrollY + vh * 0.5);
    const fraction = heights[i] > 0
      ? clamp((window.scrollY + vh * 0.5 - tops[i]) / heights[i], 0, 1)
      : null;
    measure();
    if (fraction !== null && heights[i] > 0) {
      const top = clamp(tops[i] + heights[i] * fraction - vh * 0.5,
        0, Math.max(0, root.scrollHeight - vh));
      window.scrollTo({ top, behavior: 'instant' });
    }
    kick();
  }

  let introDone = false;
  function setCine() {
    cine = !reduced();
    root.classList.toggle('cine', cine);
    layers.forEach(hide);
    trans = null;
    shown = null;
    shownBeat = -1;
    if (active >= 0) sections[active].classList.remove('is-active');
    active = -1;
    if (!cine) { root.classList.remove('side'); return; }
    measure();
    if (!introDone && window.scrollY < vh * 0.2) {
      stage.classList.add('intro');
      window.setTimeout(() => stage.classList.remove('intro'), 3400);
    }
    introDone = true;
    kick();
  }

  // A direct view link lands beyond its approach, so a door link actually shows
  // that view. Native anchors remain the complete fallback in the still document.
  function jumpToView(id, options = {}) {
    if (!cine) return false;
    const i = sections.findIndex((section) => section.id === id);
    if (i < 0) return false;
    measure();
    const start = tops[i] + (isPortal(i) ? heights[i] * ZONE : 0);
    const y = clamp(start - vh * 0.5 + 2, 0, Math.max(0, root.scrollHeight - vh));
    if (options.history !== false && location.hash !== '#' + id) {
      history.pushState(null, '', '#' + id);
    }
    if (active >= 0) sections[active].classList.remove('is-active');
    active = -1;
    trans = null;
    shown = null;
    shownBeat = -1;
    window.scrollTo({ top: y, behavior: 'instant' });
    render(performance.now());
    if (options.focus !== false) sections[i].focus({ preventScroll: true });
    return true;
  }

  // ---------- Choisir un coin : la dernière scène prend sa photo ----------
  const visit = document.getElementById('visit');
  const visitTitle = document.getElementById('visit-title');
  const visitImg = visit.querySelector('.still img');
  const visitSource = visit.querySelector('.still source');
  const corners = [...document.querySelectorAll('[data-corner]')];
  for (const link of corners) {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      chosen = link.dataset.corner;
      const c = W.corners[chosen];
      for (const other of corners) {
        if (other === link) other.setAttribute('aria-current', 'true');
        else other.removeAttribute('aria-current');
      }
      visitTitle.textContent = c.line;
      const side = typeof c.shot === 'string' ? c.shot : c.shot.side;
      const full = typeof c.shot === 'string' ? c.shot : c.shot.full;
      visitImg.srcset = window.Drip.srcset(side);
      visitImg.src = window.Drip.base + window.Drip.largest(side).path;
      if (visitSource) visitSource.srcset = window.Drip.srcset(full);
      visit.querySelector('.photo-desc').textContent = 'Photo: ' + c.alt;
      visit.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
      visitTitle.focus({ preventScroll: true });
      announce(c.line);
      if (active >= 0) setActive(active);
      kick();
    });
  }

  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', resizeAtView);
  window.addEventListener('load', () => { if (cine) { measure(); kick(); } });
  document.addEventListener('drip:motion', setCine);
  setCine();

  window.DripWalk = {
    jumpToView,
    // Point de test : dessine une image tout de suite (utile quand le navigateur ralentit l'animation d'un onglet masqué).
    tick: () => render(performance.now()),
    state: () => ({
      cine, mode, active, beat: active >= 0 ? beats[active].id : null, chosen, shown,
      transition: trans ? { from: trans.from, to: trans.to, type: trans.cut.type, p: Number(trans.p.toFixed(3)) } : null,
      visible: [...layers.values()].filter((L) => L.el.classList.contains('is-on'))
        .map((L) => ({ shot: L.key, opacity: L.el.style.opacity || '1', masked: L.masked }))
    })
  };
})();
