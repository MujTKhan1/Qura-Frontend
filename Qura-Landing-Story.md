# Qura Landing Page — Product-led redesign (branch `redesign/product-led`)

References: **Attio** (opening composition, fine rules, product-led progression) · **Pipedrive** (clear positioning and actions) · **HubSpot** (photographic audience panels).

| # | Section | Motion |
|---|---------|--------|
| 1 | **Hero:** "Every *clinician / tender / vacancy / supplier / buyer.* *Connected.*" (rotating word, as on the original site), Join Qura free / Book a demo, "Built for" row | The word changes every 2.6 s; the line re-centres smoothly |
| 2 | **Audience panels:** Clinicians · Healthcare organisations · Suppliers & agencies | Panels expand on click, hover or arrow keys (ARIA tabs). Each shows its outcome, an action and a product preview. Photos come from qurahealth.org |
| 3 | **Film:** "See the market *moving.*" plus the real 98 s platform film (`qurahealth.org/qura-every-lens-98s.mp4`) | The frame settles to full size on arrival. The film plays only on click, with custom controls, and pauses when it scrolls out of view |
| 4 | **Problem → fix → how** (in the original site's style). "Healthcare is *fragmented.*" → "Clinicians go *unseen.* / Providers post roles *into the void.* / Suppliers chase *stale contacts.*" → "Qura puts it *back together.*" → "One verified profile. One live marketplace. **One CRM that knows who decides.**" | Pinned for 3 screens. 8 glass cards scatter and get red ink stamps, then fly into a three-column board and flip in 3D to their fixed side. The columns are then named Verified profiles · Live marketplace · Growth CRM |
| 5 | **Night → morning:** "Working *while you sleep.*" → "Start your day with a *clearer picture.*" | Pinned ~2.1 screens. The night console counts listings and logs work; at 02:14 the *Sonography workforce requirement, Leeds* card is found. The sky and interface turn to morning (clock 02:14 → 07:00), and the same card becomes "Review first" with next actions |
| 6 | **Founding Partner offer:** a large "12 months free"; join by 31 December 2026; clinicians free, always; days-left counter | Reveal |
| 7 | **Proof and close:** RAD Magazine, "Everyone is looking for someone" (22 Sep 2026), plus 32+ / 13,000+ / 3,800+ / 5 from the live site. Final Join / Demo | Reveal |

**Reduced motion:** no pins. The records page becomes a list of fixed cards, each with its original problem struck through ("Before: …"). The night-to-morning section shows the morning briefing.

**Assumptions:**
- The film and photos are loaded from qurahealth.org, not copied into `assets/`.
- Illustrative records are labelled as illustrative.
- There are no testimonials, because none exist in the sources.
- The 3D scene (three.js) from `main` is not used on this branch.

## Files
- `index.html`: structure and copy
- `css/styles.css`: design system and sections
- `js/main.js`: film player, the two pinned sequences, panels, reveals
