---
name: Ropers OD green prototypes
description: Three exploratory proposals; no production direction selected.
colors:
  od-green: "#4b5320"
  orange: "#f2621a"
  paper: "#f3eedf"
  ink: "#26281f"
  paper-muted: "#65614e"
  paper-rule: "#d2ccb9"
  paper-tint: "#e6dfcb"
  green-label: "#e3e3c9"
  field-ground: "#202718"
  field-label: "#c8cbb1"
typography:
  editorial:
    fontFamily: "Newsreader, Georgia, serif"
    fontWeight: 500
    lineHeight: 1
  field-heading:
    fontFamily: "FieldCondensed, sans-serif"
    fontSize: "78px"
    fontWeight: 600
    lineHeight: 0.87
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Segoe UI, Arial, sans-serif"
    fontSize: "14px"
    lineHeight: 1.4
rounded:
  field-sheet: "12px"
  action: "5px"
spacing:
  phone-content: "24px"
  narrow-content: "18px"
---

## Overview

This reference applies only to the three proposals in this folder. Shared layout, sample-state behavior, and font assets are inherited from the earlier Scorebook prototype; `od.css` and `od.js` contain the new treatment. Nothing establishes a production system.

## Colors

Heritage uses OD green for masthead/navigation with cream lettering, warm-paper content, and orange actions. Velocity uses the same OD green for its round panel, scoring header, and compact dock; orange supplies its primary actions. Fieldwork uses deep green for the shell, OD green for current-arrow and score controls, cream for the functional score sheet, and orange for emphasis and primary actions. Paper-area text uses ink or paper-muted; green-area text uses cream or green-label. Vegas target semantics remain the existing gold/red/blue.

## Typography

Newsreader carries the editorial voice and displayed scores. Fieldwork uses the locally bundled Barlow Condensed Semibold under the `FieldCondensed` alias for its brand, main heading, and end heading. Score keys and control labels remain sans serif. Fieldwork's home heading reduces to 68px on the intermediate comparison and 69px on narrow phones.

## Layout

The comparison uses three equal phone previews, stacking at 860px and below. The 1024px comparison uses 18px content insets. Full-size views use the browser viewport height. Work areas scroll while primary actions remain reachable. Page headings wrap to protect long titles and their actions.

## Elevation & Depth

Fieldwork's functional home score sheet has one 12px-down, 24px-blur shadow and a two-degree tilt that straightens on hover/focus. It is the source of the shared-element resume transition. The remaining surfaces use flat fills and rules.

## Shapes

Heritage retains its circular orange resume seal and fine rectangular controls. Velocity retains its broad round panel with a 54px lower-right corner and compact rounded dock. Fieldwork has one 12px-radius sheet with simple 5px controls. The sheet's tilt is disabled under reduced motion.

## Components

The round sheet and scoring header share `field-round` only within Fieldwork. A supported, normal-motion home-to-scoring transition takes 380ms; unsupported browsers open directly using the normal short transition. Changing screens, hiding the page, or changing motion preference skips the pending shared transition. Score feedback is finite and cancellable; the demo is initiated by the user. No audio or WebGL is involved.

## Do's and Don'ts

Keep the orange and OD green pairing anchored in clear score entry. Preserve target colors, actual sample totals, usable navigation, and the reduced-motion path. Do not infer a production design decision or persist sample data. These browser prototypes do not certify performance on the user's phone.
