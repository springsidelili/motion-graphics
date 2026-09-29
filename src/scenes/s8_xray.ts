// Scenes 8–9 · X-Ray Spectroscopy / Microscopy (slides 8 and 9).
// The domain selector passes the highlight from C/MS to X-ray; the title card
// lands with the domain lead. The instrument photos arrive as a filmstrip, then
// each instrument gets a spotlight: its real photo beside a mechanism that shows
// what it measures (zooming to nanometre scales, SAXS/WAXS rings, an XPS spectrum
// whose peak splits on "chemical", an in-situ XRD waterfall, an XRF map built
// pixel by pixel). Finished spotlights park in a tray; the finale wires every
// instrument to the properties it reveals. Slide 9 is the capability tree.
import { type Ctx, W, H } from '../engine/assets';
import { C, DOMAINS } from '../engine/theme';
import { cue, clip } from '../engine/narration';
import type { Scene } from '../engine/scene';
import { clamp, ease, lerp, prog, rgba, springAt, pulse, TAU, hash, mulberry32, type Pt } from '../engine/util';
import { text, glow, dot, withAlpha, withT, strokeStyle, polyPartial, rr, revealWords, typeText, measure, bezierPts, card } from '../engine/draw';
import { photoCard, domainSelector, domainTitle, CapabilityTree, popPill } from '../engine/kit';
import * as I from '../engine/icons';
import { S7_TIMES } from './s7_cms';

const COL = DOMAINS[1]!.color;
const T = {
  moving: cue(8, 'Moving on').t,
  second: cue(8, 'second technical domain').t,
  start: cue(8, 'X-ray Spectroscopy').t,
  lead: cue(8, 'Angeline Seo').t,
  here: cue(8, 'Here, you can see').t,
  instruments: cue(8, 'key instruments').t,
  sem: cue(8, 'SEM').t, tem: cue(8, 'TEM,').t, morph: cue(8, 'morphology and structure').t, small: cue(8, 'very small length scales').t,
  saxs: cue(8, 'SAXS').t, waxs: cue(8, 'WAXS').t, structures: cue(8, 'material structures').t,
  xps: cue(8, 'XPS').t, elemental: cue(8, 'surface elemental').t, chemical: cue(8, 'chemical analysis').t,
  xrd: cue(8, 'In addition').t, chamber: cue(8, 'reaction chamber').t, insitu: cue(8, 'in situ XRD').t, monitor: cue(8, 'monitor structural changes').t, conditions: cue(8, 'reaction conditions').t,
  xrf: cue(8, 'We also have XRF').t + 0.3, mapping: cue(8, 'mapping capability').t, distribution: cue(8, 'and distribution').t + 0.2,
  together: cue(8, 'Together, these instruments').t,
  props: [cue(8, 'the morphology', 1).t + 0.14, cue(8, 'structure, surface').t, cue(8, 'surface chemistry').t, cue(8, 'elemental composition').t],
  end8: clip(8).end,
  root: cue(9, 'Looking more closely').t,
  end9: clip(9).end,
};

// ---------------------------------------------------------------- spotlight items
type Item = { photo: string; label: string; t0: number; t1: number; caption: string; captionT: number; fx?: number; mech: (ctx: Ctx, x: number, y: number, w: number, h: number, t: number) => void };
const ITEMS: Item[] = [
  { photo: 'xray_sem', label: 'SEM · TEM', t0: T.sem - 0.35, t1: T.saxs - 0.45, caption: 'Morphology & structure at very small length scales', captionT: T.morph, mech: mechZoom },
  { photo: 'xray_saxs', label: 'SAXS / WAXS', t0: T.saxs - 0.35, t1: T.xps - 0.4, caption: 'Material structures from scattering patterns', captionT: T.structures, mech: mechSaxs, fx: 0.5 },
  { photo: 'xray_xps', label: 'XPS', t0: T.xps - 0.3, t1: T.xrd - 0.4, caption: 'Surface elemental & chemical analysis', captionT: T.elemental, mech: mechXps },
  { photo: 'xray_xrd', label: 'Powder XRD · in situ', t0: T.xrd - 0.1, t1: T.xrf - 0.6, caption: 'Structural changes under reaction conditions', captionT: T.monitor, mech: mechXrd, fx: 0.7 },
  { photo: 'xray_xrd', label: 'XRF mapping', t0: T.xrf - 0.4, t1: T.together - 0.3, caption: 'Elemental analysis & distribution', captionT: T.mapping + 0.4, mech: mechXrf, fx: 0.15 },
];
const STAGE = { px: 110, py: 250, pw: 640, ph: 470, mx: 800, mw: 1010 };
const TRAY = { y: 952, w: 190, h: 112, x0: 960 - 2 * 220 };
const trayPos = (k: number) => ({ x: TRAY.x0 + k * 220 - TRAY.w / 2, y: TRAY.y - TRAY.h / 2, w: TRAY.w, h: TRAY.h });
const stripPos = (k: number) => ({ x: 110 + k * 346, y: 330, w: 320, h: 250 });

function lerpBox(a: { x: number; y: number; w: number; h: number }, b: typeof a, u: number) { return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), w: lerp(a.w, b.w, u), h: lerp(a.h, b.h, u) }; }

function drawSpotlights(ctx: Ctx, t: number) {
  if (t < T.here - 0.2) return;
  const fin = prog(t, T.together - 0.3, 0.9, ease.inOutCubic); // tray → bipartite finale
  const exit = prog(t, T.end8 + 0.1, 0.6, ease.inOutCubic);
  // header for the filmstrip moment
  const hA = prog(t, T.here, 0.5) * (1 - prog(t, T.sem - 0.6, 0.5));
  withAlpha(ctx, hA, () => revealWords(ctx, ['Key', 'instruments'], [T.instruments - 0.2, T.instruments], t, W / 2, 230, { f: 'display', size: 50, weight: 600, align: 'center' }));
  ITEMS.forEach((it, k) => {
    // filmstrip → (stage while active) → tray → finale column
    const inStrip = prog(t, T.here + k * 0.12, 0.6, ease.outCubic);
    const toTray = prog(t, T.sem - 0.6, 0.8, ease.inOutCubic);
    const act = prog(t, it.t0, 0.7, ease.inOutCubic) * (1 - prog(t, it.t1, 0.7, ease.inOutCubic));
    let box = lerpBox(stripPos(k), trayPos(k), toTray);
    box = lerpBox(box, { x: STAGE.px, y: STAGE.py, w: STAGE.pw, h: STAGE.ph }, act);
    const finBox = { x: 330, y: 250 + k * 140, w: 190, h: 112 };
    box = lerpBox(box, finBox, fin);
    const dimmed = toTray > 0.5 && act < 0.5 && fin < 0.5;
    const a = inStrip * (1 - exit) * (dimmed ? (t > it.t1 ? 0.85 : 0.45) : 1);
    photoCard(ctx, t, T.here + k * 0.12, it.photo, box.x, box.y, box.w, box.h, COL, { a, r: lerp(14, 22, act), colorT: it.t0 + 0.2, fx: it.fx });
    // tray / finale label
    const la = (1 - act) * (1 - exit) * prog(t, T.here + 0.4 + k * 0.12, 0.4);
    if (la > 0.01) {
      const lx = lerp(box.x + box.w / 2, box.x - 18, fin), ly = lerp(box.y + box.h + 24, box.y + box.h / 2 + 8, fin);
      text(ctx, it.label, lx, ly, { f: 'mono', size: lerp(15, 19, fin), weight: 700, align: fin > 0.5 ? 'right' : 'center', color: fin > 0.5 ? '#FFFFFF' : C.text2, tracking: 1, alpha: la });
    }
    // active spotlight: title, caption and mechanism
    if (act > 0.01) withAlpha(ctx, act, () => {
      revealWords(ctx, [it.label], [it.t0 + 0.2], t, STAGE.px, STAGE.py + STAGE.ph + 70, { f: 'display', size: 46, weight: 700 });
      typeText(ctx, it.caption, t, it.captionT, STAGE.px, STAGE.py + STAGE.ph + 116, { f: 'body', size: 26, weight: 500, color: C.text2 }, 55, false);
      card(ctx, STAGE.mx, STAGE.py, STAGE.mw, STAGE.ph + 130, { r: 26, fill: rgba(C.ink1, 0.7), stroke: rgba(COL, 0.45) });
      ctx.save(); rr(ctx, STAGE.mx, STAGE.py, STAGE.mw, STAGE.ph + 130, 26); ctx.clip();
      it.mech(ctx, STAGE.mx, STAGE.py, STAGE.mw, STAGE.ph + 130, t);
      ctx.restore();
    });
  });
  // finale: instruments → the properties they reveal
  if (fin > 0.01) withAlpha(ctx, 1 - exit, () => {
    const PROPS = ['Morphology', 'Structure', 'Surface chemistry', 'Elemental composition'];
    const LINKS: number[][] = [[0], [0, 1, 3], [2], [2, 4]];
    const pc = [C.cyan, C.gold, C.magenta, C.nmr];
    PROPS.forEach((p, j) => {
      const t0 = T.props[j]!;
      const px = 1240, py = 300 + j * 170;
      LINKS[j]!.forEach((k, n) => {
        const a0 = { x: 330 + 190 + 10, y: 250 + k * 140 + 56 }, a1 = { x: px - 20, y: py };
        const lp = prog(t, t0 - 0.3 + n * 0.08, 0.5, ease.inOutCubic);
        strokeStyle(ctx, pc[j]!, 3, 0.8);
        const h = polyPartial(ctx, bezierPts(a0, { x: a0.x + 280, y: a0.y }, { x: a1.x - 280, y: a1.y }, a1, 40), lp);
        if (h && lp < 1) { glow(ctx, h.x, h.y, 30, pc[j]!, 1); dot(ctx, h.x, h.y, 4, '#fff'); }
        if (lp >= 1) { const u = ((t * 0.5 + n * 0.3 + j * 0.17) % 1); const q = bezierPts(a0, { x: a0.x + 280, y: a0.y }, { x: a1.x - 280, y: a1.y }, a1, 40)[Math.floor(u * 40)]!; glow(ctx, q.x, q.y, 14, pc[j]!, 0.8); }
      });
      const sp = springAt(t, t0, 0.55, 12);
      if (sp > 0) withT(ctx, px, py, clamp(sp, 0, 1.15), () => {
        const w = measure(ctx, p, { f: 'display', size: 40, weight: 600 }) + 60;
        glow(ctx, w / 2, 0, w * 0.6, pc[j]!, 0.25 + 0.4 * pulse(t, t0, 0.04, 0.8));
        rr(ctx, 0, -38, w, 76, 38); ctx.fillStyle = rgba(pc[j]!, 0.18); ctx.fill(); strokeStyle(ctx, pc[j]!, 2.5); ctx.stroke();
        text(ctx, p, 30, 14, { f: 'display', size: 40, weight: 600 });
      });
    });
  });
}

// ---------------------------------------------------------------- mechanisms
/** SEM/TEM: continuous zoom from grains to particles to an atomic lattice, with a live scale bar. */
function mechZoom(ctx: Ctx, x: number, y: number, w: number, h: number, t: number) {
  const cx = x + w / 2, cy = y + h / 2 - 20;
  const z = Math.exp(Math.max(0, t - T.morph + 0.4) * 1.25); // zoom factor, grows while talking about small length scales
  const L = Math.log10(z); // decades zoomed
  const layers = [
    { n: 34, r: 90, col: C.text3, seed: 1, kind: 'grain' },
    { n: 60, r: 26, col: C.cyan, seed: 2, kind: 'particle' },
    { n: 0, r: 10, col: COL, seed: 3, kind: 'lattice' },
  ];
  layers.forEach((ly, i) => {
    const s = z / Math.pow(10, i * 1.2); // this layer's on-screen scale
    const a = clamp(1 - Math.abs(Math.log10(s) - 0.3) / 0.9);
    if (a <= 0.01) return;
    withAlpha(ctx, a, () => {
      if (ly.kind === 'lattice') {
        const sp = 36 * s;
        for (let gy = -8; gy <= 8; gy++) for (let gx = -12; gx <= 12; gx++) {
          const px = cx + (gx + (gy % 2) * 0.5) * sp, py = cy + gy * sp * 0.87;
          if (Math.abs(px - cx) > w / 2 + 20 || Math.abs(py - cy) > h / 2 + 20) continue;
          glow(ctx, px, py, 14 * Math.min(2, s), COL, 0.5); dot(ctx, px, py, 5 * Math.min(2.5, s), '#FFFFFF');
        }
      } else {
        const rnd = mulberry32(ly.seed);
        for (let k = 0; k < ly.n; k++) {
          const px = cx + (rnd() - 0.5) * 900 * s, py = cy + (rnd() - 0.5) * 600 * s, r = ly.r * (0.6 + rnd() * 0.8) * s;
          if (Math.abs(px - cx) - r > w / 2 || Math.abs(py - cy) - r > h / 2) continue;
          ctx.beginPath();
          if (ly.kind === 'grain') { for (let q = 0; q < 7; q++) { const an = (q / 7) * TAU + k; const rr2 = r * (0.8 + 0.2 * Math.sin(k + q * 2)); q ? ctx.lineTo(px + Math.cos(an) * rr2, py + Math.sin(an) * rr2) : ctx.moveTo(px + Math.cos(an) * rr2, py + Math.sin(an) * rr2); } ctx.closePath(); ctx.fillStyle = rgba(C.panel, 0.9); ctx.fill(); strokeStyle(ctx, ly.col, 2, 0.8); ctx.stroke(); }
          else { ctx.arc(px, py, r, 0, TAU); ctx.fillStyle = rgba(ly.col, 0.25); ctx.fill(); strokeStyle(ctx, ly.col, 2, 0.9); ctx.stroke(); }
        }
      }
    });
  });
  // electron beam raster
  const rows = 14, k = (t * 0.9) % 1, row = Math.floor(k * rows), u = (k * rows) % 1;
  const by = y + 40 + (row + 0.5) * ((h - 200) / rows), bx = x + 60 + u * (w - 120);
  strokeStyle(ctx, C.cyan, 2, 0.35); ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(bx, by); ctx.stroke();
  glow(ctx, bx, by, 30, C.cyan, 0.9);
  // scale bar: 100 µm → 1 nm
  const labels = ['100 µm', '10 µm', '1 µm', '100 nm', '10 nm', '1 nm'];
  const idx = clamp(Math.floor(L * 1.25), 0, labels.length - 1);
  const frac = (L * 1.25) % 1;
  const barW = lerp(200, 90, frac);
  const sbx = x + w - 60 - barW, sby = y + h - 60;
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(sbx, sby, barW, 6);
  text(ctx, labels[idx]!, sbx + barW / 2, sby - 14, { f: 'mono', size: 24, weight: 700, align: 'center' });
  const mag = Math.round(1000 * z);
  text(ctx, `×${mag.toLocaleString('en-US')}`, x + 40, y + h - 48, { f: 'mono', size: 22, weight: 500, color: C.text2 });
  const sm = pulse(t, T.small, 0.05, 1.2);
  if (sm > 0.02) glow(ctx, cx, cy, 300, COL, 0.3 * sm);
}

/** SAXS/WAXS: beam → sample → 2D detector; small-angle rings near the centre, wide-angle outside. */
function mechSaxs(ctx: Ctx, x: number, y: number, w: number, h: number, t: number) {
  const cy = y + h / 2 - 30, sx = x + 250, dx = x + w - 330;
  strokeStyle(ctx, C.gold, 5, 0.9); ctx.beginPath(); ctx.moveTo(x + 40, cy); ctx.lineTo(sx, cy); ctx.stroke();
  for (let k = 0; k < 3; k++) { const u = ((t * 1.5 + k / 3) % 1); glow(ctx, lerp(x + 40, sx, u), cy, 18, C.gold, 0.9); }
  rr(ctx, sx - 10, cy - 50, 20, 100, 6); ctx.fillStyle = rgba(C.text2, 0.8); ctx.fill();
  text(ctx, 'SAMPLE', sx, cy + 84, { f: 'mono', size: 16, weight: 700, color: C.text2, align: 'center', tracking: 2 });
  // scattered cone to the detector
  withAlpha(ctx, 0.25, () => { ctx.beginPath(); ctx.moveTo(sx, cy); ctx.lineTo(dx, cy - 250); ctx.lineTo(dx, cy + 250); ctx.closePath(); ctx.fillStyle = rgba(COL, 0.4); ctx.fill(); });
  // detector face (seen in perspective as an ellipse-ish square)
  const D = { x: dx, y: cy - 260, w: 300, h: 520 };
  rr(ctx, D.x, D.y, D.w, D.h, 12); ctx.fillStyle = rgba(C.ink0, 0.9); ctx.fill(); strokeStyle(ctx, C.text2, 2); ctx.stroke();
  const ccx = D.x + D.w / 2, ccy = cy;
  ctx.save(); rr(ctx, D.x, D.y, D.w, D.h, 12); ctx.clip();
  const sa = prog(t, T.saxs, 0.6), wa = prog(t, T.waxs, 0.6);
  [36, 58, 84].forEach((r, k) => { const p = prog(sa, k * 0.2, 0.6); if (p > 0) { glow(ctx, ccx, ccy, r + 20, C.gold, 0.25 * p); ctx.beginPath(); ctx.arc(ccx, ccy, r * p, 0, TAU); strokeStyle(ctx, C.gold, 5, 0.9 * p); ctx.stroke(); } });
  [170, 215].forEach((r, k) => { const p = prog(wa, k * 0.2, 0.6); if (p > 0) { ctx.beginPath(); ctx.arc(ccx, ccy, r * p, 0, TAU); strokeStyle(ctx, COL, 6, 0.9 * p); ctx.stroke(); } });
  dot(ctx, ccx, ccy, 10, '#FFFFFF');
  ctx.restore();
  if (sa > 0) popPill(ctx, t, T.saxs + 0.1, 'SAXS · small angle', ccx - 170, D.y + D.h + 50, C.gold, 20);
  if (wa > 0) popPill(ctx, t, T.waxs + 0.1, 'WAXS · wide angle', ccx + 70, D.y - 30, COL, 20);
}

/** XPS: X-rays eject photoelectrons; a spectrum of element peaks builds, and C 1s splits on "chemical". */
function mechXps(ctx: Ctx, x: number, y: number, w: number, h: number, t: number) {
  const sy = y + 230, sx0 = x + 90, sx1 = x + 420;
  for (let i = 0; i < 9; i++) dot(ctx, sx0 + i * 40, sy, 13, [C.text3, C.cyan, C.text3, C.gold, C.text3, C.cyan, C.text3, C.magenta, C.text3][i]!);
  for (let i = 0; i < 8; i++) dot(ctx, sx0 + 20 + i * 40, sy + 38, 13, C.text3, 0.5);
  text(ctx, 'SURFACE', (sx0 + sx1) / 2, sy + 90, { f: 'mono', size: 16, weight: 700, color: C.text2, align: 'center', tracking: 2 });
  // incoming X-ray
  const pts: Pt[] = []; for (let i = 0; i <= 50; i++) { const v = i / 50; pts.push({ x: lerp(x + 60, sx0 + 150, v) + Math.sin(v * 30 - t * 14) * 6, y: lerp(y + 50, sy - 16, v) }); }
  strokeStyle(ctx, C.gold, 3); polyPartial(ctx, pts, 1);
  // electrons flying to the analyser
  for (let k = 0; k < 5; k++) { const u = ((t * 0.8 + k / 5) % 1); const ex = lerp(sx0 + 150, x + 520, u), ey = lerp(sy - 16, y + 60, u) - Math.sin(u * Math.PI) * 30; glow(ctx, ex, ey, 16, C.cyan, Math.sin(u * Math.PI)); dot(ctx, ex, ey, 4, '#fff', Math.sin(u * Math.PI)); }
  // spectrum
  const g0 = x + 500, g1 = x + w - 50, gb = y + h - 90, gt = y + 90;
  strokeStyle(ctx, C.text3, 2); ctx.beginPath(); ctx.moveTo(g0, gt); ctx.lineTo(g0, gb); ctx.lineTo(g1, gb); ctx.stroke();
  text(ctx, 'binding energy →', g1, gb + 34, { f: 'mono', size: 16, weight: 500, color: C.text2, align: 'right' });
  const split = prog(t, T.chemical, 0.9, ease.inOutCubic);
  const peaks = [{ c: 0.22, hgt: 0.55, lbl: 'N 1s', col: C.magenta }, { c: 0.5, hgt: 0.75, lbl: 'O 1s', col: C.gold }, { c: 0.8, hgt: 1, lbl: 'C 1s', col: C.cyan }];
  const draw = prog(t, T.xps + 0.1, 1.3, ease.inOutCubic);
  const N = 200, spec: Pt[] = [];
  for (let i = 0; i <= N; i++) {
    const v = i / N;
    let s = 0.04;
    peaks.forEach((p, k) => {
      if (k === 2) { s += p.hgt * (1 - split * 0.4) * Math.exp(-((v - p.c + 0.025 * split) ** 2) / 0.0006) + p.hgt * 0.55 * split * Math.exp(-((v - p.c - 0.045 * split) ** 2) / 0.0006); }
      else s += p.hgt * Math.exp(-((v - p.c) ** 2) / 0.0007);
    });
    spec.push({ x: lerp(g0, g1, v), y: gb - s * (gb - gt - 40) });
  }
  strokeStyle(ctx, '#FFFFFF', 3); const hd = polyPartial(ctx, spec, draw);
  if (hd && draw < 1) glow(ctx, hd.x, hd.y, 22, C.cyan, 1);
  peaks.forEach((p, k) => {
    const la = prog(t, T.elemental + k * 0.15, 0.4);
    const px = lerp(g0, g1, p.c), py = gb - p.hgt * (gb - gt - 40);
    text(ctx, p.lbl, px, py - 18, { f: 'mono', size: 20, weight: 700, color: p.col, align: 'center', alpha: la * (k === 2 ? 1 - split : 1) });
  });
  if (split > 0.05) {
    const c = peaks[2]!, px1 = lerp(g0, g1, c.c - 0.025), px2 = lerp(g0, g1, c.c + 0.045), py = gb - c.hgt * (gb - gt - 40);
    text(ctx, 'C–C', px1 - 10, py + 30, { f: 'mono', size: 18, weight: 700, color: C.cyan, align: 'right', alpha: split });
    text(ctx, 'C=O', px2 + 10, py + 150, { f: 'mono', size: 18, weight: 700, color: C.magenta, align: 'left', alpha: split });
    popPill(ctx, t, T.chemical + 0.3, 'chemical state', (g0 + g1) / 2 - 40, gt - 10, C.cyan, 20);
  }
}

/** In-situ XRD: a heated reaction chamber and a waterfall of patterns whose peaks shift and a new phase appears. */
function mechXrd(ctx: Ctx, x: number, y: number, w: number, h: number, t: number) {
  const cx = x + 170, cy = y + h / 2 - 10;
  const ch = prog(t, T.chamber, 0.6);
  withAlpha(ctx, clamp(0.35 + ch), () => {
    rr(ctx, cx - 90, cy - 120, 180, 240, 30); ctx.fillStyle = rgba(C.panel, 0.9); ctx.fill(); strokeStyle(ctx, COL, 3); ctx.stroke();
    const heat = prog(t, T.insitu, 3.0);
    glow(ctx, cx, cy + 40, 110, C.xray, 0.3 + 0.5 * heat * (0.8 + 0.2 * Math.sin(t * 5)));
    rr(ctx, cx - 50, cy + 10, 100, 26, 6); ctx.fillStyle = rgba(C.text2, 0.9); ctx.fill();
    text(ctx, 'REACTION CHAMBER', cx, cy + 170, { f: 'mono', size: 15, weight: 700, color: C.text2, align: 'center', tracking: 1 });
    // gas in / out
    for (const [x0, x1, yy] of [[cx - 170, cx - 92, cy - 70], [cx + 92, cx + 170, cy - 70]] as number[][]) {
      strokeStyle(ctx, C.cyan, 3, ch); ctx.beginPath(); ctx.moveTo(x0!, yy!); ctx.lineTo(x1!, yy!); ctx.stroke();
      const u = ((t * 0.9) % 1); dot(ctx, lerp(x0!, x1!, u), yy!, 5, C.cyan, ch);
    }
    text(ctx, 'gas', cx - 170, cy - 84, { f: 'mono', size: 15, weight: 500, color: C.cyan, alpha: ch });
    // temperature readout
    const temp = Math.round(25 + 575 * prog(t, T.insitu, 5.0, ease.inOutSine));
    text(ctx, `${temp} °C`, cx, cy - 150, { f: 'mono', size: 30, weight: 700, color: C.xray, align: 'center', alpha: prog(t, T.insitu - 0.3, 0.4) });
  });
  // waterfall of patterns
  const g0 = x + 380, g1 = x + w - 50, base = y + h - 70;
  const n = Math.floor(clamp((t - T.insitu + 0.2) / 0.42, 0, 12));
  for (let k = 0; k < n; k++) {
    const T_ = k / 11;
    const yb = base - k * 34;
    const pts: Pt[] = [];
    for (let i = 0; i <= 160; i++) {
      const v = i / 160;
      let s = 0;
      s += 1.0 * Math.exp(-((v - 0.25 + T_ * 0.03) ** 2) / 0.00025);
      s += 0.7 * Math.exp(-((v - 0.48 + T_ * 0.04) ** 2) / 0.0003);
      s += 0.5 * (1 - clamp((T_ - 0.45) / 0.2)) * Math.exp(-((v - 0.66) ** 2) / 0.0003);
      s += 0.8 * clamp((T_ - 0.45) / 0.2) * Math.exp(-((v - 0.78) ** 2) / 0.0003); // new phase
      pts.push({ x: lerp(g0, g1, v) + k * 6, y: yb - s * 110 });
    }
    const hot = T_;
    strokeStyle(ctx, rgba([lerp(120, 255, hot), lerp(170, 107, hot), lerp(255, 61, hot)], 1), 2.5, 0.35 + 0.65 * (k === n - 1 ? 1 : 0.6));
    polyPartial(ctx, pts, k === n - 1 ? prog(t - (T.insitu - 0.2) - k * 0.42, 0, 0.4) : 1);
  }
  if (n > 7) popPill(ctx, t, T.insitu - 0.2 + 7 * 0.42, 'new phase forms', g1 - 170, base - 12 * 34 - 60, C.xray, 20);
  text(ctx, '2θ →', g1, base + 40, { f: 'mono', size: 16, weight: 500, color: C.text2, align: 'right' });
  text(ctx, 'time / temperature ↑', g0 - 10, base - 12 * 34 - 20, { f: 'mono', size: 16, weight: 500, color: C.text2, alpha: n > 2 ? 1 : 0 });
}

/** XRF mapping: a beam spot raster-scans the sample; each pixel takes its element's colour. */
function mechXrf(ctx: Ctx, x: number, y: number, w: number, h: number, t: number) {
  const cols = 30, rows = 18, cell = 22;
  const gx = x + (w - cols * cell) / 2, gy = y + 60;
  const els = [{ n: 'Fe', c: C.xray, cx: 0.3, cy: 0.35 }, { n: 'Cu', c: C.cyan, cx: 0.72, cy: 0.3 }, { n: 'Zn', c: C.nmr, cx: 0.5, cy: 0.75 }];
  const done = clamp((t - T.mapping + 0.6) * 90, 0, cols * rows);
  rr(ctx, gx - 8, gy - 8, cols * cell + 16, rows * cell + 16, 10); strokeStyle(ctx, C.text2, 2, 0.8); ctx.stroke();
  for (let i = 0; i < cols * rows; i++) {
    const r = Math.floor(i / cols), c0 = r % 2 ? cols - 1 - (i % cols) : i % cols; // serpentine scan
    const px = gx + c0 * cell, py = gy + r * cell;
    if (i >= done) { ctx.fillStyle = rgba(C.panel, 0.5); ctx.fillRect(px + 1, py + 1, cell - 2, cell - 2); continue; }
    const u = (c0 + 0.5) / cols, v = (r + 0.5) / rows;
    let best = -1, bv = 0.18;
    els.forEach((e, k) => { const d = Math.exp(-(((u - e.cx) ** 2) + ((v - e.cy) ** 2)) / 0.02) * (0.8 + 0.4 * hash(i, k)); if (d > bv) { bv = d; best = k; } });
    ctx.fillStyle = best >= 0 ? rgba(els[best]!.c, clamp(0.3 + bv)) : rgba(C.text3, 0.25);
    ctx.fillRect(px + 1, py + 1, cell - 2, cell - 2);
  }
  if (done < cols * rows) {
    const i = Math.floor(done), r = Math.floor(i / cols), c0 = r % 2 ? cols - 1 - (i % cols) : i % cols;
    glow(ctx, gx + c0 * cell + cell / 2, gy + r * cell + cell / 2, 40, '#FFFFFF', 0.9);
  }
  els.forEach((e, k) => popPill(ctx, t, T.distribution + k * 0.15, e.n, x + w / 2 - 160 + k * 160, y + h - 70, e.c, 24));
}

// ---------------------------------------------------------------- slide 9: capability tree + length-scale ruler
export const TREE = new CapabilityTree({
  domain: 1,
  root: ['X-Ray Spectroscopy / Microscopy'],
  rootT: T.root,
  previewT: cue(9, 'group our instruments').t,
  wideT: cue(9, 'gas reaction').t,
  exitT: T.end9 + 0.3,
  rows: [
    { title: ['X-ray', 'characterisation'], icon: I.xray, t: cue(9, 'For X-ray characterisation').t, chips: [
      { title: 'Powder XRD', sub: 'X-ray diffraction · reaction chamber', t: cue(9, 'powder X-ray diffraction').t, tags: [{ text: 'in situ', t: cue(9, 'in-situ reaction').t }] },
      { title: 'XRF', sub: 'X-ray fluorescence', t: cue(9, 'X-ray fluorescence').t, tags: [{ text: 'mapping', t: cue(9, 'mapping capability').t }] },
      { title: 'SAXS / WAXS', sub: 'small & wide-angle scattering', t: cue(9, 'small and wide-angle').t },
    ] },
    { title: ['Electron', 'microscopy'], icon: I.emScope, t: cue(9, 'For electron microscopy').t, chips: [
      { title: 'SEM', sub: 'scanning electron microscopy', t: cue(9, 'SEM with').t, tags: [{ text: 'BEX', t: cue(9, 'BEX').t }, { text: 'EDS', t: cue(9, 'EDS and').t }] },
      { title: 'TEM', sub: 'transmission electron microscopy', t: cue(9, 'TEM with').t,
        tags: [{ text: 'EELS', t: cue(9, 'EELS.').t }, { text: '3D tomo', t: cue(9, '3D tomography').t }, { text: 'EDS', t: cue(9, 'EDS', 1).t }, { text: 'cryo', t: cue(9, 'Cryo-TEM,').t }] },
      { title: '3D X-ray micro-CT', sub: 'high-resolution tomography', t: cue(9, '3D X-ray micro-CT').t },
      { title: 'AFM', sub: 'atomic force microscopy', t: cue(9, 'atomic force microscopy').t },
    ] },
    { title: ['Surface &', 'molecular'], icon: I.surfaceProbe, t: cue(9, 'For surface and molecular').t, chips: [
      { title: 'XPS', sub: 'X-ray photoelectron spectroscopy', t: cue(9, 'XPS and').t, tags: [{ text: 'in-situ gas', t: cue(9, 'in situ gas').t }] },
      { title: 'Raman', sub: 'Raman spectroscopy', t: cue(9, 'Raman spectroscopy').t, tags: [{ text: 'in-situ gas', t: cue(9, 'in situ gas').t + 0.1 }] },
    ] },
  ],
});
const RULER = { t0: cue(9, 'allowing us to examine').t, scales: cue(9, 'different length scales').t, t1: cue(9, 'For surface and molecular').t - 0.3 };
function drawRuler(ctx: Ctx, t: number) {
  const a = prog(t, RULER.t0, 0.5) * (1 - prog(t, RULER.t1, 0.5));
  if (a <= 0.002) return;
  withAlpha(ctx, a, () => {
    const x0 = 260, x1 = 1660, y = 930;
    card(ctx, x0 - 60, y - 110, x1 - x0 + 120, 170, { r: 24, fill: rgba(C.ink0, 0.88), stroke: rgba(COL, 0.5) });
    const lp = prog(t, RULER.t0, 0.9, ease.inOutCubic);
    strokeStyle(ctx, '#FFFFFF', 3); polyPartial(ctx, [{ x: x0, y }, { x: x1, y }], lp);
    const marks = ['1 mm', '100 µm', '10 µm', '1 µm', '100 nm', '10 nm', '1 nm', '1 Å'];
    marks.forEach((m, k) => { const mx = lerp(x0, x1, k / (marks.length - 1)); if (lp * (marks.length - 1) >= k) { strokeStyle(ctx, '#FFFFFF', 2); ctx.beginPath(); ctx.moveTo(mx, y - 8); ctx.lineTo(mx, y + 8); ctx.stroke(); text(ctx, m, mx, y + 36, { f: 'mono', size: 16, weight: 500, color: C.text2, align: 'center' }); } });
    const span = (lo: number, hi: number, lbl: string, col: string, row: number, t0: number) => {
      const p = prog(t, t0, 0.5, ease.outCubic);
      if (p <= 0) return;
      const ax = lerp(x0, x1, lo / 7), bx = lerp(x0, x1, hi / 7), yy = y - 30 - row * 34;
      rr(ctx, ax, yy - 12, (bx - ax) * p, 24, 12); ctx.fillStyle = rgba(col, 0.75); ctx.fill();
      text(ctx, lbl, ax + 12, yy + 6, { f: 'mono', size: 15, weight: 700, color: C.ink0, alpha: p });
    };
    span(0, 3, 'MICRO-CT', C.gold, 0, RULER.scales - 0.3);
    span(1.5, 5.5, 'SEM', C.cyan, 1, RULER.scales - 0.15);
    span(3.5, 6.2, 'AFM', C.magenta, 0, RULER.scales);
    span(5, 7, 'TEM', COL, 1, RULER.scales + 0.15);
  });
}

export const s8: Scene = {
  id: 'xray',
  start: S7_TIMES.end7 + 0.4,
  end: T.end9 + 1.4,
  bg: () => ({ hue: [COL, C.violet, C.magenta], grid: 0.9 }),
  draw(ctx, t) {
    // domain switch + title
    const selA = prog(t, S7_TIMES.end7 + 0.95, 0.6) * (1 - prog(t, T.here - 0.5, 0.5));
    const dock = prog(t, T.start - 0.3, 0.9, ease.inOutCubic);
    domainSelector(ctx, t, 1, { a: selA, litT: T.second, prev: { i: 0, offT: T.second }, y: lerp(540, 176, dock), scale: lerp(1.25, 1, dock) });
    domainTitle(ctx, t, T.start, 1, { id: 'angeline_seo', name: 'Angeline Seo' }, T.lead, { outT: T.here - 0.4, y: 620 });
    drawSpotlights(ctx, t);
    TREE.draw(ctx, t);
    drawRuler(ctx, t);
  },
};
export const S8_TIMES = T;
void typeText; void H; void I;
