// Renders frames [a, b) at fps and pipes raw RGBA into ffmpeg (libx264, BT.709-tagged).
import { createCanvas } from '@napi-rs/canvas';
import { spawn } from 'node:child_process';
import { loadAssets, W, H } from '../src/engine/assets';
import { renderFrame } from '../src/timeline';

const [a, b, fps, out, crf, preset, id] = process.argv.slice(2);
const A = +a!, B = +b!, FPS = +fps!;
await loadAssets();
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', 'pipe:0',
  '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
  '-c:v', 'libx264', '-preset', preset!, '-crf', crf!, '-tune', 'animation', '-g', String(FPS * 2), '-threads', '2', out!], { stdio: ['pipe', 'inherit', 'inherit'] });
const c = createCanvas(W, H), ctx = c.getContext('2d');
const t0 = performance.now();
for (let f = A; f < B; f++) {
  renderFrame(ctx, f / FPS);
  const buf = c.data();
  if (!ff.stdin.write(Buffer.from(buf))) await new Promise((r) => ff.stdin.once('drain', r));
  const n = f - A + 1;
  if (n % 120 === 0) process.stdout.write(`[w${id}] ${n}/${B - A} ${(n / ((performance.now() - t0) / 1000)).toFixed(1)} fps\n`);
}
ff.stdin.end();
await new Promise((r) => ff.on('exit', r));
