import { GlobalFonts, loadImage, type Image, type SKRSContext2D } from '@napi-rs/canvas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type Ctx = SKRSContext2D;
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

export const img: { faces: Record<string, Image>; logo: Image } = { faces: {}, logo: null as unknown as Image };

let loaded = false;
export async function loadAssets() {
  if (loaded) return;
  for (const [f, fam] of FONTS) GlobalFonts.registerFromPath(path.join(ROOT, 'node_modules/@expo-google-fonts', f), fam);
  for (const id of FACES) img.faces[id] = await loadImage(path.join(ROOT, 'assets/img/faces', `${id}.png`));
  img.logo = await loadImage(path.join(ROOT, 'assets/img/isce2_logo_white.png'));
  loaded = true;
}
