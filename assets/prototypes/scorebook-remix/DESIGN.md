---
name: Scorebook remix — three exploratory prototypes
description: Built visual reference for Heritage, Velocity, and Wildcard; no production direction selected.
colors:
  orange: "#f2621a"
  orange-hover: "#e55413"
  on-orange: "#332319"
  heritage-paper: "#f3eddf"
  heritage-sheet: "#fcf8ef"
  heritage-ink: "#342b23"
  heritage-muted: "#756452"
  heritage-rule: "#d6cbb7"
  heritage-accent: "#a73b0e"
  heritage-tint: "#e8decb"
  heritage-nav: "#eae0cf"
  velocity-paper: "#f6f1e6"
  velocity-sheet: "#fffcf4"
  velocity-ink: "#2c2923"
  velocity-muted: "#6e6253"
  velocity-rule: "#d7cdbb"
  velocity-accent: "#a6380c"
  velocity-tint: "#e8dfce"
  velocity-dark-hover: "#514331"
  velocity-nav-label: "#d2c5b1"
  velocity-nav-active: "#ff9b5e"
  velocity-resume-icon: "#fff6e8"
  wildcard-sheet: "#fff4dc"
  wildcard-ink: "#3b2034"
  wildcard-paper-muted: "#705b57"
  wildcard-orange-rule: "#e1b386"
  wildcard-paper-rule: "#d7c8b3"
  wildcard-tint: "#e8dac3"
  wildcard-slot: "#eddfca"
  wildcard-resume-hover: "#5e3551"
  wildcard-key-hover: "#69405a"
  wildcard-disabled: "#e3d3be"
  wildcard-nav-active: "#a03b13"
  target-gold: "#ffd400"
  target-red: "#e8352b"
  target-blue: "#2a7fd4"
  key-gold: "#b18a20"
  key-red: "#bf4b3f"
  key-blue: "#337cb0"
  wildcard-key-gold: "#f2ce55"
  wildcard-key-red: "#ff8d7a"
  wildcard-key-blue: "#8cbce0"
typography:
  body:
    fontFamily: "Segoe UI, Arial, sans-serif"
    fontSize: "14px"
    lineHeight: 1.4
  heritage-display:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "48px"
    fontWeight: 400
    lineHeight: 0.96
    letterSpacing: "-.04em"
  heritage-end:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "42px"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-.04em"
  velocity-display:
    fontFamily: "Segoe UI, Arial, sans-serif"
    fontSize: "23px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-.035em"
  velocity-resume:
    fontFamily: "Newsreader, serif"
    fontSize: "58px"
    fontWeight: 500
    lineHeight: 0.91
    letterSpacing: "-.04em"
  velocity-resume-number:
    fontSize: "73px"
    letterSpacing: "-.04em"
  velocity-end:
    fontFamily: "Newsreader, serif"
    fontSize: "39px"
    fontWeight: 500
    lineHeight: 0.95
  wildcard-display:
    fontFamily: "Newsreader, serif"
    fontSize: "52px"
    fontWeight: 500
    lineHeight: 0.98
    letterSpacing: "-.035em"
  wildcard-display-emphasis:
    fontFamily: "BodoniModa, serif"
    fontSize: "94px"
    fontWeight: 650
    lineHeight: 0.98
    letterSpacing: "-.04em"
  wildcard-end:
    fontFamily: "BodoniModa, serif"
    fontSize: "44px"
    fontWeight: 550
    lineHeight: 0.95
  wildcard-slot:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "42px"
    fontWeight: 600
    lineHeight: 1
  detail-title:
    fontSize: "37px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-.04em"
  score-key:
    fontFamily: "Segoe UI, Arial, sans-serif"
    fontSize: "23px"
    fontWeight: 500
  field-label:
    fontSize: "12px"
rounded:
  heritage-control: "2px"
  action: "5px"
  velocity-key: "9px"
  velocity-action: "10px"
  velocity-slot: "12px"
  velocity-nav: "13px"
  velocity-resume: "16px 16px 54px 16px"
  wildcard-slot: "8px"
  wildcard-history: "0 56px 0 0"
  wildcard-scoring: "0 36px 0 0"
  wildcard-detail: "0 35px 0 0"
  phone: "27px"
  circle: "50%"
spacing:
  key-gap: "7px"
  slot-gap: "10px"
  dock-gap: "12px"
  phone-gutter: "24px"
  compact-gutter: "18px"
  comparison-gap: "30px"
components:
  heritage-resume-button:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.on-orange}"
    rounded: "{rounded.circle}"
    width: "58px"
    height: "58px"
  velocity-resume-button:
    backgroundColor: "{colors.velocity-ink}"
    textColor: "{colors.velocity-resume-icon}"
    rounded: "{rounded.circle}"
    width: "48px"
    height: "48px"
  wildcard-resume-button:
    backgroundColor: "{colors.wildcard-ink}"
    textColor: "{colors.wildcard-sheet}"
    rounded: "{rounded.circle}"
    width: "55px"
    height: "55px"
  heritage-next-button:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.on-orange}"
    rounded: "{rounded.action}"
    padding: "13px 18px"
  velocity-next-button:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.on-orange}"
    rounded: "{rounded.velocity-action}"
    padding: "13px 18px"
  wildcard-next-button:
    backgroundColor: "{colors.wildcard-ink}"
    textColor: "{colors.wildcard-sheet}"
    rounded: "{rounded.action}"
    padding: "13px 18px"
  heritage-score-key:
    backgroundColor: "{colors.heritage-sheet}"
    textColor: "{colors.heritage-ink}"
    rounded: "{rounded.heritage-control}"
    typography: "{typography.score-key}"
    height: "55px"
  velocity-score-key:
    backgroundColor: "{colors.velocity-sheet}"
    textColor: "{colors.velocity-ink}"
    rounded: "{rounded.velocity-key}"
    typography: "{typography.score-key}"
    height: "54px"
  wildcard-score-key:
    backgroundColor: "{colors.wildcard-ink}"
    textColor: "{colors.wildcard-sheet}"
    rounded: "{rounded.action}"
    typography: "{typography.score-key}"
    height: "54px"
  heritage-field:
    backgroundColor: "{colors.heritage-sheet}"
    textColor: "{colors.heritage-ink}"
    rounded: "{rounded.action}"
    padding: "10px"
  velocity-resume-panel:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.on-orange}"
    rounded: "{rounded.velocity-resume}"
    padding: "23px 22px 20px"
  wildcard-history-panel:
    backgroundColor: "{colors.wildcard-sheet}"
    textColor: "{colors.wildcard-ink}"
    rounded: "{rounded.wildcard-history}"
    padding: "22px 24px 12px"
---

# Design System: Scorebook remix prototypes

## Overview

This reference describes only the built exploratory prototypes in this directory. Heritage is the classic/refined proposal, Velocity the modern/flashy proposal, and Wildcard the wild/creative proposal. The names and character descriptions come from the implemented studies. None is the selected or canonical production style.

All three combine orange with warm paper and dark ink. Heritage uses editorial restraint and fine rules; Velocity gives the round action a broad orange field and a dark navigation dock; Wildcard uses expressive italic lettering and curved cream sections. Familiar score keys, arrow slots, navigation, and tables remain present across the proposals.

**Key Characteristics:**
- Three equally provisional treatments of the same sample Scorebook.
- Local serif lettering paired with system sans-serif controls.
- Immediate scoring with short, cancellable feedback.
- Sample content and in-memory state, isolated from production storage.

## Colors

### Primary

Shared orange anchors the three proposals. Heritage concentrates it in the circular resume control and next action. Velocity expands it across the resume panel and score heading. Wildcard makes it the surrounding page field. Dark ink is used for text on orange, including supporting labels in Velocity and Wildcard.

### Secondary

Heritage uses rust for links, active navigation, and focus. Velocity uses a deeper rust for links and focus, with peach highlighting the active destination in its dark dock. Wildcard uses aubergine for text, keys, and primary actions, with rust active navigation on cream.

### Neutral

Each proposal has its own paper, sheet, ink, muted, rule, and tint values in the frontmatter. Wildcard changes muted text and rules within cream regions; its orange-region supporting text remains aubergine. The comparison page's gray-green surround belongs to the presentation shell, not an adopted app palette.

**The Target Color Rule.** Target gold, red, and blue retain their scoring meanings in all three proposals. The target geometry module supplies the actual face colors. Small key markers use separate gold/red/blue values, including lighter markers on Wildcard's dark keys; these marker values do not recolor the face.

## Typography

Newsreader and Bodoni Moda are bundled as local regular and italic variable fonts, with their SIL Open Font Licenses in `fonts/`. Newsreader supports weights (200–800); Bodoni Moda supports (100–900). Controls use Segoe UI, Arial, and sans-serif fallbacks. There are no raster UI assets or external font requests.

Heritage uses Newsreader for its greeting, masthead, scores, and end heading. Velocity pairs a compact sans-serif greeting with large Newsreader round lettering; its masthead is italic. Wildcard combines a Newsreader opening line with oversized italic Bodoni Moda emphasis. Its end heading and totals use italic Bodoni Moda, but its arrow-slot digits use Newsreader at the final built override. Italic style and numeric features are captured in the sidecar because they are outside the frontmatter typography fields.

The frontmatter records the main built hierarchy. Supporting text is generally (10–13px); arrow labels are (10px), navigation labels (10px) or (9px) in Velocity, and sample disclaimers (9px). Scores and table values use tabular numerals. These are observed prototype values, not evidence of enlarged-text or platform certification.

## Layout

The comparison shell has a maximum width (1450px), three equal columns, horizontal padding (40px), and the comparison gap recorded above. At (861–1100px) it reduces shell gutters to (24px), gaps to (20px), and selected phone gutters to the compact value. At (860px) and below it stacks the previews in one column inside a maximum width (480px). At (350px) and below it reduces internal gutters, arrow gaps, and selected heading sizes.

Phone previews are flex columns with height (830px), increased to (850px) above (1600px). Toolbars and docks remain outside the scrolling work area. Solo views hide the presentation shell, cap width at (480px), remove the frame radius, and use height (100dvh) with minimum height (560px).

Arrow slots and score keys use three equal columns. Miss spans two key columns. Detail headings and their return links wrap with gaps (10px 12px), preserving narrow layouts. Tables align scores right and the end label left. The local sample has ten ends with three arrows each.

## Elevation & Depth

The proposals use flat color regions, hairline borders, and typography rather than box shadows. Heritage's rules separate content; Velocity's orange panel and dark dock supply hierarchy; Wildcard's curved cream regions supply separation. The phone frame is a comparison device with a (1px) outline, not production chrome. A temporary score layer sits above content during Velocity's score feedback.

## Shapes

Heritage uses nearly square score controls and a circular resume action. Velocity rounds slots, keys, and the navigation dock, with an asymmetric lower corner on its resume panel. Wildcard retains rectangular controls with modest rounding and uses larger asymmetric curves on history, scoring, and detail regions. Exact radii live in the frontmatter. SVG icons use round caps and joins with stroke width (1.6); no raster assets are used.

## Components

### Buttons

The three circular resume controls share a right-arrow icon. Velocity and Wildcard rotate their controls (-35deg); Heritage keeps the arrow level. Main next actions have minimum height (52px), full width, and clear disabled states. Heritage and Velocity use orange with dark text; Wildcard uses aubergine with cream text. Hover colors and the pressed brightness factor (.93) are captured in the sidecar.

### Score entry

Slots show three labeled arrows. The next slot uses a rule and underscore in Heritage, an orange outline in Velocity, and an aubergine fill in Wildcard. Keys show X, ten through six, Miss, and Undo. Filled arrows can be cleared; Undo removes the last filled arrow. X counts ten and increments the X count; Miss counts zero.

The record action updates sample state immediately. Heritage's numeral uses a brief opacity, blur, and scale impression (220ms). Velocity's score travels from key to slot (340ms). Wildcard's numeral settles from a rotated, raised impression (310ms). Navigation fades and moves the work area slightly (200ms). The shared arrival easing is `cubic-bezier(.16,1,.3,1)`. Reduced motion uses an opacity acknowledgment (100ms) and suppresses travel, rotation, and scale. Navigation, subsequent input, hidden state, and preference changes cancel active effects. The finite demo waits (650ms), then enters one nine; it is user initiated and interruptible.

### Cards / Containers

Heritage's resume summary is separated by top and bottom rules. Velocity's orange resume panel is a distinct filled region. Wildcard's cream history section has an asymmetric top-right curve. No shadow layer is used. Recent rounds are ruled rows with score and X count aligned at the trailing edge.

### Inputs / Fields

The sample new-round form uses a native select and a read-only archer input. Both have minimum height (48px), a thin rule border, sheet background, and modest rounding. These are sample controls; no field validation or error appearance is established.

### Navigation

All proposals show Home, History, Analytics, and Archers. Heritage uses a light paper bar, rust active state, and a small active dot. Velocity uses an inset dark dock and peach active state. Wildcard uses cream with rust active navigation. Focus has a visible accent outline (3px), inset with offset (-4px) within phones. Ends use a separate numbered strip with disabled future ends and a contrasting current end.

### Tables and target

Scorecards show all ten ends, running total, and X count. The current end has a tint background. The target is the existing app SVG geometry; sample positions illustrate scores and do not represent recorded arrow plots.

## Do's and Don'ts

### Do:
- **Do** treat Heritage, Velocity, and Wildcard as separate exploratory proposals.
- **Do** retain dark ink text over orange and the true target scoring colors.
- **Do** keep score updates immediate and motion finite, cancellable, and reduced-motion aware.
- **Do** preserve sample labels, local fonts, scrolling work areas, and wrapping detail headings.

### Don't:
- **Don't** promote these tokens into the production design system before a direction is selected.
- **Don't** treat sample names, dates, scores, or plots as user records.
- **Don't** claim production storage, file operations, archer management, or recorded plotting from this prototype.
- **Don't** interpret this source capture as Android performance, enlarged-text, or accessibility certification.
