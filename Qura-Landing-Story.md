# Qura Landing Page — Scroll Story (as built)

The scene numbers below are how we refer to each part of the page (the on-page number badge used during review has been removed).

| # | Scene | Background | What happens in 3D |
|---|-------|-----------|--------------------|
| **0** | **Hero:** "Every *clinician / tender / vacancy / supplier / buyer.* Connected." | Clinical white | **Three woven glass rings**, atom-style (three long ellipses at 0°, 60°, 120° weaving over and under; clinicians, providers, suppliers), rigid pearly glass, swaying and turning in their own plane; 6 platform cards orbit them in 3D, plus thin orbit rings. A beating glass heart + ECG variant is kept in code (`HERO_SHAPE` in `js/scene.js`) |
| ↓ | *Transition* | — | Scrolling lifts the hero copy away; the rings break apart into particles that keep their shape, then form the globe |
| **1** | **Ecosystem:** "Three communities. *One connected* healthcare sector." plus 4 stats | Clinical white | The particles form a turning network sphere with connecting lines |
| **2** | **Problem → fix → how** (one long pinned scroll). Act 1: "Healthcare is *fragmented.*" then "Clinicians go *unseen.* / Providers post roles *into the void.* / Suppliers chase *stale contacts.*" Act 2: "Qura puts it *back together.*" Act 3: "One verified profile. One live marketplace. **One CRM that knows who decides.**" | Cool grey-blue | Act 1: 8 glass cards scatter and each gets a red-ink problem stamp (*Unverified*, *Who saw it?*, *Email unknown*…); the particles spread and leave. Act 2: the cards fly into a three-column board (Clinicians · Providers · Suppliers) and flip in 3D to their fixed side (*NMC registration verified*, *Matched to 3 suppliers*…). Act 3: columns are named after the module that fixed them: **Verified profiles · Live marketplace · Growth CRM**. As the page moves on, the board scrolls away and only the nurse's card flies into the verified profile (scene 3). Phones: 2 × 4 board, no column labels |
| **3** | **Verified:** "Get verified once. *Be seen everywhere.*" | Mint | The nurse's fixed card from scene 2 flies into the verified profile card (with the sonographer photo); the checks tick and the *Verified* stamp lands |
| — | **Founding Partner offer banner** (not a numbered scene): "Join by 31 December. Get 12 months of our top plan, *free.*" | Mint (inherits scene 3) | A wide card rises in with a slow light sweep; buttons: Become a Founding Partner, Book a demo |
| **4** | **Night:** "Working *while you sleep.*" | **Night** navy | A large paper **overnight handover sheet** (clipboard, timed log, ticks, one item stamped *Review first*) floats beside the copy; its lines fill in one by one |
| **5** | **Day:** "New roles in your inbox. *Every morning.*" (SEND and care) | **Sunrise** peach | A large **email** from *Qura Morning Digest* (07:00, 14 new SEND & care roles, 3 marked *Matches you*) floats beside the copy; the roles slot in one by one |
| **6** | **See the market moving** (film + live marketplace) | Pale blue-grey | Pinned scroll: the video frame swings up from a 3D tilt to flat, the five lens chips pop in and the play button lands, while the dark **live marketplace** board slides in from the right and new tenders keep arriving. The video file goes in `assets/qura-overview.mp4` |
| **7** | **One platform. *Three ways forward.*** | White | Three photo cards (professionals, providers, workforce suppliers) rise in 3D one after another; the photos settle as you scroll |

**Rules:**
- **Particles appear only in scenes 0–2.** They leave the screen during scene 2 and are not used again on the landing page.
- No podium/platform anywhere (removed after feedback). Scene panels float on their own.
- The founders section lives on the separate "Our story" page (`story.html`), which is not built yet.

## Still to do
- Real Qura logo (the orb in the nav is a stand-in).
- A front-facing clinician photo, if one becomes available (currently `assets/clinician-sonographer.webp`, taken from the current site).
- Build `story.html`.

## Files
- `index.html`: structure and copy
- `css/styles.css`: clinical white design system
- `js/scene.js`: 3D (orb hero, particles for scenes 0–2, floating glass panels, background colours)
- `js/main.js`: scroll timelines, intro
