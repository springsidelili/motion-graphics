// Builds the whole film: cue sheet + captions + chapters → audio mix → video.
//   npm run build                    CPU canvas, best available encoder
//   npm run build:gpu                GPU canvas (skia-canvas on Metal / Vulkan)
//   npm run build -- --jobs 4 --fps 30 --fresh   any `render.ts video` option passes through
// Safe to re-run: finished video segments are reused, so an interrupted build resumes.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pass = process.argv.slice(2);
const step = (label: string, script: string, args: string[] = []) => {
  console.log(`\n── ${label}`);
  const r = spawnSync(process.execPath, ['--import', 'tsx', path.join(ROOT, 'scripts', script), ...args], { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) { console.error(`\n${label} failed`); process.exit(r.status ?? 1); }
};

step('cue sheet, captions, chapters', 'cues.ts');
// the mix only depends on the cue sheet and the mixer, so it is rebuilt only when they change
const mixKey = createHash('sha1').update(fs.readFileSync(path.join(ROOT, 'out/audio/cues.json'))).update(fs.readFileSync(path.join(ROOT, 'tools/audio.py'))).digest('hex');
const keyFile = path.join(ROOT, 'out/audio/mix.key');
const mixFresh = fs.existsSync(path.join(ROOT, 'out/audio/mix.wav')) && fs.existsSync(keyFile) && fs.readFileSync(keyFile, 'utf8') === mixKey;
if (pass.includes('--noaudio')) console.log('\n── audio mix skipped (--noaudio)');
else if (mixFresh && !pass.includes('--fresh')) console.log('\n── audio mix is up to date (out/audio/mix.wav)');
else { step('audio mix', 'py.ts', ['tools/audio.py']); fs.writeFileSync(keyFile, mixKey); }
step('video', 'render.ts', ['video', ...pass]);

const outIdx = pass.indexOf('--out');
const out = outIdx >= 0 ? pass[outIdx + 1]! : 'out/aci_explainer.mp4';
console.log(`\ndone: ${out}`);
for (const f of ['out/aci_explainer.en.srt', 'out/chapters.txt']) if (fs.existsSync(path.join(ROOT, f))) console.log(`      ${f}`);
