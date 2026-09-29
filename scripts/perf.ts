// Per-frame cost including Skia's deferred rasterisation (flushed by c.data()).
import { createCanvas } from '@napi-rs/canvas';
import { loadAssets } from '../src/engine/assets';
import { background, finish } from '../src/engine/post';
import { renderFrame } from '../src/timeline';
await loadAssets();
const c = createCanvas(1920, 1080), ctx = c.getContext('2d');
const time = (label: string, fn: () => void, n = 12) => { fn(); c.data(); const t0 = performance.now(); for (let i = 0; i < n; i++) { fn(); c.data(); } console.log(label.padEnd(20), ((performance.now() - t0) / n).toFixed(1), 'ms'); };
time('data() only', () => {});
time('background', () => background(ctx, 50, {}));
time('bg energy0', () => background(ctx, 50, { energy: 0 }));
time('bg no grid', () => background(ctx, 50, { grid: 0 }));
time('finish', () => finish(ctx));
for (const t of [4.5, 20.5, 58, 110, 160]) time(`frame ${t}`, () => renderFrame(ctx, t));
