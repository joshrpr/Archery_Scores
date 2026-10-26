# Ivory Scorebook celebration

This replaces the end-of-round celebration on the `claude/project-thread-hcm8of` base with the selected Ivory Scorebook direction. The change is scoped to `Finish` in `ibo-scorer/finish.js`, `finishSummary()` in `app.js`, the `.fin` styles, supporting assets, and tests. It does not change scoring rules or stored round data.

## Visual treatment

Warm ivory `#F5F0E6`, navy `#14283D`, secondary text `#536171`, and restrained orange `#A94B24` establish the scorebook palette. Self-hosted Newsreader supplies the display typography; existing system fonts handle supporting text. Ruled standings show score and Xs or 11s, with a persistent 54px “See scorecard” action.

The generated, unprinted foam-and-paper material in `images/finish-butt.webp` sits beneath deterministic Vegas SVG rings. Ring geometry remains in centimeters; the material cannot alter scoring geometry. Its prompt and provenance accompany the asset.

## Sequence

| Time | Treatment |
| --- | --- |
| 0–0.65s | Approach and enlarge the target. |
| 0.65–1.45s | Reveal recorded shots. |
| 1.45–1.80s | Replay the final plotted shot or symbolic score pin; subtle contact and one optional light haptic. |
| 1.90s | Results become usable. |
| 2.65s | Movement is settled. |

Vegas uses only saved positions belonging to the featured archer. The last stored plotted arrow appears once, at its saved coordinates. Score-only rounds use a transient decorative completion mark outside the scoring face; it disappears from results and never becomes a recorded shot.

IBO remains a symbolic score medallion. Pins indicate score categories, not physical locations; blank `null` entries are omitted, while recorded misses (`0`) appear outside the score bands. Ownership labels identify whose plots or medallion are shown.

Existing tie and personal-best rules remain: total first, Xs/11s as tiebreak, shared ranks for exact ties, and prior finished rounds of the same kind for PB comparison. IBO comparisons retain target-count separation.

Skip and reduced motion reveal results immediately. Background controls become inert while open; focus is contained and restored on exit. Keyboard users can reach and scroll the results region. Escape, navigation, and the primary action clean up pending work.

## Review evidence

- [Approach](images/ivory-approach.png)
- [Impact](images/ivory-impact.png)
- [Vegas results](images/ivory-vegas.png)
- [IBO results](images/ivory-ibo.png)

Verification: 49 Node tests; actual browser finish flow with unchanged score data; cached offline loading; 390px and 320px phones, tablet, and 150% text.

Offline assets include `finish.js`, `fonts/newsreader-variable.woff2`, and `images/finish-butt.webp` in `sw.js`. Physical Android haptic feel is not verified. GitHub Android CI is pending.

