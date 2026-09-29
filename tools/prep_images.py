"""Prepare deck images for the renderer: square face crops upscaled 4x (Lanczos +
gentle unsharp; the deck's headshots are only ~66x87 px) and a white version of
the ISCE² logo for dark backgrounds."""
from PIL import Image, ImageFilter
import os, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, 'assets/img')
os.makedirs(os.path.join(IMG, 'faces'), exist_ok=True)
for f in sorted(glob.glob(os.path.join(IMG, 'face_*.jpg'))):
    im = Image.open(f).convert('RGB')
    w, h = im.size
    if w > h:  # landscape wide shot (Kuan Kai Cong): tight square on the head and shoulders
        s = int(h * 0.76); x0 = (w - s) // 2; box = (x0, 1, x0 + s, 1 + s)
    else:      # portrait: square from the top, slightly down
        s = w; y0 = int(min(h - s, h * 0.03)); box = (0, y0, s, y0 + s)
    sq = im.crop(box).resize((320, 320), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2.2, percent=55, threshold=2))
    out = os.path.join(IMG, 'faces', os.path.basename(f).replace('face_', '').replace('.jpg', '.png'))
    sq.save(out); print(out, im.size, '->', sq.size)
logo = Image.open(os.path.join(IMG, 'isce2_logo.png')).convert('RGBA')
px = logo.load()
for y in range(logo.size[1]):
    for x in range(logo.size[0]):
        r, g, b, a = px[x, y]
        if a == 0: continue
        red = r > 140 and r > g * 1.8 and r > b * 1.5
        px[x, y] = (255, 70, 80, a) if red else (255, 255, 255, a)
logo.save(os.path.join(IMG, 'isce2_logo_white.png')); print('logo ok', logo.size)
