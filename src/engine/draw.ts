import { createCanvas, type Canvas } from '@napi-rs/canvas';
import { img, type Ctx, W, H } from './assets';
import { F, C, type FontKey } from './theme';
import { clamp, ease, lerp, prog, rgba, type Pt, type RGB, bezier, TAU, springAt } from './util';

// ---------------------------------------------------------------- state helpers
export function withAlpha(ctx: Ctx, a: number, fn: () => void) {
  if (a <= 0.002) return;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  fn();
  ctx.restore();
}
export function withT(ctx: Ctx, x: number, y: number, s: number, fn: () => void, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  if (s !== 1) ctx.scale(s, s);
  fn();
  ctx.restore();
}

export type Cam = { x: number; y: number; z: number; r?: number };
export const CAM0: Cam = { x: W / 2, y: H / 2, z: 1 };
export function applyCam(ctx: Ctx, cam: Cam) {
  ctx.translate(W / 2, H / 2);
  ctx.scale(cam.z, cam.z);
  if (cam.r) ctx.rotate(cam.r);
  ctx.translate(-cam.x, -cam.y);
}
export const lerpCam = (a: Cam, b: Cam, t: number): Cam => ({
  x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t),
  z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), t)), r: lerp(a.r ?? 0, b.r ?? 0, t),
});

// ---------------------------------------------------------------- text
export type TextStyle = {
  f?: FontKey; size: number; weight?: number; color?: string; alpha?: number;
  align?: 'left' | 'center' | 'right'; baseline?: 'alphabetic' | 'middle' | 'top' | 'bottom'; tracking?: number;
};
export function setFont(ctx: Ctx, st: TextStyle) {
  ctx.font = `${st.weight ?? 500} ${st.size}px ${F[st.f ?? 'body']}`;
  ctx.letterSpacing = `${st.tracking ?? 0}px`;
}
export function measure(ctx: Ctx, s: string, st: TextStyle) {
  setFont(ctx, st);
  const w = ctx.measureText(s).width;
  ctx.letterSpacing = '0px';
  return w;
}
export function text(ctx: Ctx, s: string, x: number, y: number, st: TextStyle) {
  if ((st.alpha ?? 1) <= 0.002) return;
  ctx.save();
  setFont(ctx, st);
  ctx.globalAlpha *= clamp(st.alpha ?? 1);
  ctx.fillStyle = st.color ?? C.text;
  ctx.textAlign = st.align ?? 'left';
  ctx.textBaseline = st.baseline ?? 'alphabetic';
  ctx.fillText(s, x, y);
  ctx.restore();
}

/**
 * Word-by-word reveal: each word rises out of a mask line and fades in at its
 * own time (usually the spoken onset). Returns the laid-out word boxes.
 */
export function revealWords(ctx: Ctx, words: string[], times: number[], t: number, x: number, y: number, st: TextStyle,
  o: { dur?: number; rise?: number; mask?: boolean; color?: (i: number) => string | undefined; out?: number; outDur?: number } = {}) {
  const dur = o.dur ?? 0.55, rise = (o.rise ?? 0.6) * st.size;
  const space = measure(ctx, ' ', st);
  const widths = words.map((w) => measure(ctx, w, st));
  const total = widths.reduce((a, b) => a + b, 0) + space * (words.length - 1);
  let cx = st.align === 'center' ? x - total / 2 : st.align === 'right' ? x - total : x;
  const boxes: { x: number; w: number; p: number }[] = [];
  const outP = o.out !== undefined ? prog(t, o.out, o.outDur ?? 0.4, ease.inCubic) : 0;
  for (let i = 0; i < words.length; i++) {
    const p = prog(t, times[i] ?? times[times.length - 1]!, dur, ease.outCubic);
    boxes.push({ x: cx, w: widths[i]!, p });
    if (p > 0.001 && outP < 0.999) {
      ctx.save();
      if (o.mask !== false) { ctx.beginPath(); ctx.rect(cx - 10, y - st.size * 1.15, widths[i]! + 20, st.size * 1.5); ctx.clip(); }
      text(ctx, words[i]!, cx, y + (1 - p) * rise - outP * rise, { ...st, align: 'left', alpha: (st.alpha ?? 1) * p * (1 - outP), color: o.color?.(i) ?? st.color });
      ctx.restore();
    }
    cx += widths[i]! + space;
  }
  return { boxes, width: total, x0: boxes[0]?.x ?? x };
}

/** Typewriter reveal for mono labels; `cps` characters per second. */
export function typeText(ctx: Ctx, s: string, t: number, t0: number, x: number, y: number, st: TextStyle, cps = 40, cursor = true) {
  const n = Math.floor(clamp((t - t0) * cps, 0, s.length));
  if (t < t0) return;
  text(ctx, s.slice(0, n), x, y, st);
  if (cursor && n < s.length) {
    const w = measure(ctx, s.slice(0, n), st);
    const ax = st.align === 'center' ? x - measure(ctx, s, st) / 2 + w : x + w;
    withAlpha(ctx, st.alpha ?? 1, () => { ctx.fillStyle = st.color ?? C.text; ctx.fillRect(ax + 2, y - st.size * 0.8, st.size * 0.5, st.size * 0.95); });
  }
}

// ---------------------------------------------------------------- shapes
export function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export type CardStyle = { r?: number; fill?: string; stroke?: string; lw?: number; glow?: string; glowA?: number; accent?: string };
export function card(ctx: Ctx, x: number, y: number, w: number, h: number, s: CardStyle = {}) {
  const r = s.r ?? 18;
  if (s.glow) glowRect(ctx, x, y, w, h, s.glow, s.glowA ?? 0.35, r);
  rr(ctx, x, y, w, h, r);
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, s.fill ?? rgba(C.panel, 0.78));
  g.addColorStop(1, s.fill ?? rgba(C.ink1, 0.82));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = s.lw ?? 1.5;
  ctx.strokeStyle = s.stroke ?? rgba('#8FA2FF', 0.22);
  ctx.stroke();
  if (s.accent) {
    ctx.save(); rr(ctx, x, y, w, h, r); ctx.clip();
    ctx.fillStyle = s.accent; ctx.fillRect(x, y, 6, h);
    ctx.restore();
  }
}

const glowCache = new Map<string, Canvas>();
function glowSprite(color: string | RGB) {
  // RGB inputs are quantised so computed gradients share a small set of sprites
  const key = typeof color === 'string' ? color : color.map((v) => Math.round(v / 6) * 6).join(',');
  let c = glowCache.get(key);
  if (c) return c;
  if (typeof color !== 'string') color = key.split(',').map(Number) as RGB;
  c = createCanvas(256, 256);
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  // gaussian-ish falloff
  for (let i = 0; i <= 10; i++) { const u = i / 10; gr.addColorStop(u, rgba(color, Math.exp(-u * u * 4.2) * (1 - u))); }
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  glowCache.set(key, c);
  return c;
}
/** Soft additive glow blob of radius r. */
export function glow(ctx: Ctx, x: number, y: number, r: number, color: string | RGB, a = 1) {
  if (a <= 0.002 || r <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(glowSprite(color), x - r, y - r, r * 2, r * 2);
  ctx.restore();
}
export function glowRect(ctx: Ctx, x: number, y: number, w: number, h: number, color: string, a = 0.4, r = 18) {
  if (a <= 0.002) return;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  ctx.shadowColor = color;
  ctx.shadowBlur = 40;
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = rgba(color, 0.5);
  ctx.fill();
  ctx.restore();
}

export function dot(ctx: Ctx, x: number, y: number, r: number, color: string, a = 1) {
  if (a <= 0.002 || r <= 0) return;
  ctx.save(); ctx.globalAlpha *= clamp(a);
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = color; ctx.fill();
  ctx.restore();
}
export function ring(ctx: Ctx, x: number, y: number, r: number, p: number, color: string, lw = 2, a = 1, start = -Math.PI / 2) {
  if (p <= 0 || a <= 0.002) return;
  ctx.save(); ctx.globalAlpha *= clamp(a);
  ctx.beginPath();
  // Skia drops a full sweep that does not start at 0: draw complete rings from 0
  if (p >= 0.9999) ctx.arc(x, y, r, 0, TAU); else ctx.arc(x, y, r, start, start + TAU * clamp(p));
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.stroke();
  ctx.restore();
}

/** Stroke the first u∈[0,1] of a polyline (by length). Returns the pen head. */
export function polyPartial(ctx: Ctx, pts: Pt[], u: number): Pt | null {
  if (u <= 0 || pts.length < 2) return null;
  const segs: number[] = [];
  let L = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.y - pts[i - 1]!.y); segs.push(d); L += d; }
  let rem = clamp(u) * L;
  ctx.beginPath();
  ctx.moveTo(pts[0]!.x, pts[0]!.y);
  let head: Pt = pts[0]!;
  for (let i = 1; i < pts.length; i++) {
    const d = segs[i - 1]!;
    if (rem >= d) { ctx.lineTo(pts[i]!.x, pts[i]!.y); head = pts[i]!; rem -= d; }
    else { const k = d ? rem / d : 0; head = { x: lerp(pts[i - 1]!.x, pts[i]!.x, k), y: lerp(pts[i - 1]!.y, pts[i]!.y, k) }; ctx.lineTo(head.x, head.y); break; }
  }
  ctx.stroke();
  return head;
}
export function bezierPts(p0: Pt, p1: Pt, p2: Pt, p3: Pt, n = 48) {
  return Array.from({ length: n + 1 }, (_, i) => bezier(p0, p1, p2, p3, i / n));
}
/** Elbow connector (vertical-horizontal-vertical) like an org chart. */
export function elbowPts(a: Pt, b: Pt, midY?: number): Pt[] {
  const my = midY ?? (a.y + b.y) / 2;
  return [a, { x: a.x, y: my }, { x: b.x, y: my }, b];
}
export function strokeStyle(ctx: Ctx, color: string, lw: number, a = 1) {
  ctx.strokeStyle = rgba(color, a);
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

// ---------------------------------------------------------------- people
/** Circular portrait; p = entrance progress (spring scale + ring draw-on). */
export function portrait(ctx: Ctx, id: string, cx: number, cy: number, r: number, p: number, color: string, a = 1) {
  if (p <= 0.001 || a <= 0.002) return;
  const face = img.faces[id];
  if (!face) throw new Error(`no face ${id}`);
  const s = Math.max(0, p);
  const rr_ = r * s;
  withAlpha(ctx, a * clamp(p * 3), () => {
    glow(ctx, cx, cy, rr_ * 1.9, color, 0.35);
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, rr_, 0, TAU); ctx.clip();
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(face, cx - rr_, cy - rr_, rr_ * 2, rr_ * 2);
    ctx.restore();
    ring(ctx, cx, cy, rr_ + 4, clamp(p * 1.15), color, 3);
  });
}

export type Person = { id: string; name: string; role: string };
/**
 * Horizontal person card: portrait left, name + role right. Entrance at t0:
 * card grows in, portrait springs, name rises, role types.
 */
export function personCard(ctx: Ctx, t: number, t0: number, p: Person, x: number, y: number, w: number, h: number, color: string,
  o: { a?: number; badge?: { text: string; t: number }; nameSize?: number; nameT?: number; roleT?: number; faceT?: number } = {}) {
  const e = prog(t, t0, 0.5, ease.outCubic);
  if (e <= 0.001) return;
  const a = o.a ?? 1;
  withAlpha(ctx, a * e, () => {
    const sc = lerp(0.92, 1, e);
    withT(ctx, x + w / 2, y + h / 2, sc, () => {
      const X = -w / 2, Y = -h / 2;
      card(ctx, X, Y, w, h, { r: h / 2, stroke: rgba(color, 0.55), fill: rgba(C.ink1, 0.86) });
      const pr = h * 0.36;
      const faceT = o.faceT ?? t0 + 0.05;
      if (t < faceT) { ctx.beginPath(); ctx.arc(X + h / 2, 0, pr, 0, TAU); ctx.setLineDash([5, 6]); strokeStyle(ctx, color, 2, 0.6); ctx.stroke(); ctx.setLineDash([]); }
      portrait(ctx, p.id, X + h / 2, 0, pr, springAt(t, faceT, 0.55, 12), color);
      const tx = X + h * 0.98;
      const ns = o.nameSize ?? Math.round(h * 0.25);
      revealWords(ctx, [p.name], [o.nameT ?? t0 + 0.12], t, tx, 2, { f: 'body', size: ns, weight: 600, color: C.text }, { dur: 0.5 });
      typeText(ctx, p.role.toUpperCase(), t, o.roleT ?? t0 + 0.28, tx, 2 + ns * 0.95, { f: 'mono', size: Math.round(ns * 0.56), weight: 500, color: rgba(color, 1), tracking: 1 }, 55, false);
      if (o.badge) badge(ctx, t, o.badge.t, o.badge.text, X + w - 14, Y + 12, color);
    });
  });
}

export function badge(ctx: Ctx, t: number, t0: number, s: string, xr: number, y: number, color: string) {
  const sp = springAt(t, t0, 0.42, 16);
  if (sp <= 0.001) return;
  const st: TextStyle = { f: 'mono', size: 19, weight: 700, tracking: 1.5 };
  const tw = measure(ctx, s, st) + 26;
  withT(ctx, xr - tw / 2, y, sp, () => {
    glow(ctx, 0, 0, tw * 0.9, color, 0.35);
    rr(ctx, -tw / 2, -17, tw, 34, 17);
    ctx.fillStyle = color; ctx.fill();
    text(ctx, s, 0, 1, { ...st, color: C.ink0, align: 'center', baseline: 'middle' });
  });
}

/** Pill label with optional leading icon slot. */
export function pill(ctx: Ctx, s: string, cx: number, cy: number, st: TextStyle, color: string, a = 1, fill = true) {
  const w = measure(ctx, s, st) + st.size * 1.6, h = st.size * 1.9;
  withAlpha(ctx, a, () => {
    rr(ctx, cx - w / 2, cy - h / 2, w, h, h / 2);
    ctx.fillStyle = fill ? rgba(color, 0.16) : 'rgba(0,0,0,0)'; ctx.fill();
    ctx.strokeStyle = rgba(color, 0.7); ctx.lineWidth = 1.5; ctx.stroke();
    text(ctx, s, cx, cy + 1, { ...st, align: 'center', baseline: 'middle' });
  });
  return w;
}

export function checkMark(ctx: Ctx, x: number, y: number, s: number, p: number, color: string, lw = 4) {
  if (p <= 0) return;
  strokeStyle(ctx, color, lw);
  polyPartial(ctx, [{ x: x - s * 0.5, y: y }, { x: x - s * 0.15, y: y + s * 0.35 }, { x: x + s * 0.55, y: y - s * 0.4 }], p);
}
