// Animated line icons. Signature: (ctx, cx, cy, s, lt, color, a)
//   s  = nominal size (icon fits roughly in a box s wide, 0.75 s tall)
//   lt = seconds since the icon's entrance (<= 0: nothing drawn); icons keep
//        a gentle idle loop after their entrance so held shots stay alive.
import type { Ctx } from './assets';
import { C } from './theme';
import { clamp, ease, lerp, prog, rgba, TAU, springAt, type Pt } from './util';
import { dot, glow, polyPartial, strokeStyle, withAlpha, rr, checkMark, bezierPts, text } from './draw';

type Icon = (ctx: Ctx, cx: number, cy: number, s: number, lt: number, color: string, a?: number) => void;
const LW = (s: number) => Math.max(2, s * 0.028);

function head(ctx: Ctx, p: Pt | null, color: string, r: number) {
  if (!p) return;
  glow(ctx, p.x, p.y, r * 5, color, 0.8);
  dot(ctx, p.x, p.y, r, '#FFFFFF');
}

// ---------------------------------------------------------------- domains
/** Chromatogram drawing its peaks, with m/z bars rising beneath. */
export const chromatogram: Icon = (ctx, cx, cy, s, lt, color, a = 1) => {
  if (lt <= 0) return;
  withAlpha(ctx, a, () => {
    const x0 = cx - s * 0.48, x1 = cx + s * 0.48, yb = cy + s * 0.12, hgt = s * 0.42;
    strokeStyle(ctx, C.text3, LW(s) * 0.7, 0.8);
    polyPartial(ctx, [{ x: x0, y: yb - hgt - 8 }, { x: x0, y: yb }, { x: x1, y: yb }], prog(lt, 0, 0.5));
    const peaks = [[0.16, 0.35, 0.022], [0.3, 0.85, 0.028], [0.43, 0.3, 0.02], [0.6, 0.62, 0.032], [0.78, 0.45, 0.024], [0.9, 0.2, 0.018]];
    const N = 180;
    const pts: Pt[] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      let v = 0;
      for (const [c, h, w] of peaks) v += h! * Math.exp(-((u - c!) ** 2) / (2 * w! * w!));
      pts.push({ x: lerp(x0, x1, u), y: yb - v * hgt });
    }
    const u = prog(lt, 0.3, 1.5, ease.inOutCubic);
    // fill under the drawn part
    const n = Math.floor(u * N);
    if (n > 1) {
      ctx.beginPath(); ctx.moveTo(pts[0]!.x, yb);
      for (let i = 0; i <= n; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y);
      ctx.lineTo(pts[n]!.x, yb); ctx.closePath();
      const g = ctx.createLinearGradient(0, yb - hgt, 0, yb);
      g.addColorStop(0, rgba(color, 0.35)); g.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = g; ctx.fill();
    }
    strokeStyle(ctx, color, LW(s));
    const h = polyPartial(ctx, pts, u);
    if (u < 1) head(ctx, h, color, LW(s) * 1.1);
    // m/z bars
    const bars = [0.1, 0.55, 0.22, 1, 0.4, 0.15, 0.7, 0.3, 0.12, 0.5];
    const by = cy + s * 0.36, bh = s * 0.17;
    bars.forEach((v, i) => {
      const p = springAt(lt, 1.2 + i * 0.06, 0.5, 14);
      if (p <= 0) return;
      const bx = lerp(x0 + 6, x1 - 6, i / (bars.length - 1));
      strokeStyle(ctx, i === 3 ? '#FFFFFF' : color, LW(s) * 1.1, 0.9);
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by - v * bh * p); ctx.stroke();
    });
    // idle scan line
    if (lt > 1.9) {
      const k = ((lt - 1.9) / 3.2) % 1;
      const sx = lerp(x0, x1, k);
      withAlpha(ctx, Math.sin(k * Math.PI) * 0.5, () => { strokeStyle(ctx, '#FFFFFF', 1.5); ctx.beginPath(); ctx.moveTo(sx, yb - hgt); ctx.lineTo(sx, yb); ctx.stroke(); });
    }
  });
};

/** X-ray beam → crystal lattice → expanding diffraction rings on a detector. */
export const xray: Icon = (ctx, cx, cy, s, lt, color, a = 1) => {
  if (lt <= 0) return;
  withAlpha(ctx, a, () => {
    const sx = cx - s * 0.46, lx = cx - s * 0.08, dx = cx + s * 0.44;
    // source
    const sp = springAt(lt, 0, 0.6, 14);
    withAlpha(ctx, clamp(sp), () => { rr(ctx, sx - s * 0.05, cy - s * 0.06, s * 0.1, s * 0.12, 6); strokeStyle(ctx, C.text2, LW(s)); ctx.stroke(); });
    // beam
    strokeStyle(ctx, color, LW(s) * 1.2);
    const bp = prog(lt, 0.15, 0.45);
    polyPartial(ctx, [{ x: sx + s * 0.05, y: cy }, { x: lx, y: cy }], bp);
    if (bp > 0.99) { // travelling photons
      for (let k = 0; k < 3; k++) {
        const u = ((lt * 1.4 + k / 3) % 1);
        glow(ctx, lerp(sx + s * 0.05, lx, u), cy, s * 0.04, color, 0.9);
      }
    }
    // lattice (rotated grid of atoms)
    const g = 4, sp2 = s * 0.055;
    for (let i = 0; i < g; i++) for (let j = 0; j < g; j++) {
      const p = springAt(lt, 0.35 + (i + j) * 0.04, 0.5, 16);
      const u = (i - (g - 1) / 2) * sp2, v = (j - (g - 1) / 2) * sp2;
      const x = lx + (u - v) * 0.707, y = cy + (u + v) * 0.707;
      dot(ctx, x, y, s * 0.014 * clamp(p, 0, 1.3), C.text, 0.95);
    }
    // detector
    const dp = prog(lt, 0.6, 0.4);
    strokeStyle(ctx, C.text3, LW(s) * 0.8, 0.8 * dp);
    ctx.beginPath(); ctx.moveTo(dx, cy - s * 0.32 * dp); ctx.lineTo(dx, cy + s * 0.32 * dp); ctx.stroke();
    // diffraction cones + expanding arcs
    if (lt > 0.7) {
      const rays = [-0.28, -0.16, 0.16, 0.28];
      for (const r of rays) {
        withAlpha(ctx, 0.35 * prog(lt, 0.7, 0.3), () => {
          strokeStyle(ctx, color, 1.5);
          ctx.beginPath(); ctx.moveTo(lx, cy); ctx.lineTo(dx, cy + r * s); ctx.stroke();
        });
        const pk = 0.5 + 0.5 * Math.sin(lt * 5 + r * 20);
        glow(ctx, dx, cy + r * s, s * 0.05, color, 0.6 + 0.4 * pk);
        dot(ctx, dx, cy + r * s, s * 0.011, '#FFFFFF');
      }
      glow(ctx, dx, cy, s * 0.06, color, 0.9);
      for (let k = 0; k < 3; k++) {
        const u = ((lt - 0.7) * 0.8 + k / 3) % 1;
        const R = lerp(s * 0.05, dx - lx, u);
        withAlpha(ctx, (1 - u) * 0.8, () => {
          strokeStyle(ctx, color, LW(s) * 0.9);
          ctx.beginPath(); ctx.arc(lx, cy, R, -0.55, 0.55); ctx.stroke();
        });
      }
    }
  });
};

/** NMR: a spin precessing about B0, emitting a decaying FID; thermometer for thermal. */
export const nmr: Icon = (ctx, cx, cy, s, lt, color, a = 1) => {
  if (lt <= 0) return;
  withAlpha(ctx, a, () => {
    const ox = cx - s * 0.26, oy = cy + s * 0.14;
    // B0 axis
    const ap = prog(lt, 0, 0.5);
    strokeStyle(ctx, C.text2, LW(s), 0.9);
    polyPartial(ctx, [{ x: ox, y: oy + s * 0.2 }, { x: ox, y: oy - s * 0.36 }], ap);
    if (ap > 0.9) {
      ctx.beginPath(); ctx.moveTo(ox - 7, oy - s * 0.36 + 10); ctx.lineTo(ox, oy - s * 0.36); ctx.lineTo(ox + 7, oy - s * 0.36 + 10); ctx.stroke();
      text(ctx, 'B₀', ox + 12, oy - s * 0.3, { f: 'mono', size: Math.round(s * 0.07), weight: 700, color: C.text2 });
    }
    // precession cone
    const cp = prog(lt, 0.3, 0.5);
    const ey = oy - s * 0.2, erx = s * 0.13, ery = s * 0.04;
    withAlpha(ctx, cp * 0.6, () => {
      strokeStyle(ctx, color, 1.5); ctx.setLineDash([5, 6]);
      ctx.beginPath(); ctx.ellipse(ox, ey, erx, ery, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    });
    const ang = lt * 3.2;
    const tip = { x: ox + Math.cos(ang) * erx, y: ey + Math.sin(ang) * ery };
    if (cp > 0) {
      strokeStyle(ctx, color, LW(s) * 1.3, cp);
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(lerp(ox, tip.x, cp), lerp(oy, tip.y, cp)); ctx.stroke();
      glow(ctx, tip.x, tip.y, s * 0.06, color, cp);
      dot(ctx, tip.x, tip.y, LW(s) * 1.3, '#FFFFFF', cp);
      dot(ctx, ox, oy, LW(s) * 1.6, color, cp);
    }
    // FID
    const fx0 = cx - s * 0.02, fx1 = cx + s * 0.48, fy = cy - s * 0.02;
    const N = 160, pts: Pt[] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      pts.push({ x: lerp(fx0, fx1, u), y: fy - Math.exp(-u * 3.2) * Math.cos(u * 38) * s * 0.2 });
    }
    const fp = prog(lt, 0.6, 1.4, ease.inOutSine);
    strokeStyle(ctx, color, LW(s));
    const h = polyPartial(ctx, pts, fp);
    if (fp < 1) head(ctx, h, color, LW(s));
    strokeStyle(ctx, C.text3, 1.2, 0.6 * prog(lt, 0.5, 0.4));
    ctx.beginPath(); ctx.moveTo(fx0, fy); ctx.lineTo(fx1, fy); ctx.stroke();
    // thermometer (thermal)
    const tp = springAt(lt, 1.3, 0.55, 12);
    if (tp > 0) {
      const tx = cx + s * 0.4, ty = cy + s * 0.3;
      ctx.save(); ctx.translate(tx, ty); ctx.scale(clamp(tp, 0, 1.2), clamp(tp, 0, 1.2));
      strokeStyle(ctx, C.text2, LW(s) * 0.8);
      rr(ctx, -s * 0.02, -s * 0.15, s * 0.04, s * 0.14, s * 0.02); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, s * 0.035, 0, TAU); ctx.stroke();
      const lvl = 0.5 + 0.4 * Math.sin(lt * 1.6);
      dot(ctx, 0, 0, s * 0.024, C.xray);
      ctx.fillStyle = C.xray; ctx.fillRect(-s * 0.008, -s * 0.02 - lvl * s * 0.11, s * 0.016, lvl * s * 0.11);
      ctx.restore();
    }
  });
};

// ---------------------------------------------------------------- road-map / generic
export const people: Icon = (ctx, cx, cy, s, lt, color, a = 1) => {
  if (lt <= 0) return;
  withAlpha(ctx, a, () => {
    const xs = [-0.26, 0, 0.26];
    xs.forEach((dx, i) => {
      const p = springAt(lt, i * 0.08, 0.5, 14);
      if (p <= 0) return;
      const sc = i === 1 ? 1.15 : 0.9;
      ctx.save(); ctx.translate(cx + dx * s, cy + (i === 1 ? -s * 0.02 : s * 0.04)); ctx.scale(p * sc, p * sc);
      strokeStyle(ctx, i === 1 ? color : C.text2, LW(s));
      ctx.beginPath(); ctx.arc(0, -s * 0.1, s * 0.08, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, s * 0.2, s * 0.15, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
      ctx.restore();
    });
  });
};

export const spectrum: Icon = (ctx, cx, cy, s, lt, color, a = 1) => {
  if (lt <= 0) return;
  withAlpha(ctx, a, () => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 80; i++) {
      const u = i / 80;
      const v = 0.8 * Math.exp(-((u - 0.35) ** 2) / 0.002) + 0.5 * Math.exp(-((u - 0.62) ** 2) / 0.003) + 0.25 * Math.exp(-((u - 0.8) ** 2) / 0.001);
      pts.push({ x: cx + (u - 0.5) * s * 0.9, y: cy + s * 0.25 - v * s * 0.5 });
    }
    strokeStyle(ctx, C.text3, LW(s) * 0.8); ctx.beginPath(); ctx.moveTo(cx - s * 0.45, cy + s * 0.25); ctx.lineTo(cx + s * 0.45, cy + s * 0.25); ctx.stroke();
    strokeStyle(ctx, color, LW(s));
    const h = polyPartial(ctx, pts, prog(lt, 0.05, 0.9, ease.inOutCubic));
    if (lt < 0.95) head(ctx, h, color, LW(s));
  });
};

export const network: Icon = (ctx, cx, cy, s, lt, color, a = 1) => {
  if (lt <= 0) return;
  withAlpha(ctx, a, () => {
    const n = 6, R = s * 0.34;
    for (let i = 0; i < n; i++) {
      const an = -Math.PI / 2 + (i * TAU) / n;
      const x = cx + Math.cos(an) * R, y = cy + Math.sin(an) * R;
      const lp = prog(lt, 0.1 + i * 0.05, 0.35);
      strokeStyle(ctx, color, LW(s) * 0.8, 0.7);
      polyPartial(ctx, [{ x: cx, y: cy }, { x, y }], lp);
      const p = springAt(lt, 0.25 + i * 0.05, 0.5, 15);
      if (p > 0) { dot(ctx, x, y, s * 0.06 * p, C.ink1); ctx.beginPath(); ctx.arc(x, y, s * 0.06 * p, 0, TAU); strokeStyle(ctx, C.text2, LW(s) * 0.8); ctx.stroke(); }
      if (lt > 0.8) { const u = ((lt * 0.9 + i * 0.37) % 1); glow(ctx, lerp(cx, x, u), lerp(cy, y, u), s * 0.035, color, 0.9); }
    }
    const p0 = springAt(lt, 0, 0.5, 14);
    glow(ctx, cx, cy, s * 0.25, color, 0.6 * clamp(p0));
    dot(ctx, cx, cy, s * 0.1 * p0, color);
  });
};

export const cap: Icon = (ctx, cx, cy, s, lt, color, a = 1) => {
  if (lt <= 0) return;
  const p = springAt(lt, 0, 0.5, 13);
  withAlpha(ctx, a * clamp(p), () => {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(p, p); ctx.rotate(Math.sin(lt * 1.5) * 0.04);
    strokeStyle(ctx, color, LW(s));
    ctx.beginPath(); ctx.moveTo(-s * 0.4, -s * 0.05); ctx.lineTo(0, -s * 0.22); ctx.lineTo(s * 0.4, -s * 0.05); ctx.lineTo(0, s * 0.12); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s * 0.24, s * 0.03); ctx.lineTo(-s * 0.24, s * 0.2); ctx.quadraticCurveTo(0, s * 0.32, s * 0.24, s * 0.2); ctx.lineTo(s * 0.24, s * 0.03); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s * 0.4, -s * 0.05); ctx.lineTo(s * 0.4, s * 0.18); ctx.stroke();
    dot(ctx, s * 0.4, s * 0.2, LW(s) * 1.4, color);
    ctx.restore();
  });
};

export const factory: Icon = (ctx, cx, cy, s, lt, color, a = 1) => {
  if (lt <= 0) return;
  withAlpha(ctx, a, () => {
    const x0 = cx - s * 0.42, x1 = cx + s * 0.42, yb = cy + s * 0.28;
    const pts: Pt[] = [
      { x: x0, y: yb }, { x: x0, y: cy - s * 0.02 }, { x: x0 + s * 0.2, y: cy - s * 0.14 }, { x: x0 + s * 0.2, y: cy - s * 0.02 },
      { x: x0 + s * 0.4, y: cy - s * 0.14 }, { x: x0 + s * 0.4, y: cy - s * 0.02 }, { x: x0 + s * 0.58, y: cy - s * 0.14 },
      { x: x0 + s * 0.58, y: cy - s * 0.36 }, { x: x0 + s * 0.7, y: cy - s * 0.36 }, { x: x0 + s * 0.7, y: cy - s * 0.1 }, { x: x1, y: cy - s * 0.1 }, { x: x1, y: yb }, { x: x0, y: yb },
    ];
    strokeStyle(ctx, color, LW(s));
    polyPartial(ctx, pts, prog(lt, 0, 0.9, ease.inOutCubic));
    for (let i = 0; i < 3; i++) {
      const d = springAt(lt, 0.6 + i * 0.08, 0.5, 14);
      if (d > 0) { rr(ctx, x0 + s * (0.07 + i * 0.2), cy + s * 0.08, s * 0.08 * clamp(d), s * 0.08 * clamp(d), 3); ctx.fillStyle = rgba(color, 0.7); ctx.fill(); }
    }
    if (lt > 0.9) for (let k = 0; k < 3; k++) {
      const u = ((lt - 0.9) * 0.5 + k / 3) % 1;
      glow(ctx, x0 + s * 0.64 + u * s * 0.12, cy - s * 0.4 - u * s * 0.25, s * (0.04 + u * 0.06), C.text2, (1 - u) * 0.7);
    }
  });
};

// ---------------------------------------------------------------- services
/** Rotating crystal-lattice cube with a scanning plane. */
export const lattice: Icon = (ctx, cx, cy, s, lt, color, a = 1) => {
  if (lt <= 0) return;
  const p = springAt(lt, 0, 0.55, 12);
  withAlpha(ctx, a * clamp(p), () => {
    const ry = lt * 0.7 + 0.6, rx = 0.45;
    const R = s * 0.26 * clamp(p, 0, 1.2);
    const proj = (x: number, y: number, z: number): Pt & { z: number } => {
      const x1 = x * Math.cos(ry) + z * Math.sin(ry), z1 = -x * Math.sin(ry) + z * Math.cos(ry);
      const y1 = y * Math.cos(rx) - z1 * Math.sin(rx), z2 = y * Math.sin(rx) + z1 * Math.cos(rx);
      const k = 1 / (1 + z2 * 0.25);
      return { x: cx + x1 * R * k, y: cy + y1 * R * k, z: z2 };
    };
    const V: (Pt & { z: number })[] = [];
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) V.push(proj(x, y, z));
    const E = [[0, 1], [0, 2], [0, 4], [1, 3], [1, 5], [2, 3], [2, 6], [3, 7], [4, 5], [4, 6], [5, 7], [6, 7]];
    strokeStyle(ctx, color, LW(s) * 0.9, 0.85);
    for (const [i, j] of E) { ctx.beginPath(); ctx.moveTo(V[i!]!.x, V[i!]!.y); ctx.lineTo(V[j!]!.x, V[j!]!.y); ctx.stroke(); }
    const c = proj(0, 0, 0);
    strokeStyle(ctx, color, 1.2, 0.35);
    for (const v of V) { ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(v.x, v.y); ctx.stroke(); }
    // scan plane
    const sy = Math.sin(lt * 1.8) * 1.0;
    const q = [proj(-1.25, sy, -1.25), proj(1.25, sy, -1.25), proj(1.25, sy, 1.25), proj(-1.25, sy, 1.25)];
    ctx.beginPath(); q.forEach((v, i) => (i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y))); ctx.closePath();
    ctx.fillStyle = rgba(C.cyan, 0.12); ctx.fill(); strokeStyle(ctx, C.cyan, 1.5, 0.6); ctx.stroke();
    for (const v of [...V].sort((m, n) => n.z - m.z)) {
      const lit = Math.abs(((v.y - cy) / R) - sy * 0.9) < 0.35;
      if (lit) glow(ctx, v.x, v.y, s * 0.08, C.cyan, 0.9);
      dot(ctx, v.x, v.y, s * 0.028, lit ? '#FFFFFF' : color);
    }
    glow(ctx, c.x, c.y, s * 0.07, color, 0.8); dot(ctx, c.x, c.y, s * 0.032, '#FFFFFF');
  });
};

/** A component bar develops a crack; a loupe sweeps in and locks onto it. */
export const crack: Icon = (ctx, cx, cy, s, lt, color, a = 1) => {
  if (lt <= 0) return;
  withAlpha(ctx, a, () => {
    const bw = s * 0.8, bh = s * 0.2;
    const bp = prog(lt, 0, 0.4);
    rr(ctx, cx - bw / 2, cy - bh / 2 + s * 0.08, bw * bp, bh, 8);
    ctx.fillStyle = rgba(C.text2, 0.12); ctx.fill(); strokeStyle(ctx, C.text2, LW(s) * 0.8, 0.8); ctx.stroke();
    const kx = cx + s * 0.08;
    const cr: Pt[] = [{ x: kx, y: cy - bh / 2 + s * 0.08 }, { x: kx - s * 0.03, y: cy - s * 0.0 + s * 0.08 }, { x: kx + s * 0.025, y: cy + s * 0.03 + s * 0.08 }, { x: kx - s * 0.01, y: cy + bh / 2 + s * 0.08 }];
    const cp = prog(lt, 0.4, 0.5, ease.inCubic);
    strokeStyle(ctx, C.red, LW(s) * 0.9);
    polyPartial(ctx, cr, cp);
    // loupe path: sweep from the left, settle over the crack
    const lx = lerp(cx - s * 0.36, kx, ease.outBack(prog(lt, 0.5, 0.9, ease.linear), 1.2));
    const ly = cy + s * 0.02 + Math.sin(lt * 1.3) * s * 0.01;
    const lr = s * 0.17;
    const lp = springAt(lt, 0.45, 0.55, 12);
    if (lp > 0) {
      withAlpha(ctx, clamp(lp), () => {
        if (cp > 0.9) glow(ctx, kx, cy + s * 0.08, lr * 1.2, C.red, 0.35 + 0.15 * Math.sin(lt * 4));
        strokeStyle(ctx, color, LW(s) * 1.3);
        ctx.beginPath(); ctx.arc(lx, ly, lr * clamp(lp, 0, 1.2), 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(lx + lr * 0.72, ly + lr * 0.72); ctx.lineTo(lx + lr * 1.35, ly + lr * 1.35); ctx.lineWidth = LW(s) * 2.2; ctx.stroke();
      });
    }
  });
};

/** Iterate → refine → validate: a dot loops through three steps, then a check lands. */
export const method: Icon = (ctx, cx, cy, s, lt, color, a = 1) => {
  if (lt <= 0) return;
  withAlpha(ctx, a, () => {
    const xs = [-0.34, 0, 0.34].map((u) => cx + u * s), y = cy + s * 0.06;
    const r = s * 0.075;
    xs.forEach((x, i) => {
      const p = springAt(lt, i * 0.12, 0.5, 14);
      if (p <= 0) return;
      strokeStyle(ctx, i === 2 && lt > 2.2 ? C.nmr : color, LW(s));
      ctx.beginPath(); ctx.arc(x, y, r * clamp(p, 0, 1.2), 0, TAU); ctx.stroke();
      if (i < 2) { const lp = prog(lt, 0.2 + i * 0.12, 0.3); strokeStyle(ctx, color, LW(s) * 0.8, 0.8); polyPartial(ctx, [{ x: x + r + 4, y }, { x: xs[i + 1]! - r - 4, y }], lp); }
    });
    // feedback loop arc
    const loop = bezierPts({ x: xs[2]!, y: y - r - 4 }, { x: xs[2]!, y: y - s * 0.42 }, { x: xs[0]!, y: y - s * 0.42 }, { x: xs[0]!, y: y - r - 4 }, 40);
    strokeStyle(ctx, color, LW(s) * 0.8, 0.55); ctx.setLineDash([6, 7]);
    polyPartial(ctx, loop, prog(lt, 0.5, 0.6)); ctx.setLineDash([]);
    if (lt > 0.7) {
      const per = 1.5, k = ((lt - 0.7) / per) % 1;
      const path = [{ x: xs[0]!, y }, { x: xs[2]!, y }, ...loop.slice(1)];
      const L = path.length - 1;
      const f = k * L, i = Math.floor(f), u = f - i;
      const pa = path[i]!, pb = path[Math.min(L, i + 1)]!;
      glow(ctx, lerp(pa.x, pb.x, u), lerp(pa.y, pb.y, u), s * 0.06, C.cyan, 0.9);
      dot(ctx, lerp(pa.x, pb.x, u), lerp(pa.y, pb.y, u), LW(s), '#FFFFFF');
    }
    if (lt > 2.2) checkMark(ctx, xs[2]!, y, r * 1.0, prog(lt, 2.2, 0.35), C.nmr, LW(s));
    // gear in the middle node
    const gx = xs[1]!, g = r * 0.55, rot = lt * 1.2;
    strokeStyle(ctx, C.text2, LW(s) * 0.7, clamp(lt * 3));
    for (let k = 0; k < 6; k++) { const an = rot + (k * TAU) / 6; ctx.beginPath(); ctx.moveTo(gx + Math.cos(an) * g * 0.6, y + Math.sin(an) * g * 0.6); ctx.lineTo(gx + Math.cos(an) * g, y + Math.sin(an) * g); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(gx, y, g * 0.5, 0, TAU); ctx.stroke();
  });
};

/** Two circles (ISCE² + partner) glide together; the overlap lights up. */
export const venn: Icon = (ctx, cx, cy, s, lt, color, a = 1) => {
  if (lt <= 0) return;
  withAlpha(ctx, a, () => {
    const d = lerp(s * 0.36, s * 0.13, prog(lt, 0.15, 0.9, ease.inOutCubic));
    const r = s * 0.22, p = springAt(lt, 0, 0.55, 13);
    const A = { x: cx - d, y: cy }, B = { x: cx + d, y: cy };
    ctx.save();
    ctx.beginPath(); ctx.arc(A.x, A.y, r * clamp(p, 0, 1.2), 0, TAU); ctx.clip();
    ctx.beginPath(); ctx.arc(B.x, B.y, r * clamp(p, 0, 1.2), 0, TAU);
    ctx.fillStyle = rgba(color, 0.55 * prog(lt, 0.7, 0.4)); ctx.fill();
    ctx.restore();
    strokeStyle(ctx, C.text2, LW(s)); ctx.beginPath(); ctx.arc(A.x, A.y, r * clamp(p, 0, 1.2), 0, TAU); ctx.stroke();
    strokeStyle(ctx, color, LW(s)); ctx.beginPath(); ctx.arc(B.x, B.y, r * clamp(p, 0, 1.2), 0, TAU); ctx.stroke();
    if (lt > 0.8) glow(ctx, cx, cy, s * 0.14, color, 0.5 + 0.2 * Math.sin(lt * 3));
  });
};

// ---------------------------------------------------------------- resource management
export const calendar: Icon = (ctx, cx, cy, s, lt, color, a = 1) => {
  if (lt <= 0) return;
  const p = springAt(lt, 0, 0.55, 13);
  withAlpha(ctx, a * clamp(p), () => {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(clamp(p, 0, 1.2), clamp(p, 0, 1.2));
    const w = s * 0.62, h = s * 0.54;
    rr(ctx, -w / 2, -h / 2, w, h, 8); strokeStyle(ctx, C.text2, LW(s)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2 + h * 0.24); ctx.lineTo(w / 2, -h / 2 + h * 0.24); ctx.stroke();
    for (const x of [-w * 0.25, w * 0.25]) { ctx.beginPath(); ctx.moveTo(x, -h / 2 - 7); ctx.lineTo(x, -h / 2 + 7); ctx.stroke(); }
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
      const x = -w / 2 + w * (0.17 + i * 0.22), y = -h / 2 + h * (0.45 + j * 0.2);
      const hit = i === 2 && j === 1;
      if (hit) { const hp = springAt(lt, 0.5, 0.5, 15); rr(ctx, x - w * 0.09, y - h * 0.08, w * 0.18 * clamp(hp), h * 0.16, 4); ctx.fillStyle = rgba(color, 0.9); if (hp > 0) ctx.fill(); }
      else dot(ctx, x, y, 2.6, C.text3);
    }
    ctx.restore();
    checkMark(ctx, cx + s * 0.28, cy + s * 0.24, s * 0.16, prog(lt, 0.75, 0.35), C.nmr, LW(s) * 1.2);
  });
};

export const gauge: Icon = (ctx, cx, cy, s, lt, color, a = 1) => {
  if (lt <= 0) return;
  withAlpha(ctx, a, () => {
    const R = s * 0.34, y = cy + s * 0.14;
    const tp = prog(lt, 0, 0.5);
    strokeStyle(ctx, C.text3, LW(s) * 1.4, 0.7);
    ctx.beginPath(); ctx.arc(cx, y, R, Math.PI, Math.PI + Math.PI * tp); ctx.stroke();
    const v = 0.72 + 0.04 * Math.sin(lt * 1.3);
    const vp = clamp(springAt(lt, 0.3, 0.35, 9), 0, 1.15) * v;
    strokeStyle(ctx, color, LW(s) * 1.6);
    ctx.beginPath(); ctx.arc(cx, y, R, Math.PI, Math.PI + Math.PI * Math.max(0.001, vp)); ctx.stroke();
    for (let k = 0; k <= 8; k++) {
      const an = Math.PI + (k / 8) * Math.PI;
      strokeStyle(ctx, C.text3, 1.5, tp);
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * R * 0.8, y + Math.sin(an) * R * 0.8); ctx.lineTo(cx + Math.cos(an) * R * 0.88, y + Math.sin(an) * R * 0.88); ctx.stroke();
    }
    const an = Math.PI + Math.PI * vp;
    strokeStyle(ctx, '#FFFFFF', LW(s) * 1.1, tp);
    ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx + Math.cos(an) * R * 0.72, y + Math.sin(an) * R * 0.72); ctx.stroke();
    dot(ctx, cx, y, LW(s) * 1.8, '#FFFFFF', tp);
    text(ctx, `${Math.round(vp * 100)}%`, cx, y + s * 0.2, { f: 'mono', size: Math.round(s * 0.11), weight: 700, color: C.text, align: 'center', alpha: tp });
  });
};

/** Many small demands converge into one aggregated order. */
export const converge: Icon = (ctx, cx, cy, s, lt, color, a = 1) => {
  if (lt <= 0) return;
  withAlpha(ctx, a, () => {
    const T = { x: cx + s * 0.3, y: cy };
    const ys = [-0.3, -0.15, 0, 0.15, 0.3];
    ys.forEach((dy, i) => {
      const S = { x: cx - s * 0.38, y: cy + dy * s };
      const pts = bezierPts(S, { x: cx, y: S.y }, { x: cx, y: T.y }, T, 30);
      strokeStyle(ctx, color, LW(s) * 0.7, 0.45);
      polyPartial(ctx, pts, prog(lt, i * 0.06, 0.6));
      const p = springAt(lt, i * 0.06, 0.5, 15);
      dot(ctx, S.x, S.y, s * 0.028 * clamp(p, 0, 1.2), C.text2);
      if (lt > 0.6) { const u = ((lt - 0.6) * 0.7 + i * 0.19) % 1; const q = pts[Math.floor(u * 30)]!; glow(ctx, q.x, q.y, s * 0.04, color, 0.9); }
    });
    const bp = springAt(lt, 0.5, 0.45, 12);
    if (bp > 0) { glow(ctx, T.x, T.y, s * 0.16, color, 0.7); rr(ctx, T.x - s * 0.07 * bp, T.y - s * 0.07 * bp, s * 0.14 * bp, s * 0.14 * bp, 6); ctx.fillStyle = color; ctx.fill(); }
  });
};

export const refresh: Icon = (ctx, cx, cy, s, lt, color, a = 1) => {
  if (lt <= 0) return;
  const p = springAt(lt, 0, 0.55, 12);
  withAlpha(ctx, a * clamp(p), () => {
    // instrument box
    rr(ctx, cx - s * 0.12, cy - s * 0.1, s * 0.24, s * 0.2, 6); strokeStyle(ctx, C.text2, LW(s)); ctx.stroke();
    dot(ctx, cx - s * 0.05, cy - s * 0.02, s * 0.022, color); ctx.fillStyle = rgba(C.text2, 0.8); ctx.fillRect(cx + s * 0.0, cy + s * 0.02, s * 0.08, 3);
    const rot = lt * 1.6, R = s * 0.34 * clamp(p, 0, 1.1);
    strokeStyle(ctx, color, LW(s) * 1.2);
    for (let k = 0; k < 2; k++) {
      const a0 = rot + k * Math.PI, a1 = a0 + Math.PI * 0.72;
      ctx.beginPath(); ctx.arc(cx, cy, R, a0, a1); ctx.stroke();
      const hx = cx + Math.cos(a1) * R, hy = cy + Math.sin(a1) * R, tg = a1 + Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(hx + Math.cos(tg - 2.6) * 11, hy + Math.sin(tg - 2.6) * 11); ctx.lineTo(hx, hy); ctx.lineTo(hx + Math.cos(tg + 2.6) * 11, hy + Math.sin(tg + 2.6) * 11);
      ctx.stroke();
    }
  });
};

/** Lifecycle ring: plan → acquire → operate → retire, with a runner. */
export const lifecycle: Icon = (ctx, cx, cy, s, lt, color, a = 1) => {
  if (lt <= 0) return;
  withAlpha(ctx, a, () => {
    const R = s * 0.3;
    strokeStyle(ctx, C.text3, LW(s), 0.8);
    const rp = prog(lt, 0, 0.7);
    ctx.beginPath(); if (rp >= 0.9999) ctx.arc(cx, cy, R, 0, TAU); else ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + TAU * rp); ctx.stroke();
    const k = lt > 0.6 ? ((lt - 0.6) * 0.35) % 1 : 0;
    for (let i = 0; i < 4; i++) {
      const an = -Math.PI / 2 + (i * TAU) / 4, x = cx + Math.cos(an) * R, y = cy + Math.sin(an) * R;
      const p = springAt(lt, 0.2 + i * 0.1, 0.5, 15);
      const active = lt > 0.6 && Math.floor(k * 4) === i;
      if (active) glow(ctx, x, y, s * 0.12, color, 0.8);
      dot(ctx, x, y, s * 0.045 * clamp(p, 0, 1.2), active ? color : C.text2);
    }
    if (lt > 0.6) {
      const an = -Math.PI / 2 + k * TAU;
      strokeStyle(ctx, color, LW(s) * 1.4);
      ctx.beginPath(); ctx.arc(cx, cy, R, an - 0.7, an); ctx.stroke();
    }
  });
};

/** leafDelay: seconds between the chip (digitalisation) and the leaf (sustainability). */
export const digitalLeaf = (ctx: Ctx, cx: number, cy: number, s: number, lt: number, color: string, a = 1, leafDelay = 0.35) => {
  if (lt <= 0) return;
  withAlpha(ctx, a, () => {
    const p = springAt(lt, 0, 0.55, 13);
    const chx = cx - s * 0.2;
    if (p > 0) {
      ctx.save(); ctx.translate(chx, cy); ctx.scale(clamp(p, 0, 1.2), clamp(p, 0, 1.2));
      const w = s * 0.26;
      rr(ctx, -w / 2, -w / 2, w, w, 6); strokeStyle(ctx, C.cyan, LW(s)); ctx.stroke();
      rr(ctx, -w * 0.22, -w * 0.22, w * 0.44, w * 0.44, 3); ctx.fillStyle = rgba(C.cyan, 0.5 + 0.3 * Math.sin(lt * 4)); ctx.fill();
      for (let k = 0; k < 3; k++) {
        const o = (k - 1) * w * 0.28;
        for (const [x0, y0, x1, y1] of [[o, -w / 2, o, -w / 2 - 8], [o, w / 2, o, w / 2 + 8], [-w / 2, o, -w / 2 - 8, o], [w / 2, o, w / 2 + 8, o]]) {
          ctx.beginPath(); ctx.moveTo(x0!, y0!); ctx.lineTo(x1!, y1!); ctx.stroke();
        }
      }
      ctx.restore();
    }
    const lp = springAt(lt, leafDelay, 0.5, 11);
    if (lp > 0) {
      const lx = cx + s * 0.2, ly = cy;
      ctx.save(); ctx.translate(lx, ly); ctx.rotate(-0.6 + Math.sin(lt * 1.4) * 0.05); ctx.scale(clamp(lp, 0, 1.2), clamp(lp, 0, 1.2));
      const L = s * 0.2;
      ctx.beginPath(); ctx.moveTo(0, L); ctx.bezierCurveTo(L * 0.9, L * 0.5, L * 0.9, -L * 0.6, 0, -L); ctx.bezierCurveTo(-L * 0.9, -L * 0.6, -L * 0.9, L * 0.5, 0, L); ctx.closePath();
      ctx.fillStyle = rgba(C.nmr, 0.3); ctx.fill(); strokeStyle(ctx, C.nmr, LW(s)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, L * 1.3); ctx.lineTo(0, -L * 0.7); ctx.stroke();
      ctx.restore();
    }
  });
};

// ---------------------------------------------------------------- capability-tree row headers (slides 7, 9, 11)
/** GC: a coiled capillary column in an oven; carrier gas dots run the coil to a flame (FID). */
export const gcOven: Icon = (ctx, cx, cy, s, lt, color, a = 1) => {
  if (lt <= 0) return;
  const p = springAt(lt, 0, 0.6, 12);
  withAlpha(ctx, a * clamp(p), () => {
    rr(ctx, cx - s * 0.42, cy - s * 0.34, s * 0.64, s * 0.68, 8); strokeStyle(ctx, C.text2, LW(s)); ctx.stroke();
    const ox = cx - s * 0.1, oy = cy;
    const pts: Pt[] = [];
    for (let i = 0; i <= 120; i++) { const u = i / 120, an = u * TAU * 3, r = s * (0.06 + 0.18 * u); pts.push({ x: ox + Math.cos(an) * r, y: oy + Math.sin(an) * r * 0.9 }); }
    strokeStyle(ctx, color, LW(s) * 0.9); polyPartial(ctx, pts, prog(lt, 0.1, 0.8));
    // heat shimmer on the oven wall
    for (let k = 0; k < 3; k++) { const u = ((lt * 0.8 + k / 3) % 1); withAlpha(ctx, Math.sin(u * Math.PI) * 0.6, () => { strokeStyle(ctx, C.xray, 2); ctx.beginPath(); ctx.moveTo(cx - s * 0.38 + k * s * 0.18, cy + s * 0.3); ctx.quadraticCurveTo(cx - s * 0.34 + k * s * 0.18, cy + s * 0.3 - u * s * 0.12, cx - s * 0.38 + k * s * 0.18, cy + s * 0.3 - u * s * 0.22); ctx.stroke(); }); }
    if (lt > 0.8) for (let k = 0; k < 4; k++) { const u = ((lt * 0.35 + k / 4) % 1); const q = pts[Math.floor(u * 120)]!; glow(ctx, q.x, q.y, s * 0.05, color, 0.9); }
    // exit line + flame detector
    const fx = cx + s * 0.36, fy = cy - s * 0.02;
    strokeStyle(ctx, color, LW(s) * 0.8); ctx.beginPath(); ctx.moveTo(cx + s * 0.22, fy); ctx.lineTo(fx - s * 0.04, fy); ctx.stroke();
    const fl = 0.8 + 0.2 * Math.sin(lt * 17) * Math.sin(lt * 7);
    ctx.beginPath(); ctx.moveTo(fx, fy - s * 0.2 * fl); ctx.quadraticCurveTo(fx + s * 0.07, fy - s * 0.04, fx, fy + s * 0.04); ctx.quadraticCurveTo(fx - s * 0.07, fy - s * 0.04, fx, fy - s * 0.2 * fl);
    ctx.fillStyle = rgba(C.cyan, 0.7); ctx.fill(); glow(ctx, fx, fy - s * 0.07, s * 0.14, C.cyan, 0.7);
  });
};

/** LC: solvent bottle → pulsing pump → packed column → eluting droplets. */
export const lcColumn: Icon = (ctx, cx, cy, s, lt, color, a = 1) => {
  if (lt <= 0) return;
  const p = springAt(lt, 0, 0.6, 12);
  withAlpha(ctx, a * clamp(p), () => {
    const bx = cx - s * 0.36;
    rr(ctx, bx - s * 0.08, cy - s * 0.3, s * 0.16, s * 0.24, 6); strokeStyle(ctx, C.text2, LW(s)); ctx.stroke();
    ctx.fillStyle = rgba(color, 0.5); ctx.fillRect(bx - s * 0.07, cy - s * 0.18, s * 0.14, s * 0.11);
    strokeStyle(ctx, C.text2, LW(s) * 0.8); ctx.beginPath(); ctx.moveTo(bx, cy - s * 0.06); ctx.lineTo(bx, cy + s * 0.14); ctx.lineTo(cx - s * 0.02, cy + s * 0.14); ctx.stroke();
    const pump = 1 + 0.12 * Math.max(0, Math.sin(lt * 7));
    ctx.beginPath(); ctx.arc(cx - s * 0.14, cy + s * 0.14, s * 0.06 * pump, 0, TAU); ctx.fillStyle = rgba(color, 0.8); ctx.fill();
    const colX = cx + s * 0.12;
    rr(ctx, colX - s * 0.05, cy - s * 0.32, s * 0.1, s * 0.5, 8); strokeStyle(ctx, color, LW(s)); ctx.stroke();
    for (let k = 0; k < 18; k++) dot(ctx, colX - s * 0.025 + (k % 3) * s * 0.025, cy - s * 0.28 + Math.floor(k / 3) * s * 0.075, s * 0.011, C.text3);
    strokeStyle(ctx, C.text2, LW(s) * 0.8); ctx.beginPath(); ctx.moveTo(cx - s * 0.02, cy + s * 0.14); ctx.lineTo(colX, cy + s * 0.14); ctx.lineTo(colX, cy + s * 0.18); ctx.stroke();
    // band travelling down the column, then a droplet
    const u = (lt * 0.5) % 1;
    glow(ctx, colX, lerp(cy - s * 0.3, cy + s * 0.16, u), s * 0.07, color, 0.9);
    const dx = cx + s * 0.36, du = (lt * 0.9) % 1;
    strokeStyle(ctx, C.text2, LW(s) * 0.8); ctx.beginPath(); ctx.moveTo(colX + s * 0.05, cy - s * 0.3); ctx.lineTo(dx, cy - s * 0.3); ctx.lineTo(dx, cy - s * 0.2); ctx.stroke();
    dot(ctx, dx, lerp(cy - s * 0.16, cy + s * 0.26, du * du), s * 0.03, color, 1 - du * 0.5);
  });
};

/** ICP: argon plasma torch flickering, ions streaming into a quadrupole. */
export const icpTorch: Icon = (ctx, cx, cy, s, lt, color, a = 1) => {
  if (lt <= 0) return;
  const p = springAt(lt, 0, 0.6, 12);
  withAlpha(ctx, a * clamp(p), () => {
    const tx = cx - s * 0.28;
    strokeStyle(ctx, C.text2, LW(s));
    for (const w of [0.08, 0.13]) { ctx.beginPath(); ctx.moveTo(tx - s * w, cy + s * 0.34); ctx.lineTo(tx - s * w, cy + s * 0.05); ctx.moveTo(tx + s * w, cy + s * 0.34); ctx.lineTo(tx + s * w, cy + s * 0.05); ctx.stroke(); }
    // RF coil
    for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(tx, cy + s * 0.02 - k * s * 0.07, s * 0.17, s * 0.03, 0, 0, TAU); strokeStyle(ctx, C.xray, LW(s) * 0.7, 0.8); ctx.stroke(); }
    const fl = 1 + 0.08 * Math.sin(lt * 13) + 0.05 * Math.sin(lt * 29);
    for (const [k, col] of [[1, color], [0.65, '#FFFFFF']] as [number, string][]) {
      const hgt = s * 0.36 * fl * k;
      ctx.beginPath(); ctx.moveTo(tx, cy - s * 0.02 - hgt); ctx.bezierCurveTo(tx + s * 0.12 * k, cy - s * 0.02 - hgt * 0.4, tx + s * 0.1 * k, cy + s * 0.04, tx, cy + s * 0.05); ctx.bezierCurveTo(tx - s * 0.1 * k, cy + s * 0.04, tx - s * 0.12 * k, cy - s * 0.02 - hgt * 0.4, tx, cy - s * 0.02 - hgt);
      ctx.fillStyle = rgba(col, k === 1 ? 0.55 : 0.8); ctx.fill();
    }
    glow(ctx, tx, cy - s * 0.12, s * 0.28, color, 0.8);
    // quadrupole rods + ions
    const qx = cx + s * 0.18;
    for (const dy of [-0.09, 0.09]) { rr(ctx, qx - s * 0.12, cy + dy * s - s * 0.02, s * 0.3, s * 0.04, 4); ctx.fillStyle = rgba(C.text2, 0.7); ctx.fill(); }
    for (let k = 0; k < 4; k++) { const u = ((lt * 0.9 + k / 4) % 1); const x = lerp(tx + s * 0.1, qx + s * 0.2, u); const y = cy - s * 0.1 + Math.sin(u * 12 + k) * s * 0.03 * (x > qx - s * 0.12 ? 1 : 0.3) + s * 0.1 * Math.min(1, u * 2) ; dot(ctx, x, y - s * 0.1 + s * 0.1, s * 0.018, '#FFFFFF', Math.sin(u * Math.PI)); }
  });
};

/** Electron microscope: column, beam, and a raster scan building an image. */
export const emScope: Icon = (ctx, cx, cy, s, lt, color, a = 1) => {
  if (lt <= 0) return;
  const p = springAt(lt, 0, 0.6, 12);
  withAlpha(ctx, a * clamp(p), () => {
    const x0 = cx - s * 0.18;
    strokeStyle(ctx, C.text2, LW(s));
    ctx.beginPath(); ctx.moveTo(x0 - s * 0.1, cy - s * 0.38); ctx.lineTo(x0 + s * 0.1, cy - s * 0.38); ctx.lineTo(x0 + s * 0.06, cy - s * 0.02); ctx.lineTo(x0 - s * 0.06, cy - s * 0.02); ctx.closePath(); ctx.stroke();
    for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.ellipse(x0, cy - s * 0.28 + k * s * 0.13, s * 0.09 - k * s * 0.015, s * 0.025, 0, 0, TAU); ctx.stroke(); }
    // raster on the sample plate (right)
    const px = cx + s * 0.02, py = cy + s * 0.04, pw = s * 0.4, ph = s * 0.3;
    rr(ctx, px, py - ph / 2, pw, ph, 5); strokeStyle(ctx, color, LW(s) * 0.8); ctx.stroke();
    const rows = 8, k = (lt * 0.6) % 1, row = Math.floor(k * rows), u = (k * rows) % 1;
    for (let r = 0; r < row; r++) { const yy = py - ph / 2 + (r + 0.5) * (ph / rows); strokeStyle(ctx, color, s * 0.022, 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(r * 2.1))); ctx.beginPath(); ctx.moveTo(px + 5, yy); ctx.lineTo(px + pw - 5, yy); ctx.stroke(); }
    const bx = px + 5 + u * (pw - 10), by = py - ph / 2 + (row + 0.5) * (ph / rows);
    strokeStyle(ctx, C.cyan, LW(s) * 0.8, 0.8); ctx.beginPath(); ctx.moveTo(x0, cy - s * 0.02); ctx.lineTo(bx, by); ctx.stroke();
    glow(ctx, bx, by, s * 0.06, C.cyan, 1); dot(ctx, bx, by, s * 0.012, '#FFFFFF');
  });
};

/** Surface probe (XPS / Raman): photons in, electrons / shifted light out of a surface. */
export const surfaceProbe: Icon = (ctx, cx, cy, s, lt, color, a = 1) => {
  if (lt <= 0) return;
  const p = springAt(lt, 0, 0.6, 12);
  withAlpha(ctx, a * clamp(p), () => {
    const sy = cy + s * 0.2;
    for (let i = 0; i < 7; i++) dot(ctx, cx - s * 0.36 + i * s * 0.12, sy, s * 0.035, i === 3 ? color : C.text3);
    for (let i = 0; i < 6; i++) dot(ctx, cx - s * 0.3 + i * s * 0.12, sy + s * 0.1, s * 0.035, C.text3, 0.6);
    const hit = { x: cx, y: sy - s * 0.04 };
    const wave = (x0: number, y0: number, x1: number, y1: number, amp: number, col: string, u: number) => {
      const pts: Pt[] = [];
      for (let i = 0; i <= 40; i++) { const v = i / 40, x = lerp(x0, x1, v), y = lerp(y0, y1, v), nx = -(y1 - y0), ny = x1 - x0, L = Math.hypot(nx, ny); const o = Math.sin(v * 22 - lt * 12) * amp; pts.push({ x: x + (nx / L) * o, y: y + (ny / L) * o }); }
      strokeStyle(ctx, col, LW(s) * 0.8); polyPartial(ctx, pts, u);
    };
    wave(cx - s * 0.42, cy - s * 0.36, hit.x, hit.y, s * 0.02, C.gold, prog(lt, 0.1, 0.5));
    if (lt > 0.6) {
      const k = ((lt - 0.6) * 0.8) % 1;
      const ex = lerp(hit.x, cx + s * 0.38, k), ey = lerp(hit.y, cy - s * 0.36, k);
      strokeStyle(ctx, color, LW(s) * 0.7, 0.35); ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.moveTo(hit.x, hit.y); ctx.lineTo(cx + s * 0.38, cy - s * 0.36); ctx.stroke(); ctx.setLineDash([]);
      glow(ctx, ex, ey, s * 0.07, color, 1); dot(ctx, ex, ey, s * 0.025, '#FFFFFF');
      text(ctx, 'e-', ex + s * 0.05, ey - s * 0.02, { f: 'mono', size: Math.round(s * 0.1), weight: 700, color, alpha: Math.sin(k * Math.PI) });
    }
    glow(ctx, hit.x, hit.y, s * 0.1, C.gold, 0.5 + 0.3 * Math.sin(lt * 6));
  });
};

/** Porous particle with a size-distribution curve: surface area, pores, particle size. */
export const porous: Icon = (ctx, cx, cy, s, lt, color, a = 1) => {
  if (lt <= 0) return;
  const p = springAt(lt, 0, 0.6, 12);
  withAlpha(ctx, a * clamp(p), () => {
    const px = cx - s * 0.2, R = s * 0.2;
    ctx.beginPath(); for (let i = 0; i <= 40; i++) { const an = (i / 40) * TAU, r = R * (1 + 0.08 * Math.sin(an * 5 + 1) + 0.05 * Math.sin(an * 9)); i ? ctx.lineTo(px + Math.cos(an) * r, cy + Math.sin(an) * r) : ctx.moveTo(px + Math.cos(an) * r, cy + Math.sin(an) * r); } ctx.closePath();
    ctx.fillStyle = rgba(color, 0.25); ctx.fill(); strokeStyle(ctx, color, LW(s)); ctx.stroke();
    const pores = [[-0.3, -0.2, 0.18], [0.25, -0.3, 0.13], [0.1, 0.25, 0.2], [-0.35, 0.35, 0.12], [0.4, 0.1, 0.1]];
    pores.forEach(([dx, dy, r], i) => { const g = 0.7 + 0.3 * Math.sin(lt * 2 + i); ctx.beginPath(); ctx.arc(px + dx! * R, cy + dy! * R, r! * R * g, 0, TAU); ctx.fillStyle = C.ink0; ctx.fill(); });
    // gas molecules adsorbing
    for (let k = 0; k < 4; k++) { const u = ((lt * 0.5 + k / 4) % 1); const an = k * 1.7; dot(ctx, px + Math.cos(an) * R * lerp(2.2, 1.05, u), cy + Math.sin(an) * R * lerp(2.2, 1.05, u), s * 0.018, C.cyan, 1 - u * 0.4); }
    // distribution curve
    const x0 = cx + s * 0.08, x1 = cx + s * 0.46, yb = cy + s * 0.2;
    strokeStyle(ctx, C.text3, LW(s) * 0.7); ctx.beginPath(); ctx.moveTo(x0, cy - s * 0.24); ctx.lineTo(x0, yb); ctx.lineTo(x1, yb); ctx.stroke();
    const pts: Pt[] = []; for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push({ x: lerp(x0, x1, u), y: yb - Math.exp(-((u - 0.45) ** 2) / 0.02) * s * 0.36 }); }
    strokeStyle(ctx, color, LW(s)); polyPartial(ctx, pts, prog(lt, 0.3, 0.9, ease.inOutCubic));
  });
};

/** Thermal analysis: a heating ramp with a mass-loss step (TGA) and a heat-flow peak (DSC). */
export const thermalCurve: Icon = (ctx, cx, cy, s, lt, color, a = 1) => {
  if (lt <= 0) return;
  withAlpha(ctx, a, () => {
    const x0 = cx - s * 0.42, x1 = cx + s * 0.34, y0 = cy - s * 0.32, yb = cy + s * 0.28;
    strokeStyle(ctx, C.text3, LW(s) * 0.7, prog(lt, 0, 0.4)); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, yb); ctx.lineTo(x1, yb); ctx.stroke();
    const u = prog(lt, 0.2, 1.6, ease.inOutSine);
    const N = 60, tga: Pt[] = [], dsc: Pt[] = [];
    for (let i = 0; i <= N; i++) {
      const v = i / N, x = lerp(x0 + 4, x1, v);
      tga.push({ x, y: y0 + s * 0.08 + s * 0.25 / (1 + Math.exp(-(v - 0.55) * 22)) });
      dsc.push({ x, y: yb - s * 0.12 - Math.exp(-((v - 0.4) ** 2) / 0.004) * s * 0.22 });
    }
    strokeStyle(ctx, color, LW(s)); const h = polyPartial(ctx, tga, u);
    strokeStyle(ctx, C.xray, LW(s) * 0.9); polyPartial(ctx, dsc, u);
    if (h && u < 1) { glow(ctx, h.x, h.y, s * 0.06, color, 1); }
    // thermometer rising with the ramp
    const tx = cx + s * 0.44, lvl = lt > 1.8 ? 0.6 + 0.3 * Math.sin((lt - 1.8) * 1.5) : u;
    rr(ctx, tx - s * 0.025, cy - s * 0.3, s * 0.05, s * 0.44, s * 0.025); strokeStyle(ctx, C.text2, LW(s) * 0.7); ctx.stroke();
    ctx.beginPath(); ctx.arc(tx, cy + s * 0.2, s * 0.045, 0, TAU); ctx.fillStyle = C.xray; ctx.fill();
    ctx.fillStyle = C.xray; ctx.fillRect(tx - s * 0.012, cy + s * 0.16 - lvl * s * 0.4, s * 0.024, lvl * s * 0.4);
  });
};
