# Scorebook, three ways

Open `index.html` for the comparison. **Home**, **Scoring**, and **Scorecard** switch all three studies together. **Play scoring demo** starts from the sample fourth end, then records a nine with the treatment unique to each direction. It is finite, repeatable, and stops on another interaction or when the document becomes hidden.

**Heritage** is the refined/classic proposal: warm paper, brown ink, Newsreader editorial lettering, fine rules, and a circular orange resume action. Score feedback uses a restrained ink impression.

**Velocity** is the modern/flashy proposal: an orange resume panel, warm ivory, a dark navigation dock, larger typographic contrast, and a score that visibly travels from key to slot.

**Wildcard** is the adventurous proposal: orange and aubergine, oversized italic Bodoni Moda, an asymmetric cream section, and a brief typographic impression when recording a score. Navigation and numeric controls retain familiar shapes.

All three provide in-memory scoring, clearing, undo, end navigation, a live scorecard, two complete sample historical rounds, a sample new-round flow, and illustrative Vegas plots. X counts ten and adds an X; a miss adds zero. The sample starts with 108 points and 6 Xs; entering nine produces 117 points and 6 Xs.

The studies never read or write the production application's local storage. Refresh resets the sample. Archers, analytics, backup/export, and plotting are visual demonstrations, not complete production features. The target reuses the app's accurate gold/red/blue face. A prototype direction has not been selected for production.

## Typography and assets

Fonts are locally bundled, with the original SIL Open Font Licenses alongside them:

- Newsreader regular and italic: `google/fonts`, `ofl/newsreader`.
- Bodoni Moda regular and italic: `google/fonts`, `ofl/bodonimoda`.

Each was sourced from the upstream Google Fonts repository. No external font, image, animation library, shader, WebGL context, or runtime network connection is needed. The only imported app code is the existing target geometry module.

## Motion and access

Score entry is immediate. Effects use bounded, cancellable Web Animations; no perpetual animation or audio. Reduced motion removes travel, rotation, and scaling while keeping a short opacity acknowledgment. Keyboard entry retains focus, and finishing an end moves focus to Next end. Navigation, hidden state, and reduced-motion changes cancel active effects.

The comparison is responsive; full-size links give the phone viewport. Small-height scoring content scrolls while the action dock stays reachable. These are browser prototypes, not an Android performance certification.
