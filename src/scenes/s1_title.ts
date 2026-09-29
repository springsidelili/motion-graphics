// Scene 1 · Welcome (slide 1).
// A pipette drops into a microplate well; the ripple lights the plate; lit wells
// lift off and assemble "ACI"; the full name is spelled out and each initial is
// tied to its big letter; finally the letters collapse to one dot = the ACI node.
import { createCanvas } from '@napi-rs/canvas';
import { img, type Ctx, W, H } from '../engine/assets';
import { C, BRAND } from '../engine/theme';
import { cue } from '../engine/narration';
import type { Scene } from '../engine/scene';
import { clamp, ease, lerp, prog, rgba, gradAt, mulberry32, pulse, bezier, keys, smoothstep, type Pt } from '../engine/util';
import { text, measure, revealWords, glow, dot, withAlpha, strokeStyle, bezierPts, polyPartial } from '../engine/draw';

export const ACI_DOT = { x: W / 2, y: H / 2, r: 16, t: 9.75 };

const T = {
  drop: 1.55,      // drop detaches
  impact: 2.12,    // drop lands
  welcome: cue(1, 'Welcome').t,
  aci: cue(1, 'ACI').t,
  words: [cue(1, 'Advanced').t, cue(1, 'Characterization').t, cue(1, 'and').t, cue(1, 'Instrumentation').t],
  logo: cue(1, 'Instrumentation').t + 0.5,
  exit: 8.65,
  collapse: 8.9,
  land: 9.65,
};

// ---------------------------------------------------------------- microplate in perspective
const COLS = 17, ROWS = 11, IMPACT = { c: 8, r: 3 };
function plateCam(t: number) {
  const D = keys(t, [[0, 7.4], [3.6, 5.9, ease.outCubic], [9, 5.6]]);
  const horizon = keys(t, [[0, 150], [3.4, 175], [5.2, 560, ease.inOutCubic], [9.4, 660, ease.inOutCubic]]);
  return { D, horizon, f: 1000, hc: 4.0 };
}
function proj(t: number, X: number, Z: number) {
  const c = plateCam(t);
  const zc = Z + c.D;
  return { x: W / 2 + (c.f * X) / zc, y: c.horizon + (c.f * c.hc) / zc, s: c.f / zc, fore: c.hc / zc };
}
const wellXZ = (c: number, r: number) => ({ X: c - (COLS - 1) / 2, Z: r });

function drawPlate(ctx: Ctx, t: number, a: number) {
  if (a <= 0.002) return;
  const since = t - T.impact;
  for (let r = ROWS - 1; r >= 0; r--) {
    for (let c = 0; c < COLS; c++) {
      const { X, Z } = wellXZ(c, r);
      const p = proj(t, X, Z);
      if (p.x < -80 || p.x > W + 80) continue;
      const rx = p.s * 0.37, ry = rx * p.fore * 0.95;
      const d = Math.hypot(c - IMPACT.c, r - IMPACT.r);
      const wave = since > 0 ? pulse(t, T.impact + d * 0.075, 0.04, 0.55) : 0;
      const rest = since > 0 ? 0.22 * smoothstep(0, 1.2, since - d * 0.075) : 0;
      const L = Math.min(1.2, wave + rest);
      const col = gradAt(BRAND, (d / 9) % 1);
      const depthA = clamp(1.25 - r / ROWS) * a;
      withAlpha(ctx, depthA, () => {
        ctx.beginPath(); ctx.ellipse(p.x, p.y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = rgba(L > 0.05 ? col : C.ink2, L > 0.05 ? 0.25 * L + 0.1 : 0.55); ctx.fill();
        ctx.strokeStyle = rgba(L > 0.05 ? col : '#8FA2FF', 0.25 + 0.6 * Math.min(1, L)); ctx.lineWidth = Math.max(1, rx * 0.06); ctx.stroke();
        if (L > 0.05) glow(ctx, p.x, p.y, rx * 2.4, col, L * 0.55);
      });
    }
  }
  // ripple rings on the plate plane
  if (since > 0 && since < 2.2) {
    const cp = proj(t, 0, IMPACT.r);
    for (let k = 0; k < 3; k++) {
      const u = since - k * 0.18;
      if (u <= 0) continue;
      const R = u * 5.2;
      const rx = cp.s * R, ry = rx * cp.fore * 0.95;
      withAlpha(ctx, a * Math.max(0, 1 - u / 1.8) * 0.8, () => {
        ctx.beginPath(); ctx.ellipse(cp.x, cp.y, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = rgba(k === 0 ? '#FFFFFF' : C.cyan, 0.8); ctx.lineWidth = 2.5 - k * 0.6; ctx.stroke();
      });
    }
  }
}

function drawPipette(ctx: Ctx, t: number) {
  const target = proj(t, 0, IMPACT.r);
  const tipY = keys(t, [[0, -120], [1.15, target.y - 230, ease.outCubic], [T.drop + 0.2, target.y - 230], [2.9, -200, ease.inCubic]]);
  if (tipY < -110) return;
  const x = W / 2, L = 760, TW = 62;
  ctx.save();
  // tapered glass tip
  ctx.beginPath();
  ctx.moveTo(x - TW, tipY - L); ctx.lineTo(x + TW, tipY - L); ctx.lineTo(x + TW * 0.55, tipY - L * 0.42); ctx.lineTo(x + 6, tipY); ctx.lineTo(x - 6, tipY); ctx.lineTo(x - TW * 0.55, tipY - L * 0.42); ctx.closePath();
  const g = ctx.createLinearGradient(x - TW, 0, x + TW, 0);
  g.addColorStop(0, 'rgba(190,205,255,0.10)'); g.addColorStop(0.35, 'rgba(230,238,255,0.32)'); g.addColorStop(0.6, 'rgba(190,205,255,0.08)'); g.addColorStop(1, 'rgba(190,205,255,0.16)');
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(210,222,255,0.6)'; ctx.lineWidth = 2; ctx.stroke();
  // specular highlight
  ctx.beginPath(); ctx.moveTo(x - TW * 0.5, tipY - L); ctx.lineTo(x - TW * 0.28, tipY - L * 0.42); ctx.lineTo(x - 3, tipY - 20);
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 3; ctx.stroke();
  // liquid inside the tip
  ctx.beginPath(); ctx.moveTo(x - TW * 0.3, tipY - L * 0.28); ctx.lineTo(x + TW * 0.3, tipY - L * 0.28); ctx.lineTo(x + 4, tipY - 3); ctx.lineTo(x - 4, tipY - 3); ctx.closePath();
  const lg = ctx.createLinearGradient(0, tipY - L * 0.28, 0, tipY);
  lg.addColorStop(0, rgba(C.cyan, 0.25)); lg.addColorStop(1, rgba(C.cyan, 0.75));
  ctx.fillStyle = lg; ctx.fill();
  ctx.restore();
  // drop forming at the tip, then falling
  const grow = prog(t, 1.0, 0.55, ease.outCubic);
  if (t < T.drop && grow > 0) { glow(ctx, x, tipY + 6 * grow, 30, C.cyan, 0.6 * grow); dot(ctx, x, tipY + 7 * grow, 8 * grow, '#DDF6FF'); }
  if (t >= T.drop && t < T.impact) {
    const u = (t - T.drop) / (T.impact - T.drop);
    const y = lerp(tipY + 7, target.y, u * u);
    ctx.save(); ctx.translate(x, y); ctx.scale(1 - u * 0.15, 1 + u * 0.35);
    glow(ctx, 0, 0, 34, C.cyan, 0.8); dot(ctx, 0, 0, 8, '#E8FAFF'); ctx.restore();
  }
}

// ---------------------------------------------------------------- "ACI" from particles
const BIG = { size: 270, y: 600 };
type Particle = { tx: number; ty: number; sx: number; sy: number; d0: number; col: string; cx: number; cy: number };
let parts: Particle[] | null = null;
let letterX: number[] = [];
function particles(ctx: Ctx) {
  if (parts) return parts;
  const st = { f: 'display' as const, size: BIG.size, weight: 700 };
  const full = measure(ctx, 'ACI', st);
  const x0 = W / 2 - full / 2;
  letterX = [0, 1, 2].map((i) => x0 + measure(ctx, 'ACI'.slice(0, i), st) + measure(ctx, 'ACI'[i]!, st) / 2);
  const off = createCanvas(W, 420), o = off.getContext('2d');
  o.font = `700 ${BIG.size}px Display`; o.fillStyle = '#fff'; o.textAlign = 'left'; o.fillText('ACI', x0, 330);
  const data = o.getImageData(0, 0, W, 420).data;
  const rnd = mulberry32(7);
  const out: Particle[] = [];
  const step = 9;
  for (let y = 0; y < 420; y += step) for (let x = 0; x < W; x += step) {
    const jx = x + (Math.floor(y / step) % 2 ? step / 2 : 0);
    if (jx >= W || data[(y * W + jx) * 4 + 3]! < 128) continue;
    // start at a random lit well near the impact
    const c = Math.round(IMPACT.c + (rnd() - 0.5) * 12), r = Math.max(0, Math.min(ROWS - 1, Math.round(IMPACT.r + (rnd() - 0.4) * 5)));
    const { X, Z } = wellXZ(c, r);
    const p = proj(T.aci, X, Z);
    const tx = jx, ty = y - 330 + BIG.y;
    out.push({ tx, ty, sx: p.x + (rnd() - 0.5) * 20, sy: p.y + (rnd() - 0.5) * 8, d0: rnd() * 0.35, col: rgba(gradAt(BRAND, (tx - x0) / full), 1), cx: (rnd() - 0.5) * 300, cy: -200 - rnd() * 250 });
  }
  parts = out;
  return out;
}

function drawACI(ctx: Ctx, t: number) {
  const P = particles(ctx);
  const solid = prog(t, T.aci + 1.05, 0.5, ease.inOutCubic) * (1 - prog(t, T.collapse - 0.05, 0.25, ease.inCubic));
  // particle flight in, and collapse out to the ACI dot
  const inP = (p: Particle) => prog(t, T.aci + p.d0, 0.95, ease.inOutCubic);
  const outP = (p: Particle) => prog(t, T.collapse + p.d0 * 0.6, 0.62, ease.inCubic);
  const dotsA = 1 - solid * 0.85;
  if (t >= T.aci && t < ACI_DOT.t) {
    for (const p of P) {
      const a = inP(p), b = outP(p);
      if (a <= 0) continue;
      let q: Pt = bezier({ x: p.sx, y: p.sy }, { x: p.sx + p.cx * 0.3, y: p.sy + p.cy }, { x: p.tx + p.cx, y: p.ty - 120 }, { x: p.tx, y: p.ty }, a);
      if (b > 0) {
        const sw = b * b * 1.6; // spiral in: rotate while contracting
        const dx = p.tx - ACI_DOT.x, dy = p.ty - ACI_DOT.y, k = 1 - b;
        q = { x: ACI_DOT.x + (dx * Math.cos(sw) - dy * Math.sin(sw)) * k, y: ACI_DOT.y + (dx * Math.sin(sw) + dy * Math.cos(sw)) * k };
      }
      const r = a < 1 ? 2.4 : 3.2;
      dot(ctx, q.x, q.y, r, p.col, (b > 0 ? 1 : dotsA) * clamp(a * 3));
    }
  }
  if (solid > 0.002) {
    withAlpha(ctx, solid, () => {
      [0, 1, 2].forEach((i) => glow(ctx, letterX[i]!, BIG.y - BIG.size * 0.35, 260, BRAND[i]!, 0.35));
      const st = { f: 'display' as const, size: BIG.size, weight: 700 };
      const full = measure(ctx, 'ACI', st);
      const g = ctx.createLinearGradient(W / 2 - full / 2, 0, W / 2 + full / 2, 0);
      g.addColorStop(0, '#6F8BFF'); g.addColorStop(0.5, '#A374FF'); g.addColorStop(1, '#FF5FA2');
      ctx.font = `700 ${BIG.size}px Display`; ctx.textAlign = 'center'; ctx.fillStyle = g;
      ctx.fillText('ACI', W / 2, BIG.y);
    });
  }
  // the dot everything collapses into
  const land = prog(t, T.land - 0.25, 0.3, ease.outBack);
  if (land > 0 && t < ACI_DOT.t) {
    glow(ctx, ACI_DOT.x, ACI_DOT.y, 90, C.violet, land);
    dot(ctx, ACI_DOT.x, ACI_DOT.y, ACI_DOT.r * land, '#FFFFFF');
  }
}

// ---------------------------------------------------------------- full name + acronym leaders
function drawName(ctx: Ctx, t: number) {
  const out = prog(t, T.exit, 0.4, ease.inCubic);
  if (out >= 1) return;
  withAlpha(ctx, 1 - out, () => {
    const y = 716 - out * 20;
    const st = { f: 'display' as const, size: 54, weight: 500, align: 'center' as const, color: C.text };
    const words = ['Advanced', 'Characterization', 'and', 'Instrumentation'];
    const lay = revealWords(ctx, words, T.words, t, W / 2, y, st, { dur: 0.6 });
    // tint the initials A, C, I and tie each one to its big letter
    const initials = [0, 1, 3];
    initials.forEach((wi, k) => {
      const b = lay.boxes[wi]!;
      if (b.p <= 0.01) return;
      const lx = b.x + measure(ctx, words[wi]![0]!, st) / 2;
      text(ctx, words[wi]![0]!, b.x, y + (1 - b.p) * 0.6 * 54, { ...st, align: 'left', color: BRAND[k], alpha: b.p });
      const lp = prog(t, T.words[wi]! + 0.2, 0.55, ease.inOutCubic);
      if (lp > 0 && letterX.length) {
        const a0 = { x: letterX[k]!, y: BIG.y + 24 }, a1 = { x: lx, y: y - 52 };
        strokeStyle(ctx, BRAND[k]!, 2, 0.85);
        const h = polyPartial(ctx, bezierPts(a0, { x: a0.x, y: a0.y + 40 }, { x: a1.x, y: a1.y - 40 }, a1, 30), lp);
        dot(ctx, a0.x, a0.y, 4, BRAND[k]!);
        if (h) { glow(ctx, h.x, h.y, 16, BRAND[k]!, 0.9); dot(ctx, h.x, h.y, 3.5, '#fff'); }
      }
    });
    // "WELCOME TO"
    const wp = prog(t, T.welcome, 0.7);
    text(ctx, 'WELCOME TO', W / 2, 340 + (1 - wp) * 16 - out * 20, { f: 'mono', size: 26, weight: 500, tracking: 12, color: C.text2, align: 'center', alpha: wp });
    // ISCE² lockup
    const lp = prog(t, T.logo, 0.8);
    if (lp > 0) {
      const lw = 300, lh = (img.logo.height / img.logo.width) * lw;
      withAlpha(ctx, lp * 0.95, () => ctx.drawImage(img.logo, W / 2 - lw / 2, 812 + (1 - lp) * 14, lw, lh));
    }
  });
}

export const s1: Scene = {
  id: 'title',
  start: 0,
  end: ACI_DOT.t + 0.05,
  // ends on the same background state scene 2 starts with (energy 1, grid 0.9)
  bg: (t) => ({ energy: keys(t, [[0, 0.25], [2.1, 0.45], [2.6, 1.0]]), grid: keys(t, [[0, 0], [3, 0], [5, 0.5], [9, 0.9]]) }),
  draw(ctx, t) {
    const fadeIn = prog(t, 0, 0.8, ease.outCubic);
    withAlpha(ctx, fadeIn, () => {
      const plateA = keys(t, [[0, 1], [4.2, 1], [5.4, 0.4], [8.6, 0.4], [9.4, 0]]);
      drawPlate(ctx, t, plateA);
      drawPipette(ctx, t);
      // impact flash
      const f = pulse(t, T.impact, 0.03, 0.35);
      if (f > 0.01) { const p = proj(t, 0, IMPACT.r); glow(ctx, p.x, p.y, 260, C.cyan, f * 0.8); }
      drawACI(ctx, t);
      drawName(ctx, t);
    });
  },
};
export const S1_TIMES = T;
