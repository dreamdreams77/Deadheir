'use strict';
// The inside of Vanehold: a two-storey side-scrolling house. Rooms are painted
// once, on first entry, into 500px canvas strips; candle light, moonbeams, the
// ghost and the spirits are drawn live over them by game.js.
const Mansion = (() => {
  const H = 720;
  const W = 5000;
  const FLOOR = 620;      // ground-floor standing line
  const UP = 300;         // upper-floor standing line
  const CHW = 500, SC = 1.25;
  const STAIR_X = 650, STEP_W = 42, STEPS = 5, STEP_H = 64;
  const UP_X0 = STAIR_X + STEPS * STEP_W;          // where the upper floor begins
  const STUDY_DOOR = 2940;                         // the ground-floor study door

  // ---------------------------------------------------------------- layout
  // floor 0 = ground, 1 = upper. Rooms are painted and named from this table.
  const ROOMS = [
    { id: 'hall', name: 'The Great Hall', x0: 0, x1: UP_X0, fl: 0, top: 24, wall: [18, 24, 15], wain: [22, 28, 10], tall: true },
    { id: 'dining', name: 'The Dining Hall', x0: UP_X0, x1: 2000, fl: 0, top: UP + 36, wall: [350, 30, 14], wain: [20, 26, 9] },
    { id: 'library', name: 'The Library', x0: 2000, x1: STUDY_DOOR, fl: 0, top: UP + 36, wall: [150, 20, 12], wain: [25, 25, 9] },
    { id: 'study', name: "The Steward's Study", x0: STUDY_DOOR, x1: 3850, fl: 0, top: UP + 36, wall: [28, 22, 12], wain: [24, 24, 8] },
    { id: 'kitchen', name: 'The Kitchen', x0: 3850, x1: W, fl: 0, top: UP + 36, wall: [38, 9, 18], wain: [30, 12, 12] },
    { id: 'gallery', name: 'The Gallery', x0: UP_X0, x1: 1500, fl: 1, top: 24, wall: [10, 20, 15], wain: [20, 25, 10] },
    { id: 'nursery', name: 'The Nursery', x0: 1500, x1: 2450, fl: 1, top: 24, wall: [205, 24, 22], wain: [30, 25, 12] },
    { id: 'lord', name: "Lord Vane's Chamber", x0: 2450, x1: 3400, fl: 1, top: 24, wall: [335, 17, 15], wain: [20, 24, 9] },
    { id: 'boudoir', name: "Lady Vesper's Boudoir", x0: 3400, x1: 4300, fl: 1, top: 24, wall: [292, 22, 19], wain: [22, 24, 11] },
    { id: 'attic', name: 'The Music Attic', x0: 4300, x1: W, fl: 1, top: 24, wall: [32, 12, 13], wain: [30, 14, 9] },
  ];
  const floorOf = rm => (rm.fl ? UP : FLOOR);

  const PLATFORMS = [{ x0: UP_X0 - 4, x1: W - 30, y: UP }];
  
  const SPOTS = [
    { id: 'm_exit', x: 150, y: 480 },
    { id: 'm_clock', x: 330, y: 470 },
    { id: 'm_portraits', x: 500, y: 460 },
    { id: 'm_stairs_up', x: STAIR_X - 30, y: 470 },
    { id: 'm_stairs_down', x: UP_X0 + 50, y: 170 },
    { id: 'm_table', x: 1450, y: 500 },
    { id: 'echo_toast', x: 1690, y: 470 },
    { id: 'm_sideboard', x: 1860, y: 480 },
    { id: 'm_debts', x: 2190, y: 480 },
    { id: 'm_atlas', x: 2760, y: 480 },
    { id: 'm_desk', x: 3260, y: 480 },
    { id: 'm_strongroom', x: 3660, y: 470 },
    { id: 'm_cook', x: 4230, y: 460 },
    { id: 'm_pantry', x: 4560, y: 480 },
    { id: 'm_back', x: 4900, y: 470 },
    { id: 'm_window', x: 1090, y: 150 },
    { id: 'm_beds', x: 1760, y: 150 },
    { id: 'm_horse', x: 2170, y: 170 },
    { id: 'echo_father', x: 2800, y: 150 },
    { id: 'm_lordbox', x: 3220, y: 170 },
    { id: 'm_vanity', x: 3700, y: 160 },
    { id: 'm_painting', x: 4100, y: 150 },
    { id: 'm_musicbox', x: 4700, y: 170 },
  ];

  // fireplaces: lantern checkpoints inside the house
  const HEARTHS = [{ x: 440, y: FLOOR }, { x: 1150, y: FLOOR }, { x: 2540, y: FLOOR }, { x: 1950, y: UP }, { x: 3860, y: UP }];

  // spirits that patrol: [from, to, floor y, count]
  const SHADE_ZONES = [[1300, 1900, FLOOR, 2], [2200, 2800, FLOOR, 1], [1560, 2350, UP, 1], [3480, 4220, UP, 1]];

  const LIGHTS = [];
  const WINDOWS = [];
  const light = (x, y, r, col, o = {}) => LIGHTS.push({ x, y, r, col, flick: o.flick ?? 0.8, cool: !!o.cool, pool: false });

  // ---------------------------------------------------------------- painted objects
  const objs = [];
  const add = (x0, x1, fn) => objs.push({ x0, x1, fn, seed: P.hash(objs.length * 7919 + 11, 4242) });
  const box = (c, r, x, y, w, h, col, o = {}) => P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(x, y, w, h); }, [x, y, w, h], col, o);
  const wood = [24, 30, 16];

  function wall(c, r, rm, x0, x1) {
    const fl = floorOf(rm), top = rm.top, [h, s, l] = rm.wall;
    box(c, r, x0, top, x1 - x0, fl - top, [h, s, l], { ang: 1.57, len: 46, w: 3, angJ: 0.06, density: 100, a: 0.28, lv: 7 });
    c.fillStyle = P.hsl(h, s, l + 3, 0.32);
    for (let x = Math.ceil(x0 / 38) * 38; x < x1; x += 38) c.fillRect(x, top, 8, fl - top - 100);
    // damask lozenges
    c.fillStyle = P.hsl(h, s + 6, l + 5, 0.22);
    for (let x = Math.ceil(x0 / 38) * 38 + 19; x < x1; x += 38) {
      for (let y = top + 26; y < fl - 120; y += 52) { P.dab(c, x, y, 5, 8, 0); P.dab(c, x, y + 26, 3, 4, 0); }
    }
    // gaslight stains and damp near the ceiling
    const g = c.createLinearGradient(0, top, 0, top + 70);
    g.addColorStop(0, 'rgba(2,3,8,0.55)'); g.addColorStop(1, 'rgba(2,3,8,0)');
    c.fillStyle = g; c.fillRect(x0, top, x1 - x0, 70);
    // wainscot, rail and skirting
    const [wh, ws, wl] = rm.wain;
    box(c, r, x0, fl - 100, x1 - x0, 100, [wh, ws, wl], { ang: 1.57, len: 30, w: 3, angJ: 0.04, density: 70, a: 0.3, lv: 6 });
    c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 2;
    for (let x = Math.ceil(x0 / 90) * 90; x < x1; x += 90) c.strokeRect(x + 8, fl - 88, 74, 62);
    box(c, r, x0, fl - 104, x1 - x0, 8, [wh, ws, wl + 7], { ang: 0, len: 22, w: 2 });
    box(c, r, x0, fl - 14, x1 - x0, 14, [wh, ws, wl - 3], { ang: 0, len: 22, w: 2 });
    // crown moulding
    box(c, r, x0, top, x1 - x0, 12, [wh, ws, wl + 4], { ang: 0, len: 24, w: 3 });
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x0, top + 12, x1 - x0, 3);
  }

  function floorStrip(c, r, x0, x1, y) {
    // the boards in front of the ghost's feet
    box(c, r, x0, y, x1 - x0, 720 - y, [24, 34, 9], { ang: 0.02, len: 70, w: 4, angJ: 0.05, density: 90, a: 0.4, lv: 8 });
    c.strokeStyle = 'rgba(0,0,0,0.45)'; c.lineWidth = 2;
    for (let yy = y + 26; yy < 720; yy += 30) { c.beginPath(); c.moveTo(x0, yy); c.lineTo(x1, yy); c.stroke(); }
    const g = c.createLinearGradient(0, y, 0, y + 30);
    g.addColorStop(0, 'rgba(255,200,130,0.10)'); g.addColorStop(1, 'rgba(255,200,130,0)');
    c.fillStyle = g; c.fillRect(x0, y, x1 - x0, 30);
  }

  // Rooms are painted in 250px slices so a chunk only replays what it shows.
  for (const rm of ROOMS) {
    for (let x = rm.x0; x < rm.x1; x += 250) {
      const a = x, b = Math.min(rm.x1, x + 250);
      add(a, b, (c, r) => wall(c, r, rm, a, b));
    }
  }
  for (let x = 0; x < W; x += 250) {
    add(x, x + 250, (c, r) => {
      floorStrip(c, r, x, x + 250, FLOOR);
      if (x + 250 > UP_X0) {
        // the slab between the storeys: its edge is the upper floor's boards
        const a = Math.max(x, UP_X0 - 4);
        box(c, r, a, UP, x + 250 - a, UP + 36 - UP, [24, 34, 11], { ang: 0.02, len: 60, w: 4, density: 60 });
        c.fillStyle = 'rgba(255,200,130,0.12)'; c.fillRect(a, UP, x + 250 - a, 5);
        c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(a, UP + 30, x + 250 - a, 6);
        // ceiling beams under the slab
        c.fillStyle = 'rgba(8,5,4,0.7)';
        for (let bx = Math.ceil(a / 210) * 210; bx < x + 250; bx += 210) c.fillRect(bx - 12, UP + 36, 24, 14);
      }
    });
  }

  // ---------------------------------------------------------------- props
  function windowAt(x, y, w, h, fl) {
    WINDOWS.push({ x, y: y + h / 2, w, fl });
    light(x, y + h / 2, 210, [150, 190, 255], { cool: true, flick: 0.1 });
    add(x - w, x + w, (c, r) => {
      const arch = w / 2;
      const path = cc => { cc.beginPath(); cc.moveTo(x - w / 2, y + h); cc.lineTo(x - w / 2, y + arch); cc.arc(x, y + arch, arch, Math.PI, 0); cc.lineTo(x + w / 2, y + h); cc.closePath(); };
      c.save(); path(c);
      const g = c.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, '#223059'); g.addColorStop(1, '#0d1330');
      c.fillStyle = g; c.fill(); c.clip();
      c.fillStyle = 'rgba(230,240,255,0.8)';
      for (let i = 0; i < 6; i++) c.fillRect(x - w / 2 + r() * w, y + r() * h * 0.7, 1.6, 1.6);
      // bare branches against the glass
      c.strokeStyle = 'rgba(4,6,14,0.85)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x - w / 2, y + h * 0.8); c.quadraticCurveTo(x - w * 0.1, y + h * 0.55, x + w * 0.25, y + h * 0.3); c.stroke();
      c.beginPath(); c.moveTo(x - w * 0.1, y + h * 0.62); c.lineTo(x + w * 0.1, y + h * 0.72); c.stroke();
      c.restore();
      c.strokeStyle = P.hsl(30, 25, 10); c.lineWidth = 5; path(c); c.stroke();
      c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + h); c.moveTo(x - w / 2, y + h * 0.5); c.lineTo(x + w / 2, y + h * 0.5); c.stroke();
      box(c, r, x - w / 2 - 10, y + h, w + 20, 9, [28, 24, 22], { ang: 0, len: 16, w: 2 });
      // velvet curtains
      for (const d of [-1, 1]) {
        P.paintFill(c, r, cc => {
          cc.beginPath(); cc.moveTo(x + d * (w / 2 - 6), y - 8); cc.lineTo(x + d * (w / 2 + 34), y - 8);
          cc.quadraticCurveTo(x + d * (w / 2 + 40), y + h * 0.5, x + d * (w / 2 + 28), y + h + 6);
          cc.lineTo(x + d * (w / 2 - 4), y + h + 6); cc.quadraticCurveTo(x + d * (w / 2 + 8), y + h * 0.5, x + d * (w / 2 - 6), y - 8); cc.closePath();
        }, [x + (d > 0 ? w / 2 - 6 : -w / 2 - 40), y - 8, 46, h + 16], [350, 38, 17], { ang: 1.57, len: 24, w: 3, angJ: 0.05, density: 40, lf: (px) => (px - x) * d * 0.02 });
      }
      box(c, r, x - w / 2 - 44, y - 16, w + 88, 8, [38, 50, 30], { ang: 0, len: 14, w: 2 });
    });
  }

  function frame(c, r, x, y, w, h, paint) {
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(x - w / 2 + 5, y + 5, w, h);
    box(c, r, x - w / 2 - 7, y - 7, w + 14, h + 14, [40, 55, 30], { ang: 0.7, len: 10, w: 2.5, a: 0.5, lv: 16 });
    c.fillStyle = '#100c0c'; c.fillRect(x - w / 2, y, w, h);
    c.save(); c.beginPath(); c.rect(x - w / 2, y, w, h); c.clip();
    paint(x, y, w, h);
    c.restore();
    c.strokeStyle = 'rgba(255,225,150,0.35)'; c.lineWidth = 1.5; c.strokeRect(x - w / 2 - 7, y - 7, w + 14, h + 14);
  }
  const face = (c, x, y, s, tone = [28, 30, 55]) => {
    c.fillStyle = P.hsl(tone[0], tone[1], tone[2]); P.dab(c, x, y, 6 * s, 8 * s, 0);
    c.fillStyle = P.hsl(25, 20, 8); P.dab(c, x - 2 * s, y - 1 * s, 1 * s, 0.8 * s, 0); P.dab(c, x + 2 * s, y - 1 * s, 1 * s, 0.8 * s, 0);
  };
  function body(c, x, y, s, col) {
    c.fillStyle = P.hsl(col[0], col[1], col[2]);
    c.beginPath(); c.moveTo(x - 11 * s, y + 70 * s); c.quadraticCurveTo(x - 12 * s, y + 14 * s, x - 3 * s, y + 8 * s); c.lineTo(x + 3 * s, y + 8 * s);
    c.quadraticCurveTo(x + 12 * s, y + 14 * s, x + 11 * s, y + 70 * s); c.fill();
  }

  function fireplace(x, fl, dark) {
    add(x - 100, x + 100, (c, r) => {
      const y = fl;
      P.shadow(c, x, y, 120, 8, 0.5);
      P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(x - 88, y - 150, 176, 150); }, [x - 88, y - 150, 176, 150], [220, 8, dark ? 22 : 30],
        { ang: 1.5, len: 14, w: 3, density: 40, lf: px => (px - x) * 0.05 });
      box(c, r, x - 100, y - 164, 200, 18, [220, 8, 36], { ang: 0, len: 18, w: 3 });
      c.fillStyle = '#070508'; c.beginPath(); c.moveTo(x - 52, y); c.lineTo(x - 52, y - 84); c.quadraticCurveTo(x, y - 116, x + 52, y - 84); c.lineTo(x + 52, y); c.fill();
      // embers and a log
      c.fillStyle = P.hsl(22, 70, 18); P.dab(c, x, y - 8, 36, 7, 0);
      for (let i = 0; i < 14; i++) { c.fillStyle = P.hsl(15 + r() * 25, 90, 40 + r() * 20, 0.8); P.dab(c, x - 28 + r() * 56, y - 8 - r() * 8, 2.4, 1.6, 0); }
      c.fillStyle = P.hsl(40, 20, 30); c.fillRect(x - 70, y - 168, 14, 7); c.fillRect(x + 56, y - 168, 14, 7);
    });
    light(x, fl - 60, 330, [255, 150, 70], { flick: 1.2 });
    LIGHTS.push({ x, y: fl - 40, r: 150, col: [255, 120, 50], flick: 1.5, cool: false, pool: false });
  }

  function candelabra(x, y, n = 3) {
    add(x - 30, x + 30, (c, r) => {
      c.strokeStyle = P.hsl(40, 50, 40); c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 36); c.moveTo(x - 6 * n, y - 28); c.quadraticCurveTo(x, y - 18, x + 6 * n, y - 28); c.stroke();
      for (let i = 0; i < n; i++) {
        const cx = x + (i - (n - 1) / 2) * 12;
        c.fillStyle = P.hsl(45, 25, 74); c.fillRect(cx - 2, y - 46, 4, 18);
        c.fillStyle = P.hsl(38, 95, 66); P.dab(c, cx, y - 52, 2.2, 4.5, 0);
      }
    });
    light(x, y - 50, 190, [255, 175, 90], { flick: 1 });
  }

  function bookcase(x, fl, w, h) {
    add(x - w / 2 - 10, x + w / 2 + 10, (c, r) => {
      const top = fl - h;
      P.shadow(c, x, fl, w * 0.6, 6, 0.4);
      box(c, r, x - w / 2, top, w, h, [24, 32, 11], { ang: 1.57, len: 22, w: 3, density: 60 });
      for (let sh = 0; sh < 5; sh++) {
        const sy = top + 12 + sh * ((h - 18) / 5), bh = (h - 18) / 5;
        c.fillStyle = '#0a0706'; c.fillRect(x - w / 2 + 6, sy, w - 12, bh - 6);
        let bx = x - w / 2 + 8;
        while (bx < x + w / 2 - 14) {
          const bw = 5 + r() * 9, bhh = (bh - 12) * (0.6 + r() * 0.4);
          c.fillStyle = P.hsl([350, 30, 210, 120, 40, 20][Math.floor(r() * 6)], 30 + r() * 20, 14 + r() * 14);
          c.fillRect(bx, sy + bh - 6 - bhh, bw, bhh);
          c.fillStyle = 'rgba(240,200,120,0.3)'; c.fillRect(bx + 1, sy + bh - 6 - bhh + 5, bw - 2, 1.5);
          bx += bw + 0.6;
        }
        c.fillStyle = P.hsl(28, 30, 22); c.fillRect(x - w / 2 + 4, sy + bh - 6, w - 8, 4);
      }
      box(c, r, x - w / 2 - 6, top - 8, w + 12, 10, [24, 32, 20], { ang: 0, len: 20, w: 2 });
    });
  }

  function chair(x, fl, face = 1, s = 1) {
    add(x - 30, x + 30, (c, r) => {
      c.save(); c.translate(x, fl); c.scale(face * s, s);
      c.fillStyle = P.hsl(22, 35, 12);
      c.fillRect(-16, -50, 5, 50); c.fillRect(11, -50, 5, 50);
      c.fillRect(-18, -54, 36, 8);
      box(c, r, -18, -102, 8, 52, [350, 30, 16], { ang: 1.57, len: 12, w: 2 });
      c.restore();
    });
  }

  function clock(x, fl) {
    add(x - 40, x + 40, (c, r) => {
      P.shadow(c, x, fl, 36, 5);
      box(c, r, x - 26, fl - 230, 52, 230, [22, 34, 12], { ang: 1.57, len: 20, w: 3, density: 40 });
      box(c, r, x - 34, fl - 250, 68, 28, [22, 34, 16], { ang: 0, len: 16, w: 2 });
      c.fillStyle = P.hsl(45, 18, 74); c.beginPath(); c.arc(x, fl - 206, 20, 0, P.TAU); c.fill();
      c.strokeStyle = '#17120e'; c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(x, fl - 206); c.lineTo(x - 11, fl - 196); c.moveTo(x, fl - 206); c.lineTo(x + 6, fl - 222); c.stroke(); // twenty to midnight
      c.fillStyle = '#0c0807'; c.fillRect(x - 15, fl - 160, 30, 100);
      c.fillStyle = P.hsl(44, 60, 40, 0.8); c.beginPath(); c.arc(x, fl - 76, 9, 0, P.TAU); c.fill();
    });
  }

  function door(x, fl, w, h, o = {}) {
    add(x - w, x + w, (c, r) => {
      c.fillStyle = '#05050a'; c.fillRect(x - w / 2 - 8, fl - h - 8, w + 16, h + 8);
      box(c, r, x - w / 2, fl - h, w, h, o.col || [22, 32, 11], { ang: 1.57, len: 24, w: 3, density: 50, lf: px => (px - x) * 0.05 });
      c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 2;
      c.strokeRect(x - w / 2 + 9, fl - h + 14, w - 18, h * 0.38); c.strokeRect(x - w / 2 + 9, fl - h * 0.5, w - 18, h * 0.45);
      c.fillStyle = P.hsl(44, 60, 44); P.dab(c, x + w / 2 - 12, fl - h * 0.46, 3.2, 3.2, 0);
      if (o.sign) { c.font = 'italic 16px Georgia, serif'; c.textAlign = 'center'; c.fillStyle = P.hsl(44, 40, 60, 0.8); c.fillText(o.sign, x, fl - h - 16); }
    });
  }

  // ---- the Great Hall -----------------------------------------------------
  add(0, 300, (c, r) => { // the front door, a tall oak pair with the moon in the keyhole
    const x = 150, fl = FLOOR;
    c.fillStyle = '#05060c'; c.beginPath(); c.moveTo(x - 62, fl); c.lineTo(x - 62, fl - 180); c.arc(x, fl - 180, 62, Math.PI, 0); c.lineTo(x + 62, fl); c.fill();
    P.paintFill(c, r, cc => { cc.beginPath(); cc.moveTo(x - 54, fl); cc.lineTo(x - 54, fl - 180); cc.arc(x, fl - 180, 54, Math.PI, 0); cc.lineTo(x + 54, fl); cc.closePath(); },
      [x - 54, fl - 240, 108, 240], [22, 32, 10], { ang: 1.57, len: 28, w: 3, density: 40 });
    c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, fl - 236); c.lineTo(x, fl); c.stroke();
    c.fillStyle = P.hsl(44, 60, 46); P.dab(c, x - 10, fl - 110, 3.5, 3.5, 0); P.dab(c, x + 10, fl - 110, 3.5, 3.5, 0);
    c.strokeStyle = P.hsl(220, 15, 20); c.lineWidth = 3;
    for (const yy of [fl - 170, fl - 60]) { c.beginPath(); c.moveTo(x - 54, yy); c.lineTo(x + 54, yy); c.stroke(); }
    // a sliver of moonlit lawn under the door
    const g = c.createLinearGradient(0, fl - 8, 0, fl); g.addColorStop(0, 'rgba(140,180,255,0)'); g.addColorStop(1, 'rgba(140,180,255,0.35)');
    c.fillStyle = g; c.fillRect(x - 54, fl - 8, 108, 8);
  });
  light(150, 480, 200, [140, 180, 255], { cool: true, flick: 0.1 });
  windowAt(310, 90, 62, 230, 0);
  clock(330, FLOOR);
  windowAt(580, 80, 70, 250, 0);
  fireplace(440, FLOOR, true);
  add(300, 600, (c, r) => { // the family portraits over the mantel
    frame(c, r, 400, FLOOR - 340, 62, 80, (x, y) => { body(c, x, y + 4, 1.0, [220, 20, 14]); face(c, x, y + 28, 1.3); });
    frame(c, r, 482, FLOOR - 380, 74, 96, (x, y) => { body(c, x, y + 4, 1.2, [350, 40, 20]); face(c, x, y + 34, 1.5); });
  });
  add(0, UP_X0, (c, r) => { // the grand stair: thick treads, a dark recess beneath and a banister
    const x0 = STAIR_X, topY = UP;
    c.fillStyle = 'rgba(2,2,6,0.85)';
    c.beginPath(); c.moveTo(x0, FLOOR); for (let k = 0; k < STEPS; k++) { c.lineTo(x0 + k * STEP_W, FLOOR - STEP_H * (k + 1)); c.lineTo(x0 + (k + 1) * STEP_W, FLOOR - STEP_H * (k + 1)); }
    c.lineTo(UP_X0, topY + 36); c.lineTo(UP_X0, FLOOR); c.closePath(); c.fill();
    for (let k = 0; k < STEPS; k++) {
      const sx = x0 + k * STEP_W, sy = FLOOR - STEP_H * (k + 1);
      box(c, r, sx, sy, STEP_W + 1, 12, [24, 36, 22], { ang: 0, len: 14, w: 2 });
      box(c, r, sx, sy + 12, 5, STEP_H - 12, [22, 32, 10], { ang: 1.57, len: 10, w: 2 });
      c.fillStyle = 'rgba(255,200,130,0.16)'; c.fillRect(sx, sy, STEP_W, 2);
    }
    // stringer, rail and balusters
    c.strokeStyle = P.hsl(22, 34, 15); c.lineWidth = 8;
    c.beginPath(); c.moveTo(x0 - 6, FLOOR - 4); c.lineTo(UP_X0, UP + 2); c.stroke();
    c.lineWidth = 3;
    for (let k = 0; k <= STEPS * 2; k++) {
      const bx = x0 + (k / (STEPS * 2)) * (UP_X0 - x0), by = FLOOR - 4 - ((k / (STEPS * 2)) * (FLOOR - UP - 6));
      c.beginPath(); c.moveTo(bx, by); c.lineTo(bx, by - 78); c.stroke();
    }
    c.lineWidth = 9; c.strokeStyle = P.hsl(24, 40, 22);
    c.beginPath(); c.moveTo(x0 - 6, FLOOR - 82); c.lineTo(UP_X0, UP - 76); c.stroke();
    c.fillStyle = P.hsl(44, 55, 42); P.dab(c, x0 - 8, FLOOR - 86, 8, 8, 0);
  });
  // the chandelier hangs dead centre of the double-height hall
  add(220, 520, (c, r) => {
    const x = 380, y = 200;
    c.strokeStyle = '#120e0c'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, 24); c.lineTo(x, y); c.stroke();
    c.strokeStyle = P.hsl(40, 50, 34); c.lineWidth = 5; c.beginPath(); c.ellipse(x, y + 12, 70, 12, 0, 0, P.TAU); c.stroke();
    c.lineWidth = 2.5; c.beginPath(); c.ellipse(x, y + 12, 40, 7, 0, 0, P.TAU); c.stroke();
    for (let i = 0; i < 8; i++) {
      const cx = x - 66 + i * 18.8;
      c.fillStyle = P.hsl(45, 22, 74); c.fillRect(cx - 2, y - 10, 4, 14);
      c.fillStyle = P.hsl(38, 95, 66); P.dab(c, cx, y - 14, 2.4, 4.4, 0);
      c.strokeStyle = 'rgba(220,235,255,0.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(cx, y + 18); c.lineTo(cx, y + 34 + (i % 3) * 8); c.stroke();
    }
  });
  light(380, 210, 340, [255, 180, 95], { flick: 1 });
  add(660, 860, (c, r) => { // a little door in the recess under the stair
    c.fillStyle = '#0c0807'; c.fillRect(700, FLOOR - 120, 70, 120);
    c.strokeStyle = 'rgba(160,120,70,0.3)'; c.lineWidth = 2; c.strokeRect(700, FLOOR - 120, 70, 120);
    c.fillStyle = P.hsl(44, 60, 44); P.dab(c, 760, FLOOR - 56, 2.4, 2.4, 0);
  });

  // ---- the Dining Hall ----------------------------------------------------
  fireplace(1150, FLOOR);
  windowAt(1330, 366, 70, 130, 0);
  add(1000, 2000, (c, r) => { // the long feast table, still laid
    const x0 = 1260, x1 = 1760, y = FLOOR - 96;
    P.shadow(c, (x0 + x1) / 2, FLOOR, 300, 9, 0.5);
    box(c, r, x0, y, x1 - x0, 14, [24, 36, 18], { ang: 0, len: 30, w: 3 });
    c.fillStyle = 'rgba(225,215,190,0.9)'; // linen runner, grey with dust
    c.fillRect(x0 + 10, y - 3, x1 - x0 - 20, 6);
    box(c, r, x0 + 20, y + 14, 12, 82, wood, { ang: 1.57, len: 12, w: 2 });
    box(c, r, x1 - 32, y + 14, 12, 82, wood, { ang: 1.57, len: 12, w: 2 });
    for (let i = 0; i < 7; i++) { // plates, goblets and burned-down candles
      const px = x0 + 40 + i * 68;
      c.fillStyle = P.hsl(40, 12, 62); P.dab(c, px, y - 4, 16, 3.4, 0);
      c.fillStyle = P.hsl(220, 15, 60, 0.7); c.fillRect(px + 18, y - 22, 6, 18);
      c.fillStyle = P.hsl(45, 12, 70, 0.8); c.fillRect(px - 26, y - 14, 5, 12);
    }
    // your own place at the head: the overturned goblet and the dark stain
    c.fillStyle = P.hsl(350, 55, 16, 0.85); P.dab(c, x1 - 70, y - 2, 28, 3.2, 0);
    c.save(); c.translate(x1 - 40, y - 12); c.rotate(1.2); c.fillStyle = P.hsl(220, 14, 70); c.fillRect(-4, -12, 8, 14); c.beginPath(); c.moveTo(-8, -12); c.lineTo(8, -12); c.lineTo(5, -28); c.lineTo(-5, -28); c.fill(); c.restore();
  });
  chair(1250, FLOOR, 1); chair(1380, FLOOR, 1); chair(1510, FLOOR, 1); chair(1640, FLOOR, -1); chair(1770, FLOOR, -1);
  candelabra(1480, FLOOR - 98, 5);
  add(1780, 2000, (c, r) => { // sideboard with a decanter
    const x = 1860, y = FLOOR - 90;
    P.shadow(c, x, FLOOR, 90, 6, 0.4);
    box(c, r, x - 80, y, 160, 90, [22, 32, 12], { ang: 1.57, len: 16, w: 3, density: 50 });
    box(c, r, x - 88, y - 8, 176, 10, [22, 30, 20], { ang: 0, len: 20, w: 2 });
    c.fillStyle = P.hsl(350, 55, 18, 0.9); c.beginPath(); c.moveTo(x - 6, y - 8); c.lineTo(x + 6, y - 8); c.lineTo(x + 10, y - 40); c.lineTo(x + 2, y - 50); c.lineTo(x - 2, y - 50); c.lineTo(x - 10, y - 40); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.2)'; c.fillRect(x - 5, y - 38, 2, 26);
    c.fillStyle = P.hsl(44, 40, 70); c.fillRect(x - 3, y - 30, 7, 8);
  });
  add(1560, 1840, (c, r) => frame(c, r, 1700, FLOOR - 300, 130, 90, (x, y) => { // a hunting scene gone dark
    const g = c.createLinearGradient(0, y, 0, y + 90); g.addColorStop(0, '#1b2230'); g.addColorStop(1, '#0c0f10'); c.fillStyle = g; c.fillRect(x - 65, y, 130, 90);
    c.fillStyle = '#0a0c0c'; for (let i = 0; i < 6; i++) P.dab(c, x - 50 + i * 20, y + 80, 12, 24, 0);
  }));

  // ---- the Library --------------------------------------------------------
  bookcase(2080, FLOOR, 130, 270); bookcase(2250, FLOOR, 130, 270); bookcase(2400, FLOOR, 120, 270); bookcase(2870, FLOOR, 120, 270);
  fireplace(2540, FLOOR);
  add(2080, 2400, (c, r) => { // a reading desk with the ledger of debts
    const x = 2190, y = FLOOR - 92;
    P.shadow(c, x, FLOOR, 100, 7, 0.45);
    box(c, r, x - 70, y, 140, 12, [22, 36, 18], { ang: 0, len: 22, w: 3 });
    box(c, r, x - 62, y + 12, 10, 80, wood, { ang: 1.57, len: 12, w: 2 }); box(c, r, x + 52, y + 12, 10, 80, wood, { ang: 1.57, len: 12, w: 2 });
    c.fillStyle = P.hsl(350, 40, 18); c.fillRect(x - 28, y - 10, 38, 10);
    c.fillStyle = P.hsl(45, 28, 68); c.fillRect(x + 12, y - 8, 30, 8);
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(x + 14, y - 5, 26, 1.5);
  });
  add(2600, 2900, (c, r) => { // a brass globe and the crooked atlas
    P.shadow(c, 2700, FLOOR, 50, 6, 0.4);
    c.strokeStyle = P.hsl(40, 50, 36); c.lineWidth = 4; c.beginPath(); c.arc(2700, FLOOR - 120, 40, 0, P.TAU); c.stroke();
    c.fillStyle = P.hsl(210, 30, 18, 0.9); c.beginPath(); c.arc(2700, FLOOR - 120, 38, 0, P.TAU); c.fill();
    c.fillStyle = P.hsl(32, 28, 26); P.dab(c, 2692, FLOOR - 128, 14, 9, 0.3); P.dab(c, 2712, FLOOR - 108, 10, 6, -0.4);
    c.strokeStyle = P.hsl(40, 50, 30); c.lineWidth = 5; c.beginPath(); c.moveTo(2700, FLOOR - 78); c.lineTo(2700, FLOOR); c.moveTo(2672, FLOOR); c.lineTo(2728, FLOOR); c.stroke();
    c.save(); c.translate(2790, FLOOR - 128); c.rotate(-0.24); c.fillStyle = P.hsl(30, 40, 20); c.fillRect(-12, -42, 24, 42); c.fillStyle = P.hsl(44, 60, 40); c.fillRect(-9, -36, 18, 3); c.restore();
  });
  candelabra(2370, FLOOR - 278, 3);

  // ---- the Steward's Study ------------------------------------------------
  door(STUDY_DOOR, FLOOR, 90, 200, { sign: '' });
  add(STUDY_DOOR - 30, STUDY_DOOR + 30, (c, r) => { // a locked door unless the atlas has been turned: drawn as dark iron bars (state shown live)
    c.strokeStyle = P.hsl(220, 10, 20); c.lineWidth = 3; c.strokeRect(STUDY_DOOR - 45, FLOOR - 200, 90, 200);
  });
  windowAt(3100, 366, 64, 130, 0);
  add(3060, 3500, (c, r) => { // the steward's desk
    const x = 3260, y = FLOOR - 98;
    P.shadow(c, x, FLOOR, 130, 8, 0.5);
    box(c, r, x - 90, y, 180, 14, [22, 38, 17], { ang: 0, len: 24, w: 3 });
    box(c, r, x - 84, y + 14, 56, 84, wood, { ang: 1.57, len: 12, w: 2 }); box(c, r, x + 30, y + 14, 56, 84, wood, { ang: 1.57, len: 12, w: 2 });
    c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1.5; for (const yy of [y + 36, y + 62]) { c.strokeRect(x - 80, yy - 14, 48, 24); }
    c.fillStyle = P.hsl(45, 28, 70); c.save(); c.translate(x - 10, y - 4); c.rotate(-0.04); c.fillRect(-26, -3, 52, 4); c.restore();
    c.strokeStyle = '#ddd'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + 24, y - 2); c.lineTo(x + 46, y - 26); c.stroke();
    c.fillStyle = '#10161c'; c.fillRect(x + 40, y - 14, 14, 14);
  });
  chair(3380, FLOOR, -1);
  candelabra(3180, FLOOR - 104, 1);
  add(3560, 3850, (c, r) => { // the strongroom: a green iron door set in the wall
    const x = 3660, y = FLOOR;
    box(c, r, x - 64, y - 210, 128, 210, [150, 14, 14], { ang: 1.57, len: 18, w: 3, density: 40, lf: px => (px - x) * 0.04 });
    c.strokeStyle = P.hsl(40, 40, 36); c.lineWidth = 4; c.strokeRect(x - 64, y - 210, 128, 210);
    c.lineWidth = 2; c.strokeRect(x - 50, y - 196, 100, 182);
    c.fillStyle = P.hsl(44, 50, 40); c.beginPath(); c.arc(x, y - 110, 18, 0, P.TAU); c.fill();
    c.fillStyle = '#0a0a0a'; c.beginPath(); c.arc(x, y - 110, 6, 0, P.TAU); c.fill(); c.fillRect(x - 2, y - 110, 4, 14);
    for (let i = 0; i < 4; i++) { c.fillStyle = P.hsl(40, 40, 40); P.dab(c, x - 40 + (i % 2) * 80, y - 180 + Math.floor(i / 2) * 150, 3.5, 3.5, 0); }
  });
  light(3660, FLOOR - 110, 160, [255, 180, 100], { flick: 0.4 });
  bookcase(3480, FLOOR, 110, 250);

  // ---- the Kitchen --------------------------------------------------------
  windowAt(4000, 366, 60, 130, 0);
  add(4100, 4500, (c, r) => { // the range, hanging pots and the cook's table
    const x = 4180;
    P.shadow(c, x, FLOOR, 90, 7, 0.5);
    box(c, r, x - 70, FLOOR - 130, 140, 130, [210, 8, 14], { ang: 1.57, len: 20, w: 3, density: 40 });
    c.fillStyle = '#05050a'; c.fillRect(x - 54, FLOOR - 80, 108, 58);
    c.fillStyle = P.hsl(18, 85, 40, 0.8); P.dab(c, x, FLOOR - 36, 40, 5, 0);
    box(c, r, x - 74, FLOOR - 138, 148, 10, [210, 8, 20], { ang: 0, len: 20, w: 2 });
    box(c, r, x - 12, UP + 36, 24, FLOOR - 138 - UP - 36, [210, 8, 12], { ang: 1.57, len: 18, w: 2 });
    c.strokeStyle = '#111'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 140, UP + 56); c.lineTo(x + 40, UP + 56); c.stroke();
    for (let i = 0; i < 5; i++) { const px = x - 130 + i * 40; c.beginPath(); c.moveTo(px, UP + 56); c.lineTo(px, UP + 80 + (i % 2) * 14); c.stroke(); c.fillStyle = P.hsl(25, 40, 24 + i * 2); P.dab(c, px, UP + 96 + (i % 2) * 14, 13, 12, 0); }
    // the scrubbed table
    const tx = 4330;
    box(c, r, tx - 100, FLOOR - 90, 200, 12, [34, 28, 30], { ang: 0, len: 24, w: 3 });
    box(c, r, tx - 90, FLOOR - 78, 10, 78, wood, { ang: 1.57, len: 10, w: 2 }); box(c, r, tx + 80, FLOOR - 78, 10, 78, wood, { ang: 1.57, len: 10, w: 2 });
    c.fillStyle = P.hsl(40, 30, 66); P.dab(c, tx - 40, FLOOR - 94, 18, 5, 0); c.fillStyle = '#6a3b22'; P.dab(c, tx + 30, FLOOR - 98, 14, 8, 0);
  });
  light(4180, FLOOR - 60, 220, [255, 130, 55], { flick: 1.3 });
  add(4480, 4800, (c, r) => { // the pantry shelves; two dusty rings in the tin row mark where the poison stood
    const x = 4560;
    box(c, r, x - 70, FLOOR - 250, 140, 250, [26, 26, 12], { ang: 1.57, len: 20, w: 3, density: 40 });
    for (let sh = 0; sh < 4; sh++) {
      const sy = FLOOR - 230 + sh * 60;
      c.fillStyle = '#0a0706'; c.fillRect(x - 64, sy, 128, 52);
      c.fillStyle = P.hsl(28, 30, 22); c.fillRect(x - 66, sy + 52, 132, 5);
      for (let i = 0; i < 7; i++) { c.fillStyle = P.hsl(200 + i * 12, 12, 22 + r() * 18); c.fillRect(x - 58 + i * 17, sy + 52 - 20 - r() * 12, 12, 20 + r() * 12); }
    }
    c.fillStyle = 'rgba(240,235,220,0.15)'; for (const px of [x - 20, x + 5]) P.dab(c, px, FLOOR - 176, 7, 2.4, 0);
  });
  add(4800, 5000, (c, r) => {
    const x = 4900;
    c.fillStyle = '#05060c'; c.fillRect(x - 46, FLOOR - 190, 92, 190);
    box(c, r, x - 40, FLOOR - 184, 80, 184, [22, 32, 10], { ang: 1.57, len: 24, w: 3, density: 40 });
    c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 2; c.strokeRect(x - 30, FLOOR - 170, 60, 70); c.strokeRect(x - 30, FLOOR - 90, 60, 80);
    c.fillStyle = P.hsl(44, 60, 44); P.dab(c, x + 28, FLOOR - 90, 3, 3, 0);
    c.font = 'italic 16px Georgia, serif'; c.textAlign = 'center'; c.fillStyle = P.hsl(44, 40, 60, 0.7); c.fillText('To the kitchen garden', x, FLOOR - 206);
  });
  light(4900, FLOOR - 100, 160, [140, 180, 255], { cool: true, flick: 0.1 });

  // ---- the Gallery (upper) ------------------------------------------------
  windowAt(1090, 56, 70, 134, 1);
  add(860, 1500, (c, r) => {
    for (const [x, w, h, k] of [[1200, 70, 96, 0], [1310, 56, 74, 1], [1420, 70, 96, 2]]) {
      frame(c, r, x, UP - 220, w, h, (px, py) => { body(c, px, py + 6, w / 64, [[350, 40, 20], [210, 30, 18], [40, 30, 20]][k]); face(c, px, py + 30 * (w / 64), w / 50, [28, 24, 48]); });
    }
    for (let x = 960; x < 1500; x += 200) {
      c.fillStyle = P.hsl(30, 20, 12); c.fillRect(x - 14, UP - 62, 28, 62); c.fillStyle = P.hsl(40, 30, 30); c.fillRect(x - 18, UP - 66, 36, 6);
      c.fillStyle = P.hsl(218, 8, 52); P.dab(c, x, UP - 90, 14, 20, 0); P.dab(c, x, UP - 114, 9, 11, 0);
    }
  });
  // ---- the Nursery --------------------------------------------------------
  fireplace(1950, UP, true);
  windowAt(1620, 56, 60, 130, 1);
  add(1560, 2440, (c, r) => {
    // two small beds: A.C. and T.J.
    for (const [x, ini, col] of [[1740, 'A.C.', [205, 30, 24]], [1880, 'T.J.', [20, 30, 24]]]) {
      P.shadow(c, x, UP, 56, 5, 0.4);
      box(c, r, x - 48, UP - 40, 96, 30, col, { ang: 0.1, len: 18, w: 3 });
      box(c, r, x - 52, UP - 66, 8, 66, wood, { ang: 1.57, len: 10, w: 2 }); box(c, r, x + 44, UP - 52, 8, 52, wood, { ang: 1.57, len: 10, w: 2 });
      c.fillStyle = P.hsl(45, 15, 70, 0.85); P.dab(c, x - 30, UP - 46, 16, 7, 0);
      c.font = 'bold 12px Georgia, serif'; c.textAlign = 'center'; c.fillStyle = P.hsl(44, 50, 60, 0.8); c.fillText(ini, x - 48, UP - 70);
    }
    // a rocking horse, a toy chest, a row of tin soldiers
    const hx = 2170;
    P.shadow(c, hx, UP, 50, 5, 0.4);
    c.strokeStyle = P.hsl(25, 40, 16); c.lineWidth = 6; c.beginPath(); c.arc(hx, UP - 6, 44, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    c.fillStyle = P.hsl(40, 25, 56); P.dab(c, hx, UP - 50, 28, 12, 0); c.beginPath(); c.moveTo(hx + 18, UP - 52); c.lineTo(hx + 34, UP - 84); c.lineTo(hx + 46, UP - 76); c.lineTo(hx + 30, UP - 50); c.fill();
    c.strokeStyle = P.hsl(40, 25, 56); c.lineWidth = 4; for (const dx of [-18, 16]) { c.beginPath(); c.moveTo(hx + dx, UP - 44); c.lineTo(hx + dx - 4, UP - 12); c.stroke(); }
    box(c, r, 2300, UP - 44, 70, 44, [20, 36, 20], { ang: 0.1, len: 14, w: 2 });
    for (let i = 0; i < 5; i++) { c.fillStyle = P.hsl(355, 50, 30); c.fillRect(2320 + i * 12, UP - 62, 5, 16); c.fillStyle = P.hsl(30, 40, 60); P.dab(c, 2322 + i * 12, UP - 66, 2.4, 2.4, 0); }
    // the boys' height marks on the doorframe
    c.fillStyle = P.hsl(28, 34, 28); c.fillRect(1520, UP - 170, 6, 170);
    for (let i = 0; i < 6; i++) { c.fillStyle = 'rgba(8,5,4,0.8)'; c.fillRect(1522, UP - 40 - i * 22, 12 + (i % 2) * 5, 2); }
  });
  light(1750, UP - 90, 180, [255, 190, 120], { flick: 0.5 });
  // ---- Lord Vane's chamber -------------------------------------------------
  windowAt(2560, 56, 66, 134, 1);
  fireplace(3010, UP, true);
  add(2560, 3400, (c, r) => {
    const x = 2800;
    P.shadow(c, x, UP, 130, 8, 0.5);
    box(c, r, x - 120, UP - 70, 240, 54, [335, 32, 22], { ang: 0.1, len: 20, w: 3 });
    box(c, r, x - 128, UP - 150, 12, 150, wood, { ang: 1.57, len: 14, w: 2 }); box(c, r, x + 116, UP - 110, 12, 110, wood, { ang: 1.57, len: 14, w: 2 });
    c.fillStyle = P.hsl(45, 12, 76, 0.9); P.dab(c, x - 90, UP - 84, 28, 11, 0);
    c.fillStyle = P.hsl(350, 40, 14, 0.9); c.fillRect(x - 128, UP - 150, 256, 10);
    c.fillStyle = P.hsl(350, 36, 16, 0.9);
    for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(x - 128 + i * 28, UP - 140); c.quadraticCurveTo(x - 118 + i * 28, UP - 110, x - 126 + i * 28, UP - 86); c.lineTo(x - 112 + i * 28, UP - 86); c.fill(); }
    frame(c, r, 3200, UP - 190, 90, 120, (px, py) => { body(c, px, py + 6, 1.5, [220, 20, 13]); face(c, px, py + 42, 1.9, [30, 20, 52]); });
    box(c, r, 3150, UP - 100, 100, 100, [22, 36, 12], { ang: 1.57, len: 14, w: 3, density: 40 });
    c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1.5; for (let i = 0; i < 3; i++) c.strokeRect(3158, UP - 94 + i * 30, 84, 24);
  });
  light(2800, UP - 130, 200, [255, 175, 100], { flick: 0.7 });
  // ---- Lady Vesper's boudoir -----------------------------------------------
  windowAt(3520, 56, 66, 134, 1);
  fireplace(3860, UP);
  add(3560, 4300, (c, r) => {
    const x = 3700;
    P.shadow(c, x, UP, 70, 6, 0.4);
    box(c, r, x - 60, UP - 86, 120, 10, [292, 18, 22], { ang: 0, len: 20, w: 3 });
    box(c, r, x - 56, UP - 76, 12, 76, wood, { ang: 1.57, len: 10, w: 2 }); box(c, r, x + 44, UP - 76, 12, 76, wood, { ang: 1.57, len: 10, w: 2 });
    c.fillStyle = 'rgba(160,190,225,0.22)'; c.beginPath(); c.ellipse(x, UP - 160, 40, 56, 0, 0, P.TAU); c.fill();
    c.strokeStyle = P.hsl(40, 45, 36); c.lineWidth = 4; c.beginPath(); c.ellipse(x, UP - 160, 40, 56, 0, 0, P.TAU); c.stroke();
    c.fillStyle = P.hsl(44, 55, 62); c.fillRect(x - 26, UP - 98, 6, 12); c.fillStyle = P.hsl(350, 40, 40); P.dab(c, x + 20, UP - 94, 9, 4, 0);
    // the half-finished portrait on an easel, a grey cloak over the chair
    const ex = 4100;
    c.strokeStyle = P.hsl(25, 40, 15); c.lineWidth = 5;
    c.beginPath(); c.moveTo(ex - 40, UP); c.lineTo(ex, UP - 150); c.lineTo(ex + 40, UP); c.moveTo(ex, UP - 150); c.lineTo(ex, UP); c.stroke();
    c.fillStyle = P.hsl(40, 25, 60); c.fillRect(ex - 36, UP - 146, 72, 92);
    c.fillStyle = P.hsl(292, 22, 22); c.beginPath(); c.moveTo(ex - 10, UP - 70); c.quadraticCurveTo(ex, UP - 130, ex + 10, UP - 70); c.fill(); face(c, ex, UP - 112, 1.8, [30, 28, 60]);
    c.fillStyle = P.hsl(220, 8, 40); c.beginPath(); c.moveTo(4210, UP); c.lineTo(4206, UP - 74); c.quadraticCurveTo(4236, UP - 82, 4240, UP - 54); c.lineTo(4244, UP); c.fill();
  });
  light(3700, UP - 120, 170, [255, 190, 150], { flick: 0.5 });
  // ---- the Music Attic -----------------------------------------------------
  windowAt(4420, 56, 56, 130, 1);
  add(4300, W, (c, r) => {
    // bare rafters, trunks and a dust sheet
    c.strokeStyle = P.hsl(25, 25, 8); c.lineWidth = 12;
    for (let x = 4340; x < W; x += 140) { c.beginPath(); c.moveTo(x, 36); c.lineTo(x + 70, 100); c.lineTo(x + 140, 36); c.stroke(); }
    for (const [x, w, h] of [[4520, 90, 56], [4580, 60, 40], [4860, 100, 62]]) { box(c, r, x - w / 2, UP - h, w, h, [24, 32, 13], { ang: 0.1, len: 16, w: 2 }); c.strokeStyle = P.hsl(40, 40, 30); c.lineWidth = 3; c.strokeRect(x - w / 2, UP - h, w, h); }
    c.fillStyle = 'rgba(205,205,215,0.55)'; c.beginPath(); c.moveTo(4780, UP); c.quadraticCurveTo(4780, UP - 90, 4800, UP - 100); c.quadraticCurveTo(4830, UP - 110, 4850, UP - 80); c.lineTo(4860, UP); c.fill();
    // the music box on a little table
    const x = 4700;
    P.shadow(c, x, UP, 60, 5, 0.4);
    box(c, r, x - 44, UP - 66, 88, 8, [24, 36, 18], { ang: 0, len: 16, w: 2 }); box(c, r, x - 38, UP - 58, 8, 58, wood, { ang: 1.57, len: 10, w: 2 }); box(c, r, x + 30, UP - 58, 8, 58, wood, { ang: 1.57, len: 10, w: 2 });
    box(c, r, x - 30, UP - 96, 60, 32, [20, 40, 20], { ang: 0.1, len: 12, w: 2 });
    c.strokeStyle = P.hsl(44, 60, 48); c.lineWidth = 2.5; c.strokeRect(x - 30, UP - 96, 60, 32);
    for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(x - 16 + i * 16, UP - 80, 5.5, 0, P.TAU); c.stroke(); } // three ring-shaped slots
  });
  light(4700, UP - 90, 180, [255, 210, 130], { flick: 0.6 });

  // ---------------------------------------------------------------- chunk cache
  let chunks = null;
  function paintAll() {
    chunks = [];
    for (let i = 0; i < Math.ceil(W / CHW); i++) {
      const cv = document.createElement('canvas');
      cv.width = Math.ceil(CHW * SC); cv.height = Math.ceil(H * SC);
      const c = cv.getContext('2d');
      // the dark house behind everything
      const g = c.createLinearGradient(0, 0, 0, cv.height);
      g.addColorStop(0, '#090709'); g.addColorStop(1, '#0d0a0a');
      c.fillStyle = g; c.fillRect(0, 0, cv.width, cv.height);
      c.setTransform(SC, 0, 0, SC, -i * CHW * SC, 0);
      const x0 = i * CHW, x1 = x0 + CHW;
      for (const o of objs) {
        if (o.x1 < x0 - 20 || o.x0 > x1 + 20) continue;
        c.save(); o.fn(c, P.rng(o.seed)); c.restore();
      }
      chunks.push(cv);
    }
  }
  function ready() { return !!chunks; }
  function ensure() { if (!chunks) paintAll(); }
  function release() { chunks = null; }

  function draw(ctx, S, cam, viewW) {
    ensure();
    const i0 = Math.max(0, Math.floor(cam / CHW)), i1 = Math.min(chunks.length - 1, Math.floor((cam + viewW) / CHW));
    for (let i = i0; i <= i1; i++) {
      ctx.drawImage(chunks[i], Math.floor((i * CHW - cam) * S), 0, Math.ceil(CHW * S) + 1, Math.ceil(H * S));
    }
  }

  const roomAt = (x, y) => {
    const fl = y < UP + 40 && x >= UP_X0 - 10 ? 1 : 0;
    return ROOMS.find(r => r.fl === fl && x >= r.x0 && x < r.x1) || ROOMS[0];
  };

  return {
    W, H, FLOOR, UP, STUDY_DOOR, UP_X0, ROOMS, PLATFORMS, SPOTS, LIGHTS, WINDOWS, HEARTHS, SHADE_ZONES,
    floorY: () => FLOOR, draw, ensure, ready, release, roomAt,
  };
})();
