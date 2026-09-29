// Renderer CLI.
//   stills: npx tsx scripts/render.ts stills --t 3.5,20,41 [--out out/stills]
//   sheet:  npx tsx scripts/render.ts sheet --from 9 --to 37 [--n 16] [--cols 4] [--out out/sheet.png]   (or --times a,b,c)
//   video:  npx tsx scripts/render.ts video [--from 0] [--to END] [--fps 60] [--jobs auto] [--encoder auto]
//                                          [--quality 18] [--segment 10] [--fresh] [--out out/aci_explainer.mp4] [--noaudio]
//
// Video mode cuts the timeline into short segments and renders them in parallel
// (--jobs worker processes, each with its own canvas and encoder). Finished
// segments are kept, so an interrupted render resumes where it stopped (use
// --fresh to start over). Segments are concatenated and muxed with the mix.
//
// Backend: --backend gpu (or ACI_BACKEND=gpu) renders on the GPU (skia-canvas:
// Metal / Vulkan), otherwise on the CPU (@napi-rs/canvas). Encoder: --encoder auto
// picks the first hardware encoder that actually works on this machine (NVENC,
// VideoToolbox, Quick Sync, AMF) and falls back to x264.
//
// If a job fails (e.g. the GPU runs out of encoder sessions or memory) its segment
// goes back in the queue and the render carries on with one job fewer.
import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAssets, W, H, ROOT } from '../src/engine/assets';
import { createCanvas, png, BACKEND, describe, gpuEngine } from '../src/engine/canvas';
import { renderFrame, END } from '../src/timeline';
import { pickEncoder, FFMPEG } from './encoders';

const argv = process.argv.slice(2);
const mode = argv[0] ?? 'stills';
const opt = (k: string, d?: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const flag = (k: string) => argv.includes(`--${k}`);
const HERE = path.dirname(fileURLToPath(import.meta.url));

async function stills() {
  await loadAssets();
  const out = path.resolve(opt('out', path.join(ROOT, 'out/stills'))!);
  fs.mkdirSync(out, { recursive: true });
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  for (const t of opt('t', '0')!.split(',').map(Number)) {
    const t0 = performance.now();
    renderFrame(ctx, t);
    const f = path.join(out, `f_${t.toFixed(2).padStart(7, '0')}.png`);
    fs.writeFileSync(f, png(c));
    console.log(f, `${(performance.now() - t0).toFixed(0)}ms`);
  }
}

async function sheet() {
  await loadAssets();
  const from = +opt('from', '0')!, to = +opt('to', '10')!, n = +opt('n', '12')!, cols = +opt('cols', '4')!;
  const times = opt('times') ? opt('times')!.split(',').map(Number) : Array.from({ length: n }, (_, i) => from + ((to - from) * i) / Math.max(1, n - 1));
  const cw = 640, ch = 360, pad = 6, lab = 22;
  const rows = Math.ceil(times.length / cols);
  const S = createCanvas(cols * (cw + pad) + pad, rows * (ch + lab + pad) + pad), s = S.getContext('2d');
  s.fillStyle = '#222'; s.fillRect(0, 0, S.width, S.height);
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  times.forEach((t, i) => {
    renderFrame(ctx, t);
    const x = pad + (i % cols) * (cw + pad), y = pad + Math.floor(i / cols) * (ch + lab + pad);
    s.drawImage(c as never, x, y + lab, cw, ch);
    s.fillStyle = '#eee'; s.font = '16px Mono'; s.fillText(`${t.toFixed(2)}s`, x + 2, y + 16);
  });
  const out = path.resolve(opt('out', path.join(ROOT, `out/sheets/sheet_${from}-${to}.png`))!);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, png(S));
  console.log(out);
}

function run(cmd: string, args: string[]) {
  return new Promise<void>((res, rej) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'inherit', 'inherit'] });
    p.on('exit', (code) => (code === 0 ? res() : rej(new Error(`${cmd} exited ${code}`))));
  });
}

function defaultJobs() {
  const cores = os.availableParallelism?.() ?? os.cpus().length;
  const ram = Math.floor(os.totalmem() / 2 ** 30 / 1.5); // a worker peaks around 1 GB
  // one core stays free for the encoders and the OS. On the GPU backend a few
  // workers are enough to keep one GPU busy.
  return Math.max(1, Math.min(BACKEND === 'gpu' ? 6 : 12, cores - 1, ram));
}

async function video() {
  const fps = +opt('fps', '60')!;
  const from = +opt('from', '0')!, to = +opt('to', String(END))!;
  const jobs = opt('jobs', 'auto') === 'auto' ? defaultJobs() : Math.max(1, +opt('jobs')!);
  const segSec = +opt('segment', '10')!;
  const quality = +opt('quality', '18')!;
  const out = path.resolve(opt('out', path.join(ROOT, 'out/aci_explainer.mp4'))!);
  const enc = pickEncoder(opt('encoder', 'auto')!, fps, quality);
  // segments are only reusable with the same timing and encoder settings
  const key = `${path.basename(out, '.mp4')}_${fps}fps_${enc.name}_q${quality}`;
  const dir = path.join(ROOT, 'out/segments', key);
  if (flag('fresh')) fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  const f0 = Math.round(from * fps), f1 = Math.round(to * fps), per = Math.round(segSec * fps);
  const segs: { a: number; b: number; file: string }[] = [];
  for (let a = f0; a < f1; a += per) segs.push({ a, b: Math.min(f1, a + per), file: path.join(dir, `seg_${String(a).padStart(6, '0')}.mp4`) });
  const todo = segs.filter((s) => !fs.existsSync(s.file));
  const total = todo.reduce((n, s) => n + s.b - s.a, 0);
  console.log(`backend   ${describe()}`);
  if (BACKEND === 'gpu' && !gpuEngine().onGpu) console.log('          (no usable GPU, so the default CPU backend will be faster: drop --backend gpu)');
  console.log(`encoder   ${enc.label}`);
  console.log(`frames    ${f1 - f0} at ${fps} fps · ${segs.length} segments of ${segSec}s (${segs.length - todo.length} already done) · ${jobs} parallel jobs`);
  console.log(`segments  ${dir}`);

  const done = new Map<number, number>();
  let finished = 0, active = 0;
  const t0 = performance.now();
  const clock = (s: number) => `${Math.floor(s / 60)}m${String(Math.round(s % 60)).padStart(2, '0')}s`;
  const report = () => {
    const n = finished + [...done.values()].reduce((a, b) => a + b, 0);
    const el = (performance.now() - t0) / 1000, rate = n / Math.max(el, 1e-3);
    process.stdout.write(`\r${n}/${total} frames · ${rate.toFixed(1)} fps · ${active} jobs · eta ${n ? clock(Math.max(0, (total - n) / rate)) : '…'}   `);
  };
  const timer = setInterval(report, 2000);
  const queue = [...todo];
  const kids = new Set<ChildProcess>();
  const fails = new Map<number, number>();

  const renderSegment = (seg: (typeof segs)[number], id: number, tmp: string) => new Promise<void>((res, rej) => {
    const job = JSON.stringify({ a: seg.a, b: seg.b, fps, out: tmp, enc: enc.args, id });
    const p = spawn(process.execPath, ['--import', 'tsx', path.join(HERE, 'worker.ts'), job],
      { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'], env: { ...process.env, ACI_BACKEND: BACKEND } });
    kids.add(p);
    let buf = '';
    p.stdout!.on('data', (d: Buffer) => {
      buf += d.toString();
      const lines = buf.split('\n'); buf = lines.pop()!;
      for (const l of lines) if (l.startsWith('P ')) done.set(seg.a, +l.slice(2));
    });
    p.on('error', rej);
    p.on('exit', (code, sig) => { kids.delete(p); code === 0 ? res() : rej(new Error(`segment at ${(seg.a / fps).toFixed(1)}s failed (${sig ?? `exit ${code}`})`)); });
  });

  const worker = async (id: number) => {
    active++;
    try {
      for (let seg = queue.shift(); seg; seg = queue.shift()) {
        const tmp = seg.file.replace(/\.mp4$/, '.part.mp4');
        try {
          await renderSegment(seg, id, tmp);
        } catch (e) {
          done.delete(seg.a);
          const n = (fails.get(seg.a) ?? 0) + 1;
          fails.set(seg.a, n);
          if (n >= 3) throw e;
          queue.unshift(seg);
          // Usually the GPU is out of encoder sessions or memory: carry on with one job fewer.
          if (active > 1) { console.warn(`\n${(e as Error).message}; re-queued, continuing with ${active - 1} jobs`); return; }
          console.warn(`\n${(e as Error).message}; retrying`);
          continue;
        }
        fs.renameSync(tmp, seg.file); // a segment only gets its final name once it is complete
        done.delete(seg.a);
        finished += seg.b - seg.a;
      }
    } finally { active--; }
  };
  const stop = () => { for (const k of kids) k.kill(); };
  process.once('SIGINT', () => { stop(); console.log('\ninterrupted: finished segments are kept, run the same command again to resume'); process.exit(130); });
  try {
    await Promise.all(Array.from({ length: Math.min(jobs, Math.max(1, todo.length)) }, (_, i) => worker(i)));
  } catch (e) {
    stop();
    throw e;
  } finally { clearInterval(timer); }
  report();
  console.log(`\nrendered ${total} frames in ${clock((performance.now() - t0) / 1000)}`);

  const list = path.join(dir, 'list.txt');
  fs.writeFileSync(list, segs.map((s) => `file '${s.file.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n'));
  const audio = path.join(ROOT, 'out/audio/mix.wav');
  const args = ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list];
  if (!flag('noaudio') && fs.existsSync(audio)) args.push('-ss', String(from), '-t', String(to - from), '-i', audio, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000');
  else if (!flag('noaudio')) console.warn('no out/audio/mix.wav — run `npm run audio` first (writing video without sound)');
  args.push('-c:v', 'copy', '-movflags', '+faststart', out);
  await run(FFMPEG, args);
  console.log('wrote', out);
}

if (mode === 'stills') await stills();
else if (mode === 'sheet') await sheet();
else if (mode === 'video') await video();
else throw new Error(`unknown mode ${mode}`);
