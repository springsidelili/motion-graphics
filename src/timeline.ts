// The edit: scene windows on the master timeline + global finishing passes.
import type { Ctx } from './engine/assets';
import { beginFrame } from './engine/canvas';
import type { Scene } from './engine/scene';
import { DURATION, clip } from './engine/narration';
import { background, finish, hud, type Chapter } from './engine/post';
import { ease, prog, keys } from './engine/util';
import { s1 } from './scenes/s1_title';
import { s2, S3_DOT } from './scenes/s2_org';
import { s3, S4_DOT } from './scenes/s3_domains';
import { s4, HUB } from './scenes/s4_team';
import { s5, S5_TIMES } from './scenes/s5_resources';
import { s6 } from './scenes/s6_sitemap';
import { s7 } from './scenes/s7_cms';
import { s8 } from './scenes/s8_xray';
import { s9 } from './scenes/s9_nmr';
import { s10 } from './scenes/s10_summary';

export const END = DURATION;
export const scenes: Scene[] = [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10];

export const chapters: Chapter[] = [
  { n: '01', label: 'ACI in ISCE²', start: clip(2).offset + 0.3, end: S3_DOT.t },
  { n: '02', label: 'What we do', start: S3_DOT.t + 0.3, end: S4_DOT.t },
  { n: '03', label: 'Our team', start: S4_DOT.t + 0.4, end: HUB.t - 0.3 },
  { n: '04', label: 'Shared resource management', start: HUB.t + 0.4, end: S5_TIMES.end },
  { n: '05', label: 'Our laboratories', start: clip(5).offset + 0.4, end: clip(5).end + 0.3 },
  { n: '06', label: 'Chromatography / Mass Spectrometry', start: clip(6).offset + 0.3, end: clip(7).end + 0.4 },
  { n: '07', label: 'X-Ray Spectroscopy / Microscopy', start: clip(8).offset + 0.3, end: clip(9).end + 0.4 },
  { n: '08', label: 'NMR / Physical / Thermal', start: clip(10).offset + 0.3, end: clip(11).end + 0.4 },
  { n: '09', label: 'Capabilities at a glance', start: clip(12).offset + 0.2, end: clip(12).end + 0.3 },
];

export function renderFrame(ctx: Ctx, t: number) {
  beginFrame(ctx);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  const active = scenes.filter((s) => t >= s.start && t < s.end);
  const top = active[active.length - 1];
  background(ctx, t, top?.bg?.(t) ?? {});
  for (const s of active) { ctx.save(); s.draw(ctx, t); ctx.restore(); }
  hud(ctx, t, chapters, keys(t, [[clip(2).offset - 0.2, 0], [clip(2).offset + 0.6, 1], [clip(12).end, 1], [clip(12).end + 0.7, 0]]));
  finish(ctx, 1);
  const fade = prog(t, END - 0.9, 0.9, ease.inCubic);
  if (fade > 0) { ctx.fillStyle = `rgba(0,0,0,${fade})`; ctx.fillRect(0, 0, 1920, 1080); }
}
