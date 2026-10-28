'use strict';
// The five fairground games. Each one draws into a 960×540 stage and is played
// by pointer (mouse or touch) or keyboard: arrows aim, Space or Enter acts.
const Minigames = (() => {
  const W = 960, H = 540, RES = 1.5;
  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 1.15;
  const aim = { x: W / 2, y: H / 2 }, keys = {};
  let cv, c, game, g, preview, opts = {}, raf = 0, last = 0, held = false, open = false, bg = null;

  // ---------------------------------------------------------------- shared painting
  function paintBg(stripes) {
    const b = document.createElement('canvas');
    b.width = W * RES; b.height = H * RES;
    const x = b.getContext('2d');
    x.scale(RES, RES);
    const wall = x.createLinearGradient(0, 0, 0, H);
    wall.addColorStop(0, '#2b1a12'); wall.addColorStop(1, '#120a08');
    x.fillStyle = wall; x.fillRect(0, 0, W, H);
    const r = P.rng(77);
    x.lineCap = 'round';
    for (let i = 0; i < 700; i++) { // painted planks
      const px = r() * W, py = r() * H;
      x.globalAlpha = 0.25; x.strokeStyle = P.hsl(22 + r() * 10, 30, 8 + r() * 10);
      x.lineWidth = 2 + r() * 5; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (r() - 0.5) * 3, py + 20 + r() * 40); x.stroke();
    }
    x.globalAlpha = 1;
    x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 2;
    for (let px = 40; px < W; px += 64) { x.beginPath(); x.moveTo(px, 60); x.lineTo(px, H); x.stroke(); }
    // warm wash from the bulbs above
    const glowG = x.createRadialGradient(W / 2, 40, 20, W / 2, 120, 620);
    glowG.addColorStop(0, 'rgba(255,190,110,0.28)'); glowG.addColorStop(1, 'rgba(255,190,110,0)');
    x.fillStyle = glowG; x.fillRect(0, 0, W, H);
    // striped valance
    const n = 16, sw = W / n;
    for (let i = 0; i < n; i++) {
      const col = stripes[i % 2];
      x.fillStyle = P.hsl(col[0], col[1], col[2]);
      x.beginPath(); x.moveTo(i * sw, 0); x.lineTo(i * sw + sw, 0); x.lineTo(i * sw + sw, 44);
      x.quadraticCurveTo(i * sw + sw / 2, 64, i * sw, 44); x.closePath(); x.fill();
    }
    const vg = x.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.65);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.65)');
    x.fillStyle = vg; x.fillRect(0, 0, W, H);
    return b;
  }

  function bulbs(t) {
    for (let i = 0; i < 15; i++) {
      const x = 32 + i * 64, on = Math.sin(t * (2 + (i % 4)) + i * 3.7) > -0.85;
      c.fillStyle = on ? 'rgba(255,220,150,1)' : 'rgba(50,40,30,1)';
      c.beginPath(); c.arc(x, 56, 4, 0, P.TAU); c.fill();
      if (on) {
        const gg = c.createRadialGradient(x, 56, 0, x, 56, 26);
        gg.addColorStop(0, 'rgba(255,200,120,0.5)'); gg.addColorStop(1, 'rgba(255,200,120,0)');
        c.fillStyle = gg; c.fillRect(x - 26, 30, 52, 52);
      }
    }
  }

  function counter() {
    const gr = c.createLinearGradient(0, 486, 0, H);
    gr.addColorStop(0, '#5a3a24'); gr.addColorStop(1, '#2a180e');
    c.fillStyle = gr; c.fillRect(0, 486, W, H - 486);
    c.fillStyle = '#7a5434'; c.fillRect(0, 480, W, 8);
  }

  function crosshair() {
    c.strokeStyle = 'rgba(255,235,190,0.9)'; c.lineWidth = 2;
    c.beginPath(); c.arc(aim.x, aim.y, 14, 0, P.TAU); c.stroke();
    c.beginPath();
    c.moveTo(aim.x - 22, aim.y); c.lineTo(aim.x - 8, aim.y); c.moveTo(aim.x + 8, aim.y); c.lineTo(aim.x + 22, aim.y);
    c.moveTo(aim.x, aim.y - 22); c.lineTo(aim.x, aim.y - 8); c.moveTo(aim.x, aim.y + 8); c.lineTo(aim.x, aim.y + 22);
    c.stroke();
  }

  const shreds = [];
  function burst(x, y, col, n = 14) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * P.TAU, sp = 80 + Math.random() * 220;
      shreds.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: 1, col, rot: Math.random() * 6 });
    }
  }
  function drawShreds(dt) {
    for (let i = shreds.length - 1; i >= 0; i--) {
      const s = shreds[i];
      s.vy += 600 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt * 1.4; s.rot += dt * 8;
      if (s.life <= 0) { shreds.splice(i, 1); continue; }
      c.globalAlpha = s.life; c.fillStyle = s.col;
      c.save(); c.translate(s.x, s.y); c.rotate(s.rot); c.fillRect(-4, -2, 8, 4); c.restore();
    }
    c.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- 1. duck shoot (water gun)
  const ROW_Y = [250, 372], ROW_V = [130, -170], SPACING = 140;
  const duck = {
    title: 'Duck Shoot', stripes: [[200, 40, 32], [40, 30, 62]], target: 12, continuous: true,
    help: 'Hold to spray the water gun at the ducks. Knock down 12 before the 25 seconds run out.',
    init(s) {
      s.time = 25; s.ducks = [];
      for (let row = 0; row < 2; row++) for (let i = 0; i < 8; i++) s.ducks.push({ row, x: i * SPACING + row * 70, wet: 0, down: 0 });
    },
    update(s, dt) {
      s.time -= dt;
      for (const d of s.ducks) {
        d.x += ROW_V[d.row] * dt;
        if (d.x > W + 80) { d.x -= SPACING * 8; d.down = 0; d.wet = 0; }
        if (d.x < -80) { d.x += SPACING * 8; d.down = 0; d.wet = 0; }
        if (d.down) { d.down = Math.min(1, d.down + dt * 4); continue; }
        const dx = (aim.x - d.x) / 34, dy = (aim.y - (ROW_Y[d.row] - 22)) / 30;
        if (held && dx * dx + dy * dy < 1) {
          d.wet += dt;
          if (d.wet > 0.22) { d.down = 0.01; s.score++; opts.sfx('splash'); burst(d.x, ROW_Y[d.row] - 22, 'rgba(160,210,255,0.9)', 8); }
        }
      }
      if (s.score >= this.target) return finish(true);
      if (s.time <= 0) finish(false);
    },
    draw(s, t) {
      for (let row = 0; row < 2; row++) {
        const y = ROW_Y[row];
        for (const d of s.ducks) if (d.row === row) drawDuck(d, y);
        c.fillStyle = '#1b3348'; c.fillRect(60, y, W - 120, 34);
        c.strokeStyle = 'rgba(150,200,240,0.4)'; c.lineWidth = 2;
        c.beginPath();
        for (let x = 60; x <= W - 60; x += 6) c.lineTo(x, y + 6 + Math.sin(x * 0.05 + t * 4 * (row ? -1 : 1)) * 3);
        c.stroke();
        c.fillStyle = '#4a3020'; c.fillRect(56, y + 30, W - 112, 10);
      }
      // the water gun, its stream and splash
      const gx = W / 2, gy = H + 6, ang = Math.atan2(aim.y - gy, aim.x - gx);
      if (held && s.time > 0) {
        c.strokeStyle = 'rgba(170,215,255,0.75)'; c.lineWidth = 7; c.lineCap = 'round';
        c.beginPath(); c.moveTo(gx + Math.cos(ang) * 90, gy + Math.sin(ang) * 90);
        const mx = (gx + aim.x) / 2 + Math.sin(t * 30) * 4, my = (gy + aim.y) / 2 - 30;
        c.quadraticCurveTo(mx, my, aim.x, aim.y); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 2; c.stroke();
        for (let i = 0; i < 4; i++) { c.fillStyle = 'rgba(190,225,255,0.8)'; c.beginPath(); c.arc(aim.x + (Math.random() - 0.5) * 30, aim.y + (Math.random() - 0.5) * 20, 2 + Math.random() * 2, 0, P.TAU); c.fill(); }
      }
      c.save(); c.translate(gx, gy); c.rotate(ang);
      c.fillStyle = '#2f6fa8'; c.fillRect(0, -16, 96, 32);
      c.fillStyle = '#d9b03a'; c.fillRect(70, -10, 26, 20);
      c.fillStyle = '#1c2c40'; c.fillRect(-20, -22, 40, 44);
      c.restore();
    },
    hud: s => `Ducks ${s.score} / 12 · ${Math.max(0, Math.ceil(s.time))}s`,
  };
  function drawDuck(d, y) {
    c.save();
    c.translate(d.x, y);
    if (d.down) { c.rotate(-d.down * 1.2); c.translate(0, d.down * 14); }
    const wet = d.wet > 0 && !d.down;
    c.fillStyle = d.down ? '#8a7428' : wet ? '#e8cf5c' : '#d4b44a';
    c.beginPath(); c.ellipse(0, -20, 30, 18, 0, 0, P.TAU); c.fill();
    c.beginPath(); c.arc(20, -42, 13, 0, P.TAU); c.fill();
    c.fillStyle = '#c86a2a'; c.beginPath(); c.moveTo(31, -44); c.lineTo(44, -40); c.lineTo(31, -36); c.fill();
    c.fillStyle = '#1a1208'; c.beginPath(); c.arc(24, -45, 2.5, 0, P.TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.25)'; c.beginPath(); c.ellipse(-6, -28, 12, 5, -0.2, 0, P.TAU); c.fill();
    c.fillStyle = 'rgba(80,50,20,0.5)'; c.beginPath(); c.arc(-14, -16, 3, 0, P.TAU); c.fill(); // chipped paint
    c.restore();
  }

  // ---------------------------------------------------------------- 2. balloon pop (darts)
  const BALLOON_COLS = ['#a8363e', '#3a5f9a', '#c9a23a', '#4d7a4a', '#7a4a8a'];
  const balloon = {
    title: 'Balloon Pop', stripes: [[355, 45, 32], [40, 30, 62]], target: 7,
    help: 'Click or tap to throw a dart. The wind sways them, so lead your aim. Pop 7 balloons with 10 darts.',
    init(s) {
      s.darts = 10; s.balloons = []; s.flying = null; s.stuck = [];
      for (let row = 0; row < 4; row++) for (let col = 0; col < 7; col++) {
        s.balloons.push({ x: 216 + col * 88, y: 132 + row * 82, col: BALLOON_COLS[(row * 7 + col * 3) % 5], ph: Math.random() * 6, alive: Math.random() > 0.12 });
      }
    },
    press(s) {
      if (s.flying || s.darts <= 0) return;
      s.darts--; s.flying = { tx: aim.x + gauss() * 8, ty: aim.y + gauss() * 8, t: 0 };
      opts.sfx('thunk');
    },
    update(s, dt, t) {
      if (s.flying) {
        s.flying.t += dt / 0.28;
        if (s.flying.t >= 1) {
          const { tx, ty } = s.flying;
          let hit = null;
          for (const b of s.balloons) {
            if (!b.alive) continue;
            const bx = b.x + Math.sin(t * 1.3 + b.ph) * 6;
            if (Math.hypot(tx - bx, (ty - b.y) * 0.85) < 30) { hit = b; break; }
          }
          if (hit) { hit.alive = false; s.score++; opts.sfx('pop'); burst(tx, ty, hit.col, 16); }
          s.stuck.push({ x: tx, y: ty });
          s.flying = null;
          if (s.score >= this.target) return finish(true);
          if (s.darts <= 0) finish(false);
        }
      }
    },
    draw(s, t) {
      c.fillStyle = '#6b4a2e'; c.fillRect(160, 84, 640, 360);
      c.fillStyle = 'rgba(0,0,0,0.25)';
      for (let i = 0; i < 300; i++) { const r = P.rng(i); c.fillRect(160 + r() * 640, 84 + r() * 360, 2, 2); }
      c.strokeStyle = '#3a2414'; c.lineWidth = 8; c.strokeRect(160, 84, 640, 360);
      for (const b of s.balloons) {
        const bx = b.x + Math.sin(t * 1.3 + b.ph) * 6;
        if (!b.alive) { c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.arc(bx, b.y + 30, 4, 0, P.TAU); c.fill(); continue; }
        c.strokeStyle = 'rgba(220,210,190,0.5)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(bx, b.y + 34); c.lineTo(b.x, b.y + 50); c.stroke();
        const gr = c.createRadialGradient(bx - 8, b.y - 10, 2, bx, b.y, 34);
        gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.25, b.col); gr.addColorStop(1, '#1a0e10');
        c.fillStyle = gr; c.beginPath(); c.ellipse(bx, b.y, 27, 32, 0, 0, P.TAU); c.fill();
        c.fillStyle = b.col; c.beginPath(); c.moveTo(bx - 4, b.y + 32); c.lineTo(bx + 4, b.y + 32); c.lineTo(bx, b.y + 37); c.fill();
      }
      for (const d of s.stuck) drawDart(d.x, d.y, 1);
      if (s.flying) {
        const f = s.flying, k = f.t;
        drawDart(W / 2 + (f.tx - W / 2) * k, H + 20 + (f.ty - H - 20) * k - Math.sin(k * Math.PI) * 40, 1.8 - k * 0.8);
      }
    },
    hud: s => `Popped ${s.score} / 7 · Darts ${s.darts}`,
  };
  function drawDart(x, y, sc) {
    c.save(); c.translate(x, y); c.scale(sc, sc);
    c.fillStyle = '#cfcfd8'; c.fillRect(-1, -2, 2, 6);
    c.fillStyle = '#5a3a20'; c.fillRect(-2, 4, 4, 14);
    c.fillStyle = '#a8363e'; c.beginPath(); c.moveTo(0, 14); c.lineTo(-6, 24); c.lineTo(6, 24); c.fill();
    c.restore();
  }

  // ---------------------------------------------------------------- 3. ring toss
  const rings = {
    title: 'Ring Toss', stripes: [[150, 30, 26], [40, 30, 60]], target: 3,
    help: 'Click or tap a bottle neck to toss a ring. Bottles farther back are harder. Ring 3 bottles with 10 rings.',
    init(s) {
      s.rings = 10; s.flying = null; s.landed = []; s.bottles = [];
      for (let row = 3; row >= 0; row--) {
        const sc = 1 - row * 0.15, y = 452 - row * 64;
        for (let i = 0; i < 6; i++) s.bottles.push({ x: W / 2 + (i - 2.5) * 112 * sc, y, sc, row, hue: [140, 30, 200, 140, 30, 200][(i + row) % 6], ringed: false });
      }
    },
    press(s) {
      if (s.flying || s.rings <= 0) return;
      s.rings--; s.flying = { tx: aim.x + gauss() * 13, ty: aim.y + gauss() * 13, t: 0 };
      opts.sfx('thunk');
    },
    update(s, dt) {
      if (!s.flying) return;
      s.flying.t += dt / 0.6;
      if (s.flying.t < 1) return;
      const { tx, ty } = s.flying;
      let best = null, bd = 1e9;
      for (const b of s.bottles) {
        const d = Math.hypot(tx - b.x, ty - (b.y - 82 * b.sc));
        if (d < bd && !b.ringed) { bd = d; best = b; }
      }
      if (best && bd < 13 * best.sc) { best.ringed = true; s.score++; opts.sfx('ding'); }
      else { s.landed.push({ x: tx, y: Math.max(200, ty + 30), sc: 0.6 + (ty / H) * 0.4 }); opts.sfx('clink'); }
      s.flying = null;
      if (s.score >= this.target) return finish(true);
      if (s.rings <= 0) finish(false);
    },
    draw(s, t) {
      c.fillStyle = '#1e3a2a';
      c.beginPath(); c.moveTo(220, 190); c.lineTo(740, 190); c.lineTo(900, 486); c.lineTo(60, 486); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 2;
      for (let i = 1; i < 6; i++) { const y = 190 + i * 50; c.beginPath(); c.moveTo(220 - (y - 190) * 0.54, y); c.lineTo(740 + (y - 190) * 0.54, y); c.stroke(); }
      for (const l of s.landed) { c.strokeStyle = '#c94a3a'; c.lineWidth = 4 * l.sc; c.beginPath(); c.ellipse(l.x, l.y, 22 * l.sc, 7 * l.sc, 0, 0, P.TAU); c.stroke(); }
      for (const b of s.bottles) drawBottle(b);
      if (s.flying) {
        const f = s.flying, k = f.t, sx = W / 2, sy = H + 10;
        const x = sx + (f.tx - sx) * k, y = sy + (f.ty - sy) * k - Math.sin(k * Math.PI) * 170, sc = 1.6 - k * 0.8;
        c.strokeStyle = '#d9b03a'; c.lineWidth = 5 * sc;
        c.beginPath(); c.ellipse(x, y, 24 * sc, 24 * sc * Math.abs(Math.cos(k * 9)) + 4, 0, 0, P.TAU); c.stroke();
      }
    },
    hud: s => `Ringers ${s.score} / 3 · Rings ${s.rings}`,
  };
  function drawBottle(b) {
    const s = b.sc, x = b.x, y = b.y;
    const gr = c.createLinearGradient(x - 12 * s, 0, x + 12 * s, 0);
    gr.addColorStop(0, `hsla(${b.hue},40%,14%,0.95)`); gr.addColorStop(0.6, `hsla(${b.hue},45%,30%,0.9)`); gr.addColorStop(1, `hsla(${b.hue},40%,18%,0.95)`);
    c.fillStyle = gr;
    c.fillRect(x - 12 * s, y - 56 * s, 24 * s, 56 * s);
    c.beginPath(); c.moveTo(x - 12 * s, y - 56 * s); c.quadraticCurveTo(x - 5 * s, y - 64 * s, x - 4 * s, y - 70 * s);
    c.lineTo(x + 4 * s, y - 70 * s); c.quadraticCurveTo(x + 5 * s, y - 64 * s, x + 12 * s, y - 56 * s); c.fill();
    c.fillRect(x - 4 * s, y - 84 * s, 8 * s, 15 * s);
    c.fillStyle = 'rgba(220,240,255,0.35)'; c.fillRect(x + 4 * s, y - 52 * s, 3 * s, 40 * s);
    if (b.ringed) { c.strokeStyle = '#d9b03a'; c.lineWidth = 4 * s; c.beginPath(); c.ellipse(x, y - 70 * s, 16 * s, 5 * s, 0, 0, P.TAU); c.stroke(); }
  }

  // ---------------------------------------------------------------- 4. milk can toss
  const SHELF_Y = 400, SHELF_X0 = 300, SHELF_X1 = 660, CAN_W = 60, CAN_H = 76;
  const cans = {
    title: 'Milk Cans', stripes: [[20, 50, 34], [40, 30, 62]], target: 6,
    help: 'Click or tap to throw a ball at the pyramid. Knock all 6 milk cans down with 3 balls. Aim low.',
    init(s) {
      s.balls = 3; s.ball = null; s.settle = 0;
      const P0 = [[416, 0], [480, 0], [544, 0], [448, 1], [512, 1], [480, 2]];
      s.cans = P0.map(([x, row]) => ({ x, y: SHELF_Y - row * CAN_H, vx: 0, vy: 0, ang: 0, va: 0, z: 0, vz: 0, standing: true }));
      s.cans[3].sup = [0, 1]; s.cans[4].sup = [1, 2]; s.cans[5].sup = [3, 4];
    },
    press(s) {
      if (s.ball || s.balls <= 0) return;
      s.balls--; s.ball = { tx: aim.x + gauss() * 12, ty: aim.y + gauss() * 12, t: 0 };
      opts.sfx('thunk');
    },
    update(s, dt) {
      if (s.ball) {
        s.ball.t += dt / 0.4;
        if (s.ball.t >= 1) {
          const { tx: ix, ty: iy } = s.ball;
          let any = false;
          for (const k of s.cans) {
            if (!k.standing) continue;
            const cx = k.x, cy = k.y - CAN_H / 2, d = Math.hypot(ix - cx, iy - cy);
            if (Math.abs(ix - cx) < CAN_W / 2 + 14 && Math.abs(iy - cy) < CAN_H / 2 + 14) {
              // a direct hit sends the can flying back off the shelf
              k.standing = false; k.vx = (cx - ix) * 6 + (Math.random() - 0.5) * 120; k.vy = -220 - Math.random() * 160;
              k.vz = 1.8 + Math.random(); k.va = (Math.random() - 0.5) * 12; any = true;
            } else if (d < 80) {
              k.standing = false; k.vx = (cx - ix) * 4; k.vy = -120; k.vz = 0.6; k.va = (Math.random() - 0.5) * 6; any = true;
            }
          }
          opts.sfx(any ? 'clank' : 'thunk');
          s.ball = null; s.settle = 1.4;
        }
      }
      for (const k of s.cans) {
        if (k.standing) {
          if (k.sup && k.sup.some(i => !s.cans[i].standing)) { k.standing = false; k.vx = (Math.random() - 0.5) * 120; k.vy = -40; k.va = (Math.random() - 0.5) * 4; }
          continue;
        }
        k.vy += 1600 * dt; k.x += k.vx * dt; k.y += k.vy * dt; k.ang += k.va * dt; k.z += k.vz * dt;
        const onShelf = k.x > SHELF_X0 && k.x < SHELF_X1 && k.z < 0.45; // past the back edge it drops behind
        if (k.y > SHELF_Y && !onShelf) k.va *= 0.98;
        if (onShelf && k.y >= SHELF_Y && k.y - k.vy * dt <= SHELF_Y + 4) {
          k.y = SHELF_Y; k.vy *= -0.25; k.vx *= 0.7; k.va *= 0.7; k.vz *= 0.5;
          if (Math.abs(k.vy) < 40) { k.vy = 0; k.ang += (Math.PI / 2 * Math.sign(k.ang || 1) - k.ang) * Math.min(1, dt * 8); } // settle on its side
        }
        // a flying can knocks over standing ones it strikes
        for (const o of s.cans) {
          if (!o.standing || Math.hypot(k.vx, k.vy) < 120) continue;
          if (Math.abs(o.x - k.x) < CAN_W * 0.9 && Math.abs((o.y - CAN_H / 2) - (k.y - CAN_H / 2)) < CAN_H * 0.9) {
            o.standing = false; o.vx = k.vx * 0.6 + (Math.random() - 0.5) * 80; o.vy = -120; o.va = (Math.random() - 0.5) * 6;
            opts.sfx('clank');
          }
        }
      }
      s.score = s.cans.filter(k => !k.standing).length;
      if (s.settle > 0) {
        s.settle -= dt;
        if (s.settle <= 0) {
          if (s.score >= this.target) return finish(true);
          if (s.balls <= 0) finish(false);
        }
      }
    },
    draw(s) {
      c.fillStyle = '#3a1a1e'; c.fillRect(200, 90, 560, 330);
      c.fillStyle = 'rgba(0,0,0,0.25)'; for (let x = 210; x < 760; x += 40) c.fillRect(x, 90, 14, 330);
      for (const k of s.cans) if (k.z >= 0.45 && k.y < SHELF_Y + 10) drawCan(k);
      c.fillStyle = '#5a3a24'; c.fillRect(SHELF_X0 - 10, SHELF_Y, SHELF_X1 - SHELF_X0 + 20, 18);
      c.fillStyle = '#3a2416'; c.fillRect(SHELF_X0 + 10, SHELF_Y + 18, 14, 70); c.fillRect(SHELF_X1 - 24, SHELF_Y + 18, 14, 70);
      for (const k of s.cans) if (k.z < 0.45) drawCan(k);
      if (s.ball) {
        const b = s.ball, k = b.t, x = W / 2 + (b.tx - W / 2) * k, y = H + 20 + (b.ty - H - 20) * k - Math.sin(k * Math.PI) * 60, sc = 1.8 - k;
        c.fillStyle = '#e8e2d0'; c.beginPath(); c.arc(x, y, 14 * sc, 0, P.TAU); c.fill();
        c.strokeStyle = '#a8363e'; c.lineWidth = 1.5 * sc; c.beginPath(); c.arc(x - 6 * sc, y, 10 * sc, -0.9, 0.9); c.stroke();
        c.beginPath(); c.arc(x + 6 * sc, y, 10 * sc, Math.PI - 0.9, Math.PI + 0.9); c.stroke();
      }
    },
    hud: s => `Cans down ${s.score} / 6 · Balls ${s.balls}`,
  };
  function drawCan(k) {
    const sc = 1 - Math.min(0.45, k.z * 0.35); // farther back, smaller
    c.save(); c.translate(k.x, k.y - CAN_H / 2); c.rotate(k.ang); c.scale(sc, sc);
    if (k.z > 0.45) c.globalAlpha = 0.85;
    const gr = c.createLinearGradient(-CAN_W / 2, 0, CAN_W / 2, 0);
    gr.addColorStop(0, '#5a6068'); gr.addColorStop(0.65, '#b8bec6'); gr.addColorStop(1, '#6a7078');
    c.fillStyle = gr; c.fillRect(-CAN_W / 2, -CAN_H / 2, CAN_W, CAN_H);
    c.fillStyle = '#8a3036'; c.fillRect(-CAN_W / 2, -10, CAN_W, 14);
    c.fillStyle = '#c8ccd4'; c.beginPath(); c.ellipse(0, -CAN_H / 2, CAN_W / 2, 6, 0, 0, P.TAU); c.fill();
    c.fillStyle = 'rgba(40,30,20,0.5)'; c.beginPath(); c.arc(-12, 18, 5, 0, P.TAU); c.fill(); // a dent
    c.restore(); c.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- 5. star shootout (BB gun)
  const CARD = { x: 300, y: 90, w: 360, h: 360 }, STAR_R = 118, STAR_r = 47, CELL = 4, HOLE = 14;
  const starPts = (cx, cy) => Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? STAR_r : STAR_R;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
  function inPoly(x, y, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  const stars = {
    title: 'Star Shootout', stripes: [[270, 25, 30], [45, 40, 58]], target: 1, continuous: true,
    help: 'Hold to fire the BB gun. Shoot out the red star with 100 BBs: leave more than a speck of red and you lose.',
    init(s) {
      s.bbs = 100; s.cool = 0; s.holes = [];
      const pts = starPts(CARD.x + CARD.w / 2, CARD.y + CARD.h / 2);
      s.cells = [];
      for (let y = CARD.y; y < CARD.y + CARD.h; y += CELL) for (let x = CARD.x; x < CARD.x + CARD.w; x += CELL) {
        if (inPoly(x + CELL / 2, y + CELL / 2, pts)) s.cells.push([x + CELL / 2, y + CELL / 2]);
      }
      s.total = s.cells.length; s.left = s.total;
    },
    update(s, dt) {
      s.cool -= dt;
      if (held && s.cool <= 0 && s.bbs > 0) {
        s.cool = 0.09; s.bbs--;
        const hx = aim.x + gauss() * 5, hy = aim.y + gauss() * 5;
        s.holes.push([hx, hy, HOLE * (0.85 + Math.random() * 0.3)]);
        s.cells = s.cells.filter(([x, y]) => (x - hx) ** 2 + (y - hy) ** 2 > HOLE * HOLE);
        s.left = s.cells.length;
        opts.sfx('shot');
        if (s.left / s.total < 0.05) return finish(true);
        if (s.bbs <= 0) finish(false);
      }
    },
    draw(s) {
      c.fillStyle = '#e6dcc0'; c.fillRect(CARD.x, CARD.y, CARD.w, CARD.h);
      c.strokeStyle = 'rgba(80,60,40,0.4)'; c.lineWidth = 1; c.strokeRect(CARD.x + 10, CARD.y + 10, CARD.w - 20, CARD.h - 20);
      c.fillStyle = '#b02c2c';
      c.beginPath(); starPts(CARD.x + CARD.w / 2, CARD.y + CARD.h / 2).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill();
      for (const [x, y, r] of s.holes) {
        c.fillStyle = '#140c08'; c.beginPath(); c.arc(x, y, r, 0, P.TAU); c.fill();
        c.strokeStyle = 'rgba(120,90,60,0.6)'; c.lineWidth = 1; c.stroke();
      }
      // the chained BB gun at the counter
      const gx = W - 160, gy = H - 20, ang = Math.atan2(aim.y - gy, aim.x - gx);
      c.save(); c.translate(gx, gy); c.rotate(ang);
      c.fillStyle = '#2a2a30'; c.fillRect(0, -6, 140, 12);
      c.fillStyle = '#5a3a24'; c.fillRect(-40, -12, 60, 24);
      c.restore();
    },
    hud: s => `Red left ${Math.round((s.left / s.total) * 100)}% · BBs ${s.bbs}`,
  };

  const GAMES = { game_duck: duck, game_balloon: balloon, game_rings: rings, game_cans: cans, game_star: stars };

  // ---------------------------------------------------------------- flow
  function message(text, buttons) {
    $('mini-text').textContent = text;
    const box = $('mini-btns');
    box.innerHTML = '';
    for (const [label, fn] of buttons) {
      const b = document.createElement('button'); b.className = 'btn'; b.textContent = label;
      b.onclick = e => { e.stopPropagation(); fn(); };
      box.appendChild(b);
    }
    $('mini-msg').classList.add('show');
    box.firstChild?.focus({ preventScroll: true });
  }

  function start() {
    g = { score: 0, over: false };
    game.init(g);
    held = false; shreds.length = 0;
    $('mini-msg').classList.remove('show');
  }

  function finish(won) {
    if (g.over) return;
    g.over = true; held = false;
    opts.sfx(won ? 'win' : 'lose');
    if (won) {
      const first = opts.onWin();
      message(first ? `You win! ${opts.prize}` : 'You win again! Mister Lamb has no more prizes for this booth.', [['Leave', close]]);
    } else message('Not this time. The booth waits, the way it has for thirty years.', [['Try again', start], ['Leave', close]]);
  }

  function close() {
    if (!open) return;
    open = false; cancelAnimationFrame(raf);
    $('mini').classList.remove('show');
    const cb = opts.onClose; opts = {};
    if (cb) cb();
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    const t = now / 1000;
    // keyboard aiming
    const ax = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0);
    const ay = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
    aim.x = clamp(aim.x + ax * 520 * dt, 0, W); aim.y = clamp(aim.y + ay * 520 * dt, 0, H);
    const live = g && !g.over;
    if (live) game.update(g, dt, t);
    c.setTransform(RES, 0, 0, RES, 0, 0);
    c.drawImage(bg, 0, 0, W, H);
    bulbs(t);
    game.draw(live || (g && g.over) ? g : preview, t);
    drawShreds(dt);
    counter();
    if (live) crosshair();
    $('mini-hud').textContent = game.hud(g || preview);
    raf = requestAnimationFrame(loop);
  }

  // pointer position in stage units, even when the whole app is rotated sideways
  function toStage(e) {
    const r = cv.getBoundingClientRect();
    let x, y, w, h;
    if (document.body.classList.contains('sideways')) { x = e.clientY - r.top; y = r.right - e.clientX; w = r.height; h = r.width; }
    else { x = e.clientX - r.left; y = e.clientY - r.top; w = r.width; h = r.height; }
    aim.x = clamp((x / w) * W, 0, W); aim.y = clamp((y / h) * H, 0, H);
  }
  function press() { if (!g || g.over) return; held = true; if (game.press) game.press(g); }
  function release() { held = false; }

  function init() {
    cv = $('mini-cv'); c = cv.getContext('2d');
    cv.width = W * RES; cv.height = H * RES;
    cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.setPointerCapture?.(e.pointerId); toStage(e); press(); });
    cv.addEventListener('pointermove', e => toStage(e));
    cv.addEventListener('pointerup', e => { e.preventDefault(); release(); });
    cv.addEventListener('pointercancel', release);
    $('mini-close').onclick = close;
  }

  return {
    has: id => id in GAMES,
    title: id => GAMES[id].title,
    isOpen: () => open,
    debugState: () => g, // for automated tests
    open(id, o) {
      if (!cv) init();
      game = GAMES[id]; opts = o; open = true; g = null;
      preview = { score: 0 }; game.init(preview);
      bg = paintBg(game.stripes);
      aim.x = W / 2; aim.y = H / 2; held = false;
      for (const k in keys) keys[k] = false;
      $('mini-title').textContent = game.title;
      $('mini').classList.add('show');
      message(game.help, [['Play', start], ['Leave', close]]);
      last = performance.now();
      cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    },
    // keyboard, forwarded by the main game while a booth is open
    key(e, down) {
      const k = e.key.toLowerCase();
      if (down && k === 'escape') return close();
      const msgShown = $('mini-msg').classList.contains('show');
      if (msgShown) {
        if (down && (k === 'enter' || k === ' ' || k === 'e')) {
          const btns = [...$('mini-btns').children];
          (btns.find(b => b === document.activeElement) || btns[0])?.click();
        } else if (down && (k === 'arrowleft' || k === 'arrowright' || k === 'tab')) {
          const btns = [...$('mini-btns').children], i = btns.indexOf(document.activeElement);
          btns[(i + 1) % btns.length]?.focus();
        }
        return;
      }
      if (k === ' ' || k === 'enter' || k === 'e') { if (down && !e.repeat) press(); else if (!down) release(); return; }
      keys[k] = down;
    },
  };
})();
