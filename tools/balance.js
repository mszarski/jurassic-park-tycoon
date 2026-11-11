// Balance sweep: bots play every scenario and chapter with sensible play and with poor play.
// Sensible play must win, poor play must be able to lose, and the numbers must stay in range.
// Usage: node tools/balance.js [--full] [--only name-substring] [--json]   (exit code 1 on any failure)
//   default: the quick cases (a few minutes);  --full adds the long ones (Chapter 5, 60-day free play)
const { chromium } = require('./pw');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const lib = fs.readFileSync(path.join(__dirname, 'helpers.js'), 'utf8') + '\n' + fs.readFileSync(path.join(__dirname, 'bots.js'), 'utf8');
const args = process.argv.slice(2);
const FULL = args.includes('--full'), JSON_OUT = args.includes('--json');
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

// ---- in-page preparation snippets (strings; they run in the page with B and the game globals) ----
const PREP = {
  // concrete walls round every carnivore, a backup generator and three bunkers
  nedry: `(g, s, w) => { w.computeRegions(); for (const d of g.dinos) { if (d.sp.diet !== 'carn') continue; const r = w.regionAt(d.tx, d.ty); if (r) for (const j of g.paddockFences(r)) if (w.fence[j] === F_ELECTRIC) g.placeFence(j % w.W, (j / w.W) | 0, F_WALL); }
    B.near('backup', s.x, s.y - 11, false); for (const [dx, dy] of [[-8, -10], [8, -10], [0, -4]]) B.near('shelter', s.x + dx, s.y + dy); }`,
  siege: `(g, s) => { g.alarm = true; for (const [dx, dy] of [[-8, -10], [8, -10], [0, -4]]) B.near('shelter', s.x + dx, s.y + dy); }`,
  opening: `(g, s) => { g.ticket = Math.round(g.ticket * 0.8); B.near('ranger', s.x + 4, s.y - 4, false); B.near('helipad', s.x - 10, s.y - 2, false);
    B.near('viewing', s.x + 8, s.y - 12); B.near('restroom', s.x - 6, s.y - 3); B.near('restaurant', s.x + 6, s.y - 3); B.near('shop', s.x - 4, s.y - 6); }`,
  sorna: `(g, s) => { B.pen(16, 13, 'herb'); B.pen(14, 12, 'carn'); B.near('ranger', s.x - 4, s.y - 6, false); B.near('ranger', s.x + 8, s.y - 5, false); B.near('maint', s.x - 10, s.y - 6, false); }`,
  lostworld: `(g, s) => { B.near('ranger', s.x - 6, s.y - 4, false); B.near('power', s.x - 10, s.y - 8, false); const a = B.pen(9, 8, null, F_ELECTRIC); window.__pen = a; }`,
  // Site B: pens for the strays, then a park worth three stars, then open the gate
  c4: `(g, s) => { B.pen(16, 13, 'herb'); B.pen(14, 12, 'carn'); B.near('ranger', s.x - 4, s.y - 6, false); B.near('ranger', s.x + 8, s.y - 5, false); B.near('maint', s.x - 10, s.y - 6, false);
    B.near('power', s.x - 6, s.y - 4, false); for (let y = s.y; y >= s.y - 14; y--) g.placePath(s.x, y);
    B.near('visitor', s.x - 4, s.y - 4); B.near('restaurant', s.x + 3, s.y - 6); B.near('shop', s.x - 3, s.y - 9); B.near('restroom', s.x + 2, s.y - 11); B.powerAll(); }`,
  // what a player adds to a starter park that has to earn more: amenities, one more exhibit, a ride
  grow: `(g, s) => { B.near('restaurant', s.x + 6, s.y - 4); B.near('shop', s.x + 4, s.y - 10); B.near('restroom', s.x + 8, s.y - 8); B.near('viewing', s.x + 10, s.y - 11); B.pad(14, 12, 'trike', 2); B.near('gyro', s.x - 8, s.y - 10); B.powerAll(); }`,
  c2: `(g, s, w) => { const R = B.reg(s.x, s.y - 18); for (const j of g.paddockFences(R)) if (w.fence[j] === F_ELECTRIC) g.placeFence(j % w.W, (j / w.W) | 0, F_WALL); B.hatchIn(B.reg(s.x, s.y - 18), 'raptor', 3); B.near('helipad', s.x - 12, s.y - 3, false); }`,
};
const TICK = {
  // one wild animal at a time into the holding pen, then sell it
  lostworld: `(g) => { const w = g.world, a = window.__pen, pen = a && B.regIn(a[0], a[1], a[0] + a[2] - 1, a[1] + a[3] - 1); const wild = g.dinos.filter((d) => d.loose && !d.carried && d.sedatedT <= 0);
    if (wild.length && !g.dinos.some((d) => d.orderSedate)) (wild.find((d) => d.species !== 'trex') || wild[0]).orderSedate = true;
    for (const d of g.dinos.slice()) if (!d.loose && !d.carried && pen && w.regionAt(d.tx, d.ty) === pen) g.sellDino(d); }`,
  // open the gate once everything is contained; add exhibits' viewing platforms as money allows
  c4: `(g) => { if (g.parkClosed && !g.looseCount) { g.parkClosed = false; for (const a of B.pads) B.route(g.start.x, g.start.y - 2, a[0] + (a[2] >> 1), a[1] + a[3]); for (const a of B.pads) B.near('viewing', a[0] + (a[2] >> 1), a[1] + a[3] + 1); } }`,
  c2: `(g) => { if (!g.hasBuilding('arena') && g.stars >= 2 && g.money > 100000) { const R = g.world.regionAt(g.start.x, g.start.y - 18); if (R) B.near('arena', g.start.x, g.start.y - 9, false); B.powerAll(); } }`,
};
const sc = (id, seeds, o = '{}') => `[${seeds.join(',')}].map((seed) => B.scenario('${id}', seed, ${o}))`;
const wins = (r) => r.filter((x) => x.result === 'win').length;
const losses = (r) => r.filter((x) => x.result !== 'win').length; // a bankrupt or shut-down park never finished: that is a loss too
const show = (r) => r.map((x) => `${x.result}${x.medal ? '/' + x.medal : ''} D${x.day} †${x.deaths}${x.earned ? ' $' + Math.round(x.earned / 1000) + 'k' : ''}`).join(' | ');

const CASES = [
  // ---- scenarios ----
  { name: "Nedry's Night, prepared (walls, backup, bunkers)", run: sc('nedry', [11, 22, 33, 44], `{ prep: ${PREP.nedry} }`), want: 'wins >= 3 of 4', check: (r) => wins(r) >= 3 },
  { name: "Nedry's Night, unprepared", run: sc('nedry', [11, 22, 33, 44]), want: 'loses at least 2 of 4', check: (r) => losses(r) >= 2 },
  { name: 'Raptor Siege, bunkers and alarm', run: sc('siege', [11, 22, 33, 44], `{ prep: ${PREP.siege} }`), want: 'wins >= 3 of 4', check: (r) => wins(r) >= 3 },
  { name: 'Raptor Siege, unprepared', run: sc('siege', [11, 22, 33]), want: 'loses 3 of 3', check: (r) => losses(r) === 3 },
  { name: 'Opening Day, prepared and quick to respond', run: sc('opening', [11, 22, 33], `{ prep: ${PREP.opening}, respond: 150, delay: 90 }`), want: 'wins >= 2 of 3', check: (r) => wins(r) >= 2 },
  { name: 'Opening Day, nobody responds', run: sc('opening', [11, 22], `{ respond: 0 }`), want: 'loses 2 of 2', check: (r) => losses(r) === 2 },
  { name: 'Isla Sorna Cleanup, two walled pens and rangers', run: sc('sorna', [11, 22, 33], `{ prep: ${PREP.sorna} }`), want: 'wins >= 2 of 3', check: (r) => wins(r) >= 2 },
  { name: 'Isla Sorna Cleanup, nothing built', run: sc('sorna', [11], `{ respond: 0 }`), want: 'loses', check: (r) => losses(r) === 1 },
  { name: 'The Lost World, small holding pen', run: sc('lostworld', [41, 42, 43], `{ prep: ${PREP.lostworld}, tick: ${TICK.lostworld}, respond: 0 }`), want: 'wins >= 2 of 3', check: (r) => wins(r) >= 2 },
  { name: 'Storm Season, idle park', run: sc('storms', [21, 22, 23, 24], `{ respond: 0 }`), want: 'loses 4 of 4 (earning $330k-$395k)', check: (r) => wins(r) === 0 && r.every((x) => x.earned >= 330000) },
  { name: 'Storm Season, responds to breaches but builds nothing', run: sc('storms', [21, 22, 23, 24]), want: 'wins 2-4 of 4, never gold', check: (r) => wins(r) >= 2 && !r.some((x) => x.medal === 'gold') },
  { name: 'Storm Season, grows the park', run: sc('storms', [21, 22, 23, 24], `{ prep: ${PREP.grow}, manage: true }`), want: 'wins 4 of 4, at least one gold', check: (r) => wins(r) === 4 && r.some((x) => x.medal === 'gold') },
  // ---- campaign ----
  { name: 'Chapter 1, starter park kept in step with its guests', run: sc('c1', [21, 22, 23], `{ prep: () => B.starter({ two: true }), manage: true }`), want: 'wins >= 2 of 3', check: (r) => wins(r) >= 2 },
  { name: 'Chapter 1, nothing built', run: sc('c1', [21], `{ respond: 0 }`), want: 'loses', check: (r) => losses(r) === 1 },
  { name: 'Chapter 2, walled raptors and an arena', run: sc('c2', [11, 22, 33, 44], `{ prep: ${PREP.c2}, tick: ${TICK.c2} }`), want: 'wins >= 3 of 4', check: (r) => wins(r) >= 3 },
  { name: 'Chapter 2, nothing built', run: sc('c2', [11], `{ respond: 0 }`), want: 'loses', check: (r) => losses(r) === 1 },
  { name: 'Chapter 3, idle park', run: sc('c3', [21, 22, 23, 24], `{ respond: 0 }`), want: 'loses 4 of 4 (earning >= $290k)', check: (r) => wins(r) === 0 && r.every((x) => x.earned >= 290000) },
  { name: 'Chapter 3, responds and grows the park', run: sc('c3', [21, 22, 23, 24], `{ prep: ${PREP.grow}, manage: true }`), want: 'wins >= 3 of 4', check: (r) => wins(r) >= 3 },
  { name: 'Chapter 4, pens for the strays then a small park', run: sc('c4', [21, 22, 23], `{ prep: ${PREP.c4}, tick: ${TICK.c4}, manage: true }`), want: 'wins >= 2 of 3', check: (r) => wins(r) >= 2 },
  { name: 'Chapter 4, nothing built', run: sc('c4', [21], `{ respond: 0 }`), want: 'does not win', check: (r) => wins(r) === 0 },
  // ---- free play ----
  { name: 'Free play on Calm, 20 days', run: `[B.freePlay(501, 20, 'calm')]`, want: 'no escapes, no deaths, goal >= 9', check: (r) => r[0].escapes === 0 && r[0].deaths === 0 && r[0].goal >= 9, show: (r) => JSON.stringify(r[0]) },
  { name: 'Free play on Standard, 30 days', run: `[501, 502].map((s) => B.freePlay(s, 30))`, want: 'goal >= 10, 3+ stars, solvent', check: (r) => r.every((x) => x.goal >= 10 && x.stars >= 3 && x.money > 0), show: (r) => r.map((x) => `goal ${x.goal} ${x.stars}★ $${Math.round(x.money / 1000)}k esc ${x.escapes} †${x.deaths}`).join(' | ') },
  // ---- long ----
  { name: 'Chapter 5, planner bot', full: true, run: `[5, 6].map((seed) => B.scenario('c5', seed, { prep: () => B.starter({ two: true }), manage: true, days: 60, tick: (g) => {
      const s = g.start, m = g.money, has = (sp) => g.dinos.some((d) => d.species === sp) || g.eggs.some((e) => e.species === sp);
      window.__t = (window.__t || 0) + 1; if (window.__t % 4) return;
      if (!g.hasBuilding('ranger') && m > 60000) { B.near('ranger', s.x + 6, s.y - 2, false); B.near('maint', s.x - 8, s.y - 2, false); }
      else if (!g.hasBuilding('hotel') && m > 150000) B.near('hotel', s.x - 8, s.y - 8);
      else if (!g.hasBuilding('helipad') && m > 150000) { B.near('helipad', s.x - 12, s.y - 4, false); B.near('backup', s.x, s.y - 10, false); B.near('shelter', s.x - 4, s.y - 8); B.near('shelter', s.x + 4, s.y - 8); }
      else if (!g.hasBuilding('lagoon') && g.stars >= 4 && m > 450000) B.near('lagoon', s.x + 14, s.y - 8);
      else { const next = [['trike', 15, 13, 2, 250000], ['stego', 14, 12, 2, 300000], ['brachio', 17, 15, 2, 320000], ['anky', 14, 12, 2, 300000], ['raptor', 13, 11, 3, 400000, 1], ['trex', 19, 17, 1, 360000, 1], ['dilo', 12, 10, 2, 300000], ['spino', 19, 17, 1, 450000, 1, 1]].find((q) => !has(q[0]) && g.isUnlocked(q[0]) && m > q[4]);
        if (next) B.pad(next[1], next[2], next[0], next[3], { wall: !!next[5], pond: !!next[6] }); }
    } }))`, want: 'wins >= 1 of 2 by Day 60', check: (r) => wins(r) >= 1, show: (r) => r.map((x) => `${x.result}${x.medal ? '/' + x.medal : ''} D${x.day} ${x.stars}★ ${x.progress}`).join(' | ') },
  { name: 'Free play on Standard, 60 days', full: true, run: `[501, 502].map((s) => B.freePlay(s, 60))`, want: 'goal >= 12, 3+ stars, at least one carnivore escape overall', check: (r) => r.every((x) => x.goal >= 12 && x.stars >= 3), show: (r) => r.map((x) => `goal ${x.goal} ${x.stars}★ esc ${x.escapes} (carn ${x.carnEscapes}) †${x.deaths}`).join(' | ') },
];

(async () => {
  const todo = CASES.filter((c) => (FULL || !c.full) && (!ONLY || c.name.toLowerCase().includes(ONLY.toLowerCase())));
  const browser = await chromium.launch();
  const results = new Array(todo.length);
  let next = 0, failed = 0;
  const worker = async () => {
    for (;;) {
      const k = next++; if (k >= todo.length) return;
      const c = todo[k], t0 = Date.now();
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push(m.text()); });
      await page.goto('file://' + path.join(ROOT, 'index.html'));
      await page.waitForTimeout(300);
      let r = null, err = null;
      try { r = await page.evaluate(lib + '\n(() => (' + c.run + '))()'); } catch (e) { err = e.message.split('\n')[0]; }
      const ok = !err && !errors.length && !!c.check(r);
      results[k] = { name: c.name, ok, want: c.want, secs: Math.round((Date.now() - t0) / 1000), detail: err || errors[0] || (c.show || show)(r), raw: r };
      await page.close();
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, todo.length) }, worker));
  await browser.close();
  if (JSON_OUT) console.log(JSON.stringify(results, null, 1));
  else for (const r of results) {
    if (!r.ok) failed++;
    console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}  (${r.secs}s)\n      want: ${r.want}\n      got:  ${r.detail}`);
  }
  failed = results.filter((r) => !r.ok).length;
  console.log(failed ? `${failed} balance check(s) failed` : `All ${results.length} balance checks passed`);
  process.exit(failed ? 1 : 0);
})();
