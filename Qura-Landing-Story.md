# Qura Landing Page — Scroll Story (as built)

A temporary badge in the bottom-left corner of the page shows the scene number while we review. It is marked `TEMP` in `index.html`, `css/styles.css` and `js/main.js`, so it is easy to remove before launch.

| # | Scene | Background | What happens in 3D |
|---|-------|-----------|--------------------|
| **0** | **Hero:** "Every *clinician / tender / vacancy / supplier / decision-maker.* Connected." | Clinical white | A moving pearl orb (the Qura core) with 6 platform cards orbiting it in 3D, plus thin orbit rings |
| ↓ | *Transition* | — | Scrolling lifts the hero copy away; the orb breaks apart into particles |
| **1** | **Ecosystem:** "Three communities. *One connected* healthcare sector." plus 4 stats | Clinical white | The particles form a turning network sphere with connecting lines |
| **2** | **Fragmented:** "Healthcare is *fragmented.*" → "Roles here. Tenders there." → "Hours lost to… *stale data.*" | Cool grey-blue | The sphere bursts and 8 glass fragment cards fly out. The particles then **spread and leave the screen**, leaving **only the cards** |
| **3** | **Verified:** "Get verified once. *Be seen everywhere.*" | Mint | The fragment cards fly into the verified profile card (with the sonographer photo); the checks tick and the *Verified* stamp lands |
| **4** | **Night:** "Working *while you sleep.*" | **Night** navy | A large paper **overnight handover sheet** (clipboard, timed log, ticks, one item stamped *Review first*) floats beside the copy; its lines fill in one by one |
| **5** | **Day:** "New roles in your inbox. *Every morning.*" (SEND and care) | **Sunrise** peach | A large **email** from *Qura Morning Digest* (07:00, 14 new SEND & care roles, 3 marked *Matches you*) floats beside the copy; the roles slot in one by one |
| **6** | **See the market moving** (film + live marketplace) | Pale blue-grey | Pinned scroll: the video frame swings up from a 3D tilt to flat, the five lens chips pop in and the play button lands, while the dark **live marketplace** board slides in from the right and new tenders keep arriving. The video file goes in `assets/qura-overview.mp4` |
| **7** | **One platform. *Three ways forward.*** | White | Three photo cards (professionals, providers, workforce suppliers) rise in 3D one after another; the photos settle as you scroll |
| **8** | **Join:** "12 months of Qura Growth, *free.*" | White with a teal tint | The opening Qura core returns, cropped at the right edge. Three connection paths draw towards it during a short, unpinned scroll reveal; the offer and actions appear, then the core settles. App downloads stay in the footer. |

**Rules:**
- **Particles appear only in scenes 0–2.** They leave the screen during scene 2 and are not used again on the landing page.
- No podium/platform anywhere (removed after feedback). Scene panels float on their own.
- The closing core shares the opening orb's geometry and shader. Its movement follows scroll progress and stops when the reveal completes; reduced motion shows the finished closing state.
- The founders section lives on the separate "Our story" page (`story.html`), which is not built yet.

## Still to do
- Real Qura logo (the orb in the nav is a stand-in).
- A front-facing clinician photo, if one becomes available (currently `assets/clinician-sonographer.webp`, taken from the current site).
- Build `story.html`.
- Remove the TEMP scene badge before launch.

## Files
- `index.html`: structure and copy
- `css/styles.css`: clinical white design system
- `js/scene.js`: 3D (orb hero, particles for scenes 0–2, floating glass panels, background colours)
- `js/main.js`: scroll timelines, intro, scene badge
