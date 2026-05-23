# Product

## Register

product

## Users

Personal Chrome users who want a calm, local-only mirror of their browsing rhythm. They open the full-page dashboard from the toolbar when curious (not during focused work). Context: desk, daylight, solo reflection; no accounts or sharing.

## Product Purpose

Turn local `chrome.history` into GitHub-style activity heatmaps and per-site stats without reading page content. Success: instant open from cache, trustworthy numbers, and a distinctive visual identity that feels like a personal archive, not a generic analytics SaaS.

## Brand Personality

Warm, archival, understated confidence. Three words: **personal**, **honest**, **crafted**. Emotion: quiet delight when patterns emerge, never surveillance anxiety.

## Anti-references

- Stock shadcn / zinc SaaS dashboards (DSGN-003)
- Dark-mode “devtools” observability UIs
- Neon crypto palettes, gradient hero metrics, glassmorphism cards
- GitHub-green heatmap clone (we use our own ramp)
- Corporate BI density (too many KPI tiles)

## Design Principles

1. **Local-first transparency** — copy and UI reinforce that data never leaves the device.
2. **Heatmap is the hero** — chrome stays quiet; color budget goes to cells and winner swatches.
3. **Readable at a glance** — AA contrast, distinct intensity steps, reduced-motion respect.
4. **Deterministic color** — rank-based winner colors and intensity buckets stay stable across sessions.
5. **Light scene only** — warm paper background for daytime desk use (OOS-D-03 deferred).

## Accessibility & Inclusion

WCAG 2.1 AA for all surfaced text/background pairs. Visible `focus-visible` rings on every control. Animations use `motion-safe:` and disable under `prefers-reduced-motion`. Heatmap ramp and winner palette checked for distinguishability on light backgrounds.
