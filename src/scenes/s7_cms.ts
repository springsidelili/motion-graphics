// Scenes 6–7 · Chromatography / Mass Spectrometry (slides 6 and 7).
// Opener: the domain selector lights C/MS and its title card lands with the lead.
// The three key areas (GC, LC, MS) arrive as real lab photos on their names; a
// working mechanism then *shows* separate → identify → analyse (a sample splits
// into bands in a column, the bands draw a chromatogram as they elute, and a
// mass spectrum rises). Slide 7 becomes a capability tree whose instruments pop
// in on their spoken names.
import { type Ctx, W, H } from '../engine/assets';
import { C, DOMAINS } from '../engine/theme';
import { cue, clip } from '../engine/narration';
import type { Scene } from '../engine/scene';
import { clamp, ease, lerp, prog, rgba, springAt, pulse, TAU, hash, type Pt } from '../engine/util';
import { text, glow, dot, withAlpha, withT, strokeStyle, polyPartial, rr, revealWords, typeText, measure } from '../engine/draw';
import { photoCard, domainSelector, domainTitle, CapabilityTree, popPill } from '../engine/kit';
import * as I from '../engine/icons';
import { WASH } from './s6_sitemap';

const COL = DOMAINS[0]!.color;
const T = {
  three: cue(6, 'three technical domains').t,
  start: cue(6, 'chromatography and mass').t,
  areas: cue(6, 'three key areas').t,
  gc: cue(6, 'gas chromatography').t,
  lc: cue(6, 'liquid chromatography').t,
  ms: cue(6, 'mass spectrometry', 1).t,
  techniques: cue(6, 'These complementary').t,
  separate: cue(6, 'separate').t,
  identify: cue(6, 'identify').t,
  analyse: cue(6, 'analyze').t,
  compounds: cue(6, 'chemical compounds').t,
  routine: cue(6, 'routine testing').t,
  complex: cue(6, 'complex analytical investigations').t,
  following: cue(6, 'In the following').t,
  capabilities: cue(6, 'key analytical capabilities').t,
  instrumentation: cue(6, 'instrumentation').t,
  end6: clip(6).end,
  root: cue(7, 'Within this domain').t,
  end7: clip(7).end,
};

// ---------------------------------------------------------------- slide 6
const PHOTOS: [string, string, number][] = [['cms_gc', 'Gas chromatography', T.gc], ['cms_lc', 'Liquid chromatography', T.lc], ['cms_ms', 'Mass spectrometry', T.ms]];
function photoRect(i: number, t: number) {
  const big = { x: 110 + i * 590, y: 290, w: 520, h: 400 };
  const small = { x: 590 + i * 260, y: 150, w: 230, h: 150 };
  const u = prog(t, T.techniques - 0.3, 0.9, ease.inOutCubic);
  return { x: lerp(big.x, small.x, u), y: lerp(big.y, small.y, u), w: lerp(big.w, small.w, u), h: lerp(big.h, small.h, u) };
}

// separation mechanism ------------------------------------------------------
const INJ = T.techniques + 0.2;
const SPECIES = [
  { c: C.gold, exit: 1.7, peak: 0.85, mz: [0.2, 0.55, 1, 0.3] },
  { c: C.magenta, exit: 2.6, peak: 1.0, mz: [0.4, 1, 0.25, 0.6, 0.15] },
  { c: C.cyan, exit: 3.5, peak: 0.65, mz: [1, 0.35, 0.5] },
];
const MX = { vial: 230, c0: 330, c1: 1000, y: 730, cg0: 1090, cg1: 1470, ms0: 1560, ms1: 1820 };
function drawSeparation(ctx: Ctx, t: number, a: number) {
  if (a <= 0.002 || t < T.techniques - 0.2) return;
  const tau = t - INJ;
  withAlpha(ctx, a, () => {
    const ap = prog(t, T.techniques - 0.2, 0.6);
    // vial
    withAlpha(ctx, ap, () => {
      rr(ctx, MX.vial - 34, MX.y - 70, 68, 120, 12); strokeStyle(ctx, C.text2, 2.5); ctx.stroke();
      ctx.fillStyle = rgba(C.panel, 0.8); ctx.fillRect(MX.vial - 30, MX.y - 20, 60, 66);
      for (let k = 0; k < 18; k++) { const sp = SPECIES[k % 3]!; const inj = tau > 0.2 + (k % 6) * 0.05; if (!inj) dot(ctx, MX.vial - 22 + hash(k) * 44, MX.y - 12 + hash(k, 2) * 52 + Math.sin(t * 3 + k) * 2, 4, sp.c); }
      text(ctx, 'SAMPLE', MX.vial, MX.y + 86, { f: 'mono', size: 16, weight: 700, color: C.text2, align: 'center', tracking: 2 });
      // column
      rr(ctx, MX.c0, MX.y - 22, MX.c1 - MX.c0, 44, 22); ctx.fillStyle = rgba(C.panel, 0.6); ctx.fill(); strokeStyle(ctx, COL, 2.5, 0.9); ctx.stroke();
      for (let k = 0; k < 60; k++) dot(ctx, MX.c0 + 14 + (k % 30) * ((MX.c1 - MX.c0 - 28) / 29), MX.y - 8 + Math.floor(k / 30) * 16, 2.2, C.text3, 0.7);
      strokeStyle(ctx, C.text2, 2); ctx.beginPath(); ctx.moveTo(MX.vial + 34, MX.y); ctx.lineTo(MX.c0, MX.y); ctx.moveTo(MX.c1, MX.y); ctx.lineTo(MX.cg0 - 20, MX.y); ctx.stroke();
      text(ctx, 'COLUMN', (MX.c0 + MX.c1) / 2, MX.y + 86, { f: 'mono', size: 16, weight: 700, color: C.text2, align: 'center', tracking: 2 });
    });
    // bands travelling at different speeds, spreading as they go
    if (tau > 0) SPECIES.forEach((sp, si) => {
      const u = tau / sp.exit;
      if (u > 1.08) return;
      for (let k = 0; k < 14; k++) {
        const jit = (hash(si, k) - 0.5) * 0.09 * Math.sqrt(Math.min(u, 1) + 0.05);
        const uu = u + jit;
        if (uu < 0 || uu > 1.02) continue;
        const x = lerp(MX.c0 + 10, MX.c1 - 6, clamp(uu)), y = MX.y + (hash(si, k, 3) - 0.5) * 26;
        dot(ctx, x, y, 4, sp.c);
      }
      if (u > 0.05 && u < 1) glow(ctx, lerp(MX.c0, MX.c1, u), MX.y, 46, sp.c, 0.5);
    });
    // chromatogram drawn in real time as bands elute
    const cgA = prog(t, INJ + 0.4, 0.6);
    withAlpha(ctx, cgA, () => {
      const yb = MX.y + 40, top = MX.y - 190;
      strokeStyle(ctx, C.text3, 2); ctx.beginPath(); ctx.moveTo(MX.cg0, top); ctx.lineTo(MX.cg0, yb); ctx.lineTo(MX.cg1, yb); ctx.stroke();
      const span = 4.2, now = clamp(tau / span);
      const pts: Pt[] = [];
      for (let i = 0; i <= 160; i++) {
        const v = i / 160; if (v > now) break;
        let y = 0; SPECIES.forEach((sp) => { y += sp.peak * Math.exp(-(((v * span) - sp.exit) ** 2) / 0.02); });
        pts.push({ x: lerp(MX.cg0, MX.cg1, v), y: yb - y * 190 });
      }
      if (pts.length > 1) { strokeStyle(ctx, '#FFFFFF', 3); polyPartial(ctx, pts, 1); const h = pts[pts.length - 1]!; if (now < 1) { glow(ctx, h.x, h.y, 20, C.cyan, 1); } }
      SPECIES.forEach((sp, si) => {
        const pk = prog(tau, sp.exit + 0.05, 0.3);
        if (pk <= 0) return;
        const px = lerp(MX.cg0, MX.cg1, sp.exit / span), py = yb - sp.peak * 190;
        dot(ctx, px, py - 14, 7 * pk, sp.c);
        text(ctx, String.fromCharCode(65 + si), px, py - 28, { f: 'mono', size: 18, weight: 700, color: sp.c, align: 'center', alpha: pk });
      });
      text(ctx, 'DETECTOR SIGNAL', (MX.cg0 + MX.cg1) / 2, MX.y + 86, { f: 'mono', size: 16, weight: 700, color: C.text2, align: 'center', tracking: 2 });
    });
    // mass spectrum of peak B
    const msA = prog(t, T.analyse - 0.3, 0.5);
    withAlpha(ctx, msA, () => {
      const yb = MX.y + 40;
      strokeStyle(ctx, C.text3, 2); ctx.beginPath(); ctx.moveTo(MX.ms0, MX.y - 190); ctx.lineTo(MX.ms0, yb); ctx.lineTo(MX.ms1, yb); ctx.stroke();
      const sp = SPECIES[1]!;
      sp.mz.forEach((v, k) => {
        const p = springAt(t, T.analyse + k * 0.07, 0.5, 13);
        const x = lerp(MX.ms0 + 30, MX.ms1 - 20, k / (sp.mz.length - 1));
        strokeStyle(ctx, v === 1 ? '#FFFFFF' : sp.c, 8);
        ctx.beginPath(); ctx.moveTo(x, yb); ctx.lineTo(x, yb - v * 180 * clamp(p, 0, 1.15)); ctx.stroke();
      });
      text(ctx, 'm/z', MX.ms1 - 4, yb + 26, { f: 'mono', size: 16, weight: 700, color: C.text2, align: 'right' });
      text(ctx, 'MASS SPECTRUM (B)', (MX.ms0 + MX.ms1) / 2, MX.y + 86, { f: 'mono', size: 16, weight: 700, color: C.text2, align: 'center', tracking: 2 });
      // link from peak B to the spectrum
      const px = lerp(MX.cg0, MX.cg1, SPECIES[1]!.exit / 4.2), py = MX.y + 40 - 190;
      strokeStyle(ctx, sp.c, 2, 0.7); ctx.setLineDash([6, 6]);
      polyPartial(ctx, [{ x: px + 10, y: py - 14 }, { x: MX.ms0 + 60, y: py - 40 }], prog(t, T.analyse - 0.3, 0.4)); ctx.setLineDash([]);
    });
    // the three verbs, on their words
    const verbs: [string, number, number][] = [['Separate', T.separate, (MX.c0 + MX.c1) / 2], ['Identify', T.identify, (MX.cg0 + MX.cg1) / 2], ['Analyse', T.analyse, (MX.ms0 + MX.ms1) / 2]];
    verbs.forEach(([v, t0, x], k) => {
      const p = springAt(t, t0 - 0.05, 0.55, 12);
      if (p <= 0) return;
      withT(ctx, x, 440, clamp(p, 0, 1.15), () => {
        glow(ctx, 0, 0, 120, [C.gold, C.magenta, C.cyan][k]!, 0.3 * pulse(t, t0, 0.04, 0.9));
        text(ctx, v, 0, 16, { f: 'display', size: 46, weight: 700, align: 'center' });
      });
    });
  });
}

function drawSlide6(ctx: Ctx, t: number) {
  if (t > T.end6 + 1.6) return;
  const selA = prog(t, T.three - 0.6, 0.6) * (1 - prog(t, T.areas - 0.6, 0.6));
  const dock = prog(t, T.start - 0.3, 0.9, ease.inOutCubic);
  domainSelector(ctx, t, 0, { a: selA, litT: T.start, y: lerp(540, 176, dock), scale: lerp(1.25, 1, dock) });
  domainTitle(ctx, t, T.start, 0, { id: 'ong_wai_chung', name: 'Ong Wai Chung' }, T.start + 1.2, { outT: T.areas - 0.1, y: 620 });
  const out = prog(t, T.end6 - 0.2, 1.0, ease.inOutCubic);
  // compact chapter label once the title card has gone
  const hd = prog(t, T.areas - 0.1, 0.5) * (1 - out);
  withAlpha(ctx, hd, () => revealWords(ctx, ['Three', 'key', 'areas'], [T.areas, T.areas + 0.1, T.areas + 0.25], t, W / 2, 200, { f: 'display', size: 46, weight: 600, align: 'center', alpha: 1 - prog(t, T.techniques - 0.4, 0.4) }));
  PHOTOS.forEach(([id, label, t0], i) => {
    const R = photoRect(i, t);
    photoCard(ctx, t, t0 - 0.35, id, R.x, R.y, R.w, R.h, COL, { label, labelT: t0, colorT: t0 + 0.3, a: 1 - out, fy: i === 2 ? 0.3 : 0.5 });
  });
  drawSeparation(ctx, t, 1 - prog(t, T.following - 0.2, 0.8, ease.inOutCubic));
  // routine vs complex
  const tagA = 1 - prog(t, T.following - 0.2, 0.8);
  popPill(ctx, t, T.routine, 'Routine testing', 700, 960, C.cyan, 26, tagA);
  popPill(ctx, t, T.complex, 'Complex investigations', 1220, 960, C.magenta, 26, tagA);
  // "key analytical capabilities and instrumentation" → teaser for the tree
  withAlpha(ctx, (1 - out) * prog(t, T.capabilities - 0.2, 0.5), () => {
    revealWords(ctx, ['Key', 'analytical', 'capabilities'], [T.capabilities - 0.3, T.capabilities, T.capabilities + 0.4], t, W / 2, 620, { f: 'display', size: 64, weight: 700, align: 'center' });
    revealWords(ctx, ['&', 'instrumentation'], [T.instrumentation - 0.1, T.instrumentation], t, W / 2, 710, { f: 'display', size: 64, weight: 700, align: 'center', color: COL });
  });
}

// ---------------------------------------------------------------- slide 7: capability tree
export const TREE = new CapabilityTree({
  domain: 0,
  root: ['Chromatography / Mass Spectrometry'],
  rootT: T.root,
  previewT: cue(7, 'broad range of instruments').t,
  wideT: cue(7, 'microwave digestion').t + 0.2,
  exitT: T.end7 + 0.3,
  rows: [
    { title: ['Gas', 'chromatography'], icon: I.gcOven, t: cue(7, 'For gas chromatography').t, chips: [
      { title: 'Conventional GC', sub: 'TCD · FID detectors', t: cue(7, 'conventional GC').t },
      { title: 'Comprehensive 2D GC', sub: 'GC×GC', t: cue(7, 'comprehensive two-dimensional').t },
      { title: 'GC-MS · pyrolysis', sub: 'pyrolysis front end', t: cue(7, 'GC-MS').t, tags: [{ text: 'Microplastics', t: cue(7, 'microplastic').t }] },
      { title: 'Thermal desorption', sub: 'GC-MS sample introduction', t: cue(7, 'thermal desorption').t },
      { title: 'Headspace', sub: 'GC-MS sample introduction', t: cue(7, 'headspace').t },
      { title: 'Refinery gas analyser', sub: 'grab sampling · gas analysis', t: cue(7, 'refinery gas').t },
    ] },
    { title: ['Liquid', 'chromatography'], icon: I.lcColumn, t: cue(7, 'For liquid chromatography').t, bracket: { label: 'Mass spectrometry', from: 3, to: 4, t: cue(7, 'advanced mass spectrometry').t }, chips: [
      { title: 'HPLC', sub: 'multiple detectors (DAD · MWD · RI)', t: cue(7, 'HPLC').t },
      { title: 'GPC', sub: 'THF or aqueous · by solubility', t: cue(7, 'GPC').t },
      { title: 'Combustion IC (CIC)', sub: 'halogens · anions · cations', t: cue(7, 'combustion ion chromatography').t,
        tags: [{ text: 'gas', t: cue(7, 'gas samples').t }, { text: 'liquid', t: cue(7, 'liquid, and').t }, { text: 'solid', t: cue(7, 'solid,').t }] },
      { title: 'LC-QTOF-MS', sub: 'accurate-mass screening', t: cue(7, 'LC-QTOF-MS').t },
      { title: 'LC-HR-MS/MS', sub: 'Q Exactive Orbitrap', t: cue(7, 'high-resolution LC-MS/MS').t,
        tags: [{ text: 'non-targeted', t: cue(7, 'non-targeted').t }, { text: 'targeted', t: cue(7, 'targeted and').t }] },
    ] },
    { title: ['Elemental', 'analysis'], icon: I.icpTorch, t: cue(7, 'elemental analysis').t - 0.3, chips: [
      { title: 'ICP-MS', sub: 'inductively coupled plasma MS', t: cue(7, 'ICP-MS').t },
      { title: 'ICP-OES', sub: 'optical emission spectrometry', t: cue(7, 'ICP-OES,').t },
      { title: 'Microwave digestion', sub: 'sample preparation', t: cue(7, 'microwave digestion').t },
    ] },
  ],
});

export const DOMAIN_SWITCH_1 = T.end7 + 0.3;
export const s7: Scene = {
  id: 'cms',
  start: WASH.t + 0.7,
  end: T.end7 + 1.4,
  bg: (t) => ({ hue: [COL, C.blue, C.violet], grid: 0.9 }),
  draw(ctx, t) {
    drawSlide6(ctx, t);
    TREE.draw(ctx, t);
  },
};
export const S7_TIMES = T;
void TAU; void measure; void typeText; void H;
