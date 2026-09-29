// Sound design cue sheet. Restraint: one sound per focal moment, never under a
// dense stretch of speech, levels set in tools/audio.py (18–26 dB under voice).
// Types: drop · pop · tick · whoosh · whooshIn · chime · swell · thump
import { S1_TIMES as A } from './scenes/s1_title';
import { S2_TIMES as B } from './scenes/s2_org';
import { S3_TIMES as Cc } from './scenes/s3_domains';
import { S4_TIMES as D, HUB } from './scenes/s4_team';
import { S5_TIMES as E, PIN } from './scenes/s5_resources';
import { S6_TIMES as F, WASH } from './scenes/s6_sitemap';
import { S7_TIMES as G, TREE as TREE_CMS } from './scenes/s7_cms';
import { S8_TIMES as X, TREE as TREE_XRAY } from './scenes/s8_xray';
import { S9_TIMES as N, TREE as TREE_NMR } from './scenes/s9_nmr';
import { S10_TIMES as Z, END_CARD_T } from './scenes/s10_summary';
import type { CapabilityTree } from './engine/kit';

export type Sfx = { t: number; type: 'drop' | 'pop' | 'tick' | 'whoosh' | 'whooshIn' | 'chime' | 'swell' | 'thump'; gain?: number; pan?: number; note?: string };

export const SFX: Sfx[] = [
  // 1 · Welcome
  { t: 0.05, type: 'swell', gain: -4, note: 'open' },
  { t: A.impact, type: 'drop', note: 'drop lands in the well' },
  { t: A.aci + 0.05, type: 'whoosh', gain: -6, note: 'wells lift off' },
  { t: A.aci + 1.0, type: 'chime', note: 'ACI formed' },
  { t: A.collapse, type: 'whooshIn', gain: -3, note: 'letters collapse' },
  { t: A.land - 0.08, type: 'pop', gain: -2 },
  // 2 · Where ACI sits
  { t: B.root, type: 'pop', gain: -4, note: 'ISCE² root' },
  { t: B.tree + 0.2, type: 'swell', gain: -10, note: 'tree grows' },
  { t: B.arrive - 0.02, type: 'chime', gain: -2, note: 'trace reaches ACI' },
  { t: B.pin + 0.08, type: 'tick', gain: -2 },
  { t: B.zoom, type: 'whoosh', gain: -8, note: 'camera push' },
  { t: B.andrew, type: 'pop', gain: -3, note: 'Andrew Lim' },
  ...B.chips.map((t, i) => ({ t, type: 'pop' as const, gain: -5, pan: -0.1 + i * 0.1 })),
  { t: B.fold, type: 'whooshIn', gain: -6 },
  // 3 · What we do
  { t: Cc.three, type: 'whoosh', gain: -5, note: 'cell divides' },
  ...Cc.dom.map((t, i) => ({ t, type: 'pop' as const, gain: -4, pan: (i - 1) * 0.35 })),
  { t: Cc.range, type: 'chime', gain: -9, note: 'instrument pool' },
  { t: Cc.extend + 0.5, type: 'whoosh', gain: -8, note: 'breaks out to industry' },
  { t: Cc.industry - 0.1, type: 'pop', gain: -4, pan: 0.3 },
  { t: Cc.services - 0.5, type: 'whoosh', gain: -6, note: 'camera travels to the industry node' },
  ...Cc.svc.map((t, i) => ({ t: t - 0.08, type: 'pop' as const, gain: -5, pan: i % 2 ? 0.25 : -0.25 })),
  { t: Cc.through, type: 'whooshIn', gain: -6 },
  { t: Cc.sol[0]!, type: 'chime', gain: -4, note: 'practical analytical solutions' },
  { t: Cc.exit, type: 'whooshIn', gain: -9 },
  // 4 · Team
  { t: D.aci, type: 'pop', gain: -5 },
  { t: D.andrew, type: 'pop', gain: -5, pan: -0.2 },
  { t: D.oll, type: 'pop', gain: -5, pan: 0.2 },
  { t: D.cols, type: 'swell', gain: -8, note: 'columns rise' },
  ...D.leads.slice(0, 2).map((t, i) => ({ t, type: 'pop' as const, gain: -5, pan: i ? 0 : -0.3 })),
  { t: D.leads[2]!, type: 'pop', gain: -5, pan: 0.3, note: 'Ong Li Li, NMR lead' },
  { t: D.fold + 0.9, type: 'whooshIn', gain: -5 },
  // 4b · Resources
  { t: HUB.t - 0.1, type: 'pop', gain: -3 },
  { t: E.institute - 0.3, type: 'swell', gain: -10 },
  ...E.nodes.map((t, i) => ({ t: t - 0.05, type: 'pop' as const, gain: -6, pan: [-0.4, 0, 0.4, 0.4, 0, -0.4][i] })),
  ...E.outcomes.map((t) => ({ t: t + 0.02, type: 'tick' as const, gain: -3, pan: 0.3 })),
  { t: E.evolving, type: 'swell', gain: -7, note: 'pulses to every lab' },
  { t: E.end, type: 'whooshIn', gain: -8, note: 'hub shrinks into the map pin' },
  // 5 · Site map
  { t: PIN.t + 0.05, type: 'pop', gain: -4, note: 'pin lands' },
  { t: PIN.t + 0.4, type: 'swell', gain: -12, note: 'plan draws' },
  { t: F.eight - 0.1, type: 'whoosh', gain: -9, note: 'labs lift into the stack' },
  ...Object.values(F.labs).map((t) => ({ t: t - 0.03, type: 'tick' as const, gain: -6, pan: 0.2 })),
  { t: F.integrated, type: 'chime', gain: -8, note: 'integrated analytical support' },
  { t: WASH.t, type: 'whoosh', gain: -7, note: 'colour wash into C/MS' },
  // 6–7 · C/MS
  { t: G.start, type: 'pop', gain: -5, note: 'C/MS lit' },
  ...[G.gc, G.lc, G.ms].map((t, i) => ({ t: t - 0.3, type: 'pop' as const, gain: -7, pan: (i - 1) * 0.4 })),
  { t: G.techniques + 0.2, type: 'tick', gain: -6, note: 'injection' },
  ...[G.separate, G.identify, G.analyse].map((t, i) => ({ t, type: 'pop' as const, gain: -8, pan: (i - 1) * 0.4 })),
  { t: G.capabilities, type: 'chime', gain: -10 },
  ...treeCues(TREE_CMS),
  // 8–9 · X-ray
  { t: X.second, type: 'whoosh', gain: -9, note: 'domain switch' },
  { t: X.start, type: 'pop', gain: -5 },
  { t: X.here, type: 'whoosh', gain: -10, note: 'filmstrip' },
  ...[X.sem, X.saxs, X.xps, X.xrd, X.xrf].map((t) => ({ t: t - 0.35, type: 'whooshIn' as const, gain: -12 })),
  { t: X.small, type: 'swell', gain: -12, note: 'zoom to nm' },
  { t: X.chemical, type: 'tick', gain: -6, note: 'peak splits' },
  ...X.props.map((t, i) => ({ t, type: 'pop' as const, gain: -8, pan: 0.3 - i * 0.05 })),
  ...treeCues(TREE_XRAY),
  // 10–11 · NMR
  { t: N.third, type: 'whoosh', gain: -9, note: 'domain switch' },
  { t: N.start, type: 'pop', gain: -5 },
  { t: N.first, type: 'pop', gain: -8, pan: -0.3 },
  { t: N.second, type: 'pop', gain: -8, pan: 0.3 },
  ...[N.ident, N.struct, N.quant, N.thermal, N.physical, N.other].map((t, i) => ({ t, type: 'tick' as const, gain: -9, pan: i < 3 ? -0.3 : 0.3 })),
  { t: N.complementary, type: 'chime', gain: -10 },
  ...[N.research, N.product, N.problem].map((t, i) => ({ t, type: 'pop' as const, gain: -8, pan: (i - 1) * 0.35 })),
  ...treeCues(TREE_NMR),
  // 12 · Summary + end
  { t: Z.summarize, type: 'swell', gain: -11 },
  { t: Z.range, type: 'whoosh', gain: -10, note: 'capability cascade' },
  ...[0, 1, 2, 3].map((k) => ({ t: Z.samples - 0.3 + k * 0.18, type: 'tick' as const, gain: -10 })),
  { t: Z.team - 0.25, type: 'whoosh', gain: -10 },
  { t: Z.withYou, type: 'pop', gain: -6, pan: 0.4 },
  { t: Z.approach + 0.3, type: 'chime', gain: -7, note: 'best-fit approach' },
  { t: END_CARD_T, type: 'chime', gain: -2, note: 'end card' },
  { t: END_CARD_T, type: 'thump', gain: -5 },
];

/** Row headers get a soft tap when narrated; chips a quieter tick. */
function treeCues(tree: CapabilityTree): Sfx[] {
  const out: Sfx[] = [{ t: tree.cfg.rootT, type: 'whoosh', gain: -11, note: 'capability tree' }];
  tree.cfg.rows.forEach((r) => {
    out.push({ t: r.t - 0.2, type: 'pop', gain: -7, pan: -0.3 });
    r.chips.forEach((c, k) => out.push({ t: c.t - 0.08, type: 'tick', gain: -12, pan: -0.1 + (k % 3) * 0.2 }));
  });
  return out;
}
