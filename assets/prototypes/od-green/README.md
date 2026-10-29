# Orange and OD green

Open `index.html` for three interactive design studies. Home, Scoring, and Scorecard compare the same content across every direction. Open full size shows one study at the browser viewport.

- **Heritage / OD:** green masthead and navigation, warm paper, Newsreader lettering, orange resume seal.
- **Velocity / OD:** a larger green round panel, orange actions, compact green navigation, and score-entry travel.
- **Fieldwork:** a new wildcard with deep green, bold Barlow Condensed lettering, and a cream score sheet showing actual sample-end values. Resume round morphs that sheet into the score header when the View Transitions API is available. Otherwise it opens normally. Reduced motion disables the morph and paper tilt.

The studies inherit their base styling and locally licensed fonts from `../scorebook-remix/`, plus the existing local Barlow font. `od.css` contains the OD proposals; `od.js` is an isolated copy of the prototype engine with the new content and interaction. Earlier studies and production files are untouched.

Scores are sample data in memory. X scores ten and adds an X; a miss scores zero. The sample begins at 108 points and 6 Xs; a nine produces 117 points and 6 Xs. History rows open matching sample scorecards. Score entry, clearing, undo, end navigation, a new sample round, and illustrative plots work. Data is never written to production storage. Refresh resets samples. Backup/export and archer management are visual placeholders.

Target rings remain accurate Vegas gold/red/blue. These proposals do not recolor target semantics into the branding palette.

No runtime network, audio, perpetual animation, or WebGL context is used. Browser checks are not real-phone performance certification. No production design direction has been selected.
