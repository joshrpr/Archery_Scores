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

This document records the implemented shared foundation, Home, and main navigation. Home gives unfinished rounds visual weight and keeps completed records quiet and readable. Scoring, supporting screens, completion effects, and native packaging have their own follow-up scope; inherited styling on those surfaces is not evidence of a newly approved visual pattern.

**Key Characteristics:**

- Olive drab, warm paper, and purposeful orange.
- Compact italic brand typography; sans-serif routine controls.
- Large split round-format labels on unfinished rounds.
- Flat tonal surfaces and a floating inset navigation dock.
- Local font assets and real individual or group round data.

## Colors

The palette feels like a field scorebook: olive drab and warm paper, with a clear orange action signal. The frontmatter is the normative value source; aliases in the shared stylesheet are compatibility mappings rather than additional palette roles.

### Primary

- **Arrow Orange** (`arrow`): Start new round and the circular directional cue on unfinished rounds.
- **Dark Orange Focus** (`arrow-hi`): visible keyboard focus on the light foundation; the navigation uses paper-colored focus against olive drab.
- **Warm Orange Hover** (`arrow-hover`): pointer response on the primary action.

### Secondary

- **Olive Drab** (`od`): unfinished-round surfaces, the wordmark, navigation, and selected controls.
- **Lifted Olive** (`resume-hover`): unfinished-round hover response.
- **Active Olive** (`nav-active`): active or hovered navigation destination.

### Neutral

- **Warm Paper** (`paper`): page canvas and light text on olive drab; also exposed by the compatibility alias `cream`.
- **Clean Sheet** (`sheet`): shared supporting surface.
- **Field Ink** (`ink`): primary text, including text on orange actions.
- **Quiet Olive Gray** (`muted`): metadata and secondary text on paper.
- **Paper Rule** (`rule`): dividers and shared borders.
- **Paper Tint** (`tint`): input backgrounds and quiet hover feedback.
- **Pale Olive Text** (`nav-muted`): inactive navigation labels and metadata on unfinished rounds.

The shared **Danger Red** (`danger`) is a functional error/destructive role. Score-value colors and Vegas gold, red, and blue remain semantic and separate from brand palette decisions.

**The The Action Color Rule Rule.** Reserve orange for the primary action, its directional cue, and visible focus. Olive drab identifies the continuing round and main navigation.

## Typography

**Display Font:** Newsreader, with Georgia and serif fallbacks. The regular and italic variable font files are shipped locally in `ibo-scorer/fonts/`, with a weight range of 200–800 and swap loading.

**Body Font:** The device system sans-serif stack.

**Character:** Newsreader provides a compact, recognizable identity and distinctive format numerals. System sans-serif keeps frequent actions, names, and round details immediately legible. The wordmark is italic; the other display roles are upright.

### Hierarchy

- **Wordmark:** compact italic Ropers with a separate quiet sans-serif Archery Scorecard descriptor. Its baseline role is defined in the frontmatter; narrow screens reduce it to 34px.
- **Headline:** a short sans-serif Home lead, limited to 22ch; narrow screens use 22px.
- **Round format / number:** split Vegas / 300 or IBO / 3D display on unfinished rounds, with the number on its own line.
- **Title:** serif Recent rounds heading. Recent round names use sans-serif (0.95rem, weight 650); emphasized recent totals use Newsreader (26px, weight 500).
- **Body:** shared readable foundation; Home empty-state prose uses a quieter 0.9rem size, 1.6 line-height, and 55ch maximum width.
- **Label / metadata:** compact navigation and supporting detail. Resume archer totals use tabular numerals; archer names remain sans-serif.

**The The Functional Type Rule Rule.** Use sans-serif for routine controls, navigation, metadata, and archer names. Use Newsreader for identity, round-format display, section headings, and emphasized recent totals.

## Layout

Home is a single centered column capped at 640px. The brand row uses 24px horizontal padding, a 54px identity image, and a 12px gap. Its top padding respects the larger of 22px and the top safe area. The Home content uses 17px top padding and 24px gutters, reduced to 18px at widths of 350px or less.

Unfinished rounds stack with 16px spacing; the primary action separates them from the paper record list. The composition supports every unfinished round and every archer in a group rather than a single featured person. Recent rounds shows at most three finished rounds, sorted by completion time, with View all providing history access.

The dock is inset by at least 16px horizontally and from the bottom safe area, with a maximum effective width of 608px. Four equal destinations normally form one row. Measured label widths switch the dock to two columns when enlarged text cannot fit; its measured height updates the content's bottom clearance. Do not replace this with a fixed-height assumption. Navigation is present on Home and supporting destinations, and omitted during new-round setup, import, and active scoring.

## Elevation & Depth

Depth comes from olive drab against paper, the tinted active state, fine dividers, and the dock's inset position. The selected Home surfaces use no shadows, gradients, or blur. Hover changes color directly; these styles introduce no timed animation. Reduced-motion preferences keep scrolling automatic.

**The The Flat Surface Rule Rule.** Use tonal contrast, spacing, and fine rules to establish hierarchy. The selected Home and navigation add no shadows.

## Shapes

Cards and controls have gently rounded corners. The unfinished-round card has a distinctive enlarged lower-right corner, while its arrow cue is circular and rotated upward by 35 degrees. Keep that silhouette specific to this Home pattern. The dock has a compact rounded outer container and smaller rounded destination states. Recent records stay open on the paper canvas, separated by a fine bottom rule rather than enclosed in repeated cards.

## Components

### Buttons

The primary Home action is confident, orange, and full width, with a sans-serif label and plus icon. Its minimum height, padding, and corner values are in the frontmatter. Hover uses the warm orange token. The utility settings button is a quiet circular 48px target with tinted hover; View all and Backup and export remain text actions with at least 44px height. Keyboard focus uses a 3px outline with 3px offset; the unfinished card uses 4px offset. Shared disabled buttons use 0.55 opacity.

### Chips

The shared selected-state foundation uses olive drab with paper text and matching olive borders. This documents color compatibility only; scoring-specific chip geometry and behavior remain outside the Home scope.

### Cards / Containers

An unfinished round is one accessible button containing its split format label, progress, date, optional note, all participating archers, totals, and the relevant bonus count. Its orange arrow is a directional cue inside the same action. The upper-right title clearance reserves space for that cue. Hover uses the lifted olive token; result rows wrap so long names and group totals remain readable.

Recent records are full-width buttons on paper with fine dividers, sans-serif round names, quiet dates and archer names, and serif totals. A tinted hover signals interaction without changing the record-list structure. Empty states retain useful prose and the Start new round action rather than fabricated records.

### Inputs / Fields

The shared foundation makes inherited text fields readable with tinted backgrounds, ink text, muted placeholders, an olive caret, and the common visible focus treatment. The inherited minimum height is 52px, with a fine paper-rule border. The field preview represents this shared compatibility treatment, not a finalized supporting-screen form composition.

### Navigation

Four outlined icons and sans-serif labels identify Home, History, Analytics, and Archers. Each destination has a minimum 48px height with icon above label. The active destination uses `aria-current="page"`, paper text, and a lighter olive fill; hover shares this fill. Focus is a paper-colored 3px outline inset by 3px. Labels remain unbroken and the measured layout reflows into two rows when needed.

### Ranch Horizon Identity

Use the production `ibo-scorer/icons/ranch-horizon.svg` identity, including its frozen embedded ranch aerial. Preserve the approved crop and composition. Home shows it at 54px beside the italic Ropers wordmark; do not replace it with a new landscape. Identity preview generation must use the real asset rather than a synthetic approximation.

## Do's and Don'ts

### Do:

- Do keep the exact frozen ranch aerial in the Ranch Horizon identity asset.
- Do preserve the compact italic Ropers wordmark and its quiet sans-serif descriptor.
- Do render every unfinished round and every participating archer from stored data; show up to three completed rounds in Recent rounds.
- Do keep routine controls in sans-serif, preserve visible focus, and allow enlarged text to reflow the dock.
- Do retain real target ring colors independently of interface branding.

### Don't:

- Don't replace the ranch aerial with a generated landscape or remove it through simplification.
- Don't treat inherited blue backgrounds, gradients, chart series colors, or older decorative treatments as approved Velocity OD patterns.
- Don't apply the Home resume card composition indiscriminately to scoring or supporting screens.
- Don't invent scores or round records in production; label component-preview examples as sample content.
- Don't add display typography to routine controls or add a dock where setup, import, or active scoring owns the interaction.
