# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Read `HANDOFF.md` first** for current state, latest balance numbers, history, open questions and next steps. This file holds only the durable rules.

## Project

Jurassic Tycoon: a pixel-art dinosaur park builder in plain browser JavaScript. No build step, no `package.json`, no dependencies at runtime. Open `index.html` directly (`file://` works) to play.

## Commands

Tests are headless Playwright (Chromium) scripts; Node 22. Playwright is not vendored. CI installs it with `npm install --no-save --no-package-lock playwright@1.56.1 && npx playwright install --with-deps chromium`. `tools/pw.js` falls back to a global install at `/opt/node22/lib/node_modules/playwright`.

```bash
node tools/ci.js                      # the CI suite: boot every mode, tutorial, InGen calls, blueprints, attractions, campaign, fuzz + save/load, panels
node tools/rts.js [screenshotDir]     # CI's second step: RTS controls with real mouse events
node tools/balance.js [--full] [--only text] [--json]   # balance sweep: bots play every scenario/chapter well and badly (CI runs --full, ~90s)
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

**Balance sweep.** `tools/bots.js` defines `window.B`: park-building helpers (`B.near`, `B.pad`, `B.pen`, `B.starter`, `B.route`, `B.pylons`, `B.powerAll`) and scripted players (`B.play`, `B.manage`, `B.heed` which follows the advisor, `B.scenario`, `B.freePlay`). `tools/balance.js` lists the cases (`CASES`): each runs bots on fixed seeds and states what must hold ("prepared wins >= 3 of 4", "idle loses"). **After any economy, AI or scenario change, run it; if a case fails, decide whether the game or the expectation is wrong, and say which in the commit.** To try a bot by hand: write an in-page script that uses `B` and run it with `smoke.js` after concatenating `tools/bots.js` in front (see how `balance.js` builds `lib`).

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

## Working with the user

- **"Play more" is the standing request.** Each round: pick an angle, playtest, find concrete issues (broken, confusing, unfair or dull), fix or rebalance, verify with numbers and screenshots, ship, report. A round with nothing to fix is fine: say so honestly and ship nothing.
- **Wants drama and deaths.** "need more deaths though? of guests?" Breaches should be frightening and cost lives, but a prepared, alert park (alarm, bunkers, rangers, walls, backup generator) can keep casualties near zero. Player skill must matter.
- **Wants less busywork** (one-click upkeep, templates, sensible automation), **optional RTS-style control** (things also happen on their own), and **a campaign**.
- **Every scenario and chapter must stay winnable with sensible play and losable with poor play**, and CI must stay green.
- **Report format:** a short summary per round: what was wrong, the fix, measured before/after numbers, then that it was pushed and is live in the artifact.
- **Ship every round:** commit, push `main` (CI tests and the balance sweep, then deploys Pages), rebuild the bundle (`node tools/bundle.js`), republish the claude.ai artifact.
- **CI-green notifications:** just say so briefly.
- **Commits:** end with the co-author/session trailer lines (see `git log`). Never put model names in commits or code otherwise.
- **No outward actions** (opening PRs, etc.) unless asked.
- **Ask before** making Chaos deadlier for a well-prepared park (an open question in `HANDOFF.md`).

## Pointers

- Repo: `github.com/mszarski/jurassic-park-tycoon`, all work on `main`.
- claude.ai artifact (single-file build): https://claude.ai/artifact/FGPyGT92AZStNCUThgALdD. Build `node tools/bundle.js` -> `dist/jurassic-tycoon.html`, publish that file to the same URL.
- Play harness: `tools/bots.js` + `tools/balance.js` (see Commands). The earlier scratchpad-only harness described in `HANDOFF.md` is gone; these replace it.

## Design rules (and why)

- **Plain JS, no framework or bundler** so `index.html` opens directly; mixins are applied to `Game.prototype` across `src/*.js`.
- **Star rating:** `score = attraction + reputation * 0.9`; attraction = sum of appeal x comfort + 8 per species + building appeal; `STAR_THRESH` in `game.js`. Reputation drifts nightly toward `avgHappy * 0.55 + safety * 0.45`.
- **Money goals count `stats.guestIncome`** (tickets + shops), not the bank balance, so building isn't punished. Do-nothing parks may at most barely win money goals; easy idle wins are a bug.
- **Power-shortage triage:** fences, then staff, then shelters and sirens, then hatchery/restrooms/restaurants/Visitor Center, then lamps, then the rest. Guests starving in the dark was the worst playtest failure.
- **Blackouts release carnivores unless there is a Backup Generator.** Calm has no disasters, but grid overload can still release carnivores (a consequence, not a disaster).
- **Relocation needs a paddock of at least 30% of the species' space** (min 12 tiles). 60% made The Lost World unwinnable; much lower dropped a T. rex into 15-tile scraps.
- **Lodge Hotel is capped at 40 rooms, enforced both when guests choose and at the door.** Uncapped it paid back in under 4 days and dominated; choose-time-only checks let occupancy hit 127/40.
- **Chapter 2 escapes count only raptors** (storm-flattened herbivore fences were failing a raptor chapter).
- **InGen calls are deferred during crises** (a modal mid-breakout paused the game).
- **Guests pick only among attractions the park actually has**; an unfiltered goal list cut shop income 15-30%.
- **Adding seeded randomness shifts every seeded outcome**: re-run the scenario/chapter balance sweep after it, and after any economy or behaviour change (stale re-checks are what caught the guest-goal and hotel regressions).

## Dead ends and gotchas

- Loose giants targeting the nearest building chewed their own feeder for hours: feeders are excluded from rampage targets.
- The weakest-fence search must start at `-Infinity`; walls score -50, so a `-1` start never chose walls.
- Opening Day's Indominus breakout only works if she is moved out through the hole; otherwise maintenance patches it before she notices.
- Making Chaos deadlier via crowd crush, trips, dart misses, shorter raptor idle and reachable-prey targeting did not raise guest deaths for a perfect responder (escapes happen at night, or the alarm clears paths first). Bigger levers are needed; ask first.
- Save/load: a `//` comment inside a one-line statement once silently dropped dino growth/age on load. Add new persistent fields to the "save/load keeps dinosaurs and park state" CI test too.
- The hatchery needs power; `canHatchAt` returns the reason. Scripted "hatch failures" were usually an overloaded grid.
- Scripted clicks right after `location.reload()` can land before the title is ready: click by selector (`#btnSandbox`), not coordinates.
- Toasts use real-time `setTimeout`, so screenshots after fast-forwarding show stale toasts (artefact, not bug).
- Screen coords: `sx = (tx * 16 - cam.x) * zoom`; the camera is `UIX.r.cam`, not `UIX.cam`.
- CSS vars `--goalR` / `--goalH` position the squad bar and ticker; they follow whichever bottom-left panel is visible (goal panel or `#tut`).
- Headless Chromium renders in software; measure fps with `requestAnimationFrame` intervals, not per-frame JS timings.
- `pkill -f` with a pattern matching your own shell kills it (exit 144); find the PID with `ps -eo pid,args | grep "[n]ame"`.
- For multi-line source edits prefer Python `str.replace` with an assert that the old string exists (a mis-sliced replace once duplicated half of `campaign.js`).
- The cloud container kills background servers after ~2 hours; restart as needed.
