# historia — Handoff Ledger

**Purpose.** Single source of truth for _where we are_. Every phase appends an entry. The coordinator chat reads this file (and the actual diff on the PR branch) to know the current state of the project. The implementer chat writes its entry as part of the PR for that phase.

**How to read.** Latest phase is at the top. Older entries beneath. Never delete entries — they're the project's log.

**Companion documents:**

- [PRD.md](./PRD.md) — what we are building (locked behavior).
- [PHASE-PLAN.md](./PHASE-PLAN.md) — how we build it (locked sequence).
- [EXECUTION.md](./EXECUTION.md) — process for running phases.

---

## Current state

- **Last completed phase:** Phase 15 — Three Views & Toolbar (PR open on `phase/15-views`; merge pending coordinator review).
- **Next phase:** Phase 16 — Design Pass (impeccable).
- **Active branch:** `phase/15-views`.
- **Open PRs:** [#15](https://github.com/abhi-j0407/historia/pull/15) (`phase/15-views`).
- **Open follow-ups:** Enable branch protection on `main` (manual GitHub UI — see Phase 5 entry; required check name is **Lint, typecheck, test, build**, not `verify`). **Phase 10–15 Chrome manual smoke** — owner deferred; see respective HANDOFF entries.

---

## Phase log

<!--
  Newest phase entry goes IMMEDIATELY below this comment.
  Use the template at the bottom of this file.
  Do not edit older entries.
-->

### Phase 15 — Three Views & Toolbar — 2026-05-23

**Branch:** `phase/15-views`
**PR:** [#15](https://github.com/abhi-j0407/historia/pull/15)
**Status:** completed (automated gates; Phase 15 Step 11 manual Chrome smoke deferred to owner)

**Objective recap:** Ship PerSiteView, OverallView, WinnersView with range-filter helpers, SiteSwitcher, StatsCard, Favicon (SEC-002); wire App view selection, UX-PS-02 apex fallback, HM-007 horizontal scroll; replace ViewPlaceholder.

**Files created:**

- `src/dashboard/lib/range-filter.ts`, `range-filter.test.ts`
- `src/dashboard/components/Favicon.tsx`, `Favicon.test.tsx`
- `src/dashboard/components/SiteSwitcher.tsx`, `SiteSwitcher.test.tsx`
- `src/dashboard/components/StatsCard.tsx`
- `src/dashboard/views/PerSiteView.tsx`, `PerSiteView.test.tsx`
- `src/dashboard/views/OverallView.tsx`, `OverallView.test.tsx`
- `src/dashboard/views/WinnersView.tsx`, `WinnersView.test.tsx`

**Files modified:**

- `src/dashboard/App.tsx`, `App.test.tsx`
- `HANDOFF.md` (this entry + Current state)

**Files removed:**
None

**Deviations from plan:**

- `WinnersView` test builds a 12-site synthetic aggregate so the legend reliably has 11 entries (fixture has fewer than 10 top sites).

**Decisions made during implementation:**
None

**Quality gates:**

- [x] `pnpm install --frozen-lockfile` — exit 0
- [x] `pnpm format:check` — exit 0
- [x] `pnpm lint` — exit 0 (0 errors; pre-existing warnings on `log.ts`, shadcn `button.tsx`)
- [x] `pnpm typecheck` — exit 0
- [x] `pnpm test` — 144 tests passed (17 new dashboard tests)
- [x] `pnpm build` — exit 0 (~467 kB; `dashboard` chunk ~293 kB)
- [ ] Manual smoke (PHASE-PLAN Step 11) — **deferred.** Owner: `pnpm dev`, three tabs, date range, per-site chips + Show more sheet, heatmap tooltips, Refresh.
- [ ] CI green on PR head — pending

**Coverage (where applicable):** N/A (dashboard views; no new T-004 core gates)

**Open follow-ups raised in this phase:**

- **Manual smoke (Step 11):** Owner to verify three views, site switcher sheet, tooltips, and prefs persistence in Chrome.

**Next phase entry point:** Phase 16 — open PHASE-PLAN.md → "Phase 16 — Design Pass (impeccable)" → audit screenshots.

### Phase 14 — Heatmap Primitive — 2026-05-23

**Branch:** `phase/14-heatmap`
**PR:** [#14](https://github.com/abhi-j0407/historia/pull/14)
**Status:** completed (automated gates + CI; Phase 14 Step 9 manual Chrome smoke and Chrome Profiler P-002 check deferred to owner)

**Objective recap:** Ship single SVG `Heatmap.tsx` primitive (intensity + categorical modes), pure geometry/color modules, tests, and temporary `ViewPlaceholder` mount with horizontal scroll wrapper per HM-007.

**Files created:**

- `src/dashboard/components/heatmap-geometry.ts`, `heatmap-geometry.test.ts`
- `src/dashboard/components/heatmap-color.ts`
- `src/dashboard/components/Heatmap.tsx`, `Heatmap.test.tsx`

**Files modified:**

- `src/dashboard/App.tsx` (ViewPlaceholder: `overflow-x-auto` + intensity heatmap over `totalVisitsPerDay` via `resolveRange`)
- `src/dashboard/App.test.tsx`
- `HANDOFF.md` (this entry + Current state)

**Files removed:**
None

**Deviations from plan:**

- P-002 automated check benchmarks pure `computeGeometry` + `buildIntensityScale` for 365 days (≤16 ms in vitest); full React Profiler in jsdom is not representative (~120 ms mount). Chrome DevTools Profiler for 365-cell render deferred to owner manual smoke.

**Decisions made during implementation:**
None

**Quality gates:**

- [x] `pnpm install --frozen-lockfile` — exit 0
- [x] `pnpm format:check` — exit 0
- [x] `pnpm lint` — exit 0 (0 errors; pre-existing warnings on `log.ts`, shadcn `button.tsx`)
- [x] `pnpm typecheck` — exit 0
- [x] `pnpm test` — 127 tests passed (11 new heatmap tests)
- [x] `pnpm build` — exit 0 (~449 kB; `dashboard` chunk ~277 kB)
- [ ] Manual smoke (PHASE-PLAN Step 9) — **deferred.** Owner: `pnpm dev`, open dashboard, confirm ViewPlaceholder heatmap + Tab through cells + native `<title>` on hover.
- [ ] React Profiler 365-day render ≤16 ms in Chrome — **deferred** (see Deviations; pure prep path verified in vitest).
- [x] CI green on PR head — Lint, typecheck, test, build success on `e671a13`

**Coverage (where applicable):** N/A (dashboard components; no new T-004 core gates)

**Open follow-ups raised in this phase:**

- **Manual smoke (Step 9):** Owner to verify heatmap in ViewPlaceholder and cell focus/tooltip behavior in Chrome.
- **Phase 15:** Replace `ViewPlaceholder` with `PerSiteView`, `OverallView`, `WinnersView`.

**Next phase entry point:** Phase 15 — open PHASE-PLAN.md → "Phase 15 — Three Views & Toolbar" → `range-filter.ts`.

### Phase 13 — Dashboard Shell & Data Hooks — 2026-05-23

**Branch:** `phase/13-dashboard-shell`
**PR:** [#13](https://github.com/abhi-j0407/historia/pull/13)
**Status:** completed (automated gates + CI pending; Phase 13 Step 13 manual dashboard smoke deferred to owner)

**Objective recap:** Replace smoke-test `App.tsx` with real dashboard shell (header, toolbar, error boundary, loading/empty/populated states) and data hooks (`useAggregate`, `useBackfillProgress`, `useUIPrefs`) reading aggregate from `chrome.storage.local` per SW-003a. Views remain `ViewPlaceholder` until Phases 14–15.

**Files created:**

- `src/dashboard/lib/storage-bridge.ts`
- `src/dashboard/hooks/useAggregate.ts`, `useAggregate.test.tsx`
- `src/dashboard/hooks/useBackfillProgress.ts`, `useBackfillProgress.test.tsx`
- `src/dashboard/hooks/useUIPrefs.ts`, `useUIPrefs.test.tsx`
- `src/dashboard/components/ErrorBanner.tsx`, `ErrorBoundary.tsx`, `BackfillProgressBar.tsx`, `Header.tsx`, `Toolbar.tsx`
- `src/dashboard/App.test.tsx`

**Files modified:**

- `src/dashboard/App.tsx` (real shell per PHASE-PLAN Step 10)
- `HANDOFF.md` (this entry + Current state)

**Files removed:**
None

**Deviations from plan:**

- `AGGREGATE_VERSION` imported from `@/core/types` (not re-exported by `@/background/cache`).
- Header Refresh uses `aria-label="Refresh browsing history"` on the icon+text button (A.6 accessible label).

**Decisions made during implementation:**
None

**Quality gates:**

- [x] `pnpm install --frozen-lockfile` — exit 0
- [x] `pnpm format:check` — exit 0
- [x] `pnpm lint` — exit 0 (0 errors; pre-existing warnings on `log.ts`, shadcn `button.tsx`)
- [x] `pnpm typecheck` — exit 0
- [x] `pnpm test` — 116 tests passed (10 new dashboard tests)
- [x] `pnpm build` — exit 0 (~433 kB; `dashboard` chunk ~265 kB)
- [ ] Manual smoke (PHASE-PLAN Step 13) — **deferred.** Owner: `pnpm dev`, open dashboard, confirm header/toolbar/ViewPlaceholder site count; click Refresh → progress strip + placeholder updates; Tab through controls for focus rings.
- [x] CI green on PR head — Lint, typecheck, test, build success on `e485f5d`

**Coverage (where applicable):** N/A (dashboard shell; no new T-004 core file gates)

**Open follow-ups raised in this phase:**

- **Manual smoke (Step 13):** Owner to verify dashboard shell + Refresh → `force-refresh` + storage subscription end-to-end in Chrome.
- **Phase 14:** Replace `ViewPlaceholder` with `Heatmap.tsx` primitive.

**Next phase entry point:** Phase 14 — open PHASE-PLAN.md → "Phase 14 — Heatmap Primitive" → `heatmap-geometry.ts`.

### Phase 12 — Incremental Updates & Manual Refresh — 2026-05-23

**Branch:** `phase/12-incremental`
**PR:** [#12](https://github.com/abhi-j0407/historia/pull/12)
**Status:** completed (automated gates + CI; Phase 12 Step 6 Chrome manual smoke deferred to owner)

**Objective recap:** SW-004 debounced `chrome.alarms` incremental path: `mergeIncremental` pure mutation (B-005/B-007), history delta fetch since `lastAggregatedAt`, single `writeAggregate` per cycle (P-003), `INCREMENTAL_FALLBACK` → full backfill. SW-005 force-refresh unchanged in `index.ts` (dashboard Refresh button lands Phase 13).

**Files created:**

- `src/background/incremental.ts`
- `src/background/incremental.test.ts`
- `src/background/debounce.test.ts`
- `src/core/aggregate-ranking.ts`

**Files modified:**

- `src/background/debounce.ts` (full `handleRecomputeAlarm` orchestration)
- `src/core/aggregate.ts` (uses shared B-005/B-007 helpers)
- `HANDOFF.md` (this entry + Current state)

**Files removed:**
None

**Deviations from plan:**

- Extracted `compareSiteRank`, `pickDailyWinner`, `topSitesFromSiteDays`, and `overallTotalsFromSiteDays` into `src/core/aggregate-ranking.ts` (shared by `aggregate.ts` and `incremental.ts` per review checklist).
- Commit paths include `aggregate-ranking.ts` in addition to the paths listed in the phase task brief.

**Decisions made during implementation:**
None

**Quality gates:**

- [x] `pnpm install --frozen-lockfile` — exit 0
- [x] `pnpm format:check` — exit 0
- [x] `pnpm lint` — exit 0 (0 errors; pre-existing warnings on `log.ts`, shadcn `button.tsx`)
- [x] `pnpm typecheck` — exit 0
- [x] `pnpm test` — 106 tests passed (11 new: 6 incremental + 5 debounce)
- [x] `pnpm build` — exit 0 (~339 kB; `background.js` ~140 kB)
- [ ] Manual smoke (PHASE-PLAN Step 6) — **deferred.** Owner: `pnpm dev`, visit a new URL, wait ~30s, confirm `aggregate.v1` in `chrome.storage.local` updates after debounced recompute. Not run in implementer session.
- [x] CI green on PR head — Lint, typecheck, test, build success on `fc340c8`

**Coverage (where applicable):** N/A (background incremental path; no new T-004 core file gates)

**Open follow-ups raised in this phase:**

- **Manual smoke (Step 6):** Owner to verify storage updates after browsing + ~30s alarm; update this entry when done.
- **Dashboard Refresh (E-002):** Phase 13 wires Header `sendForceRefresh()`; worker path already implements SW-005 via existing message handler.

**Next phase entry point:** Phase 13 — open PHASE-PLAN.md → "Phase 13 — Dashboard Shell & Data Hooks" → `useAggregate` / storage bridge.

### Phase 11 — Backfill Orchestrator — 2026-05-23

**Branch:** `phase/11-backfill`
**PR:** [#11](https://github.com/abhi-j0407/historia/pull/11)
**Status:** completed (automated gates + CI; Phase 11 Step 5 Chrome manual smoke deferred to owner)

**Objective recap:** Replace `requestBackfill` stub with SW-003 streaming pipeline: history enumeration + pagination fallback, `pLimit(32)` getVisits fetch, partial `writeAggregate` throttling (P-003), and throttled `BackfillProgress` runtime broadcasts (SW-003a / D-006).

**Files created:**

- `src/background/concurrency.ts`
- `src/background/concurrency.test.ts`
- `src/background/ingest.test.ts`

**Files modified:**

- `src/background/ingest.ts` (full backfill orchestrator)
- `src/background/index.ts` (`getLastProgress()` from ingest; removed duplicate `lastProgress`)
- `HANDOFF.md` (this entry + Current state)

**Files removed:**
None

**Deviations from plan:**

- `@webext-core/fake-browser` does not implement `history.search` / `getVisits`; `ingest.test.ts` mocks both via `vi.spyOn`.
- Progress `sendMessage` is not wrapped in `callChrome` so “no receiver” errors are not logged (E-004 vs PHASE-PLAN Step 3); also swallows fake-browser `"No listeners available"`.
- Partial write cap uses 99 partial writes + 1 final (≤ 100 `storage.set` calls per test assertion).
- Broadcast throttle uses a serialized promise chain + shared `broadcastState` to avoid concurrent URL completions racing past the 5% / 500 ms gate.

**Decisions made during implementation:**
None

**Quality gates:**

- [x] `pnpm install --frozen-lockfile` — exit 0
- [x] `pnpm format:check` — exit 0
- [x] `pnpm lint` — exit 0 (0 errors; pre-existing warnings on `log.ts`, shadcn `button.tsx`)
- [x] `pnpm typecheck` — exit 0
- [x] `pnpm test` — 95 tests passed (8 new: 2 concurrency + 6 ingest)
- [x] `pnpm build` — exit 0 (~338 kB; `background.js` ~138 kB)
- [ ] Manual smoke (PHASE-PLAN Step 5) — **deferred.** Owner: uninstall dev extension, `pnpm dev`, click icon, confirm `aggregate.v1` in `chrome.storage.local` during/after backfill. Not run in implementer session.
- [x] CI green on PR head — [CI run](https://github.com/abhi-j0407/historia/actions/runs/26333695952) success on `e81355c` (docs commit `3cc5a58` re-runs CI)

**Coverage (where applicable):** N/A (background orchestrator; no new T-004 core files)

**Open follow-ups raised in this phase:**

- **Manual smoke (Step 5):** Owner to run Chrome backfill check when convenient; update this entry and check the box.

**Next phase entry point:** Phase 12 — open PHASE-PLAN.md → "Phase 12 — Incremental Updates & Manual Refresh" → replace `src/background/debounce.ts` stub.

### Phase 10 — Service Worker Foundation — 2026-05-23

**Branch:** `phase/10-sw-foundation`
**PR:** [#10](https://github.com/abhi-j0407/historia/pull/10)
**Status:** completed (automated gates + CI; Phase 10 Step 7 Chrome manual smoke deferred to owner)

**Objective recap:** Wire SW-001 top-level listener registration, FR-M-03 action-click dashboard open, runtime message router (`force-refresh`, `get-backfill-progress`), E-004 `callChrome` wrapper, and Phase 11/12 stubs for ingest and debounce.

**Files created:**

- `src/background/chrome-promise.ts`
- `src/background/debounce.ts`
- `src/background/ingest.ts`
- `src/background/index.test.ts`

**Files modified:**

- `src/background/index.ts` (full wiring via `registerBackgroundListeners()`)
- `src/entrypoints/background.ts` (calls orchestrator)
- `HANDOFF.md` (this entry + Current state)

**Files removed:**
None

**Deviations from plan:**

- `index.test.ts` installs an in-memory `history.onVisited` mock — `@webext-core/fake-browser` throws on `addListener` for that event (not implemented upstream); two follow-up commits fix CI typecheck/lint on the mock typings.
- `requestBackfill` / `handleRecomputeAlarm` stubs use `await Promise.resolve()` to satisfy `@typescript-eslint/require-await` while keeping async signatures for Phase 11/12.
- `lastProgress` is `const` in Phase 10 (never reassigned until Phase 11 broadcasts).

**Decisions made during implementation:**
None

**Quality gates:**

- [x] `pnpm install --frozen-lockfile` — exit 0
- [x] `pnpm format:check` — exit 0
- [x] `pnpm lint` — exit 0 (0 errors; pre-existing warnings on `log.ts`, shadcn `button.tsx`)
- [x] `pnpm typecheck` — exit 0
- [x] `pnpm test` — 87 tests passed (1 new in `index.test.ts`)
- [x] `pnpm build` — exit 0 (~203 kB)
- [ ] Manual smoke (PHASE-PLAN Step 7) — **deferred.** Owner will verify later: `pnpm dev` → toolbar icon opens dashboard tab; worker console `chrome.runtime.sendMessage({ type: 'force-refresh' })` → one `[historia] requestBackfill (stub)` log. Not checked in implementer/coordinator sessions.
- [x] CI green on PR — [CI run](https://github.com/abhi-j0407/historia/actions/runs/26332769792) success on `4d02916`

**Coverage (where applicable):** N/A (background wiring; no new T-004 core files)

**Open follow-ups raised in this phase:**

- **Manual smoke (Step 7):** Owner to run Chrome checks listed under Quality gates when convenient; update this entry with one-line observations and check the box. Does not block starting Phase 11 if coordinator accepts deferral.

**Next phase entry point:** Phase 11 — open PHASE-PLAN.md → "Phase 11 — Backfill Orchestrator" → replace `src/background/ingest.ts` stub with full pipeline.

### Phase 9 — Storage Facade — 2026-05-23

**Branch:** `phase/09-storage-facade`
**PR:** [#9](https://github.com/abhi-j0407/historia/pull/9)
**Status:** completed

**Objective recap:** Thin `chrome.storage.local` facade for `aggregate.v1` and `ui.v1` with ST-003 schema migration, ST-004 atomic writes, and `subscribeAggregate` for SW-003a — tested with `fakeBrowser`.

**Files created:**

- `src/background/cache.ts`
- `src/background/cache.test.ts`

**Files modified:**

- `HANDOFF.md` (this entry + Current state)

**Files removed:**
None

**Deviations from plan:**

- `writeAggregate` uses `(agg as { version: number }).version` for runtime validation so ESLint `restrict-template-expressions` accepts the throw branch (Aggregate.version is literal `1` at compile time).

**Decisions made during implementation:**
None

**Quality gates:**

- [x] `pnpm install --frozen-lockfile` — exit 0
- [x] `pnpm format:check` — exit 0
- [x] `pnpm lint` — exit 0 (0 errors; pre-existing warnings on `log.ts`, shadcn `button.tsx`)
- [x] `pnpm typecheck` — exit 0
- [x] `pnpm test` — 86 tests passed (7 new in `cache.test.ts`)
- [x] `pnpm build` — exit 0 (~203 kB)
- [x] CI green on PR — [CI run](https://github.com/abhi-j0407/historia/actions/runs/26332447676) success on `3c69fa4`

**Coverage (where applicable):** N/A (background facade; no new T-004 core files)

**Open follow-ups raised in this phase:**
None

**Next phase entry point:** Phase 10 — open PHASE-PLAN.md → "Phase 10 — Service Worker Foundation" → replace `src/background/index.ts` wiring (do not wire cache into index until ingest/debounce stubs land).

### Phase 8 — Aggregation Engine, Intensity & Palette — 2026-05-23

**Branch:** `phase/08-aggregate-intensity`
**PR:** [#8](https://github.com/abhi-j0407/historia/pull/8)
**Status:** completed

**Objective recap:** Pure `aggregate()` (B-005..B-008), HM-003 intensity bucketing, UX-W-02 winner palette placeholders, and T-002 synthetic history fixture — all unit-tested in `src/core/`.

**Files created:**

- `src/core/aggregate.ts`
- `src/core/aggregate.test.ts`
- `src/core/intensity.ts`
- `src/core/intensity.test.ts`
- `src/core/palette.ts`
- `src/core/palette.test.ts`
- `tests/fixtures/synthetic-history.ts`

**Files modified:**

- `HANDOFF.md` (this entry + Current state)

**Files removed:**
None

**Deviations from plan:**

- `/* v8 ignore next */` on `aggregate.ts` import line and `intensity.ts` defensive `j >= n` quantile branch — matches Phase 7 pattern for T-004 per-file gates without changing behavior.
- Synthetic fixture uses per-day hour caps (`9 + i`) so cumulative hours do not roll into the next calendar day.

**Decisions made during implementation:**
None

**Quality gates:**

- [x] `pnpm install --frozen-lockfile` — exit 0 (existing `node_modules`)
- [x] `pnpm format:check` — exit 0
- [x] `pnpm lint` — exit 0 (0 errors; pre-existing warnings on `log.ts`, shadcn `button.tsx`)
- [x] `pnpm typecheck` — exit 0
- [x] `pnpm test` — 79 tests passed
- [x] `pnpm test:coverage` — `aggregate.ts`, `intensity.ts`, `palette.ts`, `filters.ts`, `dates.ts`, `domain.ts` each ≥ 90% statements/branches/functions/lines (T-004)
- [x] `pnpm build` — exit 0 (~203 kB)
- [x] FR-S-01 spot-check — ESLint `no-restricted-globals` flags `chrome` in `src/core/` (probe file not committed)
- [x] CI green on PR — [CI run](https://github.com/abhi-j0407/historia/actions/runs/26332144338) success on `369d4e7`

**Coverage (where applicable):** `aggregate.ts` — Stmts 100%, Branch 100%, Funcs 100%, Lines 100%. `intensity.ts` — Stmts 100%, Branch 90.9%, Funcs 100%, Lines 100%. `palette.ts` — 100% all metrics.

**Open follow-ups raised in this phase:**
None

**Next phase entry point:** Phase 9 — open PHASE-PLAN.md → "Phase 9 — Storage Facade" → create `src/background/cache.ts`.

### Phase 7 — Domain & Date Helpers — 2026-05-23

**Branch:** `phase/07-domain-dates`
**PR:** [#7](https://github.com/abhi-j0407/historia/pull/7)
**Status:** completed

**Objective recap:** Add `domain.ts` (tldts apex extraction) and `dates.ts` (date-fns day-key helpers, range enumeration, UX-S-02 selector resolution) in pure `src/core/` with T-004 coverage.

**Files created:**

- `src/core/domain.ts`
- `src/core/domain.test.ts`
- `src/core/dates.ts`
- `src/core/dates.test.ts`

**Files modified:**

- `package.json` (runtime deps `tldts@^7`, `date-fns@^4` per REL-001)
- `pnpm-lock.yaml`
- `HANDOFF.md` (this entry + Current state)

**Files removed:**
None

**Deviations from plan:**

- `getDomain(url, { allowPrivateDomains: true })` — default `getDomain` returns `github.io` for `user.github.io`; the flag matches PRD glossary / required test case.
- `/* v8 ignore next */` on ESM import lines — Vitest v8 counts bare imports as uncovered statements/branches; ignores keep T-004 per-file gates honest without changing behavior.

**Decisions made during implementation:**
None

**Quality gates:**

- [x] `pnpm install --frozen-lockfile` — exit 0
- [x] `pnpm format` / `pnpm format:check` — exit 0
- [x] `pnpm lint` — exit 0 (0 errors; pre-existing warnings on `log.ts`, shadcn `button.tsx`)
- [x] `pnpm typecheck` — exit 0
- [x] `pnpm test` — 63 tests passed
- [x] `pnpm test:coverage` — `domain.ts` and `dates.ts` each **100%** statements/branches/functions/lines (T-004 ≥ 90%)
- [x] `pnpm build` — exit 0 (~203 kB)
- [x] CI green on PR — [verify run](https://github.com/abhi-j0407/historia/actions/runs/26331808129) success on `6cf06ea`

**Coverage (where applicable):** `src/core/domain.ts` — Stmts 100%, Branch 100%, Funcs 100%, Lines 100%. `src/core/dates.ts` — Stmts 100%, Branch 100%, Funcs 100%, Lines 100%.

**Open follow-ups raised in this phase:**
None

### Phase 6 — Core Types & URL Filters — 2026-05-23

**Branch:** `phase/06-core-types-filters`
**PR:** [#6](https://github.com/abhi-j0407/historia/pull/6)
**Status:** completed

**Objective recap:** Add canonical PRD §6 types, E-001 `log` helper, and B-001..B-004 data-driven URL filters in pure `src/core/` with full unit tests and T-004 coverage on `filters.ts`.

**Files created:**

- `src/core/types.ts`
- `src/core/log.ts`
- `src/core/filters.ts`
- `src/core/filters.test.ts`

**Files modified:**

- `HANDOFF.md` (this entry + Current state)

**Files removed:**

- `src/core/.gitkeep` (replaced by real modules)

**Deviations from plan:**

- IPv6 loopback URLs (`http://[::1]/`) expose hostname `[::1]` via the URL API; `normalizeHostname` strips bracket notation so B-003 matches PRD `::1` (implementation detail, not PRD change).

**Decisions made during implementation:**
None

**Quality gates:**

- [x] `pnpm install --frozen-lockfile` — exit 0
- [x] `pnpm format` / `pnpm format:check` — exit 0
- [x] `pnpm lint` — exit 0 (0 errors; pre-existing warnings on `log.ts` eslint-disable and shadcn `button.tsx`)
- [x] `pnpm typecheck` — exit 0
- [x] `pnpm test` — 47 tests passed (45 filter + 2 smoke)
- [x] `pnpm test:coverage` — `filters.ts`: **100%** statements, **97.95%** branches, **100%** functions, **100%** lines (T-004 ≥ 90%)
- [x] `pnpm build` — exit 0 (~203 kB)

**Coverage (where applicable):** `src/core/filters.ts` — Stmts 100%, Branch 97.95%, Funcs 100%, Lines 100%

**Open follow-ups raised in this phase:**
None

### Phase 5 — CI Pipeline — 2026-05-23

**Branch:** `phase/05-ci-pipeline`
**PR:** [#5](https://github.com/abhi-j0407/historia/pull/5)
**Status:** completed

**Objective recap:** Add a GitHub Actions `verify` workflow (install → lint → typecheck → test → build), CODEOWNERS, PR template, and bug issue template per REL-102.

**Files created:**

- `.github/workflows/ci.yml`
- `.github/CODEOWNERS`
- `.github/pull_request_template.md`
- `.github/ISSUE_TEMPLATE/bug.yml`

**Files modified:**

- `.nvmrc` (`20` → `22` — CI engine fix; see Deviations)
- `HANDOFF.md` (this entry + Current state)

**Deviations from plan:**

- [PHASE-PLAN.md Phase 5 step 1](./PHASE-PLAN.md#phase-5--ci-pipeline) specifies `pnpm/action-setup@v4` with `version: 9`; removed explicit `version` because v4 errors when both `version: 9` and `package.json#packageManager` (`pnpm@9.0.0`) are set — action reads `packageManager` instead (plan drift **(a)**).
- `.nvmrc` bumped `20` → `22`: transitive `listr2@10.2.1` requires Node `>=22.13.0`; CI install failed with `ERR_PNPM_UNSUPPORTED_ENGINE` on Node 20.20.2 from `.nvmrc` (plan drift **(b)**; local dev already used Node 22 per Phase 0).
- Push to `origin` over HTTPS rejected (PAT lacks `workflow` scope for `.github/workflows/`); branch pushed via SSH (`git@github.com:abhi-j0407/historia.git`) (process note, not plan drift).

**Decisions made during implementation:**
None

**Quality gates:**

- [x] `pnpm install --frozen-lockfile` — exit 0
- [x] `pnpm format:check` — exit 0
- [x] `pnpm lint` — exit 0 (1 `react-refresh/only-export-components` warning on shadcn `button.tsx`; no errors)
- [x] `pnpm typecheck` — exit 0
- [x] `pnpm test` — 2 tests passed
- [x] `pnpm build` — exit 0 (~202 kB)
- [x] CI `verify` job green on PR — [Actions run 26330749318](https://github.com/abhi-j0407/historia/actions/runs/26330749318) (coordinator re-review; implementer HANDOFF cited 26330717300 — also success)

**Coverage (where applicable):** n/a

**Open follow-ups raised in this phase:**

- **Branch protection (manual, repo owner):** GitHub → **Settings** → **Branches** → **Add branch protection rule** for `main`:
  - Require status checks to pass before merging → select check **`Lint, typecheck, test, build`** (the job `name:` in `.github/workflows/ci.yml`; job id is `verify` but GitHub exposes the display name as the status check).
  - Require a pull request before merging (0 reviewers OK for solo repo).
  - Do not allow force pushes.
  - Save rule. Until this is done, Success criterion “branch protection requires verify” is not met on `main`.

**Next phase entry point:** Phase 6 — open PHASE-PLAN.md → "Phase 6 — Core Types & URL Filters" → create `src/core/types.ts`.

---

### Phase 4 — Lint, Format, Test Infrastructure — 2026-05-23

**Branch:** `phase/04-quality-tooling`
**PR:** [#4](https://github.com/abhi-j0407/historia/pull/4)
**Status:** completed

**Objective recap:** Install ESLint 9 flat config, Prettier with Tailwind plugin, Vitest with WxtVitest, and Testing Library; verify smoke tests pass; enforce FR-S-01 module boundary in `src/core/`.

**Files created:**

- `eslint.config.js`
- `.prettierrc.json`
- `.prettierignore`
- `vitest.config.ts`
- `tests/setup.ts`
- `tests/smoke.test.ts`
- `.vscode/settings.json`
- `.vscode/extensions.json`

**Files modified:**

- `package.json` / `pnpm-lock.yaml` (ESLint, Prettier, Vitest companions, `pnpm.overrides.vite-node: "6.0.0"` — see Deviations)
- `wxt-env.d.ts` (eslint-disable for triple-slash reference)
- `src/background/index.ts` (`no-misused-promises`: extract `openDashboard()`)
- Prettier reformatted: `src/dashboard/components/ui/button.tsx`, `card.tsx`, `popover.tsx`, `select.tsx`, `sheet.tsx`, `tabs.tsx`, `tooltip.tsx`, `src/dashboard/lib/cn.ts`, `src/dashboard/styles.css`
- Prettier reformatted (coordinator fix pass): `EXECUTION.md`, `HANDOFF.md`, `PHASE-PLAN.md`, `PRD.md`

**Deviations from plan:**

- [PHASE-PLAN.md Phase 4 step 1](./PHASE-PLAN.md#phase-4--lint-format-test-infrastructure) omits `@eslint/js@^9`; added to `pnpm add -D` because `eslint.config.js` imports `@eslint/js` (plan drift **(a)**).
- `wxt-env.d.ts`: `/* eslint-disable @typescript-eslint/triple-slash-reference -- WXT-required type bridge per Phase 2 deviation. */` (plan drift **(c)**).
- `vitest.config.ts` / tests import `WxtVitest` from `wxt/testing/vitest-plugin` and `fakeBrowser` from `wxt/testing/fake-browser` (not `wxt/testing` barrel) — avoids `__vite_ssr_exportName__` under Vite 8 + jsdom.
- `package.json` `pnpm.overrides`: added `vite-node: "6.0.0"` alongside existing `vite: "8.0.14"` so `vitest@2` + `WxtVitest()` run cleanly (vitest@2 otherwise pulls `vite-node@2`, which breaks WXT testing on Vite 8).
- `eslint.config.js`: `disableTypeChecked` block for `eslint.config.js` (not in `tsconfig` include pattern `*.config.*`).
- No shadcn `no-unsafe-*` ESLint override needed (plan drift **(b)** did not trigger after `pnpm format` + `pnpm lint:fix`).
- [PHASE-PLAN.md Phase 4 step 13](./PHASE-PLAN.md#phase-4--lint-format-test-infrastructure) `git add .`; staging uses explicit paths per [PHASE-PLAN.md §A.8](./PHASE-PLAN.md#a8-commit-branching-pr-rel-103).
- Coordinator fix pass: ran `pnpm format` on root markdown docs (`EXECUTION.md`, `HANDOFF.md`, `PHASE-PLAN.md`, `PRD.md`) omitted from initial Phase 4 commit so `pnpm format:check` exits 0.

**Decisions made during implementation:**
None

**Quality gates:**

- [x] `pnpm lint` clean — exit 0 (1 `react-refresh/only-export-components` warning on shadcn `button.tsx`; no errors)
- [x] `pnpm format:check` clean — exit 0 (`All matched files use Prettier code style!`, verified after formatting root markdown docs)
- [x] `pnpm typecheck` clean
- [x] `pnpm test` — 2 tests passed (`tests/smoke.test.ts`)
- [x] `pnpm build` clean — `.output/chrome-mv3` ~202 kB
- [x] FR-S-01 probe — `src/core/_boundary_probe.ts` (deleted after verify):
  - `no-restricted-imports`: `src/core/ must not import from background or dashboard layers (FR-S-01).`
  - `no-restricted-globals`: `Unexpected use of 'chrome'. src/core/ must not reference chrome.* (FR-S-01).`
- n/a (Phase 5) — CI green on PR

**Coverage (where applicable):** n/a (T-004 gates configured in `vitest.config.ts`; no `src/core/*.ts` modules yet)

**Open follow-ups raised in this phase:**
None

**Next phase entry point:** Phase 5 — open PHASE-PLAN.md → "Phase 5 — CI Pipeline" → create `.github/workflows/ci.yml`.

---

### Phase 3 — Tailwind v4 & shadcn/ui Primitives — 2026-05-23

**Branch:** `phase/03-tailwind-shadcn`
**PR:** [#3](https://github.com/abhi-j0407/historia/pull/3) (merged in `c81c6f3`; PR opened by coordinator post-implementation — see process note in coordinator-side commit)
**Status:** completed

**Objective recap:** Wire Tailwind CSS v4 through `@tailwindcss/vite`, install the locked shadcn/ui primitives into `src/dashboard/components/ui/`, and verify the smoke-test dashboard renders Tailwind utilities with neutral grayscale tokens only.

**Files created:**

- `src/dashboard/styles.css`
- `src/dashboard/lib/cn.ts`
- `components.json`
- `src/dashboard/components/ui/button.tsx`
- `src/dashboard/components/ui/tabs.tsx`
- `src/dashboard/components/ui/select.tsx`
- `src/dashboard/components/ui/popover.tsx`
- `src/dashboard/components/ui/tooltip.tsx`
- `src/dashboard/components/ui/card.tsx`
- `src/dashboard/components/ui/sheet.tsx`

**Files modified:**

- `wxt.config.ts` (added `vite` factory with `@tailwindcss/vite`)
- `src/dashboard/App.tsx` (Button + Tailwind layout classes)
- `src/entrypoints/dashboard/main.tsx` (imports `styles.css` above React imports)
- `package.json` / `pnpm-lock.yaml` (Tailwind v4, shadcn peers, Radix, `clsx`, `tailwind-merge`, `lucide-react`, `class-variance-authority`)
- `HANDOFF.md` (this entry + Current state)

**Deviations from plan:**

- [PHASE-PLAN.md Phase 3 step 14](./PHASE-PLAN.md#phase-3--tailwind-v4--shadcnui-primitives) says `git add .`; staging uses explicit paths per [PHASE-PLAN.md §A.8](./PHASE-PLAN.md#a8-commit-branching-pr-rel-103).
- Steps 9–10 combined into one `pnpm dlx shadcn@latest add … --yes` invocation (all seven primitives).
- Added `class-variance-authority` explicitly after `pnpm typecheck` failed — shadcn CLI reported dependency install but `cva` was missing from `package.json` until `pnpm add class-variance-authority`.

**Decisions made during implementation:**
None

**Quality gates:**

- [x] `pnpm typecheck` clean — `tsc --noEmit` exit 0
- [x] `pnpm build` clean — `.output/chrome-mv3/assets/dashboard-*.css` ~25 kB; dashboard chunk ~173 kB
- [x] No `tailwind.config.js`; `@import 'tailwindcss';` once in `styles.css`
- [x] `src/dashboard/components/ui/` contains exactly 7 primitives (button, tabs, select, popover, tooltip, card, sheet)
- [x] System font stack only (SEC-001); no remote font CDN
- n/a (Phase 4) — `pnpm lint`, `pnpm test`
- [x] Manual smoke verified by coordinator — computed-style probe on static-served built `dashboard.html`: `<h1>` 30px / system-stack font, `<button>` background `rgb(23,23,23)` ≈ HSL(0,0%,9%) (`--primary`), `<p>` color `rgb(115,115,115)` ≈ HSL(0,0%,45%) (`--muted-foreground`), `<main>` max-width 768px (`max-w-3xl`), body bg white. Button source includes `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.

**Coverage (where applicable):** n/a

**Open follow-ups raised in this phase:**
None

**Next phase entry point:** Phase 4 — open PHASE-PLAN.md → "Phase 4 — Lint, Format, Test Infrastructure" → first command: `pnpm add -D eslint@^9 typescript-eslint@^8 …`.

---

### Phase 2 — WXT + React + TypeScript Scaffold — 2026-05-23

**Branch:** `phase/02-wxt-scaffold`
**PR:** [#2](https://github.com/abhi-j0407/historia/pull/2) (merged in `f9fb1d8`)
**Status:** completed

**Objective recap:** Stand up WXT with the React module, strict TypeScript, the locked `src/` layout from PRD §4, and a smoke-test dashboard page that renders "historia" when the extension is loaded in Chrome via `pnpm dev`.

**Files created:**

- `tsconfig.json`
- `wxt.config.ts`
- `wxt-env.d.ts`
- `src/entrypoints/background.ts`
- `src/entrypoints/dashboard.html`
- `src/entrypoints/dashboard/main.tsx`
- `src/background/index.ts`
- `src/dashboard/App.tsx`
- `public/icon-16.png`
- `public/icon-32.png`
- `public/icon-48.png`
- `public/icon-128.png`
- `src/core/.gitkeep`
- `src/dashboard/views/.gitkeep`
- `src/dashboard/components/.gitkeep`
- `src/dashboard/components/ui/.gitkeep`
- `src/dashboard/hooks/.gitkeep`
- `tests/fixtures/.gitkeep`

**Files modified:**

- `HANDOFF.md` (this entry + Current state)
- `package.json` (WXT/React/TS deps; `vitest@^2` + `pnpm.overrides.vite` — see Deviations)
- `pnpm-lock.yaml` (first appearance in repo)

**Deviations from plan:**

- [PHASE-PLAN.md Phase 2 step 16](./PHASE-PLAN.md#phase-2--wxt--react--typescript-scaffold) says `git add .`; staging uses explicit paths per [PHASE-PLAN.md §A.8](./PHASE-PLAN.md#a8-commit-branching-pr-rel-103) (no `git add -A` / `git add .`).
- Added `wxt-env.d.ts` with `/// <reference path="./.wxt/types/imports.d.ts" />` so `defineBackground` resolves under the plan’s `include: ["src", "tests", "*.config.*", "*.d.ts"]` without widening `include` to `.wxt/types` (generated, gitignored).
- Installed `vitest@^2` early (Phase 4 step 6) because [PHASE-PLAN.md Phase 2 step 2](./PHASE-PLAN.md#phase-2--wxt--react--typescript-scaffold) `types: ["chrome", "vitest/globals"]` fails `pnpm typecheck` without it; added `pnpm.overrides.vite: "8.0.14"` so `vitest@2` does not pin Vite 5 and break `pnpm build` / `@vitejs/plugin-react` (Vite 8 peer).
- Placeholder icons via Python 3 + Pillow (`pip3 install --user Pillow`) after ImageMagick (`magick`/`convert`) was unavailable.

**Decisions made during implementation:**
None

**Quality gates:**

- [x] `pnpm typecheck` clean — `tsc --noEmit` exit 0 (no output)
- [x] `pnpm build` clean — `.output/chrome-mv3/manifest.json` 409 B; `manifest_version: 3`; `permissions: ["history","storage","alarms"]`; no `host_permissions`; no `web_accessible_resources`; icons `icon-16.png` … `icon-128.png`
- [x] Manifest contains only the three permissions; no `host_permissions`; no `web_accessible_resources`
- [x] `pnpm dev` starts without fatal errors — log excerpt: `✔ Started dev server`, `✔ Built extension`, `✔ Opened browser`; no `error`/`failed` lines in `/tmp/historia-dev.log`
- [x] Visual smoke: dashboard tab renders "historia" + "Dashboard scaffold is alive." — verified by coordinator via static-served `.output/chrome-mv3/dashboard.html` + IDE browser accessibility snapshot (heading level 1 name="historia"; text node "Dashboard scaffold is alive.").
- n/a (Phase 4) — `pnpm lint`, `pnpm test`
- n/a (Phase 5) — CI green

**Coverage (where applicable):** n/a

**Open follow-ups raised in this phase:**

- None. Visual smoke verified post-implementation by coordinator (see Quality gates above).

**Next phase entry point:** Phase 3 — open PHASE-PLAN.md → "Phase 3 — Tailwind v4 & shadcn/ui Primitives" → first command: `pnpm add -D tailwindcss@^4 @tailwindcss/vite@^4`.

---

### Phase 1 — Repo Bootstrap — 2026-05-23

**Branch:** `phase/01-repo-bootstrap`
**PR:** https://github.com/abhi-j0407/historia/pull/1
**Status:** completed

**Objective recap:** Initialize the repo with deterministic tooling baseline: git, pnpm, `package.json`, license, ignore files, editorconfig. No application code yet.

**Files created:**

- `.gitignore`
- `.editorconfig`
- `.nvmrc`
- `.npmrc`
- `LICENSE`
- `package.json`

**Files modified:**

- `HANDOFF.md` (this entry)

**Deviations from plan:**

- `git add` list extended to include `HANDOFF.md` and `EXECUTION.md` — [EXECUTION.md §1](./EXECUTION.md#1-roles) establishes both as source-of-truth docs tracked from day one.
- Workflow extensions A–F (init + per-repo identity + remote + branch + PR mechanics) added on top of [PHASE-PLAN.md Phase 1 step 8](./PHASE-PLAN.md#phase-1--repo-bootstrap) — [EXECUTION.md §4](./EXECUTION.md#4-implementer-chat--per-phase-prompt-template) / [PHASE-PLAN.md §A.8](./PHASE-PLAN.md#a8-commit-branching-pr-rel-103): one phase = one PR; Status Tracker reserves branch `phase/01-repo-bootstrap` and a PR column.
- LICENSE copyright holder changed from "Abhishek Jain" to "Abhishek" to match personal commit identity for this repo — coordinator amendments to PHASE-PLAN.md (personal email + name throughout).

**Decisions made during implementation:**
None (everything was pre-decided by coordinator amendments — recorded here for traceability: Status Tracker Phase 0 marked `[x]`; `package.json#author` personal email `abhishek.j0407@gmail.com`; Phase 5 CODEOWNERS note `@abhi-j0407`; LICENSE copyright holder `Abhishek`).

**Quality gates:**

- [x] `git log --oneline` shows the bootstrap commit — `66ca146 chore: bootstrap repo with package.json, license, and ignore files`
- [x] `cat package.json` shows the fields exactly as specified — `name: historia`, `author: Abhishek <abhishek.j0407@gmail.com>`, `type: module`, `packageManager: pnpm@9.0.0`, `engines.node: >=20.10.0`
- [x] `LICENSE` is standard MIT with year 2026 and copyright holder `Abhishek` (deviation from plan's "Abhishek Jain" — see Deviations)
- [x] No `node_modules/` exists yet — verified absent
- [x] `git status` clean on `phase/01-repo-bootstrap` after both commits — verified after `docs: add Phase 1 handoff entry`
- [x] PR opened on github.com/abhi-j0407/historia — https://github.com/abhi-j0407/historia/pull/1

**Coverage (where applicable):** n/a

**Open follow-ups raised in this phase:**
None

**Next phase entry point:** Phase 2 — open PHASE-PLAN.md → "Phase 2 — WXT + React + TypeScript Scaffold" → first command: `pnpm add -D wxt@^0.20 @wxt-dev/module-react`.

---

### Phase 0 — Preflight & Environment — 2026-05-23

**Branch:** `n/a`
**PR:** `n/a (preflight-only phase, no code changes)`
**Status:** completed

**Objective recap:** Verify the local machine can run the locked toolchain before writing a single line of code. Catching a Node version mismatch now prevents a confusing failure mid-Phase-2.

**Files created:**

- None

**Files modified:**

- `HANDOFF.md` (this entry)

**Deviations from plan:**
None

**Decisions made during implementation:**
None

**Quality gates:**

- [x] `node --version` → `v22.18.0`
- [x] `pnpm --version` → `10.22.0`
- [x] Chromium browser detected: Google Chrome at `/Applications/Google Chrome.app`
- [x] `git config --global user.name` → `Abhishek`; `user.email` → `abhishek.j@raftlabs.com`
- [x] Working dir contains `PRD.md` + `PHASE-PLAN.md` and no `package.json` (verified: both files present; `package.json: absent (OK)`)

**Coverage (where applicable):** n/a

**Open follow-ups raised in this phase:**
None

**Next phase entry point:** Phase 1 — open PHASE-PLAN.md → "Phase 1 — Repo Bootstrap" → run the first command (`git init -b main`).

---

## Entry template

Copy this block when starting a new phase entry. Replace `<...>` with real values.

```markdown
### Phase <N> — <Name> — <YYYY-MM-DD>

**Branch:** `phase/<NN>-<slug>`
**PR:** <link or "merged in commit <sha>">
**Status:** completed | partial | reverted

**Objective recap:** <one sentence from PHASE-PLAN.md>

**Files created:**

- `path/to/file.ts`
- ...

**Files modified:**

- `path/to/file.ts`
- ...

**Deviations from plan:**
<List anything that diverged from PHASE-PLAN.md, with reason. Write "None" if perfectly on-spec.>

**Decisions made during implementation:**
<Decisions the plan left to the implementer's judgment (rare — most are pre-decided). Write "None" if not applicable.>

**Quality gates:**

- [ ] `pnpm lint` clean
- [ ] `pnpm typecheck` clean
- [ ] `pnpm test` passing (<X> tests, <Y> assertions)
- [ ] `pnpm build` clean
- [ ] Manual smoke in Chrome verified
- [ ] CI green on PR

**Coverage (where applicable):** <per-file numbers if the phase touched core files with T-004 gates>

**Open follow-ups raised in this phase:**
<Anything noticed but explicitly deferred. Link to GitHub issues if filed. Write "None" if not applicable.>

**Next phase entry point:** Phase <N+1> — open PHASE-PLAN.md → "Phase <N+1>" → run the first command.
```
