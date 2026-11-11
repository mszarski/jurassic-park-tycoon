// Playtest bots: park-building helpers and scripted players for balance runs.
// In-page script (needs helpers.js for nothing, but is safe to load after it). Defines window.B.
// Used by tools/balance.js; handy from smoke.js too:  node tools/smoke.js out.png my-script.js
window.B = {
  // ---------- building ----------
  // nearest spot to (tx, ty) where the building fits; needPath: one side must touch a footpath
  near(type, tx, ty, needPath = true) {
    const g = GAME, w = g.world, def = BUILDINGS[type];
    let best = null, bd = 1e9;
    for (let y = 2; y < w.H - def.h - 2; y++) for (let x = 2; x < w.W - def.w - 2; x++) {
      const d = (x - tx) * (x - tx) + (y - ty) * (y - ty);
      if (d >= bd || !w.canPlaceBuilding(type, x, y)) continue;
      if (needPath) {
        let touch = false;
        for (let k = 0; k < def.w && !touch; k++) touch = !!(w.path[w.idx(x + k, y - 1)] || w.path[w.idx(x + k, y + def.h)]);
        for (let k = 0; k < def.h && !touch; k++) touch = !!(w.path[w.idx(x - 1, y + k)] || w.path[w.idx(x + def.w, y + k)]);
        if (!touch) continue;
      }
      bd = d; best = { x, y };
    }
    return best ? g.placeBuilding(type, best.x, best.y) : null;
  },
  // a W x H patch of open ground as close to the gate as possible, clear of the rects in `avoid`
  findRect(W, H, avoid = []) {
    const g = GAME, w = g.world, s = g.start;
    const free = (x, y) => { const i = w.idx(x, y), t = w.terrain[i]; return (t === T_GRASS || t === T_FOREST || t === T_SAND) && !w.path[i] && !w.track[i] && !w.bld[i] && !w.fence[i]; };
    let best = null, bd = 1e9;
    for (let y = 3; y < w.H - H - 3; y++) for (let x = 3; x < w.W - W - 3; x++) {
      const d = Math.hypot(x + W / 2 - s.x, y + H / 2 - (s.y - 8));
      if (d >= bd) continue;
      if (avoid.some((a) => x < a[0] + a[2] + 3 && x + W + 3 > a[0] && y < a[1] + a[3] + 3 && y + H + 3 > a[1])) continue;
      let ok = true;
      for (let yy = y - 1; yy <= y + H && ok; yy++) for (let xx = x - 1; xx <= x + W && ok; xx++) ok = free(xx, yy);
      if (ok) { bd = d; best = [x, y, W, H]; }
    }
    return best;
  },
  fenceRect(x0, y0, x1, y1, type = F_ELECTRIC) {
    const g = GAME;
    for (let x = x0; x <= x1; x++) { g.placeFence(x, y0, type); g.placeFence(x, y1, type); }
    for (let y = y0 + 1; y < y1; y++) { g.placeFence(x0, y, type); g.placeFence(x1, y, type); }
  },
  // electric fence tiles with no power
  dead() {
    const w = GAME.world; w.computePower(GAME);
    const out = [];
    for (let i = 0; i < w.fence.length; i++) if (w.fence[i] === F_ELECTRIC && !w.fencePowered[i]) out.push([i % w.W, (i / w.W) | 0]);
    return out;
  },
  // chain pylons out from the powered area until every electric fence has power (or `max` are placed)
  pylons(max = 40) {
    const g = GAME, w = g.world, R = BUILDINGS.pylon.range;
    let placed = 0;
    for (let k = 0; k < max; k++) {
      const dead = this.dead(); if (!dead.length) break;
      let best = null, bs = 0;
      for (let y = 2; y < w.H - 2; y++) for (let x = 2; x < w.W - 2; x++) {
        if (!w.covered[w.idx(x, y)] || !w.canPlaceBuilding('pylon', x, y)) continue;
        let n = 0; for (const [fx, fy] of dead) if ((fx - x) * (fx - x) + (fy - y) * (fy - y) <= R * R) n++;
        if (n > bs) { bs = n; best = [x, y]; }
      }
      if (!best) {
        // nothing in reach yet: step one pylon toward the nearest dead fence
        const [fx, fy] = dead[0]; let bd = 1e9;
        for (let y = 2; y < w.H - 2; y++) for (let x = 2; x < w.W - 2; x++) {
          if (!w.covered[w.idx(x, y)] || !w.canPlaceBuilding('pylon', x, y)) continue;
          const d = (fx - x) * (fx - x) + (fy - y) * (fy - y); if (d < bd) { bd = d; best = [x, y]; }
        }
      }
      if (!best || !g.placeBuilding('pylon', best[0], best[1])) break;
      placed++;
    }
    return placed;
  },
  // bring power to buildings that sit outside the grid's coverage: chain pylons out from the powered area
  powerAll() {
    const g = GAME, w = g.world, R = BUILDINGS.pylon.range;
    w.computePower(g);
    for (const b of [...w.buildings.values()]) {
      if (!BUILDINGS[b.type].power) continue;
      for (let k = 0; k < 6 && !w.covered[w.idx(b.x, b.y)] && !w.covered[w.idx(b.x + b.w - 1, b.y + b.h - 1)]; k++) {
        let best = null, bd = 1e9;
        for (let y = 2; y < w.H - 2; y++) for (let x = 2; x < w.W - 2; x++) {
          if (!w.covered[w.idx(x, y)] || !w.canPlaceBuilding('pylon', x, y)) continue;
          const d = (b.x - x) * (b.x - x) + (b.y - y) * (b.y - y); if (d < bd) { bd = d; best = [x, y]; }
        }
        if (!best || !g.placeBuilding('pylon', best[0], best[1])) break;
        w.computePower(g);
      }
    }
  },
  reg(x, y) { const w = GAME.world; w.computeRegions(); return w.regionAt(x, y); },
  // the enclosed region inside a fenced rectangle (rocks or water may sit under any one tile)
  regIn(x0, y0, x1, y1) {
    const w = GAME.world; w.computeRegions();
    for (let y = y0 + 1; y < y1; y++) for (let x = x0 + 1; x < x1; x++) { const r = w.regionAt(x, y); if (r && !r.public) return r; }
    return null;
  },
  hatchIn(reg, sp, n) {
    const g = GAME, w = g.world; let k = 0;
    if (!reg) return 0;
    for (const t of reg.tiles) { if (k >= n) break; const x = t % w.W, y = (t / w.W) | 0; if (!g.canHatchAt(sp, x, y) && g.hatch(sp, x, y)) k++; }
    return k;
  },
  // lay a path to (x1, y1) from the nearest existing footpath that can reach it
  route(x0, y0, x1, y1) {
    const g = GAME, w = g.world;
    const from = [];
    for (let i = 0; i < w.path.length; i++) if (w.path[i]) from.push([i % w.W, (i / w.W) | 0]);
    from.sort((a, b) => Math.hypot(a[0] - x1, a[1] - y1) - Math.hypot(b[0] - x1, b[1] - y1));
    for (const [fx, fy] of [[x0, y0]].concat(from.filter((_, k) => k % 3 === 0).slice(0, 14))) {
      const r = w.route(fx, fy, x1, y1); if (!r) continue;
      let n = 0; for (const [x, y] of r) if (g.placePath(x, y)) n++;
      return n || 1;
    }
    return 0;
  },
  // an amenity beside a footpath somewhere out in the park, not piled up at the gate
  amenity(type) {
    const g = GAME, w = g.world, s = g.start, tiles = [];
    for (let i = 0; i < w.path.length; i++) if (w.path[i]) { const x = i % w.W, y = (i / w.W) | 0; if (Math.hypot(x - s.x, y - s.y) > 7) tiles.push([x, y]); }
    if (!tiles.length) return this.near(type, s.x, s.y - 8);
    // where the guests are, if anywhere
    const busy = g.guests.filter((gu) => !gu.hidden && Math.hypot(gu.x - s.x, gu.y - s.y) > 7);
    const t = busy.length && chance(0.6) ? [Math.floor(pick(busy).x), Math.floor(pick(busy).y)] : pick(tiles);
    return this.near(type, t[0], t[1]);
  },
  // an empty holding pen with a feeder for captured animals (smaller if the island is short of room)
  pen(W, H, diet, type = F_WALL) {
    const g = GAME; this.pads = this.pads || [];
    for (const f of [1, 0.8, 0.65, 0.5]) {
      const pw = Math.max(6, Math.round(W * f)), ph = Math.max(6, Math.round(H * f)), a = this.findRect(pw, ph, this.pads);
      if (!a) continue;
      this.pads.push(a); this.fenceRect(a[0], a[1], a[0] + pw - 1, a[1] + ph - 1, type);
      if (type === F_ELECTRIC) this.pylons();
      const R = this.regIn(a[0], a[1], a[0] + pw - 1, a[1] + ph - 1); if (R && diet) g.addFeeder(R, diet);
      return a;
    }
    return null;
  },
  // a fenced paddock with a feeder, cover and animals, a path to it and a viewing platform
  pad(W, H, sp, n, opts = {}) {
    const g = GAME, w = g.world, s = g.start;
    this.pads = this.pads || [];
    let a = null;
    for (const f of [1, 0.85, 0.72]) { a = this.findRect(Math.round(W * f), Math.round(H * f), this.pads); if (a) break; }
    if (!a) return null;
    this.pads.push(a);
    const [x, y, pw, ph] = a;
    this.fenceRect(x, y, x + pw - 1, y + ph - 1, opts.wall ? F_WALL : F_ELECTRIC);
    this.pylons();
    const inside = () => this.regIn(x, y, x + pw - 1, y + ph - 1);
    if (!inside()) return null;
    g.addFeeder(inside(), SPECIES[sp].diet === 'carn' ? 'carn' : 'herb');
    if (opts.pond) { for (let k = 0; k < 4; k++) g.digPond(x + 2 + (k % 2), y + 2 + (k >> 1)); }
    g.plantCover(inside(), 0.3);
    const got = this.hatchIn(inside(), sp, n);
    this.route(s.x, s.y - 2, x + (pw >> 1), y + ph);
    if (opts.view !== false) this.near('viewing', x + (pw >> 1), y + ph + 1);
    return { rect: a, hatched: got };
  },
  // the park most players have by the end of day one: two herbivore paddocks, power, hatchery, amenities
  starter(opts = {}) {
    const g = GAME, s = g.start, w = g.world;
    this.pads = [];
    let top = s.y; for (let y = s.y; y > s.y - 10; y--) if (w.path[w.idx(s.x, y)]) top = y;
    // the main street runs between the two paddocks and ends in a cross street beyond them, so the park can grow outward
    for (let y = top; y >= top - 19; y--) g.placePath(s.x, y);
    for (let x = s.x - 17; x <= s.x + 17; x++) g.placePath(x, top - 19);
    const mk = (x0) => { this.fenceRect(x0, top - 16, x0 + 11, top - 5); this.pads.push([x0, top - 16, 12, 12]); };
    mk(s.x - 14); if (opts.two) mk(s.x + 3);
    this.near('power', s.x - 6, s.y - 4, false); this.near('hatchery', s.x + 5, s.y - 5);
    this.near('visitor', s.x - 4, s.y - 4); this.near('restaurant', s.x + 3, top - 6); this.near('shop', s.x - 3, top - 9);
    this.near('restroom', s.x + 2, top - 11); this.near('viewing', s.x - 3, top - 13);
    this.pylons();
    const A = () => this.regIn(s.x - 14, top - 16, s.x - 3, top - 5), R2 = () => this.regIn(s.x + 3, top - 16, s.x + 14, top - 5);
    if (A()) { g.addFeeder(A(), 'herb'); this.hatchIn(A(), 'galli', 3); this.hatchIn(A(), 'para', 2); }
    if (opts.two && R2()) { g.addFeeder(R2(), 'herb'); this.hatchIn(R2(), 'para', 2); }
  },

  // ---------- playing ----------
  dangerLoose() { return GAME.creatures().some((d) => d.loose && !d.carried && d.sedatedT <= 0 && d.sp.danger >= 4); },
  // Run the current game until `until(g)` is truthy or `days` pass.
  //  respond: frames between RESPOND presses during a breach (0 = never); alarm: sound it for dangerous escapes
  //  manage: keep power, restrooms and restaurants in step with the park, like an attentive player
  play(opts = {}) {
    const g = GAME, w = g.world, s = g.start;
    const days = opts.days || 20, respond = opts.respond === undefined ? 150 : opts.respond;
    let i = 0, t0 = -1;
    while (g.day <= days && !g.gameOver && !(opts.until && opts.until(g))) {
      g.update(1 / 30); i++;
      if (g.pendingDecision) g.resolveDecision(DECISIONS[g.pendingDecision.id].choices.length - 1);
      if (respond) {
        if (g.looseCount && t0 < 0) t0 = i;
        if (!g.looseCount) t0 = -1;
        if (t0 >= 0 && (i - t0) % respond === (opts.delay || 60)) { g.respondToBreach(); if (opts.alarm !== false && this.dangerLoose()) g.alarm = true; }
        if (g.alarm && !this.dangerLoose()) g.alarm = false;
        if (opts.repair !== false && i % 300 === 0 && g.countBrokenFences()) g.repairFences();
      }
      if (opts.manage && i % 300 === 0) this.manage();
      if (opts.tick && i % 75 === 0) opts.tick(g, i);
    }
    return i;
  },
  manage() {
    const g = GAME, w = g.world, s = g.start, n = g.guests.length;
    if (w.power.outage <= 0 && w.power.demand > w.power.supply * 0.85 && g.money > 90000) { this.near('power', s.x + randi(-18, 18), s.y - randi(6, 28), false); this.pylons(); }
    if (g.money > 40000 && n > 70 * g.buildingsOfType('restroom').length) this.amenity('restroom');
    if (g.money > 60000 && n > 90 * g.buildingsOfType('restaurant').length) this.amenity('restaurant');
    if (g.money > 60000 && n > 150 * g.buildingsOfType('shop').length) this.amenity('shop');
    this.restock();
    this.heed();
  },
  // do what the advisor says, the way an attentive player would
  heed() {
    const g = GAME, w = g.world, s = g.start;
    const fenceNear = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (w.fence[w.idx(x + dx, y + dy)]) return true; return false; };
    for (const [, msg, ref] of g.collectIssues().slice(0, 6)) {
      if (g.money < 30000) return;
      if (/overcrowded/.test(msg) && ref) {
        // widen the busy stretch (not hard against a fence: that only puts guests in reach)
        const cx = Math.floor(ref.x), cy = Math.floor(ref.y);
        for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
          const x = cx + dx, y = cy + dy; if (!w.inb(x, y) || w.path[w.idx(x, y)] || fenceNear(x, y)) continue;
          if (DIRS4.some(([ax, ay]) => w.path[w.idx(x + ax, y + ay)])) g.placePath(x, y);
        }
      } else if (/dark paths/.test(msg) && g.buildingsOfType('lamp').length < 40) {
        let n = 0;
        for (const gu of g.guests) { if (n >= 6) break; if (gu.hidden || g.litNear(gu.x, gu.y)) continue; if (this.near('lamp', Math.floor(gu.x), Math.floor(gu.y), true)) n++; }
      } else if (/Vet Clinic/.test(msg) && !g.hasBuilding('vet') && g.money > 80000) this.near('vet', s.x + 10, s.y - 6, false);
      else if (/Backup Generator/.test(msg) && !g.hasBuilding('backup') && g.money > 120000) this.near('backup', s.x, s.y - 10, false);
      else if (/no Ranger Station/.test(msg) && g.money > 40000) this.near('ranger', s.x + 6, s.y - 2, false);
      else if (/Maintenance Shed/.test(msg) && !g.hasBuilding('maint') && g.money > 40000) this.near('maint', s.x - 8, s.y - 2, false);
      else if (/nowhere for guests to shelter/.test(msg) && g.money > 60000) this.near('shelter', s.x + 4, s.y - 8);
      else if (/tree cover/.test(msg) && ref) { const r = w.regionAt(ref.tx, ref.ty); if (r && !r.public) g.plantCover(r, 0.3); }
      else if (/needs water/.test(msg) && ref) { for (let k = 0; k < 4; k++) g.digPond(ref.tx + 2 + (k % 2), ref.ty + 2 + (k >> 1)); }
      else if (/starving/.test(msg) && ref) { const r = w.regionAt(ref.tx, ref.ty); if (r && !r.public) g.addFeeder(r, ref.sp.diet === 'carn' ? 'carn' : 'herb'); }
    }
    this.powerAll();
  },
  // keep exhibits alive: top a herd back up when there is room, and re-hatch a species that died out
  restock(reserve = 150000) {
    const g = GAME, w = g.world;
    w.computeRegions();
    this.padSpecies = this.padSpecies || {};
    for (const reg of w.regions) {
      if (reg.public || reg.size > 1200 || reg.size < 12) continue;
      const key = reg.minX + ',' + reg.minY;
      const ds = g.dinos.filter((d) => !d.carried && w.region[w.idx(d.tx, d.ty)] === reg.id);
      const eggs = g.eggs.filter((e) => w.regionAt(e.x, e.y) === reg);
      if (ds.length) this.padSpecies[key] = ds[0].species;
      const sp = this.padSpecies[key]; if (!sp || !g.isUnlocked(sp)) continue;
      const S = SPECIES[sp], mine = ds.filter((d) => d.species === sp).length + eggs.filter((e) => e.species === sp).length;
      const used = ds.reduce((a, d) => a + d.sp.space, 0) + eggs.reduce((a, e) => a + SPECIES[e.species].space, 0);
      const want = S.territorial ? 1 : Math.max(S.social || 1, 2);
      if (mine < want && used + S.space <= reg.size && g.money > reserve + g.hatchCost(sp)) this.hatchIn(reg, sp, 1);
    }
  },
  // start a scenario/chapter, optionally prepare, play it to its end, and report
  scenario(id, seed, opts = {}) {
    startGame({ scenario: id, seed }); UIX.setSpeed(0);
    const g = GAME; this.pads = [];
    if (opts.prep) opts.prep(g, g.start, g.world);
    this.play(Object.assign({ days: 70, until: (q) => q.scenarioDone }, opts));
    const sc = SCENARIOS[id];
    return { id, seed, result: g.scenarioDone || 'unfinished', day: g.day, deaths: g.stats.deaths, staff: g.stats.staffDeaths || 0, escapes: g.stats.escapes, money: Math.round(g.money), rep: Math.round(g.reputation), stars: g.stars, earned: Math.round(g.stats.guestIncome || 0), progress: sc.progress(g).replace(/<[^>]+>/g, ''), medal: g.scenarioDone === 'win' && sc.medal ? sc.medal(g) : null };
  },
  // free play from an empty island, following the goal list the way a new player would
  freePlay(seed, days, difficulty = 'normal', opts = {}) {
    startGame({ difficulty, seed, size: opts.size || 'medium' }); UIX.setSpeed(0);
    const g = GAME, s = g.start;
    this.starter({ two: true });
    const herbs = ['trike', 'stego', 'anky', 'brachio'];
    let last = -10, triedRex = false;
    const tick = () => {
      const goal = GOALS[g.goalIdx], id = goal ? goal.id : '', m = g.money;
      if (id === 'ranger' && m > 40000) this.near('ranger', s.x + 6, s.y - 2, false);
      else if (id === 'maint' && m > 30000) this.near('maint', s.x - 8, s.y - 2, false);
      else if (id === 'species3' && m > 90000 && g.isUnlocked('trike') && !g.dinos.some((d) => d.species === 'trike')) this.pad(14, 12, 'trike', 2);
      else if (id === 'carn' && m > 120000) this.pad(12, 11, 'dilo', 2);
      else if (id === 'helipad' && m > 120000) this.near('helipad', s.x - 12, s.y - 4, false);
      else if (id === 'trex' && m > 450000 && g.isUnlocked('trex') && !triedRex) { triedRex = true; this.pad(18, 16, 'trex', 1, { wall: true }); }
      else if (g.day > last + 1 && m > 350000) {
        const sp = herbs.find((x) => g.isUnlocked(x) && !g.dinos.some((d) => d.species === x));
        if (sp) { this.pad(sp === 'brachio' ? 18 : 15, sp === 'brachio' ? 16 : 13, sp, 2); last = g.day; }
      }
    };
    this.play(Object.assign({ days, manage: true, tick }, opts));
    const esc = g.stats.escBySp || {};
    return { seed, difficulty, day: g.day, goal: g.goalIdx, stars: g.stars, score: Math.round(g.score), rep: Math.round(g.reputation), guests: g.guests.length, money: Math.round(g.money), deaths: g.stats.deaths, staff: g.stats.staffDeaths || 0, escapes: g.stats.escapes, carnEscapes: Object.keys(esc).filter((k) => SPECIES[k].diet === 'carn').reduce((a, k) => a + esc[k], 0), dinoDeaths: g.stats.dinoDeaths };
  },
};
