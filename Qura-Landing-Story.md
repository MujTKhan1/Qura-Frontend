# Qura Landing Page — Scroll Story (as built)

A temporary badge in the bottom-left corner of the page shows the scene number while we review. It is marked `TEMP` in `index.html`, `css/styles.css` and `js/main.js`, so it is easy to remove before launch.

| # | Scene | Background | What happens in 3D |
|---|-------|-----------|--------------------|
| **0** | **Hero:** "Every *clinician / tender / vacancy / supplier / decision-maker.* Connected." | Clinical white | A moving pearl orb (the Qura core) with 6 platform cards orbiting it in 3D, plus thin orbit rings |
| ↓ | *Transition* | — | Scrolling lifts the hero copy away; the orb breaks apart into particles |
| **1** | **Ecosystem:** "Three communities. *One connected* healthcare sector." plus 4 stats | Clinical white | The particles form a turning network sphere with connecting lines |
| **2** | **Fragmented:** "Healthcare is *fragmented.*" → "Roles here. Tenders there." → "Hours lost to… *stale data.*" | Cool grey-blue | The sphere bursts and 8 glass fragment cards fly out; the podium rises. The particles then **spread and leave the screen**, leaving **only the cards** |
| **3** | **Verified:** "Get verified once. *Be seen everywhere.*" | Mint | The fragment cards fly into the verified profile card (with the sonographer photo); the checks tick and the *Verified* stamp lands |
| **4** | **The market never sleeps** | Pale sky | The **live marketplace board** stands on the podium as a glass panel |
| **5** | **Know who decides** | Periwinkle | A glass **Growth CRM pipeline** panel with a named decision-maker stands on the podium |
| **6** | **Working while you sleep** | **Night** navy | A dark glass **92% AI match** panel, with an overnight activity log; the podium glows |
| **7** | **Every morning** (SEND and care) | **Sunrise** peach | A glass **07:00 morning digest** panel; its rows arrive one by one |
| **8** | **One platform. *Three ways forward.*** | White | Three cards: clinicians, organisations, suppliers |
| **9** | **Join:** "12 months of Qura Growth, *free.*" | White with a teal tint | The camera rises to look straight down on the podium's glowing rings |

**Rules:**
- **Particles appear only in scenes 0–2.** They leave the screen during scene 2 and are not used again on the landing page.
- The podium arrives in scene 2 and stays until the end.
- The founders section lives on the separate "Our story" page (`story.html`), which is not built yet.

## Still to do
- Real Qura logo (the orb in the nav is a stand-in).
- A front-facing clinician photo, if one becomes available (currently `assets/clinician-sonographer.webp`, taken from the current site).
- Build `story.html`.
- Remove the TEMP scene badge before launch.

## Files
- `index.html`: structure and copy
- `css/styles.css`: clinical white design system
- `js/scene.js`: 3D (orb hero, particles for scenes 0–2, podium, glass panels, background colours)
- `js/main.js`: scroll timelines, intro, scene badge
