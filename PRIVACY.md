# historia privacy policy

**Effective date:** 2026-05-23

## What this extension does

historia reads your **local** Chrome browsing history on your device. It counts visits per website (by apex domain) per day and shows heatmaps and statistics in a full-page dashboard. It does not read page titles or full URLs in the stored aggregate—only visit counts grouped by site and date.

## What data leaves your device

Almost nothing. The only network request is when the dashboard loads **favicons** for top-site chips from Google’s public favicon service:

`https://www.google.com/s2/favicons?domain={apex}&sz=64`

That URL includes the **apex domain name** (for example `example.com`) so Google can return an icon. It does **not** include your identity, history URLs, or visit counts. If the request fails, historia shows a letter tile instead and the rest of the dashboard works offline.

## What data is stored

Computed **aggregate statistics** in `chrome.storage.local`: per-apex, per-day visit counts, metadata for ranges and views, and UI preferences (last view, date range, selected site). Raw history URLs and page titles are not stored in the aggregate.

## Permissions and why

| Permission | Why                                                                                  |
| ---------- | ------------------------------------------------------------------------------------ |
| `history`  | Required to read your browsing history locally and compute the dashboard statistics. |
| `storage`  | Required to cache computed statistics so the dashboard opens instantly.              |
| `alarms`   | Required to schedule efficient background updates after you browse.                  |

## Account, analytics, and telemetry

historia has **no** user accounts, sign-in, analytics, crash reporting, or telemetry. No data is sent to the developer’s servers.

## Contact

Questions or concerns: open an issue at [github.com/abhi-j0407/historia/issues](https://github.com/abhi-j0407/historia/issues).

Repository: [github.com/abhi-j0407/historia](https://github.com/abhi-j0407/historia)
