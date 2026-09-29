# ACI Division — Motion Graphics Storyboard (Part 1: slides 1–4)

Runtime ≈ 3:06 · 1920×1080 · 60 fps · narration = the deck's own audio (mastered), word-synced.

## Design principles (from the brief)

| Principle | How it is applied |
|---|---|
| **Temporal alignment** | Every reveal is keyed to the *spoken word*, not to a hand-typed time. `data/narration.json` holds word-level timings (offline ASR + onset snapping); scenes look words up by text (`cue(4, 'Andrew Lim')`) and animate ~0.1 s *ahead* of the onset so eye and ear land together. |
| **Auditory restraint** | Six procedural sound types only (drop, soft pop, whoosh, chime, tick, low swell), each placed on a focal moment, mixed 18–26 dB under the voice. A near-subliminal pad fills pauses and ducks under speech. |
| **Functional abstraction** | Slides were text walls and screenshots. The video rebuilds them as mechanisms: the org chart becomes a tree a light pulse travels down; domains are explained by animated instrument icons (a chromatogram drawing its peaks, X-ray diffraction rings, an NMR spin decaying); services and responsibilities orbit a hub. |
| **Visual continuity** | One motif runs through everything: **the well** (a circle, from the microplate on the title slide). A drop lands in a well → the lit wells become the letters "ACI" → the letters collapse to a dot → the dot *is* the ACI node in the org chart → it divides into the three domain circles → those colours carry into the team columns → the columns fold back into the resource hub. Every cut is a shape match. |

## Visual system

- **Palette** — deep navy ink (`#050817 → #0B1236`), brand gradient blue `#3A63FF` → violet `#7B3BF0` → magenta `#E0287A`, star red `#FF3B45`. Domain colours keep the deck's coding: Chromatography / MS **blue** `#3F8CFF`, X-Ray **orange** `#FF6B3D`, NMR / Physical / Thermal **green** `#2BD17E`.
- **Type** — Space Grotesk (display), Inter (body), JetBrains Mono (technical labels / HUD).
- **Texture** — slow drifting colour fields, a faint microplate dot-grid, vignette and film grain (grain also stops gradient banding after YouTube compression).
- **HUD** — chapter tag top-left (`02 · Where ACI sits`), ISCE² logo top-right, as in the deck.

## Beat sheet (global time, s)

### 1 · Welcome (0 – 9.4) — slide 1
| t | Narration | Picture |
|---|---|---|
| 0.0 | — | Perspective microplate fades up; pipette tip descends, a drop forms. |
| 2.1 | — | Drop falls → lands in the centre well (**drop SFX**). Ripple lights the wells outward in the brand gradient. |
| 2.95 | "Welcome to" | Small caps line fades up. |
| 3.64 | "ACI" | Lit wells lift off the plate and fly into the letterforms **ACI** (**chime**). |
| 4.85–6.5 | "Advanced Characterization and Instrumentation" | Full name reveals word by word; **A**, **C**, **I** are tinted and connected to the big letters by thin leader lines — the acronym is explained visually. |
| 8.3 | — | Letters collapse into a single glowing dot — the ACI node (**whoosh**). |

### 2 · Where ACI sits (9.2 – 37.3) — slide 2
| t | Narration | Picture |
|---|---|---|
| 9.5 | "Before introducing ACI…" | The ACI dot idles centre-screen. |
| 14.7 | "…the ISCE² organisational structure" | Root node **ISCE²** appears; the tree grows: 5 leadership nodes → 13 division pillars (drawn as lines growing). |
| 19.5 | "…where ACI sits within the Institute" | A light pulse runs from the root down the branch to ACI (**tick** on arrival); everything else dims. |
| 22.5–25.6 | "ACI is led by our Division Director, Andrew Lim" | Camera pushes into the ACI pillar; it becomes a portrait card (**pop**). |
| 29.6 / 31.0 / 32.9 | "our team… analytical capabilities… shared scientific resources" | Road-map: three chips branch out, one per phrase: 01 Our team, 02 Analytical capabilities, 03 Shared resources. |
| 35.8 | — | Chips fold back into the ACI dot. |

### 3 · What ACI does (37.0 – 90.2) — slide 3
| t | Narration | Picture |
|---|---|---|
| 39.4 | "three technical domains" | The ACI circle divides (mitosis) into three coloured circles. |
| 41.3 | "chromatography and mass spectrometry" | Blue card: chromatogram peaks draw, m/z bars rise. |
| 43.8 | "X-ray spectroscopy and microscopy" | Orange card: beam → lattice → diffraction rings. |
| 46.3 | "NMR, physical and thermal characterisation" | Green card: precessing spin + decaying FID + heating curve. |
| 50.1–55.3 | "…manage a broad range of shared scientific resources" | Cards dock at the top; a pool of real instrument nodes (LC-MS, XPS, TEM, NMR, DSC…) cascades in, wired to all three domains. |
| 56.8 / 60.0 / 62.1 | "analytical & characterisation support… technical training… research community" | Particle streams flow from the pool to a research-community cluster; tags ride the streams. |
| 65.4–70.3 | "internal R&D… extend our capabilities to industry partners" | An ISCE² boundary encloses the system; one stream breaks through it to *Industry partners*. |
| 72.8–78.8 | "material characterisation, failure diagnostics, method development, consultancy and collaboration" | 2×2 service tiles, each with its own mechanism: scanned lattice, crack under a loupe, iterate-loop, two circles merging. |
| 83.4–88.0 | "practical analytical solutions… research and industry needs" | Tiles fold into one statement that forks into *Research* and *Industry*. |

### 4 · Our team & shared resources (89.8 – 186) — slide 4
| t | Narration | Picture |
|---|---|---|
| 92.4 / 94.9 | "Division Director, Andrew Lim… Ong Li Li… Deputy Director" | Leadership cards land on the management row. |
| 99.6–103.6 | "three technical domains, each led by our respective domain lead" | Three colour columns rise (same colours/icons as scene 3) with empty lead slots. |
| 104.6–114.0 | Chromatography / MS: Ong Wai Chung; Ng Fu Song, Tan Kuan Yi | Camera focuses column 1; lead then specialists pop in on their names. |
| 114.8–129.8 | X-Ray: Angeline Seo; Wang Zhan, Chia Sze Chen, Cao Xun — XPS, XRD, TEM | Column 2; specialty badges clip onto each card exactly on "XPS", "XRD", "TEM". |
| 130.8–141.6 | NMR / Physical / Thermal: Ong Li Li; Yeo Wen Cong, Kuan Kai Cong | Ong Li Li's card *flies down* from management into the lead slot (her dual role is shown, not told). |
| 142.3–151 | "…managing shared scientific resources across the Institute" | Team folds into a hub; an outer ring of institute labs wires up to it. |
| 154–167 | booking · utilisation & charging · demand aggregation · systems refresh · lifecycle · digitalisation & sustainability | Six responsibility nodes land on the orbit, each with a working icon (calendar tick, gauge, converging arrows, refresh loop, lifecycle ring, chip + leaf). |
| 173–176 | "managed, optimised, and kept relevant" | Three outcome checks. |
| 179.6 | "…across the Institute" | Pulses travel hub → every lab on the ring. |
| 181–186 | — | End card: ACI wordmark + ISCE² logo. |
