"""Build data/narration.json from the raw ASR word timings.

1. Canonical spellings: the ASR hears names phonetically ("Aung Wei Chung");
   the slide text is the source of truth, so words are rewritten per clip.
2. Onset snapping: TDT timestamps run ~0.1-0.3 s early after pauses. Each
   voiced region's onset (energy gate on the 16 kHz wav) replaces the start
   of the word nearest to it, so visuals can key off true speech onsets.
"""
import json, numpy as np, soundfile as sf, re, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
raw = json.load(open(os.path.join(ROOT, 'data/asr_raw.json')))
WAV = sys.argv[1] if len(sys.argv) > 1 else 'wav'  # dir with m{i}.wav (16 kHz mono)

# (clip, [asr words...], [canonical words...]) - replaced left to right, first match
FIX = {
 '2': [(['a', 'CI'], ['ACI']), (['a', 'CI'], ['ACI']), (['A', 'CI'], ['ACI']), (['ISCE2'], ['ISCE²'])],
 '3': [(['cheracterization,'], ['characterisation,']), (['cheracterization.'], ['characterisation.']),
       (['characterization'], ['characterisation']), (['ERD'], ['R&D']), (['organized'], ['organised'])],
 '4': [(['CI'], ['ACI']), (['Aung', 'Li', 'Li'], ['Ong', 'Li', 'Li']), (['Aung', 'Wei', 'Chung,'], ['Ong', 'Wai', 'Chung,']),
       (['Eng', 'Fu', 'Song'], ['Ng', 'Fu', 'Song']), (['Kwan', 'Yi.'], ['Kuan', 'Yi.']), (['Angel', 'Lin,'], ['Angeline', 'Seo,']),
       (['Wanzan,'], ['Wang', 'Zhan,']), (['Shichen,'], ['Sze', 'Chen,']), (['Chao', 'Shin,'], ['Cao', 'Xun,']),
       (['Aung', 'Li', 'Li'], ['Ong', 'Li', 'Li']), (['Cheracterization,'], ['Characterisation,']),
       (['Yo', 'Wenchang'], ['Yeo', 'Wen', 'Cong']), (['Kwan', 'Kaichong.'], ['Kuan', 'Kai', 'Cong.']), (['AC'], ['ACI']),
       (['characterization'], ['characterisation']), (['utilization'], ['utilisation']), (['lefesical'], ['lifecycle']),
       (['digitalization'], ['digitalisation']), (['optimized,'], ['optimised,'])],
 '5': [(['1-1.'], ['1-01.']), (['1-2,'], ['1-02,']), (['1-3'], ['1-03']), (['1-6,'], ['1-06,']), (['1-4'], ['1-04']),
       (['1-5.'], ['1-05.']), (['1-7'], ['1-07']), (['1-8'], ['1-08']), (['RD'], ['R&D'])],
 '7': [(['GC', 'by', 'GC,'], ['GC×GC,']), (['GCMS'], ['GC-MS']), (['LCQ-TOF-MS'], ['LC-QTOF-MS']), (['LC-MSMS'], ['LC-MS/MS']),
       (['QX', 'active', 'orbit', 'trap,'], ['Q', 'Exactive', 'Orbitrap,']), (['nintargeted'], ['non-targeted']),
       (['ICPMS'], ['ICP-MS']), (['ICPOES,'], ['ICP-OES,'])],
 '8': [(['Angel', 'Lin.'], ['Angeline', 'Seo.']), (['SACS'], ['SAXS']), (['WACS4'], ['WAXS', 'for']), (['Reaction', 'Chamber', '4'], ['reaction', 'chamber', 'for'])],
 '9': [(['SACS'], ['SAXS']), (['WACS.'], ['WAXS.']), (['EALS.'], ['EELS.']), (['Raymond'], ['Raman'])],
 '11': [(['eye', 'probe'], ['iProbe']), (['DSCTG'], ['DSC-TGA'])],
 '12': [(['a', 'CI'], ['ACI'])],
}
# British -isation for the technique names (the division's official name, clip 1, keeps its z)
ISE = re.compile(r'^([Cc])h[ae]ract[eo]rization')

def apply_fix(words, fixes):
    for src, dst in fixes:
        for i in range(len(words) - len(src) + 1):
            if [w['w'] for w in words[i:i + len(src)]] == src:
                seg = words[i:i + len(src)]
                t0, t1 = seg[0]['start'], seg[-1]['end']
                n = len(dst)
                new = [{'w': d, 'start': round(t0 + (t1 - t0) * k / n, 3), 'end': round(t0 + (t1 - t0) * (k + 1) / n, 3)} for k, d in enumerate(dst)]
                if n == len(src):  # keep the per-word ASR times when counts match
                    new = [{'w': d, 'start': s['start'], 'end': s['end']} for d, s in zip(dst, seg)]
                words[i:i + len(src)] = new
                break
        else:
            print('  fix not applied:', src, file=sys.stderr)
    return words

def regions(path, thr_db=-42.0, hop=0.01, min_gap=0.09):
    a, sr = sf.read(path, dtype='float32')
    h = int(sr * hop)
    n = len(a) // h
    e = np.array([np.sqrt(np.mean(a[i * h:(i + 1) * h] ** 2) + 1e-12) for i in range(n)])
    db = 20 * np.log10(e)
    on = db > thr_db
    regs, i = [], 0
    while i < n:
        if on[i]:
            j = i
            while j < n and on[j]: j += 1
            regs.append([i * hop, j * hop]); i = j
        else: i += 1
    merged = []
    for r in regs:
        if merged and r[0] - merged[-1][1] < min_gap: merged[-1][1] = r[1]
        else: merged.append(r)
    return merged, len(a) / sr

out = {}
for clip, d in raw.items():
    words = [dict(w) for w in d['words']]
    words = apply_fix(words, FIX.get(clip, []))
    if clip != '1':
        for w in words: w['w'] = ISE.sub(lambda m: m.group(1) + 'haracterisation', w['w'])
    regs, dur = regions(os.path.join(WAV, f'm{clip}.wav'))
    snapped = 0
    for r0, r1 in regs:
        best = None
        for k, w in enumerate(words):
            dt = r0 - w['start']
            if -0.15 <= dt <= 0.45 and (best is None or abs(dt) < abs(r0 - words[best]['start'])): best = k
        if best is not None:
            words[best]['start'] = round(r0, 3); snapped += 1
    for k, w in enumerate(words):  # end = next start (or voiced-region end), never before start
        nxt = words[k + 1]['start'] if k + 1 < len(words) else dur
        reg_end = next((r1 for r0, r1 in regs if r0 <= w['start'] + 0.02 < r1 + 0.02), nxt)
        w['end'] = round(max(w['start'] + 0.05, min(nxt, reg_end)), 3)
    text = ' '.join(w['w'] for w in words)
    out[clip] = {'duration': round(dur, 3), 'text': text, 'words': words, 'speech': [[round(a, 2), round(b, 2)] for a, b in regs]}
    print(f'clip {clip}: {len(words)} words, {len(regs)} voiced regions, {snapped} onsets snapped\n  {text}\n')
json.dump(out, open(os.path.join(ROOT, 'data/narration.json'), 'w'), indent=1, ensure_ascii=False)
