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

# ---------------------------------------------------------------- lab photos (slides 5, 6, 8, 10)
# Source: the deck's ppt/media folder (unzip the .pptx). Rotations/crops mirror how
# the slides place them (rot=5400000 = 90° clockwise; SEM carries a srcRect crop).
import sys
MEDIA = sys.argv[1] if len(sys.argv) > 1 else None
PHOTOS = {
    'corridor': ('image52.jpeg', 0, None),
    'cms_ms': ('image55.jpeg', 90, None), 'cms_lc': ('image53.jpeg', 0, None), 'cms_gc': ('image54.jpeg', 0, None),
    'xray_sem': ('image57.jpeg', 0, (0.11681, 0.0, 0.10403, 0.08231)), 'xray_tem': ('image58.jpeg', 0, None),
    'xray_xps': ('image59.jpeg', 0, None), 'xray_saxs': ('image60.jpeg', 90, None), 'xray_xrd': ('image56.jpeg', 0, None),
    'nmr_nmr': ('image62.jpeg', 0, None), 'nmr_lab': ('image61.jpeg', 0, None), 'nmr_lab2': ('image63.jpeg', 0, None),
}
if MEDIA:
    os.makedirs(os.path.join(IMG, 'labs'), exist_ok=True)
    from PIL import ImageOps, ImageEnhance
    for key, (f, rot, crop) in PHOTOS.items():
        im = ImageOps.exif_transpose(Image.open(os.path.join(MEDIA, f))).convert('RGB')
        if crop:
            l, t_, r, b = crop; w, h = im.size
            im = im.crop((int(w * l), int(h * t_), int(w * (1 - r)), int(h * (1 - b))))
        if rot: im = im.rotate(-rot, expand=True)
        im.thumbnail((1400, 1400), Image.LANCZOS)
        im.save(os.path.join(IMG, 'labs', f'{key}.jpg'), quality=88)
        g = ImageEnhance.Contrast(ImageOps.grayscale(im)).enhance(1.15).convert('RGB')
        g.save(os.path.join(IMG, 'labs', f'{key}_g.jpg'), quality=85)
        print('photo', key, im.size)
