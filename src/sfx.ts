// Sound design cue sheet. Restraint: one sound per focal moment, never under a
// dense stretch of speech, levels set in tools/audio.py (18–26 dB under voice).
// Types: drop · pop · tick · whoosh · whooshIn · chime · swell · thump
import { S1_TIMES as A } from './scenes/s1_title';
import { S2_TIMES as B } from './scenes/s2_org';
import { S3_TIMES as Cc } from './scenes/s3_domains';
import { S4_TIMES as D, HUB } from './scenes/s4_team';
import { S5_TIMES as E } from './scenes/s5_resources';

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
  { t: Cc.services - 0.5, type: 'whoosh', gain: -4, note: 'dive' },
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
  { t: D.focus[2]! + 0.75, type: 'whoosh', gain: -8, note: 'Ong Li Li card flies' },
  { t: D.focus[2]! + 1.9, type: 'pop', gain: -4, pan: 0.3 },
  { t: D.fold + 0.9, type: 'whooshIn', gain: -5 },
  // 4b · Resources
  { t: HUB.t - 0.1, type: 'pop', gain: -3 },
  { t: E.institute - 0.3, type: 'swell', gain: -10 },
  ...E.nodes.map((t, i) => ({ t: t - 0.05, type: 'pop' as const, gain: -6, pan: [-0.4, 0, 0.4, 0.4, 0, -0.4][i] })),
  ...E.outcomes.map((t) => ({ t: t + 0.02, type: 'tick' as const, gain: -3, pan: 0.3 })),
  { t: E.evolving, type: 'swell', gain: -7, note: 'pulses to every lab' },
  { t: E.end + 0.3, type: 'chime', gain: -1, note: 'end card' },
  { t: E.end + 0.3, type: 'thump', gain: -4 },
];
