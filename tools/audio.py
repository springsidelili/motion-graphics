"""Audio for the video: narration mastering, procedural SFX, a quiet pad bed, mix.

  python3 tools/audio.py            (after `npx tsx scripts/cues.ts`)
  python3 tools/audio.py --no-pad   (SFX + voice only)

Reads out/audio/cues.json (narration offsets + SFX cue sheet, generated from the
same timeline as the picture) and writes out/audio/{voice,sfx,pad,mix}.wav.
Every sound is synthesised here, so there are no licensing questions.
"""
import json, os, subprocess, sys
import numpy as np
import soundfile as sf
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out', 'audio')
SR = 48000
rng = np.random.default_rng(7)

def t_(dur): return np.arange(int(dur * SR)) / SR
def norm(x, peak=1.0): m = np.max(np.abs(x)) or 1; return x / m * peak
def stereo(m, pan=0.0):
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    return np.stack([m * l * 1.414, m * r * 1.414], 1)
def fade(x, a=0.002, b=0.02):
    n = len(x); ea = np.minimum(1, np.arange(n) / max(1, a * SR)); eb = np.minimum(1, (n - np.arange(n)) / max(1, b * SR))
    return x * ea * eb
def sweep_sine(f0, f1, dur, curve=0.05):
    t = t_(dur); f = f1 + (f0 - f1) * np.exp(-t / curve)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)

# ---------------------------------------------------------------- one-shots
def lp(x, fc, order=4):
    return signal.sosfilt(signal.butter(order, fc, 'lp', fs=SR, output='sos'), x, axis=0)

# Everything here is deliberately dark and non-tonal where it repeats: the UI
# "pops" are muffled taps (filtered noise + a low body), not pitched bleeps.
def drop():
    """Round water 'bloop' for the pipette drop: low sweep, no click, low-passed."""
    t = t_(0.45)
    body = sweep_sine(260, 560, 0.45, 0.04) * np.exp(-t / 0.07)
    res = np.sin(2 * np.pi * 330 * t) * np.exp(-t / 0.12) * 0.3 * np.clip((t - 0.02) / 0.015, 0, 1)
    return stereo(fade(norm(lp(body + res, 2800)), 0.004, 0.08))

def tap(dur=0.16, band=(140, 900), decay=0.02, body_hz=120, body=0.55):
    """Soft, felt-more-than-heard tap: band-limited noise transient + a low thump."""
    t = t_(dur)
    nz = signal.sosfilt(signal.butter(2, list(band), 'bp', fs=SR, output='sos'), rng.standard_normal(len(t))) * np.exp(-t / decay)
    th = np.sin(2 * np.pi * body_hz * t) * np.exp(-t / 0.045) * body
    return stereo(fade(norm(lp(norm(nz) + th, 2200)), 0.002, 0.04))

def pop():
    return tap()

def tick():
    return tap(0.1, (250, 1600), 0.01, 170, 0.3)

def whoosh(dur=0.75, reverse=False):
    n = int(dur * SR); x = rng.standard_normal(n)
    out = np.zeros(n); blk = 1024; zi = None
    for i in range(0, n, blk):
        u = i / n; fc = 200 * (7 ** u)  # 200 Hz → 1.4 kHz: air, not hiss
        sos = signal.butter(2, [fc * 0.6, fc * 1.5], 'bp', fs=SR, output='sos')
        if zi is None: zi = signal.sosfilt_zi(sos) * 0
        out[i:i + blk], zi = signal.sosfilt(sos, x[i:i + blk], zi=zi)
    u = np.linspace(0, 1, n); env = np.sin(np.pi * np.clip(u / 0.62, 0, 1) ** 1.2 * 0.5) ** 2 * np.clip((1 - u) / 0.38, 0, 1) ** 1.5
    m = norm(lp(out * env, 3500))
    if reverse: m = m[::-1]
    pan = np.linspace(-0.4, 0.4, n) * (-1 if reverse else 1)
    return np.stack([m * np.cos((pan + 1) * np.pi / 4), m * np.sin((pan + 1) * np.pi / 4)], 1) * 1.3

def chime():
    """Warm, low mallet (marimba-like: fundamental + soft 4th partial), no glassy highs."""
    t = t_(2.2)
    def mallet(f, amp, delay):
        td = np.clip(t - delay, 0, None); on = (t >= delay)
        s = np.sin(2 * np.pi * f * td) * np.exp(-td / 0.9) + 0.18 * np.sin(2 * np.pi * f * 3.9 * td) * np.exp(-td / 0.12)
        return s * on * amp * np.clip(td / 0.006, 0, 1)
    L = mallet(392.0, 1, 0) + mallet(587.3, 0.45, 0.09)
    R = mallet(392.4, 1, 0.003) + mallet(587.9, 0.45, 0.093)
    return np.stack([norm(lp(L, 2500)), norm(lp(R, 2500))], 1) * 0.9

def swell(dur=1.8):
    t = t_(dur); n = len(t)
    nz = signal.sosfilt(signal.butter(2, 700, 'lp', fs=SR, output='sos'), rng.standard_normal(n))
    tone = np.sin(2 * np.pi * 110 * t) * 0.5 + np.sin(2 * np.pi * 164.8 * t) * 0.3 + np.sin(2 * np.pi * 220.4 * t) * 0.2
    u = t / dur; env = (u ** 2) * np.clip((1 - u) / 0.25, 0, 1)
    return stereo(fade(norm((norm(nz) * 0.6 + tone * 0.6) * env), 0.01, 0.1))

def thump():
    t = t_(0.9)
    s = sweep_sine(48, 90, 0.9, 0.06) * np.exp(-t / 0.28)
    return stereo(fade(norm(s), 0.002, 0.1))

SYN = {'drop': drop, 'pop': pop, 'tick': tick, 'whoosh': whoosh, 'whooshIn': lambda: whoosh(0.7, True), 'chime': chime, 'swell': swell, 'thump': thump}
# base level of each sound (dBFS peak) before the per-cue gain: 16–26 dB under the voice peaks
BASE = {'drop': -16, 'pop': -20, 'tick': -23, 'whoosh': -22, 'whooshIn': -22, 'chime': -21, 'swell': -23, 'thump': -17}

# ---------------------------------------------------------------- pad bed
def pad(dur):
    """Slow, warm major-ninth pad (sines + soft 2nd/3rd harmonics), 9 s per chord."""
    midi = lambda m: 440 * 2 ** ((m - 69) / 12)
    chords = [[48, 55, 59, 62, 64], [45, 52, 55, 59, 60], [41, 48, 52, 55, 57], [43, 50, 55, 57, 59]]  # Cmaj9 Am9 Fmaj9 G6/9
    n = int(dur * SR); t = np.arange(n) / SR
    L = np.zeros(n); R = np.zeros(n)
    step = 9.0
    for ci, start in enumerate(np.arange(-2, dur, step)):
        notes = chords[ci % len(chords)]
        a, b = max(0, start), min(dur, start + step + 4)
        i0, i1 = int(a * SR), int(b * SR)
        tt = t[i0:i1] - start
        env = np.clip(tt / 3.0, 0, 1) ** 1.5 * np.clip((step + 4 - tt) / 4.0, 0, 1) ** 1.5
        for k, m in enumerate(notes):
            f = midi(m)
            for side, det in ((L, -2.5), (R, 2.5)):
                ff = f * 2 ** (det / 1200)
                v = np.sin(2 * np.pi * ff * tt) + 0.18 * np.sin(2 * np.pi * 2 * ff * tt) + 0.06 * np.sin(2 * np.pi * 3 * ff * tt)
                side[i0:i1] += v * env * (0.9 if k else 1.1) * (1 + 0.15 * np.sin(2 * np.pi * 0.07 * tt + k))
    sos = signal.butter(2, 1600, 'lp', fs=SR, output='sos')
    L = signal.sosfilt(sos, L); R = signal.sosfilt(sos, R)
    return np.stack([L, R], 1)

def envelope(x, win=0.25):
    m = np.abs(x).mean(1) if x.ndim == 2 else np.abs(x)
    k = int(win * SR); ker = np.ones(k) / k
    return np.convolve(m, ker, 'same')

def ff(args):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *args], check=True)

def main():
    cues = json.load(open(os.path.join(OUT, 'cues.json')))
    dur = cues['duration']; N = int(dur * SR)
    # --- narration: gentle cleanup + presence, on the master timeline
    voice = np.zeros((N, 2))
    chain = ('highpass=f=75,equalizer=f=230:t=q:w=1.2:g=-1.5,equalizer=f=3300:t=q:w=1.3:g=2.2,highshelf=f=9000:g=1.2,'
             'acompressor=threshold=-24dB:ratio=2.2:attack=8:release=120:makeup=1.5,deesser=i=0.25,aresample=48000')
    for c in cues['narration']:
        tmp = os.path.join(OUT, os.path.basename(c['file']).replace('.mp3', '.proc.wav'))
        ff(['-i', os.path.join(ROOT, c['file']), '-af', chain, '-ac', '1', tmp])
        v, sr = sf.read(tmp); assert sr == SR
        i0 = int(c['offset'] * SR); v = v[:N - i0]
        voice[i0:i0 + len(v)] += stereo(v, 0) / 1.414
    voice = norm(voice, 10 ** (-3 / 20))
    # --- SFX
    fx = np.zeros((N, 2)); cache = {}
    for c in cues['sfx']:
        s = cache.setdefault(c['type'], SYN[c['type']]())
        g = 10 ** ((BASE[c['type']] + c.get('gain', 0)) / 20)
        pan = c.get('pan', 0)
        if pan: s = s * np.array([np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)]) * 1.414
        i0 = max(0, int(c['t'] * SR)); n = min(len(s), N - i0)
        fx[i0:i0 + n] += s[:n] * g
    fx = lp(fx, 6000)  # SFX bus low-pass: nothing bright competes with the voice or the pad
    # --- pad, ducked under the voice (sidechain from the voice envelope)
    use_pad = '--no-pad' not in sys.argv
    bed = np.zeros((N, 2))
    if use_pad:
        bed = pad(dur)
        bed = bed / (np.sqrt(np.mean(bed ** 2)) or 1) * 10 ** (-37 / 20)
        e = envelope(voice, 0.35); e = e / (e.max() or 1)
        duck = 10 ** (-7 * np.clip(e * 6, 0, 1) / 20)
        u = np.arange(N) / SR; fades = np.clip(u / 2.5, 0, 1) * np.clip((dur - u) / 3.0, 0, 1)
        bed *= (duck * fades)[:, None]
    for name, x in (('voice', voice), ('sfx', fx), ('pad', bed)):
        sf.write(os.path.join(OUT, f'{name}.wav'), x.astype(np.float32), SR, subtype='FLOAT')
    mix = voice + fx + bed
    sf.write(os.path.join(OUT, 'mix_raw.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
    # --- master: two-pass loudnorm to -15 LUFS / -1.5 dBTP (YouTube plays at -14)
    raw = os.path.join(OUT, 'mix_raw.wav')
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', raw, '-af', 'loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = json.loads(r[r.rindex('{'):r.rindex('}') + 1])
    ln = f"loudnorm=I=-15:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
    ff(['-i', raw, '-af', ln + ',aresample=48000', '-c:a', 'pcm_s24le', os.path.join(OUT, 'mix.wav')])
    print('mix: in', m['input_i'], 'LUFS →', 'out/audio/mix.wav')

if __name__ == '__main__':
    main()
