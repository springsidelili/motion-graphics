// Scene 4b · Shared scientific resource management (slide 4, second half) + end card.
// The team hub sits inside the Institute (a ring of labs). Six responsibilities
// land on an orbit around it, each with a working icon; three outcomes are then
// checked off, pulses run from the hub out to every lab, and the hub resolves
// into the ACI end card.
import { img, type Ctx, W, H } from '../engine/assets';
import { C, BRAND } from '../engine/theme';
import { cue, clip, DURATION } from '../engine/narration';
import type { Scene } from '../engine/scene';
import { clamp, ease, lerp, prog, rgba, springAt, pulse, TAU, type Pt, keys, hash } from '../engine/util';
import { text, glow, dot, withAlpha, withT, strokeStyle, polyPartial, revealWords, checkMark, measure } from '../engine/draw';
import * as I from '../engine/icons';
import { HUB } from './s4_team';

const T = {
  role: cue(4, 'important role').t,
  shared: cue(4, 'managing shared').t,
  institute: cue(4, 'across the Institute').t,
  resp: cue(4, 'Our responsibilities').t,
  nodes: [cue(4, 'equipment booking').t, cue(4, 'utilisation and charging').t, cue(4, 'demand aggregation').t,
    cue(4, 'scientific equipment and systems refresh').t, cue(4, 'equipment lifecycle management').t, cue(4, 'digitalisation').t],
  sustain: cue(4, 'sustainability').t,
  together: cue(4, 'Together these').t,
  resources: cue(4, 'scientific resources are').t,
  outcomes: [cue(4, 'effectively managed').t, cue(4, 'optimised').t, cue(4, 'kept relevant').t],
  evolving: cue(4, 'evolving research needs').t,
  institute2: cue(4, 'across the Institute', 1).t,
  end: clip(4).end + 0.2,
};

const ORB = { rx: 600, ry: 305 };
const RING = { rx: 1010, ry: 575 };
type Node = { a: number; title: string[]; sub?: string; icon: (ctx: Ctx, x: number, y: number, s: number, lt: number, c: string) => void; color: string };
const NODES: Node[] = [
  { a: -150, title: ['Equipment booking'], sub: 'PPMS · A*SEF', icon: I.calendar, color: C.cyan },
  { a: -90, title: ['Utilisation & charging'], icon: I.gauge, color: C.gold },
  { a: -30, title: ['Demand aggregation'], sub: 'WITH LFM & RSC', icon: I.converge, color: C.cms },
  { a: 30, title: ['Equipment &', 'systems refresh'], icon: I.refresh, color: C.nmr },
  { a: 90, title: ['Equipment lifecycle'], sub: 'WITH LFM', icon: I.lifecycle, color: C.xray },
  { a: 150, title: ['Digitalisation &', 'sustainability'], icon: (ctx, x, y, s, lt, c) => I.digitalLeaf(ctx, x, y, s, lt, c, 1, T.sustain - T.nodes[5]!), color: C.violet },
];
const NODE_R = 64;
const nodeAt = (i: number): Pt => { const a = (NODES[i]!.a * Math.PI) / 180; return { x: HUB.x + Math.cos(a) * ORB.rx, y: HUB.y + Math.sin(a) * ORB.ry }; };

/** Diagram transform: full-frame, then scaled left to make room for the outcomes. */
function layout(t: number) {
  const u = prog(t, T.together, 1.2, ease.inOutCubic);
  const back = prog(t, T.evolving - 0.2, 1.2, ease.inOutCubic);
  const k = u * (1 - back);
  return { s: lerp(1, 0.64, k), x: lerp(HUB.x, 650, k), y: lerp(HUB.y, 560, k), k };
}

function drawRing(ctx: Ctx, t: number, a: number) {
  const N = 46;
  const sweep = prog(t, T.institute - 0.4, 1.4, ease.inOutCubic);
  for (let i = 0; i < N; i++) {
    const u = i / N;
    if (u > sweep) break;
    const an = -Math.PI / 2 + u * TAU;
    const x = HUB.x + Math.cos(an) * RING.rx * (1 + 0.04 * (hash(i) - 0.5)), y = HUB.y + Math.sin(an) * RING.ry * (1 + 0.05 * (hash(i, 3) - 0.5));
    if (y < 135 && (x < 640 || x > 1560)) continue; // keep the HUD corners clean
    const wave = pulse(t, T.institute2 - 0.9 + Math.abs(Math.sin(an / 2)) * 0.7, 0.05, 0.9);
    withAlpha(ctx, a, () => {
      if (wave > 0.02) glow(ctx, x, y, 50, C.violet, wave);
      ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fillStyle = rgba(C.ink1, 0.9); ctx.fill();
      strokeStyle(ctx, wave > 0.1 ? '#FFFFFF' : '#A9B8FF', 2.5, 0.55 + 0.45 * Math.min(1, wave + 0.3));
      ctx.stroke();
    });
  }
}

function drawHub(ctx: Ctx, t: number) {
  const g = springAt(t, HUB.t - 0.1, 0.55, 11);
  const r = lerp(26, HUB.r, clamp(g, 0, 1.15));
  const beat = 1 + 0.03 * Math.sin(t * 3);
  glow(ctx, HUB.x, HUB.y, r * 3.2, C.violet, 0.8);
  const gr = ctx.createLinearGradient(HUB.x - r, HUB.y - r, HUB.x + r, HUB.y + r); gr.addColorStop(0, C.blue); gr.addColorStop(1, C.magenta);
  ctx.beginPath(); ctx.arc(HUB.x, HUB.y, r * beat, 0, TAU); ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2.5; ctx.stroke();
  text(ctx, 'ACI', HUB.x, HUB.y + 14, { f: 'display', size: 42, weight: 700, align: 'center', alpha: clamp(g) });
  // three domain colours orbiting inside the hub: the team lives here
  for (let i = 0; i < 3; i++) {
    const an = t * 0.9 + (i * TAU) / 3;
    dot(ctx, HUB.x + Math.cos(an) * (r + 16), HUB.y + Math.sin(an) * (r + 16), 5 * clamp(g), [C.cms, C.xray, C.nmr][i]!);
  }
}

function drawNodes(ctx: Ctx, t: number, lay: { k: number }) {
  // orbit
  const op = prog(t, T.resp, 1.0, ease.inOutCubic);
  if (op > 0) {
    strokeStyle(ctx, '#9FB0FF', 1.5, 0.35); ctx.setLineDash([6, 10]); ctx.lineDashOffset = -t * 12;
    ctx.beginPath(); ctx.ellipse(HUB.x, HUB.y, ORB.rx, ORB.ry, 0, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(op, 0.9999)); ctx.stroke(); ctx.setLineDash([]);
  }
  NODES.forEach((n, i) => {
    const t0 = T.nodes[i]!;
    const p = nodeAt(i);
    // spoke
    const sp = prog(t, t0 - 0.35, 0.45, ease.inOutCubic);
    const d = Math.hypot(p.x - HUB.x, p.y - HUB.y), ux = (p.x - HUB.x) / d, uy = (p.y - HUB.y) / d;
    const a0 = { x: HUB.x + ux * (HUB.r + 14), y: HUB.y + uy * (HUB.r + 14) }, a1 = { x: p.x - ux * (NODE_R + 8), y: p.y - uy * (NODE_R + 8) };
    strokeStyle(ctx, n.color, 2.5, 0.75);
    const h = polyPartial(ctx, [a0, a1], sp);
    if (h && sp < 1) { glow(ctx, h.x, h.y, 34, n.color, 1); dot(ctx, h.x, h.y, 4, '#fff'); }
    if (sp >= 1) {
      // periodic pulses hub → node; a stronger wave for "evolving research needs"
      const per = 2.6, u = (((t - t0) / per) % 1 + 1) % 1;
      const q = { x: lerp(a0.x, a1.x, u), y: lerp(a0.y, a1.y, u) };
      glow(ctx, q.x, q.y, 22, n.color, 0.7 * Math.sin(u * Math.PI));
      const w = prog(t, T.evolving - 0.1 + i * 0.05, 0.6, ease.inOutCubic);
      if (w > 0 && w < 1) { const r = { x: lerp(a0.x, a1.x, w), y: lerp(a0.y, a1.y, w) }; glow(ctx, r.x, r.y, 50, '#FFFFFF', 0.9); }
    }
    // node
    const np = springAt(t, t0 - 0.05, 0.55, 12);
    if (np <= 0) return;
    const arrive = pulse(t, t0, 0.03, 0.6) + pulse(t, T.evolving + 0.5 + i * 0.05, 0.05, 0.6);
    withT(ctx, p.x, p.y, clamp(np, 0, 1.2), () => {
      glow(ctx, 0, 0, NODE_R * 2.2, n.color, 0.3 + 0.5 * Math.min(1, arrive));
      ctx.beginPath(); ctx.arc(0, 0, NODE_R, 0, TAU); ctx.fillStyle = rgba(C.ink1, 0.92); ctx.fill();
      strokeStyle(ctx, n.color, 3, 0.95); ctx.stroke();
      n.icon(ctx, 0, 2, 104, t - t0, n.color);
    });
    // label: outward side of the node
    const right = Math.cos((n.a * Math.PI) / 180) > -0.1;
    const lx = p.x + (right ? NODE_R + 22 : -NODE_R - 22);
    const al = right ? 'left' : 'right';
    const la = prog(t, t0, 0.5) * lerp(1, 0.75, lay.k);
    const n1 = n.title.length;
    n.title.forEach((ln, k) => {
      const lt = i === 5 && k === 1 ? T.sustain : t0 + k * 0.12;
      revealWords(ctx, [ln], [lt], t, lx, p.y + 10 - ((n1 - 1) * 34) / 2 + k * 34 - (n.sub ? 12 : 0), { f: 'display', size: 29, weight: 600, align: al as 'left' | 'right', alpha: la });
    });
    if (n.sub) text(ctx, n.sub, lx, p.y + 10 + ((n1 - 1) * 34) / 2 + 22, { f: 'mono', size: 17, weight: 500, color: rgba(n.color, 1), align: al as 'left' | 'right', tracking: 1.5, alpha: prog(t, t0 + 0.35, 0.5) * lerp(1, 0.75, lay.k) });
  });
}

const OUTCOMES = ['Effectively managed', 'Optimised', 'Kept relevant'];
function drawOutcomes(ctx: Ctx, t: number, k: number) {
  if (k <= 0.01) return;
  const x = 1290;
  withAlpha(ctx, k, () => {
    revealWords(ctx, ['Our', 'scientific', 'resources', 'are…'], [T.resources - 0.6, T.resources - 0.5, T.resources - 0.4, T.resources], t, x, 350, { f: 'body', size: 30, weight: 500, color: C.text2 });
    OUTCOMES.forEach((o, i) => {
      const t0 = T.outcomes[i]!, y = 470 + i * 130;
      const p = springAt(t, t0 - 0.05, 0.5, 13);
      if (p <= 0) return;
      withT(ctx, x + 36, y - 16, clamp(p, 0, 1.2), () => {
        glow(ctx, 0, 0, 70, C.nmr, 0.5 * pulse(t, t0, 0.03, 0.8) + 0.2);
        ctx.beginPath(); ctx.arc(0, 0, 32, 0, TAU); ctx.fillStyle = rgba(C.nmr, 0.18); ctx.fill(); strokeStyle(ctx, C.nmr, 3); ctx.stroke();
        checkMark(ctx, 0, 0, 28, prog(t, t0 + 0.05, 0.35), '#FFFFFF', 4.5);
      });
      revealWords(ctx, [o], [t0], t, x + 96, y, { f: 'display', size: 48, weight: 600 });
    });
  });
}

function drawEndCard(ctx: Ctx, t: number) {
  const p = prog(t, T.end + 0.3, 0.9, ease.outCubic);
  if (p <= 0) return;
  const st = { f: 'display' as const, size: 200, weight: 700 };
  withAlpha(ctx, p, () => {
    const full = measure(ctx, 'ACI', st);
    [0, 1, 2].forEach((i) => glow(ctx, W / 2 + (i - 1) * full * 0.34, 470, 240, BRAND[i]!, 0.35));
    const g = ctx.createLinearGradient(W / 2 - full / 2, 0, W / 2 + full / 2, 0);
    g.addColorStop(0, '#6F8BFF'); g.addColorStop(0.5, '#A374FF'); g.addColorStop(1, '#FF5FA2');
    ctx.save(); ctx.font = `700 200px Display`; ctx.textAlign = 'center'; ctx.fillStyle = g; ctx.fillText('ACI', W / 2, 530 + (1 - p) * 30); ctx.restore();
  });
  revealWords(ctx, ['Advanced', 'Characterization', 'and', 'Instrumentation'], [T.end + 0.6, T.end + 0.7, T.end + 0.8, T.end + 0.9], t, W / 2, 640, { f: 'display', size: 46, weight: 500, align: 'center' });
  const lp = prog(t, T.end + 1.2, 0.8);
  if (lp > 0) { const lw = 280, lh = (img.logo.height / img.logo.width) * lw; withAlpha(ctx, lp, () => ctx.drawImage(img.logo, W / 2 - lw / 2, 740, lw, lh)); }
}

export const s5: Scene = {
  id: 'resources',
  start: HUB.t,
  end: DURATION,
  bg: () => ({ grid: 0.9 }),
  draw(ctx, t) {
    const lay = layout(t);
    const outro = prog(t, T.end - 0.2, 0.9, ease.inOutCubic);
    withAlpha(ctx, 1 - outro, () => {
      ctx.save();
      ctx.translate(lay.x, lay.y); ctx.scale(lay.s * lerp(1, 0.6, outro), lay.s * lerp(1, 0.6, outro)); ctx.translate(-HUB.x, -HUB.y);
      drawRing(ctx, t, 1);
      drawNodes(ctx, t, lay);
      drawHub(ctx, t);
      ctx.restore();
      drawOutcomes(ctx, t, lay.k);
      revealWords(ctx, ['Shared', 'scientific', 'resource', 'management'], [T.shared, T.shared + 0.15, T.shared + 0.3, T.shared + 0.45], t, W / 2, 168, { f: 'display', size: 44, weight: 600, align: 'center' });
    });
    drawEndCard(ctx, t);
  },
};
export const S5_TIMES = T;
void keys;
