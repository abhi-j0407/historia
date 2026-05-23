# Design — historia v1

Phase 16 visual identity. Light theme only (DSGN-004). Tokens live in `src/dashboard/styles.css`; heatmap and winner hex constants in `heatmap-color.ts` and `src/core/palette.ts` only (FR-S-01).

## Scene sentence

A person at a home desk in daylight, opening a personal archive of where they browsed: calm paper tones, copper accents, serif title, no surveillance aesthetic.

## Before reference

Baseline: Phase 15 on `main` (neutral grayscale placeholders, stock shadcn tabs). Capture screenshots at 7d / 30d / all for Sites, Daily, and Winners before merging this branch. Owner may attach PNGs to the PR; synthetic data via `pnpm dev` is sufficient.

## Color strategy

**Restrained chrome + full palette for data.** UI uses warm tinted neutrals and one copper primary (≤10% of surface). Heatmap intensity and winner cells use dedicated ramps (committed data-viz palette).

### UI tokens (HSL in `styles.css`)

| Role               | HSL        | Hex (approx) | Use                       |
| ------------------ | ---------- | ------------ | ------------------------- |
| background         | 38 32% 97% | #F9F6F1      | page                      |
| foreground         | 28 28% 14% | #2B241C      | body text                 |
| muted-foreground   | 28 12% 42% | #6B6358      | labels                    |
| primary            | 22 58% 36% | #94572F      | active tab, progress, CTA |
| primary-foreground | 38 40% 98% | #FAF7F2      | on primary                |
| card               | 36 28% 99% | #FDFCFA      | cards, chips              |
| border             | 32 16% 86% | #E0DAD2      | dividers                  |
| destructive        | 4 62% 44%  | #B52E2A      | errors                    |
| heatmap-empty      | 38 35% 94% | #F5F0E8      | aligns with ramp[0]       |

No pure `#000` / `#fff`; neutrals tinted warm.

### Intensity ramp (HM-002)

| Level | Hex       | Rationale           |
| ----- | --------- | ------------------- |
| 0     | `#F5F0E8` | Empty / zero visits |
| 1     | `#D2A876` | Light activity      |
| 2     | `#C49252` |                     |
| 3     | `#B8895A` |                     |
| 4     | `#8F5C2E` |                     |
| 5     | `#5C3A1A` | Peak                |

Warm copper scale (not GitHub green). Chroma rises with level so low buckets stay distinguishable from empty on paper.

### Winner palette (UX-W-02)

| Index | Hex                   | Role                       |
| ----- | --------------------- | -------------------------- |
| 0–9   | `#7A4E2A` … `#C2410C` | Ranks 1–10 (distinct hues) |
| 10    | `#8A8478`             | Other (neutral warm grey)  |

Deterministic by rank; slot 10 never assigned to a ranked site.

## Typography

- **Display:** `Iowan Old Style`, `Palatino Linotype`, Palatino, Georgia — product title, empty-state headline. `.font-display` utility.
- **UI:** system sans stack (`Segoe UI`, system-ui, …). No CDN fonts; no shipped `.woff2` (curated system stack per REL-001).

Body hierarchy: display 4xl title; stats values `text-lg font-semibold`; labels `text-xs uppercase tracking-wide`.

## Spacing and radius

- Page: `gap-8`, `px-6 sm:px-8`, `max-w-5xl`.
- Section stacks: `space-y-6` in views.
- `--radius`: `0.375rem`; pills use `rounded-full`.

## Motion

- `motion-safe:` on transitions, progress width, refresh spin, chip hover.
- Global `@media (prefers-reduced-motion: reduce)` zeroes animation/transition duration in `styles.css`.
- Easing: default ease-out on progress bar (`duration-300 ease-out`).

## Heatmap geometry (§19.2)

- `cellSize`: **11px** (was 12px) — slightly denser grid on wide ranges.
- `cellGap`: **2px** (unchanged).
- Horizontal scroll: `overflow-x-auto` on Heatmap wrapper only (HM-007), not the full page.

## Microcopy

| Surface       | Copy                                                      |
| ------------- | --------------------------------------------------------- |
| Header CTA    | Sync history                                              |
| Backfill      | Syncing your history locally…                             |
| Shell loading | Reading your history… + privacy line                      |
| Shell empty   | No browsing rhythm yet + guidance                         |
| Error         | Could not read your history + permission hint; Sync again |
| Refresh aria  | Refresh browsing history (unchanged for a11y tests)       |

## Anti-default (DSGN-003)

- Copper primary + paper background (not zinc shadcn default).
- Pill tabs on elevated track (not rectangular muted TabsList).
- Serif `historia` wordmark + small caps kicker.
- Stats use top borders per metric, not icon+card grid template.
- Header rule + outline sync button (not ghost icon-only).

## WCAG AA contrast verification

Checked with relative luminance (WCAG 2.1) on 2026-05-23:

| Pair                                                   | Ratio   | AA                             |
| ------------------------------------------------------ | ------- | ------------------------------ |
| foreground `#2B241C` on background `#F9F6F1`           | 14.07:1 | pass                           |
| muted `#6B6358` on background                          | 5.43:1  | pass                           |
| primary `#94572F` on background                        | 5.27:1  | pass                           |
| primary-foreground on primary                          | 5.36:1  | pass                           |
| destructive text on card                               | ≥4.5:1  | pass                           |
| intensity[5] on background                             | 9.30:1  | pass                           |
| intensity[0] vs intensity[1] (cell distinguishability) | ~1.6:1  | non-text; empty vs peak ~8.9:1 |

Adjacent heatmap steps are intentionally subtle; tooltips and focus rings supplement perception. Verify with Chrome DevTools vision deficiency emulation before release.

## Deferred (not Phase 16)

- Date scrubber, dark theme, custom subdomain rules (PRD OOS).
- Real CWS icons (Phase 17).
