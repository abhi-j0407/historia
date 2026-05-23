# historia — Phase Plan

**Version:** 1.0
**Last updated:** 2026-05-22
**Owner:** Abhishek Jain
**Companion to:** [PRD.md](./PRD.md) (v0.2)
**Status:** Approved scope + stack; ready for implementation.

---

## 0. How to Use This Plan

This document is the implementation source of truth. It expands the six locked PRD phases (PRD §19.1) into **17 finer phases**, each scoped to a single working session with explicit verification gates.

**Reading order.** Read this document linearly the first time. After that, jump to the current phase and consult [§A. Conventions & Standards](#a-conventions--standards) whenever a code-style or behavioral question arises.

**Rules of engagement.**

1. **Do not skip phases.** Each phase has prerequisites from the previous. Skipping causes silent breakage.
2. **Do not invent decisions.** Everything you need has been decided. If something seems missing, search the PRD by ID first (e.g. `B-005`, `SW-003a`). If it is still missing, stop and surface the question — do not assume.
3. **Do not introduce dependencies** beyond the locked stack (PRD §3) without an explicit user amendment.
4. **Verification gates are non-negotiable.** A phase is not complete until every "Success criteria" item passes. CI must also be green where applicable.
5. **No placeholders, no TODO comments, no hacks.** If a sub-task cannot be finished cleanly within the phase, stop and surface it.
6. **Why-comments only.** Default to zero comments. Add a one-line comment only when the _why_ is non-obvious (a workaround, a subtle invariant, a constraint from the PRD). Never add what-comments.
7. **Tests live next to source** (e.g. `filters.ts` + `filters.test.ts`). Shared fixtures live in `tests/fixtures/`.

**PRD ↔ phase mapping.**

| PRD phase (§19.1)           | This plan    |
| --------------------------- | ------------ |
| 1. Foundation               | Phases 1–5   |
| 2. Data plumbing            | Phases 6–8   |
| 3. Service worker + storage | Phases 9–12  |
| 4. Dashboard skeleton       | Phases 13–15 |
| 5. Design pass              | Phase 16     |
| 6. Polish + release prep    | Phase 17     |

---

## Table of Contents

- [A. Conventions & Standards](#a-conventions--standards)
- [Phase 0 — Preflight & Environment](#phase-0--preflight--environment)
- [Phase 1 — Repo Bootstrap](#phase-1--repo-bootstrap)
- [Phase 2 — WXT + React + TypeScript Scaffold](#phase-2--wxt--react--typescript-scaffold)
- [Phase 3 — Tailwind v4 & shadcn/ui Primitives](#phase-3--tailwind-v4--shadcnui-primitives)
- [Phase 4 — Lint, Format, Test Infrastructure](#phase-4--lint-format-test-infrastructure)
- [Phase 5 — CI Pipeline](#phase-5--ci-pipeline)
- [Phase 6 — Core Types & URL Filters](#phase-6--core-types--url-filters)
- [Phase 7 — Domain & Date Helpers](#phase-7--domain--date-helpers)
- [Phase 8 — Aggregation Engine, Intensity & Palette](#phase-8--aggregation-engine-intensity--palette)
- [Phase 9 — Storage Facade](#phase-9--storage-facade)
- [Phase 10 — Service Worker Foundation](#phase-10--service-worker-foundation)
- [Phase 11 — Backfill Orchestrator](#phase-11--backfill-orchestrator)
- [Phase 12 — Incremental Updates & Manual Refresh](#phase-12--incremental-updates--manual-refresh)
- [Phase 13 — Dashboard Shell & Data Hooks](#phase-13--dashboard-shell--data-hooks)
- [Phase 14 — Heatmap Primitive](#phase-14--heatmap-primitive)
- [Phase 15 — Three Views & Toolbar](#phase-15--three-views--toolbar)
- [Phase 16 — Design Pass (impeccable)](#phase-16--design-pass-impeccable)
- [Phase 17 — Release Polish & v0.1.0](#phase-17--release-polish--v010)
- [B. Commands Cheat Sheet](#b-commands-cheat-sheet)
- [C. Reference URLs](#c-reference-urls)
- [Status Tracker](#status-tracker)

---

## A. Conventions & Standards

These rules are **global** — they apply to every phase. Re-read this section before starting any phase.

### A.1 File & directory naming

| Kind              | Convention                                                            | Example                               |
| ----------------- | --------------------------------------------------------------------- | ------------------------------------- |
| TS source modules | `kebab-case.ts` for utilities, `camelCase.ts` for hooks (`useFoo.ts`) | `domain.ts`, `useAggregate.ts`        |
| React components  | `PascalCase.tsx`                                                      | `Heatmap.tsx`                         |
| Tests             | sibling `<file>.test.ts` or `<file>.test.tsx`                         | `filters.test.ts`                     |
| Type-only files   | `types.ts` (per directory)                                            | `src/core/types.ts`                   |
| Fixtures          | `tests/fixtures/<topic>.ts`                                           | `tests/fixtures/synthetic-history.ts` |

### A.2 Import order (ESLint enforced via `eslint-plugin-simple-import-sort`)

1. Node / browser builtins
2. External packages
3. Internal aliased imports (`@/...`)
4. Relative imports (`./...`, `../...`)
5. Style imports (`*.css`)
6. Type-only imports may be grouped within each block but must use `import type`.

### A.3 TypeScript discipline

- `strict: true` in `tsconfig.json`. Do not weaken (`any`, `as unknown as`, non-null `!`) without a PRD-anchored reason in a one-line comment.
- Public exports from `src/core/` carry one-line JSDoc summarizing intent and citing the PRD ID(s) implemented (e.g. `/** Bucket non-zero day values into 5 intensity levels per HM-003. */`).
- Internal helpers: no JSDoc unless behavior is non-obvious.
- Prefer `type` for object shapes that are pure data; `interface` only when extension/declaration-merging is intended. The PRD-defined data shapes ([D-001..D-006](./PRD.md#6-data-model)) keep `interface` to match the PRD verbatim.
- Discriminated unions use a `kind` field (matches `HeatmapMode` in [HM-001](./PRD.md#hm-001)).
- No barrel files (`index.ts` re-exports) unless a directory has ≥ 4 public consumers — they hurt tree-shaking in MV3 bundles.

### A.4 Module boundary rule (PRD [FR-S-01](./PRD.md#4-project-structure))

`src/core/` MUST NOT import from `src/background/`, `src/dashboard/`, `webextension-polyfill`, or reference `chrome.*` / `browser.*` globals. Enforced by an ESLint `no-restricted-imports` rule configured in Phase 4.

### A.5 Error handling pattern (PRD §13)

- Every `chrome.*` call uses the Promise-returning form (modern MV3). No callback-style.
- Errors in the service worker propagate to the orchestrator, which calls the `log()` helper from `src/core/log.ts`. `log()` prefixes `[historia]` and uses `console.error`.
- Errors that prevent UI from rendering surface as the dashboard banner ([E-002](./PRD.md#e-002)), produced by a single error boundary at the dashboard root.
- Never swallow errors. Never `try {} catch (e) {}` with an empty catch.

### A.6 Accessibility baseline

Every interactive component must satisfy:

1. **Focusable.** Native `<button>`, `<a>`, or `tabindex={0}` for custom interactive elements.
2. **Labeled.** Visible text label or `aria-label`. Buttons-with-icon-only must have `aria-label`.
3. **Keyboard operable.** Enter / Space activate. Arrow-key heatmap navigation is explicitly out of scope per [HM-006](./PRD.md#hm-006); native Tab focus is sufficient.
4. **Contrast.** Text contrast meets WCAG AA (4.5:1 normal, 3:1 large). Heatmap palettes are checked in Phase 16; in earlier phases use neutral grayscale that clearly satisfies AA.
5. **Reduced motion.** Any transition/animation MUST be wrapped in `@media (prefers-reduced-motion: no-preference)` or use Tailwind's `motion-safe:` variants.
6. **Focus visible.** Never remove focus rings without replacing them with an equally visible alternative. Default to Tailwind's `focus-visible:` ring.
7. **Live regions.** The backfill progress strip uses `role="status"` with `aria-live="polite"`.

### A.7 Testing conventions

- **Framework:** Vitest with `WxtVitest()` plugin (PRD [T-001](./PRD.md#t-001)).
- **Pure logic** (`src/core/*`): unit-tested, no `chrome.*`, no React.
- **Service worker / storage**: integration-tested with `fakeBrowser` from `@webext-core/fake-browser`. Reset between tests via `fakeBrowser.reset()` in `beforeEach`.
- **React components**: smoke tests with `@testing-library/react`. No deep snapshot tests.
- **Coverage gates** ([T-004](./PRD.md#t-004)): the listed core files must hit ≥ 90% line coverage. The CI workflow enforces this per-file.
- **Test naming:** `describe('<unit name>', () => { it('does specific thing under specific condition', ...) })`. No `it('should ...')` — prefer present tense.
- **Determinism:** No `Date.now()` or `Math.random()` in tests; use fixed inputs.
- **No mocks of internal modules.** If a test needs to mock our own code, the design is wrong — split the unit.

### A.8 Commit, branching, PR (REL-103)

- Branch off `main`. Branch names: `phase/NN-short-slug` (e.g. `phase/06-core-types-filters`).
- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`, `ci:`.
- One phase = one PR (preferred) or one merge commit on `main`. Do not bundle multiple phases.
- Never `--no-verify`. Never force-push to `main`. Always create new commits over amending merged ones.
- The PR body links the phase in this document and lists what was delivered against the phase's "Outputs".

### A.9 Performance discipline (PRD §12)

- Backfill streaming respects [P-003](./PRD.md#p-003): write throttle = "≥ 200 URLs processed OR ≥ 1000 ms elapsed since last write, max 100 writes total, final write always emitted."
- Heatmap renders ≤ 16 ms ([P-002](./PRD.md#p-002)). Memoize `colorOf` and bucket lookups; do not recompute per-cell.
- No external state library — `useState` only ([REL-002](./PRD.md#3-tech-stack-locked)).

### A.10 Security / privacy discipline (PRD §16)

- The only outbound network call is the Google favicon proxy ([SEC-002](./PRD.md#sec-002)). No analytics, no Sentry, no telemetry, no fonts from a CDN.
- Fonts ship as files or use system stack. Never `@import` from Google Fonts (would defeat [SEC-001](./PRD.md#sec-001)).
- Never log raw URLs or titles to console outside of dev-only debugging. The `log()` helper is for errors only.

### A.11 Verification commands (run at the end of every phase)

```bash
pnpm typecheck      # tsc --noEmit
pnpm lint           # eslint .
pnpm test           # vitest run
pnpm build          # wxt build (production output to .output/chrome-mv3/)
```

A phase is not complete until all four pass locally **and** CI is green on the phase branch / PR.

---

## Phase 0 — Preflight & Environment

**PRD phase:** N/A (pre-foundation).
**Estimated effort:** 15 minutes.

### Objective

Verify the local machine can run the locked toolchain before writing a single line of code. Catching a Node version mismatch now prevents a confusing failure mid-Phase-2.

### Prerequisites

- None.

### Steps

1. **Verify Node.js ≥ 20.10** (Node 20 LTS).
   - Command: `node --version`
   - Required: `v20.10.0` or later. If lower, install via `nvm install 20 --lts && nvm use 20`.
   - Why pinned to 20: Vite 5 / WXT 0.20 / Tailwind v4 all expect Node 20+. Node 18 EOL was 2025-04.

2. **Verify pnpm ≥ 9.0.**
   - Command: `pnpm --version`
   - If absent: `corepack enable && corepack prepare pnpm@latest --activate`.

3. **Verify Chrome / Chromium installed.**
   - At least one of: Google Chrome, Brave, Edge, Arc, Vivaldi, or Opera.
   - WXT will auto-launch the default Chromium in dev mode.

4. **Verify Git is configured.**
   - Command: `git config --global user.name` and `git config --global user.email` both return values.

5. **Verify working directory.**
   - Path: `/Users/abhishekjain/Desktop/Personal/historia`
   - Should contain `PRD.md` and this `PHASE-PLAN.md`. Should not yet contain `package.json` (Phase 1 creates it).

### Outputs

- A printed confirmation that all four checks pass. No files created.

### Success criteria

- [ ] `node --version` prints v20.10.0 or later.
- [ ] `pnpm --version` prints 9.0.0 or later.
- [ ] At least one Chromium browser is installed and launchable.
- [ ] Git identity is configured globally.

### Common pitfalls

- Running `node --version` shows v18: install Node 20 LTS, then re-shim via `corepack enable`.
- pnpm command missing: do **not** install via `npm i -g pnpm`; use `corepack` to keep the version controllable.

---

## Phase 1 — Repo Bootstrap

**PRD phase:** §19.1 phase 1 (Foundation), step 1/5.
**Estimated effort:** 30 minutes.

### Objective

Initialize the repo with deterministic tooling baseline: git, pnpm, `package.json`, license, ignore files, editorconfig. No application code yet.

### Prerequisites

- Phase 0 complete.

### Steps

1. **Initialize git** in the project root (if not already a repo).
   - Command: `git init -b main`
   - Confirm: `git status` returns "On branch main".

2. **Create `.gitignore`** at repo root with the contents below.

   ```gitignore
   # dependencies
   node_modules/
   pnpm-lock.yaml.bak

   # build output
   .output/
   .wxt/
   dist/
   build/

   # editor + os
   .DS_Store
   .idea/
   .vscode/*
   !.vscode/extensions.json
   !.vscode/settings.json
   *.log
   npm-debug.log*
   pnpm-debug.log*

   # env
   .env
   .env.local
   .env.*.local

   # coverage
   coverage/
   ```

3. **Create `.editorconfig`** at repo root.

   ```ini
   root = true

   [*]
   charset = utf-8
   end_of_line = lf
   indent_style = space
   indent_size = 2
   insert_final_newline = true
   trim_trailing_whitespace = true

   [*.md]
   trim_trailing_whitespace = false
   ```

4. **Create `LICENSE`** at repo root — MIT, attributed to Abhishek Jain, year 2026. Use the standard MIT text. Single file, no comments.

5. **Initialize `package.json` via pnpm.**
   - Command: `pnpm init`
   - Then edit `package.json` to set these fields exactly:
     ```json
     {
       "name": "historia",
       "version": "0.0.0",
       "private": true,
       "description": "Browser History Wrapped — turn local Chrome history into activity heatmaps and per-site stats.",
       "license": "MIT",
       "author": "Abhishek <abhishek.j0407@gmail.com>",
       "type": "module",
       "packageManager": "pnpm@9.0.0",
       "engines": {
         "node": ">=20.10.0",
         "pnpm": ">=9.0.0"
       },
       "scripts": {
         "dev": "wxt",
         "build": "wxt build",
         "zip": "wxt zip",
         "typecheck": "tsc --noEmit",
         "lint": "eslint .",
         "lint:fix": "eslint . --fix",
         "format": "prettier --write .",
         "format:check": "prettier --check .",
         "test": "vitest run",
         "test:watch": "vitest",
         "test:coverage": "vitest run --coverage",
         "postinstall": "wxt prepare"
       }
     }
     ```
   - The `version` stays at `0.0.0` until Phase 17 bumps to `0.1.0`.
   - Scripts referencing tools not yet installed (`wxt`, `tsc`, `eslint`, etc.) are fine — they fail until later phases install them.

6. **Create `.npmrc`** at repo root to pin pnpm behavior.

   ```ini
   engine-strict=true
   strict-peer-dependencies=false
   auto-install-peers=true
   ```

7. **Create `.nvmrc`** at repo root for editor / CI auto-switching.

   ```
   20
   ```

8. **Initial commit.**
   - `git add .gitignore .editorconfig LICENSE package.json .npmrc .nvmrc PRD.md PHASE-PLAN.md`
   - `git commit -m "chore: bootstrap repo with package.json, license, and ignore files"`

### Files created

- `.gitignore`, `.editorconfig`, `.nvmrc`, `.npmrc`, `LICENSE`, `package.json`

### Outputs

- Git repo on `main`, one bootstrap commit, no installed dependencies yet.

### Success criteria

- [ ] `git log --oneline` shows the bootstrap commit.
- [ ] `cat package.json` shows the fields exactly as specified.
- [ ] `LICENSE` is the standard MIT text with year 2026 and author "Abhishek Jain".
- [ ] No `node_modules/` exists yet.

### Review checklist

- [ ] `package.json#type` is `"module"` (we are ESM-first; WXT requires this).
- [ ] `engines.node` matches `.nvmrc`.
- [ ] No extra fields like `main`/`module`/`exports` in `package.json` (this is a private app, not a library).
- [ ] License year is 2026, author email matches user memory.

### References

- pnpm `engine-strict`: https://pnpm.io/npmrc#engine-strict
- MIT license text: https://opensource.org/license/mit/

---

## Phase 2 — WXT + React + TypeScript Scaffold

**PRD phase:** §19.1 phase 1 (Foundation), step 2/5.
**Estimated effort:** 60–90 minutes.

### Objective

Stand up WXT with the React module, strict TypeScript, the locked `src/` layout from PRD §4, and a smoke-test dashboard page that renders "historia" when the extension is loaded in Chrome via `pnpm dev`. Zero styling beyond browser defaults.

### Prerequisites

- Phase 1 complete.

### Steps

1. **Install WXT and the React module.**

   ```bash
   pnpm add -D wxt@^0.20 @wxt-dev/module-react
   pnpm add react@^18 react-dom@^18
   pnpm add -D @types/react@^18 @types/react-dom@^18 typescript@^5.4
   ```

   - `react` and `react-dom` are runtime deps; types are dev.

2. **Create `tsconfig.json`** at repo root.

   ```json
   {
     "extends": "./.wxt/tsconfig.json",
     "compilerOptions": {
       "strict": true,
       "noUncheckedIndexedAccess": true,
       "noImplicitOverride": true,
       "exactOptionalPropertyTypes": true,
       "moduleResolution": "bundler",
       "target": "ES2022",
       "lib": ["ES2022", "DOM", "DOM.Iterable"],
       "jsx": "react-jsx",
       "types": ["chrome", "vitest/globals"],
       "verbatimModuleSyntax": true,
       "isolatedModules": true,
       "resolveJsonModule": true,
       "skipLibCheck": true,
       "paths": {
         "@/*": ["./src/*"]
       }
     },
     "include": ["src", "tests", "*.config.*", "*.d.ts"]
   }
   ```

   - `.wxt/tsconfig.json` is generated by `wxt prepare`. The extends keeps WXT's path aliases and entrypoint typings.
   - `noUncheckedIndexedAccess` catches missing days in sparse maps (D-005 invariant).
   - `exactOptionalPropertyTypes` forces clean optional handling.
   - `verbatimModuleSyntax` + `isolatedModules` keep bundler-friendly type imports.

3. **Install Chrome ambient types.**

   ```bash
   pnpm add -D @types/chrome
   ```

4. **Create `wxt.config.ts`** at repo root.

   ```ts
   import { defineConfig } from 'wxt';

   export default defineConfig({
     srcDir: 'src',
     modules: ['@wxt-dev/module-react'],
     manifest: {
       name: 'historia',
       description:
         'Browser History Wrapped — turn your local browsing history into activity heatmaps.',
       permissions: ['history', 'storage', 'alarms'],
       action: {
         default_title: 'Open historia dashboard',
       },
       icons: {
         16: 'icon-16.png',
         32: 'icon-32.png',
         48: 'icon-48.png',
         128: 'icon-128.png',
       },
     },
   });
   ```

   - Manifest version is implicit (MV3) per WXT default ([FR-M-01](./PRD.md#5-manifest--permissions)).
   - No `host_permissions`, no `web_accessible_resources` ([FR-M-02](./PRD.md#5-manifest--permissions), [FR-M-05](./PRD.md#5-manifest--permissions)).
   - Icons referenced here must exist in `public/` — placeholder PNGs are produced in step 6.

5. **Create the `src/` directory structure** exactly as PRD §4 specifies. Use empty `.gitkeep` files where directories must exist but have no source yet — git won't track empty directories.

   ```bash
   mkdir -p src/core src/background src/dashboard/{views,components,components/ui,hooks} src/entrypoints public tests/fixtures
   touch src/core/.gitkeep src/dashboard/views/.gitkeep src/dashboard/components/.gitkeep src/dashboard/components/ui/.gitkeep src/dashboard/hooks/.gitkeep tests/fixtures/.gitkeep
   ```

6. **Add placeholder icons in `public/`.**
   - Generate four solid-color PNG placeholders at 16×16, 32×32, 48×48, and 128×128. Use a neutral gray (`#1f2937` / Tailwind `gray-800`) square — the real icons come in Phase 17.
   - One acceptable approach: use `sharp` (`pnpm dlx sharp-cli --input ... `) or any image tool. Hand-drawn squares in Preview also work. The key requirement is correct file size and PNG format.
   - Result: `public/icon-16.png`, `public/icon-32.png`, `public/icon-48.png`, `public/icon-128.png`.
   - Verify: `file public/icon-128.png` reports `PNG image data, 128 x 128`.

7. **Create the background entrypoint** at `src/entrypoints/background.ts`.

   ```ts
   import { handleActionClick } from '@/background';

   export default defineBackground({
     type: 'module',
     main() {
       handleActionClick();
     },
   });
   ```

   - `defineBackground` is globally provided by WXT (no import needed; it's auto-imported via `.wxt/`).
   - `type: 'module'` enables ES modules in the service worker.
   - The implementation file `src/background/index.ts` is created in this phase as a thin stub; the real backfill logic ships in Phase 11.

8. **Create the background stub** at `src/background/index.ts`.

   ```ts
   /**
    * Service-worker stub for Phase 2 smoke test. Registers the action-click handler
    * synchronously per SW-001 so the icon opens the dashboard tab.
    *
    * Real backfill, ingestion, and incremental update logic land in Phases 10–12.
    */
   export function handleActionClick(): void {
     chrome.action.onClicked.addListener(async () => {
       const url = chrome.runtime.getURL('dashboard.html');
       await chrome.tabs.create({ url });
     });
   }
   ```

9. **Create the dashboard HTML entrypoint** at `src/entrypoints/dashboard.html`.

   ```html
   <!doctype html>
   <html lang="en">
     <head>
       <meta charset="UTF-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
       <title>historia</title>
     </head>
     <body>
       <div id="root"></div>
       <script type="module" src="./dashboard/main.tsx"></script>
     </body>
   </html>
   ```

10. **Create the dashboard React entry** at `src/entrypoints/dashboard/main.tsx`.

    ```tsx
    import { StrictMode } from 'react';
    import { createRoot } from 'react-dom/client';

    import { App } from '@/dashboard/App';

    const container = document.getElementById('root');
    if (!container) {
      throw new Error('historia: #root element missing from dashboard.html');
    }

    createRoot(container).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    ```

11. **Create the App shell** at `src/dashboard/App.tsx` (deliberately minimal for Phase 2 smoke test).

    ```tsx
    export function App(): JSX.Element {
      return (
        <main>
          <h1>historia</h1>
          <p>Dashboard scaffold is alive.</p>
        </main>
      );
    }
    ```

12. **Run `wxt prepare`** to generate `.wxt/`.

    ```bash
    pnpm exec wxt prepare
    ```

    - This populates `.wxt/tsconfig.json`, `.wxt/types/`, and the entrypoint type augmentations.
    - Verify: `ls .wxt/` contains `tsconfig.json` and `types/`.

13. **Smoke-test typecheck.**

    ```bash
    pnpm typecheck
    ```

    - Expect zero errors. If errors reference `JSX`, ensure `jsx: "react-jsx"` is in `tsconfig.json`.

14. **Smoke-test the extension in Chrome.**

    ```bash
    pnpm dev
    ```

    - WXT starts a watcher and launches Chrome with the extension auto-loaded.
    - In the launched Chrome, click the historia toolbar icon. A new tab opens to the dashboard with the text **historia** and **Dashboard scaffold is alive.**
    - Close `pnpm dev` with Ctrl+C when verified.

15. **Smoke-test the production build.**

    ```bash
    pnpm build
    ```

    - Output appears in `.output/chrome-mv3/`. Confirm `manifest.json` is generated with `manifest_version: 3` and the three permissions only.

16. **Commit.**
    - `git add .`
    - `git commit -m "feat: scaffold WXT + React + TypeScript with smoke-test dashboard"`

### Files created

- `tsconfig.json`, `wxt.config.ts`
- `src/entrypoints/background.ts`
- `src/entrypoints/dashboard.html`
- `src/entrypoints/dashboard/main.tsx`
- `src/background/index.ts`
- `src/dashboard/App.tsx`
- `public/icon-16.png`, `public/icon-32.png`, `public/icon-48.png`, `public/icon-128.png`
- `src/` subtree with `.gitkeep` markers
- `.wxt/` (generated, gitignored)

### Outputs

- A loadable Chrome extension that opens a single-page dashboard from the toolbar icon, rendering plain text. Production build succeeds.

### Success criteria

- [ ] `pnpm typecheck` passes with zero errors.
- [ ] `pnpm build` produces a valid `.output/chrome-mv3/manifest.json`.
- [ ] `pnpm dev` loads the extension in Chrome and the toolbar icon opens the dashboard tab.
- [ ] The opened tab shows "historia" as an `<h1>` and "Dashboard scaffold is alive." paragraph.
- [ ] Manifest contains only `history`, `storage`, `alarms` permissions and no `host_permissions`.

### Review checklist

- [ ] `srcDir: 'src'` is set in `wxt.config.ts` (otherwise WXT searches for entrypoints in the wrong place).
- [ ] Path alias `@/` resolves: try importing `import { handleActionClick } from '@/background'` — typecheck passes.
- [ ] `src/core/`, `src/dashboard/components/`, `src/dashboard/views/`, `src/dashboard/hooks/` exist (with `.gitkeep` if empty).
- [ ] `src/core/` contains no chrome.\* references (we have not written any source there yet — keep it that way per [FR-S-01](./PRD.md#4-project-structure)).
- [ ] Background entrypoint registers `chrome.action.onClicked` at top level synchronously (calling `handleActionClick()` from `main()` is OK — `defineBackground.main` runs at top level on worker boot).

### Common pitfalls

- **JSX errors.** Make sure `tsconfig.json` extends `.wxt/tsconfig.json` AND sets `jsx: "react-jsx"`.
- **`defineBackground` undefined.** This is a WXT auto-import; if your editor flags it, restart the TS server after `wxt prepare`.
- **Path alias not resolving in tests.** Tests aren't running yet — this is OK. Phase 4 wires Vitest to honor the alias.
- **`pnpm dev` cannot find Chrome.** Set `WXT_BROWSER_BINARY` env var if Chrome lives outside the default path.

### References

- WXT entrypoints: https://wxt.dev/guide/essentials/entrypoints.html
- WXT React module: https://wxt.dev/guide/essentials/frameworks.html#react
- Chrome MV3 service worker lifecycle: https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle
- TS `noUncheckedIndexedAccess`: https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess

---

## Phase 3 — Tailwind v4 & shadcn/ui Primitives

**PRD phase:** §19.1 phase 1 (Foundation), step 3/5.
**Estimated effort:** 60 minutes.

### Objective

Wire Tailwind CSS v4 through `@tailwindcss/vite`, install the locked shadcn/ui primitives into `src/dashboard/components/ui/`, and verify the smoke-test dashboard renders Tailwind utilities. Visual identity stays **deliberately neutral grayscale** through Phase 15 — Phase 16 owns the design pass.

### Prerequisites

- Phase 2 complete (WXT scaffold runs in Chrome).

### Steps

1. **Install Tailwind v4 and the Vite plugin.**

   ```bash
   pnpm add -D tailwindcss@^4 @tailwindcss/vite@^4
   pnpm add clsx tailwind-merge
   ```

   - `clsx` + `tailwind-merge` are runtime deps used by shadcn's `cn` helper.

2. **Add Tailwind to the WXT Vite config.** Edit `wxt.config.ts` to add a `vite` factory that returns `plugins: [tailwindcss()]`.

   ```ts
   import { defineConfig } from 'wxt';
   import tailwindcss from '@tailwindcss/vite';

   export default defineConfig({
     srcDir: 'src',
     modules: ['@wxt-dev/module-react'],
     vite: () => ({
       plugins: [tailwindcss()],
     }),
     manifest: {
       /* unchanged from Phase 2 */
     },
   });
   ```

3. **Create the dashboard CSS entry** at `src/dashboard/styles.css`.

   ```css
   @import 'tailwindcss';

   /*
    * Phase 3 ships minimal theme tokens — neutral grayscale only.
    * The full design system (palette, typography, motion) is delivered in Phase 16
    * via the impeccable skill. Do NOT add custom colors, fonts, or motion here.
    */
   @theme {
     --font-sans:
       ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
       sans-serif;
   }

   @layer base {
     html,
     body {
       @apply h-full bg-white text-neutral-900 antialiased;
     }
     #root {
       @apply min-h-full;
     }
   }
   ```

4. **Import the stylesheet from the dashboard entry.** Edit `src/entrypoints/dashboard/main.tsx` to add at the top:

   ```ts
   import '@/dashboard/styles.css';
   ```

   - Place this import **above** the React imports so the CSS is bundled with the dashboard chunk.

5. **Add the `cn` helper** at `src/dashboard/lib/cn.ts`.

   ```ts
   import { clsx, type ClassValue } from 'clsx';
   import { twMerge } from 'tailwind-merge';

   /** shadcn's class-name combiner: dedupes and resolves Tailwind class conflicts. */
   export function cn(...inputs: ClassValue[]): string {
     return twMerge(clsx(inputs));
   }
   ```

   - Create the `src/dashboard/lib/` directory if it does not exist.

6. **Add the shadcn config** at `components.json` in the repo root.

   ```json
   {
     "$schema": "https://ui.shadcn.com/schema.json",
     "style": "default",
     "rsc": false,
     "tsx": true,
     "tailwind": {
       "config": "",
       "css": "src/dashboard/styles.css",
       "baseColor": "neutral",
       "cssVariables": true,
       "prefix": ""
     },
     "aliases": {
       "components": "@/dashboard/components",
       "utils": "@/dashboard/lib/cn",
       "ui": "@/dashboard/components/ui",
       "lib": "@/dashboard/lib",
       "hooks": "@/dashboard/hooks"
     },
     "iconLibrary": "lucide"
   }
   ```

   - `"config": ""` is correct for Tailwind v4 — there is no `tailwind.config.js`.
   - The aliases route shadcn's generated components into the locked project structure.

7. **Install `lucide-react` and Radix peers shadcn needs.**

   ```bash
   pnpm add lucide-react
   ```

   - Radix peers are installed on demand by `shadcn add` (next step).

8. **Add shadcn theme tokens to `styles.css`.** Append below the existing `@theme` block:

   ```css
   /*
    * shadcn token surface (CSS variables). Values are placeholder neutrals for Phases 3–15.
    * Phase 16 (impeccable) replaces these with the final design tokens.
    */
   @layer base {
     :root {
       --background: 0 0% 100%;
       --foreground: 0 0% 9%;
       --card: 0 0% 100%;
       --card-foreground: 0 0% 9%;
       --popover: 0 0% 100%;
       --popover-foreground: 0 0% 9%;
       --primary: 0 0% 9%;
       --primary-foreground: 0 0% 98%;
       --secondary: 0 0% 96%;
       --secondary-foreground: 0 0% 9%;
       --muted: 0 0% 96%;
       --muted-foreground: 0 0% 45%;
       --accent: 0 0% 96%;
       --accent-foreground: 0 0% 9%;
       --destructive: 0 84% 60%;
       --destructive-foreground: 0 0% 98%;
       --border: 0 0% 90%;
       --input: 0 0% 90%;
       --ring: 0 0% 9%;
       --radius: 0.5rem;
     }
   }

   @theme inline {
     --color-background: hsl(var(--background));
     --color-foreground: hsl(var(--foreground));
     --color-card: hsl(var(--card));
     --color-card-foreground: hsl(var(--card-foreground));
     --color-popover: hsl(var(--popover));
     --color-popover-foreground: hsl(var(--popover-foreground));
     --color-primary: hsl(var(--primary));
     --color-primary-foreground: hsl(var(--primary-foreground));
     --color-secondary: hsl(var(--secondary));
     --color-secondary-foreground: hsl(var(--secondary-foreground));
     --color-muted: hsl(var(--muted));
     --color-muted-foreground: hsl(var(--muted-foreground));
     --color-accent: hsl(var(--accent));
     --color-accent-foreground: hsl(var(--accent-foreground));
     --color-destructive: hsl(var(--destructive));
     --color-destructive-foreground: hsl(var(--destructive-foreground));
     --color-border: hsl(var(--border));
     --color-input: hsl(var(--input));
     --color-ring: hsl(var(--ring));
     --radius-sm: calc(var(--radius) - 4px);
     --radius-md: calc(var(--radius) - 2px);
     --radius-lg: var(--radius);
   }
   ```

9. **Install the locked shadcn primitives.** Run the shadcn CLI for each component listed below. The CLI auto-installs Radix peer deps.

   ```bash
   pnpm dlx shadcn@latest add button tabs select popover tooltip
   ```

   - Components land in `src/dashboard/components/ui/` per the alias config.
   - If the CLI asks about React Server Components, choose "No" (we are not RSC).
   - If the CLI asks to overwrite `src/dashboard/lib/cn.ts`, choose **No** — keep the file written in step 5.

10. **Add `Card` and `Sheet` primitives** for use in later phases.

    ```bash
    pnpm dlx shadcn@latest add card sheet
    ```

11. **Verify the smoke-test dashboard uses Tailwind.** Update `src/dashboard/App.tsx` to:

    ```tsx
    import { Button } from '@/dashboard/components/ui/button';

    export function App(): JSX.Element {
      return (
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
          <header>
            <h1 className="text-3xl font-semibold tracking-tight">historia</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Dashboard scaffold with Tailwind v4 + shadcn primitives.
            </p>
          </header>
          <div>
            <Button>Smoke test button</Button>
          </div>
        </main>
      );
    }
    ```

12. **Re-run typecheck and dev.**

    ```bash
    pnpm typecheck
    pnpm dev
    ```

    - Click the icon in the launched Chrome. The dashboard tab shows the styled heading and a shadcn button.
    - Hovering the button shows the focus ring (don't remove it).

13. **Verify production build.**

    ```bash
    pnpm build
    ```

    - Confirm `.output/chrome-mv3/assets/` contains a CSS chunk and the page loads it.

14. **Commit.**
    - `git add .`
    - `git commit -m "feat: integrate Tailwind v4 and shadcn primitives with neutral token set"`

### Files created

- `src/dashboard/styles.css`
- `src/dashboard/lib/cn.ts`
- `components.json`
- `src/dashboard/components/ui/button.tsx`, `tabs.tsx`, `select.tsx`, `popover.tsx`, `tooltip.tsx`, `card.tsx`, `sheet.tsx`

### Files modified

- `wxt.config.ts` (added `vite` factory)
- `src/dashboard/App.tsx` (uses Button + Tailwind classes)
- `src/entrypoints/dashboard/main.tsx` (imports `styles.css`)

### Success criteria

- [ ] `pnpm typecheck` passes.
- [ ] `pnpm build` succeeds and emits a CSS chunk.
- [ ] Loading the extension shows a styled dashboard: max-width centered, gray text muted, primary button with focus ring.
- [ ] No styling beyond neutral grayscale + shadcn defaults. (Phase 16 owns visual identity per [DSGN-001](./PRD.md#15-visual-design-placeholder).)
- [ ] `src/dashboard/components/ui/` contains exactly the 7 primitives listed.

### Review checklist

- [ ] Tailwind v4 — no `tailwind.config.js` file exists.
- [ ] `@import 'tailwindcss';` appears once in `styles.css`.
- [ ] The CSS file is imported from the React entry, not the HTML entry (lets WXT bundle it correctly).
- [ ] `cn()` is the single source of truth for class composition (no ad-hoc `clsx()` calls in components).
- [ ] No design tokens were invented beyond the neutral shadcn defaults.

### Common pitfalls

- **`@apply` errors** at build time → ensure `@import 'tailwindcss';` is the **first** line of `styles.css`. Tailwind v4 needs the import before `@layer`/`@theme`.
- **shadcn CLI installs `tw-animate-css` or other extras.** Decline anything outside the locked stack; if installed, remove via `pnpm remove` and delete generated config.
- **Components using `@/lib/utils`** (default shadcn import path): the `aliases.utils` config in step 6 redirects this to `@/dashboard/lib/cn`. If a primitive still references `@/lib/utils`, fix the import after install.
- **CSS not loading in production.** WXT chunks CSS per entrypoint — confirm the `import '@/dashboard/styles.css'` lives in `main.tsx` (the entrypoint file), not in a deeper component.

### References

- Tailwind v4 + Vite: https://tailwindcss.com/docs/installation/using-vite
- Tailwind v4 `@theme`: https://tailwindcss.com/docs/theme
- shadcn/ui Tailwind v4 setup: https://ui.shadcn.com/docs/tailwind-v4
- shadcn CLI: https://ui.shadcn.com/docs/cli

---

## Phase 4 — Lint, Format, Test Infrastructure

**PRD phase:** §19.1 phase 1 (Foundation), step 4/5.
**Estimated effort:** 60–90 minutes.

### Objective

Install ESLint 9 flat config, Prettier with the Tailwind plugin, Vitest with the WxtVitest plugin, and Testing Library. Verify a placeholder test passes in both Node and `fakeBrowser` environments. Lock the module-boundary rule from [FR-S-01](./PRD.md#4-project-structure).

### Prerequisites

- Phase 3 complete.

### Steps

1. **Install ESLint 9 + plugins.**

   ```bash
   pnpm add -D eslint@^9 typescript-eslint@^8 \
     eslint-plugin-react@^7 eslint-plugin-react-hooks@^5 \
     eslint-plugin-react-refresh@^0.4 eslint-plugin-simple-import-sort@^12 \
     eslint-config-prettier@^9 globals@^15
   ```

2. **Create `eslint.config.js`** at repo root.

   ```js
   import js from '@eslint/js';
   import tseslint from 'typescript-eslint';
   import react from 'eslint-plugin-react';
   import reactHooks from 'eslint-plugin-react-hooks';
   import reactRefresh from 'eslint-plugin-react-refresh';
   import simpleImportSort from 'eslint-plugin-simple-import-sort';
   import prettier from 'eslint-config-prettier';
   import globals from 'globals';

   export default tseslint.config(
     {
       ignores: ['.wxt/**', '.output/**', 'node_modules/**', 'coverage/**', 'public/**'],
     },
     js.configs.recommended,
     ...tseslint.configs.recommendedTypeChecked,
     ...tseslint.configs.stylisticTypeChecked,
     {
       languageOptions: {
         parserOptions: {
           projectService: true,
           tsconfigRootDir: import.meta.dirname,
         },
         globals: {
           ...globals.browser,
           ...globals.webextensions,
         },
       },
       plugins: {
         react,
         'react-hooks': reactHooks,
         'react-refresh': reactRefresh,
         'simple-import-sort': simpleImportSort,
       },
       settings: { react: { version: 'detect' } },
       rules: {
         ...react.configs.recommended.rules,
         ...reactHooks.configs.recommended.rules,
         'react/react-in-jsx-scope': 'off',
         'react/prop-types': 'off',
         'react-refresh/only-export-components': 'warn',
         'simple-import-sort/imports': 'error',
         'simple-import-sort/exports': 'error',
         '@typescript-eslint/consistent-type-imports': [
           'error',
           { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
         ],
         '@typescript-eslint/no-unused-vars': [
           'error',
           { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
         ],
       },
     },
     // Enforce FR-S-01: src/core/ must not import chrome APIs or other layers.
     {
       files: ['src/core/**/*.{ts,tsx}'],
       rules: {
         'no-restricted-imports': [
           'error',
           {
             patterns: [
               {
                 group: ['@/background/*', '@/dashboard/*'],
                 message:
                   'src/core/ must not import from background or dashboard layers (FR-S-01).',
               },
               {
                 group: ['webextension-polyfill'],
                 message: 'src/core/ must remain extension-agnostic (FR-S-01).',
               },
             ],
           },
         ],
         'no-restricted-globals': [
           'error',
           { name: 'chrome', message: 'src/core/ must not reference chrome.* (FR-S-01).' },
           { name: 'browser', message: 'src/core/ must not reference browser.* (FR-S-01).' },
         ],
       },
     },
     // Tests can use chrome via fakeBrowser; relax type-checked rules where needed.
     {
       files: ['**/*.test.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
       rules: {
         '@typescript-eslint/no-non-null-assertion': 'off',
       },
     },
     prettier,
   );
   ```

3. **Install Prettier + Tailwind plugin.**

   ```bash
   pnpm add -D prettier@^3 prettier-plugin-tailwindcss@^0.6
   ```

4. **Create `.prettierrc.json`** at repo root.

   ```json
   {
     "singleQuote": true,
     "trailingComma": "all",
     "printWidth": 100,
     "tabWidth": 2,
     "semi": true,
     "arrowParens": "always",
     "plugins": ["prettier-plugin-tailwindcss"]
   }
   ```

5. **Create `.prettierignore`** at repo root.

   ```
   .wxt
   .output
   coverage
   node_modules
   pnpm-lock.yaml
   public
   ```

6. **Install Vitest companions + Testing Library.** (`vitest@^2` itself is already installed in Phase 2 — see Phase 2 deviation note in HANDOFF.md and the [Status Tracker](#status-tracker) — because Phase 2's `tsconfig.json` references `vitest/globals` and typecheck would fail without the package present. The `pnpm.overrides.vite: "8.0.14"` pin in `package.json` already resolves the vite peer-dep conflict between vitest@2 and WXT@0.20; do not remove it.)

   ```bash
   pnpm add -D @vitest/coverage-v8@^2 \
     @testing-library/react@^16 @testing-library/jest-dom@^6 @testing-library/user-event@^14 \
     jsdom@^25
   ```

   - WXT ships the Vitest plugin from `wxt/testing` (no separate install needed; comes with the `wxt` package).
   - `@webext-core/fake-browser` is a transitive dep brought in by the WXT plugin.

7. **Create `vitest.config.ts`** at repo root.

   ```ts
   import { defineConfig } from 'vitest/config';
   import { WxtVitest } from 'wxt/testing';

   export default defineConfig({
     plugins: [WxtVitest()],
     test: {
       environment: 'jsdom',
       globals: true,
       setupFiles: ['./tests/setup.ts'],
       coverage: {
         provider: 'v8',
         reporter: ['text', 'html', 'lcov'],
         include: ['src/core/**/*.ts'],
         exclude: ['src/core/types.ts', '**/*.test.ts', '**/*.d.ts'],
         thresholds: {
           // T-004: per-file gates on the listed core modules.
           'src/core/filters.ts': { lines: 90, branches: 90, functions: 90, statements: 90 },
           'src/core/aggregate.ts': { lines: 90, branches: 90, functions: 90, statements: 90 },
           'src/core/intensity.ts': { lines: 90, branches: 90, functions: 90, statements: 90 },
           'src/core/dates.ts': { lines: 90, branches: 90, functions: 90, statements: 90 },
           'src/core/domain.ts': { lines: 90, branches: 90, functions: 90, statements: 90 },
         },
       },
     },
     resolve: {
       alias: { '@': new URL('./src', import.meta.url).pathname },
     },
   });
   ```

8. **Create the test setup file** at `tests/setup.ts`.

   ```ts
   import '@testing-library/jest-dom/vitest';
   import { afterEach, beforeEach } from 'vitest';
   import { fakeBrowser } from 'wxt/testing';
   import { cleanup } from '@testing-library/react';

   beforeEach(() => {
     fakeBrowser.reset();
   });

   afterEach(() => {
     cleanup();
   });
   ```

9. **Add a smoke test** at `tests/smoke.test.ts`.

   ```ts
   import { describe, it, expect } from 'vitest';
   import { fakeBrowser } from 'wxt/testing';

   describe('test infrastructure', () => {
     it('jsdom environment is active', () => {
       expect(typeof document).toBe('object');
       expect(document.body).toBeTruthy();
     });

     it('fakeBrowser is available and resets between tests', async () => {
       await fakeBrowser.storage.local.set({ smoke: 42 });
       const got = await fakeBrowser.storage.local.get('smoke');
       expect(got).toEqual({ smoke: 42 });
     });
   });
   ```

10. **Add a VS Code settings hint** at `.vscode/settings.json` (committed).

    ```json
    {
      "editor.formatOnSave": true,
      "editor.defaultFormatter": "esbenp.prettier-vscode",
      "editor.codeActionsOnSave": {
        "source.fixAll.eslint": "explicit"
      },
      "eslint.experimental.useFlatConfig": true,
      "typescript.tsdk": "node_modules/typescript/lib"
    }
    ```

    - Optional for non-VS-Code users; harmless to commit.

11. **Add a VS Code recommended extensions file** at `.vscode/extensions.json`.

    ```json
    {
      "recommendations": [
        "esbenp.prettier-vscode",
        "dbaeumer.vscode-eslint",
        "bradlc.vscode-tailwindcss"
      ]
    }
    ```

12. **Run the full local quality gate.**

    ```bash
    pnpm format        # writes Prettier formatting
    pnpm lint          # zero errors
    pnpm typecheck     # zero errors
    pnpm test          # smoke.test.ts passes
    ```

    - If lint reports issues in shadcn-generated files, run `pnpm lint:fix` once and verify the result.

13. **Commit.**
    - `git add .`
    - `git commit -m "feat: wire ESLint flat config, Prettier, Vitest + WxtVitest, smoke tests"`

### Files created

- `eslint.config.js`, `.prettierrc.json`, `.prettierignore`
- `vitest.config.ts`, `tests/setup.ts`, `tests/smoke.test.ts`
- `.vscode/settings.json`, `.vscode/extensions.json`

### Outputs

- Lint, format, type, and test commands all pass cleanly. Boundary rule enforced.

### Success criteria

- [ ] `pnpm lint` exits 0.
- [ ] `pnpm format:check` exits 0 (or `pnpm format` was run last).
- [ ] `pnpm typecheck` exits 0.
- [ ] `pnpm test` reports the two smoke tests passing.
- [ ] An attempt to import `chrome.tabs` from `src/core/` (try it in a throwaway file) is flagged by ESLint with the FR-S-01 message. Delete the throwaway file after verifying.

### Review checklist

- [ ] `eslint.config.js` is flat config (no `.eslintrc.*` exists).
- [ ] Tailwind plugin runs (verify by saving a component — class order changes).
- [ ] `tests/setup.ts` resets `fakeBrowser` in `beforeEach`.
- [ ] Coverage gates are per-file ([T-004](./PRD.md#t-004)), not global.
- [ ] No husky / lint-staged installed — CI catches issues per PRD direction.

### Common pitfalls

- **ESLint "projectService" fails** → set `tsconfigRootDir: import.meta.dirname` (done above) and ensure `tsconfig.json` includes the files being linted.
- **Vitest cannot resolve `@/...`** → confirm `vitest.config.ts`'s `resolve.alias` block matches `tsconfig.json` paths.
- **Tailwind class sort changes too aggressive** → that's expected; let Prettier own class order.

### References

- ESLint flat config: https://eslint.org/docs/latest/use/configure/configuration-files
- typescript-eslint v8 flat config: https://typescript-eslint.io/getting-started
- Vitest: https://vitest.dev/guide/
- WXT testing: https://wxt.dev/guide/essentials/unit-testing.html

---

## Phase 5 — CI Pipeline

**PRD phase:** §19.1 phase 1 (Foundation), step 5/5. PRD [REL-102](./PRD.md#rel-102).
**Estimated effort:** 30–45 minutes.

### Objective

A single GitHub Actions workflow that runs install → lint → typecheck → test → build on every PR and every push to `main`. The PR cannot merge unless the workflow is green.

### Prerequisites

- Phase 4 complete (all local quality gates green).
- A GitHub remote exists. If it does not, create the public repo `historia` on GitHub from day one ([REL-104](./PRD.md#rel-104)) and add it as `origin`.

### Steps

1. **Create the workflow file** at `.github/workflows/ci.yml`.

   ```yaml
   name: CI

   on:
     pull_request:
       branches: [main]
     push:
       branches: [main]

   jobs:
     verify:
       name: Lint, typecheck, test, build
       runs-on: ubuntu-latest
       timeout-minutes: 10
       steps:
         - name: Checkout
           uses: actions/checkout@v4

         - name: Setup pnpm
           uses: pnpm/action-setup@v4
           with:
             version: 9

         - name: Setup Node
           uses: actions/setup-node@v4
           with:
             node-version-file: .nvmrc
             cache: pnpm

         - name: Install
           run: pnpm install --frozen-lockfile

         - name: Lint
           run: pnpm lint

         - name: Typecheck
           run: pnpm typecheck

         - name: Test
           run: pnpm test

         - name: Build
           run: pnpm build
   ```

2. **Add a `CODEOWNERS` file** at `.github/CODEOWNERS` (single owner for v1).

   ```
   * @<your-github-handle>
   ```

   - Replace `<your-github-handle>` with `abhi-j0407` (the personal GitHub handle for this repo; commit author identity is `Abhishek <abhishek.j0407@gmail.com>`, set per-repo in Phase 1).

3. **Add a pull request template** at `.github/pull_request_template.md`.

   ```markdown
   ## Phase

   <!-- e.g. Phase 6 — Core Types & URL Filters -->

   ## Summary

   <!-- 1–3 bullets covering what was built against the phase's Outputs list -->

   ## Verification

   - [ ] `pnpm lint` passes locally
   - [ ] `pnpm typecheck` passes locally
   - [ ] `pnpm test` passes locally
   - [ ] `pnpm build` passes locally
   - [ ] Manually verified the relevant PRD acceptance criteria

   ## PRD references

   <!-- List the PRD IDs touched, e.g. B-001, B-005, FR-S-01 -->
   ```

4. **Add an issue template** at `.github/ISSUE_TEMPLATE/bug.yml` (helpful for the public-from-day-one stance).

   ```yaml
   name: Bug report
   description: Something is broken
   labels: ['bug']
   body:
     - type: textarea
       id: what
       attributes:
         label: What happened?
         description: A clear and concise description of the issue.
       validations:
         required: true
     - type: textarea
       id: repro
       attributes:
         label: Steps to reproduce
         description: Numbered list of steps.
       validations:
         required: true
     - type: input
       id: chrome-version
       attributes:
         label: Chrome / Chromium version
       validations:
         required: true
   ```

5. **Push the branch and open the first PR.**
   - `git checkout -b phase/05-ci-pipeline`
   - `git add .github/`
   - `git commit -m "ci: add GitHub Actions verify workflow and templates"`
   - `git push -u origin phase/05-ci-pipeline`
   - Open the PR through GitHub UI. Confirm the workflow runs and turns green.

6. **Enable branch protection on `main`.** (Manual step, GitHub UI.)
   - Settings → Branches → Add rule for `main`:
     - Require status checks: `verify`.
     - Require pull request reviews: 0 reviewers acceptable for a solo project, but require a PR (no direct push).
     - Disallow force pushes.

7. **Merge the PR** once green.

### Files created

- `.github/workflows/ci.yml`
- `.github/CODEOWNERS`
- `.github/pull_request_template.md`
- `.github/ISSUE_TEMPLATE/bug.yml`

### Outputs

- A green CI run on `main`. Branch protection prevents accidental direct pushes.

### Success criteria

- [ ] The `verify` job runs on PR and on push to `main`.
- [ ] All five steps (install, lint, typecheck, test, build) pass on a clean check-out.
- [ ] Branch protection requires `verify` to pass before merge.

### Review checklist

- [ ] `actions/checkout@v4` (not @v3 — security cadence).
- [ ] `pnpm/action-setup@v4` with explicit `version: 9` to match `package.json#packageManager`.
- [ ] `node-version-file: .nvmrc` keeps Node version in one place.
- [ ] No secrets referenced in the workflow (no CWS publishing yet — that's Phase 17 manual).
- [ ] `--frozen-lockfile` is set on install (catches lockfile drift).

### Common pitfalls

- **Cache miss on every run** → `cache: pnpm` requires the lockfile to exist before install; the `setup-node` step handles this correctly.
- **`pnpm exec wxt prepare` not running** → the `postinstall` script in `package.json` triggers `wxt prepare` automatically.
- **TypeScript out-of-memory** on CI → unlikely at v1 size, but if it appears, set `NODE_OPTIONS=--max-old-space-size=4096` on the typecheck step.

### References

- GitHub Actions for pnpm: https://pnpm.io/continuous-integration#github-actions
- Branch protection rules: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches

---

## Phase 6 — Core Types & URL Filters

**PRD phase:** §19.1 phase 2 (Data plumbing), step 1/3. PRD [D-001..D-006](./PRD.md#6-data-model), [B-001..B-004](./PRD.md#71-url-filtering), [FR-F-01](./PRD.md#71-url-filtering).
**Estimated effort:** 90 minutes.

### Objective

Write the canonical type definitions for the data model and the URL-filtering module. Both ship with full unit tests. No runtime dependencies, no chrome.\* — pure TypeScript that runs in Node.

### Prerequisites

- Phase 5 complete (CI green on main).

### Steps

1. **Create `src/core/types.ts`** as the verbatim transcription of PRD [§6](./PRD.md#6-data-model). Use `interface` to match the PRD.

   ```ts
   /**
    * Canonical data shapes shared across core, background, and dashboard layers.
    * Mirrors PRD §6 (D-001 .. D-006). Do not edit shapes without amending the PRD.
    */

   /** D-001 — Normalized internal visit record. */
   export interface Visit {
     url: string;
     apexDomain: string;
     title: string;
     visitedAt: number;
   }

   /** D-002 — Local-timezone day key in YYYY-MM-DD form. */
   export type DayKey = string;

   /** D-003 — Per-site aggregate row. */
   export interface SiteRank {
     apexDomain: string;
     totalVisits: number;
     activeDays: number;
   }

   /** D-004 — Winner of a single day. */
   export interface DailyWinner {
     apexDomain: string;
     visits: number;
   }

   /** D-005 — Full cached aggregate payload. */
   export interface Aggregate {
     version: 1;
     computedAt: number;
     lastAggregatedAt: number;
     dateRange: { earliest: DayKey; latest: DayKey };
     totalVisitsPerDay: Record<DayKey, number>;
     visitsPerSitePerDay: Record<string, Record<DayKey, number>>;
     dailyWinner: Record<DayKey, DailyWinner>;
     topSites: SiteRank[];
   }

   /** D-006 — Transient backfill progress signal (not persisted). */
   export interface BackfillProgress {
     phase: 'idle' | 'enumerating' | 'fetching-visits' | 'aggregating' | 'done' | 'error';
     processed: number;
     total: number;
     startedAt: number;
   }

   /** Schema version currently expected by the running code (used by ST-003). */
   export const AGGREGATE_VERSION = 1 as const;
   ```

2. **Create `src/core/log.ts`** — the single error reporter ([E-001](./PRD.md#e-001)).

   ```ts
   /** Prefix-and-forward to console.error per E-001. No remote telemetry in v1. */
   export function log(message: string, ...rest: unknown[]): void {
     // eslint-disable-next-line no-console -- E-001 explicitly uses console.
     console.error(`[historia] ${message}`, ...rest);
   }
   ```

3. **Create `src/core/filters.ts`.** Filters are data-driven per [FR-F-01](./PRD.md#71-url-filtering). The full implementation matches PRD §7.1 — scheme list (B-001), new-tab placeholders (B-002), local hosts (B-003), and the nine search-engine rules (B-004). Implementation pattern: a `tryParse` that returns a normalized `{protocol, hostname, pathname, search}` or null, plus an array of predicate functions that OR together. Hostnames are lowercased before matching; malformed URLs are dropped (returned as `true` from `shouldDropURL`).

4. **Create `src/core/filters.test.ts`** with one positive + one negative case per rule (PRD [T-003](./PRD.md#t-003)). Required coverage:
   - B-001: every entry in the scheme list (14 URLs) drops; a regular `https://example.com/path` is kept.
   - B-002: `chrome://newtab/`, `about:blank`, and `""` drop; `https://example.com` is kept.
   - B-003: `localhost`, `127.0.0.1`, `0.0.0.0`, `::1`, `*.local` drop; `app.localhost.example.com` (not a real local) is kept.
   - B-004: one search URL per of the 9 engines drops; corresponding non-search pages (`google.com/maps`, `duckduckgo.com/`, `search.brave.com/`, `startpage.com/about`) are kept.
     Use `it.each([...])` to enumerate URLs concisely.

5. **Run quality gates.**

   ```bash
   pnpm lint && pnpm typecheck && pnpm test
   pnpm test:coverage
   ```

   - All filters and types compile cleanly. ESLint reports no violations. Coverage for `src/core/filters.ts` ≥ 90% per [T-004](./PRD.md#t-004).

6. **Commit.**
   - `git add src/core/`
   - `git commit -m "feat(core): types, log helper, and URL filters (B-001..B-004)"`

### Files created

- `src/core/types.ts`
- `src/core/log.ts`
- `src/core/filters.ts`, `src/core/filters.test.ts`

### Success criteria

- [ ] `src/core/types.ts` exports the seven shapes verbatim from PRD §6.
- [ ] `shouldDropURL` correctly drops every PRD-listed URL pattern (B-001..B-004).
- [ ] Coverage for `filters.ts` ≥ 90% lines, branches, functions, statements.
- [ ] ESLint enforces the FR-S-01 boundary (no chrome.\* in `src/core/`).
- [ ] `pnpm test` reports ≥ 30 passing assertions across the four describe blocks.

### Review checklist

- [ ] No `any` types.
- [ ] Type-only imports use `import type` (enforced by `consistent-type-imports`).
- [ ] Hostnames are lowercased before matching.
- [ ] `tryParse` returns `null` for malformed URLs and `shouldDropURL` treats that as drop.
- [ ] No invented filter rules beyond [B-001..B-004](./PRD.md#71-url-filtering).
- [ ] Rule predicates live in a single array (data-driven per [FR-F-01](./PRD.md#71-url-filtering)).

### Common pitfalls

- **TLD pattern overreach.** Use `/(^|\.)google\.[a-z.]+$/` to match `google.com`, `google.co.uk`, etc. Avoid `*` glob — the regex form is more precise and bounded.
- **Startpage path forms.** Both `/sp/search` and `/do/search` must be covered.
- **DuckDuckGo path.** It's the root path `/` with a `q=` query param (not `/search`).
- **The "search.yahoo.com" rule** matches the whole host — the PRD does not constrain the path.

### References

- WHATWG URL API: https://developer.mozilla.org/en-US/docs/Web/API/URL

---

## Phase 7 — Domain & Date Helpers

**PRD phase:** §19.1 phase 2 (Data plumbing), step 2/3. PRD glossary, [D-001](./PRD.md#d-001), [B-006](./PRD.md#b-006), [UX-S-02](./PRD.md#ux-s-02).
**Estimated effort:** 60 minutes.

### Objective

Add `domain.ts` (apex extraction via tldts) and `dates.ts` (date-fns wrappers for day-key conversion, range enumeration, and selector resolution). Both pure, fully unit-tested.

### Prerequisites

- Phase 6 complete.

### Steps

1. **Install runtime dependencies.**

   ```bash
   pnpm add tldts@^7 date-fns@^4
   ```

2. **Create `src/core/domain.ts`** with a single export:

   ```ts
   import { getDomain } from 'tldts';

   /**
    * Returns the lowercase apex domain for a URL per the Public Suffix List,
    * or null if the URL has no resolvable apex (data:, file:, IP literals, etc.).
    * Matches PRD glossary "Apex domain".
    */
   export function apexOf(url: string): string | null {
     const apex = getDomain(url);
     return apex === null ? null : apex.toLowerCase();
   }
   ```

3. **Create `src/core/domain.test.ts`** with these required cases:
   - Resolves multi-subdomain: `mail.google.com` → `google.com`; `docs.google.com` → `google.com`.
   - Resolves complex PSL: `user.github.io` → `user.github.io` (since `github.io` is itself a PSL entry); `www.example.co.uk` → `example.co.uk`.
   - Lowercases: `EXAMPLE.com/PATH` → `example.com`.
   - Returns `null` for: `data:text/plain,hi`, `file:///tmp/x.txt`, `http://127.0.0.1/`, `http://[::1]/`, `not a url`.

4. **Create `src/core/dates.ts`** with these exports:
   - `toDayKey(visitedAt: number): DayKey` — uses `format(new Date(ts), 'yyyy-MM-dd')` for local-tz B-006 compliance.
   - `fromDayKey(key: DayKey): Date` — `startOfDay(parseISO(key))`.
   - `todayKey(now?: Date): DayKey` — default parameter for testability.
   - `eachDayInRange(start, end): DayKey[]` — inclusive, ascending, throws if `end < start`.
   - `resolveRange(selector: '7d' | '30d' | '90d' | 'all', aggregateEarliest, now?): { start, end }` — N-day windows include today (so `'7d'` returns 7 keys total: `[today-6, ..., today]`). `'all'` returns `{ start: aggregateEarliest, end: todayKey(now) }`.
   - All functions must accept an optional `now: Date` parameter where they use the current time, defaulting to `new Date()`. Tests pass a fixed `now` to remain deterministic.

5. **Create `src/core/dates.test.ts`** with required cases:
   - `toDayKey`: a `Date(2026, 4, 22, 23, 55)` returns `'2026-05-22'` (B-006 boundary verification).
   - `toDayKey`: a `Date(2026, 4, 23, 0, 1)` returns `'2026-05-23'` (rollover).
   - `fromDayKey ∘ toDayKey` roundtrips today's key.
   - `eachDayInRange('2026-05-20', '2026-05-22')` returns `['2026-05-20', '2026-05-21', '2026-05-22']`.
   - `eachDayInRange(x, x)` returns `[x]`.
   - `eachDayInRange('2026-05-22', '2026-05-21')` throws.
   - `resolveRange('7d', anyEarliest, now=2026-05-22)` returns `{ start: '2026-05-16', end: '2026-05-22' }`.
   - `resolveRange('30d', anyEarliest, now=2026-05-22)` returns `{ start: '2026-04-23', end: '2026-05-22' }`.
   - `resolveRange('90d', anyEarliest, now=2026-05-22)` returns `{ start: '2026-02-22', end: '2026-05-22' }`.
   - `resolveRange('all', '2025-09-01', now=2026-05-22)` returns `{ start: '2025-09-01', end: '2026-05-22' }`.

6. **Run quality gates.**

   ```bash
   pnpm lint && pnpm typecheck && pnpm test:coverage
   ```

   - Coverage for `domain.ts` and `dates.ts` ≥ 90%.

7. **Commit.**
   - `git add src/core/`
   - `git commit -m "feat(core): apex extraction (tldts) and local-tz date helpers (B-006)"`

### Files created

- `src/core/domain.ts`, `src/core/domain.test.ts`
- `src/core/dates.ts`, `src/core/dates.test.ts`

### Success criteria

- [ ] `apexOf` returns lowercase apex or null per PSL semantics.
- [ ] `toDayKey` is timezone-correct (B-006) and tested explicitly at the 23:55/00:01 boundary.
- [ ] `resolveRange` produces inclusive N-day windows matching PRD [UX-S-02](./PRD.md#ux-s-02).
- [ ] Coverage ≥ 90% on both `domain.ts` and `dates.ts`.

### Review checklist

- [ ] `tldts` is the runtime dep, not `tldts-experimental` or a fork.
- [ ] No UTC math anywhere — `format(d, 'yyyy-MM-dd')` is local-tz by design.
- [ ] No `Date.now()` calls inside production functions; the current time arrives via the optional `now` parameter (default `new Date()`).
- [ ] `eachDayInRange` returns a plain `DayKey[]` array, not a generator.

### References

- tldts: https://github.com/remusao/tldts#readme
- date-fns format tokens: https://date-fns.org/docs/format
- date-fns `differenceInCalendarDays`: https://date-fns.org/docs/differenceInCalendarDays

---

## Phase 8 — Aggregation Engine, Intensity & Palette

**PRD phase:** §19.1 phase 2 (Data plumbing), step 3/3. PRD [B-005..B-008](./PRD.md#72-aggregation), [HM-003](./PRD.md#hm-003), [UX-W-02](./PRD.md#ux-w-02), [T-002](./PRD.md#t-002).
**Estimated effort:** 3–4 hours.

### Objective

Implement the pure aggregation function, the quantile-bucketed intensity algorithm, the winner-palette assigner, and the synthetic-history fixture. All shipped with rigorous tests.

### Prerequisites

- Phase 7 complete.

### Steps

1. **Create `tests/fixtures/synthetic-history.ts`** ([T-002](./PRD.md#t-002)). Required contents:
   - Exports `SYNTHETIC_RAW: readonly RawVisit[]` where `RawVisit = { url: string; title: string; visitedAt: number }`.
   - Exports `syntheticVisits(): Visit[]` that applies `shouldDropURL` and `apexOf` to produce normalized `Visit[]`.
   - Spans dates 2026-04-30 .. 2026-05-22 (so the result has ≥ 22 days of coverage).
   - Includes these apexes with these approximate visit shapes:
     - `google.com` — heavy (multiple subdomains: `mail.google.com`, `docs.google.com`); ~30 visits across ≥ 5 days.
     - `github.com` — clustered in last 10 days; ~16 visits across 3 days.
     - `youtube.com` — light but consistent; ~7 visits across 4 days.
     - `stackoverflow.com` — mid tier; ~4 visits across 2 days.
     - `news.ycombinator.com` — low tier with empty-string titles; ~2 visits across 2 days.
   - Includes filtered URLs that must NOT survive: `chrome://newtab/` (50 visits), `https://www.google.com/search?q=help` (30 visits), `http://localhost:3000/` (20 visits).
   - All timestamps use `new Date(y, m-1, d, hh, 0, 0, 0).getTime()` for local-tz determinism.

2. **Create `src/core/aggregate.ts`** with one export, `aggregate(visits, computedAt?): Aggregate`. Required behavior:
   - Single pass over `visits` building: `totalVisitsPerDay` map, `visitsPerSitePerDay` nested map, `siteTotals` `Map<apex, {total, days: Set<DayKey>}>`, plus `earliest`/`latest` day trackers and `lastAggregatedAt` (max of `visit.visitedAt`).
   - Convert `siteTotals` to `topSites: SiteRank[]` sorted per [B-007](./PRD.md#b-007): `totalVisits` desc → `activeDays` desc → apex lex ascending.
   - Build `dailyWinner` map by iterating each day's apex→count map and applying [B-005](./PRD.md#b-005) tie-break: max `visits` → max overall `totalVisits` → lex apex ascending.
   - `computedAt` defaults to `Date.now()`. This is the only non-deterministic field — keep it as the function parameter so tests pin it.
   - `version: 1` per `AGGREGATE_VERSION`.
   - Empty input case: returns an aggregate with `topSites: []`, empty maps, and `dateRange.earliest = dateRange.latest = toDayKey(computedAt)`.
   - Pure function ([B-008](./PRD.md#b-008)): no `chrome.*`, no I/O, no global state. Verifiable by running the function twice with identical inputs and `computedAt` and asserting deep equality.

3. **Create `src/core/aggregate.test.ts`** with required cases:
   - Synthetic fixture: aggregate result drops all filtered URLs; rolls `mail.google.com` + `docs.google.com` into `google.com`; `topSites` is sorted per B-007; `dateRange.latest === '2026-05-22'`.
   - B-005 tie-break (case 1): Two apexes tie on day-count; the one with higher overall total wins.
   - B-005 tie-break (case 2): Both tie on day-count AND overall total; lex ascending wins (`a.com` over `b.com`).
   - B-008 purity: `aggregate(visits, 1000)` called twice deep-equals.
   - Empty input: returns a zero aggregate, does not throw.

4. **Create `src/core/intensity.ts`** with the following:
   - Export `type IntensityLevel = 0 | 1 | 2 | 3 | 4 | 5`.
   - Export `interface IntensityScale { quantiles: readonly [number, number, number, number]; assign: (v: number) => IntensityLevel; }`.
   - Export `buildIntensityScale(nonZeroValues: readonly number[]): IntensityScale`.
   - Algorithm per [HM-003](./PRD.md#hm-003):
     - Filter to strictly positive values, dedupe.
     - If zero distinct: `quantiles = [0,0,0,0]`, `assign(v) = 0` always.
     - If 1–4 distinct: distinct values fill quantile slots 0..N-1, remaining slots merge from the top (repeat the max distinct value).
     - If ≥ 5 distinct: linear-interpolation quantile (Type 7) at `p = 0.2, 0.4, 0.6, 0.8` over the sorted-with-duplicates value list.
   - `assign(v)`: returns `0` if `v <= 0`; else `1` if `v <= q[0]`, `2` if `v <= q[1]`, `3` if `v <= q[2]`, `4` if `v <= q[3]`, else `5`.

5. **Create `src/core/intensity.test.ts`** with required cases:
   - Empty input → `assign(0)` and `assign(5)` both return 0.
   - Smooth ramp `[1..10]` → p20=2.8, p40=4.6, p60=6.4, p80=8.2; assert `assign(1)=1`, `assign(3)=2`, `assign(5)=3`, `assign(7)=4`, `assign(10)=5`.
   - Fallback for `[2, 5]` (only 2 distinct): `assign(2)=1`, `assign(5)=2`.
   - Reachability: across `[1..50]`, at least 5 distinct levels are produced by the assign function over a sample.

6. **Create `src/core/palette.ts`** with [UX-W-02](./PRD.md#ux-w-02) structure (final hex values come in Phase 16):
   - Internal constant `PLACEHOLDER_PALETTE: readonly string[]` with 11 grayscale hex values (e.g. shades of `#111827` through `#d4d4d8`). Add a one-line comment noting these are placeholders.
   - Export `interface WinnerPalette { colorOf(apex): string; legend: ReadonlyArray<{ color: string; apex: string | null }>; }`.
   - Export `buildWinnerPalette(topSites: readonly SiteRank[]): WinnerPalette`:
     - Slice top 10 by `topSites.slice(0, 10)`.
     - `colorOf(apex)` returns `palette[i]` for rank `i`, else `palette[10]` (the "Other" entry).
     - `legend` is exactly 11 entries — top 10 with their apex, then `{ color: palette[10], apex: null }` for "Other".

7. **Create `src/core/palette.test.ts`** with required cases:
   - Deterministic by rank: `buildWinnerPalette(top).colorOf('site0.com')` is identical across calls and differs from `colorOf('site1.com')`.
   - Outside-top-10 maps to "Other": `colorOf('site10.com')` === `colorOf('site11.com')` === `colorOf('unknown.com')`.
   - `legend.length === 11` and `legend[10].apex === null`.

8. **Run quality gates and coverage.**

   ```bash
   pnpm lint && pnpm typecheck && pnpm test:coverage
   ```

   - All five per-file coverage gates from Phase 4 must pass (`filters`, `aggregate`, `intensity`, `dates`, `domain`).

9. **Commit.**
   - `git add src/core/ tests/fixtures/`
   - `git commit -m "feat(core): aggregation, intensity bucketing, winner palette + fixtures"`

### Files created

- `src/core/aggregate.ts`, `src/core/aggregate.test.ts`
- `src/core/intensity.ts`, `src/core/intensity.test.ts`
- `src/core/palette.ts`, `src/core/palette.test.ts`
- `tests/fixtures/synthetic-history.ts`

### Success criteria

- [ ] `aggregate()` matches all of [B-005..B-008](./PRD.md#72-aggregation) under test.
- [ ] `aggregate([])` returns a well-formed aggregate without throwing.
- [ ] `buildIntensityScale` covers the 5-level case and the < 5-distinct fallback.
- [ ] `buildWinnerPalette` is deterministic and rank-stable.
- [ ] Per-file coverage gates pass for all five core files listed in [T-004](./PRD.md#t-004).

### Review checklist

- [ ] `aggregate.ts` does not import from `src/background/` or reference `chrome.*` (FR-S-01).
- [ ] All maps use plain `Record<>` shapes as the PRD specifies, with sparse storage (zero-value days omitted).
- [ ] The intensity scale assigns 0 only to non-positive values (the empty bucket).
- [ ] Palette `legend[10].apex === null` for the "Other" slot (consumers rely on this).
- [ ] No external sort dependency — uses built-in `Array.prototype.sort` with explicit comparator.
- [ ] Synthetic fixture is deterministic — no `Date.now()`, no `Math.random()`.

### Common pitfalls

- **Quantile boundary off-by-one** — the `(p80, ∞)` bucket means strictly greater than p80. The order `if (v <= qs[3]) return 4; return 5;` enforces that.
- **Fallback for < 5 distinct values** — repeat the maximum distinct value in remaining slots so the comparator chain stays monotonic.
- **Synthetic fixture's filtered URLs** — they must appear in `SYNTHETIC_RAW` (so the filter logic is exercised) but disappear in `syntheticVisits()` output.
- **`dailyWinner` build** — when iterating, do NOT use `Object.entries(visitsPerSitePerDay)` and search by day; pivot to `Map<DayKey, Map<apex, count>>` first, then resolve winners. Trying to mutate during the outer iteration breaks B-005 tie-break.

### References

- Quantile method (linear interpolation, Type 7): https://en.wikipedia.org/wiki/Quantile#Estimating_quantiles_from_a_sample
- Public Suffix List: https://publicsuffix.org/

---

## Phase 9 — Storage Facade

**PRD phase:** §19.1 phase 3 (Service worker + storage), step 1/4. PRD [ST-001..ST-005](./PRD.md#9-storage-schema), [SW-003a](./PRD.md#sw-003a).
**Estimated effort:** 75 minutes.

### Objective

A thin, fully-typed wrapper around `chrome.storage.local` that owns the two PRD keys (`aggregate.v1`, `ui.v1`), handles schema migration ([ST-003](./PRD.md#st-003)), and exposes a change subscription. All tested with `fakeBrowser`.

### Prerequisites

- Phase 8 complete.

### Steps

1. **Create `src/background/cache.ts`** with these exports:
   - `const AGGREGATE_KEY = 'aggregate.v1' as const;`
   - `const UI_PREFS_KEY = 'ui.v1' as const;`
   - `interface UIPrefs { version: 1; lastView: 'per-site' | 'overall' | 'winners'; lastSelectedSite: string | null; lastDateRange: '7d' | '30d' | '90d' | 'all'; }` — matches PRD [ST-002](./PRD.md#st-002).
   - `const DEFAULT_UI_PREFS: UIPrefs = { version: 1, lastView: 'per-site', lastSelectedSite: null, lastDateRange: 'all' };`
   - `async function readAggregate(): Promise<Aggregate | null>` — reads the key. If the value's `version` does not match `AGGREGATE_VERSION`, calls `clearStaleAggregate()` and returns `null` (ST-003).
   - `async function writeAggregate(agg: Aggregate): Promise<void>` — single `set` call (ST-004). Validates `agg.version === AGGREGATE_VERSION` before writing; throws otherwise.
   - `async function clearStaleAggregate(): Promise<void>` — removes the aggregate key. Also runs a sweep that removes any stored key matching `/^aggregate\.v\d+$/` whose version is not `AGGREGATE_VERSION` (ST-003).
   - `async function readUIPrefs(): Promise<UIPrefs>` — returns stored prefs or `DEFAULT_UI_PREFS`. If `version !== 1`, resets to defaults.
   - `async function writeUIPrefs(prefs: UIPrefs): Promise<void>`.
   - `function subscribeAggregate(listener: (agg: Aggregate | null) => void): () => void` — wraps `chrome.storage.onChanged`, filters for the `AGGREGATE_KEY` and `'local'` area, dispatches the `newValue` (or null on removal). Returns an unsubscribe function.
   - `function getStorageBytesInUse(): Promise<number>` — wraps `chrome.storage.local.getBytesInUse()` for diagnostics (returns 0 if API unavailable in test env).

2. **No barrel file.** Consumers import named exports directly from `'@/background/cache'`.

3. **Allow `chrome.*` usage in this file.** The boundary rule (FR-S-01) restricts `src/core/`, not `src/background/`. `src/background/cache.ts` is the chrome.storage facade.

4. **Create `src/background/cache.test.ts`** with required cases (all use `fakeBrowser`):
   - `readAggregate()` returns null when storage is empty.
   - `writeAggregate()` → `readAggregate()` roundtrip preserves the aggregate.
   - `writeAggregate(invalid)` throws when `version !== 1`.
   - `readAggregate()` returns null and clears the key when `version === 2` is stored under `aggregate.v1`.
   - `clearStaleAggregate()` also removes a legacy `aggregate.v0` key (the sweep).
   - `readUIPrefs()` returns `DEFAULT_UI_PREFS` on empty storage.
   - `subscribeAggregate(listener)` fires when `writeAggregate` runs; the unsubscribe function stops further dispatch.

5. **Run quality gates.**

   ```bash
   pnpm lint && pnpm typecheck && pnpm test
   ```

6. **Commit.**
   - `git add src/background/`
   - `git commit -m "feat(background): chrome.storage facade with schema migration (ST-001..ST-005)"`

### Files created

- `src/background/cache.ts`, `src/background/cache.test.ts`

### Success criteria

- [ ] Single `set` per `writeAggregate` (ST-004).
- [ ] Schema migration drops stale aggregates ([ST-003](./PRD.md#st-003)) without throwing.
- [ ] `subscribeAggregate` returns a working unsubscribe handle.
- [ ] All 7+ test cases pass.

### Review checklist

- [ ] No `JSON.stringify` calls — chrome.storage handles serialization.
- [ ] Listener filter checks both the key AND `areaName === 'local'`.
- [ ] `writeAggregate` throws synchronously-rejected promise rather than silently dropping bad data.
- [ ] No coupling to dashboard code; storage facade is layer-pure (background only).

### References

- chrome.storage: https://developer.chrome.com/docs/extensions/reference/api/storage
- @webext-core/fake-browser: https://webext-core.aklinker1.io/fake-browser/

---

## Phase 10 — Service Worker Foundation

**PRD phase:** §19.1 phase 3 (Service worker + storage), step 2/4. PRD [SW-001](./PRD.md#sw-001), [SW-005](./PRD.md#sw-005), [SW-006](./PRD.md#sw-006), [FR-M-03](./PRD.md#5-manifest--permissions), [E-001](./PRD.md#e-001), [E-004](./PRD.md#e-004).
**Estimated effort:** 90 minutes.

### Objective

Wire the service worker shell: top-level listener registration for every chrome event the extension uses, the action-click handler, the runtime message router (for `force-refresh` and `BackfillProgress`), and a chrome.\* error-wrapper utility. Backfill logic itself ships in Phase 11.

### Prerequisites

- Phase 9 complete.

### Steps

1. **Replace `src/background/index.ts`** with the full top-level wiring. The file's responsibilities (per [SW-001](./PRD.md#sw-001) — listeners synchronous at top level):
   - Register `chrome.action.onClicked` → opens dashboard tab.
   - Register `chrome.runtime.onInstalled` → on `reason === 'install'`, schedule backfill via a placeholder `requestBackfill()` from `@/background/ingest` (implemented in Phase 11; export a no-op stub now).
   - Register `chrome.runtime.onStartup` → no-op per [SW-006](./PRD.md#sw-006), but the listener MUST be present so the worker boots cleanly.
   - Register `chrome.history.onVisited` → calls `scheduleRecompute()` from `@/background/debounce` (placeholder stub now; Phase 12 fills it).
   - Register `chrome.alarms.onAlarm` → dispatches to `handleRecomputeAlarm()` when `alarm.name === 'recompute'`.
   - Register `chrome.runtime.onMessage` → returns boolean if handled. Two message types: `{ type: 'force-refresh' }` triggers `requestBackfill({ force: true })`; `{ type: 'get-backfill-progress' }` returns the last broadcast progress (held in a module-scope variable).

2. **Create `src/background/ingest.ts`** as a stub that exports:
   - `async function requestBackfill(opts?: { force?: boolean }): Promise<void>` — for Phase 10 it logs `[historia] requestBackfill (stub)` and returns. Phase 11 replaces the implementation.
   - `interface BackfillContext { … }` placeholder type — leave the shape empty for now; Phase 11 defines it.
   - Export nothing else.

3. **Create `src/background/debounce.ts`** as a stub:
   - `function scheduleRecompute(): void` — for Phase 10 it calls `chrome.alarms.create('recompute', { delayInMinutes: 0.5 })` with no other logic. Phase 12 fleshes out the surrounding flow.
   - `async function handleRecomputeAlarm(): Promise<void>` — Phase 10 stub logs and returns. Phase 12 replaces.

4. **Create `src/background/chrome-promise.ts`** — central wrapper to enforce [E-004](./PRD.md#e-004).
   - Export `async function callChrome<T>(label: string, fn: () => Promise<T>): Promise<T>` — wraps `fn()` in try/catch; on error, calls `log()` with the label and rethrows.
   - Used by `requestBackfill` and all other chrome.\* call sites in Phases 11–12.

5. **Create the manifest snapshot test** at `src/background/index.test.ts`. Verify the file registers a listener on each required chrome event when imported. Pattern:

   ```ts
   import { describe, it, expect } from 'vitest';
   import { fakeBrowser } from 'wxt/testing';

   describe('background entry', () => {
     it('registers all required top-level listeners', async () => {
       await import('./index');
       expect(fakeBrowser.action.onClicked.hasListeners()).toBe(true);
       expect(fakeBrowser.runtime.onInstalled.hasListeners()).toBe(true);
       expect(fakeBrowser.runtime.onStartup.hasListeners()).toBe(true);
       expect(fakeBrowser.history.onVisited.hasListeners()).toBe(true);
       expect(fakeBrowser.alarms.onAlarm.hasListeners()).toBe(true);
       expect(fakeBrowser.runtime.onMessage.hasListeners()).toBe(true);
     });
   });
   ```

6. **Update `src/entrypoints/background.ts`** to call the new orchestrator:

   ```ts
   import { registerBackgroundListeners } from '@/background';

   export default defineBackground({
     type: 'module',
     main() {
       registerBackgroundListeners();
     },
   });
   ```

7. **Action-click manual test.**
   - `pnpm dev` → click toolbar icon → new tab opens to dashboard.
   - `pnpm dev` → from the Chrome extension's "Inspect views" panel, run `chrome.runtime.sendMessage({ type: 'force-refresh' })` in the worker console. Verify `[historia] requestBackfill (stub)` logs once.

8. **Run quality gates.**

   ```bash
   pnpm lint && pnpm typecheck && pnpm test
   ```

9. **Commit.**
   - `git add src/background/ src/entrypoints/`
   - `git commit -m "feat(background): top-level service worker wiring (SW-001) with stubs for backfill/debounce"`

### Files created

- `src/background/ingest.ts` (stub)
- `src/background/debounce.ts` (stub)
- `src/background/chrome-promise.ts`
- `src/background/index.test.ts`

### Files modified

- `src/background/index.ts` (full wiring)
- `src/entrypoints/background.ts` (calls orchestrator)

### Success criteria

- [ ] Every listener required by [SW-001](./PRD.md#sw-001) is registered synchronously on top-level evaluation.
- [ ] `chrome.action.onClicked` opens the dashboard tab ([FR-M-03](./PRD.md#5-manifest--permissions)).
- [ ] `chrome.runtime.onMessage` handles `force-refresh` and `get-backfill-progress`.
- [ ] `index.test.ts` asserts all six listener registrations.

### Review checklist

- [ ] No async work inside `defineBackground.main` before listeners register. Listeners come first.
- [ ] All `chrome.*` calls go through `callChrome` for error logging.
- [ ] No top-level `await` in the background module.
- [ ] `requestBackfill` is async and Phase 10 leaves the body as a stub log; do not partially implement here.

### Common pitfalls

- **Listeners registered inside an async block** → fails MV3 wake-from-idle.
- **`chrome.runtime.onMessage` listener** must return `true` if it answers asynchronously, or return the response synchronously. Use a clear branch.

### References

- MV3 service worker lifecycle (event registration): https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/events
- chrome.action: https://developer.chrome.com/docs/extensions/reference/api/action
- chrome.runtime.onMessage: https://developer.chrome.com/docs/extensions/reference/api/runtime#event-onMessage

---

## Phase 11 — Backfill Orchestrator

**PRD phase:** §19.1 phase 3 (Service worker + storage), step 3/4. PRD [SW-002](./PRD.md#sw-002), [SW-003](./PRD.md#sw-003), [SW-003a](./PRD.md#sw-003a), [P-001](./PRD.md#p-001), [P-002](./PRD.md#p-002), [P-003](./PRD.md#p-003), [UX-S-06](./PRD.md#ux-s-06).
**Estimated effort:** 4–5 hours.

### Objective

Replace the `requestBackfill` stub with the real streaming pipeline: enumerate URLs from `chrome.history.search`, filter, fetch per-URL visits with a 32-concurrency limiter, accumulate into an in-memory buffer, re-aggregate, throttle writes per [P-003](./PRD.md#p-003), and broadcast [BackfillProgress](./PRD.md#d-006) messages.

### Prerequisites

- Phase 10 complete.

### Steps

1. **Create `src/background/concurrency.ts`** — a hand-rolled limiter ([P-001](./PRD.md#p-001), no external dep).
   - Export `function pLimit<T>(max: number): (task: () => Promise<T>) => Promise<T>`. Internal state: in-flight count + FIFO queue. When in-flight < max, run immediately; else queue. On task settle, drain queue.
   - Pure, deterministic; no `chrome.*`.
   - Add unit test `concurrency.test.ts`:
     - Submit 100 tasks each resolving after a fake delay; assert peak in-flight count ≤ 32.
     - Verify the limiter releases on rejection (queue does not deadlock when a task throws).

2. **Replace `src/background/ingest.ts`** with the full backfill orchestrator. The file structure:
   - Module-scope state: `let currentRun: AbortController | null = null;` and `let lastProgress: BackfillProgress = { phase: 'idle', processed: 0, total: 0, startedAt: 0 };`.
   - Export `function getLastProgress(): BackfillProgress` — returned by the worker's `get-backfill-progress` message handler from Phase 10.
   - Export `async function requestBackfill(opts?: { force?: boolean }): Promise<void>`:
     - If `currentRun` is non-null and `opts?.force !== true`, return (a backfill is already running; new requests are ignored, but force overrides).
     - If `opts?.force === true` and `currentRun` exists, call `currentRun.abort()` and wait for the previous run to settle.
     - Set `currentRun = new AbortController()`. Wrap the main pipeline in try/finally that nulls `currentRun` on exit.
     - Pipeline phases — each updates `lastProgress` and calls `broadcastProgress()` (throttled per [SW-003.3](./PRD.md#sw-003)):
       1. `enumerating` — `chrome.history.search({ text: '', maxResults: 0, startTime: 0 })`. If the result length is 0 AND we expect history, fall back to pagination by 1000s using descending `endTime`. Filter via `shouldDropURL`. Collect surviving URLs into a `string[]`.
       2. `fetching-visits` — using `pLimit(32)`, for each URL call `chrome.history.getVisits({ url })`. Each visit becomes a `Visit` via `apexOf(url)`; drop visits where `apexOf` returns null.
       3. As batches resolve, push into `buffer: Visit[]`. After each completed URL increment a counter. When either: counter increments by ≥ 200 or `now - lastWrite >= 1000ms`, call `await persistPartial()`. Caps the write count at ≤ 100 — track a `writes` counter; when it hits 100, skip persistence until the final write.
       4. `aggregating` — final `aggregate(buffer)` call.
       5. Final `writeAggregate(agg)` (always, regardless of throttle state per [P-003](./PRD.md#p-003)).
       6. `done` phase broadcast.
     - On any thrown error: broadcast `phase: 'error'` and rethrow (caught by `callChrome` and logged).
   - `persistPartial()`: builds `aggregate(buffer)` and calls `writeAggregate`. Increments `writes`.
   - `broadcastProgress()`: only broadcasts when `(processed advanced ≥ 5% of total) OR (>=500ms since last broadcast)`. Uses `chrome.runtime.sendMessage({ type: 'backfill-progress', payload: lastProgress })`; swallows the "no receiver" error that fires when the dashboard isn't open.

3. **Important wiring detail.** Receivers of `backfill-progress` messages are dashboard tabs; if none are open, `sendMessage` rejects. Catch and ignore that specific case; do not log.

4. **Create `src/background/ingest.test.ts`** with `fakeBrowser`-driven cases:
   - **Smoke.** Seed `fakeBrowser.history` with `SYNTHETIC_RAW` URLs (via `fakeBrowser.history._setHistoryItems(...)` and `_setVisitsForUrl(...)`; consult `@webext-core/fake-browser` test helpers — if a helper is missing, mock `chrome.history.search` / `getVisits` directly using `vi.spyOn(fakeBrowser.history, 'search').mockResolvedValue(...)`). Run `await requestBackfill()`. Read `aggregate.v1` and assert it matches the deterministic aggregate the synthetic fixture produces (apex rollup, no filtered URLs).
   - **Concurrency.** Wrap `getVisits` to record peak concurrency; assert it never exceeded 32.
   - **Throttled writes.** Spy on `fakeBrowser.storage.local.set`. With 1000 URLs in the fixture, assert set was called ≥ 5 times and ≤ 100 times. The final call carries the complete aggregate.
   - **Force-refresh while running.** Start a backfill, then call `requestBackfill({ force: true })`. Assert the first run aborts cleanly and the second run produces the correct aggregate.
   - **Progress broadcast cadence.** Spy on `fakeBrowser.runtime.sendMessage`. Assert messages were sent with the progress payload and the count is bounded (≤ 1 per 5% step).

5. **Manual smoke in Chrome.**
   - Fresh install: uninstall the dev extension, then `pnpm dev` again. Click the icon. The dashboard opens. From the worker console, you should observe a backfill running and `aggregate.v1` populating in `chrome.storage.local` (use the DevTools storage inspector).
   - With a real history of a few thousand URLs, the backfill completes within ~20s per [P-002](./PRD.md#p-002).

6. **Quality gates.**

   ```bash
   pnpm lint && pnpm typecheck && pnpm test
   pnpm build
   ```

7. **Commit.**
   - `git add src/background/`
   - `git commit -m "feat(background): streaming backfill pipeline with concurrency limiter (SW-003, P-001..P-003)"`

### Files created

- `src/background/concurrency.ts`, `src/background/concurrency.test.ts`
- `src/background/ingest.test.ts`

### Files modified

- `src/background/ingest.ts` (full implementation)

### Success criteria

- [ ] Backfill produces the correct aggregate for the synthetic fixture.
- [ ] Concurrency limiter caps in-flight at 32.
- [ ] Storage writes obey [P-003](./PRD.md#p-003): ≤ 100 total, throttled by 200 URLs OR 1000ms, final write always happens.
- [ ] `BackfillProgress` broadcasts: throttled to ≥ 5% steps OR ≥ 500ms gaps.
- [ ] `force-refresh` cleanly aborts and restarts a running backfill.

### Review checklist

- [ ] All `chrome.*` calls wrapped via `callChrome`.
- [ ] `AbortController.signal` is honored in long loops (check at the top of each iteration).
- [ ] No retained references to old `currentRun` after completion (memory leak).
- [ ] Empty-history case returns an empty aggregate cleanly without throwing.
- [ ] No silent swallowing of errors — only the "no receiver" sendMessage error is suppressed, with an explicit comment.

### Common pitfalls

- **`chrome.history.search({ maxResults: 0 })`** treatment varies. The PRD says paginate if 0 doesn't mean "no limit." Implement the fallback path or the orchestrator will appear to do nothing on some Chrome builds.
- **`getVisits` returns `VisitItem` with `visitTime` (not `visitedAt`).** Map field correctly: `{ url, apexDomain: apexOf(url)!, title: historyItem.title ?? '', visitedAt: visit.visitTime ?? 0 }`.
- **Title from `chrome.history.search`** is on the `HistoryItem`, not the `VisitItem`. Carry titles through the URL list.
- **Sparse storage invariant** — `aggregate()` already omits zero-value days; do not re-introduce them.

### References

- chrome.history.search: https://developer.chrome.com/docs/extensions/reference/api/history#method-search
- chrome.history.getVisits: https://developer.chrome.com/docs/extensions/reference/api/history#method-getVisits
- chrome.history.onVisited: https://developer.chrome.com/docs/extensions/reference/api/history#event-onVisited

---

## Phase 12 — Incremental Updates & Manual Refresh

**PRD phase:** §19.1 phase 3 (Service worker + storage), step 4/4. PRD [SW-004](./PRD.md#sw-004), [SW-005](./PRD.md#sw-005), [SW-006](./PRD.md#sw-006), [E-002](./PRD.md#e-002).
**Estimated effort:** 90 minutes.

### Objective

Real implementation of the debounced incremental update path. Every `chrome.history.onVisited` schedules a `chrome.alarms` recompute (30s, debounced by re-creating the alarm). The alarm handler runs an incremental aggregate that fetches only URLs with `lastVisitTime > lastAggregatedAt`, merges into the existing cached aggregate, and writes once.

### Prerequisites

- Phase 11 complete.

### Steps

1. **Replace `src/background/debounce.ts`** with the full implementation:
   - `function scheduleRecompute(): void` — `chrome.alarms.create('recompute', { delayInMinutes: 0.5 })`. Creating the alarm with the same name resets it (natural debounce per [SW-004](./PRD.md#sw-004)).
   - `async function handleRecomputeAlarm(): Promise<void>` — orchestrates the incremental aggregate:
     1. Read existing aggregate via `readAggregate()`. If null → call `requestBackfill()` and return.
     2. `since = existing.lastAggregatedAt`.
     3. Call `chrome.history.search({ text: '', startTime: since, endTime: Date.now(), maxResults: 0 })`. Apply `shouldDropURL`.
     4. For survivors, call `chrome.history.getVisits({ url })` via the 32-concurrency limiter. Filter visits where `visit.visitTime > since` and `apexOf(url)` non-null.
     5. Merge into the in-memory aggregate by **re-running `aggregate()` over the concatenation** of (`reconstructed full visits` ⋃ `new visits`). Because the existing aggregate doesn't keep raw visits, the merge approach is: re-run the full backfill if the new visit count exceeds a threshold (default `INCREMENTAL_FALLBACK = 250`), otherwise apply a direct mutation pass that increments `totalVisitsPerDay`, `visitsPerSitePerDay`, and re-derives `topSites`, `dailyWinner`, `dateRange.latest`, `lastAggregatedAt`, `computedAt` from the merged maps.
     6. Single `writeAggregate(updated)` (per [P-003](./PRD.md#p-003): exactly one write per incremental cycle).
   - The mutation pass MUST handle the apex-rollup correctly — a new visit to `mail.google.com` increments the `google.com` slot, not a new `mail.google.com` row.
   - `lastAggregatedAt = max(existing.lastAggregatedAt, max(newVisits.visitedAt))`.
   - Top-site re-derivation: rebuild from the merged `visitsPerSitePerDay` map; sort per [B-007](./PRD.md#b-007).
   - Daily-winner re-derivation: recompute for each affected day from the merged `visitsPerSitePerDay`.

2. **Create `src/background/incremental.ts`** to hold the pure merge function — keep `debounce.ts` thin (chrome wiring) and put the merge logic in a pure helper that's unit-testable:
   - `function mergeIncremental(existing: Aggregate, newVisits: Visit[], now: number): Aggregate` — pure, no chrome, no Date.now (now passed in).

3. **Tests for `incremental.test.ts`:**
   - Merging 5 new visits to `google.com` for today increments today's per-site count by 5 and `totalVisitsPerDay[today]` by 5.
   - Adding a visit to a brand-new apex inserts a new row in `topSites` at the correct sorted position.
   - `lastAggregatedAt` advances to the max of input + existing.
   - `dailyWinner` updates when the new visits flip the winner of a day.
   - `mergeIncremental(empty aggregate, new visits, now)` produces the same result as `aggregate(new visits, now)`.

4. **Tests for `debounce.test.ts`:**
   - `scheduleRecompute()` creates the `recompute` alarm with `delayInMinutes: 0.5`.
   - Calling `scheduleRecompute()` twice in quick succession results in only one alarm (debounce).
   - `handleRecomputeAlarm()` with no existing aggregate falls back to `requestBackfill()`.
   - `handleRecomputeAlarm()` with an existing aggregate and 3 new history items writes exactly 1 storage update.
   - Threshold fallback: with > `INCREMENTAL_FALLBACK` new visits, the function calls `requestBackfill()` instead of incremental merge.

5. **Wire `force-refresh` end-to-end.** The message handler in `src/background/index.ts` already calls `requestBackfill({ force: true })` from Phase 10. Confirm the dashboard's "Refresh" button (placeholder in Phase 13) will produce a working force-refresh cycle when wired up.

6. **Manual smoke.**
   - `pnpm dev`. Open the dashboard. Visit a new site (e.g., `https://example.org`). Wait ~30s. The dashboard's storage subscription (Phase 13) should refresh. (For Phase 12 we can verify storage-only: inspect `chrome.storage.local` in DevTools.)

7. **Quality gates.**

   ```bash
   pnpm lint && pnpm typecheck && pnpm test
   pnpm build
   ```

8. **Commit.**
   - `git add src/background/`
   - `git commit -m "feat(background): incremental updates via chrome.alarms debounce (SW-004, SW-005)"`

### Files created

- `src/background/incremental.ts`, `src/background/incremental.test.ts`
- `src/background/debounce.test.ts`

### Files modified

- `src/background/debounce.ts` (full implementation)

### Success criteria

- [ ] `scheduleRecompute()` debounces correctly (alarm re-creation resets timer).
- [ ] Incremental merge is pure and unit-tested.
- [ ] Exactly one storage write per incremental cycle.
- [ ] Force-refresh re-runs full backfill.
- [ ] Fallback path triggered when new-visit count exceeds threshold.

### Review checklist

- [ ] No use of `setTimeout` anywhere in the worker — `chrome.alarms` only (worker idle shutdown kills setTimeout).
- [ ] `mergeIncremental` is pure: no chrome.\*, no Date.now() (parameter), no I/O.
- [ ] Daily-winner tie-break in the incremental path uses the same B-005 logic as `aggregate()` — extract to a shared helper if duplication appears.
- [ ] Top-sites re-sort uses the same B-007 comparator as `aggregate()`.

### References

- chrome.alarms: https://developer.chrome.com/docs/extensions/reference/api/alarms
- MV3 alarm minimum delay (30s): https://developer.chrome.com/docs/extensions/reference/api/alarms#period_in_minutes

---

## Phase 13 — Dashboard Shell & Data Hooks

**PRD phase:** §19.1 phase 4 (Dashboard skeleton), step 1/3. PRD [SW-003a](./PRD.md#sw-003a), [UX-S-01](./PRD.md#ux-s-01), [UX-S-04](./PRD.md#ux-s-04), [UX-S-05](./PRD.md#ux-s-05), [UX-S-06](./PRD.md#ux-s-06), [E-002](./PRD.md#e-002), [E-003](./PRD.md#e-003), [REL-002](./PRD.md#3-tech-stack-locked), [REL-003](./PRD.md#3-tech-stack-locked).
**Estimated effort:** 3–4 hours.

### Objective

Replace the smoke-test App with the real dashboard shell: header, layout regions, error boundary, empty/loading/error states, and two data hooks (`useAggregate`, `useBackfillProgress`). The shell reads aggregate from `chrome.storage.local` and subscribes to `chrome.storage.onChanged` per [SW-003a](./PRD.md#sw-003a). Views themselves are placeholders here; Phase 14 ships the heatmap; Phase 15 wires the three views.

### Prerequisites

- Phase 12 complete (full background pipeline working).

### Steps

1. **Create `src/dashboard/hooks/useAggregate.ts`** — the storage-driven aggregate hook.
   - Signature: `function useAggregate(): { aggregate: Aggregate | null; isInitialLoad: boolean; }`.
   - On mount: call `readAggregate()` (re-export it from `@/dashboard/lib/storage-bridge.ts` — a thin wrapper that calls the background facade, since dashboard code lives in a separate bundle from the worker but can call `chrome.storage.local` directly).
   - Subscribe to `subscribeAggregate(setAggregate)` on mount; unsubscribe on unmount.
   - `isInitialLoad` is `true` until the first `readAggregate()` call resolves (regardless of value).

2. **Create `src/dashboard/lib/storage-bridge.ts`** — dashboard-side accessor.
   - The PRD's storage facade lives in `src/background/cache.ts`. The dashboard is a separate bundle but executes in the same extension context, so it can call `chrome.storage.local` directly. To avoid the layer-crossing import from `@/dashboard/*` → `@/background/*` (smell), create a thin dashboard bridge that re-implements the read+subscribe surface using the same key constants exported from `@/background/cache`.
   - Exports: `readAggregate()`, `subscribeAggregate()`, `sendForceRefresh()` (sends `{ type: 'force-refresh' }` runtime message), `readUIPrefs()`, `writeUIPrefs()`.
   - Imports `AGGREGATE_KEY`, `UI_PREFS_KEY`, `DEFAULT_UI_PREFS`, `AGGREGATE_VERSION` from `@/background/cache` — these are pure constants, importing them does not pull chrome wiring into the dashboard bundle.
   - The bridge has no business logic. If migration is needed it relies on the worker having already cleared the stale key.

3. **Create `src/dashboard/hooks/useBackfillProgress.ts`** — receives `backfill-progress` runtime messages from Phase 11.
   - Signature: `function useBackfillProgress(): BackfillProgress`.
   - On mount: send `{ type: 'get-backfill-progress' }` and seed state with the response.
   - Subscribe to `chrome.runtime.onMessage` for `{ type: 'backfill-progress', payload }`; update state. Unsubscribe on unmount.
   - Defaults to `{ phase: 'idle', processed: 0, total: 0, startedAt: 0 }` if no response is received within 500ms (worker may be asleep).

4. **Create `src/dashboard/hooks/useUIPrefs.ts`** — persisted UI selection hook.
   - Signature: `function useUIPrefs(): { prefs: UIPrefs; updatePrefs: (patch: Partial<UIPrefs>) => void; }`.
   - On mount: `readUIPrefs()` from the bridge; set state.
   - `updatePrefs(patch)`: merge into current state, call `writeUIPrefs(merged)`, set state.
   - Writes are fire-and-forget; if a write rejects, log via `log()` and keep the in-memory state (best-effort UX).

5. **Create `src/dashboard/components/ErrorBanner.tsx`** — single banner used by [E-002](./PRD.md#e-002) and [E-003](./PRD.md#e-003).
   - Props: `{ onRetry?: () => void }`.
   - Renders a destructive-toned card with the text "Couldn't read your history. Try refreshing." and a shadcn `Button` labeled "Try again" that calls `onRetry` when present.
   - Uses `role="alert"` and `aria-live="assertive"` for screen readers.

6. **Create `src/dashboard/components/ErrorBoundary.tsx`** — React error boundary per [E-003](./PRD.md#e-003).
   - Class component with `componentDidCatch` that calls `log('dashboard render error', error, info)` and sets `hasError: true`.
   - On error: renders `<ErrorBanner onRetry={() => location.reload()} />`.
   - On success: renders `props.children`.

7. **Create `src/dashboard/components/BackfillProgressBar.tsx`** — the progress strip per [UX-S-06](./PRD.md#ux-s-06).
   - Props: `{ progress: BackfillProgress }`.
   - Renders nothing when `phase === 'idle'` or `phase === 'done'` (animate out via Tailwind transition: in Phase 13 a simple `motion-safe:transition-opacity` is sufficient; Phase 16 may refine).
   - When active: thin horizontal bar showing `processed / total` percentage, with text "Reading your history… {processed} of {total}" below.
   - `role="status"`, `aria-live="polite"`, `aria-busy="true"` per [A.6](#a6-accessibility-baseline).
   - When `total === 0`: render as an indeterminate striped bar (use Tailwind `motion-safe:animate-pulse`).

8. **Create `src/dashboard/components/Header.tsx`** — layout per [UX-S-01](./PRD.md#ux-s-01).
   - Props: `{ aggregate: Aggregate | null; onRefresh: () => void; isRefreshing: boolean; }`.
   - Renders product name "historia" (h1), last-updated relative timestamp (e.g. "updated 2 minutes ago" via `formatDistanceToNow(new Date(aggregate.computedAt))` from date-fns), and a shadcn `Button variant="ghost"` labeled "Refresh" with a `RefreshCw` lucide icon.
   - Disable the refresh button while `isRefreshing` is true; show the icon spinning via `motion-safe:animate-spin`.
   - When `aggregate` is null, hide the timestamp (no "updated never").

9. **Create `src/dashboard/components/Toolbar.tsx`** — view-switcher + date range selector per [UX-S-02](./PRD.md#ux-s-02), [UX-S-03](./PRD.md#ux-s-03).
   - Props: `{ view: UIPrefs['lastView']; range: UIPrefs['lastDateRange']; onViewChange; onRangeChange; }`.
   - Uses shadcn `Tabs` for the 3 views (`"per-site"` → "Sites", `"overall"` → "Daily", `"winners"` → "Winners").
   - Uses shadcn `Select` for the date range (`"7d"` → "Last 7 days", `"30d"` → "Last 30 days", `"90d"` → "Last 90 days", `"all"` → "All time").
   - Right-aligns the select via flex layout.

10. **Replace `src/dashboard/App.tsx`** with the real shell:

    ```tsx
    import { useCallback } from 'react';

    import { BackfillProgressBar } from '@/dashboard/components/BackfillProgressBar';
    import { ErrorBanner } from '@/dashboard/components/ErrorBanner';
    import { ErrorBoundary } from '@/dashboard/components/ErrorBoundary';
    import { Header } from '@/dashboard/components/Header';
    import { Toolbar } from '@/dashboard/components/Toolbar';
    import { useAggregate } from '@/dashboard/hooks/useAggregate';
    import { useBackfillProgress } from '@/dashboard/hooks/useBackfillProgress';
    import { useUIPrefs } from '@/dashboard/hooks/useUIPrefs';
    import { sendForceRefresh } from '@/dashboard/lib/storage-bridge';

    export function App(): JSX.Element {
      return (
        <ErrorBoundary>
          <AppInner />
        </ErrorBoundary>
      );
    }

    function AppInner(): JSX.Element {
      const { aggregate, isInitialLoad } = useAggregate();
      const progress = useBackfillProgress();
      const { prefs, updatePrefs } = useUIPrefs();

      const handleRefresh = useCallback(() => {
        void sendForceRefresh();
      }, []);

      const isBackfillActive =
        progress.phase !== 'idle' && progress.phase !== 'done' && progress.phase !== 'error';

      return (
        <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
          <Header aggregate={aggregate} onRefresh={handleRefresh} isRefreshing={isBackfillActive} />

          <BackfillProgressBar progress={progress} />

          <Toolbar
            view={prefs.lastView}
            range={prefs.lastDateRange}
            onViewChange={(v) => updatePrefs({ lastView: v })}
            onRangeChange={(r) => updatePrefs({ lastDateRange: r })}
          />

          <section aria-live="polite">
            <ShellBody
              aggregate={aggregate}
              isInitialLoad={isInitialLoad}
              progress={progress}
              view={prefs.lastView}
            />
          </section>
        </main>
      );
    }

    function ShellBody(props: {
      aggregate: Aggregate | null;
      isInitialLoad: boolean;
      progress: BackfillProgress;
      view: UIPrefs['lastView'];
    }): JSX.Element {
      const { aggregate, isInitialLoad, progress, view } = props;

      if (progress.phase === 'error') {
        return <ErrorBanner onRetry={() => void sendForceRefresh()} />;
      }
      if (isInitialLoad) {
        return <ShellLoading message="Reading your history…" />;
      }
      if (aggregate === null) {
        // UX-S-04: no aggregate yet — backfill enumerating or not started.
        return <ShellLoading message="Reading your history…" />;
      }
      if (aggregate.topSites.length === 0) {
        // UX-S-05: backfill complete but nothing passed filters.
        return <ShellEmpty />;
      }
      return <ViewPlaceholder view={view} aggregate={aggregate} />;
    }

    function ShellLoading({ message }: { message: string }): JSX.Element {
      return (
        <p className="text-muted-foreground text-sm" role="status">
          {message}
        </p>
      );
    }

    function ShellEmpty(): JSX.Element {
      return (
        <p className="text-muted-foreground text-sm">
          Nothing to show yet — once you've browsed for a few days, this view will fill in.
        </p>
      );
    }

    function ViewPlaceholder(props: {
      view: UIPrefs['lastView'];
      aggregate: Aggregate;
    }): JSX.Element {
      // Phase 14 + 15 replace this with the three real views.
      return (
        <div className="rounded-md border border-dashed p-6 text-sm">
          Active view: <strong>{props.view}</strong> · {props.aggregate.topSites.length} sites
          tracked
        </div>
      );
    }
    ```

11. **Tests** (`src/dashboard/App.test.tsx`):
    - Renders `ShellLoading` when `useAggregate` returns `{ aggregate: null, isInitialLoad: true }`. (Mock the hook by creating a thin re-export wrapper, or mock the storage bridge.)
    - Renders `ShellEmpty` when aggregate's `topSites` is empty.
    - Renders `ViewPlaceholder` with the active view from prefs when aggregate has data.
    - Clicking refresh button invokes `sendForceRefresh()` (assert via `vi.spyOn(storageBridge, 'sendForceRefresh')`).
    - `ErrorBoundary` catches a thrown error from a child and renders `ErrorBanner`.

12. **Hook tests** colocated:
    - `useAggregate.test.tsx`: writing to `fakeBrowser.storage.local` triggers a hook re-render with the new value; unmount stops further updates.
    - `useBackfillProgress.test.tsx`: a fired `backfill-progress` message updates state.
    - `useUIPrefs.test.tsx`: `updatePrefs({ lastView: 'winners' })` persists and re-reads.

13. **Manual smoke.**
    - `pnpm dev`. Click icon. The dashboard shows the header, an empty progress strip (since backfill ran in Phase 11), the toolbar tabs/select, and the `ViewPlaceholder` showing tracked site count.
    - Click "Refresh". The progress strip animates back, and the placeholder text refreshes when the new aggregate lands. Storage subscription path works end-to-end.
    - Press Tab through the page. Focus rings appear on Header refresh button, tab triggers, select trigger.

14. **Quality gates.**

    ```bash
    pnpm lint && pnpm typecheck && pnpm test && pnpm build
    ```

15. **Commit.**
    - `git add src/dashboard/`
    - `git commit -m "feat(dashboard): shell, hooks, error boundary, progress strip wired to storage"`

### Files created

- `src/dashboard/hooks/useAggregate.ts`, `useAggregate.test.tsx`
- `src/dashboard/hooks/useBackfillProgress.ts`, `useBackfillProgress.test.tsx`
- `src/dashboard/hooks/useUIPrefs.ts`, `useUIPrefs.test.tsx`
- `src/dashboard/lib/storage-bridge.ts`
- `src/dashboard/components/ErrorBanner.tsx`
- `src/dashboard/components/ErrorBoundary.tsx`
- `src/dashboard/components/BackfillProgressBar.tsx`
- `src/dashboard/components/Header.tsx`
- `src/dashboard/components/Toolbar.tsx`
- `src/dashboard/App.test.tsx`

### Files modified

- `src/dashboard/App.tsx` (real shell)

### Success criteria

- [ ] Storage subscription delivers aggregate updates without a manual page refresh.
- [ ] All three states (`loading`, `empty`, `populated`) render correctly.
- [ ] Refresh button triggers a `force-refresh` message and the progress strip re-appears.
- [ ] Error boundary catches a render exception and shows the banner.
- [ ] All test cases pass.

### Review checklist

- [ ] Dashboard does not import from `src/background/index`, `ingest`, or `debounce` — only the pure constants from `@/background/cache` (key names, version, defaults).
- [ ] No `useEffect` cleanup is missing (every subscription returns an unsubscribe).
- [ ] No state-management library (REL-002).
- [ ] No router (REL-003) — view switching uses `useUIPrefs`.
- [ ] All interactive elements have visible focus rings.
- [ ] `BackfillProgressBar` is `aria-live="polite"`, ErrorBanner is `aria-live="assertive"`.
- [ ] Refresh button has accessible label even though it has an icon.
- [ ] No design tokens invented beyond neutral grayscale (visual identity = Phase 16).

### Common pitfalls

- **`useAggregate` flicker.** Initial paint may see `aggregate === null` then real data 50ms later. The `isInitialLoad` flag exists so consumers can suppress empty states until the first storage read resolves.
- **Stale subscribe handle in StrictMode.** React 18 mounts effects twice in dev. The unsubscribe function must be idempotent.
- **`chrome.runtime.sendMessage` with no receiver.** If the worker is asleep when `useBackfillProgress` sends `get-backfill-progress`, the call rejects after a delay. Wrap in try/catch and treat as "no progress to report yet."
- **`writeUIPrefs` race.** Quick repeated `updatePrefs` calls can fire overlapping writes; chrome.storage merges by key, so this is safe. Do not introduce a serializer.

### References

- React 18 StrictMode effects: https://react.dev/reference/react/StrictMode#fixing-bugs-found-by-double-rendering-in-development
- shadcn Tabs: https://ui.shadcn.com/docs/components/tabs
- shadcn Select: https://ui.shadcn.com/docs/components/select
- ARIA live regions: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions

---

## Phase 14 — Heatmap Primitive

**PRD phase:** §19.1 phase 4 (Dashboard skeleton), step 2/3. PRD [HM-001..HM-008](./PRD.md#11-heatmap-renderer).
**Estimated effort:** 4–5 hours.

### Objective

A single SVG component, `Heatmap.tsx`, that powers all three views via a discriminated `mode` prop. Implements intensity bucketing colors, categorical winner colors, weekday/month labels, accessible tooltips, and the geometry rules from [HM-005..HM-007](./PRD.md#hm-005). No design polish — neutral palette only; Phase 16 swaps in the final ramp.

### Prerequisites

- Phase 13 complete (dashboard shell renders with real aggregate).

### Steps

1. **Create `src/dashboard/components/heatmap-geometry.ts`** — pure layout math, no React.
   - `interface HeatmapGeometry { cells: HeatmapCell[]; weeks: WeekColumn[]; monthLabels: MonthLabel[]; width: number; height: number; cellSize: number; cellGap: number; gridLeft: number; gridTop: number; }`.
   - `interface HeatmapCell { day: DayKey; weekday: 0|1|2|3|4|5|6; weekIndex: number; x: number; y: number; }` — weekday 0 = Sunday per [HM-005](./PRD.md#hm-005).
   - `function computeGeometry(range: { start: DayKey; end: DayKey }, options?: { cellSize?: number; cellGap?: number }): HeatmapGeometry` — defaults `cellSize=12`, `cellGap=2`.
     - Use `eachDayInRange()` from `src/core/dates` to enumerate days.
     - Pad the leading week so weekday alignment is correct (push the start to the previous Sunday; do not emit padding cells — only emit cells for in-range days, but their column index reflects the padded calendar).
     - `weeks[]` describes each column: `{ weekIndex, startDate, monthOfFirstDay }`.
     - `monthLabels[]`: one entry per week where `weeks[i].monthOfFirstDay !== weeks[i-1].monthOfFirstDay`. Per [HM-005](./PRD.md#hm-005): month labels above the grid for week columns where the month changes within that column.
     - `gridLeft = 28` (room for weekday labels), `gridTop = 18` (room for month labels).
     - `width = gridLeft + weeks.length * (cellSize + cellGap)`; `height = gridTop + 7 * (cellSize + cellGap)`.

2. **Create `src/dashboard/components/heatmap-geometry.test.ts`:**
   - A 1-week range (`'2026-05-17'` Sunday → `'2026-05-23'` Saturday) emits 7 cells in column 0, weekdays 0..6.
   - A range spanning a month boundary (e.g. `'2026-04-25'` → `'2026-05-07'`) emits the correct month label transition.
   - The first weekday alignment is correct for arbitrary start dates (parametric test).

3. **Create `src/dashboard/components/heatmap-color.ts`** — pure color resolution.
   - `interface IntensityRamp { 0: string; 1: string; 2: string; 3: string; 4: string; 5: string; }`
   - `export const PLACEHOLDER_INTENSITY_RAMP: IntensityRamp = { 0: '#f4f4f5', 1: '#d4d4d8', 2: '#a1a1aa', 3: '#71717a', 4: '#52525b', 5: '#27272a' };` — grayscale only; Phase 16 replaces.
   - `function intensityColor(level: IntensityLevel, ramp = PLACEHOLDER_INTENSITY_RAMP): string` — straight lookup.

4. **Create `src/dashboard/components/Heatmap.tsx`** with the API from [HM-001](./PRD.md#hm-001):

   ```ts
   type HeatmapMode =
     | { kind: 'intensity'; data: Record<DayKey, number>; ramp?: IntensityRamp }
     | {
         kind: 'categorical';
         data: Record<DayKey, { apex: string; visits: number }>;
         colorOf: (apex: string) => string;
       };

   interface HeatmapProps {
     mode: HeatmapMode;
     range: { start: DayKey; end: DayKey };
     onCellHover?: (day: DayKey | null) => void;
     renderTooltip?: (day: DayKey) => React.ReactNode;
   }
   ```

   - Body responsibilities:
     - `useMemo`: geometry, intensity scale (when `mode.kind === 'intensity'`), and a fast `Map<DayKey, IntensityLevel>` lookup so per-cell color is O(1).
     - SVG root with `width` and `height` from geometry. `role="img"` and `aria-label` summarizing the chart (e.g. "Activity heatmap for {range.start} to {range.end}").
     - Render weekday labels (Mon, Wed, Fri only — three labels, vertically positioned, [HM-005](./PRD.md#hm-005)).
     - Render month labels above the grid.
     - Render one `<rect>` per cell:
       - Fill = intensity color or `colorOf(apex)`. Empty days (not in `data`) use ramp[0] for intensity mode and a configurable `emptyColor` (default `#f4f4f5`) for categorical.
       - Each `<rect>` has a child `<title>` for native browser tooltip fallback (HM-006).
       - `tabindex={0}`. Native tab focus is sufficient ([HM-006](./PRD.md#hm-006)).
       - `onMouseEnter`/`onMouseLeave`/`onFocus`/`onBlur` call `onCellHover(day | null)`.
     - When `renderTooltip` is provided AND a hovered/focused day exists, render the shadcn `Tooltip` portal positioned at the cell's screen coordinates. Alternative: use a controlled-floating element from Radix. Phase 14 may use absolute positioning relative to the SVG container; Phase 16 may upgrade to a floating-UI layer if needed.
   - Geometry options (`cellSize`, `cellGap`) are NOT exposed as props in v1 — they're constants. [HM-005](./PRD.md#hm-005) notes tuning is open for Phase 14/15.
   - Container responsibilities (outside the component):
     - Parent provides a horizontally-scrollable wrapper per [HM-007](./PRD.md#hm-007). The Heatmap itself does not implement scrolling.

5. **Smoke tests** (`Heatmap.test.tsx`):
   - Renders the expected number of `<rect>` elements for a 30-day range (30 + 1 if leading week pad would have produced an in-range cell; verify by counting).
   - Intensity mode: a 5-distinct-value dataset emits ≥ 5 distinct fill colors.
   - Categorical mode: cells with the same `apex` share the same fill color.
   - Each `<rect>` has a `<title>` child element.
   - All cells have `tabindex="0"`.
   - `aria-label` on the root SVG references the range start and end.
   - Hovering a cell triggers `onCellHover(day)`; leaving triggers `onCellHover(null)`.

6. **Performance check.** With a 365-day intensity render, profile with the React DevTools Profiler ([P-002](./PRD.md#p-002)) — render ≤ 16ms. The memoization of geometry + intensity map should make this trivial. If the budget is exceeded, the bottleneck is likely creating new `<title>` strings; pre-compute them in the memo.

7. **Mount the heatmap in `ViewPlaceholder`** (temporarily, just to verify) — render the intensity heatmap of `aggregate.totalVisitsPerDay` over the active date range. This will be replaced by Phase 15's real views.

8. **Quality gates.**

   ```bash
   pnpm lint && pnpm typecheck && pnpm test && pnpm build
   ```

9. **Manual smoke.**
   - `pnpm dev`. The dashboard's `ViewPlaceholder` now shows a real heatmap with shading. Tab through the cells — focus rings advance one cell at a time. Hover shows the native `<title>` tooltip.

10. **Commit.**
    - `git add src/dashboard/`
    - `git commit -m "feat(dashboard): single Heatmap SVG primitive with intensity + categorical modes (HM-001..HM-008)"`

### Files created

- `src/dashboard/components/heatmap-geometry.ts`, `heatmap-geometry.test.ts`
- `src/dashboard/components/heatmap-color.ts`
- `src/dashboard/components/Heatmap.tsx`, `Heatmap.test.tsx`

### Success criteria

- [ ] Single SVG primitive covers both modes via the `mode` prop union.
- [ ] Quantile bucketing from `src/core/intensity.ts` drives intensity mode.
- [ ] Each cell has a `<title>` child AND is tab-focusable.
- [ ] Month/weekday labels render correctly across month boundaries.
- [ ] `aria-label` describes the chart's date range.
- [ ] Render ≤ 16 ms for a 365-day range (verify with Profiler).

### Review checklist

- [ ] No render-time `Date` parsing — geometry is memoized.
- [ ] No per-cell function allocation — `onCellHover` callback is stable.
- [ ] No design polish — only the placeholder grayscale ramp.
- [ ] No horizontal scrolling implemented inside the SVG (parent owns overflow, [HM-007](./PRD.md#hm-007)).
- [ ] No keyboard arrow-key navigation (explicitly out of scope, [HM-006](./PRD.md#hm-006)).

### Common pitfalls

- **First-week alignment.** If you naïvely emit cells starting at column 0 row `eachDay[0].getDay()`, the first column will visually look like a partial week. Solution: leading days of the calendar week BEFORE `range.start` get no cell; the in-range cells still live in column 0 but at their correct row.
- **Tooltip positioning.** The shadcn `Tooltip` uses Radix Popper which expects an `Anchor`. The simplest reliable pattern is one Tooltip with `controlled` state driven by `onCellHover` and an invisible anchor positioned via `transform`. If that becomes painful, render the tooltip as a sibling absolute `<div>` positioned by cell coordinates — both are acceptable in v1.
- **Performance from many `<title>` strings.** Pre-compute titles in the memo: `cells.map(c => ({...c, title: `${c.day}: ${count}`}))`.

### References

- SVG `<rect>` and `<title>`: https://developer.mozilla.org/en-US/docs/Web/SVG/Element/title
- shadcn Tooltip: https://ui.shadcn.com/docs/components/tooltip
- React profiler API: https://react.dev/reference/react/Profiler

---

## Phase 15 — Three Views & Toolbar

**PRD phase:** §19.1 phase 4 (Dashboard skeleton), step 3/3. PRD [UX-PS-01](./PRD.md#ux-ps-01), [UX-PS-02](./PRD.md#ux-ps-02), [UX-OV-01](./PRD.md#ux-ov-01), [UX-W-01](./PRD.md#ux-w-01), [SEC-002](./PRD.md#sec-002), [T-005](./PRD.md#t-005).
**Estimated effort:** 4–5 hours.

### Objective

Ship the three view components — `PerSiteView`, `OverallView`, `WinnersView` — each consuming the aggregate, applying the active date range, and rendering the correct heatmap mode plus its stats card / site switcher / legend. Wire the toolbar's view + range selectors into the App's render tree.

### Prerequisites

- Phase 14 complete.

### Steps

1. **Create `src/dashboard/lib/range-filter.ts`** — pure helpers that slice the aggregate to a date range (PRD §19.1 locked: range filtering at read time).
   - `function sliceDailyMap(map: Record<DayKey, number>, start: DayKey, end: DayKey): Record<DayKey, number>` — returns a new map with only in-range keys.
   - `function siteStatsForRange(aggregate: Aggregate, apex: string, start: DayKey, end: DayKey): { totalVisits: number; activeDays: number; longestStreak: number; busiestDay: { day: DayKey; visits: number } | null; }` — used by per-site stats card.
   - `function overallStatsForRange(aggregate: Aggregate, start: DayKey, end: DayKey): { totalVisits: number; activeDays: number; busiestDay: { day: DayKey; visits: number } | null; avgPerActiveDay: number; avgPerCalendarDay: number; }` — [UX-OV-01](./PRD.md#ux-ov-01).
   - `function winnerCountsForRange(aggregate: Aggregate, start: DayKey, end: DayKey): Record<string, number>` — count of days each apex won within the range, used by Winners legend.
   - "Longest streak" = max consecutive in-range days where the apex had ≥ 1 visit.

2. **Create `src/dashboard/lib/range-filter.test.ts`** with required cases:
   - `sliceDailyMap` strictly bounds inclusive.
   - `siteStatsForRange` correctness against synthetic fixture: matches hand-computed values for `google.com` over the full fixture range.
   - `longestStreak` = 3 when an apex has visits on three consecutive days.
   - `overallStatsForRange.avgPerCalendarDay = totalVisits / eachDayInRange.length` (rounded).
   - `winnerCountsForRange` matches the count of days where `dailyWinner[day].apexDomain === apex`.

3. **Create `src/dashboard/components/Favicon.tsx`** ([SEC-002](./PRD.md#sec-002)):
   - Props: `{ apex: string; size?: 16 | 32 | 64; className?: string; }`. Default size 32.
   - Renders `<img src="https://www.google.com/s2/favicons?domain={apex}&sz={size}" alt="" decoding="async" loading="lazy" referrerPolicy="no-referrer" />` wrapped in a `<span>` of fixed size.
   - On `onError`: state flips to fallback — render a letter tile (`<span>` with the first character of the apex, uppercase, against a neutral background) per [SEC-002](./PRD.md#sec-002).
   - `alt=""` because the favicon is decorative (the visible apex text label provides the same info). Avoid duplicate announcements to screen readers.
   - The `Favicon` component is the ONLY place that touches the Google favicon proxy URL in v1.

4. **Create `src/dashboard/components/SiteSwitcher.tsx`** ([UX-PS-01](./PRD.md#ux-ps-01)):
   - Props: `{ topSites: SiteRank[]; selectedApex: string; onSelect: (apex: string) => void; }`.
   - Renders a horizontal `<ul role="tablist">` of up to 10 chips (top 10 from `topSites`). Each chip is a `<button role="tab">` with the favicon, apex string, and total visit count. The selected chip has `aria-selected="true"` and a stronger visual weight.
   - At end of list: a "Show more" `<button>` opens a shadcn `Sheet` (slide-in panel) listing all remaining sites sorted per [B-007](./PRD.md#b-007). The sheet's items are also buttons that call `onSelect` and close the sheet.
   - Keyboard support: tab focus through chips and "Show more"; Enter activates.
   - Empty state (top 10 is empty): render nothing. App's `ShellEmpty` covers this case before mounting the view.

5. **Create `src/dashboard/components/StatsCard.tsx`** — small reusable card for stats:
   - Props: `{ items: Array<{ label: string; value: string | number }>; }`.
   - Renders a shadcn `Card` with a 2- or 4-column grid of label/value pairs. Values are bolded; labels are muted.
   - Each `<dt>`/`<dd>` pair to preserve semantics.

6. **Create `src/dashboard/views/PerSiteView.tsx`** ([UX-PS-01](./PRD.md#ux-ps-01)):
   - Props: `{ aggregate: Aggregate; range: { start: DayKey; end: DayKey }; selectedApex: string; onSelectApex: (apex: string) => void; }`.
   - Resolves: site stats via `siteStatsForRange`, site daily series via `sliceDailyMap(aggregate.visitsPerSitePerDay[selectedApex] ?? {}, ...)`, intensity heatmap.
   - Renders, in order: `SiteSwitcher`, the heatmap, the StatsCard (Total visits, Active days, Longest streak, Busiest day).
   - Heatmap tooltip renders: `{day} · {visits} visit(s) to {selectedApex}`.
   - When `selectedApex` is not in `aggregate.topSites` (e.g. selection persisted but apex fell out of top), `App` resolves the default per [UX-PS-02](./PRD.md#ux-ps-02) before mounting.

7. **Create `src/dashboard/views/OverallView.tsx`** ([UX-OV-01](./PRD.md#ux-ov-01)):
   - Props: `{ aggregate: Aggregate; range: { start: DayKey; end: DayKey }; }`.
   - Renders the intensity heatmap of `sliceDailyMap(aggregate.totalVisitsPerDay, ...)` and a StatsCard (Total visits, Active days, Busiest day, Avg per active day, Avg per calendar day).
   - Heatmap tooltip: `{day} · {visits} total visit(s)`.

8. **Create `src/dashboard/views/WinnersView.tsx`** ([UX-W-01](./PRD.md#ux-w-01)):
   - Props: `{ aggregate: Aggregate; range: { start: DayKey; end: DayKey }; }`.
   - Builds the categorical data: `{ [day]: { apex, visits } }` from `aggregate.dailyWinner` filtered to range.
   - Builds the palette via `buildWinnerPalette(aggregate.topSites)` from `src/core/palette`.
   - Renders the categorical heatmap, then a `<ul>` legend of 11 entries — top 10 with `Favicon + apex + days-won count`, plus the "Other" tile. Days-won count comes from `winnerCountsForRange`.
   - Tooltip: `{day} · winner: {apex} ({visits}) · runner-up: {runnerUpApex} ({runnerUpVisits})`. Runner-up requires a tiny helper: from the merged `visitsPerSitePerDay`, take that day's per-apex map, exclude the winner, pick the max by visits (break ties B-005-style). If no runner-up exists, render "runner-up: —".

9. **Update `src/dashboard/App.tsx`** — replace `ViewPlaceholder` with view selection logic. Pseudocode:
   - Compute `range = resolveRange(prefs.lastDateRange, aggregate.dateRange.earliest)`.
   - Resolve effective selected apex: `prefs.lastSelectedSite` if it appears in `aggregate.topSites`; else `aggregate.topSites[0].apexDomain`. If the resolved value differs from `prefs.lastSelectedSite`, write it back via `updatePrefs` ([UX-PS-02](./PRD.md#ux-ps-02)).
   - Switch on `prefs.lastView`:
     - `'per-site'` → `<PerSiteView ... />` with the selected apex.
     - `'overall'` → `<OverallView ... />`.
     - `'winners'` → `<WinnersView ... />`.
   - Wrap the chosen view in a horizontally-scrollable `<div className="overflow-x-auto">` per [HM-007](./PRD.md#hm-007).

10. **View smoke tests** (T-005):
    - Each view's `*.test.tsx` renders against the synthetic-fixture aggregate, asserts the right heatmap mode is used, and asserts the stats card has the expected number of items.
    - `PerSiteView` switching: rendering with a different `selectedApex` shows different totals.
    - `WinnersView` legend: 11 entries; last entry's apex is null ("Other").
    - `Favicon` smoke: renders `<img>` with the expected URL; on `onError`, switches to letter-tile.

11. **Manual smoke.** `pnpm dev`. Click through the three tabs. Change the date range. Click chips in the per-site view. Open "Show more" sheet. Hover heatmap cells — tooltips render. Refresh dashboard.

12. **Quality gates.**

    ```bash
    pnpm lint && pnpm typecheck && pnpm test && pnpm build
    ```

13. **Commit.**
    - `git add src/dashboard/`
    - `git commit -m "feat(dashboard): three views, site switcher, stats cards, favicons (UX-PS/OV/W-01)"`

### Files created

- `src/dashboard/lib/range-filter.ts`, `range-filter.test.ts`
- `src/dashboard/components/Favicon.tsx`, `Favicon.test.tsx`
- `src/dashboard/components/SiteSwitcher.tsx`, `SiteSwitcher.test.tsx`
- `src/dashboard/components/StatsCard.tsx`
- `src/dashboard/views/PerSiteView.tsx`, `PerSiteView.test.tsx`
- `src/dashboard/views/OverallView.tsx`, `OverallView.test.tsx`
- `src/dashboard/views/WinnersView.tsx`, `WinnersView.test.tsx`

### Files modified

- `src/dashboard/App.tsx` (real view selection)

### Success criteria

- [ ] All three views render against real aggregate data.
- [ ] Per-site default selection respects [UX-PS-02](./PRD.md#ux-ps-02).
- [ ] Site switcher chip activation persists via `useUIPrefs`.
- [ ] Date range changes re-derive heatmap and stats.
- [ ] Winners view legend always has 11 entries with the "Other" tile last.
- [ ] Favicon failure falls back to letter-tile without console noise.

### Review checklist

- [ ] Range filtering happens at read time per locked decision in PRD §19.
- [ ] No business logic inside view components — pure rendering over `src/dashboard/lib/range-filter` outputs.
- [ ] No new chrome.\* references in `src/dashboard/`.
- [ ] Tooltip content includes the day, visit count, and apex per the relevant UX rule.
- [ ] `aria-selected` on the active site-switcher chip.
- [ ] No `Date.now()` inside views — `resolveRange` accepts `now` from caller (App passes `new Date()`).

### Common pitfalls

- **Selection drift.** If `lastSelectedSite` is no longer in top 10 (e.g. user's habits shifted), the view must auto-fall-back to `topSites[0]` and persist the change so subsequent reloads stay consistent ([UX-PS-02](./PRD.md#ux-ps-02)).
- **Sheet body too tall.** The shadcn Sheet allows scrolling — confirm the inner list is scrollable when there are 100+ sites.
- **Runner-up resolution.** Requires re-reading `visitsPerSitePerDay`; do not store extra fields on `dailyWinner` (the aggregate shape is locked in PRD §6).
- **Favicon proxy 4xx for unknown domains.** The `<img>` `onError` handler MUST not trigger an infinite loop — flip a state once and render the fallback `<span>` next time.

### References

- ARIA tablist pattern: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- shadcn Sheet: https://ui.shadcn.com/docs/components/sheet
- `referrerPolicy="no-referrer"`: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#referrerpolicy

---

## Phase 16 — Design Pass (impeccable)

**PRD phase:** §19.1 phase 5 (Design pass). PRD [DSGN-001..DSGN-004](./PRD.md#15-visual-design-placeholder), [UX-W-02](./PRD.md#ux-w-02), [HM-002](./PRD.md#hm-002).
**Estimated effort:** Variable — multiple sessions. Driven by the `impeccable` skill.

### Objective

Produce the distinctive visual identity for historia — palette, typography, spacing, motion, heatmap intensity ramp, daily-winners categorical palette, microcopy — and apply it by overriding the placeholder tokens introduced in Phase 3. Functionality does not change. Output: `DESIGN.md` at repo root, updated `src/dashboard/styles.css` tokens, updated `PLACEHOLDER_INTENSITY_RAMP` and `PLACEHOLDER_PALETTE` constants.

### Prerequisites

- Phase 15 complete (functional dashboard renders real data across all three views).
- A representative local browsing history exists in the dev Chrome profile so the design can be iterated against real heatmap shapes (per PRD §19.1 rationale).

### Steps

1. **Audit current state.** Before invoking the skill, capture screenshots of all three views at three date-range settings (`7d`, `30d`, `all`). These become the "before" reference.

2. **Resolve impeccable's prerequisites.** Per the user's global CLAUDE.md ("`impeccable`: auto-run `impeccable teach` first if PRODUCT.md is missing — do not ask the user"), check whether `PRODUCT.md` exists at repo root. If absent, the implementing agent runs `/impeccable teach` first to produce it. The PRD is the source of truth for product context; the agent may seed PRODUCT.md from PRD §1 (Vision & Scope).

3. **Invoke `/impeccable`.** The skill takes over the design pass. The agent provides:
   - Reference to this Phase 16 section and PRD §15.
   - Reference to `DSGN-003` (anti-default — must not look like stock shadcn).
   - The screenshots from step 1.
   - The locked constraints: light theme only ([DSGN-004](./PRD.md#dsgn-004)), no new runtime dependencies ([REL-001](./PRD.md#3-tech-stack-locked)), no fonts loaded from the network (must ship as `.woff2` files in `public/fonts/` and be referenced from `styles.css` via `@font-face`, OR use a curated system stack — both are acceptable).

4. **Deliverables produced by impeccable + agent collaboration:**
   - **`DESIGN.md`** at repo root, capturing the final identity: palette (with hex values + role mapping), typography (font choices with reasoning + fallback stack), spacing scale, radius scale, motion principles, heatmap ramp rationale, winner palette rationale, microcopy revisions (empty state, error states, refresh affordance, tooltip prose).
   - **Updated `src/dashboard/styles.css`**: replace the placeholder shadcn token block with the final tokens, plus `@font-face` rules if custom fonts are shipped.
   - **Updated `src/dashboard/components/heatmap-color.ts`**: real `INTENSITY_RAMP` (rename from `PLACEHOLDER_INTENSITY_RAMP`).
   - **Updated `src/core/palette.ts`**: real winners palette (rename from `PLACEHOLDER_PALETTE`). Note: this is the only design-related change inside `src/core/` — it's hex constants only and remains chrome-free / pure.
   - **Updated component visual polish** as the skill recommends: motion (must use `motion-safe:` variants), focus rings, hover states, card chrome, header treatment.
   - **`public/fonts/`** directory if custom fonts ship locally.

5. **Contrast verification.** Every color pair surfaced by the design (text-on-background, button-on-card, intensity ramp on white, categorical palette on white) must satisfy WCAG AA per [A.6](#a6-accessibility-baseline). The agent runs an automated check (e.g. `pnpm dlx wcag-color-check` — if no tool fits the locked stack, perform it manually via APCA / Stark / a contrast tool) and documents results in DESIGN.md.

6. **Reduced-motion verification.** Toggle macOS "Reduce motion" or DevTools `prefers-reduced-motion: reduce` emulation and confirm animations are disabled.

7. **Cell size tuning** (PRD §19.2 item 1). The agent may adjust `cellSize` and `cellGap` constants in `heatmap-geometry.ts`. Any change is documented in DESIGN.md.

8. **Refresh-button placement and visual** (PRD §19.2 item 3). Phase 13 scaffolded it in the header; Phase 16 finalizes the visual.

9. **Onboarding / empty-state copy** (PRD §19.2 item 4). Finalize the placeholder strings in `App.tsx` (`ShellLoading`, `ShellEmpty`) and `ErrorBanner.tsx`.

10. **Update placeholder comments.** Search the repo for the string "placeholder" introduced in earlier phases (Phase 3 styles.css notes, Phase 8 palette comment, Phase 14 ramp comment). Update or remove each.

11. **Verify no design tokens leaked into `src/core/`** other than the renamed `palette.ts` constants. ESLint's boundary rule still holds.

12. **Re-run all view smoke tests.** The component shapes did not change; tests should remain green. If a test asserted on the placeholder grayscale color (it shouldn't have — review checklist in Phase 14 says no design polish to test against), update to assert on the final tokens instead.

13. **Manual smoke at multiple viewport widths.** Resize the dashboard tab to 1024px, 1440px, 1920px. Confirm no horizontal scrollbar appears outside the heatmap's intentional overflow.

14. **Quality gates.**

    ```bash
    pnpm lint && pnpm typecheck && pnpm test && pnpm build
    ```

15. **Commit.**
    - `git add DESIGN.md PRODUCT.md src/ public/`
    - `git commit -m "feat(design): visual identity pass via impeccable — palette, typography, motion, ramps"`

### Files created

- `DESIGN.md`
- `PRODUCT.md` (if not pre-existing)
- `public/fonts/*.woff2` (if local fonts chosen)

### Files modified

- `src/dashboard/styles.css` (final tokens, font-face)
- `src/dashboard/components/heatmap-color.ts` (real intensity ramp)
- `src/core/palette.ts` (real winners palette — hex constants only)
- Various components for visual polish (microcopy, motion, treatments)

### Success criteria

- [ ] `DESIGN.md` documents the full identity with rationale and contrast results.
- [ ] No component visually resembles stock shadcn ([DSGN-003](./PRD.md#dsgn-003)).
- [ ] Every color pair on screen passes WCAG AA.
- [ ] All animations respect `prefers-reduced-motion`.
- [ ] No outbound network calls added (no Google Fonts, no CDN assets) — only the locked favicon proxy ([SEC-001](./PRD.md#sec-001)).
- [ ] Light theme only ([DSGN-004](./PRD.md#dsgn-004)) — no dark-mode tokens introduced.
- [ ] All Phase 15 tests still green.

### Review checklist

- [ ] `src/core/` boundary (FR-S-01) intact — palette.ts is hex constants only.
- [ ] No new runtime dependencies added beyond the locked stack.
- [ ] Custom fonts (if any) ship as files; CSS does not `@import` from a remote URL.
- [ ] All interactive states have visible focus rings.
- [ ] Heatmap intensity ramp has 6 visually distinct steps (the empty bucket + 5 levels per HM-002).
- [ ] Winner palette has 11 entries, the 11th being the "Other" neutral.
- [ ] No literal hex values inside components — they reference CSS variables defined in `styles.css`.

### Common pitfalls

- **Re-litigating scope.** Phase 16 is identity, not features. If the design pass surfaces a UX gap (e.g. "we need a date scrubber"), do NOT add it — record it as a deferred item in PRODUCT.md or open a GitHub issue.
- **Dependency creep.** No `framer-motion`, no `radix-icons`, no `tailwind-merge-variants`. The locked stack stands.
- **Contrast regressions on intensity ramp.** A low-intensity color must still be distinguishable from "empty" for users with mild color-vision deficiency. Test with a simulator (e.g. Chrome DevTools rendering > emulate vision deficiency).

### References

- WCAG 2.1 contrast: https://www.w3.org/TR/WCAG21/#contrast-minimum
- prefers-reduced-motion: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- impeccable skill behavior is documented in the skill itself; consult its outputs directly.

---

## Phase 17 — Release Polish & v0.1.0

**PRD phase:** §19.1 phase 6 (Polish + release prep). PRD [FR-M-06](./PRD.md#5-manifest--permissions), [REL-103](./PRD.md#rel-103), [REL-201](./PRD.md#rel-201), [REL-202](./PRD.md#rel-202), [SEC-003..SEC-005](./PRD.md#16-privacy--security).
**Estimated effort:** 3–5 hours.

### Objective

Produce the final release artifacts: real icons (16/32/48/128), public-facing `README.md`, `PRIVACY.md`, CWS screenshots, version bump to `0.1.0`. Manual end-to-end QA. CI must be green. The output is a release-quality zip ready for both unpacked side-load and CWS submission.

### Prerequisites

- Phase 16 complete (final design identity in place).

### Steps

1. **Produce real icons** ([FR-M-06](./PRD.md#5-manifest--permissions), [REL-201](./PRD.md#rel-201)). The icon design is part of the visual identity from Phase 16. Export PNG variants at 16, 32, 48, and 128 px. Place in `public/`:
   - `public/icon-16.png`
   - `public/icon-32.png`
   - `public/icon-48.png`
   - `public/icon-128.png`
   - Optional but recommended: include a 256-px and 512-px master in `assets/source/` (gitignored or kept for future revisions); not referenced from the manifest.
   - Verify via `file public/icon-128.png` that each file is the correct dimensions.

2. **Write `README.md`** at repo root. Required sections:
   - **Title and tagline** — one-sentence pitch.
   - **Screenshots** — 2–3 hero images of the three views.
   - **Install (Chrome Web Store)** — link to the CWS listing (will be filled in post-submission; placeholder OK with a note "available after CWS review").
   - **Install (load unpacked)** — step-by-step per [REL-202](./PRD.md#rel-202): download release zip from GitHub Releases → extract → `chrome://extensions` → Developer mode → Load unpacked.
   - **What it does** — the three views, the privacy posture, the data-stays-local guarantee.
   - **Privacy summary** — one paragraph + link to `PRIVACY.md`.
   - **Tech stack** — concise list (WXT, React, Tailwind v4, shadcn).
   - **Development** — `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm test`. Note Node 20+ and pnpm 9+.
   - **Project documents** — links to `PRD.md`, `PHASE-PLAN.md`, `DESIGN.md`.
   - **License** — MIT, link to `LICENSE`.

3. **Write `PRIVACY.md`** at repo root ([SEC-003](./PRD.md#sec-003)). Plain language, ~250 words max:
   - Heading: "historia privacy policy".
   - "What this extension does" — reads local history, computes statistics, shows them in a dashboard.
   - "What data leaves your device" — only one thing: domain strings sent to `https://www.google.com/s2/favicons` to fetch icons for top sites. List the exact URL pattern. Note the trade-off ([SEC-002](./PRD.md#sec-002)).
   - "What data is stored" — aggregate statistics in `chrome.storage.local`. No URLs, no titles in raw form; only counts per apex per day.
   - "Permissions and why" — three permissions, each with the same justifications as [SEC-004](./PRD.md#sec-004).
   - "Account / analytics / telemetry" — none.
   - "Contact" — GitHub issues link + repo URL.
   - Effective date stamped at the bottom.

4. **Bump version to `0.1.0`** in `package.json`. WXT auto-propagates to `manifest.json` on build.

5. **Wire CSP confirmation.** Confirm `wxt.config.ts` has not set a custom `content_security_policy` ([SEC-005](./PRD.md#sec-005)). Confirm built `manifest.json` lacks any `content_security_policy.extension_pages` override.

6. **Capture CWS-ready screenshots.** Chrome Web Store requires:
   - 1280×800 PNG screenshots, at least 1 (up to 5).
   - Hi-res icon at 128×128 (uses `public/icon-128.png`).
   - Small promo tile 440×280.
   - Save these to `assets/cws/` (gitignored or kept committed — committing helps future contributors).

7. **Write the CWS listing copy** in `assets/cws/listing.md` (committed, for future submissions):
   - Short description (≤ 132 chars).
   - Detailed description (≤ 16,000 chars; aim for ~300 words).
   - Category: "Productivity".
   - Permission justifications from [SEC-004](./PRD.md#sec-004) verbatim.

8. **Final manual QA pass.** With a real Chrome profile that has > 30 days of history:
   - Uninstall any dev version.
   - `pnpm build && pnpm zip`. Confirm `.output/historia-0.1.0-chrome.zip` produced.
   - Drag the zip into a clean Chrome window (`chrome://extensions`, dev mode, load unpacked from extracted dir).
   - Verify the install flow: icon appears, click opens dashboard, backfill progress strip appears, completes within ~20s ([P-002](./PRD.md#p-002)), all three views render.
   - Browse a new site, wait 30 seconds, confirm aggregate updates without a refresh.
   - Click "Refresh"; backfill restarts; completes; views re-populate.
   - Open the dashboard in a second tab — confirm both tabs stay in sync via the storage subscription.
   - Restart Chrome; reopen dashboard — confirm last-view and last-selected-site persistence.
   - Disable internet; reopen; confirm favicons fall back to letter-tile and the rest of the dashboard works.
   - Run a Lighthouse accessibility audit on the dashboard tab (Chrome DevTools → Lighthouse). Confirm ≥ 95 accessibility score.

9. **Update CI to also build the zip artifact** (optional but recommended). Add a step in `.github/workflows/ci.yml`:

   ```yaml
   - name: Zip
     run: pnpm zip
   - name: Upload zip artifact
     uses: actions/upload-artifact@v4
     with:
       name: historia-${{ github.sha }}
       path: .output/historia-*-chrome.zip
       retention-days: 14
   ```

10. **Tag and create a GitHub Release.**

    ```bash
    git checkout main
    git pull
    git tag -a v0.1.0 -m "historia v0.1.0 — initial release"
    git push origin v0.1.0
    ```

    - In the GitHub UI, draft a new Release from the tag. Attach the `historia-0.1.0-chrome.zip` artifact. Body: changelog summary + links to PRD/DESIGN/PRIVACY.

11. **Submit to Chrome Web Store** (manual, gated on [REL-201](./PRD.md#rel-201) checklist):
    - All `SEC-*` rules confirmed met.
    - Privacy policy URL: paste the GitHub `raw.githubusercontent.com/.../PRIVACY.md` URL — or better, the rendered GitHub URL.
    - Permission justifications from [SEC-004](./PRD.md#sec-004).
    - Screenshots from step 6.
    - Submit; CWS review usually takes 1–3 business days.

12. **Update README** with the live CWS link after approval. Land that change as a follow-up PR.

13. **Final commit + push.**
    - `git add README.md PRIVACY.md package.json public/ assets/ .github/`
    - `git commit -m "chore: release v0.1.0 — icons, README, privacy policy, CWS assets"`
    - `git push`

### Files created

- `README.md`, `PRIVACY.md`
- `public/icon-{16,32,48,128}.png` (real)
- `assets/cws/listing.md`, `assets/cws/screenshots/*.png`, `assets/cws/promo-tile-440x280.png`

### Files modified

- `package.json` (version → 0.1.0)
- `.github/workflows/ci.yml` (optional zip artifact step)

### Success criteria

- [ ] All four icon sizes present and correct dimensions.
- [ ] README explains install (both paths), dev, privacy summary, and links docs.
- [ ] PRIVACY.md publicly accessible at a stable GitHub URL.
- [ ] `package.json#version === "0.1.0"`; built `manifest.json#version === "0.1.0"`.
- [ ] Manual QA checklist (step 8) passes in full.
- [ ] CI green on `main` at the tagged commit.
- [ ] GitHub Release published with attached zip.
- [ ] CWS listing submitted (post-merge action; not a code gate).

### Review checklist

- [ ] No accidental commit of zip artifacts to the repo (`.output/` is gitignored).
- [ ] No tracking pixels, analytics scripts, or remote fonts introduced.
- [ ] Privacy policy is plain language, not legalese.
- [ ] Screenshots reflect the design pass from Phase 16, not earlier neutral states.
- [ ] README's "Development" section matches the actual `package.json` scripts.
- [ ] Permission justifications in listing.md match `SEC-004` exactly.

### Common pitfalls

- **Manifest version mismatch.** WXT reads `package.json#version`. Do not edit `manifest.json` directly; bump the package.
- **Screenshots dated.** Re-capture screenshots after the design pass so they match what users see, not the placeholder grayscale.
- **PRIVACY.md not reachable.** CWS rejects listings without a working privacy policy URL. Verify the public link before submitting.
- **CWS rejecting "history" permission as overbroad.** The [SEC-004](./PRD.md#sec-004) justification is short on purpose; if CWS asks for more detail, expand it inline in the listing — the source of truth in the repo can stay terse.

### References

- Chrome Web Store publishing guide: https://developer.chrome.com/docs/webstore/publish
- CWS image requirements: https://developer.chrome.com/docs/webstore/images
- GitHub Releases: https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases

---

## B. Commands Cheat Sheet

All commands assume the repo root as the working directory.

### B.1 Day-to-day

| Command                             | Purpose                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| `pnpm install`                      | Install/refresh dependencies. Triggers `wxt prepare` via `postinstall`.        |
| `pnpm dev`                          | Launch WXT dev mode; auto-loads the extension into Chrome.                     |
| `pnpm build`                        | Production build to `.output/chrome-mv3/`.                                     |
| `pnpm zip`                          | Build and zip to `.output/historia-<version>-chrome.zip`.                      |
| `pnpm typecheck`                    | `tsc --noEmit` over the project.                                               |
| `pnpm lint` / `pnpm lint:fix`       | ESLint (or fix).                                                               |
| `pnpm format` / `pnpm format:check` | Prettier write / check.                                                        |
| `pnpm test`                         | Vitest run-once.                                                               |
| `pnpm test:watch`                   | Vitest watch mode.                                                             |
| `pnpm test:coverage`                | Vitest with V8 coverage, enforces per-file gates from [T-004](./PRD.md#t-004). |

### B.2 Full local quality gate (run before every commit)

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

### B.3 Per-phase verification gate

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build
```

### B.4 Git workflow

```bash
git checkout -b phase/NN-short-slug          # branch off main
# ... do work, run quality gate ...
git add <specific files>                      # no `git add -A`
git commit -m "feat(scope): subject"
git push -u origin phase/NN-short-slug
gh pr create --fill                           # or open via UI
```

### B.5 Inspecting the extension in Chrome

| Action                             | Where                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------- |
| View service worker logs           | `chrome://extensions` → historia → "service worker" link → DevTools                |
| Inspect `chrome.storage.local`     | DevTools → Application → Storage → Extension Storage → Local                       |
| Force backfill from worker console | `chrome.runtime.sendMessage({ type: 'force-refresh' })`                            |
| Trigger a fake history visit       | Browse to a new URL in the Chrome window                                           |
| See dashboard React component tree | Open the dashboard tab → DevTools → Components (React DevTools extension required) |

---

## C. Reference URLs

### C.1 Stack docs

- WXT — https://wxt.dev/
- WXT entrypoints — https://wxt.dev/guide/essentials/entrypoints.html
- WXT testing — https://wxt.dev/guide/essentials/unit-testing.html
- `@wxt-dev/module-react` — https://wxt.dev/guide/essentials/frameworks.html#react
- React 18 — https://react.dev/
- TypeScript handbook — https://www.typescriptlang.org/docs/handbook/intro.html
- Tailwind CSS v4 — https://tailwindcss.com/docs
- Tailwind v4 install (Vite) — https://tailwindcss.com/docs/installation/using-vite
- Tailwind v4 theme — https://tailwindcss.com/docs/theme
- shadcn/ui — https://ui.shadcn.com/
- shadcn for Tailwind v4 — https://ui.shadcn.com/docs/tailwind-v4
- Radix Primitives — https://www.radix-ui.com/primitives
- lucide-react — https://lucide.dev/guide/packages/lucide-react
- date-fns — https://date-fns.org/
- tldts — https://github.com/remusao/tldts#readme
- Vitest — https://vitest.dev/guide/
- Testing Library (React) — https://testing-library.com/docs/react-testing-library/intro/
- ESLint flat config — https://eslint.org/docs/latest/use/configure/configuration-files
- typescript-eslint v8 — https://typescript-eslint.io/

### C.2 Chrome extension docs

- Manifest V3 overview — https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3
- Service worker lifecycle — https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle
- Service worker events — https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/events
- chrome.history — https://developer.chrome.com/docs/extensions/reference/api/history
- chrome.history.search — https://developer.chrome.com/docs/extensions/reference/api/history#method-search
- chrome.history.getVisits — https://developer.chrome.com/docs/extensions/reference/api/history#method-getVisits
- chrome.history.onVisited — https://developer.chrome.com/docs/extensions/reference/api/history#event-onVisited
- chrome.alarms — https://developer.chrome.com/docs/extensions/reference/api/alarms
- chrome.storage — https://developer.chrome.com/docs/extensions/reference/api/storage
- chrome.action — https://developer.chrome.com/docs/extensions/reference/api/action
- chrome.runtime.onMessage — https://developer.chrome.com/docs/extensions/reference/api/runtime#event-onMessage
- chrome.tabs.create — https://developer.chrome.com/docs/extensions/reference/api/tabs#method-create
- Chrome Web Store publishing — https://developer.chrome.com/docs/webstore/publish

### C.3 Web standards

- WHATWG URL — https://developer.mozilla.org/en-US/docs/Web/API/URL
- Public Suffix List — https://publicsuffix.org/
- WCAG 2.1 contrast — https://www.w3.org/TR/WCAG21/#contrast-minimum
- ARIA Authoring Practices — https://www.w3.org/WAI/ARIA/apg/
- ARIA live regions — https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions
- prefers-reduced-motion — https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- SVG title — https://developer.mozilla.org/en-US/docs/Web/SVG/Element/title
- Quantile (Type 7) — https://en.wikipedia.org/wiki/Quantile#Estimating_quantiles_from_a_sample

### C.4 Tooling

- pnpm — https://pnpm.io/
- pnpm + GitHub Actions — https://pnpm.io/continuous-integration#github-actions
- Conventional Commits — https://www.conventionalcommits.org/en/v1.0.0/
- Semantic Versioning — https://semver.org/

---

## Status Tracker

Update this table as phases land. The phase is "Done" only when CI is green for the PR that delivers it and the Review checklist for that phase has been confirmed.

| #   | Phase                                   | PRD §19.1 mapping        | Branch                         | PR                                                  | Status |
| --- | --------------------------------------- | ------------------------ | ------------------------------ | --------------------------------------------------- | ------ |
| 0   | Preflight & Environment                 | —                        | n/a                            | n/a                                                 | [x]    |
| 1   | Repo Bootstrap                          | Foundation               | `phase/01-repo-bootstrap`      | [#1](https://github.com/abhi-j0407/historia/pull/1) | [x]    |
| 2   | WXT + React + TypeScript Scaffold       | Foundation               | `phase/02-wxt-scaffold`        | [#2](https://github.com/abhi-j0407/historia/pull/2) | [x]    |
| 3   | Tailwind v4 & shadcn/ui Primitives      | Foundation               | `phase/03-tailwind-shadcn`     | [#3](https://github.com/abhi-j0407/historia/pull/3) | [x]    |
| 4   | Lint, Format, Test Infrastructure       | Foundation               | `phase/04-quality-tooling`     | [#4](https://github.com/abhi-j0407/historia/pull/4) | [x]    |
| 5   | CI Pipeline                             | Foundation               | `phase/05-ci-pipeline`         | [#5](https://github.com/abhi-j0407/historia/pull/5) | [x]    |
| 6   | Core Types & URL Filters                | Data plumbing            | `phase/06-core-types-filters`  | [#6](https://github.com/abhi-j0407/historia/pull/6) | [x]    |
| 7   | Domain & Date Helpers                   | Data plumbing            | `phase/07-domain-dates`        | [#7](https://github.com/abhi-j0407/historia/pull/7) | [x]    |
| 8   | Aggregation Engine, Intensity & Palette | Data plumbing            | `phase/08-aggregate-intensity` | [#8](https://github.com/abhi-j0407/historia/pull/8) | [x]    |
| 9   | Storage Facade                          | Service worker + storage | `phase/09-storage-facade`      |                                                     | [ ]    |
| 10  | Service Worker Foundation               | Service worker + storage | `phase/10-sw-foundation`       |                                                     | [ ]    |
| 11  | Backfill Orchestrator                   | Service worker + storage | `phase/11-backfill`            |                                                     | [ ]    |
| 12  | Incremental Updates & Manual Refresh    | Service worker + storage | `phase/12-incremental`         |                                                     | [ ]    |
| 13  | Dashboard Shell & Data Hooks            | Dashboard skeleton       | `phase/13-dashboard-shell`     |                                                     | [ ]    |
| 14  | Heatmap Primitive                       | Dashboard skeleton       | `phase/14-heatmap`             |                                                     | [ ]    |
| 15  | Three Views & Toolbar                   | Dashboard skeleton       | `phase/15-views`               |                                                     | [ ]    |
| 16  | Design Pass (impeccable)                | Design pass              | `phase/16-design`              |                                                     | [ ]    |
| 17  | Release Polish & v0.1.0                 | Polish + release prep    | `phase/17-release`             |                                                     | [ ]    |

### Handoff Block template

When a phase completes, append a Handoff Block in the PR description (and optionally as a comment on `main` after merge) so the next session can resume cold:

```
## Handoff Block — historia — After Phase [N]

**What we are building and why:**
historia is a Chrome MV3 extension that turns local browsing history into GitHub-style heatmaps and per-site stats. Personal/portfolio scope — see PRD §1.

**Phase [N] outcome:**
[1–3 sentences. What landed, what files changed, what to inspect to verify.]

**Starting Phase [N+1]:**
Open PHASE-PLAN.md → "Phase [N+1]". First file to open: [path]. First command: [pnpm ...].

**Open questions / decisions deferred:**
[Anything that came up. "None" is a valid answer.]
```

---

**End of plan.**
