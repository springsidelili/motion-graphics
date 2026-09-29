# ACI Division: motion-graphics explainer (slides 1–12)

This repo builds an employee-learning video about ISCE²'s Advanced Characterization and Instrumentation (ACI) division. It's generated entirely in code from the division's PowerPoint deck (`ISCE2_ACI_slides.pptx`) and that deck's own narration.

- **Watch:** the film is rendered from code, not stored in the repo. One command builds it (see **Run it locally**), using your GPU if you have one.
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

- **Renderer:** Skia running in Node, with no browser. The default backend is [`@napi-rs/canvas`](https://github.com/Brooooooklyn/canvas) on the CPU. `--backend gpu` switches to [`skia-canvas`](https://skia-canvas.org), which runs on Metal (macOS) or Vulkan (Windows / Linux). Scene code only sees the standard Canvas 2D API through `src/engine/canvas.ts`, and the two backends produce the same frames to within anti-aliasing noise.
- **Parallel and resumable:** the timeline is cut into 10-second segments that render as independent jobs. Each job has its own canvas and encoder. A finished segment is kept, so an interrupted render picks up where it stopped. If the GPU refuses a job (for example, too many encoder sessions), that segment is re-queued and the render continues with one job fewer.
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
| `scripts/` | `build.ts` (the whole film in one command), `doctor.ts` (checks the machine and benchmarks CPU vs GPU), `render.ts` (stills / contact sheet / video), `worker.ts` (one render job), `encoders.ts` (hardware encoder detection), `cues.ts` (audio cues, SRT, chapters), `py.ts` (finds Python), `bench.ts`, `perf.ts` (per-pass cost), `icons.ts` (icon test sheet), `diffat.ts` (locates single-frame pops) |
| `tools/` | `transcribe.py` (ASR), `align.py` (canonical spellings + onset snapping), `prep_images.py` (face crops, white logo, lab photos), `audio.py` (mix) |
| `assets/` | The deck's narration (all 12 slides), headshots, lab photos, ISCE² logo |
| `data/` | `asr_raw.json`, `narration.json` |

## Run it locally

### 1. Install

| | |
|---|---|
| **Node 22+** | [nodejs.org](https://nodejs.org) |
| **ffmpeg** | Windows: `winget install Gyan.FFmpeg` (includes NVENC, Quick Sync and AMF). macOS: `brew install ffmpeg` (includes VideoToolbox). Linux: your distro's `ffmpeg`; NVENC also needs the NVIDIA driver. |
| **Python 3.10+** | For the audio mix only: [python.org](https://www.python.org) |
| **GPU drivers** | Only for `--backend gpu`: Metal on macOS is built in; on Windows / Linux you need a current NVIDIA, AMD or Intel driver with Vulkan (all current drivers include it). |

```sh
git clone https://github.com/springsidelili/motion-graphics && cd motion-graphics
git checkout claude/magical-hopper-zj2ooo
npm install
pip install -r requirements.txt        # Windows: py -m pip install -r requirements.txt
```

### 2. Check the machine

```sh
npm run doctor
```

This lists which hardware encoders really work on this machine (each one is test-encoded, not just looked up) and checks Python and its packages. It also renders the same frames on the CPU and the GPU backend, compares the pixels, times both, and prints the command to use. Add `-- --quick` to skip the benchmark.

### 3. Build the film

```sh
npm run build:gpu      # canvas on the GPU (use this when doctor says the GPU backend is faster)
npm run build          # canvas on the CPU
```

Either one writes the cue sheet, captions and chapters, then the audio mix, then renders and encodes the video in parallel:

```
out/aci_explainer.mp4       1920×1080, 60 fps, H.264 + AAC, -15 LUFS
out/aci_explainer.en.srt    captions for YouTube
out/chapters.txt            chapters for the YouTube description
```

- **Encoder:** picked automatically in this order: NVENC, then Quick Sync, then AMF (on macOS, VideoToolbox), falling back to x264. To force one, pass `-- --encoder nvenc|qsv|amf|videotoolbox|x264`.
- **Parallel jobs:** by default this is the number of cores minus one, capped at 12 (6 on the GPU backend) and by RAM (about 1.5 GB per job). Set it with `-- --jobs 8`. Consumer NVIDIA cards cap the number of simultaneous NVENC sessions (8 on current drivers, fewer on older ones). The renderer backs off by itself when it hits the cap, but `--jobs` avoids the retries.
- **Resume:** press Ctrl-C at any time and re-run the same command to carry on. Finished 10-second segments in `out/segments/` are reused. Use `-- --fresh` to start over.
- **Audio mix:** it is only rebuilt when the cue sheet or `tools/audio.py` changes.
- **Other options:** `-- --fps 30` for a quicker preview, `-- --quality 16` for higher quality (lower is better; 18 is visually lossless for this material), `-- --from 90 --to 150 --out out/team.mp4` for one section.
- **Paths:** set `FFMPEG` or `PYTHON` to full paths if they are not on your PATH.

All of these work the same in PowerShell, cmd, bash and zsh. The `--` passes the options through npm.

The steps separately:

```sh
npm run cues                                  # out/audio/cues.json, captions, chapters
npm run audio                                 # out/audio/mix.wav (add -- --no-pad for voice + SFX only)
npm run render:gpu -- --jobs 6 --encoder nvenc
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
