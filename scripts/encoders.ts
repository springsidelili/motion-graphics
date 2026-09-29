// Video encoders. `auto` picks the first hardware encoder that really works on
// this machine — each candidate is test-encoded, because ffmpeg lists encoders
// its build supports even when the GPU/driver behind them is missing.
import { spawnSync } from 'node:child_process';

export const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';
export type Encoder = { name: string; label: string; args: string[] };

// RGBA frames → BT.709 limited-range YUV, tagged so players and YouTube decode colours correctly
const vf = (pix: string) => ['-vf', `scale=out_color_matrix=bt709:out_range=tv,format=${pix}`];
const TAGS = ['-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709'];

// q ≈ x264 CRF (18 = visually lossless for this material); hardware settings are matched by eye/bitrate
const CANDIDATES: Record<string, (fps: number, q: number) => Encoder> = {
  nvenc: (fps, q) => ({ name: 'h264_nvenc', label: 'NVIDIA NVENC (h264_nvenc)', args: [...vf('yuv420p'), '-c:v', 'h264_nvenc', '-preset', 'p5', '-tune', 'hq', '-rc', 'vbr', '-cq', String(q + 1), '-b:v', '0', '-maxrate', '40M', '-bufsize', '80M', '-spatial-aq', '1', '-profile:v', 'high', '-g', String(fps * 2), ...TAGS] }),
  videotoolbox: (fps) => ({ name: 'h264_videotoolbox', label: 'Apple VideoToolbox (h264_videotoolbox)', args: [...vf('nv12'), '-c:v', 'h264_videotoolbox', '-b:v', '18M', '-maxrate', '30M', '-bufsize', '60M', '-profile:v', 'high', '-g', String(fps * 2), ...TAGS] }),
  qsv: (fps, q) => ({ name: 'h264_qsv', label: 'Intel Quick Sync (h264_qsv)', args: [...vf('nv12'), '-c:v', 'h264_qsv', '-global_quality', String(q + 2), '-preset', 'slow', '-profile:v', 'high', '-g', String(fps * 2), ...TAGS] }),
  amf: (fps, q) => ({ name: 'h264_amf', label: 'AMD AMF (h264_amf)', args: [...vf('nv12'), '-c:v', 'h264_amf', '-quality', 'quality', '-rc', 'cqp', '-qp_i', String(q), '-qp_p', String(q + 2), '-qp_b', String(q + 4), '-profile:v', 'high', '-g', String(fps * 2), ...TAGS] }),
  x264: (fps, q) => ({ name: 'libx264', label: 'x264 on the CPU (libx264)', args: [...vf('yuv420p'), '-c:v', 'libx264', '-preset', 'medium', '-crf', String(q), '-tune', 'animation', '-threads', '2', '-g', String(fps * 2), ...TAGS] }),
};
const AUTO_ORDER = process.platform === 'darwin' ? ['videotoolbox', 'x264'] : ['nvenc', 'qsv', 'amf', 'x264'];

/** Can this encoder actually encode a 1080p frame on this machine? */
let built: string | undefined;
export function probe(e: Encoder): { ok: boolean; err: string } {
  built ??= spawnSync(FFMPEG, ['-hide_banner', '-encoders'], { encoding: 'utf8' }).stdout ?? '';
  if (!new RegExp(`\\s${e.name}\\s`).test(built)) return { ok: false, err: 'not included in this ffmpeg build' };
  const r = spawnSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=0x123456:s=1920x1080:r=60:d=0.2,format=rgba', ...e.args, '-f', 'null', '-'], { encoding: 'utf8', timeout: 30000 });
  if (r.error) return { ok: false, err: r.error.message };
  // ffmpeg's first complaint is the informative one ("Cannot load libcuda.so.1", "Unknown encoder …")
  const first = (r.stderr ?? '').split('\n').map((l) => l.replace(/^\[[^\]]*\]\s*/, '').trim()).find(Boolean) ?? '';
  return { ok: r.status === 0, err: first };
}

export function pickEncoder(pref: string, fps: number, quality: number): Encoder {
  const names = pref === 'auto' ? AUTO_ORDER : [pref.replace(/^h264_|^lib/, '')];
  for (const n of names) {
    const make = CANDIDATES[n];
    if (!make) throw new Error(`unknown encoder "${pref}" (choose: auto, ${Object.keys(CANDIDATES).join(', ')})`);
    const e = make(fps, quality);
    if (n === 'x264' || probe(e).ok) return e;
    if (pref !== 'auto') throw new Error(`${e.label} is not usable on this machine: ${probe(e).err}`);
  }
  return CANDIDATES.x264!(fps, quality);
}

export function probeAll(fps = 60, quality = 18) {
  return Object.entries(CANDIDATES).map(([n, make]) => { const e = make(fps, quality); return { key: n, label: e.label, ...probe(e) }; });
}
