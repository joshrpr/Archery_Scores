# Home/navigation implementation evidence — issue #19

The screenshots show the real production app with browser-storage fixtures, not a prototype engine. Fixture names and scores are for repeatable review only; production Home never seeds data.

- `mobile.png`: 390 × 844, an unfinished Vegas round and recent saved round.
- `desktop.png`: 1440 × 1000, the same content at the centered production width.
- `narrow-large-text.png`: 320 × 640 with 24px root text, a long archer name and two participants. Navigation deliberately becomes two rows; measured bottom clearance lets every item scroll above it.
- `empty.png`: 320 × 640, genuinely empty storage, normal text, four navigation columns.

TDD evidence: the first public-UI test failed because the Unfinished rounds region/resume summaries did not exist. It passed after the real Home/router implementation. A second cycle failed because keyboard navigation left the destination heading inactive; it passed after focus followed the route. Assertions observe UI labels, totals, destinations and unchanged saved data; they do not assert CSS literals.

Independent Impeccable review: initial Fix for accidental 3+1 navigation. Final recapture scored that fix Resolved; disposition Ship for Home/navigation only. Scoring, support screens, native masks and physical-device validation remain owned by later tickets.
