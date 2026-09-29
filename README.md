# ACI Division: motion-graphics explainer (Part 1, slides 1–4)

This repo builds an employee-learning video about ISCE²'s Advanced Characterization and Instrumentation (ACI) division. It's generated entirely in code from the division's PowerPoint deck (`ISCE2_ACI_slides.pptx`) and that deck's own narration.

- **Output:** 1920×1080, 60 fps, H.264 + AAC, about 3:07
- **Captions:** `out/aci_part1.en.srt`, ready to upload to YouTube
- **Storyboard:** [`docs/STORYBOARD.md`](docs/STORYBOARD.md) has the design principles and a beat sheet synced to each spoken word

## How it works

The architecture follows [mexicat/pdoom-video](https://github.com/mexicat/pdoom-video): every frame is a pure function of time, keyed to word-level timings. Rendering is headless and the frames are piped to ffmpeg.

```
PPTX ──► extract audio / text / headshots
narration.mp3 ──► offline ASR (NVIDIA Parakeet-TDT via sherpa-onnx) ──► word timings
            └──► tools/align.py: slide spellings for names + snap onsets to the audio  ──► data/narration.json
data/narration.json ──► src/scenes/*.ts   (visuals look words up: cue(4, 'Andrew Lim'))
                    └──► src/sfx.ts        (sound cues use the same timings)
scripts/render.ts ──► N worker processes × (Skia canvas → raw RGBA → ffmpeg/x264) ──► concat + audio mux
tools/audio.py    ──► narration mastering + procedural SFX + ducked pad ──► -15 LUFS mix
```

- **Renderer:** [`@napi-rs/canvas`](https://github.com/Brooooooklyn/canvas), which is Skia running in Node. It needs no browser and no GPU, and 4 workers render the whole piece in a few minutes.
- **Determinism:** scenes never use `Math.random()` or the wall clock. Randomness comes from seeded `mulberry32` or `hash`, so any frame can be rendered alone, in any order, on any worker.
- **Type:** Space Grotesk (display), Inter (body) and JetBrains Mono (labels), all SIL OFL and installed from npm.
- **Sound:** every SFX and the pad is synthesised in `tools/audio.py`, so there are no licensing questions.

## Layout

| Path | What |
|---|---|
| `src/engine/` | `util` (easing, springs, keyframes, colour, seeded noise) · `draw` (text reveals, cards, glows, portraits, camera, partial paths) · `icons` (animated instrument / service icons) · `post` (background, vignette, grain, HUD) · `narration` (word cues) |
| `src/scenes/` | `s1_title` · `s2_org` · `s3_domains` · `s4_team` · `s5_resources` |
| `src/timeline.ts` | Scene windows, chapters, finishing passes |
| `src/sfx.ts` | Sound cue sheet |
| `scripts/` | `render.ts` (stills / contact sheet / video), `worker.ts`, `cues.ts` (audio cues + SRT), `icons.ts` (icon test sheet), `perf.ts` |
| `tools/` | `transcribe.py` (ASR), `align.py` (canonical spellings + onset snapping), `prep_images.py` (face crops, white logo), `audio.py` (mix) |
| `assets/` | The narration from the deck (slides 1–4), headshots, ISCE² logo |
| `data/` | `asr_raw.json`, `narration.json` |

## Build

Requires Node 22+, Python 3.11+ (`numpy scipy soundfile pillow`) and ffmpeg with libx264.

```sh
npm install
npx tsx scripts/cues.ts                 # audio cue sheet + captions
python3 tools/audio.py                  # out/audio/mix.wav   (--no-pad for voice + SFX only)
npx tsx scripts/render.ts video --fps 60 --workers 4 --out out/aci_part1.mp4
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
python3 tools/transcribe.py 1 2 3 4     # run where the model and 16 kHz wavs live → data/asr_raw.json
python3 tools/align.py <wav dir>        # → data/narration.json
```

## Extending to slides 5–12

1. Copy the narration for slides 5–12 into `assets/audio/slideN.mp3`, transcribe it and align it. Then add each clip's offset to `OFFSET` in `src/engine/narration.ts`.
2. Add one scene per slide under `src/scenes/`. Hand the ACI dot or hub in from the previous scene so the transitions stay shape-matched, and reuse the domain colours in `theme.ts` and the icons in `icons.ts`.
3. Add the new sound cues to `src/sfx.ts`, then re-run `cues.ts`, `audio.py` and `render.ts`.
