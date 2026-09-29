import { createCanvas, type Canvas } from '@napi-rs/canvas';
import { img, type Ctx, W, H } from './assets';
import { C } from './theme';
import { clamp, mulberry32, noise1, rgba, prog, ease, lerp } from './util';
import { glow, text, withAlpha, measure } from './draw';

// ---------------------------------------------------------------- background
let gridTile: Canvas | null = null;
function grid() {
  if (gridTile) return gridTile;
  gridTile = createCanvas(48, 48);
  const g = gridTile.getContext('2d');
  g.fillStyle = 'rgba(160,178,255,0.10)';
  g.beginPath(); g.arc(24, 24, 1.7, 0, Math.PI * 2); g.fill();
  return gridTile;
}

export type BG = { hue?: [string, string, string]; energy?: number; grid?: number; gx?: number; gy?: number; flash?: number };

/** Base plate: deep gradient, three drifting colour fields, microplate dot grid. */
export function background(ctx: Ctx, t: number, o: BG = {}) {
  const g = ctx.createLinearGradient(0, 0, W * 0.3, H);
  g.addColorStop(0, C.ink1);
  g.addColorStop(1, C.ink0);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const hues = o.hue ?? [C.blue, C.violet, C.magenta];
  const en = o.energy ?? 1;
  const blobs = [
    { x: 0.18, y: 0.2, r: 900, a: 0.22, s: 1 },
    { x: 0.85, y: 0.3, r: 800, a: 0.17, s: 2 },
    { x: 0.6, y: 0.95, r: 1000, a: 0.14, s: 3 },
  ];
  blobs.forEach((b, i) => {
    const x = (b.x + 0.07 * noise1(t * 0.05, b.s)) * W;
    const y = (b.y + 0.07 * noise1(t * 0.043, b.s + 10)) * H;
    glow(ctx, x, y, b.r, hues[i]!, b.a * en);
  });
  const ga = o.grid ?? 1;
  if (ga > 0.01) {
    ctx.save();
    ctx.globalAlpha = clamp(ga);
    const pat = ctx.createPattern(grid(), 'repeat')!;
    const ox = ((o.gx ?? 0) % 48 + 48) % 48, oy = ((o.gy ?? 0) % 48 + 48) % 48;
    ctx.translate(ox - 48, oy - 48);
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, W + 96, H + 96);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- finishing
let vig: Canvas | null = null;
export function vignette(ctx: Ctx, a = 1) {
  if (!vig) {
    vig = createCanvas(W, H);
    const g = vig.getContext('2d');
    const gr = g.createRadialGradient(W / 2, H * 0.48, H * 0.35, W / 2, H / 2, W * 0.72);
    gr.addColorStop(0, 'rgba(3,5,16,0)');
    gr.addColorStop(0.6, 'rgba(3,5,16,0.28)');
    gr.addColorStop(1, 'rgba(3,5,16,0.78)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  withAlpha(ctx, a, () => ctx.drawImage(vig!, 0, 0));
}

const grainTiles: Canvas[] = [];
function grainTile(i: number) {
  if (!grainTiles.length) {
    for (let k = 0; k < 6; k++) {
      const c = createCanvas(256, 256);
      const g = c.getContext('2d');
      const id = g.createImageData(256, 256);
      const rnd = mulberry32(1234 + k * 77);
      for (let p = 0; p < 256 * 256; p++) {
        const v = rnd();
        const white = v > 0.5;
        const a = Math.abs(v - 0.5) * 2;
        id.data[p * 4] = id.data[p * 4 + 1] = id.data[p * 4 + 2] = white ? 255 : 0;
        id.data[p * 4 + 3] = Math.round(a * a * 26);
      }
      g.putImageData(id, 0, 0);
      grainTiles.push(c);
    }
  }
  return grainTiles[i % grainTiles.length]!;
}
/** Film grain: also dithers the dark gradients so H.264 / YouTube don't band them. */
export function grain(ctx: Ctx, t: number, a = 1) {
  const f = Math.floor(t * 30);
  const tile = grainTile(f);
  const ox = (f * 97) % 256, oy = (f * 61) % 256;
  ctx.save();
  ctx.globalAlpha = a;
  const pat = ctx.createPattern(tile, 'repeat')!;
  ctx.translate(-ox, -oy);
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, W + 256, H + 256);
  ctx.restore();
}

// ---------------------------------------------------------------- HUD
export type Chapter = { n: string; label: string; start: number; end: number };
export function hud(ctx: Ctx, t: number, chapters: Chapter[], logoA: number) {
  for (const ch of chapters) {
    const inP = prog(t, ch.start, 0.7, ease.outCubic);
    const outP = prog(t, ch.end - 0.5, 0.5, ease.inCubic);
    const a = inP * (1 - outP);
    if (a <= 0.002) continue;
    withAlpha(ctx, a, () => {
      const x = 72, y = 70;
      ctx.fillStyle = rgba(C.text, 0.9);
      const barW = lerp(0, 34, inP);
      ctx.fillRect(x, y - 1, barW, 2);
      text(ctx, ch.n, x + 46, y + 7, { f: 'mono', size: 20, weight: 700, color: C.text, tracking: 1 });
      const nw = measure(ctx, ch.n, { f: 'mono', size: 20, weight: 700, tracking: 1 });
      text(ctx, ch.label.toUpperCase(), x + 46 + nw + 14, y + 7, { f: 'mono', size: 20, weight: 500, color: rgba(C.text2, 1), tracking: 2.5 });
    });
  }
  if (logoA > 0.002) {
    const lw = 230, lh = (img.logo.height / img.logo.width) * lw;
    withAlpha(ctx, logoA * 0.9, () => ctx.drawImage(img.logo, W - lw - 60, 38, lw, lh));
  }
}
