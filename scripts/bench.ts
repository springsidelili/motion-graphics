// Times a few representative frames on one backend (render + pixel readback, the
// work each video job does per frame) and saves them for a CPU/GPU comparison.
//   npx tsx scripts/bench.ts [--backend gpu] [--reps 4]
// Prints one JSON line: { backend, engine, msPerFrame, frames: [files] }.
import fs from 'node:fs';
import path from 'node:path';
import { loadAssets, W, H, ROOT } from '../src/engine/assets';
import { createCanvas, pixels, describe, BACKEND } from '../src/engine/canvas';
import { renderFrame } from '../src/timeline';

const BENCH_TIMES = [20.5, 110, 250, 400, 540, 620];
const ri = process.argv.indexOf('--reps');
const reps = ri >= 0 ? Math.max(0, +process.argv[ri + 1]! || 0) : 4;

await loadAssets();
const dir = path.join(ROOT, 'out/bench', BACKEND);
fs.mkdirSync(dir, { recursive: true });
const c = createCanvas(W, H), ctx = c.getContext('2d');
const frames: string[] = [];
for (const t of BENCH_TIMES) { // warm-up (glyph + sprite caches, shader compilation) and reference frames
  renderFrame(ctx, t);
  const f = path.join(dir, `f_${t}.rgba`);
  fs.writeFileSync(f, pixels(c));
  frames.push(f);
}
const t0 = performance.now();
for (let r = 0; r < reps; r++) for (const t of BENCH_TIMES) { renderFrame(ctx, t + r / 60); pixels(c); }
const msPerFrame = reps ? (performance.now() - t0) / (reps * BENCH_TIMES.length) : 0;
console.log(JSON.stringify({ backend: BACKEND, engine: describe(), msPerFrame, frames }));
