// Scene 4a · Our team (slide 4, first half).
// Leadership lands on the management row; three domain columns rise in the
// same colours as scene 3; the camera walks column by column and every person
// pops in on their spoken name. Ong Li Li's card flies from management into the
// NMR lead slot, showing her dual role. Then the team folds into one hub.
import { type Ctx, W, H } from '../engine/assets';
import { C, DOMAINS } from '../engine/theme';
import { cue, clip } from '../engine/narration';
import type { Scene } from '../engine/scene';
import { clamp, ease, lerp, prog, rgba, springAt, pulse, TAU, keys, type Pt } from '../engine/util';
import { text, glow, dot, withAlpha, withT, strokeStyle, polyPartial, rr, card, applyCam, lerpCam, CAM0, type Cam, personCard, typeText, bezierPts, elbowPts, badge } from '../engine/draw';
import * as I from '../engine/icons';
import { S4_DOT } from './s3_domains';

export const HUB = { x: W / 2, y: 575, r: 72, t: cue(4, 'ACI also plays').t + 1.55 };

const T = {
  aci: cue(4, 'ACI division').t,
  director: cue(4, 'division director').t,
  andrew: cue(4, 'Andrew Lim').t,
  oll: cue(4, 'Ong Li Li').t,
  deputy: cue(4, 'Division Deputy Director').t,
  cols: cue(4, 'three technical domains').t,
  slots: cue(4, 'respective domain lead').t,
  focus: [cue(4, 'Chromatography and Mass').t - 0.35, cue(4, 'X-ray Spectroscopy').t - 0.35, cue(4, 'Ong Li Li also').t - 0.25],
  leads: [cue(4, 'Ong Wai Chung').t, cue(4, 'Angeline Seo').t, cue(4, 'domain lead of NMR').t],
  label: [cue(4, 'instrument specialists').t, cue(4, 'senior domain specialists').t, cue(4, 'supported by instrument').t + 0.3],
  nmr: cue(4, 'NMR').t,
  wide: cue(4, 'Kuan Kai Cong').t + 0.9,
  fold: cue(4, 'ACI also plays').t - 0.25,
};

// ---------------------------------------------------------------- layout
const HEAD = { x: W / 2, y: S4_DOT.y };
const MG = { y: 262, h: 92, w: 400, xs: [540, 980] };
const COL = { xs: [350, 960, 1570], w: 560, top: 392, bottom: 1000 };
const CARD = { w: 500, h: 88 };
const LEAD_Y = 546;
const SPEC_Y = [706, 806, 906];
const LEADS = [
  { id: 'ong_wai_chung', name: 'Ong Wai Chung' },
  { id: 'angeline_seo', name: 'Angeline Seo' },
  { id: 'ong_li_li', name: 'Ong Li Li' },
];
const SPEC_LABEL = ['INSTRUMENT SPECIALISTS', 'SENIOR DOMAIN SPECIALISTS', 'INSTRUMENT SPECIALISTS'];
const SPECS: { id: string; name: string; role: string; t: number; badge?: [string, number] }[][] = [
  [
    { id: 'ng_fu_song', name: 'Ng Fu Song', role: 'Instrument Specialist', t: cue(4, 'Ng Fu Song').t },
    { id: 'tan_kuan_yi', name: 'Tan Kuan Yi', role: 'Instrument Specialist', t: cue(4, 'Tan Kuan Yi').t },
  ],
  [
    { id: 'wang_zhan', name: 'Wang Zhan', role: 'Senior Domain Specialist', t: cue(4, 'Wang Zhan').t, badge: ['XPS', cue(4, 'XPS').t] },
    { id: 'chia_sze_chen', name: 'Chia Sze Chen', role: 'Senior Domain Specialist', t: cue(4, 'Chia Sze Chen').t, badge: ['XRD', cue(4, 'XRD').t] },
    { id: 'cao_xun', name: 'Cao Xun', role: 'Senior Domain Specialist', t: cue(4, 'Cao Xun').t, badge: ['TEM', cue(4, 'TEM').t] },
  ],
  [
    { id: 'yeo_wen_cong', name: 'Yeo Wen Cong', role: 'Instrument Specialist', t: cue(4, 'Yeo Wen Cong').t },
    { id: 'kuan_kai_cong', name: 'Kuan Kai Cong', role: 'Instrument Specialist', t: cue(4, 'Kuan Kai Cong').t },
  ],
];
const DOM_ICON = [I.chromatogram, I.xray, I.nmr];

// ---------------------------------------------------------------- camera
const FOCUS: Cam[] = [
  { x: COL.xs[0]!, y: 705, z: 1.4 },
  { x: COL.xs[1]!, y: 715, z: 1.36 },
  { x: 1400, y: 615, z: 1.18 },
];
function cam(t: number): Cam {
  let c = CAM0;
  for (let i = 0; i < 3; i++) c = lerpCam(c, FOCUS[i]!, prog(t, T.focus[i]!, 1.4, ease.inOutCubic));
  c = lerpCam(c, { x: W / 2, y: 560, z: 0.98 }, prog(t, T.wide, 1.7, ease.inOutCubic));
  return c;
}
/** 0..1 how strongly column i is in focus (others dim). */
function focusOf(i: number, t: number) {
  const act = T.focus.map((f, k) => prog(t, f, 0.8) * (k < 2 ? 1 - prog(t, T.focus[k + 1]!, 0.8) : 1));
  const any = Math.max(...act) * (1 - prog(t, T.wide, 1));
  return lerp(1, lerp(0.35, 1, act[i]!), any);
}

// ---------------------------------------------------------------- pieces
function drawHeader(ctx: Ctx, t: number, fold: number) {
  const g = springAt(t, T.aci, 0.6, 11);
  const w = lerp(S4_DOT.r * 2, 300, clamp(g)), h = lerp(S4_DOT.r * 2, 60, clamp(g));
  withAlpha(ctx, 1 - fold, () => {
    glow(ctx, HEAD.x, HEAD.y, 200, C.violet, 0.6);
    rr(ctx, HEAD.x - w / 2, HEAD.y - h / 2, w, h, h / 2);
    const gr = ctx.createLinearGradient(HEAD.x - w / 2, 0, HEAD.x + w / 2, 0); gr.addColorStop(0, C.blue); gr.addColorStop(1, C.magenta);
    ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.stroke();
    text(ctx, 'ACI DIVISION', HEAD.x, HEAD.y + 9, { f: 'display', size: 26, weight: 700, align: 'center', tracking: 2, alpha: prog(t, T.aci + 0.2, 0.4) });
  });
}

function drawManagement(ctx: Ctx, t: number, fold: number) {
  withAlpha(ctx, 1 - fold, () => {
    const lp = prog(t, T.director - 0.3, 0.6, ease.inOutCubic);
    strokeStyle(ctx, '#AFC0FF', 2, 0.6);
    for (const x of MG.xs) polyPartial(ctx, elbowPts({ x: HEAD.x, y: HEAD.y + 30 }, { x: x + MG.w / 2, y: MG.y - MG.h / 2 }, 196), lp);
    personCard(ctx, t, T.director - 0.1, { id: 'andrew_lim', name: 'Andrew Lim', role: 'Division Director' }, MG.xs[0]!, MG.y - MG.h / 2, MG.w, MG.h, C.magenta,
      { roleT: T.director + 0.15, nameT: T.andrew, faceT: T.andrew - 0.05, nameSize: 25 });
    personCard(ctx, t, T.oll - 0.2, { id: 'ong_li_li', name: 'Ong Li Li', role: 'Division Deputy Director' }, MG.xs[1]!, MG.y - MG.h / 2, MG.w, MG.h, C.violet,
      { roleT: T.deputy, nameT: T.oll, faceT: T.oll - 0.05, nameSize: 25 });
    // management → domains bus
    const bp = prog(t, T.cols - 0.5, 0.7, ease.inOutCubic);
    strokeStyle(ctx, '#AFC0FF', 2, 0.5);
    polyPartial(ctx, [{ x: HEAD.x, y: MG.y + MG.h / 2 }, { x: HEAD.x, y: 360 }], bp);
    for (const x of COL.xs) polyPartial(ctx, [{ x: HEAD.x, y: 360 }, { x, y: 360 }, { x, y: COL.top }], prog(t, T.cols - 0.2, 0.6, ease.inOutCubic));
  });
}

function drawColumn(ctx: Ctx, i: number, t: number, fold: number) {
  const D = DOMAINS[i]!;
  const x = COL.xs[i]!;
  const rise = prog(t, T.cols + i * 0.15, 0.9, ease.outCubic);
  if (rise <= 0) return;
  const f = focusOf(i, t);
  const colFold = prog(t, T.fold + 0.45, 0.6, ease.inOutCubic);
  const cardsFold = prog(t, T.fold, 0.4, ease.inOutCubic);
  withAlpha(ctx, f * (1 - prog(t, T.fold + 0.9, 0.3)), () => {
    const h = (COL.bottom - COL.top) * rise * (1 - colFold);
    const w = lerp(COL.w, 40, colFold);
    const top = lerp(COL.top, 690 - 20, colFold);
    // column body
    rr(ctx, x - w / 2, top, w, Math.max(h, 40 * colFold), lerp(22, 20, colFold));
    const gr = ctx.createLinearGradient(0, top, 0, top + h);
    gr.addColorStop(0, rgba(D.color, lerp(0.22, 1, colFold))); gr.addColorStop(1, rgba(D.color, lerp(0.05, 1, colFold)));
    ctx.fillStyle = gr; ctx.fill(); strokeStyle(ctx, D.color, 2, 0.55); ctx.stroke();
    if (colFold > 0) return;
    // header band
    const hp = prog(t, T.cols + i * 0.15 + 0.3, 0.5) * (1 - prog(t, T.fold + 0.05, 0.35, ease.inOutCubic));
    withAlpha(ctx, hp, () => {
      ctx.save(); rr(ctx, x - w / 2, top, w, h, 22); ctx.clip();
      ctx.fillStyle = rgba(D.color, 0.9); ctx.fillRect(x - w / 2, top, w, 94);
      ctx.restore();
      const np = i === 2 ? pulse(t, T.nmr, 0.05, 0.8) : 0;
      if (np > 0.01) glow(ctx, x, top + 48, 320, D.color, np);
      DOM_ICON[i]!(ctx, x - w / 2 + 62, top + 50, 84, 5 + t - T.cols, '#FFFFFF');
      D.name.forEach((ln, k) => text(ctx, ln, x - w / 2 + 122, top + 42 + k * 30, { f: 'display', size: 25, weight: 700, color: '#FFFFFF' }));
    });
    // domain-lead slot (placeholder, then the lead)
    const sp = prog(t, T.slots + i * 0.12, 0.5);
    const leadT0 = T.leads[i]! - 0.3;
    withAlpha(ctx, 1 - cardsFold, () => {
      if (sp > 0 && (i === 2 ? t < flyLand() : t < leadT0 + 0.2)) withAlpha(ctx, sp * (1 - prog(t, i === 2 ? flyLand() - 0.2 : leadT0, 0.3)), () => {
        rr(ctx, x - CARD.w / 2, LEAD_Y - CARD.h / 2, CARD.w, CARD.h, CARD.h / 2);
        ctx.setLineDash([8, 8]); strokeStyle(ctx, D.color, 2, 0.8); ctx.stroke();
        ctx.beginPath(); ctx.arc(x - CARD.w / 2 + CARD.h / 2, LEAD_Y, CARD.h * 0.34, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        text(ctx, 'DOMAIN LEAD', x - CARD.w / 2 + CARD.h * 0.98, LEAD_Y + 8, { f: 'mono', size: 20, weight: 700, color: D.color, tracking: 2 });
      });
      if (i < 2) personCard(ctx, t, leadT0, { id: LEADS[i]!.id, name: LEADS[i]!.name, role: 'Domain Lead' }, x - CARD.w / 2, LEAD_Y - CARD.h / 2, CARD.w, CARD.h, D.color,
        { nameT: T.leads[i]!, faceT: T.leads[i]! - 0.05, roleT: leadT0 + 0.5, nameSize: 26 });
      // specialists
      if (t > T.label[i]! - 0.1) typeText(ctx, SPEC_LABEL[i]!, t, T.label[i]!, x - CARD.w / 2 + 8, SPEC_Y[0]! - CARD.h / 2 - 22, { f: 'mono', size: 18, weight: 700, color: rgba(D.color, 1), tracking: 3 }, 40, false);
      SPECS[i]!.forEach((p, k) => personCard(ctx, t, p.t - 0.28, { id: p.id, name: p.name, role: p.role }, x - CARD.w / 2, SPEC_Y[k]! - CARD.h / 2, CARD.w, CARD.h, D.color,
        { nameT: p.t, faceT: p.t - 0.05, roleT: p.t + 0.25, nameSize: 26, badge: p.badge ? { text: p.badge[0], t: p.badge[1] } : undefined }));
    });
  });
}

// Ong Li Li's dual role: her management card sends a copy down into the NMR lead slot.
const flyStart = () => T.focus[2]! + 0.75;
const flyLand = () => flyStart() + 1.15;
function drawFlight(ctx: Ctx, t: number, fold: number) {
  if (t < flyStart()) return;
  const u = prog(t, flyStart(), 1.15, ease.inOutCubic);
  const A: Pt = { x: MG.xs[1]! + MG.w / 2, y: MG.y };
  const B: Pt = { x: COL.xs[2]!, y: LEAD_Y };
  const path = bezierPts(A, { x: A.x + 60, y: A.y + 180 }, { x: B.x - 220, y: B.y - 160 }, B, 40);
  const q = path[Math.round(u * 40)]!;
  withAlpha(ctx, 1 - fold, () => {
    // lasting dashed link: one person, two roles
    strokeStyle(ctx, C.violet, 2, 0.7); ctx.setLineDash([6, 8]); ctx.lineDashOffset = -t * 30;
    polyPartial(ctx, path, u); ctx.setLineDash([]);
    const w = lerp(MG.w, CARD.w, u), h = lerp(MG.h, CARD.h, u);
    const lift = Math.sin(u * Math.PI) * 0.08;
    const k = ease.inOutCubic(clamp((u - 0.3) / 0.4)); // violet deputy-director card → green domain-lead card
    withT(ctx, q.x, q.y, 1 + lift, () => {
      if (u < 1) glow(ctx, 0, 0, w * 0.6, C.violet, 0.5 * Math.sin(u * Math.PI));
      withAlpha(ctx, 1 - k, () => personCard(ctx, t, 0, { id: 'ong_li_li', name: 'Ong Li Li', role: 'Division Deputy Director' }, -w / 2, -h / 2, w, h, C.violet, { nameSize: 26 }));
      withAlpha(ctx, k, () => personCard(ctx, t, 0, { id: 'ong_li_li', name: 'Ong Li Li', role: 'Domain Lead' }, -w / 2, -h / 2, w, h, C.nmr, { nameSize: 26, roleT: flyStart() + 0.55 }));
    });
    const land = pulse(t, flyLand(), 0.1, 0.5) * 0.8;
    if (land > 0.01) glow(ctx, B.x, B.y, 320, C.nmr, land);
  });
}

// team folds into the hub for the resource-management half
function drawFold(ctx: Ctx, t: number) {
  const u = prog(t, T.fold + 1.0, 0.75, ease.inOutCubic);
  if (u <= 0 || t >= HUB.t) return;
  COL.xs.forEach((x, i) => {
    const p = { x: lerp(x, HUB.x, u), y: lerp(690, HUB.y, u) };
    glow(ctx, p.x, p.y, 70, DOMAINS[i]!.color, 0.9);
    dot(ctx, p.x, p.y, lerp(20, 12, u), DOMAINS[i]!.color);
  });
  const m = prog(t, T.fold + 1.6, 0.25, ease.outBack);
  if (m > 0) { glow(ctx, HUB.x, HUB.y, 160, C.violet, m); dot(ctx, HUB.x, HUB.y, 26 * m, '#FFFFFF'); }
}

export const s4: Scene = {
  id: 'team',
  start: S4_DOT.t,
  end: HUB.t,
  bg: (t) => { const c = cam(t); return { gx: -(c.x - W / 2) * c.z * 0.5, gy: -(c.y - H / 2) * c.z * 0.5, grid: 0.9 }; },
  draw(ctx, t) {
    const fold = prog(t, T.fold, 0.6, ease.inCubic);
    ctx.save();
    applyCam(ctx, cam(t));
    // hand-off dot from scene 3 until the header grows
    drawHeader(ctx, t, fold);
    drawManagement(ctx, t, fold);
    for (let i = 0; i < 3; i++) drawColumn(ctx, i, t, fold);
    drawFlight(ctx, t, prog(t, T.fold, 0.4, ease.inOutCubic));
    drawFold(ctx, t);
    ctx.restore();
  },
};
export const S4_TIMES = T;
void keys;
