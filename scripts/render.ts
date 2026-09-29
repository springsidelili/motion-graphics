// Offline renderer CLI.
//   stills: npx tsx scripts/render.ts stills --t 3.5,20,41 [--out out/stills]
//   sheet:  npx tsx scripts/render.ts sheet --from 9 --to 37 [--n 16] [--cols 4] [--out out/sheet.png]  (or --times a,b,c)
//   video:  npx tsx scripts/render.ts video [--from 0] [--to END] [--fps 60] [--workers 4] [--crf 17] [--out out/aci_explainer.mp4] [--noaudio]
// Video mode splits the frame range across worker processes (each pipes raw RGBA
// into its own ffmpeg), concatenates the segments and muxes the mixed audio.
import { createCanvas } from '@napi-rs/canvas';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { loadAssets, W, H, ROOT } from '../src/engine/assets';
import { renderFrame, END } from '../src/timeline';

const argv = process.argv.slice(2);
const mode = argv[0] ?? 'stills';
const opt = (k: string, d?: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const flag = (k: string) => argv.includes(`--${k}`);

async function stills() {
  await loadAssets();
  const out = path.resolve(opt('out', path.join(ROOT, 'out/stills'))!);
  fs.mkdirSync(out, { recursive: true });
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  for (const t of opt('t', '0')!.split(',').map(Number)) {
    const t0 = performance.now();
    renderFrame(ctx, t);
    const f = path.join(out, `f_${t.toFixed(2).padStart(7, '0')}.png`);
    fs.writeFileSync(f, c.toBuffer('image/png'));
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
    s.drawImage(c, x, y + lab, cw, ch);
    s.fillStyle = '#eee'; s.font = '16px Mono'; s.fillText(`${t.toFixed(2)}s`, x + 2, y + 16);
  });
  const out = path.resolve(opt('out', path.join(ROOT, `out/sheets/sheet_${from}-${to}.png`))!);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, S.toBuffer('image/png'));
  console.log(out);
}

function run(cmd: string, args: string[]) {
  return new Promise<void>((res, rej) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'inherit', 'inherit'] });
    p.on('exit', (code) => (code === 0 ? res() : rej(new Error(`${cmd} exited ${code}`))));
  });
}

async function video() {
  const fps = +opt('fps', '60')!;
  const from = +opt('from', '0')!, to = +opt('to', String(END))!;
  const workers = +opt('workers', '4')!;
  const out = path.resolve(opt('out', path.join(ROOT, 'out/aci_explainer.mp4'))!);
  const tmp = path.join(ROOT, 'out/tmp', path.basename(out, '.mp4'));
  fs.mkdirSync(tmp, { recursive: true });
  const f0 = Math.round(from * fps), f1 = Math.round(to * fps);
  const per = Math.ceil((f1 - f0) / workers);
  const segs: string[] = [];
  const t0 = performance.now();
  const jobs: Promise<void>[] = [];
  for (let w = 0; w < workers; w++) {
    const a = f0 + w * per, b = Math.min(f1, a + per);
    if (a >= b) break;
    const seg = path.join(tmp, `seg${w}.mp4`);
    segs.push(seg);
    jobs.push(run(path.join(ROOT, 'node_modules/.bin/tsx'), [path.join(ROOT, 'scripts/worker.ts'), String(a), String(b), String(fps), seg, opt('crf', '17')!, opt('preset', 'medium')!, String(w)]));
  }
  await Promise.all(jobs);
  console.log(`\nrendered ${f1 - f0} frames in ${((performance.now() - t0) / 1000).toFixed(1)}s`);
  const list = path.join(tmp, 'list.txt');
  fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join('\n'));
  const audio = path.join(ROOT, 'out/audio/mix.wav');
  const args = ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list];
  if (!flag('noaudio') && fs.existsSync(audio)) args.push('-ss', String(from), '-t', String(to - from), '-i', audio, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000');
  args.push('-c:v', 'copy', '-movflags', '+faststart', out);
  await run('ffmpeg', args);
  console.log('wrote', out);
}

if (mode === 'stills') await stills();
else if (mode === 'sheet') await sheet();
else if (mode === 'video') await video();
else throw new Error(`unknown mode ${mode}`);
