// Scene 12 · Capabilities at a glance (slide 12) + end card.
// The three domain headers return; every capability on the slide cascades into
// its column (breadth, shown rather than read). The wall steps back to make room
// for the sample types it serves; then the whole team connects to "you", and the
// many techniques funnel into one best-fit approach. The ACI end card closes.
import { img, type Ctx, W, H, FACES } from '../engine/assets';
import { C, DOMAINS } from '../engine/theme';
import { cue, clip, DURATION } from '../engine/narration';
import type { Scene } from '../engine/scene';
import { clamp, ease, lerp, prog, rgba, springAt, pulse, TAU, hash, type Pt } from '../engine/util';
import { text, glow, dot, withAlpha, withT, strokeStyle, polyPartial, rr, revealWords, measure, bezierPts, portrait, checkMark } from '../engine/draw';
import { endCard, popPill, DOM_ICON } from '../engine/kit';
import { S9_TIMES } from './s9_nmr';

const T = {
  summarize: cue(12, 'To summarize').t,
  together: cue(12, 'brings together').t,
  range: cue(12, 'wide range of analytical capabilities').t,
  aci: cue(12, 'within ACI').t,
  domains: cue(12, 'three technical domains').t,
  broad: cue(12, 'With this broad range').t,
  samples: cue(12, 'types of samples').t,
  needs: cue(12, 'analytical needs').t,
  more: cue(12, 'More importantly').t,
  team: cue(12, 'our team').t,
  withYou: cue(12, 'work with you').t,
  identify: cue(12, 'identify').t,
  approach: cue(12, 'most appropriate analytical approach').t,
  yours: cue(12, 'your specific research needs').t,
  end: clip(12).end,
};
export const END_CARD_T = T.end + 0.3;

const CAPS: string[][] = [
  ['LC-QTOF-MS', 'LC-HR-MS/MS (Orbitrap)', 'PY / TD / HS-GCMS', 'GC×GC-FID/MS', 'GC (TCD, FID)', 'Refinery gas analyser', 'HPLC (DAD, MWD, RI)', 'ICP-OES & ICP-MS', 'Combustion IC (CIC)', 'GPC (THF-DMF / aqueous)', 'Microwave digester'],
  ['XPS · in-situ gas cell', 'pXRD · reaction chamber', 'XRF with mapping', 'Raman · in-situ cell', 'Atomic force microscopy', 'SEM · EDS & BEX', 'TEM · cryo, EDS, EELS, 3D', 'Micro-CT (3D X-ray)', 'SAXS / WAXS'],
  ['NMR · iProbe & cryoprobe', 'DSC', 'Simultaneous DSC-TGA / TGA', 'Elemental analyser (EA)', 'TPDRO-MS', 'Surface area & pore size (BET)', 'TOC / TN analyser', 'Tensiometer / tensile / Turbiscan', 'Particle size / rheometer', 'Dynamic vapour sorption', 'LUMiSizer dispersion', 'Quartz crystal microbalance', 'FTIR / UV-Vis', 'Thermal conductivity'],
];
const COLX = [390, 960, 1530], COLW = 530;

function drawWall(ctx: Ctx, t: number) {
  const exit = prog(t, T.more - 0.2, 0.7, ease.inOutCubic);
  if (exit >= 1 || t < T.summarize - 0.4) return;
  const back = prog(t, T.broad - 0.1, 1.0, ease.inOutCubic);
  const s = lerp(1, 0.6, back), oy = lerp(0, -40, back);
  withAlpha(ctx, 1 - exit, () => withT(ctx, W / 2, 140 + oy, s, () => {
    ctx.translate(-W / 2, -140);
    DOMAINS.forEach((D, i) => {
      const hp = springAt(t, T.summarize + i * 0.12, 0.6, 12);
      if (hp <= 0) return;
      const x = COLX[i]!, pu = pulse(t, T.domains + i * 0.15, 0.05, 0.8);
      withT(ctx, x, 190, clamp(hp, 0, 1.12), () => {
        glow(ctx, 0, 0, 320, D.color, 0.25 + 0.5 * pu);
        rr(ctx, -COLW / 2, -44, COLW, 88, 20); ctx.fillStyle = rgba(D.color, 0.88); ctx.fill();
        DOM_ICON[i]!(ctx, -COLW / 2 + 58, 2, 80, 4 + t, '#FFFFFF');
        text(ctx, D.short, -COLW / 2 + 116, 9, { f: 'body', size: 23, weight: 700 });
      });
      CAPS[i]!.forEach((c, k) => {
        const t0 = T.range + (i * 3 + k) * 0.045;
        const p = springAt(t, t0, 0.6, 14);
        if (p <= 0) return;
        const y = 262 + k * 49;
        withAlpha(ctx, clamp(p * 2), () => withT(ctx, x, y + 20, clamp(p, 0, 1.08), () => {
          rr(ctx, -COLW / 2, -20, COLW, 40, 10); ctx.fillStyle = rgba(C.ink1, 0.85); ctx.fill(); strokeStyle(ctx, D.color, 1.5, 0.45); ctx.stroke();
          ctx.fillStyle = D.color; ctx.fillRect(-COLW / 2, -12, 4, 24);
          text(ctx, c, -COLW / 2 + 18, 7, { f: 'body', size: 19, weight: 500 });
        }));
      });
    });
  }));
  // sample types the breadth lets us serve
  const types: [string, (ctx: Ctx, s: number, c: string) => void][] = [
    ['Solids', (c2, s2, col) => { c2.beginPath(); c2.moveTo(0, -s2); c2.lineTo(s2 * 0.9, -s2 * 0.5); c2.lineTo(s2 * 0.9, s2 * 0.5); c2.lineTo(0, s2); c2.lineTo(-s2 * 0.9, s2 * 0.5); c2.lineTo(-s2 * 0.9, -s2 * 0.5); c2.closePath(); c2.fillStyle = rgba(col, 0.35); c2.fill(); strokeStyle(c2, col, 3); c2.stroke(); c2.beginPath(); c2.moveTo(-s2 * 0.9, -s2 * 0.5); c2.lineTo(0, 0); c2.lineTo(s2 * 0.9, -s2 * 0.5); c2.moveTo(0, 0); c2.lineTo(0, s2); c2.stroke(); }],
    ['Liquids', (c2, s2, col) => { c2.beginPath(); c2.moveTo(0, -s2 * 1.1); c2.bezierCurveTo(s2 * 0.9, -s2 * 0.1, s2 * 0.8, s2 * 0.9, 0, s2 * 0.9); c2.bezierCurveTo(-s2 * 0.8, s2 * 0.9, -s2 * 0.9, -s2 * 0.1, 0, -s2 * 1.1); c2.fillStyle = rgba(col, 0.35); c2.fill(); strokeStyle(c2, col, 3); c2.stroke(); }],
    ['Gases', (c2, s2, col) => { for (const [dx, dy, r] of [[-0.45, 0.15, 0.45], [0.05, -0.2, 0.6], [0.5, 0.15, 0.42]]) { c2.beginPath(); c2.arc(dx! * s2, dy! * s2, r! * s2, 0, TAU); c2.fillStyle = rgba(col, 0.25); c2.fill(); strokeStyle(c2, col, 3); c2.stroke(); } }],
    ['Powders', (c2, s2, col) => { for (let k = 0; k < 14; k++) { const a = hash(k) * TAU, r = Math.sqrt(hash(k, 1)) * s2 * 0.85; dot(c2, Math.cos(a) * r, Math.sin(a) * r * 0.8 + s2 * 0.1, s2 * (0.1 + 0.08 * hash(k, 2)), col); } }],
  ];
  withAlpha(ctx, 1 - exit, () => types.forEach(([lbl, draw], k) => {
    const t0 = T.samples - 0.3 + k * 0.18;
    const p = springAt(t, t0, 0.55, 12);
    if (p <= 0) return;
    const x = 480 + k * 320, y = 800;
    const col = [C.cyan, C.cms, C.gold, C.nmr][k]!;
    withT(ctx, x, y, clamp(p, 0, 1.15), () => {
      glow(ctx, 0, 0, 110, col, 0.3);
      draw(ctx, 46, col);
      text(ctx, lbl, 0, 100, { f: 'display', size: 30, weight: 600, align: 'center' });
    });
  }));
  withAlpha(ctx, (1 - exit) * prog(t, T.needs, 0.5), () => revealWords(ctx, ['…and', 'analytical', 'needs'], [T.needs - 0.1, T.needs, T.needs + 0.3], t, W / 2, 980, { f: 'mono', size: 24, weight: 500, align: 'center', color: C.text2 }));
}

// team ↔ you, and the funnel to one best-fit approach
function drawTeam(ctx: Ctx, t: number) {
  if (t < T.more) return;
  const exit = prog(t, END_CARD_T - 0.2, 0.6, ease.inOutCubic);
  withAlpha(ctx, 1 - exit, () => {
    const TX = 470, TY = 520, YX = 1450, YY = 520;
    // our team: honeycomb of portraits
    const pos: Pt[] = [];
    [[0, 1], [110, 6], [200, 4]].forEach(([r, n], ring) => { for (let j = 0; j < n!; j++) { const a = (j / n!) * TAU + ring * 0.4; pos.push({ x: TX + Math.cos(a) * r!, y: TY + Math.sin(a) * r! * 0.9 }); } });
    FACES.forEach((id, k) => {
      const p = springAt(t, T.team - 0.25 + k * 0.05, 0.55, 12);
      if (p <= 0) return;
      const q = pos[k]!;
      portrait(ctx, id, q.x, q.y, k === 0 ? 50 : 42, clamp(p, 0, 1.15), [C.magenta, C.violet, C.cms, C.cms, C.cms, C.xray, C.xray, C.xray, C.xray, C.nmr, C.nmr][k]!);
    });
    withAlpha(ctx, prog(t, T.team, 0.5), () => text(ctx, 'Our team', TX, TY + 290, { f: 'display', size: 40, weight: 700, align: 'center' }));
    // you
    const yp = springAt(t, T.withYou, 0.55, 11);
    if (yp > 0) withT(ctx, YX, YY, clamp(yp, 0, 1.15), () => {
      glow(ctx, 0, 0, 220, C.gold, 0.35);
      ctx.beginPath(); ctx.arc(0, 0, 150, 0, TAU); ctx.fillStyle = rgba(C.gold, 0.12); ctx.fill(); strokeStyle(ctx, C.gold, 3); ctx.stroke();
      strokeStyle(ctx, '#FFFFFF', 7);
      ctx.beginPath(); ctx.arc(0, -40, 36, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 70, 70, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
      text(ctx, 'You', 0, 230, { f: 'display', size: 40, weight: 700, align: 'center' });
    });
    const yr = prog(t, T.yours, 0.6);
    if (yr > 0) revealWords(ctx, ['Your', 'specific', 'research', 'needs'], [T.yours - 0.2, T.yours, T.yours + 0.3, T.yours + 0.6], t, YX, YY + 280, { f: 'mono', size: 22, weight: 500, align: 'center', color: C.gold });
    // techniques funnel into one approach between the two
    const mid = { x: 960, y: 520 };
    const fp = prog(t, T.identify - 0.2, 1.4, ease.inOutCubic);
    if (fp > 0) {
      for (let k = 0; k < 18; k++) {
        const col = [C.cms, C.xray, C.nmr][k % 3]!;
        const a0 = { x: TX + 250, y: TY + (hash(k) - 0.5) * 420 };
        const pts = bezierPts(a0, { x: a0.x + 120, y: a0.y }, { x: mid.x - 140, y: mid.y }, { x: mid.x - 70, y: mid.y }, 30);
        const u = clamp(fp * 1.4 - hash(k, 3) * 0.4);
        strokeStyle(ctx, col, 1.5, 0.35);
        polyPartial(ctx, pts, u);
        if (u > 0 && u < 1) { const q = pts[Math.floor(u * 30)]!; glow(ctx, q.x, q.y, 14, col, 0.9); dot(ctx, q.x, q.y, 3, '#fff'); }
      }
      const ap = springAt(t, T.approach + 0.3, 0.5, 12);
      if (ap > 0) withT(ctx, mid.x, mid.y, clamp(ap, 0, 1.15), () => {
        glow(ctx, 0, 0, 160, C.nmr, 0.5 + 0.3 * pulse(t, T.approach + 0.3, 0.05, 1));
        ctx.beginPath(); ctx.arc(0, 0, 62, 0, TAU); ctx.fillStyle = rgba(C.nmr, 0.25); ctx.fill(); strokeStyle(ctx, C.nmr, 3); ctx.stroke();
        checkMark(ctx, 0, 0, 44, prog(t, T.approach + 0.4, 0.4), '#FFFFFF', 7);
        text(ctx, 'Best-fit', 0, 104, { f: 'display', size: 30, weight: 700, align: 'center' });
        text(ctx, 'analytical approach', 0, 140, { f: 'display', size: 30, weight: 700, align: 'center' });
      });
      // hand-over to "you"
      const hp = prog(t, T.yours - 0.4, 0.8, ease.inOutCubic);
      strokeStyle(ctx, C.gold, 3, 0.8);
      const h = polyPartial(ctx, [{ x: mid.x + 70, y: mid.y }, { x: YX - 160, y: YY }], hp);
      if (h && hp < 1) glow(ctx, h.x, h.y, 30, C.gold, 1);
    }
    // collaboration link (team ↔ you) sits under everything
    const lp = prog(t, T.withYou - 0.2, 0.8, ease.inOutCubic) * (1 - prog(t, T.identify - 0.2, 0.6));
    if (lp > 0) { strokeStyle(ctx, '#FFFFFF', 2, 0.5 * lp); ctx.setLineDash([8, 10]); ctx.lineDashOffset = -t * 30; polyPartial(ctx, [{ x: TX + 250, y: TY }, { x: YX - 160, y: YY }], lp); ctx.setLineDash([]); }
  });
}

export const s10: Scene = {
  id: 'summary',
  start: S9_TIMES.end11 + 0.4,
  end: DURATION,
  bg: () => ({ grid: 0.9 }),
  draw(ctx, t) {
    drawWall(ctx, t);
    drawTeam(ctx, t);
    endCard(ctx, t, END_CARD_T);
  },
};
export const S10_TIMES = T;
void img; void measure; void popPill; void H;
