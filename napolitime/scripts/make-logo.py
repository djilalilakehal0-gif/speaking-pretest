"""Crops the round NAPOLITIME logo from the source photo into transparent PNG/WebP files.
Usage: python3 scripts/make-logo.py path/to/logo-source.png"""
import sys
from PIL import Image, ImageDraw

src = Image.open(sys.argv[1]).convert('RGBA')
cx, cy, r = 638, 577, 592  # centre and radius of the badge in the source image
sq = src.crop((cx - r, cy - r, cx + r, cy + r)).resize((1024, 1024), Image.LANCZOS)
S = 4096
mask = Image.new('L', (S, S), 0)
ImageDraw.Draw(mask).ellipse((40, 40, S - 40, S - 40), fill=255)
sq.putalpha(mask.resize((1024, 1024), Image.LANCZOS))
sq.save('assets/source/logo.png')
sq.resize((512, 512), Image.LANCZOS).save('public/img/logo-512.webp', quality=88, method=6)
sq.resize((160, 160), Image.LANCZOS).save('public/img/logo-160.webp', quality=88, method=6)
sq.resize((96, 96), Image.LANCZOS).save('public/favicon.png')
sq.resize((180, 180), Image.LANCZOS).save('public/apple-touch-icon.png')
print('logo files written')
