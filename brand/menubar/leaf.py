#!/usr/bin/env python3
"""The menu bar glyph: the app icon's leaf in one ink, as a template image.

    uv run --with pillow python3 brand/menubar/leaf.py

Writes Pane/Resources/Assets.xcassets/MenuBarIcon.imageset/menubar.png (18 px) and menubar@2x.png
(36 px): the leaf's outline filled, with its midrib cut out. The six lines of the icon are left
out: at 18 pt they close up. Bitmaps rather than an SVG, so the cut-out is the same on every macOS.

OUTLINE and RIB are traced from brand/leaf/leaf.png (1024 px, as drawn): the silhouette's edge to
within 2 px, and the middle of the midrib every 30 px.
"""
import os

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
DEST = os.path.normpath(os.path.join(HERE, "..", "..", "Pane", "Resources", "Assets.xcassets", "MenuBarIcon.imageset"))
OUTLINE = [tuple(map(int, p.split(","))) for p in """
780,139 790,140 800,148 809,181 824,294 825,393 816,468 802,526 784,574 756,625
727,663 690,699 660,721 618,744 576,760 525,771 457,773 411,770 400,775 387,788
365,829 356,840 338,848 317,844 306,831 305,819 337,760 338,745 300,713 264,671
242,625 231,574 231,528 239,485 255,441 278,399 310,357 341,326 375,299 422,270
473,246 529,226 699,181 735,165 767,144 780,139
""".split()]
RIB = [(669, 280), (634, 310), (601, 340), (572, 370), (547, 400), (524, 430), (505, 460), (487, 490), (471, 520),
       (457, 550), (443, 580), (431, 610), (420, 640), (409, 670), (400, 700), (387, 730), (371, 760)]
X0, Y0, X1, Y1 = 230, 139, 826, 848  # the leaf's box in leaf.png
POINTS = 18      # the image's size in the menu bar
TALL = 15.5      # the leaf's height in it
RIB_WIDTH = 1.15


def glyph(px):
    ss = 16  # drawn large, then scaled down
    n = px * ss
    k = TALL / (Y1 - Y0) * (px / POINTS) * ss
    ox = (n - (X1 - X0) * k) / 2 - X0 * k
    oy = (n - (Y1 - Y0) * k) / 2 - Y0 * k
    place = lambda p: (p[0] * k + ox, p[1] * k + oy)
    alpha = Image.new("L", (n, n), 0)
    d = ImageDraw.Draw(alpha)
    d.polygon([place(p) for p in OUTLINE], fill=255)
    rib = [place(p) for p in RIB]
    w = RIB_WIDTH * px / POINTS * ss
    d.line(rib, fill=0, width=round(w), joint="curve")
    for x, y in (rib[0], rib[-1]):
        d.ellipse((x - w / 2, y - w / 2, x + w / 2, y + w / 2), fill=0)
    out = Image.new("RGBA", (px, px), (0, 0, 0, 0))
    out.putalpha(alpha.resize((px, px), Image.LANCZOS))
    return out


if __name__ == "__main__":
    glyph(18).save(os.path.join(DEST, "menubar.png"), optimize=True)
    glyph(36).save(os.path.join(DEST, "menubar@2x.png"), optimize=True)
