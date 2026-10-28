'use strict';
// The Hollow Reach: the country past the fair. A gate, a hall of mirrors, the
// cider orchard, the lake with its pier and boathouse, and the chapel on the hill.
// Everything is painted into the world's layer chunks; only the apples, the
// lake glints and the chapel's candle flicker are live.
const Beyond = (() => {
  const { groundY, addObject, atDepth } = World;
  const GATE_X = 8480, MIRRORS_X = 8830, PATCH_X = 9330, BOATHOUSE_X = 11900, CHAPEL_X = 13150, BELL_X = 13350, VISTA_X = 13640;
  const LAKE_X0 = 10700, LAKE_X1 = 12250;

  // Moon Apples for the scarecrow: [id, x, y]
  const APPLES = [
    { id: 'a1', x: 9440, y: 536 }, { id: 'a2', x: 9700, y: 470 }, { id: 'a3', x: 9990, y: 398 },
    { id: 'a4', x: 10260, y: 458 }, { id: 'a5', x: 10430, y: 356 }, { id: 'a6', x: 10140, y: 522 },
  ];
  // [from, to, count] patrols
  const SHADE_ZONES = [[9880, 10260, 2], [11050, 11540, 2], [12480, 12900, 2], [13330, 13560, 1]];
  // gas lamps double as lamplight waymarkers
  const LAMPS = [8560, 9250, 10650, 12100];
  const LAMP_NAMES = {
    1300: 'Graveyard Gate', 1990: 'Shed Lane', 2860: 'The Fountain Walk', 3560: 'Cellar Stair', 4150: 'Manor Steps',
    5340: 'The Fair Gate', 7800: 'The Carousel', 8560: 'Hollow Gate', 9250: 'Orchard Lane', 10650: 'Mirror Lake', 12100: 'Chapel Steps',
  };

  const sign = (c, r, x, y, w, text, size = 16) => {
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(x - w / 2, y - 18, w, 32); }, [x - w / 2, y - 18, w, 32], [25, 30, 12], { ang: 0.02, len: 24, w: 3, density: 60 });
    c.strokeStyle = P.hsl(40, 40, 32, 0.8); c.lineWidth = 2; c.strokeRect(x - w / 2 + 3, y - 15, w - 6, 26);
    c.font = `bold ${size}px Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = P.hsl(42, 45, 62, 0.88); c.fillText(text, x, y - 2);
    c.textBaseline = 'alphabetic';
  };
  const stone = [222, 10, 30];
  const plank = [26, 28, 14];

  // ---------------------------------------------------------------- the Hollow Gate
  addObject('ground', GATE_X - 140, GATE_X + 140, (c, r) => {
    const x = GATE_X, y = groundY(x) + 6;
    for (const d of [-1, 1]) {
      const px = x + d * 104;
      P.shadow(c, px, y + 2, 40, 6, 0.5);
      P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(px - 22, y - 210, 44, 210); }, [px - 22, y - 210, 44, 210], stone, { ang: 1.5, len: 10, w: 2.6, lf: qx => (qx - px) * 0.5 });
      P.paintFill(c, r, cc => { cc.beginPath(); cc.moveTo(px - 28, y - 210); cc.lineTo(px, y - 246); cc.lineTo(px + 28, y - 210); cc.closePath(); }, [px - 28, y - 246, 56, 36], stone, { ang: 0.4, len: 8, w: 2.2 });
      c.fillStyle = P.hsl(228, 18, 9); c.fillRect(px - 8, y - 252, 16, 8);
      c.fillStyle = P.hsl(38, 85, 60, 0.9); P.dab(c, px, y - 262, 5, 8, 0);
      P.clump(c, r, px - d * 10, y - 6, 24, [110, 24, 14], { a: 0.8, sq: 0.4, n: 12 });
    }
    // wrought-iron arch
    const pts = [];
    for (let t = 0; t <= 1; t += 0.05) pts.push([x - 104 + t * 208, y - 200 - Math.sin(t * Math.PI) * 90]);
    P.brush(c, r, pts, 4, [228, 18, 8], 1, { k: 3, rim: [208, 38, 60], rimA: 0.3 });
    for (let t = 0.1; t < 1; t += 0.1) P.brush(c, r, [[x - 104 + t * 208, y - 200 - Math.sin(t * Math.PI) * 90], [x - 104 + t * 208, y - 170]], 2, [228, 18, 8], 0.9, { k: 2 });
    sign(c, r, x, y - 262, 190, 'THE HOLLOW REACH', 15);
    // a half-open gate that has not moved in years
    P.brush(c, r, [[x - 100, y], [x - 100, y - 130]], 3, [228, 18, 8], 1, { k: 2 });
    for (let k = 0; k < 4; k++) P.brush(c, r, [[x - 100 + k * 9, y - 6], [x - 100 + k * 9, y - 124]], 1.8, [228, 18, 8], 0.9, { k: 2 });
  });
  for (const lx of LAMPS) World.addLamp(lx);

  // ---------------------------------------------------------------- the Hall of Mirrors
  addObject('ground', MIRRORS_X - 200, MIRRORS_X + 200, (c, r) => {
    const x = MIRRORS_X, y = groundY(x) + 8, w = 330, h = 290, top = y - h;
    P.shadow(c, x, y + 2, w * 0.7, 12, 0.55);
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(x - w / 2, top, w, h); }, [x - w / 2, top, w, h], [275, 22, 15],
      { ang: 1.57, len: 28, w: 4, angJ: 0.05, density: 70, lf: px => (px - x) * 0.04 });
    // a cornice and a striped pediment
    P.paintFill(c, r, cc => { cc.beginPath(); cc.moveTo(x - w / 2 - 12, top); cc.lineTo(x, top - 70); cc.lineTo(x + w / 2 + 12, top); cc.closePath(); }, [x - w / 2 - 12, top - 70, w + 24, 70], [355, 35, 24], { ang: 0.4, len: 14, w: 3 });
    for (let i = 0; i < 6; i++) { c.fillStyle = P.hsl(45, 40, 55, 0.35); c.beginPath(); c.moveTo(x, top - 70); c.lineTo(x - w / 2 - 12 + i * ((w + 24) / 6), top); c.lineTo(x - w / 2 - 12 + i * ((w + 24) / 6) + 16, top); c.fill(); }
    // warped mirror panels
    for (let i = 0; i < 5; i++) {
      const mx = x - w / 2 + 22 + i * 62, my = top + 52, mw = 50, mh = 150;
      const g = c.createLinearGradient(mx, my, mx + mw, my + mh);
      g.addColorStop(0, '#9fb1cc'); g.addColorStop(0.5, '#47587a'); g.addColorStop(1, '#1b2338');
      c.fillStyle = g; c.beginPath(); c.roundRect ? c.roundRect(mx, my, mw, mh, 22) : c.rect(mx, my, mw, mh); c.fill();
      c.strokeStyle = P.hsl(44, 55, 42); c.lineWidth = 4; c.stroke();
      c.strokeStyle = 'rgba(230,240,255,0.5)'; c.lineWidth = 2; c.beginPath();
      for (let t = 0; t <= 1; t += 0.08) { const yy = my + 14 + t * (mh - 28), xx = mx + mw / 2 + Math.sin(t * 6 + i * 1.7) * (8 + i * 2) * (i % 2 ? 1 : -1); t ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }
      c.stroke();
      // a crack
      if (i === 1 || i === 3) { c.strokeStyle = 'rgba(8,8,14,0.7)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(mx + 6, my + 20); c.lineTo(mx + 28, my + 70); c.lineTo(mx + 16, my + 120); c.stroke(); }
    }
    // the entrance: a mouth-shaped arch
    c.fillStyle = '#05050b'; c.beginPath(); c.moveTo(x - 46, y); c.lineTo(x - 46, y - 90); c.quadraticCurveTo(x, y - 150, x + 46, y - 90); c.lineTo(x + 46, y); c.fill();
    for (let i = 0; i < 7; i++) { c.fillStyle = P.hsl(45, 25, 70, 0.85); c.beginPath(); c.moveTo(x - 42 + i * 14, y - 98 + Math.abs(i - 3) * 4); c.lineTo(x - 35 + i * 14, y - 80); c.lineTo(x - 28 + i * 14, y - 98 + Math.abs(i - 3) * 4); c.fill(); }
    sign(c, r, x, top - 22, 250, 'HALL OF MIRRORS', 19);
    for (let i = 0; i < 15; i++) { c.fillStyle = P.hsl(46, 70, 70, 0.9); P.dab(c, x - 150 + i * 21.4, top + 14 + Math.sin(i * 0.9) * 2, 2.6, 2.6, 0); }
  });
  World.LIGHTS.push({ x: MIRRORS_X, y: groundY(MIRRORS_X) - 120, r: 230, col: [170, 200, 255], flick: 0.5, cool: true, pool: true });

  // ---------------------------------------------------------------- the cider orchard
  const appleTree = (c, r, x, y, ht) => {
    const ends = P.tree(c, r, x, y, ht, { type: 'oak', bark: [22, 22, 12], rim: [210, 34, 46], leaf: [95, 24, 15], leafHl: [150, 30, 40], depth: 5 });
    for (const [ex, ey] of ends) {
      if (r() < 0.55) { c.fillStyle = P.hsl(200, 20, 66, 0.9); P.dab(c, ex + (r() - 0.5) * 16, ey + 10 + r() * 14, 3.2, 3.2, 0); }
    }
  };
  for (const [tx, ht] of [[9395, 330], [9620, 360], [9840, 340], [10190, 350], [10330, 330], [10560, 360]]) {
    addObject('ground', tx - ht * 0.6, tx + ht * 0.6, (c, r) => appleTree(c, r, tx, groundY(tx) + 6, ht));
  }
  for (let tx = 9150; tx < 10700; tx += 150 + ((tx * 7) % 70)) {
    const mx = atDepth(tx, 0.66), nx = atDepth(tx + 60, 0.84), ht = 250 + ((tx * 13) % 80);
    addObject('mid', mx - ht * 0.5, mx + ht * 0.5, (c, r) => appleTree(c, r, mx, World.ground.mid(mx) + 6, ht));
    addObject('near', nx - 90, nx + 90, (c, r) => appleTree(c, r, nx, World.ground.near(nx) + 6, 190));
  }

  // crates, a hay wagon, a well and the cider press: the orchard's climbing course
  World.PLATFORMS.push(
    { x0: 9660, x1: 9740, y: 552 },
    { x0: 9900, x1: 10080, y: 536 }, { x0: 9950, x1: 10030, y: 476 },
    { x0: 10225, x1: 10295, y: 548 },
    { x0: 10380, x1: 10480, y: 520 }, { x0: 10400, x1: 10460, y: 440 },
  );
  addObject('ground', 9620, 9780, (c, r) => {
    const x = 9700, y = groundY(x) + 6;
    P.shadow(c, x, y, 70, 6, 0.5);
    for (const [bx, by, bw] of [[x - 22, y, 44], [x + 22, y, 44], [x, y - 44, 44]]) {
      P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(bx - bw / 2, by - 48, bw, 48); }, [bx - bw / 2, by - 48, bw, 48], [26, 30, 16], { ang: 0.05, len: 16, w: 3, density: 50 });
      c.strokeStyle = 'rgba(8,5,4,0.7)'; c.lineWidth = 2; c.strokeRect(bx - bw / 2, by - 48, bw, 48);
      c.beginPath(); c.moveTo(bx - bw / 2, by - 48); c.lineTo(bx + bw / 2, by); c.stroke();
    }
  });
  addObject('ground', 9860, 10130, (c, r) => {
    const x = 9990, y = groundY(x) + 6;
    P.shadow(c, x, y, 120, 8, 0.5);
    for (const wx of [x - 62, x + 62]) {
      c.strokeStyle = P.hsl(25, 30, 14); c.lineWidth = 7; c.beginPath(); c.arc(wx, y - 30, 30, 0, P.TAU); c.stroke();
      c.lineWidth = 2.4; for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; c.beginPath(); c.moveTo(wx - Math.cos(a) * 30, y - 30 - Math.sin(a) * 30); c.lineTo(wx + Math.cos(a) * 30, y - 30 + Math.sin(a) * 30); c.stroke(); }
    }
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(x - 90, y - 70, 180, 34); }, [x - 90, y - 70, 180, 34], plank, { ang: 0.02, len: 22, w: 3, density: 50 });
    P.clump(c, r, x, y - 90, 70, [44, 62, 36], { a: 0.9, sq: 0.55, n: 60, hl: [48, 70, 56], hla: 0.4 });
    P.clump(c, r, x, y - 120, 44, [46, 64, 40], { a: 0.9, sq: 0.6, n: 36, hl: [50, 72, 60], hla: 0.4 });
    P.brush(c, r, [[x + 90, y - 56], [x + 150, y - 40]], 6, [25, 30, 14], 1, { k: 2 });
  });
  addObject('ground', 10190, 10330, (c, r) => {
    const x = 10260, y = groundY(x) + 6;
    P.shadow(c, x, y, 50, 6, 0.5);
    P.paintFill(c, r, cc => { cc.beginPath(); cc.moveTo(x - 36, y); cc.lineTo(x - 36, y - 56); cc.ellipse(x, y - 56, 36, 10, 0, Math.PI, 0); cc.lineTo(x + 36, y); cc.closePath(); }, [x - 36, y - 66, 72, 66], stone,
      { ang: 0, len: 10, w: 3, lf: px => (px - x) * 0.4 });
    c.fillStyle = '#05060c'; c.beginPath(); c.ellipse(x, y - 56, 28, 7, 0, 0, P.TAU); c.fill();
    P.brush(c, r, [[x - 34, y - 56], [x - 34, y - 150]], 4, [25, 30, 14], 1, { k: 2 });
    P.brush(c, r, [[x + 34, y - 56], [x + 34, y - 150]], 4, [25, 30, 14], 1, { k: 2 });
    c.fillStyle = P.hsl(25, 24, 16); c.beginPath(); c.moveTo(x - 50, y - 150); c.lineTo(x, y - 184); c.lineTo(x + 50, y - 150); c.fill();
    c.strokeStyle = '#2a2a2a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y - 160); c.lineTo(x, y - 90); c.stroke();
    c.fillStyle = P.hsl(30, 20, 18); c.fillRect(x - 6, y - 92, 12, 12);
  });
  addObject('ground', 10320, 10560, (c, r) => { // the cider press
    const x = 10430, y = groundY(x) + 6;
    P.shadow(c, x, y, 100, 8, 0.5);
    const post = (px, y0, y1) => P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(px - 6, y1, 12, y0 - y1); }, [px - 6, y1, 12, y0 - y1], [25, 30, 14], { ang: 1.57, len: 14, w: 2.4, lf: q => (q - px) * 0.8 });
    post(x - 56, y, y - 190); post(x + 56, y, y - 190);
    post(x - 24, y - 84, y - 200); post(x + 24, y - 84, y - 200);
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(x - 64, y - 84, 128, 14); }, [x - 64, y - 84, 128, 14], plank, { ang: 0, len: 22, w: 3 });
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(x - 36, y - 166, 72, 12); }, [x - 36, y - 166, 72, 12], plank, { ang: 0, len: 22, w: 3 });
    P.brush(c, r, [[x - 56, y - 190], [x + 56, y - 190]], 12, [25, 30, 14], 1, { k: 3 });
    P.brush(c, r, [[x, y - 190], [x, y - 120]], 9, [25, 20, 20], 1, { k: 2 });
    P.brush(c, r, [[x - 50, y - 204], [x + 50, y - 204]], 6, [25, 24, 18], 1, { k: 2 });
    for (const bx of [x - 100, x + 100]) { // barrels
      P.paintFill(c, r, cc => { cc.beginPath(); cc.ellipse(bx, y - 24, 22, 28, 0, 0, P.TAU); }, [bx - 22, y - 52, 44, 56], [24, 34, 14], { ang: 1.57, len: 12, w: 2.4, lf: q => (q - bx) * 0.5 });
      c.strokeStyle = P.hsl(220, 10, 30); c.lineWidth = 2.4; for (const dy of [-10, 8]) { c.beginPath(); c.ellipse(bx, y - 24 + dy, 22, 6, 0, 0, Math.PI); c.stroke(); }
    }
  });
  // Old Patch, the scarecrow
  addObject('ground', PATCH_X - 90, PATCH_X + 90, (c, r) => {
    const x = PATCH_X, y = groundY(x) + 8;
    P.shadow(c, x, y + 2, 34, 5, 0.5);
    P.brush(c, r, [[x, y], [x, y - 210]], 8, [25, 30, 14], 1, { k: 3, rim: [205, 34, 62], rimA: 0.25 });
    P.brush(c, r, [[x - 78, y - 150], [x + 78, y - 148]], 7, [25, 30, 14], 1, { k: 3 });
    // ragged coat and sleeves with straw cuffs
    P.paintFill(c, r, cc => { cc.beginPath(); cc.moveTo(x - 30, y - 168); cc.lineTo(x + 30, y - 168); cc.lineTo(x + 26, y - 78); cc.lineTo(x + 12, y - 70); cc.lineTo(x, y - 82); cc.lineTo(x - 14, y - 68); cc.lineTo(x - 28, y - 80); cc.closePath(); }, [x - 30, y - 168, 60, 100], [212, 20, 18], { ang: 1.4, len: 14, w: 3, density: 40 });
    for (const d of [-1, 1]) {
      P.paintFill(c, r, cc => { cc.beginPath(); cc.moveTo(x + d * 28, y - 166); cc.lineTo(x + d * 76, y - 160); cc.lineTo(x + d * 74, y - 138); cc.lineTo(x + d * 28, y - 144); cc.closePath(); }, [x + d * 26, y - 166, 52, 28], [212, 20, 18], { ang: 0.1, len: 12, w: 3 });
      for (let i = 0; i < 7; i++) { c.strokeStyle = P.hsl(46, 60, 52); c.lineWidth = 1.4; c.beginPath(); c.moveTo(x + d * 74, y - 150); c.lineTo(x + d * (82 + r() * 14), y - 156 + r() * 20); c.stroke(); }
    }
    c.fillStyle = P.hsl(38, 24, 46); P.dab(c, x, y - 190, 20, 24, 0);
    c.fillStyle = '#0a0806'; P.dab(c, x - 7, y - 194, 3.4, 3.8, 0); P.dab(c, x + 7, y - 194, 3.4, 3.8, 0);
    c.strokeStyle = '#0a0806'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - 9, y - 180); c.quadraticCurveTo(x, y - 172, x + 9, y - 180); for (let i = -2; i <= 2; i++) { c.moveTo(x + i * 4, y - 181); c.lineTo(x + i * 4, y - 175); } c.stroke();
    c.fillStyle = P.hsl(25, 28, 14); c.beginPath(); c.moveTo(x - 36, y - 206); c.lineTo(x + 36, y - 206); c.lineTo(x + 20, y - 210); c.lineTo(x + 18, y - 242); c.lineTo(x - 18, y - 242); c.lineTo(x - 20, y - 210); c.fill();
    c.fillStyle = P.hsl(350, 40, 28); c.fillRect(x - 19, y - 218, 38, 6);
    for (let i = 0; i < 12; i++) { c.strokeStyle = P.hsl(46, 60, 50); c.lineWidth = 1.4; c.beginPath(); c.moveTo(x - 18 + r() * 36, y - 206); c.lineTo(x - 28 + r() * 56, y - 198 + r() * 14); c.stroke(); }
    // a crow on one arm
    c.fillStyle = '#07070d'; P.dab(c, x + 60, y - 170, 9, 6, 0.3); P.dab(c, x + 69, y - 175, 5, 4, 0);
    c.beginPath(); c.moveTo(x + 73, y - 175); c.lineTo(x + 81, y - 173); c.lineTo(x + 73, y - 172); c.fill();
  });
  World.LIGHTS.push({ x: PATCH_X + 40, y: groundY(PATCH_X) - 120, r: 140, col: [255, 160, 90], flick: 0.8, pool: false });
  addObject('ground', 9150, 10650, (c, r) => { // a split-rail fence and hay bales along the lane
    for (let x = 9170; x < 10640; x += 118 + ((x * 3) % 60)) {
      if (x > 9640 && x < 10120) continue;
      const y = groundY(x) + 10;
      P.brush(c, r, [[x, y], [x, y - 40]], 3, [25, 28, 14], 0.95, { k: 2 });
      P.brush(c, r, [[x - 54, y - 14], [x + 56, y - 18]], 2.8, [25, 28, 16], 0.95, { k: 2 });
      P.brush(c, r, [[x - 54, y - 32], [x + 56, y - 34]], 2.8, [25, 28, 16], 0.95, { k: 2 });
    }
  });

  // ---------------------------------------------------------------- the mirror lake
  const lakeShape = (c, x0, x1, top, bot) => {
    c.beginPath(); c.moveTo(x0, bot);
    c.quadraticCurveTo(x0 - 40, (top + bot) / 2, x0 + 120, top + 10);
    c.lineTo(x1 - 120, top + 4);
    c.quadraticCurveTo(x1 + 50, (top + bot) / 2, x1, bot);
    c.closePath();
  };
  const lx0 = atDepth(LAKE_X0, 0.84), lx1 = atDepth(LAKE_X1, 0.84);
  addObject('near', lx0 - 80, lx1 + 80, (c, r) => {
    const top = 512, bot = 612;
    c.save(); lakeShape(c, lx0, lx1, top, bot);
    const g = c.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, '#2c3a62'); g.addColorStop(0.5, '#141c38'); g.addColorStop(1, '#0a0f22');
    c.fillStyle = g; c.fill(); c.clip();
    c.lineCap = 'round';
    for (let i = 0; i < 260; i++) { // painted ripples
      const x = lx0 + r() * (lx1 - lx0), y = top + 6 + Math.pow(r(), 1.2) * (bot - top - 8), len = 12 + r() * 40;
      c.globalAlpha = 0.1 + r() * 0.3; c.strokeStyle = P.hsl(218 + r() * 12, 30, 28 + r() * 30); c.lineWidth = 1 + r() * 2;
      c.beginPath(); c.moveTo(x - len / 2, y); c.lineTo(x + len / 2, y + (r() - 0.5) * 1.5); c.stroke();
    }
    // a pale column where the moon lies on the water
    const mx = lx0 + (lx1 - lx0) * 0.72;
    for (let y = top + 6; y < bot; y += 4) { c.globalAlpha = 0.22; c.fillStyle = P.hsl(212, 30, 74); c.fillRect(mx - 26 - (y - top) * 0.1 + Math.sin(y * 0.6) * 10, y, 30 + (y - top) * 0.3 + Math.sin(y) * 8, 1.6); }
    c.restore(); c.globalAlpha = 1;
    // reeds and the far shore's dark treeline
    c.strokeStyle = P.hsl(215, 18, 10); c.lineWidth = 1.8;
    for (let i = 0; i < 80; i++) {
      const x = lx0 + 40 + r() * (lx1 - lx0 - 80), y = top + 8 + r() * 6, h = 20 + r() * 26;
      c.beginPath(); c.moveTo(x, y + 14); c.quadraticCurveTo(x + (r() - 0.5) * 8, y, x + (r() - 0.5) * 10, y - h); c.stroke();
    }
    // the rowboat drifting in the shallows
    const bx = lx0 + (lx1 - lx0) * 0.36, by = top + 44;
    c.fillStyle = P.hsl(25, 28, 14); c.beginPath(); c.moveTo(bx - 56, by - 14); c.quadraticCurveTo(bx - 30, by + 8, bx, by + 8); c.quadraticCurveTo(bx + 34, by + 8, bx + 62, by - 18); c.lineTo(bx + 46, by - 14); c.lineTo(bx - 42, by - 12); c.fill();
    c.strokeStyle = P.hsl(25, 30, 20); c.lineWidth = 3; c.beginPath(); c.moveTo(bx - 20, by - 12); c.lineTo(bx + 24, by - 36); c.stroke();
  });
  // the pier and boathouse
  addObject('ground', 10960, 12080, (c, r) => {
    const y0 = groundY(11400) + 8;
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(11000, y0 - 2, 960, 24); }, [11000, y0 - 2, 960, 24], plank, { ang: 0.02, len: 28, w: 3, density: 50 });
    c.strokeStyle = 'rgba(6,4,3,0.7)'; c.lineWidth = 1.6;
    for (let px = 11000; px < 11960; px += 22) { c.beginPath(); c.moveTo(px, y0 - 2); c.lineTo(px, y0 + 22); c.stroke(); }
    for (let px = 11010; px < 11960; px += 120) {
      P.brush(c, r, [[px, y0 - 2], [px, y0 - 54]], 6, [25, 28, 12], 1, { k: 2, rim: [205, 34, 62], rimA: 0.25 });
      P.brush(c, r, [[px, y0 + 20], [px, y0 + 52]], 6, [25, 24, 10], 0.9, { k: 2 });
    }
    P.brush(c, r, [[11010, y0 - 40], [11960, y0 - 40]], 3, [25, 28, 14], 1, { k: 2 });
    P.brush(c, r, [[11010, y0 - 26], [11960, y0 - 26]], 2.4, [25, 28, 14], 0.9, { k: 2 });
  });
  addObject('ground', BOATHOUSE_X - 190, BOATHOUSE_X + 190, (c, r) => {
    const x = BOATHOUSE_X, y = groundY(x) + 10, w = 230, h = 176;
    P.shadow(c, x, y + 2, w * 0.7, 10, 0.55);
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(x - w / 2, y - h, w, h); }, [x - w / 2, y - h, w, h], [28, 20, 15], { ang: 1.57, len: 28, w: 4, angJ: 0.05, density: 80, lf: px => (px - x) * 0.03 });
    c.strokeStyle = 'rgba(6,4,3,0.55)'; c.lineWidth = 1.6; for (let px = x - w / 2 + 14; px < x + w / 2; px += 14) { c.beginPath(); c.moveTo(px, y - h); c.lineTo(px, y); c.stroke(); }
    P.paintFill(c, r, cc => { cc.beginPath(); cc.moveTo(x - w / 2 - 20, y - h + 4); cc.lineTo(x, y - h - 74); cc.lineTo(x + w / 2 + 20, y - h + 4); cc.closePath(); }, [x - w / 2 - 20, y - h - 74, w + 40, 80], [222, 14, 16], { ang: 0.4, len: 16, w: 3.4, lf: px => (px - x) * 0.04 });
    // double doors, a skylight and the painter's card
    c.fillStyle = '#05050a'; c.fillRect(x - 40, y - 118, 80, 118);
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(x - 36, y - 114, 72, 114); }, [x - 36, y - 114, 72, 114], [24, 28, 11], { ang: 1.57, len: 20, w: 3, density: 40 });
    c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - 114); c.lineTo(x, y); c.stroke();
    c.fillStyle = P.hsl(44, 60, 46); P.dab(c, x - 8, y - 54, 2.6, 2.6, 0); P.dab(c, x + 8, y - 54, 2.6, 2.6, 0);
    c.fillStyle = P.hsl(40, 30, 70, 0.9); c.fillRect(x - 74, y - 100, 28, 20);
    c.fillStyle = 'rgba(30,20,10,0.7)'; c.fillRect(x - 70, y - 96, 20, 2); c.fillRect(x - 70, y - 90, 16, 2);
    c.fillStyle = P.hsl(40, 90, 66, 0.55); c.fillRect(x + 56, y - 126, 30, 40); c.strokeStyle = '#080605'; c.lineWidth = 3; c.strokeRect(x + 56, y - 126, 30, 40);
    sign(c, r, x, y - h - 26, 176, 'R. HALE · PORTRAITS', 13);
    P.brush(c, r, [[x + 120, y - 8], [x + 168, y - 46]], 4, [25, 28, 12], 1, { k: 2 });
  });
  World.LIGHTS.push({ x: BOATHOUSE_X + 70, y: groundY(BOATHOUSE_X) - 100, r: 190, col: [255, 190, 110], flick: 0.7, pool: true });

  // ---------------------------------------------------------------- the chapel on the hill
  // hill steps behind the chapel, painted into the mid layer so it climbs away from the path
  const cmx = atDepth(CHAPEL_X, 0.66);
  addObject('mid', cmx - 420, cmx + 420, (c, r) => {
    const base = World.ground.mid(cmx);
    c.save();
    c.beginPath(); c.moveTo(cmx - 420, base + 30);
    c.quadraticCurveTo(cmx - 200, base - 120, cmx, base - 150); c.quadraticCurveTo(cmx + 200, base - 120, cmx + 420, base + 30); c.closePath();
    c.fillStyle = P.hsl(212, 22, 12); c.fill(); c.clip();
    for (let i = 0; i < 160; i++) { c.globalAlpha = 0.3; c.strokeStyle = P.hsl(200 + r() * 20, 20, 10 + r() * 12); c.lineWidth = 2 + r() * 4; const x = cmx - 420 + r() * 840, y = base - 150 + r() * 180; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 20 + r() * 18, y + (r() - 0.5) * 3); c.stroke(); }
    c.restore(); c.globalAlpha = 1;
  });
  addObject('ground', CHAPEL_X - 330, CHAPEL_X + 330, (c, r) => {
    const x = CHAPEL_X, y = groundY(x) + 8;
    P.shadow(c, x, y + 2, 260, 12, 0.6);
    const lf = px => (px - x) * 0.03;
    // nave
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(x - 150, y - 210, 300, 210); }, [x - 150, y - 210, 300, 210], stone, { ang: 1.5, len: 12, w: 3.2, density: 90, lf });
    c.strokeStyle = 'rgba(6,6,14,0.35)'; c.lineWidth = 1.4;
    for (let yy = y - 200; yy < y; yy += 22) { c.beginPath(); c.moveTo(x - 150, yy); c.lineTo(x + 150, yy); c.stroke(); }
    // roof
    P.paintFill(c, r, cc => { cc.beginPath(); cc.moveTo(x - 168, y - 206); cc.lineTo(x - 20, y - 300); cc.lineTo(x + 20, y - 300); cc.lineTo(x + 168, y - 206); cc.closePath(); }, [x - 168, y - 300, 336, 94], [224, 14, 17], { ang: 0.5, len: 14, w: 3, lf });
    // tower and belfry
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(x - 150, y - 400, 100, 400); }, [x - 150, y - 400, 100, 400], stone, { ang: 1.5, len: 12, w: 3.2, density: 90, lf: px => (px - x + 100) * 0.04 });
    P.paintFill(c, r, cc => { cc.beginPath(); cc.moveTo(x - 160, y - 400); cc.lineTo(x - 100, y - 500); cc.lineTo(x - 40, y - 400); cc.closePath(); }, [x - 160, y - 500, 120, 100], [224, 14, 15], { ang: 0.9, len: 12, w: 3 });
    c.fillStyle = '#05060c'; c.beginPath(); c.moveTo(x - 124, y - 400); c.lineTo(x - 124, y - 446); c.arc(x - 100, y - 446, 24, Math.PI, 0); c.lineTo(x - 76, y - 400); c.fill();
    c.fillStyle = P.hsl(32, 60, 34); c.beginPath(); c.arc(x - 100, y - 430, 11, 0, P.TAU); c.fill(); c.fillRect(x - 112, y - 432, 24, 4);
    // rose window and pointed windows with a faint cold light
    c.fillStyle = '#10182c'; c.beginPath(); c.arc(x + 40, y - 150, 30, 0, P.TAU); c.fill();
    c.strokeStyle = P.hsl(220, 12, 24); c.lineWidth = 2.4; c.beginPath(); c.arc(x + 40, y - 150, 30, 0, P.TAU); c.stroke();
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; c.beginPath(); c.moveTo(x + 40, y - 150); c.lineTo(x + 40 + Math.cos(a) * 30, y - 150 + Math.sin(a) * 30); c.stroke(); }
    for (const wx of [x + 100, x - 4]) {
      c.fillStyle = '#10182c'; c.beginPath(); c.moveTo(wx - 12, y - 56); c.lineTo(wx - 12, y - 96); c.quadraticCurveTo(wx, y - 126, wx + 12, y - 96); c.lineTo(wx + 12, y - 56); c.fill();
      c.strokeStyle = P.hsl(220, 12, 24); c.lineWidth = 2; c.stroke();
    }
    // doorway
    c.fillStyle = '#05050b'; c.beginPath(); c.moveTo(x - 36, y); c.lineTo(x - 36, y - 90); c.quadraticCurveTo(x + 4, y - 150, x + 44, y - 90); c.lineTo(x + 44, y); c.fill();
    c.strokeStyle = P.hsl(222, 10, 26); c.lineWidth = 5; c.beginPath(); c.moveTo(x - 36, y); c.lineTo(x - 36, y - 90); c.quadraticCurveTo(x + 4, y - 150, x + 44, y - 90); c.lineTo(x + 44, y); c.stroke();
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(x - 28, y - 86, 64, 86); }, [x - 28, y - 86, 64, 86], [22, 26, 9], { ang: 1.57, len: 18, w: 3, density: 40 });
    c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 4, y - 86); c.lineTo(x + 4, y); c.stroke();
    c.fillStyle = P.hsl(44, 55, 46); P.dab(c, x - 4, y - 40, 2.6, 2.6, 0); P.dab(c, x + 12, y - 40, 2.6, 2.6, 0);
    for (let s = 0; s < 3; s++) P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(x - 56 - s * 8, y - 8 + s * 4 + 4, 120 + s * 16, 5); }, [x - 70, y - 4 + s * 4, 140, 6], [222, 10, 34 - s * 3], { ang: 0, len: 16, w: 2 });
    // ivy on the tower
    P.clump(c, r, x - 140, y - 160, 34, [110, 26, 14], { a: 0.8, sq: 2.2, n: 40, hl: [140, 34, 34], hla: 0.4 });
    c.save(); c.translate(x + 120, y - 320); c.fillStyle = P.hsl(222, 12, 40); c.fillRect(-2, -4, 4, 40); c.fillRect(-12, 6, 24, 4); c.restore();
  });
  World.LIGHTS.push({ x: CHAPEL_X + 4, y: groundY(CHAPEL_X) - 60, r: 210, col: [160, 200, 255], flick: 0.9, cool: true, pool: false });
  World.LIGHTS.push({ x: CHAPEL_X + 100, y: groundY(CHAPEL_X) - 80, r: 120, col: [160, 200, 255], flick: 0.9, cool: true, pool: false });
  // the bell frame beside the chapel
  addObject('ground', BELL_X - 70, BELL_X + 70, (c, r) => {
    const x = BELL_X, y = groundY(x) + 8;
    P.shadow(c, x, y + 2, 50, 6, 0.5);
    for (const d of [-1, 1]) P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(x + d * 48 - 7, y - 220, 14, 220); }, [x + d * 48 - 7, y - 220, 14, 220], stone, { ang: 1.5, len: 10, w: 2.4, lf: px => (px - x) * 0.3 });
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(x - 60, y - 232, 120, 16); }, [x - 60, y - 232, 120, 16], stone, { ang: 0, len: 16, w: 2.6 });
    c.fillStyle = P.hsl(32, 64, 32);
    c.beginPath(); c.moveTo(x - 30, y - 150); c.quadraticCurveTo(x - 32, y - 190, x - 14, y - 214); c.lineTo(x + 14, y - 214); c.quadraticCurveTo(x + 32, y - 190, x + 30, y - 150); c.closePath(); c.fill();
    c.fillStyle = P.hsl(40, 70, 62, 0.4); c.fillRect(x - 10, y - 206, 4, 50);
    c.strokeStyle = P.hsl(30, 20, 24); c.lineWidth = 3; c.beginPath(); c.moveTo(x, y - 150); c.lineTo(x, y - 30); c.stroke();
    c.fillStyle = P.hsl(30, 30, 30); P.dab(c, x, y - 30, 5, 7, 0);
  });
  // the churchyard, with the Vanes' own plot
  addObject('ground', 12400, 13040, (c, r) => {
    const { headstone, ironFence } = World.props;
    for (let hx = 12470; hx < 13030; hx += 70 + ((hx * 11) % 38)) headstone(c, r, hx, groundY(hx) + 8, 26 + (hx % 9), 46 + (hx % 30), hx % 3 ? 'round' : 'cross', ((hx % 7) - 3) * 0.04);
    ironFence(c, r, 12400, 120, groundY);
  });
  addObject('ground', 13440, 13800, (c, r) => { // the lookout: a bench, a low wall and the view
    const x = VISTA_X, y = groundY(x) + 8;
    P.shadow(c, x, y + 2, 90, 8, 0.5);
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(x - 70, y - 46, 140, 12); }, [x - 70, y - 46, 140, 12], plank, { ang: 0, len: 20, w: 3 });
    for (const d of [-1, 1]) P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(x + d * 56 - 5, y - 36, 10, 36); }, [x + d * 56 - 5, y - 36, 10, 36], stone, { ang: 1.5, len: 8, w: 2 });
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(x - 70, y - 78, 140, 8); }, [x - 70, y - 78, 140, 8], plank, { ang: 0, len: 20, w: 3 });
    for (let wx = 13440; wx < 13800; wx += 30) P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(wx, y - 30, 28, 34); }, [wx, y - 30, 28, 34], [222, 10, 24 + (wx % 3) * 3], { ang: 0.3, len: 8, w: 2.2 });
  });

  World.SPOTS.push(
    { id: 'mirrors', x: MIRRORS_X, y: 440 },
    { id: 'patch', x: PATCH_X, y: 430 },
    { id: 'boathouse', x: BOATHOUSE_X, y: 450 },
    { id: 'chapel', x: CHAPEL_X + 4, y: 450 },
    { id: 'bell', x: BELL_X, y: 430 },
    { id: 'vista', x: VISTA_X, y: 480 },
  );

  // ---------------------------------------------------------------- live drawing
  // v: { ctx, S, cam, camY, viewW, t }
  // glints moving over the lake, in the near layer's parallax
  function drawLake(v) {
    const { ctx, S } = v;
    const f = 0.84, ox = lx0 - v.cam * f, ox1 = lx1 - v.cam * f;
    if (ox1 < 0 || ox > v.viewW) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const dy = v.camY * f;
    for (let i = 0; i < 46; i++) {
      const sp = 0.25 + (i % 7) * 0.05, px = ox + ((i * 97.3 + v.t * 6 * sp) % (ox1 - ox)), py = 524 + ((i * 53) % 78) + Math.sin(v.t * sp * 2 + i) * 1.5 + dy;
      if (px < -20 || px > v.viewW + 20) continue;
      ctx.globalAlpha = 0.07 + 0.1 * (0.5 + 0.5 * Math.sin(v.t * (1.1 + sp) + i * 2.2));
      ctx.fillStyle = '#a9c4ff';
      ctx.fillRect(px * S, py * S, (10 + (i % 5) * 4) * S, 1.5 * S);
    }
    ctx.restore();
  }

  return {
    GATE_X, MIRRORS_X, PATCH_X, BOATHOUSE_X, CHAPEL_X, BELL_X, VISTA_X, APPLES, SHADE_ZONES, LAMPS, LAMP_NAMES,
    drawBack: drawLake,
  };
})();
