# Ranch Horizon maintained source and delivery

`ranch-source.png` is the exact frozen 512 × 512 original artwork embedded in the old ranch icon and the approved Ranch Horizon prototype. It includes original sky/mark content outside the chosen crop; no standalone raw aerial photograph is available. The maintained composition crops the aerial below those original marks. Never replace this input with a branded export or generate a substitute landscape.

Frozen source SHA-256: `a81e5cda39728ad27a526366565280a16c286db39fd4650e1734d4304be2dc25`.

`ranch-horizon.svg` is the maintained 128 × 128 selected composition. It references the frozen artwork directly: solid OD upper field, original aerial below y=49 (source viewBox 48 200 416 280), cream aiming arcs, and orange arrow. Historical prototypes remain reference evidence under `assets/prototypes/ranch-brand/marks/`; they are never generator inputs.

## Reproduce

1. Install the pinned project dependencies with `npm ci`.
2. Install the project's Playwright Chromium once with `npx playwright install chromium` (or point `PLAYWRIGHT_BROWSERS_PATH` at the existing installation).
3. Run `npm run brand:raster` from the repository root. Review the generated files and commit them together with `exports.json`.
4. Run `npm run brand:check`, `npm test`, and `npx playwright test --config playwright.delivery.config.js`.
5. Run `npm run sync` for the Android web bundle. Normal CI builds consume committed PNGs and run the pure-Node export verification; they do not need Playwright's browser download.

`node scripts/brand-web.mjs` builds the self-contained production SVG from the maintained arrangement and frozen source. Every raster export starts from these same source inputs. The generator splits only the master's top-level vector foreground and photographic background for native/maskable output; it never reads a previously generated logo as image input. The existing legacy splash dimensions are retained when regenerating those resources.

`exports.json` records the frozen-source, composition, generator and output SHA-256 values, plus the renderer version. Text hashes normalize CRLF to LF so the guard works on Windows and Linux. Changing the source, composition, generator, or any recorded output makes `brand:check` and the Android web build fail until the outputs are regenerated and reviewed. Chromium upgrades may change raster encoding; use the recorded renderer when byte-for-byte reproduction matters.

## Native framing

Android adaptive backgrounds carry the full-bleed original aerial crop and OD upper field. A separate transparent 108dp foreground places the orange arrow and cream arcs in a centered 64dp composition, inside Android's guaranteed 66dp safe circle. Native XML references the real layers directly, without a second inset. All six existing density families include launcher, round, foreground and background PNGs. Legacy launcher icons retain the selected full composition; round outputs have transparent outer corners. Web maskable output keeps the aerial full-bleed and draws the foreground at 80% scale for its central safe circle.

The startup icon is a static 432px Ranch Horizon mark with the source aerial included. Legacy portrait, landscape and night splash outputs use OD and the same selected mark. Android system colors use OD, orange and warm paper. No extra startup animation or hold is introduced.

## Verification and limits

Artifact tests decode committed PNGs to check native layer dimensions, arrow safe placement and photographic detail, resolve manifest/startup resources, and compare the Android web bundle with every offline asset. Browser checks perform a genuine offline reload with the logo, icons and local Newsreader fonts, retain saved-round navigation, reject incomplete asset updates, and defer a completed update until the real Vegas completion dialog exits.

Application ID `com.ropersarchery.scorecard`, namespace, signing configuration, build-number policy, storage keys and backup schema are unchanged. A built APK's manifest version, source identity and signature must still be checked against its CI build before sharing it. A physical Pixel 10 Pro / Android 17 launcher, startup and update/data-preservation check remains required when the phone is available; browser masks and artifact checks are not a device observation.
`node scripts/brand-web.mjs` also generates `ibo-scorer/icons/ranch-aerial.svg` for Ranch Window Home from the same frozen image with viewBox `48 200 416 280`. It is a photograph-only crop, not a re-crop of a generated branded icon.
