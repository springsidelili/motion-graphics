// Canvas backend. Scene code only ever talks to the standard Canvas 2D API; this
// module picks the implementation:
//
//   cpu (default)  @napi-rs/canvas: Skia raster on the CPU.
//   gpu            skia-canvas: Skia on the GPU (Metal on macOS, Vulkan on
//                  Linux / Windows). It falls back to the CPU by itself when no
//                  usable GPU is found (`npm run doctor` says which one you got).
//
// Pick it with `--backend gpu` on any script's command line (works in every
// shell), or with the environment variable ACI_BACKEND=gpu.
//
// Both backends are Skia with the same fonts, so frames match to within
// anti-aliasing noise and a film can be rendered with either.
import type { SKRSContext2D, Image as NapiImage, Canvas as NapiCanvas } from '@napi-rs/canvas';

export type Ctx = SKRSContext2D;
export type Img = NapiImage;
// typed as @napi-rs/canvas; skia-canvas objects offer the same Canvas 2D surface
export type AnyCanvas = NapiCanvas;
export type Backend = 'cpu' | 'gpu';

const argBackend = (() => {
  const i = process.argv.indexOf('--backend');
  if (i >= 0) return process.argv[i + 1];
  return process.argv.includes('--gpu') ? 'gpu' : undefined;
})();
export const BACKEND: Backend = (argBackend ?? process.env.ACI_BACKEND ?? 'cpu').toLowerCase() === 'gpu' ? 'gpu' : 'cpu';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const napi: any = BACKEND === 'cpu' ? await import('@napi-rs/canvas') : null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const skia: any = BACKEND === 'gpu' ? await import('skia-canvas').catch((e: Error) => {
  throw new Error(`--backend gpu needs the optional package skia-canvas, which failed to load (${e.message}). Run \`npm install\` again, or render with the CPU backend.`);
}) : null;

export function createCanvas(w: number, h: number): AnyCanvas {
  if (skia) { const c = new skia.Canvas(w, h); c.gpu = true; return c as AnyCanvas; }
  return napi.createCanvas(w, h);
}

export async function loadImage(file: string): Promise<Img> {
  return (skia ?? napi).loadImage(file);
}

/** Register font files under family aliases ('Display', 'Body', 'Mono'). */
export function registerFonts(files: [string, string][]) {
  if (skia) {
    const fams = new Map<string, string[]>();
    for (const [f, fam] of files) fams.set(fam, [...(fams.get(fam) ?? []), f]);
    for (const [fam, fs] of fams) skia.FontLibrary.use(fam, fs);
  } else for (const [f, fam] of files) napi.GlobalFonts.registerFromPath(f, fam);
}

/** Raw RGBA8 pixels of the whole canvas (the frame handed to the encoder). */
export function pixels(c: AnyCanvas): Uint8Array {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return skia ? (c as any).toBufferSync('raw') : (c as any).data();
}

export function png(c: AnyCanvas): Buffer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return skia ? (c as any).toBufferSync('png') : (c as any).toBuffer('image/png');
}

/** Start a frame from a clean slate (skia-canvas records a display list; reset() drops it). */
export function beginFrame(ctx: Ctx) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (skia && typeof (ctx as any).reset === 'function') (ctx as any).reset();
}

/** What the backend is actually running on (GPU name or CPU fallback reason). */
export function describe(): string {
  if (!skia) return 'cpu · @napi-rs/canvas (Skia raster)';
  const e = gpuEngine();
  return e.onGpu ? `gpu · skia-canvas · ${e.api ?? '?'} · ${e.device ?? '?'}` : `gpu requested, but running on the CPU · skia-canvas (${e.error ?? 'no GPU available'})`;
}

/** skia-canvas' own report of the device it drew on. */
export function gpuEngine(): { onGpu: boolean; api?: string; device?: string; driver?: string; error?: string } {
  if (!skia) return { onGpu: false };
  const c = new skia.Canvas(64, 64);
  c.gpu = true;
  c.getContext('2d').fillRect(0, 0, 1, 1);
  c.toBufferSync('raw');
  const e = c.engine ?? {};
  const onGpu = e.renderer ? String(e.renderer).toUpperCase() === 'GPU' : !!c.gpu;
  return { onGpu, api: e.api, device: e.device, driver: e.driver, error: e.error };
}
