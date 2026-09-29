// Scene 5 · Where the ACI labs are (slide 5).
// The hub from the resource scene becomes a map pin; the Level-1 site plan draws
// itself around it (a simplified vector redraw of the slide's plan). The eight
// ACI lab cells then lift out of the plan into a lab "stack" and are coloured by
// domain exactly when each lab number is spoken; the shared labs get hatching.
import { type Ctx, W, H } from '../engine/assets';
import { C, DOMAINS } from '../engine/theme';
import { cue, clip } from '../engine/narration';
import type { Scene } from '../engine/scene';
import { clamp, ease, lerp, prog, rgba, springAt, pulse, TAU, type Pt, keys } from '../engine/util';
import { text, glow, dot, withAlpha, withT, strokeStyle, polyPartial, rr, applyCam, lerpCam, type Cam, revealWords, typeText, measure, bezierPts } from '../engine/draw';
import { photoCard } from '../engine/kit';
import { PIN } from './s5_resources';

const T = {
  start: PIN.t,
  aciLabs: cue(5, 'ACI laboratories').t,
  institute: cue(5, 'within the Institute').t,
  eight: cue(5, 'Our eight').t,
  together: cue(5, 'conveniently located together').t,
  level: cue(5, 'level 1.').t,
  dom: [cue(5, 'Chromatography and Mass').t, cue(5, 'X-ray spectroscopy').t, cue(5, 'NMR Physical').t],
  labs: {
    '1-01': cue(5, '1-01.').t, '1-02': cue(5, '1-02,').t, '1-03': cue(5, '1-03').t, '1-06': cue(5, '1-06,').t,
    '1-04': cue(5, '1-04').t, '1-05': cue(5, '1-05.').t, '1-07': cue(5, '1-07').t, '1-08': cue(5, '1-08').t,
  } as Record<string, number>,
  shared: cue(5, 'shared laboratories').t,
  divisions: cue(5, 'other R&D divisions').t,
  close: cue(5, 'close to one another').t,
  teams: cue(5, 'our teams').t,
  integrated: cue(5, 'integrated analytical support').t,
  end: clip(5).end,
};

// ---------------------------------------------------------------- the plan (world coordinates)
const STRIP = { x: 452, y: 336, w: 86, h: 488 };
const STRIP_C = { x: STRIP.x + STRIP.w / 2, y: STRIP.y + STRIP.h / 2 };
type Shape = { pts: Pt[]; label?: string; lx?: number; ly?: number; vertical?: boolean; fill?: string; dash?: boolean };
const rect = (x: number, y: number, w: number, h: number): Pt[] => [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }, { x, y }];
const circle = (cx: number, cy: number, r: number, n = 64): Pt[] => Array.from({ length: n + 1 }, (_, i) => ({ x: cx + Math.cos((i / n) * TAU) * r, y: cy + Math.sin((i / n) * TAU) * r }));
const SHAPES: Shape[] = [
  { pts: [{ x: 260, y: 200 }, { x: 1640, y: 200 }, { x: 1700, y: 260 }, { x: 1700, y: 1000 }, { x: 260, y: 1000 }, { x: 260, y: 200 }], dash: true },
  { pts: rect(420, 250, 780, 610) },                                   // main building
  { pts: rect(640, 450, 420, 250) },                                   // courtyard
  { pts: rect(780, 540, 170, 80), label: 'MPH', lx: 865, ly: 588 },
  { pts: rect(820, 300, 150, 44), label: 'SHARED ANALYTICAL LABS', lx: 895, ly: 290 },
  { pts: circle(1400, 600, 150) }, { pts: circle(1400, 600, 112) },    // roundabout
  { pts: rect(1305, 574, 190, 52), label: 'HIGH PRESSURE', lx: 1400, ly: 606 },
  { pts: rect(1585, 480, 52, 200), label: 'ACDP', lx: 1611, ly: 580, vertical: true },
  { pts: rect(1230, 240, 360, 96), label: 'AMMONIA-HYDROGEN &\nMINERALISATION ZONE', lx: 1410, ly: 280 },
  { pts: rect(520, 900, 170, 46), label: 'CANTEEN', lx: 605, ly: 929 },
  { pts: rect(760, 900, 120, 40), label: 'LOBBY', lx: 820, ly: 926 },
  { pts: rect(1300, 950, 140, 36), label: 'MAIN GATE', lx: 1370, ly: 974 },
  { pts: rect(1460, 950, 150, 36), label: 'GUARDHOUSE', lx: 1535, ly: 974 },
];
const LAB_IDS = ['1-01', '1-02', '1-03', '1-04', '1-05', '1-06', '1-07', '1-08'];
const LAB_DOM: Record<string, number> = { '1-01': 0, '1-02': 1, '1-03': 1, '1-06': 1, '1-04': 2, '1-05': 2, '1-07': -1, '1-08': -1 };
const SHARED_LBL: Record<string, string> = { '1-07': 'ACI / SCBT', '1-08': 'ACI / FEMT / C3' };
/** lab cell i (0 = 1-01, bottom) inside the plan's ACI strip */
const cellRect = (i: number) => { const ch = STRIP.h / 8; return { x: STRIP.x + 8, y: STRIP.y + STRIP.h - (i + 1) * ch + 4, w: STRIP.w - 16, h: ch - 8 }; };

// ---------------------------------------------------------------- camera
const CAM_START: Cam = { x: STRIP_C.x, y: STRIP_C.y - (PIN.y - H / 2) / 1.7, z: 1.7 };
const CAM_MAP: Cam = { x: 980, y: 600, z: 0.95 };
function cam(t: number): Cam {
  return lerpCam(CAM_START, CAM_MAP, prog(t, T.start + 0.5, 3.4, ease.inOutCubic));
}
const toScreen = (c: Cam, p: Pt): Pt => ({ x: (p.x - c.x) * c.z + W / 2, y: (p.y - c.y) * c.z + H / 2 });

// ---------------------------------------------------------------- stack layout (screen)
const STACK = { x: 760, w: 820, h: 70, gap: 84, bottom: 940 };
function stackRect(i: number, t: number) {
  const gap = lerp(STACK.gap, 78, prog(t, T.close, 1.0, ease.inOutCubic));
  const y = STACK.bottom - STACK.h - i * gap;
  return { x: STACK.x, y, w: STACK.w, h: STACK.h };
}

function drawPlan(ctx: Ctx, t: number, a: number) {
  if (a <= 0.002) return;
  withAlpha(ctx, a, () => {
    SHAPES.forEach((s, k) => {
      const c0 = s.pts.reduce((m, p) => ({ x: m.x + p.x / s.pts.length, y: m.y + p.y / s.pts.length }), { x: 0, y: 0 });
      const d = Math.hypot(c0.x - STRIP_C.x, c0.y - STRIP_C.y);
      const t0 = T.start + 0.3 + d * 0.0022 + k * 0.03;
      const u = prog(t, t0, 1.0, ease.inOutCubic);
      if (u <= 0) return;
      if (!s.dash && u >= 1) { ctx.beginPath(); s.pts.forEach((q, j) => (j ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); ctx.fillStyle = rgba(C.panel, 0.28 * prog(t, t0 + 1.0, 0.5)); ctx.fill(); }
      if (s.dash) ctx.setLineDash([10, 12]);
      strokeStyle(ctx, '#AFC0FF', s.dash ? 1.5 : 2.5, s.dash ? 0.4 : 0.85);
      polyPartial(ctx, s.pts, u);
      ctx.setLineDash([]);
      if (s.label) {
        const la = prog(t, t0 + 0.7, 0.5);
        if (s.vertical) { ctx.save(); ctx.translate(s.lx!, s.ly!); ctx.rotate(-Math.PI / 2); text(ctx, s.label, 0, 5, { f: 'mono', size: 16, weight: 500, color: C.text2, align: 'center', tracking: 1, alpha: la }); ctx.restore(); }
        else s.label.split('\n').forEach((ln, j) => text(ctx, ln, s.lx!, s.ly! + j * 24, { f: 'mono', size: 16, weight: 500, color: C.text2, align: 'center', tracking: 1, alpha: la }));
      }
    });
    // the ACI strip
    const sp = prog(t, T.start + 0.2, 0.8, ease.inOutCubic);
    const hl = pulse(t, T.aciLabs, 0.08, 1.4);
    glow(ctx, STRIP_C.x, STRIP_C.y, 300, C.violet, 0.25 * sp + 0.5 * hl);
    strokeStyle(ctx, '#FFFFFF', 2.5, 0.9 * sp);
    polyPartial(ctx, rect(STRIP.x, STRIP.y, STRIP.w, STRIP.h), sp);
    ctx.save(); ctx.translate(STRIP.x + STRIP.w + 30, STRIP_C.y); ctx.rotate(-Math.PI / 2);
    text(ctx, 'ACI LABORATORIES', 0, 0, { f: 'mono', size: 16, weight: 700, color: '#FFFFFF', align: 'center', tracking: 3, alpha: prog(t, T.aciLabs, 0.5) });
    ctx.restore();
    text(ctx, 'LEVEL 1', 272, 236, { f: 'mono', size: 18, weight: 700, color: C.text2, tracking: 4, alpha: prog(t, T.start + 1.5, 0.6) });
  });
}

function drawPin(ctx: Ctx, t: number, c: Cam, a: number) {
  if (a <= 0.002) return;
  const anchor = toScreen(c, STRIP_C);
  const g = springAt(t, T.start, 0.5, 11);
  const lift = 46 * clamp(g, 0, 1.1);
  withAlpha(ctx, a, () => {
    ctx.save(); ctx.translate(anchor.x, anchor.y);
    const red = clamp(g);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-18, -lift * 0.5, -22, -lift + 10, -22, -lift); ctx.arc(0, -lift, 22, Math.PI, 0); ctx.bezierCurveTo(22, -lift + 10, 18, -lift * 0.5, 0, 0); ctx.closePath();
    ctx.fillStyle = rgba(C.red, red); ctx.shadowColor = C.red; ctx.shadowBlur = 20 * red; ctx.fill(); ctx.shadowBlur = 0;
    dot(ctx, 0, -lift, lerp(16, 8, red), '#FFFFFF');
    ctx.restore();
  });
}

function drawStack(ctx: Ctx, t: number, c: Cam) {
  if (t < T.eight - 0.1) return;
  const u = prog(t, T.eight - 0.1, 1.3, ease.inOutCubic);
  const exit = prog(t, T.end + 0.1, 0.5, ease.inOutCubic);
  LAB_IDS.forEach((id, i) => {
    const cr = cellRect(i);
    const a0 = toScreen(c, { x: cr.x, y: cr.y }), a1 = toScreen(c, { x: cr.x + cr.w, y: cr.y + cr.h });
    const S = stackRect(i, t);
    const del = clamp((u - i * 0.04) / (1 - 7 * 0.04));
    const e = ease.inOutCubic(del);
    const x = lerp(a0.x, S.x, e), y = lerp(a0.y, S.y, e), w = lerp(a1.x - a0.x, S.w, e), h = lerp(a1.y - a0.y, S.h, e);
    const lit = prog(t, T.eight + 0.15 + i * 0.16, 0.35);
    const dom = LAB_DOM[id]!;
    const ft = T.labs[id]!;
    const fill = prog(t, ft - 0.05, 0.55, ease.inOutCubic);
    const col = dom >= 0 ? DOMAINS[dom]!.color : C.violet;
    const isExitBar = id === '1-01';
    withAlpha(ctx, isExitBar ? 1 - prog(t, WASH.t + 0.5, 0.3) : 1 - exit, () => {
      // body
      rr(ctx, x, y, w, h, Math.min(14, h / 2)); ctx.fillStyle = rgba(C.ink1, 0.92); ctx.fill();
      strokeStyle(ctx, lit > 0 ? '#C9D2FF' : '#7F8FD6', 2, lerp(0.5, 0.9, lit)); ctx.stroke();
      const lp = pulse(t, T.eight + 0.15 + i * 0.16, 0.03, 0.4);
      if (lp > 0.02) glow(ctx, x + 40, y + h / 2, 70, '#9FB0FF', 0.35 * lp);
      // domain fill sweeps left → right on the spoken lab number
      if (fill > 0) {
        ctx.save(); rr(ctx, x, y, w, h, Math.min(14, h / 2)); ctx.clip();
        if (dom >= 0) { ctx.fillStyle = rgba(col, 0.85); ctx.fillRect(x, y, w * fill, h); }
        else { // shared: violet hatching
          ctx.fillStyle = rgba(C.violet, 0.35); ctx.fillRect(x, y, w * fill, h);
          strokeStyle(ctx, C.violet, 3, 0.8);
          for (let k = -h; k < w * fill; k += 18) { ctx.beginPath(); ctx.moveTo(x + k, y + h); ctx.lineTo(x + k + h, y); ctx.stroke(); }
        }
        ctx.restore();
        const fl = pulse(t, ft, 0.04, 0.6);
        if (fl > 0.02) glow(ctx, x + w * fill, y + h / 2, 90, col, fl);
      }
      if (e > 0.6) {
        const ta = prog(e, 0.6, 0.4);
        text(ctx, `LAB ${id}`, x + 26, y + h / 2 + 8, { f: 'mono', size: 22, weight: 700, color: '#FFFFFF', tracking: 2, alpha: ta });
        if (fill > 0.4) {
          const lbl = dom >= 0 ? DOMAINS[dom]!.short : SHARED_LBL[id]!;
          const la = dom >= 0 ? prog(t, ft + 0.1, 0.4) : prog(t, T.shared, 0.5);
          text(ctx, lbl, x + 190, y + h / 2 + 9, { f: 'display', size: 25, weight: 600, alpha: la * (isExitBar ? 1 - exit : 1) });
        }
      }
    });
  });
  // proximity: pulses running between neighbouring labs of different domains
  if (t > T.close - 0.3) {
    const pairs = [[0, 1], [2, 3], [4, 5], [1, 3], [3, 5]];
    pairs.forEach(([i, j], k) => {
      const A = stackRect(i!, t), B = stackRect(j!, t);
      const p0 = { x: A.x + A.w + 8, y: A.y + A.h / 2 }, p1 = { x: B.x + B.w + 8, y: B.y + B.h / 2 };
      const bulge = 50 + Math.abs(j! - i!) * 22;
      const pts = bezierPts(p0, { x: p0.x + bulge, y: p0.y }, { x: p1.x + bulge, y: p1.y }, p1, 30);
      const lp = prog(t, T.close - 0.3 + k * 0.12, 0.6, ease.inOutCubic) * (1 - exit);
      strokeStyle(ctx, '#C9D2FF', 2, 0.6 * (1 - exit));
      polyPartial(ctx, pts, lp);
      if (lp >= 1) { const q = pts[Math.floor(((t * 0.6 + k * 0.23) % 1) * 30)]!; glow(ctx, q.x, q.y, 18, C.cyan, 0.9 * (1 - exit)); dot(ctx, q.x, q.y, 3, '#fff', 1 - exit); }
    });
  }
  // header above the stack
  withAlpha(ctx, (1 - exit) * prog(t, T.eight, 0.5), () => {
    const hx = STACK.x, hy = STACK.bottom - STACK.h - 7 * STACK.gap - 38;
    const a1 = 1 - prog(t, T.integrated - 0.2, 0.4);
    const a2 = prog(t, T.integrated, 0.5);
    withAlpha(ctx, a1, () => {
      revealWords(ctx, ['8', 'analytical', 'labs'], [T.eight + 0.1, T.eight + 0.3, T.eight + 0.8], t, hx, hy, { f: 'display', size: 40, weight: 600 });
      const lw = measure(ctx, '8 analytical labs', { f: 'display', size: 40, weight: 600 });
      revealWords(ctx, ['·', 'Level', '1'], [T.level - 0.1, T.level, T.level + 0.1], t, hx + lw + 16, hy, { f: 'display', size: 40, weight: 600, color: C.cyan });
    });
    withAlpha(ctx, a2, () => revealWords(ctx, ['Integrated', 'analytical', 'support'], [T.integrated, T.integrated + 0.4, T.integrated + 1.2], t, hx, hy, { f: 'display', size: 40, weight: 600 }));
  });
}

function drawSide(ctx: Ctx, t: number) {
  const exit = prog(t, T.end + 0.1, 0.5, ease.inOutCubic);
  withAlpha(ctx, 1 - exit, () => {
    photoCard(ctx, t, T.together - 0.2, 'corridor', 110, 250, 560, 390, C.violet, { label: 'ACI Laboratories · Level 1', labelT: T.level, fx: 0.4, colorT: T.together + 0.6 });
    // legend: each domain appears when it is named, then shared labs
    const items: [string, string, number, boolean][] = [
      ...DOMAINS.map((d, i) => [d.short, d.color, T.dom[i]!, false] as [string, string, number, boolean]),
      ['Shared with other R&D divisions', C.violet, T.shared, true],
    ];
    items.forEach(([s, col, t0, hatch], k) => {
      const y = 700 + k * 62;
      const p = springAt(t, t0, 0.6, 13);
      if (p <= 0) return;
      withAlpha(ctx, clamp(p * 2), () => {
        withT(ctx, 136, y, clamp(p, 0, 1.15), () => {
          rr(ctx, -18, -18, 36, 36, 8); ctx.fillStyle = rgba(col, hatch ? 0.35 : 0.9); ctx.fill();
          if (hatch) { ctx.save(); rr(ctx, -18, -18, 36, 36, 8); ctx.clip(); strokeStyle(ctx, col, 3); for (let k2 = -36; k2 < 36; k2 += 12) { ctx.beginPath(); ctx.moveTo(k2, 18); ctx.lineTo(k2 + 36, -18); ctx.stroke(); } ctx.restore(); }
        });
        revealWords(ctx, [s], [t0], t, 176, y + 9, { f: 'body', size: 24, weight: 600 });
      });
    });
  });
}

/** Hand-off: lab 1-01 (blue) becomes the colour wash that opens the C/MS chapter. */
export const WASH = { t: T.end + 0.2 };
function drawWash(ctx: Ctx, t: number) {
  const u = prog(t, WASH.t, 0.7, ease.inOutCubic);
  if (u <= 0) return;
  const S = stackRect(0, t);
  const x = lerp(S.x, 0, u), y = lerp(S.y, 0, u), w = lerp(S.w, W, u), h = lerp(S.h, H, u);
  const fade = 1 - prog(t, WASH.t + 0.75, 0.9, ease.inOutCubic);
  withAlpha(ctx, fade, () => { rr(ctx, x, y, w, h, lerp(14, 0, u)); ctx.fillStyle = rgba(DOMAINS[0]!.color, 0.9); ctx.fill(); });
}

export const s6: Scene = {
  id: 'sitemap',
  start: T.start,
  end: WASH.t + 1.7,
  bg: (t) => { const c = cam(t); return { gx: -(c.x - W / 2) * c.z * 0.4, gy: -(c.y - H / 2) * c.z * 0.4, grid: 0.9 }; },
  draw(ctx, t) {
    const c = cam(t);
    const planA = keys(t, [[T.eight - 0.2, 1], [T.eight + 1.2, 0.1], [T.end, 0.1], [T.end + 0.4, 0]]);
    ctx.save(); applyCam(ctx, c); drawPlan(ctx, t, planA); ctx.restore();
    drawPin(ctx, t, c, 1 - prog(t, T.eight - 0.2, 0.5));
    drawSide(ctx, t);
    drawStack(ctx, t, c);
    drawWash(ctx, t);
  },
};
export const S6_TIMES = T;
void typeText;
