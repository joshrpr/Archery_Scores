# Home → scoring motion studies

Throwaway comparison, not production navigation. Run `npm run prototype:transitions` and open http://127.0.0.1:4191/.

Question: should entry into a round feel like the selected surface becomes the score sheet, or like moving one level deeper into the app?

- `?variant=surface`: 520ms connected surface and travelling Vegas label; source control reshapes into scoring header.
- `?variant=slide`: 380ms horizontal score sheet with a small Home retreat; reverses on Back.
- Slow motion: 2.5× duration. Previous/next buttons and left/right keyboard keys switch variants.
- System reduced motion uses a 120ms crossfade. Append `&motion=reduced` to inspect that alternative explicitly.

Reference: https://www.facebook.com/reel/1652152576488439 — observed publicly after dismissing the login overlay. The card remains a visual anchor while its surrounding view changes. These studies interpret that continuity rather than reproduce its banking interface.

The local server renders actual `viewHome`, `mainNavigation`, and `viewRound` functions in a build-time sandbox with a clearly labelled sample round. The browser receives static markup and prototype motion only: no application boot, local storage, service worker, or score mutations. Start skips the preconfigured setup to isolate the requested transition. Resume exercises the same motion from the olive card.

Assets and styles come from the existing app. All prototype files stay outside the APK/web build input.

Verdict (2026-10-30): the user selected Surface Continuity and authorized implementation. Capture this comparison on `codex/prototype-surface-continuity`, linked from issue #27. Production rebuilds only that motion in the real router, retains actual setup, and omits the comparison and its launcher command.
