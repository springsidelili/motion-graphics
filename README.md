# ACI Division: motion-graphics explainer (slides 1–12)

This repo builds an employee-learning video about ISCE²'s Advanced Characterization and Instrumentation (ACI) division. It's generated entirely in code from the division's PowerPoint deck (`ISCE2_ACI_slides.pptx`) and that deck's own narration.

- **Watch:** the review copies are in [`renders/`](renders/), at 1080p30 in three parts, split by chapter so each fits GitHub's file-size limit. The 60 fps master is rebuilt with the commands under **Build**.
- **Output:** 1920×1080, 60 fps, H.264 + AAC, 10:30, mixed to -15 LUFS
- **Captions:** [`renders/aci_explainer.en.srt`](renders/aci_explainer.en.srt), ready to upload to YouTube
- **Chapters:** [`renders/chapters.txt`](renders/chapters.txt), to paste into the YouTube description
- **Storyboard:** [`docs/STORYBOARD.md`](docs/STORYBOARD.md) has the design principles, a beat sheet synced to each spoken word, and the revision log

## How it works

The architecture follows [mexicat/pdoom-video](https://github.com/mexicat/pdoom-video): every frame is a pure function of time, keyed to word-level timings. Rendering is headless and the frames are piped to ffmpeg.

```
PPTX ──► extract audio / text / headshots / lab photos
narration.mp3 ──► offline ASR (NVIDIA Parakeet-TDT via sherpa-onnx) ──► word timings
            └──► tools/align.py: slide spellings for names & instruments + snap onsets to the audio ──► data/narration.json
data/narration.json ──► src/scenes/*.ts   (visuals look words up: cue(4, 'Andrew Lim'))
                    └──► src/sfx.ts        (sound cues use the same timings)
scripts/render.ts ──► N worker processes × (Skia canvas → raw RGBA → ffmpeg/x264) ──► concat + audio mux
tools/audio.py    ──► narration mastering + procedural SFX + ducked pad ──► -15 LUFS mix
```

- **Renderer:** [`@napi-rs/canvas`](https://github.com/Brooooooklyn/canvas), which is Skia running in Node. It needs no browser and no GPU; 4 CPU workers render the whole 10.5 minutes at 1080p60 in about 20 minutes.
- **Determinism:** scenes never use `Math.random()` or the wall clock. Randomness comes from seeded `mulberry32` or `hash`, so any frame can be rendered alone, in any order, on any worker.
- **Type:** Space Grotesk (display), Inter (body) and JetBrains Mono (labels), all SIL OFL and installed from npm.
- **Sound:** every SFX and the pad is synthesised in `tools/audio.py`, so there are no licensing questions. The sounds are deliberately dark: non-tonal taps rather than pitched bleeps, each low-passed, and the SFX bus is low-passed again at 6 kHz.

## Layout

| Path | What |
|---|---|
| `src/engine/` | `util` (easing, springs, keyframes, colour, seeded noise) · `draw` (text reveals, cards, glows, portraits, camera, partial paths) · `icons` (animated instrument / service icons) · `kit` (photo cards, domain selector, domain title, capability tree, end card) · `post` (background, vignette + grain, HUD) · `narration` (word cues) |
| `src/scenes/` | `s1_title` · `s2_org` · `s3_domains` · `s4_team` · `s5_resources` (slides 1–4) · `s6_sitemap` (5) · `s7_cms` (6–7) · `s8_xray` (8–9) · `s9_nmr` (10–11) · `s10_summary` (12 + end card) |
| `src/timeline.ts` | Scene windows, chapters, finishing passes |
| `src/sfx.ts` | Sound cue sheet |
| `scripts/` | `render.ts` (stills / contact sheet / video), `worker.ts`, `cues.ts` (audio cues, SRT, chapters), `icons.ts` (icon test sheet), `perf.ts` (per-pass cost), `diffat.ts` (locates single-frame pops) |
| `tools/` | `transcribe.py` (ASR), `align.py` (canonical spellings + onset snapping), `prep_images.py` (face crops, white logo, lab photos), `audio.py` (mix) |
| `assets/` | The deck's narration (all 12 slides), headshots, lab photos, ISCE² logo |
| `data/` | `asr_raw.json`, `narration.json` |

## Build

Requires Node 22+, Python 3.11+ (`numpy scipy soundfile pillow`) and ffmpeg with libx264.

```sh
npm install
npx tsx scripts/cues.ts                 # audio cue sheet, captions, chapters
python3 tools/audio.py                  # out/audio/mix.wav   (--no-pad for voice + SFX only)
npx tsx scripts/render.ts video --fps 60 --workers 4 --out out/aci_explainer.mp4
```

Iterating on a scene:

```sh
npx tsx scripts/render.ts stills --t 20.3,26.9          # full-res PNGs → out/stills
npx tsx scripts/render.ts sheet --from 90 --to 148 --n 20 --cols 4   # contact sheet
npx tsx scripts/render.ts video --from 104 --to 116 --out out/wip.mp4 # a short clip
```

Re-transcribing, which is only needed when the narration changes:

```sh
# model: sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8 (GitHub releases of k2-fsa/sherpa-onnx)
python3 tools/transcribe.py 1 2 3 4 5 6 7 8 9 10 11 12   # where the model and 16 kHz wavs live → merge into data/asr_raw.json
python3 tools/align.py <wav dir>                         # → data/narration.json
```

## Changing the edit

- **Narration timing:** each slide's clip offset is set in `OFFSET` in `src/engine/narration.ts`. Every visual and sound cue is looked up from spoken words, so moving a clip moves everything that belongs to it.
- **Scene transitions:** hand the ACI dot or hub (or a domain colour) from one scene to the next so cuts stay shape-matched. Reuse the domain colours in `theme.ts` and the components in `kit.ts`.
- **Checking a render for pops:** `npx tsx scripts/diffat.ts <t>` shows what changed between two frames.
