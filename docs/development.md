# Development

Plain browser JavaScript and a canvas. No build step, no `package.json`, no runtime dependencies: open
`index.html` (a `file://` URL works) and the game runs.

`CLAUDE.md` at the repo root holds the working rules in more detail (design rules, dead ends, gotchas), and
`HANDOFF.md` the project history and latest balance numbers.

## Layout

| Path | What is in it |
|---|---|
| `index.html` | Markup, CSS and the `<script>` list that fixes the load order |
| `src/util.js` | Seeded random numbers (`rand`, `randi`, `chance`, `pick`), helpers |
| `src/data.js` | `SPECIES`, `BUILDINGS`, terrain and fence constants, the tool menus |
| `src/sprites.js`, `src/sprites-views.js` | Pixel art, drawn in code: dinosaurs from character grids, buildings procedurally |
| `src/world.js` | Terrain generation, paddock regions, power grid, pathfinding |
| `src/entities/` | `dino.js`, `ptera.js`, `guest.js`, `staff.js`, `vehicles.js` |
| `src/events.js`, `src/research.js` | Disasters; research projects |
| `src/game.js` | Economy, goals, rating, the simulation step |
| `src/scenarios.js`, `src/campaign.js`, `src/decisions.js` | Scenarios, campaign chapters, InGen calls |
| `src/attractions.js`, `src/blueprints.js`, `src/command.js` | Rides and shows, paddock templates, RTS orders |
| `src/render.js`, `src/ui.js`, `src/ui-panels.js`, `src/audio.js` | Drawing, input and HUD, panels and dialogs, synthesized sound and music |
| `src/tutorial.js`, `src/main.js` | Guided first session; boot, main loop, save/load |
| `tools/` | Headless tests, bots, build scripts |
| `sw.js`, `manifest.webmanifest`, `icons/`, `fonts/` | Offline web app |

## How the code fits together

- **No modules.** Every file is a classic `'use strict'` script sharing globals: `GAME`, `RENDER`, `UIX`, `SFX`.
  A new source file has to be added to the script list in `index.html`.
- **Fixed-step simulation.** The loop in `main.js` caps real time at 0.1 s a frame, scales it by game speed
  and steps `GAME.update()` at 1/30 s at most. The simulation stops while a dialog is open.
- **Deterministic.** Gameplay randomness goes through the seeded `RNG`, so a seed replays the same park.
  `Math.random` is for cosmetics only. Adding a seeded roll anywhere shifts every seeded outcome, so re-run
  the balance sweep after one.
- **World state** is flat typed arrays indexed by `w.idx(x, y)` plus a `buildings` map. After editing them
  directly, call `w.invalidate()`, `w.computeRegions()` or `w.computePower(g)`.
- **Save/load** is `serialize` / `loadGame` in `main.js`. New persistent state, including anything in flight
  (eggs, storms, outages, the alarm), goes into both, and into the save/load test in `tools/ci.js`.
- **Undo** groups construction into batches (`startBatch` / `recordUndo` / `endBatch`).

## Tests

Tests drive the real game in headless Chromium through Playwright, on Node 22. Playwright is not vendored:

```bash
npm install --no-save --no-package-lock playwright@1.56.1
npx playwright install --with-deps chromium
```

```bash
node tools/ci.js                 # boot every mode, tutorial, InGen calls, blueprints, attractions, campaign, fuzz + save/load, panels
node tools/rts.js                # RTS controls with real mouse events
node tools/balance.js --full     # the balance sweep (about 5 minutes)
node tools/balance.js --only "Storm Season"   # just the cases whose name matches
node tools/smoke.js out.png tools/long.js     # run one in-page script, print its result, take a screenshot
```

A test fails on any page error or `console.error`, not only on a failed check.

`tools/` has two kinds of file. **Node runners** (`ci.js`, `rts.js`, `smoke.js`, `balance.js`, ...) launch
the browser. **In-page scripts** (`fuzz.js`, `tutorial.js`, `long.js`, ...) are bare functions evaluated inside
the page with `tools/helpers.js` in front; they use the game globals and return a value the runner checks.

### Balance sweep

`tools/bots.js` defines `window.B`: helpers that build a park (`B.starter`, `B.pad`, `B.pen`, `B.route`,
`B.powerAll`) and scripted players (`B.play`, `B.manage`, `B.heed`, which follows the in-game advisor,
`B.scenario`, `B.freePlay`, `B.chaos`).

`tools/balance.js` lists 26 cases. Each runs bots on fixed seeds and states what must hold, for example:

- Nedry's Night with walls, a backup generator and bunkers: wins at least 3 of 4.
- Storm Season with an idle park: wins at most 1 of 4, bronze at best.
- Chaos with predators and a 2-second response: at most 5 guests lost over 4 parks. With no response: at least 10.

The rule the sweep enforces: **every scenario and chapter stays winnable with sensible play and losable with
poor play.** When a case fails after a change, decide whether the game or the expectation is wrong and say
which in the commit.

## Build and deploy

```bash
node tools/bundle.js [out]            # one self-contained HTML file (default dist/jurassic-tycoon.html)
node tools/build-pages.js [outDir]    # offline web app for GitHub Pages (default dist/pages)
```

`.github/workflows/jurassic-tycoon.yml` runs the tests and the balance sweep on every push. On `main`, once
both pass, it builds the site and pushes it to the `gh-pages` branch, which GitHub Pages serves at
<https://mszarski.github.io/jurassic-park-tycoon/>.

The service worker (`sw.js`) caches files for offline play and only registers on `https:` or `localhost`. If
you serve the unbundled repo from `localhost` it will keep serving stale `src/*.js`: test from `file://`, or
unregister the worker.

## Conventions

- Commit messages are sentences about what the player sees, with playtest numbers where balance changed.
- In-game text is plain and says what to do. `tutorial.js` rewrites wording for touch screens, so keep its
  string patterns intact.
- A new tool, shortcut or mechanic also goes into How to Play (`src/ui-panels.js`),
  [playing.md](playing.md) and the README.
