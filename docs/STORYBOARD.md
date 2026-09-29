# ACI Division — Motion Graphics Storyboard (slides 1–12)

Runtime 10:30 · 1920×1080 · 60 fps · narration = the deck's own audio (mastered), word-synced.

## Design principles (from the brief)

| Principle | How it is applied |
|---|---|
| **Temporal alignment** | Every reveal is keyed to the *spoken word*, not to a hand-typed time. `data/narration.json` holds word-level timings (offline ASR + onset snapping); scenes look words up by text (`cue(4, 'Andrew Lim')`) and animate ~0.1 s *ahead* of the onset so eye and ear land together. |
| **Auditory restraint** | Procedural, deliberately dark sounds only: muffled non-tonal taps (no pitched bleeps), a round low drop, a warm low mallet, air-only whooshes, a low swell. Each sound is low-passed and the SFX bus is low-passed again at 6 kHz; cues sit on focal moments ~18 dB under the voice. A near-subliminal pad fills pauses and ducks under speech. |
| **Functional abstraction** | Slides were text walls and screenshots. The video rebuilds them as mechanisms: the org chart becomes a tree a light pulse travels down; domains are explained by animated instrument icons (a chromatogram drawing its peaks, X-ray diffraction rings, an NMR spin decaying); services and responsibilities orbit a hub. |
| **Visual continuity** | One motif runs through everything: **the well** (a circle, from the microplate on the title slide). A drop lands in a well → the lit wells become the letters "ACI" → the letters collapse to a dot → the dot *is* the ACI node in the org chart → it divides into the three domain circles → those colours carry into the team columns → the columns fold back into the resource hub. Every cut is a shape match. |

## Visual system

- **Palette** — deep navy ink (`#050817 → #0B1236`), brand gradient blue `#3A63FF` → violet `#7B3BF0` → magenta `#E0287A`, star red `#FF3B45`. Domain colours keep the deck's coding: Chromatography / MS **blue** `#3F8CFF`, X-Ray **orange** `#FF6B3D`, NMR / Physical / Thermal **green** `#2BD17E`.
- **Type** — Space Grotesk (display), Inter (body), JetBrains Mono (technical labels / HUD).
- **Texture** — slow drifting colour fields, a faint microplate dot-grid, vignette and film grain (grain also stops gradient banding after YouTube compression).
- **HUD** — chapter tag top-left (`02 · Where ACI sits`), ISCE² logo top-right, as in the deck.

## Beat sheet

Times are indicative (seconds). The code never hard-codes them: every beat is looked up from the spoken word, so re-timing the narration re-times the picture.

### 1 · Welcome (0 – 9.75) — slide 1
| t | Narration | Picture |
|---|---|---|
| 0.0 | — | Perspective microplate fades up; pipette tip descends, a drop forms. |
| 2.1 | — | Drop falls → lands in the centre well (**drop SFX**). Ripple lights the wells outward in the brand gradient. |
| 2.95 | "Welcome to" | Small caps line fades up. |
| 3.64 | "ACI" | Lit wells lift off the plate and fly into the letterforms **ACI** (**chime**). |
| 4.85–6.5 | "Advanced Characterization and Instrumentation" | Full name reveals word by word; **A**, **C**, **I** are tinted and connected to the big letters by thin leader lines — the acronym is explained visually. |
| 8.3 | — | Letters collapse into a single glowing dot — the ACI node (**whoosh**). |

### 2 · Where ACI sits (9.75 – 37.95) — slide 2
| t | Narration | Picture |
|---|---|---|
| 9.5 | "Before introducing ACI…" | The ACI dot idles centre-screen. |
| 14.7 | "…the ISCE² organisational structure" | Root node **ISCE²** appears; the tree grows: 5 leadership nodes → 13 division pillars (drawn as lines growing). |
| 19.5 | "…where ACI sits within the Institute" | A light pulse runs from the root down the branch to ACI (**tick** on arrival); everything else dims. |
| 22.5–25.6 | "ACI is led by our Division Director, Andrew Lim" | Camera pushes into the ACI pillar; it becomes a portrait card (**pop**). |
| 29.6 / 31.0 / 32.9 | "our team… analytical capabilities… shared scientific resources" | Road-map: three chips branch out, one per phrase: 01 Our team, 02 Analytical capabilities, 03 Shared resources. |
| 35.8 | — | Chips fold back into the ACI dot. |

### 3 · What ACI does (37.95 – 90.7) — slide 3
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

### 4 · Our team & shared resources (90.7 – 187) — slide 4
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

### 5 · Our laboratories (182.8 – 233.2) — slide 5
| t | Narration | Picture |
|---|---|---|
| 181.6 | — | The resource hub shrinks into the red location pin (same pin as scene 2). |
| 183–188 | "…where our ACI laboratories are located within the Institute" | A vector redraw of the Level-1 site plan draws itself outward from the pin; the ACI lab strip glows on "ACI laboratories". |
| 190.3 | "Our eight analytical laboratories … level 1" | The strip's eight cells lift out of the plan into a lab stack (count-up), beside the real corridor photo. |
| 199.6 / 204–206 / 212 | "Lab 1-01" · "Labs 1-02, 1-03 and 1-06" · "Labs 1-04 and 1-05" | Each bar fills in its domain colour exactly on its spoken number; a legend builds on each domain name. |
| 213.9–217 | "Labs 1-07 and 1-08 are shared…" | Violet hatching + "ACI / SCBT", "ACI / FEMT / C3". |
| 221.8 / 226.6 | "close to one another" · "integrated analytical support" | The stack tightens; pulses run between neighbouring labs; header becomes *Integrated analytical support*. |
| 231.4 | — | Lab 1-01 (blue) expands into a colour wash that opens the C/MS chapter. |

### 6–7 · Chromatography / Mass Spectrometry (233 – 355) — slides 6, 7
| t | Narration | Picture |
|---|---|---|
| 235–238 | "…three technical domains, starting with chromatography…" | Domain selector (the docked chips from scene 3) lights C/MS and docks; title card with the domain lead. |
| 242.6 / 244.1 / 245.4 | "gas chromatography · liquid chromatography · mass spectrometry" | Real lab photos arrive on their names (duotone → colour). |
| 247–252 | "separate, identify, and analyse" | Working mechanism: a sample splits into bands in a column, the bands draw a chromatogram as they elute, and a mass spectrum rises — each verb lands on its word. |
| 255 / 257 | "routine testing · complex investigations" | Two tags. |
| 270–353 | slide 7 | Capability tree (GC / LC / elemental). Row headers preview on "broad range of instruments"; each instrument chip pops on its name; tags (microplastics, solid/liquid/gas, targeted/non-targeted) on their words; a *Mass spectrometry* bracket on "advanced mass spectrometry". |

### 8–9 · X-Ray Spectroscopy / Microscopy (355 – 473) — slides 8, 9
| t | Narration | Picture |
|---|---|---|
| 357–362 | "…second technical domain, X-ray… led by Ms. Angeline Seo" | Selector passes the highlight C/MS → X-ray; title card + lead. |
| 364 | "key instruments" | Filmstrip of the instrument photos. |
| 369–377 | "SEM and TEM … very small length scales" | Spotlight: continuous zoom grains → particles → atomic lattice with a live scale bar (100 µm → 1 nm). |
| 378–381 | "SAXS and WAXS" | Rings on a detector: small-angle on "SAXS", wide-angle on "WAXS". |
| 382–385 | "XPS … elemental and chemical analysis" | Photoelectron spectrum; element peaks label on "elemental", C 1s splits into C–C / C=O on "chemical". |
| 387–398 | "Powder X-ray diffractometer … in-situ … structural changes" | Heated reaction chamber + XRD waterfall whose peaks shift and a new phase appears. |
| 400–405 | "XRF with mapping … distribution" | A beam raster-scans a sample and builds an element map pixel by pixel. |
| 406–415 | "morphology, structure, surface chemistry, elemental composition" | Tray of instruments wires to each property on its word. |
| 418–471 | slide 9 | Capability tree; a length-scale ruler (mm → Å) places micro-CT, SEM, AFM and TEM on "different length scales". |

### 10–11 · NMR / Physical / Thermal (473 – 597) — slides 10, 11
| t | Narration | Picture |
|---|---|---|
| 475–480 | "…third technical domain, NMR, physical and thermal…" | Selector → NMR; title card + lead. |
| 485–497 | "Nuclear Magnetic Resonance … structure identification … quantitative analysis" | Panel: NMR photo; a molecule's proton groups light their spectrum peaks; integrals (3H : 2H : 1H) rise on "quantitative". |
| 499–511 | "thermal, chemical and physical characterisation laboratory…" | Panel: lab photo; heating ramp with mass-loss + heat-flow curves, porous particle; checks on each property. |
| 512–525 | "molecular and bulk property perspective … research, product development, problem solving" | Molecular ↔ bulk bridge, then three outcomes. |
| 527–596 | slide 11 | Capability tree; temperature-program overlay (ramp, TGA, DSC) on "controlled temperature conditions"; a *molecular structure → physical → chemical → thermal* journey on those words. |

### 12 · Capabilities at a glance (597.7 – 630) — slide 12
| t | Narration | Picture |
|---|---|---|
| 598–606 | "…wide range of analytical capabilities … three technical domains" | All capabilities cascade into three domain columns. |
| 607–614 | "…different types of samples and analytical needs" | The wall steps back; solids, liquids, gases, powders. |
| 615–623 | "our team can work with you to identify the most appropriate analytical approach for your specific research needs" | The 11 team portraits connect to "You"; techniques funnel into one best-fit approach, handed to you. |
| 623.8 | — | ACI end card, fade out. |

## Revision log

**Rev 2 (feedback on part 1)**
- Sound: the tonal UI "pops"/ticks replaced by muffled non-tonal taps; drop re-voiced lower and rounder; chime replaced by a warm low mallet; per-sound low-pass plus a 6 kHz low-pass on the SFX bus.
- "Technical training": the cap icon now sits outside the pill with a clear gap.
- The ISCE² *Internal R&D* box now encloses the *Shared scientific resources* label; the industry stream leaves through the box's side.
- Industry → services: the camera travels to the industry node, which becomes the hub that emits each service tile on its keyword (and folds back into the solutions orb) — replaces the zoom-and-cut.
- Ong Li Li's NMR lead card now appears in place (like the other leads); the flight from management was removed.
