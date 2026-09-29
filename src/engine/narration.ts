// Word-level narration timings (data/narration.json, built by tools/align.py)
// placed on the master timeline. Scenes key every reveal off spoken words:
//   cue(4, 'Andrew Lim')      -> { t: onset of "Andrew", end: end of "Lim" }
//   cue(3, 'and', 2)          -> the third "and" in clip 3
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './assets';

export type Word = { w: string; start: number; end: number };
type Clip = { duration: number; text: string; words: Word[]; speech: [number, number][] };
const data: Record<string, Clip> = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/narration.json'), 'utf8'));

/** Where each slide's narration starts on the master timeline (s). */
export const OFFSET: Record<number, number> = {
  1: 2.6, 2: 10.0, 3: 37.8, 4: 90.6,
  5: 182.8, 6: 233.0, 7: 269.8, 8: 355.9, 9: 417.8, 10: 474.3, 11: 527.0, 12: 597.7,
};
export const DURATION = 630.0;
/** Visuals lead the voice slightly so eye and ear land together. */
export const LEAD = 0.08;

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9²&-]/g, '');

export function clip(n: number) {
  const c = data[String(n)];
  if (!c) throw new Error(`no narration clip ${n}`);
  return { ...c, offset: OFFSET[n]!, end: OFFSET[n]! + c.duration };
}

export function cue(n: number, phrase: string, nth = 0): { t: number; end: number } {
  const c = clip(n);
  const toks = phrase.split(/\s+/).map(norm).filter(Boolean);
  let seen = 0;
  for (let i = 0; i + toks.length <= c.words.length; i++) {
    if (toks.every((tk, k) => norm(c.words[i + k]!.w) === tk)) {
      if (seen++ === nth) return { t: c.offset + c.words[i]!.start - LEAD, end: c.offset + c.words[i + toks.length - 1]!.end };
    }
  }
  throw new Error(`cue not found: clip ${n} "${phrase}" #${nth}`);
}

/** All words of every clip on the global timeline (for captions / debugging). */
export function allWords() {
  const out: (Word & { clip: number })[] = [];
  for (const n of Object.keys(OFFSET).map(Number)) {
    const c = clip(n);
    for (const w of c.words) out.push({ w: w.w, start: w.start + c.offset, end: w.end + c.offset, clip: n });
  }
  return out;
}
