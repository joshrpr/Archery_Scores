# Integrated Velocity OD / Ranch Horizon evidence — issues #18–22

These are real app screens using isolated browser-storage fixtures. Names, notes, and scores in the captures are repeatable review data; the production app does not seed them.

| Surface | Before | After |
| --- | --- | --- |
| Home, multiple unfinished rounds | [Before](before-home.png) | [After](after-home.png), [new-round action in view](after-home-action.png) |
| Vegas entry | [Before](before-vegas.png) | [After](after-vegas.png) |
| History | [Before](before-history.png) | [After](after-history.png) |
| Scorecard | — | [After](after-card.png) |
| Web/native identity and launcher masks | — | [Export contact sheet](native-assets.png) |

Phone captures use 390×844 CSS pixels. Whole-page captures show fixed controls at their actual viewport position; content scrolls above them in the app. Focused workflow tests additionally exercise 320×568, 200% text, five long-name archers, keyboard input, and reduced motion.

Final integrated checks: **48 browser workflows, 28 domain/delivery tests, web packaging, and 61 source-derived branding exports pass.** Browser checks include genuine offline caching/reload/update failure recovery, backup/restore and spreadsheet import, rapid score correction, plotting and group standings, and two consecutive Android-compatible celebrations.

## Standards review

No documented-standard violations. One possible duplicated-code finding in raster/provenance hashing was resolved by sharing the hashing functions in `scripts/brand-source.mjs`.

## Spec review

Two contrast regressions were resolved: recent-round notes now use readable muted text; semantic score labels use dark foregrounds on bright Vegas rings and light foregrounds on dark IBO/miss fills. Minimum measured score-label contrast is 5.12:1. No other concrete omissions or scope creep were identified.

## Integrated visual review

Three additional transient-state findings were resolved: the plotting magnifier's dark label backing, the update action's ink label and 44px minimum height, and readable pressed primary actions. The selected Velocity OD and Ranch Horizon fidelity is retained. Updated production design records cover the whole implemented app.

Browser/artifact checks do not establish physical-device behavior. Pixel 10 Pro / Android 17 installation over the existing app, launcher/startup appearance, and two newly finished Vegas rounds remain phone-preview acceptance checks before production merge.

---
# Home/navigation implementation evidence — issue #19

The screenshots show the real production app with browser-storage fixtures, not a prototype engine. Fixture names and scores are for repeatable review only; production Home never seeds data.

- `mobile.png`: 390 × 844, an unfinished Vegas round and recent saved round.
- `desktop.png`: 1440 × 1000, the same content at the centered production width.
- `narrow-large-text.png`: 320 × 640 with 24px root text, a long archer name and two participants. Navigation deliberately becomes two rows; measured bottom clearance lets every item scroll above it.
- `empty.png`: 320 × 640, genuinely empty storage, normal text, four navigation columns.

TDD evidence: the first public-UI test failed because the Unfinished rounds region/resume summaries did not exist. It passed after the real Home/router implementation. A second cycle failed because keyboard navigation left the destination heading inactive; it passed after focus followed the route. Assertions observe UI labels, totals, destinations and unchanged saved data; they do not assert CSS literals.

Independent Impeccable review: initial Fix for accidental 3+1 navigation. Final recapture scored that fix Resolved; disposition Ship for Home/navigation only. Scoring, support screens, native masks and physical-device validation remain owned by later tickets.
