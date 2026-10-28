'use strict';
// The estate of Vanehold, painted as parallax layers. Each layer is cut into
// cached chunks that are painted on demand, so wide layers stay cheap.
const World = (() => {
  const H = 720;
  const WORLD_W = 4900;   // walkable playfield width
  const MAXVIEW = 1800;   // widest logical viewport we support
  const CH = 512;         // chunk width in layer pixels
  const CELL = 48;        // terrain stroke cell

  const MOON = [214, 40, 72];
  const RIM = [208, 38, 60];

  // ---------------------------------------------------------------- layers
  // f: parallax factor. scale: chunk resolution (lower = softer, used for
  // depth of field). fog: atmospheric tint applied over the painted layer.
  const defs = [
    { id: 'mount', f: 0.07, scale: 0.45, fog: [62, 70, 112], fogA: [0.42, 0.62] },
    { id: 'far', f: 0.2, scale: 0.5, fog: [52, 60, 98], fogA: [0.34, 0.55] },
    { id: 'back', f: 0.4, scale: 0.6, fog: [42, 50, 84], fogA: [0.22, 0.42] },
    { id: 'mid', f: 0.66, scale: 0.8, fog: [32, 38, 66], fogA: [0.08, 0.24] },
    { id: 'near', f: 0.84, scale: 0.9, fog: [24, 28, 52], fogA: [0.03, 0.14] },
    { id: 'ground', f: 1, scale: 1, fog: null },
    { id: 'fore', f: 1.45, scale: 0.28, fog: [6, 8, 16], fogA: [0.25, 0.1] },
  ];

  const layers = defs.map((d, idx) => ({
    ...d, idx, objs: [], cache: new Map(),
    width: WORLD_W * d.f + MAXVIEW,
  }));
  const L = Object.fromEntries(layers.map(l => [l.id, l]));

  function add(layer, x0, x1, fn) {
    layer.objs.push({ x0, x1, fn, seed: P.hash(layer.idx * 7919 + 3, layer.objs.length * 104729 + 17) });
  }

  // ---------------------------------------------------------------- terrain helpers
  function band(c, li, k, x0, x1, top, col, o = {}) {
    const a = Math.floor((x0 - 80) / CELL), b = Math.ceil((x1 + 80) / CELL);
    const left = a * CELL, right = b * CELL, bottom = o.bottom ?? H;
    const path = cc => {
      cc.beginPath(); cc.moveTo(left, bottom);
      for (let x = left; x <= right; x += 4) cc.lineTo(x, top(x));
      cc.lineTo(right, bottom); cc.closePath();
    };
    c.save();
    path(c);
    c.fillStyle = o.fill ? o.fill(c, left, right) : P.hsl(col[0], col[1], col[2]);
    c.fill();
    c.clip();
    c.lineCap = 'round';
    for (let cell = a; cell < b; cell++) {
      const r = P.rng(P.hash(li, k, cell));
      const cx = cell * CELL;
      const n = o.n ?? 40;
      for (let i = 0; i < n; i++) {
        const x = cx + r() * CELL;
        const t = top(x);
        const y = t + Math.pow(r(), o.pow ?? 1.4) * (bottom - t);
        const slope = top(x + 6) - top(x - 6);
        // lit when the slope faces the moon (upper right) and near the crest
        const crest = Math.max(0, 1 - (y - t) / (o.rimDepth ?? 40));
        const lit = (slope > 0 ? Math.min(1, slope / 6) : -0.3) * crest * (o.rimL ?? 14);
        const dl = lit - ((y - t) / (bottom - t)) * (o.darken ?? 6);
        const L = (o.len ?? 22) * (0.4 + r() * 0.9);
        const ang = (o.ang ?? 0.08) + (r() - 0.5) * 0.35 + Math.atan(slope / 12) * 0.6;
        c.globalAlpha = (o.a ?? 0.4) * (0.4 + r() * 0.6);
        c.strokeStyle = P.hsl(col[0] + (r() - 0.5) * 10, col[1] + (r() - 0.5) * 8, col[2] + (r() - 0.5) * (o.lv ?? 10) + dl);
        c.lineWidth = (o.w ?? 5) * (0.4 + r() * 0.9);
        c.beginPath();
        c.moveTo(x - Math.cos(ang) * L / 2, y - Math.sin(ang) * L / 2);
        c.lineTo(x + Math.cos(ang) * L / 2, y + Math.sin(ang) * L / 2);
        c.stroke();
      }
    }
    c.restore();
    c.globalAlpha = 1;
  }

  function cellsDo(li, k, x0, x1, w, fn) {
    const a = Math.floor((x0 - 120) / w), b = Math.ceil((x1 + 120) / w);
    for (let cell = a; cell < b; cell++) fn(P.rng(P.hash(li, k, cell, 99)), cell * w, cell * w + w);
  }

  // ---------------------------------------------------------------- mountains
  const ridgeA = x => 360 - P.fbm(x * 0.0021, 11) * 190;
  const ridgeB = x => 440 - P.fbm(x * 0.0032, 23) * 140;
  L.mount.terrain = (c, x0, x1) => {
    band(c, 0, 1, x0, x1, ridgeA, [236, 26, 34], { n: 30, len: 34, w: 8, rimL: 20, rimDepth: 60, a: 0.45 });
    band(c, 0, 2, x0, x1, ridgeB, [240, 24, 26], { n: 30, len: 30, w: 7, rimL: 16, rimDepth: 40, a: 0.45 });
  };

  // ---------------------------------------------------------------- far hills
  const hillF = x => 478 - P.fbm(x * 0.0035, 37) * 95;
  L.far.terrain = (c, x0, x1) => {
    band(c, 1, 1, x0, x1, hillF, [236, 22, 20], { n: 34, len: 24, w: 6, rimL: 14 });
  };
  L.far.front = (c, x0, x1) => {
    cellsDo(1, 2, x0, x1, 22, (r, a) => {
      const x = a + r() * 22;
      if (P.fbm(x * 0.01, 5) < 0.42) return; // gaps in the treeline
      P.pine(c, r, x, hillF(x) + 4, 26 + r() * 46, { col: [228, 22, 16], rim: [214, 26, 30], rimA: 0.25 });
    });
  };
  // ruined chapel on a far hill
  add(L.far, 420, 640, (c, r) => {
    const x = 520, base = hillF(520) + 8;
    const stone = [232, 14, 26];
    P.paintFill(c, r, cc => {
      cc.beginPath();
      cc.moveTo(x - 70, base); cc.lineTo(x - 70, base - 60); cc.lineTo(x - 30, base - 92);
      cc.lineTo(x - 5, base - 64); cc.lineTo(x + 10, base - 64);
      cc.lineTo(x + 10, base - 150); cc.lineTo(x + 20, base - 172); cc.lineTo(x + 30, base - 150);
      cc.lineTo(x + 30, base - 100); cc.lineTo(x + 42, base - 92); cc.lineTo(x + 40, base - 60);
      cc.lineTo(x + 60, base - 48); cc.lineTo(x + 72, base); cc.closePath();
    }, [x - 80, base - 180, 160, 190], stone, { ang: 1.5, len: 10, w: 3, lf: (px) => (px - x) * 0.12 });
    c.fillStyle = P.hsl(30, 70, 55, 0.85);
    P.dab(c, x + 20, base - 128, 2.5, 5, 0);
    c.fillStyle = P.hsl(232, 30, 10);
    for (let i = 0; i < 3; i++) { P.dab(c, x - 50 + i * 18, base - 40, 3, 9, 0); }
  });

  // ---------------------------------------------------------------- back woods
  const hillB = x => 508 - P.fbm(x * 0.004, 41) * 34;
  L.back.terrain = (c, x0, x1) => band(c, 2, 1, x0, x1, hillB, [228, 22, 16], { n: 34, len: 22, w: 6, rimL: 10 });
  L.back.front = (c, x0, x1) => cellsDo(2, 3, x0, x1, CELL, (r, a, b) =>
    P.grass(c, r, a, b, hillB, [222, 22, 18], { dens: 0.4, h: 12, rim: [210, 30, 34], a: 0.7 }));

  // ---------------------------------------------------------------- mid grounds
  const hillM = x => 552 - P.fbm(x * 0.005, 53) * 20;
  L.mid.terrain = (c, x0, x1) => band(c, 3, 1, x0, x1, hillM, [222, 22, 14], { n: 40, len: 20, w: 6, rimL: 12 });
  L.mid.front = (c, x0, x1) => cellsDo(3, 3, x0, x1, CELL, (r, a, b) =>
    P.grass(c, r, a, b, hillM, [205, 22, 14], { dens: 0.7, h: 16, rim: RIM, a: 0.8 }));


  // ---------------------------------------------------------------- near grounds
  // A layer just behind the path: hedges, broken columns, urns and roses.
  const hillN = x => 586 - P.fbm(x * 0.006, 61) * 14;
  L.near.terrain = (c, x0, x1) => band(c, 6, 1, x0, x1, hillN, [210, 22, 12], { n: 40, len: 18, w: 5, rimL: 12 });
  L.near.front = (c, x0, x1) => cellsDo(6, 3, x0, x1, CELL, (r, a, b) =>
    P.grass(c, r, a, b, hillN, [198, 22, 14], { dens: 0.9, h: 16, rim: [204, 32, 38], a: 0.8 }));

  function brokenColumn(c, r, x, y) {
    const h = 70 + r() * 90, w = 22, stone = [216, 10, 32];
    P.paintFill(c, r, cc => {
      cc.beginPath(); cc.moveTo(x - w / 2, y); cc.lineTo(x - w / 2, y - h);
      for (let i = 0; i <= 4; i++) cc.lineTo(x - w / 2 + (i / 4) * w, y - h - (r() - 0.3) * 14);
      cc.lineTo(x + w / 2, y); cc.closePath();
    }, [x - w / 2, y - h - 14, w, h + 14], stone, { ang: 1.57, len: 14, w: 2, angJ: 0.05, lf: px => (px - x) * 1.4 });
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(x - w * 0.8, y - 10, w * 1.6, 10); }, [x - w * 0.8, y - 10, w * 1.6, 10], stone, { ang: 0, len: 10, w: 2 });
    // fallen drum lying in the grass
    P.paintFill(c, r, cc => { cc.beginPath(); cc.ellipse(x + 34, y - 9, 24, 10, 0.05, 0, P.TAU); }, [x + 10, y - 20, 48, 22], stone, { ang: 0, len: 12, w: 2, lf: (px, py) => -(py - y + 9) * 1.5 });
    P.clump(c, r, x - 4, y - h * 0.4, 16, [150, 24, 12], { a: 0.75, n: 10, hl: [185, 30, 36], hla: 0.3 });
  }
  function urn(c, r, x, y) {
    const stone = [218, 10, 34];
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(x - 14, y - 50, 28, 50); }, [x - 14, y - 50, 28, 50], stone, { ang: 1.57, len: 10, w: 2, lf: px => (px - x) * 0.8 });
    P.paintFill(c, r, cc => {
      cc.beginPath(); cc.moveTo(x - 10, y - 50); cc.quadraticCurveTo(x - 26, y - 70, x - 18, y - 88);
      cc.lineTo(x + 18, y - 88); cc.quadraticCurveTo(x + 26, y - 70, x + 10, y - 50); cc.closePath();
    }, [x - 26, y - 90, 52, 42], stone, { ang: 0.3, len: 10, w: 2, lf: px => (px - x) * 0.8 });
    P.clump(c, r, x, y - 92, 16, [150, 24, 12], { a: 0.85, n: 12, hl: [185, 30, 36] });
  }
  function roses(c, r, x, y) {
    P.clump(c, r, x, y - 18, 30, [150, 26, 10], { a: 0.85, n: 26, shade: 4, hl: [180, 30, 32], hla: 0.3 });
    for (let i = 0; i < 9; i++) {
      c.globalAlpha = 0.9; c.fillStyle = P.hsl(350 + r() * 10, 55, 24 + r() * 12);
      P.dab(c, x + (r() - 0.5) * 50, y - 18 + (r() - 0.5) * 26, 3.5, 3, r() * 3);
    }
    c.globalAlpha = 1;
  }
  {
    const r = P.rng(2468);
    for (let x = 120; x < L.near.width; x += 170 + r() * 260) {
      const kind = Math.floor(r() * 5);
      add(L.near, x - 70, x + 80, (c, rr) => {
        const y = hillN(x) + 6;
        if (kind === 0) brokenColumn(c, rr, x, y);
        else if (kind === 1) urn(c, rr, x, y);
        else if (kind === 2) roses(c, rr, x, y);
        else if (kind === 3) headstone(c, rr, x, y, 26 + rr() * 10, 40 + rr() * 20, rr() < 0.3 ? 'cross' : 'round', (rr() - 0.5) * 0.25);
        else for (let i = 0; i < 3; i++) P.clump(c, rr, x - 40 + i * 40, y - 22, 30, [158, 24, 11], { a: 0.85, n: 22, shade: 4, hl: [190, 30, 34], hla: 0.35 });
      });
    }
  }

  // ---------------------------------------------------------------- playfield
  const groundY = x => 604 + (P.fbm(x * 0.01, 71) - 0.5) * 8;
  const PATH_T = 616, PATH_B = 652;
  L.ground.terrain = (c, x0, x1) => {
    band(c, 4, 1, x0, x1, groundY, [200, 24, 12], { n: 46, len: 18, w: 5, rimL: 10, lv: 8 });
    // the gravel path
    const pathTop = x => PATH_T + Math.sin(x * 0.004) * 3;
    band(c, 4, 2, x0, x1, pathTop, [228, 12, 24], {
      bottom: PATH_B + 2, n: 70, len: 16, w: 4, ang: 0.02, rimL: 0, darken: 8, pow: 1, a: 0.5, lv: 14,
    });
  };
  L.ground.front = (c, x0, x1) => {
    cellsDo(4, 3, x0, x1, CELL, (r, a, b) => {
      // pebbles on the path
      for (let i = 0; i < 6; i++) {
        const x = a + r() * CELL, y = PATH_T + 6 + r() * (PATH_B - PATH_T - 8);
        const s = 1.5 + r() * 3.5;
        c.globalAlpha = 0.7;
        c.fillStyle = P.hsl(225, 10, 12); P.dab(c, x + 1, y + 1, s, s * 0.6, 0);
        c.fillStyle = P.hsl(220, 12, 34 + r() * 12); P.dab(c, x, y, s, s * 0.55, 0);
        c.fillStyle = P.hsl(210, 25, 55, 0.6); P.dab(c, x + s * 0.3, y - s * 0.25, s * 0.35, s * 0.2, 0);
      }
      P.grass(c, r, a, b, groundY, [190, 24, 14], { dens: 1.2, h: 18, rim: [200, 34, 40], a: 0.85 });
      P.grass(c, r, a, b, () => PATH_T + 2, [195, 22, 16], { dens: 0.5, h: 8, rim: [200, 30, 36], a: 0.6 });
      P.grass(c, r, a, b, () => PATH_B + 4, [195, 22, 13], { dens: 1.4, h: 16, below: 60, rim: [200, 30, 34], a: 0.85 });
      if (r() < 0.35) { // fallen autumn leaves on the path
        for (let i = 0; i < 5; i++) {
          c.globalAlpha = 0.75;
          c.fillStyle = P.hsl(10 + r() * 30, 45, 22 + r() * 12);
          P.dab(c, a + r() * CELL, PATH_T + r() * 36, 2.5, 1.2, r() * 3);
        }
      }
    });
    c.globalAlpha = 1;
  };

  // rain puddles on the path; their reflections are animated in the game loop
  const PUDDLES = [[760, 58], [1500, 44], [2060, 64], [2960, 50], [3640, 60], [4420, 72]].map(([x, rx]) => ({ x, rx, ry: rx * 0.13, y: PATH_T + 22 }));
  function puddle(c, r, p) {
    const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.rx);
    g.addColorStop(0, 'rgba(14,18,40,0.95)'); g.addColorStop(0.75, 'rgba(22,26,52,0.9)'); g.addColorStop(1, 'rgba(30,30,48,0.5)');
    c.save(); c.translate(p.x, p.y); c.scale(1, p.ry / p.rx); c.translate(-p.x, -p.y);
    c.globalAlpha = 1; c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, p.rx, 0, P.TAU); c.fill();
    c.restore();
    // wet mud rim and a cold sky sheen
    c.strokeStyle = P.hsl(25, 20, 9, 0.8); c.lineWidth = 2.5;
    c.beginPath(); c.ellipse(p.x, p.y + 1, p.rx + 2, p.ry + 1.5, 0, 0.1, Math.PI - 0.1); c.stroke();
    c.strokeStyle = P.hsl(220, 30, 45, 0.35); c.lineWidth = 1.2;
    c.beginPath(); c.ellipse(p.x, p.y, p.rx * 0.9, p.ry * 0.8, 0, Math.PI + 0.3, P.TAU - 0.3); c.stroke();
    for (let i = 0; i < 6; i++) { c.fillStyle = P.hsl(30, 15, 12, 0.7); P.dab(c, p.x + (r() - 0.5) * p.rx * 2.1, p.y + (r() - 0.5) * p.ry * 2.4, 3 + r() * 4, 1.5, 0); }
  }
  const groundFront = L.ground.front;
  L.ground.front = (c, x0, x1) => {
    groundFront(c, x0, x1);
    for (const p of PUDDLES) if (p.x + p.rx > x0 - 20 && p.x - p.rx < x1 + 20) puddle(c, P.rng(P.hash(p.x, 404)), p);
  };

  // ---------------------------------------------------------------- foreground
  L.fore.terrain = (c, x0, x1) => {
    cellsDo(5, 1, x0, x1, 64, (r, a, b) => {
      const base = 700 + r() * 20;
      // grass and fern silhouettes rising from below the frame
      P.grass(c, r, a, b, () => base + 30, [225, 25, 7], { dens: 0.55, h: 120, w: 5, a: 0.95, rim: [215, 30, 24] });
      if (r() < 0.45) {
        const fx = a + r() * 64, fy = 735;
        for (let f = 0; f < 6; f++) {
          const ang = -Math.PI / 2 + (f - 2.5) * 0.35;
          const len = 80 + r() * 70;
          const pts = [];
          for (let t = 0; t <= 6; t++) {
            const d = (t / 6) * len;
            pts.push([fx + Math.cos(ang) * d + Math.pow(t / 6, 2) * 30 * Math.sign(ang + Math.PI / 2 || 1), fy + Math.sin(ang) * d + Math.pow(t / 6, 2) * 40]);
          }
          P.brush(c, r, pts, 7, [220, 25, 7], 0.95, { taper: 0.8, k: 3, rim: [210, 30, 22], rimA: 0.4 });
        }
      }
    });
  };
  // big trunks and hanging boughs close to the lens
  for (let x = 1500; x < L.fore.width; x += 2300 + ((x * 7) % 600)) {
    add(L.fore, x - 140, x + 240, (c, r) => {
      const w = 34 + r() * 22;
      P.paintFill(c, r, cc => {
        cc.beginPath();
        cc.moveTo(x - w * 0.9, H + 10); cc.quadraticCurveTo(x - w * 0.4, H * 0.5, x - w * 0.5, -240);
        cc.lineTo(x + w * 0.5, -240); cc.quadraticCurveTo(x + w * 0.3, H * 0.5, x + w, H + 10); cc.closePath();
      }, [x - w, -240, w * 2, H + 250], [228, 22, 6], { ang: 1.55, len: 40, w: 8, lf: px => Math.max(0, px - x) * 0.25 });
    });
  }
  for (let x = 400; x < L.fore.width; x += 1500 + ((x * 13) % 700)) {
    add(L.fore, x - 360, x + 360, (c, r) => {
      const pts = [[x - 340, -240], [x - 280, -20], [x - 100, 30], [x + 100, 50], [x + 330, 20]];
      P.brush(c, r, pts, 18, [228, 22, 6], 1, { taper: 0.7, k: 4 });
      for (let i = 0; i < 14; i++) {
        const t = r(), px = x - 250 + t * 560, py = 20 + Math.sin(t * 3) * 30;
        P.clump(c, r, px, py + 20, 30 + r() * 25, [10 + r() * 25, 30, 7], { a: 0.95, n: 12 });
      }
    });
  }

  // ---------------------------------------------------------------- scatter trees
  {
    const r = P.rng(1234);
    for (let x = 0; x < L.back.width; x += 30 + r() * 55) {
      const ht = 140 + r() * 170, isPine = r() < 0.62, seed = r();
      add(L.back, x - ht * 0.5, x + ht * 0.5, (c, rr) => {
        const y = hillB(x) + 6;
        if (isPine) P.pine(c, rr, x, y, ht, { col: [222, 22, 12], rim: [214, 30, 34], rimA: 0.25 });
        else P.tree(c, rr, x, y, ht, { type: 'dead', bark: [228, 18, 11], rim: [214, 30, 32], depth: 5 });
      });
      void seed;
    }
  }
  const AUTUMN = [[12, 42, 24], [28, 44, 28], [352, 34, 21], [40, 30, 24]];
  {
    const r = P.rng(4321);
    for (let x = 60; x < L.mid.width; x += 130 + r() * 220) {
      const ht = 220 + r() * 160, kind = r() < 0.6 ? 'oak' : 'dead', leaf = AUTUMN[Math.floor(r() * AUTUMN.length)];
      add(L.mid, x - ht * 0.6, x + ht * 0.6, (c, rr) => {
        P.tree(c, rr, x, hillM(x) + 6, ht, {
          type: kind, bark: [225, 18, 12], rim: [210, 34, 44], leaf, leafHl: [205, 30, 46], depth: kind === 'dead' ? 6 : 5,
        });
      });
    }
    // wrought-iron fence runs and stone angels
    for (let x = 200; x < L.mid.width; x += 700 + r() * 500) {
      const len = 160 + r() * 200;
      add(L.mid, x - 10, x + len + 10, (c, rr) => ironFence(c, rr, x, len, hillM));
      if (r() < 0.6) {
        const ax = x + len + 60;
        add(L.mid, ax - 50, ax + 50, (c, rr) => angel(c, rr, ax, hillM(ax) + 4, 0.8));
      }
    }
  }

  // ---------------------------------------------------------------- props
  function ironFence(c, r, x, len, yfn) {
    const col = [228, 18, 8];
    for (let px = x; px <= x + len; px += 16) {
      const y = yfn(px) + 4;
      P.brush(c, r, [[px, y], [px, y - 64]], 2.4, col, 1, { k: 2, rim: RIM, rimA: 0.3 });
      c.fillStyle = P.hsl(228, 18, 10);
      c.beginPath(); c.moveTo(px - 3, y - 64); c.lineTo(px, y - 74); c.lineTo(px + 3, y - 64); c.fill();
    }
    for (const h of [52, 18]) {
      const pts = [];
      for (let px = x; px <= x + len; px += 16) pts.push([px, yfn(px) + 4 - h]);
      P.brush(c, r, pts, 2.2, col, 1, { k: 2, rim: RIM, rimA: 0.25 });
    }
  }

  function angel(c, r, x, y, s) {
    P.shadow(c, x, y, 40 * s, 7 * s);
    const stone = [218, 10, 34];
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(x - 22 * s, y - 40 * s, 44 * s, 40 * s); },
      [x - 24 * s, y - 42 * s, 48 * s, 44 * s], stone, { ang: 1.5, len: 8, w: 2.5, lf: px => (px - x) * 0.4 });
    // wings
    for (const d of [-1, 1]) {
      P.clump(c, r, x + d * 22 * s, y - 108 * s, 24 * s, [218, 10, 30 + (d > 0 ? 8 : 0)], { a: 0.9, sq: 1.4, n: 18, rot: d * 0.8, hl: d > 0 ? MOON : null, hla: 0.35 });
    }
    P.paintFill(c, r, cc => {
      cc.beginPath();
      cc.moveTo(x - 18 * s, y - 40 * s); cc.quadraticCurveTo(x - 14 * s, y - 100 * s, x - 6 * s, y - 118 * s);
      cc.lineTo(x + 6 * s, y - 118 * s); cc.quadraticCurveTo(x + 14 * s, y - 100 * s, x + 18 * s, y - 40 * s); cc.closePath();
    }, [x - 20 * s, y - 120 * s, 40 * s, 82 * s], stone, { ang: 1.45, len: 12, w: 2.5, lf: px => (px - x) * 0.6 });
    c.fillStyle = P.hsl(218, 12, 40);
    P.dab(c, x, y - 128 * s, 9 * s, 11 * s, 0);
    c.fillStyle = P.hsl(212, 30, 62, 0.5);
    P.dab(c, x + 4 * s, y - 131 * s, 3 * s, 5 * s, 0);
  }

  function headstone(c, r, x, y, w, h, kind, tilt = 0) {
    P.shadow(c, x, y, w * 0.9, w * 0.14);
    c.save();
    c.translate(x, y); c.rotate(tilt);
    const stone = [222, 9, 30 + r() * 8];
    if (kind === 'cross') {
      P.paintFill(c, r, cc => {
        cc.beginPath();
        cc.rect(-w * 0.14, -h, w * 0.28, h);
        cc.rect(-w * 0.5, -h * 0.75, w, w * 0.26);
      }, [-w * 0.5, -h, w, h], stone, { ang: 1.5, len: 8, w: 2, lf: px => px * 0.6 });
    } else {
      P.paintFill(c, r, cc => {
        cc.beginPath();
        cc.moveTo(-w / 2, 0); cc.lineTo(-w / 2, -h + w / 2);
        cc.arc(0, -h + w / 2, w / 2, Math.PI, 0); cc.lineTo(w / 2, 0); cc.closePath();
      }, [-w / 2, -h, w, h], stone, { ang: 1.4, len: 10, w: 2.4, lf: (px, py) => px / w * 22 - (py + h) * 0.02 });
      // carved lines
      c.strokeStyle = P.hsl(225, 14, 14, 0.7); c.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) {
        const ly = -h * 0.62 + i * 8;
        c.beginPath(); c.moveTo(-w * 0.28 + r() * 3, ly); c.lineTo(w * 0.28 - r() * 3, ly); c.stroke();
      }
    }
    // moonlit edge
    c.globalAlpha = 0.5; c.strokeStyle = P.hsl(MOON[0], 30, 60); c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(w * 0.45, -2); c.lineTo(w * 0.45, -h * 0.75); c.stroke();
    // moss and grass at the base
    P.clump(c, r, 0, -4, w * 0.6, [110, 22, 16], { a: 0.7, sq: 0.25, n: 14 });
    c.restore();
  }

  function lampPost(c, r, x, y) {
    P.shadow(c, x, y + 2, 26, 5, 0.4);
    const iron = [228, 18, 8];
    P.brush(c, r, [[x, y], [x, y - 150]], 5, iron, 1, { k: 3, rim: RIM, rimA: 0.35 });
    P.brush(c, r, [[x - 8, y], [x + 8, y]], 6, iron, 1, { k: 2 });
    c.fillStyle = P.hsl(228, 18, 9);
    c.beginPath(); c.moveTo(x - 12, y - 150); c.lineTo(x + 12, y - 150); c.lineTo(x + 8, y - 178); c.lineTo(x - 8, y - 178); c.fill();
    c.beginPath(); c.moveTo(x - 15, y - 178); c.lineTo(x, y - 190); c.lineTo(x + 15, y - 178); c.fill();
    c.fillStyle = P.hsl(38, 85, 62, 0.95);
    P.dab(c, x, y - 164, 5, 9, 0);
  }

  // ---------------------------------------------------------------- the playfield's set pieces
  const LIGHTS = [];
  const SPOTS = [];

  // background hedges & bushes along the playfield (drawn first)
  {
    const r = P.rng(777);
    for (let x = 40; x < WORLD_W + MAXVIEW; x += 90 + r() * 170) {
      if (x > 4150 && x < 4950) continue;
      const rad = 22 + r() * 36;
      add(L.ground, x - rad * 1.6, x + rad * 1.6, (c, rr) => {
        const y = groundY(x) - rad * 0.35;
        P.clump(c, rr, x - rad * 0.5, y + 4, rad * 0.9, [165, 22, 9], { a: 0.8, n: 20 });
        P.clump(c, rr, x, y, rad, [150, 22, 13], { a: 0.75, n: 24, shade: 5, hl: [195, 30, 38], hla: 0.45 });
      });
    }
  }

  // graveyard -----------------------------------------------------------
  add(L.ground, 80, 560, (c, r) => {
    const stones = [[120, 34, 62, 0, -0.06], [190, 28, 50, 1, 0.08], [400, 30, 56, 0, 0.12], [460, 44, 70, 2, -0.05], [520, 26, 44, 1, 0.1]];
    for (const [sx, w, h, k, t] of stones) headstone(c, r, sx, groundY(sx) + 6, w, h, k === 1 ? 'cross' : 'round', t);
    // the fresh grave
    const gx = 300, gy = groundY(gx) + 8;
    P.paintFill(c, r, cc => { cc.beginPath(); cc.ellipse(gx + 30, gy + 4, 70, 12, 0, Math.PI, 0); cc.closePath(); },
      [gx - 45, gy - 12, 150, 18], [20, 30, 13], { ang: 0.05, len: 12, w: 3, lf: (px) => (px - gx) * 0.06 });
    headstone(c, r, gx - 20, gy, 46, 92, 'round', 0.02);
    c.fillStyle = P.hsl(220, 10, 18); c.font = 'italic 11px Georgia'; c.textAlign = 'center';
    c.fillText('A.V.', gx - 20, gy - 66);
    // lilies and wilted roses
    for (let i = 0; i < 9; i++) {
      const fx = gx + r() * 60, fy = gy - 2 - r() * 6;
      c.globalAlpha = 0.9;
      c.fillStyle = i % 3 === 0 ? P.hsl(45, 25, 78) : P.hsl(352, 55, 26 + r() * 10);
      P.dab(c, fx, fy, 3, 2, r() * 3);
    }
    c.globalAlpha = 1;
  });
  SPOTS.push({ id: 'grave', x: 280, y: 520, auto: true });

  // weeping willow & goblet ---------------------------------------------
  add(L.ground, 640, 1200, (c, r) => {
    P.tree(c, r, 900, groundY(900) + 4, 380, { type: 'willow', bark: [225, 18, 11], rim: [205, 34, 46], leaf: [160, 22, 17], leafHl: [180, 30, 44], depth: 5 });
  });
  add(L.ground, 950, 990, (c, r) => {
    const x = 968, y = groundY(x) + 14;
    c.save(); c.translate(x, y); c.rotate(1.35);
    c.fillStyle = P.hsl(45, 40, 40); c.beginPath(); c.moveTo(-6, -12); c.lineTo(6, -12); c.lineTo(2, 0); c.lineTo(-2, 0); c.fill();
    c.fillRect(-0.8, 0, 1.6, 7); c.fillRect(-4, 7, 8, 1.6);
    c.fillStyle = P.hsl(48, 60, 70, 0.8); P.dab(c, 3, -9, 1.2, 2.5, 0);
    c.restore();
    c.fillStyle = P.hsl(350, 60, 20, 0.7); P.dab(c, x + 14, y + 2, 10, 2.5, 0);
  });
  SPOTS.push({ id: 'goblet', x: 968, y: 600 });


  // the Vane mausoleum, where something rattles ----------------------------
  add(L.ground, 2110, 2380, (c, r) => {
    const cx = 2240, y = groundY(cx) + 6, stone = [220, 10, 28];
    P.shadow(c, cx, y + 2, 150, 13, 0.55);
    const lf = (px, py) => (px - cx) * 0.06 - (py - y) * -0.01;
    for (let s = 0; s < 2; s++) {
      P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(cx - 110 + s * 8, y - 12 - s * 10, 220 - s * 16, 12); }, [cx - 110, y - 22, 220, 22], [218, 10, 30 - s * 2], { ang: 0, len: 16, w: 2 });
    }
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(cx - 92, y - 190, 184, 170); }, [cx - 92, y - 190, 184, 170], stone, { ang: 0.04, len: 20, w: 4, density: 90, lf });
    c.strokeStyle = P.hsl(228, 14, 10, 0.45); c.lineWidth = 1.2;
    for (let row = 0; row < 8; row++) {
      const ry = y - 190 + row * 21;
      c.beginPath(); c.moveTo(cx - 92, ry); c.lineTo(cx + 92, ry); c.stroke();
    }
    P.paintFill(c, r, cc => { cc.beginPath(); cc.moveTo(cx - 108, y - 190); cc.lineTo(cx, y - 252); cc.lineTo(cx + 108, y - 190); cc.closePath(); },
      [cx - 108, y - 254, 216, 66], [222, 12, 24], { ang: -0.25, len: 16, w: 3, lf });
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(cx - 112, y - 196, 224, 9); }, [cx - 112, y - 196, 224, 9], [218, 10, 36], { ang: 0, len: 16, w: 2 });
    for (const px of [cx - 78, cx - 48, cx + 48, cx + 78]) {
      P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(px - 8, y - 187, 16, 165); }, [px - 8, y - 187, 16, 165], [216, 10, 38],
        { ang: 1.57, len: 18, w: 2, angJ: 0.05, lf: qx => (qx - px) * 1.8 });
    }
    // the open door, with a cold blue light inside
    const g = c.createLinearGradient(0, y - 150, 0, y - 22);
    g.addColorStop(0, 'rgba(10,14,30,1)'); g.addColorStop(1, 'rgba(40,90,150,1)');
    c.fillStyle = g;
    c.beginPath(); c.moveTo(cx - 30, y - 22); c.lineTo(cx - 30, y - 120); c.arc(cx, y - 120, 30, Math.PI, 0); c.lineTo(cx + 30, y - 22); c.fill();
    c.fillStyle = P.hsl(220, 14, 14); c.font = 'bold 13px Georgia'; c.textAlign = 'center';
    c.fillText('V A N E', cx, y - 205);
    for (let i = 0; i < 12; i++) P.clump(c, r, cx - 100 + r() * 200, y - 200 + r() * 180 * (r() < 0.5 ? 0.2 : 1), 10 + r() * 12, [150, 24, 12], { a: 0.8, n: 10, hl: [185, 30, 36], hla: 0.3 });
  });
  LIGHTS.push({ x: 2240, y: groundY(2240) - 70, r: 170, col: [120, 180, 255], flick: 0.4, cool: true });
  SPOTS.push({ id: 'bones', x: 2290, y: 470 });

  // surfaces the ghost can land on: [x0, x1, y]
  const PLATFORMS = [
    { x0: 436, x1: 486, y: 542 },     // the tall headstone
    { x0: 3078, x1: 3322, y: 572 },   // fountain basin rim
    { x0: 3142, x1: 3258, y: 472 },   // fountain upper bowl
    { x0: 3830, x1: 3998, y: 574 },   // cellar wall
  ];

  // gas lamps -----------------------------------------------------------
  const LAMPS = [1300, 1990, 2860, 3560, 4150];
  for (const lx of LAMPS) {
    add(L.ground, lx - 20, lx + 20, (c, r) => lampPost(c, r, lx, groundY(lx) + 6));
    LIGHTS.push({ x: lx, y: groundY(lx) - 158, r: 230, col: [255, 170, 90], flick: 1, pool: true, cone: true });
  }

  // gardener's shed -----------------------------------------------------
  add(L.ground, 1600, 1830, (c, r) => {
    const x = 1640, y = groundY(1700) + 6, w = 150, h = 130;
    P.shadow(c, x + w / 2, y + 2, w * 0.75, 12, 0.55);
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(x, y - h, w, h); }, [x, y - h, w, h], [24, 22, 16],
      { ang: 1.57, len: 30, w: 4, angJ: 0.05, density: 60, lf: px => (px - x) / w * 10 });
    c.strokeStyle = P.hsl(20, 20, 7, 0.8); c.lineWidth = 1.5;
    for (let px = x + 12; px < x + w; px += 13) { c.beginPath(); c.moveTo(px, y - h); c.lineTo(px + r() * 1.5, y); c.stroke(); }
    P.paintFill(c, r, cc => {
      cc.beginPath(); cc.moveTo(x - 18, y - h + 6); cc.lineTo(x + w * 0.35, y - h - 46); cc.lineTo(x + w + 18, y - h + 6); cc.closePath();
    }, [x - 20, y - h - 50, w + 40, 60], [240, 16, 10], { ang: 0.35, len: 20, w: 4, lf: px => (px - x) / w * 12 });
    c.fillStyle = P.hsl(20, 30, 6); c.fillRect(x + 20, y - 88, 42, 88);
    c.fillStyle = P.hsl(40, 40, 30, 0.6); c.fillRect(x + 88, y - 98, 34, 26);
    c.strokeStyle = P.hsl(20, 25, 6); c.lineWidth = 3;
    c.beginPath(); c.moveTo(x + 105, y - 98); c.lineTo(x + 105, y - 72); c.moveTo(x + 88, y - 85); c.lineTo(x + 122, y - 85); c.stroke();
    // rake & barrel
    P.brush(c, r, [[x + w + 6, y], [x + w + 24, y - 110]], 3, [25, 25, 18], 1, { k: 2, rim: RIM });
    P.paintFill(c, r, cc => { cc.beginPath(); cc.ellipse(x - 22, y - 26, 18, 28, 0, 0, P.TAU); }, [x - 40, y - 56, 36, 56], [22, 26, 14],
      { ang: 1.57, len: 14, w: 3, lf: px => (px - x + 22) * 0.8 });
  });
  SPOTS.push({ id: 'ledger', x: 1700, y: 540 });

  // the gazebo ---------------------------------------------------------
  add(L.ground, 2360, 2660, (c, r) => {
    const cx = 2510, y = groundY(cx) + 6, stone = [216, 12, 40];
    P.shadow(c, cx, y + 2, 170, 14, 0.5);
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(cx - 125, y - 18, 250, 18); }, [cx - 125, y - 18, 250, 18], stone, { ang: 0.02, len: 18, w: 3 });
    for (const px of [cx - 105, cx - 36, cx + 36, cx + 105]) {
      P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(px - 7, y - 150, 14, 132); }, [px - 7, y - 150, 14, 132], stone,
        { ang: 1.57, len: 20, w: 2, angJ: 0.05, lf: qx => (qx - px) * 2.2 });
    }
    // dome
    P.paintFill(c, r, cc => {
      cc.beginPath(); cc.moveTo(cx - 140, y - 150); cc.quadraticCurveTo(cx - 110, y - 250, cx, y - 262);
      cc.quadraticCurveTo(cx + 110, y - 250, cx + 140, y - 150); cc.closePath();
    }, [cx - 140, y - 265, 280, 118], [222, 18, 22], { ang: -0.2, len: 24, w: 4, lf: (px, py) => (px - cx) * 0.08 - (py - y + 150) * 0.05 });
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(cx - 146, y - 156, 292, 10); }, [cx - 146, y - 156, 292, 10], stone, { ang: 0, len: 18, w: 2 });
    P.brush(c, r, [[cx, y - 262], [cx, y - 290]], 3, [228, 18, 10], 1, { k: 2 });
    // balustrade
    c.strokeStyle = P.hsl(216, 12, 30); c.lineWidth = 3;
    for (let px = cx - 100; px < cx + 100; px += 12) { if (Math.abs(px - cx) < 30) continue; c.beginPath(); c.moveTo(px, y - 18); c.lineTo(px, y - 52); c.stroke(); }
    c.fillStyle = P.hsl(216, 12, 34); c.fillRect(cx - 105, y - 56, 75, 5); c.fillRect(cx + 30, y - 56, 75, 5);
    // ivy
    for (let i = 0; i < 4; i++) P.clump(c, r, cx - 110 + r() * 220, y - 150 + r() * 30, 20, [150, 22, 13], { a: 0.8, n: 14, hl: [180, 30, 40] });
  });
  SPOTS.push({ id: 'letter', x: 2510, y: 520 });

  // the fountain -------------------------------------------------------
  add(L.ground, 3060, 3340, (c, r) => {
    const cx = 3200, y = groundY(cx) + 8, stone = [214, 10, 36];
    P.shadow(c, cx, y + 2, 160, 13, 0.5);
    const ell = (ex, ey, rx, ry, col, o) => P.paintFill(c, r, cc => { cc.beginPath(); cc.ellipse(ex, ey, rx, ry, 0, 0, P.TAU); }, [ex - rx, ey - ry, rx * 2, ry * 2], col, o);
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(cx - 125, y - 40, 250, 40); }, [cx - 125, y - 40, 250, 40], stone, { ang: 0.05, len: 20, w: 3, lf: px => (px - cx) * 0.06 });
    ell(cx, y - 40, 125, 14, [210, 30, 20], { ang: 0, len: 30, w: 2, lf: px => (px - cx) * 0.05 });
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(cx - 12, y - 140, 24, 100); }, [cx - 12, y - 140, 24, 100], stone, { ang: 1.57, len: 14, w: 2, lf: px => (px - cx) * 1.4 });
    ell(cx, y - 140, 60, 12, stone, { ang: 0, len: 20, w: 2, lf: px => (px - cx) * 0.2 });
    P.paintFill(c, r, cc => { cc.beginPath(); cc.moveTo(cx - 60, y - 140); cc.quadraticCurveTo(cx, y - 110, cx + 60, y - 140); cc.closePath(); }, [cx - 60, y - 142, 120, 30], [214, 10, 26], { ang: 0, len: 14, w: 2 });
    angel(c, r, cx, y - 148, 0.5);
    // water streams
    c.lineCap = 'round';
    for (let i = 0; i < 18; i++) {
      const sx = cx + (r() < 0.5 ? -1 : 1) * (50 + r() * 10);
      c.globalAlpha = 0.25 + r() * 0.3; c.strokeStyle = P.hsl(195, 45, 65 + r() * 15); c.lineWidth = 0.8 + r();
      c.beginPath(); c.moveTo(sx, y - 138); c.quadraticCurveTo(sx + Math.sign(sx - cx) * 25, y - 120, sx + Math.sign(sx - cx) * (30 + r() * 10), y - 44); c.stroke();
    }
    c.globalAlpha = 1;
  });
  SPOTS.push({ id: 'locket', x: 3200, y: 530 });

  // cellar hatch ---------------------------------------------------------
  add(L.ground, 3800, 4020, (c, r) => {
    const x = 3860, y = groundY(3900) + 10;
    P.shadow(c, x + 55, y + 2, 120, 10, 0.45);
    P.paintFill(c, r, cc => { cc.beginPath(); cc.moveTo(x - 30, y); cc.lineTo(x - 30, y - 40); cc.lineTo(x + 140, y - 40); cc.lineTo(x + 140, y); cc.closePath(); },
      [x - 30, y - 42, 170, 44], [222, 10, 26], { ang: 0.05, len: 16, w: 4, lf: px => (px - x) * 0.04 });
    c.strokeStyle = P.hsl(225, 14, 12, 0.7); c.lineWidth = 1.5;
    for (let row = 0; row < 3; row++) for (let bx = x - 30 + (row % 2) * 14; bx < x + 140; bx += 28) c.strokeRect(bx, y - 40 + row * 13, 28, 13);
    P.paintFill(c, r, cc => { cc.beginPath(); cc.moveTo(x - 10, y - 40); cc.lineTo(x + 120, y - 40); cc.lineTo(x + 100, y - 74); cc.lineTo(x + 10, y - 74); cc.closePath(); },
      [x - 10, y - 76, 130, 38], [25, 24, 14], { ang: 1.57, len: 12, w: 3, density: 50, lf: px => (px - x) * 0.06 });
    c.strokeStyle = P.hsl(20, 20, 6); c.lineWidth = 2;
    c.beginPath(); c.moveTo(x + 55, y - 40); c.lineTo(x + 55, y - 74); c.stroke();
    c.strokeStyle = P.hsl(40, 15, 40); c.lineWidth = 1.5;
    c.beginPath(); c.arc(x + 48, y - 56, 4, 0, P.TAU); c.stroke(); c.beginPath(); c.arc(x + 62, y - 56, 4, 0, P.TAU); c.stroke();
  });
  SPOTS.push({ id: 'keys', x: 3915, y: 548 });

  // Vanehold manor ---------------------------------------------------------
  const MX0 = 4200, MX1 = 5260, DOOR = 4560;
  const MTOP = 150, WINDOWS = [];
  {
    const lit = [1, 0, 1, 1, 0, 1, 0, 1, 1, 0];
    let wi = 0;
    for (const wy of [MTOP + 50, MTOP + 240]) {
      for (let wx = MX0 + 60; wx < MX1 - 40; wx += 110) {
        if (wy > MTOP + 200 && Math.abs(wx + 22 - DOOR) < 90) continue;
        const on = !!lit[wi++ % lit.length];
        WINDOWS.push({ x: wx, y: wy, on });
        if (on) LIGHTS.push({ x: wx + 22, y: wy + 46, r: 150, col: [255, 160, 80], flick: 0.3, pool: wy > MTOP + 200 });
      }
    }
  }
  add(L.ground, MX0 - 40, MX1 + 40, (c, r) => {
    const y = groundY(DOOR) + 8, top = MTOP, stone = [226, 12, 22];
    const lf = (px, py) => -Math.abs(px - DOOR) * 0.004 + (py - top) * -0.01;
    // roof and chimneys behind the facade
    P.paintFill(c, r, cc => { cc.beginPath(); cc.moveTo(MX0 - 20, top); cc.lineTo(MX0 + 60, top - 70); cc.lineTo(MX1 - 60, top - 70); cc.lineTo(MX1 + 20, top); cc.closePath(); },
      [MX0 - 20, top - 72, MX1 - MX0 + 40, 74], [235, 18, 10], { ang: 0.1, len: 30, w: 5, lv: 6 });
    for (const chx of [MX0 + 110, MX0 + 600, MX0 + 760]) {
      P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(chx, top - 130, 36, 80); }, [chx, top - 130, 36, 80], stone, { ang: 0.02, len: 12, w: 3, lf: px => (px - chx) * 0.4 });
    }
    // facade
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(MX0, top, MX1 - MX0, y - top); }, [MX0, top, MX1 - MX0, y - top], stone,
      { ang: 0.04, len: 26, w: 5, density: 110, lf });
    c.strokeStyle = P.hsl(228, 14, 10, 0.45); c.lineWidth = 1.2;
    for (let row = 0; row * 22 < y - top; row++) {
      const ry = top + row * 22;
      c.beginPath(); c.moveTo(MX0, ry); c.lineTo(MX1, ry); c.stroke();
      for (let bx = MX0 + (row % 2) * 24; bx < MX1; bx += 48) { c.beginPath(); c.moveTo(bx, ry); c.lineTo(bx, ry + 22); c.stroke(); }
    }
    // rain streaks and a cold moonlit wash over the stone
    for (let i = 0; i < 70; i++) {
      const sx = MX0 + r() * (MX1 - MX0), sy = top + r() * (y - top) * 0.7, len = 30 + r() * 120;
      c.globalAlpha = 0.08 + r() * 0.1; c.strokeStyle = P.hsl(230, 20, 6); c.lineWidth = 2 + r() * 6;
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + (r() - 0.5) * 4, sy + len); c.stroke();
    }
    const wash = c.createLinearGradient(MX1, top, MX0, y);
    wash.addColorStop(0, 'rgba(150,170,230,0.16)'); wash.addColorStop(1, 'rgba(10,10,30,0.25)');
    c.globalAlpha = 1; c.fillStyle = wash; c.fillRect(MX0, top, MX1 - MX0, y - top);
    // central gable
    P.paintFill(c, r, cc => { cc.beginPath(); cc.moveTo(DOOR - 190, top + 4); cc.lineTo(DOOR, top - 120); cc.lineTo(DOOR + 190, top + 4); cc.closePath(); },
      [DOOR - 190, top - 122, 380, 128], [224, 12, 26], { ang: -0.3, len: 20, w: 4, lf });
    c.fillStyle = P.hsl(40, 30, 12); c.beginPath(); c.arc(DOOR, top - 36, 20, 0, P.TAU); c.fill();
    c.fillStyle = P.hsl(38, 70, 45, 0.6); c.beginPath(); c.arc(DOOR, top - 36, 15, 0, P.TAU); c.fill();
    // cornices
    for (const cy of [top, top + 190]) {
      P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(MX0 - 12, cy - 6, MX1 - MX0 + 24, 12); }, [MX0 - 12, cy - 6, MX1 - MX0 + 24, 12], [220, 12, 34], { ang: 0, len: 22, w: 2 });
    }
    // windows
    for (const w of WINDOWS) {
      const { x: wx, y: wy, on } = w;
      c.fillStyle = P.hsl(220, 14, 30); c.fillRect(wx - 6, wy - 6, 56, 104);
      if (on) {
        const g = c.createLinearGradient(0, wy, 0, wy + 92);
        g.addColorStop(0, P.hsl(40, 85, 58)); g.addColorStop(1, P.hsl(22, 75, 34));
        c.fillStyle = g;
      } else c.fillStyle = P.hsl(228, 30, 9);
      c.beginPath(); c.moveTo(wx, wy + 92); c.lineTo(wx, wy + 22); c.arc(wx + 22, wy + 22, 22, Math.PI, 0); c.lineTo(wx + 44, wy + 92); c.fill();
      c.strokeStyle = P.hsl(228, 20, 8); c.lineWidth = 3;
      c.beginPath(); c.moveTo(wx + 22, wy); c.lineTo(wx + 22, wy + 92); c.moveTo(wx, wy + 46); c.lineTo(wx + 44, wy + 46); c.stroke();
      if (on) { c.fillStyle = P.hsl(25, 60, 20, 0.8); c.fillRect(wx + 4, wy + 60, 14, 32); } // a curtain
    }
    // portico columns & door
    for (const px of [DOOR - 110, DOOR - 70, DOOR + 70, DOOR + 110]) {
      P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(px - 10, top + 196, 20, y - top - 196); }, [px - 10, top + 196, 20, y - top - 196], [216, 12, 40],
        { ang: 1.57, len: 20, w: 2, angJ: 0.05, lf: qx => (qx - px) * 1.6 });
    }
    P.paintFill(c, r, cc => {
      cc.beginPath(); cc.moveTo(DOOR - 42, y - 20); cc.lineTo(DOOR - 42, y - 120); cc.arc(DOOR, y - 120, 42, Math.PI, 0); cc.lineTo(DOOR + 42, y - 20); cc.closePath();
    }, [DOOR - 42, y - 164, 84, 146], [10, 30, 12], { ang: 1.57, len: 30, w: 3, density: 40, lf: px => (px - DOOR) * 0.08 });
    c.strokeStyle = P.hsl(10, 25, 6); c.lineWidth = 2;
    c.beginPath(); c.moveTo(DOOR, y - 160); c.lineTo(DOOR, y - 20); c.stroke();
    c.fillStyle = P.hsl(42, 50, 45); P.dab(c, DOOR - 8, y - 80, 3, 3, 0); P.dab(c, DOOR + 8, y - 80, 3, 3, 0);
    // steps
    for (let s = 0; s < 3; s++) {
      P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(DOOR - 90 - s * 16, y - 20 + s * 7, 180 + s * 32, 7); }, [DOOR - 90 - s * 16, y - 20 + s * 7, 180 + s * 32, 7], [220, 10, 34 - s * 3], { ang: 0, len: 16, w: 2 });
    }
    // ivy creeping up the west wing
    for (let i = 0; i < 26; i++) {
      const ix = MX0 + r() * 140, iy = y - Math.pow(r(), 0.7) * (y - top - 20);
      P.clump(c, r, ix, iy, 14 + r() * 16, [150, 24, 12], { a: 0.85, n: 12, hl: [185, 30, 36], hla: 0.35 });
    }
  });
  for (const sx of [DOOR - 60, DOOR + 60]) {
    add(L.ground, sx - 12, sx + 12, (c) => {
      const y = groundY(DOOR) - 120;
      c.fillStyle = P.hsl(228, 18, 8); c.fillRect(sx - 6, y - 10, 12, 22);
      c.fillStyle = P.hsl(40, 90, 64); P.dab(c, sx, y, 3, 6, 0);
    });
    LIGHTS.push({ x: sx, y: groundY(DOOR) - 120, r: 170, col: [255, 165, 85], flick: 1, pool: true });
  }
  SPOTS.push({ id: 'door', x: DOOR, y: 470 });

  // echoes: pale memories that linger where they happened
  for (const [id, x] of [['echo_willow', 1150], ['echo_gazebo', 2700], ['echo_steward', 3450], ['echo_heir', 4300]]) {
    SPOTS.push({ id, x, y: 520 });
  }

  // ---------------------------------------------------------------- chunk cache
  function paintChunk(layer, i, RS) {
    const s = layer.scale * RS;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(CH * s); cv.height = Math.ceil(H * s);
    const c = cv.getContext('2d');
    c.setTransform(s, 0, 0, s, -i * CH * s, 0);
    const x0 = i * CH, x1 = x0 + CH;
    if (layer.terrain) layer.terrain(c, x0, x1);
    for (const o of layer.objs) {
      if (o.x1 < x0 || o.x0 > x1) continue;
      c.save(); o.fn(c, P.rng(o.seed)); c.restore();
    }
    if (layer.front) layer.front(c, x0, x1);
    if (layer.fog) {
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-atop';
      const [r, g, b] = layer.fog, [a0, a1] = layer.fogA;
      const gr = c.createLinearGradient(0, 200, 0, H);
      gr.addColorStop(0, `rgba(${r},${g},${b},${a0})`);
      gr.addColorStop(1, `rgba(${r},${g},${b},${a1})`);
      c.fillStyle = gr;
      c.fillRect(x0 - 2, 0, CH + 4, H);
      c.globalCompositeOperation = 'source-over';
    }
    return cv;
  }

  function chunk(layer, i, RS) {
    let cv = layer.cache.get(i);
    if (!cv) { cv = paintChunk(layer, i, RS); layer.cache.set(i, cv); }
    return cv;
  }

  // Draw a layer at a camera offset; S is device pixels per logical pixel.
  function drawLayer(ctx, layer, cam, S, viewW, RS, camY = 0) {
    const lx = cam * layer.f, dy = Math.round(camY * layer.f * S);
    const i0 = Math.floor(lx / CH), i1 = Math.floor((lx + viewW) / CH);
    for (let i = i0; i <= i1; i++) {
      const cv = chunk(layer, i, RS);
      ctx.drawImage(cv, Math.floor((i * CH - lx) * S), dy, Math.ceil(CH * S) + 1, Math.ceil(H * S));
    }
    // keep just a chunk either side: prewarm paints one ahead, and phones are short on canvas memory
    for (const k of layer.cache.keys()) if (k < i0 - 1 || k > i1 + 1) layer.cache.delete(k);
  }

  // Paint at most one upcoming chunk per call, ahead of the camera.
  function prewarm(cam, viewW, dir, RS) {
    for (const layer of layers) {
      const lx = cam * layer.f;
      const i = dir >= 0 ? Math.floor((lx + viewW) / CH) + 1 : Math.floor(lx / CH) - 1;
      if (!layer.cache.has(i)) { chunk(layer, i, RS); return true; }
    }
    return false;
  }

  function reset() { for (const l of layers) l.cache.clear(); }

  return { H, WORLD_W, MAXVIEW, CH, layers, L, LIGHTS, SPOTS, PLATFORMS, LAMPS, PUDDLES, groundY, drawLayer, prewarm, reset, PATH_T, PATH_B, DOOR };
})();
