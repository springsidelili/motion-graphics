// Where does the picture change between two consecutive frames? Prints the bbox of big changes.
import { createCanvas } from '@napi-rs/canvas';
import { loadAssets } from '../src/engine/assets';
import { renderFrame } from '../src/timeline';
await loadAssets();
const c = createCanvas(1920, 1080), ctx = c.getContext('2d');
for (const t of process.argv.slice(2).map(Number)) {
  renderFrame(ctx, t - 1 / 60); const a = Buffer.from(c.data());
  renderFrame(ctx, t); const b = c.data();
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, n = 0;
  for (let p = 0; p < 1920 * 1080; p++) {
    const d = Math.abs(a[p * 4]! - b[p * 4]!) + Math.abs(a[p * 4 + 1]! - b[p * 4 + 1]!) + Math.abs(a[p * 4 + 2]! - b[p * 4 + 2]!);
    if (d > 60) { n++; const x = p % 1920, y = (p / 1920) | 0; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  }
  console.log(`t=${t}: ${n} px changed >60, bbox ${x0},${y0} → ${x1},${y1}`);
}
