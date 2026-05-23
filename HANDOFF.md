# historia — Handoff Ledger

**Purpose.** Single source of truth for _where we are_. Every phase appends an entry. The coordinator chat reads this file (and the actual diff on the PR branch) to know the current state of the project. The implementer chat writes its entry as part of the PR for that phase.

**How to read.** Latest phase is at the top. Older entries beneath. Never delete entries — they're the project's log.

**Companion documents:**

- [PRD.md](./PRD.md) — what we are building (locked behavior).
- [PHASE-PLAN.md](./PHASE-PLAN.md) — how we build it (locked sequence).
- [EXECUTION.md](./EXECUTION.md) — process for running phases.

---

## Current state

- **Last completed phase:** Phase 4 — Lint, Format, Test Infrastructure (merged in `0e2a46f`, [PR #4](https://github.com/abhi-j0407/historia/pull/4)).
- **Next phase:** Phase 5 — CI Pipeline.
- **Active branch:** none (`main` is the current tip; Phase 5 will create its own branch).
- **Open PRs:** none.
- **Open follow-ups:** none.

---

## Phase log

<!--
  Newest phase entry goes IMMEDIATELY below this comment.
  Use the template at the bottom of this file.
  Do not edit older entries.
-->

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
