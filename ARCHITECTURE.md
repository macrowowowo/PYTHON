# Small Fortune: Architecture

This document describes how Small Fortune is built: the module layout, the simulation model,
the data formats, how the simulation talks to the interface, and the rules that keep the game
deterministic, explainable and fast. It is the reference for every later phase. Where the brief
leaves a choice open, the decision is stated here with the reason. Open questions that need an
answer before or during the build are collected at the end.

All text in this file is plain ASCII, the same rule the game follows.

---

## 1. Guiding rules

1. **The simulation is the product.** Everything in `/src/sim` is pure TypeScript with no React,
   no DOM, no `Date.now()`, no `Math.random()` and no browser APIs. It runs unchanged in a Web
   Worker (the game), in Node (tests and the balance harness) and in the main thread (debug page).
2. **Deterministic.** Same seed plus the same ordered list of player actions gives a bit-identical
   state, on every browser and in Node. Section 5.2 explains how.
3. **Every number carries its cause.** Numbers that the player sees are produced together with a
   receipt (a list of signed lines that add up exactly to the number). The interface never
   computes game numbers on its own; it only formats what the simulation explains.
4. **Data, not code, for content.** Events, upgrades, products, achievements, eras, scenarios,
   names and history book templates are typed data files. The engine interprets them. This keeps
   200+ events reviewable and lets the text lint and data validation tests cover all of them.
5. **One action path.** The player, the tutorial, the balance bots and the undo system all change
   the game through the same typed `Action` commands. Rival families use the same store and
   finance rules through an internal command set.
6. **One tuning file.** Every balance constant lives in `src/sim/tuning.ts`. Difficulty levels
   are multipliers on top of it.

---

## 2. Tech stack and versions

| Concern | Choice | Notes |
| --- | --- | --- |
| Build | Vite 5, TypeScript 5 (strict, `noUncheckedIndexedAccess`) | Static output, no server |
| UI | React 18 | Function components and hooks only |
| UI state | Zustand | Separate stores for view model, UI, settings, profile |
| Map | MapLibre GL JS 4 | Our own style JSON (Section 9.2) |
| Overlays | deck.gl 9 via `@deck.gl/mapbox` `MapboxOverlay` (interleaved) | Hexagon, arc, trips, scatter, path layers |
| Grid | h3-js 4 | Resolution 9 (about 0.1 km2 per hex) |
| Worker RPC | Small hand-written typed message protocol | No extra dependency; easy to make deterministic |
| Storage | IndexedDB via `idb` | Saves, caches, profile |
| Compression | Native `CompressionStream` (gzip) with `fflate` fallback | Saves, exports, snapshots |
| Charts | visx (`@visx/shape`, `@visx/scale`, `@visx/axis`, `@visx/tooltip`) | Fully themable, small, SVG |
| Audio | Howler.js | SFX sprite plus music (Section 12.4) |
| Icons | `lucide-react` | Only SVG icons, never text glyphs |
| Fonts | `@fontsource/barlow-condensed`, `@fontsource/barlow`, `@fontsource/jetbrains-mono`, `@fontsource/libre-caslon-text` | Latin and latin-ext subsets |
| PWA | `vite-plugin-pwa` (Workbox) | Precache shell, runtime cache tiles and snapshots |
| Tests | Vitest (sim, data, utilities), Playwright (smoke) | Playwright uses the preinstalled Chromium |
| Scripts | `tsx` for Node scripts, `worker_threads` for the balance harness | |

Nothing in the stack requires an API key for development. Production may add a geocoder key and
a tile provider key through `.env` (Section 9).

---

## 3. Repository layout

```
/
  ARCHITECTURE.md  ROADMAP.md  README.md
  .env.example
  index.html
  vite.config.ts  tsconfig.json  vitest.config.ts  playwright.config.ts
  public/
    styles/            map style templates (night base, era palettes applied at runtime)
    glyphs/            Barlow glyph PBFs for map labels (generated, Section 9.2)
    snapshots/         bundled place snapshots per preset and Daily Lease street (*.json.gz)
    audio/             sfx sprite, optional music files
    icons/             PWA icons, favicon (generated from the logo mark)
  scripts/
    balance.ts         npm run balance
    lint-text.ts       npm run lint:text
    build-snapshots.ts npm run snapshots (Overpass to /public/snapshots)
    build-calendars.ts npm run calendars (Ramadan, Lebaran, Lunar New Year tables)
    build-glyphs.ts    npm run glyphs
    build-sfx.ts       npm run sfx (synthesizes the sound effect sprite)
    validate-data.ts   used by tests and by lint:text
  src/
    sim/               pure simulation (no React, no DOM)
    data/              typed content (events, upgrades, products, eras, names, ...)
    world/             place loading: Overpass, snapshots, procedural fallback, era lens rules
    worker/            the simulation worker and the message protocol
    platform/          IndexedDB, geocoding, compression, audio, PWA glue
    ui/                React app: screens, panels, components, map, theme
    debug/             debug page (Phase 1): plots one simulated year
  tests/
    e2e/               Playwright smoke test
```

### 3.1 `/src/sim` in detail

```
sim/
  tuning.ts            every balance constant, grouped by system, with comments
  index.ts             public API: createGame, step, applyAction, serialize, deserialize
  core/
    rng.ts             seeded PRNG (sfc32), named sub-streams, no global state
    dmath.ts           deterministic pow, exp, log, logistic (Section 5.2)
    money.ts           integer money in minor units, safe arithmetic
    calendar.ts        day index to date, weekday, month, quarter, season
    ids.ts             deterministic id allocation
    hash.ts            state hash for determinism tests
  state/
    types.ts           GameState and every entity type
    create.ts          new game from a Scenario and a PlaceSnapshot
    migrate.ts         save version migrations
  world/
    grid.ts            hex records, neighbors, distance tables
    population.ts      residents and visitors by segment and time bucket
    eraCurves.ts       population, price index, wage index, taste curves by year
    weather.ts         daily weather from a climate profile
    holidays.ts        regional calendars (Ramadan, Lebaran, Lunar New Year, US holidays)
  demand/
    segments.ts        segment behavior
    attractiveness.ts  store pull terms per segment
    gravity.ts         Huff model, outside option, shares per hex, segment, time bucket
    service.ts         capacity, queues, walkaways
    basket.ts          product choice and spend
  store/
    daily.ts           the per-store daily pipeline
    stock.ts           orders, deliveries, spoilage, stockouts
    condition.ts       cleanliness, equipment wear, renovation
    rating.ts          rolling star rating from simulated visits
    marketing.ts       campaigns, reach areas, awareness
    upgrades.ts        upgrade effects
  finance/
    ledger.ts          double-entry-lite ledger, account codes
    loans.ts           amortization schedules, interest, default
    equity.ts          investors, shares, dividends, board demands
    statements.ts      P&L, cash flow, balance sheet, net worth
    bankruptcy.ts      grace period and credit checks
  people/
    staff.ts           employees, shifts, morale, raises, quitting, poaching
    family.ts          members, aging, health, skills, traits, roles
    childhood.ts       experience accumulator that shapes heir traits
    succession.ts      heir choice and sibling reactions
    regulars.ts        promotion, habits, reactions, arcs
    names.ts           name generation by region, era and community
    avatars.ts         avatar genome (the SVG renderer lives in /src/ui)
  rivals/
    families.ts        rival families and their heads and heirs
    ai.ts              weekly utility-based decisions
    strategies.ts      Discounter, Boutique, Copycat, Chain, Old Favorite
    grudges.ts         memories, scores, decay, inheritance, alliances
  deals/
    negotiation.ts     counterpart scoring, patience, counteroffers
    contracts.ts       contract types and monthly enforcement
  events/
    engine.ts          eligibility, weights, cooldowns, chains, follow-ups
    conditions.ts      condition evaluator (data-driven)
    effects.ts         effect applier (data-driven)
    text.ts            template filling for event text
  eras/
    eras.ts            era state, transitions, unlocks
  achievements/
    check.ts           achievement predicates evaluated on game state and history
  explain/
    receipt.ts         Receipt builder and attribution
    why.ts             "Why did this change?" decomposition
  history/
    record.ts          daily, monthly, yearly series, notable moments, map replay frames
    book.ts            history book assembly from templates
  actions/
    types.ts           the Action union
    validate.ts        legality checks with player-facing reasons
    apply.ts           reducers
  tick.ts              the daily pipeline (Section 5.4)
  bots/                balance bot strategies (also used by the title screen demo)
```

---

## 4. Process model and data flow

```
 Main thread (React)                         Worker (simulation)
 +-----------------------------+             +-------------------------------+
 | Zustand stores              |  commands   | GameState (sole owner)        |
 |  view  ui  settings profile | ----------> | clock loop (speed, pauses)    |
 | MapLibre + deck.gl          |             | tick() once per in-game day   |
 | panels, tooltips, audio     | <---------- | frame builder                 |
 +-----------------------------+   frames,   +-------------------------------+
                                   prompts,
                                   receipts
```

- **The worker owns the game.** It holds the only `GameState`, runs the clock and applies actions.
  The main thread never mutates game state.
- **Clock.** The worker runs ticks on a timer. Target real time per in-game day:
  speed 1 = 1.6 s, 2 = 0.8 s, 3 = 0.4 s, 4 = 0.15 s, 5 = as fast as the device allows while
  keeping frames at 60 fps (worker yields every tick). "Skip to next year" runs ticks without
  frame output until December 31 or until something triggers an auto-pause.
- **Commands (main to worker):** `newGame`, `load`, `action`, `setSpeed`, `pause`, `resume`,
  `skipYear`, `undo`, `answerEvent`, `negotiate`, `requestReceipt`, `requestDetail`,
  `serialize`. Every message carries a request id; replies are matched by id.
- **Frames (worker to main):** sent after each tick, coalesced to at most one per animation
  frame. A frame holds the compact view model the interface needs: date, speed, cash, headline
  numbers with receipt ids, store summaries, alerts, notifications, and (when changed) flow data
  for the dots and territory as transferable typed arrays. Full receipts and detail views are
  fetched on demand, so frames stay small (target under 20 KB).
- **Prompts.** Events that need a choice, succession, era transitions, quarterly and yearly
  reports, negotiation replies and endings arrive as prompts. The worker pauses itself when a
  prompt is open and the settings say that prompt type auto-pauses.
- **Action timing.** An action is applied between ticks and recorded in the action log with the
  day index. That makes replay exact: seed plus action log reproduces the game.
- **Undo.** Before applying a player action while paused, the worker keeps a structured clone of
  the state. `undo` restores it. Only the last action is undoable, only while paused, and never
  across a tick or an event answer.

The debug page and the balance harness call the same `sim/index.ts` API directly without the
worker.

---

## 5. The simulation

### 5.1 State shape (summary)

```ts
interface GameState {
  version: number;
  seed: string;                 // short shareable code, Section 13.2
  rng: RngStreams;              // one stream per subsystem
  day: number;                  // days since scenario start date
  settings: SimSettings;        // difficulty and rules that affect simulation
  scenario: ScenarioRef;
  place: PlaceModel;            // hexes, POIs, road graph ids, climate, region
  era: EraState;
  economy: EconomyState;        // price index, wage index, interest base rate, shocks
  families: Record<FamilyId, Family>;   // player family plus rivals
  stores: Record<StoreId, Store>;
  people: Record<PersonId, Person>;     // family members, staff, rival heads, regulars
  contracts: Record<ContractId, Contract>;
  ledger: LedgerState;          // per family accounts
  events: EventEngineState;     // cooldowns, chains, scheduled follow-ups, open prompt
  grudges: GrudgeState;
  history: HistoryState;        // series, moments, replay frames
  achievements: AchievementProgress;
  actionLog: LoggedAction[];
}
```

All entity references are string ids. State is plain JSON-compatible data (no classes, no Maps
in persisted state), so it can be structured-cloned to and from the worker and saved directly.

### 5.2 Determinism

- **PRNG.** `sfc32` seeded from a 128-bit hash of the seed string. Each subsystem draws from its
  own named stream (`demand`, `weather`, `events`, `rivals`, `staff`, `family`, `regulars`,
  `names`, `deals`). A new feature that draws random numbers gets a new stream, so it does not
  shift results in other systems.
- **No engine-dependent math.** `Math.pow`, `Math.exp` and `Math.log` are not guaranteed to give
  identical last bits across JavaScript engines. The simulation uses `dmath.ts`, which builds
  `exp`, `log` and `pow` from `+ - * /` and `Math.sqrt` (all correctly rounded by IEEE 754), so
  results are identical in V8, SpiderMonkey and JavaScriptCore. An ESLint rule bans `Math.random`,
  `Math.pow`, `Math.exp`, `Math.log`, `Date` and `performance` inside `/src/sim`.
- **Integers where it matters.** Money is stored as integers in minor units (cents, sen) using
  safe integer arithmetic. Customer counts are integers after allocation, using largest-remainder
  rounding so totals are conserved.
- **Stable iteration.** Records are iterated in sorted id order, never in insertion order of
  objects built from network data.
- **Tests.** A determinism test runs two years twice from the same seed and action log and
  compares state hashes, plus a golden hash test that catches accidental changes to results.

### 5.3 The city grid

- **Area.** A start district is the set of H3 resolution 9 hexes within about 2.2 km of the
  chosen point (about 160 to 200 hexes). The family can later scout new districts in the same
  city; each adds a disk of hexes (cap 2,000 hexes per game). Hexes outside the loaded area do
  not exist for the simulation.
- **Hex record.** Residents by segment, visitors by segment and time bucket, base foot traffic by
  time bucket, rent level, land use mix, POI list, distance to the nearest transit stop, and an
  era-adjusted density factor.
- **Time buckets.** Early morning (5 to 8), morning (8 to 11), midday (11 to 14), afternoon
  (14 to 17), evening (17 to 21), night (21 to 1). Each store has opening hours that cover a
  subset of buckets.
- **Segments.** Students, Office Workers, Families, Laborers, Tourists, Night Crowd, Regulars.
  Each has price sensitivity, quality preference, convenience preference (distance decay),
  queue tolerance, peak buckets and typical spend. "Regulars" is a segment for customers already
  loyal to a store: each store converts a share of its repeat visitors into this segment, which
  has low price sensitivity and a strong bonus toward their home store.
- **POI generators.** A table in `/src/data/poiRules.ts` maps POI kinds to segment flows, for
  example `school -> Students x 180 at morning and afternoon`, `office -> Office Workers x 120 at
  midday`, `market -> Laborers and Families early`, `station -> all segments x 1.4`. Residents
  come from residential land use area and housing POIs, scaled by the city population curve for
  the current year.

### 5.4 The daily pipeline (`tick.ts`)

Fixed order, every day:

1. Advance the calendar. Roll weather. Apply holidays and active era modifiers.
2. Update the economy (price index and wage index move daily along their yearly curve plus shocks).
3. Update population per hex for the year (cached; recomputed on year change or district add).
4. Compute store attractiveness per segment (Section 5.5).
5. Run the gravity model per hex, segment and time bucket (Section 5.6).
6. For each store: apply capacity and queues, product choice, stock limits, sales, spoilage,
   cleanliness and wear, rating samples, regular visits.
7. Staff: attendance, morale changes, requests (raises, quitting), poaching checks.
8. Rivals: daily price reactions; weekly (on the family's decision day) full utility decision.
9. Marketing and awareness decay. Word of mouth from regulars and rating.
10. Contracts and finance: daily cash movements; on the first of the month wages, rent, loan
    payments, utilities, investor terms; quarter and year closes.
11. Family: aging on birthdays, health checks, childhood experience recording, life events.
12. Events: evaluate eligible events, roll at most one new event per day (plus scheduled
    follow-ups and era events, which have priority).
13. Achievements and alerts.
14. History: record daily series; monthly and yearly aggregates; a map replay frame each quarter.
15. Bankruptcy and ending checks.

### 5.5 Store attractiveness

For store `j` and segment `s`:

```
A(j, s) = Fit(j, s)                                  products that segment wants, 0 to 1.5
        * PriceTerm(j, s)                            exp(-priceSens(s) * relativePrice(j))
        * QualityTerm(j, s)                          (quality(j) / eraQualityNorm) ^ qualityPref(s)
        * ReputationTerm(j)                          from star rating, 0.6 to 1.4
        * AwarenessTerm(j, hex)                      brand awareness in that hex, 0.15 to 1.2
        * ModifierTerms                              loyalty program, upgrades, events, grudges
```

`relativePrice` compares the store's basket price against the era reference price for that
business type, so prices stay meaningful across 100 years of inflation.

### 5.6 Store gravity (Huff model with an outside option)

For hex `i`, segment `s`, time bucket `t`:

```
pull(i, j, s) = A(j, s) / (1 + d(i, j) / d0) ^ beta(s)      for stores open in bucket t
                                                            and within the cutoff distance
outside(i, s) = O(s, era, poiCompetition(i))                existing food and retail, home, other
share(i, j, s, t) = pull(i, j, s) / (sum over k of pull(i, k, s) + outside(i, s))
trips(i, s, t)   = people(i, s, t) * propensity(s, businessType, era, weather, holiday)
demand(j)        = sum over i, s, t of trips(i, s, t) * share(i, j, s, t)
```

- `d(i, j)` is the network walking distance from hex center to store over the road graph,
  precomputed with one Dijkstra run per store when it opens (cached on the store). Procedural
  mode uses hex distance.
- The outside option is essential. It represents every business the game does not model (the
  real food and retail POIs pulled from OpenStreetMap feed it) and staying home. Without it a
  lone shop would capture the whole street and doing nothing would be profitable.
- Cost: about 200 hexes x 7 segments x 6 buckets x 10 to 30 nearby stores per day, well under
  5 ms in a worker. Distances beyond the cutoff are skipped.
- The same computation produces the **territory** (family with the largest captured trips per
  hex) and the **flows** used for the light dots (store, origin hex, trips per bucket).

### 5.7 Store economics

Per store per day:

- **Capacity.** Service capacity per bucket = staff on shift x speed x equipment factor x upgrades.
  When demand exceeds capacity a queue forms; each segment walks away according to its queue
  tolerance. Walkaways are counted and explained.
- **Basket.** Each served customer chooses products with a multinomial logit over the store's
  active products (segment fit, price, quality, time of day). Spend comes from the chosen product
  prices.
- **Stock.** Per product stock in units with daily deliveries from the chosen supplier, lead
  times, spoilage for perishables, and reorder rules the player sets (or "auto" with a target
  days of cover). A stockout loses that sale and adds a small reputation penalty.
- **Condition.** Cleanliness falls with traffic and rises with cleaning staff hours. Equipment
  condition falls with use; below thresholds it slows service and risks breakdowns (event hook).
- **Costs.** Ingredients and goods (COGS), wages, rent or mortgage, utilities, marketing,
  maintenance, contract fees, taxes (simple era and region rate on profit).
- **Rating.** A rolling window of the last 200 simulated visits, each scored from wait time,
  quality, price fairness, cleanliness and staff friendliness. Shown as stars with a receipt.

### 5.8 Family finances

- **Ledger.** Each family has a small chart of accounts (Cash, Receivables, Inventory, Equipment,
  Property, Loans, Investor Equity, Retained Earnings, plus income and expense accounts). Every
  money movement is a balanced journal entry, so the P&L, cash flow and balance sheet are always
  consistent. A test asserts the books balance after every tick.
- **Loans.** Principal, rate (era base rate plus a risk premium from the family's numbers and
  relationship with the bank), term, amortization schedule, missed payment penalties, default.
- **Investors and equity.** Investors buy a percentage for cash; they take dividends and can
  hold board demands (minimum growth, no new debt) recorded as contracts.
- **Brand awareness** per hex and per city district, built by marketing, word of mouth and
  store presence, decaying slowly.
- **Net worth** = cash + inventory + equipment (depreciated) + owned property (valued by hex rent
  level and era index) + business value (a multiple of trailing profit) - debt - investor share.
- **Bankruptcy.** If cash stays negative longer than the grace period (difficulty-based, 30 to 90
  days) and no credit line is available, the game ends in bankruptcy (with the option to keep
  playing from the last yearly save as a "second chance", which disables some achievements).

### 5.9 Every number is explainable

```ts
interface ReceiptLine { label: string; amount: number; kind: "base" | "add" | "pct" | "sub";
                        pct?: number; causeRef?: EntityRef }
interface Receipt { id: string; title: string; total: number; unit: Unit; lines: ReceiptLine[] }
```

- Systems that compute a player-facing number use a `ReceiptBuilder`. Multiplicative factors are
  applied in a fixed order and each step records its absolute effect, so the lines always add up
  exactly to the total (the brief's example: foot traffic, share of pull, rainy day -12%, loyalty
  card +6%, walked away from queue -9).
- Daily receipts are kept for the current day and the last 7 days for stores and the family;
  monthly receipts for 24 months. Older receipts are summarized.
- `causeRef` lets a tooltip line link to the thing that caused it (a rival store, a weather day,
  an event, a contract), which the interface turns into a "show on map" or "open" link.
- **"Why did this change?"** compares this month with last month and decomposes the revenue
  change into drivers (foot traffic, share of pull, price, product mix, stockouts, walkaways,
  weather, events, rival moves) with log-change attribution, then shows the top three in plain
  sentences built from templates.

### 5.10 Balance harness (`npm run balance`)

- Runs in Node with `worker_threads` (one worker per CPU core), calling the simulation directly
  with cosmetic systems switched off (`fast: true`: no regular names, no receipts older than one
  day, no replay frames).
- Bots: `cheapFast`, `premium`, `balanced`, `recklessExpansion`, `doNothing`. Each bot is a pure
  function `(state) => Action[]` run once per in-game week, using only information a player can
  see.
- For each scenario, N seeds (default 1,000 games per scenario, that is 200 per bot) run for five
  in-game years. Each seed is played by every bot so strategies are compared on the same city
  (paired comparison). The winner on a seed is the bot with the highest family net worth after
  five years.
- Output: a table per scenario and difficulty with bankruptcy rate, median days to first
  profitable month, median store count after five years, median net worth, and win share per
  bot. Also written as JSON to `balance-report.json` so changes can be compared over time.
- Pass criteria (checked automatically, exit code 1 on failure):
  - `doNothing` bankruptcy rate >= 90% on Normal.
  - `recklessExpansion` has the highest variance of net worth, bankruptcy rate between 30% and
    70%, and the highest 90th percentile net worth.
  - `balanced` bankruptcy rate <= 10% on Normal, median first profitable month between month 6
    and month 9.
  - No bot wins more than 45% of seeds in any scenario.
- Flags: `--scenario`, `--games`, `--years`, `--difficulty`, `--bots`, `--seed-base`, `--quick`.

### 5.11 Weather, seasons and calendars

- Climate profiles per preset location (Jakarta wet season November to March with flood risk,
  New York and Boston winters with blizzard risk). Free Play derives a profile from latitude,
  hemisphere and a coarse climate zone table.
- Moving holidays (Ramadan, Lebaran, Lunar New Year) come from tables precomputed for 1900 to
  2130 by `scripts/build-calendars.ts` and committed as data, so the simulation does no calendar
  astronomy at runtime. Fixed holidays come from regional tables.

---

## 6. People

### 6.1 Family (dynasty)

- `Person` has name, birth day, death day (unknown until it happens), sex, portrait genome,
  skills Craft, Money and People (1 to 10), 1 to 3 traits, role, relationships (spouse, parents,
  children), health, ambition and a `childhood` accumulator.
- **Traits** are data (`/src/data/traits.ts`) with typed effects, for example
  `PennyPincher: { costMult: 0.95, staffMoraleGrowth: 0.8 }`. About 24 family traits and 8 staff
  traits at launch.
- **Aging and health.** Yearly health checks use era mortality tables by age (gentle, not
  morbid). The head can retire voluntarily from age 55; very old heads get event prompts first.
- **Childhood.** While under 18, a child records experiences with weights: near bankruptcy,
  fast growth, rival conflict, worked in the shop, family feud, studied abroad, a famous regular.
  At 18 traits are drawn with weights from those experiences (for example near bankruptcy pushes
  toward Careful and Penny Pincher, fast growth toward Ambitious and Visionary). The family tree
  shows the main reason for each trait.
- **Roles.** Head, Store Manager, Craft lead, Bookkeeper, Front of House, Student, Away. Roles
  apply skill effects to stores and grow the matching skill over time.
- **Succession.** On retirement or death the game pauses for a succession screen. Each candidate
  shows skills, traits and predicted reactions of the others: accept, demand a share (paid in
  cash or equity, as a contract), or leave. A sibling who leaves becomes a new rival family branch
  with the same surname, a starting stake taken from the family, and a grudge. Reaction odds come
  from ambition, relationship with the heir, birth order expectations, traits and whether they
  worked in the business.
- **Family events** (weddings, arguments, study abroad, loans to relatives) are regular events in
  the event engine with family conditions.

### 6.2 Staff

- Employee fields: name, avatar genome, role (Counter, Kitchen or Craft, Cleaner, Manager,
  Delivery from the 2010s), skill, speed, friendliness, reliability, wage, morale, one trait
  (Night Owl, Perfectionist, Chatty, Ambitious, Loyal, plus a few more), tenure.
- Hiring uses a candidate pool generated per store with names that fit the region and era.
  Wages follow the era wage index and local rent level.
- Morale responds to wage versus market, workload, manager quality, raises, family traits and
  events. Low morale lowers service and raises quit and poaching chances. Staff can ask for
  raises, quit, be poached by rivals (rival AI action), be promoted to manager, and marry into the
  family (a family event that converts them into a family member).

### 6.3 Regulars

- The simulation does not track every customer. Named regulars are a small set of virtual agents
  (up to 12 per store, 80 per game) with a home hex, segment, habit (weekdays, time bucket,
  product), reference price, loyalty and an optional story arc.
- **Promotion.** When a store has steady repeat demand from a hex and segment, a regular is
  created with a deterministic draw. Their visits are part of the aggregate demand, not extra.
- **Reactions.** Price above their reference price by more than their tolerance, long queues,
  stockouts of their product or a drop in rating lower loyalty. When loyalty falls below a
  threshold they stop coming and the player is told why ("Pak Darto stopped coming after the
  kopi tubruk price went up for the third time."). High loyalty adds word of mouth in their hex.
- **Arcs.** Arc templates in `/src/data/regularArcs.ts` (student who graduates and later becomes
  a supplier or investor, retired teacher who leaves a small inheritance, and others) are chains
  of events gated on the regular's age, loyalty and years of visits.

### 6.4 Names and avatars

- Name pools in `/src/data/names/` by region, community and era (for example Betawi, Javanese,
  Sundanese, Chinese-Indonesian and Dutch for Batavia 1920; changing given name fashions by
  decade; American name pools by decade for New York and Boston). Free Play picks pools from a
  coarse country lookup. These files are allowlisted in the text lint because real names may keep
  their real spelling.
- Avatars are a genome (face shape, skin tone, hair style and color, eyes, brows, nose, mouth,
  facial hair, glasses) rendered as layered SVG by `/src/ui/avatar`. Age adds layers (grey hair,
  lines) and era changes clothing and hair styles. Family members carry the family color on
  clothing trim. All shapes are original.

---

## 7. Rivals and grudges

- **Rival families** have a head, heirs, a surname, a family color, a strategy preset, a cash
  pool and stores that use the same store model as the player (staff quality is a single scalar
  plus one named manager per store, so they can be poached).
- **Weekly decision.** Each rival scores candidate actions (change prices, open a store at a
  candidate hex, close a weak store, marketing, upgrade, poach staff, target a player store,
  propose a deal) with
  `utility = expected profit change (quick gravity estimate) + strategy weights + grudge terms +
  personality noise`, then picks with a softmax over the top candidates using the `rivals` stream.
- **Strategies.** Discounter (price cuts, starts price wars), Boutique (premium, slow, high
  quality), Copycat (opens near the player's best store, copies its best seller), Chain (big
  budget, fast expansion, weak service), Old Favorite (strong regulars, never expands).
- **Grudges.** Memories are records `{ kind, day, weight, reasonTemplate, actor }`, for example
  undercut, poached manager, bought their building, closed them down, won a price war, broke a
  deal. Grudge score = sum of weights with slow decay. On rival succession the heir inherits
  memories at 50% weight (tunable). Thresholds unlock hostile actions: open next door, match
  prices at a loss, spread bad word of mouth (an awareness and rating penalty in an area).
- **Revenge return.** A rival family that closes keeps its memories in a dormant list. Years
  later (with a probability rising with the grudge) a descendant opens a new shop aimed at the
  player, with their own name and the old history attached.
- **Allies.** A separate relationship score (-100 to 100) moves with deals, marriages and shared
  enemies. Allies can sign non-compete zones and supply deals.
- **Rivals screen** text comes from templates: "The Tan family is undercutting you near the
  school."

---

## 8. Deals, contracts and events

### 8.1 Negotiation

- Counterparties: landlords, suppliers, banks, investors, rival families, relatives.
- Each deal type defines terms (price, length, exclusivity, equity, interest rate, minimum
  volume) with slider ranges. The counterparty has an ideal value and a walk-away value for each
  term, weights from their needs and personality, a relationship modifier and a grudge modifier.
- Offer score = weighted sum of term utilities. `chanceAccept = logistic(k * (score - threshold))`
  is shown live as the sliders move, computed by the same function the worker uses.
- On submit the worker draws once: accept, counteroffer (moves each term toward their ideal by a
  concession rate) or reject. Lowball offers drain a patience bar; at zero they leave and the
  relationship drops.
- Agreed deals become `Contract` records enforced by the monthly finance step: rent with
  escalation, supply prices and minimum volumes with penalties, loan schedules, equity and board
  demands, non-compete zones, share payouts to siblings.

### 8.2 Event engine

Event definition (typed data, one file per group):

```ts
{
  id: "price_war_2",
  group: "rival",
  chain: { id: "price_war", step: 2 },
  when: { all: [ { rivalStrategy: "Discounter" }, { grudgeAtLeast: 30 }, { eraFrom: 1950 } ] },
  weight: 4,
  cooldownDays: 365,
  title: "The {rival.surname} Family Cuts Again",
  text: "{rival.head.first} dropped the price of {product} to {price}. Half the street noticed.",
  choices: [
    { label: "Match the Price", effects: [ { priceMatch: "rival" }, { grudge: +10 } ],
      followUp: { event: "price_war_3", inDays: [20, 40] } },
    { label: "Hold Your Price", effects: [ { demandShift: { area: "rivalStore", pct: -8, days: 60 } } ] },
    { label: "Visit Their Shop", requires: { skill: { people: 6 } },
      effects: [ { relationship: +15 } ], followUp: { event: "price_war_truce" } }
  ]
}
```

- Conditions and effects are closed typed vocabularies (no functions in data), so data can be
  validated, saved and tested. Effects preview their numbers in the choice button tooltip.
- Daily selection: scheduled follow-ups and era events first, then at most one weighted random
  event among eligible ones, with global and per-event cooldowns and a pacing rule (roughly one
  meaningful event every 10 to 20 in-game days, fewer during skips).
- Text placeholders are resolved from state (names, products, prices formatted in the current
  currency). Validation checks every placeholder resolves for every possible context.
- Groups: general, per business type, era and history, location specific, family, rival chains,
  staff, regulars, inspections and money. Target at launch: 220 events.

### 8.3 Eras

- Five eras with year ranges: 1920 to 1945, 1946 to 1979, 1980 to 1999, 2000 to 2014,
  2015 onward. Each era sets: price and wage index curves (per country), product availability per
  business type, payment methods, technology and upgrades, marketing channels, segment tastes
  (as curves by year, for example premium coffee demand rising after 2010), event pools and
  disruptions.
- Disruptions are dated or windowed events with lasting economic modifiers (the Great Depression,
  postwar boom, oil shocks, the arrival of the internet, the 1998 Asian financial crisis for
  Southeast Asian scenarios, the 2008 crash, delivery apps, a pandemic lockdown). They are written
  around their effect on a small business, respectfully and without spectacle.
- Currency changes per region are data (for example the Netherlands Indies guilder to the rupiah,
  the 1965 rupiah redenomination). Balances convert at the official rate with an explanation
  prompt.
- An era transition screen (Libre Caslon Text) explains in a few sentences what changed and how it
  affects the family business.

---

## 9. World data, map and era lens

### 9.1 Place snapshots

All place data is normalized into one format whether it comes from a bundled file, Overpass or
the procedural generator:

```ts
interface PlaceSnapshot {
  version: 1;
  center: [lon, lat]; radiusM: number; source: "bundled" | "overpass" | "procedural";
  fetchedAt?: string;                   // set by the snapshot script, not by the sim
  region: RegionInfo;                   // country code, name pools, currency table, climate
  pois: { id: string; kind: PoiKind; lon: number; lat: number; size: number }[];
  landuse: { kind: LanduseKind; hexAreas: Record<H3Index, number> }[];
  roads: { nodes: Float32Array; edges: Uint32Array; classes: Uint8Array };  // simplified graph
  water?: Polygon[]; parks?: Polygon[];   // for the offline basemap only
}
```

- **Overpass.** One query per location for POIs (schools, universities, offices, markets, transit,
  malls, parks, housing, food and retail), land use polygons and highway ways within the radius.
  Endpoint from `VITE_OVERPASS_URL` with a fallback mirror list, 25 s timeout, response size guard.
  Results are normalized and cached in IndexedDB keyed by rounded coordinates and radius.
- **Bundled snapshots.** `npm run snapshots` builds `/public/snapshots/<id>.json.gz` for every
  preset scenario and every Daily Lease street. Committed to the repo so presets load instantly
  and offline.
- **Procedural fallback.** If Overpass fails, a generator seeded by the rounded coordinates
  creates an organic street grid, arterials, land use and POIs with plausible densities. The
  player sees a notice that the city layout is estimated. In this mode the light dots travel along
  hex-to-hex paths, so they never contradict real streets drawn by the tile map.

### 9.2 Map style and tiles

- The game ships its own MapLibre style template (dark slate night base, family-neutral) in
  `/public/styles/`, referencing a vector tile source in the OpenMapTiles schema. Default source:
  OpenFreeMap (free, no key). `VITE_MAP_STYLE_URL` can point to a different style; with a foreign
  style the era lens falls back to a simple tint.
- Map labels use Barlow glyphs generated by `npm run glyphs` and served from `/public/glyphs`, so
  no system or banned fonts appear on the map. Labels prefer `name:latin`.
- **Offline basemap.** When tiles cannot load (offline, blocked, provider down) the map draws the
  snapshot roads, water and parks with deck.gl `PathLayer` and `SolidPolygonLayer` on the same
  dark base. Preset scenarios are therefore fully playable offline.
- Attribution (OpenStreetMap contributors, OpenMapTiles, tile provider) is always shown through
  the MapLibre attribution control and on the About screen.

### 9.3 Geocoding

- `Geocoder` interface with `search(query)` and `reverse(lon, lat)`; implementations for
  Nominatim (development default), Photon, MapTiler and a self-hosted URL. Selected by
  `VITE_GEOCODER`, `VITE_GEOCODER_URL`, `VITE_GEOCODER_KEY`.
- 400 ms debounce, minimum 3 characters, in-flight request cancellation, IndexedDB cache, and a
  client-side rate limit of one request per second for Nominatim to respect its usage policy.

### 9.4 Era lens

Applied to both the map style and the simulation, from rules in `/src/data/eraLens.ts`:

- **Roads.** Before the year a road class plausibly existed (per region), motorways and trunk
  roads are hidden on the map and removed from the routing graph. Minor roads are thinned for
  early eras with a stable filter on feature id (`["%", ["id"], 100] < density`), so the same
  streets disappear every time.
- **POIs.** Each POI kind has an earliest year and a conversion: malls become markets, office
  towers become warehouses or housing, metro stations do not exist before their region's metro
  year, universities shrink. Converted POIs change the segment flows.
- **Population** follows a city curve by year (for example Jakarta's growth from the 1920s to
  today), scaled into the hex residents.
- **Tint.** Each era has a palette that the style template is rebuilt with: sepia for the 1920s,
  faded print colors for the 1950s, and so on to the modern night palette. Dots and stores stay
  bright on top.

### 9.5 Map layers (deck.gl)

| Layer | deck.gl layer | Notes |
| --- | --- | --- |
| Light dots | `TripsLayer` with additive blending | Paths from origin hex to store over the road graph. Dot count scales with flows, capped by the detail level (6,000 high, 2,500 medium, 800 low). Animated continuously on the main thread from flow data. |
| Stores | `ScatterplotLayer` (core + glow) and `IconLayer` (awning mark) | Family colors |
| Territory | `H3HexagonLayer` | Color by leading family, opacity by margin |
| Pull | `ScatterplotLayer` rings, additive | Soft rings sized by pull strength |
| Supply and grudge arcs | `ArcLayer` | Central kitchen supply lines; grudge arcs on the Rivals screen |
| Marketing reach | `H3HexagonLayer` outline | While planning a campaign |
| Offline basemap | `PathLayer`, `SolidPolygonLayer` | Only when tiles are unavailable |

Path computation: when a store opens or the road graph changes era, the worker runs one Dijkstra
from the store over the road graph and keeps the shortest path tree. A path from any hex is read
from the tree. Paths are sent to the main thread once as a packed `Float32Array`; daily frames
only send flow weights.

Money popups ("+Rp 1.2 jt", "-$340") are pooled DOM elements positioned with `map.project`, so
they render in the game fonts. A cap keeps at most 12 visible.

---

## 10. Interface

### 10.1 Screens

Title, New Game (scenario cards, Free Play setup, seed entry), Location Picker (search, map
click, area preview), Game (map plus panels), Era Transition, Succession, Negotiation, Reports
(quarter and year), Family History Book, Ending and Replay, Daily Lease (start and result card),
Settings, Saves, Achievements, About.

### 10.2 Game screen panels

Top bar (date, speed controls, cash with rolling counter, net worth, alerts tray), left dock
(Store, Finances, Staff, Rivals, Family, Contracts, Upgrades, Marketing), right side detail
inspector for whatever is selected on the map, bottom ticker for news. Keyboard: Space pause,
1 to 5 speed, M map layers, F finances, S staff, R rivals, H family, C contracts, Esc closes.

### 10.3 Components

- `Num` and `Money`: format via the current currency and wrap any value that has a receipt id in
  a hover tooltip that fetches and shows the receipt. A dev-mode check warns if a game number is
  rendered without a receipt.
- `Panel`, `Tabs`, `Slider` with live estimate, `ChanceBar`, `PatienceBar`, `Avatar`, `FamilyChip`,
  `Chart` wrappers over visx with the game theme, `Pointer` for tutorial highlights.
- Price sliders show a live demand estimate computed by calling a pure estimator from
  `/src/sim/demand` on the latest snapshot in the main thread (cheap, single store), so the
  estimate and the real result use the same formula.

### 10.4 State in the main thread

- `useView`: the latest frame from the worker (read only).
- `useUi`: open panels, selection, map layers, camera targets, tutorial step.
- `useSettings`: persisted in IndexedDB (difficulty default, autosave interval, auto-pause rules,
  volumes, UI scale, colorblind palette, reduced motion, camera shake, detail level).
- `useProfile`: achievements unlocked across games, Daily Lease history and streaks.

### 10.5 Theme

CSS variables for the palette (dark slate base, money green, loss red, warning amber, family
colors, era accents). A colorblind palette swaps the money and family colors for a set validated
for deuteranopia and protanopia, and adds shape cues (up and down icons next to gains and
losses). `prefers-reduced-motion` and the setting both turn off camera flights, shake and number
rolling.

---

## 11. Persistence

IndexedDB database `small-fortune` with object stores:

| Store | Contents |
| --- | --- |
| `saves` | `autosave`, `slot1` to `slot5`: `{ meta, stateGz }` where meta has family name, date, scenario, net worth, thumbnail |
| `places` | Overpass results keyed by rounded center and radius |
| `geocode` | Geocoder query cache with expiry |
| `profile` | Achievements, Daily Lease history, streaks |
| `settings` | Settings |

- Saves are versioned; `sim/state/migrate.ts` upgrades older saves. Export writes a `.sfsave`
  file (gzip JSON with a header and checksum); import validates before loading.
- Autosave runs in the worker on the configured interval (in-game months) and at the start of each
  year, and never during an open prompt.

---

## 12. Visual identity, sound and feel

### 12.1 Logo and title

Wordmark SMALL FORTUNE in Barlow Condensed 700 with an original awning mark (a scalloped awning
over a small door). One SVG source generates the favicon, PWA icons and share card art. The title
screen runs a live demo simulation (a bot playing a bundled Jakarta snapshot) under a slow
camera drift at night.

### 12.2 Fonts

Barlow Condensed 600 and 700 for headings and labels (uppercase panel titles, letter spacing
0.04em), Barlow 400 and 500 for body, JetBrains Mono with tabular figures for numbers, money and
dates, Libre Caslon Text only in the history book and era transitions. A lint check fails if
Inter, Roboto, Arial or a generic system font stack appears in CSS.

### 12.3 Game feel

Rolling money counters, floating money popups above stores, a short celebration for milestones,
gentle camera shake for disasters (toggleable), smooth camera flights to events, sounds for sales,
hires, deals and alerts.

### 12.4 Audio

- Sound effects are synthesized by `npm run sfx` into one small sprite file (original sounds,
  no licensing issues) and played with Howler.
- Music: a light generative music system (era-flavored instrument sets and chord loops) running on
  Howler's shared Web Audio context, so one volume system covers everything. If composed tracks
  are later placed in `/public/audio/music/`, the game plays those instead.

---

## 13. Player-facing systems around the core

### 13.1 Daily Lease

- The challenge for a date is derived from the UTC date: number = days since the launch date,
  seed = hash of the number, street = chosen from a pool of bundled snapshots (so every player
  gets the identical city regardless of OpenStreetMap edits), year and business type from the
  seed. One in-game year, Normal difficulty, no undo.
- Result card plus a copy-to-share block made only of keyboard characters.
- Local history and streaks in the profile store. A `LeaderboardClient` interface with a no-op
  implementation keeps room for an online backend later.

### 13.2 Seed codes

A short code like `SF-7KQ2-M9XA` encodes the scenario id, start year, business type, difficulty,
location (preset id, or rounded coordinates for Free Play) and the RNG seed, in Crockford base32
with a checksum. Free Play seeds include a fingerprint of the place snapshot; if a friend's
Overpass data differs the game says the city may not match exactly.

### 13.3 Family history book

Assembled from history records and hand-written templates in `/src/data/historyBook.ts`:
generations, who ran the business and for how long, best and worst years, key events, famous
regulars, old grudges. Rendered as a ledger-style book in Libre Caslon Text; exported as a PNG
image by drawing to a canvas.

### 13.4 Endings and replay

Endings: bankruptcy, family sells the business, a rival buys the family out, fortune target
reached. Each plays a replay built from the quarterly replay frames (store positions, territory,
family colors) with the camera flying through the decades, then offers Keep Playing.

### 13.5 Tutorial

A scripted step machine in Kopi Cipete: open the shop, set a price, hire someone, respond to the
first rival move. Each step highlights real UI with a `Pointer`, waits for the matching action and
can be skipped at any time. The tutorial forces a few deterministic events (the first rival move)
through the event engine's scheduled follow-up mechanism.

---

## 14. Text rules and `npm run lint:text`

- Scans `src/**/*.{ts,tsx,css}`, `index.html`, `public/manifest.webmanifest` and all data files.
- Fails on any character outside printable ASCII (0x20 to 0x7E, plus tab and newline), with file,
  line, column and the offending code point. Name data files under `src/data/names/` and the real
  place name table are allowlisted.
- Extra checks in the same script: no `...` inside strings, no more than one `!` in any single
  string, banned phrases list ("your journey", "build your legacy", "lorem", "TODO" in strings),
  banned font names in CSS, and button labels in data must start with a verb from an allowlist.
- Data validation (also in Vitest): every event has 2 to 4 choices, 1 to 3 sentences, resolvable
  placeholders, valid references and at least one reachable condition set; every upgrade belongs
  to a branch and its prerequisites exist; every achievement predicate references real fields.

---

## 15. Performance plan

- Code split: title screen and shell load first; MapLibre and deck.gl load in parallel with the
  scenario snapshot. Target initial JS under 1 MB gzip, first interactive title screen under 3 s
  on a 10 Mbps connection.
- Simulation under 5 ms per tick for a 6-store game, under 15 ms for a 40-store dynasty game, in
  the worker.
- Rendering: dots on the GPU through `TripsLayer`, flows updated as typed arrays, no React
  re-render per tick for map layers (layers read from a ref store). Panels subscribe to narrow
  slices of `useView`.
- Detail levels (High, Medium, Low) chosen automatically from a short frame time probe and
  adjustable in settings; Low halves dots, disables glow and pull rings.

---

## 16. Testing

- **Unit (Vitest):** rng and dmath, money, calendar, gravity properties (shares sum to 1 with the
  outside option, closer store wins when all else is equal, higher price loses share), queues,
  stock, loans amortization, ledger balance after every tick, succession outcomes, grudge decay and
  inheritance, negotiation acceptance curve, event engine selection and cooldowns, era lens rules.
- **Determinism:** same seed and action log gives the same state hash; golden hashes per scenario.
- **Data validation:** Section 14.
- **Balance:** `npm run balance -- --quick` runs in CI-sized form; the full run is run before each
  phase sign-off.
- **Smoke (Playwright):** start Kopi Cipete with the offline basemap, skip the tutorial, open a
  store, set a price, hire, run 60 days at speed 5, open every panel with its shortcut, check a
  receipt tooltip, save, reload, load, export a save, and assert there are no console errors.

---

## 17. Configuration (`.env.example`)

```
VITE_MAP_STYLE_URL=/styles/night.json
VITE_TILES_URL=https://tiles.openfreemap.org/planet
VITE_OVERPASS_URL=https://overpass-api.de/api/interpreter
VITE_OVERPASS_FALLBACKS=https://overpass.kumi.systems/api/interpreter
VITE_GEOCODER=nominatim            # nominatim | photon | maptiler | custom
VITE_GEOCODER_URL=https://nominatim.openstreetmap.org
VITE_GEOCODER_KEY=
VITE_DAILY_LEASE_EPOCH=2027-01-01
```

---

## 18. Open questions (decisions I need from you)

1. **Network for real place data.** This build container cannot reach Overpass, OpenFreeMap tiles
   or Nominatim (npm works). To bundle real snapshots for the presets I either need those hosts
   allowed in the environment's network settings (`overpass-api.de`, `tiles.openfreemap.org`,
   `nominatim.openstreetmap.org`), or you run `npm run snapshots` locally and commit the output.
   Until then I will develop against the procedural generator and the offline basemap.
2. **Currency symbols.** The ASCII rule conflicts with symbols like the pound, euro and yen signs.
   Proposal: use the ASCII symbol when one exists (`$`, `Rp`, `f` for the guilder) and the ISO
   code otherwise (`EUR 1,200`, `GBP 340`, `JPY 5,000`). Numbers use comma thousands separators
   as in your examples (`Rp 48,200,000`, `+Rp 1.2 jt`).
3. **Feud Street location and year.** The brief does not fix it. Proposal: Court Street,
   Carroll Gardens, Brooklyn, 1958, two Italian-American family bakeries. An alternative is
   Pasar Baru in Jakarta, 1955, to reuse Indonesian content.
4. **Sensitive history in The Long Game.** Batavia 1920 to Jakarta 2026 passes through the
   Japanese occupation, the revolution, 1965 to 1966, and May 1998, when violence targeted
   Chinese-Indonesian families (the rival family is the Tan family). Proposal: show these only as
   their effect on a small business (closures, shortages, currency changes, customers staying
   home), never depict violence, never make them a reward or a joke, and never let rival AI exploit
   them. Tell me if you want any of them left out entirely.
5. **Balance harness count.** I read "1,000 games per scenario" as 1,000 seeds per scenario,
   each played by all five bots (5,000 runs per scenario, about 10 minutes on 4 cores). Say if you
   meant 1,000 per bot.
6. **Music.** Generative music on the Web Audio context (original, small) unless you plan to
   supply composed tracks.
7. **Production geocoder and tiles.** For public launch, which provider do you want (Photon on
   your own server, MapTiler with a key, or another)? This only affects `.env`.
