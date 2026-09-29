// Exports the audio cue sheet and the caption file from the same timeline the
// video uses:  npx tsx scripts/cues.ts   →  out/audio/cues.json, out/aci_part1.en.srt
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../src/engine/assets';
import { clip, DURATION, allWords } from '../src/engine/narration';
import { SFX } from '../src/sfx';

const out = path.join(ROOT, 'out');
fs.mkdirSync(path.join(out, 'audio'), { recursive: true });
fs.writeFileSync(path.join(out, 'audio/cues.json'), JSON.stringify({
  duration: DURATION,
  narration: [1, 2, 3, 4].map((n) => ({ file: `assets/audio/slide${n}.mp3`, offset: clip(n).offset })),
  sfx: [...SFX].sort((a, b) => a.t - b.t),
}, null, 1));

// captions: sentence-ish chunks of <= 12 words, broken at punctuation
const ws = allWords();
const cues: { a: number; b: number; s: string }[] = [];
let cur: typeof ws = [];
const flush = () => { if (cur.length) cues.push({ a: cur[0]!.start, b: cur[cur.length - 1]!.end, s: cur.map((w) => w.w).join(' ') }); cur = []; };
for (let i = 0; i < ws.length; i++) {
  const w = ws[i]!;
  if (cur.length && w.clip !== cur[0]!.clip) flush();
  cur.push(w);
  const next = ws[i + 1];
  if (/[.,?!]$/.test(w.w) && (cur.length >= 5 || /[.?!]$/.test(w.w))) flush();
  else if (cur.length >= 12 || (next && next.start - w.end > 0.6)) flush();
}
flush();
const ts = (x: number) => { const ms = Math.round(x * 1000); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
fs.writeFileSync(path.join(out, 'aci_part1.en.srt'), cues.map((c, i) => `${i + 1}\n${ts(c.a)} --> ${ts(Math.max(c.b, c.a + 0.8))}\n${c.s}\n`).join('\n'));
console.log(`${SFX.length} sfx cues, ${cues.length} captions`);
