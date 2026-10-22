# Small Fortune: Roadmap

Ten phases, built in order. Each phase ends with the game running, all tests green,
`npm run lint:text` at zero violations, and a short report to you: what works, what is next,
and anything you need to do. A phase is not started until the previous one passes its gate.

All text in this file is plain ASCII.

---

## Phase 0: Plan (this document)

- ARCHITECTURE.md and ROADMAP.md.
- **Gate:** your approval and answers to the open questions in ARCHITECTURE.md Section 18.

---

## Phase 1: Simulation core

**Build**
- Project scaffold: Vite, React, TypeScript strict, ESLint rules for `/src/sim` (no `Math.random`,
  no engine-dependent math, no `Date`), Vitest, `npm run lint:text` (first version).
- `sim/core`: seeded RNG streams, deterministic math, integer money, calendar, state hash.
- `sim/world`: hex grid from a `PlaceSnapshot`, population by segment and time bucket, weather,
  era curves (price and wage index stubs for Indonesia and the United States).
- `sim/demand`: attractiveness, Huff gravity with the outside option, service and queues, basket.
- `sim/store`: daily store pipeline, stock and spoilage, condition, rating.
- `sim/finance`: ledger, loans, statements, net worth, bankruptcy.
- `sim/explain`: receipts that add up exactly; "Why did this change?" decomposition.
- `sim/actions`: the first actions (open store, set price, set products, hire, fire, order stock,
  take loan, repay loan, set hours, run a basic marketing campaign).
- Procedural place generator (needed by tests and the harness from day one).
- Simple rival stores with fixed strategies (full rival families come in Phase 4).
- `sim/bots` with the five balance bots, and `npm run balance` with worker threads, report table,
  JSON output and pass criteria.
- Debug page: run one simulated year for a chosen seed and bot, plot daily customers, revenue,
  costs, cash, share of pull and rating, and show any receipt.

**Tests**
- Determinism (same seed and actions gives the same hash), golden hash, ledger balances after
  every tick, gravity properties, loan schedules, stock and queue behavior, receipts sum to totals.

**Gate**
- Balance targets in ARCHITECTURE.md Section 5.10 pass on Normal for a procedural Kopi Cipete-like
  city (the full content-dependent tuning is repeated in Phase 9).
- One year simulates in under 2 seconds in Node.

---

## Phase 2: Map and the living city

**Build**
- MapLibre with the game's night style template, Barlow glyphs, attribution control.
- deck.gl overlay: stores, light dots (`TripsLayer`), territory (`H3HexagonLayer`), pull rings.
- Location picker: geocoder interface (Nominatim, Photon, MapTiler, custom), debounce, cache,
  rate limit; click on map; preview of the play area.
- Overpass loader with mirrors, normalization to `PlaceSnapshot`, IndexedDB cache, procedural
  fallback with an on-screen notice.
- `npm run snapshots` for presets and Daily Lease streets (needs network to Overpass).
- Road graph, Dijkstra shortest path trees per store, packed paths to the main thread.
- Offline basemap from snapshot roads, water and parks.
- The simulation worker and message protocol; the map runs from live worker frames.
- Layer toggle panel (M).

**Tests**
- Snapshot normalization, procedural generator determinism, path tree correctness, worker
  protocol round trips.

**Gate**
- Pick any city, see the grid and dots flowing to a test store at 60 fps on a laptop.
- A preset loads from its bundled snapshot with the network disabled.

---

## Phase 3: Stores, actions and finances

**Build**
- Game screen layout: top bar with date, speed controls, cash and net worth; left dock panels;
  right inspector; news ticker.
- Time controls: speeds 1 to 5, Space pause, number keys, skip to next year, auto-pause rules.
- Store panel: products, price sliders with live demand estimate, hours, stock and suppliers,
  renovation, loyalty program, marketing campaigns with reach shown on the map.
- Scout and open new locations, rent or buy the building.
- Finance screens: P&L, cash flow, balance sheet, loans, net worth chart, "Why did this change?".
- Receipt tooltips on every important number (`Num`, `Money`), dev warning for numbers without
  receipts.
- Quarterly and yearly reports. Alerts tray with jump to cause on the map.
- Undo for the last action while paused.

**Tests**
- Action validation and reducers, report generation, receipt coverage check in dev mode,
  first Playwright smoke test (open store, set price, run 30 days).

**Gate**
- A new player can open a store in under a minute. Every number in the top bar, store panel and
  finance screen has a receipt.

---

## Phase 4: Rivals, staff, regulars and deals

**Build**
- Rival families with heads, heirs, colors and the five strategy presets; weekly utility AI.
- Grudge memories, decay, inheritance, hostile actions, dormant families and revenge returns,
  alliances and relationship scores.
- Rivals screen (R) with plain-language behavior lines and grudge history.
- Staff system: candidate pools, names by region and era, avatars, roles, shifts, training,
  raises, morale, quitting, poaching, promotion to manager. Staff screen (S).
- Regulars: promotion, habits, reactions with explanations, word of mouth, first story arcs.
- Negotiation screen with sliders, live chance bar, patience bar, counteroffers.
- Contracts list (C) and monthly enforcement for leases, supply, loans, investors, non-compete.
- Avatar SVG renderer (faces age and change clothes by era).

**Tests**
- Rival AI picks sensible actions in fixed scenarios, grudge math, negotiation curve, contract
  enforcement, staff quit and poach rates, regular reactions.

**Gate**
- In the first 30 in-game days of a Normal game there is at least one rival move and one staff
  decision. Balance harness still passes with rival families on.

---

## Phase 5: Family, dynasty and eras

**Build**
- Family members, aging, health, skills, traits with real effects, roles in the business.
- Childhood experience accumulator and trait formation.
- Succession screen with sibling reactions (accept, demand a share, leave and become a rival
  branch).
- Family tree screen (H) with every generation, tenures, and best and worst moments.
- Eras: price and wage index tables per country, product catalogs per era, payment methods,
  technology, marketing channels, taste curves, currency changes.
- Era lens on map and simulation: road filtering and thinning, POI conversion, population curves,
  era palettes.
- Era transition screen.

**Tests**
- A scripted 1920 to 2026 run through the harness produces at least 3 successions; trait
  formation follows experiences; currency conversion preserves value; era lens rules.

**Gate**
- A bot-played full dynasty run from 1920 completes without errors in under 5 minutes in Node,
  with at least 3 successions that differ (different heirs, at least one contested).

---

## Phase 6: Content

**Build**
- Six business types with era-aware catalogs, segment fit, costs and failure modes:
  Tea and Coffee House, Bakery, Restaurant, Bookshop, Tailor and Clothing, Tutoring School.
- Upgrade trees: at least 30 upgrades per business type in Product, Service, Operations, Brand
  (180 or more in total), with era gating. Branching into a second business type after a
  milestone. Central kitchen and warehouse.
- Events: at least 220 hand-written events with conditions, weights, 2 to 4 choices and
  follow-ups, including chains (price war, family feud, health inspection arc, regular life
  stories) and location events (Jakarta floods, Ramadan and Lebaran, New York blizzards, Boston
  move-in week, Lunar New Year).
- At least 55 achievements, including cross-generation ones.
- All preset scenarios: The Long Game, Kopi Cipete, The Diner, Bookshop vs the Internet, Feud
  Street, Free Play.

**Tests**
- Data validation for every event, upgrade and achievement; each scenario runs 5 years in the
  harness without errors; event pacing check (no long silent stretches, no event floods).

**Gate**
- The first 30 minutes of Kopi Cipete include a rival move, a staff decision, an event chain and
  a meaningful money decision for every bot seed tested.

---

## Phase 7: Onboarding, saves and sharing

**Build**
- Interactive tutorial in Kopi Cipete with pointers at real UI, skippable.
- Saves: autosave, 5 manual slots, export and import of `.sfsave` files, migrations.
- Daily Lease: date-based challenge, result card, copy-to-share text, local history and streaks,
  leaderboard client interface (no backend).
- Seed codes: create, share, start from code.
- Family history book with export to PNG.
- Endings with the animated map replay, then Keep Playing.
- Settings screen: difficulty, autosave interval, auto-pause rules, volumes, UI scale, colorblind
  palette, reduced motion, camera shake, detail level.

**Tests**
- Save round trip equals the original state hash; import rejects corrupted files; Daily Lease
  determinism (same date gives the same seed and city); seed code encode and decode.

**Gate**
- A new player finishes the tutorial in under 10 minutes; a game survives save, reload and load
  with no difference.

---

## Phase 8: Visual identity, sound, feel and performance

**Build**
- Logo wordmark and awning mark, favicon, PWA icons, share card art, loading screen.
- Title screen with the live night demo and slow camera drift.
- Final theme pass: panels, charts, family colors, era accents, colorblind palette.
- Game feel: rolling counters, money popups, milestone celebration, camera flights, toggleable
  shake.
- Audio: synthesized SFX sprite, generative era music, volume controls.
- PWA: installable, precache shell and snapshots, runtime tile cache.
- Performance: code splitting, detail levels with automatic probe, frame budget checks.

**Tests**
- Lighthouse run for load time and PWA checks; frame time probe with dots on; no console errors.

**Gate**
- First load under 3 seconds for a preset on a normal connection; 60 fps with dots on a
  MacBook Air class laptop; reduced motion respected.

---

## Phase 9: Playtest and release

**Build**
- Run every scenario through the balance bots, read the logs and event sequences, and list every
  boring stretch, confusing screen and unfair outcome. Fix them and re-run.
- Final balance tuning in `tuning.ts` until all targets pass.
- Full test suite, full Playwright smoke test, text lint.
- README.md with setup, environment variables, scripts, snapshot rebuilding, and deploy steps for
  Cloudflare Pages and Vercel.
- About screen with credits and OpenStreetMap attribution.

**Gate (Definition of Done from the brief)**
- First store open in under a minute without a manual.
- First 30 minutes include a rival move, a staff decision, an event chain and a money decision.
- A full dynasty run from 1920 has at least 3 successions that feel different.
- Every number on screen can be explained by hovering it.
- Balance targets pass.
- `npm run lint:text` passes with zero violations.
- No placeholder text, no console errors.

---

## Content targets at a glance

| Content | Target |
| --- | --- |
| Business types | 6 |
| Upgrades | 180+ (30+ per type, 4 branches) |
| Events | 220+ |
| Achievements | 55+ |
| Family traits | 24 |
| Staff traits | 8 |
| Regular story arcs | 10+ |
| Preset scenarios | 6 (including Free Play) |
| Name pools | Indonesia (5 communities), United States (by decade), plus broad world regions for Free Play |

## Main risks and how they are handled

| Risk | Handling |
| --- | --- |
| No network to Overpass from the build container | Procedural generator and offline basemap first; snapshots built when access is allowed or run locally |
| Public Nominatim limits | Provider interface, debounce, cache, rate limit; switch provider for launch through `.env` |
| Balance across 100 years and 6 business types | All constants in one file, paired-seed harness with pass criteria, era-relative prices |
| Determinism across browsers | Deterministic math module, integer money, lint rules, golden hash tests |
| Writing volume (220 events, 180 upgrades) | Typed data with validation and the text lint; written in groups per phase |
| Performance with many dots | GPU trips layer, typed arrays, detail levels, capped dot counts |
