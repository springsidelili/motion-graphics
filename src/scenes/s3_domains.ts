// Scene 3 · What ACI does (slide 3).
// The ACI cell divides into three domains; each domain card explains itself with
// a working instrument icon. The domains feed one pool of shared instruments,
// which streams support and training to the research community; one stream then
// breaks out of ISCE² to industry. Services get their own mechanisms, and
// everything folds into "practical analytical solutions" → research / industry.
import { type Ctx, W, H } from '../engine/assets';
import { C, BRAND, DOMAINS } from '../engine/theme';
import { cue, clip } from '../engine/narration';
import type { Scene } from '../engine/scene';
import { clamp, ease, lerp, prog, rgba, keys, springAt, pulse, mixRGB, TAU, type Pt, hash } from '../engine/util';
import { text, glow, dot, withAlpha, withT, strokeStyle, polyPartial, rr, card, applyCam, lerpCam, CAM0, type Cam, bezierPts, revealWords, pill, measure, typeText } from '../engine/draw';
import * as I from '../engine/icons';
import { S3_DOT } from './s2_org';

export const S4_DOT = { x: W / 2, y: 132, r: 14, t: clip(4).offset + 0.1 };

const T = {
  aci: cue(3, 'ACI').t,
  three: cue(3, 'three technical domains').t,
  dom: [cue(3, 'chromatography').t, cue(3, 'X-ray').t, cue(3, 'NMR').t],
  together: cue(3, 'Together').t,
  range: cue(3, 'broad range').t,
  shared: cue(3, 'shared scientific resources').t,
  provide: cue(3, 'provide').t,
  support: cue(3, 'analytical and characterisation support').t,
  training: cue(3, 'technical training').t,
  community: cue(3, 'research community').t,
  beyond: cue(3, 'Beyond').t,
  internal: cue(3, 'internal R&D').t,
  extend: cue(3, 'extend our capabilities').t,
  industry: cue(3, 'industry partners').t,
  services: cue(3, 'providing services').t,
  svc: [cue(3, 'material characterisation').t, cue(3, 'failure diagnostics').t, cue(3, 'method development').t, cue(3, 'consultancy').t],
  collab: cue(3, 'collaboration').t,
  through: cue(3, 'Through these').t,
  sol: [cue(3, 'practical analytical').t, cue(3, 'analytical solutions').t, cue(3, 'solutions').t],
  research: cue(3, 'research and industry').t,
  industryNeeds: cue(3, 'industry needs').t,
  exit: clip(3).end - 0.35,
};

// ---------------------------------------------------------------- camera
const CAM_WIDE: Cam = { x: 1230, y: 560, z: 0.74 };
function cam(t: number): Cam {
  const out = prog(t, T.extend - 0.1, 1.5, ease.inOutCubic);
  const dive = prog(t, T.services - 0.45, 0.9, ease.inCubic);
  let c = lerpCam(CAM0, CAM_WIDE, out);
  c = lerpCam(c, { x: INDUSTRY.x, y: INDUSTRY.y, z: 3.2 }, dive);
  return dive >= 1 ? CAM0 : c;
}

// ---------------------------------------------------------------- section A: three domains
const DX = [420, 960, 1500];
const CARD = { w: 486, h: 560, y: 572 };
const CHIPY = 182;
type Rect = { cx: number; cy: number; w: number; h: number; r: number };
const lerpRect = (a: Rect, b: Rect, u: number): Rect => ({ cx: lerp(a.cx, b.cx, u), cy: lerp(a.cy, b.cy, u), w: lerp(a.w, b.w, u), h: lerp(a.h, b.h, u), r: lerp(a.r, b.r, u) });
const DOM_ICON = [I.chromatogram, I.xray, I.nmr];
const ABBR = ['C / MS', 'X-RAY', 'NMR'];

function domainRect(i: number, t: number): Rect {
  const circle: Rect = { cx: DX[i]!, cy: 560, w: 150, h: 150, r: 75 };
  const cardR: Rect = { cx: DX[i]!, cy: CARD.y, w: CARD.w, h: CARD.h, r: 30 };
  const chip: Rect = { cx: DX[i]!, cy: CHIPY, w: 470, h: 96, r: 22 };
  const m = springAt(t, T.dom[i]!, 0.72, 11);
  const d = prog(t, T.together + i * 0.07, 0.9, ease.inOutCubic);
  return lerpRect(lerpRect(circle, cardR, m), chip, d);
}

function drawDomains(ctx: Ctx, t: number) {
  const fadeOut = prog(t, T.provide - 0.1, 0.6, ease.inOutCubic);
  if (fadeOut >= 1) return;
  // the ACI cell
  const grow = springAt(t, T.aci, 0.55, 10);
  const split = prog(t, T.three, 1.0, ease.inOutCubic);
  if (split < 1) {
    const r = lerp(S3_DOT.r, 95, clamp(grow, 0, 1.15)) * lerp(1, 0.8, split);
    glow(ctx, W / 2, H / 2, r * 2.8, C.violet, 0.8 * (1 - split));
    const gr = ctx.createLinearGradient(W / 2 - r, H / 2 - r, W / 2 + r, H / 2 + r);
    gr.addColorStop(0, C.blue); gr.addColorStop(1, C.magenta);
    withAlpha(ctx, 1 - split * split, () => {
      ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, TAU); ctx.fillStyle = gr; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.stroke();
      text(ctx, 'ACI', W / 2, H / 2 + 20, { f: 'display', size: 58, weight: 700, align: 'center', alpha: clamp(grow) * (1 - split * 2) });
    });
  }
  // title
  const ta = prog(t, T.three + 0.1, 0.6) * (1 - prog(t, T.together, 0.5));
  if (ta > 0) {
    revealWords(ctx, ['3', 'technical', 'domains'], [T.three, T.three + 0.1, T.three + 0.4], t, W / 2, 205, { f: 'display', size: 50, weight: 600, align: 'center', alpha: 1 - prog(t, T.together, 0.5) });
  }
  // daughters: circles → cards → docked chips
  for (let i = 0; i < 3; i++) {
    if (split <= 0) break;
    const D = DOMAINS[i]!;
    const col = mixRGB(BRAND[i]!, D.color, split);
    const colS = rgba(col, 1);
    const R = domainRect(i, t);
    const x = lerp(W / 2, R.cx, split);
    // mitosis neck while dividing
    if (split < 1 && i !== 1) {
      const neck = Math.pow(1 - split, 1.4) * 70;
      withAlpha(ctx, 0.9, () => { strokeStyle(ctx, colS, neck * 2, 0.9); ctx.beginPath(); ctx.moveTo(W / 2, 560); ctx.lineTo(x, 560); ctx.stroke(); });
    }
    const morph = springAt(t, T.dom[i]!, 0.72, 11);
    withAlpha(ctx, 1 - fadeOut, () => {
      const w = split < 1 ? R.w * lerp(0.6, 1, split) : R.w, h = split < 1 ? R.h * lerp(0.6, 1, split) : R.h;
      glow(ctx, x, R.cy, Math.max(w, h) * 0.9, colS, 0.35);
      rr(ctx, x - w / 2, R.cy - h / 2, w, h, Math.min(R.r, w / 2, h / 2));
      const gr = ctx.createLinearGradient(0, R.cy - h / 2, 0, R.cy + h / 2);
      gr.addColorStop(0, rgba(col, lerp(0.9, 0.22, clamp(morph))));
      gr.addColorStop(1, rgba(col, lerp(0.75, 0.08, clamp(morph))));
      ctx.fillStyle = gr; ctx.fill();
      ctx.strokeStyle = rgba(col, lerp(1, 0.75, clamp(morph))); ctx.lineWidth = 2; ctx.stroke();
      const dock = prog(t, T.together + i * 0.07, 0.9, ease.inOutCubic);
      // circle label
      text(ctx, ABBR[i]!, x, R.cy + 8, { f: 'mono', size: 22, weight: 700, align: 'center', tracking: 2, alpha: split * (1 - clamp(morph * 3)) });
      if (morph > 0.05 && dock < 1) {
        withAlpha(ctx, clamp(morph * 1.5) * (1 - clamp(dock * 2.5)), () => {
          DOM_ICON[i]!(ctx, x, R.cy - 90, 330, t - T.dom[i]! - 0.2, D.color);
          D.name.forEach((ln, k) => text(ctx, ln, x, R.cy + 170 + k * 44, { f: 'display', size: 36, weight: 600, align: 'center' }));
          ctx.fillStyle = D.color; ctx.fillRect(x - 40, R.cy + 108, 80 * clamp(morph), 4);
        });
      }
      if (dock > 0.4) withAlpha(ctx, prog(dock, 0.5, 0.5), () => {
        DOM_ICON[i]!(ctx, x - R.w / 2 + 64, R.cy + 4, 88, 3 + t - T.dom[i]!, D.color);
        text(ctx, D.short, x - R.w / 2 + 128, R.cy + 9, { f: 'body', size: 21, weight: 600 });
      });
    });
  }
}

// ---------------------------------------------------------------- section B: shared pool → community
const INSTR: { l: string; d: number }[] = [
  { l: 'LC-MS', d: 0 }, { l: 'GC-MS', d: 0 }, { l: 'ICP-MS', d: 0 }, { l: 'GPC', d: 0 }, { l: 'CIC', d: 0 }, { l: 'GC×GC', d: 0 },
  { l: 'XPS', d: 1 }, { l: 'XRD', d: 1 }, { l: 'XRF', d: 1 }, { l: 'SEM', d: 1 }, { l: 'TEM', d: 1 }, { l: 'SAXS', d: 1 },
  { l: 'NMR', d: 2 }, { l: 'DSC', d: 2 }, { l: 'TGA', d: 2 }, { l: 'BET', d: 2 }, { l: 'FTIR', d: 2 }, { l: 'Raman', d: 1 },
];
const ROWS = [3, 4, 4, 4, 3];
const POOL0 = { x: 960, y: 640 }, POOL1 = { x: 660, y: 640 };
const NODE_R = 42;
const nodePos = (() => {
  const out: Pt[] = [];
  const order = [0, 6, 12, 1, 7, 13, 17, 2, 8, 14, 3, 9, 15, 4, 10, 16, 5, 11];
  let k = 0;
  ROWS.forEach((n, r) => { for (let j = 0; j < n; j++) out[order[k++]!] = { x: (j - (n - 1) / 2) * 104, y: (r - 2) * 90 }; });
  return out;
})();
const COMM = { x: 1480, y: 640, r: 210 };
const INDUSTRY = { x: 2260, y: 640, r: 150 };
const BOUND = { x: 300, y: 318, w: 1440, h: 648 };

function poolCenter(t: number) { const u = prog(t, T.provide - 0.1, 1.0, ease.inOutCubic); return { x: lerp(POOL0.x, POOL1.x, u), y: lerp(POOL0.y, POOL1.y, u) }; }

function drawPool(ctx: Ctx, t: number, a: number) {
  if (t < T.range - 0.8 || a <= 0) return;
  const P = poolCenter(t);
  withAlpha(ctx, a, () => {
    // links from the docked domain chips into the pool
    const la = 1 - prog(t, T.provide - 0.1, 0.5);
    for (let i = 0; i < 3; i++) {
      const lp = prog(t, T.range - 0.6 + i * 0.1, 0.7, ease.inOutCubic);
      if (lp <= 0 || la <= 0) continue;
      const s = { x: DX[i]!, y: CHIPY + 48 }, e = { x: P.x + (i - 1) * 150, y: P.y - 240 };
      const pts = bezierPts(s, { x: s.x, y: s.y + 120 }, { x: e.x, y: e.y - 120 }, e, 40);
      withAlpha(ctx, la, () => { strokeStyle(ctx, DOMAINS[i]!.color, 3, 0.8); ctx.setLineDash([10, 10]); ctx.lineDashOffset = -t * 40; polyPartial(ctx, pts, lp); ctx.setLineDash([]); });
    }
    // pool halo
    const hp = prog(t, T.range - 0.2, 0.8);
    glow(ctx, P.x, P.y, 420, C.blue, 0.35 * hp);
    ctx.beginPath(); ctx.arc(P.x, P.y, 275, 0, TAU * hp); strokeStyle(ctx, '#9FB0FF', 1.5, 0.35); ctx.setLineDash([4, 8]); ctx.stroke(); ctx.setLineDash([]);
    // instruments
    INSTR.forEach((n, i) => {
      const q = nodePos[i]!;
      const p = springAt(t, T.range + i * 0.055, 0.5, 15);
      if (p <= 0) return;
      const x = P.x + q.x, y = P.y + q.y, col = DOMAINS[n.d]!.color;
      const flick = 0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.7);
      withT(ctx, x, y, clamp(p, 0, 1.25), () => {
        glow(ctx, 0, 0, NODE_R * 1.8, col, 0.25 + 0.15 * flick);
        ctx.beginPath(); ctx.arc(0, 0, NODE_R, 0, TAU); ctx.fillStyle = rgba(C.ink1, 0.92); ctx.fill();
        strokeStyle(ctx, col, 2.5, 0.95); ctx.stroke();
        text(ctx, n.l, 0, 6, { f: 'mono', size: n.l.length > 4 ? 15 : 17, weight: 700, align: 'center' });
      });
    });
    const lbl = prog(t, T.shared, 0.6);
    text(ctx, 'Shared scientific resources', P.x, P.y + 330 + (1 - lbl) * 14, { f: 'display', size: 34, weight: 600, align: 'center', alpha: lbl });
  });
}

function lane(k: number, from: Pt, to: Pt, spread = 1): Pt[] {
  const dy = (k - 1.5) * 40 * spread;
  return bezierPts({ x: from.x, y: from.y + dy * 0.6 }, { x: from.x + 180, y: from.y + dy * 1.8 }, { x: to.x - 180, y: to.y + dy * 1.2 }, { x: to.x, y: to.y + dy * 0.5 }, 50);
}
function flow(ctx: Ctx, t: number, t0: number, pts: Pt[], color: string, n: number, speed: number, seed: number, a = 1) {
  const lp = prog(t, t0, 0.8, ease.inOutCubic);
  strokeStyle(ctx, color, 1.5, 0.3 * a);
  polyPartial(ctx, pts, lp);
  if (lp < 1) return;
  for (let j = 0; j < n; j++) {
    const u = (((t - t0) * speed + j / n + hash(seed, j) * 0.1) % 1 + 1) % 1;
    const q = pts[Math.floor(u * (pts.length - 1))]!;
    glow(ctx, q.x, q.y, 16, color, 0.8 * a * Math.sin(u * Math.PI));
    dot(ctx, q.x, q.y, 3, '#FFFFFF', a * Math.sin(u * Math.PI));
  }
}

function drawCommunity(ctx: Ctx, t: number, a: number) {
  if (t < T.provide || a <= 0) return;
  const P = poolCenter(t);
  withAlpha(ctx, a, () => {
    // support + training streams
    for (let k = 0; k < 4; k++) {
      const col = k < 2 ? C.cyan : C.gold;
      flow(ctx, t, (k < 2 ? T.support - 0.3 : T.training - 0.3) + k * 0.05, lane(k, { x: P.x + 290, y: P.y }, { x: COMM.x - COMM.r - 10, y: COMM.y }), col, 7, 0.45, k);
    }
    const tp = springAt(t, T.support, 0.6, 12);
    if (tp > 0) withAlpha(ctx, clamp(tp), () => pill(ctx, 'Analytical & characterisation support', (P.x + 290 + COMM.x - COMM.r) / 2, P.y - 150, { f: 'body', size: 20, weight: 600 }, C.cyan));
    const tr = springAt(t, T.training, 0.6, 12);
    if (tr > 0) withAlpha(ctx, clamp(tr), () => {
      const cx = (P.x + 290 + COMM.x - COMM.r) / 2, cy = P.y + 150;
      const w = pill(ctx, '      Technical training', cx, cy, { f: 'body', size: 20, weight: 600 }, C.gold);
      I.cap(ctx, cx - w / 2 + 34, cy + 2, 44, t - T.training, C.gold);
    });
    // community of researchers
    const cp = prog(t, T.provide + 0.2, 0.6);
    glow(ctx, COMM.x, COMM.y, COMM.r * 1.6, C.violet, 0.3 * cp);
    ctx.beginPath(); ctx.arc(COMM.x, COMM.y, COMM.r, 0, TAU * cp); strokeStyle(ctx, '#C3B2FF', 2, 0.5); ctx.stroke();
    const heads: Pt[] = [];
    [[0, 1], [70, 6], [135, 11]].forEach(([r, n]) => { for (let j = 0; j < n!; j++) { const an = (j / n!) * TAU + r! * 0.01; heads.push({ x: COMM.x + Math.cos(an) * r!, y: COMM.y + Math.sin(an) * r! * 0.92 }); } });
    heads.forEach((h, j) => {
      const p = springAt(t, T.provide + 0.3 + j * 0.03, 0.5, 15);
      if (p <= 0) return;
      const arr = pulse(t, T.community + (Math.hypot(h.x - COMM.x, h.y - COMM.y) / 135) * 0.3, 0.05, 0.6);
      const col = arr > 0.1 ? '#FFFFFF' : C.text2;
      withT(ctx, h.x, h.y, clamp(p, 0, 1.2) * 0.9, () => {
        if (arr > 0.02) glow(ctx, 0, 0, 40, C.violet, arr);
        strokeStyle(ctx, col, 3);
        ctx.beginPath(); ctx.arc(0, -10, 9, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 18, 17, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      });
    });
    const lb = prog(t, T.community, 0.6);
    text(ctx, 'Research community', COMM.x, COMM.y + COMM.r + 70 + (1 - lb) * 14, { f: 'display', size: 34, weight: 600, align: 'center', alpha: lb });
  });
}

function drawBoundary(ctx: Ctx, t: number, a: number) {
  if (t < T.internal - 0.6 || a <= 0) return;
  withAlpha(ctx, a, () => {
    const bp = prog(t, T.internal - 0.6, 1.1, ease.inOutCubic);
    const { x, y, w, h } = BOUND;
    const pts: Pt[] = [{ x: x + 40, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }, { x, y }, { x: x + 40, y }];
    strokeStyle(ctx, '#B9C6FF', 2, 0.7); ctx.setLineDash([12, 10]);
    polyPartial(ctx, pts, bp); ctx.setLineDash([]);
    const lp = springAt(t, T.internal, 0.6, 12);
    if (lp > 0) withAlpha(ctx, clamp(lp), () => {
      const s = 'ISCE²  ·  INTERNAL R&D';
      const st = { f: 'mono' as const, size: 22, weight: 700, tracking: 3 };
      const tw = measure(ctx, s, st) + 40;
      rr(ctx, x + 30, y - 24, tw, 48, 24); ctx.fillStyle = C.ink1; ctx.fill(); strokeStyle(ctx, '#B9C6FF', 2, 0.9); ctx.stroke();
      text(ctx, s, x + 50, y + 8, st);
    });
  });
}

function drawIndustry(ctx: Ctx, t: number, a: number) {
  if (t < T.extend - 0.2 || a <= 0) return;
  const P = poolCenter(t);
  withAlpha(ctx, a, () => {
    const from = { x: P.x + 150, y: P.y + 245 }, to = { x: INDUSTRY.x - INDUSTRY.r * 0.7, y: INDUSTRY.y + INDUSTRY.r * 0.7 };
    const pts = bezierPts(from, { x: from.x + 380, y: from.y + 330 }, { x: to.x - 700, y: to.y + 320 }, to, 70);
    ctx.save(); ctx.shadowColor = C.xray; ctx.shadowBlur = 14;
    strokeStyle(ctx, C.xray, 4, 0.9);
    const h = polyPartial(ctx, pts, prog(t, T.extend + 0.3, 1.3, ease.inOutCubic));
    ctx.restore();
    if (h && t < T.extend + 1.6) { glow(ctx, h.x, h.y, 60, C.xray, 1); dot(ctx, h.x, h.y, 6, '#fff'); }
    // breach flash where it crosses the boundary
    const crossX = BOUND.x + BOUND.w;
    const ci = pts.findIndex((q) => q.x >= crossX);
    if (ci > 0) { const f = pulse(t, T.extend + 0.3 + 1.3 * (ci / 70) * 0.9, 0.04, 0.7); if (f > 0.01) glow(ctx, crossX, pts[ci]!.y, 180, C.xray, f); }
    if (t > T.extend + 1.6) flow(ctx, t, T.extend + 1.6, pts, '#FFD2C2', 8, 0.35, 99);
    const ip = springAt(t, T.industry - 0.15, 0.55, 11);
    if (ip > 0) withT(ctx, INDUSTRY.x, INDUSTRY.y, clamp(ip, 0, 1.2), () => {
      glow(ctx, 0, 0, INDUSTRY.r * 2, C.xray, 0.45);
      ctx.beginPath(); ctx.arc(0, 0, INDUSTRY.r, 0, TAU); ctx.fillStyle = rgba(C.ink1, 0.9); ctx.fill(); strokeStyle(ctx, C.xray, 3); ctx.stroke();
      I.factory(ctx, 0, -8, 170, t - T.industry, C.xray);
    });
    const lb = prog(t, T.industry, 0.6);
    text(ctx, 'Industry partners', INDUSTRY.x, INDUSTRY.y + INDUSTRY.r + 80 + (1 - lb) * 20, { f: 'display', size: 50, weight: 600, align: 'center', alpha: lb });
  });
}

// ---------------------------------------------------------------- section D: services
const SVC = [
  { title: ['Material', 'Characterisation'], icon: I.lattice, color: C.cyan },
  { title: ['Failure', 'Diagnostics'], icon: I.crack, color: C.xray },
  { title: ['Method', 'Development'], icon: I.method, color: C.violet },
  { title: ['Consultancy &', 'Collaboration'], icon: I.venn, color: C.magenta },
];
const TILE = { w: 770, h: 300, xs: [165, 985], ys: [250, 600] };

function drawServices(ctx: Ctx, t: number) {
  if (t < T.services + 0.2) return;
  const conv = prog(t, T.through, 1.1, ease.inOutCubic);
  if (conv >= 1) return;
  const hp = prog(t, T.services + 0.2, 0.6);
  withAlpha(ctx, hp * (1 - prog(t, T.through, 0.5)), () => {
    typeText(ctx, 'SERVICES FOR INDUSTRY', t, T.services + 0.2, W / 2 - measure(ctx, 'SERVICES FOR INDUSTRY', { f: 'mono', size: 24, weight: 500, tracking: 6 }) / 2, 190, { f: 'mono', size: 24, weight: 500, color: C.text2, tracking: 6 }, 40);
  });
  SVC.forEach((s, i) => {
    const t0 = T.svc[i]!;
    const sp = springAt(t, t0 - 0.12, 0.6, 12);
    if (sp <= 0) return;
    const x = TILE.xs[i % 2]!, y = TILE.ys[Math.floor(i / 2)]!;
    const cx = x + TILE.w / 2, cy = y + TILE.h / 2;
    const k = lerp(clamp(sp, 0, 1.08), 0.15, conv);
    const px = lerp(cx, W / 2, conv), py = lerp(cy, H / 2, conv);
    withAlpha(ctx, clamp(sp * 2) * (1 - conv), () => withT(ctx, px, py, k, () => {
      card(ctx, -TILE.w / 2, -TILE.h / 2, TILE.w, TILE.h, { r: 28, stroke: rgba(s.color, 0.6), glow: s.color, glowA: 0.16 });
      s.icon(ctx, -TILE.w / 2 + 190, 6, 260, t - t0 + 0.05, s.color);
      text(ctx, `0${i + 1}`, -TILE.w / 2 + 380, -54, { f: 'mono', size: 22, weight: 700, color: s.color, tracking: 2 });
      const lines = i === 3 ? ['Consultancy', t > T.collab - 0.1 ? '& Collaboration' : ''] : s.title;
      revealWords(ctx, [lines[0]!], [t0], t, -TILE.w / 2 + 380, 0, { f: 'display', size: 44, weight: 600 });
      if (lines[1]) revealWords(ctx, [lines[1]!], [i === 3 ? T.collab : t0 + 0.12], t, -TILE.w / 2 + 380, 52, { f: 'display', size: 44, weight: 600 });
    }));
  });
}

// ---------------------------------------------------------------- section E: solutions → research / industry
function drawSolutions(ctx: Ctx, t: number) {
  if (t < T.through + 0.5) return;
  const ex = prog(t, T.exit, 0.9, ease.inOutCubic);
  // orb formed by the converging tiles
  const orb = prog(t, T.through + 0.6, 0.6, ease.outBack);
  const oy = lerp(H / 2, 380, prog(t, T.sol[0]! - 0.6, 0.7, ease.inOutCubic));
  const ox = W / 2;
  const toDot = ex;
  const R = lerp(lerp(0, 46, orb), S4_DOT.r, toDot);
  const dx = lerp(ox, S4_DOT.x, toDot), dy = lerp(oy, S4_DOT.y, toDot);
  glow(ctx, dx, dy, R * 4, C.violet, 0.8);
  const gr = ctx.createLinearGradient(dx - R, dy - R, dx + R, dy + R); gr.addColorStop(0, C.blue); gr.addColorStop(1, C.magenta);
  ctx.beginPath(); ctx.arc(dx, dy, Math.max(0.1, R), 0, TAU); ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; ctx.stroke();
  for (let k = 0; k < 2; k++) {
    const u = ((t - T.through) * 0.6 + k * 0.5) % 1;
    withAlpha(ctx, (1 - u) * 0.4 * (1 - ex), () => { ctx.beginPath(); ctx.arc(dx, dy, R + u * 90, 0, TAU); strokeStyle(ctx, C.violet, 2); ctx.stroke(); });
  }
  withAlpha(ctx, 1 - ex, () => {
    revealWords(ctx, ['Practical', 'analytical', 'solutions'], T.sol, t, W / 2, 540, { f: 'display', size: 76, weight: 700, align: 'center' }, { dur: 0.6 });
    // fork
    const stem = { x: W / 2, y: 585 }, mid = { x: W / 2, y: 650 };
    const targets = [{ x: 600, y: 760, t0: T.research, label: 'Research needs', icon: I.spectrum, col: C.cyan }, { x: 1320, y: 760, t0: T.industryNeeds, label: 'Industry needs', icon: I.factory, col: C.xray }];
    strokeStyle(ctx, '#C9D2FF', 3, 0.8);
    polyPartial(ctx, [stem, mid], prog(t, T.research - 0.7, 0.4));
    targets.forEach((g) => {
      const bp = prog(t, g.t0 - 0.45, 0.55, ease.inOutCubic);
      strokeStyle(ctx, g.col, 3, 0.9);
      const h = polyPartial(ctx, bezierPts(mid, { x: mid.x, y: g.y - 40 }, { x: g.x, y: mid.y + 20 }, { x: g.x, y: g.y - 60 }, 30), bp);
      if (h && bp < 1) { glow(ctx, h.x, h.y, 40, g.col, 1); }
      const p = springAt(t, g.t0, 0.55, 12);
      if (p > 0) withT(ctx, g.x, g.y + 30, clamp(p, 0, 1.2), () => {
        g.icon(ctx, 0, -10, 110, t - g.t0, g.col);
        text(ctx, g.label, 0, 110, { f: 'display', size: 38, weight: 600, align: 'center' });
      });
    });
  });
}

export const s3: Scene = {
  id: 'domains',
  start: S3_DOT.t,
  end: S4_DOT.t,
  bg: (t) => {
    const c = cam(t);
    // blend the colour fields toward the domain colours while the domain cards are up
    const dom = Math.round(16 * prog(t, T.dom[0]!, 1.5, ease.inOutCubic) * (1 - prog(t, T.together, 1.5, ease.inOutCubic))) / 16;
    const brand = [C.blue, C.violet, C.magenta], doms = [C.cms, C.xray, C.nmr];
    const hue = brand.map((b, i) => rgba(mixRGB(b, doms[i]!, dom), 1)) as [string, string, string];
    return { gx: -(c.x - W / 2) * c.z * 0.4, gy: -(c.y - H / 2) * c.z * 0.4, grid: 0.9, hue, energy: 1 };
  },
  draw(ctx, t) {
    // ISCE² diagram (sections A–C) lives in world space under the camera
    const diagA = 1 - prog(t, T.services - 0.2, 0.7, ease.inOutCubic);
    if (diagA > 0.002) {
      ctx.save();
      applyCam(ctx, cam(t));
      withAlpha(ctx, diagA, () => {
        drawBoundary(ctx, t, 1);
        drawPool(ctx, t, 1);
        drawCommunity(ctx, t, 1);
        drawIndustry(ctx, t, 1);
      });
      ctx.restore();
    }
    // domain cards stay screen-space (they dock as a header row)
    drawDomains(ctx, t);
    drawServices(ctx, t);
    drawSolutions(ctx, t);
  },
};
export const S3_TIMES = T;
