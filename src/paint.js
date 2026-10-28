'use strict';
// Painterly brush toolkit. Everything is drawn from seeded randomness so that
// a scene object renders identically no matter which cache chunk asks for it.
const P = (() => {
  const TAU = Math.PI * 2;

  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hash(...ns) {
    let h = 2166136261 >>> 0;
    for (const n of ns) {
      h ^= Math.floor(n) | 0;
      h = Math.imul(h, 16777619) >>> 0;
      h ^= h >>> 13;
    }
    return h >>> 0;
  }

  // Smooth 1D value noise in [0,1].
  function noise(x, seed = 0) {
    const i = Math.floor(x), f = x - i;
    const a = rng(hash(i, seed))(), b = rng(hash(i + 1, seed))();
    const u = f * f * (3 - 2 * f);
    return a + (b - a) * u;
  }

  function fbm(x, seed = 0, oct = 4) {
    let v = 0, amp = 0.5, fr = 1, norm = 0;
    for (let o = 0; o < oct; o++) {
      v += noise(x * fr, seed + o * 31) * amp;
      norm += amp; amp *= 0.5; fr *= 2.03;
    }
    return v / norm;
  }

  const hsl = (h, s, l, a = 1) =>
    `hsla(${h.toFixed(1)},${Math.max(0, Math.min(100, s)).toFixed(1)}%,${Math.max(0, Math.min(100, l)).toFixed(1)}%,${a})`;

  function dab(c, x, y, rx, ry, rot) {
    c.beginPath();
    c.ellipse(x, y, Math.max(0.2, rx), Math.max(0.2, ry), rot, 0, TAU);
    c.fill();
  }

  // A cluster of overlapping dabs: foliage, clouds, moss, flowers.
  function clump(c, r, x, y, rad, col, o = {}) {
    const n = o.n || Math.ceil((rad * rad) / 36) + 8;
    const a = o.a ?? 0.6, lv = o.lv ?? 10, hv = o.hv ?? 10, sq = o.sq ?? 0.75;
    const rot = o.rot ?? -0.4, size = o.size ?? 1;
    for (let i = 0; i < n; i++) {
      const ang = r() * TAU, d = Math.sqrt(r()) * rad;
      const px = x + Math.cos(ang) * d, py = y + Math.sin(ang) * d * sq;
      const sz = rad * (0.16 + r() * 0.22) * size;
      // darker toward the bottom-left, the side away from the moon
      const shade = o.shade ? ((px - x) / rad - (py - y) / rad) * o.shade : 0;
      c.globalAlpha = a * (0.55 + r() * 0.45);
      c.fillStyle = hsl(col[0] + (r() - 0.5) * hv, col[1], col[2] + (r() - 0.5) * lv + shade);
      dab(c, px, py, sz, sz * (0.4 + r() * 0.35), rot + (r() - 0.5) * 0.9);
    }
    if (o.hl) {
      // moon-lit rim on the upper right
      const hn = Math.ceil(n * 0.25);
      for (let i = 0; i < hn; i++) {
        const ang = -Math.PI * 0.25 + (r() - 0.5) * 1.6, d = rad * (0.55 + r() * 0.4);
        const px = x + Math.cos(ang) * d, py = y + Math.sin(ang) * d * sq;
        const sz = rad * (0.08 + r() * 0.12);
        c.globalAlpha = (o.hla ?? 0.5) * (0.4 + r() * 0.6);
        c.fillStyle = hsl(o.hl[0] + (r() - 0.5) * 10, o.hl[1], o.hl[2] + (r() - 0.5) * 8);
        dab(c, px, py, sz, sz * 0.5, rot + (r() - 0.5) * 0.6);
      }
    }
    c.globalAlpha = 1;
  }

  // A bristle brush stroke along a polyline: one body pass plus streaky hairs.
  function brush(c, r, pts, w, col, a = 0.85, o = {}) {
    const k = o.k || Math.max(3, Math.min(9, Math.round(w / 2)));
    const lv = o.lv ?? 14;
    c.lineCap = 'round'; c.lineJoin = 'round';
    const norms = pts.map((p, i) => {
      const q = pts[Math.min(pts.length - 1, i + 1)], pp = pts[Math.max(0, i - 1)];
      const dx = q[0] - pp[0], dy = q[1] - pp[1], m = Math.hypot(dx, dy) || 1;
      return [-dy / m, dx / m];
    });
    const along = (off, jit, taper) => {
      c.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const t = i / (pts.length - 1 || 1);
        const tp = taper ? 1 - t * taper : 1;
        const x = pts[i][0] + norms[i][0] * off * tp + (r() - 0.5) * jit;
        const y = pts[i][1] + norms[i][1] * off * tp + (r() - 0.5) * jit;
        if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.stroke();
    };
    const taper = o.taper || 0;
    c.globalAlpha = a * 0.8;
    c.strokeStyle = hsl(col[0], col[1], col[2]);
    c.lineWidth = w * (taper ? 1 - taper * 0.4 : 1);
    along(0, 0, 0);
    for (let b = 0; b < k; b++) {
      const off = (r() - 0.5) * w * 0.85;
      c.globalAlpha = a * (0.25 + r() * 0.55);
      c.strokeStyle = hsl(col[0] + (r() - 0.5) * 8, col[1], col[2] + (r() - 0.5) * lv);
      c.lineWidth = Math.max(0.5, (w / k) * (0.7 + r() * 1.1));
      along(off, 0.7, taper);
    }
    if (o.rim) {
      // moonlight catches the right edge of the stroke
      c.globalAlpha = o.rimA ?? 0.4;
      c.strokeStyle = hsl(o.rim[0], o.rim[1], o.rim[2]);
      c.lineWidth = Math.max(0.6, w * 0.22);
      along(w * 0.38 * Math.sign(norms[0][0] || 1), 0.5, taper);
    }
    c.globalAlpha = 1;
  }

  // Fill a path with a base colour, then lay directional strokes inside it.
  function paintFill(c, r, path, box, col, o = {}) {
    const [bx, by, bw, bh] = box;
    c.save();
    path(c);
    c.globalAlpha = 1;
    c.fillStyle = o.fill || hsl(col[0], col[1], col[2]);
    c.fill();
    c.clip();
    const n = o.n || Math.ceil((bw * bh) / (o.density || 160));
    const ang = o.ang ?? 0.25, len = o.len ?? 16, sw = o.w ?? 4, lv = o.lv ?? 12;
    c.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const x = bx + r() * bw, y = by + r() * bh;
      const L = len * (0.4 + r() * 0.9), aa = ang + (r() - 0.5) * (o.angJ ?? 0.4);
      const dl = o.lf ? o.lf(x, y) : 0;
      c.globalAlpha = (o.a ?? 0.35) * (0.4 + r() * 0.6);
      c.strokeStyle = hsl(col[0] + (r() - 0.5) * (o.hv ?? 8), col[1] + (r() - 0.5) * 6, col[2] + (r() - 0.5) * lv + dl);
      c.lineWidth = sw * (0.4 + r() * 0.9);
      const dx = Math.cos(aa) * L * 0.5, dy = Math.sin(aa) * L * 0.5;
      c.beginPath(); c.moveTo(x - dx, y - dy); c.lineTo(x + dx, y + dy); c.stroke();
    }
    c.restore();
    c.globalAlpha = 1;
  }

  // Soft contact shadow, pushed a little left: away from the moon in the upper right.
  function shadow(c, x, y, rx, ry, a = 0.5) {
    c.save();
    c.translate(x - rx * 0.22, y); c.scale(1, ry / rx);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, `rgba(2,3,10,${a})`); g.addColorStop(0.6, `rgba(2,3,10,${a * 0.45})`); g.addColorStop(1, 'rgba(2,3,10,0)');
    c.globalAlpha = 1; c.fillStyle = g;
    c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill();
    c.restore();
  }

  // ---------------------------------------------------------------- trees
  function tree(c, r, x, y, ht, o = {}) {
    const type = o.type || 'oak';
    const bark = o.bark || [230, 14, 12];
    const rim = o.rim || [205, 35, 62];
    const leaf = o.leaf || [18, 40, 22];
    const ends = [];
    const spread = type === 'dead' ? 1.15 : type === 'willow' ? 0.9 : 0.85;
    const depth = o.depth ?? (type === 'dead' ? 6 : 5);

    function br(x1, y1, len, ang, w, d) {
      const x2 = x1 + Math.cos(ang) * len, y2 = y1 + Math.sin(ang) * len;
      const bend = (r() - 0.5) * len * (type === 'dead' ? 0.4 : 0.22);
      const mx = (x1 + x2) / 2 + Math.cos(ang + Math.PI / 2) * bend;
      const my = (y1 + y2) / 2 + Math.sin(ang + Math.PI / 2) * bend;
      brush(c, r, [[x1, y1], [mx, my], [x2, y2]], w, bark, 0.95,
        { taper: 0.35, rim: w > 1.6 ? rim : null, rimA: o.rimA ?? 0.35, k: w > 6 ? 7 : 3 });
      if (d <= 0 || w < 0.9) { ends.push([x2, y2, w]); return; }
      const nb = 2 + (r() < (type === 'dead' ? 0.45 : 0.55) ? 1 : 0);
      for (let i = 0; i < nb; i++) {
        const t = nb === 1 ? 0 : i / (nb - 1) - 0.5;
        let na = ang + t * spread * 1.6 + (r() - 0.5) * 0.5;
        if (type === 'willow') na = na * 0.8 + (-Math.PI / 2) * 0.2 + (d < 2 ? 0.3 * Math.sign(t || 1) : 0);
        br(x2, y2, len * (0.6 + r() * 0.22), na, w * (0.58 + r() * 0.1), d - 1);
      }
      if (type === 'dead' && r() < 0.5 && d < 4) {
        const tw = ang + (r() < 0.5 ? -1 : 1) * (0.9 + r() * 0.5);
        brush(c, r, [[x2, y2], [x2 + Math.cos(tw) * len * 0.35, y2 + Math.sin(tw) * len * 0.35]], w * 0.4, bark, 0.8, { k: 2 });
      }
    }

    shadow(c, x, y + 2, ht * 0.2, ht * 0.03);
    // roots / flare at the base
    for (let i = 0; i < 4; i++) {
      const s = (i - 1.5) * ht * 0.03;
      brush(c, r, [[x + s * 0.2, y - ht * 0.06], [x + s * 1.4, y - ht * 0.01], [x + s * 2.6, y + 2]], ht * 0.025, bark, 0.9, { k: 3 });
    }
    br(x, y + 2, ht * (type === 'willow' ? 0.36 : 0.34), -Math.PI / 2 + (r() - 0.5) * 0.18, ht * 0.07, depth);

    if (type === 'oak' || type === 'willow') {
      // shadowed mass first, then mid tones, then moon-lit rims
      for (const [ex, ey] of ends) clump(c, r, ex - ht * 0.02, ey + ht * 0.02, ht * 0.12, [leaf[0], leaf[1], leaf[2] - 6], { a: 0.5, n: 10 });
      for (const [ex, ey] of ends) clump(c, r, ex, ey, ht * 0.1, leaf, { a: 0.6, n: 9, shade: 6, hl: o.leafHl, hla: 0.4 });
      if (type === 'willow') {
        c.lineCap = 'round';
        for (const [ex, ey] of ends) {
          const strands = 3 + Math.floor(r() * 3);
          for (let s = 0; s < strands; s++) {
            const sx = ex + (r() - 0.5) * ht * 0.08, L = ht * (0.25 + r() * 0.35);
            const sway = (r() - 0.5) * ht * 0.05;
            const lit = r() < 0.35;
            c.globalAlpha = 0.35 + r() * 0.35;
            c.strokeStyle = lit ? hsl(o.leafHl[0], o.leafHl[1], o.leafHl[2] - 6 + r() * 10) : hsl(leaf[0] + (r() - 0.5) * 10, leaf[1], leaf[2] + (r() - 0.5) * 10);
            c.lineWidth = 0.8 + r() * 1.8;
            c.beginPath(); c.moveTo(sx, ey);
            c.quadraticCurveTo(sx + sway, ey + L * 0.5, sx + sway * 0.4, Math.min(y - 4, ey + L));
            c.stroke();
          }
        }
        c.globalAlpha = 1;
      }
    }
    return ends;
  }

  function pine(c, r, x, y, ht, o = {}) {
    shadow(c, x, y + 1, ht * 0.18, ht * 0.025, 0.4);
    const col = o.col || [200, 25, 14];
    const rim = o.rim || [200, 30, 40];
    brush(c, r, [[x, y], [x + (r() - 0.5) * 3, y - ht]], Math.max(1.5, ht * 0.03), o.bark || [230, 15, 10], 0.9, { k: 2 });
    const tiers = Math.max(5, Math.round(ht / 9));
    for (let i = 0; i < tiers; i++) {
      const t = i / tiers;
      const ty = y - ht * 0.12 - t * ht * 0.9;
      const w = ht * 0.32 * (1 - t) + ht * 0.03;
      for (let s = -1; s <= 1; s += 2) {
        const pts = [[x, ty - 2], [x + s * w * 0.5, ty + w * 0.08], [x + s * w, ty + w * 0.22 + r() * 3]];
        brush(c, r, pts, Math.max(2, ht * 0.05 * (1.2 - t)), s > 0 ? [col[0], col[1], col[2] + 4] : col, 0.85,
          { taper: 0.5, k: 3, rim: s > 0 ? rim : null, rimA: o.rimA ?? 0.3 });
      }
    }
  }

  // Upward grass blades along a run of ground.
  function grass(c, r, x0, x1, yfn, col, o = {}) {
    const dens = o.dens ?? 0.6, hmax = o.h ?? 14;
    c.lineCap = 'round';
    const n = Math.ceil((x1 - x0) * dens);
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * (x1 - x0), y = yfn(x) + (o.below ? r() * o.below : 0);
      const h = hmax * (0.3 + r() * 0.9), lean = (r() - 0.35) * h * 0.6;
      const lit = o.rim && r() < 0.3;
      c.globalAlpha = (o.a ?? 0.8) * (0.5 + r() * 0.5);
      c.strokeStyle = lit ? hsl(o.rim[0], o.rim[1], o.rim[2] + (r() - 0.5) * 8) : hsl(col[0] + (r() - 0.5) * 14, col[1], col[2] + (r() - 0.5) * 10);
      c.lineWidth = (o.w ?? 1.4) * (0.6 + r() * 0.8);
      c.beginPath(); c.moveTo(x, y);
      c.quadraticCurveTo(x + lean * 0.3, y - h * 0.6, x + lean, y - h);
      c.stroke();
    }
    c.globalAlpha = 1;
  }

  return { TAU, rng, hash, noise, fbm, hsl, dab, clump, brush, paintFill, shadow, tree, pine, grass };
})();
