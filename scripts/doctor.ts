// Checks that this machine can build the film and works out the fastest way to
// render it here.
//   npm run doctor            everything, including a CPU vs GPU benchmark (~1 min)
//   npm run doctor -- --quick skip the benchmark
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FFMPEG, probeAll } from './encoders';
import { findPython } from './py';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const quick = process.argv.includes('--quick');
const ok = (s: string) => console.log(`  \x1b[32m✓\x1b[0m ${s}`);
const bad = (s: string) => console.log(`  \x1b[31m✗\x1b[0m ${s}`);
const info = (s: string) => console.log(`    ${s}`);
let problems = 0;

console.log('\nmachine');
const cores = os.availableParallelism?.() ?? os.cpus().length;
info(`${os.type()} ${os.release()} · ${os.cpus()[0]?.model.trim() ?? '?'} · ${cores} threads · ${(os.totalmem() / 2 ** 30).toFixed(0)} GB RAM`);
const nodeMajor = +process.versions.node.split('.')[0]!;
if (nodeMajor >= 22) ok(`Node ${process.versions.node}`); else { bad(`Node ${process.versions.node}: Node 22 or newer is needed`); problems++; }

console.log('\nffmpeg');
const ffv = spawnSync(FFMPEG, ['-hide_banner', '-version'], { encoding: 'utf8' });
const probes = ffv.status === 0 ? probeAll() : [];
if (ffv.status !== 0) { bad(`ffmpeg not found (${FFMPEG}). Install it and put it on PATH, or set FFMPEG to its full path.`); problems++; }
else {
  ok(ffv.stdout.split('\n')[0]!);
  for (const e of probes) (e.ok ? ok : bad)(`${e.label}${e.ok ? '' : `: not usable${e.err ? ` (${e.err.slice(0, 120)})` : ''}`}`);
}
const hw = probes.filter((e) => e.ok && e.key !== 'x264');

console.log('\npython (for the audio mix)');
const py = findPython();
if (!py) { bad('Python 3 not found (install it, or set PYTHON)'); problems++; }
else {
  const r = spawnSync(py[0]!, [...py.slice(1), '-c', 'import numpy, scipy, soundfile, PIL; import sys; print(sys.version.split()[0])'], { encoding: 'utf8' });
  if (r.status === 0) ok(`Python ${r.stdout.trim()} (${py.join(' ')}) with numpy, scipy, soundfile, pillow`);
  else { bad(`${py.join(' ')} is missing packages: run \`${py.join(' ')} -m pip install -r requirements.txt\``); problems++; }
}
const mix = path.join(ROOT, 'out/audio/mix.wav');
if (fs.existsSync(mix)) ok('out/audio/mix.wav exists'); else info('out/audio/mix.wav not built yet (`npm run build` makes it; or `npm run cues && npm run audio`)');

console.log('\ncanvas backends');
type Bench = { backend: string; engine: string; msPerFrame: number; frames: string[] };
const bench = (backend: string): Bench | string => {
  const r = spawnSync(process.execPath, ['--import', 'tsx', path.join(ROOT, 'scripts/bench.ts'), '--backend', backend, ...(quick ? ['--reps', '0'] : [])], { cwd: ROOT, encoding: 'utf8', timeout: 600000 });
  const line = r.stdout.trim().split('\n').pop() ?? '';
  try { return JSON.parse(line) as Bench; } catch { return (r.stderr || r.stdout || String(r.error)).trim().split('\n').slice(-3).join(' '); }
};
const cpu = bench('cpu'), gpu = bench('gpu');
if (typeof cpu === 'string') { bad(`cpu backend failed: ${cpu}`); problems++; } else ok(cpu.engine + (quick ? '' : ` · ${cpu.msPerFrame.toFixed(0)} ms/frame`));
let gpuWins = false;
if (typeof gpu === 'string') bad(`gpu backend unavailable: ${gpu}`);
else {
  const onGpu = gpu.engine.startsWith('gpu ·');
  (onGpu ? ok : bad)(gpu.engine + (quick ? '' : ` · ${gpu.msPerFrame.toFixed(0)} ms/frame`));
  if (typeof cpu !== 'string') {
    // same frames on both backends: how far apart are they?
    let worst = 0, worstMean = 0;
    cpu.frames.forEach((f, i) => {
      const a = fs.readFileSync(f), b = fs.readFileSync(gpu.frames[i]!);
      let sum = 0, off = 0;
      for (let p = 0; p < a.length; p += 4) {
        const d = Math.max(Math.abs(a[p]! - b[p]!), Math.abs(a[p + 1]! - b[p + 1]!), Math.abs(a[p + 2]! - b[p + 2]!));
        sum += d; if (d > 24) off++;
      }
      worst = Math.max(worst, off / (a.length / 4)); worstMean = Math.max(worstMean, sum / (a.length / 4));
    });
    const same = worst < 0.01 && worstMean < 2;
    (same ? ok : bad)(`cpu vs gpu frames: mean difference ${worstMean.toFixed(2)}/255, ${(worst * 100).toFixed(2)}% of pixels visibly different${same ? ' (anti-aliasing noise only)' : ' (check out/bench/*/ before using --backend gpu)'}`);
    gpuWins = onGpu && same && !quick && gpu.msPerFrame < cpu.msPerFrame * 0.85;
  }
}

console.log('\nrecommended');
if (problems) info(`fix the ✗ items above first (${problems})`);
const enc = hw.length ? hw[0]!.key : 'x264';
info(`encoder: ${hw.length ? hw[0]!.label : 'x264 on the CPU (no hardware encoder found)'} (picked automatically)`);
if (quick) info('backend: run `npm run doctor` without --quick to benchmark the GPU backend against the CPU one');
else info(`backend: ${gpuWins ? 'GPU' : 'CPU'}${typeof cpu !== 'string' && typeof gpu !== 'string' ? ` (cpu ${cpu.msPerFrame.toFixed(0)} ms vs gpu ${gpu.msPerFrame.toFixed(0)} ms per frame)` : ''}`);
info(`run:     npm run ${gpuWins ? 'build:gpu' : 'build'}${enc === 'nvenc' ? '        (if NVENC reports too many sessions, add -- --jobs 3)' : ''}`);
console.log();
process.exit(problems ? 1 : 0);
