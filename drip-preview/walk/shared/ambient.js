/* Ambiance musicale originale, générée dans le navigateur (Web Audio) par ce code :
   une nappe très douce et des notes pincées espacées sur une gamme pentatonique (la mineur),
   avec de légers glissés d'attaque. Aucun fichier audio, échantillon ou mélodie existante.
   Désactivée au départ ; lecture, arrêt et volume seulement à la demande du visiteur.
   Pour utiliser plus tard un fichier sous licence : voir LISEZ-MOI.md, section « Son ». */
(function () {
  'use strict';

  const { el, icon, store } = window.Drip;
  const AC = window.AudioContext || window.webkitAudioContext;

  const SCALE = [57, 60, 62, 64, 67, 69, 72, 74, 76, 79];
  const CHORDS = [[45, 52, 55, 60], [50, 57, 60, 64], [48, 55, 62, 64], [43, 50, 57, 62]];
  const BEAT = 60 / 58;
  const SEED = 20261030;
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function random(seed) {
    let s = seed >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  function graph(ctx, destination) {
    const master = ctx.createGain();
    master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.knee.value = 12; comp.ratio.value = 2.5; comp.attack.value = 0.03; comp.release.value = 0.5;
    master.connect(comp);
    comp.connect(destination);

    const delay = ctx.createDelay(2);
    delay.delayTime.value = BEAT * 0.75;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.3;
    const damp = ctx.createBiquadFilter();
    damp.type = 'lowpass'; damp.frequency.value = 1600;
    const wet = ctx.createGain();
    wet.gain.value = 0.32;
    delay.connect(damp); damp.connect(feedback); feedback.connect(delay); damp.connect(wet); wet.connect(master);

    const padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass'; padFilter.frequency.value = 820; padFilter.Q.value = 0.4;
    const pad = ctx.createGain();
    pad.gain.value = 0.16;
    pad.connect(padFilter); padFilter.connect(master);

    const pluck = ctx.createGain();
    pluck.gain.value = 0.2;
    pluck.connect(master); pluck.connect(delay);
    return { master, pad, pluck };
  }

  function padChord(ctx, bus, notes, t, length) {
    for (const n of notes) {
      for (const detune of [-7, 6]) {
        const o = ctx.createOscillator();
        o.type = 'triangle'; o.frequency.value = mtof(n); o.detune.value = detune;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.11, t + 3);
        g.gain.setValueAtTime(0.11, t + length - 1);
        g.gain.linearRampToValueAtTime(0, t + length + 2.5);
        o.connect(g); g.connect(bus);
        o.start(t); o.stop(t + length + 2.6);
      }
    }
  }

  function pluckNote(ctx, bus, midi, t, bendCents) {
    const f = mtof(midi);
    const body = ctx.createOscillator();
    body.type = 'triangle';
    const shine = ctx.createOscillator();
    shine.type = 'sine'; shine.frequency.value = f * 2;
    const shineGain = ctx.createGain();
    shineGain.gain.value = 0.18;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.setValueAtTime(2600, t);
    tone.frequency.exponentialRampToValueAtTime(600, t + 1.4);
    if (bendCents) {
      body.frequency.setValueAtTime(f * Math.pow(2, -bendCents / 1200), t);
      body.frequency.exponentialRampToValueAtTime(f, t + 0.22);
    } else {
      body.frequency.setValueAtTime(f, t);
    }
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.45, t + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    body.connect(tone); shine.connect(shineGain); shineGain.connect(tone); tone.connect(env); env.connect(bus);
    body.start(t); shine.start(t); body.stop(t + 2.7); shine.stop(t + 2.7);
  }

  // Compose par petits pas jusqu'à `until` ; l'état (accord, note, silences) persiste entre appels.
  function composer(ctx, g, seed) {
    const rand = random(seed);
    let next = ctx.currentTime + 0.15;
    let step = 0;
    let chord = 0;
    let note = 5;
    let rest = 0;
    return function plan(until) {
      if (next < ctx.currentTime) next = ctx.currentTime + 0.05;
      while (next < until) {
        if (step % 16 === 0) { padChord(ctx, g.pad, CHORDS[chord % CHORDS.length], next, BEAT * 8); chord++; }
        if (rest > 0) rest--;
        else if (step % 2 === 0 && rand() < 0.5) {
          note = Math.max(2, Math.min(SCALE.length - 1, note + [-2, -1, -1, 0, 1, 1, 2][Math.floor(rand() * 7)]));
          pluckNote(ctx, g.pluck, SCALE[note], next + rand() * 0.025, rand() < 0.25 ? 50 + rand() * 50 : 0);
          if (rand() < 0.18) rest = 4 + Math.floor(rand() * 6);
        }
        next += BEAT / 2;
        step++;
      }
    };
  }

  const state = { ctx: null, g: null, plan: null, timer: null, playing: false, volume: Number(store.get('drip-volume') || 50) };
  const listeners = [];
  const emit = () => listeners.forEach((fn) => fn());
  const gainFor = (v) => (v / 100) * 0.9;

  function tick() { state.plan(state.ctx.currentTime + 1); }

  async function start() {
    if (!AC) return;
    if (!state.ctx) {
      state.ctx = new AC();
      state.g = graph(state.ctx, state.ctx.destination);
      state.plan = composer(state.ctx, state.g, SEED);
    }
    await state.ctx.resume();
    const t = state.ctx.currentTime;
    const gain = state.g.master.gain;
    gain.cancelScheduledValues(t);
    gain.setValueAtTime(gain.value, t);
    gain.linearRampToValueAtTime(gainFor(state.volume), t + 1.5);
    tick();
    window.clearInterval(state.timer);
    state.timer = window.setInterval(tick, 250);
    state.playing = true;
    emit();
  }

  function stop() {
    if (!state.ctx || !state.playing) return;
    const t = state.ctx.currentTime;
    const gain = state.g.master.gain;
    gain.cancelScheduledValues(t);
    gain.setValueAtTime(gain.value, t);
    gain.linearRampToValueAtTime(0, t + 0.6);
    window.clearInterval(state.timer);
    state.timer = null;
    state.playing = false;
    emit();
    window.setTimeout(() => { if (!state.playing && state.ctx) state.ctx.suspend(); }, 700);
  }

  function setVolume(v) {
    state.volume = v;
    store.set('drip-volume', String(v));
    if (state.playing) state.g.master.gain.setTargetAtTime(gainFor(v), state.ctx.currentTime, 0.1);
    emit();
  }

  // Onglet masqué : on suspend, puis on reprend si la musique était active.
  document.addEventListener('visibilitychange', () => {
    if (!state.ctx || !state.playing) return;
    if (document.hidden) {
      window.clearInterval(state.timer);
      state.ctx.suspend();
    } else {
      state.ctx.resume().then(() => { tick(); state.timer = window.setInterval(tick, 250); });
    }
  });

  function mount(container) {
    if (!AC) return null;
    const label = el('span');
    const toggle = el('button', { type: 'button', class: 'tool-btn sound-toggle', title: 'Turn music on' });
    const range = el('input', { type: 'range', min: '0', max: '100', step: '5', value: String(state.volume), 'aria-label': 'Music volume' });
    const volume = el('div', { class: 'volume', hidden: true }, range);
    function render() {
      toggle.setAttribute('aria-pressed', String(state.playing));
      toggle.title = state.playing ? 'Turn music off' : 'Turn music on';
      toggle.replaceChildren(icon(state.playing ? 'sound' : 'soundOff'), label);
      label.textContent = state.playing ? 'Music on' : 'Music off';
      volume.hidden = !state.playing;
      range.value = String(state.volume);
    }
    toggle.addEventListener('click', () => (state.playing ? stop() : start()));
    range.addEventListener('input', () => setVolume(Number(range.value)));
    listeners.push(render);
    render();
    const wrap = el('div', { class: 'sound' }, toggle, volume);
    container.append(wrap);
    return wrap;
  }

  // Contrôle de niveau hors ligne (tests) : rend la même musique et mesure crête et RMS.
  async function measure(seconds, volume) {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const rate = 44100;
    const ctx = new OAC(2, Math.ceil(rate * seconds), rate);
    const g = graph(ctx, ctx.destination);
    g.master.gain.value = gainFor(volume === undefined ? 100 : volume);
    composer(ctx, g, SEED)(seconds);
    const buffer = await ctx.startRendering();
    let peak = 0;
    let sum = 0;
    let n = 0;
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < data.length; i++) {
        const a = Math.abs(data[i]);
        if (a > peak) peak = a;
        sum += data[i] * data[i];
        n++;
      }
    }
    const rms = Math.sqrt(sum / n);
    return { seconds, volume: volume === undefined ? 100 : volume, peak, peakDb: 20 * Math.log10(peak), rmsDb: 20 * Math.log10(rms) };
  }

  const status = () => ({ supported: Boolean(AC), playing: state.playing, context: state.ctx ? state.ctx.state : 'none', volume: state.volume });

  window.DripSound = { mount, start, stop, setVolume, measure, status };
})();
