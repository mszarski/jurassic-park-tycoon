# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Jurassic Tycoon: a pixel-art dinosaur park builder in plain browser JavaScript. No build step, no `package.json`, no dependencies at runtime. Open `index.html` directly (`file://` works) to play.

## Commands

Tests are headless Playwright (Chromium) scripts; Node 22. Playwright is not vendored. CI installs it with `npm install --no-save --no-package-lock playwright@1.56.1 && npx playwright install --with-deps chromium`. `tools/pw.js` falls back to a global install at `/opt/node22/lib/node_modules/playwright`.

```bash
node tools/ci.js                      # the CI suite: boot every mode, tutorial, InGen calls, blueprints, attractions, campaign, fuzz + save/load, panels
node tools/rts.js [screenshotDir]     # CI's second step: RTS controls with real mouse events
node tools/smoke.js out.png tools/long.js   # run an in-page script, print its RESULT, screenshot
node tools/shot.js <url-or-file> <out.png> [w] [h] [waitMs] [evalJs]
node tools/bundle.js [out]            # single-file page (default dist/jurassic-tycoon.html)
node tools/build-pages.js [outDir]    # offline web app for GitHub Pages (default dist/pages)
```

`ci.js` has no single-test filter; to run one in-page script, use `smoke.js` with it. `dist/` is gitignored.

There are two kinds of files in `tools/`:
- **Node runners** (`ci.js`, `smoke.js`, `rts.js`, `uitest.js`, `newbie.js`, `shot.js`, `icons.js`, `build-pages.js`, `bundle.js`) launch Chromium on `file://.../index.html`.
- **In-page scripts** (`fuzz.js`, `tutorial.js`, `long.js`, `campaign.js`, `econ.js`, ...) are bare IIFEs evaluated in the page with `tools/helpers.js` prepended. They use the `T.*` helpers (`T.place`, `T.rect`, `T.path`, `T.run(secs)`, `T.clear`) and the game globals, and they return a value that `ci.js` checks. A new CI test is an entry in the `TESTS` array in `ci.js`.

A test fails on any `pageerror` or `console.error` (Google Fonts errors are ignored), not only on a failed check.

## Architecture

- **No modules.** Every `src/*.js` file is a classic `'use strict'` script sharing globals. Load order is the `<script>` list at the bottom of `index.html` (util → data → sprites → world → entities → events/research → game → scenarios/decisions/... → render → ui → ui-panels → tutorial → main). A new source file must be added there.
- **Globals:** `GAME` (a `Game`), `RENDER` (a `Renderer`), `UIX` (a `UI`) and `SFX` (a `Sfx`), set in `main.js`. Data tables live in `data.js` (`SPECIES`, `BUILDINGS`, terrain `T_*` and fence `F_*` constants); `DISASTERS` is in `events.js` and `SCENARIOS` in `scenarios.js`.
- **Loop** (`main.js` `loop`): real dt is capped at 0.1s, scaled by speed (1–4) and slow motion, then run through `GAME.update()` in fixed steps of at most 1/30s. The sim stops while a modal is open. Rendering, the breach cam (PiP) and the minimap run every frame. The game autosaves to `localStorage` at the start of each new day.
- **Determinism:** gameplay randomness goes through the seeded global `RNG` (`util.js`: `rand`, `randi`, `chance`, `pick`), which `new Game(seed)` reseeds. Use `Math.random` only for cosmetics (audio, rain, title screen, guest names). Tests seed with `window.TEST_SEED` / `startGame({ seed })` and step `GAME.update(1/30)` by hand.
- **World** (`world.js`): flat typed arrays indexed by `w.idx(x, y)` (`terrain`, `fence`, `fenceOrig`, `fenceHp`, `path`, `track`, `lavaT`) plus a `buildings` Map. After a direct edit, call `w.invalidate()`, `w.computeRegions()` or `w.computePower(g)` so paddock regions, power and render caches are recomputed.
- **Undo** (`game.js`): construction is grouped with `startBatch()` / `recordUndo(entry)` / `endBatch(label)`, and the stack holds the last 25 batches. An entry is applied only if the tile still holds what it recorded (`e.now`). A new kind of construction needs `recordUndo` entries and a matching branch in `undo()`.
- **Save/load** (`main.js` `serialize` / `loadGame`): JSON with typed arrays as base64, `v: 1`. There is no migration step; older saves are handled with inline defaults (`s.size || 'small'`, `if (s.track)`). **New persistent state (including anything mid-flight: eggs, storms, outages, queued fences, the alarm) must be added to both functions.** The CI tests "fuzz + save/load" and "save/load keeps dinosaurs and park state" check the round trip.
- Other `localStorage` keys (`jt_campaign`, `jt_medals`, `jt_tutorial_done`, `jt_audio*`, `jt_daylen`, `jt_mapsize`, `jt_wheel`) are always read and written inside `try/catch`. Keep that pattern.

## Build, deploy and the service worker

- `bundle.js` inlines `src/*.js` and the fonts into a single HTML file. Its regexes need the exact forms `<script src="src/..."></script>` and `url('fonts/X.woff2')`, so don't change how scripts or fonts are referenced in `index.html`. `bundle.js` also strips elements marked `data-pwa` for the artifact build.
- `sw.js` serves files cache-first. It has `VERSION = 'dev'`, which `build-pages.js` replaces with a hash of the bundled HTML and the manifest. A new version gets a new cache and the old ones are deleted. The precache list contains only `index.html`, the manifest and the icons, because the deployed `index.html` is already bundled.
- **Gotcha:** the service worker registers only on `https:` or `localhost`. If you serve the unbundled repo over `localhost`, it caches `src/*.js` under the `dev` version and keeps serving the stale copies. Test with `file://`, or unregister the worker / clear site data.
- Updates: on `controllerchange` the app reloads by itself if the title screen is showing. Mid-game it only shows a toast, so a park in progress is never reloaded away.
- Deploy (`.github/workflows/jurassic-tycoon.yml`) pushes `build-pages.js site` to `gh-pages`, on pushes to `main` once the tests pass; Pages serves the `gh-pages` branch at https://mszarski.github.io/jurassic-park-tycoon/.

## Conventions

- Commit messages are player-facing sentences about behaviour, often with playtest numbers ("Lodge Hotel rooms $150 a night (at $200 it paid for itself in 4 days)"). Balance changes are backed by scripted playthroughs (`long.js`, `econ.js`, `newbie.js`, ...).
- User-facing text is plain and actionable: advisor tips say what to build and where. `tutorial.js` rewrites text for touch screens (click→tap, no keyboard hints), so keep its string patterns intact when you edit tutorial text.
- When you add a tool, keyboard shortcut or mechanic, update the How to Play text in `ui-panels.js` and the controls table in `README.md` too.
