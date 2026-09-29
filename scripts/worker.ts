// Renders frames [a, b) and pipes raw RGBA into one ffmpeg process.
// Spawned by scripts/render.ts with a JSON job: { a, b, fps, out, enc, id }.
// Prints "P <frames done>" lines on stdout for the progress meter.
import { spawn } from 'node:child_process';
import { loadAssets, W, H } from '../src/engine/assets';
import { createCanvas, pixels } from '../src/engine/canvas';
import { renderFrame } from '../src/timeline';
import { FFMPEG } from './encoders';

const job = JSON.parse(process.argv[2]!) as { a: number; b: number; fps: number; out: string; enc: string[]; id: number };
await loadAssets();
const ff = spawn(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(job.fps), '-i', 'pipe:0', ...job.enc, '-f', 'mp4', job.out],
  { stdio: ['pipe', 'inherit', 'inherit'] });
let ffExit: number | null = null;
const exited = new Promise<number>((r) => ff.on('exit', (code) => r((ffExit = code ?? 1))));
ff.on('error', (e) => { console.error(`cannot start ffmpeg (${FFMPEG}): ${e.message}`); process.exit(1); });
ff.stdin.on('error', () => {}); // ffmpeg quit early (e.g. no free encoder session); its exit code is reported below

const c = createCanvas(W, H), ctx = c.getContext('2d');
for (let f = job.a; f < job.b && ffExit === null; f++) {
  renderFrame(ctx, f / job.fps);
  if (!ff.stdin.write(Buffer.from(pixels(c)))) await Promise.race([new Promise((r) => ff.stdin.once('drain', r)), exited]);
  const n = f - job.a + 1;
  if (n % 30 === 0 || f === job.b - 1) process.stdout.write(`P ${n}\n`);
}
ff.stdin.end();
process.exit(await exited);
