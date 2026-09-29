import { loadImage, registerFonts, type Img as Image, type Ctx } from './canvas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type { Ctx };
export const W = 1920, H = 1080;
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const FONTS: [string, string][] = [
  ['space-grotesk/400Regular/SpaceGrotesk_400Regular.ttf', 'Display'],
  ['space-grotesk/500Medium/SpaceGrotesk_500Medium.ttf', 'Display'],
  ['space-grotesk/600SemiBold/SpaceGrotesk_600SemiBold.ttf', 'Display'],
  ['space-grotesk/700Bold/SpaceGrotesk_700Bold.ttf', 'Display'],
  ['inter/400Regular/Inter_400Regular.ttf', 'Body'],
  ['inter/500Medium/Inter_500Medium.ttf', 'Body'],
  ['inter/600SemiBold/Inter_600SemiBold.ttf', 'Body'],
  ['inter/700Bold/Inter_700Bold.ttf', 'Body'],
  ['jetbrains-mono/400Regular/JetBrainsMono_400Regular.ttf', 'Mono'],
  ['jetbrains-mono/500Medium/JetBrainsMono_500Medium.ttf', 'Mono'],
  ['jetbrains-mono/700Bold/JetBrainsMono_700Bold.ttf', 'Mono'],
];

export const FACES = ['andrew_lim', 'ong_li_li', 'ong_wai_chung', 'ng_fu_song', 'tan_kuan_yi', 'angeline_seo',
  'wang_zhan', 'chia_sze_chen', 'cao_xun', 'yeo_wen_cong', 'kuan_kai_cong'] as const;
export type FaceId = (typeof FACES)[number];

export const PHOTOS = ['corridor', 'cms_ms', 'cms_lc', 'cms_gc', 'xray_sem', 'xray_tem', 'xray_xps', 'xray_saxs', 'xray_xrd', 'nmr_nmr', 'nmr_lab', 'nmr_lab2'] as const;
export type PhotoId = (typeof PHOTOS)[number];

export const img: { faces: Record<string, Image>; logo: Image; photos: Record<string, { color: Image; gray: Image }> } = { faces: {}, logo: null as unknown as Image, photos: {} };

let loaded = false;
export async function loadAssets() {
  if (loaded) return;
  registerFonts(FONTS.map(([f, fam]) => [path.join(ROOT, 'node_modules/@expo-google-fonts', f), fam]));
  for (const id of FACES) img.faces[id] = await loadImage(path.join(ROOT, 'assets/img/faces', `${id}.png`));
  img.logo = await loadImage(path.join(ROOT, 'assets/img/isce2_logo_white.png'));
  for (const id of PHOTOS) img.photos[id] = { color: await loadImage(path.join(ROOT, 'assets/img/labs', `${id}.jpg`)), gray: await loadImage(path.join(ROOT, 'assets/img/labs', `${id}_g.jpg`)) };
  loaded = true;
}
