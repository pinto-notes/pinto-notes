#!/usr/bin/env python3
# The home page study's desk (web/public/home-d/desk.webp): the paper-cut desk from the email art
# (amber-emails-art/out/share-a.png) with its orange table and floor turned warm cream, so the headline leads.
# uv run --with pillow --with numpy scripts/recolor-desk.py <share-a.png> <out.png>, then cwebp -q 82.
import sys, numpy as np
from PIL import Image, ImageFilter
src, out = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
# The ground: strongly orange-red (r high, g mid, b low) and saturated.
mx = im.max(-1); mn = im.min(-1); sat = (mx - mn) / np.maximum(mx, 1)
gr = g / np.maximum(r, 1); br = b / np.maximum(r, 1)
hue_ok = (gr > 0.28) & (gr < 0.5) & (br < 0.4) & (r > 125)
mask = (hue_ok & (sat > 0.4)).astype(np.float32)
# Close the mask: the ground's paper grain has lighter flecks the colour test misses.
closed = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(7))
m = np.asarray(closed.filter(ImageFilter.GaussianBlur(1.5))).astype(np.float32) / 255
lum = 0.299 * r + 0.587 * g + 0.114 * b
ref = np.median(lum[mask > 0.5])
shade = np.clip(lum / ref, 0.6, 1.2)[..., None]   # the table edge's shadow and the paper grain
table = np.array([247, 226, 199], np.float32)    # warm cream, a step deeper than the page (#fff4e6)
new = np.clip(table * (0.55 + 0.45 * shade), 0, 255)
res = im * (1 - m[..., None]) + new * m[..., None]
Image.fromarray(res.astype(np.uint8)).save(out)
