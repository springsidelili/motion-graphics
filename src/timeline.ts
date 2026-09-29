// The edit: scene windows on the master timeline + global finishing passes.
import type { Ctx } from './engine/assets';
import type { Scene } from './engine/scene';
import { DURATION, clip } from './engine/narration';
import { background, finish, hud, type Chapter } from './engine/post';
import { ease, prog, keys } from './engine/util';
import { s1 } from './scenes/s1_title';
import { s2, S3_DOT } from './scenes/s2_org';
import { s3, S4_DOT } from './scenes/s3_domains';
import { s4, HUB } from './scenes/s4_team';
import { s5, S5_TIMES } from './scenes/s5_resources';

export const END = DURATION;
export const scenes: Scene[] = [s1, s2, s3, s4, s5];

export const chapters: Chapter[] = [
  { n: '01', label: 'ACI in ISCE²', start: clip(2).offset + 0.3, end: S3_DOT.t },
  { n: '02', label: 'What we do', start: S3_DOT.t + 0.3, end: S4_DOT.t },
  { n: '03', label: 'Our team', start: S4_DOT.t + 0.4, end: HUB.t - 0.3 },
  { n: '04', label: 'Shared resource management', start: HUB.t + 0.4, end: S5_TIMES.end },
];

export function renderFrame(ctx: Ctx, t: number) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  const active = scenes.filter((s) => t >= s.start && t < s.end);
  const top = active[active.length - 1];
  background(ctx, t, top?.bg?.(t) ?? {});
  for (const s of active) { ctx.save(); s.draw(ctx, t); ctx.restore(); }
  hud(ctx, t, chapters, keys(t, [[clip(2).offset - 0.2, 0], [clip(2).offset + 0.6, 1], [S5_TIMES.end - 0.3, 1], [S5_TIMES.end + 0.4, 0]]));
  finish(ctx, 1);
  const fade = prog(t, END - 0.9, 0.9, ease.inCubic);
  if (fade > 0) { ctx.fillStyle = `rgba(0,0,0,${fade})`; ctx.fillRect(0, 0, 1920, 1080); }
}
