# historia — Product Requirements Document

**Version:** 0.2 (post-review, pre-implementation)
**Last updated:** 2026-05-22
**Owner:** Abhishek Jain
**Status:** Approved scope + stack; ready for phase planning.

---

## 0. Document Conventions

This PRD is the canonical source of truth for v1. Phase plans, design specs, and implementation PRs reference these IDs.

### 0.1 ID schemes
| Prefix | Meaning |
|---|---|
| `D-###` | Data model / type contract |
| `FR-###` | Functional requirement (what the product does) |
| `B-###` | Behavioral rule (filter, aggregation, tie-break) |
| `UX-###` | UI specification (layout, interaction, copy) |
| `HM-###` | Heatmap renderer contract |
| `SW-###` | Service worker / background behavior |
| `ST-###` | Storage schema / cache rules |
| `P-###` | Performance / reliability target |
| `E-###` | Error handling rule |
| `T-###` | Testing requirement |
| `REL-###` | Build, distribution, release rule |
| `SEC-###` | Privacy / security rule |

### 0.2 Section block conventions
Each requirement uses one or more of:
- **Rule:** the normative statement (MUST / SHOULD / MAY per RFC 2119)
- **Invariant:** a property that must hold at all times
- **Acceptance:** how we verify it's met (testable)
- **Out of scope:** explicit exclusions to prevent over-building
- **Why:** rationale (kept short, only where non-obvious)

If a phase plan, design doc, or PR contradicts this document, this document wins until it is explicitly amended.

---

## 1. Vision & Scope

### 1.1 Vision
A personal-use Chrome extension that turns a user's local browsing history into GitHub-style activity heatmaps and per-site stats. Spotify-Wrapped-inspired but URL-level only; no content interpretation.

### 1.2 In scope (v1)
- Manifest V3 Chrome extension (works on all Chromium variants automatically)
- Full-page dashboard opens in a new tab when the toolbar icon is clicked
- Three views: per-site heatmap (with site switcher), overall daily heatmap, daily winners calendar
- Local-only data processing using `chrome.history` API
- Aggregates cached in `chrome.storage.local` with auto-refresh on new visits

### 1.3 Out of scope — deferred (post-v1)
| ID | Item | Note |
|---|---|---|
| OOS-D-01 | User accounts | No auth, no sync |
| OOS-D-02 | Extended history beyond Chrome's ~90-day retention | Would require accounts + backend |
| OOS-D-03 | Dark theme | Light only for v1 |
| OOS-D-04 | Per-domain custom subdomain rules | Apex-domain rollup only |
| OOS-D-05 | Multi-user / public launch posture | Personal/portfolio only |
| OOS-D-06 | Firefox / Safari support | Chromium only |

### 1.4 Out of scope — discarded (do not revisit without explicit user request)
| ID | Item | Why |
|---|---|---|
| OOS-X-01 | Web app on Vercel | File upload friction defeats the goal |
| OOS-X-02 | LLM domain categorization | Not analyzing content |
| OOS-X-03 | YouTube Data API enrichment | Not analyzing content |
| OOS-X-04 | Shallalist / hardcoded category maps | Not categorizing |
| OOS-X-05 | DuckDB-WASM | Overkill for URL-level stats |
| OOS-X-06 | Python backend | No backend in v1 |
| OOS-X-07 | Popup / sidepanel / new-tab override | Full-page dashboard chosen |
| OOS-X-08 | `chrome.history.search`-only ingestion | Loses per-day accuracy; see [SW-002](#sw-002) |

---

## 2. Glossary

| Term | Definition |
|---|---|
| **Apex domain** | The registrable domain per the Public Suffix List. `mail.google.com` → `google.com`. `user.github.io` → `user.github.io` (since `github.io` is itself a PSL entry). |
| **Visit** | A single hit to a URL with a timestamp, as returned by `chrome.history.getVisits()`. |
| **Day** | A calendar day in the user's local timezone, encoded as `YYYY-MM-DD`. |
| **Winner** | For a given day, the apex with the highest visit count (after filtering), with ties broken per [B-005](#b-005). |
| **Aggregate** | The derived dataset cached in `chrome.storage.local`. See [D-005](#d-005) and [ST-001](#st-001). |
| **Backfill** | The initial pass through `chrome.history` on first install (or after cache invalidation). |
| **Incremental update** | A re-aggregation triggered by new `onVisited` events; processes only the delta since `lastAggregatedAt`. |

---

## 3. Tech Stack (locked)

| Area | Choice | Pinned version family |
|---|---|---|
| Extension framework | WXT + `@wxt-dev/module-react` | `wxt@^0.20` |
| Frontend | React + TypeScript (strict) | `react@^18`, `typescript@^5.4` |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` | `tailwindcss@^4`, `@tailwindcss/vite@^4` |
| Component primitives | shadcn/ui (Radix under the hood) | latest at scaffold time |
| Class merging | `clsx` + `tailwind-merge` (via shadcn `cn` helper) | latest at scaffold time |
| Domain parsing | `tldts` | `tldts@^7` |
| Date utilities | `date-fns` | `date-fns@^4` |
| Icons | `lucide-react` | latest at scaffold time |
| Testing | Vitest + `WxtVitest()` + `@testing-library/react` | `vitest@^2` |
| Linting | ESLint 9 flat config | `eslint@^9` |
| Formatting | Prettier + `prettier-plugin-tailwindcss` | latest |
| Package manager | pnpm | `pnpm@^9` |

**Rule REL-001 — Locked stack.** Do not introduce additional runtime dependencies without an explicit amendment to this section. Dev dependencies for tooling are permitted when they don't ship to the user.

**Rule REL-002 — No state management library.** `useState` and prop drilling only. If state propagation becomes painful in a specific component tree, a local React Context is acceptable; do not introduce Redux/Zustand/Jotai.

**Rule REL-003 — No router.** A single dashboard page with internal view switching via `useState`. Persist `lastView` to `chrome.storage.local`.

---

## 4. Project Structure

```
historia/
├── PRD.md                       (this document)
├── PRIVACY.md                   (CWS-linked privacy policy)
├── README.md                    (install + dev instructions)
├── LICENSE                      (MIT)
├── package.json
├── pnpm-lock.yaml
├── wxt.config.ts                (manifest config, modules, vite plugins)
├── tsconfig.json
├── eslint.config.js             (flat config)
├── .prettierrc.json
├── vitest.config.ts
├── .github/
│   └── workflows/
│       └── ci.yml               (lint + typecheck + test + build)
├── public/
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
├── src/
│   ├── core/                    (pure, no chrome.* references)
│   │   ├── filters.ts           (B-001 ... B-004)
│   │   ├── domain.ts            (tldts wrapper, apex extraction)
│   │   ├── aggregate.ts         (aggregation engine, B-005, B-006, B-007)
│   │   ├── dates.ts             (date-fns wrappers, day-key helpers)
│   │   ├── intensity.ts         (HM-003 quantile bucketing)
│   │   ├── palette.ts           (UX-W-01 daily-winner color assignment)
│   │   └── types.ts             (D-001 ... D-006)
│   ├── background/              (service worker entry)
│   │   ├── index.ts
│   │   ├── ingest.ts            (getVisits orchestrator, P-001)
│   │   ├── debounce.ts          (chrome.alarms based, SW-004)
│   │   └── cache.ts             (chrome.storage facade, ST-001)
│   ├── dashboard/               (full-page UI)
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── views/
│   │   │   ├── PerSiteView.tsx
│   │   │   ├── OverallView.tsx
│   │   │   └── WinnersView.tsx
│   │   ├── components/
│   │   │   ├── Heatmap.tsx      (HM-001 the single SVG primitive)
│   │   │   ├── ViewSwitcher.tsx
│   │   │   ├── DateRangeSelect.tsx
│   │   │   ├── SiteSwitcher.tsx
│   │   │   ├── Tooltip.tsx      (shadcn)
│   │   │   └── ui/              (shadcn copy-paste primitives)
│   │   ├── hooks/
│   │   │   ├── useAggregate.ts
│   │   │   └── useBackfillProgress.ts
│   │   └── styles.css           (Tailwind v4 entry + @theme tokens)
│   └── entrypoints/             (WXT entrypoints declaring entries)
│       ├── background.ts        (re-exports src/background)
│       └── dashboard.html       (re-exports src/dashboard)
└── tests/
    ├── fixtures/
    │   └── synthetic-history.ts (T-002)
    └── ...spec files colocated next to source preferred
```

**Rule FR-S-01 — Module boundaries.** `src/core/` MUST NOT import from `src/background/`, `src/dashboard/`, or any `chrome.*` namespace. `src/core/` is pure TypeScript, fully unit-testable in Node.

**Rule FR-S-02 — Path aliases.** TS path alias `@/` → `src/`. Used in all internal imports.

---

## 5. Manifest & Permissions

**Rule FR-M-01.** Manifest V3 only.

**Rule FR-M-02 — Permissions.**
- `history` — required for read access
- `storage` — required for caching
- `alarms` — required for debounced re-aggregation
- No `host_permissions` (we never read page content)

> **Reference note (not requested):** `unlimitedStorage` was considered as a defensive permission to allow the aggregate to exceed `chrome.storage.local`'s default 10 MB quota. It is **not** requested in v1 because our soft cap is 5 MB ([ST-005](#st-005)) and observed sizes are far below that. If a future user reports hitting the quota, the fix is to add this permission to the manifest — a one-line change that does not require any code refactor.

**Rule FR-M-03 — Action.** Single `action` (no popup). Clicking the toolbar icon opens the dashboard in a new tab. Handled by `chrome.action.onClicked` in the service worker, which calls `chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') })`.

**Rule FR-M-04 — `minimum_chrome_version`.** Unpinned. We do not depend on any post-MV3-launch APIs.

**Rule FR-M-05 — Web-accessible resources.** None. The dashboard is opened by the extension itself; it does not need to be embeddable from web pages.

**Rule FR-M-06 — Icons.** 16/32/48/128 PNG icons in `public/`. Placeholder for scaffold; designed icon delivered before public CWS submission (see [REL-201](#rel-201)).

---

## 6. Data Model

<a id="d-001"></a>
**D-001 — `Visit` (normalized internal type).**
```ts
interface Visit {
  url: string;             // full URL as returned by Chrome
  apexDomain: string;      // tldts.getDomain(url), e.g. "google.com"
  title: string;           // empty string if unavailable
  visitedAt: number;       // unix epoch ms (UTC)
}
```
**Invariant.** `apexDomain` is lowercase. URLs that pass [B-001 ... B-004](#b-001) MUST also have a non-empty `apexDomain`; if `tldts` returns `null`, the URL is filtered.

<a id="d-002"></a>
**D-002 — `DayKey`.** Type alias `type DayKey = string` formatted as `YYYY-MM-DD`. Always in the user's **local** timezone (see [B-006](#b-006)).

<a id="d-003"></a>
**D-003 — `SiteRank`.**
```ts
interface SiteRank {
  apexDomain: string;
  totalVisits: number;
  activeDays: number;
}
```

<a id="d-004"></a>
**D-004 — `DailyWinner`.**
```ts
interface DailyWinner {
  apexDomain: string;
  visits: number;
}
```

<a id="d-005"></a>
**D-005 — `Aggregate` (cached payload).**
```ts
interface Aggregate {
  version: 1;                                      // bump on schema change
  computedAt: number;                              // unix epoch ms
  lastAggregatedAt: number;                        // cutoff used for incremental updates
  dateRange: { earliest: DayKey; latest: DayKey };
  totalVisitsPerDay: Record<DayKey, number>;
  visitsPerSitePerDay: Record<string, Record<DayKey, number>>; // apex -> day -> count
  dailyWinner: Record<DayKey, DailyWinner>;
  topSites: SiteRank[];                            // sorted desc by totalVisits
}
```
**Invariant.** Every `DayKey` that appears anywhere is within `[dateRange.earliest, dateRange.latest]` inclusive. Days with zero visits are omitted from maps (sparse storage).

<a id="d-006"></a>
**D-006 — `BackfillProgress` (transient, message-passed; not persisted).**
```ts
interface BackfillProgress {
  phase: 'idle' | 'enumerating' | 'fetching-visits' | 'aggregating' | 'done' | 'error';
  processed: number;        // URLs processed
  total: number;            // total URLs to process (0 until enumeration finishes)
  startedAt: number;
}
```

---

## 7. Behavioral Rules

### 7.1 URL filtering

<a id="b-001"></a>
**B-001 — Scheme filter.** Drop visits whose URL begins with any of: `chrome://`, `chrome-extension://`, `about:`, `edge://`, `brave://`, `opera://`, `vivaldi://`, `file://`, `chrome-search://`, `chrome-untrusted://`, `devtools://`, `view-source:`, `data:`, `javascript:`.

<a id="b-002"></a>
**B-002 — New tab page filter.** Drop visits to the new-tab placeholder URLs (`chrome://newtab/`, `about:blank`, empty string).

<a id="b-003"></a>
**B-003 — Local host filter.** Drop visits whose hostname is `localhost`, `127.0.0.1`, `0.0.0.0`, `::1`, or ends in `.local`.

<a id="b-004"></a>
**B-004 — Search engine results filter.** Drop visits to search result pages on these engines:
| Engine | Match rule |
|---|---|
| Google | host matches `*.google.*` AND path is `/search` |
| Bing | host matches `*.bing.com` AND path is `/search` |
| DuckDuckGo | host matches `duckduckgo.com` AND query has `q=` |
| Brave Search | host matches `search.brave.com` AND path starts with `/search` |
| Ecosia | host matches `*.ecosia.org` AND path is `/search` |
| Startpage | host matches `*.startpage.com` AND path starts with `/sp/search` or `/do/search` |
| Yahoo | host matches `search.yahoo.com` |
| Baidu | host matches `*.baidu.com` AND path is `/s` |
| Yandex | host matches `*.yandex.*` AND path starts with `/search` |

**Invariant FR-F-01.** Filter rules MUST live in a single file (`src/core/filters.ts`) and be data-driven (an array of `(url) => boolean` predicates or a config table). Tests cover one positive + one negative example per rule.

**Out of scope.** Filtering out homepages of search engines (we only filter search *result* pages).

### 7.2 Aggregation

<a id="b-005"></a>
**B-005 — Daily winner tie-break.** For a given day, if multiple apex domains share the maximum visit count, the apex with the higher overall `totalVisits` across the entire date range wins. If still tied, lexicographic ascending on the apex string wins.

<a id="b-006"></a>
**B-006 — Timezone.** All `DayKey` values are computed in the user's local timezone using `date-fns/format(date, 'yyyy-MM-dd')`. We never store UTC day boundaries. A visit at 23:55 local on Monday belongs to Monday.

<a id="b-007"></a>
**B-007 — Top sites sort order.** `topSites` is sorted by `totalVisits` descending. Ties broken by `activeDays` descending, then lexicographic apex ascending.

<a id="b-008"></a>
**B-008 — Aggregation is pure.** `aggregate(visits: Visit[]): Aggregate` is a pure function — no `chrome.*` access, no I/O, no `Date.now()` for content (only for `computedAt`). Trivially unit-testable.

---

## 8. Service Worker Behavior

<a id="sw-001"></a>
**SW-001 — Top-level listener registration.** All event listeners (`chrome.action.onClicked`, `chrome.runtime.onInstalled`, `chrome.runtime.onStartup`, `chrome.history.onVisited`, `chrome.alarms.onAlarm`, `chrome.runtime.onMessage`) MUST be registered at the top level of the service worker module synchronously on script evaluation. No conditional/async registration.
**Why.** MV3 only wakes the worker for events whose listeners are registered synchronously at top level.

<a id="sw-002"></a>
**SW-002 — Ingestion source.** Use `chrome.history.getVisits()` to obtain per-visit timestamps for every URL returned by `chrome.history.search()`. `chrome.history.search()` alone is insufficient because `lastVisitTime + visitCount` cannot reconstruct per-day counts for prior visits.

<a id="sw-003"></a>
**SW-003 — Backfill orchestrator.**
1. On `chrome.runtime.onInstalled` (`reason === 'install'`), schedule a backfill.
2. Backfill phases:
   - **Enumerate:** call `chrome.history.search({ text: '', maxResults: 0, startTime: 0 })` once. (Some Chrome versions treat `maxResults: 0` as "no limit"; if not, paginate using `endTime` until empty.)
   - **Filter:** apply [B-001 ... B-004](#b-001) to the URL list.
   - **Fetch visits + aggregate (streaming):** for each surviving URL, call `chrome.history.getVisits({ url })` (concurrency cap [P-001](#p-001)). As batches resolve, append visits to an in-memory buffer in the worker and re-run `aggregate()` over the accumulated buffer.
   - **Persist (batched):** write the running `Aggregate` to `chrome.storage.local` per the throttle in [P-003](#p-003).
3. Broadcast `BackfillProgress` ([D-006](#d-006)) via `chrome.runtime.sendMessage` whenever `processed` advances by ≥ 5% of `total` or ≥ 500 ms since the last broadcast.
4. On completion, write the final aggregate and broadcast `phase === 'done'`.

<a id="sw-003a"></a>
**SW-003a — Storage as single source of truth.** The dashboard MUST NOT receive aggregate data via runtime messages. It reads the aggregate from `chrome.storage.local` and subscribes to `chrome.storage.onChanged` for the `aggregate.v1` key to refresh. Runtime messages are only used for transient progress signals ([D-006](#d-006)). This keeps multi-tab safety, refresh safety, and worker-restart safety trivial.

<a id="sw-004"></a>
**SW-004 — Incremental updates via debounce.**
- `chrome.history.onVisited` fires for every new visit.
- The listener does NOT process the visit synchronously. It calls `chrome.alarms.create('recompute', { delayInMinutes: 0.5 })` (30s). Creating an alarm with the same name resets the timer — natural debounce.
- `chrome.alarms.onAlarm` listener for `name === 'recompute'` runs incremental aggregation: read existing `Aggregate`, fetch only URLs with `lastVisitTime > lastAggregatedAt`, update maps, persist.
**Why.** `setTimeout` does not survive worker idle shutdown. `chrome.alarms` does. 30s is the minimum allowed alarm period and matches the worker's idle timer.

<a id="sw-005"></a>
**SW-005 — Manual refresh.** Dashboard sends a `{ type: 'force-refresh' }` runtime message. The service worker treats this as if cache were absent: re-runs the full backfill.

<a id="sw-006"></a>
**SW-006 — Startup.** On `chrome.runtime.onStartup`, do nothing. The existing cache is read on dashboard open; the next `onVisited` (debounced) will refresh it.

---

## 9. Storage Schema

<a id="st-001"></a>
**ST-001 — Cache key.** Single key: `aggregate.v1`. Value matches [D-005](#d-005) exactly.

<a id="st-002"></a>
**ST-002 — UI prefs key.** Separate key `ui.v1`:
```ts
interface UIPrefs {
  version: 1;
  lastView: 'per-site' | 'overall' | 'winners';
  lastSelectedSite: string | null;
  lastDateRange: '7d' | '30d' | '90d' | 'all';
}
```

<a id="st-003"></a>
**ST-003 — Schema migration.** If `aggregate.vN` for a different `N` than the current code's expected version is read, treat the cache as absent and re-run backfill. Old keys are deleted in the same write.

<a id="st-004"></a>
**ST-004 — Atomic writes.** Aggregate writes are a single `chrome.storage.local.set({ [key]: value })` call. We do not split aggregate across multiple keys.

<a id="st-005"></a>
**ST-005 — Size budget.** Soft cap of 5 MB for `aggregate.v1`. For a 90-day, 10K-URL heavy user this is ~1–2 MB. If we ever exceed this, sparse encoding + apex-domain interning is the first optimization (out of scope for v1).

---

## 10. UI Specification

### 10.1 Dashboard shell

<a id="ux-s-01"></a>
**UX-S-01 — Layout regions.** Single column layout, max-width container.
- Header: product name, last-updated timestamp, manual refresh button.
- Toolbar: view switcher (3 tabs) + date-range select (right-aligned).
- Content: active view.
- Footer (optional): version + link to GitHub repo.

<a id="ux-s-02"></a>
**UX-S-02 — Date-range selector.** Options: `7d`, `30d`, `90d`, `All`. Default: `All`. Single select (shadcn `Select`).
- `7d` = last 7 days ending today (inclusive).
- `30d` = last 30 days ending today (inclusive).
- `90d` = last 90 days ending today (inclusive).
- `All` = `dateRange.earliest` → today.

<a id="ux-s-03"></a>
**UX-S-03 — View switcher.** Three options, shadcn `Tabs`:
- "Sites" → Per-site view ([UX-PS-01](#ux-ps-01))
- "Daily" → Overall daily view ([UX-OV-01](#ux-ov-01))
- "Winners" → Daily winners view ([UX-W-01](#ux-w-01))

<a id="ux-s-04"></a>
**UX-S-04 — Empty state.** When `Aggregate` is absent AND backfill has not yet started or is still enumerating, render the brand surface with a single message (copy TBD per design phase, placeholder: "Reading your history…"). After enumeration starts producing data, transition to populated views per [UX-S-06](#ux-s-06).

<a id="ux-s-05"></a>
**UX-S-05 — No-data edge case.** If after backfill the `Aggregate` has zero visits passing filters, render a "nothing to show yet" message. Do not crash the heatmap renderer.

<a id="ux-s-06"></a>
**UX-S-06 — Progressive backfill UI.**
- During `fetching-visits` phase, the heatmap skeleton is visible. As the worker writes new partial aggregates to `chrome.storage.local` per [SW-003a](#sw-003a), the dashboard's `chrome.storage.onChanged` listener triggers a re-read and re-render.
- A persistent progress strip near the header shows `processed / total` URLs with a thin progress bar, driven by `BackfillProgress` messages ([D-006](#d-006)).
- Once `phase === 'done'`, the progress strip animates out.

### 10.2 Per-site view

<a id="ux-ps-01"></a>
**UX-PS-01 — Components.**
- Site switcher: chip row of top 10 sites by visit count, each chip shows favicon (via `chrome.runtime.getURL` or Google favicon proxy — TBD design phase), apex domain, total visit count. The currently selected chip is visually emphasized.
- "Show more" button at end of chip row expands a popover/sheet (shadcn) listing all remaining sites sorted by [B-007](#b-007).
- Heatmap: intensity mode ([HM-002](#hm-002)) for the selected site over the active date range.
- Stats card: total visits, active days, longest streak, busiest day (date + count) — all for the selected site within the active range.

<a id="ux-ps-02"></a>
**UX-PS-02 — Default selection.** On view enter, select the #1 site from `topSites` if `lastSelectedSite` is null or no longer in the top list; otherwise restore `lastSelectedSite`.

### 10.3 Overall daily view

<a id="ux-ov-01"></a>
**UX-OV-01 — Components.**
- Heatmap: intensity mode for `totalVisitsPerDay` over the active date range.
- Stats card: total visits, active days, busiest day (date + count), average visits per active day, average per calendar day.

### 10.4 Daily winners view

<a id="ux-w-01"></a>
**UX-W-01 — Components.**
- Heatmap: categorical mode ([HM-004](#hm-004)) for `dailyWinner` over the active date range.
- Legend: 10 swatches for top 10 sites + 1 swatch for "Other". Each swatch shows the curated color + apex domain + how many days that site "won".
- Tooltip: date, winner apex, winner visit count, runner-up apex + count.

<a id="ux-w-02"></a>
**UX-W-02 — Winner palette.** Curated 11-color palette, contrast-tested for light backgrounds (specific hex values delivered in design phase via `impeccable`). The palette is deterministic — site at rank 1 always gets palette[0], rank 2 gets palette[1], etc. "Other" gets palette[10] (a neutral grey-tone).

---

## 11. Heatmap Renderer

<a id="hm-001"></a>
**HM-001 — Single primitive component.** `src/dashboard/components/Heatmap.tsx`. One reusable SVG component covers all three views via a `mode` prop:

```ts
type HeatmapMode =
  | { kind: 'intensity'; data: Record<DayKey, number>; }
  | { kind: 'categorical'; data: Record<DayKey, { apex: string; visits: number; }>;
      colorOf: (apex: string) => string; };

interface HeatmapProps {
  mode: HeatmapMode;
  range: { start: DayKey; end: DayKey; };
  onCellHover?: (day: DayKey | null) => void;
  renderTooltip?: (day: DayKey) => React.ReactNode;
}
```

<a id="hm-002"></a>
**HM-002 — Intensity mode.**
- 5 buckets (including the "0" bucket for empty days).
- Bucket boundaries computed by [HM-003](#hm-003).
- Color ramp: 5 swatches from low to high intensity (palette values delivered in design phase).

<a id="hm-003"></a>
**HM-003 — Intensity bucketing.**
- Take the set of non-zero day values in the rendered range.
- Compute quantiles at p20, p40, p60, p80.
- Buckets: `[0, 0]`, `(0, p20]`, `(p20, p40]`, `(p40, p60]`, `(p60, p80]`, `(p80, ∞)`. Yields the 5 visible color levels (the `[0,0]` bucket renders as the empty cell color).
- If the dataset has fewer than 5 distinct non-zero values, fall back to a 1:1 mapping (distinct values get distinct buckets, remaining slots merge from the top down). Algorithm spec lives in `src/core/intensity.ts` and is unit-tested.

<a id="hm-004"></a>
**HM-004 — Categorical mode.** Each cell with data is filled with `colorOf(apex)`. Empty days use the empty-cell color.

<a id="hm-005"></a>
**HM-005 — Grid geometry.**
- Columns = weeks. Rows = days of week (Sun → Sat).
- Cell size 12×12 px with 2 px gap (GitHub default). May be tuned in design phase but defaults to these.
- Month labels rendered above the grid for week columns where the month changes within that column.
- Weekday labels rendered to the left of the grid (Mon, Wed, Fri visible).

<a id="hm-006"></a>
**HM-006 — Tooltip & a11y.**
- Each cell is a `<rect>` with `<title>` for native browser tooltip fallback.
- A floating custom tooltip (shadcn `Tooltip`) is shown on hover/focus using `onCellHover` + `renderTooltip`.
- Cells receive `tabindex={0}` and keyboard hover via arrow keys is **out of scope for v1** (native tab focus is sufficient).

<a id="hm-007"></a>
**HM-007 — Responsive.** The SVG `width` is computed from `weeks * (cellSize + gap)`. The container can scroll horizontally if it exceeds viewport. No reflow of grid geometry below a min-width.

<a id="hm-008"></a>
**HM-008 — Rendering performance.** With 90 days (~13 weeks × 7 days = ~91 cells), render time is trivial. For the "All" range, worst case is ~90 days for Chrome's default retention. Performance budget [P-002](#p-002).

---

## 12. Performance Targets

<a id="p-001"></a>
**P-001 — getVisits concurrency.** Hand-rolled concurrency limiter in `src/background/ingest.ts`. Max in-flight = 32 (tunable constant). No external dependency.

<a id="p-002"></a>
**P-002 — Time budgets.**
| Phase | Target | Acceptance |
|---|---|---|
| Cold dashboard open with cache present | ≤ 200 ms to first paint | Manual stopwatch / Performance API timestamps |
| Backfill enumerate | ≤ 500 ms for 10K URLs | T-003 fixture-based |
| Backfill fetch-visits (10K URLs) | ≤ 20 s | T-003 fixture-based |
| Incremental update (≤ 50 new URLs) | ≤ 2 s | T-003 |
| Heatmap render (~365 cells) | ≤ 16 ms | React profiler |

<a id="p-003"></a>
**P-003 — Storage write frequency.**
- **Backfill:** ≤ 100 writes total. Writes are throttled by both volume and time — a write fires only when ≥ 200 new URLs have been processed since the last write **or** ≥ 1000 ms have elapsed since the last write (whichever comes first). The final aggregation always emits one write regardless of throttle state.
- **Incremental update:** Exactly one write per debounced cycle.
- **Reason for batched writes during backfill:** progressive UI ([UX-S-06](#ux-s-06)) requires the dashboard to see partial aggregates as they form. We make storage the single source of truth ([SW-003a](#sw-003a)), so the dashboard subscribes to `chrome.storage.onChanged` rather than receiving runtime messages.

---

## 13. Error Handling

<a id="e-001"></a>
**E-001 — Reporting target.** Errors are logged to the service worker console via a single `log` utility (`src/core/log.ts`) that wraps `console.error` and adds a `[historia]` prefix. No remote telemetry in v1.

<a id="e-002"></a>
**E-002 — User-facing error UI.** Any unhandled error during backfill, ingestion, or aggregation triggers a dashboard banner with text "Couldn't read your history. Try refreshing." and a button that sends `{ type: 'force-refresh' }`.

<a id="e-003"></a>
**E-003 — React error boundary.** The dashboard root mounts a single error boundary that renders the same banner as [E-002](#e-002) on any render exception. The error is logged with `console.error` for debugging.

<a id="e-004"></a>
**E-004 — Chrome API failures.** Every `chrome.*` call MUST be wrapped to convert callback-style errors into rejected promises (use the modern Promise-returning forms where available — most are in MV3). Failures bubble up to the orchestrator and end up in [E-001](#e-001).

---

## 14. Testing Strategy

<a id="t-001"></a>
**T-001 — Test framework.** Vitest with `WxtVitest()` plugin (`wxt/testing/vitest-plugin`). The plugin auto-polyfills `browser`/`chrome` APIs via `@webext-core/fake-browser`. Tests can manipulate `fakeBrowser` directly.

<a id="t-002"></a>
**T-002 — Synthetic history fixture.** `tests/fixtures/synthetic-history.ts` exports a deterministic generator producing a realistic mix of visits (multiple apex domains, multiple days, search-result pages, chrome:// URLs) suitable for testing the full pipeline.

<a id="t-003"></a>
**T-003 — Required coverage.** Every rule with an ID prefix `B-` and `HM-003` has at least one unit test. `aggregate()` is tested with the synthetic fixture for known totals. `filters.ts` has one positive + one negative case per filter rule.

<a id="t-004"></a>
**T-004 — Coverage thresholds.** No global coverage gate. Specific files MUST hit ≥ 90% line coverage: `src/core/filters.ts`, `src/core/aggregate.ts`, `src/core/intensity.ts`, `src/core/dates.ts`, `src/core/domain.ts`.

<a id="t-005"></a>
**T-005 — Component tests.** Each view component has a smoke test that renders with a fixture aggregate and asserts the right heatmap mode is used. No deep visual snapshot tests.

<a id="t-006"></a>
**T-006 — E2E.** Out of scope for v1. Manual smoke testing covers the install-and-open flow (documented in README).

---

## 15. Visual Design (placeholder)

**DSGN-001 — Design phase.** Detailed visual identity (palette, typography, spacing scale, component aesthetics, heatmap color ramps, winner palette hex values, motion) is deferred to a dedicated design phase. That phase MUST invoke the `impeccable` skill per global setup and produce a `DESIGN.md` (or equivalent) that this PRD then references.

**DSGN-002 — Theme implementation.** All design tokens are defined via Tailwind v4 `@theme` directives in `src/dashboard/styles.css`. shadcn primitives are restyled by overriding CSS variables (`--background`, `--foreground`, `--primary`, etc.) and Tailwind utility classes; we do not edit the primitives' internal markup.

**DSGN-003 — Anti-default.** The final UI MUST NOT be identifiable as stock shadcn at a glance. The visual identity is a deliverable.

**DSGN-004 — Light theme only for v1.** Per [project scope](#13-out-of-scope--deferred-post-v1). Dark theme is deferred.

---

## 16. Privacy & Security

<a id="sec-001"></a>
**SEC-001 — Data residency.** All processing happens locally. No network requests are made by the extension at runtime except for favicon fetches via the Google favicon proxy (`https://www.google.com/s2/favicons?domain=...`) used for top-site chips. This is a privacy trade-off worth flagging.

<a id="sec-002"></a>
**SEC-002 — Favicon source.** Locked: Google favicon proxy at `https://www.google.com/s2/favicons?domain={apex}&sz=64`. Free, zero-setup, returns 16/32/64px sizes via the `sz` parameter. The proxy URL contains the apex domain in cleartext but no user identifier. This is the only outbound network request the extension makes. On request failure, fall back to a generic letter-tile (first character of the apex on a neutral background).

<a id="sec-003"></a>
**SEC-003 — Privacy policy.** `PRIVACY.md` at repo root, linked from CWS listing. Plain-language statement that no data leaves the device. Must be public-readable.

<a id="sec-004"></a>
**SEC-004 — Permissions in CWS justifications.**
| Permission | Justification text |
|---|---|
| `history` | "Required to read your browsing history locally and compute the dashboard statistics." |
| `storage` | "Required to cache computed statistics so the dashboard opens instantly." |
| `alarms` | "Required to schedule efficient background updates after you browse." |

<a id="sec-005"></a>
**SEC-005 — No CSP overrides.** Use WXT's default CSP. No `unsafe-eval`. No remote-loaded scripts.

---

## 17. Build, Distribution & Release

<a id="rel-101"></a>
**REL-101 — Dev workflow.** `pnpm dev` launches WXT in dev mode and auto-loads the extension into Chrome. `pnpm build` produces production output in `.output/chrome-mv3/`. `pnpm zip` produces a CWS-uploadable zip.

<a id="rel-102"></a>
**REL-102 — CI pipeline (GitHub Actions).** A single workflow `.github/workflows/ci.yml` runs on every PR + push to `main`:
- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
PR is blocked on any failure.

<a id="rel-103"></a>
**REL-103 — Versioning.** SemVer starting at `0.1.0`. `package.json#version` is the source; WXT propagates it to the manifest. No automated release tooling for v1.

<a id="rel-104"></a>
**REL-104 — Repo visibility.** Public on GitHub from day one. License: MIT.

<a id="rel-201"></a>
**REL-201 — CWS submission gate.** Before first CWS submission:
- Real (not placeholder) icons in 16/32/48/128 ✓ design phase deliverable
- Screenshots for CWS listing ✓ design phase
- `PRIVACY.md` published and linked ✓
- All `SEC-*` rules met ✓
- README contains install + dev + privacy summary

<a id="rel-202"></a>
**REL-202 — Side-load distribution.** README documents the "load unpacked" path: download release zip → extract → enable Developer mode → load unpacked. Maintained as a first-class install path.

---

## 18. Documentation Deliverables

| File | Purpose | Phase |
|---|---|---|
| `PRD.md` | This document | Pre-impl ✓ |
| `README.md` | Install (both paths), dev setup, screenshots, design philosophy | Polish phase |
| `PRIVACY.md` | Privacy policy linked from CWS | Before first CWS submit |
| `LICENSE` | MIT | Project setup phase |
| `DESIGN.md` (or equivalent) | Visual identity + tokens output by `impeccable` | Design phase |
| Inline JSDoc | Public exports in `src/core/` only. Skip what-comments. Why-comments only when non-obvious. | Per phase |

---

## 19. Phase Ordering & Open Items

### 19.1 Phase ordering (locked)

**Phase 1: Foundation.** Scaffold (WXT + React + TS + Tailwind v4 + shadcn + ESLint + Prettier + Vitest + CI). Module boundaries per [Section 4](#4-project-structure). No styling beyond Tailwind defaults + neutral shadcn palette.

**Phase 2: Data plumbing.** Filter rules ([B-001 ... B-004](#b-001)). Apex extraction. Aggregation engine ([B-005 ... B-008](#b-005)). Intensity bucketing ([HM-003](#hm-003)). All pure-TS, fully unit-tested. No UI work.

**Phase 3: Service worker + storage.** Manifest, action handler, backfill orchestrator ([SW-003](#sw-003), [SW-003a](#sw-003a)), incremental update ([SW-004](#sw-004)), storage schema ([ST-001](#st-001) ... [ST-005](#st-005)). Tested with `WxtVitest` fake-browser.

**Phase 4: Dashboard skeleton.** Three views functionally wired up against real aggregate data, with the SVG heatmap component working end-to-end. Layout per [Section 10](#10-ui-specification). Visual styling stays deliberately minimal — neutral grayscale + default shadcn primitives. The aim is "can I see and verify the right numbers and shapes?" not "does it look good?"

**Phase 5: Design pass.** Only after Phase 4 produces real data we can iterate against. Invokes `impeccable` (with `impeccable teach` prerequisite). Produces `DESIGN.md` and updates Tailwind v4 `@theme` tokens + shadcn variable overrides. No new functionality.

**Phase 6: Polish + release prep.** Real icons. README. PRIVACY.md. CWS screenshots. CI green. SemVer bump to `0.1.0` for first CWS submission and unpacked release.

**Why this order:** Functionality first means we can verify behavior is correct with neutral defaults. Design last means design happens against a real product, not a mock. Each phase is a meaningful, reviewable boundary.

### 19.2 Open items (deferred to their owning phase)

1. **Specific cell size tuning** — phase 4/5 may adjust the 12 px / 2 px gap defaults from [HM-005](#hm-005).
2. **Favicon caching** — phase 3 may add a 24h `chrome.storage.local` cache for favicon URLs to reduce proxy calls. Default: no cache, browser HTTP cache is sufficient.
3. **Refresh button placement & visual** — phase 4 scaffolds it in the header; phase 5 finalizes look.
4. **Onboarding/empty-state copy** — phase 5 (design) finalizes from the placeholder in [UX-S-04](#ux-s-04).

---

## 20. Amendment Process

Any change to this document is an amendment.
- **Editorial changes** (typos, clarifications that don't change behavior): direct edit.
- **Behavioral changes** (adding/removing rules, altering acceptance criteria): edit + bump the version in the header + note the change in a `## Changelog` section at the bottom.
- **Scope changes** (in/out of scope items): require explicit user approval before edit.

## Changelog
- `0.2` (2026-05-22) — Post-review revisions:
  - Dropped `unlimitedStorage` permission ([FR-M-02](#5-manifest--permissions)); kept a reference note for future use.
  - Locked Google favicon proxy ([SEC-002](#sec-002)) with letter-tile fallback.
  - Locked backfill streaming model: storage as single source of truth, batched writes ([SW-003](#sw-003), [SW-003a](#sw-003a), [UX-S-06](#ux-s-06), [P-003](#p-003)).
  - Locked date-range filtering at read time (see [Section 19](#19-phase-ordering--open-items)).
  - Replaced "Open Items" section with explicit Phase Ordering ([Section 19.1](#191-phase-ordering-locked)). Design comes after functionality.
- `0.1` (2026-05-22) — Initial draft, post-research and post-grill-me round.
