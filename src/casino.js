'use strict';
// The Dead Man's Hand: a casino for ghosts. Blackjack, keno, video poker and
// roulette on the floor, and a bar. Games are plain DOM panels played with
// ghost chips; game.js owns the chip purse and opens/closes the overlay.
const Casino = (() => {
  const $ = id => document.getElementById(id);
  const SUITS = ['♠', '♥', '♦', '♣'];
  const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  const pick = a => a[Math.floor(Math.random() * a.length)];

  const MENU = [
    { id: 'pho', name: 'Pho', price: 15, line: 'A bowl of pho, steaming. The broth is the only warm thing in all of Vanehold. Your lantern gutters up to full.' },
    { id: 'peanuts', name: 'Peanuts', price: 3, line: 'A dish of salted peanuts, still crunchy after thirty years. The bartender will not say how.' },
    { id: 'cheese', name: 'Cheese and crackers', price: 8, line: 'A wedge of cheddar and six crackers, arranged like a tiny funeral procession. Delicious. Your lantern flares by a flame.' },
    { id: 'ginger', name: 'Ginger beer', price: 6, line: 'Ginger beer, sharp enough to wake the dead. You qualify. Your hands stop shaking.' },
    { id: 'gin', name: 'Gin and tonic', price: 10, line: 'A gin and tonic with a lime wheel and one small, floating eye. The room tilts, politely.' },
    { id: 'water', name: 'Tap water', price: 0, line: 'A glass of tap water. It tastes of old pipes and older chapels. The room stops tilting.' },
  ];
  const TENDER = ['Mr. Vigil polishes a glass that was never dirty.', 'Mr. Vigil: "The house takes only what the living leave behind."', 'Mr. Vigil: "Everyone here has been dead for hours, dear. Mind the carpet."'];
  const DEALER = ['Madame Mort shuffles with bony hands.', 'Madame Mort: "Place your bets. Nobody leaves with more than they came with."', 'Madame Mort: "The cards remember every hand."'];

  let opts = null, chips = 0, tab = 'bj', bet = 10, timer = 0, loans = 0;
  const g = { bj: null, kn: { picks: new Set(), drawn: null, msg: '' }, pk: null, rl: { kind: 'red', num: 7, res: null, msg: '', spin: false }, bar: { msg: TENDER[0], tried: new Set() } };
  let open = false;

  const deck = () => {
    const d = [];
    for (let s = 0; s < 4; s++) for (let r = 0; r < 13; r++) d.push({ r, s });
    for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
    return d;
  };
  const cardHtml = (c, o = {}) => c
    ? `<span class="card ${c.s === 1 || c.s === 2 ? 'red' : ''} ${o.held ? 'held' : ''}" ${o.act ? `data-act="${o.act}" data-i="${o.i}"` : ''}>${RANKS[c.r]}${SUITS[c.s]}</span>`
    : '<span class="card back">☠</span>';
  const bjValue = h => {
    let v = 0, aces = 0;
    for (const c of h) { if (c.r === 12) { aces++; v += 11; } else v += c.r >= 8 ? 10 : c.r + 2; }
    while (v > 21 && aces) { v -= 10; aces--; }
    return v;
  };

  function setChips(n) { chips = Math.max(0, Math.floor(n)); if (opts) opts.onChips(chips); const el = $('casino-chips'); if (el) el.textContent = `${chips} chips`; }
  const win = amt => { setChips(chips + amt); opts.sfx('win'); };
  const betBar = () => {
    bet = Math.max(5, Math.min(bet, Math.max(5, chips)));
    return `<div class="bet">Bet <button data-act="bet" data-d="-25">−25</button><button data-act="bet" data-d="-5">−5</button><b>${bet}</b><button data-act="bet" data-d="5">+5</button><button data-act="bet" data-d="25">+25</button></div>`;
  };
  const broke = () => chips < 5 ? '<p class="warn">You are out of chips. The bar tab is empty too. Mr. Vigil might spot you a loan.</p>' : '';

  // ---------------------------------------------------------------- blackjack
  function bjView() {
    const b = g.bj;
    if (!b) return `<p>${DEALER[0]}</p>${betBar()}${broke()}<button class="btn" data-act="bj-deal">Deal</button>`;
    const hide = b.phase === 'play';
    const dv = hide ? '?' : bjValue(b.d);
    let btns = '';
    if (b.phase === 'play') btns = `<button class="btn" data-act="bj-hit">Hit</button><button class="btn" data-act="bj-stand">Stand</button>${b.p.length === 2 && chips >= b.wager ? '<button class="btn" data-act="bj-double">Double</button>' : ''}`;
    else btns = `${betBar()}<button class="btn" data-act="bj-deal">Deal again</button>`;
    return `<p class="msg">${b.msg}</p>
      <div class="hand"><i>Madame Mort (${dv})</i>${b.d.map((c, i) => cardHtml(hide && i === 1 ? null : c)).join('')}</div>
      <div class="hand"><i>You (${bjValue(b.p)})</i>${b.p.map(c => cardHtml(c)).join('')}</div>
      <div class="row">${btns}</div>`;
  }
  function bjDeal() {
    if (chips < 5) return;
    bet = Math.min(bet, chips);
    setChips(chips - bet);
    const d = deck();
    g.bj = { deck: d, p: [d.pop(), d.pop()], d: [d.pop(), d.pop()], phase: 'play', wager: bet, msg: 'Cards on the felt.' };
    opts.sfx('thunk');
    if (bjValue(g.bj.p) === 21) bjFinish();
  }
  function bjFinish() {
    const b = g.bj;
    b.phase = 'done';
    const pv = bjValue(b.p);
    if (pv <= 21) while (bjValue(b.d) < 17) b.d.push(b.deck.pop());
    const dv = bjValue(b.d), natural = b.p.length === 2 && pv === 21;
    if (pv > 21) b.msg = 'Bust. The felt drinks your chips.';
    else if (natural && !(b.d.length === 2 && dv === 21)) { win(Math.floor(b.wager * 2.5)); b.msg = 'Blackjack! Madame Mort grinds her teeth. (Pays 3 to 2.)'; }
    else if (dv > 21 || pv > dv) { win(b.wager * 2); b.msg = dv > 21 ? 'Dealer busts. You win.' : 'You win.'; }
    else if (pv === dv) { setChips(chips + b.wager); b.msg = 'Push. Your bet comes back, a little colder.'; }
    else b.msg = 'The dealer wins.';
  }

  // ---------------------------------------------------------------- keno
  const KENO_PAY = { 1: { 1: 3 }, 2: { 2: 12 }, 3: { 2: 2, 3: 45 }, 4: { 2: 2, 3: 6, 4: 100 }, 5: { 2: 1, 3: 4, 4: 25, 5: 250 }, 6: { 3: 3, 4: 10, 5: 40, 6: 300 } };
  function knView() {
    const k = g.kn;
    let cells = '';
    for (let n = 1; n <= 40; n++) {
      const picked = k.picks.has(n), hit = k.drawn && k.drawn.has(n);
      cells += `<button class="kn ${picked ? 'picked' : ''} ${hit ? 'hit' : ''}" data-act="kn-pick" data-n="${n}">${n}</button>`;
    }
    const pays = k.picks.size ? Object.entries(KENO_PAY[k.picks.size]).map(([h, m]) => `${h} hits ×${m}`).join(' · ') : 'Pick 1 to 6 numbers.';
    return `<p class="msg">${k.msg || 'Pick up to six numbers. Ten of forty will be drawn.'}</p><div class="kgrid">${cells}</div><p class="pays">${pays}</p>${betBar()}${broke()}<div class="row"><button class="btn" data-act="kn-draw">Draw</button><button class="btn" data-act="kn-clear">Clear</button></div>`;
  }
  function knDraw() {
    const k = g.kn;
    if (!k.picks.size) { k.msg = 'Pick at least one number first.'; return; }
    if (chips < 5) return;
    bet = Math.min(bet, chips);
    setChips(chips - bet);
    const nums = Array.from({ length: 40 }, (_, i) => i + 1);
    for (let i = nums.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [nums[i], nums[j]] = [nums[j], nums[i]]; }
    k.drawn = new Set(nums.slice(0, 10));
    const hits = [...k.picks].filter(n => k.drawn.has(n)).length;
    const mult = KENO_PAY[k.picks.size][hits] || 0;
    if (mult) { win(bet * mult); k.msg = `${hits} hit${hits > 1 ? 's' : ''}! You win ${bet * mult} chips.`; }
    else { k.msg = `${hits} hit${hits === 1 ? '' : 's'}. Nothing.`; opts.sfx('lose'); }
  }

  // ---------------------------------------------------------------- video poker (jacks or better)
  function pkRank(h) {
    const cnt = {}; h.forEach(c => { cnt[c.r] = (cnt[c.r] || 0) + 1; });
    const counts = Object.values(cnt).sort((a, b) => b - a);
    const flush = h.every(c => c.s === h[0].s);
    const rs = h.map(c => c.r).sort((a, b) => a - b);
    const uniq = new Set(rs).size === 5;
    let straight = uniq && rs[4] - rs[0] === 4;
    if (uniq && rs.join() === '0,1,2,3,12') straight = true; // A-2-3-4-5
    const high = Object.keys(cnt).some(r => cnt[r] === 2 && +r >= 9);
    if (straight && flush && rs[0] === 8) return ['Royal flush', 250];
    if (straight && flush) return ['Straight flush', 50];
    if (counts[0] === 4) return ['Four of a kind', 25];
    if (counts[0] === 3 && counts[1] === 2) return ['Full house', 9];
    if (flush) return ['Flush', 6];
    if (straight) return ['Straight', 4];
    if (counts[0] === 3) return ['Three of a kind', 3];
    if (counts[0] === 2 && counts[1] === 2) return ['Two pair', 2];
    if (high) return ['Jacks or better', 1];
    return null;
  }
  function pkView() {
    const p = g.pk;
    if (!p) return `<p>${DEALER[1]}</p>${betBar()}${broke()}<p class="pays">Jacks or better pays 1 · two pair 2 · three 3 · straight 4 · flush 6 · full house 9 · four 25 · straight flush 50 · royal 250</p><button class="btn" data-act="pk-deal">Deal</button>`;
    const hand = p.hand.map((c, i) => cardHtml(c, p.phase === 'hold' ? { act: 'pk-hold', i, held: p.held[i] } : { held: false })).join('');
    const foot = p.phase === 'hold' ? '<button class="btn" data-act="pk-draw">Draw</button>' : `${betBar()}<button class="btn" data-act="pk-deal">Deal again</button>`;
    return `<p class="msg">${p.msg}</p><div class="hand">${hand}</div>${p.phase === 'hold' ? '<p class="pays">Tap cards to hold them.</p>' : ''}<div class="row">${foot}</div>`;
  }
  function pkDeal() {
    if (chips < 5) return;
    bet = Math.min(bet, chips);
    setChips(chips - bet);
    const d = deck();
    g.pk = { deck: d, hand: [d.pop(), d.pop(), d.pop(), d.pop(), d.pop()], held: [false, false, false, false, false], phase: 'hold', wager: bet, msg: 'Choose what to keep.' };
    opts.sfx('thunk');
  }
  function pkDraw() {
    const p = g.pk;
    p.hand = p.hand.map((c, i) => (p.held[i] ? c : p.deck.pop()));
    p.phase = 'done';
    const r = pkRank(p.hand);
    if (r) { win(p.wager * r[1]); p.msg = `${r[0]}! You win ${p.wager * r[1]} chips.`; } else { p.msg = 'Nothing. The deck smiles.'; opts.sfx('lose'); }
  }

  // ---------------------------------------------------------------- roulette
  const RL_KINDS = [
    ['red', 'Red', 1], ['black', 'Black', 1], ['odd', 'Odd', 1], ['even', 'Even', 1], ['low', '1–18', 1], ['high', '19–36', 1],
    ['d1', '1st dozen', 2], ['d2', '2nd dozen', 2], ['d3', '3rd dozen', 2], ['num', 'Single number', 35],
  ];
  const rlWins = (kind, n, num) => {
    if (kind === 'num') return n === num;
    if (n === 0) return false;
    switch (kind) {
      case 'red': return REDS.has(n);
      case 'black': return !REDS.has(n);
      case 'odd': return n % 2 === 1;
      case 'even': return n % 2 === 0;
      case 'low': return n <= 18;
      case 'high': return n >= 19;
      case 'd1': return n <= 12;
      case 'd2': return n > 12 && n <= 24;
      default: return n > 24;
    }
  };
  const rlColor = n => (n === 0 ? 'green' : REDS.has(n) ? 'red' : 'black');
  function rlView() {
    const r = g.rl;
    const kinds = RL_KINDS.map(([k, label, pay]) => `<button class="opt ${r.kind === k ? 'on' : ''}" data-act="rl-kind" data-k="${k}">${label} <small>${pay}:1</small></button>`).join('');
    const num = r.kind === 'num' ? `<div class="bet">Number <button data-act="rl-num" data-d="-1">−</button><b>${r.num}</b><button data-act="rl-num" data-d="1">+</button></div>` : '';
    const wheel = `<div class="wheel ${rlColor(r.res ?? 0)} ${r.spin ? 'spin' : ''}">${r.res === null ? '·' : r.res}</div>`;
    return `${wheel}<p class="msg">${r.msg || 'Choose a bet and spin the wheel.'}</p><div class="opts">${kinds}</div>${num}${betBar()}${broke()}<div class="row"><button class="btn" data-act="rl-spin" ${r.spin ? 'disabled' : ''}>Spin</button></div>`;
  }
  function rlSpin() {
    const r = g.rl;
    if (r.spin || chips < 5) return;
    bet = Math.min(bet, chips);
    const wager = bet;
    setChips(chips - wager);
    r.spin = true; r.msg = 'The wheel clatters…';
    let n = 0;
    const final = Math.floor(Math.random() * 37);
    clearInterval(timer);
    timer = setInterval(() => {
      n++;
      r.res = Math.floor(Math.random() * 37);
      opts.sfx('thunk');
      if (n >= 18) {
        clearInterval(timer); timer = 0;
        r.res = final; r.spin = false;
        const pay = RL_KINDS.find(k => k[0] === r.kind)[2];
        if (rlWins(r.kind, final, r.num)) { win(wager * (pay + 1)); r.msg = `${final} ${rlColor(final)}. You win ${wager * pay} chips!`; }
        else { r.msg = `${final} ${rlColor(final)}. The house collects.`; opts.sfx('lose'); }
      }
      if (open) render();
    }, 90);
  }

  // ---------------------------------------------------------------- the bar
  function barView() {
    const items = MENU.map(m => `<button class="opt" data-act="bar-buy" data-id="${m.id}">${m.name} <small>${m.price ? m.price + ' chips' : 'free'}</small></button>`).join('');
    const loan = chips < 5 && loans < 3 ? '<button class="btn" data-act="bar-loan">Ask Mr. Vigil for a loan</button>' : '';
    return `<p class="msg">${g.bar.msg}</p><div class="opts">${items}</div><div class="row">${loan}</div>`;
  }
  function barBuy(id) {
    const m = MENU.find(x => x.id === id);
    if (chips < m.price) { g.bar.msg = `Mr. Vigil: "That's ${m.price} chips, dear. You have ${chips}."`; return; }
    setChips(chips - m.price);
    g.bar.msg = m.line; g.bar.tried.add(id);
    opts.sfx('clink');
    opts.onOrder(id, g.bar.tried);
  }

  // ---------------------------------------------------------------- shell
  const TABS = [['bj', 'Blackjack'], ['kn', 'Keno'], ['pk', 'Poker'], ['rl', 'Roulette'], ['bar', 'The Bar']];
  function render() {
    if (!open) return;
    const view = { bj: bjView, kn: knView, pk: pkView, rl: rlView, bar: barView }[tab]();
    $('casino-tabs').innerHTML = TABS.map(([k, label]) => `<button class="${k === tab ? 'on' : ''}" data-act="tab" data-t="${k}">${label}</button>`).join('');
    $('casino-main').innerHTML = view;
    $('casino-chips').textContent = `${chips} chips`;
  }
  function click(e) {
    const t = e.target.closest('[data-act]');
    if (!t || !open) return;
    const a = t.dataset.act;
    if (g.rl.spin && a !== 'tab') return;
    if (a === 'tab') { tab = t.dataset.t; if (tab === 'bar') g.bar.msg = pick(TENDER); }
    else if (a === 'bet') bet = Math.max(5, Math.min(Math.max(5, chips), bet + +t.dataset.d));
    else if (a === 'bj-deal') bjDeal();
    else if (a === 'bj-hit') { const b = g.bj; b.p.push(b.deck.pop()); opts.sfx('thunk'); if (bjValue(b.p) >= 21) bjFinish(); }
    else if (a === 'bj-stand') bjFinish();
    else if (a === 'bj-double') { const b = g.bj; setChips(chips - b.wager); b.wager *= 2; b.p.push(b.deck.pop()); bjFinish(); }
    else if (a === 'kn-pick') { const n = +t.dataset.n, k = g.kn; if (k.drawn) { k.drawn = null; k.msg = ''; } if (k.picks.has(n)) k.picks.delete(n); else if (k.picks.size < 6) k.picks.add(n); }
    else if (a === 'kn-clear') { g.kn.picks.clear(); g.kn.drawn = null; g.kn.msg = ''; }
    else if (a === 'kn-draw') knDraw();
    else if (a === 'pk-deal') pkDeal();
    else if (a === 'pk-hold') { const p = g.pk; p.held[+t.dataset.i] = !p.held[+t.dataset.i]; }
    else if (a === 'pk-draw') pkDraw();
    else if (a === 'rl-kind') g.rl.kind = t.dataset.k;
    else if (a === 'rl-num') g.rl.num = (g.rl.num + 37 + +t.dataset.d) % 37;
    else if (a === 'rl-spin') rlSpin();
    else if (a === 'bar-buy') barBuy(t.dataset.id);
    else if (a === 'bar-loan') { loans++; setChips(chips + 20); g.bar.msg = 'Mr. Vigil slides a stack of chips across the bar. "Pay me back in the next life."'; opts.sfx('clink'); }
    render();
  }

  function init() {
    if (init.done) return;
    init.done = true;
    $('casino-main').addEventListener('click', click);
    $('casino-tabs').addEventListener('click', click);
    $('casino-close').addEventListener('click', () => close());
  }
  function start(o) {
    init();
    opts = o; chips = o.chips; open = true;
    g.bj = null; g.pk = null; g.kn = { picks: new Set(), drawn: null, msg: '' }; g.rl.res = null; g.rl.msg = ''; g.rl.spin = false;
    g.bar = { msg: TENDER[0], tried: o.tried ? new Set(o.tried) : new Set() };
    loans = 0;
    tab = o.tab || 'bj';
    $('casino').classList.add('show');
    render();
  }
  function close() {
    if (!open) return;
    open = false; clearInterval(timer); timer = 0;
    $('casino').classList.remove('show');
    const cb = opts && opts.onClose; if (cb) cb(chips);
  }
  return { start, close, isOpen: () => open, MENU };
})();
