// Scene 2 · Where ACI sits (slide 2).
// The ACI dot from the title finds its slot; the ISCE² tree grows around it; a
// light pulse runs from the root down to ACI; the camera pushes in to the
// Division Director; then a three-part road-map branches out of the ACI hub.
import { type Ctx, W, H } from '../engine/assets';
import { C, BRAND } from '../engine/theme';
import { cue, clip } from '../engine/narration';
import type { Scene } from '../engine/scene';
import { clamp, ease, lerp, prog, rgba, keys, springAt, pulse, type Pt, TAU } from '../engine/util';
import { text, glow, dot, withAlpha, withT, strokeStyle, polyPartial, elbowPts, rr, card, applyCam, lerpCam, CAM0, type Cam, personCard, bezierPts, typeText } from '../engine/draw';
import * as I from '../engine/icons';
import { ACI_DOT } from './s1_title';

export const S3_DOT = { x: W / 2, y: H / 2, r: 16, t: clip(3).offset + 0.15 };

// ---------------------------------------------------------------- org data (ISCE² chart wef 1 Jul 2026)
const PX = (i: number) => 168 + i * 144;
const PILLAR = { top: 575, h: 205, w: 136 };
type Div = { name: string[]; purple?: boolean; aci?: boolean };
const DIVS: Div[] = [
  { name: ['Future Energy', '& Materials', 'Technologies'] },
  { name: ['Catalysis &', 'Carbon', 'Conversion'] },
  { name: ['Specialty', 'Chemicals &', 'Bio-Technologies'] },
  { name: ['ACI'], aci: true },
  { name: ['Lab & Facilities', 'Management'] },
  { name: ['Digital', 'Chemistry'] },
  { name: ['Process', 'Engineering', '& Safety'] },
  { name: ['Strategy'] },
  { name: ['Project', 'Management', 'Office'] },
  { name: ['Administration'] },
  { name: ['Decarbon-', 'isation'], purple: true },
  { name: ['Specialty', 'Chemicals'], purple: true },
];
const ROOT = { x: 960, y: 185 };
const LY = 335, SY = 455, BUS = 530;
type Lead = { x: number; y: number; title: string[]; kids: number[]; bus?: [number, number]; parent?: number };
const LEADS: Lead[] = [
  { x: PX(1), y: LY, title: ['Deputy Executive', 'Director'], kids: [0, 1, 2, 3, 4], bus: [PX(0), PX(4)] },
  { x: PX(3), y: LY, title: ['Senior Director', '(Research)'], kids: [0, 1, 2, 3, 4], bus: [PX(0), PX(4)] },
  { x: PX(5), y: LY, title: ['Scientific', 'Director'], kids: [5] },
  { x: PX(6), y: LY, title: ['Chief', 'Engineer'], kids: [6] },
  { x: PX(9), y: LY, title: ['Senior', 'Director'], kids: [] },
  { x: PX(8), y: SY, title: ['Coordinating', 'Director'], kids: [7, 8, 9], bus: [PX(7), PX(9)], parent: 4 },
  { x: (PX(10) + PX(11)) / 2, y: SY, title: ['Tech-Business', 'Lead'], kids: [10, 11], bus: [PX(10), PX(11)], parent: 4 },
];
const ACI_I = 3;
const ACI_C = { x: PX(ACI_I), y: PILLAR.top + PILLAR.h / 2 };

// ---------------------------------------------------------------- timing
const T = {
  aciWord: cue(2, 'ACI').t,
  move: cue(2, 'this slide').t,
  root: cue(2, 'ISCE²').t,
  tree: cue(2, 'organizational').t,
  trace: cue(2, 'you can see').t,
  arrive: cue(2, 'ACI sits').t + 0.12,
  pin: cue(2, 'sits').t,
  zoom: cue(2, 'ACI is led').t,
  director: cue(2, 'Division Director').t,
  andrew: cue(2, 'Andrew Lim').t,
  roadmap: cue(2, 'In the next few').t,
  chips: [cue(2, 'our team').t, cue(2, 'key analytical capabilities').t, cue(2, 'shared scientific resources').t],
  fold: clip(2).end - 0.45,
};
const HUB = { x: 470, y: 540, r: 52 };
const CAM_ZOOM: Cam = { x: ACI_C.x, y: 772, z: 1.9 };

function cam(t: number): Cam {
  const zin = prog(t, T.zoom, 1.4, ease.inOutCubic);
  const zout = prog(t, T.roadmap, 1.2, ease.inOutCubic);
  const c = lerpCam(CAM0, CAM_ZOOM, zin);
  return lerpCam(c, CAM0, zout);
}
const toScreen = (c: Cam, p: Pt): Pt => ({ x: (p.x - c.x) * c.z + W / 2, y: (p.y - c.y) * c.z + H / 2 });

// ---------------------------------------------------------------- the tree
function chartPaths() {
  const paths: { pts: Pt[]; t0: number; lead?: number }[] = [];
  LEADS.forEach((L, i) => {
    if (L.parent === undefined) paths.push({ pts: elbowPts({ x: ROOT.x, y: ROOT.y + 30 }, { x: L.x, y: L.y - 10 }, 272), t0: 0, lead: i });
    else { const P = LEADS[L.parent]!; paths.push({ pts: elbowPts({ x: P.x, y: P.y + 10 }, { x: L.x, y: L.y - 10 }, 400), t0: 0.45 }); }
    const d = L.parent === undefined ? 0.45 : 0.75;
    for (const k of L.kids) {
      if (L.bus) paths.push({ pts: [{ x: L.x, y: L.y + 10 }, { x: L.x, y: BUS }, { x: PX(k), y: BUS }, { x: PX(k), y: PILLAR.top }], t0: d });
      else paths.push({ pts: [{ x: L.x, y: L.y + 10 }, { x: PX(k), y: PILLAR.top }], t0: d });
    }
  });
  return paths;
}
const PATHS = chartPaths();
const TRACE: Pt[] = [{ x: ROOT.x, y: ROOT.y + 30 }, { x: ROOT.x, y: 272 }, { x: LEADS[1]!.x, y: 272 }, { x: LEADS[1]!.x, y: LY }, { x: PX(ACI_I), y: LY + 10 }, { x: PX(ACI_I), y: PILLAR.top }];

function drawChart(ctx: Ctx, t: number, fade: number) {
  const g = t - T.tree;
  const dim = prog(t, T.arrive, 0.7, ease.inOutCubic);
  const others = lerp(1, 0.28, dim) * fade;
  // connectors
  for (const p of PATHS) {
    const u = prog(g, p.t0, 0.55, ease.inOutCubic);
    withAlpha(ctx, others, () => { strokeStyle(ctx, '#7F8FD6', 2, 0.55); polyPartial(ctx, p.pts, u); });
  }
  // traced route root → ACI
  const tu = prog(t, T.trace, T.arrive - T.trace, ease.inOutCubic);
  if (tu > 0) withAlpha(ctx, fade, () => {
    ctx.save(); ctx.shadowColor = C.violet; ctx.shadowBlur = 16;
    strokeStyle(ctx, '#C9B8FF', 4, 1);
    const h = polyPartial(ctx, TRACE, tu);
    ctx.restore();
    if (h && tu < 1) { glow(ctx, h.x, h.y, 60, C.violet, 1); dot(ctx, h.x, h.y, 6, '#fff'); }
  });
  // root
  const rp = springAt(t, T.root, 0.55, 12);
  if (rp > 0) withAlpha(ctx, lerp(1, 0.5, dim) * fade, () => withT(ctx, ROOT.x, ROOT.y, clamp(rp, 0, 1.2), () => {
    glow(ctx, 0, 0, 170, C.blue, 0.45);
    card(ctx, -100, -32, 200, 64, { r: 32, stroke: rgba('#9FB0FF', 0.7) });
    text(ctx, 'ISCE²', 0, 12, { f: 'display', size: 34, weight: 700, align: 'center' });
    text(ctx, 'EXECUTIVE DIRECTOR', 0, 58, { f: 'mono', size: 14, weight: 500, align: 'center', color: C.text2, tracking: 2, alpha: prog(t, T.root + 0.3, 0.5) });
  }));
  // leadership nodes
  LEADS.forEach((L, i) => {
    const p = springAt(g, (L.parent === undefined ? 0.35 : 0.65) + i * 0.04, 0.5, 14);
    if (p <= 0) return;
    withAlpha(ctx, others, () => {
      glow(ctx, L.x, L.y, 26, C.blue, 0.6);
      dot(ctx, L.x, L.y, 9 * clamp(p, 0, 1.3), C.ink1);
      ctx.beginPath(); ctx.arc(L.x, L.y, 9 * clamp(p, 0, 1.3), 0, TAU); strokeStyle(ctx, '#AFC0FF', 2.5); ctx.stroke();
      const la = prog(g, 0.5 + i * 0.04, 0.4);
      L.title.forEach((ln, k) => text(ctx, ln, L.x + 18, L.y - 3 + k * 20, { f: 'body', size: 16, weight: 500, color: C.text2, alpha: la }));
    });
  });
  // division pillars
  DIVS.forEach((d, i) => {
    const p = springAt(g, 0.85 + i * 0.045, 0.6, 13);
    if (p <= 0) return;
    const x = PX(i) - PILLAR.w / 2, y = PILLAR.top;
    if (d.aci) return; // drawn by drawACI
    withAlpha(ctx, others * clamp(p * 2), () => withT(ctx, PX(i), y, clamp(p, 0, 1.1), () => {
      const col = d.purple ? C.purple : C.blue;
      card(ctx, -PILLAR.w / 2, 0, PILLAR.w, PILLAR.h, { r: 12, fill: rgba(col, 0.16), stroke: rgba(col, 0.6) });
      ctx.fillStyle = rgba(col, 0.9); ctx.fillRect(-PILLAR.w / 2 + 12, 0, PILLAR.w - 24, 3);
      const n = d.name.length;
      d.name.forEach((ln, k) => text(ctx, ln, 0, PILLAR.h / 2 - ((n - 1) * 21) / 2 + k * 21 + 6, { f: 'body', size: 15, weight: 600, align: 'center', color: C.text }));
    }));
    void x;
  });
}

function drawACI(ctx: Ctx, t: number, fade: number) {
  // the dot: from centre (hand-off from the title) to its slot
  const mv = prog(t, T.move, 1.3, ease.inOutCubic);
  const form = prog(t, T.tree + 1.0, 0.5, ease.outCubic); // pillar forms around the dot
  const lit = prog(t, T.arrive, 0.6, ease.outCubic);
  const x = lerp(ACI_DOT.x, ACI_C.x, mv), y = lerp(ACI_DOT.y, ACI_C.y, mv);
  withAlpha(ctx, fade, () => {
    if (form < 1) {
      const idle = 1 + 0.08 * Math.sin((t - ACI_DOT.t) * 4) * (1 - mv);
      glow(ctx, x, y, 90, C.violet, 0.9 * (1 - form));
      dot(ctx, x, y, ACI_DOT.r * idle * (1 - form * 0.5), '#FFFFFF', 1 - form);
      // idle pulse rings + label while it waits at centre
      for (let k = 0; k < 2; k++) {
        const u = ((t - ACI_DOT.t) * 0.7 + k * 0.5) % 1;
        withAlpha(ctx, (1 - u) * 0.5 * (1 - mv), () => { ctx.beginPath(); ctx.arc(x, y, 18 + u * 70, 0, TAU); strokeStyle(ctx, C.violet, 2); ctx.stroke(); });
      }
      const la = prog(t, T.aciWord, 0.5) * (1 - prog(t, T.move, 0.4));
      text(ctx, 'ACI', x + 38, y + 14, { f: 'display', size: 40, weight: 700, alpha: la });
    }
    if (form > 0) {
      withT(ctx, ACI_C.x, PILLAR.top, lerp(0.6, 1, form), () => {
        const w = PILLAR.w, h = PILLAR.h;
        if (lit > 0) { glowRectSimple(ctx, -w / 2, 0, w, h, lit); }
        const gr = ctx.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, rgba(C.blue, lerp(0.2, 0.95, lit))); gr.addColorStop(1, rgba(C.magenta, lerp(0.12, 0.9, lit)));
        rr(ctx, -w / 2, 0, w, h, 12); ctx.fillStyle = gr; ctx.globalAlpha *= form; ctx.fill();
        ctx.strokeStyle = rgba('#FFFFFF', lerp(0.5, 0.9, lit)); ctx.lineWidth = 2; ctx.stroke();
        text(ctx, 'ACI', 0, h / 2 + 4, { f: 'display', size: 42, weight: 700, align: 'center' });
        ['Advanced', 'Characterisation', '& Instrumentation'].forEach((ln, k) => text(ctx, ln, 0, h / 2 + 36 + k * 17, { f: 'body', size: 13, weight: 500, align: 'center', color: rgba(C.text, 0.9) }));
      });
      const f = pulse(t, T.arrive, 0.03, 0.5);
      if (f > 0.01) glow(ctx, ACI_C.x, ACI_C.y, 260, C.magenta, f);
    }
    // location pin: "where ACI sits"
    const pp = springAt(t, T.pin, 0.45, 11);
    if (pp > 0) {
      const py = lerp(PILLAR.top - 120, PILLAR.top - 16, clamp(pp, 0, 1.2));
      withAlpha(ctx, clamp(pp * 3), () => {
        ctx.save(); ctx.translate(ACI_C.x, py);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-20, -24, -22, -34, -22, -44); ctx.arc(0, -44, 22, Math.PI, 0); ctx.bezierCurveTo(22, -34, 20, -24, 0, 0); ctx.closePath();
        ctx.fillStyle = C.red; ctx.shadowColor = C.red; ctx.shadowBlur = 20; ctx.fill(); ctx.shadowBlur = 0;
        dot(ctx, 0, -44, 8, '#FFFFFF');
        ctx.restore();
      });
    }
  });
}
function glowRectSimple(ctx: Ctx, x: number, y: number, w: number, h: number, a: number) {
  ctx.save(); ctx.globalAlpha *= a; ctx.shadowColor = C.violet; ctx.shadowBlur = 50; rr(ctx, x, y, w, h, 12); ctx.fillStyle = rgba(C.violet, 0.6); ctx.fill(); ctx.restore();
}

// ---------------------------------------------------------------- road-map
const CHIPS = [
  { n: '01', title: 'Our team', icon: I.people, color: C.cyan },
  { n: '02', title: 'Key analytical capabilities', icon: I.spectrum, color: C.violet },
  { n: '03', title: 'Shared scientific resources', icon: I.network, color: C.magenta },
];
const CHIP = { x: 820, w: 760, h: 138, ys: [350, 545, 740] };

function drawRoadmap(ctx: Ctx, t: number) {
  if (t < T.roadmap) return;
  const hdrOut = prog(t, T.fold, 0.4, ease.inCubic);
  withAlpha(ctx, 1 - hdrOut, () => {
    typeText(ctx, 'IN THE NEXT FEW SLIDES', t, T.roadmap + 0.35, CHIP.x, 212, { f: 'mono', size: 22, weight: 500, color: C.text2, tracking: 5 }, 38);
    strokeStyle(ctx, C.text3, 1.5, prog(t, T.roadmap + 0.35, 0.6));
    ctx.beginPath(); ctx.moveTo(CHIP.x, 232); ctx.lineTo(CHIP.x + CHIP.w * prog(t, T.roadmap + 0.35, 0.9, ease.inOutCubic), 232); ctx.stroke();
  });
  const c = cam(T.roadmap);
  const from = toScreen(c, { x: ACI_C.x, y: ACI_C.y });
  const hp = prog(t, T.roadmap + 0.2, 1.0, ease.inOutCubic);
  const toCenter = prog(t, T.fold + 0.55, 0.75, ease.inOutCubic);
  const hx = lerp(lerp(from.x, HUB.x, hp), S3_DOT.x, toCenter), hy = lerp(lerp(from.y, HUB.y, hp), S3_DOT.y, toCenter);
  const hr = lerp(lerp(30, HUB.r, hp), S3_DOT.r, toCenter);
  CHIPS.forEach((ch, i) => {
    const t0 = T.chips[i]!;
    const fold = prog(t, T.fold + i * 0.08, 0.5, ease.inCubic);
    const bp = prog(t, t0 - 0.45, 0.5, ease.inOutCubic) * (1 - fold);
    const cy = CHIP.ys[i]!;
    const pts = bezierPts({ x: hx + hr, y: hy }, { x: hx + 200, y: hy }, { x: CHIP.x - 200, y: cy }, { x: CHIP.x, y: cy }, 40);
    strokeStyle(ctx, ch.color, 2.5, 0.8);
    const h = polyPartial(ctx, pts, bp);
    if (h && bp < 0.99) { glow(ctx, h.x, h.y, 40, ch.color, 1); dot(ctx, h.x, h.y, 4, '#fff'); }
    const sp = springAt(t, t0 - 0.05, 0.55, 12) * (1 - fold);
    if (sp <= 0.001) return;
    withAlpha(ctx, clamp(sp * 2), () => withT(ctx, CHIP.x, cy, 1, () => {
      ctx.save(); ctx.scale(clamp(sp, 0, 1.1), clamp(sp, 0, 1.1));
      card(ctx, 0, -CHIP.h / 2, CHIP.w, CHIP.h, { r: 24, stroke: rgba(ch.color, 0.6), glow: ch.color, glowA: 0.18 });
      ctx.restore();
      withAlpha(ctx, prog(t, t0 + 0.1, 0.4), () => {
        ch.icon(ctx, 92, 0, 110, t - t0 - 0.05, ch.color);
        text(ctx, ch.n, 190, -14, { f: 'mono', size: 22, weight: 700, color: ch.color, tracking: 2 });
        text(ctx, ch.title, 190, 26, { f: 'display', size: 40, weight: 600, color: C.text });
      });
    }));
  });
  // hub
  withAlpha(ctx, 1, () => {
    glow(ctx, hx, hy, hr * 3, C.violet, 0.8);
    const gr = ctx.createLinearGradient(hx - hr, hy - hr, hx + hr, hy + hr);
    gr.addColorStop(0, C.blue); gr.addColorStop(1, C.magenta);
    ctx.beginPath(); ctx.arc(hx, hy, hr, 0, TAU); ctx.fillStyle = gr; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.stroke();
    const ta = clamp((hr - 24) / 20);
    text(ctx, 'ACI', hx, hy + 11, { f: 'display', size: 32, weight: 700, align: 'center', alpha: ta });
  });
}

export const s2: Scene = {
  id: 'org',
  start: ACI_DOT.t,
  end: S3_DOT.t,
  bg: (t) => { const c = cam(t); return { gx: -(c.x - W / 2) * c.z * 0.5, gy: -(c.y - H / 2) * c.z * 0.5, grid: 0.9 }; },
  draw(ctx, t) {
    const c = cam(t);
    const chartFade = 1 - prog(t, T.roadmap, 0.8, ease.inOutCubic);
    if (chartFade > 0.002) {
      ctx.save();
      applyCam(ctx, c);
      drawChart(ctx, t, chartFade);
      drawACI(ctx, t, t < T.roadmap ? 1 : chartFade);
      // Division Director card below the ACI pillar
      withAlpha(ctx, chartFade, () => {
        const lp = prog(t, T.director - 0.2, 0.4);
        strokeStyle(ctx, '#FFFFFF', 2, 0.7 * lp);
        ctx.beginPath(); ctx.moveTo(ACI_C.x, PILLAR.top + PILLAR.h); ctx.lineTo(ACI_C.x, PILLAR.top + PILLAR.h + 20 * lp); ctx.stroke();
        personCard(ctx, t, T.director - 0.1, { id: 'andrew_lim', name: 'Andrew Lim', role: 'Division Director' }, ACI_C.x - 150, PILLAR.top + PILLAR.h + 20, 300, 84, C.magenta,
          { nameT: T.andrew, faceT: T.andrew - 0.05, roleT: T.director + 0.1, nameSize: 24 });
      });
      ctx.restore();
    }
    drawRoadmap(ctx, t);
  },
};
export const S2_TIMES = T;
