'use strict';
// The Vane Harvest Fair: an abandoned carnival past the manor's east wall.
// Booths and scenery are painted into the world's layer chunks; the ferris
// wheel, carousel, barker and string lights move, so they are drawn live.
const Carnival = (() => {
  const { groundY, addObject, atDepth } = World;
  const X0 = 5300, X1 = World.WORLD_W;

  const GAMES = [
    { id: 'game_duck', x: 5980, sign: 'DUCK SHOOT', stripes: [[200, 40, 32], [40, 30, 62]] },
    { id: 'game_balloon', x: 6320, sign: 'BALLOON POP', stripes: [[355, 45, 32], [40, 30, 62]] },
    { id: 'game_rings', x: 6660, sign: 'RING TOSS', stripes: [[150, 30, 26], [40, 30, 60]] },
    { id: 'game_cans', x: 7240, sign: 'MILK CANS', stripes: [[20, 50, 34], [40, 30, 62]] },
    { id: 'game_star', x: 7580, sign: 'STAR SHOOT', stripes: [[270, 25, 30], [45, 40, 58]] },
  ];
  const BARKER_X = 5760, WHEEL_X = 6950, CAROUSEL_X = 8000, ARCH_X = 5530;
  const WHEEL_F = 0.8, WHEEL_R = 230, WHEEL_HUB_Y = 300;

  // ---------------------------------------------------------------- painted scenery
  function stripedAwning(c, r, x0, x1, top, depth, stripes) {
    const n = Math.max(4, Math.round((x1 - x0) / 26)), sw = (x1 - x0) / n;
    for (let i = 0; i < n; i++) {
      const a = x0 + i * sw, col = stripes[i % 2];
      P.paintFill(c, r, cc => {
        cc.beginPath();
        cc.moveTo(a + sw * 0.15, top); cc.lineTo(a + sw * 0.85 + 0.5, top);
        cc.lineTo(a + sw + 0.5, top + depth);
        cc.quadraticCurveTo(a + sw / 2, top + depth + 14, a, top + depth);
        cc.closePath();
      }, [a - 2, top, sw + 4, depth + 16], col, { ang: 1.4, len: 12, w: 3, lf: (px, py) => -(py - top) * 0.12 + (px - x0) / (x1 - x0) * 6 });
    }
    // a few tears in the canvas
    for (let i = 0; i < 3; i++) {
      c.fillStyle = 'rgba(8,8,16,0.85)';
      const tx = x0 + r() * (x1 - x0), ty = top + depth * (0.5 + r() * 0.5);
      c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx + 6 + r() * 8, ty + 10 + r() * 8); c.lineTo(tx - 3, ty + 14); c.fill();
    }
  }

  function signBoard(c, r, x, y, w, text, size = 19) {
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(x - w / 2, y - 22, w, 36); }, [x - w / 2, y - 22, w, 36], [25, 30, 12], { ang: 0.02, len: 24, w: 3, density: 60 });
    c.strokeStyle = P.hsl(40, 40, 30, 0.8); c.lineWidth = 2; c.strokeRect(x - w / 2 + 3, y - 19, w - 6, 30);
    c.font = `bold ${size}px Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = P.hsl(42, 45, 62, 0.85); c.fillText(text, x, y - 3);
    // flaked paint over the letters
    for (let i = 0; i < 10; i++) { c.fillStyle = P.hsl(25, 30, 12, 0.8); P.dab(c, x - w / 2 + r() * w, y - 14 + r() * 22, 1.5 + r() * 3, 1 + r() * 2, r() * 3); }
    c.textBaseline = 'alphabetic';
  }

  function booth(c, r, g) {
    const x = g.x, y = groundY(x) + 6, w = 230, h = 178, top = y - h;
    P.shadow(c, x, y + 2, w * 0.68, 12, 0.55);
    // back wall of dark planks
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(x - w / 2 + 8, top + 34, w - 16, h - 34); }, [x - w / 2, top + 34, w, h - 34], [22, 25, 9],
      { ang: 1.57, len: 30, w: 4, angJ: 0.05, density: 70, lf: px => (px - x) * 0.03 });
    c.strokeStyle = 'rgba(8,6,4,0.6)'; c.lineWidth = 1.5;
    for (let px = x - w / 2 + 20; px < x + w / 2 - 10; px += 16) { c.beginPath(); c.moveTo(px, top + 34); c.lineTo(px, y - 40); c.stroke(); }
    g.decor(c, r, x, top, y);
    // posts
    for (const px of [x - w / 2 + 7, x + w / 2 - 7]) {
      P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(px - 6, top + 8, 12, h - 8); }, [px - 6, top + 8, 12, h - 8], [28, 30, 15], { ang: 1.57, len: 16, w: 2, lf: qx => (qx - px) * 1.2 });
    }
    // counter
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(x - w / 2, y - 48, w, 48); }, [x - w / 2, y - 48, w, 48], g.stripes[0], { ang: 1.57, len: 14, w: 3, density: 50, lf: px => (px - x) * 0.04 });
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(x - w / 2 - 6, y - 54, w + 12, 8); }, [x - w / 2 - 6, y - 54, w + 12, 8], [30, 30, 30], { ang: 0, len: 20, w: 2 });
    for (let i = 0; i < 4; i++) { // painted diamonds on the counter front
      const dx = x - w / 2 + 30 + i * 56;
      c.fillStyle = P.hsl(g.stripes[1][0], 30, 50, 0.45);
      c.beginPath(); c.moveTo(dx, y - 36); c.lineTo(dx + 10, y - 26); c.lineTo(dx, y - 16); c.lineTo(dx - 10, y - 26); c.fill();
    }
    stripedAwning(c, r, x - w / 2 - 10, x + w / 2 + 10, top, 38, g.stripes);
    signBoard(c, r, x, top - 18, 170, g.sign);
  }

  // what is left inside each booth, glimpsed behind the counter
  const DECOR = {
    game_duck(c, r, x, top, y) {
      c.fillStyle = P.hsl(205, 30, 18); c.fillRect(x - 100, y - 82, 200, 22);
      for (let i = 0; i < 6; i++) {
        const dx = x - 85 + i * 34, down = r() < 0.35;
        c.fillStyle = P.hsl(48, 55, down ? 30 : 46);
        if (down) P.dab(c, dx, y - 82, 10, 4, 0.3);
        else { P.dab(c, dx, y - 90, 10, 8, 0); P.dab(c, dx + 7, y - 99, 6, 6, 0); c.fillStyle = P.hsl(25, 70, 40); P.dab(c, dx + 13, y - 98, 4, 2, 0); }
      }
    },
    game_balloon(c, r, x, top, y) {
      P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(x - 90, top + 46, 180, 92); }, [x - 90, top + 46, 180, 92], [30, 35, 26], { ang: 0.3, len: 6, w: 2 });
      const cols = [[355, 45, 36], [210, 40, 38], [48, 55, 46], [140, 30, 34]];
      for (let i = 0; i < 14; i++) {
        const bx = x - 76 + (i % 7) * 25, by = top + 66 + Math.floor(i / 7) * 40, col = cols[Math.floor(r() * 4)];
        if (r() < 0.3) { c.fillStyle = P.hsl(col[0], 30, 22); P.dab(c, bx, by + 8, 5, 3, r()); continue; } // limp and deflated
        c.fillStyle = P.hsl(col[0], col[1], col[2]); P.dab(c, bx, by, 10, 12, 0);
        c.fillStyle = 'rgba(255,255,255,0.25)'; P.dab(c, bx + 3, by - 4, 3, 4, 0);
      }
    },
    game_rings(c, r, x, top, y) {
      for (let row = 0; row < 3; row++) {
        for (let i = 0; i < 7; i++) {
          const bx = x - 84 + i * 28 + (row % 2) * 10, by = y - 60 - row * 16, hue = [140, 30, 200][Math.floor(r() * 3)];
          c.fillStyle = P.hsl(hue, 35, 22 + row * 3); c.fillRect(bx - 5, by - 22, 10, 22); c.fillRect(bx - 2, by - 32, 4, 12);
          c.fillStyle = 'rgba(200,230,255,0.25)'; c.fillRect(bx + 1, by - 20, 2, 14);
        }
      }
    },
    game_cans(c, r, x, top, y) {
      c.fillStyle = P.hsl(28, 30, 16); c.fillRect(x - 70, y - 78, 140, 8);
      const pos = [[-36, 0], [0, 0], [36, 0], [-18, 1], [18, 1], [0, 2]];
      for (const [dx, row] of pos) {
        const cx = x + dx, cy = y - 78 - row * 34;
        c.fillStyle = P.hsl(210, 8, 40); c.fillRect(cx - 14, cy - 32, 28, 32);
        c.fillStyle = P.hsl(210, 10, 58, 0.6); c.fillRect(cx + 4, cy - 30, 4, 28);
        c.fillStyle = P.hsl(355, 40, 30); c.fillRect(cx - 14, cy - 22, 28, 6);
      }
    },
    game_star(c, r, x, top, y) {
      for (let i = 0; i < 3; i++) {
        const tx = x - 70 + i * 70, ty = top + 90;
        c.fillStyle = P.hsl(45, 25, 70, 0.9); c.fillRect(tx - 24, ty - 24, 48, 48);
        c.fillStyle = P.hsl(355, 60, 38); star(c, tx, ty, 16, 7);
        c.fillStyle = 'rgba(20,10,8,0.8)'; for (let k = 0; k < 6; k++) P.dab(c, tx + (r() - 0.5) * 30, ty + (r() - 0.5) * 30, 1.6, 1.6, 0);
      }
      c.strokeStyle = P.hsl(30, 20, 14); c.lineWidth = 5; c.beginPath(); c.moveTo(x + 40, y - 52); c.lineTo(x + 90, y - 62); c.stroke();
    },
  };

  function star(c, x, y, R, r) {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r : R;
      c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    c.closePath(); c.fill();
  }

  for (const g of GAMES) {
    g.decor = DECOR[g.id];
    addObject('ground', g.x - 140, g.x + 140, (c, r) => booth(c, r, g));
    World.SPOTS.push({ id: g.id, x: g.x, y: 470 });
  }

  // entrance arch
  addObject('ground', ARCH_X - 150, ARCH_X + 150, (c, r) => {
    const y = groundY(ARCH_X) + 6;
    for (const px of [ARCH_X - 110, ARCH_X + 110]) {
      P.shadow(c, px, y + 2, 26, 5);
      P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(px - 9, y - 250, 18, 250); }, [px - 9, y - 250, 18, 250], [40, 25, 55],
        { ang: 1.57, len: 14, w: 2, lf: qx => (qx - px) * 1.5 });
      c.strokeStyle = P.hsl(355, 45, 32, 0.9); c.lineWidth = 5;
      for (let sy = y - 240; sy < y; sy += 26) { c.beginPath(); c.moveTo(px - 9, sy + 12); c.lineTo(px + 9, sy); c.stroke(); }
    }
    c.lineCap = 'round';
    for (const [rad, w, col] of [[128, 34, [25, 30, 12]], [128, 2, [42, 40, 45]]]) {
      c.strokeStyle = P.hsl(col[0], col[1], col[2]); c.lineWidth = w;
      c.beginPath(); c.arc(ARCH_X, y - 240, rad, Math.PI * 1.02, Math.PI * 1.98); c.stroke();
    }
    c.font = 'bold 17px Georgia, serif'; c.fillStyle = P.hsl(42, 45, 62, 0.88); c.textAlign = 'center'; c.textBaseline = 'middle';
    const text = 'VANE  HARVEST  FAIR';
    for (let i = 0; i < text.length; i++) {
      const a = Math.PI * 1.13 + (i / (text.length - 1)) * Math.PI * 0.74;
      c.save(); c.translate(ARCH_X + Math.cos(a) * 128, y - 240 + Math.sin(a) * 128); c.rotate(a + Math.PI / 2);
      if (i !== 7) c.fillText(text[i], 0, 0); // one letter fell off long ago
      c.restore();
    }
    c.textBaseline = 'alphabetic';
    c.fillStyle = P.hsl(42, 45, 40, 0.8); c.save(); c.translate(ARCH_X + 40, y - 6); c.rotate(0.4); c.font = 'bold 15px Georgia'; c.fillText('V', 0, 0); c.restore();
  });

  // ticket kiosk
  addObject('ground', 5640, 5740, (c, r) => {
    const x = 5690, y = groundY(x) + 6;
    P.shadow(c, x, y + 2, 50, 7);
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(x - 34, y - 120, 68, 120); }, [x - 34, y - 120, 68, 120], [355, 35, 24], { ang: 1.57, len: 18, w: 3, lf: px => (px - x) * 0.2 });
    P.paintFill(c, r, cc => { cc.beginPath(); cc.moveTo(x - 44, y - 118); cc.lineTo(x, y - 152); cc.lineTo(x + 44, y - 118); cc.closePath(); }, [x - 44, y - 152, 88, 36], [40, 30, 50], { ang: 0.4, len: 12, w: 3 });
    c.fillStyle = P.hsl(220, 30, 8); c.fillRect(x - 22, y - 96, 44, 34);
    c.font = 'bold 11px Georgia'; c.fillStyle = P.hsl(42, 45, 60, 0.85); c.textAlign = 'center'; c.fillText('TICKETS', x, y - 104);
    for (let i = 0; i < 8; i++) { c.fillStyle = P.hsl(5, 50, 35, 0.8); P.dab(c, x - 60 + r() * 120, y + 2 + r() * 20, 4, 2, r() * 3); } // stubs on the path
  });

  // a big top on the mid grounds
  const TENT_X = atDepth(6450, 0.66);
  addObject('mid', TENT_X - 300, TENT_X + 300, (c, r) => {
    const gy = World.ground.mid(TENT_X) + 6, peak = gy - 300, rad = 270;
    P.shadow(c, TENT_X, gy, rad * 1.05, 14, 0.5);
    const n = 12;
    for (let i = 0; i < n; i++) {
      const a0 = TENT_X - rad + (i / n) * rad * 2, a1 = a0 + (rad * 2) / n;
      const col = i % 2 ? [40, 22, 46] : [355, 32, 26];
      P.paintFill(c, r, cc => {
        cc.beginPath(); cc.moveTo(TENT_X, peak);
        cc.quadraticCurveTo((TENT_X + a0) / 2, peak + 90, a0, gy - 120);
        cc.lineTo(a0, gy); cc.lineTo(a1, gy); cc.lineTo(a1, gy - 120);
        cc.quadraticCurveTo((TENT_X + a1) / 2, peak + 90, TENT_X, peak); cc.closePath();
      }, [a0 - 10, peak, a1 - a0 + 20, gy - peak], col, { ang: 1.4, len: 26, w: 4, lf: (px) => (px - TENT_X) / rad * 8 });
    }
    // scalloped valance, dark doorway, tears
    for (let i = 0; i < 14; i++) {
      const vx = TENT_X - rad + i * (rad * 2 / 14);
      c.fillStyle = P.hsl(i % 2 ? 40 : 355, 25, i % 2 ? 40 : 22);
      c.beginPath(); c.moveTo(vx, gy - 122); c.lineTo(vx + rad * 2 / 14, gy - 122); c.quadraticCurveTo(vx + rad / 14, gy - 96, vx, gy - 122); c.fill();
    }
    c.fillStyle = 'rgba(6,6,14,0.95)';
    c.beginPath(); c.moveTo(TENT_X - 40, gy); c.quadraticCurveTo(TENT_X, gy - 150, TENT_X + 40, gy); c.fill();
    for (let i = 0; i < 6; i++) {
      const tx = TENT_X - 200 + r() * 400, ty = gy - 220 + r() * 160;
      c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx + 10 + r() * 14, ty + 18); c.lineTo(tx - 4, ty + 26); c.fill();
    }
    P.brush(c, r, [[TENT_X, peak], [TENT_X, peak - 50]], 3, [228, 18, 12], 1, { k: 2 });
    c.fillStyle = P.hsl(355, 40, 28);
    c.beginPath(); c.moveTo(TENT_X, peak - 50); c.lineTo(TENT_X + 34, peak - 44); c.lineTo(TENT_X + 22, peak - 38); c.lineTo(TENT_X + 30, peak - 32); c.lineTo(TENT_X, peak - 34); c.fill();
  });

  // a helter-skelter on the mid grounds
  const HS_X = atDepth(7850, 0.66);
  addObject('mid', HS_X - 90, HS_X + 90, (c, r) => {
    const gy = World.ground.mid(HS_X) + 6, top = gy - 330;
    P.shadow(c, HS_X, gy, 90, 8);
    P.paintFill(c, r, cc => { cc.beginPath(); cc.moveTo(HS_X - 50, gy); cc.lineTo(HS_X - 26, top); cc.lineTo(HS_X + 26, top); cc.lineTo(HS_X + 50, gy); cc.closePath(); },
      [HS_X - 50, top, 100, gy - top], [40, 22, 40], { ang: 1.5, len: 20, w: 3, lf: px => (px - HS_X) * 0.15 });
    c.fillStyle = P.hsl(355, 35, 24); c.beginPath(); c.moveTo(HS_X - 34, top); c.lineTo(HS_X, top - 50); c.lineTo(HS_X + 34, top); c.fill();
    c.lineWidth = 10; c.strokeStyle = P.hsl(48, 40, 30);
    c.beginPath();
    for (let t = 0; t <= 1; t += 0.01) {
      const yy = top + 20 + t * (gy - top - 30), wdt = 32 + t * 40;
      c.lineTo(HS_X + Math.sin(t * Math.PI * 9) * wdt, yy);
    }
    c.stroke();
  });

  // a broken roller coaster against the back woods
  const RC0 = atDepth(5600, 0.4), RC1 = atDepth(8200, 0.4);
  const rcY = x => 300 + Math.sin((x - RC0) * 0.012) * 50 + Math.sin((x - RC0) * 0.031) * 18;
  addObject('back', RC0 - 20, RC1 + 20, (c, r) => {
    const col = [228, 20, 10];
    for (let x = RC0; x < RC1; x += 34) {
      if (x > RC0 + (RC1 - RC0) * 0.55 && x < RC0 + (RC1 - RC0) * 0.62) continue; // the collapsed span
      const ty = rcY(x), gy = World.ground.back(x) + 6;
      P.brush(c, r, [[x, ty], [x, gy]], 2.4, col, 0.9, { k: 2 });
      P.brush(c, r, [[x, ty + 10], [x + 34, Math.min(gy, rcY(x + 34) + 60)]], 1.4, col, 0.7, { k: 1 });
    }
    for (const off of [0, 6]) {
      let pts = [];
      for (let x = RC0; x <= RC1; x += 8) {
        const gap = x > RC0 + (RC1 - RC0) * 0.56 && x < RC0 + (RC1 - RC0) * 0.61;
        if (gap) { if (pts.length > 1) P.brush(c, r, pts, 2.2, col, 1, { k: 2, rim: [214, 30, 34], rimA: 0.3 }); pts = []; continue; }
        pts.push([x, rcY(x) + off]);
      }
      if (pts.length > 1) P.brush(c, r, pts, 2.2, col, 1, { k: 2, rim: [214, 30, 34], rimA: 0.3 });
    }
  });

  // wheel boarding platform
  addObject('ground', WHEEL_X - 60, WHEEL_X + 60, (c, r) => {
    const y = groundY(WHEEL_X) + 6;
    P.shadow(c, WHEEL_X, y + 2, 60, 6);
    P.paintFill(c, r, cc => { cc.beginPath(); cc.rect(WHEEL_X - 50, y - 16, 100, 16); }, [WHEEL_X - 50, y - 16, 100, 16], [25, 25, 18], { ang: 0, len: 18, w: 3 });
    c.strokeStyle = P.hsl(228, 18, 10); c.lineWidth = 3;
    for (const px of [WHEEL_X - 46, WHEEL_X + 46]) { c.beginPath(); c.moveTo(px, y - 16); c.lineTo(px, y - 60); c.stroke(); }
    c.beginPath(); c.moveTo(WHEEL_X - 46, y - 56); c.lineTo(WHEEL_X + 46, y - 56); c.stroke();
    signBoard(c, r, WHEEL_X, y - 76, 120, 'THE WHEEL', 14);
  });
  World.SPOTS.push({ id: 'wheel', x: WHEEL_X, y: 470 });
  World.SPOTS.push({ id: 'barker', x: BARKER_X, y: 450 });
  World.SPOTS.push({ id: 'echo_carousel', x: CAROUSEL_X, y: 470 });
  World.addLamp(5340);
  World.addLamp(7800);
  for (const g of GAMES) World.LIGHTS.push({ x: g.x, y: groundY(g.x) - 150, r: 170, col: [255, 180, 100], flick: 0.6, pool: true });

  // ---------------------------------------------------------------- live drawing
  // v: { ctx, S, cam, camY, viewW, t, glow, lit (golden ticket), riding }
  const sx = (v, x, f) => x - v.cam * f;

  function bulb(v, x, y, on, size = 3) {
    const { ctx, S } = v;
    ctx.fillStyle = on ? 'rgba(255,214,140,0.95)' : 'rgba(40,36,30,0.9)';
    ctx.beginPath(); ctx.arc(x * S, y * S, size * S, 0, P.TAU); ctx.fill();
    if (on) {
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5;
      ctx.drawImage(v.glow.warm, (x - size * 6) * S, (y - size * 6) * S, size * 12 * S, size * 12 * S);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }
  }
  // a dying bulb: mostly dark, or mostly lit once the fair wakes
  const flicker = (v, i, lit) => {
    const n = Math.sin(v.t * (3 + (i % 5)) + i * 7.1) + Math.sin(v.t * 11.3 + i * 3.3) * 0.4;
    return lit ? n > -1.2 : n > 1.05 || i % 11 === 0;
  };

  function wheelAngle(v) { return v.wheelA; }

  function drawWheel(v) {
    const { ctx, S } = v;
    const hx = sx(v, atDepth(WHEEL_X, WHEEL_F), WHEEL_F), hy = WHEEL_HUB_Y + v.camY * WHEEL_F;
    if (hx < -WHEEL_R - 60 || hx > v.viewW + WHEEL_R + 60) return;
    const gy = World.ground.near(atDepth(WHEEL_X, WHEEL_F)) + 4 + v.camY * WHEEL_F;
    const iron = 'rgb(22,24,38)', rim = 'rgba(120,135,175,0.55)';
    ctx.save();
    ctx.lineCap = 'round';
    // A-frame legs
    for (const d of [-1, 1]) {
      ctx.strokeStyle = iron; ctx.lineWidth = 9 * S;
      ctx.beginPath(); ctx.moveTo(hx * S, hy * S); ctx.lineTo((hx + d * 150) * S, gy * S); ctx.stroke();
      ctx.lineWidth = 3 * S;
      for (let k = 1; k < 5; k++) {
        const t0 = k / 5, t1 = (k + 0.7) / 5;
        ctx.beginPath(); ctx.moveTo((hx + d * 150 * t0) * S, (hy + (gy - hy) * t0) * S); ctx.lineTo((hx - d * 20 + d * 150 * t1 * 0.6) * S, (hy + (gy - hy) * t1) * S); ctx.stroke();
      }
      ctx.strokeStyle = rim; ctx.lineWidth = 2 * S;
      ctx.beginPath(); ctx.moveTo((hx + 4) * S, hy * S); ctx.lineTo((hx + d * 150 + 4) * S, gy * S); ctx.stroke();
    }
    const a0 = wheelAngle(v), spokes = 16;
    // rims and spokes
    ctx.strokeStyle = iron; ctx.lineWidth = 7 * S;
    ctx.beginPath(); ctx.arc(hx * S, hy * S, WHEEL_R * S, 0, P.TAU); ctx.stroke();
    ctx.lineWidth = 4 * S;
    ctx.beginPath(); ctx.arc(hx * S, hy * S, WHEEL_R * 0.8 * S, 0, P.TAU); ctx.stroke();
    ctx.lineWidth = 2.5 * S;
    for (let i = 0; i < spokes; i++) {
      const a = a0 + (i / spokes) * P.TAU;
      ctx.beginPath(); ctx.moveTo(hx * S, hy * S); ctx.lineTo((hx + Math.cos(a) * WHEEL_R) * S, (hy + Math.sin(a) * WHEEL_R) * S); ctx.stroke();
      const b = a + P.TAU / spokes;
      ctx.beginPath();
      ctx.moveTo((hx + Math.cos(a) * WHEEL_R * 0.8) * S, (hy + Math.sin(a) * WHEEL_R * 0.8) * S);
      ctx.lineTo((hx + Math.cos(b) * WHEEL_R) * S, (hy + Math.sin(b) * WHEEL_R) * S); ctx.stroke();
    }
    // moonlight catches the upper right of the rim
    ctx.strokeStyle = rim; ctx.lineWidth = 2 * S;
    ctx.beginPath(); ctx.arc(hx * S, hy * S, (WHEEL_R + 3) * S, -Math.PI * 0.75, Math.PI * 0.1); ctx.stroke();
    ctx.fillStyle = iron; ctx.beginPath(); ctx.arc(hx * S, hy * S, 16 * S, 0, P.TAU); ctx.fill();
    ctx.fillStyle = rim; ctx.beginPath(); ctx.arc((hx + 4) * S, (hy - 4) * S, 5 * S, 0, P.TAU); ctx.fill();
    // bulbs along the rim
    for (let i = 0; i < 32; i++) {
      const a = a0 + (i / 32) * P.TAU;
      bulb(v, hx + Math.cos(a) * (WHEEL_R + 2), hy + Math.sin(a) * (WHEEL_R + 2), flicker(v, i, v.lit), 2.6);
    }
    // gondolas hang level and sway a little
    const cols = ['#5b2a2e', '#2f4a5c', '#5c4a24', '#3d2f4f'];
    for (let i = 0; i < 12; i++) {
      const a = a0 + (i / 12) * P.TAU, px = hx + Math.cos(a) * WHEEL_R, py = hy + Math.sin(a) * WHEEL_R;
      const sway = Math.sin(v.t * 1.4 + i) * 0.08 + (v.lit ? Math.sin(v.t * 3 + i) * 0.04 : 0);
      ctx.save();
      ctx.translate(px * S, py * S); ctx.rotate(sway); ctx.scale(S, S);
      ctx.strokeStyle = iron; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 12); ctx.stroke();
      ctx.fillStyle = cols[i % 4];
      ctx.beginPath(); ctx.moveTo(-20, 18); ctx.quadraticCurveTo(0, 6, 20, 18); ctx.lineTo(18, 44); ctx.quadraticCurveTo(0, 50, -18, 44); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(10,10,20,0.85)'; ctx.fillRect(-14, 22, 28, 9);
      ctx.fillStyle = 'rgba(160,175,215,0.35)'; ctx.fillRect(10, 20, 5, 22);
      if (v.riding && i === v.rideCar) { // the ghost rides in this one
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.9;
        ctx.drawImage(v.glow.cool, -22, 0, 44, 44);
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(225,238,255,0.95)'; ctx.beginPath(); ctx.arc(0, 18, 8, 0, P.TAU); ctx.fill();
        ctx.fillStyle = 'rgba(8,12,28,0.9)'; ctx.beginPath(); ctx.ellipse(1, 19, 4, 5, 0, 0, P.TAU); ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // the gondola the ghost rides, in screen space, for the camera and lighting
  function rideCarPos(v) {
    const hx = sx(v, atDepth(WHEEL_X, WHEEL_F), WHEEL_F), hy = WHEEL_HUB_Y + v.camY * WHEEL_F;
    const a = wheelAngle(v) + (v.rideCar / 12) * P.TAU;
    return [hx + Math.cos(a) * WHEEL_R, hy + Math.sin(a) * WHEEL_R + 30];
  }

  function horse(ctx, S, x, y, s, dir, phase, z) {
    ctx.save();
    ctx.translate(x * S, y * S); ctx.scale(s * S * dir, s * S);
    const shade = 0.55 + z * 0.25;
    ctx.fillStyle = `rgb(${Math.round(205 * shade)},${Math.round(196 * shade)},${Math.round(178 * shade)})`;
    ctx.beginPath(); ctx.ellipse(0, 0, 28, 12, 0, 0, P.TAU); ctx.fill();                 // body
    ctx.beginPath(); ctx.moveTo(18, -6); ctx.quadraticCurveTo(30, -30, 36, -34); ctx.lineTo(44, -28); ctx.lineTo(40, -22); ctx.quadraticCurveTo(32, -18, 26, 0); ctx.fill(); // neck & head
    ctx.lineWidth = 4; ctx.strokeStyle = ctx.fillStyle; ctx.lineCap = 'round';
    const k = Math.sin(phase) * 0.4;
    for (const [lx, a] of [[-18, 0.5 + k], [-12, 0.2 - k], [14, -0.5 - k], [20, -0.2 + k]]) {
      ctx.beginPath(); ctx.moveTo(lx, 6); ctx.lineTo(lx + Math.sin(a) * 18, 6 + Math.cos(a) * 18); ctx.stroke();
    }
    ctx.fillStyle = `rgba(110,40,45,${0.9 * shade})`; ctx.fillRect(-8, -12, 16, 6);      // chipped saddle
    ctx.strokeStyle = `rgba(80,60,40,${shade})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(34, -32); ctx.quadraticCurveTo(26, -40, 20, -20); ctx.stroke(); // mane
    ctx.restore();
  }

  function drawCarousel(v) {
    const { ctx, S } = v;
    const cx = sx(v, CAROUSEL_X, 1), base = groundY(CAROUSEL_X) + 2 + v.camY;
    if (cx < -220 || cx > v.viewW + 220) return;
    const R = 120, rot = v.t * (v.lit ? 0.45 : 0.12);
    // floor
    ctx.save();
    ctx.setTransform(S, 0, 0, S, 0, 0); P.shadow(ctx, cx, base + 2, R * 1.4, 16, 0.55); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#3a2a22';
    ctx.beginPath(); ctx.ellipse(cx * S, (base - 8) * S, (R + 14) * S, 24 * S, 0, 0, P.TAU); ctx.fill();
    ctx.fillStyle = '#5a4030';
    ctx.beginPath(); ctx.ellipse(cx * S, (base - 14) * S, (R + 10) * S, 20 * S, 0, 0, P.TAU); ctx.fill();
    const top = base - 190;
    const horses = [];
    for (let i = 0; i < 8; i++) {
      const a = rot + (i / 8) * P.TAU, z = Math.sin(a);
      horses.push({ i, x: cx + Math.cos(a) * R * 0.85, z, a });
    }
    const drawHorse = h => {
      const s = 0.75 + (h.z + 1) * 0.15, bob = Math.sin(v.t * (v.lit ? 3 : 1.2) + h.i * 1.3) * 12;
      const y = base - 70 - h.z * -10 + bob;
      ctx.strokeStyle = '#b89a5a'; ctx.lineWidth = 3 * S * s;
      ctx.beginPath(); ctx.moveTo(h.x * S, (top + 30) * S); ctx.lineTo(h.x * S, (base - 16 + h.z * 8) * S); ctx.stroke();
      horse(ctx, S, h.x, y, s, Math.cos(h.a) > 0 ? -1 : 1, v.t * 2 + h.i, (h.z + 1) / 2);
    };
    horses.filter(h => h.z < 0).sort((a, b) => a.z - b.z).forEach(drawHorse);
    // centre column with a cracked mirror panel
    ctx.fillStyle = '#4a3a30'; ctx.fillRect((cx - 22) * S, (top + 20) * S, 44 * S, (base - top - 34) * S);
    ctx.fillStyle = 'rgba(150,170,210,0.25)'; ctx.fillRect((cx - 14) * S, (top + 40) * S, 28 * S, 60 * S);
    horses.filter(h => h.z >= 0).sort((a, b) => a.z - b.z).forEach(drawHorse);
    // canopy
    ctx.fillStyle = '#5e2a2c';
    ctx.beginPath(); ctx.moveTo((cx - R - 24) * S, (top + 24) * S); ctx.lineTo(cx * S, (top - 46) * S); ctx.lineTo((cx + R + 24) * S, (top + 24) * S); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(205,190,160,0.5)';
    for (let i = 0; i < 6; i++) {
      const x0 = cx - R - 24 + i * ((R + 24) * 2 / 6) + 8;
      ctx.beginPath(); ctx.moveTo(cx * S, (top - 46) * S); ctx.lineTo(x0 * S, (top + 24) * S); ctx.lineTo((x0 + 14) * S, (top + 24) * S); ctx.fill();
    }
    for (let i = 0; i < 12; i++) {
      const x0 = cx - R - 24 + i * ((R + 24) * 2 / 12);
      ctx.fillStyle = i % 2 ? '#d8c8a0' : '#6e2c30';
      ctx.beginPath(); ctx.moveTo(x0 * S, (top + 22) * S); ctx.lineTo((x0 + (R + 24) * 2 / 12) * S, (top + 22) * S);
      ctx.quadraticCurveTo((x0 + (R + 24) / 12) * S, (top + 46) * S, x0 * S, (top + 22) * S); ctx.fill();
    }
    for (let i = 0; i < 14; i++) bulb(v, cx - R - 20 + i * ((R + 20) * 2 / 13), top + 22, flicker(v, i + 40, v.lit), 2.4);
    ctx.fillStyle = '#b89a5a'; ctx.beginPath(); ctx.arc(cx * S, (top - 50) * S, 6 * S, 0, P.TAU); ctx.fill();
    ctx.restore();
  }

  // string lights sagging between the booths
  function drawStrings(v) {
    const xs = [ARCH_X + 110, ...GAMES.map(g => g.x)];
    for (let k = 0; k < xs.length - 1; k++) {
      const a = xs[k], b = xs[k + 1];
      if (sx(v, b, 1) < -40 || sx(v, a, 1) > v.viewW + 40) continue;
      const ya = groundY(a) - 200 + v.camY, yb = groundY(b) - 200 + v.camY;
      const { ctx, S } = v;
      ctx.strokeStyle = 'rgba(15,15,22,0.9)'; ctx.lineWidth = 1.2 * S;
      ctx.beginPath();
      for (let i = 0; i <= 20; i++) {
        const t = i / 20, x = sx(v, a + (b - a) * t, 1), y = ya + (yb - ya) * t + Math.sin(t * Math.PI) * 40;
        i ? ctx.lineTo(x * S, y * S) : ctx.moveTo(x * S, y * S);
      }
      ctx.stroke();
      for (let i = 1; i < 12; i++) {
        const t = i / 12, x = sx(v, a + (b - a) * t, 1), y = ya + (yb - ya) * t + Math.sin(t * Math.PI) * 40 + 4;
        bulb(v, x, y, flicker(v, k * 12 + i, v.lit), 2.4);
      }
    }
  }

  // Mister Lamb, the barker: a pale ghost in a boater and a striped waistcoat.
  function drawBarker(v, talking, faceLeft) {
    const { ctx, S } = v;
    const x = sx(v, BARKER_X, 1), y = groundY(BARKER_X) + v.camY - 4 + Math.sin(v.t * 1.8) * 4;
    if (x < -80 || x > v.viewW + 80) return;
    ctx.save();
    ctx.setTransform(S, 0, 0, S, x * S, y * S);
    ctx.scale(faceLeft ? -1 : 1, 1);
    ctx.globalAlpha = 0.85;
    ctx.shadowColor = 'rgba(190,220,255,0.7)'; ctx.shadowBlur = 18 * S;
    const g = ctx.createLinearGradient(0, -150, 0, 0);
    g.addColorStop(0, 'rgba(225,235,250,0.95)'); g.addColorStop(1, 'rgba(150,175,215,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-20, -100); ctx.quadraticCurveTo(-26, -40, -18 + Math.sin(v.t * 3) * 3, 0);
    ctx.lineTo(18 + Math.sin(v.t * 3 + 1) * 3, 0); ctx.quadraticCurveTo(26, -40, 20, -100); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -114, 15, 0, P.TAU); ctx.fill();
    ctx.shadowBlur = 0;
    // striped waistcoat
    ctx.save(); ctx.beginPath(); ctx.rect(-17, -100, 34, 48); ctx.clip();
    for (let i = -20; i < 20; i += 8) { ctx.fillStyle = i % 16 === 0 ? 'rgba(150,40,50,0.7)' : 'rgba(240,225,190,0.5)'; ctx.fillRect(i, -100, 4, 48); }
    ctx.restore();
    ctx.fillStyle = 'rgba(30,20,20,0.6)'; ctx.fillRect(-4, -96, 8, 6); // bow tie
    // face
    ctx.fillStyle = 'rgba(10,14,30,0.85)';
    P.dab(ctx, -5, -116, 2, 2.4, 0); P.dab(ctx, 5, -116, 2, 2.4, 0);
    ctx.strokeStyle = 'rgba(40,30,30,0.8)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-8, -106); ctx.quadraticCurveTo(0, -110, 8, -106); ctx.stroke(); // moustache
    if (talking) { ctx.fillStyle = 'rgba(10,14,30,0.8)'; P.dab(ctx, 0, -101, 3, 1 + Math.abs(Math.sin(v.t * 16)) * 2, 0); }
    // straw boater
    ctx.fillStyle = 'rgba(210,180,120,0.95)';
    ctx.beginPath(); ctx.ellipse(0, -127, 22, 4, 0, 0, P.TAU); ctx.fill();
    ctx.fillRect(-13, -140, 26, 13);
    ctx.fillStyle = 'rgba(120,30,40,0.9)'; ctx.fillRect(-13, -132, 26, 4);
    // cane, tipped toward the booths
    ctx.strokeStyle = 'rgba(40,30,25,0.9)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(20, -70); ctx.lineTo(34 + Math.sin(v.t * 1.5) * 4, -2); ctx.stroke();
    ctx.beginPath(); ctx.arc(16, -72, 5, Math.PI, 0); ctx.stroke();
    ctx.restore();
  }

  // arch bulbs
  function drawArchBulbs(v) {
    const ax = sx(v, ARCH_X, 1), ay = groundY(ARCH_X) + 6 - 240 + v.camY;
    if (ax < -200 || ax > v.viewW + 200) return;
    for (let i = 0; i < 17; i++) {
      const a = Math.PI * 1.04 + (i / 16) * Math.PI * 0.92;
      bulb(v, ax + Math.cos(a) * 146, ay + Math.sin(a) * 146, flicker(v, i + 80, v.lit), 2.6);
    }
  }

  // light the darkness pass cuts around the live rides
  function lights(v) {
    const out = [];
    const ws = sx(v, atDepth(WHEEL_X, WHEEL_F), WHEEL_F);
    if (ws > -300 && ws < v.viewW + 300) out.push([ws, WHEEL_HUB_Y + v.camY * WHEEL_F, v.lit ? 300 : 120, v.lit ? 0.8 : 0.3]);
    const cs = sx(v, CAROUSEL_X, 1);
    if (cs > -200 && cs < v.viewW + 200) out.push([cs, groundY(CAROUSEL_X) - 120 + v.camY, v.lit ? 220 : 120, v.lit ? 0.8 : 0.4]);
    if (v.riding) { const [rx, ry] = rideCarPos(v); out.push([rx, ry, 200, 1]); }
    return out;
  }

  return {
    X0, X1, GAMES, BARKER_X, WHEEL_X, CAROUSEL_X,
    near: x => x > X0 - 200,
    drawBack(v) { drawWheel(v); },
    drawFront(v, barkerTalking, barkerFaceLeft) { drawStrings(v); drawArchBulbs(v); drawCarousel(v); drawBarker(v, barkerTalking, barkerFaceLeft); },
    lights, rideCarPos,
  };
})();
