# Chrome Web Store listing copy

## Short description (≤ 132 characters)

Turn local Chrome history into warm activity heatmaps and per-site stats. All processing on your device—no accounts or telemetry.

## Detailed description

historia is a personal dashboard for your browsing rhythm. It reads your local Chrome history, aggregates visits by site and day, and shows GitHub-style heatmaps plus simple stats—without sending your history to any server.

**Three views**

- **Sites** — pick a top site and see its daily activity grid.
- **Daily** — combined activity across all tracked sites.
- **Winners** — which sites took the largest share of your attention in the selected range.

**Private by design**

Statistics are computed and stored on your device (`chrome.storage.local`). The only outbound request is optional favicon loading for site chips (domain name only). No accounts, analytics, or crash reporting.

**Requirements**

- Google Chrome (Manifest V3)
- `history`, `storage`, and `alarms` permissions (see justifications below)

Install from GitHub Releases (load unpacked) or the Chrome Web Store when listed.

## Category

Productivity

## Permission justifications (SEC-004)

| Permission | Justification text                                                                   |
| ---------- | ------------------------------------------------------------------------------------ |
| `history`  | Required to read your browsing history locally and compute the dashboard statistics. |
| `storage`  | Required to cache computed statistics so the dashboard opens instantly.              |
| `alarms`   | Required to schedule efficient background updates after you browse.                  |

## Privacy policy URL

`https://github.com/abhi-j0407/historia/blob/main/PRIVACY.md`
