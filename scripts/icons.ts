// Dev sheet: every animated icon at three moments of its entrance.
import { createCanvas } from '@napi-rs/canvas';
import fs from 'node:fs';
import { loadAssets } from '../src/engine/assets';
import * as I from '../src/engine/icons';
import { background } from '../src/engine/post';
import { text } from '../src/engine/draw';
import { C } from '../src/engine/theme';
await loadAssets();
const names = Object.keys(I) as (keyof typeof I)[];
const lts = [0.45, 1.1, 3.0];
const cell = 300, cols = names.length;
const c = createCanvas(cell * 6, cell * Math.ceil((names.length * 3) / 6)); const ctx = c.getContext('2d');
ctx.fillStyle = C.ink1; ctx.fillRect(0, 0, c.width, c.height);
let k = 0;
const colors = [C.cms, C.xray, C.nmr, C.blue, C.magenta, C.gold];
names.forEach((n, i) => lts.forEach((lt) => {
  const x = (k % 6) * cell + cell / 2, y = Math.floor(k / 6) * cell + cell / 2;
  (I[n] as any)(ctx, x, y + 10, 220, lt, colors[i % colors.length]);
  text(ctx, `${n} @${lt}`, x - cell / 2 + 8, y - cell / 2 + 20, { f: 'mono', size: 16, color: C.text2 });
  k++;
}));
fs.mkdirSync('out', { recursive: true });
fs.writeFileSync('out/icons.png', c.toBuffer('image/png'));
console.log('ok', names.join(','));
