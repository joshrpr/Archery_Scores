# Selected Surface Continuity

Implements the user's approved motion study from `codex/prototype-surface-continuity`, tracked in #27. The comparison is preserved outside production.

- `resume-phone.jpg`: the real Home card travelling toward the scoring header, captured during motion in the 390×844 browser viewport.
- `scoring-phone.jpg`: settled real Vegas scoring at phone width.
- `scoring-wide.jpg`: settled scoring at the default desktop width.
- `setup.jpg`: settled real setup after Home's Start new round entrance. Setup-to-Home Back also uses the reverse surface.

These captures use a separate localhost origin with a clearly named Sample archer; they do not change scores in the user's existing preview. Browser screenshots establish layout and visual continuity, not physical Pixel performance.

Verified: Home resume and real setup entry, immediate scoring/saving during motion, repeated and interrupted navigation, browser Back, Home scroll restoration including from a scrolled score sheet, reduced motion and keyboard focus, and offline delivery of both new assets. The integrated browser coverage totals 54 workflows with affected checks rerun after final timing changes; 28 domain/delivery tests and 61 brand-export checks pass. No data migration, renderer replacement, or scoring-rule change.

Follow-up: the user requested motion on Home's Start new round action as well. Added Home ↔ setup continuity, reusing the existing cancellation and reduced-motion behavior. All 12 targeted Home, transition and offline checks pass, including a new test confirming that opening setup does not create a round. Total browser coverage is now 55 workflows.
