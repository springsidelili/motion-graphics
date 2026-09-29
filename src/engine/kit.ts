// Reusable components for the domain chapters (slides 5–12): photo cards,
// the domain selector, domain title cards and the capability tree. They keep
// the three domain chapters visually identical, so viewers learn the layout
// once and then only have to follow the content.
import { img, type Ctx, W, H } from './assets';
import { C, DOMAINS } from './theme';
import { clamp, ease, lerp, prog, rgba, springAt, pulse, TAU, type Pt } from './util';
import { text, glow, dot, withAlpha, withT, strokeStyle, polyPartial, rr, card, applyCam, lerpCam, CAM0, type Cam, measure, revealWords, typeText, personCard, bezierPts, setFont } from './draw';
import * as I from './icons';

export const DOM_ICON = [I.chromatogram, I.xray, I.nmr];

// ---------------------------------------------------------------- photo card
/**
 * Real lab photo in a rounded frame. It enters as a duotone in the domain colour
 * and blooms to full colour (colorT); a slow push-in keeps held shots alive.
 */
export function photoCard(ctx: Ctx, t: number, t0: number, id: string, x: number, y: number, w: number, h: number, color: string,
  o: { r?: number; colorT?: number; label?: string; labelT?: number; a?: number; fx?: number; fy?: number; outT?: number } = {}) {
  const e = prog(t, t0, 0.7, ease.outCubic);
  const out = o.outT !== undefined ? prog(t, o.outT, 0.5, ease.inCubic) : 0;
  const a = (o.a ?? 1) * e * (1 - out);
  if (a <= 0.002) return;
  const P = img.photos[id];
  if (!P) throw new Error(`no photo ${id}`);
  const r = o.r ?? 22;
  withAlpha(ctx, a, () => withT(ctx, x + w / 2, y + h / 2, lerp(0.94, 1, e), () => {
    const X = -w / 2, Y = -h / 2;
    glow(ctx, 0, 0, Math.max(w, h) * 0.75, color, 0.18);
    ctx.save();
    rr(ctx, X, Y, w, h, r); ctx.clip();
    // cover-fit with a slow push-in
    const iw = P.color.width, ih = P.color.height;
    const kb = 1.03 + 0.07 * clamp((t - t0) / 12);
    const s = Math.max(w / iw, h / ih) * kb;
    const dw = iw * s, dh = ih * s;
    const dx = X + (w - dw) * (o.fx ?? 0.5), dy = Y + (h - dh) * (o.fy ?? 0.5);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(P.gray, dx, dy, dw, dh);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = rgba(color, 0.85); ctx.fillRect(X, Y, w, h);
    ctx.globalCompositeOperation = 'source-over';
    const cr = prog(t, o.colorT ?? t0 + 0.9, 0.9, ease.inOutCubic);
    if (cr > 0) { ctx.globalAlpha *= cr; ctx.drawImage(P.color, dx, dy, dw, dh); }
    ctx.restore();
    // bottom gradient for the label + frame
    if (o.label) {
      ctx.save(); rr(ctx, X, Y, w, h, r); ctx.clip();
      const g = ctx.createLinearGradient(0, Y + h * 0.55, 0, Y + h);
      g.addColorStop(0, 'rgba(5,8,23,0)'); g.addColorStop(1, 'rgba(5,8,23,0.85)');
      ctx.fillStyle = g; ctx.fillRect(X, Y, w, h); ctx.restore();
      revealWords(ctx, [o.label], [o.labelT ?? t0 + 0.2], t, X + 22, Y + h - 22, { f: 'display', size: Math.round(Math.min(34, h * 0.09)), weight: 600 });
    }
    rr(ctx, X, Y, w, h, r); strokeStyle(ctx, color, 2.5, 0.8); ctx.stroke();
  }));
}

// ---------------------------------------------------------------- domain selector
/** The three domains as a row of chips (as docked in scene 3); `active` is lit. */
export const SEL = { y: 176, w: 470, h: 92, xs: [420, 960, 1500] };
export function domainSelector(ctx: Ctx, t: number, active: number, o: { a?: number; litT?: number; y?: number; scale?: number; prev?: { i: number; offT: number } } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.002) return;
  const sy = o.y ?? SEL.y, sc = o.scale ?? 1;
  withAlpha(ctx, a, () => withT(ctx, W / 2, sy, sc, () => { ctx.translate(-W / 2, -SEL.y);
    for (let i = 0; i < 3; i++) {
      const D = DOMAINS[i]!;
      const on = Math.max(i === active ? prog(t, o.litT ?? -1e9, 0.5) : 0, o.prev && i === o.prev.i ? 1 - prog(t, o.prev.offT, 0.5) : 0);
      const x = SEL.xs[i]!;
      withAlpha(ctx, lerp(o.litT === undefined || t < (o.litT ?? 0) ? 0.8 : 0.45, 1, on), () => {
        if (on > 0) glow(ctx, x, SEL.y, 300, D.color, 0.35 * on);
        rr(ctx, x - SEL.w / 2, SEL.y - SEL.h / 2, SEL.w, SEL.h, 22);
        ctx.fillStyle = rgba(D.color, lerp(0.12, 0.85, on)); ctx.fill();
        strokeStyle(ctx, D.color, 2, 0.8); ctx.stroke();
        DOM_ICON[i]!(ctx, x - SEL.w / 2 + 62, SEL.y + 4, 86, 4 + t, on > 0.5 ? '#FFFFFF' : D.color);
        text(ctx, D.short, x - SEL.w / 2 + 126, SEL.y + 8, { f: 'body', size: 21, weight: 600 });
      });
    }
  }));
}

// ---------------------------------------------------------------- domain title card
/** Big chapter opener: icon medallion, "DOMAIN n OF 3", the domain name, and its lead. */
export function domainTitle(ctx: Ctx, t: number, t0: number, i: number, lead: { id: string; name: string } | null, leadT: number, o: { outT?: number; y?: number } = {}) {
  const D = DOMAINS[i]!;
  const out = o.outT !== undefined ? prog(t, o.outT, 0.6, ease.inOutCubic) : 0;
  if (t < t0 || out >= 1) return;
  const y = o.y ?? 560;
  withAlpha(ctx, 1 - out, () => {
    const mp = springAt(t, t0, 0.6, 10);
    const mx = 470, R = 190;
    withT(ctx, mx, y, clamp(mp, 0, 1.15), () => {
      glow(ctx, 0, 0, R * 2.2, D.color, 0.5);
      ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fillStyle = rgba(D.color, 0.22); ctx.fill(); strokeStyle(ctx, D.color, 3); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, R + 18, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(0.9999, prog(t, t0 + 0.2, 1.2, ease.inOutCubic))); strokeStyle(ctx, D.color, 1.5, 0.5); ctx.stroke();
      DOM_ICON[i]!(ctx, 0, 6, 250, t - t0, '#FFFFFF');
    });
    const tx = 760;
    typeText(ctx, `DOMAIN ${i + 1} OF 3`, t, t0 + 0.2, tx, y - 150, { f: 'mono', size: 24, weight: 700, color: D.color, tracking: 5 }, 40, false);
    D.name.forEach((ln, k) => revealWords(ctx, [ln], [t0 + 0.3 + k * 0.12], t, tx, y - 62 + k * 84, { f: 'display', size: 72, weight: 700 }, { dur: 0.6 }));
    if (lead) personCard(ctx, t, leadT - 0.3, { id: lead.id, name: lead.name, role: 'Domain Lead' }, tx, y + 110, 470, 96, D.color, { nameT: leadT, faceT: leadT - 0.05, roleT: leadT + 0.25, nameSize: 28 });
  });
}

// ---------------------------------------------------------------- capability tree
export type TreeChip = { title: string; sub?: string; t: number; tags?: { text: string; t: number }[] };
export type TreeRow = { title: string[]; icon: (ctx: Ctx, x: number, y: number, s: number, lt: number, c: string) => void; t: number; chips: TreeChip[]; bracket?: { label: string; from: number; to: number; t: number } };
export type TreeCfg = { domain: number; root: string[]; rootT: number; rows: TreeRow[]; wideT: number; exitT: number; top?: number; bottom?: number; previewT?: number };

const CH = { w: 424, h: 86, gap: 16, x0: 548, per: 3 };
const HD = { x: 180, w: 340 };

export class CapabilityTree {
  cfg: TreeCfg;
  rows: { y: number; h: number; lines: number; chips: { x: number; y: number }[] }[] = [];
  top = 0; bottom = 0;
  constructor(cfg: TreeCfg) {
    this.cfg = cfg;
    const gapRow = 44;
    const hs = cfg.rows.map((r) => { const lines = Math.max(1, Math.ceil(r.chips.length / CH.per)); return { lines, h: Math.max(130, lines * (CH.h + CH.gap) - CH.gap) }; });
    const total = hs.reduce((a, b) => a + b.h, 0) + gapRow * (hs.length - 1);
    const top0 = cfg.top ?? 250, bot0 = cfg.bottom ?? 1010;
    let y = top0 + (bot0 - top0 - total) / 2;
    this.top = y; this.bottom = y + total;
    hs.forEach((hh, i) => {
      const chips = cfg.rows[i]!.chips.map((_, k) => ({ x: CH.x0 + (k % CH.per) * (CH.w + CH.gap), y: y + (hh.h - (hh.lines * (CH.h + CH.gap) - CH.gap)) / 2 + Math.floor(k / CH.per) * (CH.h + CH.gap) }));
      this.rows.push({ y, h: hh.h, lines: hh.lines, chips });
      y += hh.h + gapRow;
    });
  }
  /** Which row is being narrated (-1 = none / wide). */
  activeRow(t: number) {
    let a = -1;
    this.cfg.rows.forEach((r, i) => { if (t >= r.t - 0.4) a = i; });
    return t >= this.cfg.wideT ? -1 : a;
  }
  cam(t: number): Cam {
    let c = CAM0;
    this.cfg.rows.forEach((r, i) => {
      const R = this.rows[i]!;
      const f: Cam = { x: 1000, y: R.y + R.h / 2, z: 1.08 };
      c = lerpCam(c, f, prog(t, r.t - 0.5, 1.1, ease.inOutCubic));
    });
    return lerpCam(c, { x: W / 2, y: (this.top + this.bottom) / 2 - 20, z: 0.97 }, prog(t, this.cfg.wideT, 1.2, ease.inOutCubic));
  }
  rowAlpha(i: number, t: number) {
    const act = this.activeRow(t);
    const wide = prog(t, this.cfg.wideT, 0.8);
    // rows light up when narrated and stay a little dimmer when not in focus
    const lit = i === act ? 1 : t > this.cfg.rows[i]!.t ? 0.4 : 0.3;
    return lerp(lit, 1, wide);
  }
  draw(ctx: Ctx, t: number, o: { a?: number } = {}) {
    const D = DOMAINS[this.cfg.domain]!;
    const exit = prog(t, this.cfg.exitT, 0.7, ease.inOutCubic);
    const a = (o.a ?? 1) * (1 - exit);
    if (a <= 0.002 || t < this.cfg.rootT - 0.2) return;
    ctx.save();
    applyCam(ctx, this.cam(t));
    withAlpha(ctx, a, () => {
      // root bar
      const rp = prog(t, this.cfg.rootT, 0.8, ease.outCubic);
      const rx = 70, rw = 70, ry0 = this.top, rh = (this.bottom - this.top) * rp;
      rr(ctx, rx, ry0, rw, Math.max(rh, 1), 18); ctx.fillStyle = rgba(D.color, 0.85); ctx.fill();
      glow(ctx, rx + rw / 2, ry0 + rh / 2, 200, D.color, 0.3 * rp);
      ctx.save(); ctx.translate(rx + rw / 2 + 9, (this.top + this.bottom) / 2); ctx.rotate(-Math.PI / 2);
      withAlpha(ctx, prog(t, this.cfg.rootT + 0.4, 0.5), () => text(ctx, this.cfg.root.join(' '), 0, 0, { f: 'display', size: 26, weight: 700, align: 'center' }));
      ctx.restore();
      this.cfg.rows.forEach((r, i) => this.drawRow(ctx, t, i, D.color));
    });
    ctx.restore();
  }
  private drawRow(ctx: Ctx, t: number, i: number, color: string) {
    const r = this.cfg.rows[i]!, L = this.rows[i]!;
    const show = Math.min(r.t, (this.cfg.previewT ?? r.t) + i * 0.25); // header preview before its narration
    if (t < show - 0.5) return;
    const ra = this.rowAlpha(i, t);
    const cy = L.y + L.h / 2;
    withAlpha(ctx, ra, () => {
      // root → header connector
      strokeStyle(ctx, color, 3, 0.7);
      polyPartial(ctx, [{ x: 140, y: cy }, { x: HD.x, y: cy }], prog(t, show - 0.5, 0.35));
      // header
      const hp = springAt(t, show - 0.2, 0.6, 12);
      if (hp > 0) withT(ctx, HD.x + HD.w / 2, cy, clamp(hp, 0, 1.1), () => {
        const hh = 130;
        card(ctx, -HD.w / 2, -hh / 2, HD.w, hh, { r: 22, fill: rgba(color, 0.22), stroke: rgba(color, 0.85), glow: color, glowA: 0.2 });
        r.icon(ctx, -HD.w / 2 + 72, 4, 118, t - r.t, color);
        const n = r.title.length;
        r.title.forEach((ln, k) => text(ctx, ln, -HD.w / 2 + 140, 9 - ((n - 1) * 30) / 2 + k * 30, { f: 'display', size: 25, weight: 700 }));
      });
      // header → chips bus
      const bx = HD.x + HD.w, busX = CH.x0 - 22;
      r.chips.forEach((c, k) => {
        const P = L.chips[k]!;
        const lp = prog(t, c.t - 0.35, 0.3, ease.inOutCubic);
        strokeStyle(ctx, color, 2, 0.55);
        polyPartial(ctx, [{ x: bx, y: cy }, { x: busX, y: cy }, { x: busX, y: P.y + CH.h / 2 }, { x: P.x, y: P.y + CH.h / 2 }].filter((q, j, arr) => j === 0 || Math.hypot(q.x - arr[j - 1]!.x, q.y - arr[j - 1]!.y) > 0.5), k % CH.per === 0 ? lp : 0);
        this.drawChip(ctx, t, c, P.x, P.y, color);
      });
      if (r.bracket) {
        const b = r.bracket, A = L.chips[b.from]!, B = L.chips[b.to]!;
        const bp = prog(t, b.t, 0.6, ease.inOutCubic);
        if (bp > 0) {
          // bracket under the grouped chips, label centred on it
          const x0 = Math.min(A.x, B.x), x1 = Math.max(A.x, B.x) + CH.w, y0 = Math.max(A.y, B.y) + CH.h + 14;
          strokeStyle(ctx, '#FFFFFF', 2, 0.6 * bp);
          polyPartial(ctx, [{ x: x0, y: y0 - 8 }, { x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y0 - 8 }], bp);
          const st = { f: 'mono' as const, size: 15, weight: 700, tracking: 2 };
          const tw = measure(ctx, b.label.toUpperCase(), st) + 20;
          withAlpha(ctx, bp, () => { rr(ctx, (x0 + x1) / 2 - tw / 2, y0 - 13, tw, 26, 13); ctx.fillStyle = C.ink1; ctx.fill(); text(ctx, b.label.toUpperCase(), (x0 + x1) / 2, y0 + 5, { ...st, align: 'center', color: '#FFFFFF' }); });
        }
      }
    });
  }
  private drawChip(ctx: Ctx, t: number, c: TreeChip, x: number, y: number, color: string) {
    const sp = springAt(t, c.t - 0.08, 0.6, 13);
    if (sp <= 0) return;
    const flash = pulse(t, c.t, 0.04, 0.7);
    withAlpha(ctx, clamp(sp * 2), () => withT(ctx, x + CH.w / 2, y + CH.h / 2, lerp(0.85, 1, clamp(sp, 0, 1.05)), () => {
      const X = -CH.w / 2, Y = -CH.h / 2;
      if (flash > 0.02) glow(ctx, 0, 0, CH.w * 0.7, color, 0.5 * flash);
      card(ctx, X, Y, CH.w, CH.h, { r: 16, fill: rgba(C.ink1, 0.9), stroke: rgba(color, lerp(0.45, 1, flash)) });
      ctx.fillStyle = color; ctx.fillRect(X, Y + 16, 4, CH.h - 32);
      const hasSub = !!c.sub;
      revealWords(ctx, [c.title], [c.t], t, X + 22, hasSub ? -4 : 8, { f: 'body', size: 22, weight: 600 }, { dur: 0.45 });
      if (hasSub) typeText(ctx, c.sub!, t, c.t + 0.15, X + 22, 24, { f: 'mono', size: 15, weight: 500, color: C.text2 }, 70, false);
      // tags sit on the chip's top edge, right to left
      let cursor = CH.w / 2 - 12;
      (c.tags ?? []).forEach((g) => {
        const st = { f: 'mono' as const, size: 14, weight: 700, tracking: 1 };
        const tw = measure(ctx, g.text.toUpperCase(), st) + 18;
        const gx = cursor - tw / 2; cursor -= tw + 8;
        const gp = springAt(t, g.t, 0.45, 15);
        if (gp <= 0) return;
        withT(ctx, gx, Y, clamp(gp, 0, 1.2), () => {
          glow(ctx, 0, 0, tw * 0.8, color, 0.3);
          rr(ctx, -tw / 2, -13, tw, 26, 13); ctx.fillStyle = color; ctx.fill();
          text(ctx, g.text.toUpperCase(), 0, 5, { ...st, align: 'center', color: C.ink0 });
        });
      });
    }));
  }
}

// ---------------------------------------------------------------- end card
export function endCard(ctx: Ctx, t: number, t0: number) {
  const p = prog(t, t0, 0.9, ease.outCubic);
  if (p <= 0) return;
  const st = { f: 'display' as const, size: 200, weight: 700 };
  const BR = [C.blue, C.violet, C.magenta];
  withAlpha(ctx, p, () => {
    const full = measure(ctx, 'ACI', st);
    [0, 1, 2].forEach((i) => glow(ctx, W / 2 + (i - 1) * full * 0.34, 470, 240, BR[i]!, 0.35));
    const g = ctx.createLinearGradient(W / 2 - full / 2, 0, W / 2 + full / 2, 0);
    g.addColorStop(0, '#6F8BFF'); g.addColorStop(0.5, '#A374FF'); g.addColorStop(1, '#FF5FA2');
    ctx.save(); ctx.font = `700 200px Display`; ctx.textAlign = 'center'; ctx.fillStyle = g; ctx.fillText('ACI', W / 2, 530 + (1 - p) * 30); ctx.restore();
  });
  revealWords(ctx, ['Advanced', 'Characterization', 'and', 'Instrumentation'], [t0 + 0.3, t0 + 0.4, t0 + 0.5, t0 + 0.6], t, W / 2, 640, { f: 'display', size: 46, weight: 500, align: 'center' });
  const lp = prog(t, t0 + 0.9, 0.8);
  if (lp > 0) { const lw = 280, lh = (img.logo.height / img.logo.width) * lw; withAlpha(ctx, lp, () => ctx.drawImage(img.logo, W / 2 - lw / 2, 740, lw, lh)); }
}

// ---------------------------------------------------------------- misc helpers
/** A labelled pill that springs in (used for tags/outcomes). */
export function popPill(ctx: Ctx, t: number, t0: number, s: string, x: number, y: number, color: string, size = 24, a = 1) {
  const p = springAt(t, t0, 0.55, 13);
  if (p <= 0 || a <= 0.002) return;
  const st = { f: 'body' as const, size, weight: 600 };
  const w = measure(ctx, s, st) + size * 1.6, h = size * 2;
  withAlpha(ctx, a * clamp(p * 2), () => withT(ctx, x, y, clamp(p, 0, 1.15), () => {
    glow(ctx, 0, 0, w * 0.7, color, 0.3 * pulse(t, t0, 0.04, 0.8) + 0.1);
    rr(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = rgba(color, 0.18); ctx.fill(); strokeStyle(ctx, color, 2, 0.9); ctx.stroke();
    text(ctx, s, 0, size * 0.36, { ...st, align: 'center' });
  }));
  return w;
}
export { setFont, dot, bezierPts };
void H; void typeText;
export type { Pt };
