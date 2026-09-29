import { createCanvas, type Canvas } from '@napi-rs/canvas';
import { img, type Ctx, W, H } from './assets';
import { C } from './theme';
import { mulberry32, noise1, rgba, prog, ease, lerp } from './util';
import { glow, text, withAlpha, measure } from './draw';

// ---------------------------------------------------------------- background
// Cost matters (Skia runs on the CPU): the smooth colour fields are drawn at
// quarter resolution and upscaled; the dot grid and the vignette+grain overlay
// are pre-rendered once and blitted.
const LO = 4;
let lo: Canvas | null = null;
let gridFull: Canvas | null = null;
function grid() {
  if (gridFull) return gridFull;
  gridFull = createCanvas(W + 48, H + 48);
  const g = gridFull.getContext('2d');
  g.fillStyle = 'rgba(160,178,255,0.10)';
  for (let y = 24; y < H + 48; y += 48) for (let x = 24; x < W + 48; x += 48) { g.beginPath(); g.arc(x, y, 1.7, 0, Math.PI * 2); g.fill(); }
  return gridFull;
}

export type BG = { hue?: [string, string, string]; energy?: number; grid?: number; gx?: number; gy?: number; flash?: number };

/** Base plate: deep gradient, three drifting colour fields, microplate dot grid. */
export function background(ctx: Ctx, t: number, o: BG = {}) {
  if (!lo) lo = createCanvas(W / LO, H / LO);
  const l = lo.getContext('2d');
  l.setTransform(1, 0, 0, 1, 0, 0);
  l.globalCompositeOperation = 'source-over';
  const g = l.createLinearGradient(0, 0, (W * 0.3) / LO, H / LO);
  g.addColorStop(0, C.ink1);
  g.addColorStop(1, C.ink0);
  l.fillStyle = g;
  l.fillRect(0, 0, W / LO, H / LO);
  const hues = o.hue ?? [C.blue, C.violet, C.magenta];
  const en = o.energy ?? 1;
  const blobs = [
    { x: 0.18, y: 0.2, r: 900, a: 0.22, s: 1 },
    { x: 0.85, y: 0.3, r: 800, a: 0.17, s: 2 },
    { x: 0.6, y: 0.95, r: 1000, a: 0.14, s: 3 },
  ];
  l.scale(1 / LO, 1 / LO);
  blobs.forEach((b, i) => {
    const x = (b.x + 0.07 * noise1(t * 0.05, b.s)) * W;
    const y = (b.y + 0.07 * noise1(t * 0.043, b.s + 10)) * H;
    glow(l as unknown as Ctx, x, y, b.r, hues[i]!, b.a * en);
  });
  ctx.save();
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(lo, 0, 0, W, H);
  ctx.restore();
  const ga = o.grid ?? 1;
  if (ga > 0.01) {
    const ox = ((o.gx ?? 0) % 48 + 48) % 48, oy = ((o.gy ?? 0) % 48 + 48) % 48;
    withAlpha(ctx, ga, () => ctx.drawImage(grid(), ox - 48, oy - 48));
  }
}

// ---------------------------------------------------------------- finishing
let overlay: Canvas | null = null;
/**
 * Vignette + static fine grain in one pre-rendered layer. The grain is there to
 * dither the dark gradients (no banding after YouTube's re-encode); it is static
 * so it costs the encoder almost nothing.
 */
export function finish(ctx: Ctx, a = 1) {
  if (!overlay) {
    overlay = createCanvas(W, H);
    const g = overlay.getContext('2d');
    const gr = g.createRadialGradient(W / 2, H * 0.48, H * 0.35, W / 2, H / 2, W * 0.72);
    gr.addColorStop(0, 'rgba(3,5,16,0)');
    gr.addColorStop(0.6, 'rgba(3,5,16,0.28)');
    gr.addColorStop(1, 'rgba(3,5,16,0.78)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const nz = createCanvas(W, H), n = nz.getContext('2d');
    const id = n.createImageData(W, H);
    const rnd = mulberry32(1234);
    for (let p = 0; p < W * H; p++) {
      const v = rnd();
      const white = v > 0.5, k = Math.abs(v - 0.5) * 2;
      id.data[p * 4] = id.data[p * 4 + 1] = id.data[p * 4 + 2] = white ? 255 : 0;
      id.data[p * 4 + 3] = Math.round(k * k * 14);
    }
    n.putImageData(id, 0, 0);
    g.drawImage(nz, 0, 0);
  }
  withAlpha(ctx, a, () => ctx.drawImage(overlay!, 0, 0));
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
