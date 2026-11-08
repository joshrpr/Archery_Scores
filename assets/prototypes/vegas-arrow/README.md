# Vegas arrow appearance prototype

Question: Does the agreed carbon arrow read as a physical object in close-up and at phone size?

Run from the repository root:

```sh
node scripts/preview-arrow-study.mjs
```

Open the printed local address. Alternatively, open `index.html` in Chrome. The prototype loads its pinned Three.js module and fonts from public CDNs, so it needs an internet connection. It reads and writes no score data.

Inspection views of the same design:

- `?variant=fletching`: curved orange/ivory vanes, ivory wrap, cylindrical carbon shaft.
- `?variant=nock`: open string groove and translucent orange polymer.
- `?variant=contact`: paper puncture, fibers, and cast shadow.

The rotation control turns the actual model in both views. Left/right keys cycle inspection views when a control is not being edited. The phone reference remains visible throughout.

Scope: static appearance only. Flight, shaft flex, camera choreography, earlier arrows, scorecard actions, and production integration belong to later passes. Scores are illustrative. Geometry is an authored branded arrow, not a claim to reproduce a specific manufacturer's equipment.

The single Vegas scoring spot uses gold 10/9, red 8/7, blue 6, and the inner X ring. The target is cream paper over dark foam. The reference uses the approved dusk palette.

Status: the user approved the arrow appearance and requested the next prototype stage. Keep the approved appearance study as its own reference. `assets/prototypes` is outside the `ibo-scorer` folder copied into the Android bundle.

## Impact study

Run `node scripts/preview-arrow-study.mjs --impact`, or open `impact.html` directly in Chrome. The appearance study remains at `/index.html` and the motion study at `/impact.html`.

Question: Does the same arrow enter, penetrate, bend around a fixed paper entry point, and settle convincingly?

- A 1.6-second excerpt, separate from the full celebration choreography.
- Flight begins at 180 ms; first contact at 420 ms; penetration finishes at 460 ms; the visible flex damps out before 980 ms.
- The approved cylindrical shaft is subdivided and bent along a continuous centerline. The wrap, vanes, and nock follow the centerline tangent; the arrow does not rotate as a rigid prop.
- The centerline is anchored at the paper plane during penetration and flex. Mesh vertices and normals are rebuilt from the rest pose at every sampled time, so seeking does not accumulate deformation.
- The paper tear appears on contact with small fiber movement and a restrained copper pulse. Both views show the same sampled state.
- Normal, half, and quarter speed; pause/resume; scrubbing; first-contact, peak-flex, and settled checkpoints. Target, flex close-up, and paper-contact camera angles are fixed during playback.
- Reduced motion opens on the settled state and uses manual seeking. Playback stops when the page is hidden or the study leaves the viewport. No loop, audio, or score-data mutations.

The bend and timing are authored for visual evaluation, not a simulation of a particular arrow's spine or impact speed. The results card is a static scale reference. The full camera transition, earlier arrows, results choreography, and production integration remain later stages.

Impact status: approved by the user, who requested the full-sequence prototype next.

## Full celebration

Run `node scripts/preview-arrow-study.mjs --celebration`, or open `celebration.html` directly in Chrome. The first two studies remain available as references.

Question: Does the approved arrow and impact flow naturally into the camera docking and results reveal within 3.6 seconds?

- 0–600 ms: approach a target with the previous 29 arrows already embedded.
- 760–1,000 ms: the final arrow enters. The approved impact and damped bend are shifted to the new first-contact time of 1,000 ms.
- 1,500–2,600 ms: the physical camera pulls back and aligns behind the shafts. Lens shift docks the target into the upper part of the screen; it does not translate the camera away from alignment with the arrows. Arrows remain the same physical objects throughout.
- 2,600–3,600 ms: results rise in, the score counts from 88% to its total, the standings appear, and the scorecard action becomes available.
- Previous arrows use instanced geometry and simpler distant materials; the final arrow keeps the approved full material and geometry treatment. The earlier-arrow checkbox isolates the last arrow for inspection.
- The 30-arrow illustrative round is now 296 points / 7 Xs. These values are calculated from the displayed hit coordinates with the same 0.4 cm line-cutter allowance as the app. The wider sample group leaves plausible room for the shafts. The sample has not been taken from any stored user round.
- Replay, pause/resume, normal/half/quarter speed, timeline seeking, four checkpoints, instant skip, and a local sample scorecard. Reduced motion opens on the completed state. Playback stops when hidden or offscreen.

Scope: visual prototype only. No app routes, scoring data, storage, native haptics, or production bundling are changed. The renderer and timing still require real-device profiling before production integration.

Full-sequence status: awaiting visual feedback.

## Rapid-fire revision

The user refined the choreography: recap the earlier shots rapidly, one at a time, with less visual weight; reserve the full animated impact for the final arrow.

Run `node scripts/preview-arrow-study.mjs --rapid-fire`, or open `rapid-fire.html`. The earlier full-sequence prototype remains available for comparison.

- Earlier arrows start at 120 ms and arrive every 36 ms. Each gets only a 28 ms seating motion; all 29 are seated by 1,156 ms.
- The recap layer uses 78% model scale anchored around the paper plane, 42% opacity, and no cast shadows. This is an intentional memory-layer treatment, not a claim that earlier arrows use smaller equipment. Recorded hit coordinates are unchanged.
- A brief breath follows. The camera subtly tightens, and the full-strength final arrow flies from 1,320–1,560 ms.
- The final impact retains the approved shaft deformation, penetration, paper fibers, and contact shadow. Only this arrow gets the copper pulse and floating impact label.
- Camera alignment runs from 2,020–2,900 ms. Results reveal from 2,900–3,600 ms. Total normal-speed duration remains 3.6 seconds.
- The replay count, instantiated arrows, paper holes, and last-arrow deformation all rebuild from timeline time. Seeking backward restores earlier counts rather than leaving future arrows visible.
- Normal/half/quarter speed, six inspection checkpoints, instant skip, final-arrow isolation, and the sample scorecard remain available.

Rapid-fire status: animation approved by the user. The large white target background is not approved for the final build; the user explicitly said another prototype is unnecessary for that change.

## Approved direction for implementation

- Preserve the rapid one-by-one recap, quieter earlier arrows, brief breath, and full-strength final-arrow impact. Keep the approved 3D arrow, physical shaft flex, camera alignment, results treatment, and 3.6-second normal duration.
- Replace the large white paper rectangle in the final presentation. Keep the correct Vegas gold/red/blue scoring rings and X ring; use a tighter target crop and dark foam/dusk backing, with minimal exposed paper. This is a final-build requirement, not a request to revise the existing previews.
- No further visual prototype has been requested. Validate the integrated app with real plotted, unplotted, and mixed-entry rounds; misses and edge hits; skip/back/repeated completion; reduced motion; small screens and long standings; and performance on an actual Android phone.
