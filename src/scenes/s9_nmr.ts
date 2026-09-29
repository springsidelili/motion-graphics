// Scenes 10–11 · NMR / Physical / Thermal Characterisation (slides 10 and 11).
// Selector passes to NMR; title card with the lead. Two areas side by side: NMR
// (a molecule whose atom groups light their spectrum peaks, then peak integrals
// for quantitative analysis) and the thermal/chemical/physical lab (a heating
// ramp with mass-loss and heat-flow curves, a porous particle). The two meet in
// a molecular ↔ bulk bridge that fans out to research, product development and
// problem solving. Slide 11 is the capability tree, with a temperature-program
// overlay and a molecular → physical → chemical → thermal journey at the end.
import { type Ctx, W, H } from '../engine/assets';
import { C, DOMAINS } from '../engine/theme';
import { cue, clip } from '../engine/narration';
import type { Scene } from '../engine/scene';
import { clamp, ease, lerp, prog, rgba, springAt, pulse, TAU, type Pt } from '../engine/util';
import { text, glow, dot, withAlpha, withT, strokeStyle, polyPartial, rr, revealWords, typeText, measure, card, checkMark, bezierPts } from '../engine/draw';
import { photoCard, domainSelector, domainTitle, CapabilityTree, popPill } from '../engine/kit';
import * as I from '../engine/icons';
import { S8_TIMES } from './s8_xray';

const COL = DOMAINS[2]!.color;
const T = {
  third: cue(10, 'third technical domain').t,
  start: cue(10, 'NMR, physical').t,
  two: cue(10, 'two areas').t,
  first: cue(10, 'The first is').t,
  nmr: cue(10, 'Nuclear Magnetic Resonance').t,
  liquid: cue(10, 'liquid-state NMR spectrometers').t,
  ident: cue(10, 'molecular structure identification').t,
  struct: cue(10, 'structural characterisation').t,
  quant: cue(10, 'quantitative analysis').t,
  second: cue(10, 'The second is').t,
  lab: cue(10, 'thermal, chemical').t,
  thermal: cue(10, 'thermal behavior').t,
  physical: cue(10, 'physical properties').t,
  other: cue(10, 'other characteristics').t,
  together: cue(10, 'Together, these capabilities').t,
  molecular: cue(10, 'molecular and bulk').t,
  bulk: cue(10, 'bulk property').t,
  complementary: cue(10, 'complementary information').t,
  research: cue(10, 'research,').t,
  product: cue(10, 'product development').t,
  problem: cue(10, 'problem solving').t,
  end10: clip(10).end,
  root: cue(11, 'Looking more closely').t,
  end11: clip(11).end,
};

// ---------------------------------------------------------------- slide 10 panels
const PANEL = { y: 215, w: 820, h: 560, xs: [110, 990] };
function panelBox(i: number, t: number) {
  const u = prog(t, T.together - 0.2, 1.0, ease.inOutCubic);
  const s = lerp(1, 0.62, u);
  const x = PANEL.xs[i]!, w = PANEL.w * s, h = PANEL.h * s;
  const cx = lerp(x + PANEL.w / 2, i === 0 ? 560 : 1360, u);
  return { x: cx - w / 2, y: lerp(PANEL.y, 170, u), w, h, s };
}

function nmrMechanism(ctx: Ctx, x: number, y: number, w: number, h: number, t: number) {
  // ethanol: CH3 – CH2 – OH, three proton groups → three peaks (integrals 3:2:1)
  const groups = [{ col: C.cyan, peak: 0.22, n: 3 }, { col: C.gold, peak: 0.55, n: 2 }, { col: C.magenta, peak: 0.82, n: 1 }];
  const mx = x + 110, my = y + h / 2 - 10;
  const atoms: { x: number; y: number; g: number; heavy?: boolean; lbl?: string }[] = [
    { x: mx - 60, y: my, g: 0, heavy: true, lbl: 'C' }, { x: mx + 20, y: my - 30, g: 1, heavy: true, lbl: 'C' }, { x: mx + 95, y: my + 5, g: 2, heavy: true, lbl: 'O' },
    { x: mx - 100, y: my - 40, g: 0 }, { x: mx - 100, y: my + 40, g: 0 }, { x: mx - 60, y: my + 52, g: 0 },
    { x: mx + 10, y: my - 82, g: 1 }, { x: mx + 50, y: my - 72, g: 1 }, { x: mx + 130, y: my - 30, g: 2 },
  ];
  const bonds = [[0, 1], [1, 2], [0, 3], [0, 4], [0, 5], [1, 6], [1, 7], [2, 8]];
  const ap = prog(t, T.liquid - 0.3, 0.6);
  withAlpha(ctx, ap, () => {
    strokeStyle(ctx, C.text2, 3);
    bonds.forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(atoms[a!]!.x, atoms[a!]!.y); ctx.lineTo(atoms[b!]!.x, atoms[b!]!.y); ctx.stroke(); });
    atoms.forEach((a) => {
      const lit = prog(t, T.ident + a.g * 0.35, 0.4);
      if (a.heavy) { dot(ctx, a.x, a.y, 17, C.panel); ctx.beginPath(); ctx.arc(a.x, a.y, 17, 0, TAU); strokeStyle(ctx, C.text2, 2.5); ctx.stroke(); text(ctx, a.lbl!, a.x, a.y + 7, { f: 'mono', size: 18, weight: 700, align: 'center' }); }
      else { if (lit > 0) glow(ctx, a.x, a.y, 26, groups[a.g]!.col, lit * (0.6 + 0.3 * Math.sin(t * 4 + a.x))); dot(ctx, a.x, a.y, 9, lit > 0.5 ? groups[a.g]!.col : '#FFFFFF'); }
    });
  });
  // spectrum
  const g0 = x + 280, g1 = x + w - 20, gb = y + h - 30, gt = y + 30;
  withAlpha(ctx, ap, () => { strokeStyle(ctx, C.text3, 2); ctx.beginPath(); ctx.moveTo(g0, gb); ctx.lineTo(g1, gb); ctx.stroke(); text(ctx, 'ppm', g1, gb + 26, { f: 'mono', size: 14, weight: 500, color: C.text2, align: 'right' }); });
  const dp = prog(t, T.liquid, 1.2, ease.inOutCubic);
  const N = 160, pts: Pt[] = [];
  for (let i = 0; i <= N; i++) {
    const v = i / N; let s = 0;
    groups.forEach((g) => { const c = g.peak, hh = g.n / 3; s += hh * (Math.exp(-((v - c + 0.012) ** 2) / 0.00008) + Math.exp(-((v - c - 0.012) ** 2) / 0.00008)) * 0.5 + hh * 0.2 * Math.exp(-((v - c) ** 2) / 0.00008); });
    pts.push({ x: lerp(g0, g1, v), y: gb - s * (gb - gt) * 0.95 });
  }
  strokeStyle(ctx, '#FFFFFF', 2.5); polyPartial(ctx, pts, dp);
  groups.forEach((g, k) => {
    const lit = prog(t, T.ident + k * 0.35, 0.4);
    const px = lerp(g0, g1, g.peak);
    if (lit > 0) { glow(ctx, px, gb - (g.n / 3) * (gb - gt) * 0.6, 40, g.col, 0.6 * lit); dot(ctx, px, gt - 2, 6, g.col, lit); }
    // integrals for quantitative analysis
    const q = prog(t, T.quant + k * 0.12, 0.5, ease.outCubic);
    if (q > 0) {
      const hh = (g.n / 3) * 70 * q;
      rr(ctx, px - 10, gb - 10 - hh, 20, hh, 4); ctx.fillStyle = rgba(g.col, 0.7); ctx.fill();
      text(ctx, `${g.n}H`, px + 16, gb - 16 - hh, { f: 'mono', size: 16, weight: 700, color: g.col, alpha: q });
    }
  });
}

function labMechanism(ctx: Ctx, x: number, y: number, w: number, h: number, t: number) {
  I.thermalCurve(ctx, x + w * 0.36, y + h / 2, h * 1.05, t - T.lab, COL);
  I.porous(ctx, x + w * 0.8, y + h / 2, h * 0.85, t - T.physical + 0.2, C.cyan);
}

function drawPanels(ctx: Ctx, t: number) {
  const exit = prog(t, T.end10 + 0.1, 0.6, ease.inOutCubic);
  const panels = [
    { t0: T.first, photo: 'nmr_nmr', title: ['Nuclear Magnetic', 'Resonance (NMR)'], titleT: T.nmr, sub: 'Liquid-state NMR spectrometers', subT: T.liquid, mech: nmrMechanism,
      checks: [['Molecular structure identification', T.ident], ['Structural characterisation', T.struct], ['Quantitative analysis', T.quant]] as [string, number][] },
    { t0: T.second, photo: 'nmr_lab', title: ['Thermal, chemical &', 'physical laboratory'], titleT: T.lab, sub: 'A wide range of instruments', subT: T.lab + 1.8, mech: labMechanism,
      checks: [['Thermal behaviour', T.thermal], ['Physical properties', T.physical], ['Other material characteristics', T.other]] as [string, number][] },
  ];
  panels.forEach((P, i) => {
    const e = prog(t, P.t0 - 0.2, 0.7, ease.outCubic);
    if (e <= 0) return;
    const B = panelBox(i, t);
    withAlpha(ctx, e * (1 - exit), () => withT(ctx, B.x, B.y, B.s, () => {
      card(ctx, 0, 0, PANEL.w, PANEL.h, { r: 28, fill: rgba(C.ink1, 0.82), stroke: rgba(COL, 0.55), glow: COL, glowA: 0.12 });
      photoCard(ctx, t, P.t0 - 0.1, P.photo, 24, 24, 330, 230, COL, { colorT: P.titleT + 0.4, fx: i === 0 ? 0.35 : 0.5 });
      P.title.forEach((ln, k) => revealWords(ctx, [ln], [P.titleT + k * 0.15], t, 380, 80 + k * 40, { f: 'display', size: 32, weight: 700 }));
      typeText(ctx, P.sub, t, P.subT, 380, 170, { f: 'mono', size: 18, weight: 500, color: COL, tracking: 1 }, 50, false);
      P.mech(ctx, 24, 270, PANEL.w - 48, 150, t);
      P.checks.forEach(([s, t0], k) => {
        const cp = springAt(t, t0, 0.55, 13);
        if (cp <= 0) return;
        const cy = 460 + k * 34;
        withT(ctx, 44, cy, clamp(cp, 0, 1.2), () => { ctx.beginPath(); ctx.arc(0, 0, 13, 0, TAU); ctx.fillStyle = rgba(COL, 0.25); ctx.fill(); checkMark(ctx, 0, 0, 12, prog(t, t0 + 0.05, 0.3), '#FFFFFF', 3); });
        revealWords(ctx, [s], [t0], t, 70, cy + 8, { f: 'body', size: 22, weight: 600 });
      });
    }));
  });
  // "Together": molecular ↔ bulk bridge, then the three things it supports
  const ba = (1 - exit) * prog(t, T.together + 0.3, 0.5);
  if (ba <= 0.002) return;
  withAlpha(ctx, ba, () => {
    const L = { x: 560, y: 660 }, R = { x: 1360, y: 660 };
    const mp = springAt(t, T.molecular, 0.55, 12), bp = springAt(t, T.bulk, 0.55, 12);
    if (mp > 0) withT(ctx, L.x, L.y, clamp(mp, 0, 1.15), () => {
      glow(ctx, 0, 0, 120, C.cyan, 0.4);
      const pos: Pt[] = [{ x: -40, y: 10 }, { x: 0, y: -20 }, { x: 40, y: 10 }, { x: 0, y: 40 }];
      strokeStyle(ctx, C.text2, 4); [[0, 1], [1, 2], [2, 3], [3, 0]].forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(pos[a!]!.x, pos[a!]!.y); ctx.lineTo(pos[b!]!.x, pos[b!]!.y); ctx.stroke(); });
      pos.forEach((p2, k) => dot(ctx, p2.x, p2.y, 14, [C.cyan, '#FFFFFF', C.cyan, C.gold][k]!));
      text(ctx, 'Molecular', 0, 96, { f: 'display', size: 34, weight: 700, align: 'center' });
    });
    if (bp > 0) withT(ctx, R.x, R.y, clamp(bp, 0, 1.15), () => {
      glow(ctx, 0, 0, 120, COL, 0.4);
      // isometric bulk block
      const s2 = 50;
      ctx.beginPath(); ctx.moveTo(0, -s2); ctx.lineTo(s2 * 0.9, -s2 * 0.5); ctx.lineTo(0, 0); ctx.lineTo(-s2 * 0.9, -s2 * 0.5); ctx.closePath(); ctx.fillStyle = rgba(COL, 0.9); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-s2 * 0.9, -s2 * 0.5); ctx.lineTo(0, 0); ctx.lineTo(0, s2); ctx.lineTo(-s2 * 0.9, s2 * 0.5); ctx.closePath(); ctx.fillStyle = rgba(COL, 0.55); ctx.fill();
      ctx.beginPath(); ctx.moveTo(s2 * 0.9, -s2 * 0.5); ctx.lineTo(0, 0); ctx.lineTo(0, s2); ctx.lineTo(s2 * 0.9, s2 * 0.5); ctx.closePath(); ctx.fillStyle = rgba(COL, 0.3); ctx.fill();
      text(ctx, 'Bulk properties', 0, 96, { f: 'display', size: 34, weight: 700, align: 'center' });
    });
    const ap = prog(t, T.complementary - 0.3, 0.7, ease.inOutCubic);
    strokeStyle(ctx, '#FFFFFF', 3, 0.8);
    const p0 = { x: L.x + 110, y: L.y }, p1 = { x: R.x - 110, y: R.y };
    polyPartial(ctx, [p0, p1], ap);
    if (ap >= 1) {
      for (const [a, b] of [[p0, { x: p0.x + 16, y: p0.y - 10 }], [p0, { x: p0.x + 16, y: p0.y + 10 }], [p1, { x: p1.x - 16, y: p1.y - 10 }], [p1, { x: p1.x - 16, y: p1.y + 10 }]] as Pt[][]) { ctx.beginPath(); ctx.moveTo(a!.x, a!.y); ctx.lineTo(b!.x, b!.y); ctx.stroke(); }
      const u = (t * 0.6) % 1; glow(ctx, lerp(p0.x, p1.x, u), p0.y, 24, C.cyan, 0.9); glow(ctx, lerp(p1.x, p0.x, u), p0.y, 24, COL, 0.9);
    }
    typeText(ctx, 'complementary information', t, T.complementary, W / 2 - measure(ctx, 'complementary information', { f: 'mono', size: 20, weight: 500, tracking: 2 }) / 2, L.y - 24, { f: 'mono', size: 20, weight: 500, color: C.text2, tracking: 2 }, 45, false);
    popPill(ctx, t, T.research, 'Research', 640, 910, C.cyan, 30);
    popPill(ctx, t, T.product, 'Product development', 960, 910, COL, 30);
    popPill(ctx, t, T.problem, 'Problem solving', 1300, 910, C.gold, 30);
  });
}

// ---------------------------------------------------------------- slide 11: capability tree + overlays
export const TREE = new CapabilityTree({
  domain: 2,
  root: ['NMR / Physical / Thermal'],
  rootT: T.root,
  previewT: cue(11, 'broadly grouped').t,
  wideT: cue(11, 'Together, these complementary').t,
  exitT: T.end11 + 0.3,
  top: 250,
  rows: [
    { title: ['NMR', 'spectroscopy'], icon: I.nmr, t: cue(11, 'First, for NMR').t, chips: [
      { title: 'Liquid-state NMR', sub: 'NMR spectrometers', t: cue(11, 'liquid-state NMR').t, tags: [{ text: 'cryoprobe', t: cue(11, 'cryoprobe,').t }, { text: 'iProbe', t: cue(11, 'iProbe').t }] },
      { title: 'Molecular structure', sub: 'structure characterisation', t: cue(11, 'molecular structure characterisation').t },
      { title: 'Quantitative analysis', sub: 'qNMR', t: cue(11, 'quantitative analysis').t },
    ] },
    { title: ['Chemical &', 'physical'], icon: I.porous, t: cue(11, 'The second area').t, chips: [
      { title: 'Surface area & pore size', sub: 'BET analyser', t: cue(11, 'surface area and pore size').t },
      { title: 'Particle size', sub: 'particle size analyser', t: cue(11, 'particle size').t },
      { title: 'Rheology', sub: 'rheometer', t: cue(11, 'rheology').t },
      { title: 'Spectroscopy', sub: 'FTIR (MIR / NIR) · UV-Vis', t: cue(11, 'spectroscopy,').t },
      { title: 'Dispersion & stability', sub: 'LUMiSizer · Turbiscan', t: cue(11, 'dispersion and stability').t },
      { title: 'Mechanical', sub: 'tensile tester · tensiometer', t: cue(11, 'mechanical').t },
      { title: 'Thermal conductivity', sub: 'thermal conductivity analyser', t: cue(11, 'thermal conductivity').t },
    ] },
    { title: ['Thermal', 'analysis'], icon: I.thermalCurve, t: cue(11, 'The third area').t, chips: [
      { title: 'TPDRO', sub: 'temp.-programmed TPD · TPR · TPO', t: cue(11, 'TPDRO').t },
      { title: 'Simultaneous DSC-TGA', sub: 'SDT', t: cue(11, 'simultaneous DSC-TGA').t },
      { title: 'DSC', sub: 'differential scanning calorimetry', t: cue(11, 'and DSC').t },
    ] },
  ],
});

const PROG = { t0: cue(11, 'allowing us to study').t, t1: cue(11, 'Together, these complementary').t + 0.2 };
/** Temperature-program overlay: sample heated at a controlled rate; mass and heat-flow respond. */
function drawTempProgram(ctx: Ctx, t: number) {
  const a = prog(t, PROG.t0, 0.5) * (1 - prog(t, PROG.t1, 0.5));
  if (a <= 0.002) return;
  withAlpha(ctx, a, () => {
    const x0 = 300, x1 = 1620, y0 = 810, y1 = 1010;
    card(ctx, x0 - 40, y0 - 30, x1 - x0 + 80, y1 - y0 + 50, { r: 24, fill: rgba(C.ink0, 0.9), stroke: rgba(COL, 0.5) });
    const u = prog(t, PROG.t0 + 0.2, 3.6, ease.inOutSine);
    const N = 120, ramp: Pt[] = [], mass: Pt[] = [], heat: Pt[] = [];
    for (let i = 0; i <= N; i++) {
      const v = i / N, x = lerp(x0 + 120, x1 - 20, v);
      ramp.push({ x, y: lerp(y1 - 10, y0 + 10, v) });
      mass.push({ x, y: y0 + 30 + 110 / (1 + Math.exp(-(v - 0.58) * 18)) });
      heat.push({ x, y: y1 - 40 - Math.exp(-((v - 0.35) ** 2) / 0.003) * 110 });
    }
    strokeStyle(ctx, C.xray, 3, 0.8); ctx.setLineDash([8, 8]); polyPartial(ctx, ramp, u); ctx.setLineDash([]);
    strokeStyle(ctx, COL, 4); const h1 = polyPartial(ctx, mass, u);
    strokeStyle(ctx, C.gold, 4); polyPartial(ctx, heat, u);
    if (h1 && u < 1) glow(ctx, h1.x, h1.y, 24, COL, 1);
    text(ctx, 'TEMPERATURE', x0, y0 + 30, { f: 'mono', size: 16, weight: 700, color: C.xray, tracking: 1 });
    text(ctx, 'MASS (TGA)', x0, y0 + 80, { f: 'mono', size: 16, weight: 700, color: COL, tracking: 1 });
    text(ctx, 'HEAT FLOW (DSC)', x0, y0 + 130, { f: 'mono', size: 16, weight: 700, color: C.gold, tracking: 1 });
    const temp = Math.round(25 + 875 * u);
    text(ctx, `${temp} °C`, x1 - 20, y0 + 20, { f: 'mono', size: 26, weight: 700, color: C.xray, align: 'right' });
  });
}

const JOURNEY = { t: [cue(11, 'molecular structure through').t, cue(11, 'physical, chemical').t, cue(11, 'chemical, and thermal').t, cue(11, 'thermal properties').t], all: cue(11, 'comprehensive understanding').t };
function drawJourney(ctx: Ctx, t: number) {
  const a = prog(t, JOURNEY.t[0]! - 0.3, 0.5) * (1 - prog(t, T.end11 + 0.1, 0.5));
  if (a <= 0.002) return;
  withAlpha(ctx, a, () => {
    const steps = ['Molecular structure', 'Physical', 'Chemical', 'Thermal'];
    const cols = [C.cyan, COL, C.gold, C.xray];
    const xs = [520, 900, 1200, 1500], y = 196;
    steps.forEach((s, k) => {
      const t0 = JOURNEY.t[k]!;
      if (k > 0) { strokeStyle(ctx, '#FFFFFF', 2.5, 0.7); polyPartial(ctx, [{ x: xs[k - 1]! + (k === 1 ? 150 : 80), y }, { x: xs[k]! - 80, y }], prog(t, t0 - 0.3, 0.3)); }
      const p = springAt(t, t0, 0.55, 13);
      if (p <= 0) return;
      const all = pulse(t, JOURNEY.all + k * 0.08, 0.05, 0.9);
      withT(ctx, xs[k]!, y, clamp(p, 0, 1.15), () => {
        const w = measure(ctx, s, { f: 'display', size: 28, weight: 600 }) + 44;
        glow(ctx, 0, 0, w * 0.6, cols[k]!, 0.25 + 0.5 * all);
        rr(ctx, -w / 2, -28, w, 56, 28); ctx.fillStyle = rgba(cols[k]!, 0.2); ctx.fill(); strokeStyle(ctx, cols[k]!, 2.5); ctx.stroke();
        text(ctx, s, 0, 10, { f: 'display', size: 28, weight: 600, align: 'center' });
      });
    });
  });
}

export const s9: Scene = {
  id: 'nmr',
  start: S8_TIMES.end9 + 0.4,
  end: T.end11 + 1.4,
  bg: () => ({ hue: [COL, C.blue, C.violet], grid: 0.9 }),
  draw(ctx, t) {
    const selA = prog(t, S8_TIMES.end9 + 0.95, 0.6) * (1 - prog(t, T.two - 0.6, 0.5));
    const dock = prog(t, T.start - 0.3, 0.9, ease.inOutCubic);
    domainSelector(ctx, t, 2, { a: selA, litT: T.third, prev: { i: 1, offT: T.third }, y: lerp(540, 176, dock), scale: lerp(1.25, 1, dock) });
    domainTitle(ctx, t, T.start, 2, { id: 'ong_li_li', name: 'Ong Li Li' }, T.start + 1.3, { outT: T.two - 0.5, y: 620 });
    withAlpha(ctx, prog(t, T.two - 0.1, 0.5) * (1 - prog(t, T.first - 0.3, 0.4)), () => revealWords(ctx, ['Two', 'areas'], [T.two - 0.2, T.two], t, W / 2, 560, { f: 'display', size: 72, weight: 700, align: 'center' }));
    drawPanels(ctx, t);
    TREE.draw(ctx, t);
    drawTempProgram(ctx, t);
    drawJourney(ctx, t);
  },
};
export const S9_TIMES = T;
void H; void bezierPts;
