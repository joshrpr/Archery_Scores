---
name: Ropers Archery Scorecard — Velocity OD
description: An olive-drab field scorebook with warm paper records and purposeful orange actions.
colors:
  od: "#4b5320"
  paper: "#f3eedf"
  sheet: "#fcf8ee"
  ink: "#26281f"
  muted: "#65614e"
  rule: "#d2ccb9"
  tint: "#e6dfcb"
  arrow: "#f2621a"
  arrow-hi: "#aa3c0b"
  arrow-hover: "#ff873d"
  resume-hover: "#56602a"
  nav-muted: "#e3e3c9"
  nav-active: "#626b32"
  danger: "#ad2924"
  score-ink: "#11180d"
  vegas-gold: "#f5c84c"
  vegas-red: "#ef5350"
  vegas-blue: "#42a5f5"
  ibo-eleven: "#a53b0b"
  ibo-ten: "#1767a7"
  ibo-eight: "#466d20"
  ibo-five: "#765a2a"
  score-miss: "#65614e"
typography:
  wordmark:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "39px"
    fontWeight: 500
    lineHeight: 0.85
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "23px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  round-format:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "58px"
    fontWeight: 500
    lineHeight: 0.91
    letterSpacing: "-0.04em"
  round-number:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "73px"
    fontWeight: 500
    lineHeight: 0.91
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.72rem"
    fontWeight: 600
    lineHeight: 1.4
  metadata:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.78rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  nav-item: "6px"
  control: "12px"
  dock: "13px"
  card: "16px"
  resume: "16px 16px 54px 16px"
  circle: "50%"
spacing:
  icon-gap: "4px"
  dock-inset: "8px"
  brand-gap: "12px"
  card-gap: "16px"
  section-gap: "18px"
  compact-card: "20px"
  page-gutter: "24px"
  section-tail: "32px"
components:
  button-primary:
    backgroundColor: "{colors.arrow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "15px 18px"
    height: "58px"
  button-primary-hover:
    backgroundColor: "{colors.arrow-hover}"
    textColor: "{colors.ink}"
  button-utility:
    backgroundColor: "transparent"
    textColor: "{colors.od}"
    rounded: "{rounded.circle}"
    width: "48px"
    height: "48px"
  round-resume:
    backgroundColor: "{colors.od}"
    textColor: "{colors.paper}"
    rounded: "{rounded.resume}"
    padding: "24px"
  round-recent:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "19px 0"
  main-navigation:
    backgroundColor: "{colors.od}"
    textColor: "{colors.paper}"
    rounded: "{rounded.dock}"
    padding: "8px"
  main-navigation-active:
    backgroundColor: "{colors.nav-active}"
    textColor: "{colors.paper}"
    rounded: "{rounded.nav-item}"
  field:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
    height: "52px"
  chip-selected:
    backgroundColor: "{colors.od}"
    textColor: "{colors.paper}"
---

# Design System: Ropers Archery Scorecard — Velocity OD

## Overview

**Creative North Star: "Velocity OD"**

Velocity OD pairs the character of a ranch scorebook with the speed of a field instrument. Olive drab carries identity and continuity; warm paper carries records; orange marks the next deliberate action. The compact italic Ropers wordmark sits beside Ranch Horizon, whose aerial image is a fixed part of the identity.

This record covers the implemented Home, navigation, individual and group scoring, plotting, scorecards, records, analytics, data tools, completion presentation, and Android delivery. Real saved data drives every production summary and result.

**Key Characteristics:**

- Olive drab, warm paper, and purposeful orange.
- Compact italic brand typography; sans-serif routine controls.
- Large split round-format labels on unfinished rounds.
- Flat tonal surfaces, readable records, and a floating inset navigation dock.
- Local fonts and source-derived Ranch Horizon web and native assets.

## Colors

### Primary

Arrow Orange identifies primary actions, directional cues, score feedback, and focus. Warm Orange Hover answers pointer input. Dark Orange Focus provides visible focus on paper and the pressed primary-action background; pressed text switches to paper.

### Secondary

Olive Drab identifies unfinished rounds, the scoring header, navigation, and selected controls. Lifted Olive answers unfinished-round hover; Active Olive identifies the selected navigation destination. Paper labels stay legible on these darker surfaces.

### Neutral

Warm Paper is the page and dialog canvas; Clean Sheet supports fields and score controls. Field Ink is the routine foreground, including orange actions. Quiet Olive Gray supplies dates, notes and secondary text on paper; Pale Olive Text belongs on olive surfaces. Paper Rule and Paper Tint separate records without decorative depth.

### Semantic data

Vegas gold, red and blue retain their target meanings. Score Ink labels these bright rings in plotting slots, Undo, dropped arrows and distribution bars. Miss and the darker IBO value colors use paper labels. Small score text must meet 4.5:1 against its actual fill; never use the page-background alias as a semantic foreground. The target loupe preserves its colored score labels on a dedicated dark backing. Danger Red remains an error/destructive role. Charts retain distinct data-series colors and labeled legends.

**The Action Color Rule.** Reserve orange for the next deliberate action, meaningful score feedback, and visible focus; semantic target colors retain their own meanings.

## Typography

Newsreader regular and italic variable fonts are bundled locally with their licenses. Use the italic display face for Ropers; upright Newsreader carries format numerals, section titles, running totals, score slots, and selected result summaries. Routine controls, archer names, table data, descriptions and navigation use the device sans-serif stack. Totals use tabular numerals. Keep tracking no tighter than the existing display floor (-0.04em).

**The Functional Type Rule.** Use sans-serif for routine controls and dense records; use Newsreader selectively for identity, hierarchy, and emphasized results.

## Layout

The app uses a centered column capped at 640px, normally with 24px gutters and 18px on phones 350px wide or narrower. Safe areas protect the header and bottom actions. Long names and descriptions wrap; wide score tables and charts scroll within their own containers.

Home presents every unfinished individual or group round, then the new-round action and at most three recent completed rounds. Notes adapt to the surface: pale olive on unfinished cards, muted text on recent paper records. The four-destination dock is inset by at least 16px, capped at an effective 608px width. Measured labels switch it to two columns under enlarged text; its measured height sets content clearance. Setup, import and active scoring own their interaction space and omit this dock.

Scoring has an olive header, wrap-safe round progress and running result, a horizontal end/target strip, per-archer entry sections, three labeled Vegas slots, and a three-column keypad. Miss spans the Vegas keypad width. The measured scoring dock preserves previous/next actions on short or enlarged-text screens. IBO retains its five score values and target navigation.

History, archer records and import previews use open rows with fine rules. Analytics filters wrap and data graphics keep their labels and legends. Backup, restore and import retain explicit file actions and confirmation/recovery dialogs. Dialogs scroll independently, trap keyboard focus, support Escape cancellation and restore the initiating control.

## Elevation & Depth

Tonal contrast, whitespace and fine rules provide the ordinary surface hierarchy. Home, navigation, score entry, dialogs and records use no decorative shadows or gradients. The target magnifier uses an outline and soft shadow to separate magnified target content from the face. Completion retains its approved target/arrow rendering rather than becoming a generic card effect.

**The Flat Surface Rule.** Use tonal contrast, spacing, and fine rules for application hierarchy; reserve rendering depth for the target and completion experience.

## Shapes

Routine fields and primary controls use 12px corners; score keys use 9px and slots 12px. Dialogs use 16px corners. Home unfinished cards retain the distinctive enlarged lower-right corner; the inset main dock uses 13px corners with smaller destination states. Scoring's olive header has a 28px lower-right corner. These signature silhouettes belong to their specific surfaces.

## Components

### Buttons, fields and navigation

Primary actions, including Home's new-round action, have orange fill, ink text, readable hover, and paper text on the dark pressed state. Unfinished rounds and navigation answer a press with deep olive. The Android update link has at least a 44px touch height. Secondary controls use sheet/tint or transparent surfaces; selected pickers and filters use olive with paper text. Fields use tint, ink, muted placeholders and an olive caret. Shared focus is a 3px dark-orange outline with 3px offset, including the visible labels around hidden file inputs; olive surfaces use a paper outline. Disabled controls reduce opacity; busy controls communicate loading.

The main dock uses four consistent outlined SVG icons and labels. Back and Undo use the same authored outline style at 22px with a 1.6px stroke; their SVGs are hidden from accessibility names. The active destination exposes aria-current; route changes focus the destination heading. Data tools remain reachable from Home and supporting routes.

### Scoring and results

Vegas slots identify arrow order and expose correction actions; a warm outline indicates the next slot. Entry updates scores immediately. Key-to-slot feedback lasts 300ms, with a 360ms slot acknowledgment; reduced motion removes spatial travel and uses a brief opacity acknowledgment. Feedback is finite, interruptible, and cleared by navigation or hiding. Group sections retain every archer and their totals.

Plotting keeps the actual gold/red/blue face, coordinates, current-end scores, magnifier, Undo and group measurements. Scorecards preserve standings, per-arrow values, totals and horizontally scrollable tables. Numeric colors communicate data rather than decorative branding.

The completion dialog retains saving before presentation, rapid recap, final-arrow emphasis, Skip, scorecard exit, haptics and visibility cleanup. Its chrome follows olive/paper/orange. Android uses the existing non-WebGL renderer; reduced motion retains readable static results. Update reload waits until this presentation exits.

### Ranch Horizon and native delivery

The maintained SVG references the exact frozen original ranch artwork and its selected aerial crop. Home shows the production self-contained mark at 54px beside Ropers. Never infer a new aerial from an exported logo.

Web favicon, 192/512 icons and maskable output are local. Android uses real 108dp split adaptive layers: full-bleed aerial background and a centered 64dp foreground carrying the arrow and cream arcs inside the 66dp safe circle. Round and existing density outputs remain source-derived. Static startup uses the same aerial identity with olive backing; paper is the webview canvas. System bars follow olive and paper. No startup hold is introduced.

The asset provenance guard and bundled fonts support offline delivery. Browser mask checks establish artifact appearance; physical launcher, startup and update-installation observations remain device validation.

## Do's and Don'ts

### Do:

- Do keep the exact frozen ranch aerial and selected crop in every identity export.
- Do preserve the compact italic wordmark and selective upright display numerals.
- Do derive rounds, participants and results from stored data.
- Do preserve keyboard focus, visible focus rings, enlarged-text reflow and safe-area clearance.
- Do keep semantic target fills and verify foreground contrast in default, hover and pressed states.

### Don't:

- Don't replace the ranch aerial with generated scenery or an already branded export.
- Don't reintroduce decorative navy gradients or change target colors to match the brand.
- Don't apply the Home resume-card composition to every supporting record.
- Don't hide dense data or remove recovery actions to imitate a prototype.
- Don't treat browser or artifact checks as physical Android device observations.
