'use strict';
(() => {
  const H = World.H;
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mod = (a, n) => ((a % n) + n) % n;

  let viewW = 1280, S = 1, RS = 0;
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

  function resize() {
    const w = innerWidth, h = innerHeight;
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
    mode: 'title', t: 0, cam: 0, camDir: 1,
    found: new Set(), seen: new Set(),
    keys: {}, touch: { l: false, r: false },
  };
  const player = { x: 200, vx: 0, face: 1, sw: 0, swv: 0, lantern: [0, 0] };
  const CLUES = Object.keys(STORY).filter(k => STORY[k].clue);

  const flies = Array.from({ length: 70 }, (_, i) => {
    const r = P.rng(500 + i), zs = [0.4, 0.66, 1, 1.45];
    return { x: r() * 3000, y: 380 + r() * 300, z: zs[i % 4], ph: r() * 10, sp: 0.5 + r() };
  });
  const leaves = Array.from({ length: 16 }, (_, i) => {
    const r = P.rng(900 + i);
    return { x: r() * 2000, y: r() * H, z: 1 + r() * 0.6, rot: r() * 6, vr: (r() - 0.5) * 3, vy: 20 + r() * 30, hue: 8 + r() * 30, ph: r() * 6 };
  });
  const wisps = [];

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
    toggle() {
      this.muted = !this.muted;
      if (this.master) this.master.gain.value = this.muted ? 0 : 0.8;
      $('mute').textContent = this.muted ? 'Sound: off' : 'Sound: on';
    },
  };

  // ---------------------------------------------------------------- UI
  const dlg = { queue: [], full: '', shown: 0, onDone: null, choices: null };

  function openDialog(title, pages, onDone, choices) {
    state.mode = 'dialog';
    dlg.queue = pages.slice(); dlg.onDone = onDone || null; dlg.choices = choices || null;
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
          for (const ch of dlg.choices) {
            const b = document.createElement('button'); b.textContent = ch.label;
            b.onclick = e => { e.stopPropagation(); $('dialog').classList.remove('show'); state.mode = 'play'; ch.fn(); };
            $('dlg-choices').appendChild(b);
          }
        }
      } else $('dlg-more').style.visibility = 'visible';
    }
  }

  function updateHud() {
    $('clues').textContent = `Clues ${state.found.size} / ${CLUES.length}`;
    const list = $('journal-list');
    list.innerHTML = '';
    for (const id of CLUES) {
      const li = document.createElement('li');
      if (state.found.has(id)) { li.innerHTML = `<b>${STORY[id].title}</b><span>${STORY[id].note}</span>`; }
      else { li.className = 'unknown'; li.innerHTML = '<b>Not yet found</b><span>Something still waits on the grounds.</span>'; }
      list.appendChild(li);
    }
  }

  function toggleJournal(force) {
    const open = force ?? !$('journal').classList.contains('show');
    if (open && state.mode !== 'play') return;
    $('journal').classList.toggle('show', open);
    state.mode = open ? 'journal' : 'play';
  }

  function examine(spot) {
    const s = STORY[spot.id];
    if (spot.id === 'door') {
      if (state.found.size < CLUES.length) {
        openDialog(s.title, [`${s.locked} (${state.found.size} of ${CLUES.length} clues found)`]);
      } else {
        openDialog(s.title, [s.ask], null, SUSPECTS.map(su => ({ label: su.name, fn: () => accuse(su.id) })));
      }
      return;
    }
    const first = !state.seen.has(spot.id);
    state.seen.add(spot.id);
    if (s.clue && first) { state.found.add(spot.id); Audio.chime(spot.id === 'keys' ? 520 : 660); updateHud(); flashClue(s.title); }
    openDialog(s.title, s.text);
  }

  function flashClue(title) {
    const el = $('toast');
    el.textContent = `Clue found: ${title}`;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  }

  function accuse(id) {
    if (id === CULPRIT) {
      state.mode = 'end';
      Audio.chime(440);
      $('ending-text').innerHTML = ENDINGS.right.map(p => `<p>${p}</p>`).join('');
      $('ending').classList.add('show');
    } else openDialog('Silence', [ENDINGS.wrong]);
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
    if (state.mode !== 'play') return;
    const s = nearestSpot();
    if (s) examine(s);
  }

  function begin() {
    if (state.mode !== 'title') return;
    Audio.start();
    $('title').classList.add('hide');
    $('hud').classList.add('show');
    state.mode = 'play';
    setTimeout(() => { if (!state.seen.has('grave')) { state.seen.add('grave'); openDialog(STORY.grave.title, STORY.grave.text); } }, 1400);
  }

  function restart() {
    state.found.clear(); state.seen.clear();
    player.x = 200; player.vx = 0; player.face = 1;
    $('ending').classList.remove('show');
    updateHud();
    state.mode = 'play';
    state.seen.add('grave');
  }

  // ---------------------------------------------------------------- input
  addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (['arrowleft', 'arrowright', 'arrowup', ' ', 'enter'].includes(k)) e.preventDefault();
    if (state.mode === 'title' && (k === 'enter' || k === ' ')) return begin();
    state.keys[k] = true;
    if (e.repeat) return;
    if (k === 'e' || k === ' ' || k === 'enter' || k === 'arrowup' || k === 'w') interact();
    else if (k === 'j' || k === 'tab') { e.preventDefault(); toggleJournal(); }
    else if (k === 'escape') toggleJournal(false);
    else if (k === 'm') Audio.toggle();
  });
  addEventListener('keyup', e => { state.keys[e.key.toLowerCase()] = false; });
  $('begin').onclick = begin;
  $('dialog').onclick = advance;
  $('journal-btn').onclick = () => toggleJournal();
  $('journal-close').onclick = () => toggleJournal(false);
  $('mute').onclick = () => Audio.toggle();
  $('again').onclick = restart;
  const hold = (id, key) => {
    const el = $(id);
    const on = e => { e.preventDefault(); state.touch[key] = true; }, off = e => { e.preventDefault(); state.touch[key] = false; };
    el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off);
    el.addEventListener('pointerleave', off); el.addEventListener('pointercancel', off);
  };
  hold('t-left', 'l'); hold('t-right', 'r');
  $('t-act').addEventListener('pointerdown', e => { e.preventDefault(); interact(); });
  if (matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');

  // ---------------------------------------------------------------- simulation
  function update(dt) {
    state.t += dt;
    const k = state.keys;
    let dir = 0;
    if (state.mode === 'play') {
      if (k.arrowleft || k.a || state.touch.l) dir -= 1;
      if (k.arrowright || k.d || state.touch.r) dir += 1;
    }
    const target = dir * 240;
    const prevV = player.vx;
    player.vx += (target - player.vx) * Math.min(1, dt * 5);
    player.x = clamp(player.x + player.vx * dt, 110, World.WORLD_W - 60);
    if (dir) player.face = dir;
    // lantern swings like a pendulum, pushed by acceleration
    const acc = (player.vx - prevV) / Math.max(dt, 1e-3);
    player.swv += (-player.sw * 26 - player.swv * 2.4 - acc * 0.0045 * player.face) * dt;
    player.sw += player.swv * dt;

    const camTarget = clamp(player.x - viewW * 0.42 + player.face * 70, 0, World.WORLD_W + 300 - viewW);
    const prevCam = state.cam;
    state.cam += (camTarget - state.cam) * Math.min(1, dt * 2.2);
    if (Math.abs(state.cam - prevCam) > 0.05) state.camDir = Math.sign(state.cam - prevCam);

    if (state.mode !== 'title' && Math.random() < dt * (8 + Math.abs(player.vx) * 0.05)) {
      wisps.push({ x: player.x - player.face * 10 + (Math.random() - 0.5) * 30, y: World.groundY(player.x) - 30 - Math.random() * 40, life: 1, vx: -player.vx * 0.2 + (Math.random() - 0.5) * 10, vy: -12 - Math.random() * 14 });
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

  function drawFog(y, h, a, z, speed) {
    const W = 1024, off = mod(state.cam * z + state.t * speed, W);
    ctx.globalAlpha = a;
    for (let x = -off; x < viewW; x += W) ctx.drawImage(fogTex, Math.floor(x * S), Math.floor(y * S), Math.ceil(W * S) + 1, Math.ceil(h * S));
    ctx.globalAlpha = 1;
  }

  function drawFlies(z) {
    ctx.globalCompositeOperation = 'lighter';
    const span = viewW + 200;
    for (const f of flies) {
      if (f.z !== z) continue;
      const sx = mod(f.x - state.cam * z + Math.sin(state.t * 0.3 * f.sp + f.ph) * 40, span) - 100;
      const sy = f.y + Math.sin(state.t * 0.9 * f.sp + f.ph * 2) * 18 + (z - 1) * 60;
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
    ctx.restore();
  }

  function drawGhost() {
    const t = state.t, px = toScreen(player.x, 1), gy = World.groundY(player.x);
    const bob = Math.sin(t * 2.1) * 5;
    // soft contact shadow, smaller when the ghost bobs higher
    ctx.save();
    ctx.setTransform(S, 0, 0, S * 0.22, px * S, (gy + 10) * S);
    ctx.globalAlpha = 0.4 - bob * 0.02;
    const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, 44);
    sg.addColorStop(0, 'rgba(0,0,10,0.8)'); sg.addColorStop(1, 'rgba(0,0,10,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(0, 0, 44, 0, P.TAU); ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.setTransform(S, 0, 0, S, px * S, (gy - 6 + bob) * S);
    ctx.rotate(clamp(player.vx * 0.0004, -0.1, 0.1));
    ctx.scale(player.face, 1);
    const drag = Math.abs(player.vx) * 0.06;

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
      ctx.globalAlpha = 0.18 + (i % 3) * 0.06;
      ctx.strokeStyle = i % 2 ? 'rgba(255,255,255,1)' : 'rgba(110,140,200,1)';
      ctx.lineWidth = 2 + (i % 2);
      ctx.beginPath(); ctx.moveTo(fx * 0.6, -96);
      ctx.quadraticCurveTo(fx + Math.sin(t * 2 + i) * 3, -50, fx * 1.3 - drag * 0.8, -8 + Math.sin(t * 5 + i) * 4);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // hollow face beneath the hood
    ctx.fillStyle = 'rgba(8,12,28,0.92)';
    ctx.beginPath(); ctx.ellipse(5, -116, 12, 15, 0.1, 0, P.TAU); ctx.fill();
    ctx.fillStyle = 'rgba(190,235,255,0.95)';
    ctx.shadowColor = 'rgba(160,220,255,1)'; ctx.shadowBlur = 8 * S;
    const blink = mod(t, 4.3) < 0.12 ? 0.2 : 1;
    P.dab(ctx, 2, -118, 2, 2.2 * blink, 0); P.dab(ctx, 11, -118, 2, 2.2 * blink, 0);
    ctx.shadowBlur = 0;

    // arm and lantern
    const hx = 30, hy = -78;
    ctx.strokeStyle = 'rgba(205,225,250,0.85)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(14, -98); ctx.quadraticCurveTo(26, -92, hx, hy); ctx.stroke();
    ctx.save();
    ctx.translate(hx, hy); ctx.rotate(player.sw);
    ctx.strokeStyle = '#1a1c24'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 12); ctx.stroke();
    const flick = 0.85 + Math.sin(t * 17) * 0.05 + Math.sin(t * 7.3) * 0.07;
    const lg = ctx.createRadialGradient(0, 24, 0, 0, 24, 10);
    lg.addColorStop(0, `rgba(255,236,170,${flick})`); lg.addColorStop(1, 'rgba(255,140,60,0.5)');
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
    player.lantern = [player.x + lx * player.face, gy - 6 + bob + ly];
    player.flick = flick;
  }

  function drawWisps() {
    ctx.globalCompositeOperation = 'lighter';
    for (const w of wisps) {
      const sz = 26 * (1.4 - w.life);
      ctx.globalAlpha = w.life * 0.35;
      ctx.drawImage(glow.cool, (toScreen(w.x, 1) - sz / 2) * S, (w.y - sz / 2) * S, sz * S, sz * S);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  function drawSpots(near) {
    ctx.globalCompositeOperation = 'lighter';
    for (const s of World.SPOTS) {
      const sx = toScreen(s.x, 1);
      if (sx < -100 || sx > viewW + 100) continue;
      const done = state.seen.has(s.id) && s.id !== 'door';
      const pulse = 0.6 + 0.4 * Math.sin(state.t * 2.5 + s.x);
      const a = done ? 0.15 : 0.55 * pulse * (s === near ? 1.5 : 1);
      const sz = 90;
      ctx.globalAlpha = a;
      ctx.drawImage(glow.gold, (sx - sz / 2) * S, (s.y + 50 - sz / 2) * S, sz * S, sz * S);
      if (!done) {
        for (let i = 0; i < 5; i++) {
          const ph = mod(state.t * 0.4 + i / 5, 1);
          const mx = sx + Math.sin(i * 2.3 + state.t) * 16, my = s.y + 70 - ph * 90;
          ctx.globalAlpha = (1 - ph) * 0.8;
          ctx.drawImage(glow.gold, (mx - 6) * S, (my - 6) * S, 12 * S, 12 * S);
        }
      }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (near && state.mode === 'play') {
      const sx = toScreen(near.x, 1), sy = near.y - 10 + Math.sin(state.t * 3) * 3;
      const label = near.id === 'door' ? 'Enter' : state.seen.has(near.id) ? 'Recall' : 'Examine';
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
  }

  function drawLeaves() {
    const span = viewW + 300;
    for (const l of leaves) {
      const sx = mod(l.x - state.cam * l.z, span) - 150;
      const big = l.z > 1.3;
      ctx.save();
      ctx.setTransform(S, 0, 0, S, sx * S, l.y * S);
      ctx.rotate(l.rot); ctx.scale(1, Math.cos(state.t * 3 + l.ph));
      ctx.globalAlpha = big ? 0.55 : 0.85;
      ctx.fillStyle = P.hsl(l.hue, 50, big ? 12 : 24);
      const sz = big ? 9 : 5;
      ctx.beginPath(); ctx.ellipse(0, 0, sz, sz * 0.45, 0, 0, P.TAU); ctx.fill();
      ctx.restore();
    }
  }

  function drawLighting() {
    const lc = lightCtx, q = 0.25;
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
      hole(sx, l.y, l.r * flick(l), 0.9);
    }
    if (state.mode !== 'title') {
      const [lx, ly] = player.lantern;
      hole(toScreen(lx, 1), ly, 300 * (player.flick || 1), 1);
    }
    ctx.drawImage(lightCv, 0, 0, cv.width, cv.height);

    // additive warm bloom
    ctx.globalCompositeOperation = 'lighter';
    const bloom = (img, x, y, r, a) => { ctx.globalAlpha = a; ctx.drawImage(img, (x - r) * S, (y - r) * S, r * 2 * S, r * 2 * S); };
    for (const l of World.LIGHTS) {
      const sx = toScreen(l.x, 1);
      if (sx < -l.r || sx > viewW + l.r) continue;
      bloom(glow.warm, sx, l.y, l.r * 0.6 * flick(l), 0.32);
    }
    if (state.mode !== 'title') {
      const [lx, ly] = player.lantern;
      bloom(glow.warm, toScreen(lx, 1), ly, 150 * (player.flick || 1), 0.45);
      bloom(glow.cool, toScreen(player.x, 1), World.groundY(player.x) - 80, 120, 0.12);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  function render() {
    const W = cv.width, Hh = cv.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(sky.cv, 0, 0, W, Hh);

    // twinkling stars
    ctx.fillStyle = '#dfe8ff';
    for (let i = 0; i < 24; i++) {
      const r = P.rng(70 + i), x = r() * viewW, y = r() * 300;
      ctx.globalAlpha = Math.max(0, Math.sin(state.t * (1 + r() * 2) + i)) * 0.9;
      ctx.fillRect(x * S, y * S, 1.6 * S, 1.6 * S);
    }
    ctx.globalAlpha = 0.9;
    const cOff = mod(state.t * 5 + state.cam * 0.03, 2048);
    for (let x = -cOff; x < viewW; x += 2048) ctx.drawImage(clouds, Math.floor(x * S), 0, Math.ceil(2048 * S) + 1, 420 * S);
    ctx.globalAlpha = 1;

    const L = World.L, cam = state.cam;
    World.drawLayer(ctx, L.mount, cam, S, viewW, RS);
    drawFog(330, 170, 0.8, 0.12, 4);
    World.drawLayer(ctx, L.far, cam, S, viewW, RS);
    drawFog(400, 170, 0.75, 0.3, 6);
    drawFlies(0.4);
    World.drawLayer(ctx, L.back, cam, S, viewW, RS);
    drawFog(450, 160, 0.7, 0.5, 9);
    drawRays();
    World.drawLayer(ctx, L.mid, cam, S, viewW, RS);
    drawFlies(0.66);
    drawFog(500, 140, 0.55, 0.8, 12);
    World.drawLayer(ctx, L.ground, cam, S, viewW, RS);
    const near = state.mode === 'title' ? null : nearestSpot();
    drawSpots(near);
    if (state.mode !== 'title') { drawWisps(); drawGhost(); }
    drawFlies(1);
    drawFog(560, 150, 0.45, 1.1, 16);
    World.drawLayer(ctx, L.fore, cam, S, viewW, RS);
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

  window.__deadheir = { state, player };
})();
