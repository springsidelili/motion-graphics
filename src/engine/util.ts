// Math, easing, colour and deterministic randomness. Every visual is a pure
// function of time: never use Math.random() / Date.now() in scenes.

export const clamp = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const invLerp = (a: number, b: number, x: number) => clamp((x - a) / (b - a));
export const remap = (x: number, a: number, b: number, c: number, d: number) => lerp(c, d, invLerp(a, b, x));
export const smoothstep = (a: number, b: number, x: number) => { const t = invLerp(a, b, x); return t * t * (3 - 2 * t); };
export const TAU = Math.PI * 2;

export type Ease = (t: number) => number;
export const ease = {
  linear: (t: number) => t,
  inQuad: (t: number) => t * t,
  outQuad: (t: number) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  inCubic: (t: number) => t * t * t,
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  inOutQuart: (t: number) => (t < 0.5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2),
  outQuint: (t: number) => 1 - Math.pow(1 - t, 5),
  inOutQuint: (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2),
  inExpo: (t: number) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outExpo: (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutExpo: (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
  outBack: (t: number, s = 1.6) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  inBack: (t: number, s = 1.4) => (s + 1) * t * t * t - s * t * t,
  inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  outSine: (t: number) => Math.sin((t * Math.PI) / 2),
  // damped spring settling at 1 (overshoot controlled by zeta)
  spring: (t: number, zeta = 0.45, omega = 14) => {
    if (t <= 0) return 0;
    const wd = omega * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + ((zeta * omega) / wd) * Math.sin(wd * t));
  },
};

/** 0→1 progress of t over [t0, t0+dur], eased. */
export const prog = (t: number, t0: number, dur: number, e: Ease = ease.outCubic) => e(clamp((t - t0) / dur));
/** spring progress in seconds since t0 (unbounded above 1 during overshoot). */
export const springAt = (t: number, t0: number, zeta = 0.5, omega = 13) => ease.spring(Math.max(0, t - t0), zeta, omega);
/** Fade in over [a, a+fin], out over [b-fout, b]. */
export const window01 = (t: number, a: number, b: number, fin = 0.4, fout = 0.4, e: Ease = ease.inOutCubic) =>
  Math.min(e(clamp((t - a) / fin)), e(clamp((b - t) / fout)));
/** Keyframes [[t, v], ...] with per-segment easing. */
export function keys(t: number, k: [number, number, Ease?][]) {
  if (t <= k[0]![0]) return k[0]![1];
  for (let i = 1; i < k.length; i++) {
    const [t1, v1, e] = k[i]!;
    const [t0, v0] = k[i - 1]!;
    if (t <= t1) return lerp(v0, v1, (e ?? ease.inOutCubic)((t - t0) / (t1 - t0)));
  }
  return k[k.length - 1]![1];
}
export const pulse = (t: number, t0: number, attack = 0.05, decay = 0.6) =>
  t < t0 ? 0 : t < t0 + attack ? (t - t0) / attack : Math.exp(-(t - t0 - attack) / decay);

// ---------- deterministic randomness ----------
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const hash = (...n: number[]) => {
  let h = 2166136261;
  for (const x of n) { h ^= Math.floor(x * 1000) | 0; h = Math.imul(h, 16777619); }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
};
// smooth 1D value noise
export function noise1(x: number, seed = 0) {
  const i = Math.floor(x), f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(hash(i, seed), hash(i + 1, seed), u) * 2 - 1;
}

// ---------- colour ----------
export type RGB = [number, number, number];
export function hex(h: string): RGB {
  if (h.startsWith('rgb')) { const m = h.match(/[\d.]+/g)!; return [+m[0]!, +m[1]!, +m[2]!]; }
  const s = h.replace('#', '');
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
export const rgba = (c: string | RGB, a = 1) => {
  const [r, g, b] = typeof c === 'string' ? hex(c) : c;
  return `rgba(${r | 0},${g | 0},${b | 0},${clamp(a).toFixed(4)})`;
};
export const mixRGB = (a: string | RGB, b: string | RGB, t: number): RGB => {
  const A = typeof a === 'string' ? hex(a) : a, B = typeof b === 'string' ? hex(b) : b;
  return [lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)];
};
/** sample a multi-stop gradient at u ∈ [0,1] */
export const gradAt = (stops: string[], u: number): RGB => {
  const x = clamp(u) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  return mixRGB(stops[i]!, stops[i + 1]!, x - i);
};

// ---------- geometry ----------
export type Pt = { x: number; y: number };
export const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
export const lerpPt = (a: Pt, b: Pt, t: number): Pt => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
export function bezier(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}
