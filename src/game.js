'use strict';
(() => {
  const H = World.H;
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mod = (a, n) => ((a % n) + n) % n;

  let viewW = 1280, S = 1, RS = 0;
  let sidewaysPref = false;
  try { sidewaysPref = localStorage.getItem('deadheir.sideways') === '1'; } catch (e) { /* storage blocked */ }
  let sky, clouds, fogTex, vignette, grain, lightCv, lightCtx;
  const glow = {};

  function mk(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
    return c;
  }

  // ---------------------------------------------------------------- static paintings
  function paintSky() {
    const s = 0.5 * RS, c0 = mk(viewW * s, H * s), c = c0.getContext('2d');
    c.scale(s, s);
    const g = c.createLinearGradient(0, 0, 0, 520);
    g.addColorStop(0, '#070a1a'); g.addColorStop(0.45, '#1a1d3a'); g.addColorStop(0.78, '#3a3354'); g.addColorStop(1, '#5a3e4c');
    c.fillStyle = g; c.fillRect(0, 0, viewW, H);
    const r = P.rng(99);
    // painterly horizontal strokes matching the gradient
    for (let i = 0; i < 900; i++) {
      const y = r() * 520, x = r() * viewW, t = y / 520;
      const hue = 232 + t * 50, l = 6 + t * t * 26;
      c.globalAlpha = 0.18; c.strokeStyle = P.hsl(hue + (r() - 0.5) * 16, 30, l + (r() - 0.5) * 6);
      c.lineWidth = 3 + r() * 8; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + 40 + r() * 90, y + (r() - 0.5) * 6); c.stroke();
    }
    c.globalAlpha = 1;
    for (let i = 0; i < 260; i++) {
      const x = r() * viewW, y = Math.pow(r(), 1.6) * 380, sz = r() < 0.08 ? 1.6 : 0.8;
      c.fillStyle = `rgba(220,230,255,${0.3 + r() * 0.6})`; c.fillRect(x, y, sz, sz);
    }
    // moon halo and disc
    const mx = viewW * 0.76, my = 140;
    const halo = c.createRadialGradient(mx, my, 30, mx, my, 360);
    halo.addColorStop(0, 'rgba(200,215,255,0.32)'); halo.addColorStop(0.3, 'rgba(150,160,220,0.12)'); halo.addColorStop(1, 'rgba(80,80,160,0)');
    c.fillStyle = halo; c.fillRect(0, 0, viewW, H);
    c.fillStyle = '#e9ecf2'; c.beginPath(); c.arc(mx, my, 44, 0, P.TAU); c.fill();
    c.save(); c.beginPath(); c.arc(mx, my, 44, 0, P.TAU); c.clip();
    P.clump(c, r, mx, my, 44, [215, 25, 84], { a: 0.5, n: 60, sq: 1, lv: 10 });
    for (let i = 0; i < 9; i++) { c.fillStyle = 'rgba(150,160,185,0.35)'; P.dab(c, mx - 30 + r() * 60, my - 30 + r() * 60, 3 + r() * 8, 3 + r() * 6, r()); }
    const sh = c.createRadialGradient(mx - 20, my - 10, 10, mx - 10, my, 60);
    sh.addColorStop(0, 'rgba(0,0,20,0)'); sh.addColorStop(1, 'rgba(40,40,80,0.4)');
    c.fillStyle = sh; c.fillRect(mx - 50, my - 50, 100, 100);
    c.restore();
    // ember glow of a dead sunset on the far left horizon
    const em = c.createRadialGradient(viewW * 0.12, 470, 10, viewW * 0.12, 470, 420);
    em.addColorStop(0, 'rgba(160,80,70,0.28)'); em.addColorStop(1, 'rgba(120,60,80,0)');
    c.fillStyle = em; c.fillRect(0, 0, viewW, H);
    return { cv: c0, mx, my };
  }

  function paintClouds() {
    const W = 2048, s = 0.4 * RS, c0 = mk(W * s, 420 * s), c = c0.getContext('2d');
    c.scale(s, s);
    const r = P.rng(5);
    for (let i = 0; i < 16; i++) {
      const x = r() * W, y = 60 + r() * 300, w = 160 + r() * 260;
      for (const ox of [x, x - W, x + W]) {
        if (ox < -w * 1.5 || ox > W + w * 1.5) continue;
        const rr = P.rng(1000 + i);
        for (let k = 0; k < 8; k++) {
          P.clump(c, rr, ox + (rr() - 0.5) * w, y + (rr() - 0.5) * 30, w * 0.25, [238, 22, 24 + y * 0.03], {
            a: 0.22, sq: 0.35, n: 26, rot: 0, lv: 8, hl: [225, 30, 58], hla: 0.25,
          });
        }
      }
    }
    return c0;
  }

  function paintFog() {
    const W = 1024, s = 0.25, c0 = mk(W * s, 220 * s), c = c0.getContext('2d');
    c.scale(s, s);
    const r = P.rng(8);
    for (let i = 0; i < 60; i++) {
      const x = r() * W, y = 70 + r() * 80, rx = 80 + r() * 140, ry = 22 + r() * 30;
      for (const ox of [x - W, x, x + W]) {
        const g = c.createRadialGradient(ox, y, 0, ox, y, rx);
        g.addColorStop(0, 'rgba(170,185,225,0.16)'); g.addColorStop(1, 'rgba(170,185,225,0)');
        c.fillStyle = g; c.save(); c.translate(ox, y); c.scale(1, ry / rx); c.translate(-ox, -y);
        c.beginPath(); c.arc(ox, y, rx, 0, P.TAU); c.fill(); c.restore();
      }
    }
    return c0;
  }

  function paintGlow(rgb) {
    const c0 = mk(128, 128), c = c0.getContext('2d');
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(0.25, `rgba(${rgb},0.45)`); g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g; c.fillRect(0, 0, 128, 128);
    return c0;
  }

  function paintVignette() {
    const s = 0.25, c0 = mk(viewW * s, H * s), c = c0.getContext('2d');
    c.scale(s, s);
    const g = c.createRadialGradient(viewW / 2, H * 0.48, H * 0.35, viewW / 2, H * 0.5, viewW * 0.72);
    g.addColorStop(0, 'rgba(0,0,8,0)'); g.addColorStop(1, 'rgba(0,0,8,0.78)');
    c.fillStyle = g; c.fillRect(0, 0, viewW, H);
    return c0;
  }

  function paintGrain() {
    // canvas weave + tooth so the whole frame reads like paint on linen
    const c0 = mk(256, 256), c = c0.getContext('2d');
    const img = c.createImageData(256, 256), d = img.data, r = P.rng(31);
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const weave = (Math.sin(x * 1.6) + Math.sin(y * 1.6)) * 14;
      const v = 128 + weave + (r() - 0.5) * 70;
      const i = (y * 256 + x) * 4;
      d[i] = d[i + 1] = d[i + 2] = clamp(v, 0, 255); d[i + 3] = 255;
    }
    c.putImageData(img, 0, 0);
    return ctx.createPattern(c0, 'repeat');
  }

  // When the phone is held upright and the player chose to play sideways,
  // the whole app is rotated 90° with CSS and laid out in swapped dimensions.
  function applySideways() {
    const on = sidewaysPref && innerHeight > innerWidth;
    const app = $('app');
    document.body.classList.toggle('sideways', on);
    app.style.width = on ? innerHeight + 'px' : '';
    app.style.height = on ? innerWidth + 'px' : '';
    app.style.transform = on ? `translateX(${innerWidth}px) rotate(90deg)` : '';
    document.body.classList.toggle('portrait', !on && innerHeight > innerWidth);
    $('rotate').textContent = sidewaysPref ? 'Upright' : 'Sideways';
    return on;
  }

  async function setSideways(on) {
    sidewaysPref = on;
    try { localStorage.setItem('deadheir.sideways', on ? '1' : '0'); } catch (e) { /* storage blocked */ }
    if (on && innerHeight > innerWidth) {
      // Prefer a real landscape lock (Android); fall back to rotating the page (iOS)
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
        await screen.orientation.lock('landscape');
      } catch (e) { /* not supported: CSS rotation takes over */ }
    } else if (!on) {
      try { screen.orientation.unlock(); } catch (e) { /* not supported */ }
      try { if (document.fullscreenElement) await document.exitFullscreen(); } catch (e) { /* not in fullscreen */ }
    }
    resize();
  }

  function resize() {
    const side = applySideways();
    const w = side ? innerHeight : innerWidth, h = side ? innerWidth : innerHeight;
    document.body.classList.toggle('compact', h < 540);
    viewW = Math.round(clamp((720 * w) / h, 960, World.MAXVIEW));
    let cssW, cssH;
    if (w / h > viewW / H) { cssH = h; cssW = (h * viewW) / H; } else { cssW = w; cssH = (w * H) / viewW; }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    S = clamp((cssH * dpr) / H, 0.5, 1.6);
    cv.width = Math.round(viewW * S); cv.height = Math.round(H * S);
    cv.style.width = cssW + 'px'; cv.style.height = cssH + 'px';
    const nRS = Math.ceil(S * 4) / 4;
    if (nRS !== RS) { RS = nRS; World.reset(); clouds = paintClouds(); }
    sky = paintSky(); vignette = paintVignette();
    lightCv = mk(viewW / 4, H / 4); lightCtx = lightCv.getContext('2d');
    if (!grain) grain = paintGrain();
    if (!fogTex) fogTex = paintFog();
    if (!glow.warm) { glow.warm = paintGlow('255,170,90'); glow.cool = paintGlow('170,220,255'); glow.fly = paintGlow('210,255,150'); glow.gold = paintGlow('255,220,150'); }
  }

  // ---------------------------------------------------------------- state
  const state = {
    mode: 'title', t: 0, cam: 0, camY: 0, camDir: 1,
    found: new Set(), seen: new Set(), echoes: new Set(),
    keys: {}, touch: { l: false, r: false, jump: false },
    lantern: 3, checkpoint: 200, inv: 0, lock: 0, fade: 0, respawning: false,
    quest: { met: false, cells: new Set(), done: false },
    buster: false, charging: false, charge: 0,
    flash: 0, strikeT: 99, nextStrike: 22,
    maxLantern: 3, prizes: new Set(), fairMet: false, ticket: false, rode: false, ride: null, wheelA: 0,
  };
  const player = { x: 200, y: World.groundY(200), vx: 0, vy: 0, ground: true, face: 1, sw: 0, swv: 0, lantern: [0, 0] };
  const CLUES = Object.keys(STORY).filter(k => STORY[k].clue);
  const ECHOES = Object.keys(STORY).filter(k => STORY[k].echo);
  const BONES_X = 2290;

  // Blue Bones' Energy Cells: one needs the headstone, one the fountain bowls, one is guarded by shades
  const CELLS = [
    { id: 'c1', x: 461, y: 290 },
    { id: 'c2', x: 3200, y: 250 },
    { id: 'c3', x: 3700, y: 552 },
  ];
  // shades patrol these stretches of path: [from, to, count]
  const SHADE_ZONES = [[1380, 1620, 1], [3420, 3800, 2], [4060, 4420, 2]];
  let shades = [];
  function spawnShades() {
    shades = [];
    for (const [a, b, n] of SHADE_ZONES) {
      for (let i = 0; i < n; i++) {
        shades.push({ x: a + ((b - a) * (i + 0.5)) / n, y: 0, a, b, dir: i % 2 ? -1 : 1, hp: 3, flash: 0, ph: i * 2.1 + a, alive: true });
      }
    }
  }
  spawnShades();
  const shots = [];

  const flies = Array.from({ length: 70 }, (_, i) => {
    const r = P.rng(500 + i), zs = [0.4, 0.66, 1, 1.45];
    return { x: r() * 3000, y: 380 + r() * 300, z: zs[i % 4], ph: r() * 10, sp: 0.5 + r() };
  });
  const leaves = Array.from({ length: 16 }, (_, i) => {
    const r = P.rng(900 + i);
    return { x: r() * 2000, y: r() * H, z: 1 + r() * 0.6, rot: r() * 6, vr: (r() - 0.5) * 3, vy: 20 + r() * 30, hue: 8 + r() * 30, ph: r() * 6 };
  });
  const motes = Array.from({ length: 46 }, (_, i) => {
    const r = P.rng(1300 + i);
    return { u: r(), v: r(), ph: r() * 6, sp: 0.3 + r() * 0.7 };
  });
  const wisps = [];
  const bats = Array.from({ length: 8 }, (_, i) => {
    const r = P.rng(1700 + i);
    return { z: [0.3, 0.45, 0.62][i % 3], x: r() * 3000, y: 120 + r() * 200, sp: 30 + r() * 50, ph: r() * 6, amp: 20 + r() * 40 };
  });
  const FOUNTAIN_X = 3200;

  // ---------------------------------------------------------------- audio
  const Audio = {
    ac: null, master: null, muted: false,
    start() {
      if (this.ac) return;
      try {
        const ac = new (window.AudioContext || window.webkitAudioContext)();
        this.ac = ac;
        this.master = ac.createGain(); this.master.gain.value = this.muted ? 0 : 0.8; this.master.connect(ac.destination);
        const buf = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate), d = buf.getChannelData(0);
        let last = 0;
        for (let i = 0; i < d.length; i++) { last = last * 0.97 + (Math.random() * 2 - 1) * 0.03; d[i] = last * 4; }
        const wind = ac.createBufferSource(); wind.buffer = buf; wind.loop = true;
        const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 400; bp.Q.value = 0.7;
        const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 250;
        lfo.connect(lg); lg.connect(bp.frequency); lfo.start();
        const wg = ac.createGain(); wg.gain.value = 0.35;
        wind.connect(bp); bp.connect(wg); wg.connect(this.master); wind.start();
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 300;
        const dg = ac.createGain(); dg.gain.value = 0.05; lp.connect(dg); dg.connect(this.master);
        for (const f of [55, 82.4, 110.3]) {
          const o = ac.createOscillator(); o.type = f > 100 ? 'sine' : 'triangle'; o.frequency.value = f; o.detune.value = (Math.random() - 0.5) * 12;
          o.connect(lp); o.start();
        }
      } catch (e) { this.ac = null; }
    },
    chime(base = 660) {
      if (!this.ac) return;
      const ac = this.ac, t = ac.currentTime;
      [1, 1.5, 2.01].forEach((m, i) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.frequency.value = base * m; o.type = 'sine';
        g.gain.setValueAtTime(0, t + i * 0.12); g.gain.linearRampToValueAtTime(0.08 / (i + 1), t + i * 0.12 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 2.5);
        o.connect(g); g.connect(this.master); o.start(t + i * 0.12); o.stop(t + i * 0.12 + 2.6);
      });
    },
    blip(type, f0, f1, dur, vol) {
      if (!this.ac) return;
      const ac = this.ac, t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
    },
    zap(big) { this.blip('square', big ? 520 : 960, big ? 90 : 380, big ? 0.38 : 0.1, 0.045); },
    thud() { this.blip('triangle', 180, 50, 0.16, 0.14); },
    hit() { this.blip('sawtooth', 240, 40, 0.45, 0.07); },
    jump() { this.blip('sine', 300, 520, 0.18, 0.04); },
    thunder() {
      if (!this.ac) return;
      const ac = this.ac, t = ac.currentTime, len = 3.5;
      const buf = ac.createBuffer(1, ac.sampleRate * len, ac.sampleRate), d = buf.getChannelData(0);
      let v = 0;
      for (let i = 0; i < d.length; i++) { v = v * 0.985 + (Math.random() * 2 - 1) * 0.015; d[i] = v * 9; }
      const src = ac.createBufferSource(), lp = ac.createBiquadFilter(), g = ac.createGain();
      src.buffer = buf; lp.type = 'lowpass'; lp.frequency.value = 160;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5, t + 0.15);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      src.connect(lp); lp.connect(g); g.connect(this.master); src.start(t);
    },
    // A warbling calliope waltz that swells as you near the fair.
    calliope(level) {
      if (!this.ac) return;
      const ac = this.ac;
      if (!this.cal) {
        const g = ac.createGain(); g.gain.value = 0;
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1600;
        lp.connect(g); g.connect(this.master);
        this.cal = { g, lp, next: ac.currentTime + 0.1, i: 0 };
      }
      const cal = this.cal;
      cal.g.gain.setTargetAtTime(level * 0.05, ac.currentTime, 0.4);
      if (level < 0.01) { cal.next = ac.currentTime + 0.1; return; }
      const MEL = [587, 440, 349, 587, 440, 349, 554, 440, 330, 554, 440, 330, 523, 440, 349, 466, 392, 294, 440, 349, 294, 440, 330, 277];
      const BASS = [147, 147, 110, 110, 131, 117, 147, 110];
      while (cal.next < ac.currentTime + 0.4) {
        const t = cal.next, i = cal.i % MEL.length, beat = 0.34;
        const note = (f, len, vol, type) => {
          const o = ac.createOscillator(), e = ac.createGain();
          o.type = type; o.frequency.value = f * (1 + Math.sin(t * 5) * 0.006); // a tired, wobbling reed
          e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(vol, t + 0.02); e.gain.exponentialRampToValueAtTime(0.001, t + len);
          o.connect(e); e.connect(cal.lp); o.start(t); o.stop(t + len + 0.05);
        };
        note(MEL[i], beat * 0.9, 0.5, 'square');
        if (i % 3 === 0) note(BASS[Math.floor(i / 3) % BASS.length], beat * 2.6, 0.6, 'triangle');
        cal.next += beat; cal.i++;
      }
    },
    booth(name) {
      const S = {
        splash: ['triangle', 900, 300, 0.12, 0.05], pop: ['square', 1400, 180, 0.08, 0.06], thunk: ['triangle', 260, 110, 0.08, 0.07],
        clink: ['sine', 1800, 1500, 0.15, 0.04], clank: ['square', 420, 170, 0.14, 0.05], shot: ['square', 2200, 900, 0.03, 0.015],
        lose: ['sawtooth', 300, 140, 0.45, 0.04],
      };
      if (name === 'ding') return this.chime(990);
      if (name === 'win') return this.chime(660);
      if (S[name]) this.blip(...S[name]);
    },
    // iOS suspends audio after the screen locks; background tabs should go quiet
    wake() { if (this.ac && this.ac.state === 'suspended' && !document.hidden) this.ac.resume(); },
    sleep() { if (this.ac && this.ac.state === 'running') this.ac.suspend(); },
    toggle() {
      this.muted = !this.muted;
      if (this.master) this.master.gain.value = this.muted ? 0 : 0.8;
      $('mute').textContent = this.muted ? 'Sound: off' : 'Sound: on';
    },
  };

  // ---------------------------------------------------------------- UI
  const dlg = { queue: [], full: '', shown: 0, onDone: null, choices: null, speaker: null };

  function openDialog(title, pages, onDone, choices) {
    state.mode = 'dialog';
    state.charging = false;
    dlg.queue = pages.slice(); dlg.onDone = onDone || null; dlg.choices = choices || null; dlg.speaker = null;
    $('dlg-title').textContent = title;
    $('dialog').classList.add('show');
    nextPage();
  }
  function nextPage() {
    $('dlg-choices').innerHTML = '';
    if (!dlg.queue.length) {
      $('dialog').classList.remove('show');
      state.mode = 'play';
      const cb = dlg.onDone; dlg.onDone = null; if (cb) cb();
      return;
    }
    dlg.full = dlg.queue.shift(); dlg.shown = 0;
    $('dlg-text').textContent = '';
    $('dlg-more').style.visibility = 'hidden';
  }
  function advance() {
    if (dlg.shown < dlg.full.length) { dlg.shown = dlg.full.length; return; }
    if (dlg.choices && !dlg.queue.length) return; // waiting on a choice
    nextPage();
  }
  function tickDialog(dt) {
    if (state.mode !== 'dialog') return;
    if (dlg.shown < dlg.full.length) {
      dlg.shown = Math.min(dlg.full.length, dlg.shown + dt * 55);
      $('dlg-text').textContent = dlg.full.slice(0, Math.floor(dlg.shown));
    } else if ($('dlg-more').style.visibility !== 'visible') {
      $('dlg-text').textContent = dlg.full;
      if (dlg.choices && !dlg.queue.length) {
        if (!$('dlg-choices').children.length) {
          for (const [i, ch] of dlg.choices.entries()) {
            const b = document.createElement('button'); b.textContent = `${i + 1}. ${ch.label}`;
            b.onclick = e => { e.stopPropagation(); $('dialog').classList.remove('show'); state.mode = 'play'; ch.fn(); };
            $('dlg-choices').appendChild(b);
          }
          $('dlg-choices').firstChild.focus({ preventScroll: true });
        }
      } else $('dlg-more').style.visibility = 'visible';
    }
  }

  function updateHud() {
    $('clues').textContent = `Clues ${state.found.size} / ${CLUES.length}`;
    $('lantern').innerHTML = Array.from({ length: state.maxLantern }, (_, i) => `<i class="${i < state.lantern ? 'on' : ''}"></i>`).join('');
    const prizes = $('prize-list');
    prizes.innerHTML = '';
    for (const g of Carnival.GAMES) {
      const li = document.createElement('li'), pz = FAIR.prizes[g.id];
      if (state.prizes.has(g.id)) li.innerHTML = `<b>${pz.title}</b><span>${pz.note}</span>`;
      else { li.className = 'unknown'; li.innerHTML = `<b>${Minigames.title(g.id)}</b><span>Not yet won.</span>`; }
      prizes.appendChild(li);
    }
    const q = state.quest, n = q.cells.size;
    $('cells').hidden = !q.met;
    $('cells').textContent = q.done ? 'Bone Buster' : `Energy Cells ${n} / 3`;
    $('t-fire').hidden = !state.buster;
    const list = $('journal-list');
    list.innerHTML = '';
    for (const id of CLUES) {
      const li = document.createElement('li');
      if (state.found.has(id)) { li.innerHTML = `<b>${STORY[id].title}</b><span>${STORY[id].note}</span>`; }
      else { li.className = 'unknown'; li.innerHTML = '<b>Not yet found</b><span>Something still waits on the grounds.</span>'; }
      list.appendChild(li);
    }
    const echoes = $('echo-list');
    echoes.innerHTML = '';
    for (const id of ECHOES) {
      const li = document.createElement('li');
      if (state.echoes.has(id)) li.innerHTML = `<b>${STORY[id].title}</b><span>${STORY[id].note}</span>`;
      else { li.className = 'unknown'; li.innerHTML = '<b>Unheard</b><span>A pale voice is waiting somewhere.</span>'; }
      echoes.appendChild(li);
    }
    $('side').textContent = q.done
      ? 'Blue Bones is back at full power. You carry his Bone Buster: F to fire, hold F to charge.'
      : q.met
        ? `Blue Bones needs his three Energy Cells: the tallest headstone, high above the fountain, and the shades' stretch by the cellar. ${n} of 3 found.`
        : n ? `You have found ${n} humming capsule${n > 1 ? 's' : ''}. Someone must be missing them.`
          : 'Something rattles inside the Vane mausoleum.';
  }

  function toggleJournal(force) {
    const open = force ?? !$('journal').classList.contains('show');
    if (state.mode !== (open ? 'play' : 'journal')) return; // only opens from play, only closes itself
    $('journal').classList.toggle('show', open);
    state.mode = open ? 'journal' : 'play';
  }

  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  }

  function talkBones() {
    const q = state.quest;
    if (!q.met && q.cells.size === 3) {
      q.met = true; q.done = true; state.buster = true;
      Audio.chime(880);
      openDialog(BONES.name, [...BONES.meet.slice(0, 3), BONES.already, ...BONES.done],
        () => { updateHud(); toast('Bone Buster: F to fire, hold to charge'); });
    } else if (!q.met) {
      q.met = true;
      openDialog(BONES.name, BONES.meet, () => { updateHud(); toast('Side quest: the Energy Cells'); });
    } else if (q.done) {
      openDialog(BONES.name, [BONES.after[Math.floor(Math.random() * BONES.after.length)]]);
    } else if (q.cells.size < 3) {
      openDialog(BONES.name, [BONES.waiting(q.cells.size)]);
    } else {
      q.done = true; state.buster = true;
      Audio.chime(880);
      openDialog(BONES.name, BONES.done, () => { updateHud(); toast('Bone Buster: F to fire, hold to charge'); });
    }
    dlg.speaker = 'bones';
  }

  function talkBarker() {
    const n = state.prizes.size;
    if (!state.fairMet) { state.fairMet = true; openDialog(FAIR.barker, FAIR.meet); }
    else if (n === 5 && !state.ticket) {
      state.ticket = true; Audio.chime(880);
      openDialog(FAIR.barker, FAIR.ticket, () => toast('Golden ticket: ride the wheel'));
    } else if (state.ticket) openDialog(FAIR.barker, [FAIR.after]);
    else openDialog(FAIR.barker, [FAIR.progress(n)]);
    dlg.speaker = 'barker';
  }

  function playBooth(id) {
    const pz = FAIR.prizes[id];
    state.mode = 'mini';
    document.body.classList.add('mini-open');
    Minigames.open(id, {
      prize: `You take home ${pz.name}. ${pz.note}`,
      sfx: name => Audio.booth(name),
      onWin: () => {
        const first = !state.prizes.has(id);
        state.prizes.add(id);
        if (first) updateHud();
        return first;
      },
      onClose: () => {
        state.mode = 'play';
        document.body.classList.remove('mini-open');
        if (state.prizes.size === 5 && !state.ticket) toast('Mister Lamb has something for you');
      },
    });
  }

  // Board the wheel in whichever gondola is at the bottom; it carries you round once.
  function boardWheel() {
    let best = 0, bd = 1e9;
    for (let i = 0; i < 12; i++) {
      const a = mod(state.wheelA + (i / 12) * P.TAU, P.TAU), d = Math.abs(a - Math.PI / 2);
      if (d < bd) { bd = d; best = i; }
    }
    state.ride = { start: state.wheelA, car: best, half: false };
    Audio.chime(520);
  }

  function updateRide() {
    const r = state.ride;
    if (!r) return;
    const k = (state.wheelA - r.start) / P.TAU;
    if (k > 0.5 && !r.half) { r.half = true; if (!state.rode) openDialog('The Wheel', FAIR.wheelRide.slice(0, 2)); }
    if (k >= 1) {
      state.ride = null;
      if (!state.rode) {
        state.rode = true; state.maxLantern = 4; state.lantern = 4; updateHud();
        openDialog('The Wheel', FAIR.wheelRide.slice(2));
        toast('Your lantern holds a fourth flame');
      } else openDialog('The Wheel', [FAIR.wheelAgain]);
    }
  }

  function examine(spot) {
    if (spot.id === 'bones') return talkBones();
    if (spot.id === 'barker') return talkBarker();
    if (Minigames.has(spot.id)) return playBooth(spot.id);
    if (spot.id === 'wheel') return state.ticket ? boardWheel() : openDialog('The Wheel', [FAIR.wheelClosed]);
    const s = STORY[spot.id];
    if (spot.id === 'door') {
      if (state.found.size < CLUES.length) {
        openDialog(s.title, [`${s.locked} (${state.found.size} of ${CLUES.length} clues found)`]);
      } else {
        openDialog(s.title, [s.ask], null, [
          ...SUSPECTS.map(su => ({ label: su.name, fn: () => accuse(su.id) })),
          { label: 'Not yet. I need to think.', fn: () => {} },
        ]);
      }
      return;
    }
    const first = !state.seen.has(spot.id);
    state.seen.add(spot.id);
    if (s.echo && first) { state.echoes.add(spot.id); Audio.chime(392); updateHud(); toast(`Echo heard: ${s.title}`); }
    if (s.clue && first) { state.found.add(spot.id); Audio.chime(spot.id === 'keys' ? 520 : 660); updateHud(); toast(`Clue found: ${s.title}`); }
    openDialog(s.title, s.text);
  }

  function collectCell(c) {
    const q = state.quest;
    q.cells.add(c.id);
    Audio.chime(990);
    burst(c.x, c.y, 16);
    toast(q.met ? `Energy Cell ${q.cells.size} / 3` : 'Found a humming capsule');
    updateHud();
  }

  function accuse(id) {
    if (id !== CULPRIT) return openDialog('Silence', [ENDINGS.wrong]);
    const knows = state.echoes.has('echo_steward') || state.echoes.has('echo_heir');
    openDialog('Halloway', ENDINGS.confront(knows), null, [
      { label: 'Let the law take him.', fn: () => ending('justice') },
      { label: 'Show him mercy.', fn: () => ending('mercy') },
    ]);
  }

  function ending(kind) {
    state.mode = 'end';
    Audio.chime(kind === 'mercy' ? 520 : 440);
    const e = ENDINGS[kind], pages = e.text.slice();
    if (state.echoes.size === ECHOES.length) pages.push(ENDINGS.understood);
    if (state.quest.done) pages.push(BONES.ending);
    if (state.rode) pages.push(FAIR.ending);
    $('ending-title').textContent = e.title;
    $('ending-text').innerHTML = pages.map(p => `<p>${p}</p>`).join('');
    $('ending').classList.add('show');
  }

  function nearestSpot() {
    let best = null, bd = 90;
    for (const s of World.SPOTS) {
      const d = Math.abs(s.x - player.x);
      if (d < bd) { bd = d; best = s; }
    }
    return best;
  }

  function interact() {
    if (state.mode === 'dialog') return advance();
    if (state.mode !== 'play' || state.respawning || state.ride) return;
    const s = nearestSpot();
    if (s) examine(s);
  }

  function jump() {
    if (state.mode !== 'play' || state.respawning || state.lock > 0 || !player.ground) return;
    player.vy = -520; player.ground = false;
    Audio.jump();
  }

  function startCharge() {
    if (!state.buster || state.mode !== 'play' || state.respawning) return;
    fire(false); // the buster fires on press; holding builds a charge
    state.charging = true; state.charge = 0;
  }
  function releaseCharge() {
    if (state.charging && state.charge > 0.9 && state.mode === 'play') fire(true);
    state.charging = false; state.charge = 0;
  }

  function fire(big) {
    if (!big && shots.filter(s => !s.big).length >= 3) return;
    shots.push({ x: player.x + player.face * 36, y: player.y - 88, vx: player.face * (big ? 640 : 760), big, life: 0.95, hits: new Set() });
    Audio.zap(big);
  }

  function burst(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * P.TAU, sp = 30 + Math.random() * 70;
      wisps.push({ x, y, life: 1, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20 });
    }
  }

  function begin() {
    if (state.mode !== 'title') return;
    Audio.start();
    $('title').classList.add('hide');
    $('hud').classList.add('show');
    document.body.classList.add('playing');
    state.mode = 'play';
    const intro = () => {
      if (state.seen.has('grave')) return;
      if (state.mode !== 'play') { setTimeout(intro, 500); return; } // wait until the journal is closed
      state.seen.add('grave'); openDialog(STORY.grave.title, STORY.grave.text);
    };
    setTimeout(intro, 1400);
  }

  function restart() {
    state.found.clear(); state.seen.clear(); state.echoes.clear();
    state.quest = { met: false, cells: new Set(), done: false };
    Object.assign(state, { maxLantern: 3, prizes: new Set(), fairMet: false, ticket: false, rode: false, ride: null });
    state.buster = false; state.lantern = 3; state.checkpoint = 200; state.inv = 0; state.fade = 0; state.respawning = false;
    Object.assign(player, { x: 200, y: World.groundY(200), vx: 0, vy: 0, ground: true, face: 1 });
    spawnShades(); shots.length = 0;
    $('ending').classList.remove('show');
    updateHud();
    state.mode = 'play';
    state.seen.add('grave');
  }

  // ---------------------------------------------------------------- input
  addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' ', 'enter', 'tab'].includes(k)) e.preventDefault();
    if (state.mode === 'title') { if (k === 'enter' || k === ' ') begin(); return; }
    if (state.mode === 'mini') { Minigames.key(e, true); return; }
    state.keys[k] = true;
    if (e.repeat) return;
    if (state.mode === 'dialog') {
      const btns = [...$('dlg-choices').children];
      if (btns.length) {
        const i = btns.indexOf(document.activeElement);
        if (k === 'arrowdown' || k === 's') btns[(i + 1) % btns.length].focus();
        else if (k === 'arrowup' || k === 'w') btns[(i - 1 + btns.length) % btns.length].focus();
        else if (/^[1-9]$/.test(k) && btns[+k - 1]) btns[+k - 1].click();
        else if (k === 'enter' || k === ' ' || k === 'e') (btns[i] || btns[0]).click();
        else if (k === 'escape') btns[btns.length - 1].click(); // the last choice always backs out
        return;
      }
      if (k === 'e' || k === ' ' || k === 'enter') advance();
      return;
    }
    if (k === 'e' || k === 'enter') interact();
    else if (k === ' ' || k === 'w' || k === 'arrowup') jump();
    else if (k === 'f' || k === 'x') startCharge();
    else if (k === 'j' || k === 'tab') toggleJournal();
    else if (k === 'escape') toggleJournal(false);
    else if (k === 'm') Audio.toggle();
  });
  addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    state.keys[k] = false;
    if (state.mode === 'mini') Minigames.key(e, false);
    if (k === 'f' || k === 'x') releaseCharge();
  });
  addEventListener('blur', () => { state.keys = {}; state.charging = false; });
  addEventListener('pointerdown', () => Audio.wake());
  document.addEventListener('visibilitychange', () => (document.hidden ? Audio.sleep() : Audio.wake()));
  document.addEventListener('click', e => { if (e.target.closest('#hud, #title')) e.target.blur(); });
  $('begin').onclick = begin;
  $('rotate').onclick = () => setSideways(!sidewaysPref);
  $('rotate-title').onclick = () => setSideways(true);
  $('dialog').onclick = advance;
  $('journal-btn').onclick = () => toggleJournal();
  $('journal-close').onclick = () => toggleJournal(false);
  $('mute').onclick = () => Audio.toggle();
  $('again').onclick = restart;
  const hold = (id, key, down, up) => {
    const el = $(id);
    const on = e => { e.preventDefault(); state.touch[key] = true; if (down) down(); };
    const off = e => { e.preventDefault(); if (state.touch[key] && up) up(); state.touch[key] = false; };
    el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off);
    el.addEventListener('pointerleave', off); el.addEventListener('pointercancel', off);
  };
  hold('t-left', 'l'); hold('t-right', 'r');
  hold('t-jump', 'jump', jump);
  hold('t-fire', 'fire', startCharge, releaseCharge);
  $('t-act').addEventListener('pointerdown', e => { e.preventDefault(); interact(); });
  if (matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');

  // ---------------------------------------------------------------- simulation
  function surfaceBelow(x, y) {
    let s = World.groundY(x);
    for (const p of World.PLATFORMS) if (x >= p.x0 && x <= p.x1 && p.y >= y - 1 && p.y < s) s = p.y;
    return s;
  }

  function hurt(fromX) {
    if (state.inv > 0 || state.respawning) return;
    state.lantern -= 1; state.inv = 1.6; state.lock = 0.35;
    player.vx = Math.sign(player.x - fromX || 1) * 340; player.vy = -300; player.ground = false;
    Audio.hit(); updateHud();
    if (state.lantern <= 0) { state.respawning = true; toast('The cold takes your light…'); }
  }

  function updatePlayer(dt) {
    if (state.ride) return;
    const k = state.keys;
    state.inv = Math.max(0, state.inv - dt); state.lock = Math.max(0, state.lock - dt);
    let dir = 0;
    if (state.lock <= 0 && !state.respawning) {
      if (k.arrowleft || k.a || state.touch.l) dir -= 1;
      if (k.arrowright || k.d || state.touch.r) dir += 1;
    }
    const prevV = player.vx;
    if (state.lock <= 0) player.vx += (dir * 240 - player.vx) * Math.min(1, dt * (dir ? 6 : 11));
    player.x = clamp(player.x + player.vx * dt, 110, World.WORLD_W - 60);
    if (dir) player.face = dir;

    // gravity, with a slow ghostly glide while jump is held
    const gliding = k[' '] || k.w || k.arrowup || state.touch.jump;
    player.vy += 1100 * dt;
    if (gliding && player.vy > 0) player.vy = Math.min(player.vy, 110);
    const ny = player.y + player.vy * dt;
    let land = null;
    if (player.vy >= 0) {
      const g = World.groundY(player.x);
      if (ny >= g) land = g;
      for (const p of World.PLATFORMS) {
        if (player.x >= p.x0 && player.x <= p.x1 && player.y <= p.y + 0.5 && ny >= p.y && (land === null || p.y < land)) land = p.y;
      }
    }
    if (land !== null) { player.y = land; player.vy = 0; player.ground = true; }
    else { player.y = ny; player.ground = false; }

    // the lantern swings like a pendulum, pushed by acceleration
    const acc = (player.vx - prevV) / Math.max(dt, 1e-3);
    player.swv += (-player.sw * 26 - player.swv * 2.4 - acc * 0.0045 * player.face) * dt;
    player.sw += player.swv * dt;

    if (state.charging) state.charge += dt;

    // gas lamps are checkpoints and rekindle the lantern
    for (const lx of World.LAMPS) {
      if (Math.abs(player.x - lx) < 40 && !state.respawning && (state.checkpoint !== lx || state.lantern < state.maxLantern)) {
        if (state.lantern < state.maxLantern) { toast('Your lantern rekindles'); Audio.chime(780); }
        state.checkpoint = lx; state.lantern = state.maxLantern; updateHud();
      }
    }

    for (const c of CELLS) {
      if (state.quest.cells.has(c.id)) continue;
      if (Math.abs(player.x - c.x) < 40 && c.y > player.y - 150 && c.y < player.y + 14) collectCell(c);
    }

    if (state.respawning) {
      state.fade = Math.min(1, state.fade + dt * 1.2);
      if (state.fade >= 1) {
        Object.assign(player, { x: state.checkpoint, y: World.groundY(state.checkpoint), vx: 0, vy: 0, ground: true });
        state.cam = clamp(player.x - viewW * 0.42, 0, World.WORLD_W + 300 - viewW);
        state.lantern = state.maxLantern; state.respawning = false; state.inv = 1.5;
        // shades near the lamp drift back to the far end of their patrol
        for (const sh of shades) {
          if (sh.alive && Math.abs(sh.x - player.x) < 300) sh.x = Math.abs(sh.a - player.x) > Math.abs(sh.b - player.x) ? sh.a : sh.b;
        }
        updateHud();
      }
    } else state.fade = Math.max(0, state.fade - dt * 0.9);
  }

  function updateShades(dt) {
    for (const s of shades) {
      if (!s.alive) continue;
      s.flash = Math.max(0, s.flash - dt);
      const hunting = Math.abs(player.x - s.x) < 240 && player.x > s.a - 80 && player.x < s.b + 80 && !state.respawning;
      s.x += (hunting ? Math.sign(player.x - s.x) * 72 : s.dir * 50) * dt;
      if (s.x < s.a) { s.x = s.a; s.dir = 1; }
      if (s.x > s.b) { s.x = s.b; s.dir = -1; }
      s.y = World.groundY(s.x) - 50 + Math.sin(state.t * 2 + s.ph) * 7;
      if (Math.abs(player.x - s.x) < 36 && s.y + 24 > player.y - 135 && s.y - 22 < player.y) hurt(s.x);
    }
    for (let i = shots.length - 1; i >= 0; i--) {
      const b = shots[i];
      b.x += b.vx * dt; b.life -= dt;
      let spent = false;
      for (const s of shades) {
        if (!s.alive || b.hits.has(s) || Math.abs(b.x - s.x) > (b.big ? 42 : 30) || Math.abs(b.y - s.y) > (b.big ? 56 : 40)) continue;
        b.hits.add(s);
        s.hp -= b.big ? 3 : 1; s.flash = 0.15; Audio.thud();
        if (s.hp <= 0) { s.alive = false; burst(s.x, s.y, 22); }
        if (!b.big) { spent = true; break; } // charged shots pierce
      }
      if (spent || b.life <= 0) shots.splice(i, 1);
    }
  }

  // A distant storm: a double flash, then thunder a moment later.
  function updateStorm(dt) {
    state.nextStrike -= dt; state.strikeT += dt;
    if (state.nextStrike <= 0) {
      state.strikeT = 0; state.nextStrike = 24 + Math.random() * 32;
      setTimeout(() => Audio.thunder(), 900 + Math.random() * 1600);
    }
    const t = state.strikeT;
    state.flash = t < 0.07 ? 1 : t < 0.16 ? 0.15 : t < 0.24 ? 0.75 : Math.max(0, 0.75 * Math.exp(-(t - 0.24) * 6));
  }

  function update(dt) {
    state.t += dt;
    updateStorm(dt);
    state.wheelA += dt * (state.ride ? 0.45 : state.ticket ? 0.12 : 0.035);
    updateRide();
    Audio.calliope(state.mode === 'title' ? 0 : clamp((player.x - 5150) / 350, 0, 1));
    if (state.mode === 'play') { updatePlayer(dt); updateShades(dt); }

    let camTarget = clamp(player.x - viewW * 0.42 + player.face * 70, 0, World.WORLD_W + 300 - viewW);
    // the camera rises with the ghost; each layer follows by its own depth
    const alt = Math.max(0, World.groundY(player.x) - player.y);
    let camYTarget = Math.min(90, alt * 0.5);
    if (state.ride) {
      // follow the gondola up: the whole estate sinks away beneath, layer by layer
      camTarget = (World.atDepth(Carnival.WHEEL_X, 0.8) - viewW / 2) / 0.8;
      const a = state.wheelA + (state.ride.car / 12) * P.TAU;
      camYTarget = clamp((470 - (300 + Math.sin(a) * 230)) * 0.9, 0, 380);
    }
    const prevCam = state.cam;
    state.cam += (camTarget - state.cam) * Math.min(1, dt * 2.2);
    if (Math.abs(state.cam - prevCam) > 0.05) state.camDir = Math.sign(state.cam - prevCam);
    state.camY += (camYTarget - state.camY) * Math.min(1, dt * 3);

    if (state.mode !== 'title' && Math.random() < dt * (8 + Math.abs(player.vx) * 0.05)) {
      wisps.push({ x: player.x - player.face * 10 + (Math.random() - 0.5) * 30, y: player.y - 30 - Math.random() * 40, life: 1, vx: -player.vx * 0.2 + (Math.random() - 0.5) * 10, vy: -12 - Math.random() * 14 });
    }
    for (let i = wisps.length - 1; i >= 0; i--) {
      const w = wisps[i];
      w.life -= dt * 0.7; w.x += w.vx * dt; w.y += w.vy * dt;
      if (w.life <= 0) wisps.splice(i, 1);
    }
    for (const l of leaves) {
      l.y += l.vy * dt; l.x += Math.sin(state.t * 0.8 + l.ph) * 30 * dt - 12 * dt; l.rot += l.vr * dt;
      if (l.y > H + 30) { l.y = -30; l.x = Math.random() * 2000; }
    }
    tickDialog(dt);
  }

  // ---------------------------------------------------------------- rendering helpers
  const toScreen = (x, z) => (x - state.cam * z);

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  function drawFog(y, h, a, z, speed) {
    const W = 1024, off = mod(state.cam * z + state.t * speed, W), yy = y + state.camY * z;
    ctx.globalAlpha = a;
    for (let x = -off; x < viewW; x += W) ctx.drawImage(fogTex, Math.floor(x * S), Math.floor(yy * S), Math.ceil(W * S) + 1, Math.ceil(h * S));
    ctx.globalAlpha = 1;
  }

  function drawFlies(z) {
    ctx.globalCompositeOperation = 'lighter';
    const span = viewW + 200;
    for (const f of flies) {
      if (f.z !== z) continue;
      const sx = mod(f.x - state.cam * z + Math.sin(state.t * 0.3 * f.sp + f.ph) * 40, span) - 100;
      const sy = f.y + Math.sin(state.t * 0.9 * f.sp + f.ph * 2) * 18 + (z - 1) * 60 + state.camY * z;
      const pulse = 0.5 + 0.5 * Math.sin(state.t * 2.2 * f.sp + f.ph * 5);
      const sz = (z > 1.2 ? 46 : 10 + z * 12) * (0.6 + pulse * 0.6);
      ctx.globalAlpha = (z > 1.2 ? 0.35 : 0.8) * pulse;
      ctx.drawImage(glow.fly, (sx - sz / 2) * S, (sy - sz / 2) * S, sz * S, sz * S);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawRays() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const mx = sky.mx * S, my = sky.my * S;
    for (let i = 0; i < 5; i++) {
      const sway = Math.sin(state.t * 0.12 + i * 1.7) * 0.04;
      const a = 2.05 + i * 0.16 + sway, w = 0.035 + (i % 2) * 0.025;
      const len = 1100 * S;
      const g = ctx.createLinearGradient(mx, my, mx + Math.cos(a) * len, my + Math.sin(a) * len);
      g.addColorStop(0, 'rgba(160,180,255,0.07)'); g.addColorStop(0.6, 'rgba(140,160,240,0.035)'); g.addColorStop(1, 'rgba(140,160,240,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(mx, my);
      ctx.lineTo(mx + Math.cos(a - w) * len, my + Math.sin(a - w) * len);
      ctx.lineTo(mx + Math.cos(a + w) * len, my + Math.sin(a + w) * len);
      ctx.fill();
    }
    // dust drifting through the moonbeams
    for (const m of motes) {
      const a = 2.02 + m.v * 0.7, d = 120 + mod(m.u * 900 + state.t * 9 * m.sp, 900);
      const x = sky.mx + Math.cos(a) * d + Math.sin(state.t * 0.5 + m.ph) * 10, y = sky.my + Math.sin(a) * d;
      ctx.globalAlpha = 0.5 * (0.5 + 0.5 * Math.sin(state.t * 1.5 + m.ph)) * (1 - d / 1100);
      ctx.drawImage(glow.cool, (x - 4) * S, (y - 4) * S, 8 * S, 8 * S);
    }
    ctx.restore();
  }

  function drawGhost() {
    const t = state.t, px = toScreen(player.x, 1), cy = state.camY;
    const gy = player.y + cy, sy = surfaceBelow(player.x, player.y) + cy, alt = sy - gy;
    const bob = player.ground ? Math.sin(t * 2.1) * 5 : 0;
    // soft contact shadow on whatever surface lies below
    ctx.save();
    ctx.setTransform(S, 0, 0, S * 0.22, px * S, (sy + 10) * S);
    ctx.globalAlpha = Math.max(0.06, 0.4 - bob * 0.02 - alt * 0.0025);
    const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, 44);
    sg.addColorStop(0, 'rgba(0,0,10,0.8)'); sg.addColorStop(1, 'rgba(0,0,10,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(0, 0, 44, 0, P.TAU); ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.setTransform(S, 0, 0, S, px * S, (gy - 6 + bob) * S);
    if (state.inv > 0 && Math.floor(t * 14) % 2) ctx.globalAlpha = 0.35;
    const baseA = ctx.globalAlpha;
    ctx.rotate(clamp(player.vx * 0.0004, -0.1, 0.1));
    ctx.scale(player.face, 1);
    const drag = Math.abs(player.vx) * 0.06 + Math.max(0, -player.vy) * 0.02;

    // cloak
    const g = ctx.createLinearGradient(0, -150, 0, 6);
    g.addColorStop(0, 'rgba(232,242,255,0.95)'); g.addColorStop(0.45, 'rgba(175,205,240,0.78)'); g.addColorStop(1, 'rgba(110,150,215,0)');
    ctx.fillStyle = g;
    ctx.shadowColor = 'rgba(150,200,255,0.8)'; ctx.shadowBlur = 28 * S;
    ctx.beginPath();
    ctx.moveTo(-20, -118);
    ctx.arc(0, -122, 21, Math.PI * 1.0, Math.PI * 0.0);
    ctx.quadraticCurveTo(30, -86, 30 - drag * 0.3, -40);
    ctx.quadraticCurveTo(34 - drag, -14, 30 - drag * 1.4, -2);
    for (let i = 0; i <= 8; i++) {
      const hx = 30 - drag * 1.4 - (i / 8) * (60 - drag * 0.6);
      ctx.lineTo(hx, -2 + Math.sin(t * 5 + i * 1.3) * 6 + (i % 2) * 8);
    }
    ctx.quadraticCurveTo(-34 - drag * 0.6, -50, -26, -86);
    ctx.quadraticCurveTo(-24, -106, -20, -118);
    ctx.fill();
    ctx.shadowBlur = 0;

    // painterly folds
    ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const fx = -18 + i * 6;
      ctx.globalAlpha = baseA * (0.18 + (i % 3) * 0.06);
      ctx.strokeStyle = i % 2 ? 'rgba(255,255,255,1)' : 'rgba(110,140,200,1)';
      ctx.lineWidth = 2 + (i % 2);
      ctx.beginPath(); ctx.moveTo(fx * 0.6, -96);
      ctx.quadraticCurveTo(fx + Math.sin(t * 2 + i) * 3, -50, fx * 1.3 - drag * 0.8, -8 + Math.sin(t * 5 + i) * 4);
      ctx.stroke();
    }
    ctx.globalAlpha = baseA;

    // hollow face beneath the hood
    ctx.fillStyle = 'rgba(8,12,28,0.92)';
    ctx.beginPath(); ctx.ellipse(5, -116, 12, 15, 0.1, 0, P.TAU); ctx.fill();
    ctx.fillStyle = 'rgba(190,235,255,0.95)';
    ctx.shadowColor = 'rgba(160,220,255,1)'; ctx.shadowBlur = 8 * S;
    const blink = mod(t, 4.3) < 0.12 ? 0.2 : 1;
    P.dab(ctx, 2, -118, 2, 2.2 * blink, 0); P.dab(ctx, 11, -118, 2, 2.2 * blink, 0);
    ctx.shadowBlur = 0;

    // the Bone Buster, worn on the ghost's chest-side arm
    if (state.buster) {
      const ch = state.charging && state.charge > 0.25;
      const full = state.charging && state.charge > 0.9;
      roundRect(ctx, 8, -98, 30, 15, 6);
      ctx.fillStyle = full ? (Math.floor(t * 20) % 2 ? '#7fd8ff' : '#2f6fd6') : '#2f6fd6'; ctx.fill();
      ctx.fillStyle = 'rgba(160,215,255,0.7)'; ctx.fillRect(12, -96, 20, 3);
      ctx.fillStyle = '#0c1a33'; ctx.beginPath(); ctx.ellipse(38, -90.5, 3, 5.5, 0, 0, P.TAU); ctx.fill();
      if (ch) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.min(1, state.charge) * (0.6 + Math.sin(t * 30) * 0.3);
        const r = 10 + Math.min(1, state.charge) * 16;
        ctx.drawImage(full ? glow.gold : glow.cool, 38 - r, -90 - r, r * 2, r * 2);
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = baseA;
      }
    }

    // arm and lantern
    const hx = 30, hy = -78;
    ctx.strokeStyle = 'rgba(205,225,250,0.85)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(14, -98); ctx.quadraticCurveTo(26, -92, hx, hy); ctx.stroke();
    ctx.save();
    ctx.translate(hx, hy); ctx.rotate(player.sw);
    ctx.strokeStyle = '#1a1c24'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 12); ctx.stroke();
    const flick = (0.85 + Math.sin(t * 17) * 0.05 + Math.sin(t * 7.3) * 0.07) * (0.55 + state.lantern * 0.15);
    const lg = ctx.createRadialGradient(0, 24, 0, 0, 24, 10);
    lg.addColorStop(0, `rgba(255,236,170,${Math.min(1, flick)})`); lg.addColorStop(1, 'rgba(255,140,60,0.5)');
    ctx.fillStyle = lg; ctx.fillRect(-6, 14, 12, 18);
    ctx.strokeStyle = '#141519'; ctx.lineWidth = 2;
    ctx.strokeRect(-6, 14, 12, 18);
    ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(0, 32); ctx.stroke();
    ctx.fillStyle = '#141519';
    ctx.beginPath(); ctx.moveTo(-8, 14); ctx.lineTo(0, 7); ctx.lineTo(8, 14); ctx.fill();
    ctx.fillRect(-7, 31, 14, 3);
    ctx.restore();
    ctx.restore();

    // lantern world position (for lighting)
    const lx = hx + Math.sin(-player.sw) * 23, ly = hy + Math.cos(player.sw) * 23;
    player.lantern = [player.x + lx * player.face, player.y - 6 + bob + ly];
    player.flick = flick;
  }

  // A rattling robot skeleton in a battered blue helmet, with an arm cannon.
  function drawBones() {
    const sx = toScreen(BONES_X, 1);
    if (sx < -120 || sx > viewW + 120) return;
    const q = state.quest, t = state.t, powered = q.done;
    const gy = World.groundY(BONES_X) + 4 + state.camY;
    const talking = state.mode === 'dialog' && dlg.speaker === 'bones' && dlg.shown < dlg.full.length;
    const face = player.x < BONES_X ? -1 : 1;
    const shiver = !powered && Math.sin(t * 1.3) > 0.75 ? Math.sin(t * 50) * 0.8 : 0;
    const bob = powered ? Math.abs(Math.sin(t * 3)) * -2 : 0;
    const BONE = '#d8d0b8', BONE_D = '#8c846f', BLUE = '#2f6fd6', BLUE_L = '#79bdff', BLUE_D = '#1a3f86';

    ctx.save();
    ctx.setTransform(S, 0, 0, S * 0.22, sx * S, (gy + 4) * S);
    const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
    sg.addColorStop(0, 'rgba(0,0,10,0.7)'); sg.addColorStop(1, 'rgba(0,0,10,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(0, 0, 40, 0, P.TAU); ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.setTransform(S, 0, 0, S, (sx + shiver) * S, (gy + bob) * S);
    ctx.scale(face, 1);
    ctx.lineCap = 'round';
    const bone = (pts, w) => {
      ctx.strokeStyle = BONE_D; ctx.lineWidth = w + 2;
      ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      ctx.strokeStyle = BONE; ctx.lineWidth = w;
      ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      ctx.fillStyle = BONE;
      for (const p of [pts[0], pts[pts.length - 1]]) P.dab(ctx, p[0], p[1], w * 0.75, w * 0.75, 0);
    };
    // legs
    bone([[-11, -30], [-9, -50], [-7, -70]], 4.5);
    bone([[11, -30], [9, -50], [7, -70]], 4.5);
    // big blue boots
    for (const bx of [-13, 13]) {
      roundRect(ctx, bx - 13, -27, 26, 27, 8); ctx.fillStyle = BLUE; ctx.fill();
      roundRect(ctx, bx - 13, -6, 28, 6, 3); ctx.fillStyle = BLUE_D; ctx.fill();
      roundRect(ctx, bx - 11, -33, 22, 8, 3); ctx.fillStyle = BLUE_L; ctx.fill();
      ctx.globalAlpha = 0.5; ctx.fillStyle = '#cfe8ff'; P.dab(ctx, bx + 4, -20, 3, 6, 0.2); ctx.globalAlpha = 1;
    }
    // pelvis, spine and ribcage
    ctx.fillStyle = BONE; P.dab(ctx, 0, -72, 13, 6, 0);
    ctx.fillStyle = BONE_D; P.dab(ctx, -5, -72, 3, 2.5, 0); P.dab(ctx, 5, -72, 3, 2.5, 0);
    bone([[0, -74], [0, -116]], 4);
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = BONE; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.ellipse(0, -110 + i * 7, 15 - i * 1.6, 5, 0, 0, Math.PI); ctx.stroke();
    }
    // chest core: one slot per Energy Cell
    for (let i = 0; i < 3; i++) {
      const lit = i < q.cells.size && (powered || state.quest.met);
      ctx.fillStyle = lit ? '#8fe6ff' : '#1b2233';
      P.dab(ctx, -6 + i * 6, -96, 2.4, 2.4, 0);
    }
    // collarbone, back arm, buster arm
    bone([[-17, -117], [17, -117]], 3.5);
    bone([[-17, -117], [-21, -95], [-19, -76]], 3.5);
    ctx.fillStyle = BONE; P.dab(ctx, -19, -73, 3.5, 4, 0);
    bone([[17, -117], [22, -103]], 4);
    roundRect(ctx, 14, -109, 32, 17, 7); ctx.fillStyle = BLUE; ctx.fill();
    ctx.fillStyle = BLUE_L; ctx.fillRect(18, -107, 22, 3);
    ctx.fillStyle = '#0c1a33'; ctx.beginPath(); ctx.ellipse(46, -100.5, 3, 6, 0, 0, P.TAU); ctx.fill();
    if (powered) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.5 + Math.sin(t * 6) * 0.2;
      ctx.drawImage(glow.cool, 32, -114, 28, 28);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }
    // skull
    ctx.fillStyle = BONE; ctx.beginPath(); ctx.arc(0, -136, 13.5, 0, P.TAU); ctx.fill();
    const jaw = talking ? Math.abs(Math.sin(t * 18)) * 4 : 0;
    roundRect(ctx, -8, -127 + jaw, 16, 7, 3); ctx.fillStyle = BONE; ctx.fill();
    ctx.strokeStyle = BONE_D; ctx.lineWidth = 1;
    for (let i = -6; i <= 6; i += 3) { ctx.beginPath(); ctx.moveTo(i, -127 + jaw); ctx.lineTo(i, -122 + jaw); ctx.stroke(); }
    ctx.fillStyle = '#121018';
    P.dab(ctx, -5, -137, 3.6, 4.4, 0); P.dab(ctx, 5, -137, 3.6, 4.4, 0);
    P.dab(ctx, 0, -131, 1.4, 2, 0);
    const eye = powered ? 1 : 0.35 + Math.max(0, Math.sin(t * 2.3)) * 0.25;
    ctx.fillStyle = `rgba(140,225,255,${eye})`;
    ctx.shadowColor = '#7fd8ff'; ctx.shadowBlur = (powered ? 10 : 4) * S;
    P.dab(ctx, -5, -137, 1.7, 1.9, 0); P.dab(ctx, 5, -137, 1.7, 1.9, 0);
    ctx.shadowBlur = 0;
    // helmet with a face opening and ear discs
    ctx.beginPath();
    ctx.arc(0, -137, 17.5, Math.PI * 0.86, Math.PI * 2.14);
    ctx.lineTo(12, -131); ctx.quadraticCurveTo(0, -152, -12, -131);
    ctx.closePath(); ctx.fillStyle = BLUE; ctx.fill();
    ctx.globalAlpha = 0.85; ctx.fillStyle = BLUE_L;
    ctx.beginPath(); ctx.moveTo(-3, -154); ctx.quadraticCurveTo(0, -156, 3, -154); ctx.lineTo(3, -146); ctx.lineTo(-3, -146); ctx.fill();
    ctx.globalAlpha = 1;
    for (const ex of [-16, 16]) {
      ctx.fillStyle = BLUE_L; ctx.beginPath(); ctx.arc(ex, -134, 6, 0, P.TAU); ctx.fill();
      ctx.fillStyle = BLUE_D; ctx.beginPath(); ctx.arc(ex, -134, 3, 0, P.TAU); ctx.fill();
    }
    // a dent and some rust from years in the crypt
    ctx.globalAlpha = 0.5; ctx.fillStyle = '#5a3b26'; P.dab(ctx, -9, -149, 3, 1.6, 0.4); ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawShades() {
    for (const s of shades) {
      if (!s.alive) continue;
      const sx = toScreen(s.x, 1), sy = s.y + state.camY;
      if (sx < -80 || sx > viewW + 80) continue;
      const t = state.t + s.ph;
      ctx.save();
      ctx.setTransform(S, 0, 0, S, sx * S, sy * S);
      // smoky halo
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * P.TAU + t * 0.6;
        ctx.fillStyle = 'rgba(4,4,12,0.28)';
        P.dab(ctx, Math.cos(a) * 18, -10 + Math.sin(a) * 18, 16, 12, a);
      }
      ctx.fillStyle = s.flash > 0 ? 'rgba(235,242,255,0.95)' : 'rgba(5,5,13,0.92)';
      ctx.beginPath();
      ctx.moveTo(-22, -6); ctx.quadraticCurveTo(-22, -42, 0, -44); ctx.quadraticCurveTo(22, -42, 22, -6);
      for (let i = 0; i <= 6; i++) {
        const x = 22 - (i * 44) / 6;
        ctx.lineTo(x + Math.sin(t * 4 + i) * 4, 22 + (i % 2) * 12 + Math.sin(t * 3 + i * 1.7) * 6);
      }
      ctx.closePath(); ctx.fill();
      // claws
      ctx.strokeStyle = 'rgba(5,5,13,0.9)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (const d of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(d * 18, -12);
        ctx.quadraticCurveTo(d * 34, -4 + Math.sin(t * 3) * 4, d * 30, 12 + Math.sin(t * 3 + d) * 5); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,90,60,0.95)';
      ctx.shadowColor = '#ff5a3c'; ctx.shadowBlur = 10 * S;
      const look = Math.sign(player.x - s.x) * 2;
      P.dab(ctx, -7 + look, -26, 3, 2, 0.2); P.dab(ctx, 7 + look, -26, 3, 2, -0.2);
      ctx.restore();
    }
  }

  function drawCells() {
    for (const c of CELLS) {
      if (state.quest.cells.has(c.id)) continue;
      const sx = toScreen(c.x, 1), sy = c.y + state.camY + Math.sin(state.t * 2.4 + c.x) * 5;
      if (sx < -60 || sx > viewW + 60) continue;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.55 + Math.sin(state.t * 4) * 0.15;
      ctx.drawImage(glow.cool, (sx - 42) * S, (sy - 42) * S, 84 * S, 84 * S);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.save();
      ctx.setTransform(S, 0, 0, S, sx * S, sy * S);
      ctx.rotate(Math.sin(state.t * 1.3 + c.x) * 0.25);
      roundRect(ctx, -10, -14, 20, 28, 5); ctx.fillStyle = '#16233a'; ctx.fill();
      const g = ctx.createLinearGradient(0, -10, 0, 10);
      g.addColorStop(0, '#b8f0ff'); g.addColorStop(1, '#2f6fd6');
      roundRect(ctx, -7, -10, 14, 20, 3); ctx.fillStyle = g; ctx.fill();
      ctx.fillStyle = '#0c1a33'; ctx.font = 'bold 12px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('E', 0, 1);
      ctx.restore();
    }
  }

  function drawShots() {
    for (const b of shots) {
      const sx = toScreen(b.x, 1), sy = b.y + state.camY;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.8;
      const r = b.big ? 34 : 16;
      ctx.drawImage(glow.gold, (sx - r) * S, (sy - r) * S, r * 2 * S, r * 2 * S);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff4c4';
      ctx.beginPath(); ctx.ellipse(sx * S, sy * S, (b.big ? 14 : 6) * S, (b.big ? 10 : 4.5) * S, 0, 0, P.TAU); ctx.fill();
    }
  }

  // Bats wheel through the middle distance: smaller, slower and hazier the farther they are.
  function drawBats(z0, z1) {
    const span = viewW + 400;
    for (const b of bats) {
      if (b.z < z0 || b.z > z1) continue;
      const t = state.t, sz = 5 + b.z * 12;
      const sx = mod(b.x + t * b.sp - state.cam * b.z, span) - 200;
      const sy = b.y + Math.sin(t * 1.3 + b.ph) * b.amp + state.camY * b.z;
      const flap = Math.sin(t * 13 + b.ph * 3);
      ctx.save();
      ctx.setTransform(S, 0, 0, S, sx * S, sy * S);
      const haze = 1 - b.z;
      ctx.fillStyle = `rgb(${12 + haze * 60},${12 + haze * 66},${26 + haze * 90})`;
      ctx.beginPath(); ctx.ellipse(0, 0, sz * 0.25, sz * 0.4, 0, 0, P.TAU); ctx.fill();
      for (const d of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(0, -sz * 0.1);
        ctx.quadraticCurveTo(d * sz * 0.8, -sz * (0.2 + flap * 0.7), d * sz * 1.6, -sz * flap * 0.5);
        ctx.lineTo(d * sz * 1.2, sz * 0.05); ctx.lineTo(d * sz * 0.9, -sz * 0.05); ctx.lineTo(d * sz * 0.55, sz * 0.15);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
  }

  function fairView() {
    return {
      ctx, S, cam: state.cam, camY: state.camY, viewW, t: state.t, glow,
      lit: state.ticket, riding: !!state.ride, rideCar: state.ride ? state.ride.car : -1, wheelA: state.wheelA,
    };
  }

  // Lightning brightens what has been drawn so far; called between layers, so the
  // far hills flare and the near ground stays a dark silhouette.
  function flashOver(a) {
    if (state.flash < 0.01) return;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(150,170,255,${(a * state.flash).toFixed(3)})`;
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.globalCompositeOperation = 'source-over';
  }

  // Lamps, the ghost and the sky shimmer in the path's puddles.
  function drawPuddles() {
    const cy = state.camY, t = state.t;
    for (const p of World.PUDDLES) {
      const sx = toScreen(p.x, 1), sy = p.y + cy;
      if (sx < -p.rx - 20 || sx > viewW + p.rx + 20) continue;
      ctx.save();
      ctx.beginPath(); ctx.ellipse(sx * S, sy * S, p.rx * 0.95 * S, p.ry * 0.9 * S, 0, 0, P.TAU); ctx.clip();
      ctx.globalCompositeOperation = 'lighter';
      const streak = (img, x, a, w) => {
        ctx.globalAlpha = a;
        ctx.drawImage(img, (x - w / 2) * S, (sy - p.ry * 2.5) * S, w * S, p.ry * 5 * S);
      };
      for (const l of World.LIGHTS) {
        if (!l.pool) continue;
        const d = Math.abs(l.x - p.x);
        if (d < 300) streak(glow.warm, toScreen(l.x, 1), 0.6 * (1 - d / 300) * (0.9 + Math.sin(t * 9 + l.x) * 0.1), 26);
      }
      const gd = Math.abs(player.x - p.x);
      if (state.mode !== 'title' && gd < p.rx + 40) streak(glow.cool, toScreen(player.x, 1), 0.45 * (1 - gd / (p.rx + 40)), 34);
      if (state.flash > 0.01) { ctx.globalAlpha = state.flash * 0.6; ctx.fillStyle = 'rgb(150,170,255)'; ctx.fillRect(0, 0, cv.width, cv.height); }
      // ripples
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(180,200,255,1)'; ctx.lineWidth = S;
      for (let i = 0; i < 2; i++) {
        const ph = mod(t * 0.35 + i * 0.5 + p.x * 0.001, 1);
        ctx.globalAlpha = 0.3 * (1 - ph);
        ctx.beginPath(); ctx.ellipse((sx + (i ? 18 : -14)) * S, sy * S, (4 + ph * p.rx * 0.5) * S, (1 + ph * p.ry * 0.5) * S, 0, 0, P.TAU); ctx.stroke();
      }
      ctx.restore();
    }
  }

  // Animated droplets and ripples over the painted fountain.
  function drawFountain() {
    const cx = toScreen(FOUNTAIN_X, 1);
    if (cx < -200 || cx > viewW + 200) return;
    const base = World.groundY(FOUNTAIN_X) + 8 + state.camY, t = state.t;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 28; i++) {
      const side = i % 2 ? 1 : -1, ph = mod(t * 0.7 + i / 28, 1);
      const x = cx + side * (50 + ph * 34 + (i % 5)), y = base - 138 + ph * ph * 96;
      ctx.globalAlpha = 0.5 * (1 - ph * 0.6);
      ctx.drawImage(glow.cool, (x - 3) * S, (y - 3) * S, 6 * S, 6 * S);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = 'rgba(170,215,255,1)'; ctx.lineWidth = 1 * S;
    for (let i = 0; i < 4; i++) {
      const ph = mod(t * 0.5 + i / 4, 1), side = i % 2 ? 1 : -1;
      ctx.globalAlpha = 0.35 * (1 - ph);
      ctx.beginPath();
      ctx.ellipse((cx + side * 88) * S, (base - 42) * S, (6 + ph * 26) * S, (1.5 + ph * 4) * S, 0, 0, P.TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawWisps() {
    ctx.globalCompositeOperation = 'lighter';
    for (const w of wisps) {
      const sz = 26 * (1.4 - w.life);
      ctx.globalAlpha = w.life * 0.35;
      ctx.drawImage(glow.cool, (toScreen(w.x, 1) - sz / 2) * S, (w.y + state.camY - sz / 2) * S, sz * S, sz * S);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  function drawSpots(near) {
    const cy = state.camY;
    ctx.globalCompositeOperation = 'lighter';
    for (const s of World.SPOTS) {
      const sx = toScreen(s.x, 1);
      if (sx < -100 || sx > viewW + 100 || s.id === 'bones' || s.id === 'barker') continue;
      if (s.id === 'wheel' && !state.ticket) continue;
      const done = Minigames.has(s.id) ? state.prizes.has(s.id) : s.id === 'wheel' ? state.rode : state.seen.has(s.id) && s.id !== 'door';
      const pulse = 0.6 + 0.4 * Math.sin(state.t * 2.5 + s.x);
      const a = done ? 0.15 : 0.55 * pulse * (s === near ? 1.5 : 1);
      const sz = 90;
      ctx.globalAlpha = a;
      const img = STORY[s.id]?.echo ? glow.cool : glow.gold;
      ctx.drawImage(img, (sx - sz / 2) * S, (s.y + cy + 50 - sz / 2) * S, sz * S, sz * S);
      if (!done) {
        for (let i = 0; i < 5; i++) {
          const ph = mod(state.t * 0.4 + i / 5, 1);
          const mx = sx + Math.sin(i * 2.3 + state.t) * 16, my = s.y + cy + 70 - ph * 90;
          ctx.globalAlpha = (1 - ph) * 0.8;
          ctx.drawImage(img, (mx - 6) * S, (my - 6) * S, 12 * S, 12 * S);
        }
      }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  // The interaction prompt floats above the spot, or above the ghost's head when they overlap.
  function drawPrompt(near) {
    if (!near || state.mode !== 'play' || state.respawning || state.ride) return;
    const cy = state.camY;
    const sx = toScreen(near.x, 1);
    const sy = Math.min(near.y, player.y - 165) + cy - 10 + Math.sin(state.t * 3) * 3;
    const label = near.id === 'door' ? 'Enter' : near.id === 'bones' || near.id === 'barker' ? 'Talk'
      : Minigames.has(near.id) ? 'Play' : near.id === 'wheel' ? (state.ticket ? 'Ride' : 'Examine')
      : STORY[near.id]?.echo ? 'Listen' : state.seen.has(near.id) ? 'Recall' : 'Examine';
    const key = document.body.classList.contains('touch') ? '✦' : 'E';
    ctx.save();
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.font = 'italic 20px "IM Fell English", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 8;
    ctx.fillStyle = 'rgba(255,228,170,0.95)';
    ctx.fillText(`${key} · ${label}`, sx, sy);
    ctx.restore();
  }

  function drawLeaves() {
    const span = viewW + 300;
    for (const l of leaves) {
      const sx = mod(l.x - state.cam * l.z, span) - 150;
      const big = l.z > 1.3;
      ctx.save();
      ctx.setTransform(S, 0, 0, S, sx * S, (l.y + state.camY * l.z) * S);
      ctx.rotate(l.rot); ctx.scale(1, Math.cos(state.t * 3 + l.ph));
      ctx.globalAlpha = big ? 0.55 : 0.85;
      ctx.fillStyle = P.hsl(l.hue, 50, big ? 12 : 24);
      const sz = big ? 9 : 5;
      ctx.beginPath(); ctx.ellipse(0, 0, sz, sz * 0.45, 0, 0, P.TAU); ctx.fill();
      ctx.restore();
    }
  }

  function drawLighting() {
    const lc = lightCtx, q = 0.25, cy = state.camY;
    lc.setTransform(1, 0, 0, 1, 0, 0);
    lc.globalCompositeOperation = 'source-over';
    lc.clearRect(0, 0, lightCv.width, lightCv.height);
    lc.fillStyle = 'rgba(4,6,20,0.5)';
    lc.fillRect(0, 0, lightCv.width, lightCv.height);
    lc.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r, a) => {
      const g = lc.createRadialGradient(x * q, y * q, 0, x * q, y * q, r * q);
      g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      lc.fillStyle = g; lc.fillRect((x - r) * q, (y - r) * q, r * 2 * q, r * 2 * q);
    };
    const flick = l => l.flick ? 0.9 + Math.sin(state.t * 13 + l.x) * 0.05 * l.flick + Math.sin(state.t * 5.1 + l.x * 0.3) * 0.05 * l.flick : 1;
    // moonlight leaves the sky unshadowed
    const mg = lc.createLinearGradient(0, 0, 0, 420 * q);
    mg.addColorStop(0, 'rgba(0,0,0,0.85)'); mg.addColorStop(1, 'rgba(0,0,0,0)');
    lc.fillStyle = mg; lc.fillRect(0, 0, lightCv.width, 420 * q);
    for (const l of World.LIGHTS) {
      const sx = toScreen(l.x, 1);
      if (sx < -l.r || sx > viewW + l.r) continue;
      hole(sx, l.y + cy, l.r * flick(l), 0.9);
    }
    for (const b of shots) hole(toScreen(b.x, 1), b.y + cy, b.big ? 160 : 90, 0.7);
    for (const c of CELLS) if (!state.quest.cells.has(c.id)) hole(toScreen(c.x, 1), c.y + cy, 110, 0.6);
    const fair = Carnival.lights(fairView());
    for (const [x, y, r, a] of fair) hole(x, y, r, a);
    if (state.mode !== 'title' && !state.ride) {
      const [lx, ly] = player.lantern;
      hole(toScreen(lx, 1), ly + cy, 300 * (player.flick || 1), 1);
    }
    ctx.drawImage(lightCv, 0, 0, cv.width, cv.height);

    // additive bloom: warm lamps, cold crypt light
    ctx.globalCompositeOperation = 'lighter';
    const bloom = (img, x, y, r, a) => { ctx.globalAlpha = a; ctx.drawImage(img, (x - r) * S, (y - r) * S, r * 2 * S, r * 2 * S); };
    for (const l of World.LIGHTS) {
      const sx = toScreen(l.x, 1);
      if (sx < -l.r || sx > viewW + l.r) continue;
      bloom(l.cool ? glow.cool : glow.warm, sx, l.y + cy, l.r * 0.6 * flick(l), l.cool ? 0.22 : 0.32);
      if (l.cone) {
        const top = l.y + cy + 8, bot = World.groundY(l.x) + 20 + cy, w1 = l.r * 0.5;
        const g = ctx.createLinearGradient(0, top * S, 0, bot * S);
        g.addColorStop(0, 'rgba(255,190,110,0.2)'); g.addColorStop(1, 'rgba(255,170,90,0)');
        ctx.globalAlpha = flick(l); ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo((sx - 9) * S, top * S); ctx.lineTo((sx + 9) * S, top * S);
        ctx.lineTo((sx + w1) * S, bot * S); ctx.lineTo((sx - w1) * S, bot * S); ctx.fill();
      }
      if (l.pool) {
        const gy = World.groundY(l.x) + 22 + cy, r = l.r * 0.95 * flick(l);
        ctx.globalAlpha = 0.3;
        ctx.drawImage(glow.warm, (sx - r) * S, (gy - r * 0.16) * S, r * 2 * S, r * 0.32 * S);
      }
    }
    for (const [x, y, r, a] of fair) bloom(glow.warm, x, y, r * 0.5, a * 0.3);
    if (state.mode !== 'title' && !state.ride) {
      const [lx, ly] = player.lantern;
      bloom(glow.warm, toScreen(lx, 1), ly + cy, 150 * (player.flick || 1), 0.45);
      bloom(glow.cool, toScreen(player.x, 1), player.y + cy - 80, 120, 0.12);
      // the lantern's light pooling on whatever lies below it
      const below = surfaceBelow(player.x, player.y), h = below - ly;
      if (h < 280) {
        const r = 90 + h * 0.3;
        ctx.globalAlpha = 0.4 * (1 - h / 280) * (player.flick || 1);
        ctx.drawImage(glow.warm, (toScreen(lx, 1) - r) * S, (below + cy + 12 - r * 0.16) * S, r * 2 * S, r * 0.32 * S);
      }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  function render() {
    const W = cv.width, Hh = cv.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(sky.cv, 0, 0, W, Hh);
    flashOver(0.5);

    // twinkling stars
    ctx.fillStyle = '#dfe8ff';
    for (let i = 0; i < 24; i++) {
      const r = P.rng(70 + i), x = r() * viewW, y = r() * 300;
      ctx.globalAlpha = Math.max(0, Math.sin(state.t * (1 + r() * 2) + i)) * 0.9;
      ctx.fillRect(x * S, y * S, 1.6 * S, 1.6 * S);
    }
    ctx.globalAlpha = 0.9;
    const cOff = mod(state.t * 5 + state.cam * 0.03, 2048);
    for (let x = -cOff; x < viewW; x += 2048) ctx.drawImage(clouds, Math.floor(x * S), Math.floor(state.camY * 0.03 * S), Math.ceil(2048 * S) + 1, 420 * S);
    ctx.globalAlpha = 1;

    const L = World.L, cam = state.cam, cy = state.camY;
    const layer = l => World.drawLayer(ctx, l, cam, S, viewW, RS, cy);
    layer(L.mount);
    drawFog(330, 170, 0.8, 0.12, 4);
    layer(L.far);
    flashOver(0.22);
    drawFog(400, 170, 0.75, 0.3, 6);
    drawFlies(0.4);
    layer(L.back);
    flashOver(0.12);
    drawBats(0, 0.5);
    drawFog(450, 160, 0.7, 0.5, 9);
    drawRays();
    layer(L.mid);
    flashOver(0.06);
    drawBats(0.5, 1);
    drawFlies(0.66);
    drawFog(500, 140, 0.55, 0.8, 12);
    layer(L.near);
    Carnival.drawBack(fairView());
    drawFog(535, 120, 0.35, 0.92, 14);
    layer(L.ground);
    drawPuddles();
    drawFountain();
    Carnival.drawFront(fairView(), state.mode === 'dialog' && dlg.speaker === 'barker' && dlg.shown < dlg.full.length, player.x < Carnival.BARKER_X);
    const near = state.mode === 'title' ? null : nearestSpot();
    drawSpots(near);
    drawCells();
    drawBones();
    drawShades();
    if (state.mode !== 'title' && !state.ride) { drawWisps(); drawGhost(); }
    drawShots();
    drawPrompt(near);
    drawFlies(1);
    drawFog(560, 150, 0.45, 1.1, 16);
    layer(L.fore);
    drawFlies(1.45);
    drawLeaves();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawLighting();

    // finishing: vignette and linen tooth
    ctx.drawImage(vignette, 0, 0, W, Hh);
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = grain; ctx.fillRect(0, 0, W, Hh);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (state.fade > 0) { ctx.fillStyle = `rgba(2,3,8,${state.fade})`; ctx.fillRect(0, 0, W, Hh); }
  }

  // ---------------------------------------------------------------- loop
  let last = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    update(dt);
    render();
    // paint one off-screen chunk ahead of the camera when there's headroom
    if (performance.now() - now < 10) World.prewarm(state.cam, viewW, state.camDir, RS);
    requestAnimationFrame(frame);
  }

  addEventListener('resize', resize);
  // let the loading text paint before the first (heavy) chunk paint
  setTimeout(() => {
    resize();
    updateHud();
    render();
    $('loading').classList.add('hide');
    $('begin').disabled = false;
    requestAnimationFrame(t => { last = t; frame(t); });
  }, 30);

  window.__deadheir = { state, player, shades, CELLS };
})();
